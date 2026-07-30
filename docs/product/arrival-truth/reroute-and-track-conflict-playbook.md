# Reroute and track-conflict playbook

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§8, 22, 27, and 31.2 scenarios 6–8; arrival-truth and service-changes plan Task 7 `Artifacts` and `Ordered steps` |
| Owner | Product Truth Lead |
| Required reviewers | Product, Data Quality, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | [Pending — Truth Gate](reroute-short-turn-and-bypass-cases.md) |

## Purpose and authority

This playbook owns planned-change, unplanned-change, reroute, bypass, short-turn, suspension, closure, and non-terminal track-conflict decisions for an arrival board. It applies the [core arrival contract](core-arrival-contract.md), [source role and precedence matrix](source-role-and-precedence-matrix.md), [evidence veto catalog](evidence-veto-catalog.md), [arrival admission and ordering contract](arrival-admission-and-ordering-contract.md), and [service-change impact and resolution policy](service-change-impact-and-resolution-policy.md). The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

Shared terms retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md). Rider-facing wording remains governed by the [approved rider language rules](../contracts/rider-language-rules.md).

This playbook is **Draft**. It and its linked cases remain **Pending** and cannot be treated as current guidance until the Truth Gate approves them.

## Controlling identity and veto rules

A route and its service pattern are separate claims. A rerouted train retains its rider-recognizable route identity while its ordered stops, destination, direction, and supported **Via…** treatment describe the current service pattern. A route letter, normal route pattern, station-complex match, or static schedule cannot create a stop call.

For every candidate, decide service at one exact directional stop. Negative evidence is applied before positive prediction:

- the exact directional stop must appear in the coherent live remaining-stop sequence;
- destination and normalized rider-facing direction must agree with that sequence;
- no active bypass, suspension, closure, planned-pattern exclusion, unresolved reroute, or invalidating track conflict may apply; and
- a live prediction cannot override resolved or materially unresolved negative evidence.

If these requirements fail, remove the affected arrival claim. Do not merely reduce confidence, expose internal quarantine language, or restore the row from a static schedule.

## Planned-change reconciliation

Apply the following sequence in order for every planned change and every candidate exact directional stop:

1. **Establish the effective supplemented pattern.** Use the applicable current supplemented GTFS edition and effective period to identify the planned stopping baseline. Do not treat the regular static pattern as the effective pattern when the supplement changes it.
2. **Resolve active alert scope.** Confirm that the operational window is active, then jointly resolve route, station or segment, normalized direction, and supported rider consequence from structured scope and official text. Early display before the operational window is informational and does not alter arrival admission.
3. **Compare the live remaining stops.** Compare the coherent current train's ordered remaining-stop sequence, actual destination, and direction with the effective supplemented pattern and resolved change scope. Do not insert omitted stops from either static source.
4. **Suppress excluded targets.** Suppress an exact target excluded by the effective planned pattern, omitted from the live sequence, or covered by a resolved bypass, suspension, or closure. Put the narrowest supported rider explanation beside that board's suppression state.
5. **Admit a novel rerouted stop only with both proofs.** The exact station-direction must appear in a coherent live sequence, and supporting uncontradicted change evidence must resolve the operational path that makes the novel stop credible. Either proof without the other fails admission.

If supplemented and live patterns conflict without supporting evidence that resolves the operational change, preserve the planned-pattern veto and suppress the affected claim until a later reconciliation succeeds.

## Unplanned-change reconciliation

Apply the following sequence in order for an unplanned disruption:

1. **Validate the current live evidence.** A fresh coherent live remaining-stop sequence is the primary positive evidence for the train's near-term stopping pattern. It does not by itself defeat a veto.
2. **Resolve current negative evidence.** Apply an explicit skipped-stop, suspension, station-closure, or reroute impact at its supported route, station or segment, direction, train, and active-time scope.
3. **Fail closed on contradiction.** A resolved negative impact vetoes a live stop prediction. Suppress the affected arrival and show the supported explanation beside the affected board state.
4. **Fail closed on unresolved high-impact scope.** When an active bypass or reroute may alter service but cannot be mapped safely, make only the materially unresolved route-direction, segment, exact-stop, or train claim unavailable. Show the official change message and do not guess a stopping pattern.
5. **Reconcile a novel rerouted stop.** Admit it only when the exact station-direction is in a coherent live sequence and supporting change evidence resolves the operational path without contradiction.

A delay-only alert is not a stop veto. Keep an otherwise-admitted train visible and localize only the supported delay explanation or confidence treatment.

## F via E line walkthrough

This walkthrough applies the same evidence order to the approved F-via-E example without inventing a train, station, stop, platform, track assignment, or time.

1. Keep the route identity **F** throughout the decision. The changed service pattern does not turn the train into an E.
2. Resolve the current reroute evidence and compare the F train's coherent live remaining-stop sequence with the effective pattern.
3. At an original F exact directional stop absent from the live sequence, suppress the arrival. Place **This F train is running via the E line and is not stopping here.** beside the affected suppression state.
4. At an exact E-line station-direction present in the coherent live sequence, admit the F only when supporting change evidence resolves the path and no bypass, suspension, closure, planned-pattern, or track contradiction applies.
5. On an admitted rerouted row, retain the **F** route identity and place **Via E line** beside the actual destination.
6. If the exact E station-direction is absent, the route direction is wrong, the live sequence is incoherent, or current evidence contradicts the stop, suppress the F there. A predicted time cannot restore it.

