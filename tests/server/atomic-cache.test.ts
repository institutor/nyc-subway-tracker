import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

import { writeAtomicCache } from '../../src/server/data/atomic-cache';

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
});
