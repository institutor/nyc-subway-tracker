# Map modes and journey behavior

| Governance field | Value |
|---|---|
| Source sections | Approved specification §17 and §31.4 scenario 25; nearby-station and offline-experience plan `Product artifact map` and Task 7 `Product artifacts`, `Ordered steps`, and `Acceptance evidence`; Task 7 brief |
| Owner | Experience Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Not run — Pending; scenario 25, reroute, map-state, ranking, and Nearby Task 14 evidence are absent |

## Purpose and authority

This contract owns the map's independent appearance, service-meaning, spatial-view, and overlay axes; Actual now and reference-layer behavior; map interaction continuity; route-change visualization; geographic honesty; and current and future journey presentation and ranking. It applies the [underground visual and reachability standard](underground-visual-and-reachability-standard.md) and the cross-surface continuity in the [nearby and offline experience contract](experience-contract.md).

This contract does not create an arrival, current stopping pattern, service-change impact, schedule edition or currency decision, accessible path, equipment state, platform guidance, street-walking estimate, offline-validity decision, asset license, or release approval. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. Shared concepts retain their meanings in the [transit product glossary](../contracts/transit-product-glossary.md), and visible and spoken wording remains subject to the [rider language rules](../contracts/rider-language-rules.md).

Current service consumes the [arrival admission and ordering contract](../arrival-truth/arrival-admission-and-ordering-contract.md), [service-change impact and resolution policy](../arrival-truth/service-change-impact-and-resolution-policy.md), and [reroute and track-conflict playbook](../arrival-truth/reroute-and-track-conflict-playbook.md). Service date and future patterns consume the [time and train continuity policy](../arrival-truth/time-and-train-continuity-policy.md), [source role and precedence matrix](../arrival-truth/source-role-and-precedence-matrix.md), and [schedule fallback and currency policy](../arrival-truth/schedule-fallback-and-currency-policy.md). Task 7 owns unmistakable online reference-layer meaning. Task 8 alone will own stored-map and offline-open eligibility, reference-itinerary eligibility, schedule-validity presentation, and application of the exact offline honesty copy **Reference pattern—not live.** That exact offline copy is a future Task 8 dependency, not Task 7 acceptance evidence.

This artifact is **Draft**. The authoritative [Gate 0 exit record](../quality/gate-0-exit-record.md) is **NO-GO — GATE 0 NOT PASSED**; public boards blocked. Companion complete-path, equipment, guidance, and acceptance artifacts do not exist, scenario 25 and the walkthroughs below are **Not run — Pending**, and MTA map, symbol, and brand rights are unresolved. Contract prose is an expected product rule, not observed evidence or public-release permission.

### Provenance reconciliation

The product artifact index currently registers this Task 7 artifact against specification §17 only. The Task 7 brief, delivery plan, and required day-to-night walkthrough also allocate §31.4 scenario 25 here. Record that provenance reconciliation in the index before any lifecycle advancement. This task does not change the index; the reconciliation remains **Pending**.

## Independent map axes

Map state is the explicit combination of four independent axes plus preserved selection and viewport context. A change to one axis cannot silently change another.

| Axis | Values | Meaning owned here | Independence rule |
|---|---|---|---|
| Appearance | **Dark** by default; **Light** by explicit rider preference | Visual theme under the Task 6 standard | Appearance never selects a service pattern, changes a service date, creates currency, changes a spatial view, or toggles an overlay. Time of day never changes the theme automatically. |
| Service meaning | **Actual now**, **Typical weekday**, **Late night** | Whether geometry expresses current admitted service or a named reference pattern | A service-layer choice never changes Dark/Light, Schematic/Geographic, overlays, zoom, position, station, or direction. Loss of current evidence does not silently select a reference layer. |
| Spatial view | **Schematic**, **Geographic** | Whether the map prioritizes service comprehension or street access | A view change never changes the selected service layer, appearance, overlay set, route, station, direction, journey, or evidence state. |
| Overlays | Selected route, localized disruption, accessibility path, entrances and walking, or no optional overlay; compatible overlays may coexist | Additional scoped meaning over the selected service layer and spatial view | Toggling an overlay changes only that overlay. It cannot change the underlying service pattern, infer a current claim, disable Accessible Route Only, or recenter the map. |

