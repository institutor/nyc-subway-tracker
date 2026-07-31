# Commute notification timing policy

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§25.2–25.7, 28.2, 29.3, 31.6 scenarios 36–39, 31.7–31.8, 33.5, and 34–35; commute alerts and launch quality plan Task 5; accepted Commute Tasks 1–4 artifacts |
| Owner | Commute Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](../test-cases/commute-message-scenarios.md#pending-execution-record) |

## Purpose and authority

This policy owns when a qualifying subway commute disruption may produce an initial or escalated notification. It consumes, without weakening, the [commute-window contract](commute-window-contract.md), [notification-eligibility contract](notification-eligibility-contract.md), [delay-threshold policy](delay-threshold-policy.md), [commute-window state matrix](../ux/commute-window-state-matrix.md), [permission moments](../ux/notification-permission-moments.md), and owner-supplied service-change and accessibility decisions.

This artifact is **Draft**. The authoritative **NO-GO — GATE 0 NOT PASSED** in the [Gate 0 exit record](../quality/gate-0-exit-record.md) remains in force. The timing rules are product policy, not MTA performance guarantees or measured delivery service levels.

## Product Governance reconciliation

The artifact header and Draft product artifact index row now align on the full Task 5 provenance, accepted Tasks 1–4 handoffs, and Product, Accessibility, Data Quality, Content, and Operations review. That metadata alignment is not approval; every timing observation and reviewer decision remains **Pending**.

## Window and opportunity model

For one New York local commute occurrence:

- `S` is the inclusive local start.
- `E` is the exclusive local end.
- `L` is the rider-selected preparation lead; this policy invents no value, menu, maximum, or default.
- `P = S − L` is the inclusive preparation point.
- the eligible watch interval is exactly `[P,E)`.

The specification phrase “before the preparation lead time” is resolved to delivery **at `P`**, not before `P`. An Active commute remains Active outside the interval, but it is not watching. The date and recurrence rules in the [time edge cases](../test-cases/commute-time-edge-cases.md) determine the occurrence before this policy evaluates it.

## Initial notification timing

| Candidate and first accepted opportunity | Required decision | Prohibited decision |
|---|---|---|
| Planned change is accepted before `P` | Hold without delivery; at `P`, run the full final recheck and deliver once only if every gate still passes | Deliver before `P`; treat early visibility as a current-service veto |
| Planned change is first accepted exactly at `P` | Run the final recheck and, if it passes, deliver once | Add another delay or invent a lead |
| Planned change is first accepted in `(P,S)` | Evaluate promptly after the final recheck | Wait until `S` solely because the change is planned |
| Planned change has not delivered before `S` | Re-evaluate at `S`; deliver only if current, relevant, decision-changing, and not previously delivered | Replay a failed, stale, held, or equivalent candidate |
| Planned change is first accepted in `(S,E)` | Deliver only when it still changes a rider decision; record why the opportunity was late and why action remains useful | Send a merely informational late notice |
| Candidate is evaluated at or after `E` | It is outside this occurrence; suppress it | Treat `E` as inclusive or queue a late push |
| Inferred unplanned delay or gap | Evaluate only after Task 3 persistence passes: at least two coherent updates spanning at least 60 seconds | Send from one transient update |
| Confirmed suspension, closure, bypass, short turn, or blocking accessible-path impact | Evaluate after one current, coherent, authoritative confirmation and all other gates pass | Wait for inferred-delay persistence or strengthen an unresolved state |

“Promptly” creates no numeric delivery SLA. Planned messages use future certainty such as **is scheduled to** and never alter current arrival admission before the change becomes effective.

## Delivery capability and replay prevention

Delivery requires all three states at the final decision:

1. lifecycle intent is **Active**;
2. notification permission is **Granted**; and
3. connectivity is connected.

Denied, restricted, revoked, or Offline states produce no delivery and do not change lifecycle. Permission restoration or reconnect initiates a fresh current evaluation only. It never prompts, resumes a Paused commute, replays a missed candidate, or sends from evidence that was held, stale, expired, out of window, or previously suppressed.

## Mandatory final recheck

Immediately before every initial, escalation, reminder, or recovery delivery decision, bind one evidence snapshot and recheck:

1. lifecycle is Active;
2. permission is Granted;
3. connectivity is connected;
4. local occurrence is inside `[P,E)`;
5. all Task 2 eligibility gates Pass;
6. the applicable Task 3 threshold, persistence, or confirmed-impact rule Passes;
7. every owner freshness and source-health decision supports the exact claim;
8. route, direction, segment, station, constituent, entrance, exit, transfer, and accessible-path scope still match;
9. no current negative veto contradicts the rendered claim;
10. each recommended alternative remains independently verified and safe;
11. the material incident state still changes a rider decision; and
12. prior-delivery history permits this message.

The same bound evidence must populate the rider message. A stale, unresolved, contradictory, unsafe, irrelevant, or duplicate result blocks delivery; an unresolved optional alternative is omitted and never recommended. A Hold sends nothing and never becomes a late send without a new current evaluation.

## Escalation policy

Compare against the last **successfully delivered** message for the same Task 6 episode and material commute impact. An attempted or failed delivery is not a baseline. After an escalation is successfully delivered, it becomes the next baseline.

One escalation candidate may be created when at least one independently supported branch passes:

| Material branch | Exact pass boundary |
|---|---|
| Added journey time worsens | `new supported added time − delivered baseline added time ≥ 300 seconds`; 299 fails, 300 and 301 pass |
| Newly affected place | A newly affected exact origin, transfer, destination, or other station on the saved journey appears |
| Newly affected direction | The exact relevant direction is new relative to the delivered baseline |
| Severity increases | An approved owner-supplied ordered severity value strictly increases |
| Active period extends into the occurrence | `min(newEnd,E) − min(oldEnd,E) ≥ 1,800 seconds`; 1,799 fails, 1,800 and 1,801 pass |
| Recommended action changes | The first independently verified recommended action changes, or the delivered action becomes invalid and the current result is no verified alternative |

Missing, free-text, renamed, or unordered severity cannot pass the severity branch. An extension wholly beyond `E` adds zero time inside the occurrence. Several simultaneous material changes create one escalation, not one per branch. A later escalation is possible only from a new comparison against the successfully delivered escalation baseline.

Copy edits, renewed timestamps, equivalent alert records, changes under 300 seconds, extensions under 1,800 seconds, a baseline switch, an unsafe or unresolved alternative, and correction wording alone never create an escalation. A correction can accompany a push only when an independent material branch passes.

## Repeated planned work

- Materially equivalent repeated work produces one useful summary across the covered future occurrences.
- A reminder requires owner-supplied **Not seen** or a material plan change.
- **Seen** suppresses an equivalent reminder. **Unknown** also suppresses it.
- An OS delivery result is not evidence that the rider saw the message.
- Copy or timestamp renewal is not a plan change.
- Overnight rendering names both calendar dates; no service-day term is exposed.
- A fall-back repeated clock hour creates no duplicate occurrence or push.
- A spring-forward missing local time creates no phantom occurrence or push.

## Required decision record

Every delivery decision records the fixed policy and product versions, commute/window/occurrence IDs, Task 6 episode and material-impact handoff when available, `L/P/S/E`, local dates, lifecycle, permission, connectivity, source and effective intervals, Task 2 and Task 3 results, accessibility decision and freshness when applicable, evaluation opportunity, complete final-recheck results, prior successful delivery baseline, every material delta, seen state, selected rendered template and fields, expected and prohibited results, actual result, reviewer decisions and dates, evidence, correction, preserved original, and rerun.

No record contains a guessed home/work label, passive location history, movement history, or unrelated journey history.

## Explicit gaps

- Task 6 episode identity and deduplication integration is **Pending**.
- No approved ordered severity scale exists; the severity escalation branch cannot pass until one is supplied.
- No owner definition for **Seen** exists; only an explicit owner result may be consumed.
- No recovery rule for inferred delay has been approved beyond the exact Task 5 recovery gates.
- Lock-screen privacy and opt-in behavior during an already active episode are unspecified; settings are prospective and no Home/Work inference is permitted.
- The notification target in §29.3 is unmeasured. There is no real delivery, timing, reviewer, pilot, launch, or MTA performance evidence.

## Draft review checklist

- [ ] `[P,E)` and every planned opportunity boundary are implemented without an invented lead.
- [ ] Inferred and confirmed disruptions use their distinct evidence thresholds.
- [ ] Every message passes the immediate final recheck using the same rendering evidence.
- [ ] Permission restoration and reconnect never replay missed work.
- [ ] Every escalation compares with the last successful same-impact delivery and applies exact inclusive thresholds.
- [ ] Repeated work, Seen state, overnight dates, and DST behavior follow the governed rules.
- [ ] All `CMS-T01`–`CMS-T10`, `S36`–`S39`, `E01`–`E14`, `R01`–`R13`, and `M01`–`M09` actuals remain **Not run — Pending** until fixed evidence exists.

Every unchecked item blocks approval. Definitions are not evidence.
