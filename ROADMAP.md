# Roadmap

What stands between `dev` and the first stable release, `1.0.0`, and what comes after it.
Betas ship from `dev` along the way, see [RELEASING.md](RELEASING.md).

## Before 1.0.0

### Install and first steps

- **Interactive installer**: a quick command-line installer that asks what it needs and leaves a
  running Sensorr behind, without editing files by hand.
- **Onboarding**: what the first connection asks for, so that a fresh install reaches a
  working library without editing files, and brings a 0.x configuration and database over.
- **Dump and import**: dump the data of an instance and import it back, so that it stays yours.
- **Online demo**: a public instance on demo data.
- **Translations**: no hard-coded string left in the interface.

### Screens

- **Responsive pass**: every screen checked and fixed at phone width.
- **Quick access**: the panel a long press on a poster opens.
- **Skeletons**: loading placeholders shaped like the content they stand for.
- **Home and Discover**: Home rows picked, ordered and saved from the Discover filters, and a
  Random button in Discover.

### Features

- **Policy sandbox**: a panel in the policy settings that ranks sample releases, to see how each
  policy sorts every kind of release.
- **Season finales**: read the finale TMDB marks on an episode before looking for a season pack.
- **Calendar thresholds**: set the minimum runtime and the credit rank the calendar filters on.

## After 1.0.0

- **Browser extension**: change the state of the movie open on IMDb, TMDB, SensCritique or
  AlloCiné on your Sensorr.
- **Discover vote floor**: a minimum vote count by default when Discover sorts by vote average.
- **Home ranking**: rank the bounded Home rows on several pages of Discover results.
