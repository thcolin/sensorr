# Sensorr

> 🍿📼 Your Friendly Digital Video Recorder. Think VCR but in modern times.

Sensorr watches for the movies and the TV series you want. You keep a library of wished
movies, a library of followed shows and a list of people you follow, and on a schedule
Sensorr searches your Torznab indexers, scores every release it finds against your policies,
and drops the winning `.torrent` file into a blackhole directory for your download client to
pick up. Out of the shipped configuration it
queues that release as a proposal instead, and waits for you to accept it. It reads TMDB for
metadata, your Plex server for what you already own, and your friends' Plex watchlists for
what they would like to see. For series it also takes the finished files out of your
download client's folder and hard links them into the shows library. It is meant for one
person hosting their own library at home.

![Sensorr library](docs/assets/screenshots/library-desktop.webp)

<sub>Library screen, captured 2026-09-18. More screens in [`docs/assets/screenshots/`](docs/assets/screenshots/).</sub>

# Features

- **A library with states.** A movie is `Pinned`, `Wished`, `Archived`, `Ignored` or `Missing`. `record` hunts the wished ones, `refine` and `shrink` go back over the archived ones.
- **Follow people.** Follow a director, an actor, a composer, and the Calendar lists what they release, month by month.
- **Torznab indexers.** Declare as many as you want, enable and disable them one by one.
- **Policies instead of a quality profile.** Seven axes, source, encoding, resolution, language, dub, flags and indexer, each split in three groups: `avoid` rejects a release outright, `prefer` ranks the rest by score, `require` is the end-goal `refine` works towards.
- **Blackhole downloads.** Sensorr writes the release file into your blackhole directory, named `.torrent`, and your download client does the rest. An indexer that only gives magnet links, The Pirate Bay through Jackett for one, gets its movie releases written as `.magnet` files once *Magnet links* is on in *Settings > Blackhole*. Turn it on only if your download client reads `.magnet` files from its watched folder, as qBittorrent does. Off, those releases are withdrawn, and so are show releases whatever the setting: importing a show needs the file list of its `.torrent`.
- **Seven scheduled jobs for movies.** Each job takes the media type as its argument, `record movies` or `record shows`, and the ones below run on `movies`. `record` grabs the best release available for wished movies, `refine` looks for a better fitting one for archived movies, `shrink` for the smallest one for refined movies, `refresh` re-fetches TMDB metadata for every movie and person you store, `sync` reconciles the library with Plex, `keep-in-touch` reads your friends' watchlists, `report` replaces a movie a friend reported from Plex.
- **Proposals.** `record`, `refine`, `shrink` and `report` can be set to `proposalOnly`: they submit what they found instead of downloading it, and you pick from the comparison screen.
- **Requests from friends.** A friend links their Plex account with a code, and `keep-in-touch` turns the movies on their Plex watchlist into requests. A movie Sensorr did not know lands as `Ignored`, never `Wished`; you decide from the Requests screen.
- **Browse TMDB from inside Sensorr.** Discover, Trending, Calendar, Theatres, Collections, Recommendations and Similar.
- **A library of series, with seasons and episodes.** A show page lists every season and every episode TMDB knows, with how many aired episodes you own. Each episode is `upcoming`, `unmonitored`, `wanted`, `proposed` or `owned`. The Shows section adds a Calendar of the episodes of followed shows, Discover and Trending.
- **Follow at three levels.** A whole show, one season or one episode. A show is `Ignored`, `Pinned` or `Followed`, and only a followed one is searched. A followed show can also follow the seasons TMDB adds later. Specials, season 0, are only followed by hand.
- **Whole series, season packs or episodes, chosen by coverage.** An ended show you follow whole and own nothing of is searched as a complete series first, then season by season, then episode by episode. A season pack is only searched once every episode of it has aired and is followed. The policies rank the releases inside each level, the same policies as movies.
- **Proposals for series.** `record shows` and `airing shows` queue what they found as proposals out of the shipped configuration, and a show can say otherwise. A pending release is named by what it covers, `S01-S10`, `S03` or `S03E04`, on the show page and in its notification.
- **Hourly airing.** `airing shows` runs every hour and searches the followed episodes aired in the last seven days, one by one.
- **File import by hard link.** Show releases go to their own blackhole. Once the download client has written every file of one into the staging folder, `import shows` hard links the wanted episodes into `<Show (year)>/Season NN/` of the shows library, and Plex picks them up from there. A hard link takes no space, so the download client can keep seeding.
- **Migration from Sonarr.** `migrate sonarr`, a command run once by hand, takes over Sonarr's series, what Sonarr follows per season and per episode, whether it follows new seasons, and the folder of each show. It only reads Sonarr.
- **Requests from Plex watchlists, series included.** `keep-in-touch` reads the shows of a friend's watchlist too. A show Sensorr did not know lands in Requests as `Ignored`, and nothing is searched until you follow it.
- **A PWA with web push.** Installable, and it pushes a notification when a job grabs a release, finds a movie missing from Plex, or picks up a request.
- **English and French.**

