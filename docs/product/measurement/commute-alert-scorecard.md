# Commute alert scorecard

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

This scorecard defines twelve privacy-safe quality measures for subway commute alerts. It consumes, but cannot change, the accepted [eligibility contract](../commute/notification-eligibility-contract.md), [threshold policy](../commute/delay-threshold-policy.md), [timing policy](../commute/notification-timing-policy.md), [recovery policy](../commute/recovery-notification-policy.md), [episode contract](../commute/disruption-episode-contract.md), [deduplication table](../commute/deduplication-decision-table.md), [data inventory](../privacy/commute-data-inventory.md), and [retention policy](../privacy/commute-retention-and-reset-policy.md).

These are Draft measurement definitions, not observed performance and not MTA guarantees. No approved cohort, denominator lineage, push, feedback, delivery, review, pilot, or launch evidence exists. Zero observed incidents proves nothing. Gate 0 remains **NO-GO — GATE 0 NOT PASSED**; commute alerts remain a later release and are not approved.

## Product Governance reconciliation

The artifact header and Draft artifact index row now align on the full Task 8 provenance, accepted immutable Tasks 2, 3, 5, 6, and 7 handoffs, and Product, Accessibility, Data Quality, Content, Privacy, and Operations review. The twelve-measure set and privacy-safe aggregation conditions remain governed by this artifact. Metadata alignment is not approval; every measurement result and reviewer decision remains **Pending**.

## Required outcome vocabulary

Measurement records use only:

- **Not run — Pending**
- **Not measured**
- **Not observed**
- **Inconclusive**
- **Run — Pass**
- **Run — Fail**

No incident, no feedback, zero denominator, immature outcome, unsafe cell, incomplete lineage, or missing review is never a Pass.

## Universal calculation rules

1. Use exact unrounded counts and ratios. Round only display after the release decision is made from the unrounded value.
2. The measurement unit is one deduplicated Task 6 episode, materially equivalent commute impact, occurrence, and message-state opportunity—not a source snapshot.
3. Judge expected behavior only from the evidence available at authoritative decision time.
4. Freeze product, Tasks 2–8, evidence, classification, sample, maturity, and aggregation versions before observation.
5. Report **Planned** and **Unplanned** independently. Never average them to hide a required-segment failure. An event without an approved classification remains separately unclassified and cannot enter either segment or an overall Pass.
6. The [event dictionary](commute-alert-event-dictionary.md) owns logical inputs; the [sampling plan](commute-alert-sampling-plan.md) owns frames, strata, fixtures, and evidence records.
7. Measurement receives only pre-reviewed coarse aggregates. Exact relevance, direction, currentness, deduplication, attribution, and capability decisions occur inside their privacy-reviewed source boundaries.
8. Trust-sentinel and privacy breaches are a census and immediate release stop; they do not wait for a random sample or get diluted by message volume.

## Measure definitions

Every row is complete: numerator, denominator, inclusion, exclusion, zero rule, segment result, Draft cadence, privacy limit, owner, and release effect are all binding.

### Actionability, frequency, duplication, and accessibility

