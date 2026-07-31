# Transit product glossary

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§2.4–5, 14.5, 16.3–16.4, 19.1–19.3, 23, 25.7, 34; master delivery plan Task 0.2 `Artifacts` and `Steps`; Task 0.3 brief |
| Owner | Product Governance Lead |
| Required reviewers | Product, Accessibility, Data Quality, Content, Privacy, Operations |
| Status | Approved |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | [Phase 0 governance approval record](../release/phase-0-governance-approval.md) |
| Scenario results | Not applicable — this Phase 0 artifact governs vocabulary, ownership, lifecycle, and review, not rider-visible operational behavior; this does not waive later operational, accessibility, offline, positioning, or notification acceptance evidence. |

## Purpose and authority

This glossary owns the shared meanings used across arrival truth, nearby and offline experience, accessibility, platform guidance, and commute alerts. It does not replace a narrower approved contract that owns a decision rule. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

The terms in the **Internal product concept** column are for product reasoning and review. They are not automatically rider-facing labels. The **Public rider expression** column states what may be shown to a rider without exposing source codes or implying unsupported certainty.

## Shared concepts

| Term | Internal product concept | Public rider expression |
|---|---|---|
| **Station complex** | The named place riders recognize, such as Times Sq–42 St. A complex can contain multiple constituent stations, lines, platforms, fare-control areas, transfer passages, entrances, and accessibility conditions. It is not interchangeable with any one entrance, stop, directional stop, or platform. | Use the recognized station-complex name. A complex-level label never implies that every entrance, line, direction, platform, or path has the same service or accessibility. |
| **Entrance** | A specific street access point into a station complex. Its coordinates, entry permission, served constituent station, served routes and directions, and accessibility are separate facts. An entrance coordinate does not prove where a staircase, passage, or elevator meets a platform. | Name the street, intersection, corner, or other rider-recognizable access point. Say **Accessible entrance** only when the exact entrance and its relevant complete path satisfy the accessibility evidence rule. |
| **Stop** | A service location in an ordered pattern where a train may serve riders. A stop alone does not establish direction, platform, current service, or a live arrival. | Riders normally see the station name together with route, direction, and destination context rather than the internal word **stop**. |
| **Directional stop** | The exact route-facing boarding location for one direction at a stop. It is the identity that must appear in a train's ordered remaining-stop sequence before that train can be considered for the corresponding arrival board. Raw north/south suffixes or numeric direction codes must be normalized before comparison. | Show a station-specific bound label paired with the actual destination or terminal. Never expose a raw direction code as the only direction description. |
| **Platform** | The physical boarding area serving one or more directional stops. Platform identity and current platform certainty are separate from the station name and from a normal scheduled platform. | Use **Platform confirmed**, **Expected platform**, or **Check station signs** only under the evidence rules in the approved specification. Do not call a downstream platform confirmed prematurely. |
| **Route** | The rider-recognizable subway service identity, ordinarily identified by its official letter or number. A route retains its identity when it operates via another line; the current service pattern describes where it is actually stopping. | Show the official route letter or number in addition to the current official color and applicable shape, with a spoken screen-reader label. Color is never the only route identifier. |
| **Direction** | A normalized, station-specific travel direction resolved from the actual stopping pattern and destination. It is not inferred solely from a station name or equated automatically with a raw north/south source value. | Use a rider-recognizable bound, terminal-bound, or destination label, such as **Uptown & The Bronx**, **Downtown & Brooklyn**, **Queens-bound**, **Manhattan-bound**, or **To Jamaica Center**, always paired with the actual destination or terminal. |
| **Train instance** | A physical or operational train running a particular route, direction, service date, stopping pattern, and destination. The instance remains continuous across a published trip-identifier change only when the identity evidence is one-to-one and coherent. | Riders see the route, destination, direction, evidence state, and arrival treatment. They do not see an internal trip identifier or an unsupported claim that two records are the same train. |
| **Stop call** | A train's current claim that it will serve a specific directional stop at a predicted time. Past stop calls disappear. A future stop call must never be reconstructed from a normal static schedule. | Present an arrival only with its evidence state. A scheduled clock time is labeled **Scheduled**; it never masquerades as a live stop call or countdown. |
| **Service pattern** | The ordered set of stops a train is expected to serve, including express or local operation, short turns, reroutes, terminal changes, and skipped stops. The effective pattern, not route color or route name alone, determines current stop service. | Explain the rider consequence in plain language, such as a skipped stop or **Via…** label. Never show a train at a stop omitted from its current or materially unresolved pattern. |
| **Service day** | The operating service date to which subway service belongs. It is not simply midnight-to-midnight calendar time; trips may use times beyond 24:00 or begin before the nominal service date. | Show New York local time. Do not expose service-day notation unless needed to explain an edge case, and never let midnight or a daylight-saving change create duplicate trains, reversed chronology, or negative waits. |
| **Alert impact** | An alert resolved, where possible, to an active time window, route, station or segment, direction, impact type, severity, and rider instruction. **Affected** does not automatically mean **bypassed**. Delay, local-to-express operation, skipped stop, reroute, partial suspension, full suspension, and station closure remain distinct. | State the narrowest supported rider consequence for the relevant station, direction, segment, trip, entrance, or accessible path. **No active alerts** is not the same as **Good service**. |
| **Accessible path** | A complete chain from a specific street entrance through fare control or mezzanine, transfer passages, required elevators or ramps, the correct directional platform, boarding area, destination platform, exit path, and street. Every required connection must be verified step-free and available for a valid current route. | Name the exact accessible entrance, served routes and directions, and required elevator chain. A station-complex badge is informational only. Offline, use **Structurally step-free; live elevator status unavailable**, never **Accessible now**. |
| **Guidance record** | A verified relationship between train direction and a platform zone—front, middle, or back—that improves a particular exit or transfer. It carries a verification date and a certainty state. | Use **Verified** guidance for a current field-checked relationship, **Expected** language such as **usually best** when only the static platform is known, and no positioning claim when guidance is **Unavailable**. |
| **Disruption episode** | The internal grouping of updates that refer to the same incident and materially the same commute impact. It is the identity used to suppress duplicate notifications for copy edits, renewed timestamps, or equivalent alert records. Exact lifecycle boundaries belong to the narrower disruption-episode contract. | Do not expose an episode identifier. Describe the current rider consequence and notify again only when the approved material-change rule is met. |

