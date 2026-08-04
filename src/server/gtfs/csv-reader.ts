import { createHash } from 'node:crypto';

export interface ParsedCsv {
  readonly headers: readonly string[];
  readonly rows: readonly Readonly<Record<string, string>>[];
}

export function parseCsv(input: string | Uint8Array): ParsedCsv {
  const text = typeof input === 'string' ? input : new TextDecoder('utf-8', { fatal: true }).decode(input);
  const records = parseRecords(text.startsWith('\uFEFF') ? text.slice(1) : text);
  if (records.length === 0) throw new Error('CSV is empty');

  const headers = records[0];
  if (headers.length === 0 || headers.some((header) => header.length === 0)) {
    throw new Error('CSV header names are required');
  }
  const canonicalHeaders = new Set<string>();
  for (const header of headers) {
    const canonical = header.normalize('NFC').toLocaleLowerCase('en-US');
    if (canonicalHeaders.has(canonical)) throw new Error(`Duplicate CSV header: ${header}`);
    canonicalHeaders.add(canonical);
  }

  const rows = records.slice(1).map((fields, rowIndex) => {
    if (fields.length !== headers.length) {
      throw new Error(
        `CSV row ${rowIndex + 2} column count ${fields.length} does not match header count ${headers.length}`,
      );
    }
    const row: Record<string, string> = {};
    for (let index = 0; index < headers.length; index += 1) row[headers[index]] = fields[index];
    return Object.freeze(row);
  });

  return Object.freeze({ headers: Object.freeze([...headers]), rows: Object.freeze(rows) });
}

export function canonicalCsvRowIdentity(row: Readonly<Record<string, string>>): string {
  const hash = createHash('sha256');
  for (const key of Object.keys(row).sort(compareUtf8)) {
    const value = row[key];
    updateLengthPrefixed(hash, key.normalize('NFC'));
    updateLengthPrefixed(hash, value.normalize('NFC'));
  }
  return `sha256:${hash.digest('hex')}`;
}

function parseRecords(text: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let quoted = false;
  let afterQuote = false;

  const pushRecord = () => {
    record.push(field);
    field = '';
    if (!(record.length === 1 && record[0] === '')) records.push(record);
    record = [];
    afterQuote = false;
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
          afterQuote = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (afterQuote && character !== ',' && character !== '\n' && character !== '\r') {
      throw new Error('Unexpected character after quoted CSV field');
    }
    if (character === '"') {
      if (field.length !== 0) throw new Error('Unexpected quote in unquoted CSV field');
      quoted = true;
    } else if (character === ',') {
      record.push(field);
      field = '';
      afterQuote = false;
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      pushRecord();
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error('Unterminated quoted field in CSV');
  if (field.length > 0 || record.length > 0) pushRecord();
  return records;
}

function compareUtf8(left: string, right: string): number {
  return Buffer.from(left).compare(Buffer.from(right));
}

function updateLengthPrefixed(hash: ReturnType<typeof createHash>, value: string): void {
  const bytes = Buffer.from(value, 'utf8');
  const length = Buffer.allocUnsafe(4);
  length.writeUInt32BE(bytes.length);
  hash.update(length).update(bytes);
}
