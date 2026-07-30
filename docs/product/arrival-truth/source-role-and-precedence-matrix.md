# Source role and precedence matrix

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§6–8, 12, 22, 27, and 35; arrival-truth and service-changes plan Task 2 `Artifacts` and `Ordered steps` |
| Owner | Product Truth Lead |
| Required reviewers | Product, Data Quality |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | Pending — Truth Gate |

## Purpose and authority

This matrix owns source roles and conflict precedence for arrival truth and service-change reconciliation. The [core arrival contract](core-arrival-contract.md) owns arrival eligibility and the conservative guarantee. Shared terms and public wording retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md) and [approved rider language rules](../contracts/rider-language-rules.md). The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

Truth is evaluated by claim type. No source is universally correct, and evidence that is valid for planning or explanation does not automatically qualify as evidence for an exact live arrival.

## Mandatory five-level precedence

Apply these levels in order for every candidate train and exact directional stop. A lower-priority positive claim cannot repair a failure or veto found at a higher level.

| Priority | Evidence | Required decision role |
|---:|---|---|
| 1 | Validity and freshness | Reject stale, malformed, incomplete, anomalously empty, or time-regressed evidence before evaluating a train. Unknown validity or freshness cannot support an exact countdown. |
| 2 | Hard negative evidence | Apply bypass, suspension, missing live stop, planned-pattern exclusion, station closure, and invalidating track-conflict vetoes before any positive prediction. Materially unresolved bypass or reroute evidence also fails closed. |
| 3 | Fresh subway GTFS-RT | Establish current train existence, assigned status, ordered remaining stops, predicted times, movement state, and near-term stopping pattern. This is the **only positive basis for a live exact countdown**. |
| 4 | Supplemented GTFS | Establish the preferred planned-service baseline and first schedule fallback. It is published hourly and contains **most, not all**, planned changes for the next **seven calendar days**. |
| 5 | Regular static GTFS | Establish normal long-range schedules and stable route and station relationships. It is the last schedule fallback and never fills a missing stop into a live train. |

Service alerts participate principally as scoped negative evidence and explanation. Their claim limits are defined below; their presence does not bypass validity, freshness, or live-stop requirements.

## Claim authority by source

| Source or evidence class | Claims it may support | Claims it may never support |
|---|---|---|
| Validity and freshness evidence | Whether a snapshot is eligible to be evaluated; whether malformed, incomplete, suspiciously empty, stale, or time-regressed evidence must be rejected or quarantined. | It cannot create a train, stop call, stopping pattern, countdown, or proof of normal service. |
| Hard negative evidence | A scoped decision to suppress or quarantine an arrival because current evidence contradicts or materially leaves unresolved service at the exact stop. | It cannot create a positive arrival. Suppression is not by itself proof that a physical train was cancelled. |
| Fresh subway GTFS-RT | Current train existence; assigned status; coherent train identity; ordered remaining-stop sequence; destination and direction derived from that sequence; predicted times; movement state; near-term stopping pattern; a live exact countdown only after every admission condition and veto check passes. | It cannot overcome a current bypass, suspension, closure, planned-pattern exclusion, materially unresolved reroute, missing exact live stop, or invalidating track conflict. A prediction alone cannot prove service when contrary evidence applies. |
| Supplemented GTFS | Preferred planned-service baseline; planned-pattern validation; future journey planning outside the real-time horizon; first clearly labeled schedule fallback during a genuine real-time outage. | It cannot produce a live countdown, restore a missing real-time trip or stop call, override a live or negative-evidence conflict, or prove service is normal or complete. Hourly publication and “most, not all” changes for the next seven calendar days are limits, not guarantees. |
| Regular static GTFS | Normal service schedule; stable route and station relationships; long-range planning beyond the supplemented horizon; last-resort clearly labeled schedule fallback. | It cannot produce a live countdown, fill a stop missing from a live remaining-stop sequence, restore a trip absent from a healthy full real-time snapshot, override a veto, or prove current normal service. |
| Service alerts | Active period; jointly scoped route, station or segment, and direction when present; severity; disruption type; rider instructions; an explanation of a resolved or unresolved service change. | An alert cannot create movement evidence, a current train, a live stop call, or a countdown; it cannot revive a stale or suppressed train. Absence of an alert or optional metadata cannot prove normal or unaffected service. A generic “affected” marker alone cannot prove a bypass. |

## Real-time replacement-period rule

Within a route's published trip-replacement period, the real-time roster replaces static trips.

- A static scheduled trip missing from a healthy full real-time snapshot is not restored from supplemented or regular static GTFS.
- Without a reliable one-to-one match, the product does not confidently label that missing static trip **Cancelled**; it simply does not show it.
- A static trip or stop can appear only as a separate, eligible **Scheduled** fallback claim during a genuine live-feed outage. It remains subject to active service-change vetoes and uses a clock time with **Live data unavailable**, never a countdown.

## Alert scope and missing-metadata limits

- Station and direction metadata are optional. Missing station or direction metadata never proves a station, direction, or train is unaffected.
- Route, station, and direction values within one impact record are jointly scoped. A station-specific record does not mean every station on the route is affected.
- Structured scope and official human-readable text must agree before a generic **affected** marker is resolved to a specific bypass.
- If a high-impact alert cannot be mapped safely, hide only the materially unresolved route, direction, or segment, show the original service-change message, and record the ambiguity for quality review.
- Alert text can explain a service change but cannot revive stale, invalid, quarantined, or suppressed movement evidence.

## Section 8.6 conflict review

Each row begins with validity and freshness, then applies negative evidence before considering positive prediction. The rider result is preserved exactly from the approved specification.

| Condition | Negative-evidence decision before prediction | Rider result |
|---|---|---|
| Live sequence includes stop; no contradiction | Confirm that no veto or unresolved conflict applies. | **Show live arrival.** |
| Live sequence omits stop; static schedule includes it | Missing live stop vetoes the static positive schedule claim. Static data cannot revive the stop. | **Suppress.** |
| Active bypass alert conflicts with a live stop prediction | The active bypass vetoes the predicted stop. | **Suppress and explain the service change.** |
| Supplemented pattern excludes stop; live data conflicts without a resolved operational change | Planned-pattern exclusion and unresolved change evidence veto the prediction. | **Suppress until resolved.** |
| Live feed unavailable; supplemented trip exists; no active conflict | Confirm no active veto before using the first schedule fallback; do not represent the result as live. | **Show scheduled clock time.** |
| Alert is active but impact cannot be resolved safely | Materially unresolved high-impact alert scope fails closed for the affected scope. | **Hide affected arrivals and show the alert.** |

## Review rule

A reviewer must identify the claim type, exact route/station/direction/train scope, source timestamp or effective period, highest applicable precedence level, any veto, transformation into the rider state, and reason for suppression. Missing or contradictory required evidence stays **Unknown**; it is never silently converted into positive evidence.
