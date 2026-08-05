# Task 13 report: accessible paths, equipment truth, and conditional platform guidance

## Outcome

Implemented Task 13 as a fail-closed accessibility evidence layer. The product can validate complete direction-and-platform-specific step-free paths, join them to exact official equipment identifiers, assess current route-critical equipment truth, classify path impact, rank explicit accessible alternatives, preserve warnings once a rider may have passed the last decision point, and resolve platform-position guidance only inside its reviewed scope.

No accessibility or positioning claim is publicly activated by this task. The production path and guidance registries remain empty, and separate typed public exposure decisions remain locked. Validation can exercise reviewed synthetic packages; future public evaluation requires immutable, reviewed, same-version approval evidence. Public platform guidance additionally requires its own same-version release package decision to be `approved`, while a `pending` package is limited to validation.

## Delivered behavior

- Added strict validation for the complete 26-field station-direction coverage row, including nested identity, exact scope, verifier/reviewer decisions, structural evidence, canonical path identity, ordered edge endpoints and levels, official accessible-station membership, official equipment identifiers, and same-version review evidence.
- Kept app-owned structural path evidence separate from GTFS-derived station notes and optional official equipment ingestion. Missing optional official equipment data becomes unavailable evidence rather than an invented outage or a false accessible claim.
- Added exact equipment-status decisions with the specified 5-minute current boundary, 15-minute stale boundary, anomaly thresholds, seven-day inventory cutoff, provisional-empty handling, target absence, restoration chronology, and freshness-specific rider copy.
- Added exact station, route, direction, platform, and equipment joins. A missing or non-joinable machine produces `unknown`; it is never described as an outage without official evidence.
- Added path-impact precedence for unrelated, reroutable, and blocking conditions. Reroutability is derived from complete edge-level structural, current, and official evidence for the exact scope, not from a summary Boolean.
- Added deterministic four-tier accessible alternatives with canonical within-tier ordering, explicit bus choice, and no automatic selection.
- Added underway warnings tied to the exact last decision point. Warnings appear immediately when that point is possibly passed or unknown, persist through uncertain updates, and clear only on an explicit safe transition.
- Added strict 38-field platform-guidance records, exact complex/constituent/route/service-pattern/direction/destination/platform/orientation/objective/path matching, reviewed provenance, structured release packages, and clean omission for reroutes, uncertain platforms, stale review state, or any scope mismatch.
- Added typed accessibility and guidance exposure decisions. Evaluation recursively freezes decision evidence, rejects owner/version/review mismatches, and permits public evaluation only with an immutable reviewed same-version approved decision.
- Added warning-first accessibility and platform-guidance components with semantic alerts, keyboard-operable actions, visible focus, 48px controls, compact dark-first styling, reduced-motion behavior, and forced-color support.
- Added an end-to-end public-boundary assertion that the rendered app and API expose no crowding fields, proxies, placeholders, or controls.

## Public activation boundary

The new components and evaluators are intentionally not mounted into the public rider flow. Existing server exposure locks for accessibility and guidance remain independent and closed; mounting validation fixtures would imply reviewed production truth that does not exist. The production registries are empty, and the public exposure constants are deeply frozen locked decisions. This task therefore delivers the evidence model, runtime decisions, and tested presentation modules without widening public claims.

## TDD evidence

The first exploratory run failed during import collection because the target modules did not yet exist. That run was diagnostic only and is not treated as the governing RED.

The governing RED was captured after adding compilable no-behavior scaffolds:

`npm test -- --run tests/domain/accessible-path.test.ts tests/domain/path-impact.test.ts tests/domain/accessibility-alternatives.test.ts tests/domain/underway-warning.test.ts tests/domain/platform-guidance.test.ts tests/client/accessibility-panel.test.tsx`

- 6 test files collected, 51 tests executed.
- 47 failed and 4 passed against explicit `not implemented` behavior, a null guidance registry, and absent alert/action presentation.

Subsequent focused RED/GREEN cycles covered:

- Guidance expiry honesty: one focused failure before removing the invented time expiry; 5/5 passed afterward.
- Exact orientation: one focused failure before orientation became mandatory and exact; the focused suite passed afterward.
- Strict evidence audit: 74 focused tests produced 8 expected failures for nested evidence, optional equipment absence, future restoration chronology, summary-Boolean rerouting, structured release evidence, and possibly-passed decision points; all 74 passed after implementation.
- Typed exposure audit: 61 focused tests produced 3 expected failures for locked public accessibility, the empty production guidance gate, and approved-public guidance; all passed after typed owner/version/review gates were added.
- Final release audit: 7 focused platform-guidance tests produced 2 expected failures independently—pending release data leaked under public approval, and the nested approval object remained mutable. After modeling `pending | approved`, requiring approved public release, and recursively freezing exposure evidence, all 7 passed.

