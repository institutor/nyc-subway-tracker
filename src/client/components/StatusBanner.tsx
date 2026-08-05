import type { PropsWithChildren, ReactNode } from 'react';

export function StatusBanner({
  children,
  tone = 'info',
  actions,
}: PropsWithChildren<{ readonly tone?: 'info' | 'warning' | 'locked'; readonly actions?: ReactNode }>) {
  return (
    <section className={`status-banner status-banner--${tone}`} aria-live="polite">
      <div className="status-banner__mark" aria-hidden="true" />
      <div className="status-banner__body">{children}</div>
      {actions ? <div className="status-banner__actions">{actions}</div> : null}
    </section>
  );
}
