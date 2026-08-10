import { useEffect, useMemo, useRef, useState } from 'react';

import { mountClient } from '../../../src/client/bootstrap';
import { App } from '../../../src/client/App';
import type { BoardEnvelopeDto, NearbyEnvelopeDto } from '../../../src/client/api/client';
import { ValidationAccessibilityPanel } from '../../../src/client/components/AccessibilityPanel';
import { StatusBanner } from '../../../src/client/components/StatusBanner';
import { boardRequestKey, type NearbyBoardState } from '../../../src/client/components/StationCard';
import { ThumbDock } from '../../../src/client/components/ThumbDock';
import { transitionAccessibilityWarning, type AccessibilityWarning } from '../../../src/shared/domain/underway-warning';
import type { OwnerAcceptance, ReconnectionStage, ReconnectionState } from '../../../src/shared/domain/reconnection';
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
  MemoryStorage,
  nearbyEnvelope,
} from '../../helpers/client-fixtures';
import {
  bypassDecisions,
  commuteDecision,
  commuteSavedRecord,
  commuteWindow,
  firstAbsenceTimeline,
  liveOverlapBoard,
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
  'Board · loading motion',
  'Board · scheduled fallback',
  'Board · first healthy absence',
  'Board · bypass veto',
  'Board · unresolved service change',
  'Board · two-update recovery',
  ...RECONNECTION_SCENARIOS,
  'Reconnect · app-integrated active trip',
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
      {scenario !== 'Reconnect · app-integrated active trip'
        ? <ThumbDock active="nearby" onChange={() => undefined} />
        : null}
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
  if (scenario === 'Board · loading motion') return <LoadingBoard />;
  if (scenario === 'Board · scheduled fallback') return <BoardSurface board={scheduledFallbackBoard()} />;
  if (scenario === 'Board · first healthy absence') return <FirstAbsence />;
  if (scenario === 'Board · bypass veto') return <BypassBoard />;
  if (scenario === 'Board · unresolved service change') return <UnresolvedBoard />;
  if (scenario === 'Board · two-update recovery') return <ServiceRecovery />;
  if (scenario === 'Reconnect · app-integrated active trip') return <ControlledAppReconnection />;
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

function LoadingBoard() {
  return <div className="station-card validation-board">
    <StationView
      station={{ complexId: 'A12', constituentId: 'A12', name: '125 St' }}
      phase="loading"
      filters={{ routeIds: [] }}
      onFiltersChange={() => undefined}
      onRefresh={() => undefined}
    />
  </div>;
}

function FirstAbsence() {
  const timeline = useMemo(firstAbsenceTimeline, []);
  const [absent, setAbsent] = useState(false);
  const preciseAbsence = timeline.absence.reasonCode === 'first-healthy-absence'
    && timeline.absence.publicPrecision === 'none';
  return <section className="validation-receipt" aria-label="Train recovery timeline">
    <h2>First healthy absence</h2>
    {!absent ? <BoardSurface board={timeline.before} /> : null}
    {absent && preciseAbsence
      ? <p>First healthy absence: exact precision removed; no replacement shown.</p>
      : null}
    {!absent ? <button type="button" onClick={() => setAbsent(true)}>Apply first healthy absence</button> : null}
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
  const [acceptedUpdates, setAcceptedUpdates] = useState<0 | 1 | 2>(0);
  const recovered = acceptedUpdates === 2
    && receipts.two.kind === 'eligible-context'
    && receipts.two.recoveryCount === 2
    && receipts.twoAdmission.kind === 'admitted';
  const board = acceptedUpdates === 0 ? receipts.adverseBoard
    : acceptedUpdates === 1 ? receipts.oneBoard : receipts.twoBoard;
  return <section className="station-card validation-receipt" aria-label="Service recovery receipt">
    <h2>{recovered ? 'Two coherent recovery updates'
      : acceptedUpdates === 1 ? 'One clean update · F still withheld' : 'Bypass veto active'}</h2>
    <BoardSurface board={board} />
    {!recovered ? <button type="button" onClick={() => setAcceptedUpdates((current) => current === 0 ? 1 : 2)}>Accept next coherent update</button> : null}
  </section>;
}

function ReconnectionSurface({ scenario }: { readonly scenario: ReconnectionScenario }) {
  const [transitions, setTransitions] = useState<Array<{ phase: 'requested' | 'presented'; stage: ReconnectionStage }>>([]);
  const [state, setState] = useState<Awaited<ReturnType<typeof runReconnectionScenario>>>();
  const postQueue = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    let sequence = 0;
    void runReconnectionScenario(scenario, (transition) => {
      if (!active) return;
      sequence += 1;
      const { phase, stage } = transition;
      setTransitions((current) => [...current, { phase, stage }]);
      const receipt = reconnectionTransitionReceipt(scenario, sequence, transition.state, phase, stage);
      postQueue.current = postQueue.current.then(async () => {
        await fetch('/__test/transitions', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify(receipt),
        });
      });
    }).then((result) => { if (active) setState(result); });
    return () => { active = false; };
  }, [scenario]);
  const presented = transitions.filter(({ phase }) => phase === 'presented');
  const guidanceResult = state?.stages.find(({ stage }) => stage === 4)?.result;
  const equipmentResult = state?.stages.find(({ stage }) => stage === 1)?.result;
  const serviceResult = state?.stages.find(({ stage }) => stage === 2)?.result;
  const arrivalsResult = state?.stages.find(({ stage }) => stage === 3)?.result;
  const optionalRemoved = scenario === 'Reconnect · optional guidance removed'
    && guidanceResult?.stage === 4
    && guidanceResult.invalidation === null;
  return <section className="reconnection-evidence" aria-label="Reconnection coordinator receipt">
    {state?.visible.activeWarnings.map((warning) => <div role="alert" className="accessibility-warning" key={warning.id}>
      <h2>Trip update</h2><p>{warning.changedFact}</p><p>{warning.consequence}</p>
    </div>)}
    {equipmentResult?.stage === 1 ? <p>Equipment {equipmentResult.equipment.disposition === 'unknown' ? 'Unknown' : equipmentResult.equipment.disposition}</p> : null}
    {serviceResult?.stage === 2 && serviceResult.invalidation?.scopes.some(({ kind, id }) => kind === 'transfer' && id === 'transfer-7')
      ? <p>Affected transfer transfer-7</p> : null}
    {arrivalsResult?.stage === 3 && arrivalsResult.arrivals.freshSnapshotCount === 1 && arrivalsResult.arrivals.disposition === 'withheld'
      ? <p>One fresh snapshot observed · arrivals remain withheld</p> : null}
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

