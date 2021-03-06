<img src="https://raw.githubusercontent.com/thcolin/sensorr/master/doc/banner.png?raw=true" width="100%" />

<!-- # Warning
🚨 This is early experimental, currently will only support [`Cardigann`](https://github.com/cardigann/cardigann) and [`Jackett`](https://github.com/Jackett/Jackett). -->

# ✨ Features
<table className="markdown-table">
  <tbody>
    <tr>
      <th>Screenshot</th>
      <th>Description</th>
    </tr>
    <tr>
      <td>
      <img src="https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/home.png?raw=true" width="100" />
      </td>
      <td>
        <b>Home</b>
        <ul>
          <li>Trending</li>
          <li>Discover (Popular)</li>
          <li>Discover (By year)</li>
          <li>Discover (By genre)</li>
          <li>Discover (By studio)</li>
          <li>Trending (stars)</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>
      <img src="https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/library.png?raw=true" width="100" />
      </td>
      <td>
        <b>Library</b>
        <ul>
          <li>Manage your movies <code>library</code> (<code>wished</code>, <code>pinned</code> and <code>archived</code>)</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>
      <img src="https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/discover.png?raw=true" width="100" />
      </td>
      <td>
        <b>Discover</b>
        <ul>
          <li><code>Discover</code> movies with many options</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>
      <img src="https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/movie.png?raw=true" width="100" />
      </td>
      <td>
        <b>Movie</b>
        <ul>
          <li>Display <code>movie</code> details</li>
          <li>Consider movie as, <code>🔕</code> <code>ignored</code>, <code>🍿</code> <code>wished</code>, <code>📍</code> <code>pinned</code> or <code>📼</code> <code>archived</code></li>
          <li>Find <code>releases</code> on <code>sources</code> (<code>torznab</code> / <code>newznab</code>) - requested with <code>title</code> (localized) and <code>original_title</code></li>
          <li>Grab a <code>release</code> (<code>manual</code> or <code>auto</code>)</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>
      <img src="https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/collection.png?raw=true" width="100" />
      </td>
      <td>
        <b>Collection</b>
        <ul>
          <li>Display <code>collection</code> details</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>
      <img src="https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/calendar.png?raw=true" width="100" />
      </td>
      <td>
        <b>Calendar</b>
        <ul>
          <li>Track upcoming movies from <code>followed</code> stars !</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>
      <img src="https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/following.png?raw=true" width="100" />
      </td>
      <td>
        <b>Following</b>
        <ul>
          <li>Manage stars you're <code>following</code></li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>
      <img src="https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/person.png?raw=true" width="100" />
      </td>
      <td>
        <b>Star</b>
        <ul>
          <li>Display <code>star</code> details</li>
          <li>Follow star <code>🔕</code> <code>ignored</code>, <code>🔔</code> <code>followed</code></li>
        </ul>
      </td>
    </tr>
    <!-- <tr>
      <td>
      <img src="https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/configure.png?raw=true" width="100" />
      </td>
      <td>
        <b>Configure</b>
        <ul>
          <li>Simple configuration</li>
          <li>Secured WebUI (with <code>basic-auth</code>)</li>
          <li>Language aware, by default search on <a href="https://www.themoviedb.org/">TMDB</a> with first <code>window.navigator.languages</code></li>
          <li>Plex synchronization, never inadvertently download a movie you already own !</li>
        </ul>
      </td>
    </tr> -->
    <tr>
      <td>
      <img src="https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/records.png?raw=true" width="100" />
      </td>
      <td>
        <b>Logs</b>
        <ul>
          <li>See <code>logs</code> details</li>
          <li>Every wished <code>movie</code> processed</li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>

# 🏎️ Quick Start
Best way to get a **Sensorr** fresh install is with the Docker image, you just need a terminal with [`docker`](https://www.docker.com/get-starteds) installed !

## 🐳 Docker
Checkout Sensorr Docker image at [thcolin/sensorr/](https://hub.docker.com/r/thcolin/sensorr/)

```
# `/home/user/.sensorr` will be your config path
# `/home/user/downloads` will be your blackhole path
docker run -p 5070:5070 -v /home/user/.sensorr:/app/sensorr/config -v /home/user/downloads:/app/sensorr/blackhole --name="sensorr" thcolin/sensorr
```

_Tips_: Docker image is based on `alpine`, so you can add `TZ` env variable with `-e TZ=Europe/Paris`

## 🎚 Configure
* Edit default configuration at `http://localhost:5070/settings` (or `config/config.json`)

## ⏰ Jobs
Some necessary cron jobs will be launched in background every day:
* _16:03_ `sensorr:purge`: Clean oldest log sessions (if directory space exceeds configured value)
* _17:00_ `sensorr:record`: Record wished movies from collection with best release
* _01:03_ `sensorr:schedule`: Schedule calendar with recents movies from stalked stars (+/- 2 years from today)
* _03:03_ `sensorr:pairwise`: Pairwise Plex instance with Sensorr instance (if configured)
* _05:03_ `sensorr:hydrate`: Hydrate -or refresh- collected movies and stalked stars data

# 🗺️ Roadmap
* Fix `Home` rows issues
  * `Upcoming` / `Records` empty
* Display other `Person` behind each `Movie` on `Details` page (`:hover` only)
  * Load every followed stars from database on component mount
* Feature `Policies`
  * Add "groups" `Policy` with "default" === current (groups like `default` or `blockbuster` for example)
    * Add configurable `avoid` terms on `Movie` (like `/movie/515195` which got a `0.73` similarity score with `/movie/582607`)
    * Add configurable `prefer` terms on `Movie` (like `/movie/447404` I want in `FRENCH` and not `VOSTFR`)
  * Add `size` property on `Settings/blocks/Policy` (how to handle it ? `min/max` ?)
  * Improve `Documents.*.Filters`
    * `policies` - `multiple`
  * `Movie`
    * Add `policies`
      * `Checkbox` displayed as grid or column
        * After `Row` ? - Bad UX, far away from `state`
      * Create `policy` option (will copy/paste `default`)
      * Edit `policy` link
  * Add `List` page
    * Grouped movies by "policy"
    * Same layout as `Home` page
* Feature `Review` (fix manual)
  * Summary command result
    * `record`:
      ```
        From ${wished} wished 🍿 movies, ${found} where recorded 📼 to ${sensorr.config.blackhole} !
          * ${movie.title} (${movie.year}) with release ${release.generated}
        ${filtered} were filtered 🚫 according to your policies
          * ${movie.title} (${movie.year})
            * ${release} (${reason})
        But ${missing} still missing 📭 (with no releases found)
          * ${movie.title} (${movie.year}) 
        You should look at these ${error} errors 🚨
          * ${movie.title} (${movie.year}) : ${err}
      ```
  * Refactor `Logs`
    * Left panel with `session` list with summary
    * `Records`
      * Summary
        * 🍿 Wished
        * 📼 Recorded
        * 🚫 Filtered (reviewable)
        * 📭 Missing (reviewable)
        * 🚨 Error (reviewable)
      * Review
        * Review each `record`, one by one, autoscroll on validation
      * Record
        * Allow to post an `issue` on `thcolin/oleoo`
          * With data : { movie, records: records.map(record => record.meta ) }
        * Allow to search for `releases` manualy
          * Allow to search custom titles - like `The.92nd.Annual.Academy.Awards.2020.FRENCH.1080p.HDTV.H264-SH0W` - out of `releases` scope
        * Allow to **ban** `releases` (like a `release` with hardcoded `subtitles` downloaded that i don't want)
    * `Purge`
    * `Pairwise`
    * `Hydrate`
* Feature `performance`
  * Rename `XZNAB` to `XYZNAB`
  * On `Person.State` `unfollow`, delete `calendar` entities with only `this` as followed credits
  * Look at [`shipjs`](https://github.com/algolia/shipjs)
  * `oleoo`
    * Refactor algorithm, split `title` and `metadata` with `year|language|resolution|source` (`[0]`/`[1]`)
  * `Server`
    * Look at [`WatermelonDB`](https://github.com/Nozbe/WatermelonDB)
      * Or only use **remote** `PouchDB` server with `rxdb`
    * Fix RAM usage with `sessions` in `io`
  * `CLI`
    * Use [`cli-step`](https://github.com/poppinss/cli-step)
    * When `stalk` star, `atomicUpsert` it
    * Fix `record` command, filter movies with release date < +3 months (useless to search for movies still in production - make configurable)
    * Compile binary (reduce Docker image size by removing useless dependecies)
  * Responsive design / mobile UI-UX
    * Take `screenshots` in `small`, `medium` and `large` breakpoints
* Feature `Config`
  * Refactor `config` to `settings` using [mozilla/node-convict](https://github.com/mozilla/node-convict)
  * Refactor with [nrwl/nx](https://github.com/nrwl/nx)
  * Look at `Prisma` for database
* Feature `1.0.0`
  * 🎉
  * Fix `docz`
  * Improve `README`
* Feature `Notifications`
  * Notify `records` summary (email, sms, etc...)
* Feature `UI/UX sugar`
  * Translate (`fr`, `en`)
  * `Discover`
    * Add `status` in `controls` - how ?
    * Add `Random` button
  * `Home`
    * Add `Head` `Movie` ? (see [inspiration](https://dribbble.com/shots/2813716-BookMyShow-Movies-Concept))
      * Add "pre-configured" `List` like `Oscars` ?
      * Weekly movies selection (?)
        * Allow user to send PR with own movies selection
      * Make sensorr a social network (?)
        * Look at `Mastodon` example and `ActivityPub` spec
        * Make it private by default, if public will only show non-user related informations (home, discover, calendar (?), following (?))
        * Multi user (?)
  * `Settings`
    * `Database`
      * Allow to `clean` browser `sensorr-*` databases (`doctor`)
  * `Grid`
    * Select/Deselect all
    * Actions on selection
  * `Loading` page waiting sync of `db` with progress ?
    * Allow to `clean` database if waiting too much
  * Dark mode (`theme-ui`)
* Feature `Custom Home`
  * `Home`
    * Customize
      * Pinned sortable `Trending|Discover` `Rows`
        * `type=[Popular|Top|Calendar|Trending|Discover]`
        * `uri={...}`
        * `params={...}`
      * Save from `Discover` "current" params
* Feature `Doctor`
  * Replace `Plex` releases by better if available, like `CouchPotato`
    * `Plex` manage all `medias`, so we can get `release` (`source`, `language`, `resolution`, ...) and compute score
* Feature `Onboarding`
  * Add `Onboarding` page
* Add demo on a server
* Feature `Browser Plugin`
  * `IMDB`, `TMDB`, `SensCritique` or `AlloCiné` browser plugin "bookmark" (update state of current movie website tab on `Sensorr` instance)
* Feature `import/export`
  * Synchronize with `trakt.tv`
* Feature `Mobile` app
  * Connect to server with QR code
  * Streaming from `Releases` (how to know which file read ? - ask user)

# 🎨 Inspiration
* CLI
  * [minimist](https://github.com/substack/minimist)
  * [Inquirer.js](https://github.com/SBoudrias/Inquirer.js)
  * [commander.js](https://github.com/tj/commander.js)
  * [oclif](https://github.com/oclif/oclif)
  * [ink](https://github.com/vadimdemedes/ink)

# 👋 Alternatives
* [CouchPotato](https://github.com/CouchPotato/CouchPotatoServer)
* [Radarr](https://github.com/Radarr/Radarr)
* [Watcher3](https://github.com/nosmokingbandit/Watcher3)
