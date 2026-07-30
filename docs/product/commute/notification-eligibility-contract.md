# Commute notification eligibility contract

| Governance field | Value |
|---|---|
| Source sections | Product artifact index row citing approved specification §25.3; applying approved specification §§8, 20, 22, 25.2–25.3, 27, 31.2, 31.5–31.6, 33.1, 33.3, and 33.5; commute alerts and launch quality plan Task 2 |
| Owner | Commute Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](disruption-relevance-examples.md#pending-execution-record-for-every-example) |

## Purpose and authority

This contract owns the complete notification-eligibility intersection and its deterministic **Send**, **Suppress**, or **Hold for stronger evidence** result. It determines whether one current disruption consequence may become a notification candidate for one exact confirmed commute window at one authoritative evaluation instant. It does not admit an arrival, define a delay threshold, choose delivery timing or copy, request permission, identify a disruption episode, retain personal data, measure quality, operate alerts, or authorize launch.

The [commute window product contract](commute-window-contract.md) and [field dictionary](commute-window-field-dictionary.md) own the saved window and lifecycle. The [notification suppression matrix](notification-suppression-matrix.md) applies this contract to deterministic branches. The [fixed relevance examples](disruption-relevance-examples.md) define later acceptance inputs. Arrival truth, alert impact, equipment status, complete accessible paths, and their freshness remain owned by their upstream artifacts. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

This artifact is **Draft**. It demonstrates no real source, current disruption, product decision, notification candidate, delivery, reviewer decision, approval, or release evidence.

The authoritative posture remains **NO-GO — GATE 0 NOT PASSED** under the [Gate 0 exit record](../quality/gate-0-exit-record.md). The separate accessibility posture remains **NO-GO — REQUIRED ACCESSIBILITY EVIDENCE AND COVERAGE ARE NOT DEMONSTRATED** under the [accessibility and guidance release-gate record](../quality/accessibility-and-guidance-release-gates.md). Public arrival boards and commute-alert release remain blocked. Task 2 neither changes nor waives either decision.

## Product Governance reconciliation

The [product artifact index](../artifact-index.md) cites the narrower §25.3 boundary. This contract also applies §§8, 20, 22, 25.2, 27, 31.2, 31.5–31.6, 33.1, 33.3, 33.5, and the full Task 2 plan provenance. Product Governance Lead reconciliation remains **Pending**. This task does not edit the index or treat the mismatch as approved.

## Deterministic gate result

Every required gate records exactly one state:

- **Pass** — current accepted evidence proves the gate for the exact evaluation scope.
- **Fail** — accepted evidence disproves the gate or proves an exclusion.
- **Unresolved** — evidence needed to decide the exact scope is missing, ambiguous, internally conflicting, or not yet mature under its owner.

Apply this precedence without weighting or majority vote:

1. Any **Fail** → **Suppress**.
2. No Fail and one or more **Unresolved** → **Hold for stronger evidence**.
3. All twelve gates **Pass** → **Send**.

**Hold for stronger evidence** sends nothing. It may become Send only after newer accepted evidence independently makes every gate Pass while the opportunity remains current. If the opportunity ends, evidence becomes stale, or a definite Fail appears, the result becomes Suppress. Never late-send the held evidence.

The result is a notification decision only. A proven bypass can veto a train at a stop while making a disruption notification relevant. Notification Suppress never proves normal service, clears an arrival veto, or authorizes **Good service**.

## Complete twelve-gate intersection

All scopes must resolve jointly. A route or complex name alone is insufficient.

| Gate | Pass | Fail | Unresolved |
|---|---|---|---|
| 1. Confirmed window | Exact Task 1 window is **Active**, complete, valid, and explicitly confirmed | Paused, Expired, Deleted, invalid, unconfirmed, or merely proposed | Lifecycle or confirmation cannot be established |
| 2. Evaluation time | Authoritative evaluation instant falls in `[local start − confirmed lead, local end)` for the exact New York occurrence | Before opening, at or after the exclusive end, or no occurrence exists | Authoritative instant or occurrence mapping is unresolved |
| 3. Launch domain | Exact subway service consequence or exact accessibility-path consequence; not an alarm, all-clear, crowding, proxy, or rail claim | Routine alarm, all-clear, crowding, proxy crowding, LIRR, Metro-North, or another excluded mode | Domain or consequence type cannot be resolved |
| 4. Currentness | Claim passes its evidence owner's freshness, authoritative-time, anomaly, and source-health rules | Stale, expired, failed, superseded, or owner-rejected evidence | Owner has not yet resolved currentness, health, or authoritative time |
| 5. Impact resolution | Time, route, station or constituent, segment, direction, train or service pattern when applicable, path, and consequence are resolved at required precision | Resolved impact is outside or contradicts the saved journey | Required scope or entity mapping remains missing, ambiguous, generic, or conflicting |
| 6. Route relevance | Impact affects the primary route or a currently needed usable alternate | Only an unused listed alternate or unrelated route is affected | Whether the alternate is needed or usable cannot be resolved |
| 7. Direction relevance | Impact matches normalized saved direction and actual destination; explicit supported both-directions scope may pass | Opposite or otherwise unrelated direction | Direction is omitted, ambiguous, or conflicts with destination |
| 8. Journey intersection | Exact origin-to-destination journey intersects the constituent, entrance, exit, transfer, stop segment, or accessible path consequence | Impact is before origin or after destination and does not break a required transfer or alternative | Journey intersection cannot be resolved at exact scope |
| 9. Decision change | Rider may need to leave earlier, change entrance, route, line, station, transfer, or accessible path, or avoid the trip | No useful action changes for the saved journey | Decision consequence cannot yet be established |
| 10. Threshold and persistence | Task 3 threshold and persistence pass, or the impact type is later accepted as not requiring them | Below threshold, minor routine variance, or persistence definitely fails | Task 3 decision is required but absent, or an inferred impact awaits required persistence |
| 11. Alternative integrity | Every proposed alternative independently passes service truth, stops, direction, transfer, and accessibility requirements; or no alternative is proposed | Proposed alternative is disproved or would mislead and cannot be omitted without changing the candidate claim | Proposed alternative remains unresolved and is material to the notification decision |
| 12. Episode and duplicate | No equivalent prior message exists for the same episode and materially equivalent commute impact | Equivalent prior message, copy edit, renewed timestamp, or equivalent record already accounts for it | Task 6 cannot yet resolve episode or materially equivalent impact identity |

Positive prediction never clears a current negative veto. Missing direction, station, constituent, or path precision is Unresolved rather than permission for a broad push. An explicitly scoped both-directions impact may Pass direction only when that scope is itself current and accepted.

An impact before the origin or after the destination is irrelevant unless it breaks a required transfer, currently needed alternative, or another exact journey dependency. The same input must not be widened from one constituent, entrance, exit, direction, or path to the whole complex.

## Separately classified consequences

| Impact type | Required exact relevance decision | Prohibited widening |
|---|---|---|
| Origin bypass | Saved origin directional stop is omitted from the accepted effective pattern during the watch | Describing the stop as served or widening to every direction |
| Destination bypass | Saved destination directional stop is omitted and the journey cannot complete as saved | Treating a beyond-destination change as relevant |
| Transfer bypass | Exact required transfer stop or connection is omitted | Inferring that every transfer at the complex fails |
| Reroute | Accepted effective pattern changes a saved stop, direction, transfer, or necessary line choice | Route-name-only or line-color-only relevance |
| Short turn | Accepted terminal or stopping pattern ends before the saved destination or required transfer | Treating every short turn as affecting every rider |
| Suspension | Exact route, segment, direction, and active time overlap the saved journey | Line-wide push when only the opposite direction or distant segment is suspended |
| Constituent closure | The exact constituent required by origin, destination, transfer, entrance, or exit is closed | Whole-complex closure without evidence |
| Entrance or exit closure | Exact selected access point or required path connection is unavailable | Whole-station inaccessibility or route suspension |
| Delay or gap | Task 3 later proves threshold, persistence, and exact saved-segment consequence | Stop veto, bypass, or closure inferred from delay |
| Accessibility-path loss | Exact complete path/version and required equipment or connection produce an accepted impact class | Whole-station inaccessibility, train suppression, or elevator substitution inferred from one machine |

Equipment evidence alone never suppresses a train arrival. A delay never becomes a stop-service veto. These consequences remain separate even when one notification summarizes more than one independently proven impact.

## Planned-work evidence

Planned work may qualify before live train evidence exists only when:

1. an accepted planned source is current for a future-effective claim;
2. its effective interval overlaps the preparation or commute window;
3. exact route, stop or constituent, direction, journey scope, and rider consequence are resolved;
4. the supplemented schedule, service change, or other accepted planned evidence is coherent; and
5. wording remains future-effective and does not claim that the change is already operating.

Planned evidence does not alter current arrival admission before its effective time. Non-overlap is Fail and Suppress. Conflicting planned sources, unresolved scope, or unresolved effective time are Unresolved and Hold. A newer accepted cancellation or superseding plan is evaluated independently and may produce Fail.

## Unplanned evidence

An unplanned impact requires the applicable accepted owner evidence:

- a current resolved service alert;
- a coherent current real-time entity and stop sequence when train-specific;
- an accepted exact station, constituent, entrance, exit, or passage impact; or
- the exact accessibility handoff below.

Structured fields and rider text must agree. Train-specific mapping must be coherent and one-to-one. Generic **Affected** is insufficient for a definitive bypass, closure, or direction claim. A current unresolved high-impact alert remains Hold; severity never substitutes for scope.

A resolved current veto outranks a positive prediction. A delay or gap may qualify only through Task 3 and never independently proves a skipped stop.

This contract consumes rather than redefines the Draft owner policies: real-time evidence Current through 90 seconds, alerts through 10 minutes, and equipment evidence through 5 minutes. These are product-policy inputs, not MTA guarantees. Owner anomaly, authoritative-time, source-health, and stricter claim rules still apply.

## Accessibility scenario 39 handoff

An accessibility candidate must carry all of:

- exact accessible path identifier and version;
- exact required equipment or connection;
- owner state and freshness decision;
- exact impact class: **Unrelated**, **Reroutable within station**, or **Blocking**;
- full saved journey scope and applicable time;
- verified alternative with its independent evidence, or an explicit no-verified-alternative result; and
- Accessible Route Only and Avoid Stairs states without conflating them.

Apply:

| Handoff result | Eligibility treatment |
|---|---|
| **Unrelated** | Gate 8 or 9 Fail → Suppress |
| **Reroutable within station** with a current exact consequence and an independently verified path choice the rider must make | May Pass impact and decision gates; Send only when every other gate passes |
| **Blocking** with a current exact saved-path consequence | May Pass impact and decision gates; Send only when every other gate passes |
| Exact current consequence is Unknown | Use only owner-approved cannot-verify treatment; make no outage claim; unresolved material decision remains Hold |
| Stale or unavailable evidence alone | Suppress when currentness definitely fails; otherwise Hold only for a newer owner decision, never from stale evidence itself |
| Known adverse state being rechecked | Preserve only the exact owner-approved adverse consequence; do not claim restoration or widen scope |

Scenario 39 handoff completeness is not notification execution evidence. Avoid Stairs remains separate from Accessible Route Only, and an escalator never substitutes for an elevator in a wheelchair-accessible path.

## Alternatives

An alternative never erases a disruption when it changes what the rider should do. It never automatically activates, rewrites the primary route, or becomes a saved preference.

Every proposed alternative independently validates current stops, direction, transfer, complete accessible path when claimed, and exact journey usefulness. Use this accessibility ordering only after independent verification:

1. same-complex accessible path;
2. nearby accessible subway station;
3. verified subway detour; then
4. bus only as a separate explicit rider choice.

An official but unverified alternative is not called accessible. Omit an unverified alternative while retaining an independently eligible underlying disruption. No verified alternative can still support Send when the useful action is to avoid or delay the trip.

If an accepted alternate makes the disruption materially equivalent with no changed rider action, the decision-change gate Fails and the candidate is Suppress. A disruption on an unused alternate is Suppress unless that route is currently needed as a contingency and its loss materially changes the journey.

## Required evaluation record

Every later evaluated record must bind:

1. fixed product/build and exact versions of this contract, matrix, example, Task 1 window artifacts, and every upstream owner artifact;
2. exact window fields, lifecycle, confirmation provenance, New York occurrence, preparation period, and authoritative evaluation instant;
3. source identity and version, accepted timestamp, freshness result, original text, structured fields, and planned or unplanned classification;
4. effective service pattern and exact time, route, station, constituent, segment, direction, destination, train/entity, entrance, exit, transfer, and path scopes;
5. entity-match, conflict, negative-veto, anomaly, and source-health decisions;
6. accessibility path/version, equipment or connection, state, freshness, impact class, full journey consequence, and alternative decision when applicable;
7. every alternative and its independent truth, direction, transfer, and accessibility result;
8. all twelve gate states with evidence references and exactly one notification outcome;
9. episode/dedup handoff and unaffected routes, directions, stations, constituents, paths, and windows;
10. expected and prohibited visible and assistive results, actual observations, all five same-version reviewer decisions and dates, durable evidence, correction, preserved original result, and rerun; and
11. no personal identity, passive location, movement history, guessed home/work, or unrelated journey history.

## Explicit gaps and later-task boundary

Task 3 has not supplied threshold or persistence evidence. Task 4 has not supplied setup or permission behavior. Task 5 has not supplied delivery, message, or recovery evidence. Task 6 has not supplied episode identity or deduplication behavior. No data-health opt-in contract exists.

There is no real source capture, fixed product/build, run, message, delivery, reviewer decision, approval, silent evaluation, pilot, or launch authorization. Scenario 39 impact classification alone is not push evidence.

All current definitions and example actuals remain **Pending** or **Not run — Pending**. These gaps yield Suppress or Hold under the exact gate involved; they never authorize a broad or late push.

## Draft review checklist

- [ ] Every candidate records all twelve gates as Pass, Fail, or Unresolved.
- [ ] Any Fail suppresses; Unresolved without Fail holds; only all Pass sends.
- [ ] Hold sends nothing and never late-sends expired evidence.
- [ ] Route, direction, segment, constituent, entrance, exit, transfer, and path scopes resolve jointly.
- [ ] Planned work uses future-effective wording and never changes current arrival admission early.
- [ ] Unplanned high-impact ambiguity never becomes a definitive bypass or closure push.
- [ ] Arrival truth and notification relevance remain independent.
- [ ] Accessibility handoff is complete and no alternative is called accessible without independent proof.
- [ ] Equivalent prior impact, unused alternates, crowding, rail, alarms, and all-clear messages remain suppressed.
- [ ] Gate 0 and accessibility no-go decisions remain explicit.
- [ ] Every actual observation, reviewer decision, evidence item, correction, and rerun remains Pending.

Every unchecked item blocks approval. This documentation commit is not working-product evidence or release authorization.
