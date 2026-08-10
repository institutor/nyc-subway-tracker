import { open, rename, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { basename, dirname, join } from 'node:path';

interface ShadowFileHandle {
  writeFile(value: string, encoding: 'utf8'): Promise<void>;
  sync(): Promise<void>;
  close(): Promise<void>;
}

export const MAX_SHADOW_RECORD_BYTES = 1_000_000;

export interface ShadowRecordDependencies {
  readonly randomId?: () => string;
  readonly open?: (path: string, flags: 'wx') => Promise<ShadowFileHandle>;
  readonly rename?: (from: string, to: string) => Promise<void>;
  readonly unlink?: (path: string) => Promise<void>;
}

export async function writeShadowRecordAtomic(
  finalPath: string,
  contents: string,
  dependencies: ShadowRecordDependencies = {},
): Promise<void> {
  if (Buffer.byteLength(contents, 'utf8') > MAX_SHADOW_RECORD_BYTES) {
    throw new Error('Shadow record is too large');
  }
  const randomId = (dependencies.randomId ?? randomUUID)();
  if (!/^[A-Za-z0-9-]{1,64}$/u.test(randomId)) throw new Error('Invalid shadow temporary identity');
  const temporaryPath = join(dirname(finalPath), `.${basename(finalPath)}.${randomId}.tmp`);
  const openFile = dependencies.open ?? open;
  const moveFile = dependencies.rename ?? rename;
  const removeFile = dependencies.unlink ?? unlink;
  let handle: ShadowFileHandle | undefined;
  let closed = false;
  try {
    handle = await openFile(temporaryPath, 'wx');
    await handle.writeFile(contents, 'utf8');
    await handle.sync();
    await handle.close();
    closed = true;
    await moveFile(temporaryPath, finalPath);
  } catch (error) {
    if (handle && !closed) {
      try { await handle.close(); } catch { /* Preserve the governing write failure. */ }
    }
    if (handle) {
      try { await removeFile(temporaryPath); } catch { /* Preserve the governing write failure. */ }
    }
    throw error;
  }
}
