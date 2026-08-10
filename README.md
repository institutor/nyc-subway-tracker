# NYC Subway Train Time Tracker

An unofficial, trust-first subway validation build. It demonstrates conservative arrival decisions, offline continuity, commute controls, accessibility constraints, and source diagnostics without opening any public release gate.

## Start from a fresh checkout

Requirements: Node.js 22 and pnpm 10 through Corepack.

```sh
corepack enable
pnpm install --frozen-lockfile
copy .env.example .env
```

On macOS or Linux, use `cp .env.example .env` instead of `copy`.

For local development, run the API and client in separate terminals:

```sh
pnpm run server
pnpm run dev
```

Open the Vite address shown in the second terminal. The default `.env.example` selects validation mode: demonstration data may be rendered, always labeled **Demonstration data -- not live**.

## Build and production-like preview

```sh
pnpm run typecheck
pnpm run build
pnpm run server
pnpm run preview
```

The API listens on `127.0.0.1:3000`; the preview server address is printed by Vite. These commands validate the deployable client bundle and API process. They do not make this build publicly releasable.

## Validation state

- **Validation:** local deterministic demonstration surfaces can render. All nine public exposure stages remain locked.
- **Shadow:** an explicit operator command retrieves official operational sources into ignored local storage and writes bounded, non-personal diagnostic records. It never exposes rider boards.
- **Public/live:** rider data surfaces remain locked because Gate 0, accessibility, guidance, map-rights, and commute evidence are not approved.

Run `pnpm run shadow:dry-run` to inspect shadow composition without network access. Run `pnpm run shadow:live` only when current external-source access is intended. See [data sources](docs/data-sources.md) and [testing](docs/testing.md).

## Privacy and offline behavior

Settings can delete saved stations and commute choices, last-station settings, the active trip and manual progress, and the app notification subscription. The result is reported per category. Official structural content and offline map assets are retained. The app does not claim to change operating-system location or notification permissions.

Offline mode keeps eligible structural maps, saved stations, and one active trip available without presenting arrivals, alerts, or equipment state as current.
