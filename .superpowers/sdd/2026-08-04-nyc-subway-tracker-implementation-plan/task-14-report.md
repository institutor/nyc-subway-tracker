# Task 14 report: commute windows and material notifications

## Outcome

Implemented Task 14 as a fail-closed commute-notification validation build. The app now has an honest Commute destination backed by the existing device-held `SavedRecord.timeWindow` data, a separate explicit runtime-window model, New York/DST-aware half-open recurrence evaluation, exact route/direction/segment relevance, deterministic action ranking, episode deduplication, material-escalation handling, bounded exact-scope subscription storage, local VAPID key persistence, an injected Web Push sender boundary, service-worker push/click handling, and strict notification API routes.

No public pilot or delivery stage was opened. Production notification dependencies and the mounted client surface remain disabled by default. Deterministic-test and silent-evaluation stages cannot subscribe or deliver; a closed gate performs no capture, evaluation, subscription, delivery, or advancement. Draft/Pending product artifacts were used only as conservative implementation constraints and never as release approval.

## Runtime and persistence shape

- Existing `SavedRecord` and browser storage v2 remain unchanged. No migration, home/work inference, coordinate capture, or field borrowing across records was introduced.
- `CommuteRuntimeWindow` is an explicit non-persisted evaluation record containing the saved-record identity, lifecycle, selected weekdays, half-open local start/end, preparation lead, explicit stage, notification authorization, and an exact transit scope: route, normalized direction, actual destination, origin, destination, and used segment station IDs.
- Recurrence uses the shared New York clock helpers. Weekdays belong to the local start date, overnight windows cross to the following local date, nonexistent spring-forward endpoints produce no occurrence, repeated fall-back times share one occurrence identity, the opening boundary is inclusive, and the end boundary is exclusive.
- `CommuteStage` is mapped explicitly rather than by ordinal or string coincidence: `disabled -> null`, `deterministic-test -> commute-evaluation`, `silent-evaluation -> commute-silent`, `pilot -> commute-limited-pilot`, and `delivery -> commute-delivery`.

## Web Push and server boundaries

- `WebPushSender` is injected into the monitor and returns only `delivered`, `invalid-subscription`, or `failed`. Invalid subscriptions are deleted explicitly; secrets and subscription tokens never enter payloads, logs, diagnostics, client responses, or fixtures outside bounded synthetic test values.
- The local VAPID store generates a P-256 key pair, atomically persists one versioned bounded record with private-file mode where supported, caches one load/create promise, and exposes the private key only through its server-side return value.
- The subscription store is bounded, canonical, immutable at its public boundary, HTTPS-only, token-limited, and now requires one to 128 exact saved commute-window IDs. Omitted/empty scope is rejected and never treated as a wildcard.
- Notification routes preserve the operational API contract: GET for the public key, POST/DELETE for subscriptions, strict exact query/body shapes, 16 KiB JSON ceiling, no-store responses, and method allowlists. Pilot/delivery plus an explicit open gate are required before subscription.
- Push data is bounded and exact-schema validated in the service worker. Notification clicks navigate or open the same-origin `/?surface=commute` target. Reconnect performs only a current evaluation and never replays a missed candidate.

## TDD evidence

### Governing RED

Command:

`npm test -- --run tests/domain/notification-decision.test.ts tests/server/commute-monitor.test.ts tests/client/commute-view.test.tsx`

- **3/3 suites failed during collection; 0 tests executed.**
- Expected cause: the three required production modules did not yet exist (`notification-decision`, `commute-monitor`, and `CommuteView`). This was the normalized governing production break before implementation.

### Boundary and self-review RED cycles

