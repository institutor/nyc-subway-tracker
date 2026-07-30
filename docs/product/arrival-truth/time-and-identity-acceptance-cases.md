# Time and identity acceptance cases

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§5, 9–10, 31.1 scenarios 4–5, 31.7 scenarios 40–42, and 34; arrival-truth and service-changes plan Task 3 `Artifacts` and `Ordered steps` |
| Owner | Release Quality Lead |
| Required reviewers | Product, Data Quality, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | Pending — Truth Gate |

## Purpose and authority

These cases define the acceptance evidence for the [time and train continuity policy](time-and-train-continuity-policy.md). They prove the approved time and identity boundaries; they do not create new thresholds or rider language. The [core arrival contract](core-arrival-contract.md) still controls live-arrival eligibility, and the [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

Every case is **Pending** until its setup is exercised against a fixed reviewed product version, the actual result is recorded, and the Truth Gate accepts the evidence. An expected result written here is not a passing result.

## Acceptance cases

### Scenario 4 — Coherent identifier change

**Setup**

An earlier candidate disappears and a replacement with a different published trip identifier appears immediately. The pair has the same internal train marker when available, route, normalized direction, service date, ordered next-stop sequence, compatible track and destination, and similar predicted time. No other earlier or replacement candidate is a plausible match, and the resulting train independently passes the core arrival-admission checklist.

**Expected state**

Treat the records as one continuous train instance. Show at most one arrival row, preserve chronological progress and the original service date, and evaluate its current evidence state normally. The identifier change itself is not rider-facing.

**Prohibited outcome**

Do not create a duplicate row because the identifier changed. Do not join the records if any required continuity condition fails or if the relationship is not one-to-one. A changed identifier alone proves neither duplication nor continuity.

### Scenario 5 — Ambiguous identity pair

**Setup**

An earlier candidate disappears and two replacements appear within the immediate replacement period. Both have similar predicted times and partially compatible identity evidence, but the evidence cannot establish an exclusive one-to-one match; alternatively, one replacement conflicts on service date, ordered next-stop sequence, track, or destination.

**Expected state**

Do not merge the ambiguous identities. Quarantine the weaker candidate from the primary board and next-three count. Retain a stronger candidate only if it independently passes every arrival-admission condition; if neither is stronger and coherent, quarantine both until continuity or separation becomes clear.

**Prohibited outcome**

Do not select a match merely because an identifier changed or an ETA is close. Do not show both candidates as proven separate trains, let a quarantined candidate fill the board, or expose internal identifiers or the quarantine label to riders.

### Scenario 40 — After-midnight service remains on its operating service date

**Setup**

A trip assigned to one operating service date has a stop time beyond `24:00`, crosses New York midnight, and continues into the next calendar date. Include evidence represented as `25:10`, whose rider-facing clock label is `1:10 AM` on the following calendar date. Also verify a source-supported trip whose first event occurs before the nominal service date.

**Expected state**

The trip remains attached to its source-supported operating service date across midnight. `25:10` orders after the earlier events on that service day while displaying as `1:10 AM` New York local time. A trip beginning before the nominal service date likewise retains its supported service date. Each coherent train appears once and its waits remain non-negative.

**Prohibited outcome**

Do not reassign the train from its calendar date alone, split it at midnight, create a duplicate instance, reverse stop order, restore a past stop call, or calculate a negative wait.

### Scenario 41A — Fall-back repeated local time

**Setup**

Two authoritative chronological events occur on opposite sides of the New York daylight-saving fall-back transition and display the same local clock label. Include one coherent train spanning the transition and, separately, two distinct trains whose displayed local times match.

**Expected state**

Order events and calculate waits from authoritative chronology. The spanning train remains one train. The two distinct trains remain separate when their one-to-one identity evidence establishes separate instances, even though their displayed clock labels match. No wait is negative.

**Prohibited outcome**

Do not merge distinct trains because their local labels match, duplicate the spanning train, reverse chronology, or guess which repeated interval applies when the evidence is ambiguous. Ambiguous identity or chronology is quarantined from the primary board.

### Scenario 41B — Spring-forward missing local time

**Setup**

A coherent train has authoritative events immediately before and after the New York daylight-saving spring-forward gap. No authoritative event exists within the missing local-clock interval.

**Expected state**

Preserve authoritative event order and actual elapsed time across the missing local interval. The train remains one instance, with rider-facing New York local labels on the valid sides of the gap. No train or stop call is synthesized within the missing interval, and no wait is negative.

**Prohibited outcome**

Do not invent an event, insert an extra hour of waiting, duplicate or reorder the train, derive chronology from local clock labels alone, or show an exact countdown when the authoritative chronology is contradictory or unresolved.

### Scenario 42 — Phone clock disagrees with authoritative freshness time

**Setup**

Evaluate both disagreement directions. First, the authoritative source timestamps place a snapshot outside its approved current state after only the small skew allowance, while the phone clock would make it appear current. Second, the authoritative timestamps support the approved current state, while the phone clock would make it appear stale. The source timestamp itself is present and non-regressed.

**Expected state**

Use authoritative source timestamps for freshness and chronology. In the first direction, the phone cannot make the stale snapshot current or authorize an exact countdown. In the second, the phone alone cannot make current evidence stale. Rider-facing time remains New York local time. Record the small skew allowance as a policy value requiring observed evidence and Product and Data Quality approval before calibration; no numeric tolerance is assumed by this case.

**Prohibited outcome**

Do not use the phone clock, phone date, manual time setting, or device time zone as freshness authority. Do not invent a numeric skew tolerance, let stale evidence appear current, reverse chronology, change the service date, or authorize a stronger arrival claim than the authoritative evidence supports.

## Truth Gate result record

| Case | Required actual-result evidence | Status |
|---|---|---|
| Scenario 4 | One continuous row; every continuity condition evidenced; exclusive one-to-one join recorded | Pending |
| Scenario 5 | Ambiguity preserved; weaker candidate excluded from the primary board; no unsupported merge | Pending |
| Scenario 40 | Service date retained across midnight and for the pre-nominal-date start; `>24:00` order and local display verified | Pending |
| Scenario 41A | Repeated local labels preserve authoritative order and correct train cardinality | Pending |
| Scenario 41B | Missing local interval creates no synthetic event, reordering, duplication, or negative wait | Pending |
| Scenario 42 | Both phone-clock disagreement directions follow authoritative freshness; no numeric skew invented | Pending |

The result record remains Pending until it links durable evidence for a fixed reviewed version. Any failure remains in the record and must link its correction and rerun.
