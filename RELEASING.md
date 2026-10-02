# Releasing

Sensorr ships through three image channels. Work lands on `dev`; `main` only receives stable
releases.

| Channel | Published by | Image tags | `SENSORR_TAG` |
| --- | --- | --- | --- |
| dev | every push to `dev` | `dev`, `sha-<short sha>` | `dev` |
| beta | a `vX.Y.Z-beta.N` tag on a commit of `dev` | `X.Y.Z-beta.N`, `beta` | `beta` or `X.Y.Z-beta.N` |
| stable | a `vX.Y.Z` tag on a commit of `main` | `X.Y.Z`, `X.Y`, `latest` | `latest`, `X.Y` or `X.Y.Z` |

A beta never moves `latest` nor `X.Y`. The images are built by `.github/workflows/ci.yml`, see
[Images](docs/architecture.md#images).

The version comes from `package.json`. Before building anything, the CI runs
`tools/release/check-tag.mjs` on the tag, and fails when:

- the tag is neither `vX.Y.Z` nor `vX.Y.Z-beta.N`
- the tag is not `v` + the `version` of `package.json` at the tagged commit
- a beta tags a commit outside `origin/dev`, or a stable release a commit outside `origin/main`

Run it yourself before pushing a tag, after a `git fetch origin`:

```sh
node tools/release/check-tag.mjs v1.0.0-beta.1
```

An installed Sensorr compares its version with the `package.json` of `main`
(`apps/web/src/pages/Settings/Settings.tsx`): a stable release reaches it once `main` holds it.

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
section in the [changelog](CHANGELOG.md): the next stable section covers it.

## Stable

1. On `dev`, bump the version and turn `## [Unreleased]` of the [changelog](CHANGELOG.md)
   into the release section: rename it `## [1.0.0] - YYYY-MM-DD`, fill it with what changed
   since the previous stable release, `git log --oneline <previous stable tag>..dev`, open a
   new empty `## [Unreleased]` above it, and add its link at the bottom,
   `[1.0.0]: https://github.com/thcolin/sensorr/releases/tag/v1.0.0`. Copy the section into
   `notes.md`, outside the repository, for the pull request and the release.

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
at `3fbf049a`, on 2022-02-06. GitHub cannot open a pull request between two unrelated
histories, so the first stable release replaces `main` with `dev` instead of step 2. Its
changelog section has no previous stable tag in the history of `dev`: it sums up what
changed since 0.9.0.

```sh
git fetch origin --prune
git push --force-with-lease=main:origin/main origin origin/dev:main
```

The force-push needs `origin/main` locally, hence the fetch, and no branch protection on
`main`. The 0.x history stays on the `legacy` branch, which points at the last commit of
`master`, `361d0937`: never delete it. The tags `v0.2.0`, `v0.3.0`, `v0.4.0`, `v0.4.1`,
`v0.5.3` and `v0.9.0` mark the versions published then, on commits `master` does not
contain: none of them keeps its history. Then tag as in step 3, and delete this section.