| ID | Numerator | Denominator | Inclusion | Exclusion | Zero rule | Planned / Unplanned result | Draft cadence | Privacy limit | Owner | Release effect |
|---|---|---|---|---|---|---|---|---|---|---|
| `CA-M01` | Successfully delivered disruption pushes with explicit **Actionable** feedback | All successfully delivered disruption pushes whose approved feedback opportunity matured; missing feedback remains in the denominator as **No response** | Initial, escalation, planned change, and reminder classes; fixed mature categorical feedback | Recovery is measured separately; immature opportunities; failed, unknown, or unattempted delivery; free text | Zero denominator is **Not measured**, never Pass | Calculate independent Planned and Unplanned ratios; report Recovery separately; no overall average may pass a failing required segment | Monthly after approved feedback maturity; weekly maturity-lineage check | Export only coarse class, planned status, Actionable/Non-actionable/No response/Inconclusive totals; no message, commute, token, journey, or stable join | Measurement Lead | Unrounded `≥85%`; exactly 85% is **Run — Pass**; below 85% is **Run — Fail** and blocks release |
| `CA-M02` | Unique successfully delivered commute messages explicitly marked **Non-actionable** | Privacy-approved active-commuter-month units | Every delivered message class, with unique-message adjudication inside the source boundary | Duplicate copies beyond their one unique message; units lacking the approved active-commuter definition or lineage | Zero denominator or unapproved active-commuter definition is **Not measured** | Independent Planned and Unplanned message-rate numerators against approved segment units; unclassified units remain separate; no blended Pass | Monthly | Export only coarse message-class and approved commuter-month totals; never export installation, commute, message, episode, or month-level join | Measurement Lead | Unrounded `<1.0`; 0.99 passes, exactly 1.0 fails, and above 1.0 fails; failure blocks release |
| `CA-M03` | Extra successful deliveries beyond the first permitted delivery for the same Task 6 episode, materially equivalent impact, occurrence, and message state | All successful dedupe-eligible deliveries | Initial, update, reminder, and recovery deliveries after Task 6 adjudication; cross-source equivalents count together; three equivalent deliveries contribute two duplicates | Permitted materially changed update, distinct occurrence, distinct impact, or independently eligible recovery | Zero denominator is **Not measured**; positive denominator with zero duplicates may Pass only after the frozen observation requirement is met | Independent Planned and Unplanned counts and rates; no averaging; every suspected duplicate also enters the sentinel census | Daily census in silent/pilot, weekly cumulative scorecard, immediate escalation | Export only coarse permitted-first/duplicate/cause totals; episode and delivery-ledger IDs remain inside Task 6 | Measurement Lead | Target `0`; one accepted duplicate is **Run — Fail** and stops launch immediately |
| `CA-M04` | Eligible blocking accessible-path messages successfully delivered at authoritative `delivery time < window start S` | Cases where authoritative blocking evidence and every Task 2–6 gate were ready before `S` and delivery capability existed | Exact blocking accessible-path consequence; ready at any `t < S`; successful delivery before `S` | Evidence first accepted at or after `S` is excluded and separately reported; capability-blocked cases; unresolved gates; nonblocking impact | Zero denominator is **Not measured**; a positive eligible denominator requires every case timely | Independent Planned and Unplanned 100% results; a failing or unmeasured required segment cannot be averaged away | Daily sentinel census and weekly cumulative scorecard; immediate escalation on a late eligible case | Export only coarse ready-before-start/timely/late/first-ready-at-or-after-start totals; no path, accessibility preference, station, commute, or time trace | Measurement Lead | Exact target `100%`; delivery at `S` is late and **Run — Fail**; any eligible late case stops launch |

### Trust guardrails and false-negative review

| ID | Numerator | Denominator | Inclusion | Exclusion | Zero rule | Planned / Unplanned result | Draft cadence | Privacy limit | Owner | Release effect |
|---|---|---|---|---|---|---|---|---|---|---|
| `CA-G01` | Unique reviewed delivered messages failing exact segment, constituent, entrance/exit, transfer, path, or decision-change relevance | Reviewed delivered messages with complete evidence available at authoritative decision time | Accepted unaffected-segment, wrong-direction, wrong-constituent, wrong entrance/exit, wrong transfer/path, and no-decision-change violations; each unique message once | Incomplete evidence remains **Inconclusive**; correct relevant delivery; duplicate copies already represented by the unique message | Zero denominator is **Not measured**; positive denominator with zero violations may Pass only after the frozen review requirement | Independent Planned and Unplanned results; wrong direction and unaffected segment remain separate categories and cannot be netted | Daily sentinel census in silent/pilot and weekly independent review; immediate escalation | Export coarse violation-type totals only; exact journey relevance stays inside the reviewed source boundary | Measurement Lead | Target `0`; any accepted violation is **Run — Fail** and stops launch |
| `CA-G02` | Unique reviewed delivered messages whose governing evidence was stale, no longer effective, or already resolved at final decision | Reviewed delivered messages with complete currentness and effective-period evidence | Accepted stale, expired, superseded, no-longer-effective, or resolved-at-final-decision violations, separately categorized | Incomplete currentness lineage is **Inconclusive**; evidence that became stale only after a correct final decision | Zero denominator is **Not measured**; positive denominator with zero violations may Pass only after the frozen review requirement | Independent Planned and Unplanned results; stale and resolved remain separate categories | Daily sentinel census in silent/pilot and weekly independent review; immediate escalation | Export coarse currentness-violation totals and evidence-version class only; no exact source text, message, route-window, or time join | Measurement Lead | Target `0`; any accepted violation is **Run — Fail** and stops launch |
| `CA-G03` | Adjudicated should-Send opportunities deterministically proven to lack successful delivery | Sampled should-Send opportunities; when unknown acknowledgment prevents deterministic classification, the affected result is **Inconclusive** rather than a calculated miss rate | Separate: all gates Pass but final decision was not Send; correct Send followed by **Failed** delivery; qualifying deterministic no-attempt delivery; complete authoritative-time package | Correct Hold, correct Suppress, capability-blocked opportunity, unresolved expected result, incomplete package, or unknown acknowledgment; unknown remains only in the `CA-D03` diagnostic partition | Zero denominator is **Not measured**; zero observed deterministic misses is **Not observed** until the frozen sample and maturity requirements are complete; unknown acknowledgment prevents a zero-miss result | Independent Planned and Unplanned results; decision false negative, Failed delivery, and qualifying deterministic no attempt remain separate; an affected segment with unknown acknowledgment is **Inconclusive** | Weekly independent false-negative sample; immediate escalation on a deterministic miss | Export only coarse expected-decision/actual-decision/delivery-disposition/reason totals; no episode, commute, journey, or time-level join | Measurement Lead | No invented percentage target; any deterministic should-Send miss is **Run — Fail** and blocks until correction and rerun; never assume unknown acknowledgment is success or failure |
| `CA-G04` | Direct explicit alert disablements attributable within the same approved feedback/control flow | Successfully delivered pushes explicitly **Non-actionable** with a mature direct-attribution opportunity | Direct alert-off in the approved flow; optional approved categorical reason; exact opportunity maturity | Pause reported in `CA-D02`; OS revoke/restrict; deletion/reset/app clear/reinstall; no response; time-proximity or inferred attribution | Zero denominator is **Not measured** | Independent Planned and Unplanned diagnostic results only when the direct flow carries the approved classification; otherwise segment result is Not measured | Monthly | Export only coarse Non-actionable/direct-disable/no-disable/No-response totals; no timestamp proximity, message, token, or journey join | Measurement Lead | Diagnostic with no numeric target; unsafe attribution is **Inconclusive** and cannot support release |

