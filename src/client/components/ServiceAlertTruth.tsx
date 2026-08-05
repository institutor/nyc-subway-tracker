import type { AlertDto } from '../api/client';
import { formatClaimTime, sourceLabel } from './ArrivalRow';

export function ServiceAlertTruth({
  alert,
  historical,
  className,
  headingLevel = 3,
  showRoutes = false,
  marked = false,
}: {
  readonly alert: AlertDto;
  readonly historical: boolean;
  readonly className?: string;
  readonly headingLevel?: 3 | 4 | 5;
  readonly showRoutes?: boolean;
  readonly marked?: boolean;
}) {
  const Heading = `h${headingLevel}` as const;
  const evidenceLabel = historical ? 'Last checked' : 'Evidence observed';

  return (
    <section className={className} aria-label={historical ? 'Historical service alert' : 'Service alert'}>
      {marked ? <span className="service-alert__mark" aria-hidden="true">!</span> : null}
      <div>
        <Heading>{historical ? 'Historical service alert' : 'Service alert'}</Heading>
        <p>{showRoutes && alert.routeIds.length > 0 ? <><strong>{alert.routeIds.join(', ')}</strong>{' '}</> : null}{alert.text}</p>
        <p className="claim-line">
          <span>{alert.demonstrationLabel}</span>
          <span>{sourceLabel(alert.provenance)}</span>
          <time dateTime={alert.provenance.observedAt}>{evidenceLabel} {formatClaimTime(alert.provenance.observedAt)}</time>
        </p>
      </div>
    </section>
  );
}