function ControlledAppReconnection() {
  const storage = useMemo(() => new MemoryStorage(), []);
  const [connectivity, setConnectivity] = useState<'online' | 'offline' | 'checking'>('online');
  const sequence = useRef(0);
  const postQueue = useRef(Promise.resolve());
  const recoveryClock = useRef({ base: Date.now(), calls: 0 });
  const recoveryNow = () => {
    recoveryClock.current.calls += 1;
    return new Date(recoveryClock.current.calls === 1
      ? recoveryClock.current.base - 1_000
      : recoveryClock.current.base + recoveryClock.current.calls * 60_000);
  };
  return <section className="app-reconnection-fixture" aria-label="App-integrated reconnection fixture">
    <div role="toolbar" aria-label="Connectivity demonstration controls" className="validation-connectivity-controls">
      <button type="button" disabled={connectivity !== 'online'} onClick={() => setConnectivity('offline')}>Simulate offline</button>
      <button type="button" disabled={connectivity !== 'offline'} onClick={() => setConnectivity('checking')}>Reconnect owners</button>
    </div>
    <App
      storage={storage}
      geolocation={null}
      connectivity={connectivity}
      recoveryNow={recoveryNow}
      onReconnectionTransition={(transition) => {
        sequence.current += 1;
        const receipt = reconnectionTransitionReceipt(
          'Reconnect · app-integrated active trip', sequence.current, transition.state, transition.phase, transition.stage,
        );
        postQueue.current = postQueue.current.then(async () => {
          await fetch('/__test/transitions', {
            method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(receipt),
          });
        });
        if (transition.phase === 'presented' && transition.stage === 5) {
          setTimeout(() => setConnectivity('online'), 0);
        }
      }}
    />
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
  return <DynamicAccessibilitySurface scenario={scenario} />;
}

