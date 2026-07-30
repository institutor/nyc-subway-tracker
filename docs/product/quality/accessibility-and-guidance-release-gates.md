# Accessibility and guidance release gates

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§29.1, 29.3–29.4, 31.5–31.6, 32.2–32.3, and applying §§33.1–33.3; accessibility and platform-guidance plan `Product artifact map` and Task 12 Steps 1–4 |
| Owner | Release Quality Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Not run — Pending |

## Checkpoint purpose and authority

This append-only record applies Task 12 Steps 1–4 to the fixed Release 1 accessibility package. Gate identifier `A11Y-R1-GATE-v1` identifies this decision record only. It is not a product or build version, governed artifact approval, coverage version, working-product run, reviewer signature, or release authorization.

The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. The [Release 1 accessibility acceptance pack](../accessibility/accessibility-acceptance-pack.md) owns the Task 6 evidence inventory; this record evaluates that frozen inventory without rewriting it. Artifact lifecycle and reviewer decisions follow the [product artifact review and approval policy](../review-and-approval-policy.md).

The [product artifact index](../artifact-index.md) cites specification §§29.1, 29.3–29.4, 31.5–31.6, and 32.2–32.3 for this record. Its omission of applying risk §§33.1–33.3 and detailed Task 12 Steps 1–4 provenance is **Pending** Product Governance reconciliation. This checkpoint does not edit the index or treat the mismatch as approved.

Review-clean SDD task commits show that the documentation tasks passed their task review. They do not establish governed artifact approval, product execution, real-world coverage, reviewer decisions, or release authorization. This artifact therefore remains **Draft** even though the evidence below deterministically requires a no-go.

## Independent decisions

| Decision boundary | Authoritative current outcome | Effect at this checkpoint |
|---|---|---|
| Arrival-truth Gate 0 | **NO-GO — GATE 0 NOT PASSED** | Public arrival boards remain blocked. |
| Nearby/offline Release 1 | The separate [Nearby and offline Release 1 readiness record](../nearby-offline/release-1-readiness.md) remains **NO-GO — GATE 0 NOT PASSED** under its own evidence, rights, dependency, and six-reviewer gates. | Remains active and separate; this accessibility record neither merges, overrides, nor passes it. |
| Release 1 accessibility | **NO-GO — REQUIRED ACCESSIBILITY EVIDENCE AND COVERAGE ARE NOT DEMONSTRATED** | Direction-aware accessibility, live equipment-status treatment, and Accessible Route Only are not authorized for release. |

The Release 1 accessibility result is a recorded deterministic no-go, not a Pending non-decision and not a signed approval. Platform positioning, transfer guidance, crowding, commute-window work, or another workstream cannot waive an accessibility safety blocker.

## Fixed evaluated package

The assessment is fixed to Task 6 commit `935c79477ccc73cb9d27fde06f31e8f31e85eca9`. The checkpoint commit that contains this record and the acceptance-pack handoff binds those new documents after commit; this record does not invent its own future blob.

### Task 6 package and handoff revisions

| Evaluated Task 6 artifact | Immutable blob at evaluated commit | Package role |
|---|---|---|
| [Release 1 accessibility acceptance pack](../accessibility/accessibility-acceptance-pack.md) | `ac5ad77627588b50f0ec5ed8d9111c5cb01326ae` | `A11Y-R1-PACK-v1` evidence definition and Task 12 input |
| [Station-direction coverage register](../accessibility/station-direction-coverage-register.md) | `dee79c34eeb07864c8453c1d05ba01ca2408f310` | Task 6 structural-coverage handoff; zero real rows |
| [Equipment-status acceptance table](../accessibility/equipment-status-acceptance-table.md) | `09d2ee2400726baa4362ad7bcb402306117408f6` | Task 6 equipment-boundary handoff |

### Applying Task 1–5 immutable inputs

