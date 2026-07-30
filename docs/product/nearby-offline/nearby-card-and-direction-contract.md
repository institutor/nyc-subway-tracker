# Nearby card and direction contract

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§7, 14.4–14.5, and 31.1 scenarios 1–5; nearby-station and offline-experience plan `Product artifact map` and Task 4 `Product artifacts`, `Ordered steps`, and `Acceptance evidence`; Task 4 brief |
| Owner | Experience Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Pending — scenarios 1–5 and Nearby Task 14 evidence have not been produced |

## Purpose and authority

This contract owns the initial Nearby result count, required station-card content, complete direction and operational-axis coverage, direction headings, small-screen priority, and faithful presentation of the upstream next-three result. It does not own station or entrance ranking, arrival admission, train identity, chronological ordering, schedule-fallback eligibility, service-change scope, accessibility truth, or release approval.

The [useful station and entrance ranking rules](station-ranking-and-entrance-rules.md) supply an ordered set of eligible complexes with exact entrance, axis, baseline-order, and personalization reasons. The [arrival admission and ordering contract](../arrival-truth/arrival-admission-and-ordering-contract.md) supplies the qualified primary order and separate dispositions. The [station board and controls contract](station-board-and-controls-contract.md) expands a selected card without changing its station, direction, order, filter, evidence-state, or disruption context. The [time and train continuity policy](../arrival-truth/time-and-train-continuity-policy.md), [schedule fallback and currency policy](../arrival-truth/schedule-fallback-and-currency-policy.md), and [arrival truth acceptance catalog](../quality/arrival-truth-acceptance-catalog.md) retain identity, fallback, and expected scenario authority.

The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. Shared concepts retain their meanings in the [transit product glossary](../contracts/transit-product-glossary.md), and public wording remains subject to the [rider language rules](../contracts/rider-language-rules.md).

This artifact is **Draft**. The authoritative [Gate 0 exit record](../quality/gate-0-exit-record.md) is **NO-GO — GATE 0 NOT PASSED**; public boards blocked. Companion accessibility approval and observed Nearby evidence are absent. Every walkthrough below is an expected fixture with status **Not run — Pending**, not an observed pass, approval, or launch claim.

## Initial Nearby result set

Task 4 receives Task 3's final eligible complex order after transparent permitted personalization. It applies the following rule without another station-ranking pass:

1. Take the first eligible complex in the supplied final order.
2. Continue in that same order until three complexes are selected or no eligible complex remains.
3. Show fewer than three when geography and governed evidence yield fewer than three.
4. Preserve each complex's baseline nearest-useful rank and any visible personalization reason.
5. Preserve the supplied entrance-to-constituent, entrance-to-direction, axis, closure, service, and accessibility relationships.

Task 4 must not duplicate a complex, widen an entrance or direction relationship, relax a Task 3 exclusion, pull a lower complex upward because it has more arrival rows, or replace an honest smaller result set. Arrival quantity, Live state, disruption state, screen fit, and desire to fill three cards never change the station order.

If Task 3 cannot establish a nearby order without a centroid or geographic guess, Task 4 shows the governed station-picker path. It does not invent a card merely to make Nearby look populated.

## Required card contract

Every selected complex produces one card. The card preserves the distinction between a complex, its constituents, its entrances, and its directional platforms.

