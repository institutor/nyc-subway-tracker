# Commute alert event dictionary

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§25.2–25.7, 26.3, 28.1–28.3, 30, 33.5, and 34; commute alerts and launch quality plan Task 8; accepted immutable Commute Tasks 2, 3, 5, 6, and 7 |
| Owner | Measurement Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](commute-alert-sampling-plan.md#pending-execution-record) |

## Purpose and authority

This dictionary defines nine logical measurement facts used by the [commute alert scorecard](commute-alert-scorecard.md). It is not permission to create rider-level telemetry, a new source of operational truth, a delivery ledger, or a behavioral history. Exact adjudication remains inside the privacy-reviewed source boundary owned by accepted Commute Tasks 2–7; measurement receives only pre-reviewed coarse aggregates.

These Draft definitions are not observed events and are not MTA guarantees. No approved cohort, event lineage, aggregate, push, feedback, delivery, reviewer decision, pilot, or launch evidence exists. Gate 0 remains **NO-GO — GATE 0 NOT PASSED**, and commute alerts remain unapproved for release.

## Product Governance reconciliation

The artifact index does not yet carry the full Task 8 provenance, event boundary, six-role review, or privacy-safe export contract. Product Governance reconciliation remains **Pending**. This task does not edit the index or any gate record.

## Boundary model

There are three non-interchangeable layers:

| Layer | Permitted content | Boundary rule |
|---|---|---|
| Source decision boundary | Fixed evidence and the complete decision package needed to adjudicate one synthetic, shadow, or approved pilot opportunity | Performs exact relevance, direction, currentness, deduplication, capability, delivery, and direct-attribution decisions; personal transient inputs end at aggregation |
| Measurement intake | Pre-reviewed coarse category totals with fixed versions, purpose, approved access, and disposition | Receives no rider-level row, stable key, journey field, message text, token, episode ID, or reversible join |
| Aggregate publication | One approved coarse dimension by default, numerator, denominator, missing count, suppression result, and review lineage | Unsafe or small cells are suppressed as **Inconclusive**; no floor is invented |

Logical event names describe facts inside the first layer and aggregate categories exported from it. They do not require or authorize a durable per-rider event stream.

## Logical event definitions

| ID | Exact meaning and unit | Required source-boundary facts | Controlled states | Permitted measurement export | Exclusions and lifecycle |
|---|---|---|---|---|---|
| `CA-E01` | **Evaluation opportunity**: one deduplicated Task 6 episode, materially equivalent impact, occurrence, and message-state opportunity with its final decision and owner reason | Frozen Tasks 2–8 and product versions; authoritative decision/readiness time; all expected and actual decision facts from the complete package | `Send`, `Suppress`, or `Hold`; controlled owner reason including capability-block where applicable | Coarse totals by final decision and one approved reason or segment dimension | A source snapshot is not a unit; no episode, occurrence, commute, window, route-window, or decision-time row leaves the source boundary; transient personal inputs end after aggregation |
| `CA-E02` | **Delivery disposition** for a final Send: one of no attempt, success, failed, or unknown acknowledgment | Final Send from `CA-E01`; capability state before attempt; accepted delivery disposition | `No attempt`, `Success`, `Failed`, `Unknown acknowledgment`; a capability block remains pre-attempt and outside the Send disposition denominator | Coarse planned/unplanned totals by one delivery disposition | Correct Hold and Suppress are not delivery failures; capability block is not a missed Send; token, delivery ID, payload, acknowledgment trace, and timestamp do not leave the source boundary |
| `CA-E03` | **Feedback** attached only through an approved feedback opportunity | Successful delivered-message class; approved maturity state; explicit categorical rider response when present | `Actionable`, `Non-actionable`, `No response`, `Inconclusive`; optional approved categorical reason only | Coarse totals by feedback state or one approved message-class dimension after maturity | No free text, message body, station text, inferred sentiment, immature response, or link to later behavior; missing feedback stays No response in the mature denominator |
| `CA-E04` | **Permission**: outcome of the first explicit notification request and the separately read current capability | Explicit-request occurrence; determinate choice when present; current capability read only when needed | First request: `Granted`, `Denied`, `Restricted`, `Not determined`, `Temporary failure`; current capability remains a separate current state | Coarse first-request outcome totals; Restricted, Not determined, and Temporary failure reported separately | Granted is never conversion or success; no permission-transition history, prompt sequence, installation key, token, commute, or inferred reason |
| `CA-E05` | **Alert control**: one explicit pause, resume, or direct alert-off action | Explicit control action; approved direct flow identifier only inside the source boundary; current lifecycle result | `Pause`, `Resume`, `Direct alert off`; OS revoke/restrict remains separate | Coarse control-action totals; direct attribution only from the same approved feedback/control flow | Delete, reset, app-data clear, reinstall, expiry, and permission change are not alert-control actionability or opt-out facts; no time-proximity inference or durable push link |
| `CA-E06` | **Duplicate adjudication**: whether a successful dedupe-eligible delivery was the permitted first or an extra equivalent delivery, plus controlled cause | Task 6 episode, equivalence, occurrence, message state, represented delivery, and successful-delivery facts inside the source boundary | `Permitted first`, `Duplicate`; controlled cause includes cross-source identity, copy/timestamp churn, represented-window replay, queue race, or another approved category | Coarse permitted-first/duplicate/cause totals | Episode, root, group, occurrence, delivery-ledger, and evidence IDs remain inside Task 6; a permitted material update or distinct occurrence is not a duplicate |
| `CA-E07` | **Independent review** of one complete frozen decision package by two reviewers | Both independent decisions; agreement on eligibility, class, relevance, duplicate, and timeliness; expected, actual, prohibited checks; review dates and evidence | `Agreement`, `Disagreement`, `Incomplete`; affected scorecard result uses **Inconclusive** for disagreement | Coarse agreement/disagreement/incomplete totals by one approved dimension | Never choose a preferred reviewer, average incompatible decisions, export reviewer identity, or call an incomplete package agreement |
| `CA-E08` | **Aggregate publication**: one reviewed scorecard cell | Measure ID; fixed product and Tasks 2–8 versions; broad period; one coarse segment; numerator; denominator; missing count; suppression state; reviewer set; purpose; approved access; approved retention end | Scorecard vocabulary only: **Not run — Pending**, **Not measured**, **Not observed**, **Inconclusive**, **Run — Pass**, **Run — Fail** | The complete approved aggregate cell itself | No second dimension by default; no unsafe or under-floor cell; no exact time, route-window, station, journey, message, rider, device, token, or reversible join |
| `CA-E09` | **Correction and rerun**: append-only non-personal link from an original aggregate or synthetic review result to one bounded correction, new fixed version, and new attempt | Preserved original result; bounded correction; new product/policy/fixture version; new attempt; both review decisions; evidence | Original outcome plus corrected rerun outcome, each using scorecard vocabulary | Version-level correction/rerun lineage without rider or journey keys | Never overwrite the original, reuse the same attempt, repair a denominator after observation without a new version, or create a stable rider-level correction link |

## Complete decision package

Every source-boundary adjudication used by `CA-E01`, `CA-E06`, or `CA-E07` binds one fixed package containing:

- exact product/build and accepted Tasks 2–8 versions;
- authoritative readiness and decision time;
- source timestamps, effective periods, currentness, coherence, anomaly, and quarantine decisions;
- all Task 2 eligibility gates and owner reasons;
- Task 3 signal family, baseline identity, tolerance, persistence, reset cause, exact boundary, and final result;
- Task 5 timing, final pre-delivery recheck, message class, and template;
- Task 6 root/episode/delivery-group identity, equivalence, represented windows, and prior-delivery result;
- Task 7 alert intent, current capability read, privacy class, retention/deletion state, and queue eligibility;
- expected and actual Send, Suppress, or Hold decision with controlled reason;
- expected and actual delivery disposition;
- expected and actual visible and assistive result plus every prohibited check;
- two independent reviewers and dates; and
- durable evidence, preserved original result, bounded correction, new version, and rerun.

The complete package stays in the approved review boundary. Measurement intake receives only its reviewed coarse category totals. An incomplete package produces **Not measured** or **Inconclusive**, never Pass.

## Authoritative-time classification

| Frozen package result | Logical treatment |
|---|---|
| Correct Hold because evidence was unresolved | `CA-E01 = Hold`; no `CA-E02`; neither false negative nor delivery failure |
| Correct Suppress because evidence was irrelevant, stale, below threshold, equivalent, outside window, or unavailable | `CA-E01 = Suppress`; no `CA-E02`; not failure |
| Active intent with Denied, restricted, revoked, Paused, Offline, or no capability | Capability-blocked before attempt; not a missed Send; no replay |
| Final Send followed by failed delivery | `CA-E01 = Send`, `CA-E02 = Failed`; correct decision, delivery failure, and end-to-end miss |
| Final Send followed by unknown acknowledgment | `CA-E01 = Send`, `CA-E02 = Unknown acknowledgment`; do not assume success, failure, or Hold while semantics remain Pending |
| Every gate passes but final decision is not Send | Decision false negative and deterministic should-Send miss |

Later evidence does not rewrite an earlier correct classification. Human review uses only evidence available at the authoritative decision time.

## Measurement-intake privacy ceiling

Measurement intake must never receive:

- rider, account, installation, device, advertising, token, stable pseudonymous, or reversible identifiers;
- commute ID, window ID, occurrence ID, episode/root/group ID, delivery-ledger ID, queue ID, or payload ID;
- exact origin–destination, route-window, station, constituent, entrance, exit, transfer, leg, path, or accessibility preference;
- precise or joinable time, location, permission history, Home or Work, movement, visit, or journey history;
- message body, personal station text, feedback free text, source free text, or row-level history;
- a join between operational evidence and personal commute context; or
- personal events collected now for later aggregation.

Hashing, tokenizing, truncating, or replacing a prohibited identifier does not make it permissible when the result remains stable or reversible.

## Aggregate construction and publication

1. Compute exact relevance, direction, currentness, deduplication, timeliness, capability, and direct attribution inside the privacy-reviewed source boundary.
2. Convert each complete package to approved category totals and end transient personal inputs at aggregation.
3. Use one coarse dimension by default, chosen and frozen before observation. Approved examples are Planned/Unplanned, controlled impact class, broad daypart, message class, evidence-coherence class, or delivery disposition.
4. Any intersection requires prior Privacy approval, a safety purpose, and an approved aggregation floor.
5. Suppress an unsafe or small cell as **Inconclusive**. No floor may be invented, merged after observation, or bypassed by publishing a complementary value.
6. A reset or personal-data deletion removes personal measurement state, linkable pending aggregates, and queued copies under the [retention policy](../privacy/commute-retention-and-reset-policy.md).
7. Only a truly non-personal reviewed aggregate may survive for its approved purpose and approved retention end.
8. Omit a measure that requires journey reconstruction or a stable join, record it as Not measured or Inconclusive as applicable, and preserve the governance gap.

## Human-review boundary

Use fixed synthetic or shadow commutes with non-personal operational evidence for independent human review. A real pilot may contribute only approved aggregate categories after the privacy boundary is satisfied. Reviewers receive the same frozen package, decide independently, and record agreement or disagreement without selecting a preferred reviewer.

## Pending decisions

Feedback maturity, active-commuter definition, aggregation floor and retention, sample sizes and duration, delivery success versus unknown acknowledgment, “promptly,” attribution beyond the direct flow, seen state, severity ordering, lock-screen privacy, remote token lifecycle, and the Task 6 quiet-period proposal remain Pending. This dictionary invents none.

## Draft review checklist

- [ ] `CA-E01` through `CA-E09` each have one exact unit, controlled state set, export, and exclusion rule.
- [ ] Every complete decision package binds fixed Tasks 2–8 and the exact authoritative-time evidence.
- [ ] Correct Hold, correct Suppress, capability block, Send plus failure, and decision false negative remain distinct.
- [ ] Measurement receives only reviewed coarse aggregates with one dimension by default.
- [ ] Small or unsafe cells become Inconclusive and no floor is invented.
- [ ] Reset and deletion remove all personal or linkable measurement state.
- [ ] Two independent reviewers use the same package and disagreement remains Inconclusive.

Every unchecked item blocks approval. This documentation commit is not evidence.
