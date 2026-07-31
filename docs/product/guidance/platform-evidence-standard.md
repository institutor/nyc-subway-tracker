# Platform guidance evidence standard

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§23.2, 29.4, 31.6 scenarios 33–34, and 33.1–33.2; accessibility and platform-guidance plan `Product artifact map` and Task 7 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks` |
| Owner | Guidance Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](platform-state-and-certainty-matrix.md#synthetic-acceptance-fixtures) |

## Purpose and authority

This standard owns the editorial evidence required before a platform-relative Front, Middle, or Back relationship can be considered. It defines one atomic guidance record, its exact scope, the evidence that must support it, non-inheritance rules, versioning, review, and reverification. It does not establish a live arrival, assign a platform, approve an accessible path, choose a rider objective, authorize presentation, establish station coverage, or make a release decision.

The companion [platform state and certainty matrix](platform-state-and-certainty-matrix.md) independently evaluates current platform state and positioning certainty. Arrival admission remains with the [arrival admission and ordering contract](../arrival-truth/arrival-admission-and-ordering-contract.md); reroutes and track conflicts remain with the [reroute and track-conflict playbook](../arrival-truth/reroute-and-track-conflict-playbook.md); suppression and recovery remain with the [suppression, grace, and recovery policy](../arrival-truth/suppression-grace-and-recovery-policy.md); corrections remain with the [provenance, quarantine, and correction policy](../arrival-truth/provenance-quarantine-and-correction-policy.md); and official source registration remains with the [source evidence register](../arrival-truth/source-evidence-register.md).

The [complete accessible-path contract](../accessibility/complete-path-contract.md), [station-direction accessibility coverage register](../accessibility/station-direction-coverage-register.md), and [Accessible Route Only state matrix](../accessibility/accessible-route-only-state-matrix.md) retain accessibility authority. The [Nearby card and direction contract](../nearby-offline/nearby-card-and-direction-contract.md) and [station board and controls contract](../nearby-offline/station-board-and-controls-contract.md) own surface placement without strengthening supplied truth. Shared concepts retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md), rider wording follows the [approved rider language rules](../contracts/rider-language-rules.md), and lifecycle decisions follow the [product artifact review and approval policy](../review-and-approval-policy.md). The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

This artifact is **Draft**. No real platform-guidance record, geometry package, actual-track coverage, field check, verification date, named verifier, rendered result, reviewer decision, approval, positioning coverage, or Release 2 evidence is demonstrated.

The authoritative [Gate 0 exit record](../quality/gate-0-exit-record.md) remains:

**NO-GO — GATE 0 NOT PASSED**

Public arrival boards remain blocked.

Accessibility, Nearby/offline, arrival-truth Gate 0, and platform-guidance release decisions remain separate. Evidence or a decision in one cannot waive another.

## Product Governance reconciliation

The artifact header and Draft [product artifact index](../artifact-index.md) row now align on approved specification §§23.2, 29.4, 31.6 scenarios 33–34, and 33.1–33.2, full Task 7 provenance, and Product, Accessibility, Data Quality, Content, and Operations review. That metadata alignment is not approval; every evidence package, reviewer decision, and lifecycle advancement remains **Pending**.

## Evidence layers remain separate

No source class is universally sufficient. A platform-relative recommendation can be considered only after its independent evidence layers are preserved and evaluated without substitution.

| Evidence layer | Question it answers | Permitted contribution | Cannot establish |
|---|---|---|---|
| Accepted operational truth | Is the affected arrival admitted, and what current direction, destination, service pattern, reroute, and track/path scope are supported? | Supplies the current train and operating scope after all arrival gates pass. | Platform geometry, field verification, an accessible path, or a zone recommendation. |
| Fresh exact actual-track evidence | Which exact directional platform is supported within the evidence horizon for this admitted arrival? | May support **Platform confirmed** only after two qualifying stable updates under the companion matrix. | A downstream platform beyond its horizon, positioning certainty, geometry, or an objective relationship. |
| Normal or scheduled platform evidence | What platform normally serves the exact route, direction, and supported service-pattern variation? | May support **Expected platform** when current operational evidence does not conflict. | Live confirmation, **Verified** positioning, recovery from a conflict, or a rerouted replacement platform. |
| Editorial geometry and field evidence | How do direction, orientation, zones, exits, transfers, street corners, elevators, boarding areas, and rider objectives relate on one exact platform? | May support **Verified** or **Expected** positioning only at the evidence level permitted by the companion matrix. | Arrival admission, current platform assignment, equipment operation, or release authorization. |
| Accessibility structural evidence | Does the exact platform and boarding area belong to a complete reviewed step-free chain? | Supplies an independently reviewed structural input to Accessible Route Only. | Current equipment availability, live platform confirmation, or a shortcut around missing geometry. |
| Same-version review decisions | Did every mandatory role approve the identical atomic record and evidence package? | Makes an otherwise complete record eligible for later coverage and state consideration. | Scenario passage, working-product behavior, Gate 0 passage, or Release 2 authorization. |

Missing, stale-under-owner-rule, contradictory, wrong-scope, unreviewed, or unavailable evidence in one layer cannot be filled by another. A platform can be confirmed while positioning remains Unavailable, and complete geometry can exist while the live platform remains unconfirmed.

## Atomic platform-guidance record

One record covers exactly:

> exact station complex + exact constituent station + route + supported service-pattern variation + normalized travel direction and destination context + exact directional platform and orientation + Front/Middle/Back geometry + one exact rider objective

A change to any term in that expression requires a separate record version or a separate atomic record. One record never transfers across another constituent station, route, direction, platform, service-pattern variation, objective, exit, transfer, street endpoint, accessible boarding area, or replacement platform.

### Required record fields

Every field is required unless its rule expressly permits a reviewed **Not applicable**. Blank, placeholder, inherited, unsupported, or differently versioned content leaves the record **Pending / ineligible**.

| Field | Required content | Acceptance boundary |
|---:|---|---|
| 1. Guidance record ID | Stable identity unique to this atomic scope | The ID cannot be reused for another station, direction, platform, pattern, or objective. |
| 2. Guidance record version | Immutable reviewed version | All evidence and decisions resolve to this same version. |
| 3. Station complex | Official identity and canonical rider-recognizable name | Complex identity supplies context only and cannot broaden constituent or platform scope. |
| 4. Exact constituent station | Official identity and name for the physical station containing the platform | Another constituent in the complex cannot substitute. |
| 5. Route | Exact rider-recognizable route supported by the record | Route color, shared track, or another service cannot substitute. |
| 6. Supported service-pattern variation | Ordinary, express/local variation, terminal pattern, or other exact pattern for which the geometry remains valid | Every reroute or changed pattern that can alter platform, orientation, stopping position, exit, transfer, or accessibility relationship requires explicit independent support. |
| 7. Normalized travel direction | Exact rider-facing direction with its source-to-normalized mapping | Raw north/south suffixes, numeric codes, opposite direction, or ambiguous direction cannot substitute. |
| 8. Destination or terminal context | Destination scope for which the direction and service-pattern relationship remains true | A scheduled or stale destination cannot override the current operating pattern. |
| 9. Exact directional platform | Stable identity and rider-recognizable description of the platform served in this scope | An ordinary, opposite-direction, nearby, rerouted, or replacement platform cannot inherit the record. |
| 10. Platform orientation | Fixed physical reference axis and the train-travel orientation for this route, direction, and pattern | Orientation must permit an independent reviewer to reproduce which physical end is Front and which is Back. |
| 11. Front/rear ordering | Explicit Front-to-Back ordering for the recorded travel direction | Reversal is not inferred from a label; it must be derived from supported direction and orientation evidence. |
| 12. Front/Middle/Back geometry | Reviewed physical extents of all supported zones for the exact direction and stopping relationship | A station entrance coordinate, platform midpoint guess, or equal-third assumption without fixed geometry fails. |
| 13. Stopping relationship | Supported train stopping envelope or other evidence needed to align the train with the platform zones | Missing or variable stopping evidence makes positioning Unavailable where the relationship cannot be reproduced. |
| 14. Objective type | Destination exit, transfer, or verified accessible boarding/exit relationship | Task 8 owns which objective the rider selects and how it is presented; this field only scopes the evidence. |
| 15. Objective-specific relationship | Exact reason the zone is useful for the recorded objective | The record names the relevant stair, passage, elevator, boarding area, or other verified relationship; “best” without a physical relationship fails. |
| 16. Relevant exits | Exact platform-to-exit relationships used by the objective | Unrelated or merely nearby exits cannot support the recommendation. |
| 17. Relevant street corners | Exact street endpoints reached by the recorded exit relationship | Public entrance coordinates alone are insufficient and cannot establish the platform-relative relationship. |
| 18. Relevant transfers | Exact arrival-platform, passage, level-change, and departure-platform relationship used by the objective | A complex-level transfer label or unverified passage fails. |
| 19. Elevator endpoints | Exact physical endpoints and station levels for every relevant elevator relationship | Equipment presence or a station badge cannot establish the platform or objective relationship. |
| 20. Accessible boarding areas | Exact boarding areas and their relationship to the verified complete accessible path | A zone recommendation cannot create or repair an accessible path. |
| 21. Explicitly unsupported scope | Every station part, route, direction, pattern, platform, zone, objective, exit, transfer, corner, elevator relationship, and boarding area not supported by this record | Silence never expands coverage. **None identified** requires fixed evidence and all same-version approvals. |
| 22. Durable source package | Immutable references to every map, diagram, measurement, operational source, and source revision used | A mutable view, meeting, memory, or undocumented assertion fails. |
| 23. Field-check evidence | Durable observations that reproduce platform orientation, zone geometry, and the objective relationship | **Not applicable** is not permitted for **Verified** positioning. |
| 24. Source and policy versions | Fixed versions of the evidence standard, companion matrix, applicable arrival truth, accessibility, terminology, and rider-language artifacts | Different-version evidence cannot be combined into one approval. |
| 25. Verification date | Date the exact relationship was verified | Missing or out-of-policy verification makes the claim Unavailable. Task 10 owns coverage-level currency rules. |
| 26. Named verifier and role | Actual identity and accountable role for the verification | A team name, document owner, repository author, or invented identity is insufficient. |
| 27. Reverification triggers | Every known change that invalidates or returns the record to review | The list must include the trigger classes below and may add narrower scope-specific triggers. |
| 28. Current record disposition | **Evidence-complete for state consideration**, **Pending / ineligible**, or **Rejected / ineligible**, with reason | This is an editorial evidence disposition only. It is not a live platform state or release decision. |
| 29. Prior version and correction history | Prior record, changed scope, correction owner, preserved adverse evidence, and linked rerun when applicable | A correction never overwrites the original record or creates positive actual-track evidence. |
| 30. Same-version reviewer decisions | Named Product, Accessibility, Data Quality, Content, and Operations reviewers; **Approve** or **Changes required**; decision dates; durable signatures/evidence | Silence, assignment, authorship, a meeting, or decisions on different versions fail. |

## Geometry and direction rules

1. Fix a physical reference axis before recording a rider-relative zone.
2. Resolve the current normalized direction and destination from accepted operational evidence.
3. Map that travel direction onto the physical reference axis.
4. Derive Front and Back for that exact direction and supported service pattern.
5. Reverse Front and Back when the supported direction reverses.
6. Keep Middle as Middle only when the field-checked geometry, stopping relationship, and objective evidence support it for the reversed direction.
7. Repeat review when a reroute, terminal pattern, express/local variation, platform change, or stopping relationship may change orientation.

Front and Back are not permanent names for physical platform ends. A record that stores only “front end” or “rear end” without its direction and physical reference cannot pass.

Task 7 authorizes no car-number precision. Front, Middle, and Back are the maximum positioning precision owned here. A later artifact may consider a car number only under the specification's separate train-specific evidence gate; this standard cannot pre-approve it.

## Public entrance coordinates are insufficient

An entrance coordinate answers where a street access point is. It does not establish:

- which constituent station, fare-control area, or level it reaches;
- where a stair, passage, elevator, or ramp meets the platform;
- the exact directional platform or boarding area;
- the train-travel orientation or Front-to-Back order;
- the Front/Middle/Back zone boundaries or stopping relationship;
- which exit, transfer, street corner, elevator endpoint, or accessible boarding area relates to a zone; or
- whether that relationship remains valid for a changed service pattern.

Therefore, public entrance coordinates alone cannot support **Platform confirmed**, **Verified**, **Expected**, a Front/Middle/Back claim, a transfer claim, or an accessible-path claim.

## Actual-track evidence horizon

Actual-track evidence is bounded to the exact accepted observation, train instance, station/constituent, direction, and operational horizon its owner supports.

- No downstream platform is **Platform confirmed** beyond that horizon.
- A near-term actual-track observation at one station cannot confirm another station.
- A platform assignment for one train cannot confirm another train.
- A scheduled continuation cannot extend an actual-track horizon.
- An admitted reroute cannot transfer ordinary-platform geometry to a replacement platform.
- A recovered arrival cannot restore a prior platform or positioning claim.

Beyond the actual-track horizon, the companion matrix may use **Expected platform** only when complete, current static evidence supports the exact scope and no conflict exists. Otherwise it uses **Check station signs** under its narrow rule. Positioning follows its own independent evidence and may remain Unavailable in either platform state.

## Evidence disposition

Apply this record decision before any platform-relative recommendation is considered:

| Evidence result | Record disposition | Downstream consequence |
|---|---|---|
| All 30 fields pass for one atomic scope and every mandatory reviewer approves the same version | **Evidence-complete for state consideration** | The companion matrix may evaluate current platform state and positioning certainty; no display or release is automatic. |
| Evidence affirmatively disproves a required geometry, orientation, scope, objective, or source relationship | **Rejected / ineligible** | No positioning claim appears for the rejected scope. |
| Any required field is missing, stale-under-owner-rule, ambiguous, contradictory, wrong-scope, inherited, unreviewed, or differently versioned | **Pending / ineligible** | Positioning is **Unavailable** and no positioning claim appears. |

**Evidence-complete for state consideration** is not **Platform confirmed**, **Verified** positioning, coverage eligibility, accessible-now evidence, or a release decision. Each later owner must still pass its own gate.

## Reverification and correction

A record returns to **Pending / ineligible** for the affected scope when any of the following becomes known or materially unresolved:

- station, constituent, platform, passage, exit, street-corner, stair, ramp, elevator endpoint, or boarding-area geometry changes;
- the route, normalized direction, destination, terminal behavior, service-pattern variation, stopping relationship, or platform use changes;
- a reroute or replacement platform is introduced;
- Front-to-Back orientation can no longer be reproduced;
- the objective relationship changes or a covered exit, transfer, elevator chain, or accessible boarding area changes;
- a source revision invalidates a recorded relationship;
- the verification date no longer satisfies Task 10's later currency rule;
- rider or operations feedback credibly identifies a wrong zone, unclear relationship, or changed station geometry; or
- an authorized correction marks the guidance unavailable.

Until a new immutable package passes the complete review, omit the affected positioning claim. Preserve the prior version, trigger, adverse evidence, correction, and rerun. A correction may remove or narrow guidance; it cannot invent geometry, actual-track evidence, a platform assignment, accessibility, or a passing review.

## Downstream ownership

| Downstream decision | Owner | Task 7 handoff |
|---|---|---|
| Rider objectives, benefit wording, Front/Middle/Back presentation, and accessible-priority experience | Task 8 `positioning-rider-experience.md` | Consume only atomic records and certainty outcomes; do not broaden scope or create car-number precision. |
| Station-by-station coverage, priority rollout, verification currency, and coverage reverification | Task 10 `platform-coverage-register.md` | Record only combinations that pass this standard; omission is the safe default. |
| Release 2 positioning and transfer go/no-go | Task 12 [accessibility and guidance release gates](../quality/accessibility-and-guidance-release-gates.md) | Require complete same-version evidence and reviewer decisions; this Draft supplies no authorization. |

## Current evidence inventory

| Evidence category | Current Task 7 result | Consequence |
|---|---|---|
| Real atomic platform-guidance records | **None** | No real platform-relative claim is eligible |
| Durable real geometry packages | **None** | Geometry is not demonstrated |
| Actual-track coverage observations | **None** | No platform is confirmed by this artifact |
| Field checks and verification dates | **None** | No positioning is Verified |
| Named verifiers | **None** | No real record can pass |
| Same-version reviewer decisions | Product, Accessibility, Data Quality, Content, and Operations all **Pending** | Artifact and records remain Draft/ineligible |
| Rendered visible and assistive evidence | **Not run — Pending** | Presentation is not demonstrated |
| Release 2 authorization | **Pending** | Platform guidance remains unauthorized |

The 13 synthetic fixtures in the [companion matrix](platform-state-and-certainty-matrix.md#synthetic-acceptance-fixtures) define expected decisions only. They contain no real station, field visit, source observation, coverage percentage, product result, or passing scenario.

## Draft review checklist

- [ ] Every future record contains all 30 required fields for one atomic scope.
- [ ] Direction, destination, platform, orientation, Front-to-Back order, zones, stopping relationship, and objective remain same-version and reproducible.
- [ ] Exits, transfers, street corners, elevator endpoints, and accessible boarding areas are exact rather than inferred.
- [ ] Unsupported scope is explicit.
- [ ] Public entrance coordinates never substitute for platform-relative geometry.
- [ ] Front and Back reverse with direction; Middle remains Middle only when evidence supports it.
- [ ] No downstream platform is confirmed beyond the actual-track evidence horizon.
- [ ] No car-number precision is authorized.
- [ ] Every reverification trigger fails closed and preserves correction/rerun history.
- [ ] Task 8, Task 10, and Task 12 ownership remains distinct.
- [ ] All real evidence, results, decisions, and approvals remain honestly Pending or absent.

Every unchecked required item blocks evidence completeness. This Draft and its documentation commit are not working-product evidence.

## Task 10 append-only coverage handoff and provenance

Task 10 changes none of the Task 7 rules or 30-field record definitions above. It applies approved specification §§23.7, 29.4, 30.2, 32.3–32.4, and 33.2; the accessibility and platform-guidance plan `Product artifact map` and full Task 10 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks`; accepted Task 7 commit `3d39129a58b497c92d0125569edebd894c47a71d` with this file's accepted pre-append blob `5aa640263da812458a6005de6e691801d24374f5`; accepted Task 8 commit `0fcb00265a23ea859681dfef7b6edad213c674df`; and accepted Task 9 commit `8e27ae2bd3b69c3946a9aba41adf7c76f36e00a5`.

