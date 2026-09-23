# Jobs, proposals and policy

Why Sensorr does what it does. The code says *what* happens; this file says *why* there are six jobs instead of one, why `refine` and `shrink` are separate, what a proposal costs you, and how a release ends up ranked first.

For the list of every setting and its default, see [`configuration.md`](./configuration.md). This file names settings but never redefines them.

## How a job runs

At boot the API registers one cron per job that is not `paused` (`apps/api/src/app/jobs/jobs.controller.ts:16`, `apps/api/src/app/jobs/jobs.service.ts:88`). A cron tick spawns the CLI as a child process, one command per job (`apps/api/src/app/sensorr/sensorr.service.ts:85`). Started that way the CLI prints a job id as its first line (`apps/cli/src/main.js:32`), and every log line the run emits carries it (`apps/cli/src/utils/command.js:15`), which is what the Jobs screen streams back.

The same six commands can be started by hand with `POST /jobs` and killed with `DELETE /jobs/:job` (`apps/api/src/app/jobs/jobs.controller.ts:30`, `:69`). Nothing else is runnable: the API refuses any command outside its allow-list (`apps/api/src/app/sensorr/sensorr.service.ts:22`).

`migrate` is a seventh CLI command (`apps/cli/src/main.js:71`) and deliberately not a job: it imports a legacy dump once, it has no cron key and the API will not start it.

## The jobs

Six jobs, three concerns. `record`, `refine` and `shrink` talk to indexers and put files in the blackhole. `sync` and `keep-in-touch` talk to Plex. `refresh` talks to TMDB.

### `record`

Find a release for a movie you want and do not have.

Takes every `wished` movie that has no proposal pending (`apps/cli/src/commands/record.js:40`). For each one it builds search terms from the movie titles and years, queries every enabled indexer, ranks what comes back through the policy, and keeps the first result (`apps/cli/src/components/Tasks/ProcessMoviesTask.js:229`, `:280`).

When a valid release wins, the movie moves to `archived`, the release is appended to its release list, and the `.torrent` is fetched from the indexer and written to the blackhole (`apps/cli/src/components/Tasks/ProcessMoviesTask.js:359`). That last write is the whole point of Sensorr: your download client watches that directory.

It is the only one of the three that has no "before" to compare against. A wished movie owns nothing, so any valid release is an improvement.

### `refine`

Replace a release you already own with a better one, until the policy's end-goal is met.

Takes `archived` movies whose per-movie `refine` flag is on, with no proposal pending (`apps/cli/src/commands/refine.js:40`). Then it filters client-side, and this filter is what makes `refine` different from `record`: it keeps only the movies where **none** of the releases already owned passes the policy in strict mode (`apps/cli/src/commands/refine.js:57`). Strict mode is the only mode where the `require` group is enforced (`libs/sensorr/src/lib/policy.ts:293`), so "no owned release is valid in strict mode" reads as "this movie has not reached the end-goal you described in `require`".

Each candidate must beat what you own on score, not merely be valid: a release scoring at or below the best owned release is withdrawn with `doesn't overcome existing releases` (`apps/cli/src/components/Tasks/ProcessMoviesTask.js:306`). Every movie it looks at gets `refined_at` stamped, treated or not (`apps/cli/src/components/Tasks/ProcessMoviesTask.js:215`), which is how the next run sorts.

### `shrink`

Keep the same quality, take less disk.

Same source set as `refine` — `archived`, per-movie `shrink` flag on, no proposal pending (`apps/cli/src/commands/shrink.js:40`) — and the **mirror image** of its filter: it keeps only the movies where **at least one** owned release passes in strict mode (`apps/cli/src/commands/shrink.js:58`). `refine` handles the movies below the end-goal, `shrink` handles the movies at it. A movie is in exactly one of the two sets at any time, which is why both can be scheduled without fighting each other.

Two things then change. The policy is applied with `sorting: 'size'` and `descending: false`, so among equally scored releases the smallest wins instead of the most seeded (`apps/cli/src/components/Tasks/ProcessMoviesTask.js:220`). And the guard is stricter than `refine`'s: a candidate is rejected if it scores at or below what you own **or** if it is not smaller, sizes being compared rounded to 10 MB so that a few megabytes saved do not justify a re-download (`apps/cli/src/components/Tasks/ProcessMoviesTask.js:336`). It stamps `shrinked_at` the same way `refine` stamps `refined_at`.

