import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export interface VapidKeyPair {
  readonly publicKey: string;
  readonly privateKey: string;
}

export interface VapidStore {
  loadOrCreate(): Promise<VapidKeyPair>;
}

export function createVapidStore(path: string): VapidStore {
  if (typeof path !== 'string' || !path.trim()) throw new Error('Invalid VAPID store path');
  let loaded: Promise<VapidKeyPair> | undefined;
  return Object.freeze({
    loadOrCreate(): Promise<VapidKeyPair> {
      loaded ??= readOrCreate(path);
      return loaded;
    },
  });
}

async function readOrCreate(path: string): Promise<VapidKeyPair> {
  try {
    return parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (!isMissing(error)) throw new Error('VAPID key store is invalid or unavailable');
  }

  const keys = generate();
  const temporary = `${path}.${randomUUID()}.tmp`;
  await mkdir(dirname(path), { recursive: true });
  try {
    await writeFile(temporary, `${JSON.stringify({ version: 1, ...keys })}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    await rename(temporary, path);
  } catch {
    try { return parse(await readFile(path, 'utf8')); } catch { throw new Error('VAPID key store could not be persisted'); }
  }
  return keys;
}

function generate(): VapidKeyPair {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const publicJwk = publicKey.export({ format: 'jwk' });
  const privateJwk = privateKey.export({ format: 'jwk' });
  if (!publicJwk.x || !publicJwk.y || !privateJwk.d) throw new Error('VAPID key generation failed');
  const uncompressed = Buffer.concat([Buffer.from([4]), Buffer.from(publicJwk.x, 'base64url'), Buffer.from(publicJwk.y, 'base64url')]);
  return Object.freeze({ publicKey: uncompressed.toString('base64url'), privateKey: privateJwk.d });
}

function parse(raw: string): VapidKeyPair {
  if (Buffer.byteLength(raw, 'utf8') > 4_096) throw new Error('VAPID key store size limit exceeded');
  const value = JSON.parse(raw) as unknown;
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw new Error('Invalid VAPID key store');
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== 3 || record.version !== 1
    || typeof record.publicKey !== 'string' || !/^[A-Za-z0-9_-]{80,100}$/u.test(record.publicKey)
    || typeof record.privateKey !== 'string' || !/^[A-Za-z0-9_-]{40,60}$/u.test(record.privateKey)) {
    throw new Error('Invalid VAPID key store');
  }
  return Object.freeze({ publicKey: record.publicKey, privateKey: record.privateKey });
}

function isMissing(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && (error as { code?: unknown }).code === 'ENOENT');
}
