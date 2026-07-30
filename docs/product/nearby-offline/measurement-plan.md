# Nearby and offline measurement plan

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§29.2 and 30.1–30.3; nearby-station and offline-experience plan `Product artifact map` and Task 13 `Product artifacts`, `Ordered steps`, and `Acceptance evidence`; Task 13 brief |
| Owner | Measurement Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Not run — Pending; no fixed product version, reviewed observation cohort, privacy-approved aggregate, later-outcome comparison, companion evidence, or release readout exists |

## Purpose and authority

This plan defines how the product measures a useful and trustworthy subway decision. It owns the north-star calculation, the five nearby/offline usefulness targets, supporting measures, safety guardrails, required comparison segments, privacy limits, and the ordering of the release readout. It does not create operational truth, change an arrival state, relax a service-change veto, validate an accessible path, establish platform guidance, decide notification eligibility, or approve release.

Arrival Truth owns whether a train is current, coherent, boardable, held, scheduled, bypassing, quarantined, suppressed, or later contradicted. Nearby and offline contracts own the rider outcomes being measured. Accessibility, guidance, and Commute owners supply their companion decisions and evidence. This plan consumes those decisions without recalculating them from product interaction data.

The [artifact index](../artifact-index.md) registers this artifact to specification §§29.2 and 30. The more precise metadata above records §§30.1–30.3 and Task 13 as applying provenance. The [review and approval policy](../review-and-approval-policy.md) governs lifecycle and mandatory decisions. Shared terms retain their meanings in the [transit product glossary](../contracts/transit-product-glossary.md), and measured visible or spoken wording remains subject to the [rider language rules](../contracts/rider-language-rules.md).

This artifact is **Draft**. The authoritative [Gate 0 exit record](../quality/gate-0-exit-record.md) remains:

> **NO-GO — GATE 0 NOT PASSED**

Public arrival boards remain blocked. Every result in this plan is **Not run — Pending**. A written target, an empty incident log, a documentation commit, an unversioned screenshot, or a calculation without its governed denominator is not observed evidence.

## Measurement principles

1. Trust precedes speed. A faster unqualified, bypassed, stale, or contradicted arrival is not a useful outcome.
2. Absence of an arrival is not success. Suppressing every train cannot improve the north star.
3. Evidence labels are part of the outcome. Removing **Live**, **Holding**, **Scheduled**, Offline, freshness, or uncertainty wording cannot improve any measure.
4. Static schedule fallback never qualifies as a current option. It remains measurable only as visibly **Scheduled** exposure.
5. A later outcome of **Not observed** is not success and is never silently dropped to improve a result.
6. Companion absence is visible. Missing accessibility, guidance, Commute, or operational-truth evidence remains Pending or Inconclusive, never zero.
7. Denominators and exclusions are fixed before a reviewed run. A degraded or failed case cannot be removed after its result is known.
8. Rider identity is unnecessary. Product quality is measured with coarse aggregate counts and owner-supplied operational outcomes, not a rider, device, account, location trail, or journey history.

## Result vocabulary

| Result | Meaning |
|---|---|
| **Not run — Pending** | No reviewed fixed product version and evidence package were exercised, or mandatory decisions are absent. This is the current state of every measure. |
| **Not measured** | A run exists, but the governed denominator is zero or a requested quantile lacks an adequate predeclared cohort. `0/0` is never Pass. |
| **Not observed** | A run occurred, but the required later phenomenon or mature outcome did not occur within the governed observation. It is not success. |
| **Inconclusive** | Inputs, lineage, cohort adequacy, privacy review, later outcome, or companion evidence cannot support the decision. |
| **Run — Pass** | The fixed version met the exact target or guardrail, every prohibited-result check passed, and all mandatory reviewers accepted the same evidence. |
| **Run — Fail** | The fixed version missed the target, violated a guardrail, or produced a prohibited result. A correction requires a linked rerun; the failure remains. |

## Privacy-safe observation boundary

The [location and personal-data rules](location-and-personal-data-rules.md) control the measurement boundary. The Measurement Lead may receive only reviewed, coarse, non-personal aggregates or approved operational-quality aggregates. No row-level rider event is an accepted Task 13 input.

An accepted aggregate record contains only:

- measure identifier and fixed product and artifact versions;
- reviewed observation window and broad service-pattern context;
- one permitted coarse segment, or a separately approved limited intersection;
- numerator, denominator, Not observed count, Not measured count, and Inconclusive count as applicable;
- owner-supplied decision category and later-outcome category;
- aggregation owner, purpose, access roles, review disposition, and deletion or approved aggregate-retention end; and
- a durable evidence reference that does not expose personal or row-level rider data.

It contains no rider, account, device, advertising, notification-token, stable pseudonymous, or reversible join identifier; no IP-derived identity; no raw or derived coordinates; no exact permission transition; no selected, searched, recent, last-used, or saved station; no query text; no saved commute or common destination; no active-trip legs or manual cursor; no passive visit, inferred home/work, movement, or travel history; and no timestamp precise enough to reconnect a product action to a person or journey.

Required permission and Accessible Route Only comparisons are aggregate labels only. They do not authorize row-level permission or accessibility-preference collection. The default readout compares one segment dimension at a time. A limited intersection requires Privacy approval, a reviewed aggregation floor, and a documented rider-safety need; an all-dimension join is prohibited. A cell that does not meet the approved aggregation floor is suppressed and reported **Inconclusive**. No numerical aggregation floor is invented in this Draft.

Operational diagnostics may retain the minimum official train, stop, route, equipment, source, and decision scope allowed by the privacy contract. They remain separate from rider context. Task 13 receives only their coarse outcome totals. If a measure cannot be produced without a rider key, row-level journey reconstruction, or a join path between personal and operational data, omit the measure and record the gap.

## Required comparison segments

Every applicable measure is reviewed across each dimension below. “Not applicable” requires an owner explanation; it cannot hide a weak segment.

| Dimension | Required values | Measurement rule |
|---|---|---|
| Location permission | Precise; Approximate; Denied | Compare complete utility and trust without raw coordinates, permission history, or an inferred location. A Denied result remains a first-class product outcome. |
| Product lifecycle | Foreground return; Warm launch | Foreground return resumes preserved context; warm launch exposes the governed last-known shell. Do not infer the state from a rider identity or long-term usage history. |
| Connectivity | Online; Reconnecting; Offline | Use the governing connectivity and ordered-recovery states. A route-feed failure is not automatically Offline. |
| Station topology | Ordinary; Multi-axis | Use the owner-reviewed topology class only, never the station name or a proxy based on rider behavior. |
| Accessible Route Only | On; Off | Compare aggregate constraint outcomes. Never expose or join an individual's accessibility setting. |
| Service pattern | Typical weekday; Late night | Use the governed reference-pattern classification. Do not infer a personal commute schedule. |

The readout shows overall results and every adequate segment. It also lists suppressed, inadequate, Not measured, Not observed, and Inconclusive segment cells so the overall result cannot conceal an unavailable or unsafe context.

## North-star measure

### MEAS-NS01 — Trusted departure decision rate

**Definition:** The share of arrival-view sessions in which the rider receives a current, coherent, boardable option without a later known contradiction before the train reaches the station.

An arrival-view session is a temporary measurement unit for one active Nearby arrival card, station board, or opened board context. It is not a retained rider session, account session, device history, station-visit record, or journey. The aggregate is formed without exporting the row-level unit.

| Field | Rule |
|---|---|
| Rider outcome | The rider can make a departure decision from at least one owner-admitted current option whose stop, direction, destination, state, and boardability are coherent and whose required qualification remains visible and equivalently spoken. |
| Numerator | Eligible arrival-view sessions with at least one such current option and a complete determinate later-outcome comparison showing no contradiction before that train reaches the station. |
| Denominator | All eligible arrival-view sessions in the predeclared reviewed cohort, including views with no qualifying option, only Scheduled fallback, suppression, degradation, or an unobserved later outcome. |
| Zero rule | A zero denominator is **Not measured**. A missing later outcome is **Not observed**, remains in the denominator, and never enters the numerator. |
| Owner | Measurement Lead for calculation; Arrival Truth and service-change owners for admission and later outcome; Release Quality Lead for evidence disposition. |
| Minimum observation | One fixed product version; complete visible and assistive state capture; frozen cohort and exclusions; owner-admitted claim; observation through the train reaching the station or a determinate contradiction; every adequate required segment; mandatory review. Sparse or immature cohorts are Inconclusive. |
| Rider value | Measures whether the product actually supported a safe departure decision rather than merely displayed content quickly. |
| Privacy limit | Aggregate numerator, denominator, later-outcome category, and one approved coarse segment only. No rider key, station choice, coordinate, query, saved context, trip cursor, or row-level claim-to-rider link. |

