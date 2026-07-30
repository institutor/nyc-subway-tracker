# Reroute, short-turn, and bypass acceptance cases

| Governance field | Value |
|---|---|
| Source sections | Approved specification §§8, 22, 27, and 31.2 scenarios 6–8; arrival-truth and service-changes plan Tasks 7 and 12 `Artifacts` and Task 7 `Ordered steps` |
| Owner | Release Quality Lead |
| Required reviewers | Product, Data Quality, Operations |
| Status | Draft |
| Last validation date | 2026-07-30 |
| Supersedes | None |
| Approval evidence | Pending — Truth Gate |
| Scenario results | Pending — Truth Gate |

## Purpose and authority

These cases define acceptance evidence for the [reroute and track-conflict playbook](reroute-and-track-conflict-playbook.md) and its integration into the [arrival board decision table](arrival-board-decision-table.md). They directly cover approved-specification scenarios 6–8 and prove the required novel-stop, contradiction, suspension, closure, and non-terminal track-conflict boundaries. They do not create a train, stop, platform, track assignment, service change, or release authority.

The [core arrival contract](core-arrival-contract.md), [evidence veto catalog](evidence-veto-catalog.md), [arrival admission and ordering contract](arrival-admission-and-ordering-contract.md), and [service-change impact and resolution policy](service-change-impact-and-resolution-policy.md) continue to govern their respective decisions. The [approved product specification](../../superpowers/specs/2026-07-30-nyc-subway-train-time-tracker-design.md) controls every conflict.

Every case is **Pending** until its setup is exercised against a fixed reviewed product version, the observed result is recorded, and the Truth Gate accepts the evidence. Expected results written here are not passing evidence.

## Required execution method

For a **planned** case, capture the ordered decisions exactly:

1. establish the effective supplemented pattern;
2. resolve active alert scope;
3. compare the live remaining-stop sequence;
4. suppress excluded targets; and
5. admit a novel rerouted stop only with a coherent live sequence plus supporting uncontradicted change evidence.

For an **unplanned** case, capture the ordered decisions exactly:

1. validate the fresh coherent live sequence as positive evidence;
2. resolve explicit skip, suspension, closure, or reroute evidence as a veto;
3. fail closed on contradiction;
4. make materially unresolved high-impact scope unavailable; and
5. admit a novel rerouted stop only when exact-direction live evidence and supporting uncontradicted path evidence both pass.

In every case, record route identity separately from service pattern and put the rider explanation beside the affected row, suppression, or unavailable state.

## Scenario 6 — One F train runs via the E

**Setup**

Use a fixed evidence fixture for an F train operating via the E line. Include:

- an original F exact directional stop absent from the coherent live remaining-stop sequence;
- an exact E-line station-direction present in that sequence;
- active supporting reroute evidence that resolves the operational path and does not contradict that E stop; and
- coherent destination, direction, movement, time, identity, and feed evidence.

**Expected decision**

Retain route identity **F** and treat **Via E line** as the service-pattern explanation. Suppress the F at the original F stop because its exact directional stop is absent. At the E-line stop, require the exact station-direction plus supporting uncontradicted reroute evidence before applying all remaining admission gates.

**Visible result**

The original F-stop board has no row for this train and shows **This F train is running via the E line and is not stopping here.** beside the suppression state. The verified E-stop board shows an **F** arrival with **Via E line** beside its actual destination.

**Prohibited outcome**

Do not show the F at the omitted original stop, relabel the train as E, admit an E station-complex or opposite-direction match, rely on a prediction without supporting reroute evidence, widen this one-train fixture to all F service, or place the explanation only on a generic alert page.

## Scenario 7 — Local train runs express

**Setup**

Use a fixed fixture whose coherent live remaining-stop sequence omits every local exact directional stop in a resolved express-running segment and retains independently eligible stops outside those omissions. Include supporting service-change scope for the affected direction.

**Expected decision**

Compare every candidate exact stop with the current sequence. Apply the missing-live-stop or resolved bypass veto at every omitted local stop. Keep only stops that remain in the sequence and pass all other gates.

**Visible result**

Every omitted local-stop board suppresses the train and places **This train is running express and is not stopping here.** beside the suppression state.

**Prohibited outcome**

Do not restore an omitted local stop from regular or supplemented static data, show the train at any skipped local stop, reduce confidence while retaining the arrival, or widen suppression beyond the supported segment and direction.

