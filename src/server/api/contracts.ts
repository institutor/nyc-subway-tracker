import type { RuntimeMode } from '../config';
import type { LockedExposureDecision, ExposureStage } from '../release/exposure-gates';
import type { ProvenanceDto, SourceHealthDto } from './provenance-dto';

export const API_VERSION = 'v1' as const;
export const SCHEMA_VERSION = '2026-08-04' as const;
export const DEMONSTRATION_LABEL = 'Demonstration data — not live' as const;

export type RuntimeSurface = 'public' | 'demonstration';
export type RuntimeAvailability = 'available' | 'locked' | 'unavailable';

export interface RuntimeDto {
  readonly mode: RuntimeMode;
  readonly surface: RuntimeSurface;
  readonly availability: RuntimeAvailability;
}

export interface DynamicEnvelope<T> {
  readonly apiVersion: typeof API_VERSION;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly responseIdentity: string;
  readonly decidedAt: string;
  readonly serverTime: string;
  readonly runtime: RuntimeDto;
  readonly gates: Readonly<Record<ExposureStage, LockedExposureDecision>>;
  readonly gateDecision?: LockedExposureDecision;
  readonly sourceHealth?: readonly SourceHealthDto[];
  readonly provenance?: readonly ProvenanceDto[];
  readonly demonstrationLabel?: typeof DEMONSTRATION_LABEL;
  readonly data: T;
}

export interface StaticEnvelope<T> {
  readonly apiVersion: typeof API_VERSION;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly contentVersion: string;
  readonly data: T;
}
