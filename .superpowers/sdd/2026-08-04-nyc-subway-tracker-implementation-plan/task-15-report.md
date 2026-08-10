# Task 15 implementation report

## Outcome

Task 15 is implemented on `product-delivery-execution` from base `f6651c12be4aeb91955b361750c2000737373598`. The validation build now has bounded status diagnostics, strict client parsing, reachable Data Status and Settings surfaces, exact device-data reset outcomes, an isolated official-source shadow runner, and fresh-checkout/operator documentation. All nine exposure stages remain immutable and closed. No Task 16 work or controller progress file was changed.

Implementation commit: `284fb8a` (`document and diagnose subway data`). This report is committed separately after the implementation hash exists; its hash is included in the controller handoff because a commit cannot contain its own hash.

## Files

- Status/API: `src/server/routes/status.ts`, `src/server/services/board-service.ts`, `src/client/api/client.ts`, `tests/server/status.test.ts`, `tests/client/status-client.test.ts`, `tests/helpers/client-fixtures.ts`.
- Rider surfaces and reset lifecycle: `src/client/App.tsx`, `src/client/components/AppHeader.tsx`, `src/client/views/DataStatusView.tsx`, `src/client/views/SettingsView.tsx`, `src/client/state/app-state.tsx`, `src/client/storage/active-trip-store.ts`, `src/client/hooks/use-notifications.ts`, `src/client/styles/global.css`, `tests/client/data-status-view.test.tsx`, `tests/client/settings-view.test.tsx`.
- Shadow validation: `scripts/live-shadow.ts`, `src/server/services/shadow-progress.ts`, `tests/server/live-shadow.test.ts`, `tests/server/shadow-progress.test.ts`, `package.json`.
- Operator documentation/configuration: `README.md`, `docs/testing.md`, `docs/data-sources.md`, `.env.example`.

## RED evidence

All implementation began at a normalized governing failure:

1. `npm test -- --run tests/server/status.test.ts` — 1 of 4 tests failed because `data.diagnostics` was absent; the other locked-mode/privacy assertions already normalized.
2. `npm test -- --run tests/client/status-client.test.ts` — 4 of 4 failed because the real `TransitApiClient` did not have a `status()` boundary.
3. `npm test -- --run tests/client/settings-view.test.tsx` — 2 of 2 failed because Settings was not reachable and neither reset action existed.
4. `npm test -- --run tests/client/data-status-view.test.tsx` — 1 of 1 failed because Data Status and its source-age cadence were absent.
5. `npm test -- --run tests/server/live-shadow.test.ts` — 1 of 1 failed because `scripts/live-shadow.ts` did not exist.
6. First post-implementation `npm test -- --run` — 1 of 1,047 tests failed (`tests/client/nearby-view.test.tsx`); adding two destinations to the primary thumb dock violated its exact four-destination layout contract. Data Status and Settings were moved to header utility navigation, restoring the approved bottom dock.
7. `npm test -- --run tests/server/shadow-progress.test.ts` — 1 suite failed before collection (0 tests run) because the governing `shadow-progress` module did not yet exist.
8. `npm test -- --run tests/server/shadow-progress.test.ts tests/server/live-shadow.test.ts; npm run typecheck` — 1 of 4 tests failed because the unchanged-stop fixture reused the same observation time; typecheck passed. The fixture was corrected to represent a genuinely later observation. This was a test-data correction, not a weakening of the comparator.

## GREEN progression

- Status server reached 4/4: exact non-negative source age, sanitized public source/reason ownership, all nine locked gate records, validation-only diagnostics, and no rider/coordinate/permission/secret leakage.
- Strict status client reached 4/4: exact schema, runtime/surface agreement, source-health ownership agreement, paired age/timestamp fields, ordered nine-gate parity, and fail-closed rejection of expansion, fractional age, or an opened gate.
- Settings reached 2/2: event-driven confirmation, broad reset, separate notification reset, retained structural assets, and exact `Deleted` / `Not present` / `Failed` category results.
- Data Status reached 1/1 with rider-readable age cadence, source state language, locked release areas, and no personal diagnostics.
- Shadow dry composition reached 1/1 with eight registry-owned operational sources, nine locked stages, no rider board exposure, and no network dependency.
- Later-stop comparison reached 3/3 and now reports `progressed` only when the later next stop occurs after the earlier next stop in the earlier bounded stop sequence. Changed but unproven stops are `inconclusive`.
- Combined focused Task 15 suite: 5 files, 12/12.
- Focused reset/privacy/status/storage regression selection: 10 files, 103/103.
- Broader relevant privacy/status/storage/API matrix: 15 files, 172/172.

## Full verification

