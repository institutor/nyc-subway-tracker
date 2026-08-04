# Schedule fallback and currency policy

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§11–12, 31.3 scenarios 19–20, and 31.8 scenarios 43–44 and 49; arrival-truth and service-changes plan Task 10 `Artifacts` and `Ordered steps` |
| Owner | Product Truth Lead |
| Required reviewers | Product, Data Quality, Content, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | Pending — Truth Gate |

## Purpose and authority

This policy owns entry into schedule fallback, static-source selection, supplemented-edition supersession, schedule currency, and the rider presentation of a fallback arrival. The [route-level feed health policy](feed-health-policy.md) owns whether a relevant real-time route or feed group is **Unavailable**. The [source role and precedence matrix](source-role-and-precedence-matrix.md) owns source roles, the [evidence veto catalog](evidence-veto-catalog.md) owns negative evidence and its catalog-wide release gate, the [suppression, grace, and recovery policy](suppression-grace-and-recovery-policy.md) owns the two-update recovery sequence, and the [time and train continuity policy](time-and-train-continuity-policy.md) owns authoritative comparison time. The [approved transit product glossary](../contracts/transit-product-glossary.md) and [approved rider language rules](../contracts/rider-language-rules.md) continue to govern shared terms and public wording. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

This artifact is **Draft**. Its linked evidence remains **Pending — Truth Gate** under the [review and approval policy](../review-and-approval-policy.md), so its expected decisions are not approved scenario results.

## Fallback entry gate

Schedule fallback is a separate board state, not a weaker live-arrival state. It may begin only for the exact route or feed group that the feed-health policy has classified **Unavailable** and only after the cause-based precedence below admits fallback. Every other route or feed group is evaluated independently.

Fallback must not begin for any of these conditions by themselves:

- One expected train is missing from an otherwise healthy complete real-time snapshot.
- One train has stale movement evidence while its route or feed group remains healthy.
- A candidate fails its exact-stop, destination, direction, identity, movement, service-change, or track gate.
- The board has fewer than three admitted Live or Expected trains.
- Another route or feed group is Degraded or Unavailable.

During the published real-time replacement period, a static trip absent from a healthy full snapshot creates no fallback candidate and no cancellation claim. Static data never repairs a missing real-time trip or stop call. A Degraded group remains in its separately governed frozen **Live data updating** treatment.

### Cause-based precedence between preservation and fallback

One board scope cannot simultaneously present preserved real-time rows with **Live data updating** and Scheduled departures with **Live data unavailable**. Apply this decision:

1. **Age-based Unavailable admits fallback.** When the authoritative age of the last complete coherent snapshot is strictly greater than 180 seconds, the existing feed-age boundary independently admits fallback. If an eligible schedule and all veto checks pass, the separated Scheduled board replaces frozen preserved rows. Exactly 180 seconds does not admit this branch.
2. **An invalidating anomaly starts in preservation.** Timestamp regression, repeated update failures, invalid decoding, malformed or suspiciously empty content, a bulk drop, or simultaneous feed disappearance may make health Unavailable immediately even while the last complete coherent snapshot is no more than 180 seconds old. When prior coherent context exists, preserve it only as frozen context with **Live data updating** and run the two-fresh-coherent-snapshot recovery sequence. Scheduled departures are blocked during this branch.
3. **Existing age evidence can move the anomaly branch to fallback.** If recovery has not completed and the authoritative age of that last complete coherent snapshot becomes strictly greater than 180 seconds, the already approved age boundary—not an invented sustained-outage duration—admits the age-based fallback branch. Replace the frozen context rather than showing both. A qualifying schedule still must pass source, currency, coverage, hard-suppression carryover, and current-veto checks.
4. **Recovery takes the other exit.** If two consecutive fresh coherent snapshots arrive before the age-based fallback branch begins, feed recovery completes; reevaluate individual trains from the accepted live evidence and do not enter fallback.
5. **No preserved context.** If the group is Unavailable and no prior complete coherent board context exists, there is nothing to preserve. Fallback may proceed immediately when the Unavailable classification, schedule eligibility, and every veto are proven.

Exactly 181 whole seconds is sufficient for the age-based branch under the feed-health policy's input precision. No separate count, duration, “sustained” interval, or operator guess may be invented. An invalidating snapshot itself never supplies the age transition, clears its own anomaly, or counts as a recovery snapshot.

## Deterministic candidate selection

After the relevant route or feed group is proven Unavailable and the cause-based precedence gate admits fallback, apply current negative evidence first and then establish one positive schedule owner for the requested scope:

