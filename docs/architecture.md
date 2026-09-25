# Architecture

What talks to what, and why. File inventories belong to `ls` and to the
[project graph](#project-graph), not here.

## Context

Sensorr is a self-hosted DVR for movies and TV series; the [README](../README.md) says what it does for the
person running it. It is built for a single household: one login
(`apps/api/src/app/auth/auth.service.ts:11` compares against two environment variables),
plus Plex accounts registered as guests.

Five systems live outside the boundary.

| System | Reached through | Called by |
| --- | --- | --- |
| TMDB | `@sensorr/tmdb` (`libs/tmdb/src/tmdb.ts:8`, `https://api.themoviedb.org/3/`) | the browser (`apps/web/src/store/tmdb.tsx:4`) and the CLI (`apps/cli/src/commands/sync.js:30`, `refresh.js`, `keep-in-touch.js`, `migrate.js`, and for series `refresh-shows.js`, `sync-shows.js`, `migrate-sonarr.js` through `fetchShow`, `libs/tmdb/src/shows.ts:97`) |
| znab indexers (Torznab) | `@sensorr/sensorr` (`libs/sensorr/src/lib/znab.ts:57`) | the CLI directly, the browser through the API proxy |
| Plex, `plex.tv` for PIN auth, `community.plex.tv` for the reported issues, and a Plex Media Server for the library | `@sensorr/plex` (`libs/plex/src/lib/pin.ts:3`, `reports.ts`, `plex.ts:4`) | the API (`plex.service.ts`, `guests.service.ts`) and the CLI (`sync movies`, `sync shows`, `keep-in-touch`, `report movies`) |
| Sonarr, its API v3 | a `GET`-only `fetch` in `apps/cli/src/commands/migrate-sonarr.js:38-48`, keyed by `SONARR_API_KEY` | the CLI only, `migrate sonarr`, a command run once by hand |
| Web push services | `web-push` in `apps/api/src/app/notifications/notifications.service.ts:107` | the API only |

The API never calls TMDB over HTTP. It imports `fields` from `@sensorr/tmdb` for query
building, and that module holds no `fetch`.

The blackhole is not a system, it is the handoff. Sensorr writes a file into a directory
(`apps/api/src/app/sensorr/sensorr.service.ts:64`) and stops there; whatever picks the file
up is never named, never configured, never contacted. Series have a blackhole of their own,
`shows.blackhole` (`sensorr.service.ts:34`), and one step more: `import shows` reads the
folder the download client saves into, `shows.staging`, and hard links the finished files
into the shows library. The client is still never contacted. What Sensorr relies on is
qBittorrent's `.!qB` suffix on an incomplete file and the sizes the `.torrent` announces
([A series release, end to end](#a-series-release-end-to-end)).

## Containers

Three applications and a database.

**`apps/web`** is a React PWA, served as static files. Talks to the API over HTTP under
`/api`, with a JWT in the `Authorization` header, and keeps Server-Sent Events streams open
for anything live: movie metadata (`movies.controller.ts:54`), show metadata (`shows.controller.ts:37`), jobs and their logs
(`jobs.controller.ts:21,25,45,61`), notifications (`notifications.controller.ts:14`). It
calls TMDB straight from the browser, and reaches the indexers through the API proxy:
`libs/sensorr/src/lib/znab.ts:37` rewrites the indexer URL into `/api/proxy?target=…` when
the `proxify` option is set, which `apps/web/src/store/sensorr.tsx:7` sets and the CLI does
not.

**`apps/api`** is the NestJS server. It owns Mongo, `config.json`, the two blackhole
directories and the cron schedule. Every route is behind a global JWT guard (`auth.module.ts:19`,
`auth.guard.ts:10`); only routes marked `@Public()` escape it: guest
registration, guest PIN status (`guests.controller.ts:10,16`) and the login route itself.

**`apps/cli`** is an `ink` terminal app. It carries every long job, one command per job
([jobs.md](jobs.md)). It is not standalone: the first thing any command does is log into
the API and load the configuration from it (`apps/cli/src/utils/command.js:9-13`), and
importing its logger opens a Mongo connection at module load
(`apps/cli/src/store/logger.js:5`).

**`apps/db`** is a `mongo:6.0.6` image with a replacement entrypoint. It is the only
container that is not an Nx project: it has no `project.json`, Docker builds it and
nothing else knows about it.

### How the API runs the CLI

By spawning a process. `apps/api/src/app/sensorr/sensorr.service.ts:104`:

```ts
const child = cp.spawn(SENSORR_BIN, [command, type].filter(Boolean))
```

`type` is `movies` or `shows`, left out for `keep-in-touch`: `record shows` runs
`bin/sensorr record shows` ([jobs.md](jobs.md#how-a-job-runs)).

`SENSORR_BIN` is `NX_SENSORR_BIN`, defaulting to `bin/sensorr` (`sensorr.service.ts:18`),
a shell wrapper that execs `dist/apps/cli/main.js` (`bin/sensorr:3`), so it runs the last build, not
the sources.

The handshake between them is one line of stdout. When stdin is not a TTY the CLI prints
`{"job":"<nanoid>"}` before anything else (`apps/cli/src/main.js:40-42`), and the API parses
that first line to learn the job id (`sensorr.service.ts:109-115`). After that the two never
speak over the pipe again: the CLI reports through the `log` collection in Mongo and acts
through the HTTP API, exactly like the browser does. The API keeps the child only to expose
progress (`jobs.controller.ts:26`) and to kill it (`sensorr.service.ts:139`).

The crons live on the same mechanism. `jobs.controller.ts:18` calls `setupCrons()` at boot,
`jobs.service.ts:78-100` creates one `CronJob` per command and type of `JOBS` that is not `paused`, and each tick
calls `runProcess`. So a second running API means a second set of crons writing for real.

## The main flow, end to end

How a wished movie becomes a `.torrent` in the blackhole.

```mermaid
flowchart TD
  cron["API cron tick<br/>jobs.service.ts:95"] --> spawn
  post["POST /api/jobs from Settings<br/>pages/Settings/Jobs.tsx:26"] --> spawn
  spawn["cp.spawn(bin/sensorr, record movies)<br/>sensorr.service.ts:104"] --> boot

  boot["CLI logs in, loads config from the API<br/>utils/command.js:9-13"] --> fetch
  fetch["GET /api/movies, state wished, no pending proposal<br/>commands/record.js:41"] --> query
  query["Build search terms from titles and years<br/>libs/sensorr/src/lib/sensorr.ts:46"] --> search
  search["One search per indexer per term<br/>libs/sensorr/src/lib/znab.ts:57"] --> policy
  policy["Policy filters, scores and sorts<br/>libs/sensorr/src/lib/policy.ts:116"] --> valid

  valid{"Is the best release valid ?"}
  valid -->|no| stop["Movie saved with its query, nothing downloaded<br/>ProcessMoviesTask.js:282-289"]
  valid -->|yes| branch

  branch{"jobs.record.movies.proposalOnly"}
  branch -->|false| direct["Movie set to archived, release appended<br/>ProcessMoviesTask.js:359"]
  branch -->|true| propose["Release appended with proposal true<br/>ProcessMoviesTask.js:299"]

  direct --> dlfs["POST /api/sensorr/release/download, destination fs<br/>ProcessMoviesTask.js:361"]
  propose --> dlcache["POST /api/sensorr/release/download, destination cache<br/>ProcessMoviesTask.js:361"]

  dlfs --> blackhole[".torrent written into the blackhole directory<br/>sensorr.service.ts:64"]
  dlcache --> cached["Torrent buffer stored in the blackhole collection<br/>sensorr.service.ts:73"]

  cached --> review["Swaps screen or notification, one decision per release"]
  review -->|accepted| accept["POST /api/movies with choice true<br/>movies.service.ts upsertMovies, cache to fs"]
  review -->|refused| refuse["Buffer deleted, nothing downloaded<br/>movies.service.ts upsertMovies"]
  accept --> blackhole
```

Every step writes to the `log` collection as it goes, and the API turns that collection's
change stream into the SSE the web app is listening to. That is why the Jobs screen follows
a run it never started.

`refine` and `shrink` are the same path with a different entry list and one extra guard:
they compare the candidate against the releases the movie already has, and refuse a release
that does not beat them on score, or on size for `shrink`
(`apps/cli/src/components/Tasks/ProcessMoviesTask.js:306-353`). Both default to
`proposalOnly`, `record` does not, see `docs/configuration.md`.

## A series release, end to end

How a wanted episode becomes a file in the shows library. The search is `record shows`,
daily, or `airing shows`, hourly, the same component with a narrower entry list
(`apps/cli/src/components/Tasks/ProcessShowsTask.js:21`, `:58`).

```mermaid
flowchart TD
  cron["API cron tick, record shows or airing shows<br/>jobs.service.ts:95"] --> fetch
  fetch["GET /api/shows, wished and monitored, kept when an episode is wanted<br/>ProcessShowsTask.js:32-37"] --> units
  units["Search units: whole series, season packs, then episodes<br/>libs/sensorr/src/lib/show.ts:85"] --> search
  search["tvsearch with season and ep, or search with SxxEyy<br/>libs/sensorr/src/lib/znab.ts:88"] --> policy
  policy["Policy checks level and years, then scores<br/>libs/sensorr/src/lib/policy.ts:133-135"] --> pick
  pick["Each release keeps the episodes it is the first to cover<br/>libs/sensorr/src/lib/show.ts:116"] --> picked

  picked{"Any release picked ?"}
  picked -->|no| stop["Nothing written, the run logs why"]
  picked -->|yes| branch

  branch{"proposal_only of the show, else the job's proposalOnly<br/>apps/cli/src/utils/shows.js:34"}
  branch -->|false| dlfs["POST /api/sensorr/release/download, destination fs, kind show<br/>ProcessShowsTask.js:349"]
  branch -->|true| dlcache["POST /api/sensorr/release/download, destination cache, kind show<br/>ProcessShowsTask.js:349"]

  dlfs --> blackhole[".torrent written into shows.blackhole, its file list kept on the release<br/>sensorr.service.ts:59-64"]
  dlcache --> cached["Torrent buffer stored in the blackhole collection<br/>sensorr.service.ts:73"]

  cached --> review["Show page or notification, one decision per release"]
  review -->|accepted| accept["POST /api/shows with choice true<br/>shows.service.ts:105"]
  review -->|refused| refuse["Buffer deleted, the covered episodes let go<br/>shows.service.ts:115-116"]
  accept --> blackhole

  blackhole --> client["The download client saves the files into shows.staging"]
  client --> import["import shows, every 10 minutes: every file at its size, none ending in .!qB<br/>apps/cli/src/utils/shows.js:96"]
  import --> link["Hard link into shows.library, Show (year)/Season NN/<br/>apps/cli/src/commands/import-shows.js:149"]
  link --> plex["Plex scans the shows library"]
  plex --> sync["sync shows reads the episode files, the episode is owned<br/>apps/cli/src/commands/sync-shows.js:192"]
```

Both a direct download and a proposal write the release onto the show and the release id
onto every episode it covers (`ProcessShowsTask.js:351-357`), so the episodes read
`proposed` from then on and no later run searches them again (`episodeStatus`,
`libs/sensorr/src/lib/episode.ts:4`). Refusing clears that id and the episodes are `wanted`
again, and so do two jobs: `import shows` for an accepted release still not imported a week
later (`import-shows.js:169-182`), `sync shows` for an episode whose file left Plex
(`sync-shows.js:201`). An episode is `owned` only once `sync shows` has seen its file on Plex: the import
stamps the release `imported_at` and writes nothing else on the episodes
(`import-shows.js:185-198`). Why each job selects what it does is in
[jobs.md](jobs.md#series).

### One volume for the hard link

`import shows` calls `fs.link` (`apps/cli/src/commands/import-shows.js:149`), and Linux
refuses a hard link across two mount points with `EXDEV`, even when both mount the same
filesystem. Inside a container every bind mount is a mount point of its own, so the staging
folder and the library have to come through one volume. `docker-compose.yml:51` mounts
`SENSORR_TVSHOWS` whole on `/tvshows`, and the three `shows` keys default to folders under
it (`libs/config/src/index.js:39-55`). On the host, the download client has to write into
that same filesystem.

A link that fails is logged and never replaced by a copy, which would take the space the link
saves (`import-shows.js:145`). Every error but `EEXIST` leaves the release for the next run
(`import-shows.js:152`, `:161`), so a split mount shows as the same warning every ten
minutes rather than as a silent miss.

## Data

One Mongo database, `sensorr`, eight collections. Schemas are Mongoose classes under
`apps/api/src/app/`.

| Collection | Schema | What it holds |
| --- | --- | --- |
| `movies` | `movies/movie.schema.ts:5` | a TMDB movie document, plus what Sensorr adds: `state`, `policy`, `query`, `releases[]`, `banned_releases`, `requested_by` |
| `shows` | `shows/show.schema.ts:5` | a TMDB TV show document, with the summary of its `seasons[]` and its `external_ids`, plus what Sensorr adds: `state`, `monitored`, `monitor_new_seasons`, `policy`, `proposal_only`, `path`, `plex_guid`, `requested_by`, `banned_releases`, `releases[]`. A release is stored once on the show, with the episodes it covers (`coverage`) and, once its `.torrent` has been read, its files (`torrent`) |
| `episodes` | `shows/episode.schema.ts:5` | a TMDB episode, tied to its show by `show_id`, plus `monitored`, the `files` `sync shows` saw on Plex, and `release`, the id of the release that covers it. Its status is computed from those, never stored (`episodeStatus` in `libs/sensorr/src/lib/episode.ts:4`) |
| `persons` | `persons/person.schema.ts:5` | a TMDB person document, plus `state`; `followed` keeps it, `ignored` deletes it (`upsertPerson` in `persons.service.ts`) |
| `guests` | `guests/guest.schema.ts:5` | a Plex account whose watchlist `keep-in-touch` reads, with its Plex token and that token's health |
| `log` | `logs/log.schema.ts:6` | every line any CLI run emits; a TTL index expires them after two weeks (`log.schema.ts:25`) |
| `subscriptions` | `notifications/subscription.schema.ts:4` | web push endpoints and their keys |
| `blackhole` | `sensorr/metafile.schema.ts:4` | the `.torrent` buffer of a pending proposal, keyed by the release link |

The `_id` of a movie, a person, a show and an episode is its TMDB id, not an ObjectId
(`movie.schema.ts:7-8`, `person.schema.ts:7-8`, `show.schema.ts:7-8`,
`episode.schema.ts:7-8`). There is no separate mapping table. The two TMDB id spaces do not
collide because movies and shows live in two collections.

Mongo has to run as a replica set, and that is not a preference. Three places call
`Model.watch()`: `logs.service.ts:14`, which the jobs and notifications streams are built on
(`jobs.service.ts:46`, `:69`, `notifications.service.ts:44`), `movies.service.ts:26` and
`shows.service.ts:31`, and change streams do not exist outside a replica set. A plain `mongod` accepts the connection and then fails on the first SSE endpoint.
`apps/db/docker-entrypoint.sh:11` starts `mongod --replSet rs0 --bind_ip_all --keyFile`,
generating the keyfile on first boot if it is missing (`:3-6`), and the `sensorr-db`
healthcheck of `docker-compose.yml` runs `rs.initiate` until it answers.

## Configuration and secrets

Configuration lives in three places, and they do not overlap.

**Process environment**, the `NX_*` variables. Where the database is, which port to
listen on, the login pair, the JWT secret. Read directly from `process.env`, never written.
Compose passes them in from `.env`.

**`config.json`** holds everything the running app can change about itself: the TMDB key,
the blackhole path, the indexers, the policies, the cron schedules, the Plex binding. Its
schema is the convict declaration in `libs/config/src/index.js`; the API resolves the file
at `apps/api/src/app/config/config.service.ts:16`, serves it over `GET /api/config` and
rewrites it whole on every settings change (`:59-63`). It also writes a freshly generated
Plex client identifier into it on first boot (`:31-38`), so booting the API against a
checkout edits the file. Before loading it, a file that still holds the job keys of before
`jobs.<command>.<type>` is copied to `.secrets/config.json.bak`, readable by its owner only,
and rewritten with every key moved, values kept (`migrate` in
`apps/api/src/app/config/config.service.ts`, `migrateJobs` in `apps/api/src/app/config/migrate.ts`).
A migrated file is left alone. Compose mounts `config.json` as a single file but `.secrets/`
as a folder (`docker-compose.yml`), so the copy lands on the host, in `./.secrets/`, and
outlives the container. `config.default.json` is the tracked template, `config.json` is
gitignored. The field-by-field reference is [`docs/configuration.md`](configuration.md),
generated from the schema. Do not restate it here.

**`.secrets/`** holds files generated once and kept: the VAPID keypair for web push,
created by `apps/api/docker-entrypoint.sh:3-6` and loaded into the environment at boot
(`apps/api/src/main.ts:13-17`), the Mongo replica set keyfile, and the copy of `config.json` taken before its jobs were migrated. Gitignored.

What is actually secret: `NX_SENSORR_AUTH_SECRET`, which signs the 90-day JWT
(`auth.module.ts:11-12`); the Mongo credentials; the TMDB key and every indexer key, which
sit inside `config.json`; `plex.token` in the same file; each guest's `plex_token` in Mongo;
and the VAPID private key. Everything in that list lives in a gitignored file or in the
database, none of it in the repository.

One boundary is deliberately loose and marked as such: `/api/proxy` forwards any request to
any URL passed as `?target=`. It is behind the JWT guard like every other route, but any
authenticated caller can use the API as an open forwarder. The TODO is in the code
(`apps/api/src/app/proxy/proxy.controller.ts:33`).

## Deployment

One `docker compose up` on a self-hosted server. `docker-compose.yml` defines three
services.

| Service | Image | Built from | Boundary it owns |
| --- | --- | --- | --- |
| `sensorr-web` | `sensorr/sensorr-web` | `apps/web/Dockerfile`, where `node:18-alpine` builds the PWA and `caddy:2.6.4` serves it | the only ports published, `5070` for HTTP and `5071` for HTTPS, from the `ports:` block of its `docker-compose.yml` service; Caddy reverse-proxies `/api/*` to `sensorr-api:4300` and falls back to `index.html` for everything else (`docker/sensorr-web/Caddyfile:11-18`) |
| `sensorr-api` | `sensorr/sensorr-api` | `apps/api/Dockerfile`, which builds **both** the api and the cli bundles and copies `dist/` and `bin/` into the runtime stage | Mongo, `config.json`, `.secrets/`, the blackhole and the shows directory, the last four mounted as volumes |
| `sensorr-db` | `sensorr/sensorr-db` | `apps/db/Dockerfile`, `mongo:6.0.6` with the replica set entrypoint | the data, under `./db` |

The shows directory is one volume and not three, for the hard link, see
[One volume for the hard link](#one-volume-for-the-hard-link).

Nothing but `sensorr-web` publishes a port. The API is reachable only through Caddy, and
Mongo only from inside the compose network.

The API image builds the CLI because the API spawns it
([How the API runs the CLI](#how-the-api-runs-the-cli)): compose sets
`NX_SENSORR_BIN=/app/bin/sensorr`, and both bundles were produced by
`apps/api/Dockerfile:14-17`. One image, two bundles, one spawn boundary between them.

## Project graph

Fourteen Nx projects, and the dependency edges between them are worth looking at rather
than reading. Generate the graph:

```sh
npx nx graph --file=docs/assets/nx-graph.html
```

Then open `docs/assets/nx-graph.html`. The output is gitignored: it drags a
`docs/assets/static/` directory of 3.7 MB behind it, which has no business in a repository
this size.

`apps/db` is absent from that graph, on purpose: it is not an Nx project, see
[Containers](#containers).
