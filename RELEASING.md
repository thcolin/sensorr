# Releasing

Sensorr ships through three image channels. Work lands on `dev`; `main` only receives stable
releases. `main` is the former `master`; its 0.x history stays on the `legacy` branch.

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
