# Releasing

Sensorr ships through three image channels. Work lands on `dev`; `main` only receives stable
releases. `main` is the former `master`, and still holds the 0.x history until the first
stable release replaces it, see [First stable release only](#first-stable-release-only).

| Channel | Published by | Image tags | `SENSORR_TAG` in `.env` |
| --- | --- | --- | --- |
| dev | every push to `dev` | `dev`, `sha-<short sha>` | `dev` |
| beta | a `vX.Y.Z-beta.N` tag on a commit of `dev` | `X.Y.Z-beta.N`, `beta` | `beta` or `X.Y.Z-beta.N` |
| stable | a `vX.Y.Z` tag on a commit of `main` | `X.Y.Z`, `X.Y`, `latest` | `latest`, `X.Y` or `X.Y.Z` |

A beta never moves `latest` nor `X.Y`. The images are built by `.github/workflows/ci.yml`, see
[Images](docs/architecture.md#images).

The version comes from the root `package.json`. Before building anything, the `check` job of
`ci.yml` runs `tools/release/check-tag.mjs` on the git tag, and fails when:

- the tag is neither `vX.Y.Z` nor `vX.Y.Z-beta.N`
- the tag is not `v` + the `version` of `package.json` at the tagged commit
- a beta tags a commit outside `origin/dev`, or a stable release a commit outside `origin/main`

Run it yourself before pushing a tag, after a `git fetch origin`. Its second argument is the
commit to tag, `HEAD` by default:

```sh
node tools/release/check-tag.mjs v1.0.0-beta.1
```

An installed Sensorr reads what each channel offers on GHCR, the `org.opencontainers.image.version`
and `org.opencontainers.image.revision` labels of `sensorr-api:beta`, `sensorr-api:latest` and
`sensorr-api:dev` (`GET /api/update`, `apps/api/src/app/update/update.ts`): a release, or a push to
`dev`, reaches it once `ci.yml` has pushed its images.

## Beta

On `dev`:

```sh
npm pkg set version=1.0.0-beta.1
git commit -m "chore(release): 1.0.0-beta.1" package.json
git push origin dev
node tools/release/check-tag.mjs v1.0.0-beta.1
git tag v1.0.0-beta.1
git push origin v1.0.0-beta.1
gh release create v1.0.0-beta.1 --prerelease --generate-notes
```

`--generate-notes` lists the pull requests merged since the previous tag. A beta gets no
section in the [changelog](CHANGELOG.md): the next stable release's section covers it.

## Stable

1. On `dev`, bump the version and turn `## [Unreleased]` of the [changelog](CHANGELOG.md)
   into the section of the release: rename it `## [1.0.0] - YYYY-MM-DD`, fill it with what changed
   since the previous stable release, `git log --oneline <previous stable tag>..dev`, open a
   new empty `## [Unreleased]` above it, and add the link of the release at the bottom, next to
   the `[Unreleased]` one,
   `[1.0.0]: https://github.com/thcolin/sensorr/releases/tag/v1.0.0`. Copy the section into
   `notes.md`, outside the repository so it never gets committed, for the pull request and the
   release.

   ```sh
   npm pkg set version=1.0.0
   git commit -m "chore(release): 1.0.0" package.json CHANGELOG.md
   git push origin dev
   ```

2. Open the pull request from `dev` to `main`, wait for the `check` job, and merge it with a
   merge commit. Rebase and squash rewrite the SHAs: `main` would then hold commits `dev` does
   not, and the next pull request would conflict.

   ```sh
   gh pr create --base main --head dev --title "Release 1.0.0" --body-file notes.md
   gh pr checks dev --watch
   gh pr merge dev --merge
   ```

3. Tag the merge commit, and publish the release:

   ```sh
   git fetch origin
   node tools/release/check-tag.mjs v1.0.0 origin/main
   git tag v1.0.0 origin/main
   git push origin v1.0.0
   gh release create v1.0.0 --notes-file notes.md
   ```

## First stable release only

`main` still carries the 0.x history, and `dev` shares no commit with it: `dev` starts over
at `3fbf049a`, the first commit of the Nx rewrite, on 2022-02-06. GitHub cannot open a pull
request between two unrelated histories, so the first stable release runs step 1, then
replaces `main` with `dev` instead of step 2, then runs step 3.

In step 1, no stable tag is in the history of `dev`: `git log --oneline dev` lists every
commit since the rewrite, and the section sums up what changed since 0.9.0. The same commit
serves the installer from `main`, which only receives releases, instead of `dev`, where any
push runs at once on every new install: replace `sensorr/dev/install.sh` with
`sensorr/main/install.sh` in `README.md` and in the header of `install.sh`.

In place of step 2, once `gh api repos/thcolin/sensorr/branches/main/protection` answers 404,
no protection blocking a force-push:

```sh
git fetch origin --prune
git push --force-with-lease=main:origin/main origin origin/dev:main
```

The 0.x history stays on the `legacy` branch, which points at `361d0937`, the last commit of
`master`: never delete it. The tags `v0.2.0` to `v0.9.0` stay too, but they sit on commits
outside `master`, so they do not keep its history. Once `v1.0.0` is published, delete this
section.
