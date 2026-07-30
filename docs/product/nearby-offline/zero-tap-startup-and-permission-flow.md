# Zero-tap startup and location-permission flow

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§14.1–14.2, 28.1, and 31.4 scenario 22; nearby-station and offline-experience plan `Product artifact map` and Task 2 `Product artifacts`, `Ordered steps`, and `Acceptance evidence`; Task 2 brief |
| Owner | Experience Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Pending — Nearby Task 14 and Release 1 evidence have not been produced |

## Purpose and authority

This flow owns the first visible Nearby context, the timing and explanation of the location request, permission-outcome fallbacks, temporary-location-failure behavior, and the foreground-return lifecycle trigger. It fulfills the startup and no-location experience in specification §§14.1–14.2 and 28.1 and defines the expected product result for scenario 22. It does not own station or entrance ranking, arrival admission or ordering, service-change scope, feed health, accessibility truth, direct refresh controls, location retention, tunnel behavior, measurement, or release approval.

The [nearby and offline experience contract](experience-contract.md) owns persistent destinations and context continuity. Shared concepts retain their meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md), and all public wording remains subject to the [approved rider language rules](../contracts/rider-language-rules.md). The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

This artifact is **Draft**. Its lifecycle outcomes, timing, scenario evidence, and Release 1 disposition remain **Pending**. The authoritative [Gate 0 exit record](../quality/gate-0-exit-record.md) is **NO-GO — GATE 0 NOT PASSED**, so public arrival boards remain blocked. This artifact makes no approval, launch, measured-performance, or scenario-passage claim.

## Zero-tap contract

A normal launch opens **Nearby**. It does not begin with onboarding, account creation, notification permission, search, typing, a direction switch, or an expansion requirement. Location improves station and entrance ranking; it is not a gate to core arrival utility.

The first visible state is always useful structure or preserved context:

- When a coherent Nearby shell exists, show it immediately as context.
- When no coherent shell exists, show a non-claim Nearby structure with reachable station choice.
- Never fabricate a nearby station, entrance, arrival, accessibility state, or service condition to fill the structure.
- Never show a blank search field, automatically open the keyboard, or wait for permission before rendering the Nearby structure.

## Startup and lifecycle state model

These states are distinct. One state may coexist with another—for example, a foreground return can have denied location and Degraded transit data—but no state inherits another state's authority.

| State | Entry condition | Exact first visible product result | Next product transition |
|---|---|---|---|
| **Normal warm launch** | A last coherent Nearby shell exists. | The last coherent Nearby shell appears with its station, direction, filters, Accessible Route Only state, reading position, and governed freshness treatment. It is preserved context, not current truth. | Request the permitted location precision, obtain governed ranking and transit decisions, then refresh in place. |
| **Cold launch with no coherent shell** | No prior coherent Nearby station shell is available. | Show **Nearby** selected, the **Nearby stations** heading, non-claim station-card structure, and a bottom-anchored **Choose a station** action. If a current location request is allowed, show **Finding nearby stations…** without naming a station. This is neither blank nor a fabricated result. | Resolve the current permission state, then use current location or the denial fallback precedence. |
| **First use** | Location permission has not been requested. | Show the cold non-claim Nearby structure, or an existing coherent shell if one legitimately exists, before explaining location value. | Present the exact one-sentence explanation immediately before the operating-system prompt; apply one of the five permission outcomes below. |
| **Foreground return** | A preserved screen returns from background. | Restore the exact prior destination and screen context before requesting current evidence. | Trigger refresh within the restored context; Task 5 owns direct refresh controls and freshness presentation. |
| **Temporary location failure** | Permission remains usable, but a current location result cannot be obtained. | Preserve the last coherent station screen and show **Location unavailable. Showing your last station.** | Keep bottom-anchored **Try location again** and **Choose a station** actions available. |
| **Permission outcome** | Precise, approximate, or denied permission is the current operating-system result. | Use exactly the applicable walkthrough below. | A permission change may change ranking input; it does not silently replace a rider-selected station or change transit truth. |
| **Transit-data or connectivity state** | Current, Degraded, Unavailable, or offline decisions are supplied by their owners. | Apply the governed truth treatment within the current shell. | Replace content only when the applicable truth owner supplies a supported decision; location state does not control this transition. |

## Normal warm-launch sequence

On a normal warm launch after location permission has been granted:

