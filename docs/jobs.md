# Jobs, proposals and policy

Why Sensorr does what it does. The code says *what* happens; this file says *why* there are seven movie jobs instead of one, what the five series jobs add, why `refine` and `shrink` are separate, what a proposal costs you, and how a release ends up ranked first.

For the list of every setting and its default, see [`configuration.md`](./configuration.md). This file names settings but never redefines them.

## How a job runs

A job is a command and, when it works on one media type, that type as its argument: `record movies`, `record shows`, `sync movies`. `keep-in-touch` takes none, it reads the movies and the shows of the watchlists in one pass. Which command takes which type is one table, `JOBS` (`libs/sensorr/src/lib/jobs.ts:4`):

| Command | Types |
| --- | --- |
| `record`, `refresh`, `sync` | `movies`, `shows` |
| `refine`, `shrink`, `report` | `movies` |
| `airing`, `import` | `shows` |
| `keep-in-touch` | none |

The CLI refuses a type a command does not handle with the list it accepts, `refine shows` among them (`typed` in `apps/cli/src/utils/command.js:22`). Its settings sit under `jobs.<command>.<type>`, `jobs.keep-in-touch` alone staying flat.

At boot the API registers one cron per job that is not `paused` (`apps/api/src/app/jobs/jobs.controller.ts:18`, `apps/api/src/app/jobs/jobs.service.ts:78`). A cron tick spawns the CLI as a child process, the command and its type as arguments (`apps/api/src/app/sensorr/sensorr.service.ts:104`). Started that way the CLI prints a job id as its first line (`apps/cli/src/main.js:41`), and every log line the run emits carries it (`apps/cli/src/utils/command.js:16`), which is what the Jobs screen streams back. A line also carries `meta.command`, the bare command, and `meta.type`, `movie` or `show`. A `refresh movies` line about a person says `person`, and a `keep-in-touch` line about a guest says nothing. A line logged before jobs took a type has none, and is read as a movie one (`jobNameOf`, `libs/sensorr/src/lib/jobs.ts:20`).

The same twelve jobs can be started by hand with `POST /jobs`, `{ command, type }`, and killed with `DELETE /jobs/:job` (`apps/api/src/app/jobs/jobs.controller.ts:31`, `:70`). Nothing else is runnable: the API refuses any command and type outside `JOBS` (`isJob`, `libs/sensorr/src/lib/jobs.ts:16`).

`migrate` and `migrate sonarr` are two more CLI commands (`apps/cli/src/main.js:82`) and deliberately not jobs: each imports once, from a legacy dump or from Sonarr, neither has a cron key and the API will start neither.

## The jobs

Seven movie jobs, three concerns. `record movies`, `refine movies`, `shrink movies` and `report movies` talk to indexers and put files in the blackhole. `sync movies`, `keep-in-touch` and `report movies` talk to Plex. `refresh movies` talks to TMDB. The sections below name them by their command.

### `record`

Find a release for a movie you want and do not have.

Takes every `wished` movie that has no proposal pending (`apps/cli/src/commands/record.js:41`). For each one it builds search terms from the movie titles and years, queries every enabled indexer, ranks what comes back through the policy, and keeps the first result (`apps/cli/src/components/Tasks/ProcessMoviesTask.js:229`, `:280`).

When a valid release wins, the movie moves to `archived`, the release is appended to its release list, and the `.torrent` is fetched from the indexer and written to the blackhole (`apps/cli/src/components/Tasks/ProcessMoviesTask.js:359`). That last write is the whole point of Sensorr: your download client watches that directory.

It is the only one of the three that has no "before" to compare against. A wished movie owns nothing, so any valid release is an improvement.

### `refine`

Replace a release you already own with a better one, until the policy's end-goal is met.

Takes `archived` movies whose per-movie `refine` flag is on, with no proposal pending (`apps/cli/src/commands/refine.js:41`). Then it filters client-side, and this filter is what makes `refine` different from `record`: it keeps only the movies where **none** of the releases already owned passes the policy in strict mode (`apps/cli/src/commands/refine.js:58`). Strict mode is the only mode where the `require` group is enforced (`libs/sensorr/src/lib/policy.ts:333`), so "no owned release is valid in strict mode" reads as "this movie has not reached the end-goal you described in `require`".

Each candidate must beat what you own on score, not merely be valid: a release scoring at or below the best owned release is withdrawn with `doesn't overcome existing releases` (`apps/cli/src/components/Tasks/ProcessMoviesTask.js:306`). Every movie it looks at gets `refined_at` stamped, treated or not (`apps/cli/src/components/Tasks/ProcessMoviesTask.js:215`), which is how the next run sorts.

