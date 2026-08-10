import type { CommuteStage, Direction, SavedRecord } from '../../shared/domain/types';
import { RouteToken } from '../components/RouteToken';
import { StatusBanner } from '../components/StatusBanner';
import { useNotifications, type NotificationEnvironment } from '../hooks/use-notifications';
import type { CatalogComplexDto } from '../api/client';

export function CommuteView({
  records,
  stage,
  gateOpen,
  notificationEnvironment,
  catalog = [],
}: {
  readonly records: readonly SavedRecord[];
  readonly stage: CommuteStage;
  readonly gateOpen: boolean;
  readonly notificationEnvironment?: NotificationEnvironment;
  readonly catalog?: readonly CatalogComplexDto[];
}) {
  const windows = records.filter((record) => record.timeWindow && record.commonDestination && record.preferredRide);
  const commuteWindowIds = windows.map(({ id }) => id);
  const notifications = useNotifications({ stage, gateOpen, commuteWindowIds, environment: notificationEnvironment });

  return (
    <section className="surface surface--commute" aria-labelledby="commute-heading">
      <div className="surface-heading">
        <div>
          <p className="section-kicker">Saved subway windows</p>
          <h2 id="commute-heading" className="surface-title">Commute</h2>
        </div>
      </div>
      <p className="quiet-copy">Disruption-only alerts use the route, direction, stations, and times you explicitly saved. Silence is not an all-clear.</p>

      {windows.length > 0 ? (
        <Capability capability={notifications.capability} onEnable={notifications.enable} onDisable={notifications.disable} />
      ) : null}

      {windows.length === 0 ? (
        <StatusBanner tone="locked"><p>No complete commute window is saved yet. Add a destination, ride direction, and time window in Saved.</p></StatusBanner>
      ) : (
        <div className="commute-window-stack">
          {windows.map((record) => <WindowBand record={record} catalog={catalog} key={record.id} />)}
        </div>
      )}
    </section>
  );
}

function Capability({
  capability,
  onEnable,
  onDisable,
}: {
  readonly capability: ReturnType<typeof useNotifications>['capability'];
  readonly onEnable: () => Promise<void>;
  readonly onDisable: () => Promise<void>;
}) {
  if (capability === 'locked') return (
    <StatusBanner tone="locked"><p>Commute alerts remain locked until their safety stage is enabled.</p></StatusBanner>
  );
  if (capability === 'unsupported') return (
    <StatusBanner tone="locked">
      <p>Background alerts aren’t supported in this browser. You can still review your saved commute here.</p>
    </StatusBanner>
  );
  if (capability === 'denied') return (
    <StatusBanner tone="locked"><p>Notifications are blocked in your browser settings. Your saved commute remains available.</p></StatusBanner>
  );
  if (capability === 'enabled') return (
    <StatusBanner>
      <p>Disruption alerts are enabled. Browser delivery can still be delayed or unavailable.</p>
      <button type="button" onClick={() => void onDisable()}>Turn off disruption alerts</button>
    </StatusBanner>
  );
  return (
    <StatusBanner tone={capability === 'error' ? 'warning' : undefined}>
      <p>{capability === 'error'
        ? 'Background alerts could not be enabled. Your saved commute is unchanged.'
        : 'Enable alerts only for material disruptions that overlap a saved commute window.'}</p>
      <button type="button" onClick={() => void onEnable()}>Enable disruption alerts</button>
    </StatusBanner>
  );
}

function WindowBand({ record, catalog }: { readonly record: SavedRecord; readonly catalog: readonly CatalogComplexDto[] }) {
  const timeWindow = record.timeWindow!;
  const ride = record.preferredRide!;
  const destination = record.commonDestination!;
  const routeId = record.routeFilters[0];
  const originName = catalog.find(({ id }) => id === record.complexId)?.name ?? record.constituentId;
  const destinationName = catalog.find(({ id }) => id === destination.complexId)?.name ?? destination.constituentId;
  return (
    <article className="commute-window" aria-labelledby={`commute-${record.id}-heading`}>
      <div className="commute-window__spine" aria-hidden="true" />
      <header className="commute-window__header">
        <div>
          <p className="section-kicker">{record.state === 'active' ? 'Saved window' : 'Paused window'}</p>
          <h3 id={`commute-${record.id}-heading`}>{originName} to {destinationName}</h3>
        </div>
        {routeId ? <RouteToken route={{ id: routeId, label: routeId }} compact /> : null}
      </header>
      <div className="commute-window__strip">
        <span className="commute-window__days">{weekdayLabel(timeWindow.weekdays)}</span>
        <span className="commute-window__time">{timeWindow.startsAt}–{timeWindow.endsAt}</span>
        <span>{directionLabel(ride.direction)} toward {ride.actualDestination}</span>
      </div>
      <p>{record.state === 'active'
        ? 'This window stays quiet unless a current, decision-changing disruption matches the saved trip.'
        : 'This window is paused and is not evaluated for alerts.'}</p>
    </article>
  );
}

function weekdayLabel(values: readonly number[]): string {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  if (values.length === 5 && values.every((value, index) => value === index + 1)) return 'Weekdays';
  return values.map((value) => labels[value - 1] ?? '?').join(' · ');
}

function directionLabel(value: Direction): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
