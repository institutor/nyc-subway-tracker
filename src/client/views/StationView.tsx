import type { BoardEnvelopeDto } from '../api/client';
import type { Direction } from '../../shared/domain/types';
import type { StationChoice } from '../state/app-state';
import { sourceLabel } from '../components/ArrivalRow';
import { DirectionTrack } from '../components/DirectionTrack';
import { RouteToken } from '../components/RouteToken';
import { StatusBanner } from '../components/StatusBanner';
import { useBoardClock } from '../hooks/use-board-clock';

export function StationView({
  station,
  board,
  phase,
  filters,
  onFiltersChange,
  onRefresh,
}: {
  readonly station: StationChoice;
  readonly board?: BoardEnvelopeDto;
  readonly phase: 'idle' | 'loading' | 'ready' | 'error';
  readonly filters: { readonly routeIds: readonly string[]; readonly direction?: Direction };
  readonly onFiltersChange: (filters: { readonly routeIds: readonly string[]; readonly direction?: Direction }) => void;
  readonly onRefresh: () => void;
}) {
  const firstRow = board?.data?.directions.flatMap((direction) => [...direction.primary, ...direction.secondary])[0];
  const validThrough = firstRow?.validThrough ?? board?.serverTime ?? '1970-01-01T00:00:00.000Z';
  const reading = useBoardClock(board?.serverTime ?? validThrough, validThrough, undefined, board?.receivedAtMonotonicMs);
  const routeIds = board?.data?.station?.routeIds ?? [];
  const directions = board?.data?.directions.map(({ direction }) => direction) ?? [];
  const reversed = reverseDirection(filters.direction, directions);
  return (
    <section className="surface surface--station" aria-labelledby="station-heading">
      <header className="station-view__header">
        <p className="section-kicker">Station board</p>
        <h2 id="station-heading">{station.name}</h2>
        {board?.data?.station ? (
          <div className="route-cluster" aria-label="Station routes">
            {board.data.station.routeIds.map((routeId) => <RouteToken key={routeId} route={{ id: routeId, label: routeId }} />)}
          </div>
        ) : null}
      </header>

      {board?.demonstrationLabel ? <p className="surface-disclosure">{board.demonstrationLabel}</p> : null}
      {phase === 'loading' && !board ? <StationBoardSkeleton /> : null}
      {phase === 'error' ? <StatusBanner tone="warning"><p>Arrival information is unavailable. Try refreshing.</p></StatusBanner> : null}
      {board?.runtime.availability === 'locked' || (phase === 'ready' && board?.data === null)
        ? <StatusBanner tone="locked"><p>Live arrivals are not released yet.</p></StatusBanner> : null}

      {board?.data ? (
        <>
          <p className="board-mode">{board.data.mode === 'live' ? 'Live and expected arrivals' : board.data.mode === 'scheduled-fallback' ? 'Schedule fallback' : 'Arrival status'}</p>
          {board.data.alerts.map((alert) => (
            <section className="service-alert" aria-label="Service alert" key={alert.id}>
              <span className="service-alert__mark" aria-hidden="true">!</span>
              <div>
                <h3>Service alert</h3>
                <p>{alert.text}</p>
                <p className="claim-line"><span>{alert.demonstrationLabel}</span><span>{sourceLabel(alert.provenance)}</span></p>
              </div>
            </section>
          ))}
          <div className="station-board">
            {board.data.directions.map((direction) => <DirectionTrack key={direction.direction} direction={direction} reading={reading} />)}
          </div>
        </>
      ) : null}

      <div className="context-dock" role="toolbar" aria-label="Board controls">
        <button type="button" aria-label="Refresh train times" onClick={onRefresh}>
          <span aria-hidden="true">↻</span><span>Refresh</span>
        </button>
        <div className="context-dock__routes" aria-label="Route filter">
          {routeIds.map((routeId) => {
            const pressed = filters.routeIds.length === 1 && filters.routeIds[0] === routeId;
            return (
              <button
                key={routeId}
                type="button"
                aria-label={`Show only ${routeId} trains`}
                aria-pressed={pressed}
                onClick={() => onFiltersChange({ routeIds: pressed ? [] : [routeId], ...(filters.direction ? { direction: filters.direction } : {}) })}
              >
                <RouteToken route={{ id: routeId, label: routeId }} compact />
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-label={filters.direction ? `Show ${filters.direction} only` : `Show ${directions[0] ?? 'selected direction'} only`}
          aria-pressed={filters.direction !== undefined}
          onClick={() => onFiltersChange({ routeIds: filters.routeIds, ...(filters.direction ? {} : directions[0] ? { direction: directions[0] } : {}) })}
        >
          <span aria-hidden="true">↕</span><span>{filters.direction ? shortDirection(filters.direction) : 'Both'}</span>
        </button>
        <button
          type="button"
          aria-label="Reverse direction"
          onClick={() => onFiltersChange({ routeIds: filters.routeIds, ...(reversed ? { direction: reversed } : {}) })}
        >
          <span aria-hidden="true">⇅</span><span>Reverse</span>
        </button>
      </div>
    </section>
  );
}

function StationBoardSkeleton() {
  return (
    <div className="station-card station-card--skeleton" aria-label="Station arrivals loading" aria-busy="true">
      <span className="skeleton-line skeleton-line--wide" />
      <div className="direction-skeleton"><span className="skeleton-token" /><span className="skeleton-line" /><span className="skeleton-time" /></div>
      <div className="direction-skeleton"><span className="skeleton-token" /><span className="skeleton-line" /><span className="skeleton-time" /></div>
    </div>
  );
}

function reverseDirection(current: Direction | undefined, available: readonly Direction[]): Direction | undefined {
  const source = current ?? available[0];
  if (source === 'northbound') return 'southbound';
  if (source === 'southbound') return 'northbound';
  if (source === 'eastbound') return 'westbound';
  if (source === 'westbound') return 'eastbound';
  if (source === 'inbound') return 'outbound';
  if (source === 'outbound') return 'inbound';
  return available[1] ?? available[0];
}

function shortDirection(direction: Direction): string {
  if (direction === 'northbound') return 'North';
  if (direction === 'southbound') return 'South';
  if (direction === 'eastbound') return 'East';
  if (direction === 'westbound') return 'West';
  if (direction === 'inbound') return 'Inbound';
  if (direction === 'outbound') return 'Outbound';
  return 'Unknown';
}
