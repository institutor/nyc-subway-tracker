import { accessiblePathDecisionAllowsPresentation, type ResolvedAccessiblePathDecision } from '../../shared/domain/accessible-path';
import { equipmentDecisionAllowsUse, type EquipmentStatusDecision } from '../../shared/domain/equipment-status';
import { isResolvedAccessibilityAlternativeSelection, type ResolvedAccessibilityAlternativeSelection } from '../../shared/domain/accessibility-alternatives';
import { warningMatchesAlternativeSelection, warningMatchesDisplayedPath, type AccessibilityWarning } from '../../shared/domain/underway-warning';
import type { ExposureSurface } from '../../shared/domain/exposure-decision';

export interface AccessibilityPanelProps {
  readonly warning: AccessibilityWarning | null;
  readonly path: ResolvedAccessiblePathDecision | undefined;
  readonly equipment: readonly { readonly decision: EquipmentStatusDecision; readonly label: string; readonly required: boolean }[];
  readonly alternative: ResolvedAccessibilityAlternativeSelection | null;
  readonly onSelectAlternative: (id: string) => void;
  readonly decisionTime: Date;
}

const STATE_COPY = {
  'no-official-outage-reported': 'No official outage reported',
  'out-of-service': 'Out of service',
  'planned-outage': 'Planned outage',
  unknown: 'Unknown',
  'out-of-service-rechecking': 'Out of service - status being rechecked',
} as const;

export function AccessibilityPanel(props: AccessibilityPanelProps) {
  return <AccessibilityPanelForSurface {...props} surface="public" />;
}

/** Explicit validation-only harness; App never imports or selects this component. */
export function ValidationAccessibilityPanel(props: AccessibilityPanelProps) {
  return <AccessibilityPanelForSurface {...props} surface="validation" />;
}

function AccessibilityPanelForSurface({ warning, path, equipment, alternative, onSelectAlternative, decisionTime, surface }: AccessibilityPanelProps & { readonly surface: ExposureSurface }) {
  const resolvedPath = accessiblePathDecisionAllowsPresentation(path, surface, decisionTime) ? path : undefined;
  const pathStatus = resolvedPath?.status ?? 'unknown';
  const resolvedEquipment = resolvedPath ? equipment.filter((machine) => {
    const decision = machine?.decision;
    return equipmentDecisionAllowsUse(decision, decisionTime)
      && resolvedPath.equipmentIds.includes(decision.targetEquipmentId)
      && resolvedPath.equipmentDecisionIds[decision.targetEquipmentId] === decision.decisionId
      && decision.sourceScopeId === resolvedPath.equipmentSourceScopeId
      && decision.sourceVersion === resolvedPath.equipmentSourceVersion;
  }) : [];
  const resolvedWarning = warningMatchesDisplayedPath(warning, path, decisionTime) ? warning : null;
  const resolvedAlternative = resolvedWarning && isResolvedAccessibilityAlternativeSelection(alternative)
    && warningMatchesAlternativeSelection(resolvedWarning, alternative, decisionTime) ? alternative.first : null;
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
      .sort((a, b) => resolvedPath!.equipmentIds.indexOf(a.decision.targetEquipmentId) - resolvedPath!.equipmentIds.indexOf(b.decision.targetEquipmentId))
      .map((machine) => <li key={machine.decision.targetEquipmentId}>
        <span><strong>Equipment {machine.decision.targetEquipmentId}</strong><small> Required by selected path</small></span>
        <span>{STATE_COPY[machine.decision.state]}</span>
        <span>{machine.decision.freshnessCopy}</span>
      </li>)}</ul> : null}
  </section>;
}
