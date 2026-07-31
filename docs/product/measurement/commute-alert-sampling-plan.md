# Commute alert sampling plan

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§25.2–25.7, 26.3, 28.1–28.3, 30, 33.5, and 34; commute alerts and launch quality plan Task 8; accepted immutable Commute Tasks 2, 3, 5, 6, and 7 |
| Owner | Measurement Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](#pending-execution-record) |

## Purpose and authority

This plan defines four privacy-safe sampling frames, required strata, Draft review cadence, and 25 fixed synthetic acceptance fixtures for the [scorecard](commute-alert-scorecard.md) and [event dictionary](commute-alert-event-dictionary.md). It cannot change eligibility, threshold, timing, content, deduplication, privacy, or launch policy.

Every fixture is a synthetic expected definition, not observed evidence and not an MTA guarantee. No approved sample size, duration, feedback maturity, aggregation floor, cohort, denominator lineage, push, feedback, delivery, reviewer decision, pilot, or launch evidence exists. Zero incidents proves nothing. Gate 0 remains **NO-GO — GATE 0 NOT PASSED**; commute alerts remain later-release and unapproved.

## Product Governance reconciliation

The artifact header and Draft artifact index row now align on the full Task 8 provenance, accepted immutable Tasks 2, 3, 5, 6, and 7 handoffs, and Product, Accessibility, Data Quality, Content, Privacy, and Operations review. The sampling frames, fixture set, and privacy restrictions remain governed by this artifact. Metadata alignment is not approval; every sampling result and reviewer decision remains **Pending**.

## Frozen sampling frames

| Frame | Unit and source | Inclusion | Exclusion and controls | Selection and review | Permitted output |
|---|---|---|---|---|---|
| 1. Silent/shadow sample | One predeclared fixed synthetic commute opportunity evaluated against fixed non-personal operational evidence | Eligible and ineligible opportunities across every required stratum; controls with known Send, Suppress, and Hold results | No rider delivery, feedback, personal trip, inferred journey, or post-observation fixture change | Freeze fixtures, versions, expected result, sample selection, and two-reviewer procedure before observation; reviewers independently compare to authoritative-time evidence | Coarse expected/actual decision, class, reason, timeliness, agreement, and prohibited-check totals |
| 2. Delivered-push aggregate frame | Privacy-approved aggregate cells for actionability, frequency, first permission request, direct disablement, and delivery disposition | Mature approved aggregate categories from delivered pushes or explicit direct flows | No row-level payload, installation, token, commute, journey, permission history, free text, stable join, or immature feedback | Freeze approved denominator, maturity, one coarse dimension, floor, retention end, and access before intake | Only `CA-E08` aggregate cells; unsafe cells suppressed |
| 3. Trust-sentinel census | Every suspected duplicate, wrong segment/direction, stale/resolved delivery, blocking-accessibility miss, or privacy breach | All suspected and accepted cases, including those found outside a random sample | No sampling away a breach; no denominator removal, reweighting, or substitution after observation | Immediate independent adjudication and containment; report the census separately without changing frozen random denominators | Coarse suspected/accepted/cleared category totals and release-stop state |
| 4. False-negative sample | One eligible operational episode paired with a predeclared synthetic journey opportunity and controls | Should-Send, correct Hold, correct Suppress, capability-block, Send-plus-delivery-failure, and no-impact controls | No source snapshot as a unit; no capability block mislabeled as miss; no later evidence used to rewrite the decision | Start from eligible episodes rather than delivered messages; freeze opportunity, authoritative-time package, selection, and two-reviewer procedure | Coarse expected/actual decision and delivery-disposition totals, with decision and delivery misses separate |

Trust-sentinel findings never replace, enlarge, shrink, or improve a frozen random denominator. A census breach stops release even when sampled rates meet target.

## Required strata

Every applicable frame predeclares coverage across:

- Planned and Unplanned;
- delay/gap, bypass, reroute, short turn, suspension/closure, and blocking accessible-path impact;
- weekday, weekend, and overnight;
- initial, escalation, recovery, and reminder where the class is applicable; and
- coherent single-source, coherent cross-source, and contradictory evidence.

Each required stratum has its own numerator, denominator, missing count, privacy suppression, reviewer result, and scorecard outcome. No overall average can replace a failing, Not measured, or Inconclusive required stratum.

## Draft cadence

| Cadence | Required activity |
|---|---|
| Daily during silent/pilot | Trust-sentinel and duplicate census; delivery-disposition partition; immediate review of suspected trust, accessibility, or privacy breach |
| Weekly | Independent silent/shadow and false-negative sample; double-review agreement; cumulative scorecard and denominator-lineage review |
| Monthly | Mature actionability, active-commuter frequency, first permission request, explicit pause/direct-off, and approved direct-attribution aggregates |
| Immediate | Hold or stop on an accepted duplicate, wrong segment/direction, stale/resolved delivery, deterministic should-Send miss, accessibility-timeliness failure, privacy breach, or lineage failure |

This cadence is Draft. Sample sizes, observation duration, feedback maturity, active-commuter definition, aggregation floor, and aggregate retention remain unapproved. Each must be frozen before observation. Until then, no measure or stratum can be Pass.

## Fixed inherited fixture contract

`CA-T8-POLICY-v1` identifies this fixture pack. Accepted Tasks 2, 3, 5, 6, and 7 are fixed at base commit `404bad3c9cb9ffa6cb7536dcbb1946c6e1e020d9`. The Task 8 version is the exact commit containing this pack. Fixed product/build, sample size, duration, maturity, floor, and retention are **Pending**, so no fixture is executable or passed.

Every definition inherits the complete values below unless its row explicitly replaces them. The inherited record plus the row is the full fixed input; no omission means “any.”

| Required input | Fixed synthetic value |
|---|---|
| Package and evidence | Fixture-specific `*-SRC-v1`; synthetic non-personal service evidence; fixed accepted source/effective times, currentness, coherence, quarantine, and authoritative decision time |
| Opportunity | One Task 6 deduplicated episode/materially equivalent impact/occurrence/message-state opportunity; exact identity stays inside the source boundary |
| Commute | Synthetic Active, confirmed subway commute with fixed origin, destination, direction, segment, constituents, path requirement, weekday, New York window, and lead; never exported to measurement |
| Tasks 2–3 | All fixed gates, threshold family, baseline, persistence, reset, exact boundary, and expected result supplied; row states every override |
| Tasks 5–6 | Fixed timing, final recheck, class/template, identity/equivalence, represented delivery, and expected visible/assistive result; row states every override |
| Task 7 | Alert intent, current capability, connectivity, queue, delivery disposition, privacy class, reset/deletion state, and prohibited data supplied; row states every override |
| Planned status | Two labeled subruns, Planned and Unplanned, unless the row fixes one or says the event has no approved incident classification |
| Human review | Two independent reviewers receive the same frozen complete decision package and decide eligibility, class, relevance, duplicate, and timeliness before comparison |
| Measurement export | Pre-reviewed coarse category totals; one dimension by default; no personal row, stable key, exact journey, precise time, message text, episode ID, or reversible join |
| Visible and assistive check | Expected and prohibited meaning must match visibly and assistively; no scorecard result is rendered as rider-facing transit truth |
| Execution state | Actual, all six reviewer decisions/dates, durable evidence, correction, rerun, and status are **Not run — Pending** |
| Common prohibited result | MTA or launch guarantee; Pass from zero denominator, immaturity, no incident, unsafe cell, blended segments, volume, permission acceptance, or engagement; post-observation denominator change |

## Fixture definitions

| Fixture/source | Complete fixed override | Exact expected result | Fixture-specific prohibited result |
|---|---|---|---|
| `CAQ-01`; `CAQ-01-SRC-v1` | Three mature `CA-M01` cells: Actionable/denominator `84/100`, `85/100`, and `86/100`; all deliveries and lineage complete | Unrounded 84% = **Run — Fail**; exactly 85% = **Run — Pass**; 86% = **Run — Pass** | Rounding 84 up, treating 85 as exclusive, or removing No response |
| `CAQ-02`; `CAQ-02-SRC-v1` | Mature feedback totals: 84 Actionable, 14 Non-actionable, 2 No response | Numerator 84, denominator 100, result 84% **Run — Fail**; both missing responses stay denominator and never numerator | Use denominator 98, classify missing as Actionable, or call missing immature |
| `CAQ-03`; `CAQ-03-SRC-v1` | Three approved `CA-M02` cells: unique Non-actionable messages/active-commuter-month units `99/100`, `100/100`, `101/100` | Unrounded 0.99 = **Run — Pass**; exactly 1.0 = **Run — Fail**; 1.01 = **Run — Fail** | Treat threshold as `≤1.0`, percent-format the rate, or count duplicate copies as unique |
| `CAQ-04`; `CAQ-04-SRC-v1` | Complete lineage but denominator is zero for an actionability or frequency cell | **Not measured**; publish zero denominator and no Pass | Convert `0/0` to zero percent, Pass, Not observed, or remove the cell |
| `CAG-01`; `CAG-01-SRC-v1` | One successfully delivered message affects a segment outside the synthetic journey; complete evidence available | One `CA-G01` unaffected-segment violation; **Run — Fail** and immediate stop | Call broadly relevant, dilute in sample, or rewrite the journey |
| `CAG-02`; `CAG-02-SRC-v1` | One successfully delivered message is for the opposite normalized direction and actual terminal | One `CA-G01` wrong-direction violation; **Run — Fail** and immediate stop | Use route color, omit terminal, or count as correct relevance |
| `CAG-03`; `CAG-03-SRC-v1` | Governing evidence is stale at the authoritative final decision time but message is delivered | One `CA-G02` stale-evidence violation; **Run — Fail** and immediate stop | Use retrieval time, later evidence, or message usefulness to clear staleness |
| `CAG-04`; `CAG-04-SRC-v1` | Incident release is accepted before final decision; former disruption message is nevertheless delivered | One `CA-G02` already-resolved violation; **Run — Fail** and immediate stop | Treat post-release delivery as current, recovery, or harmless |
| `CAD-01`; `CAD-01-SRC-v1` | One coherent alert and live record represent the same Task 6 impact; two equivalent deliveries succeed | First is permitted; second is one cross-source duplicate; `CA-M03 = 1/2`, **Run — Fail**, immediate stop | Count per source, report zero duplicates, or count two duplicates |
| `CAD-02`; `CAD-02-SRC-v1` | One permitted delivery succeeds; equivalent copy-only and timestamp-only candidates are correctly Suppressed and never delivered | Successful dedupe-eligible deliveries `1`; duplicates `0`; fixed mature fixture expectation **Run — Pass** | Count suppressed candidates as delivery failures or send them |
| `CAT-01`; `CAT-01-SRC-v1` | Blocking accessible-path evidence and all gates ready before start `S`; capability exists; successful delivery at `S−1 second` | `CA-M04 = 1/1 = 100%`, timely **Run — Pass** | Round to `S`, use receipt-display time, or exclude the eligible case |
| `CAT-02`; `CAT-02-SRC-v1` | Same eligible case; successful delivery occurs exactly at `S` | Strict `delivery time < S` fails; `CA-M04 = 0/1`, **Run — Fail**, immediate stop | Treat equality as timely or add clock tolerance |
| `CAT-03`; `CAT-03-SRC-v1` | Authoritative blocking evidence is first accepted at or after `S`; no earlier complete gate package exists | Exclude from `CA-M04` denominator; report one first-ready-at/after-start case separately; metric cell with no other case is **Not measured** | Count as eligible late failure, timely success, or hide the excluded case |
| `CFN-01`; `CFN-01-SRC-v1` | Exact relevance evidence is unresolved at decision time; accepted final decision is Hold; no attempt | Correct Hold; neither false negative nor delivery failure; excluded from `CA-G03` should-Send denominator | Force Send/Suppress, count miss, or use later evidence |
| `CFN-02`; `CFN-02-SRC-v1` | Every Task 2–7 gate passes and expected decision is Send; actual final decision is Suppress; no attempt | One decision false negative and deterministic `CA-G03` miss; `1/1`, **Run — Fail**, block | Call capability block, correct Suppress, or delivery failure |
| `CFN-03`; `CFN-03-SRC-v1` | Every gate passes; expected and actual decision are Send; delivery disposition Failed | Decision is correct; one delivery failure and end-to-end `CA-G03` miss; `1/1`, **Run — Fail** | Call decision false negative, success, capability block, or correct Suppress |
| `CFN-04`; `CFN-04-SRC-v1` | Active alert intent but current capability is Denied, restricted, revoked, Paused, Offline, or absent; no final Send/attempt | Capability-blocked; excluded from should-Send miss and `CA-E02`; no replay after restoration | Count false negative/delivery failure, create no-attempt Send, or replay |
| `CAP-01`; `CAP-01-SRC-v1` | Separate first-request subruns end Granted, Denied, Restricted, Not determined, and Temporary failure; current capability read remains separate | Only Granted/Denied enter `CA-D01` denominator; Denied enters numerator; other states separate; Granted carries no success claim | Merge states, retain transition history, or label Granted conversion/Pass |
| `CAF-01`; `CAF-01-SRC-v1` | Explicit Pause, Resume, direct alert-off, delete, reset, app-data clear, and reinstall are separate synthetic actions | Pause/Resume/direct off enter their controlled `CA-E05` categories; deletion lifecycle actions create no opt-out or actionability event | Infer push attribution, count lifecycle deletion as disablement, or retain action history |
| `CAS-01`; `CAS-01-SRC-v1` | Two independent reviewers receive one complete frozen package and agree on all five required decisions and checks | `CA-D04 = 1/1` agreement; fixed complete fixture expectation **Run — Pass** | Reviewer collaboration before decision, missing check, or one reviewer copied |
| `CAS-02`; `CAS-02-SRC-v1` | Two independent reviewers disagree on relevance while all package fields are complete | Disagreement remains **Inconclusive**; no preferred reviewer; affected release result blocked | Majority vote, reviewer selection, silent reconciliation, or Pass |
| `CAS-03`; `CAS-03-SRC-v1` | Planned `CA-M01 = 90/100`; Unplanned `CA-M01 = 80/100`; optional combined value `170/200 = 85%` | Planned **Run — Pass**; Unplanned **Run — Fail**; release fails despite combined 85% | Publish combined Pass, omit Unplanned, or reweight after observation |
| `CAPR-01`; `CAPR-01-SRC-v1` | Proposed intake includes rider-level payload, token, exact journey/time/message and stable join; separate reviewed cell contains only measure/version/broad period/one coarse segment/counts/purpose/access/retention end | Reject and end the row-level payload; accept only the privacy-approved coarse aggregate | Hash or retain the row, export exact context, or reject the safe aggregate solely because the unsafe proposal existed |
| `CAPR-02`; `CAPR-02-SRC-v1` | Privacy review marks a fixed synthetic cell unsafe and small; the production numeric floor remains unapproved | Suppress the cell as **Inconclusive** and block dependent result; record the floor gap | Invent a production floor, merge after observation, publish complement, zero, or Pass |
| `CAE-01`; `CAE-01-SRC-v1` | Attempt 1 on fixed version v1 is **Run — Fail**; bounded correction creates v2 and a new reviewed attempt with expected **Run — Pass** | Preserve v1 failure and evidence; append correction link and distinct v2 rerun; never rewrite original | Overwrite v1, reuse attempt/version, erase evidence, or present documentation as rerun |

## Pending execution record

Each row is an independent evidence record. “Reviewer decisions” means Product, Accessibility, Data Quality, Content, Privacy, and Operations, each with a date. Every field remains **Not run — Pending** until one fixed product/build and all unapproved sampling choices are frozen.

| Fixture | Actual | Reviewer decisions and dates | Durable evidence | Correction | Rerun | Status |
|---|---|---|---|---|---|---|
| `CAQ-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CAQ-02` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CAQ-03` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CAQ-04` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CAG-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CAG-02` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CAG-03` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CAG-04` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CAD-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CAD-02` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CAT-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CAT-02` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CAT-03` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CFN-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CFN-02` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CFN-03` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CFN-04` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CAP-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CAF-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CAS-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CAS-02` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CAS-03` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CAPR-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CAPR-02` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |
| `CAE-01` | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** | **Not run — Pending** |

## Future execution and correction

For every run:

1. freeze product/build, Tasks 2–8, fixture, frame, strata, selection, sample size, duration, maturity, floor, retention, and denominator lineage before observation;
2. capture the complete source-boundary decision package and expected, actual, and prohibited visible/assistive checks;
3. independently review with the same fixed package and preserve both decisions;
4. export only the approved coarse aggregate;
5. preserve every failed, incomplete, or inconclusive original;
6. append a bounded correction with a new version and new attempt; and
7. rerun all affected fixtures and scorecard cells without rewriting prior evidence.

Documentation, synthetic expected results, zero incidents, one reviewer, screenshots without version lineage, or a passing rerun that overwrites its failure are not evidence.

## Privacy and reset

Synthetic/shadow review uses fixed non-personal operational evidence. Real pilot data may enter only as approved aggregate categories. Reset or personal-data deletion removes personal measurement state, linkable pending aggregates, and queued copies. Only a truly non-personal reviewed aggregate may survive for its approved purpose and retention end. If a measure requires journey reconstruction or a stable join, omit it and record the gap.

## Launch-stop conditions

Stop immediately for any accepted duplicate; wrong segment or direction; stale or resolved delivery; deterministic should-Send miss; eligible blocking-accessibility late delivery; privacy breach; target failure; incomplete denominator lineage; required Planned or Unplanned result that is Not measured or Inconclusive; or unresolved reviewer disagreement.

Permission acceptance, message volume, opens, engagement, or quiet incidents cannot offset a trust failure.

## Pending decisions

Active-commuter definition, feedback maturity, aggregation floor and retention, sample sizes, observation duration, delivery success versus unknown acknowledgment, “promptly,” attribution outside the direct flow, seen state, severity ordering, lock-screen privacy, remote token lifecycle, and the Task 6 quiet-period proposal remain Pending. No fixture or cadence invents them.

## Draft review checklist

- [ ] All four frames are frozen before observation and trust-sentinel cases never alter random denominators.
- [ ] Every required stratum has separate lineage and cannot be hidden by an overall value.
- [ ] Draft cadence and all unapproved sample choices are represented truthfully.
- [ ] Fixture definitions and execution rows are exactly the 25 required IDs.
- [ ] Every fixture has full inherited inputs, exact expected and prohibited results, and separate Pending evidence fields.
- [ ] Exact 85%, 1.0, duplicate-zero, and strict `t < S` boundaries are preserved.
- [ ] Correct Hold, correct Suppress, capability block, decision false negative, and Send-plus-failure remain distinct.
- [ ] No personal row, stable join, unsafe cell, or invented aggregation floor reaches measurement.

Every unchecked item blocks approval. This documentation commit is not evidence.