### `shrink`

Keep the same quality, take less disk.

Same source set as `refine` — `archived`, per-movie `shrink` flag on, no proposal pending (`apps/cli/src/commands/shrink.js:41`) — and the **mirror image** of its filter: it keeps only the movies where **at least one** owned release passes in strict mode (`apps/cli/src/commands/shrink.js:59`). `refine` handles the movies below the end-goal, `shrink` handles the movies at it. A movie is in exactly one of the two sets at any time, which is why both can be scheduled without fighting each other.

Two things then change. The policy is applied with `sorting: 'size'` and `descending: false`, so among equally scored releases the smallest wins instead of the most seeded (`apps/cli/src/components/Tasks/ProcessMoviesTask.js:220`). And the guard is stricter than `refine`'s: a candidate is rejected if it scores at or below what you own **or** if it is not smaller, sizes being compared rounded to 10 MB so that a few megabytes saved do not justify a re-download (`apps/cli/src/components/Tasks/ProcessMoviesTask.js:336`). It stamps `shrinked_at` the same way `refine` stamps `refined_at`.

`jobs.shrink.movies.threshold` exists to keep the job away from movies that are already small — there is nothing to win shrinking a 700 MB file. Read it before trusting it: the CLI sends the threshold as a `releases.size` query parameter (`apps/cli/src/commands/shrink.js:46`), and the movies endpoint only reads `release_size.gte` and `release_size.lte` (`getMovies` in `apps/api/src/app/movies/movies.service.ts`). The key sent is not one the API knows, so today the threshold does not narrow the set and the strict-mode filter does all the work.

### `sync`

Make Sensorr's idea of your library match Plex's.

Refuses to start without a registered Plex server (`apps/cli/src/commands/sync.js:23`). It reads every movie in every Plex movie section (`apps/cli/src/commands/sync.js:102`) and, for each, rebuilds a release name out of the Plex media metadata — codec, resolution, audio streams, subtitle languages — rather than trusting the filename alone (`releaseOf` in `apps/cli/src/utils/plex.js`). The file name keeps the last word on the language, because Plex tracks are often tagged wrong: a French track tagged `en`, subtitles left outside the file. Plex fills a name that says nothing, and names the French that a name leaves plain, `MULTi` becoming `MULTi-VFF` from an `fr-FR` tag or a track titled `VFF`. Those releases are tagged `from: 'sync'` so they can be told apart from what Sensorr downloaded itself, and that rebuilt name is what `refine`, `shrink` and the Swaps screen compare candidates against (`scoredTitle` in `libs/sensorr/src/lib/utils.ts`), not the file name: a file called `Brazil` says nothing a policy can score. Without `sync`, a library filled by hand has nothing to compare to and `refine` would re-download everything.

The reverse direction matters too: a movie Sensorr believes is `archived` but that Plex no longer has becomes `missing`, and its `from: 'sync'` releases are dropped (`apps/cli/src/commands/sync.js:405`). Unbinding the Plex server pulls every `from: 'sync'` release from every movie for the same reason (`handlePlexReset` in `apps/api/src/app/movies/movies.service.ts`).

`sync` is also where an accepted swap ends. Accepting a `refine` or `shrink` proposal writes the new `.torrent` to the blackhole and leaves the old file where it is, so Plex ends up holding both as two versions of the same movie. The accepted release keeps `replaces`, the ids of the Plex versions the movie had at that moment, and `accepted_at` (`upsertMovies` in `apps/api/src/app/movies/movies.service.ts`). On each run, `sync` looks, across every Plex item of the movie, for a version that is not in `replaces` and whose size is within 2% of the accepted one: indexers round the size they announce (`apps/cli/src/utils/swaps.js`). With `jobs.sync.movies.cleanup` on, the first run that sees it deletes the replaced versions, files included, through `DELETE /library/metadata/{ratingKey}/media/{mediaId}` (`apps/cli/src/commands/sync.js`), and ends the swap. This relies on the download client writing outside the library and moving a file in once complete: Plex indexes a file as soon as it appears, so a client writing into the library folder under the final name could let `sync` delete the only complete copy. The Plex server must allow media deletion (*Settings > Library > Allow media deletion*), otherwise it answers 403 and the movie is reported under warnings. Nothing is deleted before the new version is on Plex: a download can fail silently, and the replaced version would then be the only copy.

