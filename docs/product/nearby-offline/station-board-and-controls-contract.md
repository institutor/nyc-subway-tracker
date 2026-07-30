# Station board and controls contract

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§14.6, 15, and 16; nearby-station and offline-experience plan `Product artifact map` and Task 5 `Product artifacts`, `Ordered steps`, and `Acceptance evidence`; Task 5 brief |
| Owner | Experience Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Pending — Nearby Task 14 station-board and one-handed evidence has not been produced |

## Purpose and authority

This contract owns the contextual station board, compact header, bottom-third control behavior, decision-first row presentation, row disclosure, localized alert placement, rider-readable freshness, and cause-gated empty and degraded states. It does not own arrival admission or ordering, feed health, confidence classification, service-change resolution, track-conflict disposition, accessible-path truth, platform certainty, positioning guidance, saved-preference policy, visual conformance, or release approval.

The approved specification's §14.6 controls station-board refresh behavior and §16 supplies normative hierarchy, route-recognition, reach, accessibility, and motion constraints. The [underground visual and reachability standard](underground-visual-and-reachability-standard.md), Task 6, fixes the visual hierarchy, route-recognition, contrast, large-text, assistive-reading, target-size, reach, and motion criteria. This Task 5 contract consumes those criteria while retaining ownership of the defined control behavior, locations, and decision order below. The Draft standard is not measured proof; Nearby Task 14 still owns the observed rendered evidence.

The [Approved artifact index](../artifact-index.md) currently registers §15 only for this artifact. Controlled governance reconciliation of the index with this contract's normative §§14.6 and 16 consumption is **Pending** before any lifecycle advancement. This Task 5 fix does not edit the index, reinterpret its approval, or advance this artifact beyond **Draft**.

The [Nearby card and direction contract](nearby-card-and-direction-contract.md) supplies the selected station complex, direction context, exact upstream arrival order, evidence states, and localized disruptions. The [nearby and offline experience contract](experience-contract.md) owns persistent destinations and cross-surface continuity. The [zero-tap startup and location-permission flow](zero-tap-startup-and-permission-flow.md) owns the foreground lifecycle trigger, location retry, and station-choice fallback.

Arrival truth remains governed by the [arrival confidence and ghost policy](../arrival-truth/arrival-confidence-and-ghost-policy.md), [route-level feed health policy](../arrival-truth/feed-health-policy.md), [service-change impact and resolution policy](../arrival-truth/service-change-impact-and-resolution-policy.md), and [reroute and track-conflict playbook](../arrival-truth/reroute-and-track-conflict-playbook.md). The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. Shared concepts retain their meanings in the [transit product glossary](../contracts/transit-product-glossary.md), and public wording remains subject to the [rider language rules](../contracts/rider-language-rules.md).

This artifact is **Draft**. The authoritative [Gate 0 exit record](../quality/gate-0-exit-record.md) is **NO-GO — GATE 0 NOT PASSED**; public boards blocked. Accessibility approval, platform-guidance approval, Task 6 visual and reach proof, and Task 14 observed station-board evidence are absent. Every walkthrough below is an expected result with status **Not run — Pending**, not an observed pass, approval, or launch claim.

## Entry and expansion continuity

The station board expands one Nearby card into a complete operational view without making a second truth or ranking decision.

- A single tap on a direction heading or admitted arrival row opens the board with the exact station complex and exact rider-facing direction from that section. No second selection tap is required.
- A generic card-level open action is permitted only when shared context already contains one exact selected direction. Without that selection, the generic action does not open the board; the rider uses a visible direction heading or admitted row instead. Task 5 never guesses a default.
- Expansion preserves the card's upstream order, route filters, evidence-state labels, localized disruptions, accessibility scope, useful entrance relationship, and saved-state indicator.
- Expansion may reveal more governed detail. It may not admit a missing row, upgrade a state, clear a veto, reorder arrivals, hide an affected filtered route's disruption, or change station or direction.
- Closing the board returns to the same originating destination and card context, including reading position.

## Compact header

The header remains compact enough that the next arrival decision stays above the fold. Secondary explanation moves into disclosure before any arrival value, actual destination, evidence state, accessibility warning, or localized operational consequence is removed.

