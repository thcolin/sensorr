# 🍿📼 Sensorr

A simple movie release radar like CouchPotato, Radarr and Watcher3, written in Javascript with `React`

<!-- # Warning
🚨 This is early experimental, currently will only support [`Cardigann`](https://github.com/cardigann/cardigann) and [`Jackett`](https://github.com/Jackett/Jackett). -->

# Features
<table className="markdown-table">
  <tbody>
    <tr>
      <th>Screenshot</th>
      <th>Description</th>
    </tr>
    <tr>
      <td>
      <img src="https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/trending.jpg?raw=true" width="100" />
      </td>
      <td>
        <b>Trending</b>
        <ul>
          <li>Trending</li>
          <li>Discover (Popular)</li>
          <li>Discover (Random year)</li>
          <li>Discover (Random genre)</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>
      <img src="https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/collection.jpg?raw=true" width="100" />
      </td>
      <td>
        <b>Movies / Library</b>
        <ul>
          <li>Manage your movies <code>library</code> (<code>wished</code> and <code>archived</code>)</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>
      <img src="https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/search-movie.jpg?raw=true" width="100" />
      </td>
      <td>
        <b>Movies / Search</b>
        <ul>
          <li>Search for a <code>movie</code> by it's title</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>
      <img src="https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/movie.jpg?raw=true" width="100" />
      </td>
      <td>
        <b>Movies / Details</b>
        <ul>
          <li>See <code>movie</code> details</li>
          <li>Consider movie as, <code>🔕</code> <code>ignored</code>, <code>🍿</code> <code>wished</code> or <code>📼</code> <code>archived</code></li>
          <li>Look for <code>results</code> on <code>sources</code> (<code>torznab</code> / <code>newznab</code>) - requested with <code>title</code> (localized) and <code>original_title</code></li>
          <li>Grab a <code>result</code></li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>
      <img src="https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/upcoming.jpg?raw=true" width="100" />
      </td>
      <td>
        <b>Stars / Calendar</b>
        <ul>
          <li>Track upcoming movies from <code>followed</code> stars !</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>
      <img src="https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/following.jpg?raw=true" width="100" />
      </td>
      <td>
        <b>Stars / Following</b>
        <ul>
          <li>Manage stars you're <code>following</code></li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>
      <img src="https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/search-star.jpg?raw=true" width="100" />
      </td>
      <td>
        <b>Stars / Search</b>
        <ul>
          <li>Search for <code>stars</code></li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>
      <img src="https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/star.jpg?raw=true" width="100" />
      </td>
      <td>
        <b>Stars / Details</b>
        <ul>
          <li>See <code>star</code> details</li>
          <li>Follow star <code>🔕</code> <code>ignored</code>, <code>🔔</code> <code>followed</code></li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>
      <img src="https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/configure.jpg?raw=true" width="100" />
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
    </tr>
    <tr>
      <td>
      <img src="https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/logs.jpg?raw=true" width="100" />
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

# Scripts
  * `dev`: launch development server for `React` _frontend_
  * `server`: launch server services without serving _frontend_
  * `build`: build _frontend_ to `dist` folder
  * `prod`: run `pm2` apps, Sensorr (`web server`) and Sensorr (`record cron`)
  * `start`: launch `build` and `prod` scripts
  * `doc`: launch `docz` documentation server

# Docker
Checkout Sensorr [Docker image](https://hub.docker.com/r/thcolin/sensorr/), it let you skip every complex environment configuration and just run a clean installation, just open a terminal with `docker` installed and run:

```
# `/home/user/.sensorr` will be your config path
# `/home/user/downloads` will be your blackhole path
docker run -p 5070:5070 -v /home/user/.sensorr:/app/sensorr/config -v /home/user/downloads:/app/sensorr/blackhole --name="sensorr" thcolin/sensorr
```

Tips: Docker image is based on `alpine`, so you can add `TZ` env variable with `-e TZ=Europe/Paris`

# Configure
* Edit default configuration in `config/config.json` or `http://localhost:5070/configure`

# CLI
Currently CLI tool is mainly designed to work with `pm2` and `ecosystem.config.js` which launch `./bin/sensorr record -a` everyday at `17:00 / 5:00PM` and `./bin/sensorr stalk` everyday at `00:00`

**🚨 Warning:** CLI tool need to communicate with Sensorr web server at `http://localhost:5070` to sync databases ! Be sure Sensorr web server is launched before launching `record` command.

```

     _________  __________  ___  ___
    / __/ __/ |/ / __/ __ \/ _ \/ _ \
   _\ \/ _//    /\ \/ /_/ / , _/ , _/
  /___/___/_/|_/___/\____/_/|_/_/|_|


🍿 📼 - Movie release radar (CouchPotato, Radarr and Watcher3 alternative)

Usage: sensorr [command] [options]

Commands:
  📼 record              Try to "record" (aka download best release) every wished movies
  📰 stalk               Stalk stars and update calendar with "recents" movies (+/- 8 years from now)
  🔗 sync                Consider all movies from your Plex server as "archived"
  🗑️ clean               Remove oldest log sessions if directory space exceeds configured value
  ♻️ refresh             Refresh movies collection data (vote_average, popularity, etc...)

Options:
  -p, --port             Specify localhost <port> [default: 5070]
  -h, --help             Output usage information
  -v, --version          Output the version number
  # record
  -b, --blackhole <dir>  Download releases .torrent and .nzb to <dir> [default: /tmp]
  -f, --filter <regexp>  Filter releases returned by configured XZNAB
  -s, --sort <key>       Sort releases by <key> (among: seeders, peers or size) [default: seeders]
  -D, --descending       Sort releases in descending order
  -a, --auto             Automatically select first release according to --filter, --sort and --descending options


Tips: Sensorr will use your "config/config.js" and fallback on default
```

# Roadmap
* Feature `0.9.0`
  * Script screenshots with [capture-website-cli](https://github.com/sindresorhus/capture-website-cli)
  * Improve `README`
* Feature `Discover`
  * Add `Discover` page
    * `Grid` with location params driven `Controls`
    * See [TMDB api/discover](https://www.themoviedb.org/documentation/api/discover)
  * `Film`
    * Add `Link` to `genre`
  * `Movie`
    * Add `keywords` (with `Link`)
  * Add `Studio` page (?) - no, use predefined `Discover` page
    * Referring
      * `Trending` ? - yes, but refactor needed (currently use multiple values)
      * Display *studio* in `Movie` ? - yes
      * Display *studio* `Search` ? - yes
  * `Trending`
    * Link `Discover` `Row` to `Discover` page
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
    * Same layout as `Trending` page
* Feature `performance`
  * Look at [`shipjs`](https://github.com/algolia/shipjs)
  * `oleoo`
    * Refactor algorithm, split `title` and `metadata` with `year|language|resolution|source` (`[0]`/`[1]`)
  * `Server`
    * Look at [`WatermelonDB`](https://github.com/Nozbe/WatermelonDB)
    * Fix RAM usage with `sessions` in `io`
  * `CLI`
    * Fix `record` command, filter movies with release date < +3 months (useless to search for movies still in production - make configurable)
  * Responsive design / mobile UI-UX
* Feature `Config`
  * Fix empty `config.json` on __Docker__ build
  * Refactor `config` to `settings` using [mozilla/node-convict](https://github.com/mozilla/node-convict)
* Feature `1.0.0`
  * 🎉
  * Fix `docz`
  * Improve `README`
* Feature `Notifications`
  * Notify `records` summary (email, sms, etc...)
* Feature `UI/UX sugar`
  * Translate (`fr`, `en`)
  * `Search`
    * Animate `height`
    * Add remove `suggestion` button
  * `Trending`
    * Polish *discover* row, load 2 page and filter with *trending* ones
    * Add `Head` `Film` ? (see [inspiration](https://dribbble.com/shots/2813716-BookMyShow-Movies-Concept))
  * `Controls`
    * Save to `localStorage` ?
    * Improve `Documents.*.Filters`
      * `Movie`
        * `country` - `multiple` (use `original_language` ? - no)
        * `studio` - `multiple`
      * `Star`
        * `active_years` - `range` - useful ?
  * `Row`
    * Load next page when scroll end on `Row` with `uri` props (like `Grid` but horizontal)
      * Better, display `Grid` when scroll end + `entities.length > 10`
  * Summary command result
    * `record`:
      ```
        ${found} Movies archived to ${sensorr.config.blackhole} ! 🎉
          * ${movie.title} (${movie.year}) with release ${release.generated}
        But ${notfound} still not found.. 😶
          * ${movie.title} (${movie.year}) : 0 releases found including 0 filtered
      ```
  * `Loading` page waiting sync of `db` with progress ?
  * Dark mode (`react-theme-provider`)
* Feature `Custom Home`
  * `Trending`
    * `Row` with *upcoming* `movies` from *followed* `stars`
      * Link to `Calendar`
    * Customize
      * Pinned sortable `Trending|Discover` `Rows`
        * `type=[Popular|Top|Calendar|Trending|Discover]`
        * `uri={...}`
        * `params={...}`
* Feature `Takecare`
  * Replace `Plex` releases by better if available, like `CouchPotato`
    * `Plex` manage all `medias`, so we can get `release` (`source`, `language`, `resolution`, ...) and compute score
* Feature `Onboarding`
  * Add `Onboarding` page
* Feature `Browser Plugin`
  * `IMDB`, `TMDB` or `AlloCiné` browser plugin "bookmark" (update state of current movie website tab on `Sensorr` instance)
* Feature `import/export`
  * Synchronize with `trakt.tv`
* Feature `App` (TV/Mobile ?)
  * Connect to server with QR code
  * Streaming from `Releases` (how to know which file read ? - ask user)
  * PWA ?

# Inspiration
* CLI
  * [minimist](https://github.com/substack/minimist)
  * [Inquirer.js](https://github.com/SBoudrias/Inquirer.js)
  * [commander.js](https://github.com/tj/commander.js)
  * [oclif](https://github.com/oclif/oclif)
  * [ink](https://github.com/vadimdemedes/ink)

# Family
* [CouchPotato](https://github.com/CouchPotato/CouchPotatoServer)
* [Radarr](https://github.com/Radarr/Radarr)
* [Watcher3](https://github.com/nosmokingbandit/Watcher3)
