# Location and personal-data rules

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§28.1–28.3; nearby-station and offline-experience plan `Product artifact map` and Task 12 `Product artifacts`, `Ordered steps`, and `Acceptance evidence`; Task 12 brief; Task 13 applying update for specification §§29.2 and 30.1–30.3 measurement privacy |
| Owner | Privacy Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending |
| Scenario results | Not run — Pending; PRIV-L01, PRIV-M01, PRIV-S01, PRIV-Q01, PRIV-N01, MEAS-A04, scenario 22 privacy application, Task 13 aggregate lineage, and Nearby Task 14 saved-state and privacy evidence are absent |

## Purpose and authority

This contract owns permitted location purpose, personal-data minimization and retention boundaries, private-by-default treatment, broad rider reset and deletion assurance, operational-quality diagnostic separation, the nearby/offline notification-permission boundary, and future synchronization constraints. It defines what personal context may exist, why, for how long, what the rider can do with it, and the full-utility fallback when it is absent.

The [zero-tap startup and location-permission flow](zero-tap-startup-and-permission-flow.md), Task 2, owns the exact location-prompt timing, five permission outcomes, denial fallback sequence, and approved-specification scenario 22. The [saved stations and rider-controlled personalization contract](saved-station-and-personalization-contract.md), Task 11, owns one saved station's fields and visible per-station controls. The [offline trip card and manual progress contract](offline-trip-card-and-progress-contract.md), Task 9, owns capture and use of exactly one active offline trip. This contract supplies their privacy and lifecycle boundary without redefining their product behavior.

The companion Commute workstream owns saved-commute fields, notification eligibility, prompt copy and permission states, per-commute pause, schedule, severity, restoration, and accessibility controls, delivery data, and notification-token lifecycle. Nearby/offline defines only where a notification prompt cannot originate and the explicit handoff required before Commute may own one.

Arrival, service-change, accessibility, equipment, positioning, guidance, and schedule owners retain operational truth. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict. Shared concepts retain their meanings in the [transit product glossary](../contracts/transit-product-glossary.md), visible and spoken wording remains subject to the [rider language rules](../contracts/rider-language-rules.md), and lifecycle changes follow the [review and approval policy](../review-and-approval-policy.md).

This artifact is **Draft**. The authoritative [Gate 0 exit record](../quality/gate-0-exit-record.md) remains **NO-GO — GATE 0 NOT PASSED**; public boards blocked. Every fixture below is expected behavior with status **Not run — Pending**. No observed permission, minimization, deletion, diagnostic-separation, notification, privacy, or Task 14 evidence exists.

## Governance and provenance reconciliation

The [artifact index](../artifact-index.md) registers §§28.1 and 28.3 for this artifact, but omits §28.2. Task 12 plan step 5 and the Task 12 brief explicitly assign the nearby/offline notification-permission boundary here, so this artifact records §§28.1–28.3 in its source metadata. Product Governance Lead reconciliation of the index is **Pending** before any lifecycle advancement.

Related applying artifacts also have unresolved governance questions:

| Artifact | Current index or artifact record | Applying rule and required disposition |
|---|---|---|
| [Zero-tap startup and location-permission flow](zero-tap-startup-and-permission-flow.md), Task 2 | Index and metadata cite §§14.1–14.2, 28.1, and scenario 22, while the flow already prohibits a notification prompt during startup and foreground return. | Record §28.2 as applying provenance through this contract. Task 2 applies only the no-prompt boundary; Commute retains the prompt. Reconciliation is Pending. |
| [Saved stations and rider-controlled personalization contract](saved-station-and-personalization-contract.md), Task 11 | Index registers Product, Accessibility, Content, Privacy and spec §26. The contract records policy-required Data Quality review because saved opens present operational truth. | Preserve the Data Quality mismatch and add §28.3 as applying provenance for its per-station reset/delete boundary. This contract owns broad assurance. Reconciliation is Pending. |
| [Offline trip card and manual progress contract](offline-trip-card-and-progress-contract.md), Task 9 | Index registers Product, Accessibility, Data Quality, Content. The artifact already records Privacy as mandatory for saved origin, destination, accessibility need, contingency, and manual progress. | Privacy must review the same fixed Task 9 version; index and metadata reconciliation remains Pending. Task 12 does not edit Task 9. |
| [Offline content and validity contract](offline-content-and-validity-contract.md), Task 8 | Index registers Product, Accessibility, Data Quality, Content, while the stored-content inventory includes saved stations, commutes, and trip cards. | The Privacy-review question must be resolved by Privacy and Product Governance before Task 8 advances. Task 12 does not edit Task 8 or treat the omission as waived. |

