# Accessible path-edge review checklist

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§19.1, 20.2, 21, and 33.3; accessibility and platform-guidance plan `Product artifact map` and Task 1 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks` |
| Owner | Accessibility Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Not run — Pending |

## Purpose and authority

This checklist applies the [complete accessible-path contract](complete-path-contract.md) to one fixed candidate chain. It gives reviewers a deterministic **Pass**, **Fail**, or **Unknown** decision for every required evidence field and for the complete street-to-street chain.

The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. Shared terms retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md), public wording remains governed by the [approved rider language rules](../contracts/rider-language-rules.md), and review decisions must follow the [product artifact review and approval policy](../review-and-approval-policy.md).

This checklist is an unpopulated review instrument. It contains no real station, entrance, route, direction, platform, path, equipment identity, verification date, fixed product version, observed result, approval, or reviewer decision.

This artifact is **Draft**. All four required representative traps are **Not run — Pending**.

The authoritative release decision remains:

**NO-GO — GATE 0 NOT PASSED**

Public arrival boards remain blocked.

Task 1 neither passes Gate 0 nor makes an accessibility release decision.

## Governance provenance reconciliation

The [artifact index](../artifact-index.md) currently cites specification §§19.1 and 21 for this checklist. The Task 1 brief requires the broader §§19.1, 20.2, 21, and 33.3 provenance above because the checklist also reviews escalator substitution, current-owner separation, and fail-closed completeness risk. Product Governance Lead reconciliation is **Pending** before advancement from **Draft**. This task does not edit the index or treat the mismatch as approved.

## Review dispositions

| Disposition | Exact meaning | Final-path effect |
|---|---|---|
| **Pass** | Evidence affirmatively satisfies the requirement for this exact edge, chain position, entrance, constituent station, route, direction, platform, and path scope. | The item may contribute to the cumulative result; it does not independently establish a complete path. |
| **Fail** | Evidence establishes that the requirement is not satisfied for this exact scope. | The reviewed chain is invalid for an accessible-now claim. |
| **Unknown** | Required evidence is missing, stale under its owner's rule, unmatched, ambiguous, contradictory, partially reviewed, wrong-scope, unavailable, or not yet accepted. | The reviewed chain is invalid for an accessible-now claim. Unknown is never treated as Pass. |

**Not applicable** is not a fourth disposition. It may be entered only as field content when the field permits it—for example, official equipment identity on an edge that uses no identified machine—and only with a reviewer-recorded reason. The review item still receives Pass, Fail, or Unknown.

## Fixed review-package record

Complete this record before evaluating edges. Blank, placeholder, or unversioned review-package fields make the result Unknown.

| Review-package field | Required record |
|---|---|
| Path-record identity | Stable identity for this candidate chain; no real value is supplied by Task 1 |
| Review purpose | Exact journey and claim being reviewed |
| Fixed product version | Immutable reviewed product version |
| Contract version | Fixed version of the complete-path contract and this checklist |
| Source package | Fixed structural, directional, equipment, service, and platform evidence package |
| Expected result | Expected complete-path disposition before observation |
| Prohibited result | Any accessibility inference or claim that must not occur |
| Actual result | Observed visible, assistive, and decision result |
| Evidence link | Durable link to the fixed evidence package |
| Reviewer | Named reviewer and role |
| Review date | Date of the decision |
| Disposition | Pass, Fail, or Unknown |
| Correction | Required correction, owner, and bounded scope, or **None** |
| Rerun | Rerun version, date, result, and evidence link, or **Not run** |

An expected result is not an actual result. A documentation commit, blank template, meeting, owner label, or unversioned screenshot is not evidence.

## Exact path-scope inventory

Record the scope below before edge review. A missing or Unknown required scope blocks the chain.

| Scope check | Required record | Pass condition | Fail or Unknown condition |
|---|---|---|---|
| Origin street boundary | Exact street endpoint and exact entrance at which the chain begins | The first edge begins at this boundary. | The review begins at a complex, badge, coordinate-only record, mezzanine, platform, or machine. |
| Origin constituent station | Exact constituent station served by the entrance and path | All origin edges remain within the reviewed constituent relationship. | Evidence is inherited from another constituent or complex-wide label. |
| Origin entrance | Exact entrance identity, street context, and permitted path relationship | The reviewed chain uses this exact entrance. | A nearby, same-name, wrong-corner, staircase-only, or unverified entrance is substituted. |
| Route and direction | Exact route and normalized rider travel direction for every subway leg | Every platform and boarding area serves the selected route and direction. | Direction is missing, opposite, ambiguous, raw-code-only, or invalidated by an unverified reroute. |
| Directional platform | Exact platform for every leg and transfer | Each platform is reached by the preceding verified edge and serves the next leg. | A station badge, ordinary platform assumption, or another platform substitutes. |
| Boarding area | Exact step-free boarding area for every leg | The preceding edge reaches the reviewed boarding area. | Platform access is mistaken for boarding-area access. |
| Transfer scope | Every required arrival platform, passage, level, outgoing platform, and boarding area in order | Every transfer subchain is complete and continuous. | A required passage is omitted, non-step-free, not officially accessible, or Unknown. |
| Destination platform | Exact platform reached by the final selected route and direction | It connects continuously to the reviewed exit path. | A destination station or complex label substitutes for the platform. |
| Exit path | Every required edge from the destination platform through fare control or mezzanine to the exact exit | Every edge is represented and reviewed. | Boarding accessibility is used to excuse a missing or broken exit chain. |
| Destination street boundary | Exact street endpoint at which the path ends | The final edge reaches this street boundary. | The review ends at a platform, mezzanine, exit coordinate, or station badge. |

## Ordered-chain completeness

Inventory every edge in travel order. Repeat the transfer passage → directional platform → boarding area → destination platform sequence for every transfer.

| Chain check | Pass | Fail | Unknown |
|---|---|---|---|
| The chain begins at the exact origin street entrance. | The first edge begins at the recorded boundary. | It begins inside the station or at another entrance. | The boundary is missing or unresolved. |
| Fare control or mezzanine connections are complete. | Every required vertical and horizontal edge is listed. | A listed edge is incompatible or discontinuous. | A required connection or level is not reviewed. |
| Every required transfer passage is represented. | Each required passage and intermediate level appears in order; a direct journey records why none is required. | A required passage is absent or fails. | Transfer need or passage evidence is unresolved. |
| The chain reaches the correct directional platform. | Exact route and direction agree with the platform evidence. | It reaches another direction, constituent, or unverified replacement platform. | Direction or platform scope is unresolved. |
| The chain reaches the required boarding area. | A verified step-free edge reaches the exact boarding area. | It reaches only the platform generally or a non-step-free area. | Boarding-area relationship is unresolved. |
| Every subway leg and transfer connects in order. | Each boarding area connects through the selected route and direction to the next reviewed platform. | A leg serves a different platform, route, direction, or destination. | Current service or platform relationship is unresolved. |
| The destination platform connects to a complete exit path. | Every exit edge is present and continuous. | The path is broken or reaches the wrong exit. | Any destination edge is unresolved. |
| The chain ends at the exact destination street. | The last edge reaches the recorded street boundary. | It ends inside the station. | The street endpoint is missing or unresolved. |
| Adjacent edge endpoints are continuous. | Every edge end equals the next edge start at the same physical location and level. | At least one physical or level gap exists. | Endpoint identity or level is unresolved. |

Any Fail or Unknown in this table invalidates the chain for an accessible-now claim.

## Seven-field edge review

Complete this review separately for every required edge. Evidence from one edge, entrance, direction, path, or machine cannot fill another edge's row.

| Required field | Pass test | Fail test | Unknown test | Required evidence reference |
|---:|---|---|---|---|
| 1. Movement type | The exact movement is recorded and valid for the reviewed step-free journey: elevator, compliant ramp, or verified level path. | Stairs are required, or an escalator is used as wheelchair-accessible substitution. | Movement type or suitability is missing, ambiguous, or unreviewed. | Structural edge source and reviewer disposition |
| 2. Physical endpoints and station levels | Exact start and end locations and levels are recorded and meet adjacent edges without a gap. | Endpoints or levels conflict, or a physical gap exists. | Either endpoint, level, or continuity relationship is missing or unresolved. | Endpoint/level evidence and chain-position record |
| 3. Relevant route and direction | The edge serves the exact route and normalized rider direction required at this chain position. | It serves a different direction, route, constituent, or platform. | Route, direction, reroute, or served-platform scope is missing or unresolved. | Directional and platform evidence |
| 4. Official equipment identity when applicable | The applicable machine is matched through its official identity; or a reviewed non-machine edge records **Not applicable** with reason. | An equipment-dependent edge uses a different machine or a description/name-only match. | Applicable identity is missing, unmatched, duplicated, or unjoinable. | Official inventory identity and match evidence |
| 5. Official accessible-path membership | The exact edge and scope have accepted official accessible-path membership. | Evidence establishes that the edge is not on the official accessible path. | Membership is absent, inherited, merely assumed from step-free geometry, or unresolved. | Official-path membership source |
| 6. Operating restrictions | All applicable direction, time, gate, access, boarding, rider-use, and other restrictions permit the journey; or an accepted source establishes none. | A restriction conflicts with the requested journey. | Restrictions are missing, stale under their owner's rule, contradictory, or unreviewed. | Restriction source and scope |
| 7. Verification date | A date exists for the exact structural relationship and satisfies the applicable currency/reverification rule. | The date is outside an accepted owner rule. | Date or governing currency decision is missing or unreviewed. | Verification record and later owner decision |

The edge review record must also contain its stable path identity, edge identity, ordered position, exact scope, source/evidence link, reviewer, review date, disposition, correction, and rerun history.

## Separate step-free, membership, and current-owner checks

These checks do not collapse into the seven-field table.

| Decision check | Pass | Fail | Unknown |
|---|---|---|---|
| Step-free movement | The movement is an accepted elevator, compliant ramp, or level path for the reviewed journey. | Stairs are required, or an escalator is offered as a wheelchair-accessible replacement. | Suitability is not established. |
| Official path membership | Accepted evidence places the exact edge on the official accessible path for this scope. | Accepted evidence excludes the edge. | Membership is missing, inherited, or unresolved. |
| Current route-critical availability | The later equipment owner supplies an accepted current available result for the exact official equipment identity. | The owner supplies a current unavailable result. | The result is missing, stale, failed, anomalous, provisional-empty, partial, unmatched, or otherwise unaccepted. |
| Current route, direction, and platform scope | Current owners confirm that the journey still uses the reviewed relationship. | Current evidence establishes another scope. | Reroute, platform, route, or direction scope is unresolved. |

Equipment presence, an empty outage response, a station badge, a neighboring path, a similar name, or a documentation record cannot pass current availability.

## Final path decision

Apply this decision in order:

1. Freeze one review package and exact journey scope.
2. Enumerate the entire street-to-street edge chain, including every repeated transfer subchain.
3. Complete every path-scope and ordered-chain check.
4. Review all seven fields for every required edge.
5. Apply the separate step-free, official-membership, current-availability, and current-scope checks.
6. Stop and reject the reviewed chain when any required result is Fail or Unknown.
7. If an alternate chain is proposed, review it under a separate path identity with a complete independent inventory and evidence package.
8. Mark a chain eligible for later accessible-now consideration only when every required result is Pass for that same chain.

| Final condition | Required disposition | Prohibited disposition |
|---|---|---|
| Every required result is Pass for one complete chain | **Complete chain passes Task 1 review**; send to later claim owner without creating a real accessible-now claim | Approved, released, accessible now, or working based on this checklist alone |
| Any required result is Fail | **Reject this chain** | Partial pass, badge-level accessibility, or substitution |
| Any required result is Unknown | **Reject this chain — required accessibility evidence is not confirmed** | Optimistic default, inherited evidence, or Unknown treated as available |
| One chain fails and an independently complete alternate has all Pass results | Reject the failed chain; keep only the independently complete alternate eligible for later consideration | Preserve the failed chain or borrow its evidence into the alternate |
| One chain fails and the alternate is partial or Unknown | Reject both chains | Accept the alternate because it is redundant in name only |

## Representative trap 1 — mezzanine-only elevator

| Evidence field | Record |
|---|---|
| Fixture | Abstract elevator reaches a mezzanine; no verified step-free edge continues to the correct directional platform |
| Expected result | Reject complete accessible path |
| Prohibited result | Infer platform access from elevator presence |
| Actual result | Not observed |
| Fixed product version | Not recorded |
| Evidence link | None |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Review date | Not recorded |
| Disposition | Pending |
| Correction | None recorded |
| Rerun | Not run |
| Evidence status | **Not run — Pending** |

## Representative trap 2 — non-step-free required transfer passage

| Evidence field | Record |
|---|---|
| Fixture | Abstract origin and destination have informational accessibility badges; one required transfer passage is not step-free |
| Expected result | Reject complete accessible path |
| Prohibited result | Accept because origin and destination stations have badges |
| Actual result | Not observed |
| Fixed product version | Not recorded |
| Evidence link | None |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Review date | Not recorded |
| Disposition | Pending |
| Correction | None recorded |
| Rerun | Not run |
| Evidence status | **Not run — Pending** |

## Representative trap 3 — failed required edge in chained elevator path

| Evidence field | Record |
|---|---|
| Fixture | Abstract multi-elevator chain has one required edge that is failed or currently unavailable |
| Expected result | Invalidate that chain |
| Prohibited result | Keep the path accessible through partial equipment |
| Actual result | Not observed |
| Fixed product version | Not recorded |
| Evidence link | None |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Review date | Not recorded |
| Disposition | Pending |
| Correction | None recorded |
| Rerun | Not run |
| Evidence status | **Not run — Pending** |

## Representative trap 4 — redundant complete chain

| Evidence field | Record |
|---|---|
| Fixture | Abstract primary chain fails; a separately identified alternate chain is proposed |
| Expected result | Keep only the independently complete alternate eligible when every alternate edge passes |
| Prohibited result | Inherit evidence from the failed chain or accept a partial alternate |
| Actual result | Not observed |
| Fixed product version | Not recorded |
| Evidence link | None |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Review date | Not recorded |
| Disposition | Pending |
| Correction | None recorded |
| Rerun | Not run |
| Evidence status | **Not run — Pending** |

## Review completion checklist

- [ ] The review package identifies one immutable product and contract version.
- [ ] Expected and prohibited results are recorded before observation.
- [ ] Actual visible, assistive, and decision results are recorded separately.
- [ ] The path begins at one exact origin street entrance.
- [ ] The path ends at one exact destination street endpoint.
- [ ] Fare control or mezzanine, every required transfer passage, correct directional platform, boarding area, destination platform, and exit path are present in order.
- [ ] Every required edge has a stable identity and ordered position.
- [ ] Every required edge has all seven evidence fields.
- [ ] Every edge-to-edge endpoint is continuous at the same physical location and level.
- [ ] Exact constituent station, entrance, route, direction, platform, boarding area, exit, and street scope are preserved.
- [ ] Every required movement passes the step-free test.
- [ ] Every required edge has accepted official accessible-path membership.
- [ ] Current availability comes only from its later authoritative owner.
- [ ] Restrictions and verification date pass their owner rules.
- [ ] No equipment presence, escalator, station badge, empty outage response, similar name, or neighboring chain supplies missing evidence.
- [ ] A failed or Unknown required edge invalidates its chain.
- [ ] Every alternate chain is reviewed independently without inherited evidence.
- [ ] Evidence link, reviewer, date, disposition, correction, and rerun fields are complete.
- [ ] Every required representative trap retains its actual evidence state; until observed, that state is **Not run — Pending**.
- [ ] No real station, path, equipment, availability, approval, Gate 0 passage, or accessibility release claim has been fabricated.

Every unchecked required item blocks review completion. A completed checklist is still not approval until all mandatory reviewers decide on the same fixed evidence package and every blocking scenario passes.
