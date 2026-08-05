import type { ArrivalDto, ProvenanceDto } from '../api/client';
import { formatArrivalDisplay, type BoardClockReading } from '../hooks/use-board-clock';
import { RouteToken } from './RouteToken';

export function ArrivalRow({
  arrival,
  reading,
  secondary = false,
  historical = false,
}: {
  readonly arrival: ArrivalDto;
  readonly reading: BoardClockReading;
  readonly secondary?: boolean;
  readonly historical?: boolean;
}) {
  const display = historical
    ? historicalDisplay(arrival)
    : arrival.kind === 'live'
    ? formatArrivalDisplay({ kind: arrival.kind, displayAuthority: arrival.displayAuthority, at: arrival.at }, reading)
    : arrival.kind === 'expected'
      ? formatArrivalDisplay({ kind: arrival.kind, displayAuthority: arrival.displayAuthority, range: arrival.range }, reading)
      : arrival.kind === 'scheduled'
        ? formatArrivalDisplay({ kind: arrival.kind, displayAuthority: arrival.displayAuthority, at: arrival.at }, reading)
        : formatArrivalDisplay({ kind: arrival.kind, displayAuthority: arrival.displayAuthority }, reading);
  const status = historical ? 'Historical arrival'
    : arrival.kind === 'live' ? 'Live'
    : arrival.kind === 'expected' ? 'Expected'
      : arrival.kind === 'scheduled' ? 'Scheduled'
        : arrival.kind === 'holding' ? 'Position not advancing'
          : 'Precision unavailable';
  return (
    <article className={`arrival-row${secondary ? ' arrival-row--secondary' : ''}`} data-testid={secondary ? 'secondary-arrival' : 'primary-arrival'}>
      <div className="arrival-row__route"><RouteToken route={arrival.route} /></div>
      <div className="arrival-row__destination">
        <span className="arrival-row__destination-name">{arrival.destination}</span>
        <span className="claim-kind">{status}</span>
      </div>
      <strong className="arrival-row__time">{display}</strong>
      <div className="claim-line">
        <span>{arrival.demonstrationLabel}</span>
        <span>{sourceLabel(arrival.provenance)}</span>
        <time dateTime={arrival.provenance.observedAt}>Observed {formatClaimTime(arrival.provenance.observedAt)}</time>
        {arrival.displayAuthority !== 'status-only'
          ? <time dateTime={arrival.validThrough}>Valid through {formatClaimTime(arrival.validThrough)}</time>
          : null}
      </div>
      {arrival.kind === 'holding'
        ? <p className="arrival-context">Holding is status only. Last supported at {formatClaimTime(arrival.lastSupportedAt)}.</p>
        : null}
      {arrival.kind === 'uncertain' ? <p className="arrival-context">{arrival.reason}</p> : null}
    </article>
  );
}

export function sourceLabel(provenance: ProvenanceDto): string {
  if (provenance.source === 'gtfs-rt') return 'MTA real-time';
  if (provenance.source === 'alerts') return 'MTA service alerts';
  if (provenance.source === 'supplemented-gtfs') return 'MTA supplemented schedule';
  if (provenance.source === 'regular-gtfs') return 'MTA schedule';
  if (provenance.source === 'practical-walk') return 'Audited walking data';
  if (provenance.source === 'entrances') return 'MTA station data';
  if (provenance.source === 'equipment') return 'MTA equipment data';
  return 'Source unavailable';
}

export function formatClaimTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(new Date(value));
}

function historicalDisplay(arrival: ArrivalDto): string {
  if (arrival.kind === 'live' || arrival.kind === 'scheduled') return `Was due ${formatClaimTime(arrival.at)}`;
  if (arrival.kind === 'expected') {
    return `Was expected ${formatClaimTime(arrival.range.startsAt)}–${formatClaimTime(arrival.range.endsAt)}`;
  }
  return 'Historical status';
}