- Starting baseline before changes: 63 files, 1,035/1,035 tests passed.
- Final `npm test -- --run`: 69 files, 1,050/1,050 tests passed.
- Corrected documented focused command, `pnpm test --run tests/server/status.test.ts tests/client/status-client.test.ts tests/client/data-status-view.test.tsx tests/client/settings-view.test.tsx tests/server/live-shadow.test.ts`: 5 files, 12/12 passed.
- An initial documentation smoke used `pnpm test -- --run ...`; pnpm forwarded a literal extra separator, so it ran the full suite (69 files, 1,050/1,050) rather than the intended focus. `docs/testing.md` was corrected to `pnpm test --run ...`, and the corrected command produced the focused 5-file/12-test result above.
- `npm run typecheck`: passed with no diagnostics.
- `npm run build`: passed; 70 modules transformed, client CSS 29.09 kB and JS 416.92 kB before gzip.
- Installed Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe`, `npm run test:e2e`: 5/5 passed.
- `pnpm run shadow:dry-run`: passed with `DRY_RUN_NO_NETWORK`, 8 official sources, 9/9 gates closed, no boards exposed.
- `git diff --cached --check`: passed before the implementation commit. The final report-only diff also passes `git diff --check`.
- `.data/shadow` output is confirmed ignored by `.gitignore`; no runtime record is staged.

## Live shadow result

`npm run shadow:live` completed without changing any exposure decision and wrote ignored record `.data/shadow/shadow-2026-08-10T07-24-20.556Z.json`.

- Outcome: `COMPLETED_WITH_SOURCE_FAILURES`.
- Sources: 8 attempted; 8 recorded `failed` with bounded reason `SOURCE_RETRIEVAL_OR_VALIDATION_FAILED`.
- `subway-rt-l` recorded a retrieval timestamp before its later decode/validation failure; the other seven had no accepted retrieval provenance.
- Gates: 9/9 closed; `riderExposure=false`; `boardsExposed=false`.
- Progress: 0 candidates and 0 comparisons because no realtime snapshot was accepted. This is recorded as an external-source/validation limitation, not converted into success and not used to weaken tests.

The runner uses the official source registry, coordinator, source-fetch/atomic-cache path, ignored local storage, bounded safe reason codes, and an optional earlier-record comparison. It never calls board projection and never mutates exposure configuration.

## Visual and React self-review

- Preserved the dark platform-spine tokens and the exact four-action fixed thumb dock. The two secondary surfaces use wrapping header utility navigation so primary rider actions retain bottom-third reach.
- Data Status has one subject-specific visual signature: a compact source-signal strip with age cadence. It does not resemble a generic admin dashboard.
- Source rows collapse to two columns below 25rem, identifiers wrap, utility/actions wrap, and no fixed content width prevents 200% zoom use.
- Existing global keyboard focus remains visible; controls are native buttons; results use polite status regions; confirmation has a labeled group.
- No new animation was added, so reduced-motion behavior is unchanged. The source marker received explicit system colors for forced-colors mode after self-review.
- Components remain module-level. Status loading has one abortable effect with primitive `api`/`connected` dependencies. Reset confirmation/actions are event-driven. No global listener or heavy dependency was added.
- The notification environment and versioned browser stores are memoized. Successful broad deletion advances a store generation so stale in-memory personal records cannot be written back after deletion.

## Privacy and product-contract self-review

- Diagnostics contain only public source ownership/state/reason/age, public provenance already approved by the existing DTO boundary, explanations, alerts, and immutable gate records.
- Tests forge coordinates, saved labels, active-trip/cursor data, notification data, private-looking source details, and secrets behind the server snapshot; serialized status is verified not to expose them.
- Shadow records contain bounded official source IDs, operational train/source evidence, safe outcome codes, and locked gates; they contain no rider coordinates, labels, saved records, permission state, subscription endpoint/token/key, cursor, active-trip details, or secret.
- Broad reset deletes the versioned saved/commute-intent store, last-station/covered settings, current and legacy active-trip/cursor stores, and notification subscription. It deliberately retains official/structural offline assets.
- Separate notification deletion is available. Copy truthfully states that OS location/notification permissions and Accessible Route Only are not changed.
- Live/shadow status remains `data: null`; validation diagnostics cannot open or fabricate boards, maps, accessibility, guidance, or commute operation. No new release gate, protected logo/map asset, or prohibited rider-data surface was introduced.

## Concerns

The external live-source attempt accepted no complete operational snapshot, so real later-stop comparison could not be exercised in this environment. The isolated comparator and dry composition are governed by deterministic tests, but a future operator should rerun `pnpm run shadow:live` when official endpoints return valid content and use `--compare` against an earlier accepted record. All rider exposure remains locked in the meantime.

## Fix round 1 (2026-08-10)

### Outcome and files

Reviewer round 1 is implemented in `661059284f5de2a45fa78bbaf7636677207b47df` (`tighten task 15 validation truth`). The fix closes all eight Important and two Minor findings without opening a stage. It adds authentic per-station shadow decisions and exact record parsing, atomic shadow persistence, independent and truthful notification deletion, transactionally quiescent broad reset, canonical status-gate parsing, monotonic source age and readable evidence, confirmation focus management, and checkout-root `.env` loading.

Round-1 production/documentation files: `README.md`, `docs/data-sources.md`, `docs/testing.md`, `scripts/live-shadow.ts`, `src/client/App.tsx`, `src/client/api/client.ts`, `src/client/hooks/use-notifications.ts`, `src/client/views/DataStatusView.tsx`, `src/client/views/SettingsView.tsx`, `src/server/index.ts`, `src/server/routes/notifications.ts`, `src/server/services/shadow-progress.ts`, new `src/server/services/shadow-record.ts`, and new `src/server/services/shadow-validation.ts`.

Round-1 governing tests: `tests/client/data-status-view.test.tsx`, new `tests/client/notification-environment.test.ts`, `tests/client/settings-view.test.tsx`, `tests/client/status-client.test.ts`, `tests/server/live-shadow.test.ts`, `tests/server/notifications-api.test.ts`, new `tests/server/server-env.test.ts`, `tests/server/shadow-progress.test.ts`, new `tests/server/shadow-record.test.ts`, and new `tests/server/shadow-validation.test.ts`.

The controller appended one ledger line to `progress.md` before this fix round. That file was never edited or staged by this implementation and remains the sole unstaged worktree change.

### Normalized RED evidence

1. `npm test -- --run tests/client/status-client.test.ts tests/client/data-status-view.test.tsx` — 2 files, 12 tests: 3 failed, 9 passed. Locked `data:null` accepted a malformed gate set; Data Status omitted readable reason/evidence; source age stayed static after 30 seconds.
2. `npm test -- --run tests/server/notifications-api.test.ts tests/client/notification-environment.test.ts tests/client/settings-view.test.tsx` — 3 files, 15 tests: 7 failed, 8 passed. Locked delivery returned 423 for deletion; browser deletion returned no exact remote/local result in all three cases; broad reset did not disable the separate action before its await; a hanging unsubscribe did not report Pending; confirmation was not a dialog and did not manage focus. The deferred stale-write assertion was behind the first quiescence failure and remained governing in the same test.
3. `npm test -- --run tests/server/live-shadow.test.ts tests/server/shadow-progress.test.ts tests/server/shadow-validation.test.ts tests/server/shadow-record.test.ts tests/server/server-env.test.ts` — 5 collected files, 10 collected tests plus 2 suites failing resolution: 7 failed, 3 passed. The runner emitted shadow-v1, accepted missing `--compare`, compared changed targets/removed targets/reroutes as progress, lacked an exact whole-record parser, and lacked both authentic claim projection and atomic writer modules. The first environment attempt exposed two test-harness defects (top-level-await/CJS and a Windows path URL); those were corrected without production changes and are not counted as product REDs.
4. Normalized environment RED after harness correction: `npm test -- --run tests/server/server-env.test.ts` — 1 file, 1 test: 1 failed. A child server started in a fresh checkout directory with validation `.env` still reported `live/public/locked` instead of `validation/demonstration/available`.
5. Reviewer-directed claim-identity expansion: `npm test -- --run tests/server/shadow-validation.test.ts tests/server/shadow-progress.test.ts` — 2 files, 9 tests: 2 failed, 7 passed. Projection emitted one final-stop claim per train (2 instead of 4 per-stop claims), and the comparator's source/train key allowed the A16 claim to overwrite the A14 claim.

### GREEN progression

- Canonical status parsing and rider diagnostics: 2 files, 12/12 passed. The client now requires the exact ordered nine immutable gates with exact reason and decision before either locked or validation data branching. Age advances monotonically from the response as-of time without a network refetch.
- Notification and reset boundaries: 3 files, 15/15 passed. DELETE is independent of delivery authorization; the browser reports exact main/remote/local outcomes for no subscription, `removed:false`, and local unsubscribe false; a five-second hang is Pending. Broad reset disables both actions, invalidates the personal store generation before its first await, aborts all personal request owners, clears personal joins/maps/state, deletes exact keys, and performs a second cleanup after remote work.
- Shadow decisions/comparison/persistence: initially 3 files, 10/10 passed, then 3 files, 11/11 after the claim-identity expansion; the complete malformed-v2 matrix reached 13/13. Projection uses the existing `FeedHealthGovernor`, `evaluateServiceChanges`, and `admitArrivalCandidate` boundaries for every bounded target stop call. Every claim records canonical stop-call identity, target, decision time, exact source/feed provenance, admitted/suppressed disposition, and a bounded suppression reason. The comparator matches source/train/target-call, requires the same route and target to remain in an exact suffix path, and keeps reroutes inconclusive. Any malformed source, gate, metadata, claim, provenance, disposition, admission, path endpoint, or count invalidates the entire prior record.
- Atomic persistence: same-directory unique temporary file, write, file sync, close, and one rename. Fault injection proves a flush failure closes once, removes only its exact temporary path, performs no rename, and leaves no final record.
- Checkout environment and CLI: 2 files, 3/3 passed. Missing `--compare` exits 2 with no stdout; checkout `.env` is loaded before port/config resolution. README and testing documentation now identify separate API and production-preview terminals.

### Full verification

- Focused status/Data Status: 12/12.
- Focused notification/reset: 15/15.
- Focused shadow projection/comparison/atomic writer: 10/10, followed by claim-specific expansion and full v2 validation at 13/13.
- Environment/live-shadow CLI: 3/3.
- Final `npm test -- --run`: 73 files, 1,079/1,079 passed.
- `npm run typecheck`: passed with no diagnostics.
- `npm run build`: passed; 70 modules transformed, CSS 29.09 kB and JS 421.73 kB before gzip.
- Installed Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`) `npm run test:e2e`: 5/5 passed.
- `npm run shadow:dry-run` and the documented `pnpm run shadow:dry-run` both passed with shadow-v2, eight official sources, nine closed gates, no network, no claims, and no rider exposure.
- Documentation smoke used pnpm 10.6.3. The child-process server test proves a checkout-local `.env` reaches the API process; the preview remains a separately documented terminal.
- `git diff --check` and `git diff --cached --check`: passed. Runtime `.data` stayed ignored. Prohibited-field and crowding scans found no diagnostic field, type, module, shell, badge, placeholder, legend, or proxy; matches were only deletion implementation/test terms and documentation stating exclusions.