The completed focused accessibility matrix passed 6 files and 85 tests before the final release audit; the additional release test raises the final domain/client total reported below.

## Verification evidence

- Focused final release regression: 1 file, 7/7 tests passed.
- Accessibility-focused matrix: 6 files, 85/85 tests passed.
- Domain and client regression: 46 files, 652/652 tests passed.
- Full Vitest regression: 56 files, 838/838 tests passed.
- TypeScript validation: `tsc --noEmit` passed with zero diagnostics.
- Production build: Vite transformed 66 modules and completed successfully.
- Browser end-to-end verification in installed Chrome: 4/4 flows passed, including the no-crowding public boundary, device-held offline references, historical cached-board treatment, and ordered owner restoration.
- Diff hygiene: `git diff --check` passed; only repository line-ending notices were emitted.

## Files changed

Production implementation:

- `src/shared/domain/accessible-path.ts`
- `src/shared/domain/equipment-status.ts`
- `src/shared/domain/path-impact.ts`
- `src/shared/domain/accessibility-alternatives.ts`
- `src/shared/domain/underway-warning.ts`
- `src/shared/domain/platform-guidance.ts`
- `src/shared/domain/exposure-decision.ts`
- `src/server/accessibility/path-evidence-loader.ts`
- `src/server/accessibility/station-accessibility-loader.ts`
- `src/shared/data/platform-guidance.json`
- `src/shared/index.ts`
- `src/client/components/AccessibilityPanel.tsx`
- `src/client/components/PlatformGuidance.tsx`
- `src/client/styles/global.css`

Test coverage:

- `tests/domain/accessible-path.test.ts`
- `tests/domain/path-impact.test.ts`
- `tests/domain/accessibility-alternatives.test.ts`
- `tests/domain/underway-warning.test.ts`
- `tests/domain/platform-guidance.test.ts`
- `tests/client/accessibility-panel.test.tsx`
- `tests/e2e/offline-pwa.spec.ts`

## Strict self-review

- Evidence completeness: path admission requires every required root and nested field, complete ordered edges, exact official membership/equipment joins, and review/version coherence. Labels and partial station accessibility are rejected.
- Truthfulness: unavailable or stale live equipment evidence becomes `unknown`; structural-only offline copy does not imply live operability; restoration is not accepted without a coherent outage/restoration pair.
- Exact scope: all path and guidance decisions match the constituent station, route/service pattern, normalized direction, directional platform, orientation, objective, and relevant evidence version.
- Reroute safety: alternate viability is recomputed from edge-level evidence and cannot be asserted by a caller-supplied summary flag.
- Underway safety: last-decision-point warnings are immediate under possible passage, survive uncertainty, and do not disappear without a verified safe transition.
- Release governance: validation and public exposure are distinct typed states; public path evaluation needs immutable reviewed same-version approval, and public guidance also needs the record release package to be approved rather than pending.
- Immutability: registries and exposure decisions are recursively frozen, including nested approval and release/provenance structures.
- UI accessibility: alerts are semantic, actions are native keyboard buttons, focus remains visible, targets meet the 48px contract, and reduced-motion/forced-color behavior is defined.
- Scope discipline: no crowding schema, control, placeholder, or proxy was added; the E2E suite proves the public boundary remains empty of crowding concepts.
- Production honesty: no fixture is exposed as production evidence, and dormant components are not mounted while the independent public gates remain closed.

## Commits

- `46257ac add honest subway accessibility tools`
- `1953ccb tighten accessibility exposure evidence`
- `33fc4f5 require approved guidance releases`

## Concerns

None. Public activation remains intentionally blocked until real reviewed path and guidance packages receive the separate same-version approvals modeled here.

---

## Fix round 1 — accepted review repairs (2026-08-05)

### Outcome

All round-one findings are repaired. Accessibility claims now cross public domain and component boundaries only as app-resolved opaque decisions. Legacy scalar path/platform claims are migrated out of v3 storage without being rendered or converted into recovery ownership. Production accessibility and guidance registries remain empty and public exposure remains locked.

### Repairs

