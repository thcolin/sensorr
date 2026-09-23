# Development

Running Sensorr from a clone, and changing it. To run Sensorr as a user, follow the Docker install in the [README](../README.md#install).

## Prerequisites

**Node 18.** Nothing in the repo pins a version: `package.json` has no `engines` field and there is no `.nvmrc`. Node 18 is what the images build on, `apps/api/Dockerfile:1` and `apps/web/Dockerfile:1` both start from `node:18-alpine`, so it is the version Sensorr is known to run on.

**Yarn 1.** `yarn.lock` is a v1 lockfile and there is no `packageManager` field, so nothing stops `npm install` from ignoring it. Install with yarn.

**Mongo as a replica set**, for anything that touches the API: it opens change streams, which a standalone `mongod` refuses ([architecture.md](architecture.md#data)). The `sensorr-db` service of `docker-compose.yml` gives you one.

**A TMDB API key**, set as `tmdb` in `config.json` or from the Settings page, for anything that reads metadata. **A Plex server** only for the `sync` and `keep-in-touch` commands.

## Install and run

```sh
yarn install
```

The root `.env` is tracked and carries the development defaults for the `NX_*` variables the apps read. Without it the API builds a `mongodb://undefined:undefined@undefined:undefined/sensorr` URI (`apps/api/src/app/app.module.ts:20`) and never connects.

### `yarn web`

Runs `nx run web:serve` and serves the PWA on **http://localhost:4200**. `apps/web/project.json` sets no `port`, so the `@nx/webpack:dev-server` default applies. Requests to `/api` go through `apps/web/proxy.conf.json`, whose `target` decides which API answers them. Without an API behind it, the app stops at the login screen.

### `yarn api`

Runs `nx run api:serve`, which builds `apps/api` and runs the bundle. It listens on **http://localhost:4300/api**: `apps/api/src/main.ts:27` reads `PORT`, then `NX_API_PORT`, then falls back to `3333`, and the root `.env` sets `NX_API_PORT=4300`.

It needs Mongo up as a replica set. On boot it also schedules one cron per job that is not `paused`, and those jobs write `.torrent` files and database documents for real ([architecture.md](architecture.md#how-the-api-runs-the-cli)), so never point a second API at a database another instance is already serving.

### `yarn cli`

Prints the yargs help and exits. `cli:serve` forwards no argument, and `apps/cli/src/main.js:82` shows the help when the command list is empty. To run a command, build once and use the wrapper:

```sh
nx build cli
bin/sensorr record
```

`bin/sensorr` runs the last build and not the working tree ([architecture.md](architecture.md#how-the-api-runs-the-cli)). The commands are `record`, `refresh`, `sync`, `refine`, `shrink`, `keep-in-touch` and `migrate`. Each one signs into the API and loads the configuration from it, so the API has to be up and `NX_SENSORR_USERNAME` / `NX_SENSORR_PASSWORD` set.

### The component gallery

**http://localhost:4200/design**, while `yarn web` is running. It renders the 156 stories exported by the 40 `*.stories.tsx` files of `libs/ui/src`, one page per story file, each story with its `.args` spread as props.

`/design/:stage/:component`, where a stage is a folder of `libs/ui/src` and a component is one story file: `/design/atoms/badge`, `/design/elements/grid`, `/design/inputs/select`, `/design/components/movie`. Both `/design` and `/design/:stage` redirect to their first entry. The stages come from the files found, so `layout` has no tab as long as `libs/ui/src/layout` holds no story file. Only the story file of the URL is mounted, which is what keeps a virtualized `Grid` or `List` from being measured inside a container that has no height.

`apps/web/src/pages/Design/stories.ts:48` finds the files with webpack's `require.context`, so a new `*.stories.tsx` appears without registering it anywhere. `apps/web/src/pages/App.tsx:62` requires the page behind `process.env.NODE_ENV !== 'production'`: webpack folds the branch, so neither the gallery nor the 40 story modules reach a production build.

No story throws on render: the 40 pages were opened one by one on 2026-09-18 and none of the 156 figures showed the error boundary. `apps/web/src/pages/Design/Boundary.tsx` catches a story that throws and shows its name and error message in place of the component, so one broken story never blanks the page.

### `nx e2e web-e2e`

Cypress 6.9.1 is installed and the target starts `web:serve` itself. `apps/web-e2e/src/integration/app.spec.ts` is still the generated skeleton, asserting `Welcome to web!`.

## Verify

Two commands are the gate, `lint` and `test`. Neither exits 0 today, and every red below is pre-existing.

### Lint

```sh
npx nx run-many --target=lint --all
```

Read the `Successfully ran target lint for 14 projects` line, **not** the exit code. Once the lint work is done the command exits 1 on `Cannot read properties of undefined (reading 'hashCommand')`, raised at `node_modules/@nrwl/linter/src/executors/eslint/hasher.js:12`. That is `@nrwl/linter@12.10.1` failing against `nx@18.3.5`, not a lint error.

### Test

```sh
npx nx run-many --target=test --all
```

Exits 1. Five of the thirteen projects fail: `api`, `sensorr`, `plex`, `tmdb` and `ui`. Jest reports 4 failed suites in `ui`, but two of those four do run and simply hold a failing test.

| Project | Failure |
| --- | --- |
| `sensorr`, `api` | Jest never starts: `module is not defined in ES module scope`. Each `jest.config.js` is CommonJS while `libs/sensorr/package.json:4` and `apps/api/package.json:3` declare `"type": "module"`. `apps/cli` had the same failure until its config was renamed `jest.config.cjs` |
| `tmdb` | `libs/tmdb/src/__tests__/tmdb.spec.ts`, `Cannot find module 'jest-fetch-mock'`, the package is not installed |
| `plex` | `libs/plex/src/lib/plex.spec.ts`, `TS2724: '"./plex"' has no exported member named 'plex'. Did you mean 'Plex'?` |
| `ui` | 2 suites of 9 never run, and 2 tests of 7 fail, see below |

Inside `ui`:

| Suite or test | Failure |
| --- | --- |
| `atoms/Focus/Focus.spec.tsx`, `atoms/Picture/Picture.spec.tsx` | `SyntaxError: Cannot use import statement outside a module`, from `node_modules/query-string/index.js`, which is ESM and left untransformed, reached through `libs/tmdb/src/tmdb.ts:1` |
| `State › should render successfully` (`components/Person/State/State.spec.tsx`) | `Element type is invalid ... but got: undefined` |
| `Link › should render successfully` (`atoms/Link/Link.spec.tsx`) | `TypeError: Cannot destructure property 'basename' ... as it is null`, the component is rendered outside a router |

A change is clean when it adds no new red on top of those.

### Build

```sh
npx nx build web
```

Not part of the gate, and the only one of the three that exits 0. It writes a 7.3 MB `dist/apps/web`, which is the figure to compare a bundle change against.

## Project layout

`apps/` holds `api`, `web`, `cli`, `db` and `web-e2e`. What each one owns is in [architecture.md](architecture.md#containers).

`libs/` holds `config` (the schema of `config.json`), `tmdb` and `plex` (the two external clients), `sensorr` (release parsing and policy scoring), `services`, `ui` (the shared components), `theme` and `palette`, `i18n` (English and French) and `utils`.

## Where things live

| File | What it holds |
| --- | --- |
| [configuration.md](configuration.md) | every key of `config.json`, generated from `libs/config/src/index.js` by `tools/docs/generate-configuration.mjs` |
| [architecture.md](architecture.md) | what talks to what |
| [jobs.md](jobs.md) | why there are six jobs, and how a release gets ranked |
| [../README.md](../README.md) | what Sensorr is, and the Docker install |
