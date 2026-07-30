# Equipment status acceptance table

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§20, 21.9, 29.1, 31.5, 31.8, and 32.2, including Task 6's applicable §§20.1 and 20.5 boundaries; accessibility and platform-guidance plan `Product artifact map`; Task 4 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps`, and `Evidence and acceptance checks`; and Task 6 `Product artifacts`, `Dependencies`, `Produces for later tasks`, `Ordered steps` Steps 4 and 7, and `Evidence and acceptance checks` |
| Owner | Release Quality Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Not run — Pending |

## Purpose and authority

This table defines the 13 fixed acceptance fixtures for the [equipment status policy](equipment-status-policy.md) and the equipment messages in the [accessibility copy catalog](accessibility-copy-catalog.md). It tests exact freshness boundaries, provisional-empty confirmation, healthy non-empty target absence, population anomalies, inventory age, adverse-state preservation, and restoration. Expected results are requirements, not observed evidence.

The [complete accessible-path contract](complete-path-contract.md), [path-edge review checklist](path-edge-review-checklist.md), and [Accessible Route Only state matrix](accessible-route-only-state-matrix.md) continue to own their structural and route-decision boundaries. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict, and review follows the [product artifact review and approval policy](../review-and-approval-policy.md).

This artifact is **Draft**. All timestamps, identifiers, populations, and versions below are synthetic fixture inputs, not MTA observations. No fixture has been executed. There is no real product output, station or equipment evidence, reviewer result, approval, calibration, or release evidence.

The authoritative release decision remains:

**NO-GO — GATE 0 NOT PASSED**

Public arrival boards remain blocked.

Tasks 4 and 6 do not pass Gate 0 or the Release 1 accessibility gate.

## Governance provenance reconciliation

The [artifact index](../artifact-index.md) cites specification §§20, 31.5, and 31.8 for this table. Task 4 additionally applies acceptance case §21.9, accessibility target §29.1, and the plan's full Task 4 provenance. Task 6 adds the first-empty, confirmed-empty, one-omission, restoration, failed-response, cross-artifact, and Release 1 handoff controls and applies §32.2, as recorded above. Product Governance Lead reconciliation of the narrower index citation and this broader metadata is **Pending** before this artifact may advance from **Draft**. Task 6 does not edit the index or treat the mismatch as approved.

## Fixture execution contract

The fixture specification version is `equipment-status-fixtures-v1`. Every execution must bind the fixture to:

- a fixed reviewed product version;
- immutable revisions of this table, the equipment status policy, accessibility copy catalog, complete-path contract, and Accessible Route Only state matrix;
- the synthetic timestamp, precision, inventory, official identifier, and population inputs specified below;
- captured visible output and an assistive-technology transcript from the same run;
- a reviewer identity and review date for each required discipline;
- a durable evidence link;
- any failure correction and a new, separately linked rerun.

Those execution bindings are **Pending** for every fixture. An expected result does not count as actual evidence. A screenshot without the assistive transcript, a mutable build label, a reviewer assignment without a decision, or a correction without a rerun cannot change a fixture from **Not run — Pending**.

Unless a fixture overrides them, synthetic inputs use UTC, one-second authoritative timestamp precision, inventory version `INV-FIXTURE-v1`, a successfully accepted inventory timestamp of `2026-07-30T00:00:00Z`, and official equipment identifier `EQ-OFFICIAL-001`. The identifiers do not name real equipment. A one-second fixture precision makes the first representable age above five minutes `00:05:01` and above fifteen minutes `00:15:01`; it does not assert that a real source supplies whole-second precision.

Every route-critical expected visible and assistive state below must be accompanied in the same run by **Checked _accepted relative age_ ago**, using the fixed snapshot age and declared precision. If a test variation makes a truthful relative age impossible, it must instead show and announce **Checked time unavailable**, classify the snapshot Unavailable, and set the machine to Unknown. A state-focused row never waives this freshness requirement.

For every detailed record:

- **Product version: Pending** means no reviewed executable build has been bound.
- **Artifact revisions: Pending** means no immutable revisions have been bound.
- **Actual visible output / Actual assistive output: Not observed** means the fixture was not run.
- **Reviewers: Pending; Review date: Not recorded; Durable evidence: None** means there is no review evidence.
- **Correction: None recorded; Rerun: Not run** means no failure or corrective rerun is claimed.