- Removed persisted scalar platform-guidance and accessible-path claims from the active-trip public model, renderer, and App recovery scopes. The v3 reader strips those legacy keys while preserving unrelated trip evidence and the rider's Accessible Route Only preference.
- Replaced caller-supplied exposure approvals with app-owned immutable registries, exact five-role structured reviews, release decisions, version/owner/chronology validation, duplicate rejection, and opaque resolved exposure tokens. Accessibility and guidance evaluators and components reject copied or forged approval/result objects.
- Replaced scalar equipment status/restoration inputs with accepted immutable inventory, snapshot, and restoration records. Decisions bind exact equipment ID, owner, scope, version, snapshot, assessment time, and adverse record identity.
- Restoration now requires an exact outage/machine/scope/version join and valid source/acceptance/assessment chronology, or two coherent consecutive same-version omission snapshots ending at the current snapshot. A current exact adverse record always wins.
- Enforced the strict greater-than-10% malformed, duplicate, and unmatched population thresholds, exact 5/15-minute freshness boundaries, seven-day inventory expiry, target identity binding, current-adverse priority, mutation isolation, and deep freezing.
- Replaced path-impact and alternative verification booleans with opaque accessible-path and equipment decisions. Impact results and alternative selections are opaque and immutable; rerouting requires an independently resolved eligible same-scope path and never auto-selects it.
- Replaced warning lifecycle clearing booleans with opaque eligible path reevaluations. Warning creation requires resolved impact and alternative decisions; copied warnings/selections are omitted by the component; single-machine restoration still cannot clear a path warning.
- Enforced exact root and nested schemas for path packages, coverage rows, reviews, endpoints, guidance rows, release packages, and provenance. The runtime guidance schema now validates all 40 modeled fields, including `position` and `provenance`.
- Added explicit domain schema rejection of crowding fields alongside the existing API allowlist, component omission, source scan, and browser public-boundary test.

### RED/GREEN evidence

- Legacy claim boundary: 3 focused failures in 38 tests; then 38/38 passed plus type checking.
- Exposure ownership: 2 caller-forgery failures in 62 tests, 12 registry-validation failures in 13 added cases, and 1 component-result forgery failure in 5 tests; final combined matrix 80/80 passed plus type checking.
- Equipment evidence: 12 expected chronology/scope/sequence failures in 76 tests; then 76/76 passed. The scalar equipment component claim added 1 focused failure before the complete equipment/path/component matrix passed 81/81 plus type checking.
- Exact schemas: 2 focused failures in 54 path/guidance tests; then 54/54 passed plus type checking.
- Opaque impact/alternative/warning/component matrix: 4 files and 26/26 tests passed after replacing the reviewed scalar APIs.

### Final verification

- Full Vitest regression: **58 files, 881/881 tests passed**.
- TypeScript: `tsc --noEmit` passed with zero diagnostics.
- Production build: Vite transformed **66 modules** and completed successfully.
- Browser acceptance in installed Chrome: **4/4 tests passed**, including the recursive public no-crowding boundary and the existing offline/recovery flows.
- Focused equipment/path/component matrix: **3 files, 81/81 tests passed**.
- Focused path-impact/alternative/warning/component matrix: **4 files, 26/26 tests passed**.
- Diff hygiene: `git diff --check` passed; repository line-ending notices were non-failing.

### Fix commits

| Commit | Lowercase subject | Review area |
|---|---|---|
| `c4c6129` | `close legacy accessibility claim leaks` | persisted and rendered scalar claims |
| `f6e0afc` | `resolve app owned accessibility approvals` | app-owned registries and opaque exposure/results |
| `aab197f` | `bind equipment evidence to accepted records` | exact equipment identity, chronology, recovery, anomalies, UI boundary |
| `1f12595` | `enforce exact accessibility schemas` | path and platform exact root/nested schemas |
| `2f3db8d` | `resolve accessibility impact decisions` | opaque path impact, alternatives, warnings, and component consumption |

### Release posture

This remains a deterministic validation candidate, not public accessibility evidence or a release approval. Real reviewed same-version path, equipment, guidance, five-role review, and release records are still required before either independent public gate can open.

---

## Fix round 2 — accepted review repairs (2026-08-05)

### Outcome

Round two closes findings 1–7 and 9. Finding 8 was already closed by the controller and required no change. Every accepted decision now owns the complete immutable evidence needed for its claim, exact schemas reconstruct canonical data rather than trusting caller objects, and recovery or replacement evidence cannot revive expired, copied, stale, mismatched, or superseded accessibility facts. Production registries remain empty and both public exposure gates remain locked.

### Repairs