function DynamicAccessibilitySurface({ scenario }: { readonly scenario: Scenario }) {
  const initialPath = useMemo(() => resolvedPath('selected', 'eligible', { equipmentIds: ['EL-1'], destinationIntent: '168 St' }), []);
  const alternative = useMemo(() => resolvedAlternativeSelection(initialPath), [initialPath]);
  const initialWarning = useMemo(
    () => resolvedWarning(initialPath, alternative, scenario === 'Accessibility · last decision point' ? { decisionPointId: 'transfer-west' } : {}),
    [alternative, initialPath, scenario],
  );
  const [warning, setWarning] = useState<AccessibilityWarning>(initialWarning);
  const [displayedPath, setDisplayedPath] = useState(initialPath);
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
    if (!transitioned.active) setDisplayedPath(replacement);
    setDecisionTime(nextTime);
    setAlternativeSelected(!transitioned.active);
  };
  return <>
    <p>Accessible Route Only · On</p>
    <p>Displayed path · {displayedPath.pathId}</p>
    {alternativeSelected ? <p className="validation-success">Alternative selected</p> : null}
    <ValidationAccessibilityPanel
      warning={warning} path={displayedPath} equipment={[]} alternative={alternative}
      onSelectAlternative={selectAlternative} decisionTime={decisionTime}
    />
  </>;
}

function CommuteSurface({ scenario }: { readonly scenario: Scenario }) {
  const [monitor, setMonitor] = useState<{ kind: string; delivered: number; senderCalls: number }>();
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/__test/commute-lock', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Locked commute receipt unavailable');
        return response.json() as Promise<{ kind: string; delivered: number; senderCalls: number }>;
      })
      .then((receipt) => setMonitor(receipt));
    return () => controller.abort();
  }, []);
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
    {monitor ? <>
      <section aria-label="Locked commute monitor receipt" className="notification-receipt">
        <p>kind · {monitor.kind}</p>
        <p>delivered · {monitor.delivered}</p>
        <p>sender calls · {monitor.senderCalls}</p>
      </section>
      <p className="delivery-lock">Delivery remains locked; no notification was sent.</p>
    </> : <p role="status">Verifying delivery lock…</p>}
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

function reconnectionTransitionReceipt(
  scenario: string,
  sequence: number,
  state: ReconnectionState,
  phase: 'requested' | 'presented',
  stage: ReconnectionStage,
) {
  const record = state.stages.find((candidate) => candidate.stage === stage);
  if (!record || record.status !== phase) throw new Error('Reconnection callback did not expose its committed stage status');
  const acceptances = collectOwnerAcceptances(record.result);
  const disposition = phase === 'requested' ? 'pending' as const
    : acceptances.some(({ disposition: ownerDisposition }) => ownerDisposition === 'governed-fail-closed')
      ? 'governed-fail-closed' as const : 'accepted-fresh' as const;
  return {
    scenario,
    sequence,
    requestIdentity: state.context.recovery.requestIdentity,
    phase,
    stage,
    stageStatus: record.status,
    ownerDisposition: disposition,
    evidenceIds: [...new Set(acceptances.map(({ evidenceId }) => evidenceId))],
    auditKinds: state.audit.filter((event) => event.stage === stage).map(({ kind }) => kind),
  };
}

function collectOwnerAcceptances(value: unknown): OwnerAcceptance[] {
  if (Array.isArray(value)) return value.flatMap(collectOwnerAcceptances);
  if (!value || typeof value !== 'object') return [];
  const candidate = value as Record<string, unknown>;
  const own = typeof candidate.domain === 'string'
    && typeof candidate.evidenceId === 'string'
    && (candidate.disposition === 'accepted-fresh' || candidate.disposition === 'governed-fail-closed')
    ? [candidate as unknown as OwnerAcceptance] : [];
  return [...own, ...Object.values(candidate).flatMap(collectOwnerAcceptances)];
}

function stageLabel(stage: ReconnectionStage): string {
  if (stage === 1) return 'Path and equipment';
  if (stage === 2) return 'Service and transfers';
  if (stage === 3) return 'Train choice and arrivals';
  if (stage === 4) return 'Required guidance';
  return 'Maps and unrelated saved stations';
}

mountClient(document.getElementById('root')!, <ValidationDeck />, false);
