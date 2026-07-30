# Subway product decisions

| Governance field | Value |
|---|---|
| Source sections | Approved specification §34; master delivery plan Task 0.2 `Artifacts` and `Steps` |
| Owner | Product Governance Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Pending |

## Purpose and authority

This draft records the approved specification's cross-domain subway product decisions verbatim so later artifacts can reference one stable decision identifier. It does not replace the approved specification and does not re-own a rule assigned to a narrower contract. Until independent review is complete, this artifact remains **Draft** and is not itself approved guidance.

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

## Application rules

- The [transit product glossary](../contracts/transit-product-glossary.md) owns shared concept definitions.
- The [rider language rules](../contracts/rider-language-rules.md) own cross-domain public direction, certainty, accessibility, guidance, and route-recognition language.
- A later artifact records implementation detail only within its indexed authority boundary; it may not weaken these decisions or the approved specification.
- A train must never be shown at a bypassed stop. It must also be suppressed when current data leaves materially unresolved the possibility that it will bypass the stop.
- Any material change to an entry returns this record to **Draft** and follows the [product artifact review and approval policy](../review-and-approval-policy.md).