1. Determine supplemented coverage independently of whether the desired trip, departure, or stop appears. The coverage mask is the source-supported route or feed group, operating service date, effective interval, planning or fallback horizon, direction or operational axis where supplied, and other declared scope of the edition.
2. Select the newest validated, non-superseded supplemented GTFS edition whose coverage mask contains the requested scope and time and whose currency state is **Current schedule** or **Stale reference**. Within that mask, this edition is the sole positive schedule source.
3. If the owning supplemented edition contains an explicit coherent future departure at the exact directional stop, that record may continue through the remaining gates. If it omits the regular trip, departure, or stop, show no supplemented departure for that occurrence and do not backfill it from regular GTFS. The omission is not proof of cancellation, a bypass, no service, or complete change coverage.
4. Evaluate regular GTFS only when no usable supplemented coverage mask applies to the requested scope and time—for example, supplemented data is unavailable; no validated applicable edition exists; the request is outside every applicable edition's effective interval, service-date coverage, or horizon; timestamp evidence is unusable or quarantined; the only applicable edition is expired or **Topology only**; or a prior edition remains superseded inside an overlap without a newer usable supplemented owner.
5. If the eligible source contains no coherent future exact-stop departure, show no arrival estimate. The product does not invent service.

An edition's coverage-mask eligibility and a departure record's eligibility are separate decisions. Coverage-mask eligibility never depends on the desired occurrence being present. A departure record is eligible only when it is explicit in the owning source; retains coherent service date, occurrence, stop, pattern, destination, direction, and chronological time; and passes currency, veto, suppression, and all other gates below.

This is a conservative positive-source policy, not a claim that supplemented GTFS documents every operational change. MTA describes the feed as containing most, not all, planned changes. Inside a usable supplemented mask, an omission therefore blocks an optimistic regular-schedule resurrection but does not create negative operational evidence or rider-facing cancellation language.

Within overlapping coverage, the selector does not return to an earlier supplemented edition that a later validated edition superseded. Outside that overlap, an earlier edition may remain the newest eligible supplement for a scope inside its own still-valid coverage. If no usable supplement mask applies and regular GTFS cannot support the claim, the result is no estimate.

## Deterministic fallback-board generation

After fallback entry is valid, generate one Scheduled candidate list for each exact station directional stop and rider-facing direction within its passenger-serving operational axis. This process creates static Scheduled claims only. It never creates a live train instance, live stop call, countdown, or proof that service is operating normally.

Apply these steps in order:

1. **Establish the comparison instant and service-day chronology.** Use the authoritative comparison time from the time and train continuity policy. Map each source-supported operating service date and its scheduled stop time, including a time beyond `24:00`, to one unambiguous chronological New York instant. Consider only explicit trips whose source-supported service calendar makes that trip active on its operating service date. Do not derive the service date from the phone date or displayed clock time.
2. **Apply the supplemented coverage mask before enumeration.** Establish one positive source for the requested scope and time under the selector above. When a usable supplemented mask applies, exclude every regular-GTFS record inside that mask before occurrence matching, deduplication, or row construction. When no usable supplemented mask applies, regular GTFS may own only the uncovered requested scope.
3. **Enumerate explicit future departures at the exact stop.** Enumerate only from the owning source every explicit scheduled departure at the exact directional stop whose chronological instant is strictly later than authoritative comparison time. A departure exactly equal to comparison time or already past is excluded because static evidence cannot prove that it remains boardable. An owning supplemented edition's omission yields no row; it never opens a per-occurrence path back to regular GTFS. Do not add a grace period, roll a past time forward, repeat a prior-day trip, or synthesize a departure from a route identity, usual pattern, service interval, headway, station-complex match, opposite-direction stop, or missing stop time.
4. **Require a coherent scheduled occurrence.** Each candidate must retain a source-supported operating service date, route, stable scheduled-occurrence identity, exact directional stop, scheduled stopping pattern, actual scheduled destination, normalized rider-facing direction, and chronological departure instant. The pattern, destination, and direction must agree with the requested board. Missing, ambiguous, one-to-many, contradictory, wrong-stop, wrong-direction, or wrong-destination evidence excludes the affected occurrence; static data is not repaired by inference.
5. **Apply every exclusion before ordering.** Recheck source ownership, coverage mask, edition validation, currency, supersession, effective coverage, horizon, service-date coverage, explicit exact departure, and timestamp eligibility. Then apply all current resolved vetoes, material unresolved high-impact service-change decisions, planned-pattern exclusions, cancellations, short turns, station closures, track conflicts, and hard-suppression carryover. An excluded, suppressed, unavailable, quarantined, duplicate, or unresolved occurrence cannot consume a Scheduled position.
6. **Resolve duplicates and conflicts fail closed.** Collapse records only when canonical evidence proves they are the same scheduled occurrence within the owning source. Preserve distinct, coherently identified trains even when their public route, destination, and clock time match. If records conflict and neither one-to-one equivalence nor distinct occurrence identity can be proven, withhold the affected records and retain the supported limitation; do not choose the more optimistic record. Repeated wrappers or retrievals of unchanged canonical content create no additional row.
7. **Order eligible rows deterministically.** Sort first by the full chronological departure instant, never by the formatted clock label. For an exact-time tie, order numbered routes by numeric value, then lettered routes alphabetically, then shuttle routes alphabetically by their full rider-facing shuttle name, then any other source-approved public route identifier alphabetically by its full public label. Within the same route, order by normalized public destination name and then by the source-supported canonical scheduled-occurrence identity. These tie-breakers provide stable presentation only; they do not strengthen evidence, override source precedence, or imply that one tied train is more likely to run.
8. **Cap after ordering.** Take the first three eligible Scheduled rows for each exact rider-facing direction and operational axis. The cap is independent for the opposite direction and is never a three-row cap across the whole station complex. Where multiple route or feed groups independently qualify for fallback in the same direction, combine only their eligible Scheduled rows for this ordering and cap while retaining each row's route, group, source, and currency provenance. A healthy, Degraded, or preserved-recovery group contributes no Scheduled row, and one group's fallback never changes another group's health.

