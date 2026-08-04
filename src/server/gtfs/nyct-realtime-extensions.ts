import type { transit_realtime } from 'gtfs-realtime-bindings';

const NYCT_EXTENSION_TAG = 1001;

export type NyctDirection = 'NORTH' | 'SOUTH';

export interface NyctTripDescriptorEvidence {
  readonly trainId: string | null;
  readonly isAssigned: boolean | null;
  readonly direction: NyctDirection | null;
}

export interface NyctStopTimeEvidence {
  readonly scheduledTrack: string | null;
  readonly actualTrack: string | null;
}

export interface NyctTripReplacementPeriod {
  readonly routeId: string | null;
  readonly startsAt: Date | null;
  readonly endsAt: Date | null;
}

export interface NyctFeedHeaderEvidence {
  readonly nyctSubwayVersion: string;
  readonly tripReplacementPeriods: readonly NyctTripReplacementPeriod[];
}

export function decodeNyctFeedHeader(header: transit_realtime.IFeedHeader): NyctFeedHeaderEvidence {
  const payload = extensionPayload(header.$unknowns, 'NYCT feed header');
  if (!payload) throw new Error('NYCT feed header extension is required');
  const fields = fieldsOf(payload, 'NYCT feed header extension');
  const version = requiredString(single(fields, 1, 'NYCT subway version'), 'NYCT subway version');
  if (version !== '1.0') throw new Error(`Unsupported NYCT subway extension version ${version}`);
  const tripReplacementPeriods = fields
    .filter((field) => field.number === 2)
    .map((field, index) => decodeReplacementPeriod(requireBytes(field, `Trip replacement period ${index + 1}`)));
  return Object.freeze({
    nyctSubwayVersion: version,
    tripReplacementPeriods: Object.freeze(tripReplacementPeriods),
  });
}

export function decodeNyctTripDescriptor(
  descriptor: transit_realtime.ITripDescriptor,
  label: string,
): NyctTripDescriptorEvidence {
  let payload: Uint8Array | null;
  try {
    payload = extensionPayload(descriptor.$unknowns, `${label} NYCT trip descriptor`);
  } catch (error) {
    const message = errorMessage(error);
    if (/^Duplicate /i.test(message)) throw new Error(`Duplicate NYCT trip descriptor extension for ${label}`);
    throw new Error(`Malformed NYCT trip descriptor extension for ${label}: ${message}`);
  }
  if (!payload) return EMPTY_TRIP;
  let fields: readonly WireField[];
  try {
    fields = fieldsOf(payload, `${label} NYCT trip descriptor extension`);
  } catch (error) {
    throw new Error(`Malformed NYCT trip descriptor extension for ${label}: ${errorMessage(error)}`);
  }
  const trainIdField = optionalSingle(fields, 1, `${label} NYCT train id`);
  const assignmentField = optionalSingle(fields, 2, `${label} NYCT assignment`);
  const directionField = optionalSingle(fields, 3, `${label} NYCT direction`);
  const directionValue = directionField ? requireVarint(directionField, `${label} NYCT direction`) : null;
  if (directionValue !== null && directionValue !== 1 && directionValue !== 3) {
    throw new Error(`${label} NYCT direction must be NORTH or SOUTH`);
  }
  return Object.freeze({
    trainId: trainIdField ? optionalText(requireString(trainIdField, `${label} NYCT train id`)) : null,
    isAssigned: assignmentField ? boolean(requireVarint(assignmentField, `${label} NYCT assignment`), `${label} NYCT assignment`) : null,
    direction: directionValue === 1 ? 'NORTH' : directionValue === 3 ? 'SOUTH' : null,
  });
}

export function decodeNyctStopTimeUpdate(
  update: transit_realtime.TripUpdate.StopTimeUpdate.IStopTimeProperties | transit_realtime.TripUpdate.IStopTimeUpdate,
  label: string,
): NyctStopTimeEvidence {
  const payload = extensionPayload(update.$unknowns, `${label} NYCT stop-time update`);
  if (!payload) return EMPTY_STOP;
  const fields = fieldsOf(payload, `${label} NYCT stop-time update extension`);
  const scheduled = optionalSingle(fields, 1, `${label} scheduled track`);
  const actual = optionalSingle(fields, 2, `${label} actual track`);
  return Object.freeze({
    scheduledTrack: scheduled ? optionalText(requireString(scheduled, `${label} scheduled track`)) : null,
    actualTrack: actual ? optionalText(requireString(actual, `${label} actual track`)) : null,
  });
}

const EMPTY_TRIP: NyctTripDescriptorEvidence = Object.freeze({ trainId: null, isAssigned: null, direction: null });
const EMPTY_STOP: NyctStopTimeEvidence = Object.freeze({ scheduledTrack: null, actualTrack: null });

interface WireField {
  readonly number: number;
  readonly wireType: number;
  readonly varint?: number;
  readonly bytes?: Uint8Array;
}

