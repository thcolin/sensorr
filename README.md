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
  * Fallback on `en-US`

![Trending](/doc/screenshots/trending.jpg?raw=true)
![Collection](/doc/screenshots/collection.jpg?raw=true)
![Search](/doc/screenshots/search.jpg?raw=true)
![Movie](/doc/screenshots/movie.jpg?raw=true)

# Roadmap
* `WebUI`
  * Sync `database`
  * Pages
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
  * Setup local `pouch-db`
* `CLI`
  * Look at
    * [minimist](https://github.com/substack/minimist)
    * `UI`
      * [Inquirer.js](https://github.com/SBoudrias/Inquirer.js)
      * [commander.js](https://github.com/tj/commander.js)
      * [oclif](https://github.com/oclif/oclif)
      * [ink](https://github.com/vadimdemedes/ink)
  * Behavior
    * `Dumb` (arguments only) or `Smart` (database aware) ?
* `Production`
  * Use `Docker`

# Family
* [CouchPotato](https://github.com/CouchPotato/CouchPotatoServer)
* [Radarr](https://github.com/Radarr/Radarr)
* [Watcher3](https://github.com/nosmokingbandit/Watcher3)
