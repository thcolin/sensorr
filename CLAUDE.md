# Sensorr

## What it does

Sensorr watches your indexers for the movies on a wishlist and drops the winning
`.torrent` file into a blackhole directory, where a download client picks it up. Built for
one user: me. The [README](README.md) is the user-facing version, and
[`docs/architecture.md`](docs/architecture.md) has the boundaries and the end-to-end flow.

## Repo

`thcolin/sensorr` on GitHub, **public**. Base branch is `dev`, not `master`. Nx 18
monorepo on yarn; what each app and lib is for is in
[`docs/development.md`](docs/development.md#project-layout).

Because the repo is public, no host name, no LAN or public IP address, and no real
credential belongs in a tracked file. Which file holds what, and what is actually secret,
is in [`docs/architecture.md`](docs/architecture.md#configuration-and-secrets).

## Run

Prerequisites, the three `yarn` targets, the CLI wrapper and the `/design` gallery are in
[`docs/development.md`](docs/development.md).

## Verify

```sh
npx nx run-many --target=lint --all
npx nx run-many --target=test --all
```

Neither exits 0, and both reds are pre-existing. `lint` finishes its work and *then* exits
1 on a `@nrwl/linter` crash, which is tooling and not a lint error: read its
`Successfully ran target lint` line instead of the exit code. `test` exits 1 on reds that
were already there. A change is clean when it adds no new red on top of those; the
project-by-project list to compare against, and the exact lint line to read, are in
[`docs/development.md`](docs/development.md#verify).

## Visual check

What `/thcolin:craft` and `/thcolin:design` read before touching a screen: how to run the app on real
data, what to open, how to capture.

- Frontend paths: `apps/web/**`, `libs/ui/**`, `libs/theme/**`.
- Run `yarn web` alone. `apps/web/proxy.conf.json` sends `/api` to the Cortex instance, so the app shows
  the real library, about 9 000 movies and 3 000 pending proposals. **Look, never act**: an `Accept`,
  `Refuse` or `Ban` click from this app writes on Cortex. Never start a second API against the Cortex
  database, see Pitfalls.
- Screens: `http://localhost:4200/movie/library`, `/movie/proposals`, `/jobs`, `/settings/policies`. The
  component gallery is `/design`, one story file per route, see
  [`docs/development.md`](docs/development.md#the-component-gallery).
- Capture with `mcp__chrome-devtools__take_screenshot`, window 1440×900; mobile at 390 px wide. Reference
  captures of every screen are in `docs/assets/screenshots/`, `*-desktop.webp` and `*-mobile.webp`.
- Visual authority: [`DESIGN.md`](DESIGN.md), derived from `libs/theme`; `node tools/docs/check-design.mjs`
  fails when they disagree. The impeccable design hook is installed in `.claude/settings.local.json`
  (`/impeccable hooks on`), and `/impeccable critique <source file>` writes to `.impeccable/critique/`,
  which stays tracked.

## Where the tracking lives

The worklog for a piece of work lives in my Obsidian vault, outside the repo. Nothing in
the repo mirrors it. In the repo, `docs/` carries the documentation.

## Autonomy

Commit and open a PR. No tag, no release, no deploy. The repo is public: say so before
pushing a branch or opening a PR.

## Commits

Conventional Commits, in English, scope = the area worked on. Recent history:
`feat(proposals): show each axis as a transition pill`.

## Pitfalls

**A second API means a second set of crons, writing for real.**
Every cron tick spawns `bin/sensorr <command>`, a process that writes `.torrent` files to
the blackhole and documents to Mongo. Never boot a second API against a database an
instance is already serving. The mechanism is in
[architecture.md](docs/architecture.md#how-the-api-runs-the-cli).

**`bin/sensorr` runs `dist/apps/cli/main.js`, not the sources.**
So every job the API starts runs the last `nx build cli`, not what you just edited in
`apps/cli/src` ([architecture.md](docs/architecture.md#how-the-api-runs-the-cli)). Worse
when the bundle is absent: `apps/api/src/app/sensorr/sensorr.service.ts:105` only logs the
spawn error, nothing rejects, and the `runProcess` promise never settles, so
`POST /api/jobs` hangs instead of failing.

**The CLI is not standalone.**
Every command logs into the API and loads the configuration from it before its body runs,
so the API must be up and `NX_SENSORR_USERNAME` / `NX_SENSORR_PASSWORD` set. And importing
its logger opens the Mongo connection at import time, unguarded: importing the store is
enough to connect ([architecture.md](docs/architecture.md#containers)).

**API and CLI disagree on the default port.**
`apps/cli/src/store/api.js:3` falls back to `4300`, the API to `3333`
([development.md](docs/development.md#yarn-api)). They only line up because the root `.env`
sets `NX_API_PORT=4300`. Run either without that variable and the CLI calls a port nobody
listens on.

**`config.json` at the root is live state, not a fixture.**
Booting the API against this checkout edits the file: it writes a generated Plex client
identifier on first boot, and rewrites the file whole on every settings change
([architecture.md](docs/architecture.md#configuration-and-secrets)).

**Mongo has to be a replica set.**
A plain `mongod` accepts the connection and then fails on the first SSE endpoint, because
the API opens change streams and those do not exist outside a replica set
([architecture.md](docs/architecture.md#data)).

**Stories are plain source, and the `/design` gallery is what renders them.**
The `*.stories.tsx` files under `libs/ui/src` are ordinary modules: a default export
carrying `title`, plus one named export per variant. They were excluded from
`libs/ui/tsconfig.lib.json` until this repo dropped Storybook, which is how a dead
`@storybook/react` import survived in all of them. They are now type-checked and linted
like any other file. Adding a variant means adding a named export, nothing else
([development.md](docs/development.md#the-component-gallery)).
