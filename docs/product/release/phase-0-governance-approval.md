# Phase 0 governance approval record

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§2.4–5, 10.1, 11.4, 14.5, 16.3–16.4, 18.3, 19–20, 23, 25.7, 27–28, 31–34; master delivery plan Tasks 0.1–0.3; Task 0.3 brief |
| Owner | Product Governance Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | In review |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | [This Phase 0 governance approval record](phase-0-governance-approval.md) |
| Scenario results | Not applicable — this Phase 0 artifact governs vocabulary, ownership, lifecycle, and review, not rider-visible operational behavior; this cannot waive later rider-behavior acceptance evidence. |

## Gate purpose

This record fixes the Phase 0 governance and terminology review set before later arrival, nearby/offline, accessibility/guidance, or commute artifacts rely on it. The seven items below are **In review**, not **Approved**. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

A train must never be shown at a bypassed stop. Current negative evidence vetoes a positive prediction, and materially unresolved bypass or reroute evidence fails closed. Neither this governance gate nor a scenario determination of **Not applicable** may weaken or waive that rule.

## Fixed review set

| Artifact path | Source sections | Owner | Required reviewer roles | Review state |
|---|---|---|---|---|
| `docs/product/README.md` | Approved specification §§3.1–3.3, 31, 34; Task 0.1 brief; Task 0.3 brief | Product Governance Lead | Product, Data Quality | In review |
| `docs/product/artifact-index.md` | Approved specification §§2.4, 3.1–3.3, 14.5, 16.3–16.4, 19, 23, 31, 34; master delivery plan Task 0.2 `Artifacts` and `Steps`; all `Product artifact map` and `Artifacts` sections in the four workstream plans; Task 0.1 brief; Task 0.3 brief | Product Governance Lead | Product, Accessibility, Data Quality, Content, Privacy, Operations | In review |
| `docs/product/review-and-approval-policy.md` | Approved specification §§3.1–3.3, 27, 28, 31–34; Task 0.1 brief; Task 0.3 brief | Product Governance Lead | Product, Accessibility, Data Quality, Content, Privacy, Operations | In review |
| `docs/product/contracts/transit-product-glossary.md` | Approved specification §§2.4–5, 14.5, 16.3–16.4, 19.1–19.3, 23, 25.7, 34; master delivery plan Task 0.2 `Artifacts` and `Steps`; Task 0.3 brief | Product Governance Lead | Product, Accessibility, Data Quality, Content, Privacy, Operations | In review |
| `docs/product/contracts/rider-language-rules.md` | Approved specification §§2.4, 3, 10.1, 11.4, 14.5, 16.3–16.4, 18.3, 19–20, 23, 25.7, 34; master delivery plan Task 0.2 `Artifacts` and `Steps`; Task 0.3 brief | Content Lead | Product, Accessibility, Data Quality, Content, Operations | In review |
| `docs/product/decisions/subway-product-decisions.md` | Approved specification §34; master delivery plan Task 0.2 `Artifacts` and `Steps`; Task 0.3 brief | Product Governance Lead | Product, Accessibility, Data Quality, Content, Privacy, Operations | In review |
| `docs/product/release/phase-0-governance-approval.md` | Approved specification §§2.4–5, 10.1, 11.4, 14.5, 16.3–16.4, 18.3, 19–20, 23, 25.7, 27–28, 31–34; master delivery plan Tasks 0.1–0.3; Task 0.3 brief | Product Governance Lead | Product, Accessibility, Data Quality, Content, Privacy, Operations | In review |

## Preparation evidence

| Prior task | Exact committed version | Review verdict | Finding disposition |
|---|---|---|---|
| Task 0.1 — product delivery controls | `1d16fbdef768fe0fb0978df71d00d3c436579fde` (`add product delivery controls`) | Initial review identified an Important reviewer-path coverage finding. | The finding required affected cross-domain artifacts and applying evidence to include every mandatory reviewer role. |
| Task 0.1 — focused correction | `2431c2e11594a7bffbc109bd7216dd6c9944223f` (`fix product artifact review paths`) | Scoped independent re-review found all Important findings addressed. | Twenty-one index rows were corrected; the all-row audit reported `audited=98 unclassified=0 mismatches=0` and `PASS all indexed review paths meet policy minima`. |
| Task 0.2 — common vocabulary | `a578a2ab31b0b6a613713ead66599cd460a25a9d` (`freeze subway product vocabulary`) | Independent review found no Critical or Important findings and approved task quality. | Focused verification covered all required glossary terms, direction and certainty controls, the negative-evidence veto, one rider-language index row, 99 governed rows, and 14/14 Section 34 decisions. |

The remaining non-blocking provenance minor was that the rider-language index row did not list every controlling specification section named by the artifact. This fixed review version synchronizes the row to §§2.4, 3, 10.1, 11.4, 14.5, 16.3–16.4, 18.3, 19–20, 23, 25.7, and 34. Independent gate review must confirm that synchronization; it is not silently discarded.

## Scenario determination and retained verification

Section 31 operational scenarios are **Not applicable** to this gate only because these Phase 0 artifacts govern vocabulary, ownership, lifecycle, and review rather than rider-visible operational behavior. This determination cannot waive, replace, defer, or satisfy any later rider-behavior acceptance test. Every later behavior-owning artifact must attach its applicable Section 31 and workstream boundary evidence before approval.

Focused document verification remains required for this review set: metadata/index agreement, one shared approval-record link, exact dependency SHAs and verdicts, rider-language source synchronization, specification precedence, the current-negative-evidence veto, the materially-unresolved bypass suppression rule, and the absence of premature **Approved** states.

## Independent gate decisions

| Reviewer role | Reviewer identity | Decision | Decision date | Finding |
|---|---|---|---|---|
| Product | Pending | Pending | Pending | Pending |
| Accessibility | Pending | Pending | Pending | Pending |
| Data Quality | Pending | Pending | Pending | Pending |
| Content | Pending | Pending | Pending | Pending |
| Privacy | Pending | Pending | Pending | Pending |
| Operations | Pending | Pending | Pending | Pending |

Preparation commit SHA: **Pending independent review and finalization.**

## Finalization rule

Only after an independent review approves this fixed review version may a follow-up commit record the exact preparation commit SHA, reviewer identities and roles, decisions, decision date, and any non-blocking finding. That same follow-up commit must move this record and the six governed artifacts to **Approved** in their metadata, this record, and the artifact index together.

Any material revision before that decision returns the affected item to **Draft** and requires a new fixed review version. No preparation evidence, prior task-quality verdict, meeting, silence, or partial reviewer response is approval.