With `jobs.sync.movies.cleanup` off, the swap ends as soon as it lands and nothing is deleted. A swap that has not landed a week after it was accepted is marked `overdue: true`, and the mark goes away if it lands later. The indexer size covers the whole torrent, samples and subtitles included, so a small release with a large sample can miss the 2% and turn `overdue` although it landed. While a swap is pending, `refine` and `shrink` skip the movie (`apps/cli/src/commands/refine.js`, `apps/cli/src/commands/shrink.js`): they would compare candidates with a release that is not on Plex yet. Only accepted proposals and `report` downloads carry `replaces`; `refine` or `shrink` with `proposalOnly` off, and a release picked by hand from the movie page, leave the old version on Plex.

An overdue swap shows up at the end of the Swaps screen, in the collapsed `overdue` group, with three gestures (`apps/web/src/pages/Proposals/queue.ts`). **Retry** accepts the same release again: the cache was emptied by the first Accept, so the `.torrent` is fetched from the indexer's `enclosure` (`apps/api/src/app/sensorr/sensorr.service.ts`), `replaces` and `accepted_at` are set anew and `overdue` is cleared. If the indexer no longer serves it, nothing is written and the error offers **Search**. **Search** opens the release drawer on the movie, and the release picked there takes the place of the overdue one, as a swap of the same command with `job: 'manual'`, so it replaces the Plex version once it lands. Like a pick from a movie page, it is sent at once, with no Undo. **Drop** removes the accepted release from the movie: the movie stays `archived` with the version Plex has, and `refine` or `shrink` may propose another one. It is not `missing`, since Plex still has a copy. Retry and Drop wait five seconds before they are sent, like Accept and Refuse, so the toast can take them back.

### `report`

Replace a movie someone reported from Plex with the best release that is not the one they watched.

Plex has a *Report an Issue...* entry on every movie (*Signaler un problème...* in French): a friend types a free text, and it lands in the server admin's *Reported Issues* feed. Plex offers no webhook or server event for it. The job reads the feed through `https://community.plex.tv/api`, the GraphQL endpoint Plex Web itself calls (`libs/plex/src/lib/reports.ts`). That endpoint is undocumented: Plex can change it without notice, and the job then fails with the error it got, visible on the Jobs screen. A report has no "resolved" status either, so the job keeps its own cursor, `jobs.report.movies.since`, the date of the newest report it has seen.

The first run only sets that cursor to now: reports made before the job was turned on are not replayed (`newReportsOf` in `apps/cli/src/utils/reports.js`). Every later run takes the reports of the registered server made after it. The cursor is written by the job alone: the Settings pages post the whole config they loaded, so the API drops `jobs.report.movies.since` from what they send (`update` in `apps/api/src/app/config/config.service.ts`). It is only a shortcut besides: a report already kept on a movie, same id, is never applied twice (`reportedOf`). Each one names a Plex item, not one of its versions, so the job resolves the item to an `archived` Sensorr movie through its TMDB guid, or its IMDB one when the TMDB guid matches nothing (`movieOf`), and bans **every** release the movie owns, by original name and by title (`bansOf`, same file). A report on a show, on an item Plex no longer has (a 404), or on a movie Sensorr does not know is logged and skipped; any other Plex error fails the run before the cursor moves. The report itself, text, date and Plex username, is kept on the movie under `reports`.

Then every archived movie whose latest report is newer than its `reported_at` is searched (`isPending`), and the search stamps `reported_at`, the way `refine` stamps `refined_at`. A search that throws stamps nothing, so the next run tries it again. The search itself goes like `record`'s: the best valid release wins, with no "must beat what you own" guard, since everything owned is now banned. It goes through `jobs.report.movies.proposalOnly` like any other job. On, the release is proposed and shows up on the Swaps screen; accepting it sets `replaces` as for `refine` and `shrink`. Off, the release is downloaded at once and carries `replaces` all the same (`apps/cli/src/components/Tasks/ProcessMoviesTask.js`): this is the one job whose direct downloads end in a swap, because leaving the reported version next to the new one on Plex would leave the problem in place. Either way, `sync` deletes the reported version only once the new one is on Plex, and only with `jobs.sync.movies.cleanup` on.

A movie that already has a proposal pending or a swap on its way gets its bans and its report, and is stamped without being searched: that pending release is already its replacement. The job does not answer the report in Plex, and does not read its text: a report that is not a problem still triggers a search, which is why `proposalOnly` is on by default.

### `keep-in-touch`

Turn guests' Plex watchlists into requests.

