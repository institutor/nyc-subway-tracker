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

The governing rule is absolute: negative evidence is applied before positive prediction. A fresh predicted time, assigned train, route identity, supplemented schedule, regular static schedule, or alert explanation cannot override a current veto. A resolved hard veto suppresses the arrival claim only for its supported scope; it does not necessarily prove that the physical train was cancelled. Independent current high-impact evidence whose material scope cannot be resolved safely makes only the affected **arrival claim unavailable**, uses the governed explanation, preserves the original official message in details, and keeps unrelated service eligible; it is not a resolved hard veto or resolved suppression.

## Hard-veto catalog

| Hard veto | Evidence condition and scope | Claims it defeats | Required disposition and rider consequence | Row-specific release prerequisite |
|---|---|---|---|---|
| Bypass | Current resolved, scoped structured evidence and agreeing official text establish that the train or affected service will skip the exact station and direction. A generic **Affected** marker alone is not enough to assert a bypass. | Live prediction, static schedule, route identity, and any other claim that the train will serve the exact stop. | Suppress the train only at the resolved exact stop and direction. Use the supported skipped-stop explanation there. Never show the train at a bypassed stop. | The resolved bypass no longer applies and current coherent evidence supports service at the exact stop; then apply the catalog-wide release gate below. |
| Suspension | An active partial or full suspension removes the exact station, direction, or segment from usable service. | Any live or scheduled arrival through the suspended scope. | Remove affected arrivals. Show the supported suspension explanation and preserve unrelated routes or segments. | The suspension no longer applies in the affected scope and current coherent evidence supports service there; then apply the catalog-wide release gate below. |
| Missing live stop | The exact directional stop is absent from the train's ordered remaining-stop sequence. | Static or supplemented schedule inclusion, normal route pattern, route identity, and predicted service inferred for that stop. | Suppress. Never fill the missing stop from static data. | A fresh coherent accepted live sequence contains the exact directional stop; then apply the catalog-wide release gate below. |
| Planned-pattern exclusion | Current evidence resolves that the effective supplemented pattern applies and excludes the exact stop. | A conflicting live prediction and regular static schedule inclusion. | Suppress only the resolved excluded target stop and show the narrowest supported exclusion consequence. Do not treat an unresolved operational conflict as this resolved hard veto. | The exclusion is no longer effective and current coherent live and supporting change evidence support the operational path; then apply the catalog-wide release gate below. |
| Station closure | An active closure removes boarding or alighting at the exact station or supported affected scope. | Live and scheduled arrivals that would invite boarding or alighting at the closed station. | Remove boarding/alighting and affected arrivals; explain the closure and preserve unrelated service at a shared complex. | The closure no longer applies, boarding or alighting is available in the affected scope, and current coherent evidence supports service; then apply the catalog-wide release gate below. |
| Invalidating track conflict | Current evidence resolves that the actual track differs from the scheduled track outside normal terminal behavior and invalidates the trustworthy downstream path. | Downstream arrival predictions, scheduled station-board placement, and dependent platform guidance. | Suppress only the resolved downstream arrival scope; do not show the arrival or dependent guidance. An unresolved or lower-basis track conflict instead follows the three-way fail-closed rules below. | Current coherent evidence reestablishes a trustworthy path and shows the explicit non-terminal conflict no longer invalidates it; then apply the catalog-wide release gate below, preserving that path across both updates. |

## Catalog-wide release gate

Every release cell above is a row-specific prerequisite, not sufficient readmission evidence. The affected claim remains suppressed while it completes the two-update sequence in the [suppression, grace, and recovery policy](suppression-grace-and-recovery-policy.md):

1. The first later fresh coherent accepted update may establish the row-specific prerequisite and begins recovery update one only. It restores no arrival, guidance, precision, exact countdown, or primary eligibility.
2. A second consecutive fresh coherent accepted update must complete the pair. Across both updates, prove stable identity, plausible stop order, current movement or stop progress, continued service at the exact target, and no unresolved service or track conflict.
3. Preserve any row-specific operational-path requirement across both updates, including a trustworthy path after an invalidating track conflict.
4. Reevaluate every applicable Live admission gate before an exact countdown, primary arrival, or dependent guidance may return.

An ended alert, cleared adverse condition, static schedule, or one coherent update never creates a train or restores a suppressed claim by itself. If current movement or stop progress is absent, Task 9 recovery remains incomplete and exact countdown and primary eligibility remain absent.

## Fail-closed evidence that withholds a claim

These conditions do not invent a more specific operational fact. They prevent a positive arrival while a material conflict remains unresolved. When independent current high-impact evidence cannot establish a resolved hard veto but materially leaves a relevant route, direction, segment, exact-stop, train, or path scope unresolved, use **arrival claim unavailable** for only that scope rather than resolved suppression, show the governed explanation and original official message, and preserve unrelated service.