The selected route or station, rider-facing direction, journey, zoom, map position, opened station board, and reading position are preserved context rather than hidden substitutes for an axis. Every visible control and assistive label identifies the current value of each applicable axis.

### Axis-change contract

- Only an explicit rider action or a governed evidence update may change the content associated with an axis.
- An evidence update may redraw **Actual now** within its supported scope, mark it unavailable, or change an overlay whose owner supplied a new state. It cannot alter appearance, spatial view, or unrelated overlays.
- Selecting a future departure is an explicit planning action. It may select or span reference patterns for that itinerary, but the map visibly states the resulting service meaning and preserves appearance, spatial view, overlays, viewport, station, and direction.
- Crossing midnight, a phone-clock change, a foreground refresh, a theme change, or a map-view change never selects Typical weekday or Late night by itself.

## Service-layer contract

| Service layer | Eligibility and content | Required visible treatment | Unavailable or prohibited treatment |
|---|---|---|---|
| **Actual now** | Online/current only. Show admitted current stopping patterns plus active owner-resolved disruptions, reroutes, suspensions, closures, skipped stops, and other localized consequences for the supported scope. | While eligible, keep **Actual now** visibly selected. Preserve route identity separately from the current stopping pattern and retain every required evidence, exception, and warning label. If an affected scope loses eligibility, show its unavailable state without current geometry or claims. | When current evidence is unavailable, disable the unsupported scope, explain that current service information is unavailable, and offer explicit **Typical weekday** and **Late night** controls. Never show cached, stored, supplemented, regular, or reference geometry as Actual now and never switch layers automatically. |
| **Typical weekday** | Explicit daytime reference pattern supplied by the governed schedule/topology source. It is not evidence of current service, alerts, reroutes, closures, arrivals, or equipment operation. | Show **Typical weekday — reference** and a visible **Not current** state wherever the map, route detail, station context, or journey could be mistaken for current. | Do not use **Actual now**, Live styling, current disruption absence, or unlabeled cached geometry. Task 8 owns whether and how this layer is stored or valid offline. |
| **Late night** | Explicit overnight reference pattern supplied by the governed schedule/topology source. It is not selected merely because the phone clock is late. | Show **Late night — reference** and a visible **Not current** state wherever the map, route detail, station context, or journey could be mistaken for current. | Do not imply current overnight service, silently replace a weekday pattern, or infer live equipment or disruption state. Task 8 owns storage and offline validity. |

The layer-specific reference name and **Not current** state stay visible in the layer control and map legend and remain associated with any route detail or future journey built from that reference geometry. Opening a contextual station board from a reference map does not convert the map to Actual now or convert reference geometry into current truth. The station board presents only its separately governed evidence states while the underlying reference treatment remains visible.

### Actual-now loss and partial scope

If current evidence fails for one route, feed group, segment, or overlay while other current scopes remain supported, keep independently supported Actual-now service visible and place the unavailable explanation at the narrowest affected scope. Do not declare the whole network unavailable, fill the gap with a normal pattern, or erase unaffected service.

If the current map cannot support any useful Actual-now scope, retain the selected viewport, station, direction, and overlays as context, disable **Actual now**, explain why it is unavailable, and expose both named reference-layer controls. The rider chooses a reference layer explicitly. Until that choice, no reference geometry appears under the Actual-now label.

