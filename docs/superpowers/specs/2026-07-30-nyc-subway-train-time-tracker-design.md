# NYC Subway Train Time Tracker

## Product, data logic, and rider experience specification

**Status:** Product design  
**Date:** July 30, 2026  
**Launch scope:** NYC Subway first  
**Product posture:** Trust-first station board  

---

## 1. Executive summary

The product promise is:

> Show riders the next trains they can actually board—not merely trains that were scheduled.

The app opens to nearby subway stations and immediately shows up to three trustworthy arrivals in each useful direction. It treats a predicted arrival as a claim that must be supported by current movement, stopping-pattern, direction, service-change, and feed-health evidence. If that evidence conflicts or becomes stale, the app removes exact countdowns and explains why.

This is not a generic map with countdowns added. It is a rider decision tool optimized for the ten seconds before entering a station:

- Which nearby entrance and station should I use?
- Which direction and train can I board?
- Is the train live, held, rerouted, or only scheduled?
- Will it actually stop where I need it?
- Is my complete step-free path working?
- Where should I stand for the best exit or transfer?
- Do I need to change my commute before reaching the turnstile?

The subway launches as a complete standalone experience. LIRR and Metro-North are later expansions, not mixed into the first release. Subway car-crowding indicators remain absent until trustworthy car-level public data exists.

---

## 2. Goals and product boundaries

### 2.1 Goals

1. **Immediate utility:** Show useful nearby arrivals without search, typing, account creation, or setup.
2. **No false bypass arrivals:** Never show a train when current authoritative data says—or leaves materially unresolved—that it may bypass the station.
3. **Honest degradation:** Make live, holding, uncertain, scheduled, stale, and offline states visually and verbally distinct.
4. **Contextual disruption information:** Explain only the alerts that affect the rider's station, direction, trip, or accessible path.
5. **Underground usefulness:** Keep maps, saved stations, trip instructions, and structural routing available without service.
6. **Accessibility as a route constraint:** Validate the complete street-to-platform-to-street path, not a station-level wheelchair icon.
7. **Low-noise commuting:** Notify saved commuters only when an actionable disruption overlaps their actual commute.
8. **One-handed operation:** Keep essential controls within thumb reach and make the most important information readable at a glance.

### 2.2 Primary riders

- **Daily commuter:** Wants the quickest trustworthy decision and only actionable alerts.
- **Accessibility-dependent rider:** Needs proof that every required elevator and directional platform path is available.
- **Occasional rider or visitor:** Needs plain-language directions, destinations, and transfer guidance rather than local shorthand.
- **Low-connectivity rider:** Needs the trip to remain understandable after entering the subway.

### 2.3 Launch scope

Included:

- NYC Subway routes and shuttles.
- Nearby station boards and station details.
- Live arrivals, planned schedules, reroutes, skipped-stop protection, and service alerts.
- Offline service maps, saved stations, and saved trip instructions.
- Direction-aware accessibility and live elevator/escalator status.
- Verified front/middle/back platform guidance.
- Smart commute windows and disruption-only notifications.

Deferred:

- LIRR and Metro-North.
- Subway car-level crowding until supported by a trustworthy source.
- Ticket purchase, fare management, social feeds, rider chat, or user-reported train positions.
- Claims of exact train-car positioning when only platform-zone geometry is known.

### 2.4 Product language rules

- Never say **Good service** merely because no alert exists. Use **No active alerts**.
- Never say **On time** when only a schedule is available.
- Never use a countdown for stale or static data. Show a scheduled clock time.
- Never call a held train a ghost. Describe the evidence: **Holding**, **Last moved 3 min ago**, or **Arrival uncertain**.
- Never call an offline route **accessible now**. Use **Structurally step-free; live elevator status unavailable**.
- Never promise a transfer. Use **Likely**, **Tight**, or **Uncertain**.

---

## 3. Core product contract

### 3.1 Arrival-board invariant

A train may appear as a live arrival for a station and direction only when:

1. The relevant real-time feed is healthy and current.
2. The train is a coherent current trip instance.
3. The exact directional stop appears in its ordered remaining-stop sequence.
4. The destination and direction agree with that sequence.
5. No active service-change evidence indicates a bypass, suspension, closure, or unresolved reroute.
6. No actual-versus-scheduled-track conflict invalidates downstream predictions.
7. The arrival time is still plausible given movement and stop progress.

If any required condition is unknown, the train does not receive an exact countdown.

### 3.2 Conservative-error policy

The product deliberately prefers:

- A temporarily missing arrival over a confidently displayed train that bypasses the rider.
- A visible **Arrival unavailable** state over an invented estimate.
- A frozen **Holding** state over a countdown that continues while the train is stationary.
- Fewer than three trustworthy arrivals over filling the board with weak schedule guesses.

