# Rider language rules

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§2.4, 3, 10.1, 11.4, 14.5, 16.3–16.4, 18.3, 19–20, 23, 25.7, 34; master delivery plan Task 0.2 `Artifacts` and `Steps`; Task 0.3 brief |
| Owner | Content Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Operations |
| Status | Approved |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | [Phase 0 governance approval record](../release/phase-0-governance-approval.md) |
| Scenario results | Not applicable — this Phase 0 artifact governs vocabulary, ownership, lifecycle, and review, not rider-visible operational behavior; this does not waive later operational, accessibility, offline, positioning, or notification acceptance evidence. |

## Purpose and authority

This contract owns cross-domain rider-facing direction, certainty, accessibility, guidance, and route-recognition language. Internal concepts remain defined by the [transit product glossary](transit-product-glossary.md). Narrower artifacts may supply approved copy but may not weaken these evidence requirements. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

## General language contract

- Use plain language before operational terminology.
- Describe the evidence state or rider consequence; do not convert missing evidence into a positive claim.
- A train must never be shown at a bypassed stop. Suppress it as well when current data leaves materially unresolved the possibility that it will bypass the stop.
- If a required live-arrival condition is unknown, do not show an exact countdown.
- Use a scheduled clock time, not a countdown, for static, stale, fallback, or offline data.
- Public labels must not expose raw trip identifiers, stop suffixes, numeric direction codes, or internal confidence scores.
- A public label applies only to the exact route, direction, station or segment, entrance, platform, train, or accessible path supported by the evidence.

## Direction labels

Every direction label must agree with the current service pattern and must be paired with the actual destination or terminal.

| Public label | When it is appropriate | Do not use when |
|---|---|---|
| **Uptown** or **Uptown & The Bronx** | The train's downstream pattern from this station proceeds toward upper Manhattan and that label is rider-recognizable. Use **Uptown & The Bronx** when Bronx continuation is material to the services grouped under the heading. | The complex has another operational axis that the label would collapse, or the actual pattern and destination do not support the label. |
| **Downtown** or **Downtown & Brooklyn** | The train's downstream pattern from this station proceeds toward Lower Manhattan and that label is rider-recognizable. Use **Downtown & Brooklyn** when Brooklyn continuation is material to the services grouped under the heading. | The service does not proceed toward Lower Manhattan, the route is already on a different operational axis, or the combined borough promise is not true for the grouped service. |
| **Queens-bound** | Queens is the rider-recognizable downstream borough direction for the exact route and station. | The train's current pattern does not proceed toward or continue in the stated Queens direction. |
| **Brooklyn-bound** | Brooklyn is the rider-recognizable downstream borough direction for the exact route and station. | The train's current pattern does not proceed toward or continue in the stated Brooklyn direction. |
| **Bronx-bound** | The Bronx is the rider-recognizable downstream borough direction for the exact route and station. | The train's current pattern does not proceed toward or continue in the stated Bronx direction. |
| **Manhattan-bound** | The train is approaching Manhattan from another borough and Manhattan is the clearest station-specific downstream direction. | The label would conceal distinct within-Manhattan axes or the current pattern is leaving Manhattan. |
| Terminal-bound: **To _terminal_** | The actual destination or terminal best disambiguates a branch, terminal, or operational axis; for example, **To Jamaica Center**. This terminal-bound treatment may accompany another bound label. | The named terminal is scheduled only, stale, contradicted, or no longer agrees with the train's actual stopping pattern. |
| Another rider-recognizable bound or destination label | A station-specific, route-specific label is supported by the actual pattern and is clearer than Uptown/Downtown or a borough label. | It is derived only from a raw north/south suffix, numeric code, route color, or station name. |

**Northbound** and **southbound** may appear as secondary accessibility or operational labels. They must never be the only rider-facing direction description.

At a complex with multiple operational axes, show each passenger-serving directional platform under a clear bound or destination heading. Do not force intersecting services into two misleading Uptown/Downtown groups.

## High-certainty terms

