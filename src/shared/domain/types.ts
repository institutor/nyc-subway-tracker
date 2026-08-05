import type { ServiceDate } from './clock';

export type Instant = Date;
export type SourceKind =
  | 'regular-gtfs'
  | 'supplemented-gtfs'
  | 'gtfs-rt'
  | 'alerts'
  | 'entrances'
  | 'equipment'
  | 'practical-walk';
export type FeedHealthState = 'current' | 'degraded' | 'unavailable' | 'quarantined';
export type Direction = 'northbound' | 'southbound' | 'eastbound' | 'westbound' | 'inbound' | 'outbound' | 'unknown';
export type BoardMode = 'live' | 'scheduled-fallback' | 'demonstration' | 'unavailable';
export type ExposureStage = 'locked' | 'shadow' | 'validation' | 'enabled';
export type CommuteStage = 'disabled' | 'deterministic-test' | 'silent-evaluation' | 'pilot' | 'delivery';
export type CapabilityState = 'locked' | 'available' | 'unavailable';

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

interface ArrivalBase {
  id: string;
  route: RouteIdentity;
  direction: Direction;
  destination: string;
  provenance: Provenance;
}

export interface LiveArrival extends ArrivalBase {
  kind: 'live';
  at: Instant;
  estimateAt?: never;
  range?: never;
  serviceDate?: never;
  lastSupportedAt?: never;
  reason?: never;
}

export interface ExpectedArrival extends ArrivalBase {
  kind: 'expected';
  estimateAt: Instant;
  range: { startsAt: Instant; endsAt: Instant };
  at?: never;
  serviceDate?: never;
  lastSupportedAt?: never;
  reason?: never;
}

export interface ScheduledArrival extends ArrivalBase {
  kind: 'scheduled';
  at: Instant;
  serviceDate: ServiceDate;
  estimateAt?: never;
  range?: never;
  lastSupportedAt?: never;
  reason?: never;
}

export interface HoldingArrival extends ArrivalBase {
  kind: 'holding';
  lastSupportedAt: Instant;
  at?: never;
  estimateAt?: never;
  range?: never;
  serviceDate?: never;
  reason?: never;
}

export interface UncertainArrival extends ArrivalBase {
  kind: 'uncertain';
  reason: string;
  at?: never;
  estimateAt?: never;
  range?: never;
  serviceDate?: never;
  lastSupportedAt?: never;
}

export type Arrival = LiveArrival | ExpectedArrival | ScheduledArrival | HoldingArrival | UncertainArrival;
/** Only evidence-backed Live and Expected rows consume a primary next-three slot. */
export type PrimaryArrival = LiveArrival | ExpectedArrival;
export type BoardRowArrival = PrimaryArrival | ScheduledArrival;
export type SecondaryArrival = HoldingArrival | UncertainArrival;

export interface BoardDirection<Row extends BoardRowArrival = BoardRowArrival> {
  direction: Direction;
  primary: readonly Row[];
  secondary: readonly SecondaryArrival[];
  explanations: readonly BoardExplanation[];
}

export interface BoardExplanation {
  code: string;
  message: string;
  provenance?: Provenance;
}

export interface BoardCapabilities {
  arrivals: CapabilityState;
  accessibility: CapabilityState;
  guidance: CapabilityState;
  commute: CapabilityState;
}

interface BoardDecisionBase<Mode extends BoardMode, Row extends BoardRowArrival> {
  responseIdentity: string;
  mode: Mode;
  station: Station;
  directions: readonly BoardDirection<Row>[];
  feedHealth: readonly FeedHealth[];
  alerts: readonly Alert[];
  decidedAt: Instant;
  explanations: readonly BoardExplanation[];
  capabilities: BoardCapabilities;
}

export type LiveBoardDecision = BoardDecisionBase<'live', LiveArrival | ExpectedArrival>;
export type ScheduledFallbackBoardDecision = BoardDecisionBase<'scheduled-fallback', ScheduledArrival>;
export type DemonstrationBoardDecision = BoardDecisionBase<'demonstration', BoardRowArrival>;
export type UnavailableBoardDecision = BoardDecisionBase<'unavailable', never>;
export type BoardDecision = LiveBoardDecision | ScheduledFallbackBoardDecision | DemonstrationBoardDecision | UnavailableBoardDecision;

export type Board = BoardDecision;

export interface EligibleAccessibility {
  kind: 'eligible';
  entranceId: string;
  pathId: string;
  provenance: Provenance;
  reason?: never;
}

export interface IneligibleAccessibility {
  kind: 'ineligible';
  reason: string;
  provenance?: Provenance;
  entranceId?: never;
  pathId?: never;
}

export interface UnknownAccessibility {
  kind: 'unknown';
  reason: string;
  entranceId?: never;
  pathId?: never;
  provenance?: never;
}

export type Accessibility = EligibleAccessibility | IneligibleAccessibility | UnknownAccessibility;
export type AccessibilityState = Accessibility['kind'];

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
  accessibility: Accessibility;
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
  complexId: string;
  constituentId: string;
  preferredEntrance?: {
    entranceId: string;
    direction: Direction;
  };
  preferredRide?: {
    direction: Direction;
    actualDestination: string;
  };
  routeFilters: readonly string[];
  accessibleRouteOnly: boolean;
  commonDestination?: {
    complexId: string;
    constituentId: string;
  };
  timeWindow?: {
    weekdays: readonly number[];
    startsAt: string;
    endsAt: string;
  };
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
  stage: CommuteStage;
  notificationEnabled: boolean;
}

export interface ExposureDecision {
  stage: ExposureStage;
  decidedAt: Instant;
  reason: string;
  provenance: Provenance;
}