## Fixture summary

| Fixture | Fixed synthetic branch | Expected decision | Status |
|---|---|---|---|
| EQ-01 | Snapshot age exactly 5 minutes | **Current** if every non-age check passes | **Not run — Pending** |
| EQ-02 | Snapshot age `00:05:01`, the first representable instant above 5 minutes | **Degraded**; route-critical machine **Unknown** | **Not run — Pending** |
| EQ-03 | Snapshot age exactly 15 minutes | **Degraded**; route-critical machine **Unknown** | **Not run — Pending** |
| EQ-04 | Snapshot age `00:15:01`, the first representable instant above 15 minutes | **Unavailable**; route-critical machine **Unknown** | **Not run — Pending** |
| EQ-05 | First accepted Current coherent zero-outage snapshot | Internal **Provisional empty**; route-critical machine **Unknown** | **Not run — Pending** |
| EQ-06 | Second Current coherent zero-outage snapshot at 59 seconds and at 60 seconds | 59 seconds cannot confirm; 60 seconds may support **No official outage reported** | **Not run — Pending** |
| EQ-07 | 51 of 100 previously active outages disappear without restoration | Anomalous and **Degraded**; no restoration or positive availability | **Not run — Pending** |
| EQ-08 | 11 of 100 records are malformed, duplicated, or unmatched | Anomalous and **Degraded**; route-critical machine **Unknown** | **Not run — Pending** |
| EQ-09 | Accepted inventory age exactly 6 days | Daily-review breach; seven-day cutoff not reached solely by age | **Not run — Pending** |
| EQ-10 | Accepted inventory age exactly 7 days and `7 days + 1 second` | Required accessible topology **Unknown** in both branches | **Not run — Pending** |
| EQ-11 | One Current coherent omission of a prior active outage | Preserve **Out of service—status being rechecked** | **Not run — Pending** |
| EQ-12 | Explicit Current restoration, or two Current coherent omissions 60 seconds apart | Restore the exact matched machine only; never infer the complete path | **Not run — Pending** |
| EQ-13 | Healthy accepted Current non-empty complete same-scope snapshot has valid other-ID outages but no exact target-ID outage; current inventory covers target; no prior target outage awaits restoration | May support **No official outage reported** for the exact target only | **Not run — Pending** |

## Detailed fixture records

### EQ-01 — Exactly five minutes

| Record field | Pending fixture record |
|---|---|
| Fixture / specification version | `EQ-01-v1` / `equipment-status-fixtures-v1` |
| Product version | **Pending — no fixed reviewed product version bound** |
| Artifact revisions | **Pending — no immutable policy, table, catalog, contract, or matrix revisions bound** |
| Synthetic timestamps and declared precision | Authoritative snapshot `2026-07-30T12:00:00Z`; decision `2026-07-30T12:05:00Z`; UTC; one-second precision; exact age `00:05:00` |
| Inventory version and age | `INV-FIXTURE-v1`; accepted `2026-07-30T00:00:00Z`; age `12:05:00`; daily-review condition passes |
| Official equipment identifier | `EQ-OFFICIAL-001`; exact join required |
| Snapshot structure and population | Successful, complete, valid, coherent, non-regressed, joinable; 1 valid record of 1; no malformed, duplicated, unmatched, empty, or anomalous population |
| Expected visible output | Snapshot may be **Current**; exact machine copy must follow its Current official record and remaining policy checks. |
| Expected assistive output | Convey the same Current evidence scope and exact machine state; do not broaden it to the path. |
| Prohibited visible and assistive output | **Degraded** or **Unavailable** because age equals five minutes; **Working**, **Available**, or an unconditional accessibility claim. |
| Actual visible output / actual assistive output | **Not observed / Not observed** |
| Reviewers / review date | **Pending / Not recorded** |
| Durable evidence | **None** |
| Correction / rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### EQ-02 — First representable instant above five minutes

