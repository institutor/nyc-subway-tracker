# Complete accessible-path contract

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

This contract owns the controlling definition of a complete step-free subway journey, the evidence required for every path connection, and the fail-closed rule that governs whether a complete path may support an **accessible now** claim. It begins at the origin street and ends at the destination street. A station badge, station complex, entrance coordinate, equipment list, platform alone, boarding-only path, or destination-platform-only path is never a complete journey.

The companion [path-edge review checklist](path-edge-review-checklist.md) turns this contract into a deterministic review record. Shared terms retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md), and rider-facing wording remains governed by the [approved rider language rules](../contracts/rider-language-rules.md). The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

This artifact defines required structure and decision boundaries. It does not establish coverage for any real station, entrance, route, direction, platform, path, or machine. It does not determine current equipment status, prove restoration, approve an accessible route, supply offline wording, or make a release decision. Those decisions remain with their later owning artifacts and evidence.

This artifact is **Draft**. No real path record, equipment record, verification date, fixed product version, observed result, approval, or reviewer decision exists.

The authoritative release decision remains:

**NO-GO — GATE 0 NOT PASSED**

Public arrival boards remain blocked.

Task 1 neither passes Gate 0 nor makes an accessibility release decision.

## Governance provenance reconciliation

The [artifact index](../artifact-index.md) currently cites specification §19.1 for this contract. The Task 1 brief requires the broader §§19.1, 20.2, 21, and 33.3 provenance recorded above because the contract also governs elevator/escalator substitution, acceptance traps, and fail-closed accessibility completeness. Product Governance Lead reconciliation of the index and this metadata is **Pending** before this artifact may advance from **Draft**. This task does not edit the index or manufacture approval.

## Controlling street-to-street path

The complete rider path is exactly:

> Street entrance → fare control or mezzanine → any required transfer passage → correct directional platform → boarding area → destination platform → exit path → street

The ordered chain is interpreted as follows:

| Ordered stage | Required scope | Completeness rule |
|---:|---|---|
| 1. Street entrance | One exact origin street entrance and its origin-street boundary | The chain cannot begin at a station complex, station badge, mezzanine, platform, or equipment record. |
| 2. Fare control or mezzanine | Every required connection from the exact entrance through the applicable fare-control and mezzanine levels | Every vertical and horizontal change must be represented by an ordered edge with no unexplained physical gap. |
| 3. Any required transfer passage | Every passage, intermediate level, and connection needed to move between arrival and departure platforms | Repeat this stage for every transfer. A direct journey may mark the stage **Not required** only with an explicit reason; it may not silently omit an unresolved passage. |
| 4. Correct directional platform | The exact constituent station, route, rider travel direction, and platform reached by the verified chain | An opposite direction, another constituent station, an ordinary platform, or a same-name station cannot substitute. |
| 5. Boarding area | The verified step-free boarding area serving the selected direction | Reaching a platform without reaching the required boarding area is incomplete. |
| 6. Destination platform | The exact platform reached by the selected route and direction, including every repeated transfer subchain before the final leg | Route and direction continuity must connect each boarding area to the intended downstream platform; an unverified rerouted platform fails closed. |
| 7. Exit path | Every required edge from the destination platform through passages, levels, fare control, and the exact exit | Step-free boarding does not compensate for a missing or broken destination exit chain. |
| 8. Street | One exact destination-street endpoint reached by the exit path | The chain cannot end at a destination platform, mezzanine, exit coordinate, or station badge. |

For a journey with multiple subway legs, stages 3 through 6 repeat in travel order for every transfer. Each repeated passage, directional platform, and boarding area remains independently reviewed. A summary line or complex-level relationship cannot replace the ordered edges.

## Required edge record

Every required physical path connection has one edge record. Each record carries the seven evidence fields below.

