# Product artifacts

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§3.1–3.3, 31, 34; Task 0.1 brief; Task 0.3 brief |
| Owner | Product Governance Lead |
| Required reviewers | Product, Data Quality |
| Status | In review |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | [Phase 0 governance approval record](release/phase-0-governance-approval.md) |
| Scenario results | Not applicable — this Phase 0 artifact governs vocabulary, ownership, lifecycle, and review, not rider-visible operational behavior; this cannot waive later rider-behavior acceptance evidence. |

This directory is the governed home for product documentation derived from the [approved product specification](../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md). It is limited to product contracts, decision rules, review evidence, and release records.

## Start here

1. Use the [artifact index](artifact-index.md) to find the one artifact that owns a decision, its source sections, owner, required review path, approval state, and supersession record.
2. Use the [review and approval policy](review-and-approval-policy.md) before changing an artifact state or relying on it as approved guidance.
3. Follow the approved specification whenever any product artifact, delivery plan, or review record conflicts with it.

## Non-negotiable truth rule

A train must never be shown at a bypassed stop. Current negative evidence vetoes a positive prediction, and materially unresolved bypass or reroute evidence fails closed. Any proposed decision that weakens this conservative truth rule returns to Product and Data Quality review, regardless of the artifact's current approval state.

## Authority and currency

Only an artifact marked **Approved** in the artifact index is current normative guidance. **Draft** and **In review** artifacts are work in progress. **Superseded** and **Retired** artifacts are historical and must carry a prominent notice that points to their replacement or retirement record.

The approved specification has precedence over every artifact in this directory. Within this directory, the authority boundaries and precedence rules in the artifact index prevent two documents from silently owning the same decision.
