# Accessible path-edge review checklist

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§19.1–19.2, 20.2, 21, 31.5, and 33.3; accessibility and platform-guidance plan `Product artifact map`; Task 1 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks`; Task 2 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks` |
| Owner | Accessibility Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Not run — Pending |

## Purpose and authority

This checklist applies the [complete accessible-path contract](complete-path-contract.md) to one fixed candidate chain. It gives reviewers a deterministic **Pass**, **Fail**, or **Unknown** decision for every required evidence field and for the complete street-to-street chain. Task 2 extends the instrument with the atomic record and non-inheritance checks used by the [station-direction coverage register](station-direction-coverage-register.md) and [station-direction review guide](station-direction-review-guide.md).

The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. Shared terms retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md), public wording remains governed by the [approved rider language rules](../contracts/rider-language-rules.md), and review decisions must follow the [product artifact review and approval policy](../review-and-approval-policy.md).

This checklist is an unpopulated review instrument. It contains no real station, entrance, route, direction, platform, path, equipment identity, verification date, fixed product version, observed result, approval, or reviewer decision.

This artifact is **Draft**. All four required Task 1 representative traps and all seven Task 2 directional-coverage fixtures are **Not run — Pending**.

The authoritative release decision remains:

**NO-GO — GATE 0 NOT PASSED**

Public arrival boards remain blocked.

Task 1 neither passes Gate 0 nor makes an accessibility release decision.

Task 2 preserves that boundary. It does not approve a station-direction row, pass Gate 0, or make the Release 1 accessibility decision.

## Governance provenance reconciliation

The artifact header and Draft [artifact index](../artifact-index.md) row now align on approved specification §§19.1–19.2, 20.2, 21, 31.5, and 33.3, the full Task 1–2 provenance, and Product, Accessibility, Data Quality, Content, and Operations review. That metadata alignment preserves the Task 1 history but is not approval; every same-version reviewer decision, edge review, and lifecycle advancement remains **Pending**.

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

For Task 2 application, expected result, prohibited result, actual result, fixed product version, evidence link, reviewer and review date, disposition, correction, and rerun remain separate fields. None may be combined, inferred from another, or replaced by a coverage-register disposition.

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

## Task 2 atomic station-direction application

Apply these checks to every proposed row in the [station-direction coverage register](station-direction-coverage-register.md). One row represents one exact structural combination; a changed constituent, line, direction, entrance, corner, platform, boarding area, service pattern, required edge, equipment chain, restriction, or path scope requires a separate row.

| Application check | Pass | Fail | Unknown |
|---|---|---|---|
| Stable record identity and version | One stable coverage ID and immutable version identify this exact combination. | An ID is reused for another scope or evidence crosses versions. | Identity, version, or version linkage is missing. |
| Station complex and exact constituent | Both official identities are recorded and every edge belongs to the exact constituent scope. | Complex-level or another-constituent evidence is substituted. | Constituent relationship is missing, ambiguous, or unreviewed. |
| Exact route or line | One official route or line is recorded and supported by the path. | Another line or matching route color is substituted. | Route identity or served scope is unresolved. |
| Normalized rider direction | One normalized direction and its source mapping are fixed for the row. | The opposite direction or a different direction is substituted. | Direction is absent, ambiguous, raw-code-only, or unreviewed. |
| Exact entrance and street corner | Official entrance identity, description, and exact corner match the first or final edge. | A nearby staircase, wrong corner, different entrance, or same-name station is substituted. | Entrance identity, corner, or edge relationship is unresolved. |
| Exact directional platform and boarding area | The chain reaches the exact platform and verified boarding area for the recorded route and direction. | General, opposite, ordinary, rerouted, or replacement-platform access substitutes. | Platform, route-direction relationship, or boarding-area scope is unresolved. |
| Complete chain and ordered edge IDs | The complete street-to-street chain and every stable edge ID are recorded in order without a gap. | A partial chain or discontinuous edge list is presented. | Any required edge, endpoint, or chain position is unresolved. |
| Required official equipment identities | Every equipment-dependent edge has the exact official identity; a no-machine chain records reviewed **Not applicable** with reason. | Presence, description, similar name, or neighboring equipment substitutes. | An applicable identity is missing, unmatched, duplicated, or unjoinable. |
| Official accessible-path membership | Every required edge has an explicit same-scope official membership decision. | Geometry or equipment presence is treated as membership. | Membership is missing, inherited, ambiguous, or unreviewed. |
| Operating restrictions | Every applicable direction, time, gate, access, boarding, rider-use, and service-pattern restriction permits the row's scope. | A restriction conflicts with the scope. | Restrictions are absent, stale under their owner rule, contradictory, or unreviewed. |
| Evidence, verification date, and verifier | Named sources, durable references, a valid structural verification date, and named verifier and role support this exact version. | Evidence establishes a different scope or the date fails an accepted owner rule. | Any source, reference, date, verifier, or currency decision is missing. |
| Required reviewer decisions and dates | Product, Accessibility, Data Quality, Content, and Operations decide on the same fixed row version and record dates. | Any required reviewer records **Changes required**. | A reviewer, decision, date, or same-version relationship is missing. |
| Explicit unsupported scope | Unsupported lines, directions, entrances, platforms, service patterns, and path scopes are each stated. | The row claims or implies a broader scope than its evidence. | Any unsupported-scope category is silent or unresolved. |
| Rerouted or replacement platform | The platform has its own complete row and every current owner confirms the same scope. | Ordinary-platform coverage is transferred to the replacement platform. | Replacement-platform coverage or current scope is missing or unresolved. |
| Structural/current separation | Structural disposition contains no runtime equipment, freshness, outage, restoration, route, or service state. | Current state is written into structural eligibility or an outage erases a structural row. | The layer or authoritative owner is unresolved. |