| Header content | Required treatment | Evidence boundary |
|---|---|---|
| Station complex | Rider-recognizable complex name with constituent scope retained where it changes entrance, direction, accessibility, or disruption meaning. | A complex name does not widen one constituent's state to the whole complex. |
| Routes | Redundant route recognition: current color plus letter or number, applicable shape, and spoken route label under the [underground visual and reachability standard](underground-visual-and-reachability-standard.md). | Color or a route badge alone never proves current service or satisfies Task 6 contrast and rights review. |
| Practical walk and entrance | Task 3's approximate walking time, its supported precision, and the selected useful entrance for the current direction. | Never substitute centroid distance, imply false precision, or reuse an entrance across unsupported directions. |
| Saved state | A compact **Saved** indicator when applicable. The actionable **Save station** or **Saved** control remains in the bottom third. | The header indicator does not silently create, remove, or edit a preference. |
| Accessible path | The exact supplied path summary for the current entrance, constituent, route, direction, and destination scope. | Never reduce a complete-path decision to a station badge or infer approval from an elevator icon. |
| Localized disruption | A compact status indicator. Station or constituent-station closure copy appears in the header; every direction, route, train, transfer, entrance, or path consequence remains at its exact owned placement below. | The header may point to another scoped consequence, but it cannot duplicate it as a station-wide claim, widen a local impact, or replace arrivals with a generic alert wall. |

## Bottom-third control inventory

Every core action has a visible labeled control in the bottom third and is required to provide at least a 48-by-48-point target. Gestures may accelerate the same action but never replace its visible control. This inventory fixes product location and behavior; the [underground visual and reachability standard](underground-visual-and-reachability-standard.md) fixes the measurement and reach criteria, while Task 14 owns observed target-size and reach evidence. A bottom sheet used for directions or filters preserves visible station context at a useful intermediate height.

| Visible label | Bottom-third location | State mutation | Preserved state | Visible gesture alternative |
|---|---|---|---|---|
| Current direction labels, one target per passenger-serving direction | Direction control group above persistent navigation | Selects one exact direction in one tap and replaces board content with that direction's supplied state. | Station complex, route filters, Accessible Route Only, saved state, disruptions, and per-direction reading anchors. | Visible direction targets remain available when a swipe also switches direction. |
| **Reverse direction** | Prominent action beside the direction group when one verified opposite exists | Atomically changes the displayed direction and the verified positioning orientation. | Station complex, filters, accessibility setting, saved state, and origin destination. | The labeled action remains available when a reversal swipe exists. |
| **Filter routes** | Bottom control row | Changes only which admitted route rows are presented; the relative upstream order is unchanged. | Station, direction, accessibility setting, disruption truth, freshness, and reading context. | The visible filter control remains available if route-bullet gestures exist. |
| **Refresh** | Bottom control row and never only at the top of content | Requests current evidence for the preserved context; accepted results may change content. | Station, direction, filters, accessibility setting, saved state, positioning destination, and reading position. | This visible control is the alternative to secondary pull-to-refresh. |
| **Save station** / **Saved** | Bottom control row | **Save station** creates the local saved-state mutation. **Saved** exposes the existing state without silently deleting it. | Station, direction, filters, operational truth, accessibility truth, and current board order. | The labeled control remains primary; no save gesture is required. |
| **Nearby** | Persistent bottom navigation | Selects the Nearby destination or closes contextual detail to its Nearby origin. | Shared station, direction, filters, accessibility setting, and originating reading context. | Visible navigation is primary; no gesture is required. |
| **Map** | Persistent bottom navigation | Selects Map while carrying the exact station, direction, and supported orientation context. | Board context for a later return, route filters, accessibility setting, saved state, and operational warnings. | Visible navigation is primary; no gesture is required. |
| **Commute** | Persistent bottom navigation | Selects Commute without creating notification eligibility or changing station-board truth. | Shared rider context and the untouched station-board return state. | Visible navigation is primary; no gesture is required. |
| **Saved** | Persistent bottom navigation | Selects Saved without changing whether the open station itself is saved. | Shared rider context and the untouched station-board return state. | Visible navigation is primary; no gesture is required. |

## Direction, reverse, and filtering behavior

