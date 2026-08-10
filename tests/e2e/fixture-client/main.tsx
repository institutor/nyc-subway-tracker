import { useEffect, useMemo, useRef, useState } from 'react';

import { mountClient } from '../../../src/client/bootstrap';
import type { BoardEnvelopeDto, NearbyEnvelopeDto } from '../../../src/client/api/client';
import { ValidationAccessibilityPanel } from '../../../src/client/components/AccessibilityPanel';
import { StatusBanner } from '../../../src/client/components/StatusBanner';
import { boardRequestKey, type NearbyBoardState } from '../../../src/client/components/StationCard';
import { ThumbDock } from '../../../src/client/components/ThumbDock';
import { transitionAccessibilityWarning, type AccessibilityWarning } from '../../../src/shared/domain/underway-warning';
import type { ReconnectionStage } from '../../../src/shared/domain/reconnection';
import { CommuteView } from '../../../src/client/views/CommuteView';
import { NearbyView } from '../../../src/client/views/NearbyView';
import { StationView } from '../../../src/client/views/StationView';
import {
  resolvedAlternativeSelection,
  resolvedPath,
  resolvedWarning,
} from '../../fixtures/accessibility-decisions';
import {
  boardEnvelope,
  catalogEnvelope,
  disclosure,
  nearbyEnvelope,
} from '../../helpers/client-fixtures';
import {
  bypassDecisions,
  commuteDecision,
  commuteSavedRecord,
  commuteWindow,
  firstAbsenceDecision,
  liveOverlapBoard,
  lockedMonitorReceipt,
  RECONNECTION_SCENARIOS,
  runReconnectionScenario,
  scheduledFallbackBoard,
  serviceRecoveryDecisions,
  unresolvedDecisions,
  type CommuteReceiptScenario,
  type ReconnectionScenario,
} from './scenario-receipts';
import './validation.css';

const SCENARIOS = [
  'Location allowed · practical walk ranking',
  'Location denied · last used station',
  'Location denied · saved choices',
  'Location denied · station picker',
  'Location allowed · walk evidence unavailable',
  'Board · live overlap and holding',
  'Board · scheduled fallback',
  'Board · first healthy absence',
  'Board · bypass veto',
  'Board · unresolved service change',
  'Board · two-update recovery',
  ...RECONNECTION_SCENARIOS,
  'Accessibility · synthetic verified path',
  'Accessibility · empty live registry',
  'Accessibility · last decision point',
  'Accessibility · immediate warning',
  'Accessibility · verified alternative',
  'Commute · locked',
  'Commute · material bypass',
  'Commute · duplicate episode',
  'Commute · correction only',
  'Commute · material escalation',
] as const;
type Scenario = typeof SCENARIOS[number];

function ValidationDeck() {
  const [scenario, setScenario] = useState<Scenario>('Location allowed · practical walk ranking');
  return (
    <main className="app-shell validation-shell" aria-labelledby="validation-title">
      <div className="app-frame validation-frame">
        <header className="validation-header">
          <p className="validation-eyebrow">Fixture-only rider evidence</p>
          <h1 id="validation-title">Subway rider validation deck</h1>
          <p className="surface-disclosure">{disclosure}</p>
          <p>Bounded demonstrations compose the same rider components and domain decisions used by the product.</p>
          <nav className="validation-scenarios" aria-label="Validation scenarios">
            {SCENARIOS.map((name) => (
              <button type="button" aria-pressed={scenario === name} onClick={() => setScenario(name)} key={name}>{name}</button>
            ))}
          </nav>
        </header>
        <div className="surface-frame validation-surface-frame">
          <section className="validation-scenario" aria-label={`Scenario: ${scenario}`} key={scenario}>
            <p className="surface-disclosure">{disclosure}</p>
            <ScenarioContent scenario={scenario} />
          </section>
        </div>
      </div>
      <ThumbDock active="nearby" onChange={() => undefined} />
    </main>
  );
}

function ScenarioContent({ scenario }: { readonly scenario: Scenario }) {
  if (scenario === 'Location allowed · practical walk ranking') return <RankedNearby />;
  if (scenario === 'Location denied · last used station') return <LastUsedStation />;
  if (scenario === 'Location denied · saved choices') return <DeniedNearby saved />;
  if (scenario === 'Location denied · station picker') return <DeniedNearby saved={false} />;
  if (scenario === 'Location allowed · walk evidence unavailable') return <WalkUnavailable />;
  if (scenario === 'Board · live overlap and holding') return <BoardSurface board={liveOverlapBoard()} />;
  if (scenario === 'Board · scheduled fallback') return <BoardSurface board={scheduledFallbackBoard()} />;
  if (scenario === 'Board · first healthy absence') return <FirstAbsence />;
  if (scenario === 'Board · bypass veto') return <BypassBoard />;
  if (scenario === 'Board · unresolved service change') return <UnresolvedBoard />;
  if (scenario === 'Board · two-update recovery') return <ServiceRecovery />;
  if ((RECONNECTION_SCENARIOS as readonly string[]).includes(scenario)) {
    return <ReconnectionSurface scenario={scenario as ReconnectionScenario} />;
  }
  if (scenario.startsWith('Accessibility ·')) return <AccessibilitySurface scenario={scenario} />;
  return <CommuteSurface scenario={scenario} />;
}