1. Render the last coherent Nearby shell immediately. This is the first visible state and remains governed context, not proof that any arrival, alert, accessibility state, or guidance is current.
2. Request a current location result at the permission already granted: precise or approximate. Do not display another operating-system prompt.
3. Pass the permitted location result to Task 3's useful-entrance and station-ranking rules. Task 3, not this flow, decides ranking and fulfills scenario 21.
4. Obtain the current qualified-arrival order, localized service-change consequences, route-critical accessibility state, and applicable station or entrance result from their authoritative owners.
5. Apply supported current content inside the already visible shell without changing the rider's selected station, direction, filters, Accessible Route Only state, or reading position.
6. Keep the old shell's unsupported claims out of Live treatment. Remove, freeze, separate, or relabel content only as required by the governing truth decision.

Current location and current transit truth are independent requests. A location result may change the ordering of Nearby station suggestions, but it cannot admit a train, clear a service-change veto, create a current accessible path, or authorize platform guidance.

## Cold and first-use sequence

When no coherent shell exists, the app renders the cold non-claim Nearby structure before any permission interaction. Station-card structure contains no station name, entrance claim, walking time, accessibility claim, route service, or arrival time until the relevant owner supplies it. The bottom-anchored **Choose a station** action remains reachable throughout.

On first use, show this sentence immediately before the operating-system location prompt, with no onboarding page, account gate, notification prompt, search gate, or unrelated message between the sentence and that prompt:

> Use your location to show nearby subway entrances and live arrivals.

The sentence explains immediate value; it is not a promise that location creates live arrivals or proves an entrance usable. After the operating-system result, follow exactly one of the five walkthroughs below.

## Permission fallback precedence

When location is denied, unavailable by permission, or deliberately not broadened, resolve the station source in this order:

1. Show the last-used station when one exists.
2. Otherwise show saved stations when any exist.
3. Otherwise open the bottom-anchored station picker.

In the picker, recent stations and popular stations appear before the keyboard. The keyboard stays closed until the rider activates **Search stations**. Denial never opens search automatically, pressures the rider to change permission, or reduces the no-account capability set.

## Permission walkthroughs

Exactly five permission outcomes are defined here. Each preserves the same arrival-truth and accessibility boundaries.

### Permission walkthrough 1: Precise location

| Walkthrough field | Required result |
|---|---|
| Precondition | Precise location permission is granted. A coherent shell may or may not exist. |
| Exact first visible content | If a coherent shell exists, show that complete Nearby shell as governed context. Otherwise show **Nearby** selected, **Nearby stations**, non-claim card structure, **Finding nearby stations…**, and bottom-anchored **Choose a station**. |
| Location request | Request one current precise location result within the granted permission. Do not show another operating-system prompt. |
| Station source | Task 3 ranks station complexes by shortest practical walk to a useful entrance using the precise location input and governed entrance evidence. |
| Transit-truth treatment | Current arrivals, localized service changes, and route-critical accessibility state replace shell context only after their owners supply them. Fewer than three qualified arrivals remains fewer than three. |
| Permitted rider action | Open **Choose a station**, select a visible station result, or continue reading the preserved shell while refresh proceeds. |
| Recovery path | If the location request fails temporarily, preserve the station screen and enter the temporary-location-failure state. A later result updates suggestions in place and does not replace a rider-selected station. |
| Privacy and accessibility consequence | Use the precise result only to rank entrances and stations. Preserve Accessible Route Only. Task 3 may select only a verified accessible entrance and complete path when that hard constraint applies. |
| Prohibited result | Do not treat proximity as proof of entrance usability, accessibility, current stop service, or a Live arrival; do not recenter or change station after the rider has selected one. |

### Permission walkthrough 2: Approximate location

| Walkthrough field | Required result |
|---|---|
| Precondition | Approximate location permission is granted; precise location is not granted. |
| Exact first visible content | If a coherent shell exists, show that complete Nearby shell as governed context. Otherwise show **Nearby** selected, **Nearby stations**, non-claim card structure, **Finding nearby stations…**, and bottom-anchored **Choose a station**. |
| Location request | Request one current approximate location result. Do not ask the rider to upgrade to precise permission as a condition of use. |
| Station source | Task 3 ranks only to the precision the approximate result and entrance evidence support. The bottom station picker remains available when nearby ordering is uncertain. |
| Transit-truth treatment | Apply current qualified arrivals, localized service changes, and route-critical accessibility decisions independently of location precision. Approximation never weakens a veto or upgrades evidence. |
| Permitted rider action | Use the approximate Nearby result, open **Choose a station**, or select a saved or recent station without broadening permission. |
| Recovery path | A later approximate result may refresh suggestion order in place. A rider may voluntarily change operating-system permission, but the product does not interrupt utility to request precise access. |
| Privacy and accessibility consequence | Approximate permission receives full core arrival utility. Preserve Accessible Route Only; uncertain geography cannot be converted into a verified accessible entrance or complete path. |
| Prohibited result | Do not label a station or entrance **nearest** beyond supported precision, coerce precise access, hide station choice, or infer accessibility from distance. |

