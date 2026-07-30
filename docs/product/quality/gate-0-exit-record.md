# Gate 0 exit record

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§29.1, 32.1, 34; arrival-truth and service-changes plan Task 13 `Artifacts` and `Ordered steps` |
| Owner | Release Quality Lead |
| Required reviewers | Product, Data Quality, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate; gate-pass authorization intentionally unsigned |
| Scenario results | [Not run — Gate 0 validation results](gate-0-validation-results.md) |

## Decision

**NO-GO — GATE 0 NOT PASSED**

Public arrival boards remain blocked.

This is a recorded no-go based on absent mandatory evidence, not a signed Gate 0 pass. The plan requires a pass/fail record now, but forbids a pass signature until working-product behavior demonstrates both exit conditions. Completing or committing these documents cannot resolve that requirement.

## Gate 0 exit conditions

The approved specification's two conditions are quoted verbatim below.

| Required exit condition | Decision | Specific missing evidence |
|---|---|---|
| **“No known systematic source of bypassed-stop false positives”** | **NOT DEMONSTRATED — BLOCKS EXIT** | No fixed working-product version; no source revalidation; no normal/weekend/late-night/disruption replay; no current-MTA shadow; no admitted-versus-suppressed comparison with later stop progress; no false-bypass incident exercise; no common-cause evidence; no route/feed coverage; and no mandatory reviewer decisions. |
| **“all degraded states visibly honest”** | **NOT DEMONSTRATED — BLOCKS EXIT** | No observed Current/Degraded/Unavailable presentation; no timestamp-regression or suspicious-empty run; no fixed 39/40/41-of-100 bulk-drop run; no unrelated-group isolation; no two-snapshot recovery; no Holding/Uncertain/fallback presentation evidence; no Task 11 quarantine/correction results; and no measured freshness, labeling, or freeze compliance. |

Expected scenario prose and Draft policies do not demonstrate either condition. Absence of public exposure also does not demonstrate them.

## Evidence disposition

| Exit evidence | Current state |
|---|---|
| Fixed reviewed working-product version | **Not available** |
| Source and route/feed inventory revalidation | **Not run** |
| Normal weekday peak/off-peak replay | **Not run** |
| Weekend planned-work replay | **Not run** |
| Late-night/midnight replay | **Not run** |
| Major-disruption pre/active/recovery replay | **Not run** |
| Current MTA shadow with zero rider exposure | **Not run** |
| All 27 AT-S scenario results | **Not run** |
| Every numeric boundary family and count gate | **Not run** |
| Task 11 Q1–Q8, P1–P4, F1–F3 results | **Not run** |
| Route/feed anomaly and isolation coverage | **Not run** |
| Admitted/suppressed and other disposition comparison with later progress | **Not run; later outcomes absent** |
| False-bypass incident absence | **Not assessed; “no incidents recorded” is not safety evidence** |
| Blocking deviations | Eight open blocking deviations in the [validation results](gate-0-validation-results.md#blocking-deviation-register) |

## Trust-target disposition

| Trust target | Numerator | Denominator | Gate disposition |
|---|---:|---:|---|
| Zero known false-bypass arrivals released to riders | Not available | Not available | **Not measured — blocks exit** |
| ≥99.9% Live-label freshness compliance | Not available | Not available | **Not measured — blocks exit** |
| 100% static fallback times visibly labeled Scheduled | Not available | Not available | **Not measured — blocks exit** |
| 100% detected held trains stop decrementing | Not available | Not available | **Not measured — blocks exit** |

The known-outage accessible-routing and unknown equipment-state targets remain with the Accessibility and Platform Guidance workstream. This Gate 0 no-go does not claim, duplicate, waive, or approve those targets.

The separate replay/shadow false-bypass comparison also has numerator **Not available** and determinate admitted-claim denominator **Not available**. It is **Not measured — blocks exit**. A future nonzero validation denominator may demonstrate working-product behavior without inventing public exposure; it does not turn a pre-release `0/0` rider-exposure metric into a tested pass.

## Mandatory reviewer decisions

| Reviewer | Decision | Reviewed fixed version | Decision date | Evidence/signature |
|---|---|---|---|---|
| Product | **Pending** | Not available | Not recorded | Intentionally unsigned |
| Data Quality | **Pending** | Not available | Not recorded | Intentionally unsigned |
| Operations | **Pending** | Not available | Not recorded | Intentionally unsigned |

Gate-pass authorization: **INTENTIONALLY UNSIGNED — BOTH EXIT CONDITIONS ARE NOT DEMONSTRATED.**

No person, meeting, document author, repository commit, or owner label is treated as approval. The Product/Data Quality/Operations Gate 0 review cannot bulk-approve Draft artifacts whose mandatory review sets additionally require Accessibility or Content. Those artifacts need their complete artifact-specific review on the same fixed evidence package.

## Evidence required before reconsideration

Gate 0 may be reconsidered only after one package contains all of the following:

1. one reproducible, fixed working-product version tied to fixed arrival-truth behavior-policy versions;
2. dated revalidation of official source semantics, publication behavior, editions, and every route-to-feed-group assignment;
3. preregistered and completed normal weekday peak/off-peak, weekend planned-work, late-night/midnight, and major-disruption pre/active/recovery replays;
4. a separate completed contemporaneous current-MTA shadow cohort with zero rider exposure;
5. a complete decision census and preregistered manual review, with rare/high-impact strata reviewed as a census;
6. separate actual results for all 27 truth-owned **AT-S** scenarios, every numeric boundary family, every count gate, and Task 11 **Q1–Q8, P1–P4, F1–F3**;
7. per-route/feed-group Current and age-boundary, regression, emptiness, fixed 39/40/41-of-100 bulk-drop, unrelated-group isolation, and two-snapshot recovery results;
8. determinate later-stop-progress comparison for admitted, suppressed, unavailable, quarantined, Holding/Uncertain, and fallback decisions, with every **Not observed** or **Inconclusive** requirement resolved;
9. §29.1 trust metrics with numerators, denominators, zero-denominator handling, and preserved failed decisions;
10. complete incident reviews for every confirmed or potential false bypass, including bounded harm, common-cause search, conservative containment, non-fabricating correction, original/adjacent/integrated/holdout/current-shadow reruns, and durable risk evidence;
11. closure evidence for every blocking deviation and every open or escalated arrival-truth risk; and
12. Product, Data Quality, and Operations decisions on this fixed Gate 0 package, plus Accessibility, Content, Privacy, or other reviewers required by each affected underlying artifact.

Only after that evidence demonstrates both quoted conditions may a new exit record carry a pass authorization. This no-go and its missing-evidence history remain preserved.