The [platform guidance coverage register](platform-coverage-register.md) now owns the station-by-station eligibility row, review priority, coverage reverification, feedback taxonomy, and Release 2 evidence package. Its artifact header and Draft index row align on §§23.7, 29.4, 30.2, 32.3–32.4, and 33.2 plus full Task 10 provenance. That metadata alignment does not invent approval; every real coverage row, reviewer decision, and release disposition remains **Pending**.

### Required coverage handoff

Before this Task 7 record can support coverage eligibility, the same exact scope must also carry:

| Coverage handoff | Required binding |
|---|---|
| Coverage row and version | Exact immutable Task 10 row ID and version linked to this exact Task 7 record and version |
| Objective and target scope | One exact objective, one exact exit, corner, transfer, elevator, or boarding target, and one supported zone/benefit relationship |
| Supported and unsupported scope | Exhaustive route, direction, pattern, destination, platform, orientation, objective, target, exit, transfer, accessibility, and stopping scope |
| Priority evidence | Exact governed category plus immutable source, window, currency, coverage, selection method, and review; priority never changes evidence sufficiency |
| Eligibility and reverification | One current governed disposition, every trigger evaluated, no open trigger, and no inherited or bulk-enabled scope |
| Correction link | Every immutable feedback, adverse-evidence, prior-version, correction, closure, and rerun record, or reviewed None |
| Same-version decisions | Named Product, Accessibility, Data Quality, Content, and Operations decisions, dates, and durable evidence for the identical Task 7 and Task 10 versions |
| Release-package scope | Fixed package version, exact inclusion or exclusion, exact scope, fixed reason, and downstream lifecycle value exactly **Pending — Task 12 not yet decided** |

