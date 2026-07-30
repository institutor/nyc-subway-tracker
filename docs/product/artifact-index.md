# Product artifact index

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§3.1–3.3, 31, 34; all `Product artifact map` and `Artifacts` sections in the four workstream plans; Task 0.1 brief |
| Owner | Product Governance Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |

## How to read this index

This index catalogs every unique planned path from the four workstream inventories. An artifact listed as **Draft** may still be planned rather than written; the date validates its inventory metadata against the named plan, not the artifact's future content.

Reviewer codes are **P** Product, **A** Accessibility, **D** Data Quality, **C** Content, **R** Privacy, and **O** Operations. **A: Pending; S: Pending** means approval evidence and scenario-result evidence have not yet been produced. **None** in the supersession column means no superseded document is identified.

## Authority and precedence

1. The approved product specification controls every conflict.
2. An approved policy or contract owns only the single decision boundary named in its index purpose. The most narrowly scoped approved policy or contract controls within that boundary, but it cannot weaken the specification or a conservative truth rule.
3. A matrix, decision table, field dictionary, copy catalog, checklist, playbook, or template applies its owning policy or contract; it cannot override it.
4. An acceptance case, scenario result, evidence register, coverage register, scorecard, risk register, incident log, validation result, readiness record, or gate record proves, measures, or records a decision; it does not create a conflicting product rule.
5. A cross-domain glossary or decision record supplies shared terminology or a recorded cross-domain choice only where a more specific approved artifact does not own the decision.
6. If two approved artifacts still appear to own the same decision, neither silent recency nor file location resolves the conflict. The specification controls, both artifacts return to **Draft**, and all reviewers required by either row review an explicit precedence decision.

A train must never be shown at a bypassed stop. Any decision that weakens this rule returns to fresh Product and Data Quality review under the [review and approval policy](review-and-approval-policy.md).

## Arrival truth and service changes

Source inventory: `docs/superpowers/plans/2026-07-30-arrival-truth-and-service-changes-plan.md`, each named Task `Artifacts` section.