Connectivity or current-source loss while **Actual now** is selected follows the same rule: preserve the selected layer intent, viewport, station, direction, route, and overlay choices, but withhold unsupported current operational geometry and overlay claims. A neutral structural shell may remain only when it is visually and accessibly distinct from current service and carries no current stopping-pattern, disruption, reroute, closure, equipment, or accessibility meaning. Any last coherent operational rendering that Task 10 later permits to remain is frozen context under its explicit offline treatment, not an active or current Actual-now layer. Reference geometry never fills the gap and the rider must deliberately select a reference layer. Task 10 will own the persistent offline, degradation, reconnection, and recovery copy and states.

## Deterministic map-state matrix

Each row is an expected transition rule. None is an observed scenario result.

Matrix evidence status: **Not run — Pending** — fixed state transitions, rendered results, assistive output, and Nearby Task 14 observations are absent.

| Starting state or event | Permitted state change | State that remains fixed | Required visible result | Prohibited result |
|---|---|---|---|---|
| Initial Nearby-to-Map transition with no preserved Map state and eligible current evidence | Select **Map**, **Actual now**, and the initial rider-centered viewport | Dark/Light preference, selected station, direction, route filter, Accessible Route Only, and relevant overlays from Nearby context | One initial centering action with Actual now visibly selected; current service is owner-supplied | A fifth destination, repeated auto-centering, guessed station or direction, or reference geometry labeled current |
| Initial Nearby-to-Map transition with no preserved Map state and Actual now unavailable | Select **Map** and open the service-layer choice with Actual now disabled | Appearance, selected station, direction, accessibility setting, and any safe preserved viewport | Plain-language current-unavailable explanation plus explicit Typical weekday and Late night choices | Automatically selecting a reference layer or presenting one as Actual now |
| Return to a previously used Map | Restore the complete preserved map tuple before refresh | All axis values, station, direction, highlighted route, zoom, position, opened board, and reading context | The same view returns first; governed updates apply second | Reset to Actual now, Schematic, rider-centered position, or a default station |
| Dark ↔ Light | Appearance only | Service layer, spatial view, overlays, selection, viewport, service date, and journey | Theme changes while service meaning remains visibly unchanged | Day/night service change, time-based theme override, or evidence-state change |
| Actual now ↔ Typical weekday or Late night by rider action | Service meaning only | Appearance, spatial view, overlays where meaningful, station, direction, route, and viewport | Selected layer and applicable honesty label update together | Silent theme/view change, retained Live implication, or unlabeled reference geometry |
| Schematic ↔ Geographic | Spatial view only | Appearance, service layer, overlays, route, station, direction, journey, zoom intent, and evidence state | Equivalent selected context appears in the new view | Treating schematic spacing as walking distance or changing service pattern |
| Overlay toggle | Named overlay only | Every other axis, selected service pattern, station, direction, viewport, and accessibility preference | The overlay label, visual pattern, and spoken state agree | Color-only meaning, inferred current status, or map recenter |
| Pan or zoom | Viewport only | Every axis, selection, direction, journey, and evidence state | Deliberate viewport change persists on return | Automatic rider recenter or selection loss |
| Visible **Center on me** action | Viewport center only | Every axis, zoom policy, station/direction selection, overlays, and service meaning | Rider-requested recenter with preserved map meaning | Re-ranking, changing layer, changing station, or implying precise background tracking |
| Current evidence becomes unavailable while Actual now is selected | Availability and content of the affected Actual-now scope only | Appearance, spatial view, overlays, viewport, station, direction, and the rider's Actual-now intent until the rider chooses otherwise | Unsupported scope disabled with explanation; reference choices become available | Cached/reference replacement, automatic reference selection, or network-wide failure from one route |
| Owner-supplied current reroute changes | Actual-now affected-segment geometry and scoped consequence only | Route identity, unaffected segments and services, appearance, spatial view, viewport, station, and direction | Changed segment redraws; skipped stations receive visible and spoken labels | Banner-only treatment, guessed path, erased unaffected service, or route-identity change |
| Station selected | Open or update the contextual station board from the bottom | Map destination, all axes, viewport, selected route, and return context | Station and rider-facing direction carry into the board; closing restores the same Map | Full-screen context loss, default direction, or map reset |
| Future departure or arrival selected | Explicit itinerary planning pattern and its visible reference context | Appearance, spatial view, overlay choices, viewport, destination input, and service date evidence | Selected or spanning reference pattern is explained; honesty label is visible | Phone-clock selection, theme change, silent midnight switch, or future schedule labeled current |

