# Arrival-truth decision review template

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§27.1 and 27.4; arrival-truth and service-changes plan Task 11 `Artifacts` and `Ordered steps` |
| Owner | Release Quality Lead |
| Required reviewers | Product, Data Quality, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | [Pending — Truth Gate](quarantine-recovery-review-cases.md) |

## Purpose and use

Use one copy of this template to review one arrival-truth decision or one linked transition sequence. It standardizes evidence for a train that was shown, hidden, suppressed, made unavailable, held, quarantined, or presented as Scheduled. It also supports later outcome review and threshold calibration without personal rider history.

This template records evidence; it creates no admission, quarantine, correction, recovery, rider-language, or release rule. Complete it under the [provenance, quarantine, and correction policy](../arrival-truth/provenance-quarantine-and-correction-policy.md), [core arrival contract](../arrival-truth/core-arrival-contract.md), [evidence veto catalog](../arrival-truth/evidence-veto-catalog.md), and the narrower policy that owns the decision. Shared terms and public wording remain governed by the [approved transit product glossary](../contracts/transit-product-glossary.md) and [approved rider language rules](../contracts/rider-language-rules.md).

This artifact is **Draft**. A completed copy is review evidence only when it identifies the fixed reviewed product version, preserves failures and reruns, and follows the [review and approval policy](../review-and-approval-policy.md).

## 1. Review identity

| Field | Review entry |
|---|---|
| Review record ID | _Required_ |
| Decision ID or linked decision sequence | _Required_ |
| Fixed product-policy version | _Required_ |
| Original authoritative decision time | _Required_ |
| Review date | _Required_ |
| Reviewer name and role | _Required_ |
| Review trigger | _Routine sample / rider-impact incident / quarantine / suppression / fallback / correction / recovery / threshold calibration / other governed trigger_ |
| Related risk-register ID | _If applicable_ |
| Related scenario or incident evidence | _Durable repository-relative link_ |
| Prior failure and correction link | _Required when this is a rerun; otherwise None_ |
| Review conclusion | _Correct decision / over-suppression / under-suppression / unsupported positive claim / provenance gap / recovery error / correction error / inconclusive_ |

Do not place a rider account, saved commute, device identifier, notification token, precise rider location, search history, or another personal or linkable rider identifier in this record.

## 2. Exact claim under review

| Scope field | Review entry |
|---|---|
| Claim type | _Live / Expected / Holding / confirmed-pattern Uncertain / suppressed / arrival claim unavailable / Scheduled / no estimate / board-level gap / dependent guidance_ |
| Route identity | _Required_ |
| Station complex | _Required when applicable_ |
| Constituent station | _Required when applicable; do not infer from complex name_ |
| Exact directional stop | _Required for an arrival claim_ |
| Normalized rider-facing direction | _Required; pair with actual destination_ |
| Actual destination or terminal | _Required for a train claim_ |
| Train-instance evidence reference | _Required internally; never rider-facing_ |
| Operating service date | _Required_ |
| Segment, exact stop, train, track/path, or other constrained scope | _Required when applicable_ |
| Public question answered | _For example: why was this train shown or hidden at this exact directional stop?_ |

### Original public result

| Public-result field | Review entry |
|---|---|
| Train row shown? | _Yes / No_ |
| Primary next-three slot consumed? | _Yes / No_ |
| Evidence state shown | _Exact state or None_ |
| Time treatment | _Rounded live countdown / Expected range / frozen Holding value / no exact minute / scheduled clock time / none_ |
| Freshness shown | _Exact plain-language freshness or None_ |
| Service-change or gap explanation | _Exact rider copy or None_ |
| Dependent guidance shown or withheld | _Exact result or Not applicable_ |
| Assistive-reading equivalent | _Exact meaning delivered or Not applicable_ |

## 3. Source and provenance ledger

Add one row for every input considered, including evidence rejected or quarantined. A missing row is not a negative finding; record the expected source and why it was unavailable.

