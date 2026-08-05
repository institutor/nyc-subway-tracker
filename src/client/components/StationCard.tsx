import type { BoardEnvelopeDto, NearbyDirectionDto, NearbyStationCardDto } from '../api/client';
import type { StationChoice } from '../state/app-state';
import { useBoardClock } from '../hooks/use-board-clock';
import { directionLabel, DirectionTrack } from './DirectionTrack';
import { RouteToken } from './RouteToken';
import { sourceLabel } from './ArrivalRow';

export function boardRequestKey(direction: NearbyDirectionDto): string {
  return `${direction.constituentId}\u0000${direction.direction}\u0000${direction.routeIds.join('\u0000')}`;
}

export function StationCard({
  card,
  boards,
  onSelect,
}: {
  readonly card: NearbyStationCardDto;
  readonly boards: ReadonlyMap<string, BoardEnvelopeDto>;
  readonly onSelect: (station: StationChoice) => void;
}) {
  const first = card.directions[0];
  return (
    <article className="station-card" data-testid="nearby-station-card">
      <header className="station-card__header">
        <div>
          <p className="station-card__walk">{formatWalkRange(card.rankingRange)} walk</p>
          <h2>{card.complexName}</h2>
          {card.walkComparison ? <p className="quiet-copy">{card.walkComparison}</p> : null}
        </div>
        {first ? (
          <button
            className="text-action"
            type="button"
            onClick={() => onSelect({ complexId: card.complexId, constituentId: first.constituentId, name: card.complexName })}
          >
            Full board
          </button>
        ) : null}
      </header>
      <div className="station-card__spine" aria-hidden="true" />
      {card.directions.map((direction) => (
        <NearbyDirection
          key={boardRequestKey(direction)}
          direction={direction}
          board={boards.get(boardRequestKey(direction))}
        />
      ))}
    </article>
  );
}

function NearbyDirection({ direction, board }: { readonly direction: NearbyDirectionDto; readonly board?: BoardEnvelopeDto }) {
  const exactDirection = board?.data?.station?.id === direction.constituentId
    ? board.data.directions.find((candidate) => candidate.direction === direction.direction)
    : undefined;
  const validThrough = exactDirection?.primary[0]?.validThrough
    ?? exactDirection?.secondary[0]?.validThrough
    ?? board?.serverTime
    ?? '1970-01-01T00:00:00.000Z';
  const reading = useBoardClock(board?.serverTime ?? validThrough, validThrough, undefined, board?.receivedAtMonotonicMs);
  return (
    <section className="nearby-direction" aria-label={`${directionLabel(direction.direction)} nearby service`}>
      <div className="nearby-direction__summary">
        <div className="route-cluster" aria-label="Routes">
          {direction.routeIds.map((routeId) => <RouteToken key={routeId} route={{ id: routeId, label: routeId }} compact />)}
        </div>
        <p><strong>To {direction.actualDestination}</strong></p>
        <p className="entrance-copy">Enter at {direction.selectedEntrance.publicDescription}</p>
        <p className="quiet-copy">{formatWalkRange(direction.selectedEntrance.walkRange)} walk to this service</p>
      </div>
      {direction.arrivalState === 'unavailable' ? <p className="unavailable-copy">Arrival information is unavailable.</p>
        : !board ? <DirectionSkeleton label={directionLabel(direction.direction)} />
          : board.runtime.availability === 'locked' || board.data === null
            ? <p className="unavailable-copy">Live arrivals are not released yet.</p>
            : exactDirection ? <DirectionTrack direction={exactDirection} reading={reading} />
              : <p className="unavailable-copy">Arrival information is unavailable for this exact platform.</p>}
      {board?.data?.alerts.map((alert) => (
        <section className="inline-alert" aria-label="Service alert" key={alert.id}>
          <strong>Service alert</strong>
          <p>{alert.text}</p>
          <p className="claim-line"><span>{alert.demonstrationLabel}</span><span>{sourceLabel(alert.provenance)}</span></p>
        </section>
      ))}
    </section>
  );
}

function DirectionSkeleton({ label }: { readonly label: string }) {
  return (
    <section className="direction-skeleton" aria-label={`${label} arrivals loading`} aria-busy="true">
      <span className="skeleton-token" />
      <span className="skeleton-line" />
      <span className="skeleton-time" />
    </section>
  );
}

function formatWalkRange(range: { readonly minimumSeconds: number; readonly maximumSeconds: number }): string {
  const start = Math.max(1, Math.ceil(range.minimumSeconds / 60));
  const end = Math.max(start, Math.ceil(range.maximumSeconds / 60));
  return start === end ? `${start} min` : `${start}–${end} min`;
}
