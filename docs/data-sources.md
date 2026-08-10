# Data sources and operating limits

## Official sources used by shadow validation

The live-shadow command builds its source list from the application registry and retrieves the seven official MTA subway GTFS-Realtime route groups plus the official subway alerts feed. Retrieval follows the same HTTPS origin, redirect, size, content-type, atomic-cache, decoding, and coordinator boundaries used by the server code.

Shadow records contain exactly eight bounded source rows, accepted observation/retrieval/hash provenance when a source is accepted, safe outcome/reason codes, the canonical nine immutable exposure locks, and limited per-station operational claims. A single source snapshot does not establish stable identity, continuity, movement history, or a confidence range, so claims without governed recent history are suppressed with a bounded reason instead of manufacturing admission evidence. When `--compare` supplies an exact recent prior record, a claim can be admitted only if the same non-null service date and canonical service instance show exact ordered-stop progress and the existing arrival-admission boundary accepts the issued service decision, claim binding, feed, track, movement, recovery, destination, and exact stop-call evidence. Every intermediate station claim retains the train's actual terminal destination.

An admitted shadow claim always carries a compact proof bound to that comparison's earlier record and prior claim: prior observation/path, current movement evidence, future target event, eligible track, canonical trip/start-date/start-time/train service ownership, issued service-decision binding, and the exact admitted stop call. A record with no comparison context cannot contain an admitted claim. Accepted alert context records its exact current/stale state using the shared ten-minute threshold and a context identity recomputed from the canonical alert source row; stale or failed alerts cannot support eligible service.

Both admitted and suppressed exact claims are eligible for later physical-progress comparison. The later record binds the exact earlier file bytes by SHA-256, both record identities and decision times, and every earlier/later claim key. A comparison joins only the same source, train, service instance, and target stop-call, preserves repeated stop occurrences, records the disposition transition, and treats a changed path, missing service ownership, or an interval beyond 15 minutes as inconclusive. The prior record must pass the complete exact `shadow-v2` schema; one malformed or duplicate source, gate, claim, provenance join, decision, or comparison invalidates the whole record. Claims and comparison rows are retained in deterministic canonical order, with exact truncation counts when the fixed byte budget is reached.

Records contain no full admission audit, official alert text, rider coordinates, saved records, labels, active-trip or cursor details, permission state, push endpoint/token/key, VAPID private key, secret, or personal join key. The encoded record is rejected before a temporary file is opened if it exceeds the fixed size ceiling.

## Source roles

- Fresh GTFS-Realtime is the only positive basis for a live countdown.
- Service alerts can veto an arrival when a bypass, closure, suspension, or unresolved reroute may apply.
- Supplemented GTFS is preferred for planned service and labeled schedule fallback.
- Regular static GTFS provides stable topology and longer-range reference, never a replacement stop in a live train.
- Equipment inventory and outage endpoints are optional configuration. Missing, stale, empty, failed, or unvalidated equipment evidence stays unknown; it never means all equipment is working.

Optional endpoint URLs and `MTA_API_KEY` belong in a local `.env`, never source control. The example file contains names only, no working credential. Configuring an endpoint does not approve accessibility exposure.

## Known limits

Realtime identifiers can change, alert station/direction metadata can be incomplete, supplemented schedules contain most rather than all temporary changes, and dispatch changes can occur after the latest snapshot. Shadow comparison is therefore evidence for calibration, not a promise about physical train behavior.

The project contains no protected MTA logo or copied official map. App-owned structural geometry is labeled unofficial.

## State distinctions

- `validation`: deterministic demonstration surfaces only; public gates remain locked.
- `shadow`: official source observations for isolated quality review; no public boards.
- `live`: public runtime name only in this repository; status and rider data remain locked until governed evidence changes immutable exposure decisions in a later approved task.