| Card area | Required content | Evidence boundary |
|---|---|---|
| Complex identity | Rider-recognizable station-complex name. | A complex name does not imply identical entrances, directions, service, or accessibility across constituents. |
| Practical walk | Approximate practical street-walk time from Task 3 and the precision that result supports. | Never substitute centroid or schematic distance. Do not call a personalized farther card nearest. |
| Useful entrance | Selected useful entrance; when different directions require different entrances, show the applicable entrance with each direction. | Do not widen one entrance to another constituent or axis. |
| Route recognition | Current route identities using color plus letter or number, applicable shape, and spoken route label. | Color is never the sole route, direction, disruption, or accessibility indicator. Route identity does not prove current stop service. |
| Accessibility | Exact supplied state for the relevant entrance, constituent, route, and direction. | No station badge, elevator presence, or Nearby rank becomes an accessible-path claim. Companion accessibility approval is absent. |
| Disruption | Concise station-, constituent-, route-, direction-, entrance-, or path-specific consequence when supplied. | Do not widen an impact to the whole line or complex. Preserve unrelated directions and services. |
| Direction sections | Every current passenger-serving directional platform and operational axis, each under a clear rider-facing bound or destination heading. | No direction may be hidden because it has fewer rows, a secondary axis, or a less convenient entrance. |
| Arrival rows | Up to three upstream-qualified primary arrivals per direction, in supplied order, with route, actual destination, supported time treatment, and evidence state. | Task 4 does not admit, promote, reorder, merge, recover, or backfill a train. |
| Honest limitation | The exact cause-supported gap, unavailable, degraded, or separated fallback treatment supplied by its owner. | Empty space and row count authorize no stronger claim. |

## Direction and operational-axis coverage

### Ordinary two-direction station

Both passenger-serving directions appear in the initial card. Each has its own heading, actual destinations, applicable entrance relationship, scoped accessibility state, scoped disruption consequence, and up to three qualified primary arrivals. The rider does not search, type, switch direction, expand a card, or swipe horizontally to discover the second direction.

### Multi-axis complex

One complex card retains every passenger-serving operational axis and every current passenger-serving directional platform. Each axis appears under its own station-appropriate bound or destination heading. Intersecting service is never forced into one generic Uptown/Downtown pair, and a direction is not collapsed merely because another axis has more frequent or more numerous arrivals.

### Direction heading contract

Every primary direction heading:

- uses a station-specific rider-recognizable label such as **Uptown & The Bronx**, **Downtown & Brooklyn**, **Queens-bound**, **Manhattan-bound**, or **To Jamaica Center** only when the supplied current pattern supports it;
- is paired with the actual destination or terminal for each displayed train;
- keeps route and service pattern distinct;
- uses **northbound** or **southbound** only as secondary accessibility or operational detail; and
- never exposes a raw stop suffix, numeric direction code, or internal axis identifier as the only public description.

One heading may contain trains with different actual terminals only when the station-specific bound meaning remains true for every row. Each row still names its own actual destination.

## Compact-screen and reading priority

Direction sections stack vertically and the card scrolls. No passenger-serving direction is placed behind expansion, a mode toggle, a horizontal carousel, a swipe-only affordance, or an initial direction switch.

Within each direction, preserve this reading priority:

1. Supported arrival time or operational state.
2. Redundant route identity and actual destination.
3. Direction and localized service exception.
4. Accessibility, platform, or other decision-changing warning.
5. Entrance, walking, freshness, and secondary explanation.

Large text or a compact screen may increase vertical length; it may not remove a destination, evidence state, direction, warning, or qualified primary row merely to keep the card short.

## Exact consumption of upstream next-three

Admission finishes upstream before Task 4 receives a list. Task 4 applies the supplied disposition and order exactly:

1. The primary candidate set contains admitted **Live** and **Expected** trains only.
2. Upstream sorts primary candidates chronologically by best current arrival estimate.
3. An Expected range uses its center estimate for ordering.
4. Live precedes Expected only when their supported ranges overlap.
5. Take the first three from that upstream order for the exact direction.
6. Keep every non-primary disposition in its owned area or absence.

| Supplied disposition | Card placement | Counts toward three? | Task 4 constraint |
|---|---|---:|---|
| **Live** | Primary arrival list | Yes | Preserve supported countdown and state only while upstream keeps it qualified. |
| **Expected** | Primary arrival list | Yes | Preserve the supplied range and chronological position; do not move it behind a later non-overlapping Live train. |
| **Holding** | Separate warning row | No | Freeze the supplied time; never promote it to fill the primary list. |
| Confirmed-pattern **Uncertain** | Expandable secondary area | No | Use the supplied no-exact-minute treatment; it is not a weaker primary row. |
| **Scheduled** | Clearly separated fallback board | No | Use a clock time with **Scheduled** and **Live data unavailable**; never mix into the live next-three. |
| Resolved suppression | No arrival row | No | Preserve only the narrowest supported service-change consequence. |
| **Arrival claim unavailable** | Scoped unavailable explanation | No | Preserve the owning explanation and unrelated service; do not invent a train row. |
| Quarantined or limited | No arrival row; only supported board-level limitation | No | Never expose quarantine, raw identity, or internal reason as rider copy. |

