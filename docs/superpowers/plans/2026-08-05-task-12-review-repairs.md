# Task 12 Review Repairs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair Task 12 so historical data, reconnection, offline routing, captured journeys, map controls, Saved editing, and alerts remain exact, owner-bound, and useful underground.

**Architecture:** Keep immutable structural truth (catalog, graph, reference maps) separate from operational responses (boards, overlays, alerts). Carry transport cache state through strict DTOs; gate recovery through an epoch/request/scope-owned state machine; route offline through the shared pure journey engine; capture only response-owned journey evidence. UI surfaces consume those explicit truth states and never infer currency from browser reachability alone.

**Tech Stack:** TypeScript, React, Vitest, Express, service workers, local browser storage, Playwright.

## Global Constraints

- Write and observe a failing regression before every production behavior change.
- Keep every commit subject lowercase.
- Historical data never regains Live, moving-countdown, current-alert, or Actual-now treatment.
- Recovery stages run strictly in this order: equipment/accessible path; service changes/vetoes; feed health/train admission/two fresh arrival snapshots; positioning/transfer guidance; maps/unrelated Saved.
- Every recovery acceptance is bound to the exact epoch, request identity, active trip, context key, and eligible scope membership.
- Offline planning performs zero journey network requests and persists no current operational claims.
- Active-trip capture preserves exact response-owned validity, schedule, disclosure, and timing; optional evidence is omitted rather than fabricated.
- Keep crowding absent and use no official MTA map/logo assets.

---

### Task 1: Historical transport truth and first-visit shell

**Files:**
- Modify: `src/client/api/client.ts`
- Modify: `src/client/App.tsx`
- Modify: `src/client/components/StationCard.tsx`
- Modify: `src/client/views/StationView.tsx`
- Modify: `src/client/views/NearbyView.tsx`
- Modify: `src/client/views/SavedView.tsx`
- Modify: `src/server/api/http.ts`
- Modify: `src/server/routes/boards.ts`
- Modify: `src/server/routes/maps.ts`
- Modify: `src/server/routes/status.ts`
- Modify: `public/sw.js`
- Modify: `vite.config.ts`
- Test: `tests/client/api-client.test.ts`
- Test: `tests/client/offline-state.test.tsx`
- Test: `tests/client/service-worker.test.ts`
- Test: `tests/server/api.test.ts`
- Test: `tests/e2e/offline-pwa.spec.ts`

**Interfaces:**
- Produces: `TransportCacheState = 'network' | 'historical'` on exact board and overlay DTOs.
- Produces: exact server opt-in header `x-subway-historical-cache: public-v1` while retaining `Cache-Control: no-store`.
- Produces: build-injected exact hashed shell assets in the service-worker install list.

- [x] **Step 1: Write failing transport/server/worker/App regressions**

```ts
expect((await client.board('A12')).cacheState).toBe('historical');
expect(response.headers['x-subway-historical-cache']).toBe('public-v1');
expect(screen.queryByText('Live')).not.toBeInTheDocument();
expect(worker.cache('subway-first-history-v2').puts).toHaveLength(1);
```

- [x] **Step 2: Run focused tests and verify failures identify discarded headers, no-store rejection, and current-looking presentation**

Run: `pnpm vitest run tests/client/api-client.test.ts tests/client/offline-state.test.tsx tests/client/service-worker.test.ts tests/server/api.test.ts`

- [x] **Step 3: Carry strict cache metadata, add exact server opt-in, inject built assets, and derive historical UI per response**

```ts
interface ReceivedJson { readonly value: unknown; readonly cacheState: 'network' | 'historical' }
const cacheState = response.headers.get('x-subway-cache-state') === 'historical' ? 'historical' : 'network';
```

- [x] **Step 4: Run the focused suite and verify it passes**

- [ ] **Step 5: Commit**

Run: `git commit -m "preserve historical subway truth"`

### Task 2: Recovery ownership and live App integration

**Files:**
- Modify: `src/shared/domain/reconnection.ts`
- Create: `src/client/recovery/run-reconnection.ts`
- Modify: `src/client/hooks/use-connectivity.ts`
- Modify: `src/client/App.tsx`
- Modify: `src/client/components/ActiveTripCard.tsx`
- Test: `tests/domain/reconnection.test.ts`
- Create: `tests/client/reconnection-flow.test.tsx`
- Modify: `tests/client/connectivity-hook.test.tsx`

**Interfaces:**
- Produces: `RecoveryEpoch`, `ReconnectionRequestIdentity`, and exact `scopeMembership` on preserved context.
- Produces: `runReconnection(...)` which presents stages sequentially and returns `complete`, `offline`, or abort.
- Produces: connectivity `completeRecovery()`; ordinary accepted requests cannot leave `checking`.

- [ ] **Step 1: Write failing epoch/generation/trip/context/scope domain tests and App deadlock/order tests**

```ts
expect(() => acceptReconnectionStage(requested, priorEpochResult)).toThrow(/epoch/);
expect(requestOrder).toEqual(['stage-1', 'stage-2', 'stage-3a', 'stage-3b', 'stage-4', 'stage-5']);
expect(screen.getByText(/Rechecking/)).toBeInTheDocument();
```

- [ ] **Step 2: Run focused recovery tests and observe ownership and App-order failures**

- [ ] **Step 3: Harden the domain and integrate a fail-closed, owner-gated five-stage runner**

```ts
if (gate.recoveryEpoch !== state.epoch.id || gate.requestIdentity !== record.requestIdentity) {
  throw new Error('Owner evidence does not belong to this recovery request');
}
```

- [ ] **Step 4: Verify retained content stays historical, warnings precede lower stages, context is unchanged, and completion alone leaves checking**

