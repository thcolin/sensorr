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

If `npx nx --help` then fails on `mixin.stripAnsi is not a function`, look in `yarn.lock` for a `name string-width-cjs`, `name strip-ansi-cjs` or `name wrap-ansi-cjs` line. `@isaacs/cliui` pulls these three packages under `npm:` aliases, and yarn 1 can merge an alias with the real range into one entry named after the alias. It then installs the package under the alias only, so `cliui`, which `yargs` and Jest use, gets the ESM `string-width@5` hoisted at the root. Delete the `name ...-cjs` lines, then `rm -rf node_modules && yarn install`.

The root `.env` is tracked and carries the development defaults for the `NX_*` variables the apps read. Without it the API builds a `mongodb://undefined:undefined@undefined:undefined/sensorr` URI (`apps/api/src/app/app.module.ts:21`) and never connects.

### `yarn web`

Runs `nx run web:serve-h2`: the dev server, `nx run web:serve`, on http://localhost:4200, and `tools/dev/h2-front.mjs` in front of it, which serves the PWA on **https://localhost:4443** over HTTP/2. Open the https URL. `apps/web/project.json` sets no `port`, so the `@nx/webpack:dev-server` default applies. Requests to `/api` go through `apps/web/proxy.conf.json`, whose `target` decides which API answers them. Without an API behind it, the app stops at the login screen.

HTTP/2 is what lets several tabs load. A tab keeps four SSE streams open (`apps/web/src/contexts/MoviesMetadata/MoviesMetadata.tsx:80`, `apps/web/src/contexts/Jobs/Jobs.tsx:20` and `:45`, `apps/web/src/contexts/Notifications/Notifications.tsx:111`), five on `/jobs`, and over HTTP/1.1 Chrome opens at most six connections per host: on http://localhost:4200, a second tab never finishes loading. Over HTTP/2 every request of every tab shares one connection. Production is not affected, Caddy serves it over HTTP/2.

The front forwards everything to `http://localhost:4200`, `/api` and its SSE streams included, unbuffered. The live-reload websocket follows the page's origin (`publicHost` in `apps/web/project.json`); browsers open it as a separate HTTP/1.1 upgrade, which the front pipes to the dev server and which does not count against the six connections. For other ports, `node tools/dev/h2-front.mjs <listen port> <dev server port>` next to your own `web:serve`.