### Permission walkthrough 3: Denied with a last-used station

| Walkthrough field | Required result |
|---|---|
| Precondition | Location is denied and a last-used station exists. |
| Exact first visible content | Show **Nearby** selected with the last-used station screen, its preserved station, direction, filters, Accessible Route Only state, and governed freshness treatment. Show **Location unavailable. Showing your last station.** Here, location is unavailable because permission is denied; this does not classify the state as a temporary location-fix failure. Do not call it the current nearest station. |
| Location request | Make no location request and do not repeat the operating-system prompt. |
| Station source | The last-used station wins the denial precedence even when saved stations also exist. |
| Transit-truth treatment | Refresh current transit truth for the last-used station when connectivity permits. The station source does not strengthen arrival, service-change, accessibility, or guidance evidence. |
| Permitted rider action | Continue with the last-used station, activate bottom-anchored **Choose a station**, or deliberately open operating-system location settings. |
| Recovery path | If permission later becomes approximate or precise, preserve the selected last-used station and refresh suggestions in place; move to another station only after a rider action. |
| Privacy and accessibility consequence | The flow works without current location, background location, movement history, or an account. Preserve Accessible Route Only and keep Unknown accessibility distinct from verified usable. |
| Prohibited result | Do not show a blank screen, open the keyboard, repeatedly prompt, call the old location current, or silently replace the station with a new location-ranked result. |

### Permission walkthrough 4: Denied with saved stations only

| Walkthrough field | Required result |
|---|---|
| Precondition | Location is denied, no last-used station exists, and one or more saved stations exist. |
| Exact first visible content | Show **Nearby** selected with the saved-station choices visible by station name and saved context, plus bottom-anchored **Choose a station**. Do not show fabricated distance, walking time, or nearest-station language. |
| Location request | Make no location request and do not repeat the operating-system prompt. |
| Station source | Saved stations supply the choices because the higher-priority last-used source is absent. Their stored order is context, not current geographic ranking. |
| Transit-truth treatment | After the rider selects a saved station, obtain current truth for that station when available. Stored arrival, alert, equipment, or guidance values never become Live through selection. |
| Permitted rider action | Select a saved station, open **Choose a station**, or deliberately open operating-system location settings. |
| Recovery path | A selected saved station opens without permission. If permission later changes, preserve it as the selected station until the rider chooses another result. |
| Privacy and accessibility consequence | Saved stations remain private context under Task 12's broader retention and reset rules. Preserve saved Accessible Route Only without treating stale equipment or Unknown as usable. |
| Prohibited result | Do not block saved stations behind an account, infer current location from a saved station, automatically search, or present stored operational values as current. |

### Permission walkthrough 5: Denied with neither last-used nor saved stations

| Walkthrough field | Required result |
|---|---|
| Precondition | Location is denied, no last-used station exists, and no saved station exists. |
| Exact first visible content | Show **Nearby** selected with the bottom-anchored station picker open. Show any recent stations first, then popular stations, with a visible **Search stations** action below them; keep the keyboard closed. If recent stations are empty, retain the recent empty state and popular choices rather than fabricating history. |
| Location request | Make no location request and do not repeat the operating-system prompt. |
| Station source | The rider selects from recent or popular stations, or explicitly activates **Search stations** and enters a query. Popularity is a navigation aid, not a nearest or current-service claim. |
| Transit-truth treatment | Only after selection does the station screen obtain its governed current truth. A popular or recent label does not admit an arrival, prove accessibility, or clear a service-change veto. |
| Permitted rider action | Choose a recent or popular station, activate **Search stations**, or deliberately open operating-system location settings. |
| Recovery path | Station selection establishes the current station without location. Later permission does not replace that selection; it may refresh Nearby suggestions after context is preserved. |
| Privacy and accessibility consequence | No precise location, continuous background location, movement history, or account is needed. Search or picker choice does not change Accessible Route Only or create an accessible-path fact. |
| Prohibited result | Do not end on a blank screen, auto-open the keyboard, force search, require permission, fabricate recent history, or imply that a popular station is nearby or currently usable. |

## Temporary location failure

Temporary location failure is not permission denial, transit-data failure, or offline entry. When a current location result fails while a last coherent station screen exists:

1. Preserve that exact station, direction, filters, Accessible Route Only state, and reading position.
2. Show exactly: **Location unavailable. Showing your last station.**
3. Keep bottom-anchored **Try location again** and **Choose a station** actions visible and reachable.
4. Continue obtaining current transit truth for the preserved station when connectivity permits.
5. Do not describe the last station as nearest, current, or derived from the rider's old location.

If no last station exists, use the denial fallback precedence: saved stations, then the bottom picker. Do not attach the last-station sentence to a screen without a real last station.

A successful retry may refresh Nearby suggestions. It may not silently replace a rider-selected station, reset reading position, turn location age into arrival freshness, or change accessibility truth.

## Foreground-return sequence

Foreground return restores context first and refreshes second:

1. Restore the prior persistent destination and contextual screen.
2. Restore station, direction, route filters, Accessible Route Only, positioning destination, map context, trip progress, and reading position as applicable.
3. Reapply the existing permission outcome without repeating the operating-system location prompt.
4. If permission allows, request the granted location precision. If it does not, retain the applicable last-used, saved, or picker source.
5. Trigger current station ranking and governed transit-truth refresh.
6. Apply supported changes in place without jumping context.

Task 2 owns this foreground lifecycle trigger and the invocation of context restoration. Task 5 owns the visible direct refresh control, rider-readable freshness, and station-board refresh presentation. A foreground event cannot reset station, direction, filters, reading position, or Accessible Route Only; it cannot open the keyboard or prompt for location or notifications again.

## Transit-truth and connectivity boundary

The startup shell is never a source of operational truth. It is a place to preserve context while current product decisions are obtained.

| Governed transit state | Startup treatment | Prohibited startup inference |
|---|---|---|
| **Current** | Replace shell values in place only with qualified, ordered arrivals and localized consequences supplied by their owners. Show fewer than three when fewer than three qualify. | Location, shell order, saved state, or card availability cannot admit or reorder a train or clear a veto. |
| **Degraded** | Preserve only the last coherent affected context, freeze every preserved countdown, and show **Live data updating** at the governed scope. Unaffected current routes remain independently eligible. | Do not keep decrementing, call frozen context Live, infer cancellation, or use static data to fill gaps. |
| **Unavailable** | Remove exact or advancing countdown treatment. Use the owning preservation or fallback decision. If a schedule fallback is eligible, show **Scheduled** clock times in a clearly separate state with **Live data unavailable**. | Do not mix Scheduled into the live next three, call cached content Live, or use one unavailable route to degrade unrelated routes. |
| **Offline or connectivity lost** | Preserve the coherent screen only as explicit offline or last-checked context under Task 10. Structural and saved context may remain readable. | Do not claim current arrivals, alerts, reroutes, accessibility, equipment state, guidance, or stop service from cached content. |

Expected, Holding, Uncertain, Scheduled, cached, degraded, unavailable, and offline context never become Live through startup copy, placement, animation, ordering, color, or assistive language. Location never restores a missing real-time trip, creates a stop call, clears a bypass or unresolved service-change veto, or changes upstream chronological order.

## Privacy and accessibility boundaries

- Use location only to rank nearby entrances and stations.
- Approximate location is a complete supported permission outcome, not an error to upsell.
- Do not require or infer continuous background location for core arrivals.
- Do not retain movement history by default.
- Do not make an account, search, or broader permission a condition of arrival utility.
- Nearby, Map, Saved, and offline startup never trigger notification permission. Notification permission belongs only to an explicit companion commute-alert action.
- Do not link location, permission, saved-station, search, account, or device context to an operational train-truth decision or its non-personal quality record.
- Preserve Accessible Route Only through every lifecycle and permission outcome.
- Keep Unknown accessibility or equipment state distinct from verified usable.
- Task 3 owns ranking to a verified accessible entrance and complete path; this flow does not infer one from proximity.
- Task 12 owns broader location purpose, retention, diagnostic separation, saved-data privacy, deletion, and reset rules in `docs/product/nearby-offline/location-and-personal-data-rules.md`.

Declining or limiting location must not produce coercive copy, repeated prompts, diminished transit truth, or loss of the no-account capability set.

## Cross-artifact ownership and scenario allocation

Planned paths remain code text until those artifacts exist.