Task 4 never globally sorts Live before Expected, sorts by visual certainty, reorders to alternate routes, averages a range, creates a countdown from a scheduled time, or uses a weaker disposition to complete three rows.

## Honest fewer-than-three and unavailable states

When the upstream primary list contains zero, one, or two rows, show exactly that number. Add only the explanation supported for the exact cause and scope:

| Supported cause | Approved treatment |
|---|---|
| Freshness, identity, movement, or other required evidence limits candidates without a resolved service change. | **Live arrival information is limited.** |
| A resolved bypass, closure, suspension, planned-pattern exclusion, or invalidating track conflict suppresses one or more arrivals. | **Service change—some arrivals hidden.** |
| The healthy live horizon contains no additional verified train. | **No additional verified trains in the live horizon.** |
| Current high-impact service-change evidence leaves material scope unresolved. | **Service change—arrival information is unavailable for this service.** Preserve official details and unrelated service. |
| An eligible separated schedule fallback controls. | **Scheduled _clock time_ · live data unavailable** with the complete owning currency treatment. |

Do not choose a generic gap message when a narrower service-change explanation controls. Do not infer no service from missing predictions, call an absent train cancelled, use Scheduled to fill a healthy live board, or display a quarantined identity.

## Station board handoff

Task 4's Nearby card remains the zero-tap initial view: every passenger-serving direction and operational axis stays visible without a switch or expansion. Task 5's direction switch belongs only to the expanded [station board and controls contract](station-board-and-controls-contract.md); it does not retroactively hide a direction on the Nearby card.

Opening a direction heading or arrival row passes:

- the same station complex and exact rider-facing direction;
- the current constituent, useful entrance, practical-walk precision, accessible-path scope, and localized disruption;
- redundant route identity and every actual destination;
- the exact upstream primary order and every separate Holding, Uncertain, Scheduled, suppression, unavailable, or limitation disposition; and
- the current route filters, evidence-state labels, and reading context.

A card-level open action uses the direction already selected in shared context. If no direction is selected, the card's visible direction choices establish it; the station board does not guess a direction or a multi-axis opposite.

Expansion may expose governed row detail and one-handed controls. It must not rerank stations or arrivals, collapse axes, re-admit a train, promote or relabel a disposition, use row count to backfill, clear a scoped disruption, hide an affected filtered route's warning, or replace the Task 4 initial all-directions contract. Returning from the station board restores the originating card, selected direction, filters, state labels, disruptions, and reading position before refresh.

This handoff remains **Draft** and **Not run — Pending** under Nearby Task 14. The authoritative decision remains **NO-GO — GATE 0 NOT PASSED**; public boards blocked. This handoff does not supply accessibility, guidance, or Task 6 approval.

## Scenario 31.1 identity walkthroughs

These walkthroughs apply the expected upstream catalog result without claiming it has been observed on a public Nearby board.

### Identity walkthrough S1 — Moving qualified train

| Walkthrough field | Expected result |
|---|---|
| Inputs | One moving coherent train; current healthy feed; exact future directional stop; agreeing direction and actual destination; current progress; no veto; every admission gate passes. |
| Card result | Exactly one chronological primary row with its route, actual destination, supported rounded countdown, and **Live**. |
| Prohibited result | Admission from route or complex proximity, opposite-direction placement, unsupported precision, duplicate row, or second card-order decision. |
| Evidence status | Not run — Pending — AT-S01 and Nearby Task 14 |

### Identity walkthrough S2 — Assigned terminal train

| Walkthrough field | Expected result |
|---|---|
| Inputs | A physical train is assigned at its origin; exact stop, identity, direction, actual destination, service, and track gates pass; the train is not materially overdue. |
| Card result | First stable update: no row. Second consecutive stable update: one primary **Expected** row using the owner-supplied Expected range. Later current movement: that same row becomes **Live** in its upstream chronological position. |
| Prohibited result | Expected after one update, exact countdown before movement, static fill, duplicate at the Expected-to-Live transition, or a new row identity. |
| Evidence status | Not run — Pending — AT-S02 and Nearby Task 14 |