## Scenario 8 — Short-turn train

**Setup**

Use a fixed fixture whose coherent current pattern and supporting change evidence resolve an actual terminal earlier than the normal route pattern. Include an eligible exact directional stop before that terminal and candidate downstream boards beyond it.

**Expected decision**

Resolve destination and direction from the actual pattern. Keep the eligible pre-terminal arrival with the actual terminal as destination. Apply the short-turn veto to every downstream stop beyond that terminal.

**Visible result**

The pre-terminal row shows the actual destination with **Service ends at the destination shown.** Every downstream board has no row for the train and shows **This train ends before this stop.** beside the suppression state.

**Prohibited outcome**

Do not display the normal scheduled terminal, retain the train downstream, infer a cancellation, backfill a downstream stop from static data, or turn the short turn into a line-wide suspension.

## Case R4 — Express train runs local

**Setup**

Use a fixed fixture with additional exact directional stops present in a coherent live remaining-stop sequence and supporting uncontradicted changed-pattern evidence.

**Expected decision**

Evaluate each added stop separately. Admit an added stop only when its exact station-direction is present and all other gates pass. Suppress a proposed added stop that is absent or contradicted.

**Visible result**

Each admitted added-stop row shows **Running local.** A proposed unverified added-stop claim has no arrival row and shows **Service change—this arrival is not verified for this stop.**

**Prohibited outcome**

Do not infer every local stop from the category, route identity, or static pattern; admit a station-complex or opposite-direction match; or let a new predicted time override contradiction.

## Case R5 — Verified novel reroute stop

**Setup**

Exercise both reconciliation branches in separate fixed runs for a novel exact directional stop outside the normal route pattern:

1. a planned run with an effective supplemented pattern, active resolved alert scope, and a coherent live remaining-stop sequence; and
2. an unplanned run with a fresh coherent live sequence and current supporting reroute evidence.

In each run, the exact station-direction is present, destination and direction agree, supporting change evidence resolves the operational path, and no current veto applies.

**Expected decision**

Complete the applicable ordered reconciliation. Treat live exact-direction evidence and supporting path evidence as separate required proofs. Preserve route identity, apply the supported **Via…** service-pattern treatment, and then require every remaining admission gate.

**Visible result**

The novel-stop board shows the route's own identity and an admitted arrival with the supported **Via…** label beside the actual destination.

**Prohibited outcome**

Do not change route identity to the host line, admit from a station name without exact direction, skip the supporting-evidence requirement, invent an intermediate stop or platform, or use a static schedule as a live stop call.

## Case R6 — Contradicted novel stop

**Setup**

Use a fixed fixture with a live prediction for a novel exact directional stop plus current negative evidence that excludes or materially contradicts that stop. The contradiction may be a resolved bypass, suspension, closure, planned-pattern exclusion, unresolved reroute, or another hard veto already defined by the governing catalog.

**Expected decision**

Apply negative evidence before the positive prediction. Suppress the novel-stop arrival claim or make it unavailable when the high-impact scope is materially unresolved and no more specific consequence is supportable.

**Visible result**

No arrival row appears. Place **Service change—this arrival is not verified for this stop.** beside a resolved suppression, or **Service change—arrival information is unavailable for this service.** beside the unresolved claim state, with the official message preserved in details.

**Prohibited outcome**

Do not admit the prediction, reduce confidence while retaining the row, infer that route identity proves the stop, clear the veto from an absent alert, or invent the precise operational consequence of unresolved evidence.

## Case R7 — Partial suspension

**Setup**

Use a fixed active suspension fixture with a resolved segment and direction, affected candidate claims inside the segment, and independently coherent service outside it.

**Expected decision**

Suppress arrivals only inside the resolved suspended segment. Continue to evaluate service outside it from its own evidence.

**Visible result**

Affected boards show no arrival row and place **No service on this part of the line.** beside the suppression state. Independently admitted service outside the segment remains visible.

**Prohibited outcome**

Do not widen the suspension to the full line or opposite direction, keep an arrival inside the suspended segment, or invent a replacement train or stop.

## Case R8 — Full suspension

**Setup**

Use a fixed active full-suspension fixture with resolved route and time scope plus independently eligible unrelated routes, including any unrelated service represented in the fixture at a shared complex.

**Expected decision**