## Time-spanning pattern selection

Planning uses the trip's source-supported operating service date and its departure and arrival times in New York local time. It never derives service date from the rider's phone date, midnight alone, a displayed clock time alone, theme, or current map view.

Apply this order:

1. Retain the source-supported service date and authoritative chronology for the proposed trip.
2. Determine the applicable planning pattern at departure, at arrival, and at each supported service-pattern boundary crossed in between.
3. Use the owner-selected supplemented pattern when the journey is inside its effective horizon and service-date coverage; use the owner-selected regular schedule beyond that horizon.
4. Keep one itinerary across a Typical-weekday-to-Late-night or Late-night-to-Typical-weekday transition.
5. Mark the exact leg, station, transfer, or time boundary where the service pattern changes and explain the consequence for later legs.
6. Show the layer-specific **reference** and **Not current** treatment for every reference-derived segment and retain the source owner's confidence, currency, effective-date, and service-date treatment.

A calendar-date change may occur without a service-date or pattern change, and a pattern change may occur without midnight. The supported operating pattern controls. A daylight-saving transition cannot duplicate a leg, reverse order, or create a negative duration.

## Map interaction continuity

- Center on the rider only through the visible bottom-third **Center on me** action or the single initial Nearby-to-Map transition when no preserved Map state exists.
- Preserve appearance, service layer, spatial view, overlays, selected route, selected station, rider-facing direction and actual destination, zoom, position, opened station board, journey, and reading context.
- Selecting a station opens its contextual board from the bottom at a useful intermediate height. The selected station and direction remain visible, and dismissal returns focus and map context to the invoking station.
- Selecting a route highlights its owner-supplied stopping pattern and dims unrelated services without hiding them or changing their truth.
- Returning from a station board or another persistent destination restores Map context first and refreshes second. Refresh may redraw supported current content but cannot reset an axis, recenter, clear a warning, or change the rider's station or direction.
- A contextual board is not a fifth persistent destination. The persistent bottom destinations remain exactly Nearby, Map, Commute, and Saved.

Map controls follow the Task 6 reach, label, non-color, large-text, and assistive rules. **Center on me**, service-layer controls, Schematic/Geographic controls, overlay controls, and the secondary **Plan a trip** action remain visible, explicitly labeled, and bottom-third reachable when applicable.

## Reroute and service-change visualization

A route identity and its current stopping pattern are separate. A rerouted F train remains the F route while its owner-supplied path, actual destination, direction, and **Via…** treatment describe where it is serving.

For an owner-resolved reroute:

1. Highlight the selected route's supported current stopping pattern and dim rather than remove unrelated service.
2. Redraw the affected segment on the map. Use a visible change treatment plus text or pattern; color alone is insufficient.
3. Mark every owner-resolved skipped station with a visible **Skipped** label and equivalent spoken consequence at the exact station and direction scope.
4. Show the changed path and preserve the unchanged portions of the route.
5. Keep unaffected routes, directions, stations, segments, entrances, and accessible paths visible when their own evidence remains valid.
6. Keep the original official service-change detail available and use the narrowest plain-language summary supported by its owner.

A banner may supplement this geometry but never replace it. If a high-impact reroute cannot be mapped safely, do not draw a guessed segment or optimistic normal path. Withhold the affected Actual-now geometry, preserve unrelated service, and show the owner-supplied unavailable explanation and official detail for the narrowest unresolved scope.