### Live shadow result

`npm run shadow:live` exited 0 and atomically wrote ignored record `.data/shadow/shadow-2026-08-10T07-58-51.622Z.json`.

- `schemaVersion=shadow-v2`; `outcome=COMPLETED_WITH_SOURCE_FAILURES`.
- Eight official sources attempted; all eight truthfully recorded `failed`; zero accepted claims and zero comparisons.
- Nine gates stayed closed; `riderExposure=false`; `boardsExposed=false`.
- A prohibited-field scan of the written JSON returned no match. No release gate, public board, or normal test was changed by the live attempt.

### Visual, React, accessibility, and privacy self-review

- Data Status retains the dark platform-spine design and its single source-signal/age signature. Rider-readable reason, last-accepted time, as-of time, and gate evidence were added inside the existing responsive strip/list; no admin-dashboard visual language was introduced.
- Settings uses native buttons and a labeled modal dialog. Focus moves to Confirm, Escape/Cancel restores the originating button, status copy is live, and destructive actions remain disabled during either deletion. Existing wrap, focus-visible, forced-color, reduced-motion, and narrow-screen rules remain intact; installed-Chrome E2E and the layout contract pass.
- Effects have primitive ownership (`api`, connectivity, response identity), one bounded interval with cleanup, no duplicate listener, no inline component, and no new dependency. Personal mutation callbacks fail closed while reset is quiescent; request generations and abort owners prevent stale async acceptance.
- Diagnostics and shadow records contain no coordinates, saved record, rider label, active-trip/cursor detail, permission state, push endpoint/token/key, VAPID private key, joinable personal identifier, or secret. Notification endpoint use remains confined to the operational deletion request and is never logged or diagnosed.
- Broad reset retains official/structural offline assets and does not claim to change OS location or notification permission. Accessible Route Only is not silently changed. All capability gates remain immutable and locked.

