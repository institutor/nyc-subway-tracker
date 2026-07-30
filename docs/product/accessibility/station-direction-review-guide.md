# Station-direction accessibility review guide

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§19.1–19.2, 21, 31.5, and 33.3; accessibility and platform-guidance plan `Product artifact map` and Task 2 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks` |
| Owner | Accessibility Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Not run — Pending |

## Purpose and authority

This guide prevents a valid path for one constituent station, line, direction, entrance, corner, platform, or service pattern from being generalized to another. It applies the [complete accessible-path contract](complete-path-contract.md), the [station-direction coverage register](station-direction-coverage-register.md), and the [path-edge review checklist](path-edge-review-checklist.md) to seven abstract partial-coverage traps.

The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. Shared terms retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md), and all decisions follow the [product artifact review and approval policy](../review-and-approval-policy.md).

This artifact is **Draft**. The examples below define expected and prohibited branches only. They contain no real station, route, direction, entrance, platform, path, equipment, verification, observed behavior, approval, or coverage evidence. All seven fixtures are **Not run — Pending**.

The authoritative release decision remains:

**NO-GO — GATE 0 NOT PASSED**

Public arrival boards remain blocked.

Task 2 does not pass Gate 0, approve any coverage record, or make the Release 1 accessibility decision.

## Governance provenance reconciliation

The [artifact index](../artifact-index.md) cites specification §§19.1–19.2 for this guide. Task 2 also applies the acceptance and risk branches in §§21, 31.5, and 33.3 and the plan's full Task 2 provenance, as recorded above. Product Governance Lead reconciliation of the index and this metadata is **Pending** before this artifact may advance from **Draft**. This task does not edit the index or treat the mismatch as approved.

## Review method

For each fixture or later real review:

1. Freeze the product version, coverage-record version, structural evidence package, and path-edge reviews.
2. Record the expected result and prohibited result before observation.
3. Identify one exact constituent station, route or line, normalized rider direction, entrance and corner, directional platform, boarding area, complete chain, and unsupported scope.
4. Confirm official identities rather than matching by complex badge, name, color, description, or proximity.
5. Confirm every ordered edge, every required official equipment identity, and official accessible-path membership for each edge.
6. Confirm restrictions, verification date, verifier, durable evidence, and all required same-version reviewer decisions.
7. Record the actual result, fixed version, evidence, reviewer, disposition, correction, and rerun separately; expected prose is never actual evidence.
8. Fail closed for any missing, Unknown, wrong-scope, unreviewed, contradictory, or stale-under-owner-rule required fact.

### Decision branches

| Review outcome | Coverage-record consequence | Accessible-now consequence |
|---|---|---|
| Every structural fact passes for the one exact atomic scope | The row may be **Structurally accepted for current-state consideration** after all required same-version reviewer approvals | Still blocked until current equipment, route, service, and platform decisions pass for the same chain |
| Evidence affirmatively disproves a required structural fact | **Structurally rejected / ineligible** | Reject the chain |
| Any required fact is missing, Unknown, wrong-scope, unreviewed, contradictory, or stale under its owner rule | **Pending / ineligible** | Reject the chain; never infer or inherit the missing fact |

An outage does not erase a structural row. Current availability is not entered in the structural disposition. An available machine does not create official-path membership or repair an incomplete chain.

## Fixture summary

| Fixture | Expected result | Prohibited result | Current state |
|---|---|---|---|
| Direction-specific coverage | Accept only the independently complete covered direction; reject the other | Complex or line badge covers both directions | **Not run — Pending** |
| Partial complex | Accept only the exact constituent and line combination with a complete row | One accessible line covers the whole complex | **Not run — Pending** |
| Mezzanine-only elevator | Reject because the chain does not reach the correct platform and boarding area | Elevator presence creates coverage | **Not run — Pending** |
| Same-name stations with different corners | Keep records separate by official station and entrance identity | Name or proximity merges coverage | **Not run — Pending** |
| Wrong or nearby entrance | Reject the substituted entrance | Nearest staircase or corner inherits the accessible entrance | **Not run — Pending** |
| Rerouted train on unverified platform | Reject accessible routing for the replacement platform | Ordinary-platform coverage transfers to the reroute | **Not run — Pending** |
| Step-free but non-official passage | Reject official accessible-path membership and the complete chain | Geometry alone proves an official accessible path | **Not run — Pending** |

## Fixture 1 — direction-specific coverage

| Review field | Abstract record |
|---|---|
| Setup | One normalized travel direction has an independently complete structural row; the opposite direction has no complete row. |
| Expected result | Keep only the independently complete covered direction eligible for later current-state consideration; reject the opposite direction. |
| Prohibited result | Treat a complex badge, line label, shared entrance, or platform proximity as coverage for both directions. |
| Pass branch | The records remain direction-specific and the unsupported direction is explicit. |
| Fail branch | The opposite direction inherits coverage or disappears from unsupported scope. |
| Actual result | Not observed |
| Fixed product version | Not recorded |
| Evidence | None |
| Reviewer | Not assigned |
| Disposition | Pending |
| Correction | None recorded |
| Rerun | Not run |
| Evidence status | **Not run — Pending** |

## Fixture 2 — partial complex

| Review field | Abstract record |
|---|---|
| Setup | One exact constituent and line combination has a complete row; another constituent or line in the complex does not. |
| Expected result | Keep only the exact supported constituent and line combination eligible; list the other scope as unsupported. |
| Prohibited result | Treat one accessible line or constituent as proof that the whole complex is accessible. |
| Pass branch | Constituent and line identities remain separate and unsupported scope is explicit. |
| Fail branch | A complex-wide label merges or broadens the row. |
| Actual result | Not observed |
| Fixed product version | Not recorded |
| Evidence | None |
| Reviewer | Not assigned |
| Disposition | Pending |
| Correction | None recorded |
| Rerun | Not run |
| Evidence status | **Not run — Pending** |

## Fixture 3 — mezzanine-only elevator

| Review field | Abstract record |
|---|---|
| Setup | An identified elevator reaches a mezzanine, but no verified step-free edge continues to the correct directional platform and boarding area. |
| Expected result | Reject the incomplete chain and leave the combination ineligible. |
| Prohibited result | Create coverage from elevator presence or from reaching the mezzanine. |
| Pass branch | The missing platform and boarding-area continuation fails the complete chain. |
| Fail branch | Equipment presence fills the missing edge or official-path membership. |
| Actual result | Not observed |
| Fixed product version | Not recorded |
| Evidence | None |
| Reviewer | Not assigned |
| Disposition | Pending |
| Correction | None recorded |
| Rerun | Not run |
| Evidence status | **Not run — Pending** |

## Fixture 4 — same-name stations with different corners

| Review field | Abstract record |
|---|---|
| Setup | Two officially distinct station or entrance identities share a displayed name but have different accessible street corners. |
| Expected result | Keep separate records keyed to official station, constituent, entrance, and corner identities. |
| Prohibited result | Merge coverage because the names match or the locations are near one another. |
| Pass branch | Each identity and corner retains its own evidence and unsupported scope. |
| Fail branch | Name or proximity supplies an identity join or inherited entrance coverage. |
| Actual result | Not observed |
| Fixed product version | Not recorded |
| Evidence | None |
| Reviewer | Not assigned |
| Disposition | Pending |
| Correction | None recorded |
| Rerun | Not run |
| Evidence status | **Not run — Pending** |

## Fixture 5 — wrong or nearby entrance

| Review field | Abstract record |
|---|---|
| Setup | A candidate path substitutes a nearby staircase, wrong corner, or different entrance for the exact reviewed accessible entrance. |
| Expected result | Reject the substituted entrance and the candidate chain. |
| Prohibited result | Let the nearest entrance, staircase, or corner inherit the reviewed entrance's coverage. |
| Pass branch | Exact entrance identity and corner remain mandatory. |
| Fail branch | Distance, convenience, shared naming, or a coordinate-only match authorizes substitution. |
| Actual result | Not observed |
| Fixed product version | Not recorded |
| Evidence | None |
| Reviewer | Not assigned |
| Disposition | Pending |
| Correction | None recorded |
| Rerun | Not run |
| Evidence status | **Not run — Pending** |

## Fixture 6 — rerouted train on unverified platform

| Review field | Abstract record |
|---|---|
| Setup | Current service moves a train from its ordinary reviewed platform to a replacement platform with no complete structural row. |
| Expected result | Reject accessible routing for the replacement platform until its own complete row and current decisions pass. |
| Prohibited result | Transfer ordinary-platform coverage, edge membership, equipment chain, or boarding-area evidence to the reroute. |
| Pass branch | The replacement platform is treated as unsupported and accessible routing fails closed. |
| Fail branch | Route identity or ordinary service pattern is used to inherit platform coverage. |
| Actual result | Not observed |
| Fixed product version | Not recorded |
| Evidence | None |
| Reviewer | Not assigned |
| Disposition | Pending |
| Correction | None recorded |
| Rerun | Not run |
| Evidence status | **Not run — Pending** |

## Fixture 7 — step-free but non-official passage

| Review field | Abstract record |
|---|---|
| Setup | A passage appears geometrically step-free but lacks accepted official accessible-path membership for the exact edge and scope. |
| Expected result | Mark membership Unknown, reject the edge, and reject the complete chain. |
| Prohibited result | Treat geometry, equipment presence, or an informal description as proof of an official accessible path. |
| Pass branch | Step-free suitability and official membership remain separate decisions. |
| Fail branch | Physical geometry alone passes membership or the complete chain. |
| Actual result | Not observed |
| Fixed product version | Not recorded |
| Evidence | None |
| Reviewer | Not assigned |
| Disposition | Pending |
| Correction | None recorded |
| Rerun | Not run |
| Evidence status | **Not run — Pending** |

## Review completion checklist

- [ ] The fixed review record keeps expected, prohibited, actual, fixed-version, evidence, reviewer, disposition, correction, and rerun fields separate.
- [ ] One record represents exactly one constituent, line, normalized direction, entrance and corner, platform, boarding area, and complete path.
- [ ] Official identities, not names, colors, descriptions, badges, or proximity, join the reviewed evidence.
- [ ] Every required edge and official equipment identity is traced to the same-version package.
- [ ] Official accessible-path membership is explicit for every required edge.
- [ ] Restrictions, verification date, verifier, reviewer decisions, and unsupported scope are complete.
- [ ] Structural coverage is separated from current equipment and service state.
- [ ] A rerouted or replacement platform requires its own complete coverage row.
- [ ] All seven fixture branches retain their actual evidence state; currently each is **Not run — Pending**.
- [ ] No expected result, template, or documentation commit is treated as observed behavior, coverage, approval, Gate 0 passage, or accessibility release evidence.

Every unchecked required item fails closed. The fixture prose does not establish any real accessibility result.
