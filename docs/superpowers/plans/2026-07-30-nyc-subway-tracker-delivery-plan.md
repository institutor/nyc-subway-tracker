# NYC Subway Train Time Tracker Master Delivery Plan

> **For agentic workers:** Use the four workstream plans linked below as the execution authority. Complete tasks in dependency order, preserve conservative rider-truth rules, and stop at every stated review gate. Do not introduce source code, frameworks, architectural stacks, or vendor-specific assumptions into these product delivery artifacts.

## Goal

Turn the approved NYC subway product specification into a sequenced, independently reviewable delivery program that opens on trustworthy nearby arrivals, remains useful underground, handles service changes conservatively, supports accessible journeys, adds platform and transfer guidance only where evidence is strong, and notifies commuters only when a disruption matters to their trip.

## Product promise

**Show the next trains the rider can actually board.**

Every delivery decision inherits this promise. A shorter countdown is never more important than avoiding a confidently wrong claim.

## Source of truth

- Approved design: `docs/superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md`
- Arrival truth plan: `docs/superpowers/plans/2026-07-30-arrival-truth-and-service-changes-plan.md`
- Nearby and offline plan: `docs/superpowers/plans/2026-07-30-nearby-station-and-offline-experience-plan.md`
- Accessibility and guidance plan: `docs/superpowers/plans/2026-07-30-accessibility-and-platform-guidance-plan.md`
- Commute alerts and quality plan: `docs/superpowers/plans/2026-07-30-commute-alerts-and-launch-quality-plan.md`

If a delivery artifact conflicts with the approved design, the approved design controls until a documented product decision updates it.

## Technology boundary

This program intentionally contains no source code, framework selection, architectural stack, storage choice, deployment model, or vendor prescription. Those decisions are outside the requested product-design scope. Implementers must satisfy the behavioral contracts and evidence gates without weakening them.

## Program invariants

1. A train is admitted to a station board only when reconciled evidence supports a stop at that directional stop.
2. Negative service-change evidence can veto a positive arrival prediction.
3. Fresh GTFS-RT drives countdowns; supplemented schedules define current planned service; regular static schedules are a lower-confidence fallback.
4. Degraded evidence produces degraded language, never artificial certainty.
5. “Due” does not persist indefinitely, and stalled train records are demoted or suppressed according to the ghost policy.
6. The first useful screen requires no search or typing when location is available.
7. All passenger-serving directions are represented; “Uptown/Downtown” is used only where accurate.
8. Saved stations and offline maps remain useful without an account or cellular service.
9. Accessible Route Only requires a complete viable path at origin, transfer, and destination.
10. Platform, transfer, and crowding guidance is withheld or qualified when evidence is incomplete.
11. Commute alerts are disruption-only, segment-relevant, current, deduplicated, and permission-respectful.
12. A feature does not launch merely because its happy path works; its degraded, conflicting, stale, offline, and edge-time states must pass.

## Workstream map

| Workstream | Primary rider outcome | Starts after | Release contribution |
|---|---|---|---|
| Arrival truth and service changes | The board excludes bypassed, stale, contradictory, and implausibly stuck trains | Approved design | Truth Gate and Release 1 |
| Nearby station and offline experience | Opening the product immediately answers “what can I board here?” and remains navigable underground | Stable terminology; truth contract for live states | Release 1 |
| Accessibility and platform guidance | Riders receive complete-path accessibility warnings and evidence-backed positioning help | Station/direction identity; truth status; map relationships | Release 1 accessibility core, Release 2 guidance |
| Commute alerts and launch quality | Riders are warned only about relevant disruptions before entering | Truth Gate; saved-trip model; service-change impact taxonomy | Release 2 |

Arrival-truth contract work and static Nearby interaction design may proceed in parallel. Live board acceptance cannot complete until the truth contract is approved. Accessibility path modeling can proceed alongside offline map design once station, entrance, platform, and direction terms are frozen. Notification pilots cannot begin before the Truth Gate passes.

## Program artifacts

The four workstream plans create the authoritative product artifacts beneath:

- `docs/product/contracts/`
- `docs/product/data/`
- `docs/product/ux/`
- `docs/product/content/`
- `docs/product/accessibility/`
- `docs/product/guidance/`
- `docs/product/commute/`
- `docs/product/privacy/`
- `docs/product/measurement/`
- `docs/product/operations/`
- `docs/product/test-cases/`
- `docs/product/release/`
- `docs/product/decisions/`

