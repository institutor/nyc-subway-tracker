import { useLayoutEffect, useRef, useState } from 'react';
import type { NotificationDeletionResult } from '../hooks/use-notifications';

export type DeletionState = 'Deleted' | 'Not present' | 'Failed' | 'Pending';

export interface DeletionResult {
  readonly category: string;
  readonly state: DeletionState;
  readonly remote?: NotificationDeletionResult['remote'];
  readonly local?: NotificationDeletionResult['local'];
}

export function SettingsView({
  onDeletePersonalData,
  onDeleteNotificationSubscription,
}: {
  readonly onDeletePersonalData: () => Promise<readonly DeletionResult[]>;
  readonly onDeleteNotificationSubscription: () => Promise<NotificationDeletionResult>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [results, setResults] = useState<readonly DeletionResult[]>();
  const [notificationResult, setNotificationResult] = useState<NotificationDeletionResult>();
  const [notificationDeleting, setNotificationDeleting] = useState(false);
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const confirmationOpenedRef = useRef(false);

  useLayoutEffect(() => {
    if (confirming) {
      confirmationOpenedRef.current = true;
      confirmRef.current?.focus();
    } else if (confirmationOpenedRef.current) {
      deleteTriggerRef.current?.focus();
    }
  }, [confirming]);

  const deletePersonalData = async () => {
    setDeleting(true);
    const next = await onDeletePersonalData();
    setResults(next);
    setDeleting(false);
    setConfirming(false);
  };

  const deleteNotifications = async () => {
    setNotificationDeleting(true);
    try {
      setNotificationResult(await onDeleteNotificationSubscription());
    } catch {
      setNotificationResult({ state: 'Failed', remote: 'Failed', local: 'Pending' });
    } finally {
      setNotificationDeleting(false);
    }
  };

  const cancelConfirmation = () => {
    setConfirming(false);
  };

  const failed = results?.some(({ state }) => state === 'Failed' || state === 'Pending') ?? false;
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
          <div className="settings-confirm" role="dialog" aria-modal="true" aria-labelledby="delete-personal-heading" onKeyDown={(event) => { if (event.key === 'Escape' && !deleting) cancelConfirmation(); }}>
            <h4 id="delete-personal-heading">Delete personal data?</h4>
            <p>Official subway sources, structural offline information, and map assets are retained.</p>
            <div className="settings-actions">
              <button ref={confirmRef} type="button" className="danger-action" disabled={deleting} onClick={() => void deletePersonalData()}>Confirm deletion</button>
              <button type="button" disabled={deleting} onClick={cancelConfirmation}>Cancel</button>
            </div>
          </div>
        ) : <button ref={deleteTriggerRef} type="button" className="danger-action" disabled={notificationDeleting} onClick={() => setConfirming(true)}>Delete personal data</button>}
        {results ? (
          <div className="settings-results" role="status" aria-live="polite">
            <p>{failed ? 'Personal data deletion needs attention.' : 'Personal data deletion finished.'}</p>
            <ul>{results.map((result) => <li key={result.category}>{result.category}: {result.state}{result.remote && result.local ? ` (remote: ${result.remote}; device: ${result.local})` : ''}</li>)}</ul>
          </div>
        ) : null}
      </article>

      <article className="settings-panel">
        <h3>Notifications</h3>
        <p>Delete the app's notification subscription separately. This does not change the notification permission in device settings.</p>
        <button type="button" disabled={deleting || notificationDeleting} onClick={() => void deleteNotifications()}>Delete notification subscription</button>
        {notificationResult ? <div role="status"><p>Notification subscription: {notificationResult.state}</p><p>Remote deletion: {notificationResult.remote}; device subscription: {notificationResult.local}.</p></div> : null}
      </article>
    </section>
  );
}
