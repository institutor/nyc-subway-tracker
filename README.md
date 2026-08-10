# NYC Subway Train Time Tracker

An unofficial, trust-first subway validation build. It demonstrates conservative arrival decisions, offline continuity, commute controls, accessibility constraints, and source diagnostics without opening any public release gate.

## Start from a fresh checkout

Repository: <https://github.com/institutor/nyc-subway-tracker> (private). The completed branch is `product-delivery-execution`.

Requirements: Node.js 22.12 or newer within Node 22, with Corepack enabled. The project pins pnpm 10.34.5.

```sh
git clone https://github.com/institutor/nyc-subway-tracker.git
cd nyc-subway-tracker
git switch product-delivery-execution
corepack enable
pnpm install --frozen-lockfile
copy .env.example .env
```

On macOS or Linux, use `cp .env.example .env` instead of `copy`.

For local development, run the API and client in separate terminals. The API process loads the checkout-root `.env`; Vite's client terminal is a separate process:

```sh
pnpm run server
pnpm run dev
```

Open the Vite address shown in the second terminal. The default `.env.example` selects validation mode: demonstration data may be rendered, always labeled **Demonstration data — not live**.

## Test the app

Run the complete automated checks from the checkout root:

```sh
pnpm test --run
pnpm run typecheck
pnpm run build
pnpm run test:e2e
pnpm run test:e2e:production-validation
```

The last command exercises the ordinary app and API in labeled validation mode. See [testing](docs/testing.md) for installed-Chrome setup, deterministic truth replays, and shadow-source diagnostics.

## Build and production-like preview

```sh
pnpm run typecheck
pnpm run build
```

Then keep the production API and production-like client preview in separate terminals:

```sh
# terminal 1 — loads .env and serves the API
pnpm run server

# terminal 2 — serves the built client
pnpm run preview
```

The API listens on `127.0.0.1:3000`; the preview server address is printed by Vite. These commands validate the deployable client bundle and API process. They do not make this build publicly releasable.

## Validation state

- **Validation:** local deterministic demonstration surfaces can render. All nine public exposure stages remain locked.
- **Shadow:** an explicit operator command retrieves official operational sources into ignored local storage and writes bounded, non-personal diagnostic records. It never exposes rider boards.
- **Public/live:** rider data surfaces remain locked because Gate 0 and the public-release accessibility, guidance, map-rights, and commute evidence are not approved. Validation demonstrations do not change that decision.

Gate 0 is **NO-GO**, and all nine public exposure gates remain false. This repository is complete as a validation build; it is not approved as a public live-data release.

Run `pnpm run shadow:dry-run` to inspect shadow composition without network access. Run `pnpm run shadow:live` only when current external-source access is intended. See [data sources](docs/data-sources.md) and [testing](docs/testing.md).

## Privacy and offline behavior

Settings can delete saved stations and commute choices, last-station settings, the active trip and manual progress, and the app notification subscription. The result is reported per category. Official structural content and offline map assets are retained. The app does not claim to change operating-system location or notification permissions.

Offline mode keeps eligible structural maps, saved stations, and one active trip available without presenting arrivals, alerts, or equipment state as current.