### 3.3 Defensible guarantee

No public feed can guarantee what a physical train will do after its latest update. Dispatchers can reroute a train between snapshots, and some alert metadata remains incomplete.

The defensible guarantee is:

> The app never shows a train when current MTA data identifies—or leaves materially unresolved—the possibility that the train will bypass that station.

---

## 4. Conceptual transit model

The app must reason about the following rider-facing concepts separately.

### 4.1 Station complex

The named place riders recognize, such as Times Sq–42 St. A complex can contain multiple constituent stations, lines, platforms, fare-control areas, transfer passages, and accessibility conditions.

### 4.2 Directional stop and platform

The specific route-facing boarding location. Direction is not inferred solely from a station name. The same complex can be accessible for one line or direction and inaccessible for another.

### 4.3 Train instance

A physical or operational train running a particular route, direction, service date, stopping pattern, and destination. A train instance must remain continuous even if its published trip identifier changes.

### 4.4 Stop call

A train's current claim that it will serve a specific directional stop at a predicted time. Stop calls from the past disappear; future calls must never be reconstructed from a normal static schedule.

### 4.5 Service pattern

The ordered set of stops a train is expected to serve, including express/local behavior, short turns, reroutes, terminal changes, and skipped stops.

### 4.6 Alert impact

A disruption or planned-work statement resolved, where possible, to:

- Active time window.
- Route.
- Station or segment.
- Direction.
- Impact type.
- Severity.
- Rider instruction.

Being “affected” does not automatically mean being bypassed. The impact meaning must distinguish delay, local-to-express operation, skipped stop, reroute, partial suspension, full suspension, and station closure.

### 4.7 Accessible path

A complete chain from a specific street entrance through fare control, mezzanines, transfer passages, required elevators or ramps, the correct platform, boarding area, and destination exit.

### 4.8 Guidance record

A verified relationship between train direction and a platform zone—front, middle, or back—that improves a particular exit or transfer. Each record has a verification date and a confidence state.

---

## 5. Time and identity rules

### 5.1 Service day

Subway service is associated with an operating service date, not simply midnight-to-midnight calendar time. Trips may use times beyond 24:00 or begin before the nominal service date. The product must preserve that service-day meaning across midnight.

### 5.2 Time zone and daylight-saving changes

All rider-facing times use New York local time. Repeated or missing clock times during daylight-saving transitions must not create duplicate trains, reverse chronology, or negative waits.

### 5.3 Train continuity

Real-time and static trip identifiers do not always match reliably. The app must not duplicate a train merely because its identifier changes.

A likely identity change can be joined only when evidence is one-to-one and coherent:

- Same internal train marker when available.
- Same route, direction, and service date.
- Same ordered next-stop sequence.
- Compatible track and destination.
- Similar predicted time.
- Replacement appears immediately after the earlier identity disappears.

An ambiguous match is not merged. The weaker duplicate is quarantined from the primary board until continuity becomes clear.

---

## 6. Source roles and truth hierarchy

Truth is evaluated by claim type, not by assuming one feed is universally correct.

| Priority | Evidence | Product role |
|---|---|---|
| 1 | Feed validity and freshness | Reject stale, malformed, incomplete, or time-regressed snapshots before evaluating trains. |
| 2 | Hard negative evidence | A bypass, suspension, missing live stop, planned-pattern exclusion, closure, or track conflict vetoes an arrival. |
| 3 | Fresh subway GTFS-RT | The only positive basis for a live countdown. |
| 4 | Supplemented GTFS | The preferred planned-service baseline and first schedule fallback. |
| 5 | Regular static GTFS | Normal long-range schedule and stable topology baseline. |

### 6.1 Fresh subway GTFS-RT

Real-time data controls current train existence, assigned status, remaining stops, predicted times, movement state, and near-term stopping pattern.

Within a route's published trip-replacement period:

- The real-time roster replaces static trips.
- A scheduled trip missing from a healthy full real-time snapshot is not restored from static data.
- The product does not confidently name the missing static trip as cancelled unless it can be matched reliably; it simply does not show it.

### 6.2 Supplemented GTFS

The supplemented schedule is the preferred static source because it contains most planned service changes for the next seven calendar days and is updated hourly.

It is used for:

- Future journey planning outside the real-time horizon.
- Planned service-pattern validation.
- Clearly labeled schedule fallback during a genuine real-time outage.

It is not proof that service is normal. It includes most, not all, changes.

### 6.3 Regular static GTFS

The regular schedule describes normal service and may include some long-term changes. It is used for:

- Stable route and station relationships.
- Long-range planning beyond the supplemented horizon.
- Last-resort schedule fallback.

It never fills missing stops into a live train.

### 6.4 Service alerts

Alerts contribute active periods, routes, stations, directions, severity, disruption type, and rider instructions.

Station- and direction-specific metadata is used when present, but it is optional. Missing station metadata never proves a station is unaffected. Structured metadata and human-readable content must agree before a generic “affected” marker is treated as a specific bypass.

### 6.5 Elevator and escalator status

Equipment inventory establishes what each machine connects and whether it belongs to an ADA path. Current-outage data changes the availability of that exact path edge. An empty, failed, incomplete, or stale outage response is **Unknown**, not “all working.”

---

## 7. Arrival admission and ordering

### 7.1 Candidate generation

For each station and direction:

1. Consider current real-time train instances for the relevant route feeds.
2. Require the exact directional stop in the ordered remaining-stop list.
3. Normalize the destination and rider-facing direction from the actual remaining pattern.
4. Apply service-change, track, freshness, identity, and movement gates.
5. Rank only admitted arrivals.

### 7.2 Primary next-three list

The next-three list contains the earliest trustworthy boardable arrivals. It does not count quarantined or uncertain trains toward the three.

If a held train is operationally relevant, show it as a separate warning row above or below the trustworthy list. This lets the rider see the held train without losing visibility into the next three moving options.

If fewer than three arrivals qualify, show fewer than three and explain the gap:

- **Live arrival information is limited.**
- **Service change—some arrivals hidden.**
- **No additional verified trains in the live horizon.**

### 7.3 Sorting

Arrival ordering uses evidence-adjusted boardability:

1. Live and moving.
2. Assigned and expected to depart.
3. Live but holding, displayed separately.
4. Uncertain, displayed only in an expandable secondary area.
5. Scheduled, used only in a clearly separated fallback state.

Predicted times alone never outrank confidence.

---

## 8. Service-change reconciliation

### 8.1 General decision rule

Negative evidence vetoes positive prediction. When authoritative sources disagree about whether the train will stop, the app fails closed until the conflict resolves.

### 8.2 Planned changes

For near-term planned service:

1. Establish the effective service pattern from supplemented GTFS.
2. Resolve active planned alerts to route, station or segment, and direction.
3. Compare each live remaining-stop sequence with the effective planned pattern.
4. Suppress a target stop excluded by the planned pattern.
5. Admit a novel rerouted stop only when the live sequence is coherent and supporting change evidence resolves the operational path.

### 8.3 Unplanned changes

For unplanned disruptions:

- A fresh live stop sequence is the primary positive evidence.
- An explicit alert for a skipped station, suspension, closure, or reroute is a veto.
- If an alert describes a bypass or reroute but lacks enough station detail to construct a reliable stop pattern, hide arrivals for the unresolved affected route and direction.
- Delay-only alerts do not suppress a train; they influence its status and explanation.

### 8.4 Example: F trains via the E line

- Keep the route identity as **F**.
- Show **Via E line** beside the destination.
- Do not show the F at original F stops absent from its current remaining-stop sequence.
- Show the F at an E station only when the exact station-direction appears in its live sequence and the change is not contradicted.
- Place the relevant explanation next to the arrival or suppressed-service state, not on a separate generic alert page.

### 8.5 Track conflict

If the actual track differs from the scheduled track outside normal terminal behavior, downstream predictions are unreliable. Quarantine that train from scheduled station boards until a later coherent update shows it rejoined a trustworthy path.

### 8.6 Conflict outcomes

| Condition | Outcome |
|---|---|
| Live sequence includes stop; no contradiction | Show live arrival. |
| Live sequence omits stop; static schedule includes it | Suppress. |
| Active bypass alert conflicts with a live stop prediction | Suppress and explain the service change. |
| Supplemented pattern excludes stop; live data conflicts without a resolved operational change | Suppress until resolved. |
| Live feed unavailable; supplemented trip exists; no active conflict | Show scheduled clock time. |
| Alert is active but impact cannot be resolved safely | Hide affected arrivals and show the alert. |

---

## 9. Feed health and freshness

### 9.1 Route-level health

Health is evaluated per real-time route/feed group. A failure affecting one group must not turn every subway line into scheduled mode.

### 9.2 Initial freshness policy

These thresholds are starting product policy and must be tuned against observed route and terminal behavior:

- **Current:** Feed and train evidence no older than 90 seconds.
- **Degraded:** 91–180 seconds.
- **Unavailable:** More than 180 seconds, repeated failed updates, invalid decoding, or timestamp regression.
- **Alert context current:** Alert snapshot no older than ten minutes.