### Commits and concerns

- Original Task 15 implementation: `284fb8af9550f0be071987cb4510093b284c0f82` (`document and diagnose subway data`).
- Original Task 15 report: `c23c7bb7612c674d7f3df82afc46f3491ef19057` (`record task 15 verification`).
- Fix round 1 implementation/tests/docs: `661059284f5de2a45fa78bbaf7636677207b47df` (`tighten task 15 validation truth`).
- This updated report is committed separately so the implementation hash can be exact.

Concern: the official feeds produced eight source failures in this environment, so no authentic live station claim was available for a later-record comparison. This is a truthful live-shadow outcome, not a weakened test. Deterministic tests exercise admitted and suppressed per-stop claims, exact target-call identity, path progression, reroute inconclusiveness, and whole-record invalidation. A future operator should rerun two accepted live observations before treating comparison evidence as available. No public stage may open from either result.

## Fix round 2 (2026-08-10)

### Outcome and files

Reviewer round 2 is implemented in `724df22f99e8e5e98fe665d3f9f643c8ae222996` (`close shadow evidence gaps`). It closes the remaining authentic-evidence, exact-record/comparison, notification aggregation, bounded-record, and atomic-ownership findings without opening a rider surface or release stage.

Round-2 implementation files are `scripts/live-shadow.ts`, `src/server/services/shadow-progress.ts`, `src/server/services/shadow-record.ts`, `src/server/services/shadow-validation.ts`, and `src/client/hooks/use-notifications.ts`. Governing tests are `tests/server/shadow-progress.test.ts`, `tests/server/shadow-record.test.ts`, `tests/server/shadow-validation.test.ts`, and `tests/client/notification-environment.test.ts`. Operator truth was updated in `docs/data-sources.md` and `docs/testing.md`.