Each current passenger-serving direction has a rider-recognizable one-tap target. The label retains the station-specific bound and actual-destination context from the Nearby card. Raw north/south codes, stop suffixes, and internal axes never replace the rider-facing label.

**Reverse direction** is available only when the governed direction model supplies one unique opposite for the selected axis. Its single action changes both the arrival board and the verified positioning orientation. If opposite orientation is not verified, stale guidance disappears; the prior orientation never remains attached to the reversed board.

At a multi-axis complex, Task 5 never guesses which axis is “opposite.” The rider uses the explicit one-tap targets for every supplied passenger-serving direction. A misleading reverse mutation is omitted when no unique governed pair exists; this is not permission to hide an axis or force the complex into Uptown/Downtown.

Route filters use a redundant route bullet plus route text. A filter may hide admitted arrival rows for an unselected route, but it cannot hide or weaken an active disruption affecting that route. The board leaves a visible route-identified warning at the owning station, direction, train, transfer, or path scope and exposes the official detail. Filtering never clears a veto, changes an evidence state, creates “good service,” or reorders the remaining arrivals.

## Action-continuity contract

| Action | Permitted mutation | State that must remain coherent | Truth boundary | Required feedback or return |
|---|---|---|---|---|
| Switch direction | Selected direction and the displayed direction-specific rows, entrance, accessibility, disruption, platform, and guidance result. | Station complex, filter set, saved state, persistent destination, and each direction's remembered reading anchor. | Consume the new direction's supplied order and states; do not mirror, recover, or reclassify the former direction's rows. | The chosen label is selected after one tap; incompatible old guidance is absent. |
| **Reverse direction** | Direction plus verified positioning orientation as one mutation. | Station complex, filters, accessibility setting, saved state, and origin destination. | Use only a unique governed reverse pair; otherwise make no reverse mutation and preserve all axes as explicit choices. | Board and orientation change together; unsupported guidance disappears rather than lagging behind. |
| **Filter routes** | Visible admitted-route subset and filter indicator. | Station, direction, upstream relative order, freshness, accessibility state, and every affected filtered route's visible disruption. | Filtering is presentation only; it cannot change admission, suppression, unavailable scope, or evidence state. | Route bullets plus text identify the filter; hidden-route operational consequences remain visible. |
| **Refresh** | Evidence-supported values, row count, order, state, alerts, platform, and guidance after authoritative owners accept new evidence. | Station, direction, filters, accessibility setting, saved state, positioning destination, and reading position. | Foreground return or tap requests evidence but creates no freshness or currency. | Show authoritative age; freeze or remove unsupported time treatments without a context jump. |
| **Save station** / **Saved** | Local saved-state indicator and only the saved preference data its later owner permits. | Current board, station, direction, filters, arrival order, evidence states, disruptions, and accessibility truth. | Saving is rider state, never operational evidence or automatic reranking of the open board. | Header indicator and bottom label agree; an account is not required. |
| **Map**, then return to board | Persistent destination and visible surface; Map receives the selected station, direction, and supported orientation. | Board station, direction, filters, accessibility setting, saved state, disruptions, evidence labels, and reading position for return. | Map cannot strengthen or clear board truth; any return refresh follows restore-first, refresh-second. | Return reopens the same station board and context rather than a default station, direction, or top position. |

## Decision-first arrival rows

The visible row applies the exact five-level hierarchy in the [underground visual and reachability standard](underground-visual-and-reachability-standard.md) while preserving this defined Task 5 behavior:

1. Supported arrival time or operational state together with the explicit visible evidence state.
2. Redundant route identity and actual destination.
3. Rider-facing direction and localized express/local, reroute, delay, or other service exception when it differs from normal.
4. Governed platform or accessibility warning when available.
5. Verified and relevant front, middle, or back guidance, followed by genuinely secondary detail.

The row always retains the actual destination. Large or urgent state information comes before secondary detail, but no compact treatment may erase evidence meaning.

The visible evidence state qualifies level 1 rather than creating a sixth visual level, and verified relevant guidance leads other level-5 secondary detail. Neither treatment changes the standard's exact hierarchy.