| Required evidence field | Required content | Pass condition | Fail-closed condition |
|---:|---|---|---|
| 1. Movement type | Elevator, compliant ramp, level path, stairs, or escalator | The recorded movement is physically compatible with the reviewed step-free journey. | Missing or Unknown type, stairs, or an escalator used as wheelchair-accessible substitution blocks the edge. |
| 2. Physical endpoints and station levels | Exact start and end locations, including constituent station area and level at each endpoint | Both endpoints are specific, reviewed, and physically connected by this edge. | A vague endpoint, wrong level, unexplained gap, or endpoint that does not meet the adjacent edge blocks the chain. |
| 3. Relevant route and direction | Exact route and rider travel direction served by the connection, including shared scope only when that scope is verified | The edge serves the route and correct directional platform required by this journey. | Missing, opposite, ambiguous, wrong-constituent, or unverified reroute scope blocks the edge. |
| 4. Official equipment identity when applicable | Exact official machine identity for an elevator, escalator, or other identified route-critical machine | The applicable machine is joined through its official identity. **Not applicable** is permitted only for a reviewed edge that uses no identified machine. | Missing, unmatched, description-only, similar-name, or neighboring-machine identity blocks an equipment-dependent edge. |
| 5. Membership in an official accessible path | Explicit reviewed membership for this exact edge and scope | Official accessible-path membership is supported for the same endpoints, route, direction, and chain. | Missing, Unknown, merely step-free, or inherited membership blocks the edge. |
| 6. Operating restrictions | Every applicable direction, time, gate, access, boarding, rider-use, or other operating restriction | The restrictions permit the reviewed journey in its exact scope. An explicit reviewed absence of restrictions is acceptable evidence. | Missing, Unknown, contradictory, or incompatible restrictions block the edge. |
| 7. Verification date | Date on which the exact structural relationship was verified | A date exists and satisfies the later owner's currency and reverification rules. | Missing, unreviewed, or out-of-policy verification blocks the edge. Task 1 supplies no real date or currency threshold. |

Each edge record also requires:

- a stable path-record identity;
- a stable edge-record identity;
- its ordered position in the chain;
- a source or evidence reference;
- a review disposition; and
- the exact path scope needed to prevent evidence from being inherited by another entrance, constituent station, route, direction, platform, or chain.

These traceability fields make the seven evidence fields reviewable. They do not replace any of them and do not authorize an accessible-now claim.

## Structural evidence and current availability are separate

Physical presence, structural membership, and current operation are distinct decisions.

| Decision layer | Question | Owner boundary | Task 1 consequence |
|---|---|---|---|
| Edge identity and structural relationship | What exact locations does this connection join, for which route and direction, and is it part of an official accessible path? | This contract defines the required evidence; later directional coverage review supplies fixed records. | Missing, Unknown, wrong-scope, or unreviewed structural evidence fails closed. |
| Step-free suitability | Is the movement itself valid for the reviewed step-free journey? | This contract defines the movement test. | Stairs fail. An escalator cannot substitute for an elevator in wheelchair-accessible routing. |
| Current equipment availability | Is each route-critical machine currently available under accepted freshness, anomaly, matching, and restoration rules? | The later equipment-status policy owns the current machine state and restoration decision. | Task 1 consumes that result only; equipment presence, an empty outage response, or a documentation commit cannot create availability. |
| Current service and platform scope | Does the current route and direction still use the reviewed platforms and connections? | Arrival-truth, service-change, directional-coverage, and later platform owners retain their decisions. | A wrong direction or unverified replacement platform cannot inherit structural approval. |
| Complete-path claim | Do all required edges and all current owner decisions pass for the same ordered chain? | Later Accessible Route Only and rider-experience artifacts consume this contract. | Only the cumulative pass result may be considered for **accessible now**; Task 1 itself makes no such real-world claim. |

A structurally verified chain with Unknown current equipment status is not accessible now. A current machine state without verified structural path membership is not an accessible path. Neither layer may infer or overwrite the other.

## Presence and substitution prohibitions

- An elevator may physically exist without completing an accessible path.
- An elevator that reaches only a mezzanine fails when no verified step-free edge continues to the correct directional platform and boarding area.
- A merely step-free passage fails when accepted official accessible-path membership is missing or Unknown.
- Stairs are never step-free.
- An escalator may support a separate **Avoid stairs** preference only. It never substitutes for an elevator in wheelchair-accessible routing.
- A station-complex accessibility badge is informational only and supplies none of the seven edge evidence fields.
- An entrance coordinate identifies a street location only; it does not prove where or how a path reaches fare control, a mezzanine, a passage, a directional platform, a boarding area, or an exit.
- An equipment list, neighboring path, same-name station, nearby entrance, opposite direction, or accessible constituent does not transfer evidence to this chain.
- An empty, stale, failed, anomalous, partial, or unmatched status response never proves that equipment is available, operational, or working.

The words **available**, **accessible**, **operational**, and **working** are never inferred from presence, a badge, a neighboring chain, or missing outage evidence.

## Chain validity

Each candidate chain is evaluated independently and cumulatively.

1. Enumerate the entire ordered street-to-street chain, repeating transfer stages as required.
2. Confirm exact origin and destination street boundaries.
3. Confirm edge-to-edge endpoint continuity with no unexplained gap.
4. Review all seven evidence fields for every required edge.
5. Confirm each edge is step-free, official-path supported, route- and direction-correct, within restrictions, and structurally verified.
6. Consume current availability only from its authoritative owner for every route-critical edge.
7. Apply current route, direction, platform, and service scope without inheriting approval from another path.
8. Produce the final path disposition.