The controller had appended two Task 15 ledger lines to `progress.md` before this round. That file was not edited, staged, or committed by this implementation and remains the sole unstaged change.

### Normalized RED evidence

1. `npm test -- --run tests/client/notification-environment.test.ts tests/server/shadow-record.test.ts` — 2 files, 9 tests: 3 failed, 6 passed. Remote `removed:false` plus successful local deletion was falsely aggregated as Failed; an exclusive-open collision unlinked an unowned temporary path; and an oversized payload reached `open` instead of failing before filesystem work.
2. `npm test -- --run tests/server/shadow-validation.test.ts` — 1 file, 4 tests: 4 failed, 0 passed. A one-snapshot station claim was admitted with manufactured identity/recovery/movement/range evidence and used the intermediate target as destination; stale movement was upgraded from mere presence; an unowned source row was accepted; and the persisted admission decision contained the full nested audit instead of a three-field bounded summary.
3. `npm test -- --run tests/server/shadow-progress.test.ts` — 1 file, 20 tests: 19 failed, 1 passed. The parser rejected the new canonical fixture while retaining legacy permissiveness; suppressed claims were filtered out; exact stop-call occurrences, disposition transitions, canonical source rows/gates/claims, duplicate rejection, and whole-record ownership were absent.
4. Combined normalized governing command, `npm test -- --run tests/client/notification-environment.test.ts tests/server/shadow-record.test.ts tests/server/shadow-validation.test.ts tests/server/shadow-progress.test.ts` — 4 files, 33 tests: 26 failed, 7 passed. This is the aggregate RED for all round-2 findings before production changes.
5. Reviewer-directed exactness expansion, `npm test -- --run tests/server/shadow-progress.test.ts` — 1 file, 24 tests: 4 failed, 20 passed. The exact parser still accepted a zero stop-call sequence, a current feed mislabeled `FEED_NOT_CURRENT`, eligible service mislabeled `SERVICE_CHANGE_NOT_ELIGIBLE`, and a `progressed` row paired with `NEXT_STOP_UNCHANGED`. These cases were added before their parser changes and then made green without weakening other assertions.

### GREEN progression