The Scheduled cap is separate from the Live and Expected next-three count. Scheduled rows neither fill a short live list nor displace an admitted Live or Expected train. Unaffected Live or Expected service may remain in its own governed list while an affected group's Scheduled rows remain visibly separated with **Live data unavailable**.

### Honest complete, partial, and empty results

After every exclusion and the final ordering:

| Eligible result for one exact direction | Required fallback-board state |
|---|---|
| Three or more | Show only the earliest three eligible Scheduled rows. Later scheduled records do not appear in the initial list and do not change the first three. |
| One or two | Show exactly those eligible rows and **No additional scheduled departures available.** Do not backfill from a past, ineligible, superseded, vetoed, ambiguous, opposite-direction, or out-of-coverage record. |
| Zero because no source can support an eligible future departure | Show no Scheduled row, keep **Live data unavailable** persistent, and show **No scheduled departures available.** This is not a claim that service has ended or that a train was cancelled. |
| Zero or partial because the owning supplemented edition omits a regular-GTFS occurrence inside its coverage mask | Do not resurrect that occurrence. Show only explicit eligible supplemented rows and the applicable neutral partial or empty copy. Add a service-change consequence only when independent current evidence supports it; omission alone proves neither cancellation nor a bypass. |
| Zero or partial because a resolved veto applies | Show only unaffected eligible rows and the narrowest supported resolved service-change consequence for the excluded scope. Do not expose the vetoed clock time or replace it with neutral gap copy when the narrower consequence controls. |
| Zero or partial because current high-impact evidence leaves material scope unresolved | Replace only the affected proposed claim with **Service change—arrival unavailable**, show no affected clock time, and preserve unrelated eligible Scheduled rows and official details as governed below. |
| Zero or partial because prior hard suppression has not cleared | Keep the affected claim absent and use only the neutral evidence-supported no-arrival treatment required below. Do not repeat an ended service-change cause or let static data satisfy recovery. |

The neutral empty and partial copy remains Draft and subject to Content approval with this artifact. Neither copy may be interpreted as proof of no service.

## Edition identity and supersession

Retain a distinct currency-edition identity, canonical schedule-content identity, transport and metadata wrapper observations, validation result, supported source version or chronology, publication time when supplied, first successful retrieval time, later successful retrieval observations, effective coverage, service-date coverage, and claim-scoped supersession relationships.

- Normalize the schedule into canonical semantic content before assigning currency-edition identity. Unchanged trips, stop times, service calendars, and effective schedule semantics remain the same currency edition even when a transport wrapper, source label or version wrapper, publication wrapper, filename, compression, or retrieval observation changes. Such wrapper-only changes cannot reset age or create supersession.
- A distinct currency edition requires independently validated changed canonical schedule content plus source-supported edition chronology. Retrieval order alone does not establish distinctness or later order.
- Once a distinct later edition is validated, it supersedes every earlier edition only for claims within their overlapping effective and service-date coverage. This is true even when the earlier edition still lists the same service date or a more optimistic trip; the selector cannot cherry-pick from the earlier edition inside the overlap.
- Supersession is monotonic for claims inside overlapping coverage. A later read failure, missing file, or repeated retrieval of old or wrapper-changed unchanged content cannot silently roll selection back to an earlier superseded edition.
- A later edition does not supersede an earlier edition for a claim outside their overlap. When that claim remains inside the earlier edition's own effective and service-date coverage, the earlier edition may remain the newest eligible supplement if it passes every other gate.
- A failed or unvalidated new edition never supersedes a validated edition and never erases the last validated copy. The retained validated copy continues aging from its original age anchor.
- Repeated retrieval of the same canonical schedule content is another observation of that currency edition, not a new edition. It cannot reset currency or remove supersession even when wrapper or publication metadata differs.
- When editions do not overlap, each remains eligible only within its own supported effective coverage. No coverage, publication time, validity, version order, or service is inferred from retrieval alone.