| Record field | Pending fixture record |
|---|---|
| Fixture / specification version | `EQ-02-v1` / `equipment-status-fixtures-v1` |
| Product version | **Pending — no fixed reviewed product version bound** |
| Artifact revisions | **Pending — no immutable policy, table, catalog, contract, or matrix revisions bound** |
| Synthetic timestamps and declared precision | Authoritative snapshot `2026-07-30T12:00:00Z`; decision `2026-07-30T12:05:01Z`; UTC; one-second precision; exact age `00:05:01` |
| Inventory version and age | `INV-FIXTURE-v1`; age `12:05:01`; daily-review condition passes |
| Official equipment identifier | `EQ-OFFICIAL-001`; exact join required |
| Snapshot structure and population | Successful, complete, valid, coherent, non-regressed, joinable; 1 valid record of 1; no independent anomaly |
| Expected visible output | Snapshot **Degraded**; route-critical machine **Unknown**. |
| Expected assistive output | Announce **Unknown** for the same exact machine and do not imply current accessibility. |
| Prohibited visible and assistive output | **Current**, **No official outage reported**, **Working**, **Available**, restoration, or a positive path claim. |
| Actual visible output / actual assistive output | **Not observed / Not observed** |
| Reviewers / review date | **Pending / Not recorded** |
| Durable evidence | **None** |
| Correction / rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### EQ-03 — Exactly fifteen minutes

| Record field | Pending fixture record |
|---|---|
| Fixture / specification version | `EQ-03-v1` / `equipment-status-fixtures-v1` |
| Product version | **Pending — no fixed reviewed product version bound** |
| Artifact revisions | **Pending — no immutable policy, table, catalog, contract, or matrix revisions bound** |
| Synthetic timestamps and declared precision | Authoritative snapshot `2026-07-30T12:00:00Z`; decision `2026-07-30T12:15:00Z`; UTC; one-second precision; exact age `00:15:00` |
| Inventory version and age | `INV-FIXTURE-v1`; age `12:15:00`; daily-review condition passes |
| Official equipment identifier | `EQ-OFFICIAL-001`; exact join required |
| Snapshot structure and population | Successful, complete, valid, coherent, non-regressed, joinable; 1 valid record of 1; no independent anomaly |
| Expected visible output | Snapshot **Degraded** at the inclusive upper boundary; route-critical machine **Unknown**. |
| Expected assistive output | Convey the same Degraded evidence consequence and **Unknown** machine state. |
| Prohibited visible and assistive output | **Current**, **Unavailable** solely because age equals 15 minutes, positive availability, restoration, or accessible-now wording. |
| Actual visible output / actual assistive output | **Not observed / Not observed** |
| Reviewers / review date | **Pending / Not recorded** |
| Durable evidence | **None** |
| Correction / rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### EQ-04 — First representable instant above fifteen minutes

| Record field | Pending fixture record |
|---|---|
| Fixture / specification version | `EQ-04-v1` / `equipment-status-fixtures-v1` |
| Product version | **Pending — no fixed reviewed product version bound** |
| Artifact revisions | **Pending — no immutable policy, table, catalog, contract, or matrix revisions bound** |
| Synthetic timestamps and declared precision | Authoritative snapshot `2026-07-30T12:00:00Z`; decision `2026-07-30T12:15:01Z`; UTC; one-second precision; exact age `00:15:01` |
| Inventory version and age | `INV-FIXTURE-v1`; age `12:15:01`; daily-review condition passes |
| Official equipment identifier | `EQ-OFFICIAL-001`; exact join required |
| Snapshot structure and population | Successful, complete, valid, coherent, non-regressed, joinable; 1 valid record of 1; age is the controlling condition |
| Expected visible output | Snapshot **Unavailable**; route-critical machine **Unknown**. |
| Expected assistive output | Announce **Unknown** for the same machine without positive live-status language. |
| Prohibited visible and assistive output | **Current**, **Degraded**, **No official outage reported**, restoration, or accessible-now wording. |
| Actual visible output / actual assistive output | **Not observed / Not observed** |
| Reviewers / review date | **Pending / Not recorded** |
| Durable evidence | **None** |
| Correction / rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### EQ-05 — First accepted Current zero-outage snapshot