- [ ] **Step 5: Commit**

Run: `git commit -m "gate subway recovery evidence"`

### Task 3: Versioned offline graph, local routing, and journey ownership

**Files:**
- Modify: `src/shared/domain/journey-router.ts`
- Modify: `src/server/routes/bootstrap.ts`
- Modify: `src/server/routes/journeys.ts`
- Modify: `src/server/services/journey-service.ts`
- Modify: `src/client/api/client.ts`
- Modify: `src/client/storage/structural-store.ts`
- Create: `src/client/offline/plan-offline-journey.ts`
- Modify: `src/client/components/StationSearch.tsx`
- Modify: `src/client/components/JourneyPlanner.tsx`
- Modify: `src/client/views/MapView.tsx`
- Test: `tests/client/structural-cache.test.ts`
- Test: `tests/client/offline-api-client.test.ts`
- Test: `tests/client/map-view.test.tsx`
- Test: `tests/server/journey-structure.test.ts`

**Interfaces:**
- Produces: bootstrap `contentVersions.journeyGraph` and immutable `GET /api/v1/journeys/reference/:contentVersion`.
- Produces: strict bounded `StoredStructuralContent.graph` validated by `validateJourneyGraph` and graph content ownership.
- Produces: planner dependency `planOfflineJourney(query)` returning a strict `JourneyEnvelopeDto` without fetch.
- Produces: immutable `JourneyRequestOwnership` tuple over origin, exact destination selection, mode, connectivity, service date, and accessibility.

- [ ] **Step 1: Write failing graph persistence/local direct+transfer/no-path tests and deferred tuple-ownership tests**

```ts
expect(api.planJourney).not.toHaveBeenCalled();
expect(screen.getByText('Reference itinerary')).toBeInTheDocument();
expect(screen.queryByRole('button', { name: 'Use this trip' })).not.toBeInTheDocument();
```

- [ ] **Step 2: Run focused tests and observe missing graph and stale-result failures**

- [ ] **Step 3: Add the immutable graph endpoint/store/local adapter and invalidate on every tuple mutation**

```ts
const requestKey = JSON.stringify({ originId, destinationId, mode, connected, serviceDate, accessibleRouteOnly });
if (settledKey !== currentKey) return;
```

- [ ] **Step 4: Verify zero offline POSTs, honest corrupt/cold failure, and late-result rejection**

- [ ] **Step 5: Commit**

Run: `git commit -m "route saved journeys underground"`

### Task 4: Exact captured evidence, truthful maps, complete Saved editing, and alert disclosure

**Files:**
- Modify: `src/client/api/client.ts`
- Modify: `src/server/services/journey-service.ts`
- Modify: `src/client/storage/active-trip-store.ts`
- Modify: `src/client/App.tsx`
- Modify: `src/client/components/ActiveTripCard.tsx`
- Modify: `src/client/views/MapView.tsx`
- Modify: `src/client/components/VectorNetworkMap.tsx`
- Modify: `src/client/views/SavedView.tsx`
- Modify: `src/client/components/StationCard.tsx`
- Modify: `src/client/views/StationView.tsx`
- Test: `tests/client/active-trip-store.test.ts`
- Test: `tests/client/offline-state.test.tsx`
- Test: `tests/client/map-view.test.tsx`
- Test: `tests/client/saved-view.test.tsx`

**Interfaces:**
- Produces: response-owned journey capture package with mode, service date, schedule edition/currency/departures, disclosure, and optional owner claims.
- Produces: `VectorNetworkMap` spatial mode input with distinct projection and stable Actual-now reference base.
- Produces: detached Saved draft for every permitted `SavedRecord` field.
- Produces: reusable alert truth presentation driven by demonstration/provenance/timestamp/historical state.

- [ ] **Step 1: Write failing timed-capture, map deferred-switch, complete Saved draft, and alert-truth tests**

```ts
expect(reloaded.validity.schedule).toEqual(exactScheduleFixture);
expect(screen.queryByText(/not-supplied/)).not.toBeInTheDocument();
expect(screen.queryByText('day-line')).not.toBeInTheDocument();
expect(cancelledBytes).toBe(originalBytes);
```

- [ ] **Step 2: Run focused tests and observe fabricated capture, stale geometry, partial edit, and current-looking alert failures**

- [ ] **Step 3: Preserve exact evidence, render a stable Actual base plus overlay, implement real projections, complete detached editing, and centralize alert truth**

- [ ] **Step 4: Verify optional evidence omission, blocked incomplete capture, truthful locked map copy, and byte-preserving Cancel**

- [ ] **Step 5: Commit**

Run: `git commit -m "make subway controls truthful"`

### Task 5: End-to-end acceptance, report, and completion

**Files:**
- Modify: `tests/e2e/offline-pwa.spec.ts`
- Create: `.superpowers/sdd/2026-08-04-nyc-subway-tracker-implementation-plan/task-12-fix-round-1-report.md`

**Interfaces:**
- Consumes: all previous task interfaces.
- Produces: first-visit offline reload, zero-POST offline planning, online-navigator historical fallback, five-stage recovery, and map-control browser acceptance.

- [ ] **Step 1: Remove the second controlled online reload and add complete browser acceptance assertions**

- [ ] **Step 2: Run focused suites, full Vitest, typecheck, production build, and system-browser smoke**

- [ ] **Step 3: Write the detailed fix report with RED/GREEN evidence, commit hashes, browser observations, and any explicit environment limitation**

- [ ] **Step 4: Run `git diff --check` and source/scope scans**

- [ ] **Step 5: Commit final report-only changes if necessary**

Run: `git commit -m "verify underground journey continuity"`