`jobs.shrink.threshold` exists to keep the job away from movies that are already small — there is nothing to win shrinking a 700 MB file. Read it before trusting it: the CLI sends the threshold as a `releases.size` query parameter (`apps/cli/src/commands/shrink.js:45`), and the movies endpoint only reads `release_size.gte` and `release_size.lte` (`getMovies` in `apps/api/src/app/movies/movies.service.ts`). The key sent is not one the API knows, so today the threshold does not narrow the set and the strict-mode filter does all the work.

### `sync`

Make Sensorr's idea of your library match Plex's.

Refuses to start without a registered Plex server (`apps/cli/src/commands/sync.js:21`). It reads every movie in every Plex movie section (`apps/cli/src/commands/sync.js:99`) and, for each, rebuilds a release name out of the Plex media metadata — codec, resolution, audio streams, subtitle languages — rather than trusting the filename alone (`apps/cli/src/commands/sync.js:167`). Those releases are tagged `from: 'sync'` (`apps/cli/src/commands/sync.js:279`) so they can be told apart from what Sensorr downloaded itself, and they are what `refine` and `shrink` compare candidates against. Without `sync`, a library filled by hand has nothing to compare to and `refine` would re-download everything.

The reverse direction matters too: a movie Sensorr believes is `archived` but that Plex no longer has becomes `missing`, and its `from: 'sync'` releases are dropped (`apps/cli/src/commands/sync.js:377`). Unbinding the Plex server pulls every `from: 'sync'` release from every movie for the same reason (`handlePlexReset` in `apps/api/src/app/movies/movies.service.ts`).

### `keep-in-touch`

Turn guests' Plex watchlists into requests.

For each guest it pings the Plex token first, because reading a profile or a watchlist does not refresh a token's last-used date and Plex expires idle tokens (`apps/cli/src/commands/keep-in-touch.js:134`). Then it reads the watchlist and records who asked for what (`apps/cli/src/commands/keep-in-touch.js:152`, `:178`).

A watchlisted movie Sensorr does not know is created in state `ignored`, not `wished` (`apps/cli/src/commands/keep-in-touch.js:257`). This is deliberate: a guest adding a film to their watchlist is a request, not a decision. Nothing reaches `record` until someone wishes it.

A guest whose token fails is flagged `plex_token_valid: false` rather than skipped silently, so the failure is visible instead of looking like an empty watchlist (`apps/cli/src/commands/keep-in-touch.js:160`).

### `refresh`

Keep TMDB metadata from going stale.

Walks every movie and person id Sensorr stores (`FetchAPIEntitiesTask` in `apps/cli/src/commands/refresh.js`), then re-fetches each one from TMDB and writes it back (`FetchTMDBChangesTask`, same file). That second task also trims a movie's `release_dates` down to theatrical releases, one per year, before the write, to keep the stored document small.

It writes TMDB fields only. Movie documents are updated field by field (`upsertMovie` in `apps/api/src/app/movies/movies.service.ts`), so `state`, `policy`, releases and per-movie flags survive a refresh untouched.

## Proposals

A job with `proposalOnly` on does the same search and the same ranking, and stops one step short of acting. Three things change, all in the same block (`apps/cli/src/components/Tasks/ProcessMoviesTask.js:359`):

- the movie is **not** moved to `archived` — the `state` field is simply left out of the write;
- the release is stored with `proposal: true` (`apps/cli/src/components/Tasks/ProcessMoviesTask.js:299`);
- the `.torrent` goes to `cache` instead of `fs` — it is kept as a document in the database keyed by the release link (`apps/api/src/app/sensorr/sensorr.service.ts:56`) instead of being written to the blackhole.

Nothing has been downloaded and nothing has been claimed. A `refine` or `shrink` proposal shows up on the Swaps screen (`/movie/swaps`), and both the notification and the screen offer the same two gestures. A `record` proposal has no owned release to swap, so it stays off that screen and is decided from the notification or from the proposal badge on the poster.

