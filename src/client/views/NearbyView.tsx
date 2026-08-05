import type { CatalogComplexDto, NearbyEnvelopeDto } from '../api/client';
import type { StationChoice } from '../state/app-state';
import { StationCard, type NearbyBoardState, type StationSelection } from '../components/StationCard';
import { StatusBanner } from '../components/StatusBanner';

export function NearbyView({
  phase,
  response,
  boards,
  savedChoices,
  pickerChoices,
  fallback,
  pickerOpen,
  onSelect,
  onRetryLocation,
  onOpenPicker,
  onRefresh,
}: {
  readonly phase: 'idle' | 'loading' | 'ready' | 'error';
  readonly response?: NearbyEnvelopeDto;
  readonly boards: ReadonlyMap<string, NearbyBoardState>;
  readonly savedChoices: readonly StationChoice[];
  readonly pickerChoices: readonly CatalogComplexDto[];
  readonly fallback?: 'denied' | 'failed';
  readonly pickerOpen: boolean;
  readonly onSelect: StationSelection;
  readonly onRetryLocation: () => void;
  readonly onOpenPicker: () => void;
  readonly onRefresh: () => void;
}) {
  const showSaved = Boolean(fallback) && savedChoices.length > 0 && !pickerOpen;
  const showPicker = pickerOpen || (Boolean(fallback) && savedChoices.length === 0);
  return (
    <section className="surface surface--nearby" aria-labelledby="nearby-heading">
      <div className="surface-heading">
        <div>
          <p className="section-kicker">Nearest useful subway</p>
          <h2 id="nearby-heading" className="surface-title">Nearby</h2>
        </div>
      </div>

      {fallback ? (
        <StatusBanner tone="warning" actions={(
          <>
            {fallback === 'failed' ? <button type="button" onClick={onRetryLocation}>Try location again</button> : null}
            <button type="button" onClick={onOpenPicker}>Choose a station</button>
          </>
        )}>
          <p>{fallback === 'failed'
            ? 'Location is unavailable. Choose a saved station or try again.'
            : 'Location permission is off. Enable it in your device settings, or choose a station.'}</p>
        </StatusBanner>
      ) : null}

      {showSaved ? (
        <section className="choice-panel" aria-labelledby="saved-choice-heading">
          <h3 id="saved-choice-heading">Saved stations</h3>
          <p>Choose which station to open.</p>
          <div className="choice-list">
            {savedChoices.map((station) => (
              <button key={`${station.complexId}:${station.constituentId}`} type="button" aria-label={`${station.name} saved station`} onClick={() => onSelect(station, { routeIds: [] })}>
                <strong>{station.name}</strong><span>Open board</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {showPicker ? (
        <section className="station-picker" aria-labelledby="station-picker-heading">
          <h3 id="station-picker-heading">Choose a station</h3>
          <p>Location is optional. Pick a station without typing.</p>
          <div className="choice-list">
            {pickerChoices.flatMap((complex) => complex.constituents.map((constituent) => (
                <button
                  key={`${complex.id}:${constituent.id}`}
                  type="button"
                  aria-label={stationChoiceLabel(complex.name, constituent.name)}
                  onClick={() => onSelect({ complexId: complex.id, constituentId: constituent.id, name: complex.name }, { routeIds: [] })}
                >
                  <strong>{complex.name}</strong>
                  <span>{constituent.name === complex.name ? complex.routeIds.join(' · ') || 'Subway station' : constituent.name}</span>
                </button>
            )))}
          </div>
        </section>
      ) : null}

      {!fallback && !showPicker ? (
        <NearbyResults phase={phase} response={response} boards={boards} pickerChoices={pickerChoices} onSelect={onSelect} />
      ) : null}
      <div className="context-dock nearby-context-dock" role="toolbar" aria-label="Nearby controls">
        <button type="button" aria-label="Refresh nearby stations" onClick={onRefresh} disabled={fallback === 'denied'}>
          <span aria-hidden="true">↻</span><span>Refresh</span>
        </button>
        <button type="button" onClick={onOpenPicker}>
          <span aria-hidden="true">⌖</span><span>Choose a station</span>
        </button>
      </div>
    </section>
  );
}

function NearbyResults({
  phase,
  response,
  boards,
  pickerChoices,
  onSelect,
}: {
  readonly phase: 'idle' | 'loading' | 'ready' | 'error';
  readonly response?: NearbyEnvelopeDto;
  readonly boards: ReadonlyMap<string, NearbyBoardState>;
  readonly pickerChoices: readonly CatalogComplexDto[];
  readonly onSelect: StationSelection;
}) {
  if (!response && (phase === 'idle' || phase === 'loading')) return <NearbySkeleton />;
  if (!response || phase === 'error') {
    return <StatusBanner tone="warning"><p>Nearby subway information is unavailable. Try again.</p></StatusBanner>;
  }
  if (response.runtime.availability === 'locked' || response.data === null) {
    return <StatusBanner tone="locked"><p>Nearby live information is not released yet.</p></StatusBanner>;
  }
  if (response.data.kind === 'picker') {
    return (
      <section className="station-picker" aria-labelledby="walk-picker-heading">
        <h3 id="walk-picker-heading">Choose a station</h3>
        <p>Comparable walking information is unavailable, so no station was ranked automatically.</p>
        <div className="choice-list">
          {response.data.picker.options.flatMap((option) => {
            const complex = pickerChoices.find(({ id }) => id === option.complexId);
            if (!complex) return [];
            return complex.constituents.map((constituent) => (
              <button
                key={`${option.complexId}:${constituent.id}`}
                type="button"
                aria-label={stationChoiceLabel(option.complexName, constituent.name)}
                onClick={() => onSelect(
                  { complexId: option.complexId, constituentId: constituent.id, name: option.complexName },
                  { routeIds: [] },
                )}
              >
                <strong>{option.complexName}</strong>
                <span>{option.entranceAvailability === 'confirmed'
                  ? constituent.name === option.complexName ? 'Station details' : constituent.name
                  : option.message}</span>
              </button>
            ));
          })}
        </div>
      </section>
    );
  }
  return (
    <div className="station-stack" aria-live="polite">
      {response.demonstrationLabel ? <p className="surface-disclosure">{response.demonstrationLabel}</p> : null}
      {response.data.cards.map((card) => <StationCard key={card.complexId} card={card} boards={boards} onSelect={onSelect} />)}
    </div>
  );
}

function stationChoiceLabel(complexName: string, constituentName: string): string {
  return constituentName === complexName ? complexName : `${complexName} — ${constituentName}`;
}

export function NearbySkeleton() {
  return (
    <div className="station-stack" data-testid="nearby-skeleton" aria-label="Nearby subway stations loading" aria-busy="true">
      {[0, 1, 2].map((index) => (
        <div className="station-card station-card--skeleton" key={index}>
          <span className="skeleton-line skeleton-line--wide" />
          <span className="skeleton-line" />
          <div className="direction-skeleton"><span className="skeleton-token" /><span className="skeleton-line" /><span className="skeleton-time" /></div>
          <div className="direction-skeleton"><span className="skeleton-token" /><span className="skeleton-line" /><span className="skeleton-time" /></div>
        </div>
      ))}
    </div>
  );
}