| Task | Applying artifact | Immutable input blob listed by `A11Y-R1-PACK-v1` | Accepted task provenance | SDD task review | Governance lifecycle | Product execution | Gate effect |
|---:|---|---|---|---|---|---|---|
| 1 | [Complete accessible-path contract](../accessibility/complete-path-contract.md) | `eb0206aab5ebcd6ea6bca73e817c9bc9b1ebfaf1` | `37c50c12b797304ac14d327bed40239585c5fd36` | Review-clean | Draft / approval Pending | **Not run — Pending** | Blocks GO |
| 1–2 | [Accessible path-edge review checklist](../accessibility/path-edge-review-checklist.md) | `4ab7fed7ac7898fd32b0903abc312d7ac86d3d27` | Created by `37c50c12b797304ac14d327bed40239585c5fd36`; accepted Task 2 revision `c42f28fa81badc09bc11329fcaca6499569cf0b3` | Review-clean | Draft / approval Pending | **Not run — Pending** | Blocks GO |
| 2 | [Station-direction coverage register](../accessibility/station-direction-coverage-register.md) | `bd75501c771bfb4265f84243af5648664d402dd7` | `c42f28fa81badc09bc11329fcaca6499569cf0b3` | Review-clean | Draft / approval Pending | **Not run — Pending** | Blocks GO |
| 2 | [Station-direction review guide](../accessibility/station-direction-review-guide.md) | `795aed8a2342021a27ac68ec1182b755ccfb28bd` | `c42f28fa81badc09bc11329fcaca6499569cf0b3` | Review-clean | Draft / approval Pending | **Not run — Pending** | Blocks GO |
| 3 | [Accessible Route Only state matrix](../accessibility/accessible-route-only-state-matrix.md) | `9d9dbec8c8ab4f350c3e5b6837ad3be07979933f` | `53057ff764e6e5d0c89903b37deb566b422a2005` | Review-clean | Draft / approval Pending | **Not run — Pending** | Blocks GO |
| 3–5 | [Accessibility copy catalog](../accessibility/accessibility-copy-catalog.md) | `a15616144d572c419e7dc387bec4c3c758c620f7` | Created by `53057ff764e6e5d0c89903b37deb566b422a2005`; accepted revisions `9d4372d45973fd3dfa84777696350c274bea5d81` and `29699e15d88c018318e7c8918d2937239953f857` | Review-clean | Draft / approval Pending | **Not run — Pending** | Blocks GO |
| 4 | [Equipment status policy](../accessibility/equipment-status-policy.md) | `dab01743e7226a95288e22071b04651aa5afd2f3` | `9d4372d45973fd3dfa84777696350c274bea5d81` | Review-clean | Draft / approval Pending | **Not run — Pending** | Blocks GO |
| 4 | [Equipment-status acceptance table](../accessibility/equipment-status-acceptance-table.md) | `66b6230d7ed70857635a682fd7064c6447f18c63` | `9d4372d45973fd3dfa84777696350c274bea5d81` | Review-clean | Draft / approval Pending | **Not run — Pending** | Blocks GO |
| 5 | [Accessible path-impact and reroute playbook](../accessibility/path-impact-and-reroute-playbook.md) | `bad8188c7f2bc134fed15eabfa294a631c8a13ca` | `29699e15d88c018318e7c8918d2937239953f857` | Review-clean | Draft / approval Pending | **Not run — Pending** | Blocks GO |
| 5 | [Underway accessibility-warning state matrix](../accessibility/underway-warning-state-matrix.md) | `eecf847e786d0d8fe71a4d378e7ca06135fea152` | `29699e15d88c018318e7c8918d2937239953f857` | Review-clean | Draft / approval Pending | **Not run — Pending** | Blocks GO |
| 6 | [Release 1 accessibility acceptance pack](../accessibility/accessibility-acceptance-pack.md) | `ac5ad77627588b50f0ec5ed8d9111c5cb01326ae` | `935c79477ccc73cb9d27fde06f31e8f31e85eca9` | Review-clean | Draft / approval Pending | **Not run — Pending** | Blocks GO |
| 6 | [Station-direction coverage register handoff](../accessibility/station-direction-coverage-register.md) | `dee79c34eeb07864c8453c1d05ba01ca2408f310` | `935c79477ccc73cb9d27fde06f31e8f31e85eca9` | Review-clean | Draft / approval Pending | **Not run — Pending**; zero real rows | Blocks GO |
| 6 | [Equipment-status acceptance-table handoff](../accessibility/equipment-status-acceptance-table.md) | `09d2ee2400726baa4362ad7bcb402306117408f6` | `935c79477ccc73cb9d27fde06f31e8f31e85eca9` | Review-clean | Draft / approval Pending | **Not run — Pending** | Blocks GO |

