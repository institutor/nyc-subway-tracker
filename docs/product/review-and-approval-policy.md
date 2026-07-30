# Product artifact review and approval policy

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§3.1–3.3, 27, 28, 31–34; Task 0.1 brief; Task 0.3 brief |
| Owner | Product Governance Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | In review |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | [Phase 0 governance approval record](release/phase-0-governance-approval.md) |
| Scenario results | Not applicable — this Phase 0 artifact governs vocabulary, ownership, lifecycle, and review, not rider-visible operational behavior; this cannot waive later rider-behavior acceptance evidence. |

## Purpose

This policy defines the only permitted lifecycle states, mandatory reviewers by artifact type, approval evidence, scenario-result linkage, conservative-truth re-review, and supersession controls for the product artifacts in this directory.

## Lifecycle states

| State | Meaning | May be treated as current guidance? | Entry and exit control |
|---|---|---|---|
| **Draft** | The governed record exists, including when its content file is still planned, but required review has not started. | No | Owner may edit. Move to **In review** only when source sections, owner, required reviewers, validation date, supersession field, approval-evidence link, and applicable scenario-result links are present. |
| **In review** | All mandatory reviewers have been asked to decide on a fixed review version. | No | Return to **Draft** after material revision. Move to **Approved** only after all mandatory reviewers approve and all blocking scenarios pass. |
| **Approved** | All mandatory reviewers approved the same version and required scenario evidence passed. | Yes | Any material change returns the artifact to **Draft**. A conservative-truth weakening always returns to Product and Data Quality review. |
| **Superseded** | A newer approved artifact or approved version owns the decision. | No | The old artifact must name and link its replacement, show a top-of-document supersession notice, and remain available only as history. |
| **Retired** | The decision is no longer applicable and has no replacement. | No | The artifact must link the dated retirement decision and show a top-of-document retirement notice. |

No other status labels are permitted in the artifact index.

## Required metadata

Every product artifact, including an evidence record or template, must name:

- approved-specification source sections and the plan section that created or updates it;
- one authoritative owner;
- every mandatory reviewer role;
- one lifecycle status from this policy;
- the last validation date;
- superseded documents, or **None** when there are none;
- approval evidence, or **Pending** before approval;
- applicable scenario results, or **Not applicable** with a reason.

The artifact index is the inventory record. The artifact itself must repeat this metadata so that a copied or directly opened file cannot lose its governance context.

## Mandatory reviewers by artifact type

Reviewer codes used in the artifact index are **P** Product, **A** Accessibility, **D** Data Quality, **C** Content, **R** Privacy, and **O** Operations. The sets below are minimums; the owner may add reviewers but may not remove a mandatory reviewer.

| Artifact type or decision | Mandatory reviewers |
|---|---|
| Arrival admission, ordering, source precedence, service change, bypass, reroute, track conflict, feed health, confidence, suppression, fallback, provenance, quarantine, or truth acceptance | P, D |
| Rider experience, navigation, controls, map, offline, saved-station, or location behavior | P, A, C; add D when live, scheduled, cached, degraded, or service-change truth is presented; add R for location or personal data |
| Accessibility path, equipment state, Accessible Route Only, warning, or accessibility acceptance | P, A, D, C; add O for operational warning, correction, or release decisions |
| Platform positioning, transfer guidance, coverage, or crowding enablement | P, A, D, C; add O for coverage, correction, enablement, or release decisions |
| Commute eligibility, suppression, timing, delay threshold, disruption identity, deduplication, or recovery | P, D, C, O; add A for accessible-path alerts |
| Permission, personal data, retention, reset, notification preference, or privacy evidence | P, R; add C for rider-facing permission or control language; add D or O when diagnostic or correction records are involved |
| Rider-facing copy catalog or notification library | P, C; also include every domain reviewer whose governed state the copy expresses |
| Measurement plan, event dictionary, scorecard, sampling, risk, incident, correction, pilot, launch, or gate record | P, D, O; add A, C, or R when the record measures or decides their governed domain |
| Glossary, cross-domain product decision, requirement traceability, or governance policy | P, D and every domain whose definition or decision changes |

## Review sequence

1. **Owner preparation.** The owner fixes the review version, completes required metadata, links the controlling specification sections and plan artifact entry, and identifies every governed decision.
2. **Scenario attachment.** The owner links each applicable approved-specification Section 31 scenario and any workstream boundary case to a result record that identifies the reviewed version, expected result, observed result, date, and reviewer.
3. **Domain review.** Every mandatory reviewer records **Approve** or **Changes required** against the same version. Silence and a meeting invitation are not approval.
4. **Blocking-result check.** A failed or missing release-blocking truth, accessibility, privacy, or operations scenario prevents approval.
5. **Approval record.** The owner links an immutable approval record containing artifact path, reviewed version, source sections, scenario-result links, reviewer names and roles, decisions, decision date, unresolved non-blocking issues, and resulting lifecycle state.
6. **Index update.** The Product Governance Lead updates status, validation date, approval evidence, scenario evidence, and supersession fields in the artifact and index together.

## Conservative-truth re-review

A train must never be shown at a bypassed stop. The approved specification's conservative-error policy and negative-evidence veto control every workstream.

Any decision that could admit, retain, relabel, restore, or notify about a train under weaker evidence than the currently approved rule is a conservative-truth weakening. It must:

1. return the affected artifact to **Draft**;
2. receive fresh Product and Data Quality review even if those roles approved an earlier version;
3. rerun the affected Section 31 service-change, feed-degradation, time, and threshold scenarios;
4. remain unapproved if current data identifies or leaves materially unresolved the possibility that the train bypasses the stop.

No experience, content, accessibility, privacy, operations, measurement, pilot, or release artifact may waive this review.

## Approval and scenario links

Approval evidence and scenario results must be durable repository-relative links, not references to an unrecorded conversation, meeting, or dashboard view. One approval record may cover multiple artifacts only when it lists each path, version, reviewer decision, and scenario set separately.

Scenario result records must preserve failures and reruns. A later passing run does not erase an earlier result; it links the correction and the newly reviewed artifact version. Approval evidence must point to the exact result set used for the decision, and the result set must point back to the approval record.

## Supersession and retirement

- The replacement artifact must be **Approved** before the prior artifact becomes **Superseded**.
- The old artifact and its index row must name the replacement; the replacement must name what it supersedes.
- A superseded or retired artifact must begin with a visible notice stating that it is not current guidance.
- Links to superseded guidance must be updated or explicitly labeled historical.
- When two approved artifacts overlap, the authority and precedence rules in the artifact index apply. If those rules do not resolve the conflict, the specification controls and both artifacts return to **Draft** for the full applicable review path.
