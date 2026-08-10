import type {
  ActiveTripClaimScope,
  ActiveTripRecord,
  ActiveTripSchedule,
} from '../storage/active-trip-store';
import { directionLabel } from './DirectionTrack';
import { RouteToken } from './RouteToken';

export function ActiveTripCard({
  trip,
  offline,
  onSetCursor,
  onClear,
}: {
  readonly trip: ActiveTripRecord;
  readonly offline: boolean;
  readonly onSetCursor: (pointId: string) => void;
  readonly onClear?: () => void;
}) {
  const points = trip.legs.flatMap((leg) => leg.points);
  const cursorIndex = Math.max(0, points.findIndex(({ id }) => id === trip.cursor.pointId));
  const completed = cursorIndex === points.length - 1;

  return (
    <section className="active-trip-card" aria-labelledby="active-trip-heading">
      <header className="active-trip-card__header">
        <div>
          <p className="section-kicker">Saved before descent</p>
          <h2 id="active-trip-heading">{trip.origin.name} to {trip.destination.name}</h2>
          <p>Captured {formatDateTime(trip.capturedAt)}</p>
        </div>
        {onClear ? <button type="button" className="danger-action" onClick={onClear}>End active trip</button> : null}
      </header>

      {trip.captureContext.kind === 'response-owned' && trip.captureContext.disclosure
        ? <p className="surface-disclosure">{trip.captureContext.disclosure}</p>
        : null}

      <ValidityContext trip={trip} />
      <p className="claim-line"><span>Accessible Route Only · {trip.accessibleRouteOnly ? 'On' : 'Off'}</span></p>
      {offline && trip.accessibleRouteOnly ? (
        <div className="accessibility-warning" role="alert" aria-live="assertive">
          <p><strong>Accessible Route Only remains on.</strong> Current elevator status cannot be verified offline.</p>
        </div>
      ) : null}
      {completed ? <p className="trip-complete" role="status">Trip complete — rider confirmed</p> : null}

      <div className="active-trip-legs">
        {trip.legs.map((leg, legIndex) => (
          <article className="active-trip-leg" key={leg.id} aria-labelledby={`active-${leg.id}-heading`}>
            <header>
              <RouteToken route={leg.route} />
              <div>
                <p className="section-kicker">Leg {legIndex + 1}</p>
                <h3 id={`active-${leg.id}-heading`}>{leg.route.label} toward {leg.actualDestination}</h3>
                <p>{directionLabel(leg.boundDirection)}</p>
              </div>
            </header>
            <ol className="trip-points">
              {leg.points.map((point) => {
                const pointIndex = points.findIndex(({ id }) => id === point.id);
                const state = pointState(pointIndex, cursorIndex);
                const transfer = trip.transfers.find(({ atPointId }) => atPointId === point.id);
                return (
                  <li className={`trip-point trip-point--${state.toLowerCase()}`} key={point.id} data-testid={`trip-point-${point.id}`} aria-current={state === 'Current' ? 'step' : undefined}>
                    <div className="trip-point__copy">
                      <p className="section-kicker">{state}</p>
                      <h4>{point.stationName}</h4>
                      <p>{point.instruction}</p>
                    </div>
                    {state !== 'Current' ? (
                      <button type="button" aria-label={`I'm at this stop: ${point.stationName}`} onClick={() => onSetCursor(point.id)}>
                        I'm at this stop
                      </button>
                    ) : null}
                    {transfer ? <TransferContext trip={trip} transferId={transfer.id} /> : null}
                  </li>
                );
              })}
            </ol>
          </article>
        ))}
      </div>

      {trip.serviceClaims.length > 0 ? <section className="trip-evidence" aria-label="Historical service context">
        <h3>Service context</h3>
        {trip.serviceClaims.map((claim) => (
          <article key={claim.id}>
            <p><strong>{scopeLabel(claim.scope, trip)}</strong> · {titleWords(claim.state)}</p>
            <p>{claim.consequence}</p>
            <p className="claim-line"><time dateTime={claim.lastCheckedAt}>Last checked {formatClock(claim.lastCheckedAt)}</time>{offline ? <span>Historical — not current</span> : null}</p>
          </article>
        ))}
      </section> : null}

      {trip.equipmentClaims.length > 0 ? <section className="trip-evidence" aria-label="Historical equipment context">
        <h3>Equipment context</h3>
        {trip.equipmentClaims.map((claim) => (
          <article key={claim.id}>
            <p><strong>{claim.equipmentId}</strong> · {offline ? 'Unknown offline' : `Last observed ${titleWords(claim.observation)}`}</p>
            <p>Connection {claim.connectionId} · Path {claim.pathId}</p>
            <p className="claim-line"><time dateTime={claim.lastCheckedAt}>Last checked {formatClock(claim.lastCheckedAt)}</time></p>
          </article>
        ))}
      </section> : null}

      {trip.exitGuidance ? (
        <section className="trip-module">
          <h3>Exit guidance</h3>
          <p><strong>{trip.exitGuidance.exitId}</strong> · {trip.exitGuidance.purpose}</p>
          {trip.exitGuidance.destinationScope ? <p>
            At {trip.exitGuidance.destinationScope.stationName} · Platform {trip.exitGuidance.destinationScope.platformId}
            {' · '}Equipment {trip.exitGuidance.destinationScope.equipmentId}
          </p> : null}
          <p>{trip.exitGuidance.verificationContext}</p>
          <p className="claim-line"><time dateTime={trip.exitGuidance.verifiedAt}>Verified {formatDate(trip.exitGuidance.verifiedAt)}</time><span>{trip.exitGuidance.limitations.join(' ')}</span></p>
        </section>
      ) : null}

      {trip.contingencies && trip.contingencies.length > 0 ? (
        <section className="trip-module">
          <h3>Previously verified contingency</h3>
          {trip.contingencies.map((contingency) => (
            <article key={contingency.id}>
              <p><strong>If: {contingency.trigger}</strong></p>
              <ol>{contingency.actions.map((action) => <li key={action}>{action}</li>)}</ol>
              <p>{contingency.verificationContext}</p>
              <p className="claim-line"><time dateTime={contingency.lastCheckedAt}>Last checked {formatClock(contingency.lastCheckedAt)}</time><span>{contingency.limitations.join(' ')}</span></p>
            </article>
          ))}
        </section>
      ) : null}
    </section>
  );
}