Coverage eligibility requires every Task 7 field above and all 38 Task 10 fields to pass. Field 38 is structurally complete when its package version, inclusion or exclusion, exact scope, and reason are fixed and its downstream lifecycle value is exactly **Pending — Task 12 not yet decided**. That exact value is the sole exception to the general unresolved-content rule; it grants no release authorization, and any other Pending or unresolved field 38 value fails. Until the governing artifacts are Approved, all five same-version decisions exist, reverification is Current, and no trigger remains open, the coverage row is ineligible and positioning is **Unavailable**. An eligible row only permits the companion matrix to begin its independent runtime evaluation while Task 12 remains Pending; it does not create **Platform confirmed**, **Verified**, **Accessible now**, current service, scenario passage, or release authorization.

Feedback is never verification. A material **Wrong zone** or **Changed station geometry** report makes the exact affected coverage row **Reverification required / ineligible** and the positioning claim **Unavailable** immediately. **Unclear instruction** remains a separate content issue when geometry is unchanged, but materially misleading wording is suppressed until correction review closes it. A multi-issue report becomes linked category records; no feedback record supplies a field check, verification date, orientation, actual-track evidence, or reviewer approval.

A transient reroute, platform ambiguity, or track conflict can suppress current guidance without rewriting the durable Task 7 record. Rewrite or supersede the structural record only when accepted evidence establishes a durable relationship change. Preserve unaffected rows, every prior version and decision, the trigger, adverse evidence, correction, and rerun.

Current real Task 10 coverage rows, eligible rows, field checks, verification dates, named verifiers, same-version approvals, outputs, feedback records, and Release 2 inclusions are all **0**, **None**, or **Pending**. The authoritative **NO-GO — GATE 0 NOT PASSED**, public-arrival-board block, separate accessibility no-go, and Task 12 Steps 5–13 **Pending** posture remain unchanged.