1. VAPID/service-worker boundary: the focused run produced **2 failed files**, with **1 executed test failed and 21 passed**. One suite could not import the absent VAPID store; the push test observed zero `showNotification` calls because push handling was not implemented.
2. App deep-link reducer: **1 failed / 8 passed**. The app initialized Nearby instead of Commute for the notification target.
3. Installed-Chrome commute target: **1/1 failed** because `/commute` rendered the app shell without selecting the real Commute surface.
4. Catalog-backed E2E heading: the next **1/1 failed** because the original synthetic destination was absent from the production catalog. The fixture was corrected to a real catalog identity and the view now resolves persisted IDs through catalog names.
5. Pending severity audit: **1 failed / 8 passed** in the 9-test decision suite. A numeric label change incorrectly authorized escalation even though no ordered severity scale is approved.
6. Stage-isolation audit: **2 failed / 4 passed** in the 6-test Commute view suite. Deterministic-test and silent-evaluation exposed the Enable control when their evaluation gates were open.
7. Exact subscription scope audit: **2 files failed; 2 failed / 9 passed** across 11 tests. The API accepted missing `commuteWindowIds` with 201 instead of 400, and the client called `subscribe()` without the exact saved-window IDs.
8. Empty-window permission audit: **1 failed / 7 passed** in the 8-test Commute view suite. Pilot mode exposed Enable with no complete saved window.

Every RED failed for the named missing or unsafe production behavior, not because of an unrelated harness or environment failure.

### GREEN progression

- Initial domain/server/client/API/service-worker implementation matrix: **5 files, 41/41 tests passed**; with app-state routing coverage: **6 files, 50/50 passed**.
- Deep-link app state: **9/9 passed**.
- Focused installed-Chrome deep link after routing/catalog repair: **1/1 passed**.
- Severity policy: notification decision suite **9/9 passed** with the Pending severity branch closed.
- Stage isolation: Commute view suite **6/6 passed** after limiting subscription controls to pilot/delivery plus an open gate.
- Exact scope: notification API, client, and monitor **3 files, 15/15 passed** after requiring exact saved-window binding.
- Empty-window follow-up: the same focused boundary matrix passed **3 files, 16/16** after withholding permission controls until a complete explicit window exists.
- Final required governing suites: **3 files, 21/21 passed** (`notification-decision` 9, `commute-monitor` 4, `commute-view` 8).

## Full verification