The following never enter the numerator:

- an unqualified arrival, even if its displayed countdown is fast;
- a Scheduled time presented correctly or incorrectly;
- a current claim whose evidence label, degraded state, or warning is missing;
- an option later known to bypass, short-turn before, skip, or not board at the station;
- a claim restored contrary to an active service-change or recovery veto;
- a session with no current boardable option; or
- a claim whose later outcome is Not observed or Inconclusive.

## Usefulness targets

The targets below preserve the approved meaning of specification §29.2.

| ID | Approved rider outcome and target | Observable calculation | Zero rule | Owner |
|---|---|---|---|---|
| MEAS-U01 | Last-known station shell visible within **0.5 seconds** on a typical warm launch. | Observe elapsed time from the governed warm-launch start to a usable last-known station shell with station identity, preserved context, and honest state. Report the distribution and target breaches; do not substitute a blank shell or skeleton. | No eligible typical warm launches: Not measured. An absent usable shell is a breach, not a removed sample. | Nearby Experience Product Lead supplies outcome; Measurement Lead reports. |
| MEAS-U02 | Current nearby stations and first trustworthy arrivals visible within **two seconds at median and four seconds at the 95th percentile** when feeds and location are healthy. | For eligible healthy-feed, healthy-location launches, measure to both current nearby station results and the first owner-admitted trustworthy current arrival. Both the median and 95th-percentile targets must pass. Scheduled fallback and unqualified arrivals do not stop the clock. | No adequate eligible cohort: Not measured. A launch with no trustworthy current arrival remains in the cohort as an unresolved/missed outcome under the predeclared observation rule. | Nearby owner and Arrival Truth supply outcomes; Measurement Lead reports. |
| MEAS-U03 | Direction switch, route filter, and station change respond **immediately from the rider's perspective**. | For each control separately, review whether one explicit action updates the visible and spoken selection state and preserves context without a network-wait gate or intermediary confirmation. No unapproved millisecond threshold is invented. | No exercised action for a control: that control is Not measured; the others cannot stand in for it. | Nearby Experience Product Lead; Accessibility and Content review perceived and assistive response. |
| MEAS-U04 | Offline map and saved trip open **without network waiting**. | Eligible Offline opens that produce a usable governed map or saved trip immediately from retained content, divided by all eligible Offline opens for that content type. Map and trip are reported separately. | No eligible retained-content open: Not measured. Missing content is classified by its owner and not relabeled as a network wait. | Offline Experience Product Lead; Measurement Lead reports. |
| MEAS-U05 | At least **three useful nearby station cards** for riders within walking range, when geography permits. | Launches with three or more owner-eligible, truthfully labeled useful cards divided by launches where the Task 3 candidate set contains at least three useful station complexes. Geography with fewer than three eligible complexes is a separate outcome, not failure or success. | No geography-permits launch: Not measured. A candidate excluded for unusable entrance or insufficient direction truth cannot be counted to reach three. | Nearby Experience Product Lead and ranking owner; Measurement Lead reports. |

| ID | Minimum observation and required segments | Rider value | Privacy limit |
|---|---|---|---|
| MEAS-U01 | Fixed version; target-capable observation; foreground/warm classification; preserved-shell content; all applicable permission, connectivity, topology, accessibility, and service-pattern segments. | Immediate orientation underground without search or a blank start. | Aggregate elapsed distribution and coarse segment; no station, rider, device, or exact launch timestamp. |
| MEAS-U02 | Predeclared cohort adequate for median and 95th percentile; accepted feed/location health; complete trustworthy-arrival decision; all segments, with Denied explicitly reported as not eligible or separately observed rather than hidden. | Fast access to a train the rider can actually trust. | Aggregate quantiles, eligibility counts, and coarse segment only; no raw location, station, or claim-to-rider row. |
| MEAS-U03 | Direction, filter, and station actions each exercised in visible, large-text, reduced-motion, and assistive review on the same fixed version. | One-handed control without losing the board or waiting for the network. | Aggregate pass/fail counts by control and coarse segment; no selected route, station, or interaction trail. |
| MEAS-U04 | Eligible Offline Map and saved-trip opens with retained-content and validity state recorded; each content type and required segment reported. | Useful navigation in tunnels with no cell service. | Aggregate open/result counts; no origin, destination, saved item, map pose, trip legs, or manual progress. |
| MEAS-U05 | Owner-reviewed practical-walk candidate eligibility and card usefulness on the fixed version; ordinary and multi-axis contexts both covered. | Enough truthful nearby choices without padding the list with unusable stations. | Aggregate eligible-card band (`0`, `1`, `2`, `3+`) and topology class only; no coordinates, station names, entrance, or saved/selected choice. |