Reference layers show only their governed reference pattern. They do not absorb an active reroute unless the applicable planning-pattern owner has incorporated that change for the proposed service date and effective time, and they still carry their layer-specific **reference** and **Not current** treatment.

## Accessibility overlays

Accessibility overlays consume companion complete-path, equipment, direction, entrance, platform, transfer, and destination-exit decisions. They do not infer a complete path from a station badge, one elevator, route color, normal topology, or missing outage record. The companion artifacts and observed evidence are absent, so no positive current accessibility claim is demonstrated here.

| Overlay state | Required redundant treatment | Meaning that may be presented only when supplied | Prohibited inference |
|---|---|---|---|
| **Full** | Visible **Full path** text, continuous non-color line pattern, path endpoints, direction and destination scope, and equivalent spoken label | A complete path for the exact trip scope; a current claim additionally requires every route-critical equipment and operational condition from its owner | A complex-wide badge, current operation from structural topology, or **Accessible now** without complete current evidence |
| **Partial** | Visible **Partial path** text, segmented line pattern, named verified and missing portions, and equivalent spoken label | Only the verified subset of a path | Treating a partial path as boardable, complete, or a substitute for missing evidence |
| **Directional** | Visible **Directional path** text, direction marker, rider-recognizable bound plus actual destination, and spoken scope | Availability only for the exact supplied constituent route and direction | Generalizing to the opposite direction, another constituent station, or the whole complex |
| **Currently blocked** | Visible **Currently blocked** text, blocked marker and line pattern, exact failed edge or consequence, and immediate spoken warning | A current owner-supplied path invalidation and any verified alternative | Keeping the blocked route ranked, recoloring it as usable, or suppressing unrelated train service |
| **Status unknown** | Visible **Status unknown** text, distinct question/dashed pattern, exact unknown scope, and spoken state | Absence of a verified current usable decision | Treating Unknown as operational, working, safe, or equivalent to no reported outage |

Color may reinforce an overlay but never carries full, partial, directional, blocked, or unknown meaning alone. Every state remains distinguishable in grayscale, with large text, and through assistive technology under the Task 6 standard.

On a reference layer, structural accessibility information remains reference context and cannot imply current equipment operation. Task 8 owns offline and stored accessibility wording and validity. This contract never manufactures **Accessible now**.

## Schematic and geographic honesty

| Spatial view | Primary purpose | Permitted content | Prohibited claim |
|---|---|---|---|
| **Schematic** | Service comprehension | Route topology, station order, transfers, selected pattern, changed segments, skipped-station labels, and scoped overlays | Street walking distance, entrance proximity derived from diagram spacing, precise geography, or an inferred access path |
| **Geographic** | Street access and walking | Geographic station and entrance positions, street context, and Task 3's evidence-supported walking estimate and useful-entrance result | A walk estimate derived from schematic spacing, station-centroid shortcut, or unsupported entrance/path relationship |

Changing Schematic/Geographic preserves the selected service layer, route, station, direction, overlays, journey, and evidence meaning. If a geographic walking estimate is unavailable, show no invented distance. A schematic route and a geographic walk may contribute to one journey only while their distinct evidence and purposes remain visible.

## Destination planning and ranking

Destination planning is secondary to the zero-tap Nearby board. A visible bottom-third **Plan a trip** action opens it without displacing Nearby as the default home or requiring an account.

The rider may choose a destination from:

- the map;
- saved places;
- recent stations; or
- search.

Search is one destination input, not the normal launch screen. Map, saved, and recent choices remain available without first opening the keyboard.

Evaluate and rank each option lexicographically in this exact order:

