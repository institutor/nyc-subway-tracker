# Station-direction accessibility coverage register

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§19.2, 21, 31.5, 32.2, and 33.3; accessibility and platform-guidance plan `Product artifact map`; Task 2 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks`; and Task 6 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps` Step 6, and `Evidence and acceptance checks` |
| Owner | Accessibility Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Not run — Pending |

## Purpose and authority

This register defines one atomic structural coverage record for an exact constituent-station, route or line, rider direction, entrance, platform, boarding area, and complete street-to-street accessible path. It is the structural input to later current-state and routing decisions; it is not a list of station badges and it is not a current equipment-status register.

The [complete accessible-path contract](complete-path-contract.md) controls path completeness and edge evidence. The [path-edge review checklist](path-edge-review-checklist.md) controls each fixed review, and the [station-direction review guide](station-direction-review-guide.md) controls partial-coverage and non-inheritance decisions. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. Shared terms retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md), and all decisions follow the [product artifact review and approval policy](../review-and-approval-policy.md).

This artifact is **Draft**. It contains a schema and an explicitly empty launch-coverage result. It contains no real station, constituent, route, direction, entrance, corner, platform, boarding area, path, edge, machine, source, verifier, reviewer decision, verification date, coverage approval, or Release 1 eligibility evidence.

The authoritative release decision remains:

**NO-GO — GATE 0 NOT PASSED**

Public arrival boards remain blocked.

Tasks 2 and 6 do not pass Gate 0, approve a station-direction combination, or make the Release 1 accessibility decision.

## Governance provenance reconciliation

The artifact header and Draft [artifact index](../artifact-index.md) row now align on approved specification §§19.2, 21, 31.5, 32.2, and 33.3, full Task 2 and Task 6 provenance, and Product, Accessibility, Data Quality, Content, and Operations review. That metadata alignment records the Release 1 handoff but does not manufacture approval; every coverage result, reviewer decision, and lifecycle advancement remains **Pending**.

## Atomic coverage unit

One row covers exactly one reviewed combination of:

> station complex + exact constituent station + route or line + normalized rider travel direction + exact accessible street entrance and corner + exact directional platform and boarding area + one ordered complete street-to-street path

Any change to the constituent station, line, direction, entrance, corner, platform, boarding area, service pattern, required edge, equipment chain, restriction, or path scope requires a separate row and an independent decision. A complex summary may point to rows; it cannot replace, merge, or broaden them.

### Required record schema

Every field below is atomic and required unless its rule expressly permits a reviewed **Not applicable** value. Blank, placeholder, inherited, wrong-scope, unreviewed, or stale-under-owner-rule content leaves the row **Pending / ineligible**.

| Field | Required record | Acceptance rule |
|---:|---|---|
| 1. Coverage record ID | Stable identity unique to this structural combination | The identity remains stable across versions and cannot be reused for another scope. |
| 2. Coverage record version | Immutable reviewed version | Every evidence item and reviewer decision resolves to this same version. |
| 3. Station complex | Official complex identity and canonical name | The value supplies context only; it confers no constituent, line, direction, entrance, or platform coverage. |
| 4. Exact constituent station | Official identity and canonical name for the exact constituent served by the path | Another constituent in the complex cannot substitute. |
| 5. Route or line | Exact official route or line served in this record | Another line, a matching route color, or complex-level service cannot substitute. |
| 6. Normalized rider travel direction | One rider-facing travel direction, with its fixed source-to-normalized mapping | Raw source codes, the opposite direction, and ambiguous direction labels cannot substitute. |
| 7. Exact accessible street entrance | Exact official entrance identity and description at which the path begins or ends | A nearby staircase, similarly described entrance, or another same-name station cannot substitute. |
| 8. Exact street corner | Exact street-corner relationship for that entrance | Another corner or proximity alone cannot inherit the entrance decision. |
| 9. Exact directional platform | Exact constituent-station platform serving the recorded route and direction | An ordinary, opposite-direction, rerouted, or replacement platform requires its own record. |
| 10. Exact boarding area reached | Exact step-free boarding area reached on the directional platform | General platform access does not establish boarding-area access. |
| 11. Ordered complete street-to-street path | One complete path in rider order from the exact street entrance through every required connection to the destination street | A station-level summary, partial chain, platform-only path, or entrance-only path fails. |
| 12. Ordered edge IDs | Every stable edge ID in the complete path, in travel order | The IDs trace to the same-version edge reviews with no gap or unexplained connection. |
| 13. Required official equipment identities | Every exact official identity used by a required equipment-dependent edge | Description-only, similar-name, neighboring, or presence-only matching fails. **Not applicable** is allowed only when fixed evidence shows that the complete path uses no identified machine and records why. |
| 14. Official accessible-path membership by edge | One explicit membership decision for every required edge in this path and exact scope | Merely step-free geometry or equipment presence never supplies membership; missing or Unknown membership fails. |
| 15. Operating restrictions | Every applicable direction, time, gate, access, boarding, rider-use, service-pattern, and other restriction | An explicit evidence-backed absence of restrictions may pass. Missing, contradictory, incompatible, or unresolved restrictions fail. |
| 16. Evidence sources | Named authoritative source set used for the structural decision | The source set supports this exact constituent, direction, entrance, platform, chain, and restriction scope. |
| 17. Durable evidence references | Repository-relative or otherwise durable references to the fixed source package and edge reviews | An unrecorded conversation, meeting, mutable view, or unsupported assertion fails. |
| 18. Verification date | Date on which this exact structural combination was verified | The date exists and satisfies the applicable owner currency and reverification rule. Missing or out-of-policy dates fail. |
| 19. Verifier | Named verifier and role responsible for the structural observation | An owner label, team name alone, or invented identity is not a verifier. |
| 20. Product decision and date | **Approve** or **Changes required**, named Product reviewer, and decision date for the same record version | Missing, silent, undated, or different-version review fails. |
| 21. Accessibility decision and date | **Approve** or **Changes required**, named Accessibility reviewer, and decision date for the same record version | Missing, silent, undated, or different-version review fails. |
| 22. Data Quality decision and date | **Approve** or **Changes required**, named Data Quality reviewer, and decision date for the same record version | Missing, silent, undated, or different-version review fails. |
| 23. Content decision and date | **Approve** or **Changes required**, named Content reviewer, and decision date for the same record version | Missing, silent, undated, or different-version review fails. |
| 24. Operations decision and date | **Approve** or **Changes required**, named Operations reviewer, and decision date for the same record version | Missing, silent, undated, or different-version review fails. |
| 25. Row-level structural coverage disposition | **Structurally accepted for current-state consideration**, **Structurally rejected / ineligible**, or **Pending / ineligible**, with reason | This is a structural decision only. It must not contain or imply current runtime equipment availability or an **accessible now** decision. |
| 26. Explicitly unsupported scope | Exact lines, directions, entrances, platforms, service patterns, and path scopes not supported by this row | Each category is stated explicitly. **None identified** is permitted only when fixed evidence and all required reviews support that exact bounded statement. Silence never expands coverage. |