Remove the suspended route as an arrival option only inside the resolved active scope. Preserve unrelated routes and services.

**Visible result**

Affected boards place **Service is suspended on this line.** beside the route's suppression state. Unrelated coherent service remains visible.

**Prohibited outcome**

Do not retain the suspended route as an arrival, suppress the entire complex or network, infer a train cancellation, or invent substitute service.

## Case R9 — Station or constituent-station closure

**Setup**

Use a fixed active closure fixture that resolves boarding and alighting at one station or constituent station. Include affected arrivals and independently coherent unrelated service outside that exact closure scope.

**Expected decision**

Suppress affected boarding, alighting, and arrivals only at the resolved closed scope. Preserve unrelated constituent stations, routes, directions, and transfers.

**Visible result**

The affected board places **This station is closed.** beside the suppression state. Unrelated coherent service remains visible.

**Prohibited outcome**

Do not widen a constituent-station closure to the station complex, invent a platform closure, retain affected arrivals, or hide unrelated transfer service.

## Case R10 — Non-terminal actual-versus-scheduled-track conflict

**Setup**

Use a fixed fixture with an explicit actual-versus-scheduled-track conflict outside normal terminal behavior. Include a live prediction for an exact directional stop downstream of the conflicted path, unrelated coherent candidates, and a later current coherent update that either does or does not demonstrate a trustworthy path.

**Expected decision**

At conflict detection, invalidate the downstream stop claim and quarantine the train internally from affected scheduled station boards. Remove the downstream arrival and dependent platform guidance; do not reduce confidence while retaining it. Preserve unrelated candidates.

For the later update, restore the downstream claim only if the train instance, ordered remaining stops, actual destination and direction, exact target stop, and track/path evidence form a coherent trustworthy path and no other veto applies. If any requirement remains unresolved, keep the claim suppressed.

**Visible result**

While the conflict persists, the downstream board has no arrival row for the train and places **Service change—this train's downstream stops are not verified.** beside the suppression state. A qualifying later update permits a newly reevaluated arrival; a non-qualifying update leaves it absent.

**Prohibited outcome**

Do not show **Arrival uncertain**, continue a countdown, show a Scheduled replacement, retain or invent platform guidance, clear the conflict from a new prediction alone, apply the hard-conflict rule to normal terminal variation without separate invalidating evidence, or suppress unrelated trains.

## Truth Gate result record

| Case | Required actual-result evidence | Status |
|---|---|---|
| Scenario 6 — F via E | Omitted original F stop has no F row; verified exact E station-direction has an F row only with supporting uncontradicted reroute evidence; route remains F; **Via E line** is beside the actual destination | Pending |
| Scenario 7 — Local runs express | Every omitted local exact stop suppresses the train; retained stops remain independently eligible; no static reconstruction or confidence-only downgrade | Pending |
| Scenario 8 — Short turn | Pre-terminal row uses the actual terminal; every downstream board removes the train; no normal-terminal or static backfill | Pending |
| R4 — Express runs local | Only exact added stops in the coherent live pattern and supported change path are admitted; proposed absent or contradicted added stops are suppressed | Pending |
| R5 — Verified novel reroute stop | Planned and unplanned ordered reconciliation both require exact-direction live evidence plus supporting uncontradicted path evidence; route identity remains separate from **Via…** pattern | Pending |
| R6 — Contradicted novel stop | Negative evidence defeats the positive prediction; no weaker arrival row survives; rider explanation is beside the suppression or unavailable state | Pending |
| R7 — Partial suspension | Arrivals inside only the resolved segment are removed; independently coherent outside service remains visible | Pending |
| R8 — Full suspension | Suspended route is absent only in the resolved active scope; unrelated service remains visible | Pending |
| R9 — Station closure | Affected boarding, alighting, and arrivals are removed only at the exact closed scope; unrelated complex service remains visible | Pending |
| R10 — Non-terminal track conflict | Downstream arrival and guidance are removed, not confidence-reduced; only a later coherent trustworthy path permits readmission; unrelated trains remain visible | Pending |

For every run, capture the fixed reviewed product version, complete inputs without invented operational facts, source timestamps and effective periods, planned or unplanned ordered reconciliation, route identity and service pattern separately, exact directional-stop decision, every veto, rider-visible result, prohibited-result checks, date, and reviewer. Failures remain recorded and must link their correction and rerun.
