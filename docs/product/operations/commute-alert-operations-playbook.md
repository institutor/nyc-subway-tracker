# Commute alert operations playbook

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§9.2–9.3, 25.2–25.7, 26.3, 28.1–28.3, 30, 32.3, 33.5, and 34; commute alerts and launch quality plan Task 9; accepted immutable Commute Tasks 2–8; accepted Arrival Truth feed-health, anomaly, quarantine, and recovery boundaries |
| Owner | Operations Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](commute-alert-pilot-review-template.md#pending-drill-record) |

## Purpose and authority

This playbook owns triage, containment, commute-notification holds, release evidence, and escalation. The [correction policy](commute-alert-correction-policy.md) owns material-error remedy decisions, the [incident log](commute-alert-incident-log-template.md) records evidence, and the [pilot template](commute-alert-pilot-review-template.md) records Task 8 and operational results. Task 10 alone owns a go/no-go release decision.

This playbook consumes, but cannot change, accepted Commute Tasks 2–8 or Arrival Truth. A commute-alert hold controls notification delivery only. It is not a transit fact, station-board state, service alert, permission state, rider preference, or launch approval.

All rules and drills are Draft, not MTA guarantees. No observed roster, paging path, switch, access test, queue cancellation, delivery, correction, recovery, pilot, reviewer decision, or release evidence exists. Gate 0 remains **NO-GO — GATE 0 NOT PASSED**. Public boards, commute pushes, pilot advance, and launch claims remain blocked.

## Product Governance alignment

The product artifact index and this header align on the full Task 9 provenance, the §32.3 Release 2 boundary, Operations ownership, and the six-role reviewer set. Both remain **Draft**, approval and drill evidence remain **Pending**, and index alignment changes no gate record.

## Operational roster and authority

| Role | May decide or command | Must provide | May not do |
|---|---|---|---|
| Operations Incident Commander | Sole switch-command authority; engage global, matching route/feed-group, or episode holds; own incident state and containment scope | Incident ID, command time, scope, reason, queue action, handoff, and release record | Delegate command ambiguity, auto-release, or self-verify execution |
| Delivery/platform on-call | Execute the Commander’s switch command and queue cancellation; capture before/after evidence | Switch state, cancellation result, delivery disposition, authoritative Failed result or **Delivery unresolved — acknowledgment Unknown**, and final-check evidence | Choose or widen scope, command release, retry Unknown, verify own work, or self-release |
| Data Quality on-call | Decide source health, quarantine, mapping, correlation, and recovery-evidence sufficiency | Authoritative timestamps, currentness, anomaly, mapping, accepted/rejected evidence, and two-snapshot state | Override commute policy, delivery evidence, or Accessibility/Privacy authority |
| Commute Product Lead | Interpret rider materiality and commute policy; demand containment; stop a pilot | Exact policy branch and rider consequence | Override a truth failure or release alone |
| Release Quality Lead | Freeze versions, reproduce, adjudicate, preserve failures, and run correction/rerun evidence; demand containment | Fixed package, expected/actual/prohibited checks, independent review, and rerun lineage | Release alone or rewrite an original result |
| Accessibility Lead | Demand immediate containment for Accessible Route Only, path, equipment, blocking-outage, or unsafe-alternative defects; approve accessibility release | Complete path consequence, affected/unaffected scope, accessible alternative review, and release decision | Permit weaker ARO behavior or release without Data Quality |
| Privacy Lead | Demand containment for cross-rider, token, deletion/reset, personal-data, analytics, or post-revoke defects; approve privacy release | Minimum non-personal classification, affected delivery boundary, deletion/containment evidence, and release decision | Copy personal evidence into the incident log or release without Data Quality |
| Content Lead | Approve rider correction and incident language | Approved fixed class, template, scope, and certainty | Let operators improvise correction, retraction, all-clear, or service copy |

Any Data Quality, Product, Accessibility, Privacy, or Release reviewer may demand containment. The Commander records and engages it without waiting for a second approval. The requester need not prove final cause before a safe hold.

## Roster readiness gate

Pilot activity is blocked unless the roster records, for every role:

- named primary and backup;
- tested page path and acknowledgment handoff;
- current switch and evidence access;
- separation between Commander, executor, and independent verifier;
- coverage for weekday, overnight, planned weekend, and unplanned incident periods; and
- a completed access drill on the fixed pilot version.

Names, page routes, response times, and switch implementation are Pending and are not invented here. A missing primary, backup, page path, handoff, or tested access blocks pilot start and continuation.

## Release approval

The Commander remains command authority. Release additionally requires independent approval for the failed domain:

| Failed domain or hold | Required independent approval before command | Separation rule |
|---|---|---|
| Source health, mapping, currentness, or evidence quality | Commander plus Data Quality on-call | Data Quality supplies recovery evidence; switch executor is not verifier |
| Delivery, duplicate, queue, correlation, or acknowledgment rule | Commander plus Data Quality and an independent delivery verifier | The person who executed the switch, cancellation, fix, or queue action cannot verify it |
| Accessibility | Commander plus Accessibility Lead and Data Quality | Product or Operations cannot waive a path/equipment truth failure |
| Privacy | Commander plus Privacy Lead and Data Quality | Operations cannot waive deletion, token, leakage, or join failure |
| Global hold or pilot continuation after a broad incident | Operations/Commander, Commute Product Lead, Data Quality, and every affected Accessibility or Privacy domain lead | Release Quality supplies fixed reruns but cannot release alone |

Missing approval leaves the hold effective.

The executor cannot verify the same switch, cancellation, fix, or queue action and cannot approve its release.

## Deterministic operational outcomes

Use exactly these five outcomes:

| Outcome | Exact condition | Delivery consequence |
|---|---|---|
| **Continue** | Current Tasks 2–8 result passes and no effective matching hold exists | Candidate may continue to the final switch and delivery checks |
| **Hold** | Evidence or common cause is unresolved, an active unresolved-attempt lock covers the candidate, or a matching containment switch is effective | Send and queue nothing; cancel unsent matching work |
| **Suppress** | A definite gate failure, staleness, ended opportunity, or other accepted exclusion exists | Send nothing and never late-send |
| **Correct** | A prior delivered claim would cause a materially wrong rider choice and a supported correction path exists | Apply the correction policy; no improvised message |
| **Release hold** | Owner recovery evidence, required independent approvals, and a complete current Tasks 2–7 reevaluation pass | Remove only the commanded hold; this is not a recovery notification and never replays work |

Correct Hold and Suppress, Paused, denied/restricted/revoked permission, Offline, and outside-window outcomes are not delivery failures.

## Switch model and send-time invariant

The exact effective-hold rule is:

> **effective hold = global OR matching route/feed-group OR matching episode**

| Switch scope | Applies to | Does not apply to |
|---|---|---|
| Global | Every subway commute notification candidate | Station boards, saved commutes, maps, or other product surfaces |
| Route/feed-group | Candidates dependent on the exact route or published feed group | Healthy unrelated route/feed groups |
| Episode | Candidates representing the exact Task 6 episode or materially equivalent delivery group | Independent episodes or unrelated service |

Switches have no auto-expiry. Elapsed time, service-alert disappearance, one healthy snapshot, a new deployment, or a process restart cannot release them. Releasing one scope leaves every other matching hold effective.

Every delivery path must:

1. evaluate current Tasks 2–7, candidate currentness, successful-delivery memory, and active unresolved-attempt locks;
2. read all three hold scopes;
3. apply the OR rule;
4. cancel or refuse matching unsent queue work when held;
5. perform the ordinary final pre-delivery recheck; and
6. reread the switch immediately before the final send action.

A hold engaged during a queue race vetoes the unsent item. An Unknown acknowledgment appends **Delivery unresolved — acknowledgment Unknown**, writes no successful baseline or represented-window marker, and activates the exact same-occurrence, same-delivery-group unresolved-attempt lock for equivalent or dependent impact. Covered future action remains **Hold for stronger evidence — Final recheck unresolved**. Never assume Success or Failed, retry, replay, recover, correct, or write a successful baseline solely from Unknown.

Only authoritative evidence linked to the immutable attempt may resolve the lock to Success or Failed. Success writes the original frozen successful-delivery memory and sends nothing from resolution alone. Failed writes no baseline and never replays the original. If the occurrence expires first, append **Expired unresolved**, close only that active occurrence lock, and take no late action. Elapsed time, restart, queue absence, message visibility, Seen state, or operator inference cannot resolve Unknown.

## State and surface isolation

Engaging, widening, narrowing, or releasing a hold:

- does not pause, expire, edit, delete, or recreate a saved commute;
- does not change explicit alert intent, operating-system permission, token preference, or permission history;
- does not erase, rewrite, or manufacture the Task 6 delivery ledger;
- does not disable or weaken global or per-commute Accessible Route Only;
- does not change saved stations, maps, route choice, or accessibility preference;
- does not alter station arrival boards, countdown admission, reroutes, equipment state, or official alert presentation; and
- does not change healthy unrelated routes or feeds.

Station boards continue under independent Arrival Truth and feed-health policy. The underlying incident may separately affect a board through those policies, but the commute switch itself never does.

## Triage and containment sequence

| Step | Required action | Evidence |
|---|---|---|
| 1. Detect | Open an incident from an operational cue, sentinel, reviewer demand, or drill | Cue, discovery role, authoritative time, fixed versions, mode |
| 2. Bound | Identify the narrowest supported episode, route/feed-group, delivery-system, accessibility, privacy, or global scope; state unaffected scope | Exact supported affected/unaffected operational scope; no rider identity |
| 3. Command | Commander records Continue, Hold, Suppress, or Correct and commands any hold | Before state, command, reason, scope, time, required approvals |
| 4. Execute | Delivery on-call engages switch and cancels unsent matching queue entries | Executor, switch result, cancellation counts/results, Failed or **Delivery unresolved — acknowledgment Unknown** dispositions, and immutable attempt linkage |
| 5. Verify | Independent verifier checks switch state, final-check behavior, queue isolation, board isolation, and unaffected routes | Before/after capture and prohibited checks |
| 6. Investigate | Domain owners preserve accepted, rejected, quarantined, and unresolved evidence and common-cause census | Append-only incident transitions and fixed package |
| 7. Correct | If a prior delivered claim was materially wrong, apply the correction policy | Materiality, supported remedy, Content approval, preserved original |
| 8. Recover | Satisfy the branch-specific prerequisites and current reevaluation | Corrected version, recovery evidence, reruns, approvals, no replay |
| 9. Release | Commander removes only the approved scope after an independent final check | Release command, remaining holds, current queue empty, unaffected surfaces |

## Incident branch matrix

| Cue | Deterministic classification and containment | Required evidence and recovery | Prohibited action |
|---|---|---|---|
| Real-time snapshot age exactly 90 seconds or less | Arrival Truth **Current**; no health hold from age alone, but all Tasks 2–8 and holds still apply | Authoritative whole-second age and complete coherent snapshot | Treat 90 as Degraded or Continue without other gates |
| Real-time age 91 through exactly 180 seconds | **Degraded**; freeze dependent evidence under Arrival Truth and Hold commute candidates that require current real-time evidence for the matching route/feed-group | Two consecutive fresh coherent accepted snapshots, then current Tasks 2–7 reevaluation | Advance a countdown, widen globally, or release after one snapshot |
| Real-time age 181 seconds or more; invalid/regressive timestamp, invalid decoding, or repeated failures | **Unavailable**; Hold only dependent matching route/feed-group candidates; preserve unrelated service | Cause-specific evidence plus two consecutive fresh coherent snapshots and current reevaluation | Infer cancellation, normal service, all-clear, or a failure count |
| Alert snapshot exactly 600 seconds or less | Alert context **Current**; it may explain or veto but never create movement or a Send | Authoritative alert age, effective period, and exact resolved scope | Treat 600 as stale or let an alert create a train |
| Alert snapshot 601 seconds or more | Alert context stale; it cannot clear an earlier risk; Hold exact dependent scope when impact remains unresolved, otherwise apply the proven current gate result | Newer coherent accepted alert/service evidence and current reevaluation | Infer no change, normal service, or all-clear from stale absence |
| Bulk entity disappearance exactly 40% or greater | Always anomaly; quarantine snapshot and Hold affected route/feed-group | Fixed baseline/denominator, lost count, context, two fresh coherent recovery snapshots | Infer mass cancellation or good service |
| Suspicious 39.x% disappearance | Context may establish anomaly; no safe harbor below 40 | Same fixed denominator plus simultaneous loss, malformed/empty content, chronology, and other coherence context | Automatically accept or automatically classify anomaly from percentage alone |
| Missing or contradictory station, segment, direction, train, path, period, generic **Affected**, or structured/text conflict | Hold the exact episode or route-direction-segment scope; broader only when evidence cannot safely narrow | Newer coherent accepted mapping, exact scope, and complete current reevaluation | Guess scope, choose a side, or convert generic Affected into impact |
| Second equivalent delivery, including cross-source or overlapping-window delivery | Duplicate breach; immediate pilot stop and episode Hold | Preserve both results; common-cause census; corrected fixed version; Task 6 original-boundary, integrated, holdout, and shadow reruns | Delete history, count per source, retry, or widen without evidence |
| Delivery acknowledgment Unknown | Append **Delivery unresolved — acknowledgment Unknown**; write no successful baseline/marker; Hold every same-occurrence/group equivalent or dependent candidate under the exact unresolved-attempt lock | Immutable attempt and frozen impact package; preserved Unknown record; authoritative exact-attempt Success/Failed resolution or occurrence-expiry transition; independent delivery verification before release | Convert to failure/success, retry, replay, recover, correct solely from Unknown, write a successful baseline, or let an equivalent edit evade the lock |
| Wrong segment/direction or stale/resolved delivery | Immediate pilot stop; at least episode Hold; widen only from common-cause evidence; evaluate material correction | Complete authoritative-time decision package, correction review, corrected version, targeted and integrated reruns | Call harmless, average away, or rewrite original |
| Deterministic should-Send miss | Immediate pilot stop and false-negative review; contain at least affected episode or delivery path | Fixed expected/actual package, root cause, correction, current rerun | Call capability block when capability existed or backfill the missed push |
| Widespread false positives | Global Hold and cancellation of every unsent commute notification | Common-cause census, unaffected-surface check, corrected version, global and holdout reruns, broad release approvals | Disable boards, alter saved commutes, or release a subset without evidence |
| Wrong accessible-path impact, missed blocking outage, unsafe alternative, or weakened ARO | Immediate affected Hold, pilot stop, Accessibility escalation | Accessibility Lead plus Data Quality review, complete path/equipment evidence, corrected version, accessibility and unaffected-route reruns | Offer unverified alternative, weaken ARO, or let Product override truth |
| Cross-rider delivery, token misuse, post-delete/reset/revoke delivery, personal leakage, or reconstructable analytics | Immediate affected delivery-system Hold, pilot stop, Privacy escalation | Privacy Lead plus Data Quality review, deletion/containment evidence, non-personal log, corrected version, privacy and holdout reruns | Copy personal data into log, retain a join, or narrow before evidence |

## Recovery prerequisites

| Held cause | Minimum release evidence |
|---|---|
| Route/feed freshness or anomaly | Two consecutive fresh coherent snapshots for that exact group. The first restores nothing. A stale, incomplete, regressed, malformed, contradictory, suspiciously empty, or newly anomalous second snapshot breaks the pair; the next qualifying snapshot restarts at one |
| Mapping or correlation uncertainty | Newer coherent accepted evidence resolves route, direction, segment, constituent/path, period, and consequence at the required precision |
| Duplicate, queue, delivery, or transformation defect | Corrected fixed product/rule version; preserved original; Task 6 original-boundary, integrated, holdout, and shadow reruns; independent delivery verification |
| Unknown delivery acknowledgment | Authoritative resolution linked to the exact immutable attempt, or documented occurrence expiry; append-only ledger transition; no baseline before Success; no retry/replay/correction; covered-scope and unrelated-scope checks; Data Quality plus independent delivery verification |
| Wrong delivered claim | Correction-policy disposition, approved class/channel if rider correction is required, preserved delivery evidence, and all affected reruns |
| Accessibility | Complete current path/equipment/alternative evidence, Accessibility and Data Quality approvals, corrected-version targeted and unaffected-route reruns |
| Privacy | Containment and deletion evidence for every affected product-controlled boundary, Privacy and Data Quality approvals, no remaining personal or reversible join |
| Global/common cause | Every affected domain’s prerequisite, global/holdout/shadow reruns, and Operations, Product, Data Quality, and affected-domain approvals |

After cause-specific recovery, rerun current Tasks 2–7 eligibility, timing, deduplication, capability, privacy, final checks, every active unresolved-attempt lock, and every still-effective hold. Release only current opportunities. Never release an old queue, backfill a missed notification, retry/replay Unknown work, or treat **Release hold** as Task 5 recovery.

## Internal incident updates

Update on every material state change; no numeric communications SLA is invented. Each update contains only:

- incident ID and current state;
- affected and explicitly unaffected operational scope;
- current evidence state and unresolved question;
- effective hold level and remaining nested holds;
- queue/cancellation result and board-isolation result;
- next required release evidence; and
- current owner.

Use the [incident log template](commute-alert-incident-log-template.md). Rider correction or incident language requires Content approval.

## Pilot handoff and release boundary

The [pilot review template](commute-alert-pilot-review-template.md) separates silent from limited pilot, preserves Task 8 gates and strata, and records only permitted pilot dispositions. Task 9 may Continue or Hold a pilot under its operational authority; it cannot authorize public release. Task 10 owns final release.

## Pending gaps

Task 6 quiet-period approval, seen state, provider-specific evidence mappings that can authoritatively resolve Unknown to Success or Failed, severity ordering, correction/retraction class/channel/copy, numeric “promptly,” sample size/duration/floor/retention, active-commuter definition, feedback maturity, opt-out attribution window, remote token lifecycle, lock-screen behavior, roster names/pages/response times, and switch implementation remain Pending. The quiet proposal is not collected, applied, or used as gate input. The conservative Unknown state and lock apply without inventing a provider mapping. No operator may invent a missing decision.

## Draft review checklist

- [ ] Every role has exact command, evidence, containment, and release limits.
- [ ] Roster, backup, page, handoff, access, and separation are tested before pilot.
- [ ] Continue, Hold, Suppress, Correct, and Release hold are applied exactly.
- [ ] Global, route/feed-group, and episode holds use OR precedence, no expiry, no replay, queue cancellation, and a final switch reread.
- [ ] Unknown writes one unresolved-attempt record and no successful baseline; its exact duplicate-prone scope remains held until authoritative resolution or occurrence expiry.
- [ ] Saved state, permission, ledger, ARO, boards, and unaffected routes remain isolated.
- [ ] Every incident branch and recovery prerequisite has fixed drill evidence.
- [ ] Release approval is independent of switch execution.
- [ ] Task 10 remains the sole go/no-go owner.

Every unchecked item blocks approval. This documentation commit is not evidence.