The register has no current-runtime-status field. A row must not store **available**, **out of service**, **planned outage**, **Unknown**, freshness, restoration, or live service state in its structural disposition.

## Structural coverage and current availability stay separate

| Decision layer | Question | Record owner | Consequence |
|---|---|---|---|
| Structural coverage | Does one exact station-direction combination have a complete, officially supported, evidence-backed path? | This register and its same-version edge reviews | A passing row may be considered by later current-state owners; it does not establish accessibility now. |
| Current equipment availability | Are all route-critical machines currently acceptable under the later freshness, anomaly, identity, outage, and restoration rules? | Later equipment-status policy | A current result is consumed at decision time and never written into the row's structural eligibility field. |
| Current route, service, and platform scope | Is the service still using the exact reviewed route, direction, and platform? | Current arrival, service-change, and platform owners | A changed or unresolved scope fails closed; it does not rewrite or broaden the structural row. |
| Complete-path claim | Do the structural row, every required current equipment decision, and current route/platform scope all pass for the same chain? | Later Accessible Route Only and rider-experience owners | Only that cumulative decision can support **accessible now**. This register cannot. |

A current outage does not erase, delete, downgrade, or overwrite a valid structural record. It blocks the current journey claim while the outage decision applies. Conversely, an available machine cannot repair a missing structural edge, unsupported membership, wrong direction, or absent row.

## Non-inheritance rules

| Evidence held | Evidence that cannot inherit it | Required register behavior |
|---|---|---|
| Complex-level accessibility badge | Any station-direction row | Supply no row from the badge; require the complete atomic evidence package. |
| One constituent station | Another constituent in the same complex | Keep separate official constituent identities and separate rows. |
| One accessible line | Every other line in the complex | Record each line independently and list unsupported lines explicitly. |
| One travel direction | The opposite or an ambiguous direction | Use one normalized direction per row and reject the other unless it has its own complete row. |
| One directional platform | Any other, opposite-direction, ordinary, rerouted, or replacement platform | Require a separate platform-specific row and complete chain. |
| One accessible entrance and corner | A nearby staircase, wrong corner, similarly described entrance, or same-name station | Preserve exact official entrance identity and corner; reject substitution. |
| Merely step-free passage geometry | Official accessible-path membership | Require an explicit official membership decision for the exact edge and scope. |
| Equipment presence | Official-path membership or a complete chain | Require official identity, endpoints, edge membership, ordered continuity, restrictions, and verification. |
| Ordinary-platform coverage | A rerouted or replacement platform | Reject accessible routing for the replacement platform until its own complete row passes. |
| Same station name or matching route color | Station, constituent, route, entrance, platform, or equipment identity | Use official stable identities; names and colors alone cannot join or merge records. |
| Partial or incomplete row content | Eligibility or approval | A missing verification date, evidence item, required edge, restriction, reviewer decision, or unsupported-scope statement leaves the row **Pending / ineligible**. |

