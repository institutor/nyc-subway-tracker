# Source evidence register

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§6–8, 12, 22, 27, and 35; arrival-truth and service-changes plan Task 2 `Artifacts` and `Ordered steps` |
| Owner | Data Quality Lead |
| Required reviewers | Product, Data Quality, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | Pending — Truth Gate |

## Purpose and authority

This register records the official evidence, product role, claim boundary, and review currency for source-role and veto decisions. It creates no new product rule and contains only official evidence already named in section 12 of the [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md). Source roles are owned by the [source-role and precedence matrix](source-role-and-precedence-matrix.md); negative evidence is owned by the [evidence veto catalog](evidence-veto-catalog.md).

## Registered official evidence

The specification states that these materials were current as of **July 30, 2026**.

| Official evidence | Revision or currency recorded in the approved specification | Registered arrival-truth role | Claim boundary |
|---|---|---|---|
| [MTA Developer Resources](https://www.mta.info/developers) | Official MTA developer page checked July 30, 2026; no fixed document revision is stated. | Official source landing point for subway real-time, regular GTFS, supplemented GTFS, and related MTA documentation. Supports the recorded distinction between normal static service and the hourly supplemented feed containing most, not all, planned changes for the next seven calendar days. | Does not itself create a live train, stop call, countdown, proof of normal service, or authority to override a veto. Mutable cadence and feed fields require revalidation before launch and at source-version change. |
| [MTA GTFS-Realtime Reference for the New York City Subway](https://www.mta.info/document/134521) | Version **1.1**, dated **September 7, 2012**; remained the reference linked from the official MTA developer page when checked July 30, 2026. | Supports full-dataset and trip-replacement-period behavior, complete ordered remaining stop calls, movement timestamps, current train claims, and track-conflict caveats. Fresh subway GTFS-RT is the only positive source class that can authorize a live exact countdown after all admission and veto checks pass. | A static trip absent from a healthy full snapshot is not restored. A live prediction cannot overcome a bypass, suspension, closure, missing exact live stop, planned-pattern exclusion, unresolved reroute, or invalidating track conflict. |
| [MTA GTFS Alerts Feed Documentation](https://www.mta.info/document/90881) | Dated **December 2021**; remained the official linked alert reference when checked July 30, 2026. | Supports active-period, route, impact, severity, disruption, and rider-instruction evidence used to scope, explain, or veto service claims. | Alerts do not establish movement, train existence, a live stop call, or a countdown. Missing metadata or absence of an alert does not prove normal service, and alert text cannot revive a stale or suppressed train. |
| [MTA Stations Affected specification, pinned revision](https://github.com/nymta/gtfs-documentation/blob/9569903801492454cf813f659fcfb5be91750d25/feeds/subway/gtfs-rt/stations_affected.md) | Pinned revision **`9569903801492454cf813f659fcfb5be91750d25`**, the head of the MTA documentation repository main branch retrieved July 30, 2026; described in the specification as 2026 station-affected documentation. | Supports optional station- and direction-level impact metadata for significant planned changes and the rule that values within one impact record are jointly scoped. | Station and direction metadata are optional. Missing metadata never proves an unaffected station or direction. Generic **affected** metadata is not enough to assert a bypass unless structured scope and official text agree. |
| [MTA service-status guidance](https://www.mta.info/developers/service-status-box) | Official guidance current as of the specification's July 30, 2026 evidence review; no fixed revision date is stated. | Supports official service-status context and human-readable service-change explanation alongside resolved route, station or segment, and direction scope. | Service-status text is explanation, not movement evidence. It cannot create or revive a live arrival, cannot clear stale or suppressed evidence, and cannot prove an exact bypass without agreeing structured scope. |
| [Official GTFS-Realtime best practices](https://gtfs.org/documentation/realtime/realtime-best-practices/) | Official reference current as of the specification's July 30, 2026 evidence review; no fixed revision date is stated. | Supports review of validity, freshness, completeness, and feed-quality expectations before positive train evaluation. | Product thresholds, ranking rules, confidence states, and calibration are product policies derived from official semantics, not MTA guarantees. Best practices do not create a train or authorize a countdown without fresh subway GTFS-RT and all admission checks. |

## Source-class coverage

| Product source class or decision | Registered official evidence |
|---|---|
| Validity and freshness first | MTA GTFS-Realtime Reference; Official GTFS-Realtime best practices |
| Hard negative evidence before prediction | MTA GTFS-Realtime Reference; MTA GTFS Alerts Feed Documentation; MTA Stations Affected specification; MTA service-status guidance |
| Fresh subway GTFS-RT as the only positive basis for a live countdown | MTA GTFS-Realtime Reference |
| Supplemented GTFS as hourly preferred planned baseline and first schedule fallback, covering most, not all, planned changes for the next seven calendar days | MTA Developer Resources, as summarized by approved specification §§6.2 and 12 |
| Regular static GTFS as normal long-range and stable-topology baseline, never a repair for a missing live stop | MTA Developer Resources and MTA GTFS-Realtime Reference, as summarized by approved specification §§6.1, 6.3, and 12 |
| Optional alert station and direction scope; generic **affected** limitation | MTA GTFS Alerts Feed Documentation; pinned MTA Stations Affected specification; MTA service-status guidance |

## Currency and revalidation rule

Open-data records and operational documentation are mutable. Revalidate feed fields, publication cadence, revision links, and effective source semantics immediately before launch and at every source-version change. A revalidation records the checked source, observed revision or effective date, check date, role impact, reviewer, and any artifact returned to **Draft**.

The six sources above are the complete external evidence set for this register. Adding another external source requires an approved specification change; it cannot be introduced through this Draft register.