### Permission, controls, delivery, and reviewer diagnostics

| ID | Numerator | Denominator | Inclusion | Exclusion | Zero rule | Planned / Unplanned result | Draft cadence | Privacy limit | Owner | Release effect |
|---|---|---|---|---|---|---|---|---|---|---|
| `CA-D01` | First explicit notification requests ending **Denied** | First explicit requests with a determinate **Granted** or **Denied** rider choice | One first explicit request per approved aggregate unit; Granted and Denied only | Restricted, Not determined, temporary failure, repeat request, current capability read without a request | Zero denominator is **Not measured** | Planned and Unplanned are Not measured unless the same approved direct flow already carries that classification; never infer an incident link | Monthly | Export coarse first-request outcome totals only; no permission history, installation, token, commute, or prompt sequence | Measurement Lead | Diagnostic only; Granted is never conversion, success, trust, or release evidence |
| `CA-D02` | Privacy-approved coarse count of explicit **Pause alerts** and direct alert-off actions, with rates only against a separately approved denominator | The approved aggregate exposure or active-unit denominator for the stated rate; count publication may have no denominator | Pause and direct alert-off remain separate; OS revoke/restrict separately reported | Delete, reset, app-data clear, reinstall, expiry, permission loss, or inferred response to a push | No approved denominator means publish count only and rate is **Not measured**; zero observed action is **Not observed** | Planned and Unplanned only where the approved direct flow already carries that classification; otherwise remain separate nonincident diagnostics | Monthly | Export coarse action categories only; no control history, commute, permission, delivery, or time-proximity join | Measurement Lead | Diagnostic only; no opt-out or actionability claim from lifecycle events |
| `CA-D03` | Four mutually exclusive counts: successful, failed, unknown acknowledgment, and no attempt | All final **Send** decisions | Exactly one disposition per Send; failure and unknown remain distinct; no-attempt only after a final Send | Correct Hold, correct Suppress, and capability-blocked pre-attempt opportunities | Zero denominator is **Not measured**; a zero in one cell is **Not observed**, not proof of capability quality | Independent Planned and Unplanned partitions; no overall partition may conceal a failed required segment | Daily operational partition in silent/pilot and weekly cumulative scorecard | Export coarse decision/disposition totals only; token, delivery ID, payload, message, commute, and acknowledgment trace remain outside measurement | Measurement Lead | Diagnostic until delivery-success and unknown-acknowledgment semantics are governed; a failed delivery in `CA-G03` remains an end-to-end miss |
| `CA-D04` | Complete double-review packages where two independent reviewers agree on eligibility, class, relevance, duplicate, and timeliness | All complete double-review packages | Both reviewers independently apply the same frozen package and record all five decisions plus expected, actual, and prohibited checks | Incomplete package or missing reviewer is **Not measured**; disagreement is **Inconclusive** | Zero denominator is **Not measured**; zero disagreement is **Not observed** until the frozen sample is complete | Independent Planned and Unplanned agreement ratios; each disagreement remains visible and cannot be averaged away | Weekly independent sample and cumulative scorecard | Export coarse agreement/disagreement by one approved dimension; reviewer identity and package detail stay in the controlled review boundary | Measurement Lead | No preferred reviewer may be selected; any unresolved required disagreement is **Inconclusive** and blocks the affected result |