| Record field | Pending fixture record |
|---|---|
| Fixture / specification version | `EQ-05-v1` / `equipment-status-fixtures-v1` |
| Product version | **Pending — no fixed reviewed product version bound** |
| Artifact revisions | **Pending — no immutable policy, table, catalog, contract, or matrix revisions bound** |
| Synthetic timestamps and declared precision | Snapshot `2026-07-30T12:00:00Z`; decision `2026-07-30T12:00:30Z`; UTC; one-second precision; age `00:00:30` |
| Inventory version and age | `INV-FIXTURE-v1`; age `12:00:30`; daily-review condition passes |
| Official equipment identifier | `EQ-OFFICIAL-001`; present in the current inventory; no outage record returned |
| Snapshot structure and population | First successful, complete, valid, coherent, non-regressed, joinable zero-outage snapshot; 0 outage records; no accepted predecessor in the confirmation sequence |
| Expected visible output | Internal **Provisional empty**; route-critical machine **Unknown**. |
| Expected assistive output | Convey **Unknown** for the exact machine; do not announce a positive empty-response inference. |
| Prohibited visible and assistive output | **No official outage reported**, **Working**, **Available**, all elevators working, restoration, or complete-path accessibility. |
| Actual visible output / actual assistive output | **Not observed / Not observed** |
| Reviewers / review date | **Pending / Not recorded** |
| Durable evidence | **None** |
| Correction / rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### EQ-06 — Empty-response confirmation interval

| Record field | Pending fixture record |
|---|---|
| Fixture / specification version | `EQ-06-v1` / `equipment-status-fixtures-v1` |
| Product version | **Pending — no fixed reviewed product version bound** |
| Artifact revisions | **Pending — no immutable policy, table, catalog, contract, or matrix revisions bound** |
| Synthetic timestamps and declared precision | First snapshot `2026-07-30T12:00:00Z`; branch A second `2026-07-30T12:00:59Z`; branch B second `2026-07-30T12:01:00Z`; decisions 30 seconds after each snapshot; UTC; one-second precision |
| Inventory version and age | `INV-FIXTURE-v1`; branch A age at decision `12:01:29`; branch B `12:01:30`; daily-review condition passes |
| Official equipment identifier | `EQ-OFFICIAL-001`; exact join in both snapshots and both branches |
| Snapshot structure and population | Each snapshot successful, complete, Current, valid, coherent, non-regressed, joinable, and zero-outage; surrounding inventory and population unchanged |
| Expected visible output | Branch A remains **Unknown** because 59 seconds is too early. Branch B may show **No official outage reported** because the exact one-minute minimum is met and all other checks pass. |
| Expected assistive output | Announce the same branch-specific state, exact machine scope, and no-outage qualifier. |
| Prohibited visible and assistive output | Branch A positive no-outage copy; either branch **Working**, **Available**, observed-operation, restoration, or complete-path claim. |
| Actual visible output / actual assistive output | **Not observed / Not observed** |
| Reviewers / review date | **Pending / Not recorded** |
| Durable evidence | **None** |
| Correction / rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### EQ-07 — More than half of active outages disappear

| Record field | Pending fixture record |
|---|---|
| Fixture / specification version | `EQ-07-v1` / `equipment-status-fixtures-v1` |
| Product version | **Pending — no fixed reviewed product version bound** |
| Artifact revisions | **Pending — no immutable policy, table, catalog, contract, or matrix revisions bound** |
| Synthetic timestamps and declared precision | Accepted predecessor `2026-07-30T12:00:00Z`; candidate `2026-07-30T12:01:00Z`; decision `2026-07-30T12:01:30Z`; UTC; one-second precision; candidate age `00:00:30` |
| Inventory version and age | `INV-FIXTURE-v1`; age `12:01:30`; daily-review condition passes |
| Official equipment identifier | `EQ-OFFICIAL-001` is among retained records; all comparison records use fixed synthetic official IDs `EQ-OFFICIAL-001` through `EQ-OFFICIAL-100` |
| Snapshot structure and population | Predecessor has 100 active outage records; candidate retains 49 and omits 51; disappearance `51/100 = 51%`; no explicit restoration; candidate otherwise structurally valid and joinable |
| Expected visible output | Treat the population as anomalous and snapshot **Degraded**. For retained `EQ-OFFICIAL-001`, show **Out of service—status being rechecked**; the route-critical decision remains fail-closed. |
| Expected assistive output | Announce **Out of service—status being rechecked** for retained `EQ-OFFICIAL-001`; do not announce the disappearances as restorations. |
| Prohibited visible and assistive output | Positive availability, **No official outage reported**, mass restoration, or a complete-path claim. |
| Actual visible output / actual assistive output | **Not observed / Not observed** |
| Reviewers / review date | **Pending / Not recorded** |
| Durable evidence | **None** |
| Correction / rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### EQ-08 — More than ten percent bad records

