# Underground visual and reachability standard

| Governance field | Value |
|---|---|
| Source sections | Approved specification §16; nearby-station and offline-experience plan Product artifact map and Task 6 Product artifacts, Ordered steps, and Acceptance evidence; Task 6 brief |
| Owner | Experience Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Not run — Pending; Nearby Task 14 underground-interaction results and rendered/measured audit evidence are absent |

## Purpose and authority

This standard owns the underground-first visual hierarchy, dark-first presentation, redundant route recognition, large-text behavior, assistive reading order, touch-target and reach requirements, and restrained motion for nearby and offline surfaces. It applies those requirements to the [station board and controls contract](station-board-and-controls-contract.md) without changing that contract's station, direction, control, alert, freshness, or degraded-state behavior.

This standard does not admit or order an arrival, classify confidence or feed health, resolve service changes, determine an accessible path, verify platform guidance, grant rights to MTA assets, prove rendered conformance, or approve public release. The [approved specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. Shared concepts retain their meanings in the [transit product glossary](../contracts/transit-product-glossary.md), and every visible or spoken label remains subject to the [rider language rules](../contracts/rider-language-rules.md).

Arrival and freshness presentation consumes the [arrival confidence and ghost policy](../arrival-truth/arrival-confidence-and-ghost-policy.md) and [route-level feed health policy](../arrival-truth/feed-health-policy.md) without strengthening their evidence. A larger value, brighter treatment, animation, order, color, shape, or assistive label cannot turn Expected, Holding, Uncertain, Scheduled, degraded, unavailable, frozen, cached, or offline information into Live.

This artifact is **Draft**. The authoritative [Gate 0 exit record](../quality/gate-0-exit-record.md) is **NO-GO — GATE 0 NOT PASSED**; public boards blocked. The six named audits below are **Not run — Pending**. No fixed rendered product, measured target bounds, contrast report, large-text capture, assistive-technology transcript, reduced-motion capture, or one-handed reach record exists.

## Governance reconciliation and mandatory review

The artifact header and Draft [artifact index](../artifact-index.md) row register Product, Accessibility, Data Quality, and Content for this standard. The [review and approval policy](../review-and-approval-policy.md) requires Data Quality because this rider experience visibly distinguishes live, scheduled, cached, degraded, and service-change truth.

| Governance question | Current record | Required disposition |
|---|---|---|
| Registered reviewer set | Product, Accessibility, Data Quality, Content | Reviewer routing is reconciled in the artifact header and Draft index row. |
| Applicable policy minimum | Product, Accessibility, Content, plus Data Quality | Data Quality review is mandatory because visual, motion, and assistive treatments present live, degraded, stale, Holding, Scheduled, and service-change meaning. |
| Review evidence | Pending | All four roles must review the same fixed version before this artifact may advance from **Draft**. |

This reviewer-routing reconciliation is not approval. Approval evidence and observed conformance remain **Pending**.

## Fixed visual glance hierarchy

The visual glance hierarchy is exactly:

1. **Minutes or operational state.**
2. **Route and actual destination.**
3. **Direction and exception.**
4. **Platform or accessibility warning.**
5. **Secondary detail.**

The first supported decision value is the largest and brightest item. A non-countdown operational state such as **Holding**, **Arrival uncertain**, **Scheduled 10:42**, **Live data updating**, or **Live data unavailable** occupies that first level when an exact Live value is not permitted.

An explicit evidence-state label remains visible beside the supported time or operational state. It is not secondary and cannot be hidden merely because it is not a separate numbered level. The actual destination remains visible at level 2. Within level 5, verified and relevant front, middle, or back guidance precedes other secondary detail, but it never displaces a warning or implies evidence that its owner has not supplied.

This hierarchy is a visual-priority rule, not an assistive-technology reading sequence. Visual size, brightness, and placement may differ from the semantic order below, while both must preserve the same route, destination, time or state, evidence, exception, warning, and guidance meaning.

### Arm's-length composition

- Primary values and their evidence labels must be readable at arm's length without zoom.
- Do not use dense tables, fine gray text, compressed abbreviations, subtle color differences, or alert walls for a primary decision.
- Route, destination, direction, exception, platform or accessibility warning, and evidence state must remain distinguishable without opening disclosure.
- Secondary content may wrap, move below the first viewport, or enter contextual disclosure before any of the five decision levels is removed or visually reversed.
- Position alone cannot communicate state. Every state and warning retains visible text and an assistive label.

## Dark-first presentation

Dark mode is the default regardless of time of day, device clock, service day, or current service pattern. The default uses:

- a near-black background;
- high-contrast off-white primary text;
- brighter white for the most important arrival value or operational state;
- muted treatment only for genuinely secondary information; and
- restrained alert colors so warnings remain localized rather than turning the screen into a wall of color.

Light mode remains an explicit rider preference. Selecting light mode changes appearance only. It cannot change actual-now versus reference service meaning, route or direction selection, evidence state, accessibility state, freshness, or any other product truth, and the product cannot silently change the preference based on time of day.

The fixed contrast criteria for the poor-light audit are at least 4.5:1 for all text at every supported size, including critical values, evidence and operational states, warnings, controls, and muted secondary text, and at least 3:1 for essential non-text boundaries and focus indicators against adjacent colors. These are Draft product pass criteria for a final rendered fixture, not a claim that any current interface has been measured or conforms.

Alert color is supplemental. A warning retains its exact scoped text, route or path identity, visible state, and spoken consequence when alert color is removed. Brightness, saturation, glow, or dimming cannot be the only difference between Live and non-Live, selected and unselected direction, usable and unavailable path, or any capacity state.

## Redundant route and state recognition

Every route identity uses all applicable channels:

1. the current official MTA line color;
2. the official route letter or number;
3. the applicable official bullet shape; and
4. a spoken screen-reader label that names the route.

The letter or number remains readable inside or immediately beside the shape at every supported size. A route keeps its identity when rerouted; the current service exception is expressed separately with plain-language **Via…**, skipped-stop, changed-destination, or other owner-supplied treatment.

| Meaning | Required non-color channel | Supplemental channel allowed | Color-only result prohibited |
|---|---|---|---|
| Route | Visible official letter or number, applicable shape, and spoken route name | Current official line color | Identifying a route only by hue or saying only “the blue line.” |
| Evidence or operational state | Visible state text and equivalent spoken state, with its supported time treatment | Restrained color, icon, or placement | Distinguishing Live, Expected, Holding, Uncertain, Scheduled, degraded, unavailable, cached, or offline only by color, brightness, motion, or position. |
| Direction | Rider-recognizable bound label paired with the actual destination or terminal, plus selected-state text or semantics | Selection color or directional transition | Using hue, raw compass code, or tab position as the only direction meaning. |
| Warning or service exception | Plain-language scoped consequence, affected route or path, and spoken warning | Restrained alert color and a labeled icon | Relying on a red, yellow, blinking, or dim treatment without the consequence. |
| Accessibility state | Exact path-scoped state text and spoken state | A labeled accessibility symbol when rights permit | Treating an icon, color, or station badge as proof of a complete usable path. |
| Capacity state, if a future approved owner permits it | Visible level or quantity and equivalent spoken label | Color, pattern, or bar length | A color-only capacity distinction. This standard does not enable the currently out-of-scope subway crowding feature. |

## Large text and legible language

Every supported large-text size preserves the complete actual destination and evidence-state label. Neither may be truncated, ellipsized, hidden, replaced by color, moved behind an expansion tap, or omitted to keep a fixed row height.

- Rows and headers reflow vertically. Wrapping and additional vertical scrolling are permitted; horizontal scrolling for decision content is not.
- The five-level visual priority remains recognizable after reflow. Primary values, actual destinations, evidence states, and blocking warnings remain ahead of secondary detail.
- A long destination, reroute, Scheduled clock time, Holding state, or accessibility warning may increase row height. It cannot force a smaller unsupported text size.
- Plain language precedes operational terminology. A technical term may follow only when it helps the rider and does not replace the supported rider consequence.
- Fine gray text, dense data tables, route-color shorthand, unexplained abbreviations, and icon-only evidence labels are prohibited.
- Bottom sheets and disclosures reflow without hiding the station complex or selected direction, and closing them restores the invoking control and reading context.

## Assistive reading and announcements

Assistive technology reads each admitted arrival as one coherent decision group in this order:

1. route and actual destination;
2. supported time or operational state;
3. explicit evidence state;
4. rider-facing direction and service exception, including a reroute when present;
5. platform or accessibility warning; and
6. verified guidance, followed by genuinely secondary detail.

For example, the semantic sequence may be “F train to Jamaica–179 St, three minutes, Live, Queens-bound, via E line,” followed by an applicable platform, accessibility, or verified guidance statement. The example illustrates order only; it is not observed output or permission to use a state without its evidence.

The visual hierarchy and assistive order are intentionally distinct. DOM or accessibility-tree order follows the assistive sequence rather than visual coordinates. A swipe, row grouping, or refresh cannot cause assistive technology to read a different route, destination, direction, evidence state, warning scope, or row order from the visible board.

A newly received change that blocks the rider's selected accessible path is announced immediately with the changed consequence, exact path scope, and available next action. Focus and reading position remain coherent. The announcement does not repeatedly reread the full station header, every arrival, or the entire screen; the updated content is read normally when the rider reaches it.

Every interactive control exposes its visible label, role, selected or expanded state, current value where applicable, and resulting mode change. A color name, unlabeled icon, animation, or gesture hint is never the sole accessible name.

## Touch, reach, and context preservation

Every core action from the station-board contract has an interactive target of at least 48 by 48 points. Padding inside the hit target counts only when it activates the same control; visual artwork alone does not. When available, the complete core target is presented in the lower third of the screen. A core control may open a bottom sheet, but it cannot move its only invocation to the top of the screen.

| Task 5 core action | Required visible treatment | 48-by-48 and bottom-third contract | Mode, destructive, gesture, and context rule |
|---|---|---|---|
| Current direction labels | One target per passenger-serving direction, labeled with a rider-recognizable bound and actual-destination context | Every direction target is at least 48 by 48 points in the bottom-third direction group | The selected state is exposed visually and semantically. A swipe may accelerate switching, but all targets remain visible. |
| **Reverse direction** | Explicit result label | At least 48 by 48 points in the bottom-third direction group when one verified opposite exists | This mode-changing action updates board and verified orientation together. A reversal gesture never replaces the labeled control. |
| **Filter routes** | Explicit mode label with current filter state available | At least 48 by 48 points in the bottom control row | Opens a context-preserving bottom sheet. Route choices use text plus the redundant route treatment. A gesture never replaces the control. |
| **Refresh** | Direct visible action | At least 48 by 48 points in the bottom control row | Secondary pull-to-refresh remains optional and follows identical truth rules. Neither action creates freshness. |
| **Save station** / **Saved** | Explicit save state; **Saved** exposes state rather than silently deleting it | At least 48 by 48 points in the bottom control row | Any future destructive removal is separately labeled **Remove saved station**; it is never an unlabeled second tap, swipe, or long press. |
| **Nearby** | Explicit persistent-destination label | At least 48 by 48 points in persistent bottom navigation | Exposes selected destination state and returns to preserved Nearby context. |
| **Map** | Explicit persistent-destination label | At least 48 by 48 points in persistent bottom navigation | Carries and preserves station, direction, and supported orientation context. |
| **Commute** | Explicit persistent-destination label | At least 48 by 48 points in persistent bottom navigation | Changes destination only; it does not create notification eligibility. |
| **Saved** | Explicit persistent-destination label, semantically distinguished from the station save control | At least 48 by 48 points in persistent bottom navigation | Changes destination only and preserves the station-board return state. |

Any destructive action uses an explicit verb and object, such as **Remove saved station**, and cannot rely on an unfamiliar gesture. Any mode-changing action names the resulting destination, direction, filter, or mode and exposes the current selected state. Every swipe, pull, long press, or drag that accelerates an action has a visible button equivalent with the same consequence.

Bottom sheets stop at a useful intermediate height, retain the station-complex name and selected direction in view, keep the underlying station context recognizable, and return focus to the invoking control when dismissed. Their interactive options also meet the 48-by-48-point minimum. A sheet may expand only through an explicit rider action; it cannot silently replace the station board.

## Restrained motion and reduced motion

Motion explains a state change and never creates meaning:

- A direction reversal may use one short, finite transition that ends when the board and verified positioning orientation change together.
- A restrained freshness indicator may appear only while a current-data request is active or newly received evidence is being applied after the owning truth policy admits it. It stops when the request resolves or the owning state becomes stale, degraded, unavailable, or frozen.
- Perpetual train motion, looping track movement, pulsing countdowns, or any animation that implies unconfirmed train progress is prohibited.
- When data becomes stale or its route/feed group enters frozen recovery presentation, every arrival animation and decrement stops immediately.
- When an arrival changes to **Holding**, the last supported time visibly freezes. The state label and supported last-movement context carry the meaning; it does not keep decrementing or pulsing.

With reduced motion enabled, direction reversal, freshness, refresh, stale, and Holding states convey their full visible and spoken meaning without translation, looping, pulse, or required movement. The route, destination, selected direction, values, evidence labels, warnings, focus order, and announcements remain complete. An instantaneous state update or static status treatment is permitted; loss of meaning is not.

Reduced-motion conformance remains a separate Nearby Task 14 evidence case. It is **Not run — Pending** and is not counted as a seventh item in the six-audit inventory below.

## Product audit register

Task 6 says to complete “five product audits” but names six: arm's-length glance order, poor-light contrast, large text, route recognition without color, assistive reading order, and one-handed reach. All six are separately blocking here; none is merged or dropped. Contract prose is not an audit result.

The 4.5:1 and 3:1 contrast thresholds, 5-lux viewing condition, 60-cm viewing distance, and five-second glance exposure below are Task 6 product-defined **Draft pass criteria** chosen to make later review reproducible. They are not quoted source requirements, observed findings, approval, or an external conformance claim.

### UG-A01 — Arm's-length glance order

| Audit field | Draft requirement |
|---|---|
| Expected fixture | Final rendered dark-first station board on the narrowest supported portrait viewport, viewed at 60 cm for one five-second exposure. It includes representative Live, Expected, and Holding rows, a long actual destination, explicit evidence labels, a reroute or other exception, and a platform or accessibility warning. |
| Fixed pass criteria | Every required reviewer identifies the next rider decision and the five levels in the exact fixed order; levels 1–4 remain readable without zoom or disclosure; the actual destination and evidence label remain visible; level 5 does not compete with levels 1–4; no dense table, fine gray primary text, or subtle-color-only distinction appears. Any miss fails. |
| Current finding | **Not run — Pending.** No fixed rendered fixture or review observation exists. |
| Missing evidence and owner | Experience Product Lead supplies the fixed render and viewport record. Release Quality Lead records the Task 14 observation against the fixed version. Product, Accessibility, Content, and the policy-required Data Quality reviewer must decide on the same evidence. |

### UG-A02 — Poor-light contrast

| Audit field | Draft requirement |
|---|---|
| Expected fixture | Final dark-default board in a fixed 5-lux viewing condition, plus the rider-selected light treatment, containing primary values, standard text, muted secondary text, focus indicators, route identity, and each warning/state family. |
| Fixed pass criteria | All measured text at every supported size is at least 4.5:1 and essential non-text boundaries and focus indicators are at least 3:1 against adjacent colors in both themes; muted text is used only for secondary information; every alert retains text and spoken meaning without color. One failed element fails the audit. |
| Current finding | **Not run — Pending.** No final tokens, rendered themes, luminance measurements, or low-light observation exists. |
| Missing evidence and owner | Experience Product Lead supplies final renders and token mapping. Release Quality Lead records measurements and Task 14 results; Accessibility reviews the measurement method and result, with Product, Content, and Data Quality reviewing the same fixed version. |

### UG-A03 — Large text

| Audit field | Draft requirement |
|---|---|
| Expected fixture | The narrowest supported portrait viewport at every supported large-text size, using the longest supported station and actual-destination labels, an explicit evidence state, a Scheduled clock time or Holding state, a reroute, a blocking accessibility warning, all core controls, and a bottom sheet. |
| Fixed pass criteria | The complete destination and evidence-state label are never truncated, ellipsized, hidden, or moved behind disclosure; the five-level priority remains intact; plain language precedes operational terms; decision content requires no horizontal scroll; all core controls remain available and at least 48 by 48 points; the sheet retains station and direction context. Any supported size that fails fails the audit. |
| Current finding | **Not run — Pending.** No supported-size inventory, fixed render set, or large-text observation exists. |
| Missing evidence and owner | Experience Product Lead supplies the supported-size matrix and renders. Release Quality Lead records Task 14 results; Accessibility and Content review retention and language, with Product and Data Quality on the fixed version. |

### UG-A04 — Route recognition without color

| Audit field | Draft requirement |
|---|---|
| Expected fixture | A fixed board and route-filter sheet with several routes, a selected direction, Live and non-Live states, a service warning, an accessibility state, and a clearly labeled hypothetical capacity sample, rendered with all colors removed or mapped to equal luminance; matching screen-reader output is captured. |
| Fixed pass criteria | Every route remains identifiable by letter or number, applicable shape, and spoken name; route identity remains separate from reroute meaning; direction, selected state, warning, accessibility, and capacity meaning remain correct through visible text/semantics and spoken labels. Zero required distinction relies on color, brightness, or alert hue. |
| Current finding | **Not run — Pending.** No color-removed render, spoken-label capture, or fixed fixture exists. |
| Missing evidence and owner | Experience Product Lead supplies the fixed color-removed render and asset mapping. Release Quality Lead records Task 14 results; Accessibility, Content, Product, and Data Quality review the same fixture. The capacity sample tests the no-color rule only and does not enable crowding. |

### UG-A05 — Assistive reading order

| Audit field | Draft requirement |
|---|---|
| Expected fixture | Fixed screen-reader captures for a normal arrival, a rerouted arrival, a Holding arrival, and a newly received blocking accessible-path change while focus is elsewhere. Together they include actual destination, time or operational state, evidence state, rider-facing direction, exception, platform or accessibility warning, and verified guidance. |
| Fixed pass criteria | The arrival is read in the six-step assistive order above; the spoken route, destination, time/state, evidence, direction/exception, warning, and guidance agree with the visible row; the blocking path change is announced immediately with scope and next action; focus remains coherent; the whole screen is not repeatedly reread; every control exposes label, role, and state. Any disagreement or omitted blocking announcement fails. |
| Current finding | **Not run — Pending.** No accessibility-tree inspection, screen-reader transcript, focus record, or announcement capture exists. |
| Missing evidence and owner | Experience Product Lead supplies the fixed semantic fixture. Release Quality Lead records Task 14 output; Accessibility leads the review with Product, Content, and Data Quality deciding on the same version. |

### UG-A06 — One-handed reach

| Audit field | Draft requirement |
|---|---|
| Expected fixture | Measured final layouts at default and largest supported text for every supported viewport and both left- and right-hand use, covering all nine Task 5 core controls, route-filter and direction bottom sheets, reverse direction, direct Refresh, secondary pull-to-refresh, save, each primary destination, and return to the preserved board. |
| Fixed pass criteria | Every available core target measures at least 48 by 48 points and its complete hit target is in the screen's lower third; every gesture has a simultaneously discoverable visible button equivalent; mode-changing and destructive actions have explicit result labels; bottom sheets retain station and direction context at an intermediate height; all Task 5 preserved-state and single-tap rules remain unchanged. One missing or undersized core target fails. |
| Current finding | **Not run — Pending.** No final layout, target-bound measurement, handedness observation, gesture-equivalence capture, or sheet-context record exists. |
| Missing evidence and owner | Experience Product Lead supplies final layouts and measured bounds. Release Quality Lead records Task 14 results; Accessibility and Product lead reach review, with Content and Data Quality reviewing labels and truth-preserving behavior on the fixed version. |

## Rights review and public-release blocker

Current official MTA line-color references may guide product review, but this Draft records no exact applied-color conformance, source revalidation, license, permission, or public-use authorization.

| Asset or treatment | Draft use | Evidence required before public release | Current disposition |
|---|---|---|---|
| Current official line-color data | May guide route-recognition review only when letter or number, applicable shape, and spoken route name remain independently complete. | Dated reference and value mapping, asset inventory, rendered comparison, reviewer decision, and any rights determination applicable to the treatment. | **Not run — Pending.** Reference availability is not an exact-conformance or permission claim. |
| Official MTA maps | May appear only in non-public review fixtures when authorized for that review context. | Durable documentation of permission or license scope for the exact map/version and intended public distribution, including attribution and term limits. | **Blocked from public release — rights not documented.** |
| Official MTA symbols, including protected bullet artwork | May guide the required redundant shape treatment in review; text and spoken route identity remain complete without the asset. | Durable documentation covering the exact symbol set, use, modification, platforms, distribution, attribution, dates, and reviewer decision. | **Blocked from public release — rights not documented.** |
| MTA logos and other brand assets | No asset is assumed available merely because operational data is available. | Durable asset-by-asset permission or license record for the intended public use. | **Blocked from public release — rights not documented.** |
| Product-created text and non-protected fallback treatment | May support independent legibility and no-color review. | Recorded rights review confirming the fallback does not rely on a protected asset, plus rerun route-recognition and accessibility evidence. | **Pending rights and rendered review.** |

The Experience Product Lead owns the asset inventory for this standard. A durable rights authority, permission record, and asset-specific decision are not yet identified; that evidence is **Pending**. Task 15's release reviewer must verify either documented permission for every protected asset actually used or a reviewed removal/no-dependency result with rerun visual evidence.

Any official map, symbol, logo, or brand asset without documented applicable rights is a public-release blocker. Copy changes, an available feed, an official color reference, a committed document, or a design-review screenshot cannot waive it.

## Ownership and pending evidence

| Decision or evidence | Authoritative owner | Current disposition |
|---|---|---|
| Visual hierarchy, themes, redundant recognition, large-text rules, assistive order, touch/reach, and motion criteria | This standard; Experience Product Lead | **Draft**; six audits Not run — Pending |
| Station-board controls, labels, continuity, hierarchy application, and cause-gated states | [Station board and controls contract](station-board-and-controls-contract.md), Task 5 | Consumed unchanged; its expected walkthroughs are not measured proof |
| Live, Holding, degraded, stale, unavailable, and recovery truth | Linked arrival-truth policies and Gate 0 evidence owners | **NO-GO — GATE 0 NOT PASSED**; public boards blocked |
| Accessible-path state and immediate blocking-change consequence | Companion accessibility owners | Approval and observed evidence absent |
| Platform and positioning guidance | Companion guidance owners | Approval, coverage, and observed evidence absent |
| Underground interaction observations, including reduced motion | `docs/product/nearby-offline/acceptance-evidence.md`, Nearby Task 14; Release Quality Lead | Draft evidence ledger present; rendered evidence and same-version approval Not run — Pending or Pending |
| MTA rights and public-release use | Asset inventory owned here; Task 15 release review records the blocker | Rights authority and durable permission evidence absent; public use blocked |
| Mandatory reviewer routing | Product Governance Lead under the review policy | Header and Draft index row list P/A/D/C; all same-version reviewer decisions remain Pending |

## Draft review checklist

| Review question | Draft contract result | Evidence required before approval |
|---|---|---|
| Is the five-level visual hierarchy exact, with evidence labels and destinations retained? | Yes by contract; not rendered. | UG-A01 and UG-A03 |
| Are visual and assistive orders distinct while carrying the same decision meaning? | Yes by contract; not inspected. | UG-A05 and accessibility-tree record |
| Is dark mode the time-independent default and light mode an explicit preference? | Yes by contract; not rendered. | UG-A02 and Task 14 dark-first evidence |
| Can route, state, direction, warning, accessibility, and capacity meaning survive without color? | Required by contract; not demonstrated. | UG-A04 |
| Does every Task 5 core control meet 48-by-48 and bottom-third requirements with visible gesture alternatives? | Required by contract; not measured. | UG-A06 |
| Do stale and Holding states stop movement and decrementing, including under reduced motion? | Required by contract; not observed. | Task 14 freshness and reduced-motion evidence |
| Are official maps, symbols, and brand assets cleared for public use? | No. | Asset inventory and durable MTA rights evidence or reviewed removal/no-dependency result |
| Are all mandatory reviewer roles aligned between the artifact and Draft index row? | Yes; Product, Accessibility, Data Quality, and Content are registered in both. No reviewer decision is implied. | Same-version decisions from all four roles |
| Does this Draft claim visual conformance, Gate 0 passage, rights permission, or release approval? | No. The decision remains **NO-GO — GATE 0 NOT PASSED**; public boards blocked. | Fixed-version evidence, complete reviewer decisions, rights resolution, and the later release gate |