A stale alert snapshot does not prove normal service. Where an unresolved active change may affect a station, the board fails closed.

### 9.3 Bulk-drop protection

A single snapshot that suddenly loses a large share of normal train entities is treated as a possible feed problem, not mass cancellation.

Degraded mode begins when evidence includes:

- Roughly 40% or more of normal entities disappearing at once.
- Several route feeds disappearing together.
- A feed timestamp moving backward.
- A malformed or suspiciously empty full snapshot.

The last coherent state is preserved, its countdowns stop decrementing, and the UI says **Live data updating**. Exact countdowns return only after two fresh coherent snapshots.

---

## 10. Arrival confidence and ghost-train policy

Confidence is expressed as rider-understandable states, not a pseudo-precise score.

| State | Default evidence | Rider treatment |
|---|---|---|
| **Live** | Healthy feed; assigned train; movement or stop progress within 90 seconds | Rounded countdown: **3 min · Live** |
| **Expected** | Assigned physical train at origin; no movement yet; departure not materially overdue; stable across two updates | Range: **Expected in 6–8 min** |
| **Holding** | Feed is fresh but movement or stop progress is older than 90 seconds | Freeze time: **Holding near 14 St · last moved 2 min ago** |
| **Uncertain** | No movement beyond 180 seconds, identity churn, implausible jump, stale feed, or track conflict | Remove exact minute and de-rank: **Arrival uncertain** |
| **Scheduled** | Live feed unavailable | Clock time: **Scheduled 10:42 · live data unavailable** |

### 10.1 “Due” behavior

- Show **Due** for no more than 60 seconds when movement remains fresh.
- After 60 seconds without progress, freeze and show **Holding**.
- After 120 seconds, remove the exact event from the primary next-three list while retaining the held train in the secondary status area.

### 10.2 Unusual dwell

Station and terminal dwell expectations differ. A train is flagged when its dwell exceeds the greater of:

- Two minutes plus a small operating margin.
- The observed high-percentile dwell for that station, route, direction, and operating period.

An unusual dwell alone never deletes a train.

### 10.3 Hard suppression

A train is removed from the board when:

- The target is no longer in the remaining-stop sequence.
- The entity is missing from two consecutive healthy full snapshots or for at least 60 seconds.
- Its arrival has expired and no continuing train or movement evidence remains.
- An impossible stop-order regression is confirmed twice.
- It is the weaker member of a confidently detected duplicate.
- A cancellation, bypass, suspension, or track conflict invalidates it.

Suppressed records remain available for internal quality review so false removals and missed ghosts can be measured.

### 10.4 Recovery

Exact countdowns return only after two fresh coherent updates confirm:

- Stable identity.
- Plausible stop order.
- Current movement or stop progress.
- The target remains in the stopping pattern.
- No unresolved service or track conflict exists.

---

## 11. Schedule fallback

### 11.1 Trigger

Fallback begins only when the relevant real-time feed is genuinely unavailable. It does not begin because one expected train is missing from an otherwise healthy full dataset.

### 11.2 Fallback order

1. Current supplemented GTFS.
2. Regular GTFS when supplemented data is unavailable, expired, or outside its horizon.
3. No arrival estimate when neither schedule is valid for the service date.

### 11.3 Rider presentation

- Replace countdown minutes with scheduled clock times.
- Show a persistent **Live data unavailable** label.
- Show the schedule's last-updated or effective date when relevant.
- Continue applying known active service-change vetoes.
- Never say **on time**.

When a current service change is unresolved, do not show the optimistic schedule. Show **Service change—arrival unavailable**.

---

## 12. Evidence sources

The design reflects the following official materials current as of July 30, 2026:

- [MTA Developer Resources](https://www.mta.info/developers)
- [MTA GTFS-Realtime Reference for the New York City Subway](https://www.mta.info/document/134521)
- [MTA GTFS Alerts Feed Documentation](https://www.mta.info/document/90881)
- [MTA Stations Affected specification](https://github.com/nymta/gtfs-documentation/blob/main/feeds/subway/gtfs-rt/stations_affected.md)
- [MTA service-status guidance](https://www.mta.info/developers/service-status-box)
- [Official GTFS-Realtime best practices](https://gtfs.org/documentation/realtime/realtime-best-practices/)

MTA documentation notes that the regular subway GTFS represents normal service, while the hourly supplemented feed contains most—but not all—changes for the next seven days. The subway real-time reference defines full-dataset and replacement-period behavior, complete remaining stop calls, movement timestamps, and track-conflict caveats. The 2026 station-affected documentation adds optional station- and direction-level impact metadata for significant planned changes.