Each artifact must identify its source specification sections, owner, reviewers, status, last validation date, and superseded documents where applicable.

---

## Phase 0: Establish shared product language and review control

### Task 0.1: Create the product artifact index

**Artifacts**

- Create: `docs/product/README.md`
- Create: `docs/product/artifact-index.md`
- Create: `docs/product/review-and-approval-policy.md`

**Steps**

1. List every planned artifact from the four workstream plans.
2. Assign each artifact a single purpose and authoritative owner.
3. Define draft, in review, approved, superseded, and retired states.
4. Define which product, accessibility, data-quality, content, privacy, and operations reviewers are mandatory by artifact type.
5. Require all decisions that weaken a conservative truth rule to return to product and data-quality review.
6. Define how approval evidence and scenario results are linked.

**Acceptance evidence**

- No planned artifact lacks an owner or review path.
- Two artifacts do not claim authority over the same decision without an explicit precedence rule.
- Superseded guidance cannot be mistaken for current guidance.

**Commit checkpoint**

`add product delivery controls`

### Task 0.2: Freeze the common vocabulary

**Artifacts**

- Create: `docs/product/contracts/transit-product-glossary.md`
- Create: `docs/product/contracts/rider-language-rules.md`
- Create: `docs/product/decisions/subway-product-decisions.md`

**Steps**

1. Define station complex, entrance, stop, directional stop, platform, route, train instance, stop call, service pattern, service day, alert impact, accessible path, guidance record, and disruption episode.
2. Separate public rider labels from internal product concepts.
3. Record when Uptown, Downtown, Queens-bound, Brooklyn-bound, Bronx-bound, Manhattan-bound, terminal-bound, or another label is appropriate.
4. Prohibit “live,” “on time,” “accessible,” “best car,” and equivalent high-certainty language unless its evidence requirements are met.
5. Record the official route-color recognition rules and the requirement for non-color identifiers.

**Acceptance evidence**

- Each workstream uses the same identity and direction terms.
- Rider language does not imply precision or certainty beyond the evidence.
- Color is never the only route identifier.

**Commit checkpoint**

`freeze subway product vocabulary`

---

## Phase 1: Pass the Truth Gate

Execute all tasks in:

`docs/superpowers/plans/2026-07-30-arrival-truth-and-service-changes-plan.md`

### Program gate 1: Truth approval

**Artifacts**

- Create: `docs/product/release/truth-gate-checklist.md`
- Create: `docs/product/release/truth-gate-results.md`
- Create: `docs/product/release/truth-gate-decision.md`

**Required evidence**

1. Reconciled stop behavior passes normal-service, reroute, bypass, partial-suspension, and track-conflict cases.
2. Freshness, bulk-drop, ghost, recovery, fallback, schedule-currency, midnight, and daylight-saving boundary cases pass.
3. Every displayed arrival has inspectable provenance.
4. Unresolved alerts cannot silently preserve a contradicted stop.
5. Reviewers can reproduce board inclusion, demotion, labeling, and suppression decisions from the artifacts.
6. Product and data-quality reviewers sign a go or no-go record.

**Commit checkpoint**

`complete subway truth gate`

No live Nearby board, commute-notification pilot, or accessibility-impact notification advances without this gate.

---

## Phase 2: Deliver the trustworthy zero-tap subway utility

Execute the Release 1 portions of:

- `docs/superpowers/plans/2026-07-30-nearby-station-and-offline-experience-plan.md`
- `docs/superpowers/plans/2026-07-30-accessibility-and-platform-guidance-plan.md`

### Program gate 2: Release 1 readiness

**Artifacts**

- Create: `docs/product/release/release-1-checklist.md`
- Create: `docs/product/release/release-1-scenario-results.md`
- Create: `docs/product/release/release-1-go-no-go-record.md`

**Required rider outcomes**

1. With location available, launch shows nearest useful station complexes and the next three boardable arrivals for every passenger-serving direction without search or typing.
2. With location denied or unavailable, the product reaches saved or recently viewed stations without a dead end.
3. Station selection accounts for entrances, walking usefulness, served routes, and accessibility preference rather than raw station-center distance alone.
4. Dark-default, high-contrast station boards remain legible in poor lighting, with route bullets and non-color labels.
5. Switching lines, changing directions, refreshing, and primary navigation are reachable in the bottom third.
6. Planned and live service changes prevent bypassed-stop arrivals from appearing.
7. Saved stations, day and night vector maps, service-pattern context, and saved offline trip cards remain navigable with no connection.
8. Accessible Route Only rejects incomplete or currently broken paths and explains the affected path.
9. Degraded, stale, unavailable, location-denied, offline, and empty states state what is known and what the rider can do next.