### Identity walkthrough S3 — Static trip absent in healthy replacement period

| Walkthrough field | Expected result |
|---|---|
| Inputs | A healthy complete real-time replacement period contains no matching current train instance or stop call; a static scheduled trip exists. |
| Card result | No arrival row and no backfill. If the healthy-horizon absence causes the visible gap, show **No additional verified trains in the live horizon.** |
| Prohibited result | Static restoration, Scheduled inside the healthy live board, cancellation claim, or using the trip to reach three rows. |
| Evidence status | Not run — Pending — AT-S03 and Nearby Task 14 |

### Identity walkthrough S4 — Exclusive coherent identifier change

| Walkthrough field | Expected result |
|---|---|
| Inputs | One earlier identity and one immediate replacement have an exclusive one-to-one match across route, direction, service date, ordered stops, track, destination, time, and every other required continuity fact. |
| Card result | Exactly one continuous rider row in its independently supported state; no visible identifier change and no duplicate. |
| Prohibited result | Duplicate row, visible raw identifier, merge from identifier or time alone, hidden path discontinuity, or reset of the row's position. |
| Evidence status | Not run — Pending — AT-S04 and Nearby Task 14 |

### Identity walkthrough S5 — Ambiguous identities

| Walkthrough field | Expected result |
|---|---|
| Inputs | Two plausible identities have a one-to-many, many-to-one, or conflicting service-date, stop, track, direction, or destination relationship. |
| Card result | No guessed merge and no duplicate rows. Retain a stronger candidate only when it independently passes every admission gate; otherwise show neither. Use **Live arrival information is limited.** only when the whole-board cause supports it. |
| Prohibited result | Showing both as proven trains, guessing continuity, exposing identifiers or quarantine, or letting either consume a primary slot without independent qualification. |
| Evidence status | Not run — Pending — AT-S05 and Nearby Task 14 |

## Deterministic representative cards

Each fixture is an expected product review, not a rendered or observed result.

### Representative card RC-01 — Ordinary two-direction station

| Case field | Fixed expected result |
|---|---|
| Inputs | One ordinary station has two current passenger-serving directions. **Uptown & The Bronx** has three supplied primary rows; **Downtown & Brooklyn** has two. Every row supplies an actual terminal, route identity, time treatment, and evidence state. |
| Card result | One card initially shows both vertically stacked direction sections. The first has all three supplied rows; the second has exactly two plus its cause-supported honest gap treatment. |
| Prohibited result | Defaulting to one direction, requiring expansion or a switch, horizontally hiding the second direction, backfilling its third row, or omitting actual destinations. |
| Evidence status | Not run — Pending — Task 14 |

### Representative card RC-02 — Multi-axis complex

| Case field | Fixed expected result |
|---|---|
| Inputs | One verified connected complex has at least three operational axes: **Uptown & The Bronx — To Van Cortlandt Park–242 St**, **Queens-bound — To Flushing–Main St**, and **Downtown & Brooklyn — To Coney Island–Stillwell Av**. Task 3 supplies direction-specific entrances and the final complex order. |
| Card result | One complex card shows all three axes under separate headings, retains their entrance and accessibility scope, and displays each axis's independently supplied arrival state. |
| Prohibited result | Duplicate complex cards, two-bucket Uptown/Downtown collapse, hiding the third axis, reusing one entrance across unsupported axes, or allowing the fullest axis to rename the complex. |
| Evidence status | Not run — Pending — Task 14 |

### Representative card RC-03 — Exactly three ordered primary arrivals

| Case field | Fixed expected result |
|---|---|
| Inputs | One direction receives three admitted non-overlapping primary ranges: Expected **4–6 min** with center 5; Live **7 min**; Live **10 min**. All gates and destinations are supplied as passing. |
| Card result | Preserve the upstream order: Expected 4–6, Live 7, Live 10. Display exactly three rows with each actual destination and evidence state. |
| Prohibited result | Global Live-first order, moving Expected behind Live 7, averaging or changing the Expected range, or replacing Expected because three Live rows are preferred visually. |
| Evidence status | Not run — Pending — Arrival Truth AT-S50 and Nearby Task 14 |

