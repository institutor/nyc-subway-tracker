# Subway product decisions

| Governance field | Value |
|---|---|
| Source sections | Approved specification §34 for the historical Phase 0 SPD-01–SPD-14 set; applying approved specification §§25.2, 25.5, and 33.5 and commute alerts and launch quality plan Task 1 Step 8 for SPD-15; master delivery plan Task 0.2 `Artifacts` and `Steps`; Task 0.3 brief |
| Owner | Product Governance Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — the [Phase 0 governance approval record](../release/phase-0-governance-approval.md) remains historical approval evidence for unchanged SPD-01–SPD-14 only and does not approve SPD-15 or this materially revised version |
| Scenario results | Not run — Pending for SPD-15 and its applying commute-window fixtures; the historical Phase 0 Not applicable determination remains limited to unchanged SPD-01–SPD-14 and does not waive later operational, accessibility, offline, positioning, or notification acceptance evidence |

## Purpose and authority

This record preserves the approved specification's original cross-domain subway product decisions verbatim so later artifacts can reference stable decision identifiers. SPD-01–SPD-14 retain their historical Phase 0 approval, but the material addition of SPD-15 returns this artifact version to **Draft** under the review policy. This record does not replace the approved specification and does not re-own a rule assigned to a narrower contract.

## Decision record

| ID | Decision | Primary downstream boundary |
|---|---|---|
| SPD-01 | The launch is subway-first. | Release scope |
| SPD-02 | Nearby station boards are the default home. | Nearby experience |
| SPD-03 | Real-time explicit stop evidence is required for a live arrival. | Arrival truth |
| SPD-04 | Current negative evidence vetoes an arrival. | Arrival truth and service changes |
| SPD-05 | Static schedules never masquerade as countdowns. | Arrival truth, offline, and content |
| SPD-06 | A held train freezes; it is not automatically deleted as a ghost. | Arrival confidence |
| SPD-07 | Alerts are localized to rider consequence rather than reduced to a line-wide status. | Service changes and commute relevance |
| SPD-08 | Dark mode is default, and one-handed controls stay in the bottom third. | Visual and interaction experience |
| SPD-09 | Offline maps and saved trips remain navigable, with live status clearly unavailable. | Offline experience |
| SPD-10 | Accessible Route Only validates the complete path and fails closed. | Accessibility |
| SPD-11 | Platform guidance appears only at verified stations and is suppressed during operational ambiguity. | Platform positioning and transfers |
| SPD-12 | Subway crowding is absent until authoritative car-level data exists. | Crowding |
| SPD-13 | Commute notifications are disruption-only and segment-aware. | Commute alerts |
| SPD-14 | Trust and accessibility errors are release-blocking quality failures. | Quality and release governance |
| SPD-15 | No routine all-clear push is sent. A recovery push is eligible only when a prior disruption alert needs a meaningful recovery update. | Commute recovery notifications |

## SPD-15 scope and governance lifecycle

SPD-15 is necessary but not sufficient for a recovery push. Restoration remains Off by default. Later recovery consideration requires a prior push for the same relevant disruption episode and commute impact, a meaningful recovery that would correct or materially update the rider's decision, and permission under the [commute window product contract](../commute/commute-window-contract.md) and the Draft Task 5 timing and recovery policies. Their reviewer decisions and evidence remain Pending. No prior relevant disruption push means no recovery push.

SPD-15 applies approved specification §§25.2, 25.5, and 33.5 and commute-plan Task 1 Step 8. It is a new workstream decision and is not represented as a fifteenth item in the approved specification §34's original fourteen decisions.

The Phase 0 governance approval remains immutable historical evidence for the unchanged SPD-01–SPD-14 text. It does not approve SPD-15 or this materially revised artifact version. This version remains **Draft**, approval and scenario evidence remain **Pending**, and Product, Accessibility, Data Quality, Content, Privacy, and Operations must all decide on the same fixed version before approval.

The Draft [product artifact index](../artifact-index.md) row now matches this artifact's SPD-15 provenance, six-role review path, Draft lifecycle, historical-evidence boundary, and Pending scenario state. That metadata alignment does not approve SPD-15 or this materially revised version; every same-version reviewer decision and applying commute-window scenario remains **Pending**.

## Application rules

- The [transit product glossary](../contracts/transit-product-glossary.md) owns shared concept definitions.
- The [rider language rules](../contracts/rider-language-rules.md) own cross-domain public direction, certainty, accessibility, guidance, and route-recognition language.
- A later artifact records implementation detail only within its indexed authority boundary; it may not weaken these decisions or the approved specification.
- A train must never be shown at a bypassed stop. It must also be suppressed when current data leaves materially unresolved the possibility that it will bypass the stop.
- Any material change to an entry returns this record to **Draft** and follows the [product artifact review and approval policy](../review-and-approval-policy.md).
