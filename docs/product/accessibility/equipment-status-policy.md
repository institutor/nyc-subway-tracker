# Equipment status policy

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§20, 21.9, 29.1, 31.5, and 31.8; accessibility and platform-guidance plan `Product artifact map` and Task 4 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks` |
| Owner | Accessibility Product Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Not run — Pending |

## Purpose and authority

This policy owns the conservative interpretation of official equipment-status evidence: authoritative age, snapshot health, anomaly handling, official-identifier matching, inventory currency, outage and planned-outage states, provisional and confirmed empty responses, and restoration. It supplies machine-level decisions to the [complete accessible-path contract](complete-path-contract.md) and [Accessible Route Only state matrix](accessible-route-only-state-matrix.md); it does not redefine either artifact's structural path requirements or route-level consequence.

The companion [equipment-status acceptance table](equipment-status-acceptance-table.md) defines the fixed boundary and recovery fixtures. The [accessibility copy catalog](accessibility-copy-catalog.md) owns the exact visible and assistive wording. The [path-edge review checklist](path-edge-review-checklist.md) continues to own structural edge evidence. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. Shared terms retain the meanings in the [approved transit product glossary](../contracts/transit-product-glossary.md), rider certainty follows the [approved rider language rules](../contracts/rider-language-rules.md), and review follows the [product artifact review and approval policy](../review-and-approval-policy.md).

This artifact is **Draft**. It contains no current MTA retrieval, real station or equipment record, real snapshot, measured production cadence, observed product output, reviewer decision, threshold calibration, approval, or release evidence. All 13 acceptance fixtures are **Not run — Pending**.

The authoritative release decision remains:

**NO-GO — GATE 0 NOT PASSED**

Public arrival boards remain blocked.

Task 4 does not pass Gate 0, approve public equipment-status copy, or make the Release 1 accessibility decision.

## Governance provenance reconciliation

The artifact header and Draft [artifact index](../artifact-index.md) row now align on approved specification §§20, 21.9, 29.1, 31.5, and 31.8, full Task 4 provenance, and Product, Accessibility, Data Quality, Content, and Operations review. That metadata alignment is not approval; every equipment-state observation, reviewer decision, and lifecycle advancement remains **Pending**.

## Decision model

Equipment status is a sequence of separate decisions. Passing an earlier decision never skips a later one:

1. identify the accepted authoritative snapshot and decision time;
2. preserve and compare their declared timestamp precision;
3. validate retrieval, decoding, structure, completeness, chronology, and internal consistency;
4. compare the population with the last accepted population and assess anomalies;
5. join records to the current reviewed inventory by exact official equipment identifier;
6. classify snapshot health as **Current**, **Degraded**, or **Unavailable**;
7. evaluate provisional-empty or restoration confirmation sequences;
8. assign the exact machine state; and
9. supply that machine decision, its scope, and its evidence record to the complete-path owner.

Snapshot health, machine state, and accessible-path validity are distinct. A **Current** snapshot is permission to evaluate its evidence, not proof that a machine is available or that a path is accessible. A machine decision applies only to its exact official equipment identifier. One machine's state never supplies another machine's state or proves the complete path.

## Authoritative time and source precision

Snapshot age is:

`decision time − accepted authoritative source timestamp`

Both values and their time bases must be recorded. The decision time comes from the governed server-side decision clock. Device time, display render time, retrieval start time, retry time, cache-write time, inventory-refresh attempt time, and a similar nearby record are not substitutes for the accepted authoritative source timestamp.

The decision record must preserve the precision actually supplied by each authoritative value. It must not add seconds, fractions, or other precision absent from the source. Boundary tests use the first positive value representable at the declared common precision. If the source precision cannot determine which side of a boundary applies, choose the more conservative classification and record the ambiguity; do not round into a safer state.

An apparent future timestamp, regressed chronology, incompatible time basis, missing authoritative timestamp, or negative age is structurally invalid for this decision and makes the snapshot **Unavailable**.

## Snapshot health classification

Evaluate every condition before assigning health. **Unavailable** has highest precedence and overrides any Degraded or Current age match. If no Unavailable condition applies, **Degraded** overrides Current. Assign **Current** only when neither a Degraded nor an Unavailable condition applies. A named invalidating or anomaly condition therefore always controls over apparent recency.

| Health | Required conditions | Equipment consequence |
|---|---|---|
| **Unavailable** | Age is greater than 15 minutes; or retrieval failed; or the response is malformed, structurally incomplete, chronologically invalid, internally unusable, or unjoinable to the current inventory. | Every route-critical machine governed by the affected evidence is **Unknown**. Preserve a last-known adverse outage only with the status-recheck wording. Do not infer availability, no outage, or restoration. |
| **Degraded** | No Unavailable condition applies, and age is greater than 5 minutes and no more than 15 minutes, inclusive; or a structurally valid snapshot has a suspicious population or contextual inconsistency requiring confirmation. | Every route-critical machine governed by the affected evidence is **Unknown**. Preserve a last-known adverse outage only with the status-recheck wording. Do not make a positive availability or restoration claim. |
| **Current** | No Unavailable or Degraded condition applies; age is no more than 5 minutes, inclusive; retrieval succeeded; and the snapshot is structurally valid, complete for its declared scope, internally consistent, non-anomalous, chronologically valid, and joinable to the current reviewed inventory. | Evaluate official outage evidence, provisional-empty confirmation, and restoration. Current alone is never a positive machine or path claim. |

The boundaries are exact:

- exactly 5 minutes may be **Current** only if every other Current condition passes;
- the first representable positive age above 5 minutes is **Degraded**;
- exactly 15 minutes is **Degraded**; and
- the first representable positive age above 15 minutes is **Unavailable**.

These thresholds are conservative product defaults, not an MTA service-level promise. They may change only through governed, reviewed, measured cadence evidence and updated acceptance fixtures. A threshold must never be silently lengthened for riders who depend on step-free access.

## No-outage decisions and empty-response confirmation

An absent target record and a globally zero-outage response are different evidence branches. Neither is proof that equipment is available.

### Healthy non-empty same-scope branch

A healthy accepted **Current**, non-empty outage snapshot may support **No official outage reported** for one exact target equipment identifier only when all of these conditions hold:

- the snapshot is complete for the same declared scope that covers the target;
- the non-empty population contains valid outage records for other exact official equipment identifiers;
- no outage record matches the exact target equipment identifier;
- the current reviewed inventory covers the target and every relevant record joins only by exact official identifier;
- no prior target outage is awaiting the restoration sequence; and
- no freshness, structure, completeness, chronology, consistency, anomaly, inventory, identity, or other stronger veto applies.

This branch is target-specific. It does not require the global two-snapshot empty confirmation because the accepted population is non-empty and demonstrates a coherent same-scope response. It does not clear a prior target outage: when a prior outage exists, the target's absence is an omission governed by the stricter [restoration](#restoration) sequence, and the first qualifying omission remains **Out of service—status being rechecked**.

### Globally zero-outage branch

1. The first accepted, structurally valid, coherent, **Current** zero-outage snapshot starts an internal **Provisional empty** sequence.
2. During **Provisional empty**, every route-critical machine in scope is **Unknown**. The product must not show **No official outage reported**, **Working**, **Available**, or an unconditional accessibility claim.
3. A second accepted, coherent, **Current** zero-outage snapshot may complete confirmation only when its authoritative timestamp is at least one authoritative minute later than the first, the surrounding population is coherent, and both snapshots join to the current reviewed inventory.
4. A second snapshot less than one authoritative minute later does not complete confirmation. A failed, partial, malformed, unjoinable, stale, or anomalous response never completes confirmation.
5. After a broken sequence, a later fully qualifying sequence is required. Raw emptiness, regardless of response count, never means that all equipment is working or that a complete accessible path exists.

Only the qualifying healthy non-empty target-absence branch or the completed globally zero-outage sequence authorizes **No official outage reported**, subject to every other veto and prior-outage rule. The phrase remains a statement about accepted official outage evidence for the exact target or supported scope, not observed operation or path accessibility.

## Population anomaly rules

Compare each candidate snapshot with the last accepted coherent snapshot for the same declared scope. The decision record must retain both integer populations, the denominator, official identifiers, malformed, duplicated, and unmatched counts, and any explicit official restoration evidence.

Treat the candidate as anomalous and require the next accepted snapshot to confirm the population when:

- more than 50% of previously active outage records disappear without explicit official restoration; or
- more than 10% of candidate records are malformed, duplicated, or unmatched to the current reviewed inventory.

The inequalities are strict numeric triggers. Exactly 50% disappearance or exactly 10% bad records does not cross the numeric trigger by itself. Neither boundary is a safe harbor: contextual inconsistency, implausible scope changes, contradictory counts, suspicious emptiness, or another coherence defect may require conservative anomaly treatment at or below the numeric boundary. Conversely, staying below a trigger never proves acceptance.

An anomalous but otherwise structurally usable snapshot is **Degraded**. A malformed, structurally incomplete, or unjoinable response is **Unavailable**. Neither state provides restoration or positive availability evidence. The next accepted, coherent, **Current** snapshot may be evaluated as confirmation; it does not retroactively make the anomalous snapshot acceptable.

## Inventory identity and currency

Only the exact official equipment identifier may join a status record to a structural path machine. Equipment name, description, type, station name, route, direction, proximity, ordering, coordinates, or a similar nearby record cannot create or repair a join.

The reviewed equipment inventory must be refreshed successfully and reviewed at least daily. Record the accepted inventory version, authoritative refresh timestamp, decision time, declared precision, age, review result, and official-identifier join result.

- A six-day-old inventory is a daily-review breach. Age alone has not yet reached the seven-day safety cutoff, but the breach must be recorded and escalated; all other evidence rules still apply.
- At exactly seven days without a successful accepted refresh, and at every older representable age, required accessible topology is **Unknown**.
- An attempted refresh, a retry timestamp, or a similar record does not reset inventory age. Only a successfully accepted inventory refresh does.
- When the seven-day cutoff applies, every route-critical decision dependent on that inventory is **Unknown**, even if the outage snapshot would otherwise be Current.

An unmatched or ambiguously matched route-critical machine is **Unknown**. Do not substitute a record that appears to describe the same machine.

## Machine-state decisions

The cataloged rider states are scoped to one exact official equipment identifier unless a separately reviewed surface explicitly enumerates several identifiers.

| Evidence decision | Exact rider state | Required boundary |
|---|---|---|
| Accepted **Current** official record says the machine is presently out of service | **Out of service** | The record is joined by exact official identifier and no stronger invalidating condition applies. |
| Accepted **Current** official record describes a future planned outage but no current outage | **Planned outage** | Present and future time scopes remain distinct. A planned end or start is not live operational evidence. |
| Healthy accepted Current non-empty same-scope snapshot contains valid other-ID outages but no exact target-ID outage; or a globally zero-outage sequence completes | **No official outage reported** | The non-empty branch also requires current reviewed inventory coverage, no prior target outage awaiting restoration, and no stronger veto. The global-empty branch requires the two-snapshot rule. Neither means Working, Available, observed operation, or accessible path. |
| Evidence is Degraded, Unavailable, Provisional empty, inventory-cutoff affected, unmatched, conflicting, or otherwise insufficient | **Unknown** | Fail closed for route-critical decisions. A formerly available machine becomes Unknown when freshness expires. |
| A previously accepted outage is absent once or its evidence has become stale without qualifying restoration | **Out of service—status being rechecked** | Preserve the adverse last-known state while rechecking; do not announce restoration or availability. |

If multiple conditions apply, current accepted adverse evidence controls over planned or positive evidence. **Unknown** controls over a positive state when identity, inventory, freshness, confirmation, or coherence is insufficient. The status-recheck state preserves a known adverse condition; it must not be weakened to generic Unknown merely because a confirming retrieval failed.

The phrases **Working**, **Available**, **All elevators working**, and any unconditional accessibility statement are prohibited. Equipment presence, a positive-looking record, an empty response, an omitted record, an estimate, or elapsed time never supplies those claims.

## Freshness and estimated-return presentation

Every route-critical equipment-status presentation must show and announce relative freshness using the catalog pattern **Checked _accepted relative age_ ago**. Derive the age only from the accepted authoritative source timestamp and decision time. The unit and value must not be more precise than the source. For example, **Checked 2 min ago** is valid only when the accepted timestamps and their declared precision support that statement. Do not use retrieval, render, retry, device, or inventory-attempt time to make the status appear younger.

If the accepted values or their precision cannot support any truthful relative-age rendering, classify the evidence **Unavailable**, set the route-critical machine to **Unknown**, and show and announce the catalog fallback **Checked time unavailable**. Silent freshness omission is prohibited for route-critical equipment.

An estimated return must be explicitly labeled as an estimate and remain separate from the current equipment state. It is not a reopening countdown. A planned outage, planned end, estimated return, operator expectation, or elapsed time does not prove current outage, current availability, restoration, or a complete accessible path.

Every visible state, freshness value, and estimate must have an assistive-technology equivalent conveying the same machine scope, time basis, certainty, and consequence. Color, icon, map position, animation, or tone cannot carry the state alone.

## Restoration

A current adverse state clears only for the exact matched official equipment identifier through one of these routes:

1. an accepted, coherent, **Current** official record explicitly reports restoration; or
2. two consecutive accepted, coherent, **Current** snapshots omit the prior outage, their authoritative timestamps are at least one authoritative minute apart, the surrounding population is coherent, and both join to the current reviewed inventory.

One qualifying omission is insufficient. Preserve **Out of service—status being rechecked** until the second qualifying omission arrives. A failed, Provisional empty, anomalously truncated, partial, malformed, stale, unmatched, structurally incomplete, or otherwise unusable snapshot never supplies restoration evidence or counts in the sequence.

Any nonqualifying observation breaks a two-omission sequence. The next accepted, coherent, Current qualifying omission becomes a new first observation. A data correction, planned outage end, estimated return, operator confidence, elapsed time, or a different machine's restoration is not restoration evidence.

Restoring one machine clears only that exact machine's adverse state. It does not prove that another machine works, that redundant equipment is available, or that origin, transfer, destination, or the complete path passes.

## Complete-path and downstream boundary

This policy supplies a machine decision only after exact identity and evidence checks. The complete-path contract still decides whether every required origin, transfer, destination, entrance, passage, boarding-area, platform, and egress element exists structurally. The Accessible Route Only matrix rejects a candidate whenever any required current machine is **Unknown** or adverse.

This Task 4 policy does not classify outage impact as Blocking, Reroutable within station, or Unrelated; select or rank alternatives; define warnings before the last accessible decision point; or decide how an underway journey changes. Those Task 5 decisions remain **Pending** in the copy catalog and their indexed artifacts. No Task 5 wording is authorized here.

## Required decision record

For every evaluated snapshot and machine, retain:

- fixed product and artifact versions;
- declared scope and exact official equipment identifier;
- authoritative source timestamp, decision time, time bases, and source precision;
- computed age and exact boundary result;
- retrieval, decoding, structure, completeness, chronology, and consistency results;
- prior and candidate population counts, bad-record counts, denominators, and anomaly rationale;
- inventory version, accepted refresh timestamp, age, daily-review state, and exact join result;
- provisional-empty or restoration-sequence position and every qualifying or breaking observation;
- current official outage, planned-outage, estimate, and explicit-restoration fields kept separately;
- expected, prohibited, and actual visible and assistive output;
- reviewer, review date, durable evidence link, correction, and rerun evidence; and
- final snapshot health, machine state, and complete-path handoff.

Missing required record fields make the decision unreviewable. They cannot be filled by inference after release.

## Review completion checklist

- [ ] Age uses the accepted authoritative timestamp and governed decision time at preserved source precision.
- [ ] Exactly 5 minutes, just over 5 minutes, exactly 15 minutes, and just over 15 minutes produce the governed classifications.
- [ ] Retrieval, structure, completeness, chronology, consistency, anomaly, and inventory-join checks control over apparent recency.
- [ ] The first accepted Current zero-outage response remains **Provisional empty** and route-critical machines remain **Unknown**.
- [ ] A healthy accepted Current non-empty complete same-scope snapshot with valid other-ID outages and no exact target-ID outage may show **No official outage reported** for that target only when current inventory covers it, no prior target outage awaits restoration, and no veto applies.
- [ ] A globally zero-outage response shows **No official outage reported** only after two qualifying Current snapshots at least one authoritative minute apart.
- [ ] A target with a prior outage never uses the non-empty target-absence branch to bypass restoration; its first omission remains **Out of service—status being rechecked**.
- [ ] More-than-50% disappearance and more-than-10% bad-record triggers are tested without treating their exact boundaries as safe harbors.
- [ ] Only exact official equipment identifiers join status to inventory and structural paths.
- [ ] Daily inventory review, the six-day breach, and the exact seven-day Unknown cutoff are recorded correctly.
- [ ] Degraded, Unavailable, Provisional empty, unmatched, and inventory-cutoff evidence never produces a positive machine state.
- [ ] A stale or singly omitted adverse outage uses **Out of service—status being rechecked**.
- [ ] Restoration requires explicit Current official restoration or two qualifying Current omission snapshots at least one authoritative minute apart.
- [ ] Every route-critical status shows and announces source-precision-supported relative freshness, or **Checked time unavailable** with an Unavailable and Unknown decision.
- [ ] Every estimate is explicitly labeled and never presented as a reopening countdown.
- [ ] Visible and assistive outputs convey equivalent state, scope, time, and certainty without color-only treatment.
- [ ] Every fixture in the acceptance table remains **Not run — Pending** until durable observed evidence is reviewed.
- [ ] No real retrieval, station, equipment, outcome, approval, threshold calibration, Gate 0 passage, or release evidence is claimed.

Every unchecked required item blocks approval. Threshold changes require reviewed measured evidence, updated fixtures, and the same mandatory reviewers; they cannot be made by copy, configuration drift, or silent operational exception.