# Install

The images are published on GHCR for `linux/amd64` and `linux/arm64`. On arm64, MongoDB 8 needs an ARMv8.2-A CPU: a Raspberry Pi 5 runs it, a Pi 4 does not.

With Docker and Docker Compose installed, run the installer:

```sh
curl --proto =https -fsSL https://raw.githubusercontent.com/thcolin/sensorr/dev/install.sh | sh
```

It asks for the install folder, `~/.sensorr` by default, the channel, the blackhole and shows folders, your username and password, `sensorr` and `sensorr` by default, the time zone, whether to [update from the app](#update-from-the-app), off by default, and your TMDB API key. It generates the auth secret and the database password, starts the stack, and gives the URL once the login works. Run it again in the same folder to repair an install: it keeps every value its `.env` holds, asks only for the missing ones, then pulls and restarts the stack.

The first login opens an onboarding: TMDB, your indexers, a first policy, the blackhole, Plex, your friends and mail, then the jobs. Only TMDB is required, every other step can be skipped and changed later in *Settings*.

## Manual install

```sh
# Choose an install folder for Sensorr install and config files
mkdir ~/.sensorr && cd ~/.sensorr

# Download install files
curl -o docker-compose.yml https://raw.githubusercontent.com/thcolin/sensorr/dev/docker-compose.yml
curl -o config.json https://raw.githubusercontent.com/thcolin/sensorr/dev/config.default.json
curl --create-dirs -o docker/sensorr-db/0-init-mongodb.js https://raw.githubusercontent.com/thcolin/sensorr/dev/docker/sensorr-db/0-init-mongodb.js

# Create every folder the stack mounts: Docker on a Synology refuses to start on a missing one
mkdir -p caddy/data caddy/config caddy/certs db .secrets dumps blackhole tvshows

# Set your own Sensorr secrets, username and password
echo "SENSORR_AUTH_SECRET=youshouldchangethisvaluetoanythingelse" >> .env
echo "SENSORR_USERNAME=username" >> .env
echo "SENSORR_PASSWORD=password" >> .env
echo "SENSORR_DATABASE_PASSWORD=anotherpassword" >> .env

# Define your "blackhole" directory where .torrent files will be downloaded
echo "SENSORR_BLACKHOLE=/home/user/downloads" >> .env

# Define your shows directory, mounted whole as /tvshows: the shows library, its blackhole and the download client's staging folder live under it, see "Series" below
echo "SENSORR_TVSHOWS=/home/user/tvshows" >> .env

# Define your "server contact information" (either a `mailto:` or `https` link) required if you want to enable web push notifications, see ["What is VAPID and why is it useful?"](https://stackoverflow.com/questions/40392257/what-is-vapid-and-why-is-it-useful)
echo "SENSORR_VAPID_SUBJECT=mailto:admin@example.com" >> .env

# Set your own TimeZone, see ["TZ identifier"](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List)
echo "TZ=Europe/Paris" >> .env

# Launch the stack
docker compose up -d

# Sensorr is now available at,
# * http://localhost:5070
# * https://localhost:5071
# Use previously defined username/password to login
```

## From 0.x

Sensorr 0.x ran as the `thcolin/sensorr` image, its config mounted on `/app/sensorr/config` and its downloads on `/app/sensorr/blackhole`.

1. In the 0.x, *Settings > Database > Dump* downloads a `.zip` of your movies and stars.
2. Stop the 0.x container, it listens on `5070` too.
3. Run the installer with the 0.x config folder as install folder, and its downloads folder as blackhole. The installer keeps the `config.json` it finds there, and the API converts it on its first boot: the TMDB key, the region, the indexers and the policy stay, the login moves to `.env`, Plex is linked again from the onboarding. The 0.x file is kept as `.secrets/config.json.bak`.
4. On the first login, the onboarding asks where you come from: pick *From a 0.x* and send the `.zip`. It is imported by the `migrate` job once TMDB answers, follow it in *Jobs*. Movies keep their `wished` or `archived` state, stars become `followed`, and `ignored` movies are left behind.

## Series

The shows directory holds three folders, all set from *Settings > Blackhole*: the library at
its root, `.blackhole` where Sensorr writes the `.torrent` of a show release, and `.staging`
where your download client saves it. Point your download client at both: watch
`.blackhole`, save into `.staging` with the torrent's own folder layout. `import shows` then
hard links the files into the library, and your Plex show section reads the library.

The three have to sit on one filesystem and inside one mount of `sensorr-api`: a hard link
cannot cross either. That is why `docker-compose.yml` mounts `SENSORR_TVSHOWS` whole instead
of one volume per folder.

`import shows` knows a file is still downloading from qBittorrent's `.!qB` suffix (*Options >
Downloads > Append .!qB extension to incomplete files*), or from a size below the one the
`.torrent` announces. The five series jobs are paused in the shipped configuration: start them
from *Settings > Jobs*.