Generic **Affected** metadata alone can create neither a resolved bypass or suppression nor **arrival claim unavailable**. Unavailability requires independent current high-impact evidence of a possible bypass, reroute, or other governed high-impact change plus material scope uncertainty. Missing, ambiguous, or contradictory station, direction, or other scope evidence without that independent basis remains neither proof of normal service nor a resolved veto; it follows the governing quarantine or limitation path.

| Condition | Fail-closed rule |
|---|---|
| Stale, malformed, incomplete, anomalously empty, or time-regressed evidence | Reject or quarantine it before train evaluation. It cannot support a live exact countdown or clear a veto. |
| Independent current high-impact evidence describes a bypass or reroute but lacks enough station, direction, segment, exact-stop, train, or path detail for a reliable stop pattern | Make only the materially unresolved scope **arrival claim unavailable**, show the governed explanation and original official message, and preserve unrelated service. Do not assert a resolved bypass, use skipped-stop copy, or label the decision resolved suppression. Missing metadata alone neither proves an unaffected stop nor supplies the high-impact evidence required for unavailability. |
| Alert scope is contradictory | Quarantine the alert record for quality review while preserving any independently supported resolved veto or arrival-claim unavailability. Only when independent current high-impact evidence remains and the contradiction prevents safe scope mapping may the materially unresolved claim become unavailable with the governed explanation and original official message while unrelated service remains eligible. Do not turn contradiction into proof of normal service or treat contradiction alone as sufficient high-impact evidence. |
| Live data and an effective planned pattern disagree | If current evidence resolves that the pattern excludes the exact stop, use the scoped planned-pattern suppression above. If independent current high-impact evidence leaves material operational scope unresolved, make only that scope **arrival claim unavailable**, show the governed explanation and original official message, and preserve unrelated service. Other lower-basis conflict fails admission under its governing quarantine or limitation treatment without inventing resolved suppression or Task 6 unavailability. |
| Static trip is absent from a healthy full real-time snapshot during the replacement period | Do not restore or display the static trip. Do not confidently call it cancelled without a reliable match. |

## Evidence that is not a veto

- A delay-only alert does not suppress a train whose stopping pattern and all arrival conditions remain valid; it changes status or explanation.
- Alert text may explain operational context, but it does not establish movement and can never revive a stale, suppressed, or unavailable train.
- A missing alert, missing station or direction metadata, or generic **Affected** metadata is neither proof that service is normal nor, by itself, independent current high-impact evidence. Alone it authorizes neither a specific bypass or resolved suppression nor **arrival claim unavailable**.
- Supplemented or regular static schedule inclusion is positive planning evidence, not authority to clear any hard veto.

## Veto review record

For every suppressed, unavailable, quarantined, or limited claim, retain:

1. Source type, source timestamp, effective period, and authoritative observation time.
2. Exact route, station, direction, trip, segment, stop, and path scope supported by the evidence.
3. The controlling condition and owning rule, classified as exactly one of:
   - a resolved hard veto that makes the supported scope ineligible;
   - independent current high-impact evidence plus materially unresolved scope that makes only the affected **arrival claim unavailable**; or
   - lower-basis missing, ambiguous, or contradictory evidence, including the exact governing quarantine or limitation trigger, that proves neither resolved suppression nor Task 6 unavailability.
4. The candidate rejection, including the positive prediction defeated or claim withheld, recorded separately from the internal disposition and rider-visible outcome.
5. The exact internal and public disposition: scoped suppression with no arrival row and only its narrow resolved consequence; scoped unavailability with no positive arrival row, the governed explanation, original official details, and unrelated service preserved; or quarantine/limitation with its supported board-level treatment or no row. Record proof that no unsupported Live, Expected, Holding, Uncertain, Scheduled, exact-time, or dependent-guidance state was invented.
6. Disposition-specific release evidence:
   - for resolved hard suppression, the unchanged row-specific prerequisite, both catalog-wide recovery updates, all five recovery conditions, applicable coherent-path evidence, and every Live gate required before readmission;
   - for **arrival claim unavailable**, newer coherent evidence that resolves every material scope dimension, followed by any still-applicable row-specific and catalog-wide recovery gate carried over from a separately recorded hard suppression; unavailability alone does not invent a two-update hard-veto gate; or
   - for quarantine or limitation, coherent evidence satisfying the exact trigger-specific owning release rule and any separately applicable recovery rule; the record must not claim two hard-veto updates unless that rule independently governs.
7. Proof that a static or supplemented schedule, operational correction, missing alert, missing scope metadata, or generic **Affected** metadata was not counted as release or recovery evidence.

Operational corrections may suppress a known bad arrival, make a materially unresolved claim unavailable, or clarify an affected segment. They may not fabricate movement, add an unsupported arrival, turn unavailability into a resolved bypass, or restore a hard-suppressed claim without the catalog-wide release gate. An operational correction is never release evidence; only separately accepted coherent current source evidence satisfying the disposition-specific owning rule can support release.