| Record field | Pending fixture record |
|---|---|
| Fixture / specification version | `EQ-08-v1` / `equipment-status-fixtures-v1` |
| Product version | **Pending — no fixed reviewed product version bound** |
| Artifact revisions | **Pending — no immutable policy, table, catalog, contract, or matrix revisions bound** |
| Synthetic timestamps and declared precision | Snapshot `2026-07-30T12:00:00Z`; decision `2026-07-30T12:00:30Z`; UTC; one-second precision; age `00:00:30` |
| Inventory version and age | `INV-FIXTURE-v1`; age `12:00:30`; daily-review condition passes |
| Official equipment identifier | `EQ-OFFICIAL-001` is the route-critical target; the 100-record fixed population uses synthetic official IDs |
| Snapshot structure and population | 100 total records: 89 valid exact matches and 11 fixed bad records partitioned as 4 malformed, 4 duplicated, and 3 unmatched; bad share `11/100 = 11%`; enough structure remains to measure the anomaly |
| Expected visible output | Treat the population as anomalous and snapshot **Degraded**; route-critical machine **Unknown**. |
| Expected assistive output | Announce **Unknown** for the same machine and do not hide the anomaly behind a positive summary. |
| Prohibited visible and assistive output | **Current**, positive availability, restoration, **No official outage reported**, or accessible-now wording. |
| Actual visible output / actual assistive output | **Not observed / Not observed** |
| Reviewers / review date | **Pending / Not recorded** |
| Durable evidence | **None** |
| Correction / rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### EQ-09 — Six-day inventory

| Record field | Pending fixture record |
|---|---|
| Fixture / specification version | `EQ-09-v1` / `equipment-status-fixtures-v1` |
| Product version | **Pending — no fixed reviewed product version bound** |
| Artifact revisions | **Pending — no immutable policy, table, catalog, contract, or matrix revisions bound** |
| Synthetic timestamps and declared precision | Snapshot `2026-07-30T12:00:00Z`; decision `2026-07-30T12:00:30Z`; UTC; one-second precision; snapshot age `00:00:30` |
| Inventory version and age | `INV-FIXTURE-v1`; accepted `2026-07-24T12:00:30Z`; decision `2026-07-30T12:00:30Z`; exact age 6 days; last daily review also 6 days old |
| Official equipment identifier | `EQ-OFFICIAL-001`; exact join succeeds in the six-day inventory |
| Snapshot structure and population | Successful, complete, Current, valid, coherent, non-regressed, non-anomalous, joinable; 1 valid record of 1 |
| Expected visible output | Record and escalate the daily-review breach. Do not apply the seven-day topology cutoff solely because inventory age is six days; continue all other policy checks. |
| Expected assistive output | Convey only the machine state supported after all remaining checks; do not describe the inventory as freshly reviewed. |
| Prohibited visible and assistive output | Claim daily review is current, claim the six-day inventory alone proves topology **Unknown**, or use age as positive equipment evidence. |
| Actual visible output / actual assistive output | **Not observed / Not observed** |
| Reviewers / review date | **Pending / Not recorded** |
| Durable evidence | **None** |
| Correction / rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### EQ-10 — Seven-day inventory cutoff