**Accept.** The movie is set to `archived` and the release is marked `choice: true` (`apps/web/src/contexts/MoviesMetadata/MoviesMetadata.tsx:90`). The API then reads the cached `.torrent`, writes it into the blackhole, and **deletes the cache entry** (`upsertMovies` in `apps/api/src/app/movies/movies.service.ts`, calling `apps/api/src/app/sensorr/sensorr.service.ts:46`). The same method drops the `proposal` flag, so the stored release becomes an ordinary owned one, and amends the job's log lines as treated.

**Refuse.** The cached `.torrent` is deleted and the release is filtered out of the movie document entirely, both in that same `upsertMovies` (`apps/api/src/app/movies/movies.service.ts`, calling `apps/api/src/app/sensorr/sensorr.service.ts:63`). The movie keeps the state it had.

**Both gestures are irreversible, and for the same reason: the cached `.torrent` is destroyed either way.** Accepting moves it out of the cache into the blackhole; refusing deletes it. There is no third copy and no route that puts a proposal back. Undoing an accept means deleting the file from the blackhole by hand; undoing a refusal means re-running the job and hoping the indexer still carries the release. Refusing is not banning either — `banned_releases` is a separate list the policy reads on its own (`libs/sensorr/src/lib/policy.ts:122`), so a later run may well propose the same release again. Ban it explicitly if you never want to see it.

Picking a release by hand from a movie page takes the same path with `job: 'manual'`: since it was never cached, the `.torrent` is fetched from the indexer instead (`apps/web/src/components/Sensorr/index.tsx:279`, then the same `upsertMovies` in `apps/api/src/app/movies/movies.service.ts`).

## The policy

A policy turns a pile of indexer results into one ordered list. `Policy.apply()` runs every release through a fixed chain of normalizers and then sorts (`libs/sensorr/src/lib/policy.ts:108`). Each normalizer returns the release untouched if it has already been invalidated, so the first rule that rejects a release owns the reason shown in the logs.

In chain order (`libs/sensorr/src/lib/policy.ts:120`):

| Normalizer | Rejects when |
| --- | --- |
| `bannedReleases` | the title is in the movie's `banned_releases` |
| `collectionReleases` | the release is flagged `COLLECTION`, a box set rather than the film |
| `releasePublishDate` | it was published in a year earlier than every one of the movie's release years |
| `movieReleaseYears` | the year parsed from the title is not one of the movie's years |
| `releaseTitlesSimilarity` | the parsed title matches no known title well enough |
| `releasePolicy` | the release carries an `avoid` tag |
| `releaseRequirePolicy` | a non-empty `require` group has no match (strict mode only) |
| `releaseNoSeeders` | nobody is seeding it |

A normalizer that rejects also stamps the release with a `warning` severity. It is not a rank and nothing sorts on it: a single threshold reads it, and that threshold splits the two failure modes a run reports. The two normalizers that enforce your policy, `releasePolicy` and `releaseRequirePolicy`, stamp at the threshold; every other one stamps above it. So a release the search should never have brought back is counted as *ignored*, and a release your policy turned down is counted as *withdrawn* (`apps/cli/src/components/Tasks/ProcessMoviesTask.js:37`, `:266`). *Ignored* points at the search: wrong terms, wrong years, nothing seeded. *Withdrawn* points at the policy, or at the `refine` and `shrink` guards, which stamp below the threshold when a candidate fails to beat what you own (`apps/cli/src/components/Tasks/ProcessMoviesTask.js:316`, `:341`). The severities themselves live in `Policy.normalizers`, `libs/sensorr/src/lib/policy.ts` — read them there rather than trusting a copy.

Titles are matched, not compared literally. Each release name is parsed into structured metadata, its title is measured against every known title of the movie, and a similarity below `0.6` rejects it (`libs/sensorr/src/lib/policy.ts:6`, `:221`). When a release carries an alternative title that matches better, the two are swapped so the rest of the chain works on the better one (`libs/sensorr/src/lib/policy.ts:231`).

### Three groups