- Required governing suites: `npm test -- --run tests/domain/notification-decision.test.ts tests/server/commute-monitor.test.ts tests/client/commute-view.test.tsx` — **3 files, 21/21 passed**.
- Relevant notification regression matrix was exercised throughout the RED/GREEN cycles and culminated in the **3-file, 16/16** API/client/monitor boundary run.
- Full Vitest: `npm test -- --run` — **62 files, 1,017/1,017 passed**.
- TypeScript: `npm run typecheck` — passed with zero diagnostics.
- Production build: `npm run build` — Vite transformed **68 modules** and completed successfully.
- Installed Google Chrome E2E: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe; npm run test:e2e` — **5/5 passed**, including the saved Commute deep link, recursive no-crowding public boundary, offline journey references, historical-board honesty, and ordered reconnection restoration.
- Diff hygiene: `git diff 4f994949516647edf9ff0a3be48919aaa8928528 --check` passed. Only non-failing repository line-ending notices appeared in Git output.
- Scope scan: no crowding field, type, module, shell, badge, placeholder, proxy, legend, or new public API concept was introduced.

## Files changed

Production:

- `public/sw.js`
- `src/client/App.tsx`
- `src/client/hooks/use-notifications.ts`
- `src/client/state/app-state.tsx`
- `src/client/styles/global.css`
- `src/client/views/CommuteView.tsx`
- `src/server/app.ts`
- `src/server/bootstrap.ts`
- `src/server/notifications/commute-monitor.ts`
- `src/server/notifications/subscription-store.ts`
- `src/server/notifications/vapid-store.ts`
- `src/server/routes/notifications.ts`
- `src/shared/domain/commute-window.ts`
- `src/shared/domain/notification-decision.ts`

Tests:

- `tests/client/app-state.test.ts`
- `tests/client/commute-view.test.tsx`
- `tests/client/service-worker.test.ts`
- `tests/domain/notification-decision.test.ts`
- `tests/e2e/offline-pwa.spec.ts`
- `tests/server/commute-monitor.test.ts`
- `tests/server/notifications-api.test.ts`

## Strict self-review

### Domain and notification policy

- Exact scope is preserved: route and normalized direction must match, and at least one affected station must be on the saved used segment. No coordinates or line-wide inference are admitted.
- Half-open New York occurrences, weekday ownership, overnight dates, DST gaps/repeats, lifecycle, explicit notification authorization, and preparation boundaries are covered directly.
- Equivalent episode state, correction-only updates, wording refreshes, and reconnect replay are suppressed. There is no routine all-clear branch.
- Recommended actions are deterministically sorted by tier, rider rank, and canonical identity; shuffled tied inputs cannot change the selected action.
- Material escalation is limited to approved executable branches. Numeric severity values remain audit-only because the ordered owner scale is Pending.
- Deterministic fixtures do not mutate observed/delivery state. Silent evaluation may observe but never calls the sender. Pilot/delivery are the only delivery-capable stages.

### API, storage, and secret handling

- Every default is closed. The API and monitor independently require an explicit stage and gate; the client mount remains disabled.
- Subscription endpoints and keys are bounded, cloned, frozen, never logged, and never returned. Subscription creation requires exact saved-window IDs; unscoped/empty/wildcard behavior is impossible.
- VAPID persistence is versioned, bounded, local, and atomic. The private key is absent from client responses, service-worker payloads, diagnostics, fixtures, and Git.
- Operational JSON remains limited to 16 KiB with exact method/query/body validation and no-store responses.
- Service-worker listeners are registered once at module scope, validate exact bounded payloads, and do not replay missed notifications.

### React review

- Notification permission and subscription effects are event-driven from the explicit Enable/Disable controls; there is no mount-time permission prompt or subscription effect.
- Capability booleans are derived during render. Deterministic-test, silent-evaluation, disabled/closed, unsupported, denied, enabled, and error states have truthful distinct copy.
- State setters do not depend on stale prior values, callbacks have bounded dependencies, and no duplicate global or service-worker listeners were added.
- No inline component definitions were introduced. `Capability` and `WindowBand` remain stable top-level components.
- Existing browser storage v2 is reused; no duplicate or expanded localStorage record was created. Saved state is read through the existing lazy app initialization.
- Heavy browser notification APIs remain behind the Commute surface and explicit user event. Unsupported or denied behavior preserves the saved commute and never promises background execution.
- The permission control is absent with no complete saved window, and subscription requests contain only the exact complete saved-window IDs.

### Visual and accessibility review

- The Commute view preserves the approved platform-spine system: existing tunnel/platform colors, raised-card borders/shadows, display/body/utility typography, section kickers, route tokens, quiet copy, status banners, dock placement, focus rules, and reduced-motion behavior.
- Its single subject-specific signature is the compact recurring-window route/time band: a restrained yellow signal spine plus selected weekday label, half-open local time, route token, direction, and rider-saved destination.
- Compared with Nearby, Map, and Saved, the surface uses the same heading hierarchy, card density, spacing, borders, status treatment, and bottom-thumb navigation. Surrounding controls remain quiet; no parallel visual system or decorative dashboard language was added.
- Native headings, regions, articles, buttons, `aria-labelledby`, and polite status semantics preserve keyboard and assistive-technology structure. Existing global visible-focus, target-size, reduced-motion, and forced-color behavior continues to apply.
- Rider copy avoids Home/Work labels, all-clear promises, operational guarantees, and technical capability jargon. Catalog-backed names replace persisted station IDs when reference data is available.

## Commits

- `bf6729a` — `notify only for commute disruptions`
- `75c1624` — `tighten commute delivery gates`

## Concerns

- This is a deterministic validation candidate, not public notification authorization. Production, pilot, and delivery gates remain closed under the controlling NO-GO posture.
- The sender is intentionally an injected Web Push boundary; no live provider/credential configuration or real delivery evidence is committed. A separately authorized deployment must supply and validate that integration without exposing VAPID secrets or tokens.
- Draft/Pending severity, cross-source ordering, reviewer decisions, pilot evidence, delivery quality, and launch evidence remain unavailable and cannot open any stage.

## Fix round 1

### Outcome

Resolved all seven Critical/Important review findings against review base `a5884cd`. Task 14 now has a configuration-gated, runnable production notification composition: a bounded scheduler, injected current-evidence capture adapter, stateful monitor, concrete `web-push` sender, race-safe local VAPID initialization, exact-scope subscription store, notification routes, and server lifecycle wiring. The default composition remains inert and closed; an authorized injected composition is exercised end to end from an exact stored registration through capture, decision, payload validation, and concrete transport.

Evaluation and delivery use separate opaque immutable authorization records with explicit stage-to-exposure mappings. There is no ordinal conversion, stage-string coincidence, or shared Boolean authorization. A delivery authorization alone cannot capture or evaluate; an evaluation authorization alone cannot subscribe or deliver. The mounted App accepts an injected commute notification composition for authorized validation while its no-argument production default remains disabled.

The monitor now decides before consuming state, permits only independently supported material escalation, suppresses correction-only/equivalent/replay states, and preserves reconnect no-replay. The client exposes controls only when a `SavedRecord` matches a fully reconstructed runtime window with known direction, nonempty route, destination, and explicit origin-to-destination segment. It inspects the real browser subscription without prompting, compares the complete exact scope, and requires a rider event to enable, update, or disable.

No stage was opened by this fix. Draft/Pending artifacts remain constraints only.

### Runtime, Web Push, privacy, and storage shape

- Added `CommuteWindowRegistration`, the bounded server-held minimum needed for one explicitly enabled window: window identity, weekdays, half-open start/end, preparation lead, route, known direction, origin, destination, and explicit segment station identities. It contains no `SavedRecord`, coordinates, actual-destination/rider labels, home/work inference, unrelated records, lifecycle guess, or client-only notification state.
- `SubscriptionStore` replaces a same-endpoint registration exactly, rejects empty/duplicate/unbounded scope, canonicalizes via shared domain validation, fails conflicting same-ID scopes closed during evaluation, exposes defensive frozen copies, and deletes the endpoint together with its evaluation windows.
- Browser status reconciliation sends the same bounded registration shape. A same-ID scope change is `stale`, never `current`; only the explicit Update action rebinds it. A failed rebind does not destroy a pre-existing browser subscription, and disable requires successful server deletion before local browser unsubscription.
- `CommuteEvaluationAuthorization` and `CommuteDeliveryAuthorization` are factory-owned frozen values held in independent `WeakSet` registries. Evaluation maps deterministic-test/pilot/delivery to `commute-evaluation` and silent-evaluation to `commute-silent`; delivery maps pilot to `commute-limited-pilot` and delivery to `commute-delivery`.
- `createProductionNotificationPipeline` composes an injected evidence adapter, scheduler, monitor, subscription windows, local VAPID keys, and a concrete `web-push` sender. The production server creates this composition, starts its lifecycle handle, and stops it with the server. Closed defaults do not create VAPID state, schedule, capture, evaluate, subscribe, or deliver.
- The concrete sender sets local VAPID details and maps Web Push 404/410 outcomes to exact invalid-subscription deletion. No private key, subscription token, or endpoint enters payloads, logs, diagnostics, fixtures beyond bounded synthetic values, Git, or client responses.
- VAPID creation now writes a private temporary file, publishes it with create-if-absent hard-link semantics, always rereads and returns the persisted winner, and removes the secret temporary file on every exit. Sixteen concurrent independent stores returned one public/private winner and left only `vapid.json`.
- Rendered push output is truncated to the worker's exact title/body limits, uses the fixed URL and bounded episode identity, and passes the same exact four-field schema before transport or baseline mutation. Invalid episode identities never reach transport.

### Files

Production and dependency files:

- `package.json`
- `pnpm-lock.yaml`
- `src/client/App.tsx`
- `src/client/hooks/use-notifications.ts`
- `src/client/views/CommuteView.tsx`
- `src/server/app.ts`
- `src/server/bootstrap.ts`
- `src/server/index.ts`
- `src/server/notifications/commute-monitor.ts`
- `src/server/notifications/notification-authorization.ts`
- `src/server/notifications/notification-runtime.ts`
- `src/server/notifications/subscription-store.ts`
- `src/server/notifications/vapid-store.ts`
- `src/server/routes/notifications.ts`
- `src/shared/domain/commute-window.ts`
- `src/shared/domain/notification-decision.ts`

Tests:

- `tests/client/commute-view.test.tsx`
- `tests/domain/notification-decision.test.ts`
- `tests/server/commute-monitor.test.ts`
- `tests/server/notification-runtime.test.ts`
- `tests/server/notifications-api.test.ts`

### RED commands, counts, and expected reasons

Normalized seven-finding governing RED:

`npm test -- --run tests/server/notification-runtime.test.ts tests/server/commute-monitor.test.ts tests/server/notifications-api.test.ts tests/client/commute-view.test.tsx`

- **4 failed files**; **1 collection-failed suite** plus **10 failed / 16 passed** among 26 executed tests.
- Runtime: collection failed because `notification-runtime` did not exist, proving the production scheduler/capture/VAPID/concrete-sender composition was absent.
- Monitor: **4 failed / 4 passed**, proving evaluation/delivery shared one lock, material escalation was consumed, correction-only evidence consumed the later candidate, and output exceeded the worker body limit.
- API/VAPID: **2 failed / 4 passed**, proving a single gate bit still authorized subscription and concurrent VAPID creators returned split winners/leaked temp state.
- Client: **4 failed / 8 passed**, proving empty-route, unknown-direction, missing-segment, and actual-subscription reconciliation cases were not fail-closed/truthful.

Exact-scope reconciliation RED:

`npm test -- --run tests/server/notification-runtime.test.ts tests/server/notifications-api.test.ts tests/client/commute-view.test.tsx`

- **2 failed files / 1 passed file**; **3 failed / 19 passed**.
- The status API rejected the required exact registration body because it still compared only window IDs; the hook passed IDs rather than the complete scope and did not rerun inspection when a same-ID segment changed. The authorized production transport smoke already passed, isolating the break to reconciliation.

Correction-only escalation self-review RED:

`npm test -- --run tests/domain/notification-decision.test.ts`

- **1 failed / 8 passed**.
- A correction-only observation with an apparent +300-second change incorrectly produced an escalation. The controlling episode contract requires independent new evidence, so correction-only is now an unconditional suppression input and cannot write a baseline.

### GREEN commands and counts

- First server/runtime GREEN checkpoint: notification runtime **3/3**, commute monitor **8/8**, and notification API **6/6** passed; the only two remaining failures were legacy UI tests clicking during the truthful asynchronous Checking state.
- Warning-free seven-finding matrix: `npm test -- --run tests/server/notification-runtime.test.ts tests/server/commute-monitor.test.ts tests/server/notifications-api.test.ts tests/client/commute-view.test.tsx` — **4 files, 30/30 passed**, with no React `act` warnings at that checkpoint.
- Exact-scope privacy/rebind/deletion regression: `npm test -- --run tests/server/notifications-api.test.ts` — **1 file, 6/6 passed**.
- Correction recovery and governing domain/monitor/client run: `npm test -- --run tests/domain/notification-decision.test.ts tests/server/commute-monitor.test.ts tests/client/commute-view.test.tsx` — **3 files, 30/30 passed** before the final mounted-App test was added.
- Relevant notification/storage/service-worker/API matrix: **10 files, 138/138 passed** before the final correction-only and mounted-App follow-ups; both follow-ups passed focused reruns.
- Authorized/closed production composition smoke: `tests/server/notification-runtime.test.ts` — **3/3 passed**. Closed case performed no VAPID load, capture, scheduling, or delivery. Authorized case delivered exactly one worker-valid payload through the concrete Web Push API.

### Full verification

- Full Vitest: `npm test -- --run` — **63 files, 1,032/1,032 passed**.
- TypeScript: `npm run typecheck` — passed with zero diagnostics.
- Production build: `npm run build` — Vite **7.3.6**, **68 modules transformed**, build completed successfully.
- Installed Google Chrome E2E: `$env:PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'; npm run test:e2e` — **5/5 passed**.
- Diff hygiene: `git diff --check` passed throughout implementation; only repository line-ending notices appeared. Final base/head hygiene is recorded after the report commit.
- Scope hygiene: recursive source/public/focused-test scan returned no crowding field, type, module, shell, badge, placeholder, proxy, or legend introduced by the fix.
- Dependency installation used `corepack pnpm` and committed both `web-push`/`@types/web-push` and the updated lockfile. No secret or generated VAPID data was created in the repository.

