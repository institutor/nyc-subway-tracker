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

The governing rule is absolute: negative evidence is applied before positive prediction. A fresh predicted time, assigned train, route identity, supplemented schedule, regular static schedule, or alert explanation cannot override a current veto. A resolved hard veto suppresses the arrival claim only for its supported scope; it does not necessarily prove that the physical train was cancelled. High-impact evidence whose material scope cannot be resolved safely makes only the affected **arrival claim unavailable** and preserves the official message; it is not a resolved hard veto or resolved suppression.

## Hard-veto catalog

| Hard veto | Evidence condition and scope | Claims it defeats | Required disposition and rider consequence | Row-specific release prerequisite |
|---|---|---|---|---|
| Bypass | Current resolved, scoped structured evidence and agreeing official text establish that the train or affected service will skip the exact station and direction. A generic **affected** marker alone is not enough to assert a bypass. | Live prediction, static schedule, route identity, and any other claim that the train will serve the exact stop. | Suppress the train only at the resolved exact stop and direction. Use the supported skipped-stop explanation there. Never show the train at a bypassed stop. | The resolved bypass no longer applies and current coherent evidence supports service at the exact stop; then apply the catalog-wide release gate below. |
| Suspension | An active partial or full suspension removes the exact station, direction, or segment from usable service. | Any live or scheduled arrival through the suspended scope. | Remove affected arrivals. Show the supported suspension explanation and preserve unrelated routes or segments. | The suspension no longer applies in the affected scope and current coherent evidence supports service there; then apply the catalog-wide release gate below. |
| Missing live stop | The exact directional stop is absent from the train's ordered remaining-stop sequence. | Static or supplemented schedule inclusion, normal route pattern, route identity, and predicted service inferred for that stop. | Suppress. Never fill the missing stop from static data. | A fresh coherent accepted live sequence contains the exact directional stop; then apply the catalog-wide release gate below. |
| Planned-pattern exclusion | The effective supplemented pattern excludes the stop, or supplemented pattern and live data conflict without a resolved operational change. | A conflicting live prediction and regular static schedule inclusion. | Suppress the excluded target stop; if the operational change is unresolved, suppress until resolved. | The exclusion is no longer effective, or coherent live and supporting change evidence resolve the operational path; then apply the catalog-wide release gate below. |
| Station closure | An active closure removes boarding or alighting at the exact station or supported affected scope. | Live and scheduled arrivals that would invite boarding or alighting at the closed station. | Remove boarding/alighting and affected arrivals; explain the closure and preserve unrelated service at a shared complex. | The closure no longer applies, boarding or alighting is available in the affected scope, and current coherent evidence supports service; then apply the catalog-wide release gate below. |
| Invalidating track conflict | The actual track differs from the scheduled track outside normal terminal behavior, making downstream predictions unreliable. | Downstream arrival predictions, scheduled station-board placement, and dependent platform guidance. | Quarantine the train from scheduled station boards; do not show the downstream arrival or dependent guidance. | Current coherent evidence reestablishes a trustworthy path and shows the explicit non-terminal conflict no longer invalidates it; then apply the catalog-wide release gate below, preserving that path across both updates. |

## Catalog-wide release gate

Every release cell above is a row-specific prerequisite, not sufficient readmission evidence. The affected claim remains suppressed while it completes the two-update sequence in the [suppression, grace, and recovery policy](suppression-grace-and-recovery-policy.md):

1. The first later fresh coherent accepted update may establish the row-specific prerequisite and begins recovery update one only. It restores no arrival, guidance, precision, exact countdown, or primary eligibility.
2. A second consecutive fresh coherent accepted update must complete the pair. Across both updates, prove stable identity, plausible stop order, current movement or stop progress, continued service at the exact target, and no unresolved service or track conflict.
3. Preserve any row-specific operational-path requirement across both updates, including a trustworthy path after an invalidating track conflict.
4. Reevaluate every applicable Live admission gate before an exact countdown, primary arrival, or dependent guidance may return.

An ended alert, cleared adverse condition, static schedule, or one coherent update never creates a train or restores a suppressed claim by itself. If current movement or stop progress is absent, Task 9 recovery remains incomplete and exact countdown and primary eligibility remain absent.

## Fail-closed evidence that withholds a claim

These conditions do not invent a more specific operational fact. They prevent a positive arrival while a material conflict remains unresolved. When the evidence cannot establish a resolved hard veto, use **arrival claim unavailable** for only the materially unresolved scope rather than resolved suppression.

| Condition | Fail-closed rule |
|---|---|
| Stale, malformed, incomplete, anomalously empty, or time-regressed evidence | Reject or quarantine it before train evaluation. It cannot support a live exact countdown or clear a veto. |
| Alert describes a bypass or reroute without enough station detail for a reliable stop pattern | Make only the materially unresolved route-direction, segment, exact-stop, or train **arrival claim unavailable** and show the original official message. Do not assert a resolved bypass, use skipped-stop copy, or label the decision resolved suppression. Missing station or direction metadata never proves an unaffected stop. |
| Alert scope is contradictory | Quarantine the alert record for quality review while preserving any independently supported resolved veto or arrival-claim unavailability. If the contradiction prevents safe scope mapping, make only the materially unresolved claim unavailable and show the original official message. Do not turn contradiction into proof of normal service. |
| Live data and effective planned pattern disagree without resolved supporting change evidence | Preserve planned-pattern exclusion and suppress the affected stop until the operational path is resolved. |
| Static trip is absent from a healthy full real-time snapshot during the replacement period | Do not restore or display the static trip. Do not confidently call it cancelled without a reliable match. |

## Evidence that is not a veto

- A delay-only alert does not suppress a train whose stopping pattern and all arrival conditions remain valid; it changes status or explanation.
- Alert text may explain operational context, but it does not establish movement and can never revive a stale, suppressed, or unavailable train.
- A missing alert, missing station metadata, missing direction metadata, or generic **affected** metadata is not proof that service is normal. It also is not, by itself, enough to assert a specific bypass.
- Supplemented or regular static schedule inclusion is positive planning evidence, not authority to clear any hard veto.

## Veto review record

For every suppressed, unavailable, or quarantined claim, retain:

1. Source type, source timestamp, and effective period.
2. Exact route, station, direction, trip, or segment scope.
3. The resolved hard veto or materially unresolved unavailability condition.
4. The positive prediction the veto defeated.
5. The board disposition and reason for suppression or unavailability, with internal quarantine recorded separately.
6. The row-specific release prerequisite, both recovery updates, proof of all five conditions, applicable coherent-path evidence, and every Live gate evaluated before readmission.

Operational corrections may suppress a known bad arrival, make a materially unresolved claim unavailable, or clarify an affected segment. They may not fabricate movement, add an unsupported arrival, turn unavailability into a resolved bypass, or restore a hard-suppressed claim without the catalog-wide release gate.