function RankedNearby() {
  return <>
    <h2>Nearest useful subway</h2>
    <p>Use your location to show nearby subway entrances and live arrivals.</p>
    <NearbyView
      phase="ready"
      response={nearbyEnvelope}
      boards={nearbyBoards()}
      savedChoices={[]}
      pickerChoices={catalogEnvelope.data.complexes}
      pickerOpen={false}
      onSelect={() => undefined}
      onRetryLocation={() => undefined}
      onOpenPicker={() => undefined}
      onRefresh={() => undefined}
    />
  </>;
}

function LastUsedStation() {
  return <>
    <StatusBanner tone="warning"><p>Location unavailable. Showing your last station.</p></StatusBanner>
    <StationView
      station={{ complexId: 'A12', constituentId: 'A12', name: '125 St' }}
      board={boardEnvelope('A12', '125 St')}
      phase="ready"
      filters={{ routeIds: [] }}
      onFiltersChange={() => undefined}
      onRefresh={() => undefined}
    />
  </>;
}

function DeniedNearby({ saved }: { readonly saved: boolean }) {
  return <NearbyView
    phase="idle"
    boards={new Map()}
    savedChoices={saved ? [{ complexId: 'A12', constituentId: 'A12', name: '125 St' }] : []}
    pickerChoices={catalogEnvelope.data.complexes}
    fallback="denied"
    pickerOpen={!saved}
    onSelect={() => undefined}
    onRetryLocation={() => undefined}
    onOpenPicker={() => undefined}
    onRefresh={() => undefined}
  />;
}

function WalkUnavailable() {
  const response: NearbyEnvelopeDto = {
    ...nearbyEnvelope,
    responseIdentity: 'response:nearby:walk-unavailable',
    practicalWalkEvidence: { kind: 'unavailable', reason: 'unsupported' },
    data: {
      kind: 'picker', reason: 'walk-unavailable', cards: [],
      picker: {
        required: true, bottomAnchored: true,
        options: catalogEnvelope.data.complexes.map(({ id, name }) => ({
          complexId: id, complexName: name, entranceAvailability: 'confirmed' as const, stationDetailAvailable: true as const,
        })),
      },
    },
  };
  return <NearbyView
    phase="ready"
    response={response}
    boards={new Map()}
    savedChoices={[]}
    pickerChoices={catalogEnvelope.data.complexes}
    pickerOpen={false}
    onSelect={() => undefined}
    onRetryLocation={() => undefined}
    onOpenPicker={() => undefined}
    onRefresh={() => undefined}
  />;
}

function BoardSurface({ board }: { readonly board: BoardEnvelopeDto }) {
  return <div className="station-card validation-board">
    <StationView
      station={{ complexId: board.data?.station?.complexId ?? 'A12', constituentId: board.data?.station?.id ?? 'A12', name: board.data?.station?.name ?? 'Station' }}
      board={board}
      phase="ready"
      filters={{ routeIds: [] }}
      onFiltersChange={() => undefined}
      onRefresh={() => undefined}
    />
  </div>;
}

function FirstAbsence() {
  const decision = firstAbsenceDecision();
  return <section className="station-card validation-receipt" aria-label="Train recovery receipt">
    <h2>First healthy absence</h2>
    {decision.reasonCode === 'first-healthy-absence' && decision.publicPrecision === 'none'
      ? <p>First healthy absence: exact precision removed; no replacement shown.</p>
      : <p>Receipt did not satisfy the fail-closed absence boundary.</p>}
  </section>;
}

function BypassBoard() {
  const receipt = bypassDecisions();
  if (receipt.affected.disposition !== 'resolved-ineligible' || receipt.sibling.disposition !== 'eligible'
    || receipt.affectedAdmission.kind !== 'rejected' || receipt.siblingAdmission.kind !== 'admitted') {
    return <p>Service decision receipt unavailable.</p>;
  }
  return <BoardSurface board={receipt.board} />;
}