### Controlling dependency and separate-gate revisions

| Controlling input | Immutable blob at evaluated commit | Assessment role |
|---|---|---|
| [Accessibility and platform-guidance plan](../../superpowers/plans/2026-07-30-accessibility-and-platform-guidance-plan.md) | `dd21b3c7228986d3177594788521c4ef7f873492` | Task 12 Steps 1–4 and checkpoint boundary |
| [Approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) | `9840d6c5687771d00ce8d0b9a1116ac84347e0e6` | Controlling requirements and risks |
| [Product artifact index](../artifact-index.md) | `78f902903d4a07a381e7d6929264a9929822c266` | Indexed owner, reviewers, lifecycle, and provenance |
| [Product artifact review and approval policy](../review-and-approval-policy.md) | `c70d1795decf4a5a4c276718fd8b5fb36891a06e` | Approval, result, correction, and rerun rules |
| [Gate 0 exit record](gate-0-exit-record.md) | `ca74378243a7e32e5030de556e812c86b26964f6` | Separate authoritative arrival-truth no-go |
| [Gate 0 validation results](gate-0-validation-results.md) | `2a6ee44e6b6290d11b0865eb57e5158585f03338` | Gate 0 evidence state and blocking deviations |
| [Nearby and offline Release 1 readiness](../nearby-offline/release-1-readiness.md) | `d8eaf46030a5e16169d5a78d12b869ede7d06bd6` | Separate Nearby/offline no-go |

The fixed product/build, configuration, source snapshot, official equipment inventory, structural coverage, output, attachment, reviewer package, and every run-bound field remain **Pending**. No source capture, product result, real station verification, reviewer approval, or authorization is inferred from the immutable documentation revisions.

## Release 1 accessibility GO rule

GO requires every criterion below to pass on one fixed product, artifact, dependency, input, output, attachment, coverage, and reviewer package. Any **Not run — Pending**, **Run — Fail**, **Run — Inconclusive**, missing field, missing attachment, missing reviewer, unmeasured zero-tolerance target, unsupported scope, or unresolved safety issue yields NO-GO.

| Criterion | Required for GO | Current evidence | Current effect |
|---|---|---|---|
| Governed artifacts | Applicable Tasks 1–6 artifacts approved against the same package | Review-clean task commits exist; governed artifacts remain Draft/Pending | Blocks GO |
| Canonical cases | All 17 Task 6 source cases **Run — Pass** | 17 of 17 **Not run — Pending** | Blocks GO |
| Fixture definitions | All 54 applicable definitions supported by same-version evidence | 54 of 54 **Not run — Pending** | Blocks GO |
| Failed-response control | Pack-local failed/malformed/incomplete/unjoinable control passes | **Not run — Pending** | Blocks GO |
| Direction-aware coverage | Eligible reviewed real rows for every released station-direction scope | Zero real rows; zero eligible combinations established | Blocks GO; absence is not proof of inaccessibility |
| Complete path | Exact street-to-street path, all edges, direction, entrance, platform, boarding area, and egress pass | No fixed working-product execution | Blocks GO |
| Accessible Route Only | Hard constraint and no-route/offline behavior pass visibly and assistively | No fixed visible or assistive product result | Blocks GO |
| Known-outage target | Zero accepted recommendations through a known broken required elevator on an adequate observed denominator | Not measured; no observed denominator; `0/0` is not Pass | Blocks GO |
| Unknown-state safety | **raw/unconfirmed empty**, stale, anomalous, failed, malformed, incomplete, unmatched, or unjoinable responses never create positive no-outage or accessibility truth | Contract defined; no execution | Blocks GO |
| Valid no-outage controls | EQ-06 and EQ-13 behave only within their exact accepted gates | Definitions Pending; no execution | Blocks GO |
| Underway warning | Blocking path change warns before the last accessible decision when timing permits, names exact impact, and offers only the first verified action | IMP-09, IMP-10, IMP-14, and outputs **Not run — Pending** | Blocks GO |
| Visible/assistive parity | Same state, scope, certainty, consequence, order, and action on one fixed run | Pending | Blocks GO |
| Mandatory review | Product, Accessibility, Data Quality, Content, and Operations approve the same fixed package with durable signatures | All actual identities, decisions, and signatures Pending | Blocks GO |
| Safety findings | No unresolved safety or evidence blocker | Missing evidence and empty coverage are unresolved blockers | Requires NO-GO |

