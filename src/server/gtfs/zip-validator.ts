import yauzl, { type Entry, type ZipFile } from 'yauzl';

const REQUIRED_TABLES = ['agency.txt', 'stops.txt', 'routes.txt', 'trips.txt', 'stop_times.txt'] as const;

export interface GtfsZipLimits {
  readonly maxEntries: number;
  readonly maxEntryUncompressedBytes: number;
  readonly maxTotalUncompressedBytes: number;
}

export const DEFAULT_GTFS_ZIP_LIMITS: GtfsZipLimits = Object.freeze({
  maxEntries: 128,
  maxEntryUncompressedBytes: 64 * 1024 * 1024,
  maxTotalUncompressedBytes: 256 * 1024 * 1024,
});

export async function validateAndReadGtfsZip(
  archive: Uint8Array,
  requestedLimits: Partial<GtfsZipLimits> = {},
): Promise<ReadonlyMap<string, Uint8Array>> {
  const limits = normalizeLimits(requestedLimits);
  const zipFile = await openZip(archive);
  try {
    const entries = await listEntries(zipFile, limits);
    validateRequiredTables(entries);
    const result = new Map<string, Uint8Array>();
    let actualTotal = 0;
    for (const item of entries) {
      if (item.entry.fileName.endsWith('/')) continue;
      const bytes = await readEntry(zipFile, item.entry, limits.maxEntryUncompressedBytes);
      actualTotal += bytes.byteLength;
      if (actualTotal > limits.maxTotalUncompressedBytes) {
        throw new Error(`GTFS ZIP exceeds total expansion limit of ${limits.maxTotalUncompressedBytes} bytes`);
      }
      result.set(item.canonicalName, bytes);
    }
    return new Map([...result.entries()].sort(([left], [right]) => Buffer.from(left).compare(Buffer.from(right))));
  } finally {
    zipFile.close();
  }
}

interface ListedEntry {
  readonly entry: Entry;
  readonly canonicalName: string;
}

function openZip(archive: Uint8Array): Promise<ZipFile> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(
      Buffer.from(archive.buffer, archive.byteOffset, archive.byteLength),
      { lazyEntries: true, autoClose: false, strictFileNames: true, validateEntrySizes: true },
      (error, zipFile) => {
        if (error || !zipFile) reject(new Error('Invalid GTFS ZIP archive', { cause: error ?? undefined }));
        else resolve(zipFile);
      },
    );
  });
}

function listEntries(zipFile: ZipFile, limits: GtfsZipLimits): Promise<ListedEntry[]> {
  return new Promise((resolve, reject) => {
    const entries: ListedEntry[] = [];
    const names = new Set<string>();
    let declaredTotal = 0;
    let settled = false;

    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(normalizeEntryError(error));
    };
    zipFile.once('error', fail);
    zipFile.on('entry', (entry: Entry) => {
      if (settled) return;
      try {
        if (entries.length + 1 > limits.maxEntries) {
          throw new Error(`GTFS ZIP exceeds entry count limit of ${limits.maxEntries}`);
        }
        const canonicalName = canonicalZipEntryName(entry.fileName);
        if (names.has(canonicalName)) throw new Error(`Duplicate canonical ZIP entry: ${canonicalName}`);
        names.add(canonicalName);
        if (entry.uncompressedSize > limits.maxEntryUncompressedBytes) {
          throw new Error(
            `GTFS ZIP entry ${entry.fileName} exceeds per-entry expansion limit of ${limits.maxEntryUncompressedBytes} bytes`,
          );
        }
        declaredTotal += entry.uncompressedSize;
        if (declaredTotal > limits.maxTotalUncompressedBytes) {
          throw new Error(`GTFS ZIP exceeds total expansion limit of ${limits.maxTotalUncompressedBytes} bytes`);
        }
        entries.push({ entry, canonicalName });
        zipFile.readEntry();
      } catch (error) {
        fail(error);
      }
    });
    zipFile.once('end', () => {
      if (settled) return;
      settled = true;
      resolve(entries);
    });
    zipFile.readEntry();
  });
}

function readEntry(zipFile: ZipFile, entry: Entry, limit: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    zipFile.openReadStream(entry, (error, stream) => {
      if (error || !stream) {
        reject(new Error(`Unable to read GTFS ZIP entry ${entry.fileName}`, { cause: error ?? undefined }));
        return;
      }
      const chunks: Buffer[] = [];
      let received = 0;
      let settled = false;
      const fail = (failure: unknown) => {
        if (settled) return;
        settled = true;
        stream.destroy();
        reject(failure instanceof Error ? failure : new Error(String(failure)));
      };
      stream.on('data', (chunk: Buffer) => {
        received += chunk.length;
        if (received > limit) {
          fail(new Error(`GTFS ZIP entry ${entry.fileName} exceeds per-entry expansion limit of ${limit} bytes`));
          return;
        }
        chunks.push(chunk);
      });
      stream.once('error', fail);
      stream.once('end', () => {
        if (settled) return;
        settled = true;
        if (received !== entry.uncompressedSize) {
          reject(new Error(`GTFS ZIP entry ${entry.fileName} has a malformed expansion size`));
          return;
        }
        const content = Buffer.concat(chunks);
        if (crc32(content) !== entry.crc32) {
          reject(new Error(`GTFS ZIP entry ${entry.fileName} failed CRC validation`));
          return;
        }
        resolve(new Uint8Array(content));
      });
    });
  });
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function normalizeEntryError(error: unknown): Error {
  const normalized = error instanceof Error ? error : new Error(String(error));
  if (/invalid relative path|absolute path|invalid characters in filename/i.test(normalized.message)) {
    return new Error(`Unsafe ZIP entry path: ${normalized.message}`, { cause: normalized });
  }
  return normalized;
}

function canonicalZipEntryName(fileName: string): string {
  if (fileName.includes('\\') || fileName.includes('\0') || fileName.startsWith('/') || /^[a-zA-Z]:\//.test(fileName)) {
    throw new Error(`Unsafe ZIP entry path: ${fileName}`);
  }
  const parts: string[] = [];
  for (const part of fileName.normalize('NFC').split('/')) {
    if (part === '..') throw new Error(`Unsafe ZIP entry path: ${fileName}`);
    if (part === '' && parts.length > 0) throw new Error(`Unsafe ZIP entry path: ${fileName}`);
    if (part !== '' && part !== '.') parts.push(part);
  }
  if (parts.length === 0) throw new Error(`Unsafe ZIP entry path: ${fileName}`);
  return parts.join('/').toLocaleLowerCase('en-US');
}

function validateRequiredTables(entries: readonly ListedEntry[]): void {
  const names = new Set(entries.map((entry) => entry.canonicalName));
  for (const table of REQUIRED_TABLES) {
    if (!names.has(table)) throw new Error(`GTFS ZIP is missing required table ${table}`);
  }
  if (!names.has('calendar.txt') && !names.has('calendar_dates.txt')) {
    throw new Error('GTFS ZIP requires calendar.txt or calendar_dates.txt');
  }
}

function normalizeLimits(requested: Partial<GtfsZipLimits>): GtfsZipLimits {
  const limits = { ...DEFAULT_GTFS_ZIP_LIMITS, ...requested };
  for (const [name, value] of Object.entries(limits)) {
    if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`Invalid GTFS ZIP ${name}`);
  }
  return limits;
}