This contract does not edit the artifact index or out-of-scope Tasks 8 and 9, manufacture reviewer decisions, or treat any mismatch as approval.

## Non-negotiable privacy and truth rules

1. Current location may rank nearby entrances and stations and support the Map owner's rider-requested or approved initial centering behavior only. Core arrivals do not require precise or continuous background location.
2. Approximate location is a complete supported permission outcome, not an error, degraded product state, or reason to upsell precise access.
3. Location, permission, saved context, manual progress, or personal preference cannot admit a train, reorder upstream arrivals, clear a bypass or service-change veto, prove an entrance usable, verify accessibility or guidance, establish equipment operation, or trigger a notification.
4. Saved stations, saved commutes, one active offline trip, and rider preferences are private by default and available without an account.
5. No coordinate trail, permission grant or denial history, passive station visits, inferred home or work, movement history, personal travel history, or default sharing or synchronization may be created.
6. Accessible Route Only remains a rider-controlled hard constraint through every permission, fallback, reset, and deletion flow. No privacy action silently turns it off.
7. Operational-quality analysis remains separate from rider identity and personal context. If that separation cannot be maintained, do not collect the diagnostic record.
8. Absence, denial, reset, or deletion of personal context never weakens arrival, service-change, accessibility, equipment, schedule, offline-honesty, or guidance safeguards.

## Purpose, minimization, retention, control, and fallback matrix

No row authorizes a hidden history or a broader implementation field. “Retain” means only the minimum state named in that row; it never authorizes raw coordinates, passive observations, or a cross-row join key.