This visual glance order is distinct from assistive reading order. Assistive technology receives route and actual destination, supported time or operational state, evidence state, service exception, applicable platform or accessibility warning, and verified guidance in that decision sequence. The [underground visual and reachability standard](underground-visual-and-reachability-standard.md) fixes assistive-reading criteria; Task 14 owns observed conformance.

| Supplied arrival disposition | Board area and time treatment | Task 5 rule |
|---|---|---|
| **Live** | Primary ordered list with a supported rounded countdown. | Advance only while the owning feed and train evidence remain current and every admission gate passes. |
| **Expected** | Primary ordered list with the owner-supplied range. | Preserve the range and upstream chronological position; never turn pre-departure assignment into a Live countdown. |
| **Holding** | Separate warning or held-train area with the last supported time frozen. | Do not decrement, animate, promote, or use it to fill the primary list. |
| **Uncertain** | Expandable secondary area with **Arrival uncertain** and no exact minute. | Use only for one coherent train whose exact stop and path remain confirmed; never use it for unresolved stop service. |
| **Scheduled** | Clearly separated fallback board with an eligible clock time and **Live data unavailable**. | Never mix it with Live/Expected or frozen live context, and never convert the clock time to a countdown. |
| Suppressed, arrival claim unavailable, quarantined, or unadmitted | No arrival row and no row disclosure. | Preserve only the exact scoped explanation authorized by the owning truth policy; no weaker row or Scheduled replacement may appear. |

Platform states appear only as **Platform confirmed**, **Expected platform**, or **Check station signs** when the governed platform evidence supports that exact row and direction. **Check station signs** is a non-conflicting uncertainty state; it cannot mask an explicit non-terminal actual-versus-scheduled-track conflict.

An explicit non-terminal track conflict suppresses the affected downstream arrival row and every dependent positioning recommendation. Each affected board suppression state preserves the upstream owner-supplied consequence **Service change—this train's downstream stops are not verified.** The message does not become a visible invalidated row. The row does not remain as Uncertain, Expected platform, Check station signs, Scheduled, or a lower-confidence countdown. Normal terminal track variation does not trigger this rule without separate invalidating evidence.

Front, middle, or back guidance appears only when its companion owner supplies verified, current, relevant direction, platform, geometry, and operational-path evidence. When that evidence is absent or ambiguous, omit the guidance while preserving the rider's destination intent and all independently valid arrival information.

## Row disclosure

Selecting an admitted visible row expands detail without switching station, direction, filter, or route and without changing the row's evidence state or upstream position.

| Disclosure item | Required rider content | Prohibited substitution |
|---|---|---|
| Remaining stops | The coherent current remaining-stop sequence at its exact route and direction scope. | Static restoration, invented stops, a normal pattern in place of a reroute, or a raw stop suffix. |
| Localized consequence and official detail | A concise supported rider consequence plus the original official service-change detail when governed. | A stronger invented bypass, closure, platform, cancellation, or line-wide consequence. |
| Last movement | Rider-readable last movement or progress age from accepted authoritative chronology. | Phone-clock age, request time, hidden timestamp arithmetic, or an advancing value after evidence freezes. |
| Confidence reason | A plain-language explanation of why the row is Live, Expected, Holding, or Uncertain. | Internal confidence score, model feature, quarantine term, threshold code, or unsupported certainty. |
| Transfer or destination guidance | Only supported transfer likelihood and verified destination guidance relevant to the selected row. | Promised connections, invented positioning, or guidance retained through platform or path ambiguity. |

Raw trip identifiers, internal train keys, numeric direction codes, stop suffixes, axis codes, provenance codes, confidence scores, and quarantine reasons are never public disclosure. A suppressed, unavailable, quarantined, or otherwise unadmitted row has no tappable placeholder and no disclosure surface.

## Scoped alert placement

Alerts appear where their rider consequence is experienced:

| Supported impact | Required placement | Scope protection |
|---|---|---|
| Station or constituent-station closure | Compact station header. | Do not widen a constituent closure to unaffected services in the complex. |
| Direction-specific bypass or skip | Beside the affected direction. | Preserve the opposite direction and unrelated axes. |
| Train-specific delay or changed behavior | On the admitted affected train row. | Do not label every train or the whole line delayed. |
| Transfer disruption | In the applicable trip or transfer guidance. | Do not crowd the station header when the consequence exists only at a later transfer. |
| Elevator outage | On the affected accessible path. | Do not suppress train arrivals or convert a path-specific outage into a station-wide badge. |