| Rank | Decision factor | Required treatment |
|---:|---|---|
| 1 | Current validity of every proposed train and stop, or validity for the explicit future planning horizon | Reject an option whose owner-supplied stopping pattern, service date, effective coverage, or current veto does not support the proposed trip. Optimistic geometry cannot repair it. |
| 2 | Accessibility requirements | Treat Accessible Route Only and the rider's complete-path requirements as hard constraints. Unknown, partial, blocked, wrong-direction, or unverified substitutes do not qualify. |
| 3 | Disruption and transfer risk | Prefer a materially safer supported option over a fragile optimistic connection. Preserve owner-supplied Likely, Tight, Uncertain, or Unlikely transfer meaning; never promise a connection. |
| 4 | Number of transfers | Prefer fewer transfers only after validity, accessibility, and risk requirements are satisfied. |
| 5 | Walking distance | Use evidence-supported geographic walking distance to a useful entrance, never schematic spacing or centroid distance. |
| 6 | Expected arrival time | Use only the time treatment permitted by the journey's evidence and planning horizon. ETA is the final ranking factor, not a shortcut around earlier factors. |

A fragile transfer never ranks above a slightly slower, materially safer direct trip solely because its optimistic expected arrival is earlier. If an otherwise faster option is demoted by validity, accessibility, or risk, expose the decision-changing reason in plain language.

Present at least one materially different alternative when available. An alternative is material only when it changes a rider decision dimension such as route or stopping pattern, transfer count or location, accessible chain, disruption exposure, entrance or walking tradeoff, or service-pattern boundary. Do not duplicate the primary journey with cosmetic copy or color changes. When no supported material alternative exists, do not invent one.

The companion complete-path owner alone decides Accessible Route Only eligibility, resilience, and any accessibility-specific ordering among eligible alternatives. This Task 7 ranking contract adds no accessibility weights, scoring thresholds, or inferred fallback. If that owner supplies no valid materially different alternative, the map does not manufacture one.

## Current and future journey claims

| Journey context | Permitted positive basis | Required presentation | Prohibited claim |
|---|---|---|---|
| Current journey | Admitted live stopping patterns and current active service changes, reroutes, closures, and vetoes only | Use Actual now with exact route, destination, direction, evidence, exception, warning, and accessible-path scope supplied by owners | A current itinerary from a normal/static/reference pattern; static repair of a missing live stop; cached or reference geometry labeled Actual now |
| Future journey inside supplemented effective horizon | Newest applicable validated, non-superseded supplemented service pattern selected by its owner for the proposed operating service date and time | Show reference meaning, effective horizon/service date, and owner-supplied confidence and currency labels; apply any current change or veto whose supported active period overlaps the proposed leg | Live implication, complete-change guarantee, use outside coverage, or an older overlapping edition selected for optimism |
| Future journey beyond supplemented horizon | Applicable regular schedule and stable topology selected by its owner | Show reference meaning and owner-supplied confidence/currency limitation for the proposed service date | Live implication, a current-service claim, or regular schedule overriding a current or effective planned veto |
| No valid owner-supplied pattern | None | Show no journey claim and offer only evidence-supported changes to destination, time, or mode | Guessed topology, inferred service, or a weaker unlabeled itinerary |

A current active veto applies only at its supported route, direction, station or segment, and time scope; its absence never proves normal future service. Neither supplemented nor regular schedules create a Live stop call, current equipment state, or **Accessible now** claim.

## Expected walkthroughs

Every walkthrough below is an expected Draft fixture. Neither is an observed pass, scenario result, approval, rights clearance, or launch claim.

### Reroute walkthrough MAP-R01