| Term or equivalent claim | Evidence required before rider-facing use | Required fallback when the evidence is not met |
|---|---|---|
| **Live** or a live countdown | The relevant feed is healthy and current; the train is an assigned, coherent current instance; movement or stop progress is within 90 seconds; the exact directional stop is in the ordered remaining-stop sequence; destination and direction agree; no active bypass, suspension, closure, unresolved reroute, or invalidating track conflict applies; and the time remains plausible. | Use the supported state: **Expected**, **Holding**, **Arrival uncertain**, or **Scheduled _clock time_ · live data unavailable**. If service at the exact stop is uncertain, suppress the train row. |
| **On time** | The approved specification defines no current evidence contract or tolerance for this claim. A schedule alone never qualifies. Until a narrower artifact defines and receives approval for an observed-performance comparison, the term is prohibited. | State the supported arrival state and time without an on-time judgment. During fallback, say **Live data unavailable. Showing scheduled times.** |
| **Accessible**, **Accessible route**, or **Accessible now** as a current trip claim | The exact street-to-platform-to-street path is complete; every required connection is verified step-free for the route and direction; every route-critical equipment status is current and accepted; the correct platform and destination exit remain valid; and no reroute or outage breaks the path. A complex badge or one elevator is insufficient. | Offline, say **Structurally step-free; live elevator status unavailable**. If no current verified path exists, say **No verified step-free subway route is available right now.** For an unverified alternative, say **Accessibility not confirmed**. |
| **Best car**, a car number, or equivalent precise positioning claim | A current verified guidance record exists; platform orientation and zone are verified; the platform is confirmed; and train length, car ordering, stopping position, and orientation are all verified for that train. Accessible Route Only still overrides a shorter stair-based recommendation. | Use evidence-matched front/middle/back guidance, such as **Middle usually best**, or omit positioning when direction, platform, reroute, consist orientation, or geometry is uncertain. |
| **Platform confirmed** | Fresh actual-track evidence resolves to a known platform and remains stable across two updates. | Use **Expected platform** when only the normal or scheduled platform is known, or **Check station signs** under the approved non-conflicting uncertainty rule. An explicit non-terminal track conflict suppresses the arrival row and guidance. |
| **Due** | Movement remains fresh. The label lasts no more than 60 seconds. | After 60 seconds without progress, freeze the time and show **Holding**; after 120 seconds, remove the exact event from the primary next-three list. |
| **Good service** | Absence of an alert is never sufficient. No approved rule currently authorizes this broad positive claim. | Use **No active alerts** when that narrower fact is supported. |
| **Working** for an elevator or escalator | This unconditional equipment claim is prohibited under the current evidence model. | Use **No official outage reported** only after a current accepted snapshot satisfies the provisional-empty rule, and show when route-critical equipment was checked. |
| A promised transfer | The product never promises a connection. | Use **Likely**, **Tight**, **Uncertain**, or **Unlikely** under the verified walking-time and platform-confidence rules. |

Equivalent words, icons, animation, countdown treatment, notification phrasing, and assistive-technology labels are held to the same evidence standard. A visual treatment cannot imply **Live**, **Accessible**, **Confirmed**, or a precise car recommendation when the corresponding text would be prohibited.

## State-specific required language

- A held train freezes. Use evidence such as **Holding**, **Last moved 3 min ago**, or **Arrival uncertain**; never call it a ghost in rider-facing copy.
- When stale live data is being protected from a bulk drop, stop countdowns and use **Live data updating**.
- When live arrivals are unavailable, use **Live data unavailable** and show only eligible scheduled clock times.
- When a route is offline, cached route content is **Reference pattern—not live**.
- An estimated equipment return time is an estimate, never a reopening countdown.
- **Affected** does not mean **bypassed**. State delay, local-to-express operation, skipped stop, reroute, suspension, closure, or another resolved consequence precisely.
- An alert may explain operational context but may never revive a stale or suppressed train.

## Route recognition

1. Use current official MTA colors for route bullets and relevant map segments.
2. Always pair color with the official route letter or number.
3. Preserve the applicable official bullet shape.
4. Provide a spoken screen-reader label that names the route.
5. Keep route identity distinct from service pattern. A rerouted train retains its route identity and receives the supported **Via…** or changed-stop treatment.
6. Color is never the sole indicator of a route, capacity state, accessibility state, warning, direction, or evidence state.
7. Official maps, symbols, and brand assets require the appropriate MTA license before public launch.

## Review checks

A content review cannot approve a label unless its evidence owner can answer all of the following:

- What exact internal concept and scope does the label represent?
- What evidence authorizes the certainty level?
- What stale, offline, unresolved, or conflicting state removes or changes it?
- Does the route remain identifiable without color?
- Does assistive technology receive the same route, direction, destination, time, and evidence meaning?
- Could the label cause a rider to expect a train at a bypassed stop? If yes or materially unresolved, suppress the train claim.