A secondary system-wide alert view may expose official detail, but generic alerts never crowd out immediate arrivals. Absence of an alert does not prove **Good service**. A generic **Affected** category does not prove a bypass, skip, suspension, closure, or any other specific consequence. Filters retain the same scoped placement for an affected hidden route.

## Freshness and feed isolation

When freshness is relevant, show rider-readable age such as **Updated 18 sec ago**. The age comes from the accepted authoritative source time under the upstream time and health policies, not the rider's phone clock, foreground-return time, refresh-tap time, or animation clock.

Foreground return restores context first and automatically requests current evidence second. Tapping **Refresh** or using secondary pull-to-refresh makes the same request. None of those actions creates currency, advances a source timestamp, clears a veto, or turns preserved content Live.

Route/feed-group snapshot age and train-specific movement age remain separate clocks. One old train in a Current feed may move to Holding or Uncertain without degrading the route/feed group; recent train movement inside a stale, invalid, or regressed feed cannot restore Current or Live presentation.

| Owning state | Board treatment | Time behavior |
|---|---|---|
| Current accepted feed and admitted train | Show the owning Live, Expected, Holding, or Uncertain treatment. | Only supported Live countdowns advance. Expected retains a range; Holding is frozen; Uncertain has no exact minute. |
| **Degraded** route/feed group | Preserve only its last coherent information as visibly frozen context and show **Live data updating** for that scope. | Stop countdown animation and decrementing immediately; do not let placement or assistive wording imply the frozen value remains Live. |
| **Unavailable** route/feed group | Consume the owning feed-health presentation branch. During anomaly or frozen recovery, preserve only the last coherent values as visibly frozen context with **Live data updating**. Only when the sustained-outage or fallback owner replaces that context may exact live countdown claims disappear and a separately eligible schedule appear in its separated Scheduled board. | Frozen recovery values never advance or imply current Live evidence. Frozen live context and Scheduled clock times never appear together. |
| Unaffected Current route/feed group | Continue its independently qualified presentation. | Another group's degradation, outage, retry, or recovery does not freeze, relabel, or replace it. |

A first fresh coherent recovery snapshot does not restore exact countdowns. The owning feed-health policy requires its full recovery decision before each train is reevaluated. Task 5 presents that decision; it does not shorten recovery.

### Freshness lifecycle FL-01

| Walkthrough field | Expected result |
|---|---|
| Starting state | The board shows the selected station and direction, a preserved route filter and reading position, one admitted Live row, and **Updated 18 sec ago** calculated from accepted authoritative time. |
| Foreground action | The app restores the exact board context, then automatically requests current evidence. The restored age remains tied to the last accepted source time until new evidence is accepted. |
| Direct action | The rider taps visible bottom-third **Refresh**. The request does not reset station, direction, filters, reading position, or the displayed age to zero. |
| Stale transition | The affected route/feed group becomes Degraded. Its last coherent value freezes, animation stops, and **Live data updating** appears. |
| Unavailable transition | The board follows the owner-selected cause branch. An anomaly-recovery state may retain visibly frozen last-coherent values with **Live data updating**. If sustained-outage rules replace that context and fallback is independently eligible, exact live countdowns disappear and only the separated Scheduled clock-time board appears. Unaffected Current route/feed groups continue independently. |
| First recovery snapshot | The first fresh coherent snapshot for the affected route/feed group restores nothing. Frozen presentation and **Live data updating** remain, and no row, exact countdown, or primary eligibility returns. |
| Second recovery snapshot | Only a second consecutive fresh coherent snapshot can restore route/feed-group eligibility. Every train is then reevaluated through every current admission gate; no prior row or countdown revives automatically. |
| Interrupted recovery pair | Any intervening invalid, stale, anomalous, incoherent, or otherwise nonconsecutive snapshot resets the pair. The next fresh coherent snapshot becomes a new first snapshot and restores nothing. |
| Prohibited result | Foreground or tap-created freshness, an advancing stale or Holding time, unconditional deletion of owner-preserved context, premature fallback, frozen Live mixed with Scheduled, network-wide degradation from one failed group, a context jump, or early recovery after one snapshot. |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Review date | Not recorded |
| Evidence status | Not run — Pending — Nearby Task 14 |

