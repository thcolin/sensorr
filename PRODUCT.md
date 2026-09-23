# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One person hosting their own movie library at home, who is also the only admin of their
Sensorr instance. They know release vocabulary (`x265`, `MULTi-VF2`, `BluRay`, indexer
names) and configure the policies themselves. They mostly use Sensorr on a desktop
browser with a keyboard, and sometimes on a phone as an installed PWA. Friends reach the
product only indirectly, through their Plex watchlists, which become requests.

## Product Purpose

Sensorr watches indexers for the movies on a wishlist, scores every release it finds
against the user's policies, and drops the winning `.torrent` file into a blackhole
directory for a download client to pick up. It then keeps going back over owned movies:
`refine` looks for a release that fits the policy better, `shrink` for a lighter one that
loses nothing. Success is a library that converges on what the user wants, in the
language they want, without wasting disk space, and without them having to search by hand.

## Positioning

A VCR for movies: programmed once through policies, then trusted. Unlike a quality
profile, a policy is seven axes split into `require`, `prefer` and `avoid`, and the
interface's job is to show what the policy did. Discovery (following people, Calendar,
friends' watchlists) feeds the wishlist; it is not the subject.

## Operating Context

- Jobs run on a schedule. With `proposalOnly`, `record`, `refine` and `shrink` do not
  download: they park the release in a cache and wait for the user to accept it.
- The proposal backlog is large: 3371 movies waiting on 2026-09-16, most from `refine`.
  The user clears it in sittings and stops before the end, so what comes first matters.
- A proposal is decided on three things: whether the language improves (`VOSTFR` to
  `MULTi-VF2`), how much disk space it gains or costs, and whether the movie is worth it.
  Encoding and audio codec change most often but rarely decide.
- Accepting moves the file from the cache to the library, refusing deletes it. Both are
  irreversible once sent.

## Capabilities and Constraints

- Web app in React with theme-ui, Nx monorepo, API in NestJS on MongoDB.
- The interface is in English; `fr.js` exists but is empty.
- The repository is public: no host name, IP address or credential in tracked files.
- Refusing a proposal removes the release but does not ban it, so the same release can be
  proposed again by the next `refine`. Banning adds it to `banned_releases`, which the jobs
  exclude.
- Undecided: whether the proposal queue is loaded whole on the client to sort by gain.

## Brand Commitments

The product's own line, used across the app: "Your Friendly Digital Video Recorder. Think
VCR but in modern times." Emoji are the icon set. The visual system is recorded in
`DESIGN.md` and derived from `libs/theme`.

## Evidence on Hand

- Interface captures of every screen in `docs/assets/screenshots/`.
- Real data on the user's own instance: about 9 000 movies and 3 000 pending proposals.
- No testimonials, users or usage numbers beyond the owner's own instance; do not invent any.

## Product Principles

- Show what the policy decided and never claim more: a value no policy group mentions
  stays neutral.
- A decision takes one gesture, and what is irreversible is never staged as reversible.
- Put what matters first: the user will stop before the end of any queue.
- Reuse what the app already draws rather than drawing a second version of it.
