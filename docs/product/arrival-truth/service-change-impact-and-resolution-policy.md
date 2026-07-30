# Service-change impact and resolution policy

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§8, 22, 27, and 31.2 scenarios 9–12; arrival-truth and service-changes plan Task 6 `Artifacts` and `Ordered steps` |
| Owner | Product Truth Lead |
| Required reviewers | Product, Data Quality, Content |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | [Pending — Truth Gate](service-change-scope-cases.md) |

## Purpose and authority

This policy owns service-change impact classification and the narrowest evidence-supported consequence on an arrival board. It applies the arrival eligibility invariant in the [core arrival contract](core-arrival-contract.md), the alert limits and negative-evidence order in the [source role and precedence matrix](source-role-and-precedence-matrix.md), the [evidence veto catalog](evidence-veto-catalog.md), and exact-stop admission in the [arrival admission and ordering contract](arrival-admission-and-ordering-contract.md). The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

Shared terms retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md). Rider-facing wording remains governed by the [approved rider language rules](../contracts/rider-language-rules.md).

This policy is **Draft**. It and its linked cases remain **Pending** and cannot be treated as current guidance until the Truth Gate approves them.

## Three distinct arrival-board outcomes

Resolve each impact against one train instance and one exact directional stop before assigning an outcome. Do not apply a line-wide consequence merely because an alert names a route.

| Outcome | Evidence decision | Arrival-board treatment |
|---|---|---|
| **Train remains visible** | The coherent train still passes exact-stop admission. The impact changes timing, explanation, destination, route path, equipment context, or platform guidance without contradicting service at that exact stop. | Keep the evidence-supported Live or Expected arrival treatment, or the separately governed Holding treatment. Add only the localized explanation or confidence change supported by evidence. |
| **Train is suppressed** | Current resolved evidence establishes that the train will not serve the exact stop, or that boarding or alighting there is unavailable, through a bypass, express skip, short turn, suspension, closure, planned-pattern exclusion, or invalidating track conflict. | Remove that train's arrival claim for the affected exact stop. Preserve the narrowest supported service-change explanation. Suppression does not by itself claim that the physical train was cancelled. |
| **Arrival claim is unavailable** | A high-impact change may materially alter service at the exact stop, but the active route, direction, station, segment, or operational path cannot be mapped safely enough to decide whether the train will serve it. | Withhold the positive arrival claim only within the materially unresolved scope and show the original official service-change message. Do not guess a stop pattern, bypass, platform, train, or cancellation. |

“Arrival claim is unavailable” is a fail-closed claim state, not a weaker arrival row and not proof of a resolved bypass. It must not consume a next-three slot. A resolved hard veto uses suppression; an unsafe high-impact mapping uses unavailable.

## Impact taxonomy and board behavior

An alert category is a descriptive input. It does not determine behavior by itself. The actual rider consequence must be established from current scope, official text, live stopping evidence, and any applicable planned pattern.

| Impact | Train remains visible | Train is suppressed | Arrival claim is unavailable |
|---|---|---|---|
| Delay or slow speeds | Keep every coherent train whose exact stop remains confirmed. Add a localized delay explanation and reduce confidence only as supported. | A delay-only alert never supplies suppression evidence. A separate hard veto may suppress under its own evidence. | Delay alone never makes the stopping claim unavailable. Use unavailable only if separate high-impact evidence leaves stop service materially unresolved. |
| Train holding | Keep the train as a separate **Holding** warning with its countdown frozen under the continuity rules; other coherent trains remain eligible. | Suppress only if separate evidence later shows the stop will not be served or another admission gate fails. Holding alone is not a stop veto. | Withhold the claim only when separate evidence makes the stopping pattern, direction, destination, or path materially unresolved. |
| Express running local | Keep the train only at additional stops that appear in its coherent live remaining-stop sequence and are not contradicted by change evidence. Explain the changed pattern locally. | Suppress at any stop absent from that current sequence; neither route identity nor a normal schedule can create a stop. | If the changed local pattern cannot be mapped safely for a materially affected scope, withhold only those claims until resolved. |
| Local running express | Keep the train at exact stops that remain in its coherent live sequence and outside any supported skipped scope. | Suppress it at each resolved skipped local stop and direction. | If skipped-stop scope is materially unresolved, withhold claims only for the affected route-direction or segment rather than guessing which local stops are served. |
| Reroute via another line | Keep route identity and show the actual coherent stop pattern with a supported **Via…** label. Admit a novel stop only when its exact station-direction is in the live sequence and supporting change evidence resolves the operational path. | Suppress original-route stops absent from the current sequence or excluded by a resolved reroute. | When a high-impact reroute lacks enough detail to construct a reliable path, withhold only the materially unresolved route-direction or segment and show the official alert. |
| Short turn or terminal change | Keep the train before the resolved terminal and show its actual destination. | Suppress all downstream stops beyond the resolved terminal. | If the new terminal or downstream affected scope cannot be mapped safely, withhold only the materially unresolved downstream claims. |
| Partial suspension | Keep trains and stops outside the active suspended segment when their own evidence remains coherent. | Remove affected arrivals within the resolved suspended segment. | If the segment boundary or direction is unsafe to map, withhold only the materially unresolved route-direction or segment. |
| Full suspension | Keep unrelated routes, including routes sharing a station complex, visible when their own evidence remains coherent. | Remove the suspended route as an arrival option for the resolved active scope. | If a purported full suspension has contradictory route or time scope, withhold only the material unresolved scope while the record is reviewed; do not widen it to the network or complex. |
| Station or constituent-station closure | Keep service at other constituent stations, routes, directions, or usable portions of the complex when their own evidence remains valid. | Remove boarding, alighting, and affected arrivals only at the exact resolved closed station or constituent station. | If closure scope cannot be resolved between a constituent station and the wider complex, withhold only the claims that may materially depend on the closed scope; do not suppress unrelated transfer services. |
| Entrance closure | Keep train service visible when boarding and alighting remain usable through other supported access. Change only the relevant entrance guidance. | An entrance closure alone does not suppress a train. A separately supported station closure or arrival veto must supply that decision. | If access usability is unresolved, make only the entrance or affected access-path claim unavailable under its governing policy; do not generalize it into train suppression. |
| Elevator outage | Keep train arrivals visible. Invalidate only verified accessible paths that require the affected equipment. | An elevator outage alone does not suppress a train. A separately supported station closure or arrival veto must supply that decision. | If route-critical equipment state is unknown, make only the accessible-path claim unavailable under its governing policy, not the train arrival. |
| Escalator outage | Keep train arrivals visible. Recalculate only routing that requires the governed **Avoid Stairs** preference. | An escalator outage alone does not suppress a train. A separately supported station closure or arrival veto must supply that decision. | If escalator status is unresolved, make only the preference-dependent path claim unavailable when its governing policy requires it; do not generalize it into train suppression. |
| Platform or track change | Keep the arrival only when the train still passes admission. Show **Platform confirmed**, **Expected platform**, or **Check station signs** only when the applicable evidence rule supports it; omit positioning when orientation is uncertain. | An explicit non-terminal actual-versus-scheduled-track conflict suppresses the affected downstream arrival and dependent platform guidance. A first later fresh coherent update that reestablishes a trustworthy path begins recovery only and restores no arrival, guidance, precision, or primary eligibility. Require a second consecutive fresh coherent accepted update that preserves the path and, across the pair, proves all five conditions in the [suppression, grace, and recovery policy](suppression-grace-and-recovery-policy.md); reevaluate every Live admission gate before readmission or an exact countdown. | When platform guidance is unresolved but arrival service remains confirmed, make only the platform claim unavailable. When a track conflict materially leaves downstream stop service unresolved, withhold only those affected arrival claims. |