- Notification deletion now uses local subscription removal as the aggregate deletion fact after an exact successful remote response: false/true and true/true are Deleted; false/false and true/false are Failed; no device subscription remains Not present. Exact remote/local subresults and the existing Pending timeout remain unchanged.
- The atomic writer rejects encoded records above 1,000,000 bytes before generating or opening a temp path. It validates the bounded temporary identity and removes the temp only after this invocation successfully owns an exclusive handle. Flush/close/rename ordering and failure cleanup remain exact.
- Station projection exact-joins the snapshot to one canonical accepted realtime source row across source ID, feed group, observation, retrieval, and SHA-256. Every eligible remaining stop becomes a distinct station claim with an exact canonical stop-call identity, while every intermediate claim retains the train's actual terminal destination.
- The one-snapshot composition no longer calls arrival admission with invented coherent identity, live continuity, movement plausibility, or a synthetic ±15-second range. It fails closed with a compact exact `{kind, disposition, reasonCode}` admission summary. Stale movement receives `STALE_MOVEMENT_EVIDENCE`; otherwise absent trusted history remains `TRUSTED_HISTORY_UNAVAILABLE`. Existing feed-health and service-change decisions are still distilled and recorded.
- A maximal alert fixture and 250 two-stop trains produce exactly 500 compact claims under the fixed encoded ceiling, without official alert text or a full service/rider/raw audit.
- `shadow-v2` parsing now owns the whole exact record: one of three consistent outcomes; exactly eight registry-ordered source rows; exactly nine production shadow-exposure gates; unique claim IDs and canonical claim keys; exact source ownership; exact ordered stop-call identities; compact feed/service/admission schemas; cross-field reason/disposition consistency; exact comparison rows; bounded nested strings/arrays; and total bytes. Any malformed or duplicate row invalidates the whole record; the legacy candidate form is gone.
- Comparison accepts whole earlier/later records, rejects identical record IDs and duplicate keys, includes both admitted and suppressed claims, matches source/train/target stop-call, keeps repeated stop occurrences distinct, owns target stop-call identity in output, records each disposition transition, and reports reroutes or missing target calls as inconclusive. The governing suppressed-to-admitted case advances from A12 to A14 and records `suppressed-to-admitted` plus `NEXT_STOP_ADVANCED`.
- Live composition validates the base and final records before writing, emits canonical dry/accepted/failed source rows, never filters suppressed claims from comparison, and gives accepted-source retrieval time a decision timestamp taken after refresh. A missing `--compare` value still exits 2; a malformed prior file now fails rather than creating a permissive comparison row.
- Round-2 focused GREEN: 5 files, 35/35 tests. The expanded exact parser reached 24/24 after its four-case micro-RED. The documented nine-file diagnostics command reached 60/60.

### Full verification