| Record field | Pending fixture record |
|---|---|
| Fixture / specification version | `EQ-10-v1` / `equipment-status-fixtures-v1` |
| Product version | **Pending — no fixed reviewed product version bound** |
| Artifact revisions | **Pending — no immutable policy, table, catalog, contract, or matrix revisions bound** |
| Synthetic timestamps and declared precision | Snapshot `2026-07-30T12:00:00Z`; branch A decision `2026-07-30T12:00:30Z`; branch B decision `2026-07-30T12:00:31Z`; UTC; one-second precision |
| Inventory version and age | Branch A accepted `2026-07-23T12:00:30Z`, exact age 7 days; branch B uses the same timestamp, exact age 7 days plus 1 second; no successful accepted refresh |
| Official equipment identifier | `EQ-OFFICIAL-001`; an apparent exact join does not override the age cutoff |
| Snapshot structure and population | Successful, complete, otherwise Current and coherent status snapshot; 1 valid record of 1; inventory age is the controlling condition |
| Expected visible output | Required accessible topology and route-critical machine are **Unknown** at exactly seven days and beyond. |
| Expected assistive output | Announce the same **Unknown** state and withhold current-accessibility language. |
| Prohibited visible and assistive output | Treat exactly seven days as still below the cutoff; reset age from an attempt or similar record; show positive availability or accessible-now wording. |
| Actual visible output / actual assistive output | **Not observed / Not observed** |
| Reviewers / review date | **Pending / Not recorded** |
| Durable evidence | **None** |
| Correction / rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### EQ-11 — One omission of a prior outage

| Record field | Pending fixture record |
|---|---|
| Fixture / specification version | `EQ-11-v1` / `equipment-status-fixtures-v1` |
| Product version | **Pending — no fixed reviewed product version bound** |
| Artifact revisions | **Pending — no immutable policy, table, catalog, contract, or matrix revisions bound** |
| Synthetic timestamps and declared precision | Accepted outage snapshot `2026-07-30T12:00:00Z`; one omission snapshot `2026-07-30T12:01:00Z`; decision `2026-07-30T12:01:30Z`; UTC; one-second precision; omission age `00:00:30` |
| Inventory version and age | `INV-FIXTURE-v1`; age `12:01:30`; daily-review condition passes |
| Official equipment identifier | `EQ-OFFICIAL-001`; prior Current official outage joined exactly; candidate omits that ID |
| Snapshot structure and population | Candidate is successful, complete, Current, valid, coherent, non-regressed, non-anomalous, and joinable; surrounding population coherent; this is only omission one |
| Expected visible output | **Out of service—status being rechecked** for `EQ-OFFICIAL-001`. |
| Expected assistive output | **Out of service—status being rechecked** for the same exact machine. |
| Prohibited visible and assistive output | Restored, **No official outage reported**, **Working**, **Available**, generic positive accessibility, or clearing the adverse state. |
| Actual visible output / actual assistive output | **Not observed / Not observed** |
| Reviewers / review date | **Pending / Not recorded** |
| Durable evidence | **None** |
| Correction / rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### EQ-12 — Qualifying restoration routes

| Record field | Pending fixture record |
|---|---|
| Fixture / specification version | `EQ-12-v1` / `equipment-status-fixtures-v1` |
| Product version | **Pending — no fixed reviewed product version bound** |
| Artifact revisions | **Pending — no immutable policy, table, catalog, contract, or matrix revisions bound** |
| Synthetic timestamps and declared precision | Prior outage `2026-07-30T12:00:00Z`; branch A explicit restoration snapshot `2026-07-30T12:01:00Z`; branch B omissions `2026-07-30T12:01:00Z` and `2026-07-30T12:02:00Z`; decisions 30 seconds after each candidate; UTC; one-second precision |
| Inventory version and age | `INV-FIXTURE-v1`; maximum age at branch decision `12:02:30`; daily-review condition passes |
| Official equipment identifier | `EQ-OFFICIAL-001`; every prior, restoration, omission, and inventory record joins exactly |
| Snapshot structure and population | Branch A has an accepted coherent Current explicit official restoration. Branch B has two consecutive accepted coherent Current omissions exactly 60 authoritative seconds apart with coherent surrounding population. |
| Expected visible output | Clear the adverse state for `EQ-OFFICIAL-001` only. Reevaluate its next exact state from current evidence; do not infer another machine or complete path. |
| Expected assistive output | Convey restoration scope for `EQ-OFFICIAL-001` only and no broader accessibility conclusion. |
| Prohibited visible and assistive output | Restore a different machine, mark all elevators working, infer a complete accessible path, treat an estimate or planned end as restoration, or use one omission. |
| Actual visible output / actual assistive output | **Not observed / Not observed** |
| Reviewers / review date | **Pending / Not recorded** |
| Durable evidence | **None** |
| Correction / rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

