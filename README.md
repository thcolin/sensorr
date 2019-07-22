# 🍿📼 Sensorr

A simple movie release radar like CouchPotato, Radarr and Watcher3, written in Javascript with `React`

# Warning
🚨 This is early experimental, currently will only support [`Cardigann`](https://github.com/cardigann/cardigann) and [`Jackett`](https://github.com/Jackett/Jackett).

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
        <b>Movies / Collection</b>
        <ul>
          <li>Manage your movies <code>collection</code> (<code>wished</code> and <code>archived</code>)</li>
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
        <b>Stars / Upcoming</b>
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
  * `express`: launch Sensorr `web server` without serving _frontend_
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
  📰 stalk               Stalk stars and update movie credits
  📼 record              Try to "record" (aka download best release) every wished movies
  🔗 sync                Consider all movies from your Plex server as "archived"
  🗑️ clean               Remove oldest log sessions if directory space exceeds configured value

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


Tips: Sensorr will use your `config.js` and fallback on default
```

# Roadmap
* `WebUI`
  * UI/UX
    * Responsive design / mobile UI-UX
    * Refactor
      * Use global `search` over movie/star split ?
      * `Trending`
        * Use `select` over random on `Row` titles for "Discover (year or genre)"
          * Add `random` behavior with `🎰` emoji only visible on `Row.title:hover`
        * `Row` with *trending* `stars`
        * `Row` with *upcoming* `movies` from *followed* `stars`
        * `Row` with random *sagas* `movies` ? (using `TMDB API 4` lists ?)
        * Customize ?
      * `Stars`
        * `Upcoming`
          * Improve performance too
        * Merge `Following` and `Search` ?
          * See how `Spotify` handle this in playlist (search / filter)
        * `Following`
          * Add stats (count, etc...), order and filter
          * Better filters by `Document` type
      * `Movies`
        * Improve `Releases`
        * Merge `Collection` and `Search` ?
          * See how `Spotify` handle this in playlist (search / filter)
        * `List` (grouped movies by "policy")
        * `Collection`
          * Add stats (count, etc...), order and filter
          * Better filters by `Document` type
  * Features
    * Improve `Trending` *discover* year row with `⬅️` & `➡️`
    * Load next page when scroll end on `Row` with `uri` props (like `Grid` but horizontal)
    * Polish `Trending` *discover* row
      * Load 2 page and filter with *trending* ones
    * Allow `filter` by job on *crew* `Row` from Movie page
    * Improve `history` implementation (move some state into `history.params` with default/fallback)
      * `Collection` and `Following` (state/filter) - FIRST IMPROVE UI/UX (add stats) !
      * `Logs` (index)
    * Script screenshots with [capture-website-cli](https://github.com/sindresorhus/capture-website-cli)
    * Translate (`fr`, `en`)
    * Filter `movie.release_dates` (only `Premiere`, `Theatrical (limited)`, `Theatrical`, `Digital` or `Physical` - cf. [/movie/{movie_id}/release_dates](https://developers.themoviedb.org/3/movies/get-movie-release-dates)) on `Upcoming` page
    * Add "groups" `Policy` with "default" === current (groups like `default` or `blockbuster` for example)
      * Add configurable `avoid` terms on `Movie` (like `/movie/515195` which got a `0.73` similarity score with `/movie/582607`)
      * Add configurable `prefer` terms on `Movie` (like `/movie/447404` I want in `FRENCH` and not `VOSTFR`)
    * `IMDB`, `TMDB` or `AlloCiné` browser plugin "bookmark" (update state of current movie website tab on `Sensorr` instance)
    * Synchronize with `trakt.tv`
    * Replace `Plex` available releases by better if available, like `CouchPotato`
      * `Plex` manage all `medias`, so we can get `release` (`source`, `language`, `resolution`, ...)
* `CLI`
  * Fix `record` command, filter movies with release date < +3 months (useless to search for movies still in production - make configurable)
  * Summary command result
    * `record`:
      ```
        ${found} Movies archived to ${sensorr.config.blackhole} ! 🎉
          * ${movie.title} (${movie.year}) with release ${release.generated}
        But ${notfound} still not found.. 😶
          * ${movie.title} (${movie.year}) : 0 releases found including 0 filtered
      ```
* `App` (Phone / TV)
  * Features
    * Connect to server with QR code
    * Streaming from `Releases` (how to know which file read ?)
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
