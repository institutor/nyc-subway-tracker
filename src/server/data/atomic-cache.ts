import { randomUUID } from 'node:crypto';
import { mkdir, open, rename, rm } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';

export type CacheBody = Uint8Array | AsyncIterable<Uint8Array>;

export interface AtomicCacheOptions {
  validate?: (temporaryPath: string) => Promise<void>;
  generation?: AtomicCacheGeneration;
}

const generationBrand = Symbol('atomic-cache-generation');

export interface AtomicCacheGeneration {
  readonly destinationPath: string;
  readonly sequence: number;
  readonly [generationBrand]: symbol;
}

interface DestinationState {
  nextSequence: number;
  promotedSequence: number;
  readonly token: symbol;
  promotionTail: Promise<void>;
}

const destinationStates = new Map<string, DestinationState>();

export function reserveAtomicCacheGeneration(destinationPath: string): AtomicCacheGeneration {
  const canonicalPath = resolve(destinationPath);
  const state = destinationState(canonicalPath);
  state.nextSequence += 1;
  return Object.freeze({
    destinationPath: canonicalPath,
    sequence: state.nextSequence,
    [generationBrand]: state.token,
  });
}

export async function writeAtomicCache(
  destinationPath: string,
  body: CacheBody,
  options: AtomicCacheOptions = {},
): Promise<void> {
  const canonicalPath = resolve(destinationPath);
  const state = destinationState(canonicalPath);
  const generation = options.generation ?? reserveAtomicCacheGeneration(canonicalPath);
  if (
    generation.destinationPath !== canonicalPath ||
    generation[generationBrand] !== state.token
  ) {
    throw new Error('Cache generation does not belong to this destination');
  }
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
    await withPromotionLock(state, async () => {
      if (generation.sequence <= state.promotedSequence) {
        throw new Error(`Refusing stale cache generation ${generation.sequence}`);
      }
      await rename(temporaryPath, destinationPath);
      state.promotedSequence = generation.sequence;
    });
  } catch (error) {
    if (fileIsOpen) {
      await file.close().catch(() => undefined);
    }
    await rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

function destinationState(canonicalPath: string): DestinationState {
  const existing = destinationStates.get(canonicalPath);
  if (existing) return existing;
  const created: DestinationState = {
    nextSequence: 0,
    promotedSequence: 0,
    token: Symbol(canonicalPath),
    promotionTail: Promise.resolve(),
  };
  destinationStates.set(canonicalPath, created);
  return created;
}

async function withPromotionLock<T>(
  state: DestinationState,
  operation: () => Promise<T>,
): Promise<T> {
  const previous = state.promotionTail;
  let release = (): void => undefined;
  state.promotionTail = new Promise<void>((resolveTail) => {
    release = resolveTail;
  });
  await previous;
  try {
    return await operation();
  } finally {
    release();
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