## Edition age and non-overlapping currency states

Calculate edition age against the authoritative comparison time governed by the time and train continuity policy, never the rider's device clock, phone date, manual setting, display clock, or device time zone. The general **small skew allowance** remains an uncalibrated policy value requiring observed evidence and Product and Data Quality approval; this policy assigns no numeric value. It may be recorded during timestamp review, but it is not permission to accept a future publication time for schedule currency, classify a negative schedule age, or normalize or clamp negative age to zero.

Use a supplied publication time as the age anchor only when it is source-supported, non-regressed, internally and chronologically non-contradictory, and less than or equal to authoritative comparison time. A supplied time at exactly authoritative comparison time produces age zero and may enter **Current schedule** when every other gate passes. Any positive future offset produces negative raw age and cannot enter **Current schedule**, **Stale reference**, or **Topology only**, even when that offset might fall within the uncalibrated small skew allowance.

When source publication time is genuinely unavailable, use the first successful retrieval time of that distinct validated currency edition. Never invent a publication time. An identical or wrapper-only later retrieval does not change the age anchor. A failed new edition does not change the retained edition's anchor, so its age continues increasing.

If a supplied publication timestamp is future by any positive amount, regressed, or contradictory, quarantine that edition from departure eligibility. Do not silently replace the unusable supplied timestamp with the latest retrieval time or first retrieval, call the edition Current, clamp its age to zero, or guess chronology. Continue to regular GTFS or no estimate until the conflict resolves. “Genuinely unavailable” is limited to the absence of a supplied publication timestamp; it does not include a supplied but unusable timestamp.

Only an edition with an accepted age anchor and authoritative comparison enters the three-state currency partition. Apply the first matching state:

| Currency state | Exact boundary and controlling conditions | Departure use |
|---|---|---|
| **Current schedule** | Age is greater than or equal to zero and less than or equal to 2 hours; and the edition is validated, non-superseded for the claim, and inside effective and service-date coverage. | May support a clearly labeled scheduled clock time during eligible fallback, subject to every current veto. |
| **Stale reference** | Age is greater than 2 hours and less than or equal to exactly 24 hours; and the edition is validated, non-superseded for the claim, and inside effective and service-date coverage. | May support a visibly stale scheduled clock time in the separated fallback state, subject to every current veto. It may not produce a normal-looking board. |
| **Topology only** | Age is greater than 24 hours, **or** the edition is superseded for the claim, **or** the claim is outside the edition's effective or service-date coverage. | May explain network topology only. It makes no departure or arrival-time claim. Continue to regular GTFS as the next candidate. |

Exactly age zero and exactly 2 hours are **Current schedule**. Any positive duration beyond 2 hours through exactly 24 hours is **Stale reference**. Exactly 24 hours is Stale reference; any positive duration beyond 24 hours is **Topology only**. For editions admitted to currency classification, these states have no overlap or gap. A negative raw age is never admitted to the partition. Supersession or coverage failure controls regardless of apparent age; unusable timestamp evidence is quarantined before classification.

## Negative evidence and service changes

Fallback changes the positive source; it does not weaken precedence. Before showing any scheduled time, apply every current scoped bypass, suspension, missing-stop rule applicable to a healthy live claim, planned-pattern exclusion, station closure, short turn, cancellation, unresolved reroute, and invalidating track conflict supported by the evidence catalog and service-change policies.

A resolved veto suppresses the scheduled claim within its supported scope and preserves the narrowest supported explanation. **Service change—arrival unavailable** requires independent current high-impact evidence of a governed possible bypass, reroute, short turn, suspension, closure, or invalidating track/path change, as applicable, plus material scope uncertainty that affects the proposed claim. When both conditions hold and the effect on the proposed schedule remains unresolved, replace the optimistic schedule for only that affected scope with exactly:

**Service change—arrival unavailable**

