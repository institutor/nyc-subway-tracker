# Evidence veto catalog

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§3.2–3.3, 6–8, 12, 22, 27, and 35; arrival-truth and service-changes plan Task 2 `Artifacts` and `Ordered steps` |
| Owner | Product Truth Lead |
| Required reviewers | Product, Data Quality |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | Pending — Truth Gate |

## Purpose and authority

This catalog owns the negative evidence that vetoes an arrival prediction. The [core arrival contract](core-arrival-contract.md) owns the cumulative live-arrival admission checklist, and the [source-role and precedence matrix](source-role-and-precedence-matrix.md) owns source ordering. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

The governing rule is absolute: negative evidence is applied before positive prediction. A fresh predicted time, assigned train, route identity, supplemented schedule, regular static schedule, or alert explanation cannot override a current veto. A veto suppresses the arrival claim for its supported scope; it does not necessarily prove that the physical train was cancelled.

## Hard-veto catalog

| Hard veto | Evidence condition and scope | Claims it defeats | Required disposition and rider consequence | Release condition |
|---|---|---|---|---|
| Bypass | Current structured scope and official text agree that the train or affected service will skip the exact station and direction; or current evidence materially leaves that bypass unresolved. A generic **affected** marker alone is not enough to assert a bypass. | Live prediction, static schedule, route identity, and any other claim that the train will serve the exact stop. | Suppress the train at that stop. Explain the skipped stop or unresolved service change at the narrowest supported scope. Never show the train at a bypassed stop. | Later coherent evidence establishes service at the exact stop and no active bypass or unresolved reroute remains. |
| Suspension | An active partial or full suspension removes the exact station, direction, or segment from usable service. | Any live or scheduled arrival through the suspended scope. | Remove affected arrivals. Show the supported suspension explanation and preserve unrelated routes or segments. | The suspension is no longer active and current eligible evidence supports the arrival. |
| Missing live stop | The exact directional stop is absent from the train's ordered remaining-stop sequence. | Static or supplemented schedule inclusion, normal route pattern, route identity, and predicted service inferred for that stop. | Suppress. Never fill the missing stop from static data. | A later coherent fresh live sequence contains the exact directional stop and all other admission conditions pass. |
| Planned-pattern exclusion | The effective supplemented pattern excludes the stop, or supplemented pattern and live data conflict without a resolved operational change. | A conflicting live prediction and regular static schedule inclusion. | Suppress the excluded target stop; if the operational change is unresolved, suppress until resolved. | Coherent live sequence plus supporting change evidence resolves the novel operational path, or the planned exclusion is no longer effective. |
| Station closure | An active closure removes boarding or alighting at the exact station or supported affected scope. | Live and scheduled arrivals that would invite boarding or alighting at the closed station. | Remove boarding/alighting and affected arrivals; explain the closure and preserve unrelated service at a shared complex. | Closure is no longer active and current eligible arrival evidence supports service. |
| Invalidating track conflict | The actual track differs from the scheduled track outside normal terminal behavior, making downstream predictions unreliable. | Downstream arrival predictions, scheduled station-board placement, and dependent platform guidance. | Quarantine the train from scheduled station boards; do not show the downstream arrival. | A first later fresh coherent update that reestablishes a trustworthy path begins recovery only and restores no arrival, guidance, precision, or primary eligibility. Require a second consecutive fresh coherent accepted update that preserves the path and, across the pair, proves all five conditions in the [suppression, grace, and recovery policy](suppression-grace-and-recovery-policy.md); reevaluate every Live admission gate before readmission or an exact countdown. |

## Fail-closed evidence that activates or preserves a veto

These conditions do not invent a more specific operational fact. They prevent a positive arrival while a material conflict remains unresolved.

| Condition | Fail-closed rule |
|---|---|
| Stale, malformed, incomplete, anomalously empty, or time-regressed evidence | Reject or quarantine it before train evaluation. It cannot support a live exact countdown or clear a veto. |
| Alert describes a bypass or reroute without enough station detail for a reliable stop pattern | Hide arrivals only for the materially unresolved route and direction or segment, and show the alert. Missing station or direction metadata never proves an unaffected stop. |
| Alert scope is contradictory | Quarantine the alert record for quality review while preserving any independently supported veto or unresolved-scope suppression. Do not turn contradiction into proof of normal service. |
| Live data and effective planned pattern disagree without resolved supporting change evidence | Preserve planned-pattern exclusion and suppress the affected stop until the operational path is resolved. |
| Static trip is absent from a healthy full real-time snapshot during the replacement period | Do not restore or display the static trip. Do not confidently call it cancelled without a reliable match. |

## Evidence that is not a veto

- A delay-only alert does not suppress a train whose stopping pattern and all arrival conditions remain valid; it changes status or explanation.
- Alert text may explain operational context, but it does not establish movement and can never revive a stale or suppressed train.
- A missing alert, missing station metadata, missing direction metadata, or generic **affected** metadata is not proof that service is normal. It also is not, by itself, enough to assert a specific bypass.
- Supplemented or regular static schedule inclusion is positive planning evidence, not authority to clear any hard veto.

## Veto review record

For every suppressed or quarantined claim, retain:

1. Source type, source timestamp, and effective period.
2. Exact route, station, direction, trip, or segment scope.
3. The hard veto or materially unresolved condition.
4. The positive prediction the veto defeated.
5. The transformation into the rider-facing state and the reason for suppression.
6. The later coherent evidence required to release the veto.

Operational corrections may suppress a known bad arrival or clarify an affected segment. They may not fabricate movement, add an unsupported arrival, or clear a hard veto without authoritative evidence.