### Strict self-review

#### Seven findings

1. **Runnable pipeline:** production now owns the composition and lifecycle; the closed smoke is inert and the authorized injected smoke reaches concrete transport.
2. **Independent locks:** opaque exact evaluation and delivery authorizations are checked independently by scheduler, monitor, and subscription routes; no single Boolean crosses these server boundaries.
3. **Escalation/correction:** no observation is consumed before a Send decision; correction-only/hold/equivalent states do not block later independently material evidence; a successful delivery supplies the baseline for a later material escalation; reconnect does not replay missed delivery.
4. **Complete client scope:** optional object presence is insufficient. Exact Saved/runtime agreement now requires state, stage, recurrence, known direction, nonempty route, origin, destination, and an explicit segment containing both endpoints.
5. **Existing subscription truth:** the hook inspects `getSubscription()`, reconciles the server's complete exact scope, distinguishes none/current/stale, and leaves permission prompts and scope mutation behind explicit rider events.
6. **Worker schema:** server output shares the worker's exact keys, limits, URL, and episode regex before sender invocation and baseline write.
7. **VAPID race:** create-if-absent publication returns the persisted winner and the `finally` cleanup removes every losing secret temporary file.

#### React and client boundary

- Notification prompting, subscribe/update, and unsubscribe remain event-driven. Mount performs read-only subscription inspection only.
- Capability booleans are derived during render; locked/unsupported/checking/ready/stale/denied/enabled/error copy is truthful.
- Exact scope is serialized into a primitive effect dependency; the scope snapshot is stable for callbacks. Persisted app state remains lazily initialized through the existing v2 store with no new localStorage record or migration.
- No inline component definitions, duplicate global listeners, duplicate service-worker listeners, or mount-time permission prompt was added. State writes do not depend on stale prior values.
- Browser Notification, Service Worker, and Push APIs remain behind the injected `NotificationEnvironment`, and heavy `web-push` code is server-only. The real hook is mounted only on Commute.
- Unsupported, denied, stale, and failed behavior preserves the saved commute and never guarantees browser background execution.