| Decision or evidence | Owning artifact or task | Task 2 responsibility | Current disposition |
|---|---|---|---|
| Persistent destination and restored context | [Nearby and offline experience contract](experience-contract.md), Task 1 | Render the owned context and invoke restore before refresh. | Draft; evidence Pending |
| Scenario 21 useful-entrance ranking | `docs/product/nearby-offline/station-ranking-and-entrance-rules.md`, Task 3 | Supply only the granted location precision and preserve the result in place. | Not claimed by Task 2; Pending |
| Arrival admission and fewer-than-three ordering | [Arrival admission and ordering contract](../arrival-truth/arrival-admission-and-ordering-contract.md) | Consume the supplied order without admission, promotion, reordering, or backfill. | [Gate 0: **NO-GO — not passed**](../quality/gate-0-exit-record.md); public boards blocked; scenario evidence Pending |
| Feed degradation and recovery | [Route-level feed health policy](../arrival-truth/feed-health-policy.md) | Apply frozen, unavailable, or current treatment inside the shell. | [Gate 0: **NO-GO — not passed**](../quality/gate-0-exit-record.md); public boards blocked; scenario evidence Pending |
| Service-change impact and veto | [Service-change impact and resolution policy](../arrival-truth/service-change-impact-and-resolution-policy.md) | Preserve supplied scope and veto; location cannot clear it. | [Gate 0: **NO-GO — not passed**](../quality/gate-0-exit-record.md); public boards blocked; scenario evidence Pending |
| Confidence and fallback | [Arrival confidence and ghost policy](../arrival-truth/arrival-confidence-and-ghost-policy.md) and [schedule fallback and currency policy](../arrival-truth/schedule-fallback-and-currency-policy.md) | Preserve state, precision, and separation; never create cached Live. | [Gate 0: **NO-GO — not passed**](../quality/gate-0-exit-record.md); public boards blocked; scenario evidence Pending |
| Station-board refresh controls and freshness | `docs/product/nearby-offline/station-board-and-controls-contract.md`, Task 5 | Own only the lifecycle trigger and context-restoration invocation. | Task 5 and Task 14 evidence Pending |
| Scenario 22 denied-location fallback | This artifact, Task 2 | Own last-used, saved, and bottom-picker precedence without a blank screen. | Task 14 and Release 1 evidence Pending |
| Scenario 23 tunnel preservation | `docs/product/nearby-offline/offline-degraded-and-reconnection-states.md`, Task 10 | Do not claim tunnel or offline acceptance here. | Not claimed by Task 2; Pending |
| Location retention, deletion, and reset | `docs/product/nearby-offline/location-and-personal-data-rules.md`, Task 12 | State the startup minimum and defer broader rules. | Task 12 review and evidence Pending |
| Startup timing and usefulness metrics | `docs/product/nearby-offline/measurement-plan.md`, Task 13 | Define no measured threshold or performance result here. | Metrics and evidence Pending |
| Observed startup and permission evidence | `docs/product/nearby-offline/acceptance-evidence.md`, Task 14 | Supply expected results and prohibited outcomes for observation. | Pending |
| Release 1 decision | `docs/product/nearby-offline/release-1-readiness.md`, Task 15 | Make no readiness or launch claim. | Pending |

## Draft review checklist

| Review question | Required Draft result | Evidence needed later |
|---|---|---|
| Is the warm launch's first visible state the last coherent Nearby shell? | Yes; it is context, not current truth. | Task 14 warm-launch observation |
| Does a cold launch avoid both blank and fabricated content? | Yes; it uses non-claim structure and bottom station choice. | Task 14 cold-launch observation |
| Does first use place the exact value sentence immediately before the operating-system prompt? | Yes; no onboarding, account, notification, or search gate intervenes. | Task 14 first-use observation |
| Are there exactly five permission walkthroughs? | Yes: precise, approximate, denied with last-used, denied with saved only, and denied with neither. | Task 14 permission matrix |
| Does denial follow last-used, saved, then bottom-picker precedence? | Yes; recent and popular precede a rider-invoked keyboard. | Scenario 22 observation |
| Does temporary location failure preserve a station screen without claiming old location is current? | Yes; it uses the required sentence and bottom actions. | Task 14 temporary-failure case |
| Does foreground return restore context before refresh without another prompt or jump? | Yes. | Task 14 foreground-return case |
| Can location admit, reorder, or strengthen a train or accessibility decision? | No. | Upstream evidence plus Task 14 integration cases |
| Does the artifact preserve the current Gate 0 decision while keeping privacy, metrics, scenario evidence, and Release 1 claims Pending? | Yes. Gate 0 is **NO-GO — not passed** and public boards are blocked; the other listed claims remain Pending. | A later signed Gate 0 record plus required owner reviews and observed evidence |