| Personal or contextual state | Permitted purpose | Minimum and retention rule | Rider control | Fallback when absent, declined, or cleared |
|---|---|---|---|---|
| Current precise location | Supply one current high-precision input to Task 3 for entrance and station ranking and to the Map owner for rider-requested or approved initial centering | Use transiently for the active ranking or centering request. Do not retain the coordinate, request trace, or derived path after the request ends. A rider-visible ranked shell or centered Map pose may persist only as the separately governed preserved context; it cannot be reverse-engineered or retained as location history. | Grant, limit, or revoke through operating-system settings; choose a station or request Map centering at any time. | Use current approximate location if granted; otherwise use Task 2's exact denial order. Map retains its governed pose or initial non-location state. |
| Current approximate location | Supply one current coarse input for supported station ordering and approximate Map centering without requiring precision | Use transiently for the active ranking or centering request. Do not retain the coarse coordinate, request trace, or a sequence of results. A visible ranked shell or Map pose may persist only as preserved context, never as a coordinate trail. | Keep approximate permission, choose a station, request Map centering, or change operating-system permission deliberately. No product upsell interrupts utility. | Use Task 2's exact denial order if no current approximate result is available. Map retains its governed pose or initial non-location state. |
| Current location-permission state | Decide whether Task 2 may request precise, approximate, or no current location | Read only the current operating-system state when needed. Retain no grant, denial, prompt, settings-open, or state-transition history. | The rider controls the setting in the operating system; the product provides a deliberate route to settings without repeated prompts. | Apply the current denied flow without an error, account gate, or utility loss. |
| One last-used station | Restore one useful station identity when location is unavailable or denied | Retain one explicitly opened or selected station complex and constituent identity. A later explicit station open or selection replaces it; do not append a history or retain the selecting coordinate. | Choose another station, clear fallback context through broad reset, or delete covered personal data. | If absent, show saved stations; if none, open the bottom-anchored picker. |
| Explicit recent stations | Put a minimal list of rider-opened or rider-selected stations before the keyboard | Retain only distinct station identities created by explicit open or selection, never passive visibility or proximity. The reviewed product version must declare a fixed maximum before collection; evict the oldest explicit item at that bound. Until a bound exists, do not retain recents. No hidden or unbounded history is allowed. | Remove covered recents through broad reset or personal-data deletion. | Show popular stations and **Search stations**; never fabricate recents. |
| Preserved screen and Map context | Restore the last coherent station, direction, filters, Accessible Route Only, map tuple, open disclosure, scroll, focus, and reading position before refresh | Retain only one last coherent context per preserved surface, replacing rather than appending state. Do not attach coordinates, permission history, passive visits, or a travel timeline. | Navigate or explicitly change context; broad reset clears personalization and fallback context, and deletion removes covered preserved context. | Show Task 2's non-claim Nearby structure and reachable station choice; Map uses its governed initial state without inferred history. |
| Saved-station preferences | Restore Task 11's exact explicitly saved station, constituent, entrance, direction and actual destination, filters, Accessible Route Only state, common-destination input, optional time window, and Active/Paused state | Retain only records the rider explicitly saves. Keep until one-item delete, broad personalization reset where applicable, or covered personal-data deletion. Never store operational truth as preference. | Inspect, edit/save, pause, per-station reset, one-item delete, broad reset, or covered personal-data deletion. | Saved utility is optional. Use last-used or picker behavior without inferred replacement or diminished truth. |
| One active offline trip and manual progress | Keep Task 9's explicitly captured trip readable underground and retain rider-confirmed cursor state | Retain exactly one active card, its minimum governed content, and manual cursor. A new explicit capture replaces it; explicit clear or covered deletion removes it. Never archive completed trips, infer motion, or create trip history. | Use Task 9's manual control, explicitly replace or clear the active card, or delete covered personal data. | Keep maps, stations, Saved, and station choice usable; show no blank trip placeholder or inferred trip. |
| Saved commute boundary | Hold an explicitly saved on-device commute window and only the companion-owned controls the rider chose | Commute owns exact fields and lifecycle. No nearby/offline action expands them, enables alerts, creates a token, or retains commute travel history. Per-commute delete and broad covered deletion must remove the companion-owned record before completion is claimed. | Use Commute-owned inspect, edit, pause, schedule, severity, restoration, accessibility, alert, and delete controls; broad deletion requests the companion result. | No commute or alert is required for Nearby, Map, Saved, station boards, offline maps, or offline trips. |
| Operational-quality diagnostics | Reproduce and evaluate feed, transformation, suppression, equipment, or product-quality behavior | Retain only the minimum non-personal source/time/scope/decision fields defined below, for the shortest reviewed investigation period with an owner and deletion or aggregation end recorded before collection. No indefinite retention. | No rider profile or personal diagnostic history exists. Authorized quality reviewers control the non-personal record under its owning quality process. | If purpose, separation, access, or deletion end cannot be established, do not collect; rider utility is unchanged. |
| Task 13 measurement | Produce coarse aggregate usefulness and guardrail readouts | Task 13 may consume only pre-reviewed coarse counts, rates, and timing distributions with no rider identifier, stable join key, row-level journey reconstruction, or personal context. Do not retain underlying personal events for later aggregation. | Measurement cannot require an account, broader permission, or an opt-out penalty; any future rider-facing control is Task 13/Privacy-owned. | Omit the measure when a coarse non-personal aggregate cannot answer it. Never weaken product safeguards to make it measurable. |
| Optional synchronization | A later release may copy explicitly selected saved context between rider-chosen devices | Not release-enabled. Until a separately reviewed opt-in purpose, exact field inventory, destinations, security, retention, access, conflict, deletion, and disablement contract exists, no data leaves the device for sync. | Future sync must be separate, explicit, reversible, item-visible, and optional; declining it preserves the complete no-account capability set. | Device-local saved, map, trip, and commute utility remains complete. No default sharing, backup, or sync occurs. |

No unspecified duration, capacity, purpose, destination, identifier, or retention extension is approved by this Draft. A future value requires the same fixed-version Privacy review and cannot be inferred by an implementation.

## Location choice parity and fallback

### Precise location

Precise location can support ranking to an exact useful entrance only when Task 3 also has verified entrance coordinates, entry permission, constituent and direction relationships, closure and service scope, and any applicable complete-path evidence. Precision alone never authorizes exact walking time, **nearest**, usable, accessible, or current service wording.