| Walkthrough field | Expected result |
|---|---|
| Starting state | Dark appearance, **Actual now**, Schematic view, the **F** selected on its admitted current pattern, preserved station and direction, and independently supported unrelated service. |
| Governed input | The upstream owners supply a resolved F-via-E change with the exact coherent live F stopping sequence, accepted changed path, actual destination and direction, affected scope, every omitted original F stop, and official detail. Any affected accessible-path result remains companion-owned. |
| Rider action | Select the F while keeping the same Map destination, viewport, station, and direction. |
| Expected map result | The train remains the **F**. Highlight its admitted current sequence; redraw only the accepted affected path; label every omitted original F stop **Skipped** with equivalent spoken meaning; preserve unchanged F segments and independently supported unrelated service; retain scoped official detail. Show a host-line stop on the changed path only when the exact station-and-direction stop appears in the coherent live F sequence and the resolved change evidence supports that path. |
| Accessibility result | Show only the companion-supplied Full, Partial, Directional, Currently blocked, or Status unknown overlay. If the reroute makes path scope unresolved, withhold the positive path rather than inventing an alternative. |
| Unresolved branch | If the exact F sequence or accepted via-E geometry remains materially unresolved, withhold the affected Actual-now geometry, keep the F identity and unaffected evidence-supported service, and show the narrowest unavailable explanation and official detail. Do not draw the normal F path or a guessed E path. |
| Prohibited result | Banner-only change, guessed geometry, normal-pattern restoration, route-identity change, color-only skipped meaning, hidden unaffected service, static host-line stop insertion, or **Accessible now** without complete current evidence. |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Evidence status | **Not run — Pending** — fixed rendered map, assistive output, upstream truth fixture, companion accessibility result, and Task 14 observation are absent. |

### Day-to-night scenario 25 walkthrough MAP-DN25

| Walkthrough field | Expected result |
|---|---|
| Starting state | A future trip has a source-supported operating service date, New York local departure and arrival times, an owner-supplied applicable schedule pattern, and a governed weekday-to-late-night boundary during the trip. Appearance, spatial view, overlays, origin, and destination are already selected. |
| Rider action | Plan the trip across the supplied service-pattern boundary. |
| Pattern decision | Determine the pattern from the trip's departure, arrival, service date, and exact supported boundary. Use the owner-selected supplemented pattern inside its horizon or regular schedule beyond it. |
| Expected itinerary | Keep one itinerary. Identify the exact leg, station, transfer, or supported time where service changes from Typical weekday to Late night; explain the consequence for later legs; preserve route/destination/direction and service order; show the layer-specific **reference** and **Not current** treatment plus the owner-supplied confidence/currency and service-date context. |
| Preserved state | Dark/Light preference, Schematic/Geographic view, overlays, viewport, origin, destination, accessibility requirement, and selected Map destination remain unchanged except through an explicit rider action. |
| Prohibited result | Splitting the trip into unrelated itineraries, switching on phone clock or midnight alone, using theme as service meaning, duplicating or reordering a leg, hiding the boundary, losing service-date meaning, or presenting the reference journey as Actual now. |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Evidence status | **Not run — Pending** — scenario 25, fixed schedule/service-date fixture, rendered explanation, and Nearby Task 14 observation are absent. |

## Rights and public-release blocker

Current official line-color data may guide route recognition, but every map segment, state, direction, skipped-station label, and accessibility overlay remains readable through text, shape, line pattern, and spoken meaning without brand color. This Draft records no exact color conformance or permission.

| Asset or map treatment | Required evidence before public release | Current disposition |
|---|---|---|
| Official MTA map | Durable permission or license for the exact map/version, modification, platform, distribution, attribution, territory, and dates | **Blocked from public release — rights not documented.** |
| Official MTA symbols or protected route-bullet artwork | Durable asset-specific permission or license for the intended use and distribution | **Blocked from public release — rights not documented.** |
| MTA logos or other brand assets | Durable asset-specific permission or license for the intended public use | **Blocked from public release — rights not documented.** |
| Current official line-color data | Dated reference/value mapping, rendered review, non-color redundancy, and any applicable rights determination | **Not run — Pending.** A reference is neither permission nor exact observed conformance. |
| Product-created schematic, geographic, text, shape, and line-pattern treatment | Asset inventory and recorded rights review confirming it does not reproduce or depend on protected material, followed by rerun visual and accessibility evidence | **Pending rights and rendered review.** |