| Source type | Evidence reference | Source timestamp | Authoritative comparison and age | Effective period or service-date coverage | Exact supported scope | Validity, health, or currency result | Accepted, rejected, or quarantined | Positive, negative, or explanatory role | Transformation or exclusion reason |
|---|---|---|---|---|---|---|---|---|---|
| _Required_ | _Required_ | _Required or explicit source-supported absence_ | _Required_ | _Required_ | _Required_ | _Required_ | _Required_ | _Required_ | _Required_ |

### Provenance completeness check

| Required provenance | Complete? | Evidence or gap |
|---|---:|---|
| Source type for every public or withheld claim | _Yes / No_ | _Required_ |
| Source timestamp and authoritative comparison | _Yes / No_ | _Required_ |
| Effective period or schedule coverage | _Yes / No_ | _Required_ |
| Exact route, station, direction, train, segment, stop, and track/path scope as applicable | _Yes / No_ | _Required_ |
| Full transformation from inputs through public state | _Yes / No_ | _Required_ |
| Suppression, unavailability, quarantine, fallback, or no-estimate reason | _Yes / No / Not applicable_ | _Required_ |

Any **No** keeps the review open and blocks a conclusion that the stronger claim was adequately supported.

## 4. Ordered decision reconstruction

Record **Yes**, **No**, or **Unknown**. **Unknown** is never treated as **Yes**.

| Ordered decision | Result | Controlling evidence | Consequence |
|---|---|---|---|
| Validity and freshness accepted before train evaluation | _Yes / No / Unknown_ | _Required_ | _Required_ |
| Current negative evidence applied before positive prediction or schedule | _Yes / No / Unknown_ | _Required_ | _Required_ |
| One coherent current train instance established | _Yes / No / Unknown_ | _Required_ | _Required_ |
| Exact directional stop appears in the ordered remaining-stop sequence | _Yes / No / Unknown_ | _Required_ | _Required_ |
| Actual destination and normalized direction agree with that sequence | _Yes / No / Unknown_ | _Required_ | _Required_ |
| No bypass, suspension, closure, planned-pattern exclusion, unresolved reroute, or other service-change veto applies | _Yes / No / Unknown_ | _Required_ | _Required_ |
| No invalidating track/path conflict applies | _Yes / No / Unknown_ | _Required_ | _Required_ |
| Movement, stop progress, and arrival time support the assigned confidence and precision | _Yes / No / Unknown_ | _Required_ | _Required_ |
| Suppression or unavailability release gate passed, if applicable | _Yes / No / Unknown / Not applicable_ | _Required_ | _Required_ |
| Candidate admitted before chronological ordering | _Yes / No / Not admitted_ | _Required_ | _Required_ |
| Only admitted Live and Expected candidates consumed next-three slots | _Yes / No_ | _Required_ | _Required_ |
| Static data stayed outside the live next-three and did not repair a missing claim | _Yes / No_ | _Required_ | _Required_ |

### Why the train was shown or hidden

| Question | Review entry |
|---|---|
| Strongest evidence-supported disposition | _Required_ |
| Exact decisive evidence | _Required_ |
| Positive claim admitted or defeated | _Required_ |
| Veto, failed gate, unresolved scope, quarantine trigger, or fallback gate | _Required or None_ |
| Narrowest affected scope | _Required_ |
| Why unrelated service remained or did not remain visible | _Required_ |
| Did the observed rider result match the decision? | _Yes / No, with evidence_ |

## 5. Quarantine and suspect-record isolation

| Quarantine field | Review entry |
|---|---|
| Trigger class | _Malformed timestamp / implausible or future timestamp / stop-order regression / duplicate identities / impossible direction change / track conflict / suspicious empty snapshot / contradictory alert scope / None_ |
| First adverse observation and authoritative time | _Required when applicable_ |
| Exact evidence unit and scope isolated | _Required when applicable_ |
| Internal disposition | _Grace / quarantine / hard suppression / feed anomaly / alert quarantine / schedule-edition quarantine / other governed result_ |
| Immediate public consequence | _Required_ |
| Did the suspect record contribute any candidate, stop, time, identity, direction, destination, ordering position, fallback claim, positive correction authority, or recovery count? | _Must be No; explain evidence_ |
| Independently coherent unaffected service preserved? | _Yes / No / Not applicable, with evidence_ |
| Evidence-unit release requirement | _Required_ |
| Separate public-claim readmission requirement | _Required_ |