| Board claim | Required decision | Rider treatment beside the affected state |
|---|---|---|
| Original F stop omitted by the rerouted live pattern | Suppress the F at that exact directional stop. | **This F train is running via the E line and is not stopping here.** |
| Exact E station-direction present with coherent live sequence and supporting uncontradicted reroute evidence | If every other admission gate passes, keep route **F** and admit the current stop call. | **Via E line** beside the actual destination on the F arrival row. |
| Proposed E stop missing exact-direction or supporting path evidence, or contradicted by a current veto | Suppress; do not downgrade to a weaker arrival. | **Service change—this arrival is not verified for this stop.** |

## Service-pattern outcome matrix

Every explanation belongs beside the affected arrival row, board suppression, or unavailable state. A generic alert page alone is not the rider result.

| Operational pattern | Evidence decision | Arrival-board outcome | Rider explanation beside the outcome |
|---|---|---|---|
| Express running local | Admit an additional stop only when its exact station-direction appears in the coherent live sequence and no change evidence contradicts it. | Keep the train at verified added stops; suppress it anywhere absent from the current sequence. | On an admitted changed-pattern row: **Running local.** On a withheld unverified claim: **Service change—this arrival is not verified for this stop.** |
| Local running express | Treat every omitted local exact stop as a missing-live-stop or resolved bypass veto. | Suppress the train at every omitted local stop; keep independently admitted stops still in the current sequence. | **This train is running express and is not stopping here.** |
| Short turn or terminal change | Resolve the actual destination and terminal from the coherent current pattern and supporting change evidence. | Keep eligible pre-terminal arrivals with the actual destination; suppress every downstream claim beyond the actual terminal. | On a visible row: **Service ends at the destination shown.** Downstream: **This train ends before this stop.** |
| Partial suspension | Resolve the active suspended segment and direction. | Suppress arrivals inside the suspended segment; keep independently eligible service outside it. | **No service on this part of the line.** |
| Full suspension | Resolve the active route and time scope. | Remove that route as an arrival option inside the resolved scope; preserve unrelated routes and services. | **Service is suspended on this line.** |
| Station or constituent-station closure | Resolve the exact boarding and alighting scope without widening a constituent station to the full complex. | Suppress affected arrivals and boarding or alighting at the closed scope; preserve unrelated service at the same complex. | **This station is closed.** |
| High-impact scope unresolved | Confirm that current evidence materially leaves stop service unresolved but cannot support a more specific consequence. | Make only the affected claim unavailable; do not assert a bypass or invent a pattern. | **Service change—arrival information is unavailable for this service.** Preserve the official message in details. |

## Non-terminal actual-versus-scheduled-track conflict

An actual track differing from the scheduled track outside normal terminal behavior is a hard conflict, not a confidence adjustment. It invalidates downstream stop claims because the published downstream path is no longer trustworthy.

Apply this decision in order:

1. Confirm that the discrepancy is an explicit actual-versus-scheduled-track conflict and is not normal terminal behavior.
2. Identify the train instance and the downstream claims that depend on the conflicted path.
3. Quarantine the train internally from those scheduled station-board decisions.
4. Remove every affected downstream arrival row and dependent platform guidance. Do not show **Arrival uncertain**, **Expected platform**, **Check station signs**, a scheduled replacement, or a lower-confidence countdown for those claims.
5. Place **Service change—this train's downstream stops are not verified.** beside each affected board's suppression state.
6. Preserve unrelated trains and any claims not downstream of the invalidated path when their own evidence passes admission.

The first later fresh coherent update that demonstrates a trustworthy operational path begins recovery review only: the train instance remains coherent, its ordered remaining stops and actual destination/direction agree, the target exact directional stop is present, the track/path evidence no longer conflicts, and no other veto applies. That first update restores no downstream row, guidance, precision, or primary eligibility.

Readmission requires the full two-update sequence in the [suppression, grace, and recovery policy](suppression-grace-and-recovery-policy.md). A second fresh coherent update must preserve the trustworthy path and, across the pair, prove all five recovery conditions before every current Live admission gate is reevaluated. Only then may an independently supported downstream Live row and guidance return. The scheduled track alone, a new predicted time, a confidence reduction, or one coherent path update cannot clear the conflict for public readmission.

Normal terminal track variation is excluded from this hard-conflict rule unless separate evidence makes the downstream stopping path unreliable. Do not infer a platform assignment or track conflict from station layout, route identity, or a static schedule alone.

## Decision and audit record

For each visible, suppressed, or unavailable claim, preserve:

1. Source types, timestamps, effective periods, and validity decisions.
2. Route identity separately from the current service pattern.
3. The exact directional stop, normalized direction, ordered remaining stops, and actual destination.
4. The effective supplemented pattern for planned work, or the fresh live pattern for unplanned work.
5. The resolved alert time, route, station or segment, direction, train, and consequence scope.
6. Every veto or unresolved high-impact condition and the positive prediction it defeated.
7. The affected board disposition and the explanation shown beside it.
8. For a track conflict, why terminal behavior does or does not apply, the downstream scope removed, both recovery updates, the coherent path evidence preserved across them, and proof of all five recovery conditions before release.

No record may invent a train, stop, platform, track assignment, or service claim. Missing or contradictory required evidence remains **Unknown** and cannot authorize an arrival.
