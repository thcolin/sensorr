# 🍿📼 Sensorr

A simple movie release radar like CouchPotato, Radarr and Watcher3, written in Javascript with `React`

# Warning
🚨 This is early experimental, currently will only support [`cardigann`](https://github.com/cardigann/cardigann) cause of `CORS` issue on [Jackett](https://github.com/Jackett/Jackett/issues/2818).

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
  * Consider movie `ignored`, `wished` or `archived`
  * Look for `results` on `sources` (`torznab` / `newznab` with `CORS` enabled)
    * Request with `title` (localized) and `original_title`
  * Grab a `result`
* Language aware
  * By default search on [TMDB](https://www.themoviedb.org/) with first `window.navigator.languages`
  * Fallback to `en-US`

# Screenshots
| Trending | Collection | Search | Movie |
|----------|------------|--------|-------|
| ![Trending](/doc/screenshots/trending.jpg?raw=true) | ![Collection](/doc/screenshots/collection.jpg?raw=true) | ![Search](/doc/screenshots/search.jpg?raw=true) | ![Movie](/doc/screenshots/movie.jpg?raw=true) |

# CLI
Goal of this project is running a `cron` every day, to scrape automatically best release for wished movies : `0 0 * * * bin/sensorr record -a`

```

     _________  __________  ___  ___
    / __/ __/ |/ / __/ __ \/ _ \/ _ \
   _\ \/ _//    /\ \/ /_/ / , _/ , _/
  /___/___/_/|_/___/\____/_/|_/_/|_|


🍿 📼 - Movie release radar (CouchPotato, Radarr and Watcher3 alternative)

Usage: sensorr [command] [options]

Commands:
  🔍 search <query>      Search for <query> movie in TMDB and manage it or look for releases
  📼 record              Automatically loop your wished movies and try to download best release
  📚 manage              Manage your movies library (change movie state, look for releases)

Options:
  -d, --db <url>         Use PouchDB <url> to sync database [default: http://localhost:5984]
  -b, --blackhole <dir>  Download releases .torrent and .nzb to <dir> [default: /tmp]
  -f, --filter <regexp>  Filter releases returned by configured XZNAB
  -s, --sort <key>       Sort releases by <key> (among: seeders, peers or size) [default: seeders]
  -D, --descending       Sort releases in descending order
  -a, --auto             Automatically select first release according to --filter, --sort and --descending options
  -h, --help             Output usage information
  -v, --version          Output the version number
```

# Roadmap
* `WebUI`
  * Refactoring
    * Use `react-emotion` for style
  * Features
    * Follow `stars`
    * Search `stars`
  * Pages
    * `Logs`
      * Display `CLI` logs
    * `Config`
      * Form for every `config.json` fields
    * `Movie`
      * Allow alternative `title` correction
        * `Pirates des Caraibes La Fontaine de Jouvence 2011 French DvDRip x264 AC3-OkonEdet (Pirates of the Caribbean On Stranger Tides) `
        * `Pirates.des.caraibes.4.3D.1080p.side.by.side.Truefrench.djneal.mkv`
      * Allow range `year` correction
        * Production and Release year can be different
        * `Benjamin Gates Et Le Livre Des Secrets (2007) BDRip x265 10bit 1080p AAC 5.1 Fr Eng Subs Fr Eng [SireHawk]`
        * `Benjamin Gates et le livre des secrets.2008.MULTI.VF2.1080p.WEB-DL.AC3.x264-NoTag`)
    * `Logs`
      * All "Grab" actions
        * `// Movie [id]`
        * `// Results with [title]`
        * `// Results with [original_title]`
        * `// Filtering using strategy [regexp]`
        * `// Ordering using [key] and [direction]`
        * `// Grabbing [result] from [results]`
        * `// Sending [filename] to [blackhole]`
* `Server`
  * Secure local `pouch-db` with `config.auth`
  * Handle `[GET|POST] /config`
* `CLI`
  * Improve `logs`
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
  * Look at
    * [minimist](https://github.com/substack/minimist)
    * `UI`
      * [Inquirer.js](https://github.com/SBoudrias/Inquirer.js)
      * [commander.js](https://github.com/tj/commander.js)
      * [oclif](https://github.com/oclif/oclif)
      * [ink](https://github.com/vadimdemedes/ink)
  * Build with `webpack`
* `Production`
  * Use `Docker`

# Family
* [CouchPotato](https://github.com/CouchPotato/CouchPotatoServer)
* [Radarr](https://github.com/Radarr/Radarr)
* [Watcher3](https://github.com/nosmokingbandit/Watcher3)