## Equipment and warning safety evidence

The accepted Task 6 reconciliation remains exact:

> **raw/unconfirmed empty**, stale, anomalous, failed, malformed, incomplete, unmatched, or unjoinable responses never become **No official outage reported**.

This does not erase the valid confirmed-empty EQ-06 branch or the healthy non-empty exact-target EQ-13 branch. Each remains eligible only within its exact accepted gates and only after same-version execution and review. A prior adverse state remains **Out of service—status being rechecked** until qualifying exact-machine restoration evidence passes. A machine-level result never establishes complete-path acceptance by itself.

Release 1 underway-warning evidence must demonstrate all of the following on one fixed run:

1. accepted authoritative detection time and current equipment and path evidence;
2. the known last accessible decision point when verified structure and the rider-confirmed manual cursor establish one, or an immediate warning without invented position when they do not;
3. the exact failed or Unknown connection, journey consequence, first verified action, and freshness;
4. visible and assistive warning priority before lower-order updates;
5. no instruction to alight at an inaccessible or unverified station; and
6. warning persistence until the rider explicitly selects a verified replacement or a fresh complete-path acceptance resolves the warning.

IMP-09, IMP-10, IMP-13, IMP-14, their visible and assistive outputs, warning order, timing, persistence, and action evidence remain **Not run — Pending**. Task 5's scenario-39 handoff records accessibility impact only; it is not commute push evidence. Notification eligibility, timing, permission, deduplication, delivery, and pilot evidence are outside this checkpoint.

## Coverage, exclusions, and unsupported scope

| Coverage field | Checkpoint result |
|---|---|
| Coverage included | **None** |
| Real station-direction rows | **0** |
| Structurally accepted rows | **0** |
| Release 1 eligible station-direction combinations | **0 established** |
| Explicit exclusions | All real station complexes, constituent stations, routes or lines, directions, entrances and corners, platforms, boarding areas, complete paths and edges, exits and street endpoints, equipment, and journey scopes |
| Unsupported-scope treatment | Every excluded real-world scope remains unsupported and ineligible for an accessible-now claim |
| Interpretation guard | Absence or exclusion is not evidence that a station, direction, path, or other real-world scope is inaccessible |

No uncovered station, constituent, route, direction, entrance, platform, boarding area, path, exit, equipment item, or journey may inherit evidence from another scope.

## Unresolved blocking findings