An official feed or public reference is not a map or brand license. Any protected map, symbol, logo, or brand asset without documented applicable rights remains a public-release blocker. Task 15 must record either applicable rights for every used asset or a reviewed removal/no-dependency result; copy changes cannot waive this gate.

## Ownership and pending evidence

| Decision or evidence | Authoritative owner | Current disposition |
|---|---|---|
| Map axes, layers, continuity, change visualization, geographic honesty, and journey ranking | This contract; Experience Product Lead | **Draft**; rendered map and walkthrough observations Not run — Pending |
| Dark/Light appearance, non-color meaning, legibility, assistive reading, and reach | [Underground visual and reachability standard](underground-visual-and-reachability-standard.md), Task 6 | Draft criteria exist; rendered/measured evidence remains Not run — Pending |
| Current stopping patterns, service-change scope, reroutes, closures, and vetoes | Linked arrival-truth owners | Draft/Pending; **NO-GO — GATE 0 NOT PASSED**; public boards blocked |
| Service date, supplemented horizon, regular schedule, edition selection, confidence, and currency | Linked arrival-truth time/source/schedule owners | Draft/Pending; scenario and currency evidence absent |
| Full, Partial, Directional, Currently blocked, and Status unknown path results | Companion accessibility and equipment owners | Artifacts, approval, and observed evidence absent |
| Stored maps, offline validity, reference-itinerary eligibility, and exact offline honesty copy | `docs/product/nearby-offline/offline-content-and-validity-contract.md`, Task 8 | Artifact absent; Task 8 must apply **Reference pattern—not live.** where stored/offline reference content could be mistaken for current; this Task 7 contract makes no storage, offline-open, or offline-validity claim |
| Reroute and scenario 25 observations | `docs/product/nearby-offline/acceptance-evidence.md`, Task 14; Release Quality Lead | Artifact and observed evidence absent; Not run — Pending |
| MTA map, symbol, and brand rights | Task 15 rights review, with asset inventory initiated here | Durable permission evidence absent; protected public use blocked |

## Draft review checklist

| Review question | Draft contract result | Evidence required before approval |
|---|---|---|
| Can changing appearance, service meaning, spatial view, or overlays silently change another axis? | No by contract. | Fixed state-transition observations from the matrix |
| Can Actual now show cached or reference content when current evidence is unavailable? | No. It is disabled and explained for the unsupported scope. | Actual-now loss and partial-scope Task 14 cases |
| Do both reference layers carry unmistakable layer-specific reference and **Not current** meaning wherever mistaken-current risk exists, without claiming Task 8's exact offline copy as Task 7 evidence? | Required by contract; not rendered. | Task 7 online Typical-weekday, Late-night, route-detail, station-context, and journey captures; separate Task 8 offline copy and eligibility evidence |
| Does a reroute redraw the segment and label skipped stations rather than relying on a banner? | Required by contract; not observed. | MAP-R01 and upstream reroute evidence |
| Can accessibility overlays use color or a station badge as the only meaning? | No. | Companion accessibility evidence plus rendered/assistive Task 14 cases |
| Can schematic spacing become walking distance? | No. | Schematic/Geographic transition and walking-source review |
| Can optimistic ETA move a fragile transfer ahead of a safer direct trip? | No; ETA is the sixth factor. | Fixed ranking fixture with owner-supplied transfer risk |
| Does scenario 25 remain one itinerary and identify the pattern boundary from service date and trip times? | Required by contract; not observed. | MAP-DN25 and upstream time/schedule evidence |
| Are protected MTA maps, symbols, and brand assets cleared for public use? | No. | Durable rights evidence or reviewed removal/no-dependency result |
| Does this Draft claim Gate 0 passage, companion accessibility approval, scenario passage, rights permission, or release readiness? | No. The decision remains **NO-GO — GATE 0 NOT PASSED**; public boards blocked. | Fixed-version evidence, all mandatory reviews, rights resolution, and later release gate |
