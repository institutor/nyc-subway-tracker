import { useMemo, useState } from 'react';

import { compareCanonicalIdentity } from '../../shared/domain/canonical';
import type { Direction, SavedRecord } from '../../shared/domain/types';
import type { BoardEnvelopeDto, CatalogComplexDto } from '../api/client';
import { formatClaimTime, sourceLabel } from '../components/ArrivalRow';
import { RouteToken } from '../components/RouteToken';
import { StatusBanner } from '../components/StatusBanner';

export function SavedView({
  records,
  catalog,
  boards,
  onOpen,
  onRefreshAll,
  onSave,
  onPause,
  onReset,
  onDelete,
  offline = false,
}: {
  readonly records: readonly SavedRecord[];
  readonly catalog: readonly CatalogComplexDto[];
  readonly boards: ReadonlyMap<string, BoardEnvelopeDto>;
  readonly onOpen: (record: SavedRecord) => void;
  readonly onRefreshAll: (record: SavedRecord) => void;
  readonly onSave: (record: SavedRecord) => void;
  readonly onPause: (id: string, state: SavedRecord['state']) => void;
  readonly onReset: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly offline?: boolean;
}) {
  const ordered = useMemo(() => [...records].sort(compareSaved), [records]);
  const [editingId, setEditingId] = useState<string>();
  const [draft, setDraft] = useState<SavedRecord>();

  return (
    <section className="surface surface--saved" aria-labelledby="saved-heading">
      <div className="surface-heading">
        <div>
          <p className="section-kicker">On this device</p>
          <h2 id="saved-heading" className="surface-title">Saved</h2>
        </div>
      </div>
      <p className="quiet-copy">Your station choices stay on this device. They never store arrivals, disruptions, elevator results, or platform guidance.</p>

      {ordered.length === 0 ? (
        <StatusBanner tone="locked"><p>No saved stations yet. Open a station board to save exact rider intent.</p></StatusBanner>
      ) : (
        <div className="saved-stack">
          {ordered.map((record) => {
            const complex = catalog.find(({ id }) => id === record.complexId);
            const constituent = complex?.constituents.find(({ id }) => id === record.constituentId);
            const name = complex?.name ?? record.constituentId;
            const isEditing = editingId === record.id && draft?.id === record.id;
            const board = boards.get(record.id);
            const retainedHistorical = offline || board?.cacheState === 'historical';
            return (
              <article className="saved-card" key={record.id} aria-labelledby={`saved-${record.id}-heading`}>
                <header className="saved-card__header">
                  <div>
                    <p className="section-kicker">{record.state === 'active' ? 'Active' : 'Paused'}</p>
                    <h3 id={`saved-${record.id}-heading`}>{name}</h3>
                    {constituent && constituent.name !== name ? <p>{constituent.name}</p> : null}
                  </div>
                  <div className="route-cluster" aria-label={`${name} saved route filters`}>
                    {(record.routeFilters.length > 0 ? record.routeFilters : complex?.routeIds ?? []).map((routeId) => (
                      <RouteToken route={{ id: routeId, label: routeId }} compact key={routeId} />
                    ))}
                  </div>
                </header>

                {isEditing ? (
                  <SavedEditor
                    name={name}
                    record={draft}
                    routeIds={complex?.routeIds ?? record.routeFilters}
                    onChange={setDraft}
                    onCancel={() => { setEditingId(undefined); setDraft(undefined); }}
                    onCommit={() => {
                      onSave({ ...draft, routeFilters: [...draft.routeFilters].sort(compareCanonicalIdentity) });
                      setEditingId(undefined);
                      setDraft(undefined);
                    }}
                  />
                ) : (
                  <SavedIntent record={record} catalog={catalog} />
                )}

                {board?.data?.alerts.length ? (
                  <section className="saved-card__alerts" aria-label={`${name} ${retainedHistorical ? 'historical ' : ''}service alerts`}>
                    <h4>{retainedHistorical ? 'Historical service changes' : 'Service changes'}</h4>
                    {board.data.alerts.map((alert) => (
                      <div key={alert.id}>
                        <p><strong>{alert.routeIds.join(', ')}</strong> {alert.text}</p>
                        <p className="claim-line">
                          <span>{alert.demonstrationLabel}</span><span>{sourceLabel(alert.provenance)}</span>
                          {retainedHistorical ? <time dateTime={alert.provenance.observedAt}>Last checked {formatClaimTime(alert.provenance.observedAt)}</time> : null}
                        </p>
                      </div>
                    ))}
                  </section>
                ) : null}

                <div className="saved-card__actions">
                  <button type="button" onClick={() => onOpen(record)}>Open {name}</button>
                  <button type="button" aria-label={`Refresh all ${name} routes and directions`} onClick={() => onRefreshAll(record)} disabled={offline}>Refresh all</button>
                  {!isEditing ? (
                    <button
                      type="button"
                      aria-label={`Edit saved station ${name}`}
                      onClick={() => { setEditingId(record.id); setDraft(cloneSaved(record)); }}
                    >Edit saved station</button>
                  ) : null}
                  <button
                    type="button"
                    aria-label={`${record.state === 'active' ? 'Pause' : 'Resume'} personalization for ${name}`}
                    onClick={() => onPause(record.id, record.state === 'active' ? 'paused' : 'active')}
                  >{record.state === 'active' ? 'Pause personalization' : 'Resume personalization'}</button>
                  <button type="button" aria-label={`Reset station preferences for ${name}`} onClick={() => onReset(record.id)}>Reset station preferences</button>
                  <button type="button" className="danger-action" aria-label={`Delete saved station ${name}`} onClick={() => onDelete(record.id)}>Delete saved station</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SavedIntent({ record, catalog }: { readonly record: SavedRecord; readonly catalog: readonly CatalogComplexDto[] }) {
  const destination = record.commonDestination
    ? catalog.find(({ id }) => id === record.commonDestination?.complexId)?.name ?? record.commonDestination.constituentId
    : undefined;
  return (
    <dl className="saved-intent">
      <div><dt>Personalization</dt><dd>{record.state === 'active' ? 'Active' : 'Paused'}</dd></div>
      {record.preferredEntrance ? <div><dt>Preferred entrance</dt><dd>{record.preferredEntrance.entranceId}</dd></div> : null}
      {record.preferredRide ? <div><dt>Ride</dt><dd>{titleDirection(record.preferredRide.direction)} toward {record.preferredRide.actualDestination}</dd></div> : null}
      <div><dt>Routes</dt><dd>{record.routeFilters.length ? record.routeFilters.join(', ') : 'All station routes'}</dd></div>
      <div><dt>Accessible Route Only</dt><dd>{record.accessibleRouteOnly ? 'On' : 'Off'}</dd></div>
      {destination ? <div><dt>Common destination</dt><dd>{destination}</dd></div> : null}
      {record.timeWindow ? <div><dt>Rider-entered window</dt><dd>{record.timeWindow.startsAt}–{record.timeWindow.endsAt}, days {record.timeWindow.weekdays.join(', ')}</dd></div> : null}
    </dl>
  );
}

function SavedEditor({
  name,
  record,
  routeIds,
  onChange,
  onCancel,
  onCommit,
}: {
  readonly name: string;
  readonly record: SavedRecord;
  readonly routeIds: readonly string[];
  readonly onChange: (record: SavedRecord) => void;
  readonly onCancel: () => void;
  readonly onCommit: () => void;
}) {
  return (
    <form className="saved-editor" onSubmit={(event) => { event.preventDefault(); onCommit(); }}>
      <fieldset>
        <legend>Route filters</legend>
        <div className="saved-editor__routes">
          {routeIds.map((routeId) => (
            <label key={routeId}>
              <input
                type="checkbox"
                checked={record.routeFilters.includes(routeId)}
                onChange={(event) => onChange({
                  ...record,
                  routeFilters: event.currentTarget.checked
                    ? [...record.routeFilters, routeId]
                    : record.routeFilters.filter((value) => value !== routeId),
                })}
              />
              Include {routeId}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="check-control">
        <input type="checkbox" checked={record.accessibleRouteOnly} onChange={(event) => onChange({ ...record, accessibleRouteOnly: event.currentTarget.checked })} />
        Accessible Route Only
      </label>
      {record.preferredRide ? (
        <>
          <label>Preferred direction
            <select value={record.preferredRide.direction} onChange={(event) => onChange({
              ...record,
              preferredRide: { ...record.preferredRide!, direction: event.currentTarget.value as Direction },
            })}>
              {['northbound', 'southbound', 'eastbound', 'westbound', 'inbound', 'outbound'].map((direction) => <option value={direction} key={direction}>{titleDirection(direction)}</option>)}
            </select>
          </label>
          <label>Actual destination
            <input value={record.preferredRide.actualDestination} onChange={(event) => onChange({ ...record, preferredRide: { ...record.preferredRide!, actualDestination: event.currentTarget.value } })} />
          </label>
        </>
      ) : null}
      <div className="saved-editor__actions">
        <button type="submit" aria-label={`Save changes for ${name}`}>Save changes</button>
        <button type="button" aria-label={`Cancel editing ${name}`} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function compareSaved(left: SavedRecord, right: SavedRecord): number {
  return compareCanonicalIdentity(left.complexId, right.complexId)
    || compareCanonicalIdentity(left.constituentId, right.constituentId)
    || compareCanonicalIdentity(left.id, right.id);
}

function cloneSaved(record: SavedRecord): SavedRecord {
  return structuredClone(record);
}

function titleDirection(value: string): string {
  return value.charAt(0).toLocaleUpperCase('en-US') + value.slice(1);
}
