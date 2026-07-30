# Arrival confidence and ghost policy

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§9–10 and 31.3 scenarios 13–14; arrival-truth and service-changes plan Task 8 `Artifacts` and `Ordered steps` |
| Owner | Product Truth Lead |
| Required reviewers | Product, Data Quality, Content |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | [Pending — Truth Gate](ghost-lifecycle-boundary-cases.md) |

## Purpose and authority

This policy owns rider-visible arrival-confidence states and the lifecycle that prevents an aging arrival from looking precise, disappearing silently, or surviving under weaker stop-service evidence. It applies the exact-stop and board-area decisions in the [arrival admission and ordering contract](arrival-admission-and-ordering-contract.md), route/feed-group health in the [route-level feed health policy](feed-health-policy.md), time and identity decisions in the [time and train continuity policy](time-and-train-continuity-policy.md), and service-pattern and track vetoes in the [reroute and track-conflict playbook](reroute-and-track-conflict-playbook.md). The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

Shared concepts retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md). Rider-facing wording remains governed by the [approved rider language rules](../contracts/rider-language-rules.md).

This policy is **Draft**. Its linked cases remain **Pending — Truth Gate** and cannot be treated as current guidance until approved.

“Ghost” is an internal quality term for an arrival claim that outlives adequate evidence. It is never rider-facing copy. Riders see the supported evidence state or the narrowest supported suppression consequence.

## Two clocks, two decisions

Feed snapshot age and train movement age are separate clocks.

| Clock | Governing question | This policy's use |
|---|---|---|
| Route/feed-group snapshot age | Is the latest complete snapshot Current, Degraded, or Unavailable? | Use the health decision from the route-level feed health policy. A fresh train record cannot repair an old, invalid, anomalous, or regressed feed. |
| Train-specific movement age | How recently does the accepted train record prove movement or stop progress? | Use the confidence and precision boundaries below for that train. One old movement timestamp in a fresh feed does not create a feed-wide outage. |

All ages use authoritative source chronology and its approved small skew allowance, never the rider's phone clock. A Current feed is necessary for Live or Expected treatment, but feed freshness alone never authorizes an exact countdown or erases old train movement.

## Rider-visible confidence contract

Every candidate must first retain a coherent claim that it serves the displayed exact directional stop, with destination, direction, service-change, and track gates resolved. The table assigns confidence and presentation; it never repairs a failed admission gate.

| State | Exact default evidence | Primary next-three eligibility | Countdown precision | Required rider treatment |
|---|---|---:|---|---|
| **Live** | Healthy feed; assigned train; movement or stop progress within 90 seconds. Every exact-stop, destination/direction, service-change, track, freshness, identity, plausibility, and Due/no-progress rule also passes; a Due episode beyond 60 seconds cannot remain Live. | **Yes.** Order chronologically with other admitted Live and Expected trains. | Rounded advancing countdown only while the Live evidence remains current and plausible. | **3 min · Live** |
| **Expected** | Assigned physical train at origin; no movement yet; departure not materially overdue; stable across two updates. Every exact-stop, destination/direction, service-change, track, freshness, and identity gate also passes. | **Yes.** Order by the center of the evidence-supported range. | Range only; do not imply movement or substitute an exact live countdown. | **Expected in 6–8 min** |
| **Holding** | By default, the feed is fresh but movement or stop progress is older than 90 seconds through exactly 180 seconds. The Due rule below also establishes Holding as the strongest state permitted after more than 60 seconds without progress; movement age beyond 180 seconds still escalates a stop-confirmed train to Uncertain. | **No.** Use a separate warning or secondary held-train area; it cannot displace a moving option. | Freeze the last supported time immediately. Do not decrement it, refresh it as an exact minute, or present it as Due. | **Holding near 14 St · last moved 2 min ago** |
| **Uncertain** | No movement beyond 180 seconds, identity churn, an implausible ETA jump, or a degraded feed, while the stopping pattern remains confirmed for the displayed exact directional stop. | **No.** De-rank to the expandable secondary area. | Remove the exact minute. No countdown, range presented as precise arrival, or advancing animation remains. | **Arrival uncertain** |
| **Scheduled** | Live feed unavailable. The separately governed schedule must be eligible, and no current service-change or track veto may invalidate the claim. | **No.** Use a clearly separated fallback board; never mix Scheduled times into or use them to fill the live next-three. | Clock time only; never a countdown. | **Scheduled 10:42 · live data unavailable** |