## Cause-gated empty and degraded states

Each rendered state contains exactly one in-state call to action. A cause gate may choose between mutually exclusive actions, but both never render together. Persistent navigation and separately governed global controls remain available, but they do not become extra CTAs inside the state.

| Exact state message | Required cause gate | Exact single in-state action | Result of action | Prohibited use |
|---|---|---|---|---|
| **No verified live arrivals in this direction.** | The exact direction has no admitted Live or Expected primary arrivals under Current accepted evidence; no stronger service-change, line-absence, scheduled-fallback, or location state controls. Count other current passenger-serving directions for the same complex after excluding the selected direction. | With exactly one or multiple alternatives, render only **View other direction**. With no alternative, render only **Open map**. Never render both. | Exactly one alternative is selected directly. Multiple alternatives open the preserved bottom-third direction chooser with no preselection or guessed opposite. With no alternative, **Open map** preserves the station and current scope. | Missing feed, unresolved stopping pattern, resolved line absence, row-count backfill, no useful action, both CTAs, direct selection when multiple alternatives exist, chooser preselection, guessed opposite, or loss of station or current scope. |
| **Service change—arrivals are hidden until the stopping pattern is confirmed.** | Current high-impact service-change evidence materially leaves the exact route, direction, station, segment, or stopping pattern unresolved. | **View service change** | Open the official detail and localized consequence without creating an arrival. | Generic **Affected**, absent alert metadata, a resolved bypass presented as unresolved, or unrelated routes. |
| **Live data unavailable. Showing scheduled times.** | The affected route/feed group is Unavailable, the owning sustained-outage or fallback decision has replaced frozen recovery context, and a separately governed eligible schedule covers the service date with no current veto. | **Refresh live data** | Request live evidence for the preserved scope while leaving Scheduled clock times separated and labeled. | Healthy or merely Degraded live data, owner-selected frozen recovery, ineligible schedule, static countdown, or mixing Scheduled with frozen live rows. |
| **This line is not serving this station right now.** | Current resolved evidence establishes that the exact line and active scope do not serve this station while unrelated service is preserved. | **Open map** | Open Map with the same station and resolved service-change context. | Prediction absence, generic **Affected**, an unresolved high-impact mapping, or a complex-wide claim from one constituent. |
| **Location unavailable. Showing your last station.** | Current location cannot be obtained and a last coherent station exists; this is location context, not arrival-feed health. | **Choose a station** | Open the bottom-anchored station chooser without first opening the keyboard. | Calling the last station current or nearest, blank search, arrival unavailability, or a silent station replacement. |

Task 2's visible **Try location again** remains a persistent/global location control outside the location-state component. It is not a second in-state CTA. The location state itself contains only **Choose a station**, and neither action may change arrival freshness or silently replace a rider-selected station.

## Expected one-handed walkthroughs

Every walkthrough is an expected product fixture. None is observed evidence.

### One-handed walkthrough OH-01 — One-tap direction switch

| Walkthrough field | Expected result |
|---|---|
| Starting state | One station board is open on a supplied passenger-serving direction with a route filter, localized disruptions, saved state, accessibility setting, and a remembered reading anchor. |
| Action and placement | Tap the target for another supplied direction once in the bottom-third direction group. |
| Permitted mutation | Selected direction and that direction's supplied rows, entrance, accessibility, platform, and guidance treatment. |
| Preserved state | Station complex, route filter, saved state, Accessible Route Only, persistent destination, disruptions, and the former direction's reading anchor. |
| Truth result | The new direction retains exact upstream order and evidence states; incompatible old guidance is absent. |
| Prohibited result | Second tap, swipe-only discovery, guessed direction, copied rows, state upgrade, lost filtered-route warning, or default-station jump. |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Review date | Not recorded |
| Evidence status | Not run — Pending — Nearby Task 14 |

### One-handed walkthrough OH-02 — Reverse board and orientation