| Finding ID | Unresolved finding | Required correction evidence | Current effect |
|---|---|---|---|
| `A11Y-R1-B001` | No fixed executable product/build or complete run-bound package exists. | Bind and execute one reproducible same-version product, artifact, configuration, data, source, inventory, coverage, copy, warning, output, attachment, and reviewer package. | Blocks GO |
| `A11Y-R1-B002` | All 17 canonical source cases are **Not run — Pending**. | Preserve separate attempts and complete every required visible, assistive, lineage, attachment, and review field. | Blocks GO |
| `A11Y-R1-B003` | All 54 fixture definitions are **Not run — Pending**. | Produce same-version evidence for every definition without double-counting or treating prose as a run. | Blocks GO |
| `A11Y-R1-B004` | The pack-local failed-response control is **Not run — Pending**. | Run the failed, malformed, incomplete, unmatched, and unjoinable branches and demonstrate conservative outcomes. | Blocks GO |
| `A11Y-R1-B005` | Real station-direction coverage is empty. | Add fully reviewed real 26-field rows for each released scope with exact entrances, directions, paths, restrictions, verification dates, evidence, and decisions. | Blocks GO |
| `A11Y-R1-B006` | The known-outage target has no observed denominator or result; `0/0` is not Pass. | Demonstrate zero accepted routes through known broken required elevators over an adequate, declared, nonzero observed denominator. | Blocks GO |
| `A11Y-R1-B007` | The Unknown-state target and valid EQ-06/EQ-13 controls have definitions but no execution. | Demonstrate every negative branch, both exact positive branches, prior-adverse preservation, and prohibited-result checks. | Blocks GO |
| `A11Y-R1-B008` | No visible or assistive product output or parity evidence exists. | Capture equivalent state, scope, certainty, consequence, order, and action with durable rendered and assistive evidence. | Blocks GO |
| `A11Y-R1-B009` | No underway-warning detection, decision-point, timing, priority, safe-action, or persistence evidence exists. | Execute IMP-09, IMP-10, IMP-13, and IMP-14 against authoritative timing and complete-path evidence. | Blocks GO |
| `A11Y-R1-B010` | No actual named Product, Accessibility, Data Quality, Content, or Operations reviewer decision or signature exists. | Record role-specific decisions and durable signatures against the same fixed package. | Blocks GO |
| `A11Y-R1-B011` | Arrival-truth Gate 0 and the separate Nearby/offline Release 1 record remain no-go. | Resolve each record only through its own complete fixed evidence, review, and append-only reconsideration path. | Remains active; cannot be waived here |

No finding is closed, waived, downgraded, or inferred safe at this checkpoint.

## Artifact review record

Artifact review and the gate decision are separate. Assignment, document authorship, a meeting, task review, or silence is not approval.

| Artifact/package revision | Reviewer role | Actual reviewer identity | **Approve** or **Changes required** | Decision date | Durable signature/evidence link | Findings and correction/rerun link |
|---|---|---|---|---|---|---|
| Task 6 commit `935c79477ccc73cb9d27fde06f31e8f31e85eca9`; pack blob `ac5ad77627588b50f0ec5ed8d9111c5cb01326ae` | Product | **Pending** | **Pending** | **Pending** | **Pending** | **Pending — no correction or rerun recorded** |
| Task 6 commit `935c79477ccc73cb9d27fde06f31e8f31e85eca9`; pack blob `ac5ad77627588b50f0ec5ed8d9111c5cb01326ae` | Accessibility | **Pending** | **Pending** | **Pending** | **Pending** | **Pending — no correction or rerun recorded** |
| Task 6 commit `935c79477ccc73cb9d27fde06f31e8f31e85eca9`; pack blob `ac5ad77627588b50f0ec5ed8d9111c5cb01326ae` | Data Quality | **Pending** | **Pending** | **Pending** | **Pending** | **Pending — no correction or rerun recorded** |
| Task 6 commit `935c79477ccc73cb9d27fde06f31e8f31e85eca9`; pack blob `ac5ad77627588b50f0ec5ed8d9111c5cb01326ae` | Content | **Pending** | **Pending** | **Pending** | **Pending** | **Pending — no correction or rerun recorded** |
| Task 6 commit `935c79477ccc73cb9d27fde06f31e8f31e85eca9`; pack blob `ac5ad77627588b50f0ec5ed8d9111c5cb01326ae` | Operations | **Pending** | **Pending** | **Pending** | **Pending** | **Pending — no correction or rerun recorded** |

## Gate decision record

