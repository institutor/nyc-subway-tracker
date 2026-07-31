# Commute delay threshold policy

| Governance field | Value |
|---|---|
| Source sections | Product artifact index row citing approved specification §25.4; additional applying approved specification §§5.1–5.2, 8, 22–23.6, 25.3–25.4, 27, 29.3, 30.2–30.3, 31.6–31.8 scenarios 36–39, 42, and 48, 33.1, 33.3, 33.5, and 34–35; commute alerts and launch quality plan Task 3 |
| Owner | Commute Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](../test-cases/commute-threshold-boundaries.md#pending-execution-record-for-every-threshold-fixture) |

## Purpose and authority

This policy owns the exact unrounded delay-signal formulas, comparator boundaries, baseline identity, persistence and reset behavior, immediate confirmed-incident exceptions, signal precedence, and final freshness recheck for subway commute notifications. It does not decide journey relevance, arrival admission, window validity, permission, delivery timing or copy, episode deduplication, retention, operations, or launch.

The [notification eligibility contract](notification-eligibility-contract.md) owns the twelve-gate intersection. Task 1’s [commute window contract](commute-window-contract.md) owns the New York half-open watch interval. The [threshold fixtures](../test-cases/commute-threshold-boundaries.md) and [time fixtures](../test-cases/commute-time-edge-cases.md) define later execution evidence. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

This artifact is **Draft**. The authoritative posture remains **NO-GO — GATE 0 NOT PASSED** under the [Gate 0 exit record](../quality/gate-0-exit-record.md). Public arrival boards and commute-alert release remain blocked. No real baseline, current source, product result, reviewer decision, approval, or release evidence exists.

## Product Governance reconciliation

The [product artifact index](../artifact-index.md) cites only §25.4 and lists Product, Data Quality, Content, and Operations. This policy additionally applies §§5.1–5.2, 8, 22–23.6, 25.3, 27, 29.3, 30.2–30.3, 31.6–31.8 scenarios 36–39, 42, and 48, 33.1, 33.3, 33.5, 34–35, full Task 3 provenance, and mandatory Accessibility review because the immediate blocking accessible-path branch is safety-critical. Product Governance reconciliation remains **Pending**. This task does not edit the index.

## Exact unrounded model

All decisions use authoritative seconds at full available precision. Display rounding never changes a comparator. Synthetic boundary fixtures use precision `p = 1 second`.

| Symbol | Exact meaning |
|---|---|
| `T` | Rider’s stored added-journey tolerance in `{300, 600, 900}` seconds. The default stored value is `300`. |
| `H` | Current validated planned headway in seconds, with `H > 0`, for one exact segment, direction, period, operating service date, and baseline version. |
| `W` | Wait in seconds to the nearest admitted current verified arrival for the exact directional stop. |
| `G` | Spacing in seconds between comparable admitted current verified arrivals for the exact baseline scope. |
| `J0` | Baseline expected end-to-end journey duration in authoritative seconds. |
| `J1` | Current expected end-to-end journey duration in authoritative seconds. |
| `ΔJ` | `J1 − J0`, computed without rounding. |

No absent, zero, negative, stale, mixed-scope, or unvalidated `H`, `W`, `G`, `J0`, or `J1` is substituted with a convenient value.

## Qualifying signal families

| Family | Exact qualification rule | Equality and failure boundary |
|---|---|---|
| Current official active delay | A current resolved official active delay affects the exact saved segment and passes every Task 2 gate | Qualifies as a signal without invented minutes or inferred persistence; generic or non-decision-changing alert still fails Task 2 |
| No verified arrival | `W > max(720, 2H)` | Equality does not qualify. Incomplete exact-stop coverage is Unresolved; a feed outage is not delay evidence. |
| Observed gap | `G >= 2H AND G − H >= 360`, equivalently `G >= max(2H, H + 360)` | Equality at either active bound qualifies. |
| Expected journey increase | `ΔJ > T` | Equality does not qualify. `T` is the stored 300-, 600-, or 900-second value. |
| Transfer decision change | A versioned Task 9 handoff shows a normally viable transfer became **Tight** or **Uncertain** | Do not recalculate transfer buffers. Missing or stale handoff is Unresolved. **Unlikely** is not added as a §25.4 trigger. |

Signal families are OR conditions. Never sum several subthreshold signals, severity labels, schedule deviations, wait gaps, journey estimates, or transfer changes to manufacture a pass. One provenance-complete end-to-end `ΔJ` may incorporate several real conditions because it is one independently defined journey metric; do not double-count its components.

Several passing families for one materially equivalent impact create one notification candidate. Task 6 later owns episode identity and deduplication.

Delay never suppresses a train. A resolved stop, route, direction, track, or accessible-path veto is applied first under its owner.

## Baseline identity and immutability

Every inferred comparison stores:

- signal family and metric;
- exact values and authoritative precision;
- source identity and version;
- exact route, stop, segment, direction, destination, transfer, or path scope;
- period and New York occurrence;
- operating service date;
- planned service or pattern edition;
- tolerance value when applicable;
- transfer handoff version when applicable; and
- baseline version and accepted timestamp.

Never switch from headway, schedule deviation, journey duration, transfer state, or published severity to another family across the two persistence updates. Never change segment, direction, period, service date, pattern, path, or tolerance while retaining persistence.

A new source edition, pattern, service date, path version, transfer baseline, scope, metric family, or rider tolerance starts a new baseline and resets persistence. A tolerance change is prospective only; it never reclassifies a prior observation retroactively.

## Persistence and reset

Inferred no-arrival, gap, journey-increase, and calculated transfer-range evidence requires:

1. two distinct accepted coherent qualifying updates;
2. the same episode, family, baseline, value semantics, and exact scope; and
3. at least 60 authoritative seconds from the first qualifying update to the second.

| Observation | Result |
|---|---|
| One qualifying update | **Hold for stronger evidence** |
| Second distinct update at 59 seconds | **Hold for stronger evidence** |
| Second distinct update at exactly 60 seconds | Persistence Pass |
| Second distinct update after 60 seconds while still current and coherent | Persistence Pass |
| Replay, timestamp-only copy, nonqualifying update, contradiction, stale or quarantined evidence, or baseline change | Reset; no persistence credit |

The qualifying condition must still hold at the second update and at the final pre-delivery recheck. A replayed record or renewed timestamp is not a distinct coherent update.

## Immediate confirmed-incident branches

A current confirmed suspension, closure, bypass, short turn, or blocking accessible-path outage may satisfy the threshold/persistence gate after one coherent accepted snapshot when its exact consequence is resolved.

Immediate qualification never waives:

- Active confirmed window and authoritative time;
- currentness, chronology, quarantine, source-health, and entity mapping;
- exact route, direction, segment, constituent, entrance, exit, transfer, or path relevance;
- decision-changing consequence;
- notification permission;
- episode and duplicate controls; or
- the final currentness, scope, veto, and window recheck.

An official active delay alert is a signal, but it does not invent minutes, a bypass, a stop veto, or an alternative.

## Precedence and final recheck

Apply in this order:

1. currentness, authoritative chronology, quarantine, source health, and exact scope;
2. resolved stop, service-pattern, direction, track, closure, and accessible-path vetoes;
3. every Task 2 eligibility gate;
4. this fixed threshold and persistence policy; then
5. immediately before delivery, recheck currentness, half-open window, scope, vetoes, and episode/duplicate state.

Any final Fail yields Suppress. Any material Unresolved result with no Fail yields Hold for stronger evidence. Stale evidence yields Suppress; a later fresh source creates a new evaluation, not a late send of the old result.

When a delayed train’s saved origin is subsequently removed from the accepted service pattern, discard the delay classification for that candidate. The separate arrival owner retains the stop veto, and the notification candidate is reclassified once as an origin bypass only if every Task 2 gate passes.

## Exact freshness controls consumed

These are owner inputs, not new freshness policy:

| Evidence | Exact boundary fixture |
|---|---|
| Accepted alert | Age exactly 600 seconds is Current; 601 seconds is stale |
| Real-time feed evidence | Age exactly 90 seconds is Current; 91 seconds is Degraded and cannot support a fresh definitive signal |

The phone clock never controls age or chronology. No approved numeric device/feed skew tolerance exists, so Task 3 invents none.

## Required evidence record

Every fixture execution records:

- fixed product/build and exact versions of this policy, Tasks 1–2, owner artifacts, and the applicable fixture;
- complete synthetic window, New York occurrence, operating service date, and authoritative timestamps;
- source/effective times, original text, structured scope, feed or alert state, anomaly and freshness decision;
- baseline family, metric, value, source, version, scope, period, service date, pattern, path, transfer baseline, and tolerance;
- unrounded `T`, `H`, `W`, `G`, `J0`, `J1`, and `ΔJ`, with Not applicable recorded only when reviewed;
- Task 9 transfer handoff where applicable;
- update identity, coherence, qualifying state, authoritative span, reset cause, and persistence result;
- all Task 2 gates, every upstream veto, threshold result, final recheck, exact notification outcome, and unaffected service;
- expected and prohibited visible and assistive result, actual observation, reviewer decisions and dates, durable evidence, failure, correction, preserved original result, rerun, and status; and
- no personal identity, passive location, movement history, account attribute, home/work inference, or unrelated travel history.

Task 7 later owns retention and deletion assurance.

## Explicit mismatches and gaps

- “More than five minutes” means stored `T = 300` with strict `ΔJ > T`; it does not mean `>= 300`.
- The Task 1 dictionary and future Task 4 setup flow do not yet own tolerance selection UI. Task 3 owns only the three semantic values and later handoff.
- Task 9 transfer artifacts do not yet exist. Only a future fixed versioned handoff may be consumed; Task 3 does not duplicate scenario 47 or buffer arithmetic.
- Specification §25.4 names **Tight** and **Uncertain**, not **Unlikely**, as transfer triggers.
- No moderate-impact aggregation rule is authorized; subthreshold families are never summed.
- No real source, baseline, fixed product/build, run, reviewer decision, approval, correction, rerun, or launch evidence exists.

These thresholds are Draft product policy, not MTA guarantees. They cannot be tuned silently.

Task 5 later owns content and delivery. Task 6 later owns episode identity and deduplication. All current scenario results remain **Not run — Pending**.

## Draft review checklist

- [ ] Every comparator uses authoritative unrounded seconds.
- [ ] `ΔJ > T` and `W > max(720, 2H)` are strict; gap equalities qualify.
- [ ] Signal families are OR and subthreshold values never aggregate.
- [ ] Baseline family, scope, service date, period, source, and tolerance remain fixed across persistence.
- [ ] Two distinct coherent updates span at least 60 authoritative seconds.
- [ ] Immediate branches never waive Task 2 or final recheck gates.
- [ ] Vetoes precede delay classification and delay never suppresses a train.
- [ ] Exact 600/601 alert and 90/91 real-time boundaries are preserved.
- [ ] Phone time never controls freshness and no skew tolerance is invented.
- [ ] All evidence, reviewers, corrections, reruns, and scenarios remain Pending.

Every unchecked item blocks approval. This documentation commit is not working-product evidence or release authorization.