#### Visual/accessibility comparison

- No new visual system was introduced. Commute continues to use the approved dark platform-spine tokens, typography, route token, quiet status banner, thumb-reachable dock, global focus treatment, and reduced-motion behavior shared with Nearby, Map, and Saved.
- The subject-specific signature remains the compact recurring-window route/time strip: selected weekdays, half-open time, route, direction, and destination. Reconciliation added only quiet status copy and native buttons.
- Heading/region/article semantics, polite status updates, native keyboard controls, visible focus, target sizing, and plain rider-side copy remain intact. No Home/Work inference, all-clear wording, crowding surface, or delivery guarantee appears.

### Commits

- `42e9b7e` — `wire authorized commute delivery`
- The Fix round 1 report is committed separately after final diff hygiene.

### Concerns

- The product remains a validation candidate under the controlling NO-GO posture. Production defaults are closed, and no pilot/delivery exposure, live VAPID credential, real subscription, or rider delivery evidence is claimed.
- The evidence capture adapter is deliberately injected. A future authorized deployment must bind it to approved current operational evidence and pass the independent immutable authorizations; the repository does not infer authorization from environment strings or Draft/Pending artifacts.
- Live source calibration, owner reviews, delivery quality, retention/operations evidence, and launch approval remain unavailable and cannot open a stage.