Map may consume one current precise result only when the rider requests centering or during the Map owner's approved initial Nearby-to-Map transition when no preserved Map state exists. It never silently recenters, replaces a rider-selected station, or retains the coordinate after the request.

### Approximate location

Approximate location preserves complete core arrivals, every passenger-serving direction, current service-change treatment, station choice, Saved, Map, offline content, and Accessible Route Only. Rank only to supported precision. If exact entrance order cannot be established, keep station-level choices and the bottom picker; do not label approximation an error or ask for precise access as the price of utility.

Map may center only to the precision the approximate result supports and only under the same rider-requested or approved initial-transition rule. A preserved Map pose remains context, not location history, and a later result never silently recenters it.

### Denied location

Location denial follows Task 2's exact order:

1. One last-used station when it exists.
2. Otherwise saved stations when any exist.
3. Otherwise the bottom-anchored station picker, with permitted explicit recents and popular stations before a rider-invoked keyboard.

Every branch refreshes current truth for the selected station when available and retains the same fail-closed arrival, bypass, service-change, accessibility, equipment, schedule, offline, and guidance rules. No branch infers current location, calls a stored choice nearest, or pressures the rider to broaden access.

Temporary location failure preserves the last coherent screen and remains distinct from denial, global Offline, or transit-data failure. A later location result may update suggestions but never silently replaces the rider-selected station.

## Private by default and no-account boundary

Device-held last-used station, bounded explicit recents, preserved context, saved preferences, one active trip and manual cursor, and on-device saved commutes are private by default. They are not public, shared with other riders, attached to operational train-quality analysis, or available to an account by default.

An account is not required to grant or deny location, view arrivals, choose a station, use approximate or denied fallback, open saved stations, use Map and stored maps, keep Accessible Route Only on, open one offline trip, use manual progress, or use one-device commute windows. Optional future account or synchronization behavior cannot remove, delay, weaken, or relabel this device-local utility.

## Rider controls, reset, and deletion assurance

Task 11's **Reset station preferences** clears one saved station's entrance, direction and actual-destination context, filters, common-destination input, and time-window influence while leaving its card saved. Task 11's **Delete saved station** removes only that card and its station-specific personalization. Neither action is the broad control defined here.

| Broad control | Covered result | Required visible consequence | Must remain |
|---|---|---|---|
| **Reset all personalization** | Clear last-used fallback, permitted recent stations, cross-station default and ordering influence, every saved-station optional entrance/direction/filter/common-destination/time-window preference, and any companion-confirmed commute personalization in scope. Saved station identities may remain as neutral, private, openable cards only when the pre-action explanation says so. | Before confirmation, list every category cleared and every retained category. Afterward, show category-level results and any companion-owned item still Pending. Do not call the reset complete while a covered influence remains. | Official arrivals, service changes, station and entrance records, accessibility/equipment truth, offline maps, structural topology, and the current/global Accessible Route Only hard constraint. |
| **Delete personal data** | Remove one last-used station, all permitted recents, covered preserved screen/Map context, all saved-station records and personalization, the active offline trip and manual progress, and every companion-confirmed saved-commute, notification preference or token, or future synchronized copy included in the disclosed scope. | Before confirmation, list on-device, companion-owned, and any future synchronized categories. Afterward, show Deleted, Not present, or Pending/failed for each. Never claim completion until every covered local, queued, companion, notification, and synchronized copy is absent. | Official operational information, public station/route structure, device-held offline maps, rights-cleared reference content, and current operating-system permission. |

Neither broad control silently turns off an active/current/global Accessible Route Only constraint. Its retained on state is disclosed in the confirmation and result; the rider changes it only through the explicit accessibility control. Deleting a stored station record also deletes that record's stored Accessible Route Only field, but the active safety constraint on the current surface remains on until the rider explicitly changes it.

Reset or deletion does not change operating-system location or notification permission. The result provides a deliberate route to the applicable operating-system settings and states that system permission is unchanged. It never opens settings automatically, repeats a prompt, or describes denial as a failure.

Deletion removes personal context, not official information. It cannot erase arrivals, service changes, accessibility or equipment facts, stations, routes, structural offline maps, reference patterns, or evidence needed by their non-personal owners. Conversely, preservation of official or offline content cannot be used to hide an undeleted covered personal record.