### Representative card RC-04 — Fewer than three with Holding separate

| Case field | Fixed expected result |
|---|---|
| Inputs | One direction receives primary Live **3 min** and Expected **6–8 min**. A stop-confirmed held train has a frozen supplied Holding treatment. Evidence limitation supports the gap message. |
| Card result | Show two primary rows in supplied order, one separate frozen **Holding** warning that consumes no slot, and **Live arrival information is limited.** |
| Prohibited result | Counting Holding as row three, decrementing its time, promoting it, adding a static train, hiding the gap, or dropping a trustworthy primary row to simplify the card. |
| Evidence status | Not run — Pending — Task 14 |

## Ownership and pending evidence

| Decision | Authoritative owner | Task 4 consumption | Current disposition |
|---|---|---|---|
| Complex/entrance order and personalization reason | [Useful station and entrance ranking rules](station-ranking-and-entrance-rules.md), Task 3 | Take up to the first three without reranking. | Draft; scenario 21 Pending |
| Admission and chronological next-three | [Arrival admission and ordering contract](../arrival-truth/arrival-admission-and-ordering-contract.md) | Preserve exact primary order and dispositions. | **NO-GO — GATE 0 NOT PASSED**; public boards blocked |
| Train identity | [Time and train continuity policy](../arrival-truth/time-and-train-continuity-policy.md) | Preserve one row, absence, or stronger independently qualified candidate exactly. | **NO-GO — GATE 0 NOT PASSED**; public boards blocked |
| Schedule fallback | [Schedule fallback and currency policy](../arrival-truth/schedule-fallback-and-currency-policy.md) | Show only in the separated supplied fallback state. | **NO-GO — GATE 0 NOT PASSED**; public boards blocked |
| Station-board expansion | [Station board and controls contract](station-board-and-controls-contract.md), Task 5 | Preserve station, direction, filters, upstream order, evidence-state labels, disruptions, and every disposition on expansion and return. | Draft; Task 14 Not run — Pending |
| Accessibility | Companion artifacts planned under `docs/product/accessibility/` | Preserve exact scoped state; do not infer approval or path validity. | Approval and evidence absent |
| Scenarios 1–5 | [Arrival truth acceptance catalog](../quality/arrival-truth-acceptance-catalog.md) and `docs/product/nearby-offline/acceptance-evidence.md`, Task 14 | Apply expected visible Nearby result and prohibited checks. | Not run — Pending |
| Release 1 | `docs/product/nearby-offline/release-1-readiness.md`, Task 15 | Make no readiness or launch claim. | Pending |

## Draft review checklist

| Review question | Required Draft result | Evidence needed later |
|---|---|---|
| Are up to three complexes taken from Task 3 without a second ranking pass? | Yes. | Scenario 21 plus Task 14 card-order observation |
| Does each card retain required identity, entrance, route, accessibility, disruption, direction, and arrival content? | Yes. | Task 14 rendered-card review |
| Are all passenger-serving directions initially present? | Yes; ordinary and multi-axis fixtures prohibit hiding. | RC-01 and RC-02 observation |
| Is upstream admission and order preserved exactly? | Yes. | Scenarios 1–5, AT-S50, and RC-03 |
| Can Holding, Uncertain, Scheduled, suppression, unavailability, or quarantine fill a primary slot? | No. | Task 14 disposition review |
| Does fewer-than-three remain honest? | Yes. | RC-01 and RC-04 |
| Does station-board expansion preserve the exact card station, direction, order, filters, state labels, disruptions, and all-directions Nearby contract? | Yes. | Task 14 card-to-board and return observation |
| Are any board, accessibility, or scenario results claimed as approved? | No. The decision remains **NO-GO — GATE 0 NOT PASSED**; public boards blocked, and all cases remain Not run/Pending. | Required owner reviews and fixed-version evidence |
