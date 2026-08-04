import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

import {
  reserveAtomicCacheGeneration,
  writeAtomicCache,
} from '../../src/server/data/atomic-cache';

const temporaryDirectories: string[] = [];

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'transit-atomic-cache-'));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe('atomic transit cache promotion', () => {
  test('keeps the old edition visible until a uniquely named same-directory file is complete', async () => {
    const directory = await temporaryDirectory();
    const destinationPath = join(directory, 'regular-gtfs.zip');
    await writeAtomicCache(destinationPath, Buffer.from('last-good'));

    let releaseSecondChunk = (): void => undefined;
    const secondChunkReleased = new Promise<void>((resolve) => {
      releaseSecondChunk = resolve;
    });
    let firstChunkWritten = (): void => undefined;
    const firstChunkWasWritten = new Promise<void>((resolve) => {
      firstChunkWritten = resolve;
    });

    async function* replacement(): AsyncGenerator<Buffer> {
      yield Buffer.from('new-');
      firstChunkWritten();
      await secondChunkReleased;
      yield Buffer.from('edition');
    }

    const promotion = writeAtomicCache(destinationPath, replacement());
    await firstChunkWasWritten;

    expect(await readFile(destinationPath, 'utf8')).toBe('last-good');
    const inProgressFiles = await readdir(directory);
    expect(inProgressFiles).toHaveLength(2);
    expect(inProgressFiles.filter((name) => name !== 'regular-gtfs.zip')[0]).toMatch(
      /^\.regular-gtfs\.zip\.[0-9a-f-]+\.tmp$/,
    );

    releaseSecondChunk();
    await promotion;

    expect(await readFile(destinationPath, 'utf8')).toBe('new-edition');
    expect(await readdir(directory)).toEqual(['regular-gtfs.zip']);
  });

  test.each([
    ['stream failure', async function* (): AsyncGenerator<Buffer> {
      yield Buffer.from('partial');
      throw new Error('connection reset');
    }],
    ['validation failure', async function* (): AsyncGenerator<Buffer> {
      yield Buffer.from('complete-but-invalid');
    }],
  ])('preserves the last-good edition and removes temporary files after %s', async (caseName, body) => {
    const directory = await temporaryDirectory();
    const destinationPath = join(directory, 'subway-alerts.pb');
    await writeAtomicCache(destinationPath, Buffer.from('last-good'));

    await expect(
      writeAtomicCache(destinationPath, body(), {
        validate:
          caseName === 'validation failure'
            ? async () => {
                throw new Error('invalid feed');
              }
            : undefined,
      }),
    ).rejects.toThrow(caseName === 'stream failure' ? 'connection reset' : 'invalid feed');

    expect(await readFile(destinationPath, 'utf8')).toBe('last-good');
    expect(await readdir(directory)).toEqual(['subway-alerts.pb']);
  });

  test('prevents an older delayed request generation from replacing a newer promotion', async () => {
    const directory = await temporaryDirectory();
    const destinationPath = join(directory, 'subway-rt.pb');
    await writeAtomicCache(destinationPath, Buffer.from('last-good'));
    const olderGeneration = reserveAtomicCacheGeneration(destinationPath);
    const newerGeneration = reserveAtomicCacheGeneration(destinationPath);

    let releaseOlder = (): void => undefined;
    const olderReleased = new Promise<void>((resolve) => {
      releaseOlder = resolve;
    });
    let olderStarted = (): void => undefined;
    const olderHasStarted = new Promise<void>((resolve) => {
      olderStarted = resolve;
    });
    async function* delayedOlderBody(): AsyncGenerator<Buffer> {
      yield Buffer.from('older-');
      olderStarted();
      await olderReleased;
      yield Buffer.from('edition');
    }

    const olderPromotion = writeAtomicCache(destinationPath, delayedOlderBody(), {
      generation: olderGeneration,
    });
    const staleRejection = expect(olderPromotion).rejects.toThrow('stale cache generation');
    await olderHasStarted;
    await writeAtomicCache(destinationPath, Buffer.from('newer-edition'), {
      generation: newerGeneration,
    });
    releaseOlder();

    await staleRejection;
    expect(await readFile(destinationPath, 'utf8')).toBe('newer-edition');
    expect(await readdir(directory)).toEqual(['subway-rt.pb']);
  });
});