function ValidityContext({ trip }: { readonly trip: ActiveTripRecord }) {
  const { validity } = trip;
  const result = validity.result === 'current-itinerary' ? 'Current itinerary'
    : validity.result === 'future-itinerary' ? 'Future itinerary'
      : validity.result === 'reference-itinerary' ? 'Reference itinerary'
        : validity.result === 'untimed-structural-route' ? 'Untimed structural route' : 'Untimed structural path';
  return (
    <section className="trip-validity" aria-label="Trip reference and validity">
      <div className="trip-validity__primary">
        <strong>{result}</strong>
        <span>{patternLabel(validity.pattern)}</span>
        <span>Service date {formatServiceDate(validity.serviceDate)}</span>
      </div>
      <ScheduleContext schedule={validity.schedule} />
      {validity.patternBoundary ? <p>{validity.patternBoundary.explanation}</p> : null}
      {validity.warnings.length > 0 ? (
        <section className="trip-limitations"><h3>Warnings</h3>{validity.warnings.map((warning) => <p key={warning.id}>{warning.message} · Last checked {formatClock(warning.lastCheckedAt)}</p>)}</section>
      ) : null}
      {validity.vetoes.length > 0 ? (
        <section className="trip-limitations trip-limitations--blocking"><h3>Blocking limitations</h3>{validity.vetoes.map((veto) => <p key={veto.id}>{veto.message} · Last checked {formatClock(veto.lastCheckedAt)}</p>)}</section>
      ) : null}
    </section>
  );
}