### EQ-13 — Healthy non-empty same-scope target absence

| Record field | Pending fixture record |
|---|---|
| Fixture / specification version | `EQ-13-v1` / `equipment-status-fixtures-v1` |
| Product version | **Pending — no fixed reviewed product version bound** |
| Artifact revisions | **Pending — no immutable policy, table, catalog, contract, or matrix revisions bound** |
| Synthetic timestamps and declared precision | Authoritative non-empty outage snapshot `2026-07-30T12:00:00Z`; decision `2026-07-30T12:00:30Z`; UTC; one-second precision; exact snapshot age `00:00:30` |
| Inventory version and age | `INV-FIXTURE-v1`; accepted `2026-07-30T00:00:00Z`; age `12:00:30`; daily-review condition passes; inventory covers the full declared `SCOPE-FIXTURE-001` including target `EQ-OFFICIAL-001` |
| Official equipment identifier | Target `EQ-OFFICIAL-001`; exact official-ID join to current reviewed inventory succeeds; no prior accepted outage for this target exists and no restoration sequence is open |
| Snapshot structure and population | Successful, complete for declared `SCOPE-FIXTURE-001`, Current, valid, coherent, non-regressed, internally consistent, non-anomalous, and joinable; exactly 2 valid outage records for other official IDs `EQ-OFFICIAL-002` and `EQ-OFFICIAL-003`; 0 records for exact target `EQ-OFFICIAL-001`; 0 malformed, duplicated, or unmatched records; no stronger veto |
| Expected visible output | For exact target `EQ-OFFICIAL-001`, show **No official outage reported** with **Checked 30 sec ago**. Keep the two other outage records scoped to their own official IDs. |
| Expected assistive output | For exact target `EQ-OFFICIAL-001`, announce **No official outage reported** and **Checked 30 sec ago** with equivalent target scope and certainty. |
| Prohibited visible and assistive output | **Working**, **Available**, all equipment clear, globally empty, Provisional empty, restored, another machine's state, or complete-path accessibility; do not apply this branch if a prior target outage awaits restoration. |
| Actual visible output / actual assistive output | **Not observed / Not observed** |
| Reviewers / review date | **Pending / Not recorded** |
| Durable evidence | **None** |
| Correction / rerun | **None recorded / Not run** |
| Evidence status | **Not run — Pending** |

## Release 1 acceptance-pack handoff

The [Release 1 accessibility acceptance pack](accessibility-acceptance-pack.md) references, but does not rewrite, renumber, execute, or approve EQ-01 through EQ-13. Every handoff binds the exact fixture and version to one pack control or source case, one fixed product/build and artifact package, actual visible and assistive output, durable evidence, five-role review, correction, and a separately linked rerun.

| EQ fixture branch | Pack control and initial attempt | Required Release 1 result | Current actual/evidence/review/correction/rerun |
|---|---|---|---|
| EQ-05 / `EQ-05-v1` — first accepted coherent Current globally zero-outage response | `A11Y-EQ-C05` / `A11Y-EQ-C05-A01`; also A11Y-31-30 | Internal **Provisional empty**; route-critical **Unknown**; never **No official outage reported** | **Pending / Pending / Pending / Pending / Pending** |
| EQ-06 / `EQ-06-v1` — second accepted coherent Current globally zero-outage response | `A11Y-EQ-C06` / `A11Y-EQ-C06-A01` | 59 seconds cannot confirm; at least one authoritative minute may support **No official outage reported** only when every other gate passes | **Pending / Pending / Pending / Pending / Pending** |
| EQ-11 / `EQ-11-v1` — one accepted omission of a prior outage | `A11Y-EQ-C11` / `A11Y-EQ-C11-A01` | Preserve exact **Out of service—status being rechecked** for the exact machine | **Pending / Pending / Pending / Pending / Pending** |
| EQ-12 / `EQ-12-v1` — explicit Current restoration or two qualifying omissions | `A11Y-EQ-C12` / `A11Y-EQ-C12-A01` | Clear the adverse state for the exact matched machine only; use the source-matched Task 5 branch and begin full-path reevaluation | **Pending / Pending / Pending / Pending / Pending** |
| EQ-13 / `EQ-13-v1` — healthy Current non-empty complete same-scope target absence | `A11Y-EQ-C13` / `A11Y-EQ-C13-A01` | May support **No official outage reported** for the exact target only with current inventory, valid other-ID population, no prior target outage awaiting restoration, and no veto | **Pending / Pending / Pending / Pending / Pending** |
| EQ-02/03/04 stale, EQ-07/08 anomalous, and EQ-10 inventory-cutoff branches | `A11Y-EQ-NEG` / `A11Y-EQ-NEG-A01`; applicable A11Y-21-09 and A11Y-31-30 attempts | Route-critical **Unknown**, except preserve the exact prior adverse recheck state when applicable; no positive equipment or route claim | **Pending / Pending / Pending / Pending / Pending** |

