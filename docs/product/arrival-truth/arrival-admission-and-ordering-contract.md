# Arrival admission and ordering contract

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§3, 7, 10–11, 31.1 scenarios 1–3, and 31.8 scenario 50; arrival-truth and service-changes plan Task 5 `Artifacts` and `Ordered steps` |
| Owner | Product Truth Lead |
| Required reviewers | Product, Data Quality |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | [Pending — Truth Gate](arrival-board-decision-table.md) |

## Purpose and authority

This contract owns exact-stop admission and chronological next-three ordering for an arrival board. It applies the cumulative eligibility invariant in the [core arrival contract](core-arrival-contract.md), the source and veto rules in the [source role and precedence matrix](source-role-and-precedence-matrix.md) and [evidence veto catalog](evidence-veto-catalog.md), the continuity rules in the [time and train continuity policy](time-and-train-continuity-policy.md), and the health boundaries in the [route-level feed health policy](feed-health-policy.md). The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

Shared concepts retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md). Rider-facing wording remains governed by the [approved rider language rules](../contracts/rider-language-rules.md).

This contract is **Draft**. Its linked decision evidence remains **Pending — Truth Gate** and cannot be treated as current guidance until approved.

## Board question

One board answers one exact question: which current train instances provide the earliest trustworthy boardable arrivals at this exact directional stop, under this rider-facing direction and destination context?

A station-complex match, route identity, static stop entry, opposite-direction call, scheduled platform, or nearby platform cannot satisfy that question. Every candidate is evaluated against the exact directional stop requested by the board.

## Ordered admission decision

Admission must finish before ranking. Complete the following decision in order for each train:

1. **Generate the candidate set.** Consider current relevant real-time train instances for the routes that can serve the requested station and direction. Do not generate live candidates from regular or supplemented static schedules.
2. **Require the exact remaining stop.** Confirm that the exact directional stop appears as a future call in the train's ordered remaining-stop sequence. A past call, station-complex match, opposite direction, normal route pattern, or reconstructed static call fails this requirement. Record whether current evidence resolves the stop as ineligible or merely fails to confirm it; the distinction controls disposition after admission fails.
3. **Resolve destination and direction.** Derive the actual destination and normalized rider-facing direction from the ordered remaining pattern. Both must agree with that pattern and with the board. Raw compass suffixes, numeric direction codes, route color, and scheduled destination are insufficient. Record resolved ineligibility separately from missing, ambiguous, or contradictory evidence.
4. **Apply the service-change gate.** Reject a resolved bypass, suspension, closure, planned-pattern exclusion, or other current evidence that resolves the target service as ineligible. Independently reject a candidate when current high-impact evidence materially leaves route, direction, station, segment, exact-stop, train, or path scope unresolved, without relabeling that candidate rejection as a resolved veto. Other unconfirmed service-change evidence also fails admission under its governing quarantine or limitation rule. Negative evidence vetoes a positive prediction.
5. **Apply the track gate.** Reject a non-terminal actual-versus-scheduled-track conflict that current evidence resolves as invalidating the target or downstream prediction. A materially unresolved path supported by independent current high-impact evidence, and other track evidence that merely fails confirmation, also fail admission but retain their distinct post-gate dispositions. Normal terminal behavior does not fail this gate by itself.
6. **Apply the freshness gate.** Require current, coherent evidence from the relevant route or feed group. Degraded, unavailable, anomalous, regressed, malformed, or otherwise quarantined evidence cannot authorize a primary arrival.
7. **Apply the identity gate.** Require one coherent current train instance. An ambiguous, duplicate, one-to-many, many-to-one, or otherwise unresolved identity cannot consume a next-three slot.
8. **Apply the movement and time gate.** Require a plausible arrival given current movement and stop progress. Recent movement or stop progress can support **Live**. A physical train assigned at its origin, not materially overdue, and stable across two updates can support **Expected** before movement begins. Old or contradictory movement evidence cannot keep an exact advancing countdown.
9. **Assign the disposition.** Only after all preceding evidence is evaluated, classify every failed gate and assign the strongest supported state, internal treatment, and rider-visible board area under the disposition table below.

A failed exact-stop, direction, destination, service-change, or track gate rejects the candidate from arrival and confidence admission; that candidate rejection does not by itself determine the public or internal disposition. Classify it as follows:

1. Current evidence that resolves exact-stop, direction, destination, service, or track/path ineligibility produces scoped suppression and only the narrowest supported resolved rider consequence.
2. Independent current high-impact evidence plus materially unresolved route, direction, station, segment, exact-stop, train, or path scope produces Task 6 **arrival claim unavailable** with the governed explanation, original official details, narrowest affected scope, and unrelated service preserved.
3. Other missing, ambiguous, or contradictory evidence without that independent current high-impact basis fails admission and follows its governing quarantine or limitation treatment. It proves neither resolved suppression nor Task 6 unavailability.

A freshness, identity, or movement failure follows only its separately governed evidence disposition; it never becomes a weaker invented arrival. Holding and Uncertain remain possible only when their own evidence requirements and every exact-stop and track/path confirmation gate pass.

