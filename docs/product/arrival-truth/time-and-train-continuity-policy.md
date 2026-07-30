# Time and train continuity policy

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§5, 9–10, 31.1, 31.7, and 34; arrival-truth and service-changes plan Task 3 `Artifacts` and `Ordered steps` |
| Owner | Product Truth Lead |
| Required reviewers | Product, Data Quality |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | [Pending — Truth Gate](time-and-identity-acceptance-cases.md) |

## Purpose and authority

This policy owns service-day, authoritative-time, daylight-saving, and train-continuity decisions for arrival truth. It applies the arrival eligibility invariant in the [core arrival contract](core-arrival-contract.md), the shared meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md), and the public-language limits in the [approved rider language rules](../contracts/rider-language-rules.md). The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

This policy is **Draft** and cannot be treated as current guidance until the Truth Gate approves it and its linked scenarios.

## Service date is not calendar date

The **service date** is the operating date to which a trip belongs. The **calendar date** is the New York civil date displayed by the clock at an event. Crossing midnight can change the calendar date without changing the trip's service date.

- Retain the source-supported operating service date for the entire coherent train instance.
- A service-day time beyond `24:00` denotes elapsed time on that same operating service date. For example, `25:10` belongs to the stated service date while its rider-facing clock time is `1:10 AM` on the following calendar date.
- A trip that begins before the nominal service date retains its source-supported service date. Do not reassign it to the preceding calendar date merely because its first event or first observation occurs before midnight.
- Do not derive service date from the rider's phone date, the current New York calendar date alone, or a displayed clock time alone.
- Midnight does not create a new train instance, restore a past stop call, duplicate a trip, or reorder its remaining stops.
- Rider-facing times use New York local time. Service-day notation stays internal unless an edge case requires explanation.

When the service date is missing, contradictory, or cannot be reconciled with the ordered trip evidence, the train instance is not coherent. It cannot receive an exact countdown and remains outside the primary board until the conflict resolves.

## Authoritative time and freshness

Rider-facing times use New York local time. Freshness and chronology decisions use authoritative source timestamps, not the rider's phone clock, display clock, time-zone setting, or manual clock adjustment.

The approved freshness state for the relevant source controls arrival eligibility. A phone-clock disagreement cannot make stale evidence current, make current evidence stale, reverse event order, or change a service date. The product evaluates the source timestamp and the authoritative comparison time with only a **small skew allowance**.

**Small skew allowance** is an explicit policy value that requires observed evidence and Product and Data Quality approval before calibration. This policy assigns no numeric value. Until evidence supports calibration, reviewers must preserve the phrase and must not substitute a guessed threshold.

If an authoritative timestamp is missing, time-regressed, contradictory, or outside its approved freshness state after the small skew allowance, it is not current evidence. It cannot authorize an exact countdown. A fresh feed containing an older train-specific movement time remains subject to the approved **Holding** or **Arrival uncertain** rules; feed freshness does not erase movement age.

## Daylight-saving transitions

Elapsed time and event order follow authoritative chronology. New York local clock labels are a presentation of that chronology and do not independently identify or order train instances.

### Repeated local time

When clocks move backward, the repeated local interval represents two distinct chronological intervals. Two events with the same displayed New York clock time are not duplicates merely because their local labels match. Preserve authoritative order, service date, and train identity evidence. Waits remain non-negative, and one coherent train appears once.

If the available evidence cannot distinguish the two occurrences of a repeated local time, the chronology or identity is ambiguous. Do not guess an order or merge candidates; quarantine the weaker candidate from the primary board until continuity becomes clear.

### Missing local time

When clocks move forward, the skipped New York local interval contains no real local-clock events. A trip can progress across that gap without an invented stop call or an extra hour of waiting. Preserve authoritative order and elapsed time; do not create a train in the missing interval, reverse trains, or calculate a negative wait.

If a displayed local time would imply chronology that conflicts with authoritative timestamps, authoritative chronology controls and the stronger rider claim is withheld until the evidence is coherent.

## One-to-one train continuity

A published trip identifier is not a train instance. A changed identifier alone proves nothing: it neither creates a second train nor justifies merging two candidates.

Join an earlier identity to a replacement only when the match is one-to-one and **all** of the following evidence is coherent:

1. The same internal train marker, when one is available.
2. The same route.
3. The same normalized direction.
4. The same service date.
5. The same ordered next-stop sequence.
6. Compatible actual or expected track evidence.
7. Compatible destination.
8. Similar predicted time.
9. The replacement appears immediately after the earlier identity disappears.

“When available” applies only to the internal train marker; it does not waive any other required condition. Similar predicted time and immediate replacement timing are supporting evidence, not substitutes for route, direction, service date, stopping pattern, track, or destination coherence.

The join must be exclusive in both directions: one earlier candidate matches one replacement, and that replacement matches no other plausible earlier candidate. A one-to-many, many-to-one, or otherwise ambiguous relationship is not a continuity join.

## Ambiguity and board disposition

When identity evidence is ambiguous:

- Do not merge the candidates.
- Do not show both as if they were proven separate trains.
- Retain the stronger coherent candidate only if it independently satisfies every arrival-admission condition.
- Quarantine the weaker candidate from the primary board and from the next-three count until one-to-one continuity or a genuinely separate train instance becomes clear.
- If neither candidate is stronger or independently coherent, quarantine both.

Quarantine is an internal truth-control disposition, not rider-facing language. Use only the narrowest supported public consequence, such as fewer verified arrivals or **Live arrival information is limited.** Never expose raw identifiers to explain the uncertainty.

## Review record

For every service-day, clock, or identity decision, a reviewer must be able to record:

1. The operating service date and relevant New York calendar date.
2. The authoritative source timestamps and freshness state.
3. Any daylight-saving repeated or missing local-time context.
4. Every applicable one-to-one identity condition and its evidence.
5. The resulting continuity, quarantine, degraded, or suppression disposition.
6. The rider-facing state, if any.

Unknown, missing, stale, or contradictory required evidence cannot be converted into a positive continuity or exact-arrival claim.
