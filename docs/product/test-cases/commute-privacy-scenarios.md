# Commute privacy scenarios

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§13.3, 25.1–25.7, 26.3, 28.1–28.3, 30, and 34; commute alerts and launch quality plan Task 7; accepted Commute Tasks 1–6 |
| Owner | Release Quality Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | [Not run — Pending](#pending-execution-record) |

## Purpose and authority

`CPR-D01`–`CPR-A01` are fixed synthetic definitions for the [commute data inventory](../privacy/commute-data-inventory.md), [retention and reset policy](../privacy/commute-retention-and-reset-policy.md), and Task 7 addendum to the [commute-window state matrix](../ux/commute-window-state-matrix.md#task-7-privacy-retention-and-reset-addendum).

This artifact is **Draft**. **NO-GO — GATE 0 NOT PASSED** and **NO-GO — REQUIRED ACCESSIBILITY EVIDENCE AND COVERAGE ARE NOT DEMONSTRATED** remain in force. Every commute, device, token, queue, diagnostic, action, and result below is synthetic. No storage, deletion, permission, reset, reviewer, pilot, or launch behavior has been observed or approved.

The artifact header and Draft artifact index row now align on the full Task 7 provenance, accepted Tasks 1–6 handoffs, and Product, Accessibility, Data Quality, Content, Privacy, and Operations review. That metadata alignment is not approval; every privacy-scenario result and reviewer decision remains **Pending**.

## Fixed inherited input contract

`CPR-T7-POLICY-v1` identifies these definitions. Accepted Tasks 1–6 are fixed at base commit `3c38f56624e4e5febf94dfc34a65c84927e04557`. Each row binds immutable package `CPR-{fixture}-SRC-v1`; the Task 7 artifact version is the exact commit containing this pack. Fixed product/build and every implementation identifier remain **Pending**, so no fixture is executable or passed.

Every fixture inherits the values below unless its row explicitly replaces them. The inherited record plus the row is the complete fixed input.

| Required input | Fixed inherited value |
|---|---|
| Commute | Synthetic device-local commute `COMMUTE-SYN-{fixture}`; Active and explicitly confirmed; Monday–Friday, New York local 8:00–9:00 AM; 30-minute fixture lead; Fixture Origin to Fixture Destination; Downtown bound toward Coney Island; F primary route |
| Preferences | No preferred entrance, exit, transfer, or alternate unless overridden; Accessible Route Only Off; Avoid Stairs Off; delay tolerance 300 seconds; `recovery_updates=Off` |
| Capability | Notification intent enabled; current OS permission Granted; connected; one purpose-limited Commute delivery association with no trip data in the token |
| Evaluation memory | Synthetic Task 3 candidate and Task 6 occurrence ledger exist only where the row requires them; evidence pointers are non-personal; no movement or permission history |
| Storage boundary | Canonical preference, derived state, delivery ledger, token association, and queue categories are enumerated separately; no account, backup, sync, background location, passive visit, inferred Home/Work, or rider-level analytics |
| Operational truth | Current service, incident, equipment, accessibility, permission, connectivity, recommendation rendering, and payload construction are ephemeral inputs, not preference records |
| Unaffected state | Other commutes, saved stations, offline maps, official and structural data, current/global Accessible Route Only, and OS permissions remain unchanged unless the row explicitly says otherwise |
| Visible and assistive parity | Same control name, state, consequence, retained/removed categories, completion state, and next action; no hidden swipe or long press |
| Evidence state | Synthetic definition only; actual observation, six reviewer decisions/dates, durable evidence, correction, and rerun are Pending |
| Common prohibited result | Account or sync inference; Home/Work label; movement history; background-location dependency; replay; tombstone; false deletion completion; rider-level analytic join; guessed retention duration; launch or MTA guarantee |

## Fixture definitions

| Fixture/source | Fixed before state and rider action | Exact expected visible, assistive, stored, queued, token, or diagnostic result | Fixture-specific prohibited result |
|---|---|---|---|
| `CPR-D01`; `CPR-D01-SRC-v1` | Save the minimum required confirmed commute; no optional context supplied | Persist only the documented canonical preference fields, explicit confirmation provenance, default 300-second tolerance, and `recovery_updates=Off`; optional fields remain absent | Extra inferred field, account, visit history, Home/Work, or location record |
| `CPR-D02`; `CPR-D02-SRC-v1` | Preferred entrance, exit, transfer, alternates, and recovery choice are absent | Commute remains valid; absence is preserved rather than filled from location, search, passive use, or recommendations | Block save or manufacture optional context |
| `CPR-D03`; `CPR-D03-SRC-v1` | Proposal contains passive location/search/repeated-use and inferred Home/Work values | Reject those values; store none; require explicit rider entry and confirmation for any future optional context | Retain proposal history or inferred label |
| `CPR-E01`; `CPR-E01-SRC-v1` | A Task 3 candidate then encounters replay, contradiction, staleness, edition/path/service-date/tolerance change, or occurrence end | Apply the owning reset rule; do not carry the candidate as qualifying evidence; retain only current governed state while relevant | Add numeric retention, preserve stale qualification, or turn reset into delivery |
| `CPR-E02`; `CPR-E02-SRC-v1` | Edit or Resume occurs after a successful Task 6 delivery; current impact is equivalent | Preserve represented-window/delivery memory; suppress resend; fresh-evaluate only current evidence | Erase delivery marker or manufacture new initial push |
| `CPR-P01`; `CPR-P01-SRC-v1` | OS notification access changes from Granted to Revoked | Commute remains Active; remove or suspend its token association and unsent queue; show **Needs notification access**; deliver nothing and never replay | Pause/expire commute, retain queue, or infer permission history |
| `CPR-P02`; `CPR-P02-SRC-v1` | Current permission later reads Granted and rider resumes alert capability | Establish only the current purpose-limited association; evaluate current evidence prospectively; no historical replay | Restore old queue or send missed content |
| `CPR-P03`; `CPR-P03-SRC-v1` | Location permission is revoked | Saved-trip alerts and core evaluation remain unchanged; show exactly **Alerts use your saved trip. Location access is not required for this commute.** | Pause alerts, request background location, or delete saved trip |
| `CPR-C01`; `CPR-C01-SRC-v1` | Rider taps **Pause alerts**, then later **Resume alerts** | Pause retains preferences and delivery memory but stops evaluation/delivery; Resume fresh-evaluates without replay | Delete ledger, expire commute, or resend held content |
| `CPR-C02`; `CPR-C02-SRC-v1` | Rider confirms **Delete commute** for one of two commutes | Remove that commute’s preferences, provenance, thresholds, recovery choice, derived candidate, ledger, token association, and queue; create no tombstone; show **Commute deleted**; preserve other state | Remove other commute/maps/stations/OS permission or claim remote completion while Pending |
| `CPR-C03`; `CPR-C03-SRC-v1` | Rider deletes the last alert-enabled commute | Perform `CPR-C02`; remove the Commute delivery registration if no other explicit product use owns it; OS permission remains unchanged | Revoke OS permission, retain legacy registration, or delete unrelated product registration |
| `CPR-R01`; `CPR-R01-SRC-v1` | Rider confirms broad reset and every covered category reports Deleted or Not present | Clear all commute, derived, ledger, queued, and delivery-linked personalization; enumerate results; retain offline maps, official/structural data, current/global Accessible Route Only, and OS permissions | Say reset changed permission/global ARO or silently delete retained data |
| `CPR-R02`; `CPR-R02-SRC-v1` | One companion copy reports Pending and one queued copy reports Failed | Enumerate each category as `Deleted`, `Not present`, `Pending`, or `Failed`; do not show completion while any Pending/Failed remains | **Reset complete**, **All data deleted**, or hidden failure |
| `CPR-R03`; `CPR-R03-SRC-v1` | Rider requests deletion of personal data across every disclosed copy | Remove local, companion, queued, token, and any future synchronized copy; success only after every category is Deleted/Not present | Preserve linkable copy, tombstone, or success before remote result |
| `CPR-S01`; `CPR-S01-SRC-v1` | OS app-data clear completes | No saved commute, delivery memory, restoration, queue, or legacy delivery remains; offline maps may also be absent because the OS clear is broader | Restore commute, promise maps remain, or deliver old payload |
| `CPR-S02`; `CPR-S02-SRC-v1` | Fresh reinstall opens while OS permission happens to remain Granted | Empty commute state; no default backup restoration or old-token delivery; read current permission but deliver nothing until new explicit confirmation and enablement | Restore old commute/registration or treat Granted as alert intent |
| `CPR-Q01`; `CPR-Q01-SRC-v1` | Reviewed coarse operational diagnostic contains source type/time, broad operational scope, transformation result, decision/reason, purpose, owner/access roles, and deletion/aggregation end | Accept only the minimum non-personal aggregate for its approved purpose; no personal or reversible join exists | Exact O-D/window, token, commute ID, message body, stable pseudonym, or row-level journey |
| `CPR-Q02`; `CPR-Q02-SRC-v1` | Proposed measure needs stable key, exact commute/token/location, or join to reconstruct a journey | Reject the fields and the join; omit the measure if a privacy-safe coarse aggregate cannot produce it; record the gap | Hash and retain, lower the standard, or retain now for later aggregation |
| `CPR-A01`; `CPR-A01-SRC-v1` | Large text, keyboard/focus, touch, and assistive review of Edit/Pause/Resume/Delete/Keep/Settings/reset controls | Controls remain in the bottom third, visible, focusable, assistively named, and at least 48×48; destructive action requires confirmation; current/global Accessible Route Only remains on | Hidden swipe/long press, clipped consequence, color-only state, or per-commute delete changing global ARO |

## Pending execution record

Every row is an independent run record. A later correction or passing rerun must preserve and link the original result.

| Fixture | Actual visible and assistive observation | Six reviewer decisions and dates | Durable evidence and storage/queue/token record | Correction | Rerun | Status |
|---|---|---|---|---|---|---|
| `CPR-D01` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending — none** | **Pending — not run** | **Not run — Pending** |
| `CPR-D02` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending — none** | **Pending — not run** | **Not run — Pending** |
| `CPR-D03` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending — none** | **Pending — not run** | **Not run — Pending** |
| `CPR-E01` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending — none** | **Pending — not run** | **Not run — Pending** |
| `CPR-E02` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending — none** | **Pending — not run** | **Not run — Pending** |
| `CPR-P01` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending — none** | **Pending — not run** | **Not run — Pending** |
| `CPR-P02` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending — none** | **Pending — not run** | **Not run — Pending** |
| `CPR-P03` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending — none** | **Pending — not run** | **Not run — Pending** |
| `CPR-C01` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending — none** | **Pending — not run** | **Not run — Pending** |
| `CPR-C02` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending — none** | **Pending — not run** | **Not run — Pending** |
| `CPR-C03` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending — none** | **Pending — not run** | **Not run — Pending** |
| `CPR-R01` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending — none** | **Pending — not run** | **Not run — Pending** |
| `CPR-R02` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending — none** | **Pending — not run** | **Not run — Pending** |
| `CPR-R03` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending — none** | **Pending — not run** | **Not run — Pending** |
| `CPR-S01` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending — none** | **Pending — not run** | **Not run — Pending** |
| `CPR-S02` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending — none** | **Pending — not run** | **Not run — Pending** |
| `CPR-Q01` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending — none** | **Pending — not run** | **Not run — Pending** |
| `CPR-Q02` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending — none** | **Pending — not run** | **Not run — Pending** |
| `CPR-A01` | **Not run — Pending** | All roles **Pending**; dates **Pending** | **Pending — none** | **Pending — none** | **Pending — not run** | **Not run — Pending** |

## Blocking gaps and release boundary

Remote cleanup after app-data clear or reinstall needs an approved registration lease or equivalent invalidation design; its duration and mechanism are **Pending**. Seen semantics, delivery acknowledgment, severity order, correction-message behavior, lock-screen privacy, diagnostic retention, aggregation floors, and the Task 6 quiet-period approval are also **Pending**.

No fixture supplies privacy approval, deletion proof, queue/token evidence, implementation behavior, or pilot evidence. Gate 0 remains **NO-GO — GATE 0 NOT PASSED** until one fixed version has complete visible, assistive, storage, queue, token, permission, deletion, diagnostic, reviewer, correction, and rerun evidence.