Do not show the scheduled clock time beside or beneath that replacement. Preserve unrelated service and the official service-change message where the governing service-change policy requires it. A delay-only alert, generic **Affected** marker, missing station or direction metadata, or contradiction alone cannot create arrival unavailability. None of those facts proves normal service either. Missing or contradictory scope can contribute to unavailability only when the required independent current high-impact evidence already exists and the uncertainty materially affects the claim. Neither the absence of an alert nor supplemented coverage proves normal service.

### Catalog-wide release carryover

A claim previously hard-suppressed by a resolved catalog veto remains suppressed after its alert ends or adverse condition clears until the row-specific release prerequisite and the catalog-wide release gate both pass. Recovery requires two consecutive fresh coherent accepted updates newer than the adverse evidence. Across the pair, prove all five Task 9 conditions: stable identity, plausible stop order, current movement or stop progress, continued service at the exact directional target, and no unresolved service or track conflict; then reevaluate every Live gate.

The first qualifying update restores nothing. Static, supplemented, or regular schedule data is not a recovery update. An Unavailable feed supplies no qualifying recovery update. Therefore a static trip during fallback cannot restore the previously hard-suppressed claim, an exact countdown, primary eligibility, guidance, or a Scheduled arrival. Keep **Live data unavailable** visible and use only a neutral evidence-supported no-arrival treatment; do not preserve or invent a stale service-change cause after that cause has ended. Apply this carryover only to the previously suppressed claim. Unrelated claims continue through their own independent fallback, veto, and eligibility decisions.

## Rider presentation

An eligible fallback board is visually and semantically separate from the Live and Expected next-three board. It shows only the deterministic first zero to three rows for the exact direction supplied by the generation rules above. For every shown scheduled departure:

- Show a scheduled New York clock time, never a countdown or advancing minute value.
- Show **Scheduled** as its evidence state.
- Keep **Live data unavailable** persistently visible for the affected route or feed group.
- Show the currency age and its truthful anchor (**Published** when an accepted publication time exists, otherwise **First retrieved**), the latest successful **Last retrieved** age, and the effective operating service date. When currency age and last-retrieved age differ, surface both together so a fresh retrieval cannot hide an older publication/first-retrieval age.
- For **Stale reference**, show exactly **Stored schedule—service changes may differ**.
- Keep every known active veto and unresolved service-change decision in force.
- Never say **Live**, **Expected**, or **on time**, imply normal service, mix the row into the live next-three list, or use it to fill a live-board gap.

Repeated retrieval may update the truthful **Last retrieved** observation, but it cannot make the edition younger, change its currency state, or hide the edition's original publication/first-retrieval currency age.

## Required decision record

For every fallback, veto, or no-estimate decision, retain:

1. The exact route or feed-group scope, the evidence that classified it Unavailable, the controlling Unavailable cause, the last complete coherent snapshot age, and the cause-based preservation-versus-fallback decision.
2. Proof that fallback did not arise from one missing train, a single candidate failure, or another group's health.
3. The requested route/feed-group, direction or operational-axis, operating service date, effective time or horizon, exact directional stop, and any proposed scheduled departure.
4. Every evaluated supplemented currency edition's canonical schedule-content identity, wrapper observations, validation result, source-supported order, publication time when supplied, timestamp acceptance or quarantine reason, first successful retrieval, latest retrieval, complete declared coverage mask, age anchor, authoritative comparison time, age, currency state, and claim-scoped supersession disposition.
5. The selected positive-source owner, proof that coverage was decided independently of occurrence presence, every regular record excluded by an applicable supplemented mask, and the regular GTFS eligibility decision only when no usable supplemented mask applied.
6. Every current veto or unresolved service change, its independent high-impact evidence where applicable, material scope uncertainty, and whether it suppressed or replaced the schedule.
7. Any prior hard suppression, row-specific prerequisite, both recovery updates, all five Task 9 recovery conditions, and Live-gate result.
8. Every explicit scheduled record considered; its service-day chronology and future/past decision; its occurrence identity, exact stop, route, destination, and direction decision; its source-selection, duplicate/conflict, exclusion, veto, and eligibility disposition; and the specific honest partial or empty-state reason when fewer than three rows remain.
9. The complete pre-cap order, every exact-time tie-break value, the final zero-to-three rows for each exact direction, and proof that the opposite direction and unrelated route or feed-group health were evaluated independently.
10. The selected source or no-estimate result and the exact rider presentation, including both currency age and last-retrieved age when they differ.

The [schedule currency boundary cases](schedule-currency-boundary-cases.md) define the required acceptance evidence. No scenario becomes approved merely because this policy states its expected decision.
