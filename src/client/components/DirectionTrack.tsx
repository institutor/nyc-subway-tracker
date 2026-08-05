import type { BoardDirectionDto } from '../api/client';
import type { BoardClockReading } from '../hooks/use-board-clock';
import { ArrivalRow } from './ArrivalRow';

export function directionLabel(direction: BoardDirectionDto['direction']): string {
  if (direction === 'northbound') return 'Uptown / Northbound';
  if (direction === 'southbound') return 'Downtown / Southbound';
  if (direction === 'eastbound') return 'Eastbound';
  if (direction === 'westbound') return 'Westbound';
  if (direction === 'inbound') return 'Inbound';
  if (direction === 'outbound') return 'Outbound';
  return 'Direction not confirmed';
}

export function DirectionTrack({
  direction,
  reading,
  historical = false,
}: {
  readonly direction: BoardDirectionDto;
  readonly reading: BoardClockReading;
  readonly historical?: boolean;
}) {
  const label = directionLabel(direction.direction);
  return (
    <section className="direction-track" aria-label={`${label} trains`}>
      <div className="direction-track__heading">
        <span className="track-notch" aria-hidden="true" />
        <h3>{label}</h3>
      </div>
      <div className="direction-track__rows">
        {direction.primary.length > 0
          ? direction.primary.map((arrival) => <ArrivalRow key={arrival.id} arrival={arrival} reading={reading} historical={historical} />)
          : <p className="empty-track">No supported arrival times for this direction.</p>}
      </div>
      {direction.secondary.length > 0 ? (
        <section className="secondary-track" aria-label="Additional train context">
          <h4>Holding / uncertain</h4>
          {direction.secondary.map((arrival) => (
            <ArrivalRow key={arrival.id} arrival={arrival} reading={reading} secondary historical={historical} />
          ))}
        </section>
      ) : null}
      {direction.explanations.length > 0 ? (
        <ul className="explanation-list" aria-label="Direction context">
          {direction.explanations.map((explanation) => <li key={`${explanation.code}:${explanation.message}`}>{explanation.message}</li>)}
        </ul>
      ) : null}
    </section>
  );
}