For each guest it pings the Plex token first, because reading a profile or a watchlist does not refresh a token's last-used date and Plex expires idle tokens (`apps/cli/src/commands/keep-in-touch.js:169`). Then it reads the watchlist and records who asked for what (`apps/cli/src/commands/keep-in-touch.js:187`, `:232`).

A watchlisted movie Sensorr does not know is created in state `ignored`, not `wished` (`apps/cli/src/commands/keep-in-touch.js:324`). This is deliberate: a guest adding a film to their watchlist is a request, not a decision. Nothing reaches `record` until someone wishes it.

A guest whose token fails is flagged `plex_token_valid: false` rather than skipped silently, so the failure is visible instead of looking like an empty watchlist (`apps/cli/src/commands/keep-in-touch.js:214`).

The shows of the watchlist are read in the same pass, with `type=2` (`apps/cli/src/commands/keep-in-touch.js:201`). A failure there is logged and skipped: the movies were read, so the token is fine (`:195`). A show is resolved to its TMDB id through the Plex metadata provider, and one Sensorr did not know is created `ignored`, unfollowed, every episode unfollowed (`requestedShowOf` in `apps/cli/src/utils/shows.js:28`), for the same reason as a movie: nothing reaches `record shows` until you follow it. Its Plex guid is kept on the show, so the next run skips the lookup.

### `refresh`

Keep TMDB metadata from going stale.

`refresh movies` walks every movie and person id Sensorr stores (`FetchAPIEntitiesTask` in `apps/cli/src/commands/refresh.js`), then re-fetches each one from TMDB and writes it back (`FetchTMDBChangesTask`, same file). That second task also trims a movie's `release_dates` down to theatrical releases, one per year, before the write, to keep the stored document small.

It writes TMDB fields only. Movie documents are updated field by field (`upsertMovie` in `apps/api/src/app/movies/movies.service.ts`), so `state`, `policy`, releases and per-movie flags survive a refresh untouched.

## Series

Five jobs, the same three concerns. `record shows` and `airing shows` talk to indexers and put files in the shows blackhole. `sync shows` talks to Plex, and `keep-in-touch` reads the shows of the watchlists too. `refresh shows` talks to TMDB. `import shows` is new: it is the only job that touches the files the download client wrote. All five are paused in the schema and in the shipped `config.default.json`, every `jobs.<command>.shows.paused` being `true` (`libs/config/src/index.js`), so an install searches nothing for series until they are started.

A show is followed at three levels: `monitored` on the show, on each episode, and a season is followed when its episodes are. `monitor_new_seasons` decides for a season TMDB adds later. An episode's status is computed, never stored (`episodeStatus`, `libs/sensorr/src/lib/episode.ts:4`): `owned` as soon as Plex has a file for it, `upcoming` until its air date, `unmonitored` when it is not followed, `proposed` while a release covers it, `wanted` otherwise. Only `wanted` episodes are searched.

### `record shows`

Find releases for the followed episodes you do not have.

Takes every `wished`, `monitored` show with at least one `wanted` episode (`apps/cli/src/components/Tasks/ProcessShowsTask.js:32-37`). For each one it turns the episodes into search units, searches every unit on every enabled indexer, runs the results through the policy, and picks releases (`searchUnits` and `pickReleases` in `libs/sensorr/src/lib/show.ts`).

The units come in a fixed order, and the order is the preference (`libs/sensorr/src/lib/show.ts:107-112`):

1. the whole series, when the show has ended, every regular episode has aired and is followed, and none is owned;
2. a season pack, for every season whose episodes all aired a day ago or more, are all followed, and none owned;
3. every `wanted` episode, one by one;
4. a season pack again, as a last resort, for the seasons that already own an episode, skipped as soon as an episode release of that season was found.

One complete release is one download instead of hundreds, and a pack is one per season, so the wider unit comes first. But a pack downloads its whole scope: it is only searched when every episode of that scope is followed and wanted or owned (`asked`, `libs/sensorr/src/lib/show.ts:90`), otherwise a pack would bring back the episodes you unfollowed. A season that owns an episode would get it downloaded twice, which is why its pack only comes last. A unit is not searched at all once the releases picked so far cover it (`isUnitCovered`, `libs/sensorr/src/lib/show.ts:147`), so a whole series found first costs one search per term, and each picked release keeps as its `coverage` only the wanted episodes it is the first to cover (`libs/sensorr/src/lib/show.ts:115`).