## Supporting measures

Supporting measures explain the north star; they cannot override a guardrail or convert an untrusted option into success.

| ID | Measure, rider outcome, and calculation | Zero rule | Owner |
|---|---|---|---|
| MEAS-S01 | **Time to first useful arrival.** Distribution from arrival-view start to the first owner-admitted option with its honest state and required qualification. Report current trustworthy options separately from Scheduled fallback; never pool Scheduled into the trustworthy timing target. | No eligible views: Not measured. No useful option in an eligible view remains a missed/Not observed outcome under the frozen cohort. | Measurement Lead; Arrival Truth supplies admission and state. |
| MEAS-S02 | **Share of launches requiring search.** Launches where the rider must invoke search or the station picker before receiving a usable station context, divided by eligible launches. Separately report voluntary station changes so choice is not mislabeled failure. | No eligible launches: Not measured. Missing action classification: Inconclusive. | Nearby Experience Product Lead. |
| MEAS-S03 | **Nearest-station card engagement.** Eligible exposures where the rider explicitly opens the first owner-ranked useful card, divided by exposures with at least one useful card; report other-card and no-card action separately. | No useful-card exposure: Not measured. | Nearby Experience Product Lead and ranking owner. |
| MEAS-S04 | **Live versus Holding versus Scheduled exposure.** Count and share of arrival claims visibly and equivalently spoken in each evidence state, divided by all governed arrival exposures. Unknown, suppressed, and absent rows remain separate rather than being reassigned. | No arrival exposure: Not measured. An unlabeled exposure is a guardrail issue, not an inferred state. | Arrival Truth and Content owners; Measurement Lead reports. |
| MEAS-S05 | **Service-change suppression and later outcome.** Count suppressions by owner reason; among suppressions with determinate later outcomes, report correct suppression, false suppression, contradiction, and recovery. Not observed outcomes remain explicit. | No suppression: Not observed, not proof of correctness. No determinate later outcomes: Inconclusive for accuracy. | Service-change and Arrival Truth owners. |
| MEAS-S06 | **Ghost false-positive and false-negative rates.** False positive: ghost-filtered claims later proved valid and moving, divided by filtered claims with determinate outcomes. False negative: determinate unreasonable non-movement cases left admitted, divided by all determinate ghost cases. | No mature filtered or determinate ghost cases: the applicable rate is Not measured/Not observed, never zero. | Arrival Truth and Data Quality owners. |
| MEAS-S07 | **Alert localization coverage.** Resolvable alert impacts presented at their exact supported route, direction, station, or segment scope, divided by all resolvable active impacts reviewed. Unresolvable impacts remain explicit and are not counted localized. | No resolvable active impacts: Not observed. Missing denominator lineage: Inconclusive. | Service-change Product Lead and Operations. |
| MEAS-S08 | **Accessible-route validation and reroute success.** Validation: considered accessible candidates with a complete direction-correct path and accepted current equipment decision, divided by all candidates evaluated under Accessible Route Only. Reroute: blocking path changes where the rider is offered an independently verified usable alternative before the last safe decision point, divided by mature blocking changes with an eligible alternative; “no verified route” is a correct separate outcome. | No evaluated candidates or mature blocking change: Not measured/Not observed for that component. Absence of an eligible alternative is not a failed offer if the product truthfully says none is verified. | Accessibility Product Lead and Equipment Data Quality owner. |
| MEAS-S09 | **Offline trip-card opens and completion.** Opens producing a usable retained card divided by eligible opens; explicit rider-completed cards divided by usable opens with an eligible completion action. Manual progress is not inferred from location or time. | No eligible opens: Not measured. An open without a completion opportunity is excluded by the predeclared rule, not after outcome. | Offline Experience Product Lead. |
| MEAS-S10 | **Platform-guidance coverage and correction.** Coverage: eligible destination/transfer contexts showing owner-supported Verified or Expected guidance, divided by guidance-eligible contexts. Correction: accepted categorical reports of wrong zone, unclear instruction, or changed geometry, divided by guidance exposures with an approved feedback denominator. | No eligible guidance context or approved feedback denominator: Not measured. No correction received is Not observed, not proof of accuracy. | Guidance Product Lead; companion-owned until its artifacts and evidence exist. |
| MEAS-S11 | **Commute push actionability and mute rate.** Actionability uses the companion's approved lightweight feedback numerator and eligible delivered disruption-push denominator. Mute uses companion-approved mutes attributable to a delivered push divided by eligible delivered pushes under its reviewed attribution rule. | No eligible delivered pushes or feedback denominator: Not measured. Missing feedback is not positive feedback. | Commute Product Lead; entirely companion-owned. |