| Walkthrough field | Expected result |
|---|---|
| Starting state | An ordinary axis has one governed opposite direction and verified positioning orientation for both sides. |
| Action and placement | Tap prominent bottom-third **Reverse direction** once. |
| Permitted mutation | Displayed direction and verified positioning orientation change together. |
| Preserved state | Station complex, route filters, saved state, accessibility setting, origin destination, and return context. |
| Truth result | The reversed board consumes only the opposite direction's supplied rows and guidance; stale former-orientation guidance is absent. |
| Prohibited result | Board-only reversal, lagging guidance, mirrored train rows, multi-axis opposite guess, hidden axis, or evidence reclassification. |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Review date | Not recorded |
| Evidence status | Not run — Pending — Nearby Task 14 |

### One-handed walkthrough OH-03 — Filtered route with disruption

| Walkthrough field | Expected result |
|---|---|
| Starting state | The selected direction contains admitted rows for multiple routes, and one route has a current localized disruption. |
| Action and placement | Open bottom-third **Filter routes** and deselect the affected route using its route bullet plus text. |
| Permitted mutation | Arrival rows for the filtered route leave the visible admitted-row subset; the filter indicator changes. |
| Preserved state | Station, direction, relative upstream order, freshness, accessibility setting, reading context, and the filtered route's scoped disruption. |
| Truth result | A redundant route-identified warning remains at its owning scope and exposes official detail. |
| Prohibited result | Hidden disruption, cleared veto, **Good service**, generic line-wide warning, reordered remaining rows, or color-only filter meaning. |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Review date | Not recorded |
| Evidence status | Not run — Pending — Nearby Task 14 |

### One-handed walkthrough OH-04 — Direct refresh

| Walkthrough field | Expected result |
|---|---|
| Starting state | The station board shows authoritative rider-readable age and the rider has selected a direction, filter, accessibility setting, and reading position. |
| Action and placement | Tap visible **Refresh** in the bottom control row. |
| Permitted mutation | Only evidence-supported content accepted after the request: rows, values, states, alerts, platform, guidance, and authoritative age. |
| Preserved state | Station, direction, filters, accessibility setting, saved state, positioning destination, and reading position. |
| Truth result | Currency changes only when authoritative owners accept newer evidence; stale or Holding values freeze and unsupported claims disappear. |
| Prohibited result | Tap-created “now,” reset age, scroll jump, filter reset, station or direction change, automatic state upgrade, or static backfill. |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Review date | Not recorded |
| Evidence status | Not run — Pending — Nearby Task 14 |

### One-handed walkthrough OH-05 — Secondary pull-to-refresh

| Walkthrough field | Expected result |
|---|---|
| Starting state | The same preserved board context is visible, and the bottom-third **Refresh** control remains present. |
| Action and placement | Pull within the board content as a secondary gesture. |
| Permitted mutation | The same evidence request and accepted-content changes as the direct Refresh action. |
| Preserved state | Station, direction, filters, accessibility setting, saved state, positioning destination, and reading position. |
| Truth result | The visible Refresh control remains available before, during, and after the gesture; authoritative freshness rules remain unchanged. |
| Prohibited result | Pull as the only refresh path, hidden direct control, gesture-created freshness, different truth rules, or context reset. |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Review date | Not recorded |
| Evidence status | Not run — Pending — Nearby Task 14 |

### One-handed walkthrough OH-06 — Save station

| Walkthrough field | Expected result |
|---|---|
| Starting state | The station is not saved; its current board, direction, filters, upstream order, evidence states, and disruptions are visible. |
| Action and placement | Tap bottom-third **Save station**. |
| Permitted mutation | The local station saved state changes; the header indicator and bottom label become **Saved**. |
| Preserved state | Current board, station, direction, filters, accessibility setting, arrival order, evidence states, disruptions, and reading position. |
| Truth result | Saving requires no account and supplies no operational evidence. Any later preference use remains transparent and separately governed. |
| Prohibited result | Silent unsave, current-board rerank, arrival promotion, alert removal, accessibility change, direction reset, or account prompt. |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Review date | Not recorded |
| Evidence status | Not run — Pending — Nearby Task 14 |

### One-handed walkthrough OH-07 — Map and return to board