An indexer whose `caps` announce `tvsearch` with the parameters a unit needs is queried with `t=tvsearch`, `q`, `season` and `ep`. Any other gets a free-text `t=search` with `S03` or `S03E04` appended to the term. Both ask for the TV categories 5000 to 5080 (`searchShow` in `libs/sensorr/src/lib/znab.ts:88`). Capabilities are read once per indexer per run (`apps/cli/src/commands/record-shows.js:19-20`), and an indexer that cannot answer them is searched as free text (`libs/sensorr/src/lib/znab.ts:69`).

The policy is the same one, with the same chain, except for two normalizers swapped in when a unit is searched (`libs/sensorr/src/lib/policy.ts:133-135`). `showReleaseUnit` rejects a release whose level, series, season or episode as oleoo reads it, is not the unit's; a multi-season pack counts as the whole series, and so does a `COLLECTION` once the indexer files it under TV (`levelOf`, `libs/sensorr/src/lib/show.ts:28`). `showReleaseYears` rejects a year outside the show's first and last air years. There is no publish date check. A show that names no policy gets the first one matching its original language, as a movie does (`matchPolicies` in `apps/api/src/app/shows/shows.service.ts:72`).

Every picked release is appended to the show's `releases` with its `coverage` and its `level`, its id is written on each episode it covers, and its `.torrent` goes to the shows blackhole or to the cache (`apps/cli/src/components/Tasks/ProcessShowsTask.js:330-357`). The API reads the file list of that `.torrent` before writing anything and returns it, and the release keeps it as `torrent`: it is what `import shows` waits for (`apps/api/src/app/sensorr/sensorr.service.ts:59`).