| ID | Minimum observation and required segments | Rider value | Privacy limit |
|---|---|---|---|
| MEAS-S01 | Fixed version, eligible view start, admitted state, and complete first-useful outcome; report every required segment and current versus Scheduled separately. | Explains whether truth arrives quickly enough to act. | Aggregate duration distribution and state only; no station, train-to-rider, or interaction row. |
| MEAS-S02 | Eligible launch, startup outcome, and action classification; compare permission, lifecycle, connectivity, topology, accessibility, and service pattern. | Shows when zero-tap utility fails and typing becomes necessary. | Aggregate required-search, voluntary-change, and neither counts; never retain query text or station choice. |
| MEAS-S03 | Owner-ranked eligible-card exposure and explicit open outcome on one fixed version. | Tests whether the first card is practically useful, not merely geographically close. | Aggregate first/other/no-card action only; no card identity, station, coordinate, or rider trail. |
| MEAS-S04 | Complete visible and assistive label capture for admitted exposures; adequate counts for each state and segment. | Reveals whether riders receive current truth, honest holds, or clearly labeled fallback. | Aggregate state counts; no rider, station, route, trip, or exact timestamp in Task 13. |
| MEAS-S05 | Owner-scoped suppressions with mature later outcomes, fixed exclusions, recovery disposition, and every applicable segment. | Tests whether service changes prevent false arrivals without hiding valid service. | Task 13 receives reason/outcome totals only; exact operational records remain identity-separated with the truth owner. |
| MEAS-S06 | Reviewed stalled/moving cases with determinate later outcomes and approved ghost decision; both positive and negative cases represented before release inference. | Balances removing ghost trains against hiding valid trains. | Aggregate decision/outcome counts only; operational claim evidence remains separate from rider context. |
| MEAS-S07 | Active-impact cohort with owner decision on resolvability, exact-scope correctness, and prohibited widening. | Helps riders see the disruption that affects their exact trip without noise. | Aggregate scope class and outcome; no saved commute, selected station, or rider exposure path. |
| MEAS-S08 | Fixed complete-path, direction, equipment, outage, alternative, warning, and later-action evidence; Accessible Route Only On and Off reported without individual preference history. | Measures whether an accessible plan remains usable when equipment changes. | Aggregate path-decision categories and coarse On/Off segment; no path edges tied to a rider, saved need, or movement. |
| MEAS-S09 | Fixed retained-card eligibility, open result, explicit manual completion, and Offline/reconnecting segments. | Shows whether a saved underground plan remains usable through the trip. | Aggregate open/usable/completed counts only; no origin, destination, legs, cursor, time, or rider. |
| MEAS-S10 | Accepted platform-eligibility denominator, displayed certainty, and reviewed categorical correction channel on one fixed version. | Measures whether positioning is available and correct enough to shorten walks. | Aggregate coverage and three correction categories; no free text, station geometry report tied to a rider, or device key. |
| MEAS-S11 | Companion-approved delivered-push, feedback, and mute aggregates with fixed attribution, eligibility, and notification versions. | Tests whether alerts help before the turnstile without causing fatigue. | Task 13 receives aggregate actionability/mute totals only; no token, device, saved commute, window, destination, or recipient history. |

## Guardrail measures

Guardrails are reported before timing and engagement. A zero-target guardrail with one accepted violation fails the reviewed fixed version. Where no numerical threshold is approved, the exact finding and owner disposition are shown; silence is not a pass.