For every row, fixed product/build and Task 6 artifact revisions are **Pending**, no actual visible or assistive output has been observed, no durable evidence exists, all Product, Accessibility, Data Quality, Content, and Operations decisions are Pending, and no correction or rerun is recorded.

Pack-local control `A11Y-EQ-FR-01-A01` separately exercises a failed, malformed, missing-structure, incomplete, unmatched, or unjoinable response. It is **Not run — Pending**, is not a fourteenth EQ fixture, and cannot invent or renumber a Task 4 result. Its route-critical expected state is **Unknown** or the exact preserved prior adverse recheck state; **No official outage reported** is prohibited.

The raw-empty safety rule means **raw or unconfirmed empty**, stale, anomalous, failed, malformed, structurally incomplete, unmatched, or unjoinable evidence never produces **No official outage reported**. It does not erase the confirmed-empty EQ-06 or healthy non-empty exact-target EQ-13 positive branches.

Machine-level restoration is never route acceptance. Task 5 IMP-13 keeps the current path warning and verified safe action active until a fresh complete-path reevaluation passes every required exact edge and scope, or the rider explicitly selects a still-passing governed replacement.

## Acceptance review checklist

- [ ] Every run binds a fixed reviewed product version and immutable artifact revisions.
- [ ] Every timestamp, time basis, and source precision is captured without manufacturing precision.
- [ ] Inventory version, accepted refresh timestamp, age, daily-review state, and exact official-identifier join are recorded.
- [ ] Snapshot structure, population, bad-record counts, denominator, and anomaly result match the fixed fixture.
- [ ] EQ-13 proves the healthy non-empty complete same-scope target-absence branch without weakening globally empty confirmation or prior-outage restoration.
- [ ] Every route-critical visible and assistive output includes source-precision-supported relative freshness or the exact unavailable-time fallback and its conservative state.
- [ ] Visible output and assistive output are captured from the same run and convey equivalent state and scope.
- [ ] Expected and prohibited outcomes are compared with actual evidence rather than treated as evidence.
- [ ] Product, Accessibility, Data Quality, Content, and Operations reviewers and dates are recorded.
- [ ] Durable evidence is immutable and traceable to the fixed run.
- [ ] Every failure keeps its original evidence and links a correction and a new rerun.
- [ ] Every Release 1 handoff binds the exact EQ fixture/version and pack control/attempt to one fixed product/build and artifact package, actual visible and assistive output, durable evidence, same-version five-role decisions, correction, and separately linked rerun.
- [ ] Raw/unconfirmed empty and all failed, malformed, incomplete, unmatched, or unjoinable branches remain negative without erasing EQ-06 or EQ-13.
- [ ] Pack-local failed-response control A11Y-EQ-FR-01 remains separate from, and does not renumber or fabricate, EQ-01 through EQ-13.
- [ ] IMP-13 preserves the path warning until fresh complete-path acceptance or explicit selection of a governed verified replacement.
- [ ] No fixture advances from **Not run — Pending** without the complete record.
- [ ] No fixture result is treated as Gate 0 passage, Release 1 accessibility approval, threshold calibration, or production evidence.

Until all required fixtures pass with reviewed durable evidence, the table remains **Not run — Pending** and the authoritative no-go is unchanged.
