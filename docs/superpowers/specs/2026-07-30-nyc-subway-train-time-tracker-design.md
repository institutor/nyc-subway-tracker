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

---

## 13. Experience architecture

The app is organized around the rider's immediate decision rather than around datasets or a system-wide line-status list.

### 13.1 Primary destinations

The persistent bottom navigation contains:

1. **Nearby:** Zero-tap station boards.
2. **Map:** Current, typical weekday, and late-night service views.
3. **Commute:** Saved commute windows and actionable disruptions.
4. **Saved:** Stations and journeys available online or offline.

Settings, accessibility preferences, search, and line filters open from bottom sheets or bottom-anchored controls. They do not displace the primary arrival content.

### 13.2 State preservation

When the rider moves between Nearby, Station, and Map, preserve:

- Selected station.
- Direction.
- Route filters.
- Accessible-route-only setting.
- Destination used for positioning guidance.
- Current map position and scale.
- Active trip progress.

Returning to the app should restore context immediately, then refresh it. A background refresh must not jump the rider back to the top or change direction unexpectedly.

### 13.3 No account dependency

An account is not required for:

- Nearby stations.
- Live arrivals.
- Search.
- Saved stations.
- Offline maps.
- Accessible-route-only mode.
- Platform guidance.
- Commute windows on one device.

If cross-device synchronization is offered later, it remains optional.

---

## 14. Zero-tap Nearby experience

### 14.1 Startup sequence

On every normal launch after location permission has been granted:

1. Render the last coherent nearby-station shell immediately.
2. Request a current location fix.
3. Rank nearby station complexes by useful entrance access.
4. Load current arrivals, local service changes, and route-critical accessibility status.
5. Replace cached content without disrupting the rider's reading position.

The app never opens to a blank search field.

### 14.2 First-use permission

The operating system's initial location prompt is the only unavoidable first-use interaction. Before the prompt, explain the immediate benefit in one sentence:

> Use your location to show nearby subway entrances and live arrivals.

If permission is declined:

- Show the last-used station if one exists.
- Otherwise show saved stations.
- Otherwise open a bottom-anchored station picker with recent and popular stations before the keyboard.

The app remains usable without precise or continuous location.

### 14.3 Nearest-station ranking

“Nearest” means shortest practical walk to a useful entrance, not shortest straight-line distance to a station centroid.

Ranking considers:

- Actual entrance coordinates.
- Entry permission at the entrance.
- Which constituent station and directions the entrance serves.
- Estimated street walking time.
- Active entrance or station closures when known.
- The rider's accessible-route-only setting.
- Whether the station has a trustworthy arrival in the rider's likely direction.

When accessible mode is on, rank by the nearest verified accessible entrance and complete path, not the nearest staircase.

Closely colocated constituent stations are grouped into a single station-complex card. The rider should not see duplicate “nearby” results for parts of the same connected complex.

### 14.4 Default Nearby content

Show the three most useful nearby station complexes. Each card includes:

- Station name.
- Approximate walking time and best entrance.
- Route bullets.
- Accessibility state.
- A concise, station-specific disruption flag when relevant.
- Up to three trustworthy arrivals for each useful direction.

Both directions are visible without a search. On small screens, the station's primary direction remains expanded and the other direction is one thumb tap away within the same card.

### 14.5 Direction language

Use rider-recognizable, station-specific language:

- **Uptown & The Bronx**
- **Downtown & Brooklyn**
- **Queens-bound**
- **Manhattan-bound**
- **To Jamaica Center**

Always pair the direction with the actual destination or terminal. “Northbound” and “southbound” may appear as secondary accessibility or operational labels, not as the only rider-facing description.

### 14.6 Refresh behavior

- Refresh automatically when the app returns to the foreground.
- Keep a bottom-third refresh control reachable by thumb.
- Support pull-to-refresh as a secondary gesture, never the only method.
- Show **Updated 18 sec ago** when freshness is relevant.
- Stop animating or decrementing times when live data becomes stale.

---

## 15. Station board

The station board expands one nearby card into a complete operational view.

### 15.1 Header

The header includes:

- Station-complex name.
- Route bullets.
- Walking time and selected entrance.
- Saved-state control.
- Accessible-path summary.
- Localized disruption status.

