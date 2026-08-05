# Task 12 fix round 3 report: bounded warning resolution and cursor-aware scopes

## Outcome

The assigned round-3 Task 12 findings are repaired. Active-trip warnings can now be cleared only by evidence or a governed rider action that fits inside the caller's exact locally captured receipt ceiling and follows the invalidating evidence. Reconnection scopes now follow the rider's manual cursor: service recovery owns every remaining leg, transfer recovery owns every upcoming transfer, and evidence-derived invalidations identify only the affected owned decisions when the response supports that precision.

The implementation head before this report is `c5745c7` (`ignore completed trip evidence`). No Task 13 accessibility-status or crowding scope was added.

## Local receipt and chronology boundary

- Warning resolution requires an explicit canonical local receipt ceiling captured by the caller. A missing receipt, a receipt before the recovery epoch, or a gate accepted after that receipt is rejected.
- The receipt ceiling is mandatory for every owner-gate validation path. Owner evidence must satisfy `recovery start <= evidenceAt <= acceptedAt <= local receipt`.
- A newly named observation cannot clear a warning when its evidence predates the invalidating owner evidence, and a later acceptance timestamp cannot disguise stale evidence.
- Governed rider replacement actions must occur after both the recovery start and the invalidating gate acceptance, and may not postdate the local receipt.
- A valid newer owner result inside all chronology bounds clears the exact warning and leaves the preserved context intact.

## Exact owner-contained warning scopes

- Every invalidation scope must be contained in the gate that owns the invalidation. Membership in the broader recovery eligible set is insufficient.
- Governed fail-closed warnings retain all applicable owner scopes instead of selecting the first arbitrary scope.
- Multi-leg service warnings preserve all exact remaining-leg scopes when evidence cannot isolate the change.
- Multi-transfer guidance warnings preserve every applicable upcoming transfer scope.

## Cursor-aware service and transfer decisions

- The active service-change owner covers all legs at and after the manual cursor, never only the current leg and never already-completed legs.
- Transfer guidance covers transfers whose incoming leg is current or upcoming. A transfer that delivered the rider into the current leg is completed and is excluded.
- A response that changes only a later remaining leg invalidates only that leg when the evidence permits exact attribution.
- Service verification compares only owner-scoped remaining legs. A structural change or blocking veto confined to completed travel cannot invent a warning for the current or future legs.
- Itinerary-wide blocking evidence still applies to every remaining owned leg, including after completed travel.
- When current response evidence cannot isolate a service failure, recovery fails closed across every remaining owner-scoped leg.

## RED/GREEN evidence

1. Future owner evidence and acceptance initially cleared a warning without a caller receipt boundary. Regressions failed before the mandatory receipt ceiling and passed after all owner-gate chronology was bounded.
2. A newly named stale observation initially cleared the warning. The regression passed only after resolution evidence was required to be at least as new as the invalidating gate evidence.
3. Rider actions before the invalidation or after the local receipt initially lacked a complete boundary. The chronology regressions now reject both and accept only a bounded governed replacement.
4. An invalidation could borrow an eligible scope not owned by its gate. The regression passed after invalidation scope containment became a domain invariant.
5. Governed fail-closed service and transfer results initially retained a single arbitrary scope. Multi-scope regressions passed after all applicable owner scopes were preserved.
6. A later-leg-only pattern change initially warned on the current leg. The regression passed after response evidence was mapped back to the changed remaining leg.
7. A middle-leg reconnect initially owned only one service leg and one adjacent transfer. The flow regression passed after remaining legs and every upcoming transfer were derived from the manual cursor.
8. A completed-leg-only structural change and completed-leg veto initially invalidated a remaining leg. The focused regression failed on that behavior and passed after matching and blocking evidence became cursor/owner-scope aware. A paired itinerary-wide veto regression proves broad evidence still invalidates the remaining owned scope.

## Verification

- Focused recovery suite: **4 files, 52 tests passed**.
- Full Vitest: **50 files, 752 tests passed**.
- TypeScript: `tsc --noEmit` passed with zero diagnostics.
- Production build: **66 modules transformed**; build completed successfully.
- Browser acceptance: **3 Playwright tests passed** in installed Google Chrome.
- Browser coverage: device-held reference warmup, offline reference planning, historical board fallback, truthful Actual-map intent, ordered owner refreshes, and current overlay restoration.
- Diff hygiene: `git diff --check` passed before each implementation commit.
- Requirement audit: every production owner-gate validation receives a nonoptional receipt ceiling; active service and transfer owner scopes are cursor-derived; invalidation scopes are owner-contained.

## Lowercase commits

| Commit | Subject | Repair area |
|---|---|---|
| `d510521` | `bound warning resolution locally` | mandatory local receipt and owner/rider chronology |
| `edf5bb0` | `reject stale warning evidence` | invalidation-relative evidence freshness |
| `b12dc47` | `retain exact warning scopes` | owner containment and multi-scope fail-closed warnings |
| `2d1e5a0` | `scope remaining trip decisions` | later-leg attribution and upcoming transfer ownership |
| `c5745c7` | `ignore completed trip evidence` | cursor-aware verification with itinerary-wide veto preservation |

## Release posture

Task 12 remains a governed validation candidate. Historical or unavailable evidence cannot become current merely because connectivity returns; active-trip invalidations stay visible until exact bounded resolution; and completed travel cannot contaminate remaining-trip warnings.