## Notification-permission boundary

Nearby, station boards, Map, Saved, and offline trip use never trigger, preload, bundle, or condition utility on a notification-permission prompt. The location value explanation and operating-system location prompt never include notification consent.

Saving a station, opening a map, capturing or advancing an offline trip, saving a commute without enabling alerts, foregrounding, reconnecting, encountering a disruption, or denying location does not authorize a notification prompt. The only nearby/offline handoff is an explicit rider action to enable a first commute alert. After that action, the companion Commute experience owns:

- all pre-prompt explanation and exact prompt copy;
- notification permission states, denial, retry, settings route, and recovery;
- the disruption-only default;
- per-commute pause, schedule, severity, restoration, and accessibility controls;
- eligibility, suppression, deduplication, timing, delivery, tokens, retention, and deletion; and
- every observed notification scenario and approval.

Location and notification permission are never bundled. Denying either leaves Nearby, station choice, current arrivals, Map, Saved, offline maps, one active offline trip, manual progress, and no-account utility available. Location state never triggers an alert or becomes notification evidence.

## Diagnostic separation and measurement

An operational-quality diagnostic record may contain only fields needed to reproduce one governed operational decision:

- source type and accepted source time;
- route, station, constituent, directional-stop, direction, segment, or operational trip/train scope when required;
- equipment identity and exact connection or path scope when required;
- transformation or normalization version and result;
- admission, suppression, quarantine, fallback, or other decision and exact reason; and
- review purpose, access roles, owner, creation time, and deletion or approved aggregation end.

“Operational trip/train scope” means an official operational identifier needed to reproduce source behavior. It never means a rider's saved commute, active offline trip, manual cursor, search, or travel history.

The record must not contain or join to a rider name, account, device or advertising identifier, notification token, stable pseudonymous key, IP-derived identity, precise or approximate rider location, permission state, last-used or recent stations, preserved context, saved station or commute, common destination, time window, accessibility preference, active trip, manual progress, search, passive visit, inferred home/work, or movement history.

No shared stable join key, lookup table, reversible pseudonym, common timestamp-and-device tuple, or downstream export may reconnect operational-quality analysis to personal context. Access and retention are purpose-limited. If the allowed record cannot be produced without personal context or a join path, do not collect it.

The [nearby and offline measurement plan](measurement-plan.md), Task 13, may receive only coarse non-personal aggregates derived under a reviewed aggregation step. It may not receive row-level rider events or link permission, station, saved, trip, commute, accessibility, and quality behavior into a person or journey. A measure that cannot be produced under this boundary is omitted.

The Task 13 intake is limited to a measure identifier, fixed product and artifact versions, a reviewed broad observation window, one permitted coarse segment or separately approved limited intersection, aggregate numerator and denominator, honest Not observed/Not measured/Inconclusive counts, owner-supplied outcome category, aggregation purpose and owner, access roles, review disposition, retention end, and a non-personal evidence reference. It contains no exact station, selected route, query, saved item, commute, trip leg, manual cursor, map pose, raw or derived coordinate, precise joinable timestamp, rider feedback text, or value capable of reconstructing a journey.

Permission and Accessible Route Only comparisons are aggregate labels only; they do not authorize row-level collection of those states. The default readout compares one dimension at a time. Any limited intersection requires Privacy approval, a reviewed aggregation floor, and a documented rider-safety need. An all-dimension join is prohibited. Small or unsafe cells are suppressed and reported Inconclusive rather than exported. This Draft invents no numerical aggregation floor.

An approved aggregate may remain only for the reviewed release decision, audit, and correction period recorded with that aggregate. Transient inputs end at the approved aggregation or deletion point. The aggregate is re-reviewed if its purpose, dimensions, lineage, access, retention, or ability to be joined changes. Release reporting never converts an aggregate into a rider profile or a new operational truth source.

## PRIV-L01 — Location-choice parity