**Evidence set**

- Complete results for specification acceptance scenarios 1–32, 40–46, and 49–51.
- Legibility and one-handed reach review across the defined compact and large screen conditions.
- Offline cold-open, in-station loss-of-service, and reconnection walkthroughs.
- Accessibility review covering origin, transfer, destination, directional, and partial-accessibility cases.
- Product, accessibility, content, privacy, data-quality, and operations approval.

**Commit checkpoint**

`complete subway release one gate`

---

## Phase 3: Add evidence-backed journey convenience

Complete the positioning, transfer, and commute portions of:

- `docs/superpowers/plans/2026-07-30-accessibility-and-platform-guidance-plan.md`
- `docs/superpowers/plans/2026-07-30-commute-alerts-and-launch-quality-plan.md`

### Program gate 3: Release 2 readiness

**Artifacts**

- Create: `docs/product/release/release-2-checklist.md`
- Create: `docs/product/release/release-2-scenario-results.md`
- Create: `docs/product/release/release-2-go-no-go-record.md`

**Required rider outcomes**

1. Front, middle, or back positioning appears only for the correct route, direction, platform orientation, destination outcome, and validated evidence.
2. Transfer guidance communicates connection likelihood without promising a hold or guaranteed connection.
3. Missing or conflicting platform evidence produces neutral guidance, not a guess.
4. Commute windows notify only for a meaningful disruption affecting the rider’s route, direction, segment, and active window.
5. Duplicate, stale, low-impact, unaffected-segment, and routine-status notifications are suppressed.
6. Accessibility-path loss can trigger a relevant warning for an opted-in commute.
7. Subway crowding remains absent until the future enablement gate is met.

**Evidence set**

- Complete results for specification acceptance scenarios 33–39, 47, and 48, plus regression evidence for all Release 1 truth and accessibility behavior those features depend on.
- Positioning field validation for every published recommendation.
- Silent commute-alert evaluation followed by a reversible limited pilot.
- Notification relevance, timeliness, duplicate, and opt-out guardrails.
- Product, accessibility, content, privacy, data-quality, and operations approval.

**Commit checkpoint**

`complete subway release two gate`

---

## Phase 4: Consider coverage expansion without weakening trust

### Task 4.1: Review eligible extensions

**Artifacts**

- Create: `docs/product/release/coverage-expansion-review.md`
- Create: `docs/product/release/crowding-enablement-review.md`
- Create: `docs/product/decisions/coverage-expansion-decisions.md`

**Dependencies**

- Stable Release 2 quality results.
- Sufficient official or otherwise approved evidence for the proposed extension.

**Steps**

1. Review uncovered stations, transfers, platform guidance, and additional subway service patterns.
2. Assess crowding data against the approved future enablement gate: car-level identity, current enough data, documented coverage, stable availability, clear capacity meaning, and quality monitoring.
3. Keep commuter-rail expansion outside the subway release unless separately approved as a new product scope.
4. Require each extension to inherit all relevant degraded-state, accessibility, privacy, and operations controls.
5. Reject any extension that raises apparent coverage by substituting unverified claims.

**Acceptance evidence**

- Coverage figures distinguish validated, provisional, unavailable, and intentionally withheld guidance.
- Crowding does not appear from anecdotal rider reports or unsupported inference.
- A scope extension has its own acceptance evidence and rollback conditions.

**Commit checkpoint**

`review subway coverage expansion`

## Cross-workstream integration checks

Before each release gate, run the following joins rather than reviewing features in isolation:

| Integration | Required check |
|---|---|
| Arrival truth × Nearby board | Every visible countdown survives stop reconciliation, freshness, ghost, and service-change checks |
| Arrival truth × Offline | Reconnection does not preserve stale schedule claims as live; offline labels remain explicit |
| Arrival truth × Commute alerts | A notification cannot bypass stricter arrival or alert evidence rules |
| Station model × Accessibility | The path uses the correct entrance, mezzanine, platform, direction, transfer, and destination exit |
| Accessibility × Service changes | A route that technically runs but cannot provide the required accessible path is not presented as accessible |
| Accessibility × Commute alerts | Only path-relevant equipment failures notify the rider |
| Offline maps × Service pattern | Day/night map choice and stored trip context do not imply current live service |
| Platform guidance × Direction | Front/middle/back orientation is resolved from the rider’s travel direction, not a station-wide default |
| Platform guidance × Accessibility | “Best car” convenience never directs a rider away from the viable accessible path |
| Saved stations × Privacy | Personalization remains useful without an account and can be reset |
| Official colors × Legibility | Route identity remains clear for color-vision differences and dim environments |
| Alerts × Fatigue | Repeated source updates resolve to a single disruption episode unless rider action materially changes |

