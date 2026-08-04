import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import type { transit_realtime } from 'gtfs-realtime-bindings';

export type NyctDirectionValue = 1 | 2 | 3 | 4;

export interface NyctTripExtensionInput {
  readonly trainId?: string;
  readonly isAssigned?: boolean;
  readonly direction?: NyctDirectionValue | number;
}

export interface NyctStopExtensionInput {
  readonly scheduledTrack?: string;
  readonly actualTrack?: string;
}

export function encodeNyctFeed(feed: transit_realtime.IFeedMessage): Uint8Array {
  const failure = GtfsRealtimeBindings.transit_realtime.FeedMessage.verify(feed);
  if (failure) throw new Error(failure);
  return GtfsRealtimeBindings.transit_realtime.FeedMessage.encode(feed).finish();
}

export function nyctFeedHeaderUnknown(version = '1.0'): Uint8Array[] {
  return [extension(1001, message([stringField(1, version)]))];
}

export function nyctTripUnknown(input: NyctTripExtensionInput): Uint8Array[] {
  const fields: Uint8Array[] = [];
  if (input.trainId !== undefined) fields.push(stringField(1, input.trainId));
  if (input.isAssigned !== undefined) fields.push(varintField(2, input.isAssigned ? 1 : 0));
  if (input.direction !== undefined) fields.push(varintField(3, input.direction));
  return [extension(1001, message(fields))];
}

export function nyctStopUnknown(input: NyctStopExtensionInput): Uint8Array[] {
  const fields: Uint8Array[] = [];
  if (input.scheduledTrack !== undefined) fields.push(stringField(1, input.scheduledTrack));
  if (input.actualTrack !== undefined) fields.push(stringField(2, input.actualTrack));
  return [extension(1001, message(fields))];
}

export function malformedNyctExtension(payload: Uint8Array): Uint8Array[] {
  return [extension(1001, payload)];
}

function extension(fieldNumber: number, payload: Uint8Array): Uint8Array {
  return message([encodeVarint((fieldNumber << 3) | 2), encodeVarint(payload.byteLength), payload]);
}

function stringField(fieldNumber: number, value: string): Uint8Array {
  const bytes = new TextEncoder().encode(value);
  return message([encodeVarint((fieldNumber << 3) | 2), encodeVarint(bytes.byteLength), bytes]);
}

function varintField(fieldNumber: number, value: number): Uint8Array {
  return message([encodeVarint(fieldNumber << 3), encodeVarint(value)]);
}

function encodeVarint(input: number): Uint8Array {
  if (!Number.isSafeInteger(input) || input < 0) throw new Error('Fixture varint must be a non-negative safe integer');
  const bytes: number[] = [];
  let value = input;
  do {
    let byte = value % 128;
    value = Math.floor(value / 128);
    if (value > 0) byte |= 0x80;
    bytes.push(byte);
  } while (value > 0);
  return Uint8Array.from(bytes);
}

function message(parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((size, part) => size + part.byteLength, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}
