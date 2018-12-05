# 🍿📼 Sensorr

A simple movie release radar like CouchPotato, Radarr and Watcher3, written in Javascript with `React`

# Warning
🚨 This is early experimental, currently will only support [`Cardigann`](https://github.com/cardigann/cardigann) and [`Jackett`](https://github.com/Jackett/Jackett).

# Features
* See `trending` movies on home page
  * Trending
  * Discover (Popular)
  * Discover (Random year)
  * Discover (Random genre)
* Search for a `movie` by it's title
* See `collection` (`wished` and `archived` movies)
  * Filter by title and `:[wished|archived]`
* See `movie` details
  * Consider movie as, `🔕` `ignored`, `🍿` `wished` or `📼` `archived`
  * Look for `results` on `sources` (`torznab` / `newznab`)
    * Request with `title` (localized) and `original_title`
  * Grab a `result`
* See `logs` details
  * Every wished `movie` processed
* Language aware
  * By default search on [TMDB](https://www.themoviedb.org/) with first `window.navigator.languages`
  * Fallback to `en-US`
* Simple configuration
* Secured WebUI (with `basic-auth`)

# Screenshots
| Trending | Collection | Search | Movie | Star | Configure | Logs |
|----------|------------|--------|-------|------|-----------|------|
| ![Trending](https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/trending.jpg?raw=true) | ![Collection](https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/collection.jpg?raw=true) | ![Search](https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/search.jpg?raw=true) | ![Movie](https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/movie.jpg?raw=true) | ![Star](https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/star.jpg?raw=true) | ![Configure](https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/configure.jpg?raw=true) | ![Logs](https://raw.githubusercontent.com/thcolin/sensorr/master/doc/screenshots/logs.jpg?raw=true) |

# Scripts
  * `dev`: launch development server for `React` _frontend_
  * `start`: launch Sensorr `web server` without serving _frontend_
  * `build`: build _frontend_ to `dist` folder
  * `prod`: run `pm2` apps, Sensorr (`web server`) and Sensorr (`record cron`)

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
Currently CLI tool is mainly designed to work with `pm2` and `ecosystem.config.js` which launch `./bin/sensorr record -a` everyday at `17:00` / `5:00PM`

**🚨 Warning:** CLI tool need to communicate with Sensorr web server at `http://localhost:5070` to sync databases ! Be sure Sensorr web server is launched before launching `record` command.

```

     _________  __________  ___  ___
    / __/ __/ |/ / __/ __ \/ _ \/ _ \
   _\ \/ _//    /\ \/ /_/ / , _/ , _/
  /___/___/_/|_/___/\____/_/|_/_/|_|


🍿 📼 - Movie release radar (CouchPotato, Radarr and Watcher3 alternative)

Usage: sensorr [command] [options]

Commands:
  📼 record              Automatically loop your wished movies and try to download best release

Options:
  -b, --blackhole <dir>  Download releases .torrent and .nzb to <dir> [default: /tmp]
  -f, --filter <regexp>  Filter releases returned by configured XZNAB
  -s, --sort <key>       Sort releases by <key> (among: seeders, peers or size) [default: seeders]
  -D, --descending       Sort releases in descending order
  -a, --auto             Automatically select first release according to --filter, --sort and --descending options
  -h, --help             Output usage information
  -v, --version          Output the version number

Tips: Sensorr will use your `config.js` and fallback on default
```

# Roadmap
* `WebUI`
  * Fix
    * Refactor to [`aphrodite`](https://github.com/Khan/aphrodite) for style
    * Monitor `status.record` with `bounce` animation on `Trigger` element in `Navigation` layout
    * Improve `Language` support with full `<select>` on `Configure` page
  * Features
    * Refresh `logs`
    * Trending `studios`
    * Follow `stars`
  * Pages
    * `Movie`
      * Customize `Doc` for `Sensorr.look` (in modal ?)
        * Don't `remove` `Doc`, just set `{ state: ignored }`
        * Alternative `title`
          * `Pirates des Caraibes La Fontaine de Jouvence 2011 French DvDRip x264 AC3-OkonEdet (Pirates of the Caribbean On Stranger Tides) `
          * `Pirates.des.caraibes.4.3D.1080p.side.by.side.Truefrench.djneal.mkv`
        * Range `year`
          * Production and Release year can be different
          * `Benjamin Gates Et Le Livre Des Secrets (2007) BDRip x265 10bit 1080p AAC 5.1 Fr Eng Subs Fr Eng [SireHawk]`
          * `Benjamin Gates et le livre des secrets.2008.MULTI.VF2.1080p.WEB-DL.AC3.x264-NoTag`)
* `CLI`
  * Commands
    * `🔍 search [query]`
      * `_tmdb_ [query]`
      * `display: [movies]`
      * `input: [movie]`
      * `_look_ [movie]`
      * `display: [results]`
      * `input: [result]`
      * `_grab_ [result]`
    * `📚 manage`
      * `display: [movies]`
      * `input: [movie:state]`
      * `_look_ [movie]`
  * Summary command result
    * `record`:
      ```
        ${found} Movies archived to ${sensorr.config.blackhole} ! 🎉
          * ${movie.title} (${movie.year}) with release ${release.generated}
        But ${notfound} still not found.. 😶
          * ${movie.title} (${movie.year}) : 0 releases found including 0 filtered
      ```

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