function ScheduleContext({ schedule }: { readonly schedule: ActiveTripSchedule }) {
  if (schedule.kind === 'none') return <p>No stored schedule timing</p>;
  if (schedule.kind === 'quarantined') return <p>Stored schedule unavailable · {schedule.reason}</p>;
  if (schedule.kind === 'topology-only') {
    return <p>Topology only · no departure times · Last retrieved {formatDateTime(schedule.lastRetrievedAt)}</p>;
  }
  return (
    <div className="trip-schedule">
      <p><strong>{schedule.kind === 'current' ? 'Current schedule' : 'Stale reference'}</strong></p>
      {schedule.departures.map((departure) => <p key={`${departure.legId}:${departure.pointId}`}><strong>Scheduled {formatScheduledClock(departure.clockTime)}</strong></p>)}
      {schedule.kind === 'stale' ? <p>{schedule.staleCopy}</p> : null}
      <p>Last retrieved {formatDateTime(schedule.lastRetrievedAt)} · Effective {formatServiceDate(schedule.effectiveFrom)} to {formatServiceDate(schedule.effectiveUntil)}</p>
    </div>
  );
}

function TransferContext({ trip, transferId }: { readonly trip: ActiveTripRecord; readonly transferId: string }) {
  const transfer = trip.transfers.find(({ id }) => id === transferId);
  if (!transfer) return null;
  const station = trip.legs.flatMap(({ points }) => points).find(({ id }) => id === transfer.atPointId)?.stationName ?? 'transfer point';
  const incoming = trip.legs.find(({ id }) => id === transfer.incomingLegId);
  const outgoing = trip.legs.find(({ id }) => id === transfer.outgoingLegId);
  return (
    <section className="trip-transfer" aria-label={`Transfer at ${station}`}>
      <h5>Transfer at {station}</h5>
      <p>Incoming {incoming?.route.label}: {directionLabel(transfer.incomingDirection)} toward {transfer.incomingDestination}</p>
      <p>Outgoing {outgoing?.route.label}: {directionLabel(transfer.outgoingDirection)} toward {transfer.outgoingDestination}</p>
      <ol>{transfer.steps.map((step) => <li key={step}>{step}</li>)}</ol>
      {transfer.connectionState ? <p>{transfer.connectionState}</p> : null}
    </section>
  );
}

function pointState(index: number, cursor: number): 'Prior' | 'Current' | 'Next' | 'Upcoming' {
  if (index < cursor) return 'Prior';
  if (index === cursor) return 'Current';
  if (index === cursor + 1) return 'Next';
  return 'Upcoming';
}

function scopeLabel(scope: ActiveTripClaimScope, trip: ActiveTripRecord): string {
  if (scope.kind === 'trip') return `${trip.origin.name} to ${trip.destination.name}`;
  if (scope.kind === 'leg') return `${scope.routeId} ${directionLabel(scope.direction)} leg`;
  if (scope.kind === 'route') return `${scope.routeId} route`;
  if (scope.kind === 'direction') return `${scope.routeId} ${directionLabel(scope.direction)}`;
  if (scope.kind === 'station') return `${scope.routeId} at ${scope.stationId}, ${directionLabel(scope.direction)}`;
  return `${scope.routeId} from ${scope.fromStationId} to ${scope.toStationId}, ${directionLabel(scope.direction)}`;
}

function patternLabel(pattern: ActiveTripRecord['validity']['pattern']): string {
  if (pattern === 'typical-weekday') return 'Typical weekday';
  if (pattern === 'late-night') return 'Late night';
  if (pattern === 'unspecified') return 'Service pattern not retained';
  return 'Actual now at capture';
}

function formatServiceDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'long', day: 'numeric', year: 'numeric' })
    .format(new Date(`${value}T12:00:00.000Z`));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(new Date(value));
}

function formatClock(value: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true })
    .format(new Date(value));
}

function formatScheduledClock(value: string): string {
  const [hours, minutes] = value.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function titleWords(value: string): string {
  return value.replaceAll('-', ' ').replace(/^./u, (character) => character.toLocaleUpperCase('en-US'));
}
