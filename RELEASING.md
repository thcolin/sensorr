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
git commit -am "chore(release): 1.0.0-beta.1"
git push origin dev
node tools/release/check-tag.mjs v1.0.0-beta.1
git tag v1.0.0-beta.1
git push origin v1.0.0-beta.1
```

Then publish the GitHub prerelease, its notes listing what changed since the previous tag:

```sh
gh release create v1.0.0-beta.1 --prerelease --notes-file <notes>
```

A beta gets no section in the [changelog](CHANGELOG.md): the next stable section covers it.

## Stable

1. On `dev`, bump the version and write the release section of the [changelog](CHANGELOG.md),
   what changed since the previous stable release, read from
   `git log --oneline <previous stable tag>..dev`:

   ```sh
   npm pkg set version=1.0.0
   git commit -am "chore(release): 1.0.0"
   git push origin dev
   ```

2. Open the pull request from `dev` to `main`, wait for the `check` job, and merge it with a
   merge commit. Rebase and squash rewrite the SHAs: `main` would then hold commits `dev` does
   not, and the next pull request would conflict.

   ```sh
   gh pr create --base main --head dev --title "Release 1.0.0" --body "<changelog section>"
   gh pr merge --merge
   ```

3. Tag the merge commit, and publish the release with the changelog section as notes:

   ```sh
   git fetch origin
   node tools/release/check-tag.mjs v1.0.0 origin/main
   git tag v1.0.0 origin/main
   git push origin v1.0.0
   gh release create v1.0.0 --notes-file <changelog section>
   ```

## First stable release only

`main` still carries the 0.x history, and `dev` shares no commit with it: `dev` starts over
at `3fbf049a`, on 2022-02-06. GitHub cannot open a pull request between two unrelated
histories, so the first stable release replaces `main` with `dev` instead of step 2:

```sh
git fetch origin
git push --force-with-lease=main:origin/main origin origin/dev:main
```

The 0.x history stays reachable through the tags `v0.2.0` to `v0.9.0`. Then tag as in step 3,
and delete this section.
