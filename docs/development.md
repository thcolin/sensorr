# Development

Running Sensorr from a clone, and changing it. To run Sensorr as a user, follow the Docker install in the [README](../README.md#install).

## Prerequisites

**Node 18.** Nothing in the repo pins a version: `package.json` has no `engines` field and there is no `.nvmrc`. Node 18 is what the images build on, `apps/api/Dockerfile:1` and `apps/web/Dockerfile:1` both start from `node:18-alpine`, so it is the version Sensorr is known to run on. For the CLI it is a requirement, see [`bin/sensorr` needs Node 18](#binsensorr-needs-node-18).

**Yarn 1.** `yarn.lock` is a v1 lockfile and there is no `packageManager` field, so nothing stops `npm install` from ignoring it. Install with yarn.

**Mongo as a replica set**, for anything that touches the API: it opens change streams, which a standalone `mongod` refuses ([architecture.md](architecture.md#data)). The `sensorr-db` service of `docker-compose.yml` gives you one.

**A TMDB API key**, set as `tmdb` in `config.json` or from the Settings page, for anything that reads metadata. **A Plex server** only for `sync movies`, `sync shows`, `report movies` and `keep-in-touch`.

## Install and run

```sh
yarn install
```

The root `.env` is tracked and carries the development defaults for the `NX_*` variables the apps read. Without it the API builds a `mongodb://undefined:undefined@undefined:undefined/sensorr` URI (`apps/api/src/app/app.module.ts:21`) and never connects.

### `yarn web`

Runs `nx run web:serve-h2`: the dev server, `nx run web:serve`, on http://localhost:4200, and `tools/dev/h2-front.mjs` in front of it, which serves the PWA on **https://localhost:4443** over HTTP/2. Open the https URL. `apps/web/project.json` sets no `port`, so the `@nx/webpack:dev-server` default applies. Requests to `/api` go through `apps/web/proxy.conf.json`, whose `target` decides which API answers them. Without an API behind it, the app stops at the login screen.

HTTP/2 is what lets several tabs load. A tab keeps four SSE streams open (`apps/web/src/contexts/MoviesMetadata/MoviesMetadata.tsx:80`, `apps/web/src/contexts/Jobs/Jobs.tsx:20` and `:45`, `apps/web/src/contexts/Notifications/Notifications.tsx:111`), five on `/jobs`, and over HTTP/1.1 Chrome opens at most six connections per host: on http://localhost:4200, a second tab never finishes loading. Over HTTP/2 every request of every tab shares one connection. Production is not affected, Caddy serves it over HTTP/2.

The front forwards everything to `http://localhost:4200`, `/api` and its SSE streams included, unbuffered. The live-reload websocket follows the page's origin (`publicHost` in `apps/web/project.json`); browsers open it as a separate HTTP/1.1 upgrade, which the front pipes to the dev server and which does not count against the six connections. For other ports, `node tools/dev/h2-front.mjs <listen port> <dev server port>` next to your own `web:serve`.

It needs [mkcert](https://github.com/FiloSottile/mkcert). Without it, `nx run web:serve` alone serves HTTP/1.1 on http://localhost:4200, one tab at a time; `nx e2e web-e2e` starts that target itself and needs nothing but Node.

The first run writes a certificate for `localhost`, `127.0.0.1` and `::1` with `mkcert` into `tmp/h2-front/`, which git ignores. To trust it, run `mkcert -install` once yourself: it asks for your password and adds mkcert's CA to the system keychain, which Chrome reads, and to Firefox's store when `certutil` is installed (`brew install nss`). Until then, browsers show a certificate warning. The origin is new, so the app asks you to sign in again.

### `yarn api`

Runs `nx run api:serve`, which builds `apps/api` and runs the bundle. It listens on **http://localhost:4300/api**: `apps/api/src/main.ts:27` reads `PORT`, then `NX_API_PORT`, then falls back to `3333`, and the root `.env` sets `NX_API_PORT=4300`.

It needs Mongo up as a replica set. On boot it also schedules one cron per job that is not `paused`, and those jobs write `.torrent` files and database documents for real ([architecture.md](architecture.md#how-the-api-runs-the-cli)), so never point a second API at a database another instance is already serving.

### `yarn cli`

Prints the yargs help and exits. `cli:serve` forwards no argument, and `apps/cli/src/main.js:94` shows the help when the command list is empty. To run a command, build once and use the wrapper:

```sh
nx build cli
bin/sensorr record movies
```

`bin/sensorr` runs the last build and not the working tree ([architecture.md](architecture.md#how-the-api-runs-the-cli)). A job about one media type takes it as its argument: `record`, `refresh` and `sync` take `movies` or `shows`, `refine`, `shrink` and `report` take `movies`, `airing` and `import` take `shows`. A type the command does not handle is refused with the list it accepts. `keep-in-touch` takes none. `migrate <archive>` imports a legacy dump and `migrate sonarr --url <Sonarr URL>` the series of a Sonarr server. An unknown command, `record-shows` among them, fails with `Unknown command`. Each one signs into the API and loads the configuration from it, so the API has to be up and `NX_SENSORR_USERNAME` / `NX_SENSORR_PASSWORD` set.

#### `bin/sensorr` needs Node 18

`bin/sensorr:3` runs `node --experimental-specifier-resolution=node`, and the bundle keeps extensionless imports of packages that have no `exports` map, `stream-json/jsonl/Parser` from `apps/cli/src/commands/migrate.js` among them. Node 19 removed what that flag did. Node 24 still accepts the flag and ignores it, so every command fails at load, before its first line, with `ERR_MODULE_NOT_FOUND` and `Did you mean to import "stream-json/jsonl/Parser.js"?`. Run the CLI on Node 18, like the images.

A local API spawns the same wrapper, so on Node 24 its jobs fail the same way: the child exits without printing the job id, and `POST /api/jobs` fails with `exited (1) before it started` (`runProcess` in `apps/api/src/app/sensorr/sensorr.service.ts`).

### `nx run wrapped:serve`

Serves the wrapped programme on **http://localhost:4230/wrapped/<token>**. Requests to `/api` go through `apps/wrapped/proxy.conf.json` to `http://localhost:4300`, a local `yarn api`; `--proxyConfig=<file>` points them elsewhere. The page has nothing to show until that API holds a Tautulli import, and Cortex has none before the wrapped ships, so run it on a local stack:

1. Mongo as a replica set, empty, and `yarn api` against it, with `tautulli.url` and `tautulli.key` in the local `config.json` (the key is a secret, never commit it).
2. `nx build cli`, then `bin/sensorr wrapped` on Node 18: about 30 minutes the first time for the whole history, a few seconds after.
3. A guest whose email is a Tautulli user's, then **Copy link** on Settings › Friends, or `POST /api/wrapped/tokens` with that email.

Check it at 390 px wide first, then 1440 × 900, on three guests: a heavy one, a median one (about 55 plays in 2026) and one under 10 plays, which gets the short programme.

### The component gallery

**https://localhost:4443/design**, while `yarn web` is running. It renders the 156 stories exported by the 40 `*.stories.tsx` files of `libs/ui/src`, one page per story file, each story with its `.args` spread as props.

`/design/:stage/:component`, where a stage is a folder of `libs/ui/src` and a component is one story file: `/design/atoms/badge`, `/design/elements/grid`, `/design/inputs/select`, `/design/components/movie`. Both `/design` and `/design/:stage` redirect to their first entry. The stages come from the files found, so `layout` has no tab as long as `libs/ui/src/layout` holds no story file. Only the story file of the URL is mounted, which is what keeps a virtualized `Grid` or `List` from being measured inside a container that has no height.

`apps/web/src/pages/Design/stories.ts:48` finds the files with webpack's `require.context`, so a new `*.stories.tsx` appears without registering it anywhere. `apps/web/src/pages/App.tsx:66` requires the page behind `process.env.NODE_ENV !== 'production'`: webpack folds the branch, so neither the gallery nor the 40 story modules reach a production build.

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

Exits 1. Four of the thirteen projects fail: `api`, `plex`, `tmdb` and `ui`. Jest reports 4 failed suites in `ui`, but two of those four do run and simply hold a failing test.

| Project | Failure |
| --- | --- |
| `api` | 1 suite of 3 never runs. `apps/api/src/app/sensorr/sensorr.service.spec.ts` imports `config.service.ts`, which ts-jest fails to compile: `TS1192: Module '"fs/promises"' has no default export`, `TS1259: Module '"path"' can only be default-imported using the 'esModuleInterop' flag`, `TS1343: The 'import.meta' meta-property is only allowed when the '--module' option is 'es2020', 'es2022', 'esnext', 'system', 'node16', 'node18', or 'nodenext'`. `apps/api/tsconfig.spec.json` sets `"module": "commonjs"` and no `esModuleInterop`. `notifications/push.spec.ts` and `config/migrate.spec.ts` pass |
| `tmdb` | 1 suite of 2 never runs: `libs/tmdb/src/__tests__/tmdb.spec.ts`, `TS2307: Cannot find module 'jest-fetch-mock'`, the package is not installed. `shows.spec.ts` passes |
| `plex` | 1 suite of 2 never runs: `libs/plex/src/lib/plex.spec.ts`, `TS2724: '"./plex"' has no exported member named 'plex'. Did you mean 'Plex'?`. `reports.spec.ts` passes |
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

Not part of the gate, and the only one of the three that exits 0. It writes a 7.5 MB `dist/apps/web`, measured on 2026-09-25 with the Shows section in, which is the figure to compare a bundle change against. `npx nx build api`, `npx nx build cli` and `npx nx build wrapped` exit 0 as well.

## Project layout

`apps/` holds `api`, `web`, `wrapped`, `cli`, `db` and `web-e2e`. What each one owns is in [architecture.md](architecture.md#containers).

`libs/` holds `config` (the schema of `config.json`), `tmdb` and `plex` (the two external clients), `sensorr` (release parsing and policy scoring), `services`, `ui` (the shared components), `theme` and `palette`, `i18n` (English and French) and `utils`.

## Where things live

| File | What it holds |
| --- | --- |
| [configuration.md](configuration.md) | every key of `config.json`, generated from `libs/config/src/index.js` by `tools/docs/generate-configuration.mjs` |
| [architecture.md](architecture.md) | what talks to what |
| [jobs.md](jobs.md) | what each job is for, and how a release gets ranked |
| [../README.md](../README.md) | what Sensorr is, and the Docker install |