The header remains compact so the next arrivals stay above the fold.

### 15.2 Direction and route controls

Direction switching, reversing, route filtering, and refresh controls remain in the bottom third.

Rules:

- One tap switches direction.
- A prominent reverse-direction action changes both the displayed board and positioning orientation.
- Route filters use official bullets plus text.
- Filters never hide an active service change affecting a filtered route without leaving a visible warning.
- The chosen direction persists while the rider moves between the station and map.

### 15.3 Arrival row

Each arrival row contains only information needed to decide:

- Route bullet.
- Actual destination.
- Rounded arrival or scheduled clock time.
- Evidence state: Live, Expected, Holding, Uncertain, or Scheduled.
- Express/local or reroute behavior when it differs from normal.
- Platform state: Confirmed, Expected, or Check station signs.
- Front/middle/back guidance when verified and relevant.

Tapping a row reveals:

- Remaining stops.
- Localized alert explanation.
- Last movement.
- Why the confidence state was assigned.
- Transfer and destination guidance.

### 15.4 Alert placement

Alerts appear where their consequence is experienced:

- A station closure at the station header.
- A direction-specific bypass beside that direction.
- A train-specific delay on that train.
- A transfer disruption in the trip guidance.
- An elevator outage on the affected accessible path.

A system-wide alert inbox is available as a secondary view, but generic alerts never crowd out immediate arrivals.

### 15.5 Empty and degraded states

Examples:

- **No verified live arrivals in this direction.**
- **Service change—arrivals are hidden until the stopping pattern is confirmed.**
- **Live data unavailable. Showing scheduled times.**
- **This line is not serving this station right now.**
- **Location unavailable. Showing your last station.**

Every empty state offers one useful next action, such as viewing the other direction, opening the map, or selecting a nearby station.

---

## 16. Underground-first visual and interaction design

### 16.1 Visual hierarchy

The glance order is:

1. Minutes or operational state.
2. Route bullet and destination.
3. Direction and service exception.
4. Platform or accessibility warning.
5. Secondary detail.

Large arrival values are readable at arm's length. The interface avoids dense tables, fine gray text, and reliance on subtle color differences.

### 16.2 Dark mode

Dark mode is the default regardless of time of day:

- Near-black background.
- High-contrast off-white primary text.
- Brighter white for the most important arrival values.
- Muted text reserved for genuinely secondary information.
- Alert colors used sparingly so the screen does not become a wall of warnings.

Light mode remains available as a rider preference.

### 16.3 Official route recognition

Use current official MTA colors for route bullets and relevant map segments. Route identity is always redundant:

- Color.
- Letter or number.
- Shape where applicable.
- Spoken screen-reader label.

Color is never the sole indicator of a route, capacity state, accessibility state, or warning.

Use of official maps, symbols, and brand assets requires the appropriate MTA license before public launch.

### 16.4 Typography and accessibility

- Support large text without truncating destinations or hiding state labels.
- Preserve a strong contrast ratio at every supported size.
- Use plain language before operational terminology.
- Read an arrival to assistive technology in decision order, for example: **F train to Jamaica–179 St, three minutes, live, via E line**.
- Announce blocking accessible-path changes immediately without repeatedly rereading the entire screen.
- Respect reduced-motion settings; movement is never required to communicate freshness.

### 16.5 Touch and reach

- Core tap targets are at least 48 by 48 points.
- Direction, refresh, save, route filter, and navigation actions live in the bottom third.
- Destructive or mode-changing actions require an explicit label, not an unfamiliar gesture.
- Swipes may accelerate common actions but always have visible button equivalents.
- Bottom sheets stop at useful intermediate heights so the rider can keep the station context visible.

### 16.6 Motion

Use motion only to explain state:

- A short transition when direction reverses.
- A restrained freshness indicator while current data is arriving.
- No perpetual train animation that implies movement the feed has not confirmed.
- A countdown changing to Holding should visibly stop rather than continue pulsing.

---

## 17. Map experience

### 17.1 Separate display theme from service pattern

Dark/light appearance is a visual preference. Daytime/late-night is an operating pattern. They must never be treated as the same setting.