| Walkthrough field | Expected result |
|---|---|
| Starting state | A contextual station board is open from Nearby with a selected direction, filter, saved and accessibility state, localized disruptions, evidence labels, and a remembered reading position. |
| Action and placement | Tap persistent bottom-third **Map**, inspect the same selected station and direction, then use the visible contextual return to the station board. |
| Permitted mutation | Persistent destination changes to Map and back to the contextual board; Map position may change through deliberate map interaction. |
| Preserved state | Station, direction, route filters, accessibility setting, saved state, board evidence labels, disruptions, and the board reading position. |
| Truth result | Return restores the board first; any refresh applies newer governed truth inside that context without clearing warnings or filters. |
| Prohibited result | Default station or direction, lost filter, top-of-board jump, stronger Map-derived claim, hidden disruption, stale positioning orientation, or blank search. |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Review date | Not recorded |
| Evidence status | Not run — Pending — Nearby Task 14 |

## Ownership and pending evidence

| Decision | Authoritative owner | Task 5 consumption | Current disposition |
|---|---|---|---|
| Station-board controls, continuity, placement, control labels, and five cause-gated state messages | This contract, Task 5 | Define expected product behavior without claiming measured conformance. | Draft; Task 14 Not run — Pending |
| Arrival admission, order, confidence, service change, track conflict, feed health, and their rider treatments | Linked Arrival Truth policies and contracts | Preserve exact supplied row, absence, state copy, scoped consequence, feed isolation, and recovery treatment. | **NO-GO — GATE 0 NOT PASSED**; public boards blocked |
| Accessible-path and equipment state | Companion accessibility artifacts planned under `docs/product/accessibility/` | Preserve exact path scope and fail closed; do not infer a badge or current path. | Approval and observed evidence absent |
| Platform and positioning guidance | Companion guidance artifacts planned under `docs/product/guidance/` | Show only verified supplied state and guidance; suppress during conflict or ambiguity. | Approval and observed evidence absent |
| Visual, reach, target-size, contrast, large-text, assistive, and motion conformance | [Underground visual and reachability standard](underground-visual-and-reachability-standard.md), Task 6 | Consume the Draft criteria while reserving bottom-third locations and defined decision behavior here. | Draft standard exists; all six rendered/measured audits and Task 14 proof are **Not run — Pending** |
| Foreground lifecycle and location retry | [Zero-tap startup and location-permission flow](zero-tap-startup-and-permission-flow.md), Task 2 | Present board refresh and keep global **Try location again** distinct from the state CTA. | Draft; Task 14 Not run — Pending |
| Station-board acceptance | `docs/product/nearby-offline/acceptance-evidence.md`, Task 14 | Record fixed-version observations for every control, state, and walkthrough. | Not run — Pending |

## Draft review checklist

| Review question | Required Draft result | Evidence needed later |
|---|---|---|
| Does the compact header retain all required context while arrivals remain above the fold? | Yes by contract; not visually demonstrated. | Task 6 [arm's-length and large-text audits](underground-visual-and-reachability-standard.md) and Task 14 observation |
| Are direction, reverse, filter, Refresh, save, and four primary destinations in the bottom third with visible gesture alternatives? | Yes by inventory; size and reach are not measured here. | Task 6 [one-handed reach audit](underground-visual-and-reachability-standard.md) and Task 14 evidence |
| Do reverse direction and positioning orientation change together without a multi-axis guess? | Yes. | OH-02 observed result |
| Can a filter conceal an affected route's disruption? | No. | OH-03 observed result |
| Do rows preserve upstream disposition, platform constraints, guidance limits, and track-conflict suppression? | Yes. | Arrival Truth and companion guidance evidence plus Task 14 |
| Can a foreground event, Refresh tap, or gesture create freshness? | No. | FL-01, OH-04, and OH-05 observations |
| Are there exactly five cause-gated state messages with one in-state action each? | Yes. | Task 14 degraded-state cases |
| Are the seven one-handed walkthroughs observed or approved? | No. Every case remains Not run — Pending. | Required reviewer decisions on a fixed version |
| Does this artifact claim Gate 0, accessibility, guidance, Task 6, Task 14, or release approval? | No. The decision remains **NO-GO — GATE 0 NOT PASSED**; public boards blocked. | Complete signed owner evidence |