| Fixture field | Expected result |
|---|---|
| Inputs | Run otherwise equivalent first-use and warm-launch journeys with current precise, current approximate, and denied location. The denied branches cover one last-used station, saved stations only, and neither. |
| Expected visible result | Precise may support an exact entrance rank only with complete ranking evidence. Approximate keeps complete core arrivals and a picker without error or upsell. Either permitted precision may support only rider-requested or approved initial Map centering at supported precision, with no later silent recenter. Denial follows last-used, saved, then picker and never opens a blank search screen. Every branch preserves Accessible Route Only and current truth safeguards. |
| Retained result | Neither location result nor permission-transition history remains. At most one explicit last-used station and only reviewed bounded explicit recents may support later fallback. |
| Prohibited result | Background location requirement; retained coordinate; repeated or bundled prompt; approximate error; coerced precision; denial utility loss; inferred current location; silent Map recenter; location-admitted train; cleared bypass; inferred accessibility/guidance; or notification trigger |
| Fixed product version | Not recorded |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Review date | Not recorded |
| Evidence status | **Not run — Pending** — fixed-version visible, assistive, state, retention, and Task 14 evidence are absent |

## PRIV-M01 — Minimized bounded state

| Fixture field | Expected result |
|---|---|
| Inputs | Explicitly open/select stations through the reviewed recent-station bound, preserve one screen and Map context, save one station, capture one active offline trip, replace each applicable single-state record, then invoke broad reset. |
| Expected visible result | The picker shows only explicit bounded recents; replacement does not create history; the reset lists covered and retained categories and reports each result without disabling Accessible Route Only. |
| Retained result | No coordinate or permission history, passive visit, inferred home/work, movement trail, prior last-used station, prior preserved context, or prior active trip exists. Only the current bounded or explicitly saved state allowed by the matrix remains. |
| Prohibited result | Undeclared recent bound; unbounded list; passive recent; hidden archive; trip history; preserved-context timeline; inferred habit; silent accessibility change; or reset-complete claim while covered influence remains |
| Fixed product version | Not recorded |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Review date | Not recorded |
| Evidence status | **Not run — Pending** — fixed-version inventory, before/after state, visible, assistive, and Task 14 evidence are absent |

## PRIV-S01 — Private saved data, broad reset, and deletion

| Fixture field | Expected result |
|---|---|
| Inputs | Device-local saved stations, one active trip/manual cursor, and a companion-owned saved commute exist without an account. Run Task 11 per-station reset and delete separately, then broad reset and covered personal-data deletion. |
| Expected visible result | Per-station controls affect one record only. Broad reset and deletion disclose exact scope, preserve official information and offline maps, state that operating-system permission and active Accessible Route Only remain unchanged, expose settings deliberately, and show each covered category as Deleted, Not present, or Pending/failed. |
| Retained result | No covered personal record remains before deletion is called complete. No default sharing or sync copy exists. Official operational and structural content remains. |
| Prohibited result | Public/default-shared saved data; account requirement; per-station action mislabeled broad; deleted official information; removed offline map; silent accessibility disablement; changed OS permission; fabricated companion deletion; or completion while any covered copy remains |
| Fixed product version | Not recorded |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Review date | Not recorded |
| Evidence status | **Not run — Pending** — fixed-version control, storage, companion, visible, assistive, and Task 14 evidence are absent |

## PRIV-Q01 — Operational-quality separation

| Fixture field | Expected result |
|---|---|
| Inputs | Reproduce one feed or suppression decision using the minimum allowed source, time, route/station/direction, operational trip or equipment, transformation, and decision fields; attempt variants containing a rider key, saved context, precise location, and a reversible join. |
| Expected visible result | Authorized quality review receives the non-personal operational record only. Rider-facing product utility and state do not change. Task 13 receives only an approved coarse aggregate or no measure. |
| Retained result | The record has a purpose, owner, access roles, and deletion or aggregation end. Every personal and joinable variant is rejected and not retained. |
| Prohibited result | Rider identity; stable pseudonym; device/account/token; rider location; permission; saved station/commute; active trip/manual progress; inferred journey; reversible join; indefinite retention; downstream personal export; or collection when separation fails |
| Fixed product version | Not recorded |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Review date | Not recorded |
| Evidence status | **Not run — Pending** — fixed-version diagnostic schema, access, rejection, retention, aggregate, and Task 14 evidence are absent |

## PRIV-N01 — Notification prompt separation

