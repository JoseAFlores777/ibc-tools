'use client';

/**
 * Servicio unificado de IndexedDB para ibc-tools.
 * Reemplaza las bases de datos separadas "ibc-visualizador" e "ibc-empaquetador"
 * con una sola "ibc-tools" database.
 * Incluye migracion automatica, export e import de datos.
 */

export interface IbcToolsExport {
  version: 1;
  tool: 'visualizador' | 'empaquetador' | 'all';
  exportedAt: string;
  data: {
    visualizador?: Record<string, unknown>;
    empaquetador?: unknown[];
  };
}

const DB_NAME = 'ibc-tools';
const DB_VERSION = 1;
const STORE_VISUALIZADOR = 'visualizador';
const STORE_EMPAQUETADOR = 'empaquetador';
const MIGRATION_FLAG = '_migrated';

// ---------------------------------------------------------------------------
// Crypto: AES-256-GCM con clave derivada de secreto de la app
// Solo la app puede leer/escribir archivos .ibctools
// ---------------------------------------------------------------------------

/** Secreto de la aplicacion para derivar la clave de encriptacion */
const APP_SECRET = 'ibc-tools:v1:iglesia-bautista-el-calvario:2026';

/** Header magico para identificar archivos encriptados */
const MAGIC_HEADER = new Uint8Array([0x49, 0x42, 0x43, 0x54]); // "IBCT"

/** Deriva una CryptoKey AES-256-GCM desde el secreto de la app */
async function deriveKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(APP_SECRET),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('ibc-tools-salt-v1'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Encripta JSON a ArrayBuffer: MAGIC(4) + IV(12) + ciphertext */
async function encryptData(data: IbcToolsExport): Promise<ArrayBuffer> {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded,
  );

  // Formato: MAGIC(4 bytes) + IV(12 bytes) + ciphertext
  const result = new Uint8Array(MAGIC_HEADER.length + iv.length + ciphertext.byteLength);
  result.set(MAGIC_HEADER, 0);
  result.set(iv, MAGIC_HEADER.length);
  result.set(new Uint8Array(ciphertext), MAGIC_HEADER.length + iv.length);
  return result.buffer;
}

/** Desencripta ArrayBuffer a IbcToolsExport */
async function decryptData(buffer: ArrayBuffer): Promise<IbcToolsExport> {
  const bytes = new Uint8Array(buffer);

  // Verificar header magico
  for (let i = 0; i < MAGIC_HEADER.length; i++) {
    if (bytes[i] !== MAGIC_HEADER[i]) {
      throw new Error('El archivo no es un archivo .ibctools valido');
    }
  }

  const iv = bytes.slice(MAGIC_HEADER.length, MAGIC_HEADER.length + 12);
  const ciphertext = bytes.slice(MAGIC_HEADER.length + 12);

  const key = await deriveKey();

  let decrypted: ArrayBuffer;
  try {
    decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext,
    );
  } catch {
    throw new Error('No se pudo descifrar el archivo. Puede estar corrupto o ser de otra version.');
  }

  const json = new TextDecoder().decode(decrypted);
  return JSON.parse(json) as IbcToolsExport;
}

let _migrationDone = false;

/** Abre la base de datos unificada "ibc-tools" v1. Ejecuta migracion en primer uso. */
export async function openIbcDB(): Promise<IDBDatabase> {
  const db = await _openRaw();
  if (!_migrationDone) {
    _migrationDone = true;
    await migrateOldDatabases(db);
  }
  return db;
}

