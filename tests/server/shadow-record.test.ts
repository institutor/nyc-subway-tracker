import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
const MAX_SHADOW_RECORD_BYTES = 1_000_000;

const directories: string[] = [];
afterEach(async () => Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true }))));

describe('atomic shadow record persistence', () => {
  test('flushes and closes a same-directory temporary file before one atomic rename', async () => {
    const module = await import('../../src/server/services/shadow-record').catch(() => ({} as any)) as any;
    expect(typeof module.writeShadowRecordAtomic).toBe('function');
    const directory = await mkdtemp(join(tmpdir(), 'subway-shadow-record-'));
    directories.push(directory);
    const finalPath = join(directory, 'shadow-a.json');

    await module.writeShadowRecordAtomic(finalPath, '{"safe":true}\n');

    expect(await readdir(directory)).toEqual(['shadow-a.json']);
    expect(await readFile(finalPath, 'utf8')).toBe('{"safe":true}\n');
  });

  test('cleans only its bounded temp and leaves no final file when flush fails', async () => {
    const module = await import('../../src/server/services/shadow-record').catch(() => ({} as any)) as any;
    const finalPath = 'C:\\shadow\\shadow-a.json';
    const close = vi.fn(async () => undefined);
    const unlink = vi.fn(async () => undefined);
    const rename = vi.fn(async () => undefined);
    const opened: string[] = [];
    const dependencies = {
      randomId: () => 'fixed-id',
      open: vi.fn(async (path: string) => {
        opened.push(path);
        return { writeFile: async () => undefined, sync: async () => { throw new Error('flush failed'); }, close };
      }),
      rename,
      unlink,
    };

    await expect(module.writeShadowRecordAtomic(finalPath, '{}\n', dependencies)).rejects.toThrow('flush failed');
    expect(dirname(opened[0])).toBe(dirname(finalPath));
    expect(opened[0]).toMatch(/\.shadow-a\.json\.fixed-id\.tmp$/);
    expect(close).toHaveBeenCalledTimes(1);
    expect(unlink).toHaveBeenCalledWith(opened[0]);
    expect(rename).not.toHaveBeenCalled();
  });

  test('does not unlink an unowned path when exclusive open rejects', async () => {
    const module = await import('../../src/server/services/shadow-record') as any;
    const unlink = vi.fn(async () => undefined);
    const rename = vi.fn(async () => undefined);
    const open = vi.fn(async () => { throw Object.assign(new Error('collision'), { code: 'EEXIST' }); });

    await expect(module.writeShadowRecordAtomic('C:\\shadow\\shadow-a.json', '{}\n', {
      randomId: () => 'collision', open, unlink, rename,
    })).rejects.toThrow('collision');
    expect(unlink).not.toHaveBeenCalled();
    expect(rename).not.toHaveBeenCalled();
  });

  test('rejects an oversized encoded record before opening a temporary file', async () => {
    const module = await import('../../src/server/services/shadow-record') as any;
    const open = vi.fn();
    const unlink = vi.fn();
    const rename = vi.fn();

    await expect(module.writeShadowRecordAtomic('C:\\shadow\\shadow-a.json', 'x'.repeat(MAX_SHADOW_RECORD_BYTES + 1), {
      open, unlink, rename,
    })).rejects.toThrow(/record.*large/i);
    expect(open).not.toHaveBeenCalled();
    expect(unlink).not.toHaveBeenCalled();
    expect(rename).not.toHaveBeenCalled();
  });
});
