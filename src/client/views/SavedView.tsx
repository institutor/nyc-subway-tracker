import { useMemo, useState } from 'react';

import { compareCanonicalIdentity } from '../../shared/domain/canonical';
import type { Direction, SavedRecord } from '../../shared/domain/types';
import type { BoardEnvelopeDto, CatalogComplexDto } from '../api/client';
import { RouteToken } from '../components/RouteToken';
import { ServiceAlertTruth } from '../components/ServiceAlertTruth';
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
                    catalog={catalog}
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
                      <ServiceAlertTruth alert={alert} historical={retainedHistorical} headingLevel={5} showRoutes key={alert.id} />
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
  catalog,
  onChange,
  onCancel,
  onCommit,
}: {
  readonly name: string;
  readonly record: SavedRecord;
  readonly routeIds: readonly string[];
  readonly catalog: readonly CatalogComplexDto[];
  readonly onChange: (record: SavedRecord) => void;
  readonly onCancel: () => void;
  readonly onCommit: () => void;
}) {
  const stationChoices = catalog.flatMap((complex) => complex.constituents.map((constituent) => ({
    value: stationChoiceValue(complex.id, constituent.id),
    complexId: complex.id,
    constituentId: constituent.id,
    label: constituent.name === complex.name ? complex.name : `${complex.name} — ${constituent.name}`,
  })));
  const canCommit = (record.preferredEntrance === undefined || record.preferredEntrance.entranceId.trim().length > 0)
    && (record.preferredRide === undefined || record.preferredRide.actualDestination.trim().length > 0)
    && (record.timeWindow === undefined || (
      record.timeWindow.weekdays.length > 0 && record.timeWindow.startsAt !== record.timeWindow.endsAt
    ));

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

      <fieldset>
        <legend>Preferred entrance</legend>
        <label className="check-control">
          <input
            type="checkbox"
            checked={record.preferredEntrance !== undefined}
            onChange={(event) => onChange({
              ...record,
              ...(event.currentTarget.checked
                ? { preferredEntrance: { entranceId: '', direction: 'northbound' } }
                : { preferredEntrance: undefined }),
            })}
          />
          Use preferred entrance
        </label>
        {record.preferredEntrance ? (
          <>
            <label>Preferred entrance ID
              <input
                required
                value={record.preferredEntrance.entranceId}
                onChange={(event) => onChange({
                  ...record,
                  preferredEntrance: { ...record.preferredEntrance!, entranceId: event.currentTarget.value },
                })}
              />
            </label>
            <label>Preferred entrance direction
              <DirectionSelect
                value={record.preferredEntrance.direction}
                onChange={(direction) => onChange({
                  ...record,
                  preferredEntrance: { ...record.preferredEntrance!, direction },
                })}
              />
            </label>
          </>
        ) : null}
      </fieldset>

      <fieldset>
        <legend>Preferred ride</legend>
        <label className="check-control">
          <input
            type="checkbox"
            checked={record.preferredRide !== undefined}
            onChange={(event) => onChange({
              ...record,
              ...(event.currentTarget.checked
                ? { preferredRide: { direction: 'northbound', actualDestination: '' } }
                : { preferredRide: undefined }),
            })}
          />
          Use preferred ride
        </label>
      {record.preferredRide ? (
        <>
          <label>Preferred direction
            <DirectionSelect value={record.preferredRide.direction} onChange={(direction) => onChange({
              ...record,
              preferredRide: { ...record.preferredRide!, direction },
            })} />
          </label>
          <label>Preferred actual destination
            <input required value={record.preferredRide.actualDestination} onChange={(event) => onChange({ ...record, preferredRide: { ...record.preferredRide!, actualDestination: event.currentTarget.value } })} />
          </label>
        </>
      ) : null}
      </fieldset>

      <fieldset>
        <legend>Common destination</legend>
        <label className="check-control">
          <input
            type="checkbox"
            checked={record.commonDestination !== undefined}
            disabled={stationChoices.length === 0}
            onChange={(event) => {
              const first = stationChoices[0];
              onChange({
                ...record,
                ...(event.currentTarget.checked && first
                  ? { commonDestination: { complexId: first.complexId, constituentId: first.constituentId } }
                  : { commonDestination: undefined }),
              });
            }}
          />
          Use common destination
        </label>
        {record.commonDestination ? (
          <label>Common destination station
            <select
              value={stationChoiceValue(record.commonDestination.complexId, record.commonDestination.constituentId)}
              onChange={(event) => {
                const choice = stationChoices.find(({ value }) => value === event.currentTarget.value);
                if (choice) onChange({ ...record, commonDestination: { complexId: choice.complexId, constituentId: choice.constituentId } });
              }}
            >
              {stationChoices.map((choice) => <option value={choice.value} key={choice.value}>{choice.label}</option>)}
            </select>
          </label>
        ) : null}
      </fieldset>

      <fieldset>
        <legend>Commute window</legend>
        <label className="check-control">
          <input
            type="checkbox"
            checked={record.timeWindow !== undefined}
            onChange={(event) => onChange({
              ...record,
              ...(event.currentTarget.checked
                ? { timeWindow: { weekdays: [1, 2, 3, 4, 5], startsAt: '08:00', endsAt: '09:00' } }
                : { timeWindow: undefined }),
            })}
          />
          Use commute window
        </label>
        {record.timeWindow ? (
          <>
            <div className="saved-editor__weekdays" role="group" aria-label="Commute weekdays">
              {WEEKDAYS.map(({ value, label }) => (
                <label key={value}>
                  <input
                    type="checkbox"
                    checked={record.timeWindow!.weekdays.includes(value)}
                    onChange={(event) => onChange({
                      ...record,
                      timeWindow: {
                        ...record.timeWindow!,
                        weekdays: (event.currentTarget.checked
                          ? [...record.timeWindow!.weekdays, value]
                          : record.timeWindow!.weekdays.filter((weekday) => weekday !== value))
                          .sort((left, right) => left - right),
                      },
                    })}
                  />
                  {label}
                </label>
              ))}
            </div>
            <label>Commute window starts
              <input type="time" required value={record.timeWindow.startsAt} onChange={(event) => onChange({
                ...record,
                timeWindow: { ...record.timeWindow!, startsAt: event.currentTarget.value },
              })} />
            </label>
            <label>Commute window ends
              <input type="time" required value={record.timeWindow.endsAt} onChange={(event) => onChange({
                ...record,
                timeWindow: { ...record.timeWindow!, endsAt: event.currentTarget.value },
              })} />
            </label>
          </>
        ) : null}
      </fieldset>

      <label>Personalization state
        <select value={record.state} onChange={(event) => onChange({ ...record, state: event.currentTarget.value as SavedRecord['state'] })}>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
        </select>
      </label>
      <div className="saved-editor__actions">
        <button type="submit" aria-label={`Save changes for ${name}`} disabled={!canCommit}>Save changes</button>
        <button type="button" aria-label={`Cancel editing ${name}`} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function DirectionSelect({ value, onChange }: { readonly value: Direction; readonly onChange: (direction: Direction) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(event.currentTarget.value as Direction)}>
      {DIRECTIONS.map((direction) => <option value={direction} key={direction}>{titleDirection(direction)}</option>)}
    </select>
  );
}

const DIRECTIONS: readonly Direction[] = ['northbound', 'southbound', 'eastbound', 'westbound', 'inbound', 'outbound'];
const WEEKDAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
] as const;

function stationChoiceValue(complexId: string, constituentId: string): string {
  return `${complexId}\u0000${constituentId}`;
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