function _openRaw(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      // Visualizador: out-of-line keys (settings store)
      if (!db.objectStoreNames.contains(STORE_VISUALIZADOR)) {
        db.createObjectStore(STORE_VISUALIZADOR);
      }
      // Empaquetador: keyPath "id" con indices
      if (!db.objectStoreNames.contains(STORE_EMPAQUETADOR)) {
        const store = db.createObjectStore(STORE_EMPAQUETADOR, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Helper para obtener un objectStore dentro de una transaccion */
export function txStore(db: IDBDatabase, store: string, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(store, mode).objectStore(store);
}

/** Getter generico para out-of-line key stores */
export async function getKey<T>(store: string, key: string): Promise<T | null> {
  try {
    const db = await openIbcDB();
    return new Promise((resolve) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/** Setter generico para out-of-line key stores */
export async function setKey(store: string, key: string, value: unknown): Promise<void> {
  try {
    const db = await openIbcDB();
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value, key);
  } catch {
    // Best-effort
  }
}

// ---------------------------------------------------------------------------
// Migracion de bases de datos antiguas
// ---------------------------------------------------------------------------

/** Verifica si una base de datos existe intentando abrirla */
function _dbExists(name: string): Promise<boolean> {
  return new Promise((resolve) => {
    const req = indexedDB.open(name);
    req.onsuccess = () => {
      const db = req.result;
      const hasStores = db.objectStoreNames.length > 0;
      db.close();
      if (!hasStores) {
        // La DB fue creada vacia por este check — limpiarla
        indexedDB.deleteDatabase(name);
      }
      resolve(hasStores);
    };
    req.onerror = () => resolve(false);
  });
}

/**
 * Migra datos de las bases antiguas "ibc-visualizador" e "ibc-empaquetador"
 * a la nueva base unificada. Solo se ejecuta una vez (usa flag _migrated).
 */
async function migrateOldDatabases(db: IDBDatabase): Promise<void> {
  try {
    // Verificar si ya se migro
    const migrated = await new Promise<boolean>((resolve) => {
      const tx = db.transaction(STORE_VISUALIZADOR, 'readonly');
      const req = tx.objectStore(STORE_VISUALIZADOR).get(MIGRATION_FLAG);
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => resolve(false);
    });
    if (migrated) return;

    // Migrar visualizador
    if (await _dbExists('ibc-visualizador')) {
      await _migrateVisualzador(db);
    }

    // Migrar empaquetador
    if (await _dbExists('ibc-empaquetador')) {
      await _migrateEmpaquetador(db);
    }

    // Marcar como migrado
    const tx = db.transaction(STORE_VISUALIZADOR, 'readwrite');
    tx.objectStore(STORE_VISUALIZADOR).put(true, MIGRATION_FLAG);
  } catch (err) {
    console.error('Error durante migracion de bases de datos:', err);
  }
}

async function _migrateVisualzador(newDb: IDBDatabase): Promise<void> {
  try {
    const oldDb = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('ibc-visualizador');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (oldDb.objectStoreNames.contains('settings')) {
      const allData = await new Promise<Array<{ key: IDBValidKey; value: unknown }>>((resolve, reject) => {
        const tx = oldDb.transaction('settings', 'readonly');
        const store = tx.objectStore('settings');
        const results: Array<{ key: IDBValidKey; value: unknown }> = [];
        const cursorReq = store.openCursor();
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (cursor) {
            results.push({ key: cursor.key, value: cursor.value });
            cursor.continue();
          } else {
            resolve(results);
          }
        };
        cursorReq.onerror = () => reject(cursorReq.error);
      });

      if (allData.length > 0) {
        const tx = newDb.transaction(STORE_VISUALIZADOR, 'readwrite');
        const store = tx.objectStore(STORE_VISUALIZADOR);
        for (const { key, value } of allData) {
          store.put(value, key);
        }
      }
    }

    oldDb.close();
    indexedDB.deleteDatabase('ibc-visualizador');
  } catch (err) {
    console.error('Error migrando ibc-visualizador:', err);
  }
}

async function _migrateEmpaquetador(newDb: IDBDatabase): Promise<void> {
  try {
    const oldDb = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('ibc-empaquetador');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (oldDb.objectStoreNames.contains('packages')) {
      const allData = await new Promise<unknown[]>((resolve, reject) => {
        const tx = oldDb.transaction('packages', 'readonly');
        const req = tx.objectStore('packages').getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      if (allData.length > 0) {
        const tx = newDb.transaction(STORE_EMPAQUETADOR, 'readwrite');
        const store = tx.objectStore(STORE_EMPAQUETADOR);
        for (const item of allData) {
          store.put(item);
        }
      }
    }

    oldDb.close();
    indexedDB.deleteDatabase('ibc-empaquetador');
  } catch (err) {
    console.error('Error migrando ibc-empaquetador:', err);
  }
}

// ---------------------------------------------------------------------------
// Export / Import
// ---------------------------------------------------------------------------

/** Exporta datos de una o ambas herramientas */
export async function exportToolData(tool: 'visualizador' | 'empaquetador' | 'all'): Promise<IbcToolsExport> {
  const db = await openIbcDB();
  const exportData: IbcToolsExport = {
    version: 1,
    tool,
    exportedAt: new Date().toISOString(),
    data: {},
  };

  if (tool === 'visualizador' || tool === 'all') {
    const records: Record<string, unknown> = {};
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_VISUALIZADOR, 'readonly');
      const store = tx.objectStore(STORE_VISUALIZADOR);
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          // Excluir flag de migracion del export
          if (cursor.key !== MIGRATION_FLAG) {
            records[String(cursor.key)] = cursor.value;
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    });
    exportData.data.visualizador = records;
  }

  if (tool === 'empaquetador' || tool === 'all') {
    const items = await new Promise<unknown[]>((resolve, reject) => {
      const tx = db.transaction(STORE_EMPAQUETADOR, 'readonly');
      const req = tx.objectStore(STORE_EMPAQUETADOR).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    exportData.data.empaquetador = items;
  }

  return exportData;
}

/** Importa datos, reemplazando los stores relevantes */
export async function importToolData(exportData: IbcToolsExport): Promise<void> {
  if (exportData.version !== 1) {
    throw new Error(`Version de export no soportada: ${exportData.version}`);
  }

  const db = await openIbcDB();

  if (exportData.data.visualizador && (exportData.tool === 'visualizador' || exportData.tool === 'all')) {
    const tx = db.transaction(STORE_VISUALIZADOR, 'readwrite');
    const store = tx.objectStore(STORE_VISUALIZADOR);
    store.clear();
    // Restaurar flag de migracion
    store.put(true, MIGRATION_FLAG);
    for (const [key, value] of Object.entries(exportData.data.visualizador)) {
      store.put(value, key);
    }
  }

  if (exportData.data.empaquetador && (exportData.tool === 'empaquetador' || exportData.tool === 'all')) {
    const tx = db.transaction(STORE_EMPAQUETADOR, 'readwrite');
    const store = tx.objectStore(STORE_EMPAQUETADOR);
    store.clear();
    for (const item of exportData.data.empaquetador) {
      store.put(item);
    }
  }
}

/** Descarga los datos como archivo .ibctools encriptado */
export async function downloadExport(tool: 'visualizador' | 'empaquetador' | 'all'): Promise<void> {
  const data = await exportToolData(tool);
  const encrypted = await encryptData(data);
  const blob = new Blob([encrypted], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);

  const a = document.createElement('a');
  a.href = url;
  a.download = `ibc-tools-${tool}-${date}.ibctools`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Verifica si el store de una herramienta esta vacio */
export async function isToolEmpty(tool: 'visualizador' | 'empaquetador'): Promise<boolean> {
  try {
    const db = await openIbcDB();
    const store = tool === 'visualizador' ? STORE_VISUALIZADOR : STORE_EMPAQUETADOR;
    return new Promise((resolve) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).count();
      req.onsuccess = () => {
        const count = req.result;
        // Visualizador puede tener solo el _migrated flag — eso cuenta como vacio
        if (tool === 'visualizador') {
          resolve(count <= 1); // 0 or just the _migrated key
        } else {
          resolve(count === 0);
        }
      };
      req.onerror = () => resolve(true);
    });
  } catch {
    return true;
  }
}

/** Limite de tamaño para archivos de importacion (10MB) */
const MAX_IMPORT_SIZE = 10 * 1024 * 1024;

/** Lee, desencripta y valida un archivo .ibctools */
export async function readImportFile(file: File): Promise<IbcToolsExport> {
  if (file.size > MAX_IMPORT_SIZE) {
    throw new Error('El archivo es demasiado grande (maximo 10MB)');
  }

  const buffer = await file.arrayBuffer();

  // Desencriptar el archivo
  const parsed = await decryptData(buffer);

  // Validar estructura
  if (parsed.version !== 1) {
    throw new Error(`Version no soportada: ${parsed.version}`);
  }
  if (!['visualizador', 'empaquetador', 'all'].includes(parsed.tool)) {
    throw new Error(`Tipo de herramienta invalido: ${parsed.tool}`);
  }
  if (typeof parsed.data !== 'object' || parsed.data === null) {
    throw new Error('El archivo no contiene datos validos');
  }

  // Validar estructura de datos del visualizador
  if (parsed.data.visualizador !== undefined && (typeof parsed.data.visualizador !== 'object' || parsed.data.visualizador === null || Array.isArray(parsed.data.visualizador))) {
    throw new Error('Datos de visualizador invalidos');
  }

  // Validar estructura de datos del empaquetador
  if (parsed.data.empaquetador !== undefined) {
    if (!Array.isArray(parsed.data.empaquetador)) {
      throw new Error('Datos de empaquetador invalidos');
    }
    for (const item of parsed.data.empaquetador) {
      if (typeof item !== 'object' || item === null || typeof (item as Record<string, unknown>).id !== 'string') {
        throw new Error('Registro de empaquetador invalido: falta campo id');
      }
    }
  }

  return parsed;
}
