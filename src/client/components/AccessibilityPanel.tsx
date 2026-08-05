import { isResolvedAccessiblePathDecision, type ResolvedAccessiblePathDecision } from '../../shared/domain/accessible-path';
import type { AccessibilityWarning } from '../../shared/domain/underway-warning';

export interface AccessibilityPanelProps {
  readonly warning: AccessibilityWarning | null;
  readonly path: ResolvedAccessiblePathDecision | undefined;
  readonly equipment: readonly {
    readonly id: string;
    readonly label: string;
    readonly state: 'no-official-outage-reported' | 'out-of-service' | 'planned-outage' | 'unknown' | 'out-of-service-rechecking';
    readonly freshnessCopy: string;
    readonly required: boolean;
  }[];
  readonly alternative: { readonly id: string; readonly label: string } | null;
  readonly onSelectAlternative: (id: string) => void;
}

const STATE_COPY = {
  'no-official-outage-reported': 'No official outage reported',
  'out-of-service': 'Out of service',
  'planned-outage': 'Planned outage',
  unknown: 'Unknown',
  'out-of-service-rechecking': 'Out of service—status being rechecked',
} as const;

export function AccessibilityPanel({ warning, path, equipment, alternative, onSelectAlternative }: AccessibilityPanelProps) {
  const pathStatus = isResolvedAccessiblePathDecision(path) ? path.status : 'unknown';
  return <section className="accessibility-panel" aria-label="Step-free path">
    {warning?.active ? <div className="accessibility-warning" role="alert" aria-live="assertive">
      <p className="accessibility-warning__eyebrow">Step-free path action</p>
      <h2>{warning.state === 'underway-immediate' ? 'Act now' : 'Path change'}</h2>
      <ol className="accessibility-warning__facts">{warning.content.map((line) => <li key={line}>{line}</li>)}</ol>
      {alternative ? <button type="button" onClick={() => onSelectAlternative(alternative.id)}>{alternative.label}</button> : null}
    </div> : null}
    <div className={`accessibility-path accessibility-path--${pathStatus}`}>
      <span className="accessibility-path__node" aria-hidden="true" />
      <div>
        <p className="accessibility-path__label">Selected step-free path</p>
        <p>{pathStatus === 'eligible' ? 'Complete path verified' : pathStatus === 'unknown' ? 'Current path not verified' : 'Selected path cannot be used'}</p>
      </div>
    </div>
    {equipment.length ? <ul className="equipment-list" aria-label="Path equipment status">{[...equipment]
      .sort((a, b) => Number(b.required) - Number(a.required))
      .map((machine) => <li key={machine.id}>
        <span><strong>{machine.label}</strong>{machine.required ? <small> Required by selected path</small> : null}</span>
        <span>{STATE_COPY[machine.state]}</span>
        <span>{machine.freshnessCopy}</span>
      </li>)}</ul> : null}
  </section>;
}