| ID | Guardrail, calculation, and release meaning | Zero rule | Owner |
|---|---|---|---|
| MEAS-G01 | **Arrival shown at a later-confirmed bypassed station.** Count arrival exposures whose train was later determinately confirmed not to serve that station before reaching it; denominator is all mature arrival exposures reviewed. Target: zero known released cases. | No mature later outcomes: Not observed/Inconclusive, not zero. Any accepted case is Fail. | Arrival Truth and service-change owners. |
| MEAS-G02 | **Scheduled time mistaken for Live.** Count visual or assistive Scheduled exposures rendered, announced, or understood under the accepted review as Live/current, divided by all reviewed Scheduled exposures. Target: zero; fallback labeling remains 100% Scheduled. | No Scheduled exposure: Not observed. Missing comprehension/assistive review: Inconclusive. | Arrival Truth and Content owners. |
| MEAS-G03 | **Known-outage accessible invalidation.** Count accessible routes recommended through a required elevator already officially known out of service at the decision time, divided by mature accessible recommendations with current equipment evidence. Target: zero. | No mature accessible recommendation: Not measured. Missing equipment lineage: Inconclusive. | Accessibility Product Lead and Equipment Data Quality owner. |
| MEAS-G04 | **Excessive alert suppression of unaffected service.** Count unaffected admitted claims hidden or invalidated by an alert outside its resolved scope, divided by reviewed unaffected claims exposed to active alert handling. Report severity and systematic pattern; no unapproved tolerance is invented. | No applicable unaffected claims: Not observed. Missing later truth: Inconclusive. Any systematic false suppression is a release blocker. | Service-change Product Lead and Operations. |
| MEAS-G05 | **Notification opt-out after a non-actionable push.** Companion-approved opt-outs or mutes attributable to a push judged non-actionable, divided by eligible non-actionable delivered pushes under the companion's predeclared attribution rule. | No eligible push or attribution evidence: Not measured. Missing feedback is not actionable. | Commute Product Lead; companion-owned. |
| MEAS-G06 | **Location-permission denial after the value explanation.** First reviewed location explanations ending in Denied, divided by all first reviewed explanations with a determinate permission outcome. No target is invented; the segmented result diagnoses trust and clarity, not rider fault. | No determinate first explanation: Not measured. Temporary failure is separate, not Denied. | Nearby Experience Product Lead and Privacy Lead. |
| MEAS-G07 | **Loss of preserved context.** Count governed startup, foreground, Offline, reconnection, permission, refresh, or guidance-loss transitions that lose any required station, direction, filter, accessibility constraint, map tuple, active card/manual state, focus, scroll, or reading context, divided by transitions where that context must persist. | No exercised eligible transition: Not measured. Any deterministic loss is Fail for that transition. | Nearby and Offline Experience Product Leads; Accessibility reviews safety context. |
| MEAS-G08 | **Cached content mistaken for current.** Count cached or historical arrival, alert, equipment, map-pattern, guidance, or trip claims shown or spoken as current/Live without their governed time and evidence boundary, divided by reviewed cached/historical exposures. Target: zero. | No cached/historical exposure: Not observed. Missing visual or assistive capture: Inconclusive. | Offline Experience Product Lead, Data Quality, and Content. |

