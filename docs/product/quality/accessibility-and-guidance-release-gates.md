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

## Task 12 Steps 5–13 final checkpoint

This section is a separately signable, append-only checkpoint. It preserves every byte and decision in `A11Y-R1-GATE-v1` above, including the separate Arrival Truth Gate 0, Nearby/offline, and Release 1 accessibility no-go records, the 17-case/54-definition census, the one failed-response control, all Pending results, and the unsigned Release 1 authorization. A later feature cannot pass, merge, weaken, or waive any of them.

| Checkpoint field | Recorded value |
|---|---|
| Checkpoint identifier | `A11Y-PLATFORM-FINAL-v1`; decision-record identifier only |
| Fixed assessment base | Commit `841b4df8d0b6346cbbde428fbd83d77b2f68b417` |
| Preserved Release 1 prefix | Blob `bbb18d88777258a5136686e92423d3d62b335374`; first 213 lines |
| Owner | Release Quality Lead |
| Evaluation date | 2026-07-30 |
| Governance status | Draft; artifact approvals Pending |
| Actual decision identity | **Pending** |
| Release authorization | **INTENTIONALLY UNSIGNED — REQUIRED FIXED EVIDENCE AND REVIEWER DECISIONS ARE NOT DEMONSTRATED.** |
| Supersedes | None; this checkpoint appends to, and does not replace, `A11Y-R1-GATE-v1` |

The fixed base contains accepted documentation definitions, not working-product evidence. Product/build, configuration, source captures, field inventory, real coverage, outputs, attachments, reviewer identities, signatures, authorization, corrections, and reruns are absent or Pending.

### Independent current feature decisions

