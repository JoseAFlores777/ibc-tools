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

/** Descarga los datos como archivo .ibctools */
export async function downloadExport(tool: 'visualizador' | 'empaquetador' | 'all'): Promise<void> {
  const data = await exportToolData(tool);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
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

/** Lee y valida un archivo .ibctools */
export async function readImportFile(file: File): Promise<IbcToolsExport> {
  if (file.size > MAX_IMPORT_SIZE) {
    throw new Error('El archivo es demasiado grande (maximo 10MB)');
  }

  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('El archivo no contiene JSON valido');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('El archivo no tiene el formato esperado');
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.version !== 1) {
    throw new Error(`Version no soportada: ${obj.version}`);
  }
  if (!['visualizador', 'empaquetador', 'all'].includes(obj.tool as string)) {
    throw new Error(`Tipo de herramienta invalido: ${obj.tool}`);
  }
  if (typeof obj.data !== 'object' || obj.data === null) {
    throw new Error('El archivo no contiene datos validos');
  }

  const data = obj.data as Record<string, unknown>;

  // Validar estructura de datos del visualizador
  if (data.visualizador !== undefined && (typeof data.visualizador !== 'object' || data.visualizador === null || Array.isArray(data.visualizador))) {
    throw new Error('Datos de visualizador invalidos');
  }

  // Validar estructura de datos del empaquetador
  if (data.empaquetador !== undefined) {
    if (!Array.isArray(data.empaquetador)) {
      throw new Error('Datos de empaquetador invalidos');
    }
    for (const item of data.empaquetador) {
      if (typeof item !== 'object' || item === null || typeof (item as Record<string, unknown>).id !== 'string') {
        throw new Error('Registro de empaquetador invalido: falta campo id');
      }
    }
  }

  return parsed as IbcToolsExport;
}