| Fixture field | Expected result |
|---|---|
| Inputs | Launch Nearby, grant/deny location, open Map and Saved, capture/open/advance an offline trip, save a station, save a commute without alerts, then explicitly enable a first commute alert and separately deny notification permission. |
| Expected visible result | No nearby/offline or save-only step shows a notification prompt. Only explicit first commute-alert enablement hands off to Commute-owned explanation, permission state, disruption-only default, and per-commute controls. Notification denial returns to Commute without changing nearby/offline utility or location state. |
| Retained result | Nearby/offline creates no notification token, prompt history, alert eligibility, or bundled consent record. Any Commute-owned data remains within its separately reviewed boundary. |
| Prohibited result | Prompt on launch, Map, Saved, station save, offline trip, progress, disruption, foreground, reconnect, location request/denial, or commute save alone; bundled permissions; default alert; utility loss after denial; or Task 12-invented prompt copy/state |
| Fixed product version | Not recorded |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Review date | Not recorded |
| Evidence status | **Not run — Pending** — fixed-version prompt trace, visible, assistive, permission-state, companion, and Task 14 evidence are absent |

## Ownership and pending evidence

| Decision | Authoritative owner | Task 12 boundary | Current disposition |
|---|---|---|---|
| Location request timing, permission outcomes, denial fallback, temporary failure, and scenario 22 | [Zero-tap startup and location-permission flow](zero-tap-startup-and-permission-flow.md), Task 2 | Supply purpose, minimization, retention, and no-notification-prompt constraints; do not reassign scenario 22. | Draft; scenario 22 and PRIV-L01 Not run — Pending |
| Practical entrance and station ranking | [Useful station and entrance ranking rules](station-ranking-and-entrance-rules.md), Task 3 | Supply only one transient permitted location result; location creates no truth. | Draft; ranking evidence Pending |
| Per-station fields, saved open, ordering input, pause, reset, and one-item delete | [Saved stations and rider-controlled personalization contract](saved-station-and-personalization-contract.md), Task 11 | Own private-by-default, lifecycle, broad reset/deletion, sync, and §28.3 assurance. | Draft; SAVE-C01, SAVE-R01, and PRIV-S01 Not run — Pending |
| One active card and manual progress | [Offline trip card and manual progress contract](offline-trip-card-and-progress-contract.md), Task 9 | Bound retention to one explicit active card and include it in broad deletion without redefining use. | Draft; Task 9 Privacy reconciliation and evidence Pending |
| Stored content and reference maps | [Offline content and validity contract](offline-content-and-validity-contract.md), Task 8 | Official/structural content survives personal deletion; record unresolved Privacy reviewer question for saved inventory. | Draft; Privacy question and evidence Pending |
| Saved commute and notifications | Companion Commute workstream | Own no-prompt surfaces and explicit enablement handoff only; all prompt, control, delivery, and data decisions remain companion-owned. | Companion artifacts and evidence absent |
| Operational-quality diagnostics | Arrival Truth, accessibility/equipment, and product-quality owners under the review policy | Enforce minimum non-personal schema, purpose/access/retention, and no join path. | PRIV-Q01 Not run — Pending |
| Coarse measurement | [Nearby and offline measurement plan](measurement-plan.md), Task 13 | Permit only the reviewed aggregate schema, one coarse segment by default, privacy-approved limited intersections, honest small-cell suppression, purpose-limited retention, and omission when separation fails. | Draft; MEAS-A04 and aggregate-lineage evidence Not run — Pending |
| Observed privacy acceptance | `docs/product/nearby-offline/acceptance-evidence.md`, Task 14 | Record all five PRIV fixtures, prohibited results, fixed version, visible and assistive output, and storage/permission traces. | Planned artifact and observations absent |

## Scenario traceability