## Disposition before ordering

| Evidence disposition | Board area | Counts toward the next three? | Required treatment |
|---|---|---:|---|
| **Live** | Primary | Yes | Use the approved rounded live countdown only while all Live evidence remains current and plausible. |
| **Expected** | Primary | Yes | Show the approved Expected range. A qualifying assigned terminal train may enter here before movement and is reevaluated as Live only after current movement or stop progress supports that state. |
| **Holding** | Separate warning row | No | Freeze the time and state the location or last movement evidence. Do not silently delete the train and do not let it displace a moving option. |
| Confirmed-pattern **Uncertain** | Expandable secondary area | No | Show **Arrival uncertain** without an exact minute only when the evidence still confirms service at the exact directional stop. |
| Quarantined or limited | No arrival row; only a governing board-level limitation when supported | No | Fail admission and follow the owning quarantine or limitation treatment. Do not invent a resolved veto, Task 6 unavailability, or rider certainty from missing, ambiguous, or contradictory evidence alone. |
| Resolved suppression | No arrival row | No | Suppress only the scope that current evidence resolves as ineligible. Show only the narrowest supported resolved service-change or track consequence. |
| **Arrival claim unavailable** | Governed unavailable explanation beside only the affected scope | No | Show **Service change—arrival information is unavailable for this service.**, preserve the original official message in details, keep the scope narrow, and preserve unrelated service. Do not label the outcome resolved suppression. |
| **Scheduled** | Clearly separated fallback state | No | Use only when the relevant real-time feed is genuinely unavailable and the schedule is eligible. Show a clock time and **Live data unavailable**; never mix it into or use it to fill the live next-three list. |

Holding and Uncertain treatments do not weaken the exact-stop rule and never survive failed stop/path confirmation. Resolved current ineligibility suppresses; independent current high-impact evidence with materially unresolved scope produces **arrival claim unavailable** with its governed treatment; and other failed confirmation follows the governing quarantine or limitation path without inventing either outcome.

## Chronological next-three ordering

After admission is complete:

1. Form the primary set from admitted **Live** and **Expected** trains only.
2. Give each primary train its best current arrival estimate and its evidence-supported arrival range. For an Expected range, the ordering estimate is the center of that range.
3. Sort the primary set chronologically by that best current estimate.
4. If two evidence-supported arrival ranges overlap and one train is Live, place the Live train first within that overlap.
5. Take the first three trains from the resulting chronological order.

The overlap preference is narrow. Live does not receive a global confidence boost and does not automatically outrank an earlier Expected train. When the ranges do not overlap, the earlier best current estimate remains first; an earlier Expected train can therefore precede one or more later Live trains.

Admission, state labels, and time answer different questions. Admission determines whether a train may participate. The evidence state determines its rider treatment. Time determines the order among admitted primary trains, except for the Live preference inside an actual range overlap.

## Honest boards with fewer than three

Show only the admitted primary trains. Never restore a missing static trip, rebuild a future stop call from a normal pattern, promote a Holding or Uncertain train, or relax a gate to fill the board.

Use the most specific supported explanation:

| Cause of the gap | Exact message |
|---|---|
| Live evidence is limited because freshness, identity, movement, or other required evidence excludes possible candidates without resolving a service change or supplying independent current high-impact evidence for Task 6 unavailability. | **Live arrival information is limited.** |
| A current resolved bypass, closure, suspension, planned-pattern exclusion, invalidating track conflict, or other resolved service veto suppresses one or more affected arrivals. | **Service change—some arrivals hidden.** |
| Independent current high-impact service-change evidence leaves material scope unresolved and makes only the affected arrival claim unavailable. | **Service change—arrival information is unavailable for this service.** Preserve the original official message in details and unrelated service outside the scope. |
| The healthy live horizon contains no additional verified train after all candidates are evaluated, and no exclusion above better explains the gap. | **No additional verified trains in the live horizon.** |

Use the disposition-specific explanation for each affected scope. A resolved service-change exclusion is more specific than a general evidence limitation, while materially unresolved current high-impact scope retains the governed unavailable explanation rather than resolved-suppression copy. A message explains an honest gap; it does not authorize a replacement row.

## Review record

For every board decision, preserve:

1. The exact station, normalized direction, and directional-stop identity.
2. Each current relevant real-time train instance considered.
3. The ordered remaining-stop evidence and actual destination and direction.
4. The result of the service-change, track, freshness, identity, and movement gates.
5. The assigned disposition and board area.
6. For every primary train, the evidence-supported range, best current estimate, overlap decision, and final chronological position.
7. The displayed next-three rows, any separate Holding warning, Uncertain secondary row, scoped unavailable explanation, and any fewer-than-three explanation.
8. Every suppressed, unavailable, quarantined, limited, or static record that was prohibited from backfilling the board, with candidate rejection and public/internal disposition recorded separately.

Unknown, stale, contradictory, scheduled-only, or materially unresolved evidence cannot be converted into admission, a stronger state, or a next-three slot.
