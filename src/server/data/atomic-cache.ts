import { randomUUID } from 'node:crypto';
import { mkdir, open, rename, rm } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

export type CacheBody = Uint8Array | AsyncIterable<Uint8Array>;

export interface AtomicCacheOptions {
  validate?: (temporaryPath: string) => Promise<void>;
}

export async function writeAtomicCache(
  destinationPath: string,
  body: CacheBody,
  options: AtomicCacheOptions = {},
): Promise<void> {
  const directory = dirname(destinationPath);
  await mkdir(directory, { recursive: true });

  const temporaryPath = join(directory, `.${basename(destinationPath)}.${randomUUID()}.tmp`);
  const file = await open(temporaryPath, 'wx');
  let fileIsOpen = true;

  try {
    for await (const chunk of asChunks(body)) {
      await writeCompletely(file, chunk);
    }
    await file.sync();
    await file.close();
    fileIsOpen = false;

    await options.validate?.(temporaryPath);
    await rename(temporaryPath, destinationPath);
  } catch (error) {
    if (fileIsOpen) {
      await file.close().catch(() => undefined);
    }
    await rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

async function* asChunks(body: CacheBody): AsyncGenerator<Uint8Array> {
  if (typeof (body as AsyncIterable<Uint8Array>)[Symbol.asyncIterator] === 'function') {
    yield* body as AsyncIterable<Uint8Array>;
  } else {
    yield body as Uint8Array;
  }
}

async function writeCompletely(
  file: Awaited<ReturnType<typeof open>>,
  chunk: Uint8Array,
): Promise<void> {
  let offset = 0;
  while (offset < chunk.byteLength) {
    const { bytesWritten } = await file.write(chunk, offset, chunk.byteLength - offset);
    if (bytesWritten === 0) {
      throw new Error('Atomic cache write made no progress');
    }
    offset += bytesWritten;
  }
}