### 17.2 Map layers

Offer three explicit service layers:

1. **Actual now:** Current routes, disruptions, reroutes, and closures when online.
2. **Typical weekday:** Reference daytime service.
3. **Late night:** Reference overnight service.

The app selects a planning topology using the trip's departure and arrival time, not merely the phone clock. A trip crossing the overnight transition remains one itinerary and identifies where the service pattern changes.

### 17.3 Map interactions

- Center on the rider only when requested or on initial Nearby-to-Map transition.
- Preserve zoom and map position.
- Selecting a station opens its board from the bottom.
- Selecting a route highlights its current stopping pattern and dims unrelated services.
- A service change redraws the affected segment and labels skipped stations; it does not merely attach a text banner.
- Accessibility overlays can show full, partial, directional, currently blocked, and status-unknown paths.

### 17.4 Geographic honesty

The system diagram prioritizes service comprehension; a geographic view prioritizes street access. Do not pretend the schematic diagram gives accurate walking distance. Entrance selection and walking guidance use the geographic view.

---

## 18. Offline and zero-service behavior

### 18.1 Always-available content

Keep the following available without a connection:

- Typical weekday and late-night vector service maps.
- Station names, routes, and structural topology.
- Subway entrances and exits.
- Station and directional accessibility notes.
- Equipment inventory and descriptions.
- Saved stations and commutes.
- Saved trip cards.
- The most recent valid supplemented schedule within its effective period.

### 18.2 Offline trip card

Before the rider descends, save an active trip card containing:

- Origin, destination, and direction.
- Station sequence.
- Transfer instructions.
- Exit and platform-zone guidance.
- Accessible entrance and elevator chain when relevant.
- Last-checked service and equipment status.
- One or two previously verified contingencies.

The card offers manual progress controls such as **I'm at this stop**, because underground location may be absent or misleading.

### 18.3 Offline presentation

Display a persistent message:

> Offline—live arrivals, alerts, and elevator status are unavailable.

Rules:

- Preserve the last coherent screen instead of blanking it.
- Replace live countdowns with scheduled clock times where a valid schedule exists.
- Label every cached live value with its last-checked time.
- Treat route-critical stale elevator state as Unknown.
- Label offline maps **Reference pattern—not live**.
- Describe a newly planned accessible journey as **Structurally step-free**, never **Accessible now**.

### 18.4 Reconnection

Refresh active-trip risk in this order:

1. Route-critical elevators and accessible paths.
2. Active service changes affecting the trip.
3. Current train arrivals.
4. Positioning and transfer context.
5. Background maps and unrelated saved stations.

If refreshed information invalidates the trip, warn before the last verified accessible or operational decision point whenever possible.

---

## 19. Accessibility model

Accessibility is a routing contract, not a filter applied after the fastest route is chosen.

### 19.1 Complete path requirement

The validated path is:

> Street entrance → fare control or mezzanine → transfer passage → correct directional platform → boarding area → destination platform → exit path → street

Every required connection records:

- Movement type: elevator, compliant ramp, level path, stairs, or escalator.
- Physical endpoints and station levels.
- Relevant route and direction.
- Equipment identity when applicable.
- Whether it belongs to an official accessible path.
- Operating restrictions.
- Verification date.

A station-complex accessibility badge is informational only. A route is valid only when every required connection is verified step-free and available.

### 19.2 Directional and partial accessibility

The product enforces constituent-station and direction notes. Examples of traps include:

- A complex accessible for one line but not another.
- A line accessible only in one direction.
- An elevator that reaches a mezzanine but not a step-free platform.
- Two stations with the same name but different accessible street corners.
- A passage that is step-free but not ADA compliant.

The rider sees the exact accessible entrance, served lines and directions, and required elevator chain.

### 19.3 Accessible Route Only

When enabled:

- Persist the preference until the rider changes it.
- Treat it as a hard constraint at origin, transfer, destination, and direction.
- Never silently relax it to offer a faster route.
- Reject a reroute onto an unverified platform.
- Reject a destination whose exit path is broken even if boarding is accessible.
- Allow a ride-past-and-return workaround only when every added segment and reversal is verified accessible.

