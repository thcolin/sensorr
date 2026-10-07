# Changelog

What changed in each stable release of Sensorr. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Beta releases have no section:
their notes on [GitHub](https://github.com/thcolin/sensorr/releases) list the pull requests
merged since the previous tag. How a release is cut is in [RELEASING.md](RELEASING.md).

## [Unreleased]

## [1.0.0] - 2026-10-07

A rewrite from scratch since 0.9.0: an Nx monorepo, an API on NestJS and MongoDB, a web app, a CLI for the jobs, and Docker images on GHCR.

### Added

- TV shows next to movies, with the same rules and jobs: a whole series first, then season packs, then episodes, files hard linked into the library, a calendar of airing episodes, and `migrate sonarr` to take over the series Sonarr follows.
- Policies in place of quality profiles: `avoid`, `prefer` or `require` each source, codec, resolution, language and indexer, a policy per original language and per list, and a Sandbox that shows which fake release would win.
- Refine and Shrink: swaps toward a release closer to the policy, or a lighter one that loses nothing, each showing what changes and the space it frees, decided one by one or in bulk.
- Plex: the library kept in sync, reports from Plex answered by a ban and a swap, artworks picked from those set on Plex, the owner's watchlist brought in.
- Friends: invited from the Plex server's shares, their Plex watchlist turned into requests, mails for invitations, reminders and ready to watch, and a yearly wrapped built on the Tautulli history, as stories to share.
- People followed, whose next films land in the movie calendar.
- Home rows and lists saved from the filters, Discover with unknown movies and adult keywords hidden by default.
- A details drawer painted by the poster, skeletons shaped like their content, every screen fitted to a phone.
- An installable PWA with web push notifications, a proposal accepted from its notification.
- An interactive installer, an onboarding on the first login, and the migration of a 0.x instance.
- Backups, a dump and an import of the library and its settings, weekly once turned on.
- Updates from Settings › Update, on the stable, beta or dev channel.
- Magnet-only releases written to the blackhole as `.magnet` files, and a connection test for each indexer.
- English and French, for the interface, the mails and the wrapped.
- A front-only demo on GitHub Pages, on made-up libraries.

### Changed

- The configuration lives in the API, Settings edits it, and every job's schedule applies at once.
- The installer and the manual install read their files from `main`.

[Unreleased]: https://github.com/thcolin/sensorr/compare/v1.0.0...dev
[1.0.0]: https://github.com/thcolin/sensorr/releases/tag/v1.0.0