It needs [mkcert](https://github.com/FiloSottile/mkcert). Without it, `nx run web:serve` alone serves HTTP/1.1 on http://localhost:4200, one tab at a time.

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

Serves the wrapped, the « Rétrospective » of its French copy, on **http://localhost:4230/wrapped/<token>**. Requests to `/api` go through `apps/wrapped/proxy.conf.json` to `http://localhost:4300`, a local `yarn api`; `--proxyConfig=<file>` points them elsewhere. The page has nothing to show until that API holds a Tautulli import, and Cortex has none before the wrapped ships, so run it on a local stack:

1. Mongo as a replica set, empty, and `yarn api` against it, with `tautulli.url` and `tautulli.key` in the local `config.json` (the key is a secret, never commit it).
2. `nx build cli`, then `bin/sensorr wrapped` on Node 18: about 30 minutes the first time for the whole history, a few seconds after.
3. A guest whose email is a Tautulli user's, then **Copy link** in the chevron menu of their row on Settings › Friends, or `POST /api/wrapped/tokens` with that email.

On a screen under 1024 px wide, a look that has stories (Télé for now, `STORIES` in `apps/wrapped/src/app/themes/index.ts`) shows them in place of the scrolling page. Each story is composed at 396 × 704 and shared as a 1080 × 1920 JPEG, drawn by the API: `GET /api/wrapped/share/<token>/cards/<look>/<story>` opens `/wrapped/<token>?card=<story>&look=<look>` in a headless Chromium (`apps/api/src/app/wrapped/cards.service.ts`) and keeps the image in `$TMPDIR/sensorr-cards` for the day. The API finds that page at `NX_WRAPPED_URL`, `http://sensorr-web` by default. In the compose stack it drives the `sensorr-chromium` container through `NX_CHROMIUM_URL`; locally, leave that variable out and point `NX_CHROMIUM_PATH` at a Chromium the API launches itself. Start the API with `NX_WRAPPED_URL=http://localhost:4230` and `NX_CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`, and `nx run wrapped:serve` alongside. The Mac's Chrome paints the Affiche with the GPU; the container does it in software, as on the server.

Check it at 390 px wide first, then 1440 × 900, on three guests: a heavy one, a median one (about 55 plays in 2026) and one under 10 plays, which gets the short version. Check every look: on a year set to `Any` in Settings › Friends, `localStorage['wrapped-look:<token>']` set to `affiche`, `labo`, `tele`, `videoclub` or `scenario` opens the page in it, and a browser context of its own keeps two looks apart.

### The component gallery

**https://localhost:4443/design**, while `yarn web` is running. It renders the 156 stories exported by the 40 `*.stories.tsx` files of `libs/ui/src`, one page per story file, each story with its `.args` spread as props.

`/design/:stage/:component`, where a stage is a folder of `libs/ui/src` and a component is one story file: `/design/atoms/badge`, `/design/elements/grid`, `/design/inputs/select`, `/design/components/movie`. Both `/design` and `/design/:stage` redirect to their first entry. The stages come from the files found, so `layout` has no tab as long as `libs/ui/src/layout` holds no story file. Only the story file of the URL is mounted, which is what keeps a virtualized `Grid` or `List` from being measured inside a container that has no height.

`apps/web/src/pages/Design/stories.ts:48` finds the files with webpack's `require.context`, so a new `*.stories.tsx` appears without registering it anywhere. `apps/web/src/pages/App.tsx:66` requires the page behind `process.env.NODE_ENV !== 'production'`: webpack folds the branch, so neither the gallery nor the 40 story modules reach a production build.

No story throws on render: the 40 pages were opened one by one on 2026-09-18 and none of the 156 figures showed the error boundary. `apps/web/src/pages/Design/Boundary.tsx` catches a story that throws and shows its name and error message in place of the component, so one broken story never blanks the page.

## Verify

Two commands are the gate, `lint` and `test`. `test` exits 0. `lint` does not, on errors that were already in the code, counted below.

### Lint

```sh
npx nx run-many --target=lint --all
```

Exits 1 on real lint errors. Until `@nx/eslint` replaced `@nrwl/linter@12.10.1`, the target never ran ESLint at all: it printed `Successfully ran target lint` with no output, then crashed on `hashCommand`. The errors below were already in the code then.

Measured on 2026-10-02 with ESLint 9.39.5 and typescript-eslint 8.71, `@nx/enforce-module-boundaries` turned off, 554 errors and 1737 warnings. Each project is linted from its own root, where its `eslint.config.mjs` lives:

| Project | Errors | Warnings |
| --- | --- | --- |
| `api` | 25 | 145 |
| `cli` | 16 | 71 |
| `web` | 176 | 780 |
| `wrapped` | 13 | 18 |
| `config` | 2 | 0 |
| `palette` | 59 | 13 |
| `plex` | 0 | 1 |
| `sensorr` | 2 | 111 |
| `services` | 142 | 117 |
| `theme` | 2 | 2 |
| `tmdb` | 12 | 15 |
| `ui` | 95 | 444 |
| `utils` | 10 | 20 |

Two rules make most of the errors: `@typescript-eslint/no-empty-object-type` (166) and `react-hooks/rules-of-hooks` (150). With the module boundaries rule on, `utils` stops on a crash of its fixer, `ENOENT ... libs/utils/src/regions/index.ts`, before ESLint prints its totals.

### Test

```sh
npx nx run-many --target=test --all
```

Exits 0: 512 tests, none failing, measured on 2026-10-02. A change is clean when it keeps it that way.

`apps/api/jest.config.cjs` runs the API specs through `ts-jest-mock-import-meta`, which turns `import.meta.url` into the URL of the file under test, because ts-jest compiles them to CommonJS. Webpack does the same at build time: the API bundle carries the source path of each service, which is how `config.service.ts` finds `config.json` from `dist/`.

A new red is not real until it survives a `yarn install`. A `node_modules` behind `yarn.lock` fails tests that pass on the locked versions, and a worktree that links the main checkout's `node_modules` inherits it. On 2026-09-29, oleoo 2.0.4 installed in place of the locked 3.1.1 failed 22 tests of `libs/sensorr/src/lib/show.spec.ts` and `drops a result oleoo refuses to parse and keeps the others` in `znab.spec.ts`. Both suites pass on 3.1.1.

### Build

```sh
npx nx build web
```

Not part of the gate, and the only one of the three that exits 0. It writes a 7.5 MB `dist/apps/web`, measured on 2026-09-25 with the Shows section in, which is the figure to compare a bundle change against. `npx nx build api`, `npx nx build cli` and `npx nx build wrapped` exit 0 as well.

## Project layout

`apps/` holds `api`, `web`, `wrapped`, `cli` and `db`. What each one owns is in [architecture.md](architecture.md#containers).

`libs/` holds `config` (the schema of `config.json`), `tmdb` and `plex` (the two external clients), `sensorr` (release parsing and policy scoring), `services`, `ui` (the shared components), `theme` and `palette`, `i18n` (English and French) and `utils`.

## Where things live

| File | What it holds |
| --- | --- |
| [configuration.md](configuration.md) | every key of `config.json`, generated from `libs/config/src/index.js` by `tools/docs/generate-configuration.mjs` |
| [architecture.md](architecture.md) | what talks to what |
| [jobs.md](jobs.md) | what each job is for, and how a release gets ranked |
| [../README.md](../README.md) | what Sensorr is, and the Docker install |