If no verified subway path exists, say:

> No verified step-free subway route is available right now.

Then offer a separate, explicit option to include buses. Do not blend an unrequested bus leg into the subway result.

### 19.4 Route ranking

Among valid accessible routes, rank by:

1. Fewer single-point elevator dependencies.
2. Fewer transfers.
3. Shorter accessible walking distance.
4. Lower disruption risk.
5. Travel time.

The nominally fastest path must not outrank a more resilient path merely by saving a small number of minutes.

---

## 20. Elevator and escalator status

### 20.1 Equipment states

Every relevant machine has one of four states:

- **In service:** A fresh, complete outage snapshot contains no matching outage.
- **Out of service:** A matching current outage exists.
- **Planned outage:** An official future alert identifies the closure period.
- **Unknown:** The status is stale, incomplete, failed, or cannot be joined reliably.

An estimated return time is shown as an estimate, never as a reopening countdown.

### 20.2 Path relevance

Show all equipment in station details, but prioritize:

- Machines required by the selected accessible path.
- Their endpoints and served routes/directions.
- Whether each machine is part of an ADA path.
- Outage reason and estimated return.
- Official alternative route.

An escalator can satisfy a separate **Avoid stairs** preference, but never substitutes for an elevator in wheelchair-accessible routing.

### 20.3 Impact classification

An equipment outage is:

- **Blocking:** Breaks the active origin, transfer, or destination path.
- **Reroutable within station:** Another verified in-station path remains.
- **Unrelated:** Does not affect the selected path.

Do not mark an entire station inaccessible merely because an unrelated elevator or escalator is unavailable.

### 20.4 Rerouting order

When a path breaks:

1. Use an alternate verified path within the same complex.
2. Use a nearby verified accessible subway station.
3. Offer a verified subway detour, including ride-past-and-return when appropriate.
4. Offer an explicit bus-inclusive alternative.

For an underway trip, never instruct a rider to exit at an inaccessible station. Warn before the last accessible decision point when current data permits.

### 20.5 Restoration

An outage is considered restored only when a fresh, healthy status snapshot supports that conclusion. A machine disappearing from a failed, empty, or partial response is not evidence of restoration.

### 20.6 Planned-work alternatives

An official suggested alternative is not automatically accessible. If its complete path cannot be verified, label it **Accessibility not confirmed** and do not promote it in Accessible Route Only results.

---

## 21. Accessibility acceptance cases

The following scenarios must be represented correctly:

1. **Elevator does not equal accessibility:** An elevator reaches a mezzanine but no step-free path continues to the platform.
2. **Partial complex:** Some lines in a complex are accessible while others are not.
3. **Directional platform:** Only one direction is accessible.
4. **Mixed transfer:** The origin and destination are accessible, but a required transfer passage is not.
5. **Chained elevators:** One failed leg invalidates a multi-elevator path.
6. **Redundant path:** One elevator fails, but another complete verified chain remains.
7. **Wrong entrance:** The nearest station staircase does not reach the accessible direction.
8. **Rerouted train:** A train moves to a platform whose accessibility is unknown.
9. **Stale status:** Equipment data cannot be refreshed; status becomes Unknown.
10. **Offline planning:** The route is structurally step-free, but current availability cannot be claimed.

Official MTA station data distinguishes fully and partially accessible stations and direction notes. MTA also warns that not every station elevator belongs to an accessible pathway. The product follows those distinctions rather than inferring accessibility from equipment presence.

### Additional accessibility sources

- [MTA guidance for station accessibility and elevator status](https://www.mta.info/developers/display-elevators-NYCT)
- [MTA Subway Stations data](https://data.ny.gov/Transportation/MTA-Subway-Stations/39hk-dx4f)
- [MTA Subway Stations and Complexes data](https://data.ny.gov/Transportation/MTA-Subway-Stations-and-Complexes/5f5g-n3cz)
- [MTA Subway Entrances and Exits data](https://data.ny.gov/Transportation/MTA-Subway-Entrances-and-Exits-2024-Map/68hr-j2j7)
- [MTA accessible-stations guidance](https://www.mta.info/accessibility/stations)
- [MTA subway maps](https://www.mta.info/maps)
