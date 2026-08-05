# Task 12 implementer report: saved journeys and offline continuity

## Outcome

Implemented Task 12 as an honest subway-first continuity layer. Riders can save exact station intent, search without sharing location, refresh all owned route/direction boards, plan direct or transfer journeys, choose app-owned Day and Night reference maps, capture one device-held trip before descent, and continue through that trip manually when service is unavailable. Offline presentation never promotes cached operational data to current truth.

The work also adds an installable shell, strict structural and active-trip persistence boundaries, a bounded service-worker cache policy, and an owner-gated reconnection coordinator. Map appearance and service meaning remain independent: a dark map is not implied to be late-night service, and loss of current data never silently changes the rider to a reference pattern.

## Delivered behavior

- Added deterministic Saved and station-search surfaces with exact complex/constituent ownership, filtered-route disruption visibility, immediate open without mutation, explicit draft/save behavior, and record-scoped pause, reset, and delete actions.
- Added all-route/all-direction Saved refresh ownership and abort handling without location access.
- Added strict client DTO validation for catalog search, app-owned vector maps, and journey responses; expanded journey output with exact scope, ordered station IDs, and explicit transfer instructions.
- Added explicit Actual now, Typical weekday, and Late night map meanings, separate schematic/geographic presentation, preserved map context, and reference labels that cannot be mistaken for live service.
- Added direct and transfer journey presentation, future/reference itinerary semantics, explicit one-trip capture, and conservative refusal to claim an incomplete accessible path.
- Added a complete offline active-trip card with captured origin/destination, ordered stops, transfers, manual forward/back correction, service date and pattern, claim-scoped timestamps, validity warnings, and conditional platform/exit/path modules only when owned evidence exists.
- Changed historical boards from moving countdowns to static “was due” treatment and removed Live treatment while offline.
- Added an exact persistent offline banner and a checking state that does not claim current data before owner acceptance.
- Added strict browser stores for active trips and structural content. Both stores reject unknown fields, operational widening, future schemas, duplicate ownership, invalid clocks, and oversized payloads; quarantined values cannot be overwritten.
- Persisted only catalog plus exact Day/Night content identities, warmed both reviewed vector references online, and enabled local catalog search and explicit reference-map opening without bootstrap or location on a cold offline reload.
- Added a five-stage reconnection coordinator that gates route-critical equipment/accessibility, service changes, current arrivals, positioning/transfer guidance, then background maps and unrelated Saved refreshes. Earlier stages must settle with owner-accepted or governed fail-closed results before later work can request, commit, or present.
- Added a narrow service-worker policy: cache-first shell and immutable structural references, bounded network-first historical responses, same-origin/versioned allowlists, sensitive request rejection, and explicit retired-cache migration.
- Added the web manifest, app-owned icon, service-worker registration, and the same `/api/v1` proxy boundary for development and production-preview testing.
- Added one-handed bottom-dock destinations for Map and Saved, 48px controls, high-contrast dark styling, semantic regions, visible focus, narrow reflow, reduced-motion support, and forced-color accommodations.

## TDD evidence

Material behavior was introduced or corrected through failing tests before implementation:

1. Strict saved-record tests rejected operational truth and unknown fields before the Saved store and surface were expanded.
2. Saved-view tests first failed for immediate open, refresh ownership, alert filtering, explicit edits, deterministic rendering, and scoped mutations, then passed with the implemented surface.
3. Map-view tests first failed for direct/transfer ordering, explicit Day/Night choice, preserved context on loss of Actual now, and offline reference semantics, then passed with the map and planner implementation.
4. Offline-state tests first failed for exact banner copy, frozen historical boards, cold-offline bootstrap/location suppression, complete active-trip content, conditional omission, and manual cursor correction, then passed with the offline components and App integration.
5. Active-trip and structural-store suites first failed for schema, ownership, clock, quarantine, and size boundaries, then passed with strict versioned stores.
6. Service-worker tests first failed for request classification, sensitive material exclusion, bounded history, structural caching, navigation fallback, and migration, then passed with the reviewed worker policy.
7. Reconnection tests first failed for stage ordering, owner acceptance, invalidation priority, optional-guidance removal, preserved context, and non-overtaking, then passed with the coordinator.
8. The production-preview proxy test failed against an absent preview boundary, then passed after preview was restricted to the same `/api/v1` proxy as development.
9. Browser offline emulation exposed that fetch rejections were flattened into a generic domain error. A client regression failed, then passed after `TransitApiError` retained only the safe `network-unreachable` category and App connectivity used it.

## Verification evidence

- Full Vitest suite: 45 files, 678 tests passed.
- TypeScript validation: `tsc --noEmit` passed with zero diagnostics.
- Production build: 58 modules transformed; build completed successfully.
- Focused API/offline regression after the browser finding: 2 files, 25 tests passed.
- Diff hygiene: `git diff --check` passed; only repository line-ending notices were emitted.
- Scope scan: no crowding UI, official MTA map asset, or MTA logo was introduced. The only `crowding` matches are negative API-boundary tests proving such fields are rejected and not leaked.

## Browser smoke

The live app was inspected in the in-app browser. The dark-first shell rendered with semantic main/region/navigation landmarks, Nearby fallback, functional bottom dock, explicit Actual now map, explicit Typical weekday reference treatment, app-owned geometry, and no console errors or warnings.

A production-preview pass in installed system Chrome verified the manifest, service-worker readiness and scope, a controlled online reload, and cached catalog, Day reference, and Night reference resources. Chrome then reloaded the production shell with network emulation disabled, which exposed the transport-classification defect described above. That defect was fixed and covered by the focused automated regression and full suite.

The post-fix Chrome pass was not repeated within the browser timebox. A durable `tests/e2e/offline-pwa.spec.ts` now expresses the complete install/cache/offline-reload/reference-map scenario. The repository's configured bundled Chromium executable is not installed on this machine, so running that test through the default Playwright project requires the normal one-time `pnpm exec playwright install chromium`; the temporary system-Chrome override used during diagnosis was removed before commit.

## Scope and handoff

The implementation deliberately stores no current arrivals, accessibility claims, or inferred rider movement as structural truth. It does not include car crowding or official MTA map/logo assets. Accessibility outage integration, evidence-backed positioning content, crowding, and commute delivery remain governed by their later product tasks and release gates.

The required lowercase commit subject is `keep subway journeys useful offline`.