## Scope-resolution rule

Treat an impact as one jointly constrained evidence record. Resolve it in this order:

1. **Time.** Confirm the alert is inside its active period. For planned work, apply the source's early-display guidance to decide when the change becomes relevant; early visibility does not make the operational restriction active before its supported window.
2. **Route.** Identify only the named route or routes. Route identity alone does not widen a station- or segment-specific record to the full line.
3. **Station or segment.** Use supported constituent-station, exact-stop, station, or segment boundaries. A station-specific record does not make every station on the route affected.
4. **Direction.** Apply normalized direction only where it is present and consistent with the route, station or segment, official text, and current service pattern. Opposite-direction service remains independently eligible.
5. **Train or claim.** Transform the resolved impact into a decision for each candidate train and exact directional stop. Keep unrelated trains, routes, directions, stops, segments, and constituent stations available when their own evidence passes admission.

All five dimensions constrain one another. No field is permission to discard the others. Missing station or direction metadata never proves that all stations or the opposite direction are unaffected. It also does not, by itself, prove a specific bypass. If missing or contradictory scope is material to a high-impact decision, enter the exception state below for the narrowest scope that current evidence actually leaves unresolved.

## Generic category and official-text boundary

- Free-text labels and generic categories such as **Affected** are changeable descriptions, not permanent machine semantics.
- No current or future label may be hard-coded to mean bypass, suspension, closure, delay, or another disposition without corroborating structured scope and official human-readable text.
- Structured values and the official message must agree before a generic category is translated into a specific veto.
- The product may show a shorter plain-language summary, but details must preserve the original official alert text without rewriting it as a stronger or more specific claim.
- A summary may localize the resolved route, station or segment, direction, and rider consequence. It may not invent a train, stop, platform, closure, bypass, or impact absent from the evidence.
- Alert text explains operational context. It cannot establish movement, create a stop call, revive stale evidence, or restore a suppressed train.

## High-impact exception and authorized correction

A bypass, express skip, reroute, short turn, suspension, closure, or invalidating track change is high impact when unsafe mapping could falsely tell a rider that a train will serve the exact stop. If its active impact cannot be mapped safely:

1. Set the affected arrival claim to unavailable; do not guess.
2. Hide only the materially unresolved route, direction, segment, constituent station, exact stop, or train claim.
3. Keep unrelated services at a shared station complex visible.
4. Show the original official service-change message in details and any supported shorter summary.
5. Record the ambiguity, provenance, transformation, and reason for withholding for quality review.

An authorized operational correction may suppress a known bad arrival, clarify the affected segment, annotate supported service, or mark platform guidance unavailable. It may never fabricate movement, add an unsupported arrival, invent a train or stop call, assign an unsupported platform, or clear a hard veto without authoritative evidence.

## Review record

For every service-change decision, preserve:

1. Source type, source timestamp, active period, and applicable early-display guidance.
2. Original official alert text and any shorter rider summary.
3. Structured route, constituent station or segment, normalized direction, train, equipment, platform, or track scope.
4. Any missing, contradictory, generic, or unresolved fields and why they do or do not matter to the exact claim.
5. The exact train and directional-stop admission decision.
6. The selected outcome: remains visible, suppressed, or arrival claim unavailable.
7. The narrowest rider-facing explanation and every unaffected service explicitly preserved.
8. Any authorized correction, its evidence, actor, time, and prohibition against creating a positive arrival.
9. The coherent evidence required to release suppression or unavailability.

Absence of optional metadata or an alert is never proof of normal service. Every decision remains bounded by the evidence-supported claim.
