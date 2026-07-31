# Release 1 accessibility acceptance pack

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§20.1, 20.5, 21, 23.1, 23.3, 23.5, 29.1, 29.4, 31.5, §31.6 scenarios 33–35, 31.8 cases 45–46, 32.2, and applying §§33.1–33.3; accessibility and platform-guidance plan `Product artifact map`, Task 6 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks`, Task 8 full plan provenance, and Task 12 Steps 1–4 with the checkpoint-1 Release 1 gate handoff |
| Owner | Release Quality Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Not run — Pending |

## Purpose, authority, and current decision

This pack is the append-only Release 1 evidence definition for direction-aware station accessibility, live equipment-status treatment, and Accessible Route Only on verified complete paths. Package identifier `A11Y-R1-PACK-v1` identifies this documentation and evidence schema only. It is not a product or build version, source snapshot, official inventory, coverage verification, reviewer approval, or release decision.

The [complete accessible-path contract](complete-path-contract.md), [path-edge review checklist](path-edge-review-checklist.md), [station-direction coverage register](station-direction-coverage-register.md), [station-direction review guide](station-direction-review-guide.md), [Accessible Route Only state matrix](accessible-route-only-state-matrix.md), [accessibility copy catalog](accessibility-copy-catalog.md), [equipment status policy](equipment-status-policy.md), [equipment-status acceptance table](equipment-status-acceptance-table.md), [path-impact and reroute playbook](path-impact-and-reroute-playbook.md), and [underway-warning state matrix](underway-warning-state-matrix.md) retain their narrower decision authority. This pack records their fixed application and evidence; it does not create, weaken, strengthen, bulk-approve, or replace those decisions.

The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. Shared terms retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md), rider certainty follows the [approved rider language rules](../contracts/rider-language-rules.md), and lifecycle and review follow the [product artifact review and approval policy](../review-and-approval-policy.md).

This artifact is **Draft**. It contains no fixed reviewed executable product, real station, constituent, route, direction, entrance, platform, boarding area, exit, path, edge, equipment snapshot, official inventory, warning, source capture, rendered or spoken product result, reviewer decision, approval, or release evidence. Every source case, fixture definition, pack-local control, actual-result field, attachment, reviewer decision, correction, and rerun below remains **Not run — Pending** or **Pending**.

The authoritative release decision remains:

**NO-GO — GATE 0 NOT PASSED**

Public arrival boards remain blocked.

Task 6 consolidates evidence definitions. It does not pass Gate 0 or make the Release 1 accessibility decision. Task 12 owns the independent decision against the same fixed package.

## Governance and wording reconciliation

The artifact header and Draft [artifact index](../artifact-index.md) row include the Release 1 equipment, accessibility, risk, and Task 12 checkpoint provenance plus the separate Release 2 Task 8 positioning-evidence extension. This metadata reconciliation does not approve either package; every execution, reviewer decision, and release authorization remains **Pending**.

The plan's broad equipment sentence is applied consistently with the approved specification and accepted Task 4 artifacts:

> **Raw or unconfirmed empty**, stale, anomalous, failed, malformed, structurally incomplete, unmatched, or unjoinable equipment evidence never produces **No official outage reported**.

This rule does not erase either accepted positive control: EQ-06 may support the exact copy only after two accepted coherent Current globally zero-outage snapshots at least one authoritative minute apart and every other gate passes; EQ-13 may support it only for the exact target under its healthy Current non-empty same-scope branch. Product Governance reconciliation of the plan wording is **Pending**.

## Frozen package manifest

The accepted Task 5 base is commit `29699e15d88c018318e7c8918d2937239953f857`. The blobs below are immutable Task 1–5 input revisions at that base. An accepted SDD task commit is not product approval or observed working-product evidence.

| Task input | Applying artifact | Immutable input blob at accepted base | Accepted task provenance |
|---|---|---|---|
| Task 1 | [Complete accessible-path contract](complete-path-contract.md) | `eb0206aab5ebcd6ea6bca73e817c9bc9b1ebfaf1` | `37c50c12b797304ac14d327bed40239585c5fd36` |
| Tasks 1–2 | [Accessible path-edge review checklist](path-edge-review-checklist.md) | `4ab7fed7ac7898fd32b0903abc312d7ac86d3d27` | Created by `37c50c12b797304ac14d327bed40239585c5fd36`; accepted Task 2 revision `c42f28fa81badc09bc11329fcaca6499569cf0b3` |
| Task 2 | [Station-direction coverage register](station-direction-coverage-register.md) | `bd75501c771bfb4265f84243af5648664d402dd7` | `c42f28fa81badc09bc11329fcaca6499569cf0b3` |
| Task 2 | [Station-direction review guide](station-direction-review-guide.md) | `795aed8a2342021a27ac68ec1182b755ccfb28bd` | `c42f28fa81badc09bc11329fcaca6499569cf0b3` |
| Task 3 | [Accessible Route Only state matrix](accessible-route-only-state-matrix.md) | `9d9dbec8c8ab4f350c3e5b6837ad3be07979933f` | `53057ff764e6e5d0c89903b37deb566b422a2005` |
| Tasks 3–5 | [Accessibility copy catalog](accessibility-copy-catalog.md) | `a15616144d572c419e7dc387bec4c3c758c620f7` | Created by `53057ff764e6e5d0c89903b37deb566b422a2005`; accepted revisions `9d4372d45973fd3dfa84777696350c274bea5d81` and `29699e15d88c018318e7c8918d2937239953f857` |
| Task 4 | [Equipment status policy](equipment-status-policy.md) | `dab01743e7226a95288e22071b04651aa5afd2f3` | `9d4372d45973fd3dfa84777696350c274bea5d81` |
| Task 4 | [Equipment-status acceptance table](equipment-status-acceptance-table.md) | `66b6230d7ed70857635a682fd7064c6447f18c63` | `9d4372d45973fd3dfa84777696350c274bea5d81` |
| Task 5 | [Accessible path-impact and reroute playbook](path-impact-and-reroute-playbook.md) | `bad8188c7f2bc134fed15eabfa294a631c8a13ca` | `29699e15d88c018318e7c8918d2937239953f857` |
| Task 5 | [Underway accessibility-warning state matrix](underway-warning-state-matrix.md) | `eecf847e786d0d8fe71a4d378e7ca06135fea152` | `29699e15d88c018318e7c8918d2937239953f857` |

The Task 6 versions of this pack, the coverage register, and the equipment table must be bound by the immutable commit that contains them before any attempt can leave **Not run — Pending**. This document does not claim its own future blob identity.

| Controlling dependency | Immutable blob at accepted base | Package role |
|---|---|---|
| [Accessibility and platform-guidance plan](../../superpowers/plans/2026-07-30-accessibility-and-platform-guidance-plan.md) | `dd21b3c7228986d3177594788521c4ef7f873492` | Task 6 scope, cases, checks, and Task 12 handoff |
| [Approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) | `9840d6c5687771d00ce8d0b9a1116ac84347e0e6` | Controlling product requirements |
| [Product artifact index](../artifact-index.md) | `78f902903d4a07a381e7d6929264a9929822c266` | Indexed ownership and provenance |
| [Approved transit product glossary](../contracts/transit-product-glossary.md) | `61e7370a0a5e7f1db0eaa2c190302d412ab9333f` | Historical Phase 0 shared scope and identity terms; arrival admission remains owned by the core arrival contract |
| [Approved rider language rules](../contracts/rider-language-rules.md) | `659d6dbabff7b697a210755a0e2dd7df0cdef112` | Rider certainty and accessible-claim boundary |
| [Product artifact review and approval policy](../review-and-approval-policy.md) | `c70d1795decf4a5a4c276718fd8b5fb36891a06e` | Lifecycle, reviewer, failure, and rerun rules |
| [Nearby/offline warning and reconnection lifecycle](../nearby-offline/offline-degraded-and-reconnection-states.md) | `34c654273c7d30bbba986a5faaf757165bffc64b` | Preserved warning context and stage-1 accessibility recovery |
| [Nearby/offline acceptance evidence](../nearby-offline/acceptance-evidence.md) | `0b74ee2fc6f09e1b9bff92492472fe6f3255559d` | Append-only evidence vocabulary and companion handoff |
| [Nearby/offline Release 1 readiness](../nearby-offline/release-1-readiness.md) | `d8eaf46030a5e16169d5a78d12b869ede7d06bd6` | Separate release boundary |
| [Gate 0 exit record](../quality/gate-0-exit-record.md) | `ca74378243a7e32e5030de556e812c86b26964f6` | Authoritative public-board no-go |

| Run-bound manifest field | Current binding |
|---|---|
| Fixed product/build version | **Pending — no reviewed executable product bound** |
| Task 6 evidence-definition revision | **Pending — bind the immutable commit containing this pack and both Task 6 handoffs** |
| Configuration version | **Pending** |
| Data package and correction-policy versions | **Pending** |
| Official equipment inventory version, accepted refresh, and age | **Pending** |
| Structural coverage version | **Pending — the register has zero real rows** |
| Copy and warning versions used by a run | **Pending — immutable artifact definitions exist above, but no run is bound** |
| Official source package identifiers | **Pending** |
| Source capture or verification date and verifier | **Pending** |
| Reviewer package version | **Pending** |
| Product, Accessibility, Data Quality, Content, and Operations decisions | **Pending** |

## Evidence vocabulary and stop rules

These are the only permitted attempt dispositions:

| Disposition | Exact meaning |
|---|---|
| **Not run — Pending** | No complete run exists against one frozen product/build, artifact, dependency, input, output, attachment, and reviewer package. This is the current state of every Task 6 case and control. |
| **Run — Pass** | One fixed attempt produced every expected visible and assistive outcome, avoided every prohibited outcome, supplied every required lineage item and attachment, and received all five mandatory reviewer approvals against that same version. |
| **Run — Fail** | One fixed attempt missed an expected result, produced any prohibited result, missed a safety requirement, or received a required **Changes required** decision. |
| **Run — Inconclusive** | A run exists, but missing or unreliable input, lineage, attachment, dependency result, or reviewer decision prevents Pass or Fail; the exact gap and blocking release effect remain explicit. |

Missing evidence, no execution, silence, a zero denominator, an absent incident, expected prose, a document commit, a meeting, a mutable web page, an unversioned screenshot, or a reviewer assignment is never Pass. Any failed, inconclusive, or Pending truth, accessibility, equipment, offline-honesty, or blocking operational attempt blocks the Release 1 accessibility gate.

## Stable case and attempt record

- A case ID permanently identifies one specification source row.
- An attempt ID is `<case-id>-A<two-digit sequence>`, beginning with `A01`.
- Evidence-definition version `A11Y-R1-PACK-v1` identifies the schema, not a working-product run.
- A source row is represented once in the canonical inventory below. The same immutable fixture may support more than one source row, but it does not merge those rows or prove either one.
- A new material product, artifact, input, correction, or rerun never reuses an attempt ID.

### Required fields for every attempt

| Record field | Required content |
|---|---|
| Stable identity | Case ID; attempt ID; evidence-definition version; prior attempt, correction ID, and superseding rerun when any |
| Source and owners | Specification section and case; plan task or accepted boundary fixture; authoritative decision owner; Release Quality evidence owner |
| Applying artifacts and dependencies | Every consumed artifact path, immutable revision, accepted task provenance, Gate 0 package, Nearby/offline warning lifecycle, and other owner result |
| Exact versions | Fixed product/build; this pack; every contract, matrix, policy, catalog, register, fixture, configuration, data, source, inventory, coverage, copy, warning, and reviewer package version |
| Setup and input lineage | Immutable input references; source package; authoritative timestamps; declared precision; retrieval and decision times; observation window; exclusions |
| Exact journey scope | Station complex; constituent; route or line; normalized direction; exact entrance and corner; platform; boarding area; every transfer; destination platform; exit and corner; street endpoint; restrictions; verification date and verifier |
| Complete path evidence | Immutable path version; full ordered street-to-street path; every ordered edge ID; movement and endpoint evidence; official accessible-path membership; structural decision |
| Equipment evidence when applicable | Every official equipment ID; accepted snapshot health; response structure; population and anomaly result; authoritative status time, decision time, precision, and age; inventory version, accepted refresh, and age; exact join; prior-outage and restoration sequence |
| Rider state and action | Accessible Route Only and Avoid stairs state; active journey; rider-confirmed manual cursor; decision point and deadline when applicable; exact action and order |
| Expected result | Exact visible output or suppression; exact assistive output; expected decision and state mutation; accepted, rejected, or structural-only reason |
| Prohibited result | Every false accessible-now, station-badge, wrong-scope, positive equipment, unsafe alighting, silent replan, hidden warning, state mutation, or other case-specific forbidden outcome |
| Actual result | Exact visible output; exact assistive output; actual decision, suppression, state mutation, and accepted, rejected, or structural-only reason |
| Durable evidence | Render or video; accessibility tree and transcript; path and decision trace; source snapshot and inventory lineage; state diff; warning order and persistence evidence |
| Review | Named Product, Accessibility, Data Quality, Content, and Operations reviewers; **Approve** or **Changes required**; decision dates; same fixed package; unresolved issues |
| Disposition and release effect | One permitted disposition; explicit blocking or non-blocking effect; Gate 0 and Task 12 consequence |
| Correction and rerun | Correction owner and bounded scope; new fixed product/artifact version; preserved original result; prior attempt; next sequential attempt and separate durable evidence |

Any missing direction, exact entrance, required edge, verification date, applicable equipment state, reason, exact visible or assistive result, fixed version, attachment, or mandatory reviewer decision prevents **Run — Pass**.

### Current A01 field-set binding

Every canonical row and the pack-local failed-response control currently inherits field set `A11Y-NR-01`.

| Required attempt field | `A11Y-NR-01` current value |
|---|---|
| Product/build, Task 6 revision, configuration, data, source, inventory, coverage, copy, warning, and reviewer package | **Pending — no fixed run package assigned** |
| Setup, preconditions, input references, timestamps, precision, and journey scope | **Pending — no run recorded** |
| Complete path, edges, equipment snapshot, inventory, and decision point | **Pending — no run recorded** |
| Actual visible and assistive result; actual decision and state mutation | **Pending — not observed** |
| Render/video, accessibility tree/transcript, decision trace, source/inventory lineage, state diff, and warning-order evidence | **Pending — none recorded** |
| Product, Accessibility, Data Quality, Content, and Operations decisions and dates | **Pending / Not recorded** |
| Disposition | **Not run — Pending** |
| Release effect | Blocks the Release 1 accessibility gate; preserves Gate 0 no-go |
| Correction, prior attempt, and rerun | **Pending — none recorded; first attempt has not run** |

## Canonical source-scenario inventory

Each of the ten §21 cases and seven §31.5 scenarios appears exactly once below. Expected results are requirements, not observed product evidence. The authoritative decision owner is the Accessibility Product Lead; the evidence-record owner is the Release Quality Lead.

| Pack case and initial attempt | Specification source row | Expected decision and rider result | Controlling fixture definitions | Current disposition |
|---|---|---|---|---|
| `A11Y-21-01` / `A11Y-21-01-A01` | §21 case 1 — Elevator does not equal accessibility | Reject the incomplete chain; never infer platform accessibility from elevator presence. | Task 1 trap 1; Task 2 fixture 3 | **Not run — Pending** |
| `A11Y-21-02` / `A11Y-21-02-A01` | §21 case 2 — Partial complex | Qualify only the exact constituent and line scope; no complex-wide inheritance. | Task 2 fixture 2 | **Not run — Pending** |
| `A11Y-21-03` / `A11Y-21-03-A01` | §21 case 3 — Directional platform | Qualify only the covered direction and reject the opposite direction. | Task 2 fixture 1; ARO-05 | **Not run — Pending** |
| `A11Y-21-04` / `A11Y-21-04-A01` | §21 case 4 — Mixed inaccessible transfer | Reject the complete route when the required transfer passage fails or is Unknown. | Task 1 trap 2; ARO-03 | **Not run — Pending** |
| `A11Y-21-05` / `A11Y-21-05-A01` | §21 case 5 — Chained elevators | One failed required edge invalidates the complete chain and route. | Task 1 trap 3; IMP-03 | **Not run — Pending** |
| `A11Y-21-06` / `A11Y-21-06-A01` | §21 case 6 — Redundant path | Reject the broken chain; offer only an independently complete, Current, verified alternate and require explicit selection. A restoration branch triggers full-path reevaluation. | Task 1 trap 4; IMP-02; IMP-13 | **Not run — Pending** |
| `A11Y-21-07` / `A11Y-21-07-A01` | §21 case 7 — Wrong entrance | Reject the nearest staircase, wrong entrance, or wrong corner substitution. | Task 2 fixture 5; ARO-02 | **Not run — Pending** |
| `A11Y-21-08` / `A11Y-21-08-A01` | §21 case 8 — Rerouted train on an Unknown platform | Reject accessible routing; ordinary-platform evidence cannot transfer. | Task 2 fixture 6; ARO-07 | **Not run — Pending** |
| `A11Y-21-09` / `A11Y-21-09-A01` | §21 case 9 — Stale equipment | Route-critical equipment becomes **Unknown**; preserve a prior adverse state as **Out of service—status being rechecked**; never show positive equipment copy. | EQ-02, EQ-03, EQ-04, EQ-10 | **Not run — Pending** |
| `A11Y-21-10` / `A11Y-21-10-A01` | §21 case 10 — Offline planning | With owner-eligible stored complete structure, show exact **Structurally step-free; live elevator status unavailable**; never imply accessible now. | ARO-13 | **Not run — Pending** |
| `A11Y-31-26` / `A11Y-31-26-A01` | §31.5 scenario 26 — One-direction rejection | Reject the uncovered direction; do not inherit the opposite direction's row. | Task 2 fixture 1; ARO-05 | **Not run — Pending** |
| `A11Y-31-27` / `A11Y-31-27-A01` | §31.5 scenario 27 — Non-ADA elevator non-inference | Equipment presence outside the official accessible path never establishes membership; reject or mark the edge Unknown and invalidate the chain. | Task 1 trap 1; Task 2 fixture 7 | **Not run — Pending** |
| `A11Y-31-28` / `A11Y-31-28-A01` | §31.5 scenario 28 — Redundant chain | Use only the independently complete, current, verified redundant chain and require explicit selection. | Task 1 trap 4; IMP-02 | **Not run — Pending** |
| `A11Y-31-29` / `A11Y-31-29-A01` | §31.5 scenario 29 — Required chain failure | Invalidate the whole route when a required chained connection fails. | Task 1 trap 3; IMP-03 | **Not run — Pending** |
| `A11Y-31-30` / `A11Y-31-30-A01` | §31.5 scenario 30 — Raw/unconfirmed empty or stale equipment | First raw accepted empty or stale route-critical evidence becomes **Unknown**. Preserve EQ-06 and EQ-13 as separate positive controls only under all of their gates. | EQ-05; EQ-02, EQ-03, EQ-04; positive controls EQ-06 and EQ-13 | **Not run — Pending** |
| `A11Y-31-31` / `A11Y-31-31-A01` | §31.5 scenario 31 — Rerouted unverified platform | Reject accessible routing on the replacement platform. | Task 2 fixture 6; ARO-07 | **Not run — Pending** |
| `A11Y-31-32` / `A11Y-31-32-A01` | §31.5 scenario 32 — Underway warning | Warn before the known last accessible decision point when current evidence permits; otherwise warn immediately without position inference. Name the exact connection, impact, and first verified safe action; never direct inaccessible alighting. | IMP-09 primary; IMP-10 and IMP-14 lifecycle controls | **Not run — Pending** |

## Complete fixture-definition inventory

The inventory contains exactly 54 definitions: 4 Task 1 traps, 7 Task 2 fixtures, 16 Task 3 ARO fixtures, 13 Task 4 EQ fixtures, and 14 Task 5 IMP fixtures. All remain **Not run — Pending**. The Task 2 section of the path-edge checklist repeats the same seven Task 2 fixtures and is not a second set.

Tasks 1–2 do not assign stable fixture IDs. Their pack references therefore use the exact source heading plus the immutable source blob. No source artifact is edited merely to add an ID.

| Task | Definition | Immutable source revision | Current disposition |
|---:|---|---|---|
| 1 | `Representative trap 1 — mezzanine-only elevator` | `path-edge-review-checklist.md` blob `4ab7fed7ac7898fd32b0903abc312d7ac86d3d27` | **Not run — Pending** |
| 1 | `Representative trap 2 — non-step-free required transfer passage` | `path-edge-review-checklist.md` blob `4ab7fed7ac7898fd32b0903abc312d7ac86d3d27` | **Not run — Pending** |
| 1 | `Representative trap 3 — failed required edge in chained elevator path` | `path-edge-review-checklist.md` blob `4ab7fed7ac7898fd32b0903abc312d7ac86d3d27` | **Not run — Pending** |
| 1 | `Representative trap 4 — redundant complete chain` | `path-edge-review-checklist.md` blob `4ab7fed7ac7898fd32b0903abc312d7ac86d3d27` | **Not run — Pending** |
| 2 | `Fixture 1 — direction-specific coverage` | `station-direction-review-guide.md` blob `795aed8a2342021a27ac68ec1182b755ccfb28bd` | **Not run — Pending** |
| 2 | `Fixture 2 — partial complex` | `station-direction-review-guide.md` blob `795aed8a2342021a27ac68ec1182b755ccfb28bd` | **Not run — Pending** |
| 2 | `Fixture 3 — mezzanine-only elevator` | `station-direction-review-guide.md` blob `795aed8a2342021a27ac68ec1182b755ccfb28bd` | **Not run — Pending** |
| 2 | `Fixture 4 — same-name stations with different corners` | `station-direction-review-guide.md` blob `795aed8a2342021a27ac68ec1182b755ccfb28bd` | **Not run — Pending** |
| 2 | `Fixture 5 — wrong or nearby entrance` | `station-direction-review-guide.md` blob `795aed8a2342021a27ac68ec1182b755ccfb28bd` | **Not run — Pending** |
| 2 | `Fixture 6 — rerouted train on unverified platform` | `station-direction-review-guide.md` blob `795aed8a2342021a27ac68ec1182b755ccfb28bd` | **Not run — Pending** |
| 2 | `Fixture 7 — step-free but non-official passage` | `station-direction-review-guide.md` blob `795aed8a2342021a27ac68ec1182b755ccfb28bd` | **Not run — Pending** |
| 3 | `ARO-01 — persistence across transitions` | `accessible-route-only-state-matrix.md` blob `9d9dbec8c8ab4f350c3e5b6837ad3be07979933f` | **Not run — Pending** |
| 3 | `ARO-02 — origin evidence incomplete or Unknown` | `accessible-route-only-state-matrix.md` blob `9d9dbec8c8ab4f350c3e5b6837ad3be07979933f` | **Not run — Pending** |
| 3 | `ARO-03 — transfer passage incomplete or Unknown` | `accessible-route-only-state-matrix.md` blob `9d9dbec8c8ab4f350c3e5b6837ad3be07979933f` | **Not run — Pending** |
| 3 | `ARO-04 — destination platform reachable but egress broken` | `accessible-route-only-state-matrix.md` blob `9d9dbec8c8ab4f350c3e5b6837ad3be07979933f` | **Not run — Pending** |
| 3 | `ARO-05 — only the opposite direction is covered` | `accessible-route-only-state-matrix.md` blob `9d9dbec8c8ab4f350c3e5b6837ad3be07979933f` | **Not run — Pending** |
| 3 | `ARO-06 — boarding area unverified` | `accessible-route-only-state-matrix.md` blob `9d9dbec8c8ab4f350c3e5b6837ad3be07979933f` | **Not run — Pending** |
| 3 | `ARO-07 — reroute uses an unverified platform` | `accessible-route-only-state-matrix.md` blob `9d9dbec8c8ab4f350c3e5b6837ad3be07979933f` | **Not run — Pending** |
| 3 | `ARO-08 — complete ride-past-and-return workaround` | `accessible-route-only-state-matrix.md` blob `9d9dbec8c8ab4f350c3e5b6837ad3be07979933f` | **Not run — Pending** |
| 3 | `ARO-09 — ride-past-and-return has one Unknown edge` | `accessible-route-only-state-matrix.md` blob `9d9dbec8c8ab4f350c3e5b6837ad3be07979933f` | **Not run — Pending** |
| 3 | `ARO-10 — no verified subway route` | `accessible-route-only-state-matrix.md` blob `9d9dbec8c8ab4f350c3e5b6837ad3be07979933f` | **Not run — Pending** |
| 3 | `ARO-11 — no explicit bus choice` | `accessible-route-only-state-matrix.md` blob `9d9dbec8c8ab4f350c3e5b6837ad3be07979933f` | **Not run — Pending** |
| 3 | `ARO-12 — explicit bus-inclusive choice` | `accessible-route-only-state-matrix.md` blob `9d9dbec8c8ab4f350c3e5b6837ad3be07979933f` | **Not run — Pending** |
| 3 | `ARO-13 — offline with eligible stored structural evidence` | `accessible-route-only-state-matrix.md` blob `9d9dbec8c8ab4f350c3e5b6837ad3be07979933f` | **Not run — Pending** |
| 3 | `ARO-14 — official alternative lacks complete review` | `accessible-route-only-state-matrix.md` blob `9d9dbec8c8ab4f350c3e5b6837ad3be07979933f` | **Not run — Pending** |
| 3 | `ARO-15 — multiple eligible paths require exact ranking` | `accessible-route-only-state-matrix.md` blob `9d9dbec8c8ab4f350c3e5b6837ad3be07979933f` | **Not run — Pending** |
| 3 | `ARO-16 — faster path has more single-point dependencies` | `accessible-route-only-state-matrix.md` blob `9d9dbec8c8ab4f350c3e5b6837ad3be07979933f` | **Not run — Pending** |
| 4 | `EQ-01 — Exactly five minutes` | `equipment-status-acceptance-table.md` blob `66b6230d7ed70857635a682fd7064c6447f18c63` | **Not run — Pending** |
| 4 | `EQ-02 — First representable instant above five minutes` | `equipment-status-acceptance-table.md` blob `66b6230d7ed70857635a682fd7064c6447f18c63` | **Not run — Pending** |
| 4 | `EQ-03 — Exactly fifteen minutes` | `equipment-status-acceptance-table.md` blob `66b6230d7ed70857635a682fd7064c6447f18c63` | **Not run — Pending** |
| 4 | `EQ-04 — First representable instant above fifteen minutes` | `equipment-status-acceptance-table.md` blob `66b6230d7ed70857635a682fd7064c6447f18c63` | **Not run — Pending** |
| 4 | `EQ-05 — First accepted Current zero-outage snapshot` | `equipment-status-acceptance-table.md` blob `66b6230d7ed70857635a682fd7064c6447f18c63` | **Not run — Pending** |
| 4 | `EQ-06 — Empty-response confirmation interval` | `equipment-status-acceptance-table.md` blob `66b6230d7ed70857635a682fd7064c6447f18c63` | **Not run — Pending** |
| 4 | `EQ-07 — More than half of active outages disappear` | `equipment-status-acceptance-table.md` blob `66b6230d7ed70857635a682fd7064c6447f18c63` | **Not run — Pending** |
| 4 | `EQ-08 — More than ten percent bad records` | `equipment-status-acceptance-table.md` blob `66b6230d7ed70857635a682fd7064c6447f18c63` | **Not run — Pending** |
| 4 | `EQ-09 — Six-day inventory` | `equipment-status-acceptance-table.md` blob `66b6230d7ed70857635a682fd7064c6447f18c63` | **Not run — Pending** |
| 4 | `EQ-10 — Seven-day inventory cutoff` | `equipment-status-acceptance-table.md` blob `66b6230d7ed70857635a682fd7064c6447f18c63` | **Not run — Pending** |
| 4 | `EQ-11 — One omission of a prior outage` | `equipment-status-acceptance-table.md` blob `66b6230d7ed70857635a682fd7064c6447f18c63` | **Not run — Pending** |
| 4 | `EQ-12 — Qualifying restoration routes` | `equipment-status-acceptance-table.md` blob `66b6230d7ed70857635a682fd7064c6447f18c63` | **Not run — Pending** |
| 4 | `EQ-13 — Healthy non-empty same-scope target absence` | `equipment-status-acceptance-table.md` blob `66b6230d7ed70857635a682fd7064c6447f18c63` | **Not run — Pending** |
| 5 | `IMP-01 — unrelated equipment` | `path-impact-and-reroute-playbook.md` blob `bad8188c7f2bc134fed15eabfa294a631c8a13ca` | **Not run — Pending** |
| 5 | `IMP-02 — independently complete same-complex path` | `path-impact-and-reroute-playbook.md` blob `bad8188c7f2bc134fed15eabfa294a631c8a13ca` | **Not run — Pending** |
| 5 | `IMP-03 — required chain fails without same-complex path` | `path-impact-and-reroute-playbook.md` blob `bad8188c7f2bc134fed15eabfa294a631c8a13ca` | **Not run — Pending** |
| 5 | `IMP-04 — escalator preference boundary` | `path-impact-and-reroute-playbook.md` blob `bad8188c7f2bc134fed15eabfa294a631c8a13ca` | **Not run — Pending** |
| 5 | `IMP-05 — all four alternative tiers` | `path-impact-and-reroute-playbook.md` blob `bad8188c7f2bc134fed15eabfa294a631c8a13ca` | **Not run — Pending** |
| 5 | `IMP-06 — unverified official alternative` | `path-impact-and-reroute-playbook.md` blob `bad8188c7f2bc134fed15eabfa294a631c8a13ca` | **Not run — Pending** |
| 5 | `IMP-07 — ride-past-and-return branches` | `path-impact-and-reroute-playbook.md` blob `bad8188c7f2bc134fed15eabfa294a631c8a13ca` | **Not run — Pending** |
| 5 | `IMP-08 — blocking before departure` | `underway-warning-state-matrix.md` blob `eecf847e786d0d8fe71a4d378e7ca06135fea152` | **Not run — Pending** |
| 5 | `IMP-09 — underway before known point` | `underway-warning-state-matrix.md` blob `eecf847e786d0d8fe71a4d378e7ca06135fea152` | **Not run — Pending** |
| 5 | `IMP-10 — decision point Unknown or possibly passed` | `underway-warning-state-matrix.md` blob `eecf847e786d0d8fe71a4d378e7ca06135fea152` | **Not run — Pending** |
| 5 | `IMP-11 — no verified safe alternative` | `underway-warning-state-matrix.md` blob `eecf847e786d0d8fe71a4d378e7ca06135fea152` | **Not run — Pending** |
| 5 | `IMP-12 — required equipment becomes Unknown` | `underway-warning-state-matrix.md` blob `eecf847e786d0d8fe71a4d378e7ca06135fea152` | **Not run — Pending** |
| 5 | `IMP-13 — accepted one-machine evidence has two source branches` | `underway-warning-state-matrix.md` blob `eecf847e786d0d8fe71a4d378e7ca06135fea152` | **Not run — Pending** |
| 5 | `IMP-14 — lifecycle persistence, reconnect, and Commute handoff` | `underway-warning-state-matrix.md` blob `eecf847e786d0d8fe71a4d378e7ca06135fea152` | **Not run — Pending** |

The source-heading and fixture inventory above is traceability only. It does not convert a fixture definition, accepted documentation commit, or shared fixture reference into execution evidence.

## Equipment boundary and failed-response controls

| Pack control and attempt | Fixed boundary | Expected visible and assistive result | Prohibited result | Current disposition |
|---|---|---|---|---|
| `A11Y-EQ-C05` / `A11Y-EQ-C05-A01` | EQ-05: first accepted coherent Current globally zero-outage snapshot | Internal **Provisional empty**; route-critical machine **Unknown** with governed freshness | **No official outage reported**, Working, Available, restoration, or path acceptance | **Not run — Pending** |
| `A11Y-EQ-C06` / `A11Y-EQ-C06-A01` | EQ-06: second coherent Current globally zero-outage snapshot at 59 seconds and at 60 seconds | 59 seconds remains unconfirmed; at least one authoritative minute may support **No official outage reported** only when every other gate passes | Early confirmation, Working, Available, observed operation, or complete-path acceptance | **Not run — Pending** |
| `A11Y-EQ-C11` / `A11Y-EQ-C11-A01` | EQ-11: one accepted omission of a prior outage | Exact **Out of service—status being rechecked** for the exact machine | Restoration, Unknown that hides the prior adverse state, or positive equipment copy | **Not run — Pending** |
| `A11Y-EQ-C12` / `A11Y-EQ-C12-A01` | EQ-12: explicit Current restoration or two qualifying omissions | Clear the adverse state for the exact matched machine only; use source-matched Task 5 copy and begin fresh full-path reevaluation | Machine operation, all-equipment restoration, warning clear, or path acceptance from the machine result alone | **Not run — Pending** |
| `A11Y-EQ-C13` / `A11Y-EQ-C13-A01` | EQ-13: healthy accepted Current non-empty complete same-scope snapshot has valid other-ID outages, no exact target-ID outage, current target inventory, no prior target outage awaiting restoration, and no veto | May show **No official outage reported** for the exact target only, with governed freshness | Globally empty treatment, Working, Available, restoration, another target, or complete-path acceptance | **Not run — Pending** |
| `A11Y-EQ-NEG` / `A11Y-EQ-NEG-A01` | Stale EQ-02/03/04, anomaly EQ-07/08, inventory-cutoff EQ-10 | Route-critical **Unknown**, except preserve exact prior adverse recheck when applicable | Positive equipment copy, restoration, or accessible-now | **Not run — Pending** |
| `A11Y-EQ-FR-01` / `A11Y-EQ-FR-01-A01` | Pack-local failed, malformed, missing-structure, incomplete, unmatched, or unjoinable response control; this is not a fourteenth Task 4 EQ fixture | Route-critical **Unknown** or exact prior adverse recheck; record failure/structure/join lineage and block the route | **No official outage reported**, Working, Available, restoration, path acceptance, or a fabricated Task 4 fixture result | **Not run — Pending** |

The pack-local failed-response control closes the Task 6 definition gap without renumbering EQ-01 through EQ-13. It remains an unexecuted pack control and supplies no Pass.

A Task 4 machine-level restoration never resolves a route. IMP-13 keeps the exact path warning and current verified safe action active until a fresh complete-path review passes every structural, equipment, route, direction, platform, boarding, transfer, exit, and street-endpoint requirement, or the rider explicitly selects a still-passing governed replacement.

## Release 1 structural coverage handoff

The [station-direction coverage register](station-direction-coverage-register.md) retains its controlling 26-field atomic schema. Task 6's entrance, line, direction, complete-chain, restrictions, and verification-date list is a minimum highlight, not permission to omit any field.

| Coverage handoff field | Current Release 1 value |
|---|---|
| Coverage row ID and immutable version | **Pending — no real row exists** |
| Pack case and attempt | **Pending — no real row is bound to an attempt** |
| Fixed package version | `A11Y-R1-PACK-v1` definition only; fixed working-product package **Pending** |
| Exact station complex and constituent | **Pending** |
| Route or line and normalized direction | **Pending** |
| Exact entrance, corner, platform, boarding area, exit, and street endpoint | **Pending** |
| Ordered complete path, edge IDs, equipment IDs, and official membership | **Pending** |
| Restrictions, sources, durable evidence, verification date, and verifier | **Pending** |
| Same-version Product, Accessibility, Data Quality, Content, and Operations decisions | **Pending** |
| Structural disposition | **Pending / ineligible** |
| Explicit unsupported scope | **Pending — no real-world combination is inferred** |
| Evidence disposition and release effect | **Not run — Pending; blocks eligibility** |

Real launch coverage rows: **zero**. Structurally accepted rows: **zero**. Release 1 eligible station-direction combinations: **zero established**. Absence of a row is not evidence that a real combination is inaccessible.

Structural coverage never stores live equipment state and never means accessible now. Any missing, wrong-scope, stale-under-owner-rule, unreviewed, or contradictory field remains **Pending / ineligible**. Exact allowed structural dispositions remain:

- **Structurally accepted for current-state consideration**
- **Structurally rejected / ineligible**
- **Pending / ineligible**

## Cross-artifact visible and assistive consistency review

Document text equality is not rendered or spoken product evidence. Each row requires one fixed product run with both visible and assistive results, exact scope and certainty, immutable attachments, and the same five-role review.

| Consistency row | Exact definition under review | Required fixed-run comparison | Actual/evidence/review |
|---|---|---|---|
| `A11Y-COPY-T3` | A11Y-T3-01 **No verified step-free subway route is available right now.**; A11Y-T3-02 **Structurally step-free; live elevator status unavailable**; A11Y-T3-03 **Accessibility not confirmed** | Visible and assistive output use the exact phrase, same scope and consequence, correct suppression/admission, and no positive station badge or accessible-now inference | **Pending / Pending / Pending** |
| `A11Y-COPY-T4` | A11Y-T4-01 through A11Y-T4-05, exact **Out of service—status being rechecked**, **Checked _accepted relative age_ ago**, **Checked time unavailable**, and estimated-return treatment | Visible and assistive output agree on exact machine, evidence state, age, certainty, prior-adverse preservation, and applicable EQ-05/06/11/12/13 branch; no color-only or positive-strengthening treatment | **Pending / Pending / Pending** |
| `A11Y-COPY-T5` | A11Y-T5-01 through A11Y-T5-09; **Blocking**, **Reroutable within station**, **Unrelated**; decision-point treatment; warning priority and persistence | Visible and assistive output agree on exact connection, accepted equipment state, path consequence, first verified action, order, persistence, and source-matched restoration wording | **Pending / Pending / Pending** |
| `A11Y-COPY-EXAMPLE` | Named 74 St/61 St–Woodside sentence | Confirm the sentence remains an example pattern only and supplies no station, outage, alternative, push, or approval evidence | **Pending / Pending / Pending** |
| `A11Y-WARN-LIFECYCLE` | IMP-09, IMP-10, IMP-13, IMP-14 and Nearby/offline stage-1 recovery | Capture decision point or Unknown treatment, warning-before-lower-priority order, no inaccessible alighting, preserved cursor/focus/context, and persistence until explicit verified replacement or full-path resolution | **Pending / Pending / Pending** |

## Append-only correction and review contract

1. Preserve every failed or inconclusive attempt, its exact inputs, actual result, prohibited-result checks, attachments, reviewer decisions, disposition, and release effect.
2. Record a correction with bounded scope, owner, changed artifacts, and a new fixed product/artifact version.
3. Give the rerun the next sequential attempt ID and link it to the original attempt and correction.
4. Never edit an earlier result into a later result. A later Pass does not erase a failure or inconclusive attempt.
5. Product, Accessibility, Data Quality, Content, and Operations each record **Approve** or **Changes required** against the same fixed package. Silence remains Pending.
6. Pack approval cannot bulk-approve a narrower Draft or Pending artifact, coverage row, fixture, source package, or owner decision.
7. Approval evidence must link the exact result set, and the result set must link back to the immutable approval record.

## Task 12 gate-input readout

| Gate input | Current value | Release effect |
|---|---|---|
| Canonical source cases | 17 total; 17 **Not run — Pending** | Blocks |
| Fixture definitions | 54 total; 54 **Not run — Pending** | Blocks |
| Pack-local failed-response control | 1; **Not run — Pending** | Blocks |
| Real launch coverage rows | 0 | Blocks |
| Fixed reviewed executable product/build | Pending | Blocks |
| Immutable run-bound Task 6, configuration, data, source, inventory, coverage, copy, and warning package | Pending | Blocks |
| Durable visible, assistive, path, equipment, warning, and lineage evidence | Pending | Blocks |
| Product, Accessibility, Data Quality, Content, and Operations decisions | Pending | Blocks |
| Known broken required elevator target | No observed denominator or result; zero invalid recommendations required | Not measured; blocks |
| Unknown-state safety target | No observed result; no exceptions permitted | Not measured; blocks |
| Release 1 accessibility decision | Not decided here; Task 12 owns it | Pending |

A future passing Task 6 pack cannot override Gate 0, the separate [Nearby/offline Release 1 readiness](../nearby-offline/release-1-readiness.md), or a narrower owner's Draft, Pending, failed, or inconclusive blocker. Tasks 7–11, platform positioning, transfer guidance, crowding, and Commute push work do not delay this evidence definition and cannot waive a Release 1 accessibility safety blocker. Task 5's scenario-39 handoff contains accessibility impact only; Commute retains every push decision.

## Task 12 checkpoint 1 Release 1 gate handoff

This is an append-only decision handoff from the unchanged Task 6 package to the independent [accessibility and guidance release-gate record](../quality/accessibility-and-guidance-release-gates.md). It does not upgrade, rewrite, merge, or remove any canonical case, fixture definition, pack-local control, coverage row, evidence field, disposition, reviewer state, correction, or rerun above.

| Handoff field | Checkpoint-1 value |
|---|---|
| Gate record and identifier | [Accessibility and guidance release gates](../quality/accessibility-and-guidance-release-gates.md); `A11Y-R1-GATE-v1` is a decision-record identifier only |
| Evaluation date | 2026-07-30 |
| Evaluated Task 6 package | Commit `935c79477ccc73cb9d27fde06f31e8f31e85eca9`; this pack blob `ac5ad77627588b50f0ec5ed8d9111c5cb01326ae` |
| Evaluated Task 6 handoffs | Station-direction coverage register blob `dee79c34eeb07864c8453c1d05ba01ca2408f310`; equipment-status acceptance-table blob `09d2ee2400726baa4362ad7bcb402306117408f6` |
| Checkpoint record binding | The repository commit containing this append and the linked gate record binds the checkpoint after commit; no future self-blob is asserted here |
| Canonical source-case census | 17 total; 17 **Not run — Pending** |
| Fixture-definition census | 54 total; 54 **Not run — Pending** |
| Pack-local failed-response control | 1 total; **Not run — Pending** |
| Coverage | 0 real rows; 0 structurally accepted rows; 0 eligible station-direction combinations established; coverage included **None** |
| Product and evidence package | Fixed executable product/build, configuration, source snapshot, inventory, coverage, output, attachment, and reviewer package all **Pending** |
| Known-outage target | **Not measured — blocks**; no observed denominator; `0/0` is not Pass |
| Unknown-state safety target | Contract defined but not executed; **Not measured — blocks** |
| Visible and assistive evidence | **Pending**; no same-version visible/assistive output or parity evidence |
| Underway-warning evidence | IMP-09, IMP-10, IMP-13, IMP-14, timing, priority, safe-action, and persistence evidence **Not run — Pending** |
| Unresolved blockers | No fixed product/run package; 17 cases Pending; 54 definitions Pending; failed-response control Pending; zero real coverage; both safety targets unobserved; no visible/assistive parity; no warning timing/persistence proof; no named P/A/D/C/O decisions or signatures; Gate 0 and separate Nearby/offline no-gos remain active |
| Release 1 accessibility outcome | **NO-GO — REQUIRED ACCESSIBILITY EVIDENCE AND COVERAGE ARE NOT DEMONSTRATED** |
| Release authorization | **INTENTIONALLY UNSIGNED — REQUIRED EVIDENCE, COVERAGE, AND REVIEWER DECISIONS ARE NOT DEMONSTRATED.** |
| Release effect | Direction-aware accessibility, live equipment-status treatment, and Accessible Route Only are not authorized for release; no later feature can waive the blocker |
| Correction scope and owner | **Pending — no correction recorded** |
| Rerun attempt and durable evidence | **Pending — no rerun recorded** |
| Future gate reevaluation | **Pending — must be a new linked decision against a complete same-version package; this no-go remains preserved** |

| Required reviewer role | Actual reviewer identity | Decision | Decision date | Durable signature/evidence |
|---|---|---|---|---|
| Product | **Pending** | **Pending** | **Pending** | **Pending** |
| Accessibility | **Pending** | **Pending** | **Pending** | **Pending** |
| Data Quality | **Pending** | **Pending** | **Pending** | **Pending** |
| Content | **Pending** | **Pending** | **Pending** | **Pending** |
| Operations | **Pending** | **Pending** | **Pending** | **Pending** |

The accepted equipment reconciliation remains unchanged: **raw/unconfirmed empty**, stale, anomalous, failed, malformed, incomplete, unmatched, or unjoinable responses never become **No official outage reported**. EQ-06 and EQ-13 remain separate valid positive controls only within their exact accepted gates, and the prior-adverse copy remains **Out of service—status being rechecked**.

The authoritative arrival-truth outcome remains **NO-GO — GATE 0 NOT PASSED**. Public arrival boards remain blocked. The [Nearby/offline Release 1 readiness](../nearby-offline/release-1-readiness.md) remains a separate no-go decision and is neither merged nor overridden by this accessibility outcome.

Task 12 Steps 5–13 remain **Pending — not evaluated at checkpoint 1**: Release 2 positioning and transfer, pre-commute accessibility notification, platform-feedback observability, guidance coverage expansion, subway crowding, cross-risk controls, later release decisions, and final terminology review. Their future artifacts and evidence are not created or claimed here.

## Draft review checklist

- [ ] The fixed run package binds one executable product/build and immutable Task 1–6, configuration, data, source, inventory, coverage, copy, warning, and reviewer versions.
- [ ] Each of the ten §21 cases and seven §31.5 scenarios has a separate append-only attempt and appears once in the canonical source inventory.
- [ ] All 54 Task 1–5 fixture definitions remain linked to immutable source revisions and actual evidence without double-counting Task 2.
- [ ] The pack-local failed-response control is run without renumbering or inventing a result for EQ-01 through EQ-13.
- [ ] Every attempt records exact journey scope, full path and edges, applicable equipment lineage, expected and prohibited outcomes, actual visible and assistive results, reason, attachments, review, correction, and rerun.
- [ ] Missing direction, entrance, required edge, verification date, equipment state, reason, fixed version, attachment, or reviewer prevents Pass.
- [ ] Known broken required elevators produce zero accepted route recommendations.
- [ ] Raw/unconfirmed empty, stale, anomalous, failed, malformed, incomplete, unmatched, or unjoinable evidence never produces **No official outage reported**.
- [ ] EQ-06 and EQ-13 remain distinct positive controls and never imply Working, Available, observed operation, restoration, or complete-path acceptance.
- [ ] A prior outage remains **Out of service—status being rechecked** until qualifying exact-machine evidence passes, and the path warning remains until fresh full-path acceptance or explicit verified replacement.
- [ ] Offline structural copy is exact and never claims accessible now.
- [ ] No case relies on a station-level accessibility badge.
- [ ] Visible and assistive results convey equivalent state, scope, certainty, order, and consequence.
- [ ] The coverage register's 26-field schema remains controlling and real launch coverage remains empty until durable evidence exists.
- [ ] Original failures and inconclusive attempts remain append-only after correction and rerun.
- [ ] Task 12 receives the same fixed package and records an independent decision.
- [ ] No product run, station, path, equipment snapshot, source capture, warning, reviewer decision, approval, Gate 0 passage, or release evidence has been fabricated.

Every unchecked required item blocks Task 6 acceptance. The current decision remains **NO-GO — GATE 0 NOT PASSED**, and public arrival boards remain blocked.

## Append-only Release 2 positioning evidence definitions

This Task 8 extension is a separate Release 2 evidence-definition namespace. It does not modify, merge, renumber, replace, or rerun `A11Y-R1-PACK-v1`; its 17 canonical Release 1 cases; its 54 Release 1 fixture definitions; its pack-local failed-response control; its zero-real-coverage statements; its accepted checkpoint handoff; or its distinct Release 1 accessibility no-go above.

| Extension governance field | Value |
|---|---|
| Evidence-definition identifier | `A11Y-R2-POS-T8-v1` — documentation schema only, not a product/build, execution, approval, or release version |
| Source sections | Approved specification §§23.1, 23.3, 23.5, 29.4, and §31.6 scenarios 33–35; accessibility and platform-guidance plan `Product artifact map` and Task 8 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks` |
| Owner | Release Quality Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Three definitions; all **Not run — Pending** |