## Identity boundaries

The following distinctions are mandatory in every workstream:

1. A **station complex** is not an **entrance**, **stop**, **directional stop**, or **platform**.
2. A route and its **service pattern** are separate. A rerouted F train remains the F route while its actual stopping pattern and **Via…** treatment change.
3. A **train instance** is not a published trip identifier. An ambiguous identity change is not merged.
4. A **stop call** is not a normal static-schedule entry. Static schedules cannot create future live stop calls.
5. An **alert impact** is not a line-wide status and does not, by itself, prove either a bypass or a live arrival.
6. A station-complex accessibility badge is not an **accessible path**.
7. A **guidance record** is not a precise car claim. Front, middle, and back are the default precision.
8. A **disruption episode** is not every alert update. Equivalent records within the same incident and commute impact remain one episode for deduplication.

## Direction and stop identity contract

- Normalize source directional-stop identifiers and alert-direction values into one internal direction model before comparison or public translation.
- Resolve direction from the actual ordered stop sequence and destination; do not infer it solely from a station name, route color, raw compass suffix, or numeric code.
- Match arrival evidence to the exact directional stop. Evidence for the same complex, opposite direction, or another platform does not satisfy the match.
- Pair every public direction label with the actual destination or terminal.
- At complexes with multiple operational axes, represent every passenger-serving directional platform. Do not force all service into two Uptown/Downtown buckets.
- A train must never be shown at a bypassed stop. It must also be suppressed when current data leaves materially unresolved the possibility that it will bypass the stop.

## Controlled usage

Later artifacts may add domain-specific fields or evidence tests, but they must reuse these meanings rather than redefine them. Any material change returns this glossary to **Draft** and requires the review path in the [product artifact review and approval policy](../review-and-approval-policy.md).