`proposal_only` on the show wins when it is set; left empty, the show follows `jobs.record.shows.proposalOnly` (`proposalOnlyOf`, `apps/cli/src/utils/shows.js:34`). Accept and Refuse on a show release work as on a movie ([Proposals](#proposals)): Accept writes the cached `.torrent` into the shows blackhole and gives the episodes the release id again, Refuse deletes it and takes the id back from the episodes (`upsertShows` in `apps/api/src/app/shows/shows.service.ts:89`).

### `airing shows`

Pick up a new episode within the hour it reaches the indexers.

Same component as `record shows`, two differences (`apps/cli/src/commands/airing.js`). It only takes the shows with a `wanted` episode aired in the last seven days (`airing.js:8`, `aired_after` in `apps/cli/src/components/Tasks/ProcessShowsTask.js:34`), and it only searches single episodes, those aired in that window (`airingUnits`, `apps/cli/src/utils/shows.js:37`): hours after an episode airs, there is no pack to find yet. It stands in for an RSS feed, bounded by what aired this week, and leaves the backlog to `record shows`. It reads its own `jobs.airing.shows.proposalOnly`.

### `import shows`

Move finished downloads into the library without copying them.

Takes every release that is not a pending proposal, not imported yet, and whose `.torrent` file list is known (`isImportable`, `apps/cli/src/utils/shows.js:90`). A release is finished when every file of its `.torrent` sits in `shows.staging` at the size the `.torrent` gives, and none also exists with the `.!qB` suffix qBittorrent puts on an incomplete file (`isReleaseFinished`, `apps/cli/src/utils/shows.js:96`). The paths are the torrent's own, a multi-file torrent under a folder named after it (`torrentFiles`, `libs/sensorr/src/lib/torrent.ts:45`), so the download client has to keep that layout.

Each file is read with oleoo for its season and episodes, and linked only when the release covers that episode and the episode has no file yet; samples never are (`importLinksOf`, `apps/cli/src/utils/shows.js:104`). The target is `shows.library/<folder>/Season NN/<file name>`, the folder being the show's `path`, from Sonarr or an earlier import, or else `<name> (<first air year>)` (`showFolderOf`, `apps/cli/src/utils/shows.js:100`). The file keeps its name: Plex's scanner reads it as it is.

A hard link and not a copy or a move: the download client keeps seeding from `.staging`, and the library takes no second copy of the space. It is also why the shows directory is one volume ([architecture.md](architecture.md#one-volume-for-the-hard-link)). The release is stamped `imported_at`, and a show without `path` gets the folder it was linked into (`apps/cli/src/commands/import-shows.js:185-198`). A release whose every file was skipped is stamped all the same. Nothing is written on the episodes: they turn `owned` when `sync shows` sees the file on Plex.

An accepted release that never finishes, a failed or stalled download, would keep its episodes `proposed` for good. The rule is the one of a movie swap: a release still not imported a week after its `accepted_at` is marked `overdue: true` (`isReleaseOverdue`, `apps/cli/src/utils/shows.js:93`), and the episodes whose `release` is its id get it cleared, so they read `wanted` and `record shows` searches them again (`apps/cli/src/commands/import-shows.js:169-182`). The episodes are cleared before the mark is written: a run that fails in between clears them again on the next one. The release stays importable, and the mark goes away if it is imported after all. A release downloaded without a proposal has no `accepted_at` and never turns overdue.

### `sync shows`

Make Sensorr's idea of your episodes match Plex's.

Refuses to start without a registered Plex server (`apps/cli/src/commands/sync-shows.js:23`). It reads every Plex `show` section, every show with its guids and every episode (`apps/cli/src/commands/sync-shows.js:100-105`). A Plex show is tied to a Sensorr show by its `tmdb://` guid, else by its `tvdb://` or `imdb://` guid against the show's `external_ids`, and several Plex items of one TMDB show are read together (`plexShowOf`, `apps/cli/src/utils/shows.js`). One tied by none of them is logged and skipped; when its title and year still name a Sensorr show, that show keeps its files instead of losing them as absent from Plex (`:148-159`). Episodes are matched on Plex's season `parentIndex` and episode `index` against TMDB's numbers (`showFilesOf`, `apps/cli/src/utils/plex.js:130`); a Plex episode TMDB numbers differently is counted as `unmatched` and left out, since TMDB alone decides the numbering. Each file is kept on its episode with its size and a name oleoo rebuilds from the file name (`filesOf`, `apps/cli/src/utils/plex.js:118`): unlike `sync`, there is no metadata request per episode, which a library of thousands of episodes would pay on every run.

A show Plex has and Sensorr does not is added `archived` and unfollowed, episodes included (`apps/cli/src/commands/sync-shows.js:182-190`): you have it, nothing should search it. An episode that loses a file Plex had seen logs one warning per show, which is also a notification and a web push (`NOTIFYING` in `apps/api/src/app/notifications/notifications.service.ts`), and a Sensorr show absent from Plex loses the files of every episode (`:256-267`). The show keeps its state, there is no `missing` show. An episode that loses its files loses its `release` id too (`syncedFilesOf`, `apps/cli/src/utils/shows.js:46`): it reads `wanted` again, and `record shows` searches it. Unbinding the Plex server leaves the episode files as they are, as a movie stays `archived` (`handlePlexReset` in `apps/api/src/app/shows/shows.service.ts`): the next `sync shows` sets them right, and until then no job searches what you own.

### `refresh shows`

Keep TMDB metadata of shows from going stale, and learn the episodes TMDB adds.

A show still airing, TMDB `status` `Returning Series`, `In Production`, `Planned` or `Pilot`, is refreshed on every run; any other once its last refresh is 30 days old (`isRefreshDue`, `apps/cli/src/utils/shows.js:12`). An airing show gets episodes every week, an ended one rarely changes, and a refresh costs one TMDB request per 20 seasons (`libs/tmdb/src/shows.ts:76-92`). It reads the `ignored` shows too (`fetchSensorrShows`, `apps/cli/src/utils/shows.js:49`), so a requested show stays current.

It writes TMDB fields and `refreshed_at` only (`apps/cli/src/commands/refresh-shows.js:114`), so the Sensorr fields survive, as with `refresh`. A known episode gets its TMDB fields only. A new one is followed by the rule of a new episode (`monitoredOf`, `apps/cli/src/utils/shows.js:19`): like its season when the season already has a followed episode, like `monitor_new_seasons` when the season is new, never on an unfollowed show, and never for a special, which you follow by hand.

### `migrate sonarr`

Take over the series Sonarr follows, once.

A command, not a job, like `migrate`, of which it is a subcommand: no cron key, not in `JOBS` (`libs/sensorr/src/lib/jobs.ts:4`). Its lines are logged as `migrate` with `meta.type` `show`. Run it by hand with `bin/sensorr migrate sonarr --url <Sonarr URL>` and the API key in `SONARR_API_KEY`; `--dry-run` prints the counts and writes nothing (`apps/cli/src/commands/migrate-sonarr.js:14-25`, `:33`). It only sends `GET` requests to Sonarr's API v3, `series`, then `episode` for each series and `episodefile` for each series holding a file (`apps/cli/src/commands/migrate-sonarr.js:38-48`).

A series without a `tmdbId` is skipped, TMDB being the only numbering Sensorr keeps. So is a series Sonarr neither monitors nor holds a file of (`sonarrShowOf`, `apps/cli/src/utils/shows.js:62`): added once, never used. Each other one is written as its TMDB show, `wished` when Sonarr monitors it and `archived` otherwise, with `monitored`, `monitor_new_seasons` from Sonarr's `monitorNewItems: all`, and `path`, the last segment of Sonarr's folder, so that `import shows` keeps linking into the folders Sonarr made. Its episodes are TMDB's. Every episode both number the same copies Sonarr's flag, followed only when its series and its season are followed in Sonarr too, since Sonarr searches nothing else (`sonarrEpisodesOf`, `apps/cli/src/utils/shows.js:71`). The episodes Sonarr has and TMDB does not are logged per show; the ones TMDB has and Sonarr does not follow the rule of a new episode. An episode Sonarr has a file for gets that file, `from: 'sonarr'`, with its size and a name oleoo rebuilds from the file name, so it reads `owned` and no job activated before the first `sync shows` searches it again; `sync shows` replaces it with the file Plex reads, and drops it without a warning when Plex has none.

## Proposals

A job with `proposalOnly` on does the same search and the same ranking, and stops one step short of acting. Three things change, all in the same block (`apps/cli/src/components/Tasks/ProcessMoviesTask.js:359`):

- the movie is **not** moved to `archived` — the `state` field is simply left out of the write;
- the release is stored with `proposal: true` (`apps/cli/src/components/Tasks/ProcessMoviesTask.js:299`);
- the `.torrent` goes to `cache` instead of `fs` — it is kept as a document in the database keyed by the release link (`apps/api/src/app/sensorr/sensorr.service.ts:73`) instead of being written to the blackhole.

Nothing has been downloaded and nothing has been claimed. A `refine` or `shrink` proposal shows up on the Swaps screen (`/movie/swaps`), and both the notification and the screen offer the same two gestures. A `record` proposal has no owned release to swap, so it stays off that screen and is decided from the notification or from the proposal badge on the poster.

**Accept.** The movie is set to `archived` and the release is marked `choice: true` (`apps/web/src/contexts/MoviesMetadata/MoviesMetadata.tsx:90`). The API then reads the cached `.torrent`, writes it into the blackhole, and **deletes the cache entry** (`upsertMovies` in `apps/api/src/app/movies/movies.service.ts`, calling `apps/api/src/app/sensorr/sensorr.service.ts:32`). The same method drops the `proposal` flag, so the stored release becomes an ordinary owned one, and amends the job's log lines as treated.

**Refuse.** The cached `.torrent` is deleted and the release is filtered out of the movie document entirely, both in that same `upsertMovies` (`apps/api/src/app/movies/movies.service.ts`, calling `apps/api/src/app/sensorr/sensorr.service.ts:80`). The movie keeps the state it had.

**Both gestures are irreversible, and for the same reason: the cached `.torrent` is destroyed either way.** Accepting moves it out of the cache into the blackhole; refusing deletes it. There is no third copy and no route that puts a proposal back. Undoing an accept means deleting the file from the blackhole by hand; undoing a refusal means re-running the job and hoping the indexer still carries the release. Refusing is not banning either — `banned_releases` is a separate list the policy reads on its own (`libs/sensorr/src/lib/policy.ts:132`), so a later run may well propose the same release again. Ban it explicitly if you never want to see it.

Picking a release by hand from a movie page takes the same path with `job: 'manual'`: since it was never cached, the `.torrent` is fetched from the indexer instead (`apps/web/src/components/Sensorr/index.tsx:279`, then the same `upsertMovies` in `apps/api/src/app/movies/movies.service.ts`).

## The policy

A policy turns a pile of indexer results into one ordered list. `Policy.apply()` runs every release through a fixed chain of normalizers and then sorts (`libs/sensorr/src/lib/policy.ts:116`). Each normalizer returns the release untouched if it has already been invalidated, so the first rule that rejects a release owns the reason shown in the logs.

In chain order (`libs/sensorr/src/lib/policy.ts:131`):

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

Titles are matched, not compared literally. Each release name is parsed into structured metadata, its title is measured against every known title of the movie, and a similarity below `0.6` rejects it (`libs/sensorr/src/lib/policy.ts:7`, `:285`). When a release carries an alternative title that matches better, the two are swapped so the rest of the chain works on the better one (`libs/sensorr/src/lib/policy.ts:273`).

### Three groups

`avoid` is a blacklist. Any release carrying an avoided tag is rejected outright, whatever else it has going for it (`libs/sensorr/src/lib/policy.ts:297`). `avoid.znab` goes further than the others: an avoided indexer is dropped before the search runs, so it is never even queried (`apps/cli/src/components/Tasks/ProcessMoviesTask.js:247`, `libs/sensorr/src/lib/sensorr.ts:97`).

`require` is the end-goal, and it is **not** applied when a job picks a release. It only runs in strict mode (`libs/sensorr/src/lib/policy.ts:333`), and strict mode has exactly two callers: the filters that decide whether a movie belongs to `refine` or to `shrink` (`apps/cli/src/commands/refine.js:60`, `apps/cli/src/commands/shrink.js:61`). So `require` does not say "never download anything else"; it says "keep refining until you have this". Put your target resolution and source there.

`prefer` is the ranking. It never rejects anything.

### What a score means

A release that matched a title gets 1000 points (`libs/sensorr/src/lib/policy.ts:292`), and one that is still valid at the end of the chain gets another 1000 (`libs/sensorr/src/lib/policy.ts:392`). So a valid candidate sits at 2000 before any preference is counted, and an invalid one can never outrank a valid one no matter how many preferred tags it carries. That is the point of the two flat thousands.

On top of that, each `prefer` list pays out by rank: a tag is worth `(length - index) / length` of 100 points, so with four entries the first is worth 100, then 75, 50, 25 (`libs/sensorr/src/lib/policy.ts:376`). Every tag that matches adds up, across every list (`libs/sensorr/src/lib/policy.ts:392`). Ordering a list is therefore the real control: moving a tag to the top of `prefer.resolution` is worth more than adding three tags at the bottom. `flags` is the exception and pays 100 for every match, since flags have no natural order.

Releases you already own have no indexer attached, and would lose every `prefer.znab` point against a fresh candidate for a reason that has nothing to do with quality. So when the policy is applied to owned releases, `prefer.znab` is replaced by a flat 100 (`libs/sensorr/src/lib/policy.ts:374`). Without it, `refine` and `shrink` would re-download the library on the first run.

Ties are broken by `sorting` and `descending` (`libs/sensorr/src/lib/policy.ts:141`) — most seeders for a policy created from Settings (`libs/config/src/index.js:342`), smallest first when `shrink` overrides it. The first release of the sorted list is the one a job acts on; nothing else is looked at.

## Tuning

Field names, types and defaults are in [`configuration.md`](./configuration.md). What follows is which knob to reach for.

**Stop a job without deleting it.** `jobs.<command>.<type>.paused`, `jobs.keep-in-touch.paused`. A paused job gets no cron at boot (`apps/api/src/app/jobs/jobs.service.ts:85`) but stays runnable by hand from the Jobs screen.

**Spread the load.** `jobs.<command>.<type>.cron`. `record` runs daily because wishes arrive daily; `refine` and `shrink` are weekly or monthly because they re-download things you already have. Keep them apart: each one queries every indexer once per search term, per movie.

**Decide how much Sensorr does on its own.** `jobs.<command>.<type>.proposalOnly`. Off, the job downloads. On, it queues a proposal and waits. The shipped `config.default.json` turns it on for all three of `record`, `refine` and `shrink`; the schema defaults differ, `record` being the one that is off by default (`libs/config/src/index.js:79`). Turning it off for `refine` or `shrink` means agreeing in advance to replace files you already have.

**Exempt a movie from a job.** Per-movie `refine` and `shrink` booleans, both on by default (`apps/api/src/app/movies/movie.schema.ts:126`), toggled from the movie page (`apps/web/src/pages/Details/components/Metadata.tsx:70`). This is the right tool for the one film you want left exactly as it is, and it is cheaper than writing a policy for it.

**Change what wins.** The `prefer` lists and their order, then `sorting` and `descending` for ties. The first policy in the list is the default applied to movies that name none (`libs/sensorr/src/lib/policy.ts:83`).

**Change what is refused outright.** `avoid`. Remember it also silences an indexer entirely when used on `znab`.

**Change when `refine` lets go.** `require`. Everything else being equal, this is the setting that decides how long a movie keeps costing you bandwidth.

**Where files land.** `blackhole`, the directory both a recorded release and an accepted proposal are written to (`apps/api/src/app/sensorr/sensorr.service.ts:64`). A show release goes to `shows.blackhole` instead (`apps/api/src/app/sensorr/sensorr.service.ts:34`), `import shows` reads `shows.staging` and links into `shows.library`.

**Put a show under proposals, or take it out.** `proposal_only` on the show, from its page. Left empty, the show follows `jobs.record.shows.proposalOnly` or `jobs.airing.shows.proposalOnly`.
