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