Any Fail or Unknown in this table makes the proposed row ineligible and blocks an accessible-now claim.

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

## Task 2 no-inheritance review

| Exact scope boundary | Required result | Prohibited inheritance |
|---|---|---|
| Complex | Require one complete atomic row; a complex badge supplies none. | Complex badge to any constituent, line, direction, entrance, platform, or path |
| Constituent station | Keep every official constituent separate. | One constituent to another constituent in the same complex |
| Route or line | Review each exact line independently. | One accessible line to every line in the complex, or matching route color to identity |
| Direction | Keep one normalized rider direction per row. | One direction to the opposite or an ambiguous direction |
| Platform and boarding area | Require the exact directional platform and exact boarding area. | One platform, general platform access, or ordinary platform to another platform |
| Entrance and corner | Require exact official entrance identity and street corner. | Accessible entrance to a nearby staircase, wrong corner, different entrance, or same-name station |
| Passage membership | Require explicit official accessible-path membership for the exact edge and scope. | Step-free geometry to official membership |
| Equipment and chain | Require official identity, endpoints, ordered edges, membership, restrictions, and verification. | Equipment presence to membership or a complete chain |
| Reroute scope | Require a complete replacement-platform row and current same-scope decisions. | Ordinary-platform coverage to a rerouted or replacement platform |
| Identity | Use official stable identities. | Shared name, description, proximity, or route color to station, entrance, route, platform, or equipment identity |
| Completeness | Require every atomic field, reviewer decision, and unsupported-scope statement. | Partial, missing, stale-under-owner-rule, or unreviewed evidence to eligibility |

The review must record each boundary separately. A pass at one boundary cannot compensate for a Fail or Unknown at another.

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
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
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
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
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
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
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
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Review date | Not recorded |
| Disposition | Pending |
| Correction | None recorded |
| Rerun | Not run |
| Evidence status | **Not run — Pending** |

## Task 2 directional and partial-coverage fixtures

The detailed abstract records and pass/fail branches are in the [station-direction review guide](station-direction-review-guide.md). Each later execution must use the separate fixed review-package fields above.

| Fixture | Expected result | Prohibited result | Current state |
|---|---|---|---|
| Direction-specific coverage | Accept only the independently complete covered direction; reject the other | Complex or line badge covers both directions | **Not run — Pending** |
| Partial complex | Accept only the exact constituent and line combination with a complete row | One accessible line covers the whole complex | **Not run — Pending** |
| Mezzanine-only elevator | Reject because the chain does not reach the correct platform and boarding area | Elevator presence creates coverage | **Not run — Pending** |
| Same-name stations with different corners | Keep records separate by official station and entrance identity | Name or proximity merges coverage | **Not run — Pending** |
| Wrong or nearby entrance | Reject the substituted entrance | Nearest staircase or corner inherits the accessible entrance | **Not run — Pending** |
| Rerouted train on unverified platform | Reject accessible routing for the replacement platform | Ordinary-platform coverage transfers to the reroute | **Not run — Pending** |
| Step-free but non-official passage | Reject official accessible-path membership and the complete chain | Geometry alone proves an official accessible path | **Not run — Pending** |

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
- [ ] The coverage record uses one stable ID and one immutable version for exactly one atomic station-direction combination.
- [ ] Station complex and exact constituent station are both recorded without complex-level inheritance.
- [ ] Route or line and normalized rider direction are exact and independently supported.
- [ ] Exact entrance identity and street corner are preserved; nearby, wrong-corner, and same-name substitutions are rejected.
- [ ] Exact directional platform and boarding area are supported; rerouted or replacement platforms require their own complete row.
- [ ] The ordered complete chain and all edge IDs are recorded with no gap.
- [ ] Every required movement passes the step-free test.
- [ ] Every required edge has accepted official accessible-path membership.
- [ ] Every required official equipment identity is recorded without name, description, presence, or proximity inference.
- [ ] Current availability comes only from its later authoritative owner.
- [ ] Restrictions and verification date pass their owner rules.
- [ ] Evidence sources, durable references, verifier, and all required same-version reviewer decisions and dates are complete.
- [ ] Unsupported lines, directions, entrances, platforms, service patterns, and path scopes are explicit.
- [ ] All complex, constituent, line, direction, platform, entrance, same-name-station, equipment, passage, and reroute non-inheritance checks pass.
- [ ] Structural eligibility contains no current runtime status, and an outage does not erase a structural row.
- [ ] No equipment presence, escalator, station badge, empty outage response, similar name, or neighboring chain supplies missing evidence.
- [ ] A failed or Unknown required edge invalidates its chain.
- [ ] Every alternate chain is reviewed independently without inherited evidence.
- [ ] Evidence link, reviewer, date, disposition, correction, and rerun fields are complete.
- [ ] Every required representative trap retains its actual evidence state; until observed, that state is **Not run — Pending**.
- [ ] Every Task 2 directional and partial-coverage fixture retains its actual evidence state; all seven are **Not run — Pending**.
- [ ] No real station, path, equipment, availability, approval, Gate 0 passage, or accessibility release claim has been fabricated.

Every unchecked required item blocks review completion. Any missing, Unknown, wrong-scope, unreviewed, contradictory, or stale-under-owner-rule required fact fails closed for an accessible-now claim. A completed checklist is still not approval until all mandatory reviewers decide on the same fixed evidence package and every blocking scenario passes.
