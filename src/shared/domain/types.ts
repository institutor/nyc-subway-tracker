import type { ServiceDate } from './clock';

export type Instant = Date;
export type SourceKind = 'regular-gtfs' | 'supplemented-gtfs' | 'gtfs-rt' | 'alerts' | 'entrances' | 'equipment';
export type FeedHealthState = 'current' | 'degraded' | 'unavailable' | 'quarantined';
export type ArrivalState = 'live' | 'expected' | 'scheduled' | 'holding' | 'uncertain';
export type Direction = 'northbound' | 'southbound' | 'eastbound' | 'westbound' | 'inbound' | 'outbound' | 'unknown';
export type AccessibilityState = 'eligible' | 'ineligible' | 'unknown';
export type ExposureStage = 'locked' | 'shadow' | 'validation' | 'pilot' | 'enabled';

export interface Provenance {
  source: SourceKind;
  sourceId: string;
  observedAt: Instant;
  retrievedAt: Instant;
  version?: string;
}

export interface SourceRecord {
  id: string;
  kind: SourceKind;
  retrievedAt: Instant;
  publishedAt?: Instant;
  provenance: Provenance;
}

export type Source = SourceRecord;

export interface FeedHealth {
  source: SourceKind;
  state: FeedHealthState;
  assessedAt: Instant;
  lastAcceptedAt?: Instant;
  reason?: string;
}

export interface RouteIdentity {
  id: string;
  label: string;
}

export interface Station {
  id: string;
  name: string;
  complexId: string;
  routeIds: readonly string[];
}

export interface Entrance {
  id: string;
  stationId: string;
  label: string;
  accessible: AccessibilityState;
  provenance: Provenance;
}

export interface Alert {
  id: string;
  text: string;
  activeFrom: Instant;
  activeUntil?: Instant;
  routeIds: readonly string[];
  stationIds: readonly string[];
  directions: readonly Direction[];
  provenance: Provenance;
}

export interface Arrival {
  id: string;
  route: RouteIdentity;
  direction: Direction;
  destination: string;
  state: ArrivalState;
  at: Instant;
  serviceDate?: ServiceDate;
  provenance: Provenance;
}

export interface BoardDirection {
  direction: Direction;
  arrivals: readonly Arrival[];
}

export interface Board {
  station: Station;
  directions: readonly BoardDirection[];
  feedHealth: readonly FeedHealth[];
  alerts: readonly Alert[];
  decidedAt: Instant;
}

export interface Accessibility {
  state: AccessibilityState;
  entranceId?: string;
  pathId?: string;
  provenance?: Provenance;
}

export interface Guidance {
  stationId: string;
  direction: Direction;
  route: RouteIdentity;
  position: 'front' | 'middle' | 'back';
  provenance: Provenance;
}

export interface JourneyLeg {
  route: RouteIdentity;
  direction: Direction;
  originStationId: string;
  destinationStationId: string;
}

export interface Journey {
  id: string;
  originStationId: string;
  destinationStationId: string;
  legs: readonly JourneyLeg[];
  accessibility: AccessibilityState;
  provenance: readonly Provenance[];
}

export interface ActiveTrip {
  journey: Journey;
  cursorLegIndex: number;
  cursorStopId: string;
  capturedAt: Instant;
  serviceDate?: ServiceDate;
}

export interface SavedRecord {
  id: string;
  stationId: string;
  preferredEntranceId?: string;
  preferredDirection?: Direction;
  routeIds: readonly string[];
  accessibleRouteOnly: boolean;
  state: 'active' | 'paused';
}

export interface CommuteWindow {
  id: string;
  savedRecordId: string;
  weekdays: readonly number[];
  startsAt: string;
  endsAt: string;
  route?: RouteIdentity;
  direction?: Direction;
  notificationEnabled: boolean;
}

export interface ExposureDecision {
  stage: ExposureStage;
  decidedAt: Instant;
  reason: string;
  provenance: Provenance;
}