| ID | Minimum observation and required segments | Rider value | Privacy limit |
|---|---|---|---|
| MEAS-G01 | Fixed admitted-exposure cohort and later outcomes through station reach or contradiction; ordinary/multi-axis and service-pattern coverage. | Prevents the rider from waiting for a train that will not stop. | Coarse exposure/outcome totals; exact train-stop evidence stays with the non-personal truth record. |
| MEAS-G02 | Visual, spoken, large-text, and degraded-state Scheduled cases on one fixed version; comprehension method approved before run. | Prevents a timetable from masquerading as a countdown. | Aggregate label/result counts; no rider identity or raw response text. |
| MEAS-G03 | Complete path and required-machine membership, authoritative outage time, recommendation time, direction, and fixed version. | Prevents an unusable accessible journey from being recommended. | Aggregate known-outage decision counts and On/Off segment; no rider path, disability profile, or location. |
| MEAS-G04 | Resolved alert scope, unaffected control claims, suppression decision, and later outcome across ordinary/multi-axis and service patterns. | Avoids hiding real service because an alert was applied too broadly. | Aggregate affected/unaffected decision totals; exact operations records remain separate from riders. |
| MEAS-G05 | Companion-fixed notification, feedback, non-actionable judgment, attribution, and opt-out/mute evidence. | Detects alert fatigue and protects the disruption-only promise. | Aggregate companion totals only; no token, recipient, device, commute, schedule, or notification history. |
| MEAS-G06 | Reviewed first-explanation cohort and determinate Precise/Approximate/Denied/temporary-failure result across the required product segments. | Shows whether the location request earns trust while preserving full denied utility. | Aggregate permission class only; no OS history, coordinates, device, station, or repeated rider profile. |
| MEAS-G07 | Each governed transition type exercised with before/after visible and assistive context on one fixed version. | Keeps the rider oriented underground and prevents accessibility settings or trip progress from disappearing. | Aggregate loss category and transition class; no preserved content values, station, map pose, trip, cursor, or rider trail. |
| MEAS-G08 | Each cached/historical claim type exercised Online, Reconnecting, and Offline with visible and assistive evidence. | Prevents old information from looking live when the rider most needs honesty. | Aggregate claim-type and result totals; no saved item, station, journey, or raw exposure row. |

## Release readout

The release readout uses this order:

1. **Evidence completeness and privacy:** fixed product/artifact versions, frozen cohorts, aggregate lineage, mandatory reviewers, absent companion inputs, and every Not run, Not measured, Not observed, suppressed, or Inconclusive cell.
2. **Safety guardrails:** all eight guardrails, with zero-target violations and systematic false suppression shown before any speed or engagement result.
3. **Trusted departure decision rate:** numerator, denominator, later-outcome maturity, non-success count, and every adequate required segment.
4. **Usefulness targets:** the exact 0.5-second, median two-second, 95th-percentile four-second, immediate-control, no-network-wait, and three-useful-card outcomes.
5. **Supporting and companion measures:** explanatory results, ownership, missing evidence, corrections, and linked reruns.
6. **Decision and open risk:** reviewer decisions, failures, deviations, correction owners, and release effect.

The readout cannot:

- count an unqualified arrival, a Scheduled fallback, or a missing later outcome as a trusted departure;
- improve a result by removing a degraded-state label, warning, failed case, segment, or denominator member;
- treat no incidents, no feedback, no observed ghost, no alert, or no outage as a passing safety result;
- average away a failed required segment;
- let timing, engagement, or notification actionability override a trust or accessibility guardrail;
- treat a companion-owned Pending result as zero or accepted;
- overwrite a failure after correction; or
- change the authoritative Gate 0 decision.

At the current version, the release readout is:

| Readout layer | Current result |
|---|---|
| Evidence completeness and privacy | **Not run — Pending**; no fixed product version, observation cohort, aggregate lineage, or mandatory reviewer decisions |
| Guardrails | **Not run — Pending**; no mature later-outcome, accessibility, cached-state, permission, context, or companion evidence |
| Trusted departure decision rate | **Not measured**; no governed denominator or later-outcome cohort |
| Usefulness targets | **Not measured**; no fixed observed timing, control, Offline-open, or nearby-card cohort |
| Supporting measures | **Not measured / companion Pending** |
| Release decision | **NO-GO — GATE 0 NOT PASSED**; public arrival boards remain blocked |

## Acceptance fixtures

Every attempt is append-only and binds one fixed product version, fixed artifact versions, cohort definition, aggregate lineage, expected result, prohibited results, actual result, required segments, visible and assistive evidence where applicable, reviewer names/roles/decisions, review date, durable links, correction, and rerun relationship.

