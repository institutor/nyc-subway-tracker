import { useState } from 'react';

export type DeletionState = 'Deleted' | 'Not present' | 'Failed';

export interface DeletionResult {
  readonly category: string;
  readonly state: DeletionState;
}

export function SettingsView({
  onDeletePersonalData,
  onDeleteNotificationSubscription,
}: {
  readonly onDeletePersonalData: () => Promise<readonly DeletionResult[]>;
  readonly onDeleteNotificationSubscription: () => Promise<DeletionState>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [results, setResults] = useState<readonly DeletionResult[]>();
  const [notificationResult, setNotificationResult] = useState<DeletionState>();

  const deletePersonalData = async () => {
    setDeleting(true);
    const next = await onDeletePersonalData();
    setResults(next);
    setDeleting(false);
    setConfirming(false);
  };

  const deleteNotifications = async () => {
    try {
      setNotificationResult(await onDeleteNotificationSubscription());
    } catch {
      setNotificationResult('Failed');
    }
  };

  const failed = results?.some(({ state }) => state === 'Failed') ?? false;
  return (
    <section className="surface surface--settings" aria-labelledby="settings-heading">
      <p className="section-kicker">Device controls</p>
      <h2 id="settings-heading" className="surface-title">Settings</h2>
      <p className="quiet-copy">Saved stations, commute choices, and an active trip are held on this device. Official subway information and offline map assets stay on this device when personal data is deleted.</p>

      <article className="settings-panel">
        <h3>Personal data</h3>
        <p>Delete saved stations and commute choices, the last station and covered settings, the active trip and its progress, and the notification subscription.</p>
        <p>Location and notification permission choices in device settings were not changed. Accessible Route Only is not silently changed.</p>
        {confirming ? (
          <div className="settings-confirm" role="group" aria-labelledby="delete-personal-heading">
            <h4 id="delete-personal-heading">Delete personal data?</h4>
            <p>Official subway sources, structural offline information, and map assets are retained.</p>
            <div className="settings-actions">
              <button type="button" className="danger-action" disabled={deleting} onClick={() => void deletePersonalData()}>Confirm deletion</button>
              <button type="button" disabled={deleting} onClick={() => setConfirming(false)}>Cancel</button>
            </div>
          </div>
        ) : <button type="button" className="danger-action" onClick={() => setConfirming(true)}>Delete personal data</button>}
        {results ? (
          <div className="settings-results" role="status" aria-live="polite">
            <p>{failed ? 'Personal data deletion needs attention.' : 'Personal data deletion finished.'}</p>
            <ul>{results.map((result) => <li key={result.category}>{result.category}: {result.state}</li>)}</ul>
          </div>
        ) : null}
      </article>

      <article className="settings-panel">
        <h3>Notifications</h3>
        <p>Delete the app's notification subscription separately. This does not change the notification permission in device settings.</p>
        <button type="button" onClick={() => void deleteNotifications()}>Delete notification subscription</button>
        {notificationResult ? <p role="status">Notification subscription: {notificationResult}</p> : null}
      </article>
    </section>
  );
}