The examples above are the approved specification's default rider treatments. Route, destination, direction, and any required localized consequence remain present under their owning contracts.

Expected is a specific origin-terminal state, not a general downgrade for a train that stops moving. A stable assigned train may remain Expected during a long valid pre-departure terminal hold while it is not materially overdue and all other evidence remains coherent. Once those facts no longer hold, reevaluate it; do not preserve Expected merely to keep a primary row.

Identity churn does not authorize an unsupported merge, duplicate, or primary row. Uncertain treatment is available only when a single rider-visible train context and its exact displayed stop service remain confirmed without contradicting the one-to-one continuity policy. Ambiguous one-to-many, many-to-one, duplicate, or otherwise incoherent candidates remain quarantined or suppressed under the time and admission contracts.

When a route/feed group is Degraded, the route-level health policy still controls preservation, frozen context, **Live data updating**, and the two-snapshot recovery rule. If an individual train is presented as Uncertain from that evidence, its exact minute is removed and it remains secondary. This policy does not relabel a Degraded feed as Current.

## Uncertain never weakens a stop or track veto

**Uncertain** means the arrival time or train continuity is uncertain while service at the displayed stop remains confirmed. It never means that the product is unsure whether the train stops there.

Suppress the entire affected train row when any of the following is missing, contradictory, or materially unresolved:

- the displayed exact directional stop in the train's coherent remaining-stop sequence;
- the stopping pattern, actual destination, or normalized rider-facing direction;
- the absence of a bypass, suspension, closure, planned-pattern exclusion, or unresolved reroute; or
- trustworthy track/path evidence, including during a non-terminal actual-versus-scheduled-track conflict.

Do not show **Arrival uncertain**, a lower-confidence countdown, a Scheduled replacement, or dependent platform guidance for a suppressed claim. Use the narrowest supported service-change or track consequence beside the suppression state. Normal terminal track variation is not a conflict by itself; the reroute and track-conflict playbook owns that distinction.

## Movement-age lifecycle

For an already-running train in a Current coherent feed, with a coherent identity and every stop-service and track gate still passing:

| Train movement or stop-progress age | State and board area | Precision |
|---|---|---|
| No more than 90 seconds, including exactly 90 seconds | Live and eligible for the primary next-three, unless the Due no-progress branch below already requires Holding. | Supported rounded countdown. |
| More than 90 seconds through exactly 180 seconds | Holding in the separate warning or secondary held-train area. | Freeze the last supported time; show location or last-moved age. |
| More than 180 seconds | Uncertain in the expandable secondary area, but only while the exact displayed stopping pattern and track remain confirmed. | Remove the exact minute and show **Arrival uncertain**. |

Exactly 180 seconds remains Holding. Any movement age strictly greater than 180 seconds enters Uncertain treatment when eligible. A stop-pattern or track uncertainty at any age suppresses the row rather than moving it to Uncertain.

Fresh movement or stop progress resets train movement age from the new authoritative evidence, but it does not automatically restore Live. Reevaluate every admission gate. Exact countdowns may return only when the governing feed-health recovery rule, if any, and every train-specific gate pass.

## Due and no-progress lifecycle

The Due timer measures uninterrupted time since the arrival first became due without observed movement or stop progress. It does not replace feed age or train movement age. The Due rule is a **degradation floor**, not an independent state selector: it prevents a train from remaining Due or Live after more than 60 seconds without progress, while older movement evidence can require a stricter state sooner or later.