function extensionPayload(unknowns: readonly Uint8Array[] | null | undefined, label: string): Uint8Array | null {
  let found: Uint8Array | null = null;
  for (const raw of unknowns ?? []) {
    let fields: readonly WireField[];
    try {
      fields = fieldsOf(raw, `${label} outer field`);
    } catch (error) {
      throw new Error(`Malformed ${label} extension: ${errorMessage(error)}`);
    }
    for (const field of fields) {
      if (field.number !== NYCT_EXTENSION_TAG) continue;
      if (found) throw new Error(`Duplicate ${label} extension`);
      found = requireBytes(field, label);
    }
  }
  return found;
}

function fieldsOf(bytes: Uint8Array, label: string): readonly WireField[] {
  const cursor = new WireCursor(bytes, label);
  const fields: WireField[] = [];
  while (!cursor.done()) {
    const tag = cursor.varint();
    const number = Math.floor(tag / 8);
    const wireType = tag & 7;
    if (number <= 0) throw new Error(`${label} contains an invalid field number`);
    if (wireType === 0) fields.push({ number, wireType, varint: cursor.varint() });
    else if (wireType === 2) fields.push({ number, wireType, bytes: cursor.bytes(cursor.varint()) });
    else throw new Error(`${label} contains unsupported wire type ${wireType}`);
  }
  return fields;
}

function decodeReplacementPeriod(bytes: Uint8Array): NyctTripReplacementPeriod {
  const fields = fieldsOf(bytes, 'NYCT trip replacement period');
  const route = optionalSingle(fields, 1, 'NYCT replacement route');
  const range = optionalSingle(fields, 2, 'NYCT replacement time range');
  let startsAt: Date | null = null;
  let endsAt: Date | null = null;
  if (range) {
    const rangeFields = fieldsOf(requireBytes(range, 'NYCT replacement time range'), 'NYCT replacement time range');
    const start = optionalSingle(rangeFields, 1, 'NYCT replacement start');
    const end = optionalSingle(rangeFields, 2, 'NYCT replacement end');
    startsAt = start ? unixDate(requireVarint(start, 'NYCT replacement start')) : null;
    endsAt = end ? unixDate(requireVarint(end, 'NYCT replacement end')) : null;
    if (startsAt && endsAt && endsAt < startsAt) throw new Error('NYCT trip replacement period ends before it starts');
  }
  return Object.freeze({
    routeId: route ? optionalText(requireString(route, 'NYCT replacement route')) : null,
    startsAt,
    endsAt,
  });
}

function single(fields: readonly WireField[], number: number, label: string): WireField {
  const field = optionalSingle(fields, number, label);
  if (!field) throw new Error(`${label} is required`);
  return field;
}

function optionalSingle(fields: readonly WireField[], number: number, label: string): WireField | null {
  const matching = fields.filter((field) => field.number === number);
  if (matching.length > 1) throw new Error(`Duplicate ${label}`);
  return matching[0] ?? null;
}

function requireBytes(field: WireField, label: string): Uint8Array {
  if (field.wireType !== 2 || !field.bytes) throw new Error(`${label} must be length-delimited`);
  return field.bytes;
}

function requireString(field: WireField, label: string): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(requireBytes(field, label));
  } catch (error) {
    throw new Error(`${label} must be valid UTF-8: ${errorMessage(error)}`);
  }
}

function requiredString(field: WireField, label: string): string {
  const value = requireString(field, label);
  if (!value.trim()) throw new Error(`${label} is required`);
  return value;
}

function requireVarint(field: WireField, label: string): number {
  if (field.wireType !== 0 || field.varint === undefined) throw new Error(`${label} must be a varint`);
  return field.varint;
}

function boolean(value: number, label: string): boolean {
  if (value !== 0 && value !== 1) throw new Error(`${label} must be boolean`);
  return value === 1;
}

function optionalText(value: string): string | null {
  return value.trim() ? value : null;
}

function unixDate(seconds: number): Date {
  const date = new Date(seconds * 1000);
  if (!Number.isFinite(date.getTime())) throw new Error('NYCT extension timestamp is invalid');
  return date;
}

class WireCursor {
  private offset = 0;

  constructor(private readonly input: Uint8Array, private readonly label: string) {}

  done(): boolean {
    return this.offset === this.input.byteLength;
  }

  varint(): number {
    let value = 0;
    let multiplier = 1;
    for (let count = 0; count < 10; count += 1) {
      if (this.offset >= this.input.byteLength) throw new Error(`${this.label} contains a truncated varint`);
      const byte = this.input[this.offset++];
      value += (byte & 0x7f) * multiplier;
      if (!Number.isSafeInteger(value)) throw new Error(`${this.label} varint exceeds safe integer range`);
      if ((byte & 0x80) === 0) return value;
      multiplier *= 128;
    }
    throw new Error(`${this.label} contains an overlong varint`);
  }

  bytes(length: number): Uint8Array {
    if (!Number.isSafeInteger(length) || length < 0 || this.offset + length > this.input.byteLength) {
      throw new Error(`${this.label} contains a truncated length-delimited field`);
    }
    const result = this.input.subarray(this.offset, this.offset + length);
    this.offset += length;
    return result;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