If a suspect record influenced the primary board, dependent guidance, a correction, or a recovery count, classify the review as an unsupported positive-claim or recovery failure. A later correct result does not erase it.

## 6. Holding and later stop-progress review

Complete this section for every sampled train that was Live, Due, Holding, Uncertain, suppressed for disappearance or regression, or later observed near the target.

### Holding episode

| Holding field | Review entry |
|---|---|
| Due start, if any | _Authoritative time or Not applicable_ |
| Last accepted movement or stop-progress time | _Required_ |
| Holding start | _Required or Not applicable_ |
| Holding end or last observation | _Required or Not applicable_ |
| Holding duration | _Required; derive from authoritative chronology_ |
| Feed age during episode | _Required and separate from movement age_ |
| Movement age at each 90/180-second decision | _Required when crossed_ |
| Due/no-progress result at 60 and 120 seconds | _Required when crossed_ |
| Countdown froze immediately? | _Yes / No / Not applicable_ |
| Primary slot removed when required? | _Yes / No / Not applicable_ |
| Exact stop and track/path remained confirmed? | _Yes / No; if No, explain suppression_ |
| Strongest state shown over time | _Required_ |
| Silent deletion occurred? | _Must be No for a still-valid train; explain_ |

### Later stop progress and observed outcome

| Later-outcome field | Review entry |
|---|---|
| Later accepted snapshots examined | _Evidence references and authoritative times_ |
| Ordered stop progress after the original decision | _Advanced / remained plausible / regressed / disappeared / unresolved_ |
| Did the train later reach, pass, bypass, terminate before, or remain unresolved for the target? | _Required_ |
| Was target service continuously supported at each public-claim decision? | _Yes / No, by decision_ |
| Did later evidence reveal a false positive, missed ghost, premature removal, or correct conservative withholding? | _Required_ |
| Did later outcome change the original evidence record? | _Must be No; record a linked new decision instead_ |

Later physical progress is calibration evidence, not retroactive authority for an earlier unsupported claim.

## 7. Alert over- or under-suppression review

| Alert-review field | Review entry |
|---|---|
| Original official text and structured scope | _Required_ |
| Active period and early-display versus active-operation state | _Required_ |
| Resolved route, station or segment, normalized direction, train, and consequence | _Required_ |
| Missing, generic, contradictory, or evolving fields | _Required_ |
| Original arrival result | _Visible / suppressed / arrival claim unavailable / unaffected_ |
| Later evidence-supported affected scope | _Required_ |
| Over-suppression check | _Did the decision hide an independently coherent claim outside the supported or materially unresolved scope? Yes / No, with evidence_ |
| Under-suppression check | _Did the decision show a train inside a resolved or materially unresolved bypass, reroute, short-turn, suspension, closure, or invalidating track scope? Yes / No, with evidence_ |
| Original official message preserved where required? | _Yes / No / Not applicable_ |
| Generic **Affected** alone used as bypass or unavailability proof? | _Must be No_ |
| Correct narrowest consequence | _Required_ |

An under-suppressed bypass or materially unresolved bypass possibility is a release-blocking trust failure. Over-suppression remains a quality failure and must retain its affected scope, correction, and rerun evidence.

## 8. Recovery evidence

Complete one row per candidate update. Do not combine nonconsecutive updates or use static data, a correction, an ended alert, or a schedule as a live recovery update.

| Recovery input | Newer than adverse evidence? | Fresh, accepted, and coherent? | Stable identity | Plausible stop order | Current movement or progress | Exact target still served | No unresolved service or track conflict | Trustworthy path preserved, if applicable | Counts as update 1 or 2? |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| _Evidence reference and time_ | _Yes / No_ | _Yes / No_ | _Yes / No_ | _Yes / No_ | _Yes / No_ | _Yes / No_ | _Yes / No_ | _Yes / No / Not applicable_ | _1 / 2 / Does not count_ |