1. Exposure approval is now valid only while every linked review, release, and exposure fact is current at evaluation time. Expired or superseded linked evidence fails closed even when a copied decision object still exists.
2. Accessibility recovery no longer restores unreleased claims. The active-trip and reconnection boundaries retain rider-owned preferences while refusing inaccessible legacy or unapproved accessibility state.
3. Equipment decisions now own canonical inventory and snapshot history, enforce exact population arithmetic and chronology, prioritize current adverse evidence, reject stale or copied path decisions, and require a coherent accepted recovery sequence.
4. Path-impact and alternative decisions own exact path, equipment, request, and route facts. Genuine decisions for another path, scope, alternative, or version cannot be replayed, and a healthy member does not erase another member's path impact.
5. Underway warnings own their impact, selection, decision point, path package, offered alternatives, and lifecycle chronology. They survive expiry of the original evidence until a fresh owner reevaluation proves a safe transition; copied or wrong-path warning inputs are omitted by the component.
6. Accessible-path packages now use exact reconstructed schemas for directions, movements, identities, strings, booleans, dates, endpoints, levels, membership, equipment joins, coverage, versions, and approval receipts. Unsupported claims, duplicate rows, extra membership, invalid chronology, and copied approvals are rejected.
7. Platform-guidance records now use exact reconstructed schemas for the complex, constituent, service scope, platform, orientation, objective, path, position, five role reviews, reverification, disposition, release, and provenance. Supported and unsupported scope facts cannot collide; geometry, position, and zone benefit must agree; release and provenance must join the same package/version and valid chronology. The documented old-verification-date plus explicit-current behavior is preserved without inventing an expiry.
9. Negative mismatch coverage was expanded across path impact, alternatives, warnings, path packages, platform guidance, and UI consumption so independently genuine but wrong-scope evidence cannot satisfy another claim.

### RED/GREEN evidence

- Exposure lifetime: 5 focused exposure failures and 3 evaluator-expansion failures were captured before the repair; the final combined matrix passed **3 files, 76/76 tests**.
- Recovery boundary: **2/13** focused recovery cases and **1/6** public-component cases failed before release ownership was enforced; the final boundary matrix passed **6 files, 112/112 tests**.
- Equipment history: the initial audit produced **4/36** expected failures, the chronology expansion produced **1/41**, and the stale path-decision expansion produced **1/49**; the controller matrix passed **6 files, 117/117 tests**.
- Path impact and alternatives: the first audit produced **3/12** expected failures and the healthy-member expansion produced **1/7**; the domain matrix passed **67/67**, the warning expansion passed **79/79**, and the UI/guidance slice passed **16/16**.
- Underway warnings: the first audit produced **4/15** expected failures and the component expansion produced **2/9**; the final warning matrix passed **43/43** and the controller slice passed **93/93**.
- Accessible-path schemas: the governing audit produced **14/64** expected failures and the receipt chronology/package-identity expansion produced **2/66**; the final path suite passed **66/66** and the dependent accessibility matrix passed **6 files, 150/150 tests**.
- Platform-guidance schemas: the governing audit produced **11/21** expected failures; the strengthened final suite passed **31/31 tests**.
- Full Task 13 dependent matrix after all repairs: **13 files, 296/296 tests passed**, including exposure, equipment, path, impact, alternatives, warnings, guidance, UI, active-trip/reconnection, API, and crowding-negative boundaries.

### Final verification

- Full Vitest regression: **58 files, 954/954 tests passed**.
- TypeScript: `tsc --noEmit` passed with zero diagnostics.
- Production build: Vite transformed **66 modules** and completed successfully.
- Browser acceptance in installed Chrome: **4/4 tests passed**, covering the recursive no-crowding public boundary, device-held offline references, historical cached-board treatment, and ordered owner restoration.
- Diff hygiene: `git diff --check` passed; repository line-ending notices were non-failing.

### Fix commits

| Commit | Lowercase subject | Review area |
|---|---|---|
| `004b8fd` | `expire linked exposure decisions` | exposure lifetime and linked-evidence validity |
| `f5e5aad` | `lock unreleased accessibility recovery` | recovery and legacy claim boundary |
| `5d46352` | `own canonical equipment history` | equipment population, chronology, restoration, and identity |
| `d9085ef` | `own path and alternative facts` | path impact, alternatives, and mismatch ownership |
| `38a1afa` | `bind underway warnings to owned evidence` | warning creation, persistence, clearing, and rendering |
| `f668d22` | `enforce exact accessibility path packages` | exact path, coverage, and approval schemas |
| `78b0d95` | `enforce exact platform guidance records` | exact guidance, review, release, and provenance schemas |

### Release posture

This remains a deterministic validation candidate, not public accessibility evidence or a release approval. Public accessibility and platform guidance stay unavailable until real, reviewed, exact-scope, same-version evidence satisfies their independent app-owned gates.