| Source or fixture | Expected Task 12 result | Current evidence |
|---|---|---|
| §28.1 | Location serves ranking only; approximate and denied outcomes retain utility; no continuous background location or default movement history exists. | **Not run — Pending** |
| §28.2 | Nearby/offline never prompts; only explicit first commute-alert enablement hands off to Commute-owned disruption-only and per-commute controls. | **Not run — Pending** |
| §28.3 | Saved stations and commutes are private by default; data is minimized; diagnostics are identity-separated; reset and deletion are explicit and truthful. | **Not run — Pending** |
| Task 13 measurement boundary | Only reviewed coarse non-personal aggregates enter the measurement readout; no row-level rider event, journey reconstruction, all-dimension join, or unsafe small cell is accepted. | **Not run — Pending** |
| PRIV-L01 | Precise, approximate, and denied journeys retain choice parity, truth safeguards, accessibility constraint, and no retained coordinate trail. | **Not run — Pending** |
| PRIV-M01 | Every allowed state is explicit, singular or bounded, replaceable, and free of passive or inferred history. | **Not run — Pending** |
| PRIV-S01 | Per-item and broad controls remain distinct; deletion removes every covered personal copy but never official or offline structural content. | **Not run — Pending** |
| PRIV-Q01 | Operational-quality analysis uses only minimal non-personal provenance with no rider identity or join path; Task 13 receives coarse aggregates only. | **Not run — Pending** |
| PRIV-N01 | No nearby/offline prompt occurs; only explicit first commute-alert enablement enters the Commute-owned notification flow, and denial preserves utility. | **Not run — Pending** |

Approved-specification scenario 22 remains owned by Task 2's [zero-tap startup and location-permission flow](zero-tap-startup-and-permission-flow.md). PRIV-L01 applies privacy and minimization checks to that flow; it does not reassign, duplicate, or claim scenario 22.

Every observation must identify one fixed product version and retain its input state, expected visible result, observed visible and assistive result, retained/deleted state, prohibited-result checks, reviewer decisions, date, and durable evidence link. Written expectation, an unversioned screenshot, or an inferred storage result is not evidence.

## Draft review checklist

| Review question | Draft contract result | Evidence required before approval |
|---|---|---|
| Does every allowed personal or contextual state have one purpose, minimum/retention rule, rider control, and fallback? | Yes by contract; not observed. | Fixed data inventory and PRIV-M01 |
| Can precise or approximate location be retained, trailed, or required for core arrivals? | No. | PRIV-L01 request, memory, and permission traces |
| Is approximate location complete utility rather than an error or upsell? | Required here; not observed. | PRIV-L01 visible and assistive comparison |
| Does denial follow one last-used station, saved stations, then bottom picker without weakening truth or accessibility? | Yes by Task 2 consumption; not observed. | Scenario 22 and PRIV-L01 |
| Can location admit a train, clear a bypass, prove accessibility or guidance, or trigger notifications? | No. | Cross-domain prohibited-result fixtures |
| Are saved stations, one active trip, and saved commutes private and usable without an account or default sync? | Required here; not observed. | PRIV-S01 local/storage/access review |
| Are Task 11 per-station controls distinct from broad reset and deletion? | Yes. | SAVE-R01 and PRIV-S01 before/after traces |
| Can reset or deletion remove official information or offline maps, silently disable Accessible Route Only, change OS permission, or claim completion early? | No. | PRIV-S01 category-level result and settings trace |
| Can Nearby, Map, Saved, or offline trip use trigger or bundle notification permission? | No. | PRIV-N01 prompt trace |
| Are all prompt copy, permission states, per-commute controls, delivery data, and notification lifecycle left with Commute? | Yes. | Companion contract and PRIV-N01 review |
| Can diagnostics contain rider identity, personal context, a join key, or exist when separation cannot be maintained? | No. | PRIV-Q01 schema, access, rejection, and deletion evidence |
| Can Task 13 receive row-level rider events, an all-dimension join, an unsafe small cell, or reconstruct a journey? | No; only the reviewed coarse non-personal aggregate schema is permitted, with one segment by default and omission when separation fails. | MEAS-A04, aggregate lineage, access, retention, small-cell suppression, and rejection evidence |
| Have the §28.2 index omission, Task 2 applying provenance, Task 11 Data Quality/§28.3 mismatch, Task 9 Privacy mismatch, and Task 8 Privacy question been reconciled? | No. | Product Governance Lead record and all applicable reviewer decisions |
| Does this Draft claim Gate 0 passage, any PRIV fixture, scenario 22, Task 14 evidence, Commute approval, deletion completion, optional sync enablement, or release readiness? | No. The decision remains **NO-GO — GATE 0 NOT PASSED**; public boards blocked. | Fixed evidence, all six reviews, governance reconciliation, companion decisions, and later release gate |