- Final `npm test -- --run`: 73 files, 1,097/1,097 passed. An earlier full run before the four additional exact parser cases was 73 files, 1,093/1,093.
- Documented focus, `pnpm test --run tests/server/status.test.ts tests/client/status-client.test.ts tests/client/data-status-view.test.tsx tests/client/settings-view.test.tsx tests/client/notification-environment.test.ts tests/server/live-shadow.test.ts tests/server/shadow-validation.test.ts tests/server/shadow-progress.test.ts tests/server/shadow-record.test.ts`: 9 files, 60/60 passed.
- `npm run typecheck`: passed with no diagnostics after the final writer and parser changes.
- `npm run build`: passed; 70 modules transformed, CSS 29.09 kB and JS 421.71 kB before gzip.
- Installed Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe`, `npm run test:e2e`: 5/5 passed.
- `npm run shadow:dry-run` and documented `pnpm run shadow:dry-run`: passed with exact `shadow-v2`, eight `not-run` source rows, nine closed gates, zero claims/comparisons, and no network.
- `git diff --check` and implementation `git diff --cached --check`: passed. `.data/shadow` remains ignored; only the controller-owned `progress.md` change remained outside the implementation commit.

### Live shadow result

`npm run shadow:live` exited 0 and atomically wrote ignored record `.data/shadow/shadow-2026-08-10T08-21-23.581Z-c26a6c15-985c-4464-a56f-7e60b8db5b1f.json`.

- Encoded size: 2,791 bytes, below the fixed ceiling.
- Outcome: `COMPLETED_WITH_SOURCE_FAILURES`; eight official sources attempted, zero accepted, eight failed with exact bounded reason `SOURCE_RETRIEVAL_OR_VALIDATION_FAILED`.
- Claims/comparisons: 0/0 because no canonical source snapshot was accepted; no arrival evidence was fabricated.
- Gates: 9/9 closed; `riderExposure=false`; `boardsExposed=false`.
- A prohibited-field scan found no coordinate, saved record, rider label, active-trip/cursor, permission, endpoint/token/key, private key, secret, or crowding match.

This external failure is truthful shadow evidence, not a test weakening. The deterministic exact-record tests govern suppressed/admitted comparison and repeated stop-call behavior until two accepted official observations are available.

### Visual, React, accessibility, and privacy self-review

- Round 2 changes no rider layout, styling, navigation, motion, zoom behavior, focus flow, or global listener. The approved dark platform-spine UI, bottom-third controls, Data Status signature, Settings confirmation focus management, and all previous installed-Chrome/accessibility checks remain intact.
- The only client production change is the exact notification aggregate truth inside the existing environment boundary. It adds no effect, component, storage, listener, dependency, log, or endpoint exposure.
- Shadow projection persists only bounded operational identifiers, stop-call identities, exact accepted-source provenance, distilled decisions, immutable gate records, and bounded outcome codes. Full `ArrivalAdmissionDecision`, service/rider/raw audit arrays, official alert text, and synthetic confidence/range/continuity data are absent.
- No coordinate, saved record, rider label, active-trip detail, cursor, permission state, push endpoint/token/key, VAPID private key, joinable personal identifier, or secret is emitted or logged. No crowding field/type/module/shell/badge/placeholder/proxy/legend was introduced.
- Public arrival, Nearby, accessibility, guidance, maps/rights, and all four commute stages remain independently locked. Shadow execution never calls public board projection and cannot mutate exposure decisions.

### Commits and concerns

- Original implementation: `284fb8af9550f0be071987cb4510093b284c0f82`.
- Original report: `c23c7bb7612c674d7f3df82afc46f3491ef19057`.
- Fix round 1 implementation: `661059284f5de2a45fa78bbaf7636677207b47df`.
- Fix round 1 report: `d5f55bbde0f36bd7cc53c140c42e7fc23ecc07ba`.
- Fix round 2 implementation/tests/docs: `724df22f99e8e5e98fe665d3f9f643c8ae222996` (`close shadow evidence gaps`).
- This report update is committed separately so the round-2 implementation hash is exact.

Concern: the official live attempt again accepted no complete source snapshot, so the new authentic projection and later physical comparison could not be exercised against current MTA content in this environment. No stage may open from deterministic tests alone. Operators should rerun two accepted observations and inspect exact suppressed/admitted transitions before treating shadow comparison as release evidence.

## Fix round 3 (2026-08-10)

### Outcome and files

Round 3 binds every later comparison artifact to the exact earlier file bytes and exact earlier/later record chronology, adds exact service ownership and alert-source provenance, routes genuine recent-history claims through the issued structured service-change decision and existing arrival-admission boundary, and deterministically budgets maximal valid artifacts under 1,000,000 bytes. Dry runs retain a null comparison context and zero rows. Public boards and every exposure gate remain locked.

Implementation commit: `26e55625d3700523ec9520b8cf6cdad2d6dd40cf` (`bind shadow comparison evidence`). Files: `scripts/live-shadow.ts`, `src/server/services/shadow-progress.ts`, `src/server/services/shadow-validation.ts`, `tests/server/live-shadow.test.ts`, `tests/server/shadow-progress.test.ts`, `tests/server/shadow-round3.test.ts`, `tests/server/shadow-validation.test.ts`, `docs/data-sources.md`, and `docs/testing.md`. The controller-owned `progress.md` remained unstaged and was not edited or committed.

### Normalized RED evidence

1. `npm test -- --run tests/server/shadow-round3.test.ts` — 1 file, 14 tests: 8 failed, 6 passed. Missing context/builder/binding APIs, ungoverned service interval/null ownership, and absent deterministic byte-budget composition were exposed. Six future-schema rejection cases passed only because the then-current parser rejected the new top-level schema, so independent current-schema tests were added before production work.
2. `npm test -- --run tests/server/shadow-progress.test.ts` — 1 file, 27 tests: 3 failed, 24 passed. A valid current-schema control proved the parser accepted source retrieval before observation, source retrieval after decision, and a current feed paired with the degraded reason.
3. `npm test -- --run tests/server/shadow-validation.test.ts` — 1 file, 7 tests: 3 failed, 4 passed. Accepted alert provenance was not joined, a failed alert source could appear service-eligible, and exact recent prior progress could not reach governed admission.
4. `npm test -- --run tests/server/live-shadow.test.ts` — 1 file, 2 tests: 1 failed, 1 passed. Dry output lacked the required null comparison context and exact zero truncation state.
5. Combined normalized governing RED, `npm test -- --run tests/server/shadow-round3.test.ts tests/server/shadow-progress.test.ts tests/server/shadow-validation.test.ts tests/server/live-shadow.test.ts` — 4 files, 50 tests: 15 failed, 35 passed.
6. Self-review RED, `npm test -- --run tests/server/shadow-round3.test.ts tests/server/shadow-validation.test.ts` — 2 files, 23 tests: 3 failed, 20 passed. The parser accepted impossible Gregorian date `20260231` and noncanonical service identities after claim keys were truthfully recomputed, while arrival admission was called without the issued structured service decision, exact claim ID, assessment time, or alert-context ownership.
7. Alert-context exactness RED, `npm test -- --run tests/server/shadow-round3.test.ts` — 1 file, 17 tests: 1 failed, 16 passed. The parser accepted a noncanonical alert-context identity.

### GREEN progression

- `shadow-v2` now contains an exact comparison context: earlier record ID, SHA-256 of the exact earlier file bytes, earlier decision/recorded times, later record ID, later decision/recorded times, exact interval, and the fixed 900,000 ms maximum. A dry record must have a null context, zero claims/comparisons, and zero considered counts.
- Every comparison row owns exact earlier and later claim keys (or explicit null), exact earlier/later observations, source/train/service/target-call ownership, and disposition transition. Both admitted and suppressed claims participate. Null or changed service ownership, over-limit intervals, missing retained claims, reroutes, changed paths, non-later observations, and missing targets remain explicit inconclusive outcomes rather than progress.
- The CLI reads and preserves the exact prior bytes, parses the entire prior record, hashes those bytes, constructs the later context, recomputes deterministic comparison rows, exact-matches serialized rows and truncation counts, and only then calls the atomic writer. Missing `--compare` remains an exit-2 failure.
- Accepted source chronology is enforced as `observedAt <= retrievedAt <= decisionTime <= recordedAt`; claim and comparison chronology is bounded by the same owning decisions. Feed kind/reason pairs are exact: `current/accepted-current`, `degraded/snapshot-age-degraded`, and `unavailable/snapshot-age-unavailable`.
- Service dates must be real Gregorian `YYYYMMDD` values. Service-instance IDs and claim IDs/keys are canonical SHA-256 identities, preserving exact service-date/instance ownership without unbounded raw identity strings.
- Every projected service summary binds the canonical alert source. Accepted alert context contains only source ID, observed/retrieved instants, source SHA-256, and a bounded digest of the issued alert context. Failed alert context is an exact three-field failure record and can never be eligible. Stale accepted alert evidence is quarantined and cannot influence admission.
- A single observation stays suppressed. With an exact recent prior record, same non-null service instance, exact suffix progress, current movement, exact future stop call, eligible feed/service/track, and unchanged destination/direction, projection calls `admitArrivalCandidate` with the issued full `ServiceChangeDecision`, exact service claim ID, exact assessment epoch, and exact internal alert-context identity. Only its admitted result becomes the compact persisted admitted summary; the full decision, alert text, supported range, identity/recovery/movement internals, and audit arrays are never serialized.
- The bounded builder orders claims and comparisons canonically, reserves independent partitions for claims/comparisons and the fixed envelope, retains deterministic prefixes, and records considered/included/omitted counts plus `NOT_TRUNCATED` or `BYTE_BUDGET_EXHAUSTED`. The governed 500-candidate/64-call maximal case retains honest claims and comparisons below 1,000,000 bytes in identical order regardless of input order.
- Focused final GREEN: `npm run typecheck` passed, then the four governing files passed 53/53 tests. The wider shadow/status regression passed 58/58 before the final identity-hardening additions.

### Full verification and live shadow

- `npm test -- --run`: 74 files, 1,120/1,120 passed.
- `npm run typecheck`: passed with no diagnostics.
- `npm run build`: passed; 70 modules transformed, CSS 29.09 kB and JS 421.71 kB before gzip.
- Installed Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`), `npm run test:e2e`: 5/5 passed.
- `npm run shadow:dry-run` and the documented `pnpm run shadow:dry-run`: both passed with exact eight not-run sources, nine closed gates, null comparison context, zero claims/comparisons, exact zero truncation, and no network.
- `npm run shadow:live`: exited 0 and atomically wrote ignored artifact `.data/shadow/shadow-2026-08-10T08-55-51.936Z-f560e101-7afa-46b2-87d4-48c70d7b2090.json`, 3,026 bytes. Outcome was truthfully `COMPLETED_WITH_SOURCE_FAILURES`: 0 accepted and 8 failed official sources, 0 claims/comparisons, 9/9 gates closed, `riderExposure=false`, and `boardsExposed=false`.
- The live artifact privacy scan found no coordinate, saved-record, rider-label, active-trip/cursor, permission, endpoint/token/key, private-key, secret, or crowding match. `git diff --check` and staged diff hygiene passed; runtime `.data` remained ignored.

### Visual, React, accessibility, privacy, and concerns

Round 3 changes only the isolated server-side shadow composition, exact parser/comparator, tests, and operator docs. It changes no rider UI, React effect/listener/storage behavior, navigation, focus, zoom, reduced-motion behavior, or CSS. The prior installed-Chrome Settings/Data Status/accessibility verification remains green, and all independent public/commute exposure decisions remain immutable and closed.

Persisted shadow records contain bounded non-personal operational evidence only. They contain no full `ArrivalAdmissionDecision`, raw service/audit/rider arrays, official alert text, coordinate, rider record/label, active trip/cursor, permission state, push credential, private key, secret, joinable personal identifier, or crowding construct. No public board path is called and no release gate is mutated.

Concern: the current official-source attempt accepted 0 of 8 sources, so real-network admission and bound two-record comparison could not be observed here. This is a truthful external-source outcome, not a weakened test. Deterministic tests prove authentic suppression-to-admission through the existing structured service/admission boundaries, but operators must capture two accepted official observations within 15 minutes before treating live comparison evidence as available. No stage may open from this result.
