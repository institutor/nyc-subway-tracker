# Data sources and operating limits

## Official sources used by shadow validation

The live-shadow command builds its source list from the application registry and retrieves the seven official MTA subway GTFS-Realtime route groups plus the official subway alerts feed. Retrieval follows the same HTTPS origin, redirect, size, content-type, atomic-cache, decoding, and coordinator boundaries used by the server code.

Shadow records contain bounded operational source identifiers, accepted times, safe outcome/reason codes, immutable exposure locks, and limited operational train-progress candidates. They contain no rider coordinates, saved records, labels, active-trip or cursor details, permission state, push endpoint/token/key, VAPID private key, secret, or personal join key.

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