function UnresolvedBoard() {
  const receipt = unresolvedDecisions();
  if (receipt.affected.disposition !== 'high-impact-unresolved' || receipt.sibling.disposition !== 'eligible'
    || receipt.affectedAdmission.kind !== 'rejected' || receipt.siblingAdmission.kind !== 'admitted') {
    return <p>Service decision receipt unavailable.</p>;
  }
  return <>
    <StatusBanner tone="warning"><p>Service change—arrival unavailable until the stopping pattern is confirmed.</p></StatusBanner>
    <BoardSurface board={receipt.board} />
  </>;
}

function ServiceRecovery() {
  const receipts = useMemo(serviceRecoveryDecisions, []);
  const [secondUpdate, setSecondUpdate] = useState(false);
  const decision = secondUpdate ? receipts.two : receipts.one;
  const admission = secondUpdate ? receipts.twoAdmission : receipts.oneAdmission;
  const recovered = decision.kind === 'eligible-context' && decision.recoveryCount === 2 && admission.kind === 'admitted';
  return <section className="station-card validation-receipt" aria-label="Service recovery receipt">
    <h2>{recovered ? 'Two coherent recovery updates' : 'Recovery confirmation required'}</h2>
    {recovered ? <>
      <p>Recovered F arrival</p>
      <BoardSurface board={receipts.twoBoard} />
    </> : null}
    {!recovered ? <button type="button" onClick={() => setSecondUpdate(true)}>Accept next coherent update</button> : null}
  </section>;
}

function ReconnectionSurface({ scenario }: { readonly scenario: ReconnectionScenario }) {
  const [transitions, setTransitions] = useState<Array<{ phase: 'requested' | 'presented'; stage: ReconnectionStage }>>([]);
  const [state, setState] = useState<Awaited<ReturnType<typeof runReconnectionScenario>>>();
  const postQueue = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    let sequence = 0;
    void runReconnectionScenario(scenario, (phase, stage) => {
      if (!active) return;
      sequence += 1;
      setTransitions((current) => [...current, { phase, stage }]);
      postQueue.current = postQueue.current.then(async () => {
        await fetch('/__test/transitions', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ scenario, phase, stage }),
        });
      });
    }).then((result) => { if (active) setState(result); });
    return () => { active = false; };
  }, [scenario]);
  const presented = transitions.filter(({ phase }) => phase === 'presented');
  const guidanceResult = state?.stages.find(({ stage }) => stage === 4)?.result;
  const optionalRemoved = scenario === 'Reconnect · optional guidance removed'
    && guidanceResult?.stage === 4
    && guidanceResult.invalidation === null;
  return <section className="reconnection-evidence" aria-label="Reconnection coordinator receipt">
    {state?.visible.activeWarnings.map((warning) => <div role="alert" className="accessibility-warning" key={warning.id}>
      <h2>Trip update</h2><p>{warning.changedFact}</p><p>{warning.consequence}</p>
    </div>)}
    {optionalRemoved ? <p>Optional guidance removed; trip remains valid.</p> : null}
    <ol aria-label="Presented reconnection stages">
      {presented.map(({ stage }) => <li key={stage}>{stage} · {stageLabel(stage)}</li>)}
    </ol>
    {state ? <section aria-label="Preserved rider context" className="preserved-context">
      <h2>Stored rider context</h2>
      <p>Cursor {state.context.manualCursor?.stopId} · filters {state.context.routeFilters.join(', ')}</p>
      <p>Map {state.context.mapTuple.referenceMode} · {state.context.mapTuple.theme} · {state.context.mapTuple.viewportKey}</p>
      <p>Surface {state.context.activeSurface} · focus {state.context.focusTargetId ?? 'none'} · reading {state.context.readingAnchorId ?? 'none'}</p>
    </section> : <p role="status">Rechecking owners in safety order…</p>}
  </section>;
}