| Artifact | Single purpose and authority boundary | Source sections | Owner | Required reviewers | State | Validated | Supersedes | Evidence |
|---|---|---|---|---|---|---|---|---|
| `docs/product/arrival-truth/core-arrival-contract.md` | Own the arrival-board eligibility invariant and conservative guarantee. | Arrival plan Task 1 `Artifacts`; spec §§3–4, 34 | Product Truth Lead | P, D | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/contracts/transit-product-glossary.md` | Own shared transit-product term definitions. | Arrival plan Task 1 `Artifacts`; spec §§2.4, 4, 34 | Product Governance Lead | P, A, D, C, R, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/arrival-truth/source-role-and-precedence-matrix.md` | Own source roles and conflict precedence. | Arrival plan Task 2 `Artifacts`; spec §6 | Product Truth Lead | P, D | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/arrival-truth/evidence-veto-catalog.md` | Own the catalog of negative evidence that vetoes a prediction. | Arrival plan Task 2 `Artifacts`; spec §§3.2–3.3, 6, 8 | Product Truth Lead | P, D | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/arrival-truth/source-evidence-register.md` | Record approved source evidence, role, and review currency. | Arrival plan Task 2 `Artifacts`; spec §§6, 12 | Data Quality Lead | P, D, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/arrival-truth/time-and-train-continuity-policy.md` | Own service-day, clock, and train-continuity rules. | Arrival plan Task 3 `Artifacts`; spec §5 | Product Truth Lead | P, D | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/arrival-truth/time-and-identity-acceptance-cases.md` | Prove time and train-identity boundary behavior. | Arrival plan Task 3 `Artifacts`; spec §§5, 31.1, 31.7 | Release Quality Lead | P, D, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/arrival-truth/feed-health-policy.md` | Own route-level feed-health and freshness decisions. | Arrival plan Task 4 `Artifacts`; spec §9 | Data Quality Lead | P, D, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/arrival-truth/snapshot-anomaly-and-recovery-cases.md` | Prove bulk-drop, timestamp-regression, and recovery behavior. | Arrival plan Task 4 `Artifacts`; spec §§9, 31.3 | Release Quality Lead | P, D, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/arrival-truth/arrival-admission-and-ordering-contract.md` | Own exact-stop admission and chronological next-three ordering. | Arrival plan Task 5 `Artifacts`; spec §§7, 31.1 | Product Truth Lead | P, D | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/arrival-truth/arrival-board-decision-table.md` | Apply arrival admission, ordering, bypass, and suppression rules to explicit outcomes. | Arrival plan Tasks 5, 7, and 9 `Artifacts`; spec §§3, 7–10 | Product Truth Lead | P, D | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/arrival-truth/service-change-impact-and-resolution-policy.md` | Own service-change impact classification and narrowest rider consequence. | Arrival plan Task 6 `Artifacts`; spec §§8, 22 | Product Truth Lead | P, D, C | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/arrival-truth/service-change-scope-cases.md` | Prove station, direction, segment, train, and transfer impact scope. | Arrival plan Tasks 6 and 12 `Artifacts`; spec §§22, 31.2 | Release Quality Lead | P, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/arrival-truth/reroute-and-track-conflict-playbook.md` | Own planned, unplanned, reroute, short-turn, and track-conflict decisions. | Arrival plan Task 7 `Artifacts`; spec §§8.2–8.6 | Product Truth Lead | P, D, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/arrival-truth/reroute-short-turn-and-bypass-cases.md` | Prove reroute, short-turn, skipped-stop, and bypass outcomes. | Arrival plan Tasks 7 and 12 `Artifacts`; spec §§8, 31.2 | Release Quality Lead | P, D, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/arrival-truth/arrival-confidence-and-ghost-policy.md` | Own rider-visible confidence states and the ghost lifecycle. | Arrival plan Task 8 `Artifacts`; spec §10 | Product Truth Lead | P, D, C | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/arrival-truth/ghost-lifecycle-boundary-cases.md` | Prove Due, Holding, disappearance, grace, and ghost boundaries. | Arrival plan Tasks 8 and 12 `Artifacts`; spec §§10, 31.3 | Release Quality Lead | P, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/arrival-truth/suppression-grace-and-recovery-policy.md` | Own hard suppression, disappearance grace, and coherent recovery. | Arrival plan Task 9 `Artifacts`; spec §§9.3, 10.3–10.4 | Product Truth Lead | P, D, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/arrival-truth/suppression-and-recovery-cases.md` | Prove suppression, grace, and recovery transitions. | Arrival plan Tasks 9 and 12 `Artifacts`; spec §§10.3–10.4, 31.3 | Release Quality Lead | P, D, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/arrival-truth/schedule-fallback-and-currency-policy.md` | Own schedule fallback, edition supersession, and currency labels. | Arrival plan Task 10 `Artifacts`; spec §11 | Product Truth Lead | P, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/arrival-truth/schedule-currency-boundary-cases.md` | Prove schedule edition, age, overlap, and fallback boundaries. | Arrival plan Tasks 10 and 12 `Artifacts`; spec §§11, 31.8 | Release Quality Lead | P, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/arrival-truth/provenance-quarantine-and-correction-policy.md` | Own truth-decision provenance, quarantine, and correction. | Arrival plan Task 11 `Artifacts`; spec §27 | Data Quality Lead | P, D, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/quality/arrival-truth-decision-review-template.md` | Standardize review evidence for an arrival-truth decision. | Arrival plan Task 11 `Artifacts`; spec §§27.1, 27.4 | Release Quality Lead | P, D, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/quality/quarantine-recovery-review-cases.md` | Prove quarantine entry, review, correction, and recovery. | Arrival plan Task 11 `Artifacts`; spec §§27.2–27.4, 31.1, 31.3 | Release Quality Lead | P, D, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/quality/arrival-truth-risk-register.md` | Record arrival-truth risks, controls, owners, and review state. | Arrival plan Task 11 `Artifacts`; spec §§27, 33.1 | Data Quality Lead | P, D, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/quality/arrival-truth-acceptance-catalog.md` | Consolidate the authoritative arrival-truth acceptance scenario inventory. | Arrival plan Task 12 `Artifacts`; spec §§31.1–31.3, 31.7–31.8 | Release Quality Lead | P, D, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/quality/arrival-truth-requirement-traceability.md` | Trace each arrival-truth requirement to its owner and acceptance evidence. | Arrival plan Task 12 `Artifacts`; spec §§3–12, 22, 27, 31 | Product Governance Lead | P, D, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/quality/gate-0-truth-validation-protocol.md` | Own the Gate 0 truth-validation procedure and blocking criteria. | Arrival plan Task 13 `Artifacts`; spec §§29.1, 32.1, 34 | Release Quality Lead | P, D, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/quality/false-bypass-incident-review.md` | Record and review any false arrival at a bypassed stop. | Arrival plan Task 13 `Artifacts`; spec §§3.1–3.3, 31.2, 34 | Data Quality Lead | P, D, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/quality/gate-0-validation-results.md` | Record Gate 0 scenario results against a fixed reviewed version. | Arrival plan Task 13 `Artifacts`; spec §§31, 32.1 | Release Quality Lead | P, D, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/quality/gate-0-exit-record.md` | Record the reviewed Gate 0 go or no-go decision. | Arrival plan Task 13 `Artifacts`; spec §§29.1, 32.1, 34 | Release Quality Lead | P, D, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |

## Nearby station and offline experience

Source inventory: `docs/superpowers/plans/2026-07-30-nearby-station-and-offline-experience-plan.md`, `Product artifact map`.

| Artifact | Single purpose and authority boundary | Source sections | Owner | Required reviewers | State | Validated | Supersedes | Evidence |
|---|---|---|---|---|---|---|---|---|
| `docs/product/nearby-offline/experience-contract.md` | Own navigation destinations, state preservation, the no-account promise, and cross-artifact requirement traceability. | Nearby/offline plan `Product artifact map`; spec §§13, 32.2, 34 | Experience Product Lead | P, A, D, C | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/nearby-offline/zero-tap-startup-and-permission-flow.md` | Own warm launch, first-use location explanation, permission outcomes, and no-location fallbacks. | Nearby/offline plan `Product artifact map`; spec §§14.1–14.2, 28.1, 31.4 | Experience Product Lead | P, A, D, C, R | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/nearby-offline/station-ranking-and-entrance-rules.md` | Own practical-walk ranking, entrance usefulness, complex grouping, and accessible-mode ranking. | Nearby/offline plan `Product artifact map`; spec §§14.3, 19.3–19.4, 31.4 | Experience Product Lead | P, A, D, C | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/nearby-offline/nearby-card-and-direction-contract.md` | Own initial Nearby cards, all passenger-serving directions, next-three behavior, and direction language. | Nearby/offline plan `Product artifact map`; spec §§7, 14.4–14.5, 31.1 | Experience Product Lead | P, A, D, C | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/nearby-offline/station-board-and-controls-contract.md` | Own station header, arrival rows, alerts, filters, reverse-direction behavior, and degraded states. | Nearby/offline plan `Product artifact map`; spec §15 | Experience Product Lead | P, A, D, C | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/nearby-offline/underground-visual-and-reachability-standard.md` | Own dark-first visual hierarchy, route recognition, typography, assistive reading, touch, reach, and motion. | Nearby/offline plan `Product artifact map`; spec §16 | Experience Product Lead | P, A, C | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/nearby-offline/map-modes-and-journey-behavior.md` | Own actual-now and reference layers, map interactions, geographic honesty, and journey ranking. | Nearby/offline plan `Product artifact map`; spec §17 | Experience Product Lead | P, A, D, C | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/nearby-offline/offline-content-and-validity-contract.md` | Own stored content, reference itinerary rules, service-date validity, and offline claim limits. | Nearby/offline plan `Product artifact map`; spec §§18.1, 18.4, 31.4, 31.8 | Experience Product Lead | P, A, D, C | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/nearby-offline/offline-trip-card-and-progress-contract.md` | Own trip-card content, contingencies, accessibility chain, and manual underground progress. | Nearby/offline plan `Product artifact map`; spec §§18.2, 31.4, 31.8 | Experience Product Lead | P, A, D, C | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/nearby-offline/offline-degraded-and-reconnection-states.md` | Own offline presentation, cached-value treatment, reconnection priority, and invalidation warnings. | Nearby/offline plan `Product artifact map`; spec §§18.3–18.4, 31.4 | Experience Product Lead | P, A, D, C | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/nearby-offline/saved-station-and-personalization-contract.md` | Own saved preferences, refresh behavior, contextual ordering, and rider controls. | Nearby/offline plan `Product artifact map`; spec §26 | Experience Product Lead | P, A, C, R | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/nearby-offline/location-and-personal-data-rules.md` | Own permission timing, location minimization, privacy, diagnostic separation, and reset behavior. | Nearby/offline plan `Product artifact map`; spec §§28.1, 28.3 | Privacy Lead | P, A, D, C, R, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/nearby-offline/measurement-plan.md` | Own usefulness targets, north-star definition, supporting measures, and guardrails. | Nearby/offline plan `Product artifact map`; spec §§29.2, 30 | Measurement Lead | P, A, D, C, R, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/nearby-offline/acceptance-evidence.md` | Consolidate scenario-level proof for approved normal, location, offline, time, reachability, and labeling behavior. | Nearby/offline plan `Product artifact map`; spec §§31.1, 31.4, 31.7–31.8 | Release Quality Lead | P, A, D, C, R, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/nearby-offline/release-1-readiness.md` | Record in-scope launch gates, dependency evidence, and the go or no-go decision. | Nearby/offline plan `Product artifact map`; spec §§32.2, 33 | Release Quality Lead | P, A, D, C, R, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/nearby-offline/risk-register.md` | Record MTA data, station geometry, accessibility completeness, map rights, privacy, and offline-staleness responses. | Nearby/offline plan `Product artifact map`; spec §33 | Experience Product Lead | P, A, D, C, R, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |

## Accessibility and platform guidance

Source inventory: `docs/superpowers/plans/2026-07-30-accessibility-and-platform-guidance-plan.md`, `Product artifact map`.

| Artifact | Single purpose and authority boundary | Source sections | Owner | Required reviewers | State | Validated | Supersedes | Evidence |
|---|---|---|---|---|---|---|---|---|
| `docs/product/accessibility/complete-path-contract.md` | Own the definition of a valid step-free journey. | Accessibility/guidance plan `Product artifact map`; spec §19.1 | Accessibility Product Lead | P, A, D, C | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/accessibility/path-edge-review-checklist.md` | Define the required review evidence for every path connection. | Accessibility/guidance plan `Product artifact map`; spec §§19.1, 21 | Accessibility Product Lead | P, A, D, C | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/accessibility/station-direction-coverage-register.md` | Record constituent-station, line, direction, entrance, and elevator-chain coverage. | Accessibility/guidance plan `Product artifact map`; spec §§19.2, 33.3 | Accessibility Product Lead | P, A, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/accessibility/station-direction-review-guide.md` | Prevent partial-complex and wrong-entrance accessibility inferences. | Accessibility/guidance plan `Product artifact map`; spec §§19.1–19.2 | Accessibility Product Lead | P, A, D, C | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/accessibility/accessible-route-only-state-matrix.md` | Own hard-constraint behavior, offline behavior, alternatives, and route ranking for Accessible Route Only. | Accessibility/guidance plan `Product artifact map`; spec §§19.3–19.4 | Accessibility Product Lead | P, A, D, C | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/accessibility/accessibility-copy-catalog.md` | Own approved rider-facing accessibility states and warnings. | Accessibility/guidance plan `Product artifact map`; spec §§19–20 | Content Lead | P, A, D, C | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/accessibility/equipment-status-policy.md` | Own equipment freshness, anomaly, matching, outage, and restoration rules. | Accessibility/guidance plan `Product artifact map`; spec §20 | Accessibility Product Lead | P, A, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/accessibility/equipment-status-acceptance-table.md` | Prove equipment-status boundary and recovery outcomes. | Accessibility/guidance plan `Product artifact map`; spec §§20, 31.5, 31.8 | Release Quality Lead | P, A, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/accessibility/path-impact-and-reroute-playbook.md` | Own equipment-impact classification and safe alternative ordering. | Accessibility/guidance plan `Product artifact map`; spec §§20.2–20.5 | Accessibility Product Lead | P, A, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/accessibility/underway-warning-state-matrix.md` | Own warnings before the last accessible decision point. | Accessibility/guidance plan `Product artifact map`; spec §§20.5, 31.5 | Accessibility Product Lead | P, A, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/accessibility/accessibility-acceptance-pack.md` | Consolidate Release 1 accessibility acceptance evidence. | Accessibility/guidance plan `Product artifact map`; spec §§21, 31.5, 32.2 | Release Quality Lead | P, A, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/guidance/platform-evidence-standard.md` | Own the editorial evidence required for positioning. | Accessibility/guidance plan `Product artifact map`; spec §§23.2, 33.2 | Guidance Product Lead | P, A, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/guidance/platform-state-and-certainty-matrix.md` | Own platform evidence, positioning certainty, and suppression behavior. | Accessibility/guidance plan `Product artifact map`; spec §§23.3–23.4 | Guidance Product Lead | P, A, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/guidance/positioning-rider-experience.md` | Own front, middle, and back presentation and accessible-priority behavior. | Accessibility/guidance plan `Product artifact map`; spec §§23.1, 23.5, 31.6 | Guidance Product Lead | P, A, D, C | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/guidance/transfer-connection-assessment.md` | Own Likely, Tight, Uncertain, and Unlikely transfer outcomes. | Accessibility/guidance plan `Product artifact map`; spec §§23.6, 31.6, 31.8 | Guidance Product Lead | P, A, D, C | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/guidance/platform-coverage-register.md` | Govern station-by-station positioning rollout and reverification. | Accessibility/guidance plan `Product artifact map`; spec §§23.7, 29.4, 32.3 | Guidance Product Lead | P, A, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/crowding/subway-crowding-enablement-gate.md` | Record the launch omission and future authoritative-data gate for subway crowding. | Accessibility/guidance plan `Product artifact map`; spec §§24, 34 | Guidance Product Lead | P, A, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/quality/accessibility-and-guidance-release-gates.md` | Record target metrics, scenario evidence, and release decisions for accessibility and guidance. | Accessibility/guidance plan `Product artifact map`; spec §§29.1, 29.3–29.4, 31.5–31.6, 32.2–32.3 | Release Quality Lead | P, A, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |

## Smart commute alerts and launch quality

Source inventory: `docs/superpowers/plans/2026-07-30-commute-alerts-and-launch-quality-plan.md`, each named Task `Artifacts` section.

| Artifact | Single purpose and authority boundary | Source sections | Owner | Required reviewers | State | Validated | Supersedes | Evidence |
|---|---|---|---|---|---|---|---|---|
| `docs/product/commute/commute-window-contract.md` | Own the commute-window product promise and behavior. | Commute/launch plan Task 1 `Artifacts`; spec §§25.1–25.2, 34 | Commute Product Lead | P, A, D, C, R, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/commute/commute-window-field-dictionary.md` | Own commute-window field meanings and allowed values. | Commute/launch plan Task 1 `Artifacts`; spec §25.1 | Commute Product Lead | P, A, D, C, R, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/decisions/subway-product-decisions.md` | Record cross-domain subway product decisions not owned by a narrower artifact. | Commute/launch plan Task 1 `Artifacts`; spec §34 | Product Governance Lead | P, A, D, C, R, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/commute/notification-eligibility-contract.md` | Own disruption-only, segment-aware notification eligibility. | Commute/launch plan Task 2 `Artifacts`; spec §25.3 | Commute Product Lead | P, A, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/commute/notification-suppression-matrix.md` | Apply mandatory notification suppression outcomes. | Commute/launch plan Task 2 `Artifacts`; spec §§25.3, 31.6 | Commute Product Lead | P, A, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/commute/disruption-relevance-examples.md` | Prove whether disruptions affect a saved commute segment. | Commute/launch plan Task 2 `Artifacts`; spec §§25.3, 31.6 | Release Quality Lead | P, A, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/commute/delay-threshold-policy.md` | Own delay thresholds and boundary behavior. | Commute/launch plan Task 3 `Artifacts`; spec §25.4 | Commute Product Lead | P, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/test-cases/commute-threshold-boundaries.md` | Prove commute delay-threshold boundaries. | Commute/launch plan Task 3 `Artifacts`; spec §§25.4, 31.8 | Release Quality Lead | P, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/test-cases/commute-time-edge-cases.md` | Prove commute-window behavior at service-day and clock edges. | Commute/launch plan Task 3 `Artifacts`; spec §§5, 25.1, 31.7 | Release Quality Lead | P, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/ux/commute-window-setup-flow.md` | Own the rider setup sequence for a commute window. | Commute/launch plan Task 4 `Artifacts`; spec §§25.1, 28.2 | Commute Product Lead | P, A, C, R | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/ux/commute-window-state-matrix.md` | Own setup, enabled, disabled, permission, reset, and error states. | Commute/launch plan Tasks 4 and 7 `Artifacts`; spec §§25.1, 28.2–28.3 | Commute Product Lead | P, A, C, R, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/ux/notification-permission-moments.md` | Own rider-facing timing and context for notification permission. | Commute/launch plan Task 4 `Artifacts`; spec §§25.1, 28.2 | Commute Product Lead | P, A, C, R | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/content/commute-window-copy-catalog.md` | Own approved rider-facing commute setup and state language. | Commute/launch plan Task 4 `Artifacts`; spec §§25.1–25.2, 28.2 | Content Lead | P, A, C, R | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/commute/notification-timing-policy.md` | Own delivery timing within and before a commute window. | Commute/launch plan Task 5 `Artifacts`; spec §25.5 | Commute Product Lead | P, A, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/content/commute-notification-library.md` | Own approved rider-facing notification content. | Commute/launch plan Task 5 `Artifacts`; spec §25.6 | Content Lead | P, A, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/commute/recovery-notification-policy.md` | Own when and how a commute disruption recovery is communicated. | Commute/launch plan Task 5 `Artifacts`; spec §§25.5–25.6 | Commute Product Lead | P, A, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/test-cases/commute-message-scenarios.md` | Prove notification timing, content, and recovery outcomes. | Commute/launch plan Task 5 `Artifacts`; spec §§25.5–25.6, 31.6 | Release Quality Lead | P, A, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/commute/disruption-episode-contract.md` | Own the identity and lifecycle of one disruption episode. | Commute/launch plan Task 6 `Artifacts`; spec §25.7 | Commute Product Lead | P, A, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/commute/deduplication-decision-table.md` | Apply notification deduplication decisions within a disruption episode. | Commute/launch plan Task 6 `Artifacts`; spec §§25.7, 31.6 | Commute Product Lead | P, A, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/test-cases/commute-deduplication-scenarios.md` | Prove duplicate, changed-impact, and recovery-message behavior. | Commute/launch plan Task 6 `Artifacts`; spec §§25.7, 31.6 | Release Quality Lead | P, A, D, C, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/privacy/commute-data-inventory.md` | Record personal, preference, location, notification, and diagnostic data used by commute windows. | Commute/launch plan Task 7 `Artifacts`; spec §§28.2–28.3 | Privacy Lead | P, A, D, C, R, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/privacy/commute-retention-and-reset-policy.md` | Own retention, deletion, and rider reset behavior for commute data. | Commute/launch plan Task 7 `Artifacts`; spec §§26.3, 28.3 | Privacy Lead | P, A, D, C, R, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/test-cases/commute-privacy-scenarios.md` | Prove preference, permission, retention, and reset outcomes. | Commute/launch plan Task 7 `Artifacts`; spec §§28.2–28.3 | Release Quality Lead | P, A, D, C, R, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/measurement/commute-alert-scorecard.md` | Own notification quality measures, targets, and guardrails. | Commute/launch plan Task 8 `Artifacts`; spec §§29.3, 30 | Measurement Lead | P, A, D, C, R, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/measurement/commute-alert-event-dictionary.md` | Own measurement-event meanings and allowed dimensions. | Commute/launch plan Task 8 `Artifacts`; spec §§29.3, 30 | Measurement Lead | P, A, D, C, R, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/measurement/commute-alert-sampling-plan.md` | Own the sampling method for notification quality review. | Commute/launch plan Task 8 `Artifacts`; spec §§27.4, 29.3, 30 | Measurement Lead | P, A, D, C, R, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/operations/commute-alert-operations-playbook.md` | Own operational decisions and response steps for commute alerts. | Commute/launch plan Task 9 `Artifacts`; spec §§27.3–27.4, 33.5 | Operations Lead | P, A, D, C, R, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/operations/commute-alert-correction-policy.md` | Own commute-alert correction and rider-remedy decisions. | Commute/launch plan Task 9 `Artifacts`; spec §§27.3–27.4 | Operations Lead | P, A, D, C, R, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/operations/commute-alert-incident-log-template.md` | Standardize the evidence captured for a commute-alert incident. | Commute/launch plan Task 9 `Artifacts`; spec §§27.1, 27.3–27.4 | Operations Lead | P, A, D, C, R, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/operations/commute-alert-pilot-review-template.md` | Standardize pilot review evidence and decisions. | Commute/launch plan Task 9 `Artifacts`; spec §§27.4, 29.3, 32.2 | Operations Lead | P, A, D, C, R, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/release/commute-alert-launch-checklist.md` | Define the staged-launch evidence required before a commute-alert decision. | Commute/launch plan Task 10 `Artifacts`; spec §§29.1, 29.3, 32.2, 33.5 | Release Quality Lead | P, A, D, C, R, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/release/commute-alert-scenario-results.md` | Record staged-launch scenario outcomes against a fixed reviewed version. | Commute/launch plan Task 10 `Artifacts`; spec §§31.6, 31.8, 32.2 | Release Quality Lead | P, A, D, C, R, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |
| `docs/product/release/commute-alert-go-no-go-record.md` | Record the reviewed commute-alert go or no-go decision. | Commute/launch plan Task 10 `Artifacts`; spec §§29.3, 32.2, 33.5 | Release Quality Lead | P, A, D, C, R, O | Draft | 2026-07-30 | None | A: Pending; S: Pending |

## Inventory totals

| Workstream | Unique planned artifacts |
|---|---:|
| Arrival truth and service changes | 31 |
| Nearby station and offline experience | 16 |
| Accessibility and platform guidance | 18 |
| Smart commute alerts and launch quality | 33 |
| **Total** | **98** |
