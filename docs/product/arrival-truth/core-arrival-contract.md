# Core arrival contract

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§3–4 and 34; arrival-truth and service-changes plan Task 1 `Artifacts` and `Ordered steps` |
| Owner | Product Truth Lead |
| Required reviewers | Product, Data Quality |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Pending |

## Purpose and authority

This contract owns the arrival-board eligibility invariant and conservative guarantee. It defines the minimum evidence required for a positive live-arrival claim at an exact station and direction. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

Shared transit terms retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md). This contract applies those meanings to arrival admission; it does not redefine them. Rider-facing wording remains governed by the [approved rider language rules](../contracts/rider-language-rules.md).

## Exact scope of an arrival claim

A station complex is the named place a rider recognizes. It is not the exact boarding location. A live-arrival claim applies to one train instance serving one exact directional stop, with its destination and rider-facing direction resolved from the train's ordered remaining-stop sequence and current service pattern. Evidence for the same station complex, an opposite direction, or another platform cannot satisfy the exact-stop requirement.

Raw north/south suffixes, numeric direction codes, directional-stop identifiers, and alert-direction values are source conventions. The transit product glossary owns their normalized internal meanings. They must be normalized into the shared direction model before comparison and before translation into rider-facing language. No raw directional code can independently establish arrival eligibility or public direction wording.

## Normative live-arrival admission checklist

A train may appear as a live arrival for a station and direction only when every condition below is satisfied:

1. The relevant real-time feed is healthy and current.
2. The train is a coherent current trip instance.
3. The exact directional stop appears in its ordered remaining-stop sequence.
4. The destination and direction agree with that sequence.
5. No active service-change evidence indicates a bypass, suspension, closure, or unresolved reroute.
6. No actual-versus-scheduled-track conflict invalidates downstream predictions.
7. The arrival time is still plausible given movement and stop progress.

The seven conditions are cumulative and independent. A reviewer permits an exact countdown only when the answer to every checklist item is **Yes**. A **No** blocks the live-arrival claim. **Unknown**, missing, stale, unresolved, or contradictory required evidence is not **Yes** and cannot receive an exact countdown.

## Conservative-error policy

The product deliberately prefers:

- A temporarily missing arrival over a confidently displayed train that bypasses the rider.
- A visible **Arrival unavailable** state over an invented estimate.
- A frozen **Holding** state over a countdown that continues while the train is stationary.
- Fewer than three trustworthy arrivals over filling the board with weak schedule guesses.

If fewer than three arrivals qualify, show fewer than three. The board may explain the gap with the specification's supported language: **Live arrival information is limited.**, **Service change—some arrivals hidden.**, or **No additional verified trains in the live horizon.**

## Defensible guarantee and veto rule

No public evidence can guarantee what a physical train will do after its latest update. Dispatchers can reroute a train between snapshots, and some alert metadata remains incomplete.

The defensible guarantee is:

> The app never shows a train when current MTA data identifies—or leaves materially unresolved—the possibility that the train will bypass that station.

Negative service-change evidence vetoes positive prediction. A fresh predicted time, assigned train, static schedule, route identity, or other positive evidence cannot override a current bypass, suspension, closure, unresolved reroute, or invalidating track conflict. A train must never appear at a bypassed stop.

## Claim and disposition vocabulary

| Concept | Normative meaning | Board consequence |
|---|---|---|
| **Positive live-arrival claim** | A claim that a coherent current train will serve the exact directional stop with a plausible live arrival time. It exists only when all seven admission conditions are satisfied. | The train may receive the exact live treatment authorized by its evidence. |
| **Negative veto** | Current evidence that contradicts or materially leaves unresolved whether the train will serve the exact stop, including a bypass, suspension, closure, unresolved reroute, or invalidating track conflict. It has precedence over positive prediction. | Do not display the train as an arrival at that stop. Show the narrowest supported service-change or **Arrival unavailable** explanation instead. |
| **Degraded status** | An honest rider-facing description that reduces precision because freshness, movement, identity, or availability evidence no longer supports the stronger claim. Degradation cannot convert stopping-pattern uncertainty into an arrival. | Use the exact supported state. A confirmed but stationary train may freeze as **Holding**. When no arrival estimate is defensible, use **Arrival unavailable**. Never continue an exact countdown through unknown required evidence. |
| **Quarantine** | Reversible isolation of a suspect or conflicting train candidate from arrival decisions while coherent evidence is re-established. Quarantine is an internal truth-control disposition, not rider-facing certainty. | The candidate does not appear as an arrival and does not count toward the next three. Any public explanation describes the supported rider consequence, not the internal quarantine label. |
| **Suppression** | Removal or withholding of a train's arrival claim for the affected exact stop because evidence fails admission or a veto applies. Suppression is a decision about the claim, not proof that the physical train was cancelled. | Hide the train row for that stop and preserve any separately supported service-change explanation. A static schedule cannot restore the suppressed live claim. |

## Stop-call and schedule boundary

A stop call is a train's current claim that it will serve a specific directional stop at a predicted time. A normal static schedule is not a live stop call. Static schedules cannot reconstruct a live train's missing future stop call, fill a missing stop into its remaining sequence, overcome a negative veto, or supply a live countdown.

When the relevant live feed is genuinely unavailable, an eligible schedule fallback is a separate **Scheduled** claim shown as a clock time with **Live data unavailable**. It remains subject to known active service-change vetoes and never masquerades as a positive live-arrival claim.

## Review decision

For each candidate train and exact directional stop, the reviewer must be able to record:

1. **Yes**, **No**, or **Unknown** for each of the seven admission conditions.
2. The current evidence and scope supporting each answer.
3. Any negative veto and the narrowest affected route, direction, station, segment, or train scope.
4. The resulting disposition: positive live-arrival claim, degraded status, quarantine, or suppression.
5. The rider-facing state or explanation, if any.

Only seven **Yes** answers and no negative veto permit an exact countdown. No unstated assumption may be used to turn missing or unresolved evidence into **Yes**.