| Fixture | Expected result | Current evidence |
|---|---|---|
| MEAS-A01 — North-star anti-gaming | An unqualified fast arrival, Scheduled fallback, suppressed-all board, removed degraded label, and Not observed later outcome each fail to enter the numerator; every eligible view remains in the denominator. | **Not run — Pending** |
| MEAS-A02 — Usefulness boundaries | Exact 0.5-second shell, two-second median, four-second 95th percentile, immediate controls, Offline no-network-wait opens, and three-card geography boundaries are evaluated without invented substitutions. | **Not run — Pending** |
| MEAS-A03 — Required segments | Each measure reports all six applicable dimensions; inadequate and privacy-suppressed cells remain visible and are not averaged away. | **Not run — Pending** |
| MEAS-A04 — Privacy separation | Measurement intake accepts only the approved aggregate schema; rider keys, raw coordinates, station/query/saved/trip detail, stable pseudonyms, and reconstructable intersections are rejected. | **Not run — Pending** |
| MEAS-A05 — Zero and absent evidence | `0/0` becomes Not measured; a run without the phenomenon becomes Not observed; incomplete lineage becomes Inconclusive; companion absence remains Pending. | **Not run — Pending** |
| MEAS-A06 — Guardrail precedence | One accepted zero-target violation or blocking systematic false suppression produces a failed release layer regardless of faster timing or higher engagement. | **Not run — Pending** |
| MEAS-A07 — Failure preservation | A correction adds a linked fixed-version rerun and never overwrites the original failure, evidence, or reviewer decision. | **Not run — Pending** |

## Ownership and pending evidence

| Decision | Authoritative owner | Measurement boundary | Current disposition |
|---|---|---|---|
| Arrival admission, evidence state, suppression, ghost decision, and later outcome | Arrival Truth and service-change owners | Consume accepted decision and coarse aggregate; never infer truth from engagement. | Draft/Pending; Gate 0 not passed |
| Startup, Nearby, controls, preserved context, and station-card utility | Nearby Experience Product Lead | Define reviewed outcome and aggregate only. | Draft; Task 14 evidence absent |
| Offline open, historical honesty, active card, and reconnection | Offline Experience Product Lead | Measure aggregate open/result and context-loss category without stored values. | Draft; Task 14 evidence absent |
| Accessible validation, equipment state, and reroute | Accessibility and Equipment owners | Consume complete-path and current equipment outcomes; report coarse On/Off aggregate only. | Companion artifacts/evidence absent |
| Platform guidance and correction | Guidance Product Lead | Keep in product readout but do not enable, calibrate, or infer. | Companion artifacts/evidence absent |
| Commute actionability, mute, opt-out, and attribution | Commute Product Lead | Receive approved aggregate only; no notification or saved-commute data. | Companion artifacts/evidence absent |
| Privacy schema, aggregation floor, access, and retention | Privacy Lead under [location and personal-data rules](location-and-personal-data-rules.md) | Reject any row-level, joinable, or reconstructable input; omit unsafe measures. | PRIV-Q01 and MEAS-A04 Not run — Pending |
| Acceptance evidence and go/no-go | Release Quality Lead and mandatory reviewers | Record fixed results and failures; this plan does not approve release. | Task 14 and Task 15 artifacts absent |

## Draft review checklist

| Review question | Draft result | Evidence required before approval |
|---|---|---|
| Does the north star require a current, coherent, boardable option and a determinate contradiction-free later outcome? | Yes by contract; not observed. | MEAS-A01 and owner-supplied later outcomes |
| Can a Scheduled, unqualified, unlabeled, suppressed-all, or Not observed case improve the north star? | No. | Fixed anti-gaming run |
| Are all five §29.2 targets preserved without an invented numeric threshold for “immediately”? | Yes. | MEAS-A02 and fixed timing/interaction evidence |
| Do all supporting measures and guardrails identify outcome, calculation, zero rule, owner, minimum observation, rider value, and privacy limit? | Yes by contract. | Same-version aggregate dictionary and review |
| Are all six segment dimensions reported without an all-dimension rider join? | Required here; not observed. | MEAS-A03 and privacy-approved aggregate lineage |
| Can measurement receive a stable rider key, raw coordinate, station/query/saved/trip detail, or manual cursor? | No. | PRIV-Q01 and MEAS-A04 rejection evidence |
| Do companion-owned accessibility, guidance, and Commute measures remain visible when Pending? | Yes. | Companion contracts and evidence |
| Do guardrails precede timing and engagement in the release decision? | Yes. | MEAS-A06 and Task 15 readout |
| Are zero denominators, absent phenomena, incomplete evidence, failures, and reruns represented honestly? | Yes. | MEAS-A05, MEAS-A07, and Task 14 evidence |
| Does this Draft claim observed performance, Gate 0 passage, or public release readiness? | No. | The decision remains **NO-GO — GATE 0 NOT PASSED**; public arrival boards remain blocked. |