| Feature boundary | Current decision | Release effect |
|---|---|---|
| Release 2 positioning and transfer | **NO-GO — RELEASE 2 POSITIONING AND TRANSFER EVIDENCE IS NOT DEMONSTRATED** | No Front/Middle/Back or transfer-likelihood claim is authorized for release. |
| Pre-commute accessibility notification | **NO-GO — PRE-COMMUTE ACCESSIBILITY-NOTIFICATION EVIDENCE IS NOT DEMONSTRATED** | No accessible-path commute push, pilot, or release is authorized. |
| Platform-guidance coverage and reverification | The independently owned current decision is recorded in the [platform coverage register](../guidance/platform-coverage-register.md#task-12-final-platform-coverage-checkpoint). | Missing real coverage cannot inherit a result from positioning, transfer, commute, or crowding. |
| Subway car-level crowding | The independently owned current decision is recorded in the [subway crowding enablement gate](../crowding/subway-crowding-enablement-gate.md#task-12-final-crowding-checkpoint). | Crowding remains a wholly separate omission gate. |

These are four independent feature decisions. No feature waives another, and none waives Gate 0, Nearby/offline, Release 1 accessibility, or the [Task 10 commute-alert decision](../release/commute-alert-go-no-go-record.md#controlling-initial-disposition). Only GO or NO-GO is available at this checkpoint; there is no Conditional GO.

### Immutable evaluated versions

| Evaluated dependency | Immutable accepted version at the fixed base | Checkpoint use |
|---|---|---|
| [Platform evidence standard](../guidance/platform-evidence-standard.md) | Blob `a942d520da172f0c4c983114135d857b6461f572` | Atomic evidence, orientation, conflict, recovery, and Task 10 coverage handoff |
| [Platform state and positioning certainty matrix](../guidance/platform-state-and-certainty-matrix.md) | Blob `e6091e6a9ac9379797f7a9851aa9e172afee6a1f` | 13 PG fixture families and 22 branches |
| [Positioning rider experience](../guidance/positioning-rider-experience.md) | Blob `4ef128ec308e7804c02d36f0c843ca34badfbf37` | `POS-33`–`POS-35` rider and assistive behavior |
| [Transfer connection assessment](../guidance/transfer-connection-assessment.md) | Blob `23cfaba8b512facd163c9bcd2f7be7b4a32e1a6c` | 25 XFER definitions and exact boundary vocabulary |
| [Accessibility acceptance pack](../accessibility/accessibility-acceptance-pack.md) | Blob `caad060f28e50feec9aaea5358c6248a4c26d8bd` | Release 1 census plus appended Release 2 positioning definitions |
| [Complete accessible-path contract](../accessibility/complete-path-contract.md) | Blob `eb0206aab5ebcd6ea6bca73e817c9bc9b1ebfaf1` | Exact selected path and complete-path authority |
| [Accessible Route Only matrix](../accessibility/accessible-route-only-state-matrix.md) | Blob `87136a54aa5b6a21d2617d186255651c0bfa0377` | Hard constraint and accessible-zone priority |
| [Equipment status policy](../accessibility/equipment-status-policy.md) | Blob `dab01743e7226a95288e22071b04651aa5afd2f3` | Equipment state, freshness, and Unknown treatment |
| [Path-impact and reroute playbook](../accessibility/path-impact-and-reroute-playbook.md) | Blob `bad8188c7f2bc134fed15eabfa294a631c8a13ca` | Blocking-path consequence and independently verified alternative |
| [Underway warning matrix](../accessibility/underway-warning-state-matrix.md) | Blob `eecf847e786d0d8fe71a4d378e7ca06135fea152` | Separate Release 1 underway-warning evidence |
| [Commute launch checklist](../release/commute-alert-launch-checklist.md) | Blob `d5e22aacbc3250d63c362953186e1f4631104769` | Fixed prerequisites and strict pre-window target |
| [Commute launch scenarios](../release/commute-alert-scenario-results.md) | Blob `ee17ebee93f4c79f9cafa43f9b3fd028603951bd` | 27 Pending launch fixtures, including scenario 39 |
| [Commute go/no-go record](../release/commute-alert-go-no-go-record.md) | Blob `acf0fe625245b0a943af143499ccb57ecacf6988` | Controlling Task 10 decision and absent fixed evidence |

Accepted commute Tasks 2–10 are bound as immutable documentation inputs: Task 2 `6adc993fb40ece43f1239e17d9e70a39b81f63b4` plus accepted corrective revision `33af4d48f5a6d2d482041cdf2bf94f3c6d8b9a01`; Task 3 `3593416c5a475a43d30bc31160ecba7d803fca53`; Task 4 `d893728d92fc90ebb7f364e9e61f9fecc8ce54e4`; Task 5 `875d5eb9223e3c7b046af6c6346addac8bab0522`; Task 6 `3c38f56624e4e5febf94dfc34a65c84927e04557`; Task 7 `404bad3c9cb9ffa6cb7536dcbb1946c6e1e020d9`; Task 8 `1ba4a96737311261ccbaa22c8b39a537fd82fde7`; Task 9 `a35144d3c3ca049cb2b761b1b8a833c6c151f41f`; and Task 10 `841b4df8d0b6346cbbde428fbd83d77b2f68b417`.

The Task 10 controlling result remains **NO-GO — prerequisites and fixed-version evidence incomplete**. That documentation package contains no fixed executable build, source run, delivery, pilot, reviewer signature, or authorization and therefore supplies no passing commute-notification evidence here.

### Positioning and transfer evidence readout

| Required evidence family | Frozen census | Current fixed evidence | Current effect |
|---|---:|---|---|
| Platform state and positioning certainty | 13 `PG` families / 22 branches | All 22 branches **Not run — Pending** | Blocks |
| Positioning rider experience | 3 definitions: `POS-33`, `POS-34`, `POS-35` | All 3 **Not run — Pending**; counted once, not duplicated by the accessibility pack | Blocks |
| Transfer assessment | 25 `XFER` definitions | All 25 **Not run — Pending** | Blocks |
| Atomic real evidence | Exact station/complex, constituent, route, direction, service pattern, platform/track, stopping relationship, zone geometry, orientation, verification date, sources, conflicts, and independent reviewer package | No fixed real record, source capture, field verification, output, or signature | Blocks |
| Visible and assistive parity | Same state, certainty, scope, order, consequence, conflict, recovery, and action | **Not run — Pending** | Blocks |

Every released positioning or transfer scope must prove complete atomic coverage, current direction/orientation and verification date, exact train/platform relationship, hard-conflict suppression, accessible-zone priority, and independently evidenced recovery after reversal or conflict. A transient conflict cannot rewrite durable geometry; a prior result cannot be mechanically reversed. Current accepted evidence must establish the new orientation and every dependent claim before guidance returns.

The exact transfer boundary fixtures remain:

| Boundary fixture | Exact frozen decision |
|---|---|
| `XFER-B03-BELOW` / `AT` / `ABOVE` | Spare `2:59` is **Tight**; `3:00` and `3:01` are **Likely** |
| `XFER-B05-BELOW` / `AT` / `ABOVE` | Accessible spare `4:59` is **Tight**; `5:00` and `5:01` are **Likely** |
| Optimistic interval versus walk | `O<W` is **Unlikely**; `O=W` is **Uncertain** |
| Conservative interval versus walk | `C=W` is **Tight** |
| Conservative interval with buffer | `C=W+B` is **Likely** |
| Range straddles walk feasibility | **Uncertain** |
| Accessible buffer | Effective accessible minimum is 5 minutes; a smaller stored general preference does not lower it |

No rounding, phone time, board-order estimate, running assumption, guessed platform, guessed zone, historical orientation, or partial accessible chain may strengthen these outcomes.

### Pre-commute accessibility-notification readout

This subdecision binds the accepted commute Tasks 2–10 to actual working-product accessibility evidence; definitions alone do not pass it. It does not replace the separate Release 1 underway-warning gate.

| Required proof | Exact requirement | Current fixed evidence |
|---|---|---|
| Selected path | Exact saved journey occurrence, selected complete path/version, required connection/equipment, route, direction, constituent, entrance, transfer, exit, and consequence | Absent; **Not run — Pending** |
| Blocking truth | Current, coherent, source-owned blocking evidence for that exact path; Unknown remains Unknown and is not an outage or a no-outage claim | Absent; **Not run — Pending** |
| Timing | When complete evidence and all gates are ready before the window, delivery must satisfy `delivery_time < window_start`; exactly at start is late | No delivery or authoritative timing evidence |
| Broken-path role | The failed edge must be required by the selected path and materially change the commute decision | No fixed path-impact execution |
| Alternative | Offer only an independently verified, currently complete alternative; never label an unverified official alternative accessible or silently activate it | No fixed alternative execution |
| Final check | Immediately recheck lifecycle, explicit permission, connectivity, window, source currentness, exact path/scope, vetoes, alternative, hold state, and prior delivery | No final-check attachment |
| Deduplication | One normalized episode/impact/occurrence delivery; wording, source, timestamp, or overlapping-window equivalence causes no second push | No delivery ledger or dedupe execution |
| Visible/assistive parity | Same exact path impact, consequence, certainty, action, timing, and order | No rendered or assistive result |
| Separate underway warning | Release 1 `IMP-09`, `IMP-10`, `IMP-13`, and `IMP-14` evidence remains independently required | **Not run — Pending** under `A11Y-R1-GATE-v1` |

Mandatory commute scenarios remain definitions only:

| Scenario | Required accessibility-notification boundary | Current result |
|---|---|---|
| 36 | Unused saved segment is Suppress with no push | **Not run — Pending** |
| 37 | Exact saved-origin bypass produces exactly one actionable push when every gate passes | **Not run — Pending** |
| 38 | Wording-only equivalent produces no duplicate | **Not run — Pending** |
| 39 | Exact required elevator failure produces a path-scoped alert strictly before start when ready pre-window, plus only an independently verified alternative | **Not run — Pending** |
| 48 | Four minutes and exactly five minutes suppress; above five requires the accepted persistence and final recheck | **Not run — Pending** |
| 42 where time affects the decision | Authoritative source chronology controls; phone time never strengthens freshness or persistence | **Not run — Pending** |

No operational-case count is established or inferred from these definitions. No source capture, real commute, fixed build, notification attempt, acknowledgment, visible/assistive output, reviewer decision, correction, rerun, or pilot evidence exists.

### Cross-risk and terminology reconciliation

The following vocabularies remain exact and independent:

- snapshot: **Current**, **Degraded**, **Unavailable**, **Provisional empty**;
- equipment: **No official outage reported**, **Out of service**, **Planned outage**, **Unknown**;
- positioning: **Verified**, **Expected**, **Unavailable**;
- platform: **Platform confirmed**, **Expected platform**, **Check station signs**; and
- transfer: **Likely**, **Tight**, **Uncertain**, **Unlikely**.

Raw or unconfirmed empty, stale, anomalous, failed, malformed, incomplete, unmatched, or unjoinable evidence never becomes **No official outage reported**. **Unknown** never becomes an outage or a no-outage state. Transfer **Uncertain** is not platform **Check station signs**, positioning **Unavailable**, or arrival **Arrival uncertain**.

For an invalidating nonterminal actual-versus-scheduled-track conflict, preserve exact visible and assistive context **Track change—check station signs** and exact explanation **Service change—this train's downstream stops are not verified.** Suppress the affected arrival row and every dependent platform, positioning, transfer, and accessibility claim while preserving unrelated service. Offline treatment preserves exact **Offline—live arrivals, alerts, and elevator status are unavailable.**

Accessibility and safe-platform guidance always outrank fastest exit, quickest transfer, or crowding convenience. No positioning claim may strengthen platform truth; no transfer arithmetic may repair a missing interval, failed path, hard conflict, or Unknown equipment state; no commute push may establish operational truth.

The artifact index does not contain the full Task 12 final-checkpoint provenance and does not include Privacy in the commute-notification reviewer set. Product Governance reconciliation remains **Pending**; this checkpoint does not edit the index or infer approval.

### Artifact review and authorization

Artifact approval and feature authorization are separate. Assignment, authorship, a task review, attendance, silence, or another feature's decision is not approval.

| Feature package | Reviewer role | Actual reviewer identity | Artifact decision | Decision date | Durable signature/evidence | Correction/rerun |
|---|---|---|---|---|---|---|
| Positioning/transfer | Product | **Pending** | **Pending** | **Pending** | **Pending** | **Pending — none recorded** |
| Positioning/transfer | Accessibility | **Pending** | **Pending** | **Pending** | **Pending** | **Pending — none recorded** |
| Positioning/transfer | Data Quality | **Pending** | **Pending** | **Pending** | **Pending** | **Pending — none recorded** |
| Positioning/transfer | Content | **Pending** | **Pending** | **Pending** | **Pending** | **Pending — none recorded** |
| Positioning/transfer | Operations | **Pending** | **Pending** | **Pending** | **Pending** | **Pending — none recorded** |
| Pre-commute accessibility notification | Product | **Pending** | **Pending** | **Pending** | **Pending** | **Pending — none recorded** |
| Pre-commute accessibility notification | Accessibility | **Pending** | **Pending** | **Pending** | **Pending** | **Pending — none recorded** |
| Pre-commute accessibility notification | Data Quality | **Pending** | **Pending** | **Pending** | **Pending** | **Pending — none recorded** |
| Pre-commute accessibility notification | Content | **Pending** | **Pending** | **Pending** | **Pending** | **Pending — none recorded** |
| Pre-commute accessibility notification | Privacy | **Pending** | **Pending** | **Pending** | **Pending** | **Pending — none recorded** |
| Pre-commute accessibility notification | Operations | **Pending** | **Pending** | **Pending** | **Pending** | **Pending — none recorded** |

| Authorization field | Positioning/transfer | Pre-commute accessibility notification |
|---|---|---|
| Fixed same-version package | **Pending** | **Pending** |
| Actual decision owner | **Pending** | **Pending** |
| Five/six required signatures | **Pending** | **Pending** |
| Artifact approval | **Pending** | **Pending** |
| Release authorization | **Unsigned** | **Unsigned** |

GO requires every definition and real-scope row to **Run — Pass** on one immutable package, no unresolved safety or cross-risk finding, and every mandatory same-package signature. Any Pending, missing evidence, **Run — Fail**, **Run — Inconclusive**, **Changes required**, version mismatch, missing signature, or safety finding requires NO-GO. No conditional, risk acceptance, feature trade, or partial scope may waive a blocker.

### Append-only correction and reevaluation

No correction or rerun is recorded. A future correction must name its bounded scope, owner, original and corrected immutable versions, affected evidence, and reason. Preserve every original Pending, failed, inconclusive, prohibited, and reviewer result. Append a new sequential attempt and a new separately signed feature decision; never rewrite this checkpoint. A future GO cannot erase this no-go or any independent upstream no-go.
