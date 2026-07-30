# Platform guidance coverage register

| Governance field | Value |
|---|---|
| Source sections | Product artifact index row citing approved specification §§23.7, 29.4, and 32.3; applying approved specification §§23.7, 29.4, 30.2, 32.3–32.4, and 33.2; accessibility and platform-guidance plan `Product artifact map` and Task 10 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks` |
| Owner | Guidance Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](#pending-execution-record-for-every-fixture) |

## Purpose and authority

This register governs station-by-station eligibility for platform-positioning coverage. It defines one atomic coverage row, the five-category review priority, omission-first eligibility, reverification and correction handling, feedback classification, and the evidence package Task 12 must inspect for Release 2. It does not admit an arrival, confirm a platform, create geometry, select a rider objective, validate an accessible path, assign a current positioning certainty, demonstrate a rendered result, or authorize release.

The [platform guidance evidence standard](platform-evidence-standard.md) owns the underlying atomic editorial record. The [platform state and positioning certainty matrix](platform-state-and-certainty-matrix.md) owns current platform and positioning decisions after this coverage gate. The [positioning rider experience](positioning-rider-experience.md) owns rider objectives and Front/Middle/Back presentation, and the [transfer connection assessment](transfer-connection-assessment.md) owns transfer likelihood. Accessibility remains independently governed by the [complete accessible-path contract](../accessibility/complete-path-contract.md), [station-direction accessibility coverage register](../accessibility/station-direction-coverage-register.md), and [Accessible Route Only state matrix](../accessibility/accessible-route-only-state-matrix.md).

The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. Shared concepts retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md), rider wording follows the [approved rider language rules](../contracts/rider-language-rules.md), and lifecycle decisions follow the [product artifact review and approval policy](../review-and-approval-policy.md).

This artifact is **Draft**. It defines expected policy only. It demonstrates no real priority source, cutoff, queue, complex, station, platform, route, direction, service pattern, objective, coverage row, source package, field visit, verification date, verifier, rendered output, feedback corpus, reviewer decision, approval, coverage result, release package, or authorization. Every fixture below is synthetic and **Not run — Pending**.

The authoritative [Gate 0 exit record](../quality/gate-0-exit-record.md) remains:

**NO-GO — GATE 0 NOT PASSED**

Public arrival boards remain blocked.

The separate Release 1 accessibility decision remains **NO-GO — REQUIRED ACCESSIBILITY EVIDENCE AND COVERAGE ARE NOT DEMONSTRATED** in the [accessibility and guidance release-gate record](../quality/accessibility-and-guidance-release-gates.md). Task 12 Steps 5–13 remain **Pending**. This Draft does not pass, merge, override, or waive any current decision and makes no Release 2 decision.

## Product Governance reconciliation

The [product artifact index](../artifact-index.md) cites approved specification §§23.7, 29.4, and 32.3 for this register. Task 10 also applies station-geometry risk §33.2, supporting measure §30.2, Release 3 expansion §32.4, the full Task 10 plan provenance, and the upstream boundaries linked above. Product Governance Lead reconciliation of the index omission of §§30.2, 32.4, and 33.2 is **Pending**. This task does not edit the index or treat the mismatch as approved.

## Accepted upstream documentation bindings

These bindings identify the accepted documentation inputs before Task 10. They establish provenance only; they are not product behavior, field evidence, review approval, coverage, or release evidence.

| Accepted task | Commit | Bound artifact and blob |
|---|---|---|
| Task 7 | `3d39129a58b497c92d0125569edebd894c47a71d` | `platform-evidence-standard.md` blob `5aa640263da812458a6005de6e691801d24374f5`; `platform-state-and-certainty-matrix.md` blob `cc937eb46b0493236dd2be67589f147049dbee26` |
| Task 8 | `0fcb00265a23ea859681dfef7b6edad213c674df` | `positioning-rider-experience.md` blob `38e7e5fda00dd4b4ed577a2a37c7eb5fb596499d` |
| Task 9 | `8e27ae2bd3b69c3946a9aba41adf7c76f36e00a5` | `positioning-rider-experience.md` blob `8a6dfb8a844fb71118576ca46abf7d71fa52fb88`; `transfer-connection-assessment.md` blob `23cfaba8b512facd163c9bcd2f7be7b4a32e1a6c` |

`PCOV-T10-POLICY-v1` identifies the expected-policy definition in this artifact and is bound by the commit containing it. It is not a product/build version, an approved artifact version, an observed result, or a release decision.

## Atomic coverage unit

One coverage row authorizes consideration of exactly:

> exact complex + constituent + route + pattern + normalized direction + destination + directional platform/orientation + one objective + one exact exit/transfer/accessible target + one Front/Middle/Back relationship

Any changed element requires a separate row or immutable version. A row never inherits across complex parts, constituents, shared platforms, routes, directions, ordinary and rerouted patterns, terminals, objectives, exits or street corners, transfers or passages, elevator chains or boarding areas, stopping relationships, or accessibility scope. A station or complex summary cannot authorize any recommendation.

## Required 38-field coverage row

Every field is mandatory unless its rule explicitly permits reviewed **Not applicable**. Blank, placeholder, inherited, unresolved, unsupported, stale-under-owner-rule, differently versioned, or unreviewed content makes the row **Pending / ineligible**. The sole exception is field 38's exact downstream lifecycle value **Pending — Task 12 not yet decided** when every other field 38 element is fixed as required below; no other Pending or unresolved value is exempt.

| Field | Required content | Acceptance boundary |
|---:|---|---|
| 1. Coverage row ID | Stable identity unique to the complete atomic scope | Never reuse the identity for a different constituent, route, direction, pattern, platform, objective, or target. |
| 2. Immutable version | One fixed row version | Evidence, feedback, reviews, and disposition resolve to this version. |
| 3. Superseded version or None | Prior immutable version and reason, or reviewed **None** | A prior version remains historical and is never overwritten. |
| 4. Complex ID and name | Official complex identity and canonical rider name | Complex context does not broaden constituent scope. |
| 5. Constituent ID and name | Exact physical constituent containing the platform | Another constituent cannot substitute. |
| 6. Priority category | Exactly one of the five governed categories below | A category affects review order only. |
| 7. Category evidence | Immutable source, coverage window, currency, selection method, and review | Unsupported adjectives or an undocumented queue fail. |
| 8. Route | Exact rider-recognizable route | Shared track, color, or another service cannot substitute. |
| 9. Service-pattern variation | Exact ordinary, express/local, terminal, reroute, or other supported variation | Normal-pattern coverage never transfers to an unknown reroute. |
| 10. Normalized direction | Exact rider-facing direction and source mapping | Opposite, raw, or ambiguous direction cannot substitute. |
| 11. Destination or terminal | Exact destination context that preserves the relationship | A stale or scheduled destination cannot overrule current service. |
| 12. Platform ID | Stable directional-platform identity and rider-recognizable description | Nearby, opposite, ordinary, or replacement platforms never inherit. |
| 13. Layout and orientation | Fixed physical reference axis, platform layout, and train-travel orientation | An independent reviewer must reproduce Front and Back. |
| 14. Front/rear order | Explicit Front-to-Back order for this scope | Reversal requires its own supported relationship. |
| 15. Zone geometry | Reviewed Front/Middle/Back extents and stopping relationship | Entrance coordinates or equal-third guesses fail. |
| 16. Objective type | Destination exit, transfer, or verified accessible boarding/exit relationship | No additional objective is implied. |
| 17. Objective target | One exact exit, corner, transfer, elevator, or boarding target | “Best” or a complex-level label is insufficient. |
| 18. Exact physical relationships | Exact exit/corner, passage, transfer, stair, ramp, elevator endpoint, level, and boarding-area relationships used | Every applicable relationship is explicit and continuous. |
| 19. Zone and benefit | One Front/Middle/Back relationship and the exact supported rider benefit | Benefit wording cannot broaden evidence. |
| 20. Certainty ceiling and presentation scope | Maximum **Verified**, **Expected**, or **Unavailable** treatment and exact permitted scope | No numeric confidence score; current runtime rules may only weaken or omit. |
| 21. Accessible-path version or reviewed N/A | Exact complete-path version for an accessible objective, or reviewed **Not applicable** for a non-accessible objective | A station badge, machine presence, or partial chain cannot substitute. |
| 22. Restrictions | Operating, time, route, pattern, platform, direction, stopping, accessibility, and presentation limits | An unrecorded exception cannot be assumed safe. |
| 23. Supported scope | Exhaustive exact scope the row supports | Eligibility never expands beyond this set. |
| 24. Unsupported scope | Exhaustive excluded scope, including unknown or unreviewed combinations | Silence never expands coverage; **None identified** needs fixed evidence and five approvals. |
| 25. Task 7 record and version | Exact underlying Task 7 atomic record identity and immutable version | A summary or different-version evidence package fails. |
| 26. Durable source and field check | Immutable maps, diagrams, measurements, source revisions, and reproducible field observations | Mutable views, memory, meetings, or feedback alone fail. |
| 27. Verification date | Date the exact row relationship was verified | Missing date is ineligible; no cadence or expiry is invented. |
| 28. Verifier and role | Named accountable verifier and actual role | Team name, owner, author, or invented identity fails. |
| 29. Reverification triggers evaluated | Every trigger below, its exact scope, and current result | Any open or materially unresolved trigger makes the affected row ineligible. |
| 30. Reverification status | Current, Reverification required, or Pending, with reason and date | Only Current may proceed, and only after every other field passes. |
| 31. Feedback and corrections | Linked immutable feedback records, triage, adverse evidence, correction versions, closure, and reruns, or reviewed None | Feedback never verifies; originals and adverse results remain preserved. |
| 32. Product decision | Named reviewer, same row version, Approve or Changes required, decision date, and durable evidence | Assignment, silence, authorship, or another version fails. |
| 33. Accessibility decision | Named reviewer, same row version, Approve or Changes required, decision date, and durable evidence | Accessible scope also requires its independent complete-path decision. |
| 34. Data Quality decision | Named reviewer, same row version, Approve or Changes required, decision date, and durable evidence | Source and scope uncertainty cannot be averaged away. |
| 35. Content decision | Named reviewer, same row version, Approve or Changes required, decision date, and durable evidence | Clear wording cannot repair unsupported geometry. |
| 36. Operations decision | Named reviewer, same row version, Approve or Changes required, decision date, and durable evidence | Operational familiarity cannot replace a field check. |
| 37. Disposition | One exact governed disposition below, with reason and decision date | Eligibility is structural permission for later evaluation only. |
| 38. Release-package inclusion or exclusion | Fixed release-package version, exact **Included** or **Excluded** decision, exact scope, fixed reason, and downstream lifecycle value exactly **Pending — Task 12 not yet decided** | This field is structurally complete with that exact downstream value. It is the sole exception to the general unresolved-content rule, grants no release authorization, and never excuses an omitted declared target. |

## Coverage disposition and omission-first gate

Use only these dispositions:

| Disposition | Exact meaning | Rider consequence |
|---|---|---|
| **Eligible for runtime evaluation** | All 38 fields pass, including a structurally complete field 38 whose downstream lifecycle value is exactly **Pending — Task 12 not yet decided**; all five named reviewers approve the same immutable version; all applying governing artifacts are Approved; reverification status is Current; and no trigger remains open. | The matrix may begin its independent current evaluation while Task 12 remains Pending. Nothing appears automatically, and no release is authorized. |
| **Pending / ineligible** | Any required evidence, field, approval, version, scope, or governing decision is absent or unresolved, except field 38's sole exact downstream lifecycle value **Pending — Task 12 not yet decided** under its complete-field rule. | Positioning is **Unavailable** and omitted. |
| **Rejected / ineligible** | Evidence affirmatively disproves a required geometry, orientation, scope, target, objective, or source relationship. | Positioning is **Unavailable** and omitted for the rejected scope. |
| **Reverification required / ineligible** | A governed change or material correction may invalidate the relationship. | Positioning becomes **Unavailable** immediately for the affected scope and remains omitted. |
| **Superseded version / historical** | A newer immutable version replaced this version. | Historical evidence is retained but cannot authorize current evaluation. |

The first positioning question is: does one exact **Eligible for runtime evaluation** row match the current route, normalized direction, service-pattern variation, destination, directional platform and orientation, objective, target, and Front/Middle/Back relationship? If no, positioning is **Unavailable** and the claim is omitted. If yes, the candidate proceeds through every Task 7 runtime rule, arrival and service veto, platform state, accessibility decision, Task 8 presentation rule, and Task 9 transfer rule that applies.

Field 38's exact **Pending — Task 12 not yet decided** value records the downstream decision boundary; it is not missing evidence, a waiver, an approval, or authorization. Any different Pending, blank, provisional, undecided, or unresolved field 38 value makes the row ineligible.

An eligible row is not **Platform confirmed**, **Verified** now, **Accessible now**, current service, a passing scenario, or release authorization. An eligible row plus runtime ambiguity still omits positioning. Runtime track evidence plus no exact eligible row also omits positioning. Coverage quantity, a station summary, or a row for a nearby combination never weakens the gate.

Because this register and every governing artifact remain Draft, the current inventory has zero eligible rows.

## Five-category review priority

Review order is exactly:

1. highest-transfer-volume complexes;
2. terminals and airport connections;
3. long-passage or asymmetric-exit complexes;
4. accessible stations where elevator placement materially changes the best zone;
5. remaining stations.

The earliest category a complex independently qualifies for controls review order only. It never changes evidence, approval, runtime, accessibility, or release requirements. Within-category order is **Pending**.

No real complex enters category 1 without an immutable source, measurement window, currency rule, coverage statement, selection method, and same-version review. “Highest-transfer-volume,” “long,” “priority,” and rollout count have no approved thresholds in the source specification; this register invents none.

## Reverification and runtime change

Reverification is triggered by a known or materially unresolved change to:

- station or constituent geometry;
- passage, exit, or street-corner relationship;
- elevator chain, endpoint, level, or boarding area;
- platform, layout, orientation, or directional use;
- route-direction, destination, terminal, or service-pattern variation;
- Front-to-Back or stopping relationship;
- durable source or evidence version; or
- a confirmed **Wrong zone** or **Changed station geometry** correction.

On a trigger:

1. identify the exact affected atomic scope;
2. set only affected rows to **Reverification required / ineligible** immediately;
3. make positioning **Unavailable** and omit it for that scope;
4. preserve unaffected eligible rows and independently supported service;
5. preserve the prior version, every decision, adverse evidence, feedback, and correction;
6. create a new immutable version with new evidence, verification date, named verifier, and all five same-version reviews;
7. restore eligibility only after the new version independently passes every field and governing artifact is Approved; and
8. require the runtime matrix to reevaluate separately.

A transient runtime reroute, ambiguity, or track conflict suppresses current display without rewriting the structural coverage row unless accepted evidence establishes a durable relationship change. The exact affected conflict behavior remains:

**Track change—check station signs**

**Service change—this train's downstream stops are not verified.**

There is no approved coverage expiry, fixed reverification cadence, trigger-response service level, or evidence-renewal interval. Those gaps remain **Pending** and cannot be filled with an invented time.

## Feedback and correction

Every feedback record uses exactly one category:

- **Wrong zone**
- **Unclear instruction**
- **Changed station geometry**

There is no **Other** category. A report covering more than one category is split into linked category records so each risk and correction remains independently auditable.

Each feedback record preserves:

1. immutable feedback ID;
2. exact coverage row and version;
3. exact constituent, route, direction, pattern, platform, objective, target, and zone scope;
4. one exact category;
5. reported date;
6. sanitized durable evidence;
7. triage result and accountable owner;
8. rider-risk assessment;
9. suppression and reverification decision;
10. correction scope;
11. new immutable row version, field check, and five reviews when required;
12. closure decision and date;
13. rerun evidence; and
14. measurement inclusion, exclusion, or Pending disposition.

Feedback never verifies a relationship. A credible material **Wrong zone** or **Changed station geometry** conflict makes the affected row **Reverification required / ineligible** immediately. **Unclear instruction** remains a separate content correction when geometry is unchanged, but the claim is still suppressed if the wording could materially mislead the rider. Preserve the original record, original decisions, feedback, adverse evidence, correction, and rerun.

Store no rider identity, device identifier, location history, commute history, contact detail, or unrelated free text in this review record.

## Release 2 evidence package and Release 3 expansion

For every included priority complex, the Release 2 package must contain:

- immutable priority inventory and category evidence;
- declared coverage target and explicit exclusions;
- every included and excluded atomic row and version;
- durable source packages, field checks, verification dates, and named verifiers;
- all five same-version reviewer decisions;
- exact destination-exit, transfer, and verified-accessible-positioning coverage;
- fixed Task 7, Task 8, and Task 9 scenario results and dependencies;
- exact visible and assistive outputs or omissions;
- proof that every display carried the current route-direction orientation and verification date;
- proof that no affected recommendation survived an unresolved conflict;
- the exact three-category feedback inventory;
- every finding, correction, preserved original result, and rerun; and
- each inclusion, exclusion, numerator, denominator, and Pending decision needed to reproduce the evidence claim.

Task 10 records that package. Only Task 12 decides Release 2.

The current evidence inventory is:

| Evidence item | Current result | Consequence |
|---|---:|---|
| Included Release 2 complexes | **None** | No rollout package exists |
| Real atomic coverage rows | **0** | All real scopes remain unsupported for this feature |
| Rows eligible for runtime evaluation | **0** | No positioning claim may appear |
| Real priority complexes | **0** | No real review queue exists |
| Verified destination-exit objectives | **0** | No real exit-positioning coverage is demonstrated |
| Verified transfer objectives | **0** | No real transfer-positioning coverage is demonstrated |
| Verified accessible objectives | **0** | No real accessible-positioning coverage is demonstrated |
| Observed visible and assistive outputs | **0** | Presentation behavior is not demonstrated |
| Reviewed feedback records | **0** | Correction behavior is not demonstrated |
| Release 2 authorization | **Pending** | Task 12 remains incomplete |

No row means only that platform guidance is unsupported for this feature. It does not mean the station is inaccessible, the geometry is wrong, or the underlying transit service is unavailable.

Release 3 applies the identical 38-field gate to every new atomic row. Never bulk-enable a complex, constituent, shared platform, route, direction, pattern, objective, or system segment from one passing row, and never lower review requirements to increase coverage.

## Measures, zero-tolerance checks, and unresolved decisions

Every displayed recommendation must carry current route-direction orientation and a verification date. No affected recommendation may remain visible during an unresolved platform, reroute, or track conflict. Every feedback record must use one of the three exact categories above. A failure in any of those zero-tolerance checks is blocking evidence, not a favorable aggregate.

Platform-guidance coverage and correction rate remain **Not measured / Pending** until Product Governance fixes the target population, immutable numerator and denominator definitions, exclusions, observation window, source currency, and same-version review. A zero numerator with a zero or unfixed denominator is never 100%, Pass, complete, or launch evidence.

The following decisions remain **Pending**:

- priority source and cutoff;
- number of Release 2 priority complexes;
- within-category tie-breaker;
- minimum coverage target and allowed exclusions;
- fixed coverage numerator and denominator;
- correction-rate numerator, denominator, window, and target;
- reverification cadence or expiry; and
- feedback triage and correction-response service level.

## Fixed synthetic coverage fixtures

Every fixture below is a synthetic expected-policy definition, not observed evidence. All use:

- accepted Task 7, Task 8, and Task 9 commits and blobs listed above;
- `PCOV-T10-POLICY-v1`;
- one unique synthetic source package `<fixture-id>-SRC-v1`;
- fixed synthetic `2026-07-30 America/New_York` source time `09:00:00`, acceptance time `10:00:00`, evaluation time `10:00:01`, and definition-decision time `10:00:02`, with any narrower event times stated by the unique package;
- fixed product/build **Pending**; and
- no real complex, station, platform, route, source, field visit, verifier, output, reviewer, feedback corpus, coverage, or release claim.

| Fixture and fixed source package | Fixed synthetic inputs | Expected visible, assistive, and governance result | Prohibited result |
|---|---|---|---|
| `PCOV-01`; `PCOV-01-SRC-v1` | One exact synthetic atomic scope has all 38 fields, including fixed package version `R2-SYN-v1`, **Included**, exact scope, fixed inclusion reason, and downstream lifecycle value exactly **Pending — Task 12 not yet decided**; immutable evidence; Current status; no open trigger; five named same-version Approve decisions; and a fixed hypothetical approved governing package for policy evaluation. Runtime arrival and platform inputs are deliberately absent. | **Eligible for runtime evaluation** structurally only while Task 12 remains exactly Pending; show no positioning, platform, accessibility, release claim, or authorization without independent runtime and downstream decisions. | Treat field 38 as incomplete; automatic **Verified**, **Platform confirmed**, **Accessible now**, rendered guidance, coverage passage, or release authorization. |
| `PCOV-02`; `PCOV-02-SRC-v1` | A complex summary names routes and exits but has no atomic direction, pattern, platform, objective, target, row version, field check, or five decisions. | **Pending / ineligible**; positioning **Unavailable** and omitted visibly and assistively. | Summary-level enablement, inferred rows, or a weaker zone. |
| `PCOV-03`; `PCOV-03-SRC-v1` | One otherwise passing synthetic row covers direction D-A, pattern P-A, platform PL-A, objective Exit, and target X-A only; D-B and target X-B are explicitly unsupported. | Only the exact D-A/P-A/PL-A/Exit/X-A combination may be structurally eligible; D-B and X-B omit positioning. | Complex-wide, opposite-direction, alternate-exit, or shared-platform inheritance. |
| `PCOV-04`; `PCOV-04-SRC-v1` | A passing normal-pattern row exists; a current admitted reroute uses replacement platform PL-R with no matching coverage row or reviewed geometry. | Retain the normal structural row; reroute positioning is **Unavailable** and omitted. | Reuse normal-platform orientation, zone, transfer, or accessibility relationships on PL-R. |
| `PCOV-05`; `PCOV-05-SRC-v1` | Every relationship is supplied, but field 27 verification date and field 28 named verifier are missing. | **Pending / ineligible**; no visible or assistive positioning claim. | Eligibility from completeness percentage, repository author, owner name, or inferred date. |
| `PCOV-06`; `PCOV-06-SRC-v1` | Accepted evidence establishes a passage and exit change affecting one target row; a second row for an unrelated platform and objective has no changed relationship. | Set only the affected row to **Reverification required / ineligible** immediately and omit it; preserve the unaffected row subject to runtime gates. | Keep affected guidance, invalidate the whole complex, or overwrite prior evidence. |
| `PCOV-07`; `PCOV-07-SRC-v1` | A new immutable row version has new field evidence, verification date, named verifier, all five same-version approvals, Current status, no open trigger, and structurally complete field 38 with fixed package version `R2-SYN-v2`, **Included**, exact scope, fixed reason, and exactly **Pending — Task 12 not yet decided**; the prior version is linked. Runtime inputs remain separate. | New version may become **Eligible for runtime evaluation** when governing artifacts are Approved while Task 12 remains Pending and grants no authorization; old version becomes **Superseded version / historical**; runtime reevaluates independently. | Treat the exact Task 12 lifecycle value as release approval, mutate the old version, reuse old approvals, or automatically display the new row. |
| `PCOV-08`; `PCOV-08-SRC-v1` | One structurally eligible row exists, then the affected admitted candidate develops an unresolved invalidating track conflict; an unrelated train remains coherent. | Retain the structural row without using it; suppress the affected arrival and dependent positioning; show exact station context and suppression explanation; preserve unrelated service. | Rewrite the row from a transient conflict, show an affected zone, create a Check-signs row, or suppress unrelated service. |
| `PCOV-09`; `PCOV-09-SRC-v1` | Two qualifying exact actual-track updates confirm a platform, but no exact eligible coverage row exists for the objective and target. | Preserve **Platform confirmed** only; positioning is **Unavailable** and omitted visibly and assistively. | Infer a zone from track stability or call the platform confirmation positioning coverage. |
| `PCOV-10`; `PCOV-10-SRC-v1` | A proposed accessible objective has geometry but the exact complete accessible path has one missing or Unknown required edge. | Coverage row is **Pending / ineligible**; no accessible zone or substitute appears and Accessible Route Only remains governed independently. | Treat geometry, station badge, ordinary objective, or one elevator as a complete accessible path. |
| `PCOV-11`; `PCOV-11-SRC-v1` | One synthetic complex has fixed evidence satisfying priority categories 1, 3, and 4. Its atomic coverage row is incomplete. | Assign category 1 for review order only; keep the row **Pending / ineligible** under the same gate. | Stack categories, weaken evidence, or imply category 1 approval or coverage. |
| `PCOV-12`; `PCOV-12-SRC-v1` | A proposed real-world category-1 queue has no immutable volume source, cutoff, window, currency, coverage, selection method, or review. | No real priority classification or queue; status remains **Pending**. | Invent “highest volume,” a cutoff, rank, number of complexes, or rollout commitment. |
| `PCOV-13`; `PCOV-13-SRC-v1` | A sanitized material report credibly establishes a wrong zone for one exact row/version and scope. | Create one **Wrong zone** record; suppress the affected claim; set the row **Reverification required / ineligible**; preserve originals; require new evidence and five reviews. | Feedback as verification, silent wording edit, broad complex suppression, or erased adverse evidence. |
| `PCOV-14`; `PCOV-14-SRC-v1` | One report identifies an unclear instruction; fixed evidence confirms the geometry and zone relationship are unchanged. The wording could materially mislead. | Create one **Unclear instruction** record; keep geometry evidence separate; suppress the wording until same-scope content correction and review close the risk. | Relabel as Wrong zone, claim geometry reverification passed from feedback, or keep materially misleading copy visible. |
| `PCOV-15`; `PCOV-15-SRC-v1` | Durable evidence confirms changed station geometry for one passage/target relationship. | Create one **Changed station geometry** record; set the exact row **Reverification required / ineligible**; preserve unaffected rows and prior versions. | Content-only edit, continued display, whole-system invalidation, or erased prior version. |
| `PCOV-16`; `PCOV-16-SRC-v1` | One sanitized report contains both a wrong-zone allegation and an unclear-instruction allegation for the same row/version. | Create two linked records, one **Wrong zone** and one **Unclear instruction**, each with independent triage, risk, correction, closure, and measurement disposition. | Combined category, **Other**, duplicate-free-text bucket, or one category hiding the other. |
| `PCOV-17`; `PCOV-17-SRC-v1` | A synthetic Release 2 package declares targets X-A and X-B but includes complete rows and evidence only for X-A and neither records nor explains X-B's exclusion. | Release 2 scope remains **Pending / no-go** for the declared package until X-B is evidenced or explicitly excluded and reviewed; Task 12 decides. | Treat partial package as complete, silently shrink target, or authorize release. |
| `PCOV-18`; `PCOV-18-SRC-v1` | One passing atomic row is proposed as authority for its entire complex, all directions, patterns, objectives, and targets. | Reject bulk enablement; only the exact row may proceed and every other combination omits positioning. | Complex-wide inheritance, assumed shared-platform coverage, or coverage-quantity waiver. |
| `PCOV-19`; `PCOV-19-SRC-v1` | Coverage numerator is 0 and the denominator is 0 or not fixed; no approved population, window, or exclusions exist. | Report **Not measured / Pending** only. | 100%, Pass, complete coverage, favorable rate, or release evidence. |
| `PCOV-20`; `PCOV-20-SRC-v1` | Branch A displays a recommendation without current route-direction orientation or verification date. Branch B retains an affected recommendation during an unresolved conflict. | Each branch is a blocking failure; capture exact visible and assistive omission failure, correct it, and rerun before Task 12 consideration. | Aggregate pass, warning-only treatment, hidden missing metadata, or recommendation survival during conflict. |

For `PCOV-08`, the required visible and assistive conflict result includes exact **Track change—check station signs** station context and exact **Service change—this train's downstream stops are not verified.** suppression explanation.

## Pending execution record for every fixture

| Fixture | Actual result | Reviewer decisions | Durable evidence and attachments | Correction | Rerun | Status |
|---|---|---|---|---|---|---|
| `PCOV-01` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `PCOV-02` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `PCOV-03` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `PCOV-04` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `PCOV-05` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `PCOV-06` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `PCOV-07` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `PCOV-08` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `PCOV-09` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `PCOV-10` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `PCOV-11` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `PCOV-12` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `PCOV-13` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `PCOV-14` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `PCOV-15` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `PCOV-16` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `PCOV-17` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `PCOV-18` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `PCOV-19` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |
| `PCOV-20` | **Pending — not observed** | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** | **Pending — none recorded** | **Pending — none recorded** | **Pending — not run** | **Not run — Pending** |

## Correction, review, and release boundary

Every future execution must bind one immutable product/build, this artifact, accepted Task 7–9 artifacts, the fixture's unique synthetic package, exact synthetic scope and timestamps, all 38 fields or fixed missing fields, exact visible and assistive output or omission, prohibited-result checks, all five same-version reviewer decisions, durable evidence, correction, preserved original result, rerun, and status.

These definitions are not executed evidence. They establish no real coverage, category, queue, row, field check, verifier, orientation, recommendation, feedback outcome, reviewer approval, metric, Gate 0 passage, Release 2 package, or authorization.

## Draft review checklist

- [ ] One row covers one exact atomic combination and contains all 38 fields.
- [ ] Every eligible row links one Task 7 record/version, durable field evidence, verification date, named verifier, and five same-version approvals.
- [ ] Priority uses exactly the five governed categories and never changes the evidence gate.
- [ ] Unsupported, incomplete, unresolved, or unreviewed combinations omit positioning.
- [ ] Coverage eligibility remains distinct from current platform state, positioning certainty, accessibility, and release authorization.
- [ ] Every reverification trigger makes only the affected row ineligible immediately and preserves prior evidence.
- [ ] Runtime conflict suppresses current output without rewriting structural evidence unless a durable relationship change is established.
- [ ] Feedback uses exactly **Wrong zone**, **Unclear instruction**, or **Changed station geometry**, and feedback never verifies.
- [ ] Release 2 evidence is reproducible for every declared target and exclusion; Task 12 alone decides.
- [ ] Release 3 applies the identical atomic gate and never bulk-enables uncovered scope.
- [ ] Zero or unfixed denominators remain **Not measured / Pending**.
- [ ] All 20 fixtures and every actual, reviewer, evidence, correction, rerun, and status field remain Pending.
- [ ] No real priority, coverage, geometry, output, reviewer, approval, metric, or authorization is claimed.

Every unchecked required item blocks coverage eligibility and Release 2 consideration. This documentation commit is not working-product evidence.