| Cumulative result | Path disposition | Claim consequence |
|---|---|---|
| Every required edge passes structurally, every endpoint is continuous, and every current owner result passes for the same chain | Eligible to be considered by the later complete-path claim owner | Task 1 still makes no real accessible-now claim or release decision. |
| Every structural check passes but any required current availability result is Unknown, stale, absent, or otherwise unaccepted | Current availability not confirmed | Block **accessible now**. Do not relabel presence as availability. |
| Any required edge is missing, Failed, Unknown, stale under its owner's rule, wrong-scope, wrong-direction, wrong-entrance, unreviewed, or discontinuous | Chain invalid for the requested journey | Reject that chain from an accessible-now result. |
| No complete chain remains | No complete path established | Withhold an accessible-now route. Later rider-copy owners govern the exact message. |

**Pass** means the required evidence supports the exact reviewed edge. **Fail** means evidence establishes that the requirement is not satisfied. **Unknown** includes missing, ambiguous, stale, unmatched, contradictory, partially reviewed, wrong-scope, or unavailable required evidence. Unknown is never treated as Pass.

## Chained and redundant paths

One failed or Unknown required edge invalidates that entire chain. A successful origin edge, station badge, available first elevator, or accessible destination cannot rescue a broken transfer, platform, boarding, or exit edge.

An alternate chain remains eligible only when:

- it has its own path identity and complete ordered edge inventory;
- every edge has its own seven-field evidence review;
- every endpoint connects continuously within that alternate chain;
- its exact entrance, constituent station, route, direction, platform, boarding area, exit, and street scope pass;
- every edge is independently step-free and an accepted member of an official accessible path;
- every route-critical current availability result passes; and
- it borrows no evidence, current state, or review disposition from a failed chain.

Failure of one chain does not automatically invalidate an independently complete alternate chain or the entire station complex. Conversely, the existence of a purported alternate never preserves the failed chain or authorizes a partial alternate.

## Required pending acceptance traps

The [path-edge review checklist](path-edge-review-checklist.md) contains the fixed expected and prohibited outcomes for:

1. a mezzanine-only elevator;
2. a non-step-free required transfer passage;
3. a failed required edge in a chained elevator path; and
4. a redundant complete chain.

All four are **Not run — Pending**. Expected contract prose and this documentation commit are not working-product evidence.

## Ownership and downstream use

| Decision or evidence | Authoritative owner | Current disposition |
|---|---|---|
| Complete street-to-street definition, seven edge evidence fields, cumulative failure, and redundancy rule | This contract, Task 1 | Draft; no real coverage or observed evidence |
| Deterministic review record and four representative traps | [Path-edge review checklist](path-edge-review-checklist.md), Task 1 | Draft; all traps Not run — Pending |
| Constituent-station, entrance, route, direction, platform, and verified chain coverage | Planned Task 2 accessibility artifacts | Absent; no coverage claim |
| Accessible Route Only behavior, offline wording, and valid-path ranking | Planned Task 3 accessibility artifacts | Absent; no rider-facing claim |
| Current equipment truth, matching, freshness, anomaly, and restoration | Planned Task 4 equipment artifacts | Absent; current availability cannot be claimed |
| Path impact, rerouting, and underway warnings | Planned Task 5 accessibility artifacts | Absent |
| Fixed scenario and Release 1 accessibility evidence | Planned Tasks 6 and 12 quality artifacts | Absent; no accessibility release decision |

## Draft review checklist

| Review question | Required Draft result | Evidence required later |
|---|---|---|
| Does the definition begin at the exact origin street entrance and end at the destination street? | Yes by contract. | Fixed complete-chain review |
| Are fare control or mezzanine, every required transfer passage, correct directional platform, boarding area, destination platform, exit path, and street all represented in order? | Yes by contract. | Fixed edge inventory |
| Does every required edge carry all seven evidence fields? | Required; no real edge record exists. | Same-version edge records and sources |
| Are structural membership and current availability separate owner decisions? | Yes. | Task 2 structural coverage and Task 4 current-state evidence |
| Can equipment presence, an escalator, a badge, an empty outage response, or a neighboring chain create accessibility? | No. | Prohibited-result checks |
| Does one failed required edge invalidate its chain while leaving only an independently complete alternate eligible? | Yes. | Four Task 1 trap observations |
| Does this Draft claim a real station, path, machine, date, current availability, approval, scenario passage, Gate 0 passage, or release decision? | No. | Complete governed evidence and later release review |