First apply the exact-stop, service-change, and track/path gates. If the exact displayed stop pattern or track/path is uncertain at any point, suppress the affected row rather than showing Holding or Uncertain. For a row that remains eligible, combine the Due/no-progress floor with movement age and use the stricter supported state:

| No-progress time after Due begins | Due/no-progress floor | Combined disposition for a stop-confirmed train |
|---|---|---|
| From 0 through exactly 60 seconds | **Due** is permitted only while movement evidence remains fresh and every Live gate continues to pass. Sixty seconds is the maximum, not a target duration. | Movement age no more than 90 seconds may remain Due. Movement age more than 90 seconds through exactly 180 seconds is Holding; movement age more than 180 seconds is Uncertain with no exact minute. |
| Strictly more than 60 seconds through exactly 120 seconds | The train cannot remain Due or Live. **Holding** is the strongest permitted state, and the row leaves the primary next-three. | Movement age no more than 180 seconds is secondary Holding. Movement age more than 180 seconds escalates to secondary Uncertain with **Arrival uncertain** and no exact minute. |
| Strictly more than 120 seconds | No exact arrival event may appear in or return to the primary next-three. Retain only supported train-level context. | Movement age no more than 180 seconds is secondary Holding. Movement age more than 180 seconds is secondary Uncertain with no exact minute. Any stop-pattern or track/path uncertainty suppresses the context instead. |

At exactly 60 seconds, Due is still within the permitted maximum only if movement age remains no more than 90 seconds and every Live gate passes. The first instant strictly after 60 seconds establishes Holding as the strongest possible state, but movement age beyond 180 seconds is stricter and therefore displays Uncertain when the exact stop remains confirmed. Exactly 180 seconds may remain Holding; the first instant strictly beyond 180 seconds escalates to Uncertain.

At exactly 120 seconds, a stop-confirmed train is secondary Holding only when movement age is no more than 180 seconds; if movement age is more than 180 seconds, it is secondary Uncertain with no exact minute. The first instant strictly after 120 seconds guarantees that no exact primary event survives, while train-level context follows the stricter supported movement, stop-pattern, and track/path state. Crossing either Due boundary never silently deletes a valid train instance.

A valid new progress event ends the old Due/no-progress episode and requires full reevaluation. A new predicted time without movement or stop progress does not reset the timer.

## Unusual dwell

Station and terminal dwell expectations differ. Flag a dwell only when it exceeds the greater of:

1. two minutes plus a small operating margin; or
2. the observed high-percentile dwell for the station, route, direction, and operating period.

This policy deliberately assigns neither a numeric operating margin nor a percentile. Both require observed evidence and Product and Data Quality approval before calibration. Reviewers must not substitute a guessed number.

Unusual dwell is diagnostic evidence, not a deletion rule. It may trigger scrutiny or the applicable Holding, Uncertain, service-change, identity, or suppression decision, but unusual dwell alone never deletes a valid train, removes its confirmed stop, or proves cancellation. A long terminal dwell is compared with terminal evidence and the applicable station, route, direction, and operating-period history rather than an ordinary intermediate-station assumption.

## Review record

For every confidence or ghost-lifecycle decision, preserve:

1. the route/feed-group health, authoritative snapshot time, and feed age;
2. the train-specific movement or stop-progress time and age;
3. the exact directional stop, remaining-stop sequence, destination, direction, and track/path result;
4. train identity and any continuity, churn, duplicate, or quarantine decision;
5. the Due start, last progress, 60-second and 120-second boundary decisions, if applicable;
6. the unusual-dwell comparison inputs without inventing an operating margin or percentile;
7. the assigned state, board area, primary eligibility, precision, and exact rider copy;
8. any suppression veto, secondary held-train context, and evidence later used for recovery.

Unknown, stale, contradictory, or materially unresolved evidence cannot be converted into a primary row, an exact countdown, a weaker stop-service claim, or silent deletion.