function AccessibilitySurface({ scenario }: { readonly scenario: Scenario }) {
  if (scenario === 'Accessibility · synthetic verified path') {
    return <ValidationAccessibilityPanel
      warning={null} path={resolvedPath('validation-path')} equipment={[]} alternative={null}
      onSelectAlternative={() => undefined} decisionTime={new Date('2026-08-01T00:00:00.000Z')}
    />;
  }
  if (scenario === 'Accessibility · empty live registry') {
    return <ValidationAccessibilityPanel
      warning={null} path={undefined} equipment={[]} alternative={null}
      onSelectAlternative={() => undefined} decisionTime={new Date('2026-08-01T00:00:00.000Z')}
    />;
  }
  const selectedPath = useMemo(() => resolvedPath('selected', 'eligible', { equipmentIds: ['EL-1'], destinationIntent: '168 St' }), []);
  const alternative = useMemo(() => resolvedAlternativeSelection(selectedPath), [selectedPath]);
  const initialWarning = useMemo(
    () => resolvedWarning(selectedPath, alternative, scenario === 'Accessibility · last decision point' ? { decisionPointId: 'transfer-west' } : {}),
    [alternative, scenario, selectedPath],
  );
  const [warning, setWarning] = useState<AccessibilityWarning>(initialWarning);
  const [alternativeSelected, setAlternativeSelected] = useState(false);
  const [decisionTime, setDecisionTime] = useState(new Date('2026-08-01T00:02:00.000Z'));
  const selectAlternative = (id: string) => {
    const offer = alternative.first;
    if (!offer || offer.id !== id) return;
    const nextTime = new Date('2026-08-01T00:03:00.000Z');
    const replacement = resolvedPath(offer.pathId, 'eligible', {
      stationComplexId: offer.stationComplexId,
      constituentStationId: offer.constituentStationId,
      originIntent: offer.originIntent,
      destinationIntent: offer.destinationIntent,
      routeId: offer.routeId,
      direction: offer.direction,
      platformId: offer.platformId,
      decisionTime: nextTime.toISOString(),
      equipmentDecisionTime: nextTime.toISOString(),
    });
    const transitioned = transitionAccessibilityWarning(warning, {
      type: 'replacement-selected', alternativeSelection: alternative, offerId: offer.offerId, pathDecision: replacement,
    }, nextTime);
    setWarning(transitioned);
    setDecisionTime(nextTime);
    setAlternativeSelected(!transitioned.active);
  };
  return <>
    {alternativeSelected ? <p className="validation-success">Alternative selected</p> : null}
    <ValidationAccessibilityPanel
      warning={warning} path={selectedPath} equipment={[]} alternative={alternative}
      onSelectAlternative={selectAlternative} decisionTime={decisionTime}
    />
  </>;
}

function CommuteSurface({ scenario }: { readonly scenario: Scenario }) {
  const [monitor, setMonitor] = useState<{ kind: string; delivered: number; senderCalls: number }>();
  useEffect(() => { void lockedMonitorReceipt().then(setMonitor); }, []);
  const receiptKind: CommuteReceiptScenario | undefined = scenario === 'Commute · material bypass' ? 'material'
    : scenario === 'Commute · duplicate episode' ? 'duplicate'
      : scenario === 'Commute · correction only' ? 'correction'
        : scenario === 'Commute · material escalation' ? 'escalation' : undefined;
  const decision = receiptKind ? commuteDecision(receiptKind) : undefined;
  return <>
    <CommuteView
      records={[commuteSavedRecord]}
      stage="deterministic-test"
      deliveryAuthorized={false}
      runtimeWindows={[commuteWindow]}
      catalog={[
        { id: 'D15', name: '47–50 Sts–Rockefeller Ctr', routeIds: ['F'], constituents: [{ id: 'D15', name: '47–50 Sts–Rockefeller Ctr', directionalStopIds: ['D15S'] }] },
        { id: 'D21', name: '2 Av', routeIds: ['F'], constituents: [{ id: 'D21', name: '2 Av', directionalStopIds: ['D21S'] }] },
      ]}
    />
    {decision ? <section className="notification-receipt" aria-label="Notification materiality receipt">
      <h3>{decision.outcome === 'send' ? `Send · ${decision.kind}` : decision.outcome === 'suppress' ? 'Suppress' : 'Hold'}</h3>
      <p>{decision.outcome === 'send' ? decision.action?.label ?? 'No verified action.' : decision.reason}</p>
    </section> : null}
    {monitor ? <p className="delivery-lock">Delivery remains locked; no notification was sent.</p> : <p role="status">Verifying delivery lock…</p>}
  </>;
}

function nearbyBoards(): ReadonlyMap<string, NearbyBoardState> {
  const entries = nearbyEnvelope.data?.kind === 'ranked'
    ? nearbyEnvelope.data.cards.flatMap(({ directions }) => directions.map((direction) => ([
      boardRequestKey(direction),
      { phase: 'ready' as const, board: boardEnvelope(direction.constituentId, direction.constituentPublicName, direction.routeIds) },
    ] as const)))
    : [];
  return new Map(entries);
}

function stageLabel(stage: ReconnectionStage): string {
  if (stage === 1) return 'Path and equipment';
  if (stage === 2) return 'Service and transfers';
  if (stage === 3) return 'Train choice and arrivals';
  if (stage === 4) return 'Required guidance';
  return 'Maps and unrelated saved stations';
}

mountClient(document.getElementById('root')!, <ValidationDeck />, false);