| Recovery decision | Review entry |
|---|---|
| Trigger-specific evidence-unit release proved? | _Yes / No, with evidence_ |
| Two consecutive qualifying updates completed where governed? | _Yes / No / Not applicable_ |
| Feed-level recovery also required and complete? | _Yes / No / Not applicable_ |
| Every current Live admission gate reevaluated after update two? | _Yes / No / Not applicable_ |
| Public result after update one | _Must contain no restored exact countdown, primary row, or dependent guidance_ |
| Public result after update two | _Required_ |
| Did recovery improperly restore Expected or use missing movement/progress? | _Must be No_ |

## 9. Correction review

| Correction field | Review entry |
|---|---|
| Correction ID, authorized role, and decision time | _Required or None_ |
| Permitted class | _Suppress bad arrival / clarify alert segment / mark guidance unavailable / correct geometry or accessibility relationship_ |
| Evidence and exact scope | _Required_ |
| Before-and-after transformation | _Required_ |
| Effective period or release condition | _Required_ |
| Did it only reduce an unsupported claim or clarify already-supported scope? | _Yes / No_ |
| Did it create movement, a train, stop call, arrival, timestamp, schedule edition, equipment operation, recovery evidence, or clearance of a veto? | _Must be No_ |
| Original evidence and correction history preserved? | _Yes / No_ |
| Reversal recorded as a new linked decision? | _Yes / No / Not applicable_ |

Any correction that manufactures positive evidence is forbidden and blocks approval regardless of whether the resulting train later arrived.

## 10. Non-personal calibration slice

Calibration is permitted only after the original decision is reconstructed and the later outcome is recorded. A single case may identify a question; it cannot silently change a threshold.

| Calibration dimension | Review entry |
|---|---|
| Route | _Required_ |
| Station or exact directional stop | _Required_ |
| Normalized direction | _Required_ |
| Terminal or non-terminal context | _Required_ |
| Operating period | _Required; use an approved operational grouping or mark Unclassified_ |
| Decision or trigger class | _Required_ |
| Sample definition and fixed policy version | _Required_ |
| Outcome measure | _False positive / false removal / Holding duration / progress outcome / alert over-suppression / alert under-suppression / recovery failure / other governed measure_ |
| Comparable non-personal cases and exclusions | _Required_ |
| Evidence limitation | _Required_ |

### Personal-data exclusion

Confirm that the calibration set contains operational evidence only and excludes:

- rider account or profile;
- saved stations, saved trips, or commute windows;
- notification token or device identifier;
- precise rider location or location history;
- rider searches, taps, or personal travel history; and
- any key that could link the operational decision back to an individual rider.

| Privacy check | Result |
|---|---|
| All personal and linkable rider history excluded | _Yes / No — No blocks calibration use_ |
| Operational train and source identifiers retained only for reproducibility | _Yes / No_ |
| Proposed threshold change follows Product and Data Quality review rather than one-off correction | _Yes / No / No change proposed_ |

## 11. Reviewer decision and follow-up

| Final field | Review entry |
|---|---|
| Decision was evidence-supported at the time | _Yes / No / Inconclusive_ |
| Rider state and freshness were honest | _Yes / No / Inconclusive_ |
| Negative evidence retained precedence | _Yes / No_ |
| Suspect records were isolated from the primary board and corrections | _Yes / No_ |
| Recovery used only coherent qualifying evidence | _Yes / No / Not applicable_ |
| Correction manufactured no evidence | _Yes / No / Not applicable_ |
| Risk-register update required | _Risk ID and action / None_ |
| Calibration review required | _Question and responsible owner / None_ |
| Artifact returned to Draft? | _Path and reason / No_ |
| Blocking failure | _Yes / No; describe_ |
| Required correction and durable evidence link | _Required for any failure_ |
| Rerun result link | _Pending until completed / Not applicable_ |

Preserve the original result, every failure, the correction, and each rerun. A later passing run does not erase earlier evidence.
