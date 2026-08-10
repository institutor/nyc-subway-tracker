import { open, rename, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { basename, dirname, join } from 'node:path';

interface ShadowFileHandle {
  writeFile(value: string, encoding: 'utf8'): Promise<void>;
  sync(): Promise<void>;
  close(): Promise<void>;
}

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
  const temporaryPath = join(dirname(finalPath), `.${basename(finalPath)}.${(dependencies.randomId ?? randomUUID)()}.tmp`);
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
    try { await removeFile(temporaryPath); } catch { /* The exact temp may not have been created. */ }
    throw error;
  }
}
