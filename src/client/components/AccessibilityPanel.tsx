import { isResolvedAccessiblePathDecision, type ResolvedAccessiblePathDecision } from '../../shared/domain/accessible-path';
import { isResolvedEquipmentStatusDecision, type EquipmentStatusDecision } from '../../shared/domain/equipment-status';
import { isResolvedAccessibilityAlternativeSelection, type ResolvedAccessibilityAlternativeSelection } from '../../shared/domain/accessibility-alternatives';
import { isResolvedAccessibilityWarning, type AccessibilityWarning } from '../../shared/domain/underway-warning';

export interface AccessibilityPanelProps {
  readonly warning: AccessibilityWarning | null;
  readonly path: ResolvedAccessiblePathDecision | undefined;
  readonly equipment: readonly {
    readonly decision: EquipmentStatusDecision;
    readonly label: string;
    readonly required: boolean;
  }[];
  readonly alternative: ResolvedAccessibilityAlternativeSelection | null;
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
  const resolvedEquipment = equipment.filter((machine) => isResolvedEquipmentStatusDecision(machine?.decision));
  const resolvedWarning = isResolvedAccessibilityWarning(warning) ? warning : null;
  const resolvedAlternative = isResolvedAccessibilityAlternativeSelection(alternative) ? alternative.first : null;
  return <section className="accessibility-panel" aria-label="Step-free path">
    {resolvedWarning?.active ? <div className="accessibility-warning" role="alert" aria-live="assertive">
      <p className="accessibility-warning__eyebrow">Step-free path action</p>
      <h2>{resolvedWarning.state === 'underway-immediate' ? 'Act now' : 'Path change'}</h2>
      <ol className="accessibility-warning__facts">{resolvedWarning.content.map((line) => <li key={line}>{line}</li>)}</ol>
      {resolvedAlternative ? <button type="button" onClick={() => onSelectAlternative(resolvedAlternative.id)}>{resolvedAlternative.label}</button> : null}
    </div> : null}
    <div className={`accessibility-path accessibility-path--${pathStatus}`}>
      <span className="accessibility-path__node" aria-hidden="true" />
      <div>
        <p className="accessibility-path__label">Selected step-free path</p>
        <p>{pathStatus === 'eligible' ? 'Complete path verified' : pathStatus === 'unknown' ? 'Current path not verified' : 'Selected path cannot be used'}</p>
      </div>
    </div>
    {resolvedEquipment.length ? <ul className="equipment-list" aria-label="Path equipment status">{[...resolvedEquipment]
      .sort((a, b) => Number(b.required) - Number(a.required))
      .map((machine) => <li key={machine.decision.targetEquipmentId}>
        <span><strong>{machine.label}</strong>{machine.required ? <small> Required by selected path</small> : null}</span>
        <span>{STATE_COPY[machine.decision.state]}</span>
        <span>{machine.decision.freshnessCopy}</span>
      </li>)}</ul> : null}
  </section>;
}