`avoid` is a blacklist. Any release carrying an avoided tag is rejected outright, whatever else it has going for it (`libs/sensorr/src/lib/policy.ts:257`). `avoid.znab` goes further than the others: an avoided indexer is dropped before the search runs, so it is never even queried (`apps/cli/src/components/Tasks/ProcessMoviesTask.js:247`, `libs/sensorr/src/lib/sensorr.ts:84`).

`require` is the end-goal, and it is **not** applied when a job picks a release. It only runs in strict mode (`libs/sensorr/src/lib/policy.ts:293`), and strict mode has exactly two callers: the filters that decide whether a movie belongs to `refine` or to `shrink` (`apps/cli/src/commands/refine.js:59`, `apps/cli/src/commands/shrink.js:60`). So `require` does not say "never download anything else"; it says "keep refining until you have this". Put your target resolution and source there.

`prefer` is the ranking. It never rejects anything.

### What a score means

A release that matched a title gets 1000 points (`libs/sensorr/src/lib/policy.ts:252`), and one that is still valid at the end of the chain gets another 1000 (`libs/sensorr/src/lib/policy.ts:352`). So a valid candidate sits at 2000 before any preference is counted, and an invalid one can never outrank a valid one no matter how many preferred tags it carries. That is the point of the two flat thousands.

On top of that, each `prefer` list pays out by rank: a tag is worth `(length - index) / length` of 100 points, so with four entries the first is worth 100, then 75, 50, 25 (`libs/sensorr/src/lib/policy.ts:336`). Every tag that matches adds up, across every list (`libs/sensorr/src/lib/policy.ts:352`). Ordering a list is therefore the real control: moving a tag to the top of `prefer.resolution` is worth more than adding three tags at the bottom. `flags` is the exception and pays 100 for every match, since flags have no natural order.

Releases you already own have no indexer attached, and would lose every `prefer.znab` point against a fresh candidate for a reason that has nothing to do with quality. So when the policy is applied to owned releases, `prefer.znab` is replaced by a flat 100 (`libs/sensorr/src/lib/policy.ts:334`). Without it, `refine` and `shrink` would re-download the library on the first run.

Ties are broken by `sorting` and `descending` (`libs/sensorr/src/lib/policy.ts:131`) — most seeders for a policy created from Settings (`libs/config/src/index.js:209`), smallest first when `shrink` overrides it. The first release of the sorted list is the one a job acts on; nothing else is looked at.

## Tuning

Field names, types and defaults are in [`configuration.md`](./configuration.md). What follows is which knob to reach for.

**Stop a job without deleting it.** `jobs.<name>.paused`. A paused job gets no cron at boot (`apps/api/src/app/jobs/jobs.service.ts:90`) but stays runnable by hand from the Jobs screen.

**Spread the load.** `jobs.<name>.cron`. `record` runs daily because wishes arrive daily; `refine` and `shrink` are weekly or monthly because they re-download things you already have. Keep them apart: each one queries every indexer once per search term, per movie.

**Decide how much Sensorr does on its own.** `jobs.<name>.proposalOnly`. Off, the job downloads. On, it queues a proposal and waits. The shipped `config.default.json` turns it on for all three of `record`, `refine` and `shrink`; the schema defaults differ, `record` being the one that is off by default (`libs/config/src/index.js:61`). Turning it off for `refine` or `shrink` means agreeing in advance to replace files you already have.

**Exempt a movie from a job.** Per-movie `refine` and `shrink` booleans, both on by default (`apps/api/src/app/movies/movie.schema.ts:126`), toggled from the movie page (`apps/web/src/pages/Details/components/Metadata.tsx:70`). This is the right tool for the one film you want left exactly as it is, and it is cheaper than writing a policy for it.

**Change what wins.** The `prefer` lists and their order, then `sorting` and `descending` for ties. The first policy in the list is the default applied to movies that name none (`libs/sensorr/src/lib/policy.ts:75`).

**Change what is refused outright.** `avoid`. Remember it also silences an indexer entirely when used on `znab`.

**Change when `refine` lets go.** `require`. Everything else being equal, this is the setting that decides how long a movie keeps costing you bandwidth.

**Where files land.** `blackhole`, the directory both a recorded release and an accepted proposal are written to (`apps/api/src/app/sensorr/sensorr.service.ts:49`).