| Gate-decision field | Recorded value |
|---|---|
| Gate ID and evaluated package | `A11Y-R1-GATE-v1`; Task 6 commit `935c79477ccc73cb9d27fde06f31e8f31e85eca9`; acceptance-pack blob `ac5ad77627588b50f0ec5ed8d9111c5cb01326ae`; handoff blobs `dee79c34eeb07864c8453c1d05ba01ca2408f310` and `09d2ee2400726baa4362ad7bcb402306117408f6` |
| Evidence owner | Release Quality Lead |
| Actual named decision identity | **Pending** |
| Evaluation date | 2026-07-30 |
| Unresolved blockers | `A11Y-R1-B001` through `A11Y-R1-B011`; none closed or waived |
| Scenario and control census | 17 of 17 canonical cases **Not run — Pending**; 54 of 54 fixture definitions **Not run — Pending**; 1 pack-local failed-response control **Not run — Pending** |
| Coverage included | **None**; 0 real rows, 0 structurally accepted rows, and 0 eligible station-direction combinations established |
| Exclusions and explicitly unsupported scope | All real station/complex, constituent, route/line, direction, entrance/corner, platform, boarding area, complete-path/edge, exit/street-endpoint, equipment, and journey scopes; exclusion is not evidence of inaccessibility |
| Known-outage safety target and denominator | **Not measured — blocks GO**; numerator and observed denominator unavailable; `0/0` is not Pass |
| Unknown-state safety target and denominator | **Not measured — blocks GO**; no fixed executed response/control census or denominator exists |
| GO or NO-GO | **NO-GO — REQUIRED ACCESSIBILITY EVIDENCE AND COVERAGE ARE NOT DEMONSTRATED** |
| Release authorization/signature | **INTENTIONALLY UNSIGNED — REQUIRED EVIDENCE, COVERAGE, AND REVIEWER DECISIONS ARE NOT DEMONSTRATED.** |

## Correction, rerun, and reevaluation

This decision is append-only:

1. Preserve this no-go, its fixed inputs, exclusions, target denominators, reviewer state, and every blocker.
2. Record any correction with its exact bounded scope, correction owner, affected artifacts, and new fixed product and evidence package.
3. Preserve original failed, inconclusive, or Pending evidence and create new sequential attempts with separate durable evidence.
4. Reevaluate through a new linked gate decision only after a complete same-version evidence and reviewer set exists.
5. A later GO never erases this no-go.
6. Any future **Approved** transition or artifact-index status change requires explicit Product Governance coordination outside this checkpoint.

| Append-only field | Current value |
|---|---|
| Correction scope and owner | **Pending — no correction recorded** |
| Corrected fixed package | **Pending** |
| Rerun attempts and durable evidence | **Pending — no rerun recorded** |
| Linked future gate reevaluation | **Pending — no reevaluation recorded** |
| Preserved checkpoint result | **NO-GO — REQUIRED ACCESSIBILITY EVIDENCE AND COVERAGE ARE NOT DEMONSTRATED** |

## Later Task 12 checkpoint boundary

Task 12 Steps 5–13 are **Pending — not evaluated at checkpoint 1**.

| Later scope | Status |
|---|---|
| Steps 5–6 — Release 2 positioning and transfer evidence | **Pending — not evaluated at checkpoint 1** |
| Step 7 — pre-commute accessibility-notification evidence | **Pending — not evaluated at checkpoint 1** |
| Step 8 — platform-feedback observability | **Pending — not evaluated at checkpoint 1** |
| Step 9 — guidance coverage expansion | **Pending — not evaluated at checkpoint 1** |
| Step 10 — subway crowding gate | **Pending — not evaluated at checkpoint 1** |
| Step 11 — cross-risk controls | **Pending — not evaluated at checkpoint 1** |
| Step 12 — later feature decisions | **Pending — not evaluated at checkpoint 1** |
| Step 13 — final terminology review | **Pending — not evaluated at checkpoint 1** |

No future platform-coverage register, crowding gate, Release 2 result, commute-notification result, cross-risk result, or terminology decision is created or claimed here. None can waive this Release 1 safety blocker. Task 7 starts only after this checkpoint decision is recorded.