These rules apply even when the substitute appears physically close, operationally convenient, or likely to be equivalent. No proximity, label, badge, color, or equipment-presence inference is allowed.

## Row review and lifecycle

1. Freeze the record version, structural source package, complete path, and every edge review.
2. Confirm that the record represents exactly one constituent, line, normalized direction, entrance and corner, directional platform, boarding area, and complete path.
3. Trace every ordered edge ID to the [path-edge review checklist](path-edge-review-checklist.md).
4. Confirm official equipment identity where applicable, official accessible-path membership for every edge, all restrictions, verification date, and verifier.
5. Enumerate unsupported lines, directions, entrances, platforms, service patterns, and path scopes.
6. Apply every non-inheritance rule in the [station-direction review guide](station-direction-review-guide.md).
7. Obtain every required reviewer decision and date against the same immutable record version.
8. Set the structural row disposition without recording current runtime state.

Any missing, Unknown, wrong-scope, unreviewed, contradictory, or stale-under-owner-rule required fact makes the row **Pending / ineligible** or **Structurally rejected / ineligible**. It cannot support an accessible-now claim.

## Launch coverage result

| Register result | Current record | Evidence state |
|---|---|---|
| Station-direction structural rows | Empty — no real coverage row has been entered | **Not run — Pending** |
| Structurally accepted rows | None established | **Not run — Pending** |
| Release 1 eligible station-direction combinations | None established | **Not run — Pending** |
| Unsupported real-world combinations | Not enumerated; absence of a row is not evidence that a combination is inaccessible | **Not run — Pending** |

This empty result is an honesty boundary, not a network coverage measurement. The schema, expected rules, and documentation commit establish no real accessibility, no current availability, no coverage percentage, and no approval.

## Release 1 acceptance-pack handoff

The [Release 1 accessibility acceptance pack](accessibility-acceptance-pack.md) consumes only an immutable complete row with all 26 fields above. The shorter Task 6 list of entrance, line, direction, complete chain, restrictions, and verification date is a minimum highlight; it never reduces the controlling schema.

| Handoff key or result | Current Release 1 value | Evidence and release effect |
|---|---|---|
| Coverage record ID and version | **Pending — no real row exists** | No structural decision can be credited |
| Pack case and attempt | **Pending — no real row is bound** | No case may borrow absent coverage |
| Fixed package version | `A11Y-R1-PACK-v1` evidence-definition identifier only; fixed product/build **Pending** | Documentation identity is not execution evidence |
| Exact constituent, line, direction, entrance, corner, platform, boarding area, path, edges, equipment membership, restrictions, and unsupported scope | **Pending** | Missing or wrong-scope content remains **Pending / ineligible** |
| Source package, durable evidence, verification date, and verifier | **Pending** | No mutable page, expected prose, or commit supplies verification |
| Product, Accessibility, Data Quality, Content, and Operations decisions and dates | **Pending** | Silence or assignment is not approval |
| Structural disposition | **Pending / ineligible** | Structural disposition contains no runtime state and does not mean accessible now |
| Attempt disposition | **Not run — Pending** | Blocks Release 1 eligibility |
| Correction and separately linked rerun | **Pending — none recorded** | Any later correction preserves the original attempt |

The handoff contains zero real rows, zero structurally accepted rows, and zero established Release 1 eligible combinations. Absence of a row is not evidence that a real combination is inaccessible. A later handoff must key each attempt to the exact coverage record ID and immutable version, `A11Y-R1-PACK-v1` case and attempt, fixed product/build, complete evidence package, and same-version five-role decisions.

## Draft completion checklist

- [ ] Every real row, when later entered, contains all 26 atomic fields for one exact combination.
- [ ] Constituent, line, normalized direction, entrance, corner, platform, boarding area, chain, edge, and equipment identities remain exact.
- [ ] Every edge has explicit official accessible-path membership.
- [ ] Restrictions, evidence sources, durable references, verification date, verifier, reviewer decisions, and decision dates are complete.
- [ ] Unsupported lines, directions, entrances, platforms, service patterns, and path scopes are explicit.
- [ ] All eleven non-inheritance rules pass.
- [ ] Structural disposition contains no current runtime status.
- [ ] Current equipment and current service/platform decisions are consumed separately before any accessible-now consideration.
- [ ] Every applicable abstract fixture remains linked to an actual same-version result; currently all are **Not run — Pending**.
- [ ] Every Release 1 handoff binds an immutable 26-field coverage row to one pack case and attempt, one fixed package, durable evidence, and same-version five-role decisions.
- [ ] No real coverage, verification, approval, Gate 0 passage, or Release 1 eligibility has been fabricated.

Every unchecked item blocks row completion. Even a completed structural row remains insufficient for **accessible now** until every required current owner decision passes for that exact chain.