The artifact header and Draft index row include this separate Release 2 Task 8 provenance. That metadata alignment does not approve the extension; all three definitions remain **Not run — Pending**.

The [Front, Middle, and Back positioning rider experience](../guidance/positioning-rider-experience.md) owns Task 8 presentation. The [platform guidance evidence standard](../guidance/platform-evidence-standard.md) and [platform state and positioning certainty matrix](../guidance/platform-state-and-certainty-matrix.md) retain Task 7 evidence, state, certainty, hard-conflict, recovery, and reevaluation authority. The [Accessible Route Only state matrix](accessible-route-only-state-matrix.md#aro-17-verified-accessible-zone-outranks-quickest-stairs) retains the appended hard-constraint priority definition.

These definitions contain fixed synthetic inputs and expected outcomes only. They demonstrate no fixed reviewed executable product, real station, constituent, route, direction, platform, geometry, field check, actual-track observation, coverage, rendered visible or assistive result, attachment, named reviewer decision, approval, or release evidence. Every new actual result, attachment, reviewer decision, correction, rerun, and disposition remains **Pending** or **Not run — Pending**.

### Release and checkpoint separation

- The authoritative arrival-truth decision remains **NO-GO — GATE 0 NOT PASSED** and public arrival boards remain blocked.
- The preserved Release 1 accessibility decision remains **NO-GO — REQUIRED ACCESSIBILITY EVIDENCE AND COVERAGE ARE NOT DEMONSTRATED**.
- The separate Nearby/offline Release 1 no-go remains unchanged.
- These three Release 2 definitions do not change the Release 1 census of 17 canonical cases, 54 fixture definitions, or one pack-local failed-response control.
- They do not pass Gate 0, the Release 1 accessibility checkpoint, the Nearby/offline checkpoint, or a Release 2 checkpoint.
- They may be evaluated only through Task 12's [later separate Release 2 decision](../quality/accessibility-and-guidance-release-gates.md#later-task-12-checkpoint-boundary) against one complete same-version package.

Each attempt below must bind its immutable synthetic input package, exact timestamps, every controlling artifact version, expected visible result or omission, expected assistive result or omission, prohibited behavior, actual result, attachments, five same-version reviewer decisions, correction, rerun, and disposition. The initial attempts have not run.

### A11Y-31-33 / A11Y-31-33-A01: direction reversal

| Evidence field | Fixed Release 2 definition |
|---|---|
| Specification source, decision owners, and linked fixture | §31.6 scenario 33; Guidance Product Lead for positioning; Accessibility Product Lead for complete-path and hard-constraint decisions; Release Quality Lead for this evidence record; [positioning fixture POS-33](../guidance/positioning-rider-experience.md#pos-33-direction-reversal) |
| Fixed versions | Immutable synthetic `A11Y-31-33-SRC-v1` consuming `POS-33-SRC-v1`; accepted Task 7 baseline commit `3d39129a58b497c92d0125569edebd894c47a71d`; `A11Y-R2-POS-T8-v1` and Task 8 definitions bound by the commit containing this extension; fixed product/build **Pending** |
| Immutable inputs and authoritative relative times | Branch A: synthetic admitted direction `D-A` at `T0`; independently admitted reverse direction `D-B` with two qualifying exact platform updates and a complete current opposite-direction orientation, stopping, zone, and objective record at `T1−30s` and `T1`; evaluate at `T1+5s`. Branch B: at `T2`, the reverse or replacement orientation, stopping relationship, or objective evidence is missing or uncertain; evaluate at `T2+5s`. |
| Expected visible output or omission | Branch A reverses Front and Back according to the complete current record and retains Middle only where independently supported. Branch B preserves independently valid arrival/platform context but shows no Front/Middle/Back claim because positioning is **Unavailable**. |
| Expected assistive output or omission | Convey the same reversed zone, objective, certainty, and benefit in Branch A. In Branch B, convey no positioning recommendation and never retain the prior-direction label. |
| Prohibited behavior | Mechanical word swap without complete evidence; old-direction inheritance; unsupported Middle; lower-certainty guess; car number; numeric confidence; visible/assistive mismatch |
| Actual result | **Pending — not observed** |
| Attachments and durable evidence | **Pending — none recorded** |
| Five reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Correction | **Pending — none recorded** |
| Rerun | **Pending — not run** |
| Disposition and release effect | **Not run — Pending**; does not pass Gate 0, change Release 1 counts or decisions, or authorize Release 2 |

### A11Y-31-34 / A11Y-31-34-A01: invalidating track conflict

| Evidence field | Fixed Release 2 definition |
|---|---|
| Specification source, decision owners, and linked fixture | §31.6 scenario 34; arrival-truth owner for conflict and row suppression; Guidance Product Lead for positioning omission; Release Quality Lead for this evidence record; [positioning fixture POS-34](../guidance/positioning-rider-experience.md#pos-34-invalidating-track-conflict) |
| Fixed versions | Immutable synthetic `A11Y-31-34-SRC-v1` consuming `POS-34-SRC-v1`; accepted Task 7 baseline commit `3d39129a58b497c92d0125569edebd894c47a71d`; `A11Y-R2-POS-T8-v1` and Task 8 definitions bound by the commit containing this extension; fixed product/build **Pending** |
| Immutable inputs and authoritative relative times | At `T0−30s`, synthetic affected train `TR-A` and unrelated train `TR-U` are independently coherent. At `T0`, `TR-A` develops an explicit invalidating unresolved nonterminal actual-versus-scheduled-track conflict for the target downstream board; `TR-U` remains coherent. Evaluate at `T0+1s`. |
| Expected visible output or omission | Suppress `TR-A`'s row and every dependent platform, positioning, accessibility, and transfer claim. Show exactly **Track change—check station signs** in station context and **Service change—this train's downstream stops are not verified.** in the affected board's suppression state. Preserve `TR-U` when independently admitted. Create no **Check station signs** row for `TR-A`. |
| Expected assistive output or omission | Convey the same station-scoped context, affected-service suppression, dependent omission, and unrelated-service preservation without fabricating an affected train row. |
| Prohibited behavior | Lower-confidence affected row; **Check station signs** row; Scheduled substitute; dependent platform/zone/accessibility/transfer claim; unrelated-service suppression; normal terminal variation treated as this conflict |
| Actual result | **Pending — not observed** |
| Attachments and durable evidence | **Pending — none recorded** |
| Five reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Correction | **Pending — none recorded** |
| Rerun | **Pending — not run** |
| Disposition and release effect | **Not run — Pending**; does not pass Gate 0, change Release 1 counts or decisions, or authorize Release 2 |

### A11Y-31-35 / A11Y-31-35-A01: accessible zone priority

| Evidence field | Fixed Release 2 definition |
|---|---|
| Specification source, decision owners, and linked fixtures | §31.6 scenario 35; Accessibility Product Lead for Accessible Route Only and complete-path decisions; Guidance Product Lead for positioning presentation; Release Quality Lead for this evidence record; [positioning fixture POS-35](../guidance/positioning-rider-experience.md#pos-35-accessible-zone-outranks-quickest-stairs) and [Accessible Route Only fixture ARO-17](accessible-route-only-state-matrix.md#aro-17-verified-accessible-zone-outranks-quickest-stairs) |
| Fixed versions | Immutable synthetic `A11Y-31-35-SRC-v1` consuming `POS-35-SRC-v1` and `ARO-17-SRC-v1`; accepted Task 7 baseline commit `3d39129a58b497c92d0125569edebd894c47a71d`; `A11Y-R2-POS-T8-v1` and Task 8 definitions bound by the commit containing this extension; fixed product/build **Pending** |
| Immutable inputs and authoritative relative times | At `T0−30s` and `T0`, one admitted synthetic train has a complete quickest-stairs Front relationship and a separately complete current verified-accessible Middle relationship. The exact complete street-to-street path, equipment decisions, boarding/exit area, zone relationship, platform, direction, service pattern, and Task 7 evidence pass for Middle. Accessible Route Only is On at evaluation `T0+5s`; a convenience/crowding preference favors Front. |
| Expected visible output or omission | Show **Middle—nearest elevator** as the primary recommendation and explain the verified accessible boarding/exit benefit. No Front stair-based or convenience recommendation overrides it. |
| Expected assistive output or omission | Convey Middle, the verified accessible objective, certainty, Accessible Route Only priority, and the same benefit. Do not announce Front or a crowding/convenience zone as preferred. |
| Prohibited behavior | Quickest stairs, faster transfer, crowding, travel time, or convenience overrides Middle; structural accessibility alone creates a zone; Accessible Route Only silently relaxes or turns Off; rerouted platform inherits the zone; car number; numeric confidence |
| Actual result | **Pending — not observed** |
| Attachments and durable evidence | **Pending — none recorded** |
| Five reviewer decisions | Product **Pending**; Accessibility **Pending**; Data Quality **Pending**; Content **Pending**; Operations **Pending** |
| Correction | **Pending — none recorded** |
| Rerun | **Pending — not run** |
| Disposition and release effect | **Not run — Pending**; does not pass Gate 0, change Release 1 counts or decisions, or authorize Release 2 |

### Release 2 Task 8 evidence readout

| Evidence category | Current Task 8 value | Gate consequence |
|---|---|---|
| Release 2 positioning definitions | 3 total; all **Not run — Pending** | Blocks Task 12 Release 2 consideration |
| Fixed reviewed executable product/build | **Pending** | Blocks |
| Immutable run-bound artifact, input, output, and reviewer package | **Pending** | Blocks |
| Visible and assistive rendered evidence | **Pending — none recorded** | Blocks |
| Product, Accessibility, Data Quality, Content, and Operations decisions | All **Pending** | Blocks |
| Corrections and reruns | **Pending — none recorded** | Blocks |
| Real geometry, route-direction coverage, stations, field checks, or actual-track observations | **None claimed or established** | No Release 2 coverage or result |
| Release 1 census | Preserved at 17 canonical cases, 54 fixture definitions, and 1 pack-local control | Unchanged; every original result remains **Not run — Pending** |
| Release decisions | Gate 0 no-go, Release 1 accessibility no-go, and Nearby/offline no-go remain active; Release 2 not evaluated | No release authorization |

No expected definition is an actual result. A future correction or rerun must preserve these initial Pending attempts, use a new sequential attempt ID, bind a new fixed package, and attach separate durable evidence. A later Pass cannot erase an earlier failure, inconclusive result, or Pending definition.
