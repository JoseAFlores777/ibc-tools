/**
 * POST /api/tools/crypto?action=encrypt|decrypt
 *
 * Server-side encryption/decryption for .ibctools files.
 * The encryption key lives only on the server (process.env.IBC_ENCRYPTION_KEY).
 * The browser never sees the secret.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

/** Clave de encriptacion del servidor */
function getKey(): Buffer {
  const secret = process.env.IBC_ENCRYPTION_KEY || 'ibc-tools-default-key-change-me';
  // Derivar clave de 32 bytes con scrypt
  return scryptSync(secret, 'ibc-tools-salt-v1', 32);
}

/** Header magico: "IBCT" */
const MAGIC = Buffer.from([0x49, 0x42, 0x43, 0x54]);

/** Limite de tamaño: 10MB */
const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action');

  if (action === 'encrypt') {
    return handleEncrypt(request);
  }
  if (action === 'decrypt') {
    return handleDecrypt(request);
  }

  return NextResponse.json({ error: 'Accion invalida' }, { status: 400 });
}

async function handleEncrypt(request: NextRequest) {
  // Recibir JSON, devolver binario encriptado
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 });
  }

  const json = JSON.stringify(body);
  if (json.length > MAX_SIZE) {
    return NextResponse.json({ error: 'Datos demasiado grandes' }, { status: 413 });
  }

  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([
    cipher.update(json, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 16 bytes

  // Formato: MAGIC(4) + IV(12) + authTag(16) + ciphertext
  const result = Buffer.concat([MAGIC, iv, authTag, encrypted]);

  return new Response(result, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment',
    },
  });
}

async function handleDecrypt(request: NextRequest) {
  // Recibir binario encriptado, devolver JSON
  const buffer = await request.arrayBuffer();

  if (buffer.byteLength > MAX_SIZE) {
    return NextResponse.json({ error: 'Archivo demasiado grande' }, { status: 413 });
  }
  if (buffer.byteLength < 32) {
    return NextResponse.json({ error: 'Archivo demasiado pequeno' }, { status: 400 });
  }

  const data = Buffer.from(buffer);

  // Verificar magic header
  if (!data.subarray(0, 4).equals(MAGIC)) {
    return NextResponse.json({ error: 'No es un archivo .ibctools valido' }, { status: 400 });
  }

  const iv = data.subarray(4, 16);
  const authTag = data.subarray(16, 32);
  const ciphertext = data.subarray(32);

  const key = getKey();
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted: string;
  try {
    decrypted = decipher.update(ciphertext).toString('utf8') + decipher.final('utf8');
  } catch {
    return NextResponse.json(
      { error: 'No se pudo descifrar. El archivo puede estar corrupto o ser de otro servidor.' },
      { status: 400 },
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decrypted);
  } catch {
    return NextResponse.json({ error: 'Contenido descifrado no es JSON valido' }, { status: 400 });
  }

  return NextResponse.json(parsed);
}