## Classification boundaries

| Authoritative-time condition | Measurement classification |
|---|---|
| Evidence is unresolved and the accepted decision is Hold | Correct Hold; neither false negative nor delivery failure |
| Evidence proves irrelevant, stale, below threshold, equivalent, outside window, or unavailable and the accepted decision is Suppress | Correct Suppress; not failure |
| Active alert intent is Denied, restricted, revoked, Paused, Offline, or lacks capability | Capability-blocked before attempt; not a missed Send and no replay |
| Every required gate passes, final decision is Send, and delivery fails | Correct decision plus delivery failure plus end-to-end miss; not a decision false negative |
| Every required gate passes but final decision is not Send | Decision false negative and deterministic should-Send miss |
| A later fact changes after a correct decision | Judge the earlier decision from evidence available at its authoritative decision time; do not rewrite history |

## Planned and unplanned publication

Each published measure carries separate Planned and Unplanned rows with its own numerator, denominator, missing count, suppression state, and outcome. A required row that is **Not measured**, **Inconclusive**, or **Run — Fail** prevents an overall Pass. An optional overall value may be shown only as context after both required rows, never as the release result.

## Launch gates

| Gate | Required release state |
|---|---|
| Actionability | `CA-M01 ≥85%` unrounded in every required segment; exactly 85% passes |
| Non-actionable frequency | `CA-M02 <1.0` unrounded in every required segment; exactly 1.0 fails |
| Duplicates | `CA-M03 = 0` with a positive mature denominator; one accepted duplicate stops launch |
| Eligible blocking accessibility | `CA-M04 = 100%` with strict `delivery time < S`; exactly `S` is late |
| Relevance and currentness | `CA-G01 = 0` and `CA-G02 = 0` with complete lineage |
| Should-Send opportunities | No accepted deterministic `CA-G03` miss |
| Privacy and review | No privacy breach, unsafe cell, incomplete denominator lineage, or unresolved required reviewer disagreement |

Immediate stop applies to any accepted duplicate, wrong segment, wrong direction, stale or resolved delivery, deterministic should-Send miss, privacy breach, target failure, required Planned or Unplanned result that is Not measured or Inconclusive, or incomplete denominator lineage. Permission acceptance, message volume, opens, engagement, or quiet incidents cannot offset a trust failure.

## Pending governance choices

The active-commuter definition remains Pending. The recommended privacy-safe proxy for review is one local installation-month with at least one Active, explicitly alert-enabled, delivery-capable occurrence, counted locally and exported only as an aggregate; it is not approved by this Draft.

Also Pending are feedback maturity, aggregation floor and retention, sample sizes and duration, delivery success versus unknown acknowledgment, numeric meaning of “promptly,” opt-out attribution beyond the direct flow, seen state, severity ordering, lock-screen privacy, remote token lifecycle, and the Task 6 quiet-period proposal. No measure may invent any value or use an immature choice as a Pass.

## Draft review checklist

- [ ] All twelve measures bind the exact numerator, denominator, inclusion, exclusion, zero rule, segment result, cadence, privacy limit, owner, and release effect.
- [ ] Exactly 85% passes actionability, exactly 1.0 fails frequency, one duplicate stops launch, and accessibility requires `t < S`.
- [ ] Correct Hold, correct Suppress, capability block, decision false negative, and Send-plus-delivery-failure remain distinct.
- [ ] Planned and Unplanned are independently reported and cannot be averaged into Pass.
- [ ] Every published cell passes the Task 7 privacy boundary and the event-dictionary export limit.
- [ ] All 25 sampling fixtures have complete, independently reviewed evidence.
- [x] Draft index provenance and six-role reviewer metadata align; same-version reviewer decisions and measurement evidence remain Pending.

Every unchecked item blocks approval. This documentation commit is not evidence.