## Acceptance-scenario ownership

| Specification scenario group | Primary plan | Required supporting review |
|---|---|---|
| 1–5: normal and real-time service | Arrival truth | Nearby board |
| 6–12: service changes | Arrival truth | Nearby board, commute alerts where applicable |
| 13–20: feed degradation and ghosts | Arrival truth | Content and operations |
| 21–25: location and offline | Nearby and offline | Privacy, content |
| 26–32: accessibility | Accessibility and guidance | Nearby, operations |
| 33–39: positioning and alarms | Accessibility/guidance and commute | Truth, content |
| 40–42: time edge cases | Arrival truth | Commute, offline |
| 43–51: currency and threshold boundaries | Arrival truth, accessibility/guidance, commute, and nearby/offline according to subject | Operations |

No scenario may be marked passed solely by a written assertion. Results must show the input conditions, expected rider-visible outcome, actual reviewed outcome, evidence reference, reviewer, and date.

## Program measurement

### North-star

Use the approved north-star measure from the specification: the share of station-board sessions in which the rider receives a useful, trustworthy answer quickly enough to act.

### Trust guardrails

- Incorrect displayed-stop rate.
- Stale-live-label rate.
- Ghost persistence rate.
- Service-change contradiction rate.
- Incorrect accessibility-path rate.
- Unsupported positioning-guidance rate.
- Irrelevant commute-notification rate.
- Duplicate commute-notification rate.

### Usefulness measures

- Time to first useful nearby board.
- Share of launches that reach a useful board without search.
- Offline saved-content success.
- Direction-switch and route-switch task success.
- Accessible-route completion confidence.
- Platform-guidance coverage with validated evidence.
- Commute-alert actionability.

Every metric definition must include numerator, denominator, exclusions, sampling method, review cadence, and a guard against optimizing volume over truth.

## Risk controls

| Risk | Program control |
|---|---|
| MTA feed gaps or schema changes | Route-level health, quarantine, provenance, conservative fallback, operations hold |
| Weekend or overnight bypass errors | Supplemented schedules plus service-alert reconciliation and explicit stop veto |
| Ghost trains | Movement and prediction-progress checks, demotion, suppression, and recovery requirements |
| Station geometry gaps | Coverage states and no guessed entrance, path, transfer, or car-position guidance |
| Accessibility data ambiguity | Complete-path requirement, freshness states, provisional empty results, path-specific messaging |
| Map or brand rights | Rights review before distribution; no launch dependency on unapproved assets |
| Notification fatigue | Segment relevance, meaningful thresholds, episode deduplication, rider controls, pilot guardrails |
| Offline overconfidence | Persistent offline labeling and separation of static navigation from live operating claims |
| Privacy overreach | Local-first preferences, contextual permission requests, reset controls, minimal data inventory |

## Commit and review discipline

1. Use the lowercase commit checkpoint at the end of each task.
2. Keep one independently reviewable product decision or tightly related artifact set per commit.
3. Do not combine unrelated workstreams in one commit.
4. Run document consistency, placeholder, broken-reference, and acceptance-coverage checks before each gate.
5. Record reviewer findings in the relevant artifact; resolve P0 and P1 findings before continuing.
6. Preserve approved artifacts when revising them; mark superseded versions rather than silently changing historical launch evidence.

## Final program completion checklist

- All four workstream plans are complete.
- All required product artifacts are indexed and approved.
- Truth Gate, Release 1, and Release 2 have signed decisions.
- All 51 specification scenarios have traceable results.
- Cross-workstream integration checks pass.
- Offline, stale, conflicting, and permission-denied states have rider-visible outcomes.
- Accessibility has independent review authority.
- Every published guidance claim has evidence and a coverage state.
- Operations can hold, correct, recover, and audit affected features without concealing degraded service.
- Privacy and rights reviews are complete.
- Product metrics meet the approved observation windows and guardrails.
- All commit messages are lowercase.