## HTTPS

Use custom key/cert for HTTPS (default to [`tls internal { on_demand }`](https://caddyserver.com/docs/automatic-https#on-demand-tls)). The folder holding them is mounted whole as `/certs`, and the two names are the files inside it (default `sensorr.cert` and `sensorr.key`)

```sh
echo "CADDY_TLS_MODE=custom" >> .env
echo "SENSORR_SSL_DIR=/path/to/certs" >> .env
echo "SENSORR_SSL_CERT_NAME=domain.cert" >> .env
echo "SENSORR_SSL_KEY_NAME=domain.key" >> .env
```

On a Synology, point it at the certificate DSM manages, in `/usr/syno/etc/certificate/_archive/<id>`, where `<id>` is what `sudo cat /usr/syno/etc/certificate/_archive/DEFAULT` prints for the default certificate

```sh
echo "SENSORR_SSL_DIR=/usr/syno/etc/certificate/_archive/<id>" >> .env
echo "SENSORR_SSL_CERT_NAME=fullchain.pem" >> .env
echo "SENSORR_SSL_KEY_NAME=privkey.pem" >> .env
```

Caddy reads the files when it starts: after a renewal, restart it with `docker container restart sensorr-web`

`SENSORR_SSL_KEY` and `SENSORR_SSL_CERT` are no longer read: an install that set them moves to `SENSORR_SSL_DIR`, `SENSORR_SSL_CERT_NAME` and `SENSORR_SSL_KEY_NAME`

## Configuration

When you edit manually your `config.json`, you need to restart `sensorr-api` container to apply your changes

```sh
docker container restart sensorr-api
```

# Update

The stack follows the latest release. Pull the new images and recreate the containers:

```sh
cd ~/.sensorr
docker compose pull
docker compose up -d
```

To pin a version, set it in `.env`, for example `SENSORR_TAG=1.0.0`. `SENSORR_TAG=beta` follows the beta releases, once the first one is tagged, `SENSORR_TAG=dev` the `dev` branch, rebuilt on every push. What changed in each release is in the [changelog](CHANGELOG.md).

Until `v1.0.0` is tagged, no `latest` image exists: set `SENSORR_TAG=dev` in `.env` before `docker compose up -d`.

## Update from the app

Settings › Update shows the version that runs and what each channel offers: stable, the `latest` tag, beta, the `beta` tag, or dev, the `dev` tag rebuilt on every push to the `dev` branch. With the `updater` compose profile on, it also updates the stack: `sensorr-updater` writes `SENSORR_TAG` into the env file you pass to compose, `.env` by default, the last one holding a `SENSORR_TAG=` line when you pass several, pulls the images of the channel you picked, and recreates `sensorr-api`, `sensorr-web` and itself. It leaves `sensorr-db` running, and your next `docker compose up -d` recreates `sensorr-db` on the new tag.

```sh
cd ~/.sensorr
echo "COMPOSE_PROFILES=updater" >> .env
docker compose up -d
```

`sensorr-updater` holds the Docker socket, which controls every container of the host. It publishes no port and only talks to `sensorr-api`, over the `updater` network, which has no way out, with the secret `sensorr-api` generates in `.secrets/updater` on its first boot. An update is refused while a [job](docs/jobs.md) runs, since recreating `sensorr-api` would kill it. Without the profile, the page gives the commands to run instead.

# Dump and import

Settings › Data writes your library and its settings into a `.zip` in `dumps/` of the install folder: movies, TV shows, episodes and stars as JSON lines, `config.json`, and a `manifest.json` with the version of Sensorr and the count of each. The keys and passwords stay out, the TMDB key, every indexer key, the Plex token, the mail password, the Tautulli and MediUX keys, and so does the key Jackett and Prowlarr leave in a release link. The wrapped, the jobs' logs and your friends' Plex tokens stay out too.

The `dump` job does the same every Sunday at 4:00 once turned on in Settings › Jobs, and keeps the last 4. A dump only reaches `dumps/` with the `./dumps:/app/dumps` volume of `docker-compose.yml`: an install made before Settings › Data needs that line in its compose file, and a `mkdir dumps` in its install folder.

The same page imports a dump, and so does the onboarding of a new instance, under *From a dump*. The import replaces the movies, TV shows, episodes and stars, and the settings but their keys and passwords: those of the instance that imports stay, and an indexer of the same name keeps its key. It is refused while a job runs, and it runs as the `restore` job, all at once: a dump that breaks halfway leaves the library as it was. From a shell, `docker exec sensorr-api bin/sensorr dump` writes one. Import from the page only: started from a shell, a restore would run next to the jobs the API starts.

# Documentation

- [Configuration](docs/configuration.md), every key of `config.json`
- [Jobs, proposals and policy](docs/jobs.md), what each job is for and how a release gets ranked
- [Development](docs/development.md), running Sensorr from a clone
- [Architecture](docs/architecture.md), what talks to what

# License

MIT, see [LICENSE](LICENSE).
