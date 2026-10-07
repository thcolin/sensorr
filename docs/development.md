# Development

Running Sensorr from a clone, and changing it. To run Sensorr as a user, follow the Docker install in the [README](../README.md#install).

## Prerequisites

**Node 24 or later.** `apps/api/package.json` and `apps/cli/package.json` require it in their `engines`, and the API specs need 24.9 for Jest's ESM support (see [Test](#test)). The images run Node 26, `apps/api/Dockerfile:1` and `apps/web/Dockerfile:1` start from `node:26-alpine`. The root `package.json` pins nothing and there is no `.nvmrc`.

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

The bundle keeps its packages as ESM imports, and Node resolves an ESM import only with its extension: a deep import of a package without an `exports` map, such as `stream-json/jsonl/parser.js` in `apps/cli/src/commands/migrate.js`, spells out its `.js` and its exact case.

### `nx run wrapped:serve`

Serves the wrapped, the « Rétrospective » of its French copy, on **http://localhost:4230/wrapped/<token>**. Requests to `/api` go through `apps/wrapped/proxy.conf.json` to `http://localhost:4300`, a local `yarn api`; `--proxyConfig=<file>` points them elsewhere. The page has nothing to show until that API holds a Tautulli import, and Cortex has none before the wrapped ships, so run it on a local stack:

1. Mongo as a replica set, empty, and `yarn api` against it, with `tautulli.url` and `tautulli.key` in the local `config.json` (the key is a secret, never commit it).
2. `nx build cli`, then `bin/sensorr wrapped`: about 30 minutes the first time for the whole history, a few seconds after.
3. A guest whose email is a Tautulli user's, then **Copy link** in the chevron menu of their row on Settings › Friends, or `POST /api/wrapped/tokens` with that email.

On a screen under 1024 px wide, a look that has stories (Télé for now, `STORIES` in `apps/wrapped/src/app/themes/index.ts`) shows them in place of the scrolling page. Each story is composed at 396 × 704 and shared as a 1080 × 1920 JPEG, drawn by the API: `GET /api/wrapped/share/<token>/cards/<look>/<story>?year=<year>` opens `/wrapped/<token>/<year>?card=<story>&look=<look>` in a headless Chromium (`apps/api/src/app/wrapped/cards.service.ts`) and keeps the image in `$TMPDIR/sensorr-cards` for the day. The API finds that page at `NX_WRAPPED_URL`, `http://sensorr-web` by default. In the compose stack it drives the `sensorr-chromium` container through `NX_CHROMIUM_URL`; locally, leave that variable out and point `NX_CHROMIUM_PATH` at a Chromium the API launches itself. Start the API with `NX_WRAPPED_URL=http://localhost:4230` and `NX_CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`, and `nx run wrapped:serve` alongside. The Mac's Chrome paints the Affiche with the GPU; the container does it in software, as on the server.

Check it at 390 px wide first, then 1440 × 900, on three guests: a heavy one, a median one (about 55 plays in 2026) and one under 10 plays, which gets the short version. Check every look: on a year set to `Any` in Settings › Friends, `localStorage['wrapped-look:<token>']` set to `affiche`, `labo`, `tele`, `videoclub` or `scenario` opens the page in it, and a browser context of its own keeps two looks apart.

### The component gallery

**https://localhost:4443/design**, while `yarn web` is running. It renders the 156 stories exported by the 40 `*.stories.tsx` files of `libs/ui/src`, one page per story file, each story with its `.args` spread as props.

`/design/:stage/:component`, where a stage is a folder of `libs/ui/src` and a component is one story file: `/design/atoms/badge`, `/design/elements/grid`, `/design/inputs/select`, `/design/components/movie`. Both `/design` and `/design/:stage` redirect to their first entry. The stages come from the files found, so `layout` has no tab as long as `libs/ui/src/layout` holds no story file. Only the story file of the URL is mounted, which is what keeps a virtualized `Grid` or `List` from being measured inside a container that has no height.

`apps/web/src/pages/Design/stories.ts:48` finds the files with webpack's `require.context`, so a new `*.stories.tsx` appears without registering it anywhere. `apps/web/src/pages/App.tsx:66` requires the page behind `process.env.NODE_ENV !== 'production'`: webpack folds the branch, so neither the gallery nor the 40 story modules reach a production build.

No story throws on render: the 40 pages were opened one by one on 2026-09-18 and none of the 156 figures showed the error boundary. `apps/web/src/pages/Design/Boundary.tsx` catches a story that throws and shows its name and error message in place of the component, so one broken story never blanks the page.

### The demo build

`nx run web:build:demo` builds the web app for **https://thcolin.github.io/sensorr/**, the public demo, with no server behind it. The controllers and services of `apps/api` run in the page: `apps/web/src/demo/server/app.ts` imports them, and the `demo` configuration of `apps/web/webpack.config.js` aliases what they import from Nest, mongoose and Node to `apps/web/src/demo/server/shims`. A model on [mingo](https://github.com/kofrasa/mingo) stands for mongoose, `apps/web/src/demo/server/model.ts`, and each visitor's data lives in their browser's `localStorage`. `fetch` and `EventSource` on `/api/` are answered there, `/api/proxy` by a made-up indexer (`apps/web/src/demo/releases.ts`), and what needs a server of its own, jobs, Plex, mails, guests, updates, answers 503. The other builds replace nothing and carry none of it: `apps/web/src/demo/index.ts` is a stub that the `demo` configuration swaps for `index.demo.ts`.

The data comes from TMDB at build time, never from the repository: TMDB data may not be kept more than 6 months.

```sh
export SENSORR_DEMO_TMDB_KEY=<the demo's own key>
npx ts-node -P tools/tsconfig.tools.json --transpile-only -O '{"target":"es2022","esModuleInterop":true}' tools/demo/seed.ts
npx nx run web:build:demo
```

The key ends up in the page, which is why it is the demo's own. `.github/workflows/demo.yml` runs the same on every push to `main` and on the first of each month, with the key as the `SENSORR_DEMO_TMDB_KEY` secret, and publishes `dist/apps/web-demo` to GitHub Pages. To look at it locally, serve `dist/apps/web-demo` under `/sensorr/` with `index.html` copied to `404.html`, as GitHub Pages answers a path it does not know.

## Verify

Two commands are the gate, `lint` and `test`, and both exit 0.

### Lint

```sh
npx nx run-many --target=lint --all
```

Exits 0, with warnings only. Until `@nx/eslint` replaced `@nrwl/linter@12.10.1`, the target never ran ESLint at all: it printed `Successfully ran target lint` with no output, then crashed on `hashCommand`.

The root `eslint.config.mjs` turns off `@typescript-eslint/no-empty-object-type` and `@typescript-eslint/no-empty-function`, and lets `no-empty` accept an empty `catch`, `no-unused-expressions` accept `a && b()`, `no-irregular-whitespace` accept the non-breaking spaces of template literals, and `prefer-const` accept a destructuring that reassigns part of its names. `libs/palette/src/lib/colorthief.js` is vendored and not linted.

### Test

```sh
npx nx run-many --target=test --all
```

Exits 0: 512 tests, none failing, measured on 2026-10-02. A change is clean when it keeps it that way.

ts-jest compiles the API specs to CommonJS, where `import.meta` does not exist: `apps/api/jest.import-meta.cjs` turns `import.meta.url` into the URL of the file under test. NestJS 12 ships ESM only and loads optional packages through `import()`, so `apps/api/.env.test` runs that project's Jest with `--experimental-vm-modules`. Webpack does the same at build time: the API bundle carries the source path of each service, which is how `config.service.ts` finds `config.json` from `dist/`.

A new red is not real until it survives a `yarn install`. A `node_modules` behind `yarn.lock` fails tests that pass on the locked versions, and a worktree that links the main checkout's `node_modules` inherits it. On 2026-09-29, oleoo 2.0.4 installed in place of the locked 3.1.1 failed 22 tests of `libs/sensorr/src/lib/show.spec.ts` and `drops a result oleoo refuses to parse and keeps the others` in `znab.spec.ts`. Both suites pass on 3.1.1.

### Build

```sh
npx nx build web
```

Not part of the gate; it exits 0. It writes a 7.9 MB `dist/apps/web`, measured on 2026-10-02, which is the figure to compare a bundle change against. `npx nx build api`, `npx nx build cli` and `npx nx build wrapped` exit 0 as well.

## Translations

Every text a reader sees goes through i18next, never in the code: `libs/i18n/src/translations/en/<zone>.js` and `fr/<zone>.js`, one file per zone, gathered by `en.js` and `fr.js`. A message uses ICU syntax, `{count, plural, one {# movie} other {# movies}}`, through `i18next-icu`. The names of Sensorr's concepts stay in English in both languages: Wished, Proposal, Policy, the jobs, Swap, Znab, Blackhole and the states.

- `i18next/no-literal-string`, set by `literalStrings` in the root `eslint.config.mjs`, refuses JSX text and the visible attributes in `apps/web`, `apps/wrapped` and `libs/ui`. It does not see a string in an object: those are read in review.
- `libs/i18n/src/language.spec.ts` fails when French and English stop carrying the same keys.
- `languageOf` in `libs/i18n/src/language.ts` decides the language: the `language` of the config, else the browser's, else the one of the TMDB `region`, else English.
- A text translated at import keeps the language of the import, and the language changes once the config loads: translate at render, with `t()` in the component, a getter, or `withTitle('<key>')`.
- The API answers an error as `{ code, message, values }`. `errorOf` in `apps/web/src/store/api.tsx` translates `errors.<code>`; `message` stays in English for the CLI and the logs. The mails use `@sensorr/i18n/server`, and the wrapped `@sensorr/i18n/wrapped`, which load their own zone only: the full set pulls `@sensorr/utils` into a bundle.
- `libs/sensorr` is bundled by the API and the CLI and imports no i18n: it writes its English for the logs and gives a `code` and `values` next to it, which the web translates (`policy.reasons`, `policy.diffusion`).
- The CLI's logs, shown as they are on the Jobs screen, stay in English.

## Dependencies held back

Measured on 2026-10-02. Each stays below its latest major until the reason goes away:

| Package | Held at | Reason |
| --- | --- | --- |
| `react`, `react-dom`, `@types/react` | 18 | `libs/ui/src/inputs/Range/Range.tsx` uses the `Slider` of `@material-ui/core` 4, which calls `findDOMNode`, gone in React 19 |
| `ink` | 5 | ink 6 needs React 19 |
| `react-router`, `react-router-dom` | 7 | react-router 8 needs React 19.2 |
| `eslint-plugin-react-hooks` | 5 | version 7 adds the React Compiler rules, which belong with React 19 |
| `eslint` | 9 | `eslint-plugin-react`, `eslint-plugin-jsx-a11y` and `eslint-plugin-import` do not declare ESLint 10 yet |
| `typescript` | 6.0 | typescript-eslint 8 accepts `<6.1.0` |
| `webpack-dev-server` | 5 | `@nx/webpack` 23 declares `^5` |
| `intl-messageformat` | 11 | `i18next-icu` declares `<12` |
| `@babel/*` | 7 | Nx 23 and its React preset build on Babel 7 |
| `winston-mongodb` | 5 | version 7 stores a log's properties under `metadata.metadata`, and the API reads `meta.job` |
| `@dicebear/core`, `@dicebear/collection` | 7 | a new major may redraw every avatar; not decided |

## Project layout

`apps/` holds `api`, `web`, `wrapped`, `cli`, `db` and `updater`. What each one owns is in [architecture.md](architecture.md#containers).

`libs/` holds `config` (the schema of `config.json`), `tmdb` and `plex` (the two external clients), `sensorr` (release parsing and policy scoring), `services`, `ui` (the shared components), `theme` and `palette`, `i18n` (English and French) and `utils`.

## Where things live

| File | What it holds |
| --- | --- |
| [configuration.md](configuration.md) | every key of `config.json`, generated from `libs/config/src/index.js` by `tools/docs/generate-configuration.mjs` |
| [architecture.md](architecture.md) | what talks to what |
| [jobs.md](jobs.md) | what each job is for, and how a release gets ranked |
| [../README.md](../README.md) | what Sensorr is, and the Docker install |
| [../tools/readme/build.py](../tools/readme/build.py) | the README's images: `python3 tools/readme/build.py` rebuilds the tile pages from captures in `tmp/readme/`, the steps to capture and encode them are at the top of the file |
| [../RELEASING.md](../RELEASING.md) | the beta and stable channels, and how to cut a release |
| [../CHANGELOG.md](../CHANGELOG.md) | what changed in each release |
