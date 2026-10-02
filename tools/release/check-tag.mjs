import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Refuses a release tag the CI should not publish, and exits 1 with the reason.
// Run it before pushing a tag: `node tools/release/check-tag.mjs v1.0.0-beta.1 [commit]`.
//
//   1. the tag is `vX.Y.Z` (stable) or `vX.Y.Z-beta.N` (beta), nothing else
//   2. the tag is `v` + the `version` of `package.json` at that commit
//   3. a beta tags a commit of `origin/dev`, a stable one a commit of `origin/main`
//
// The commit defaults to `HEAD`; the CI passes the tagged one.

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const [tag, commit = 'HEAD'] = process.argv.slice(2)

const fail = (reason) => {
  console.error(`${tag}: ${reason}`)
  process.exit(1)
}

const match = /^v(\d+\.\d+\.\d+)(-beta\.\d+)?$/.exec(tag || '')

if (!match) {
  fail('expected vX.Y.Z or vX.Y.Z-beta.N')
}

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
const { version } = JSON.parse(git('show', `${commit}:package.json`))

if (tag !== `v${version}`) {
  fail(`package.json is at ${version}, bump it to ${tag.slice(1)} first`)
}

const branch = match[2] ? 'dev' : 'main'

try {
  git('merge-base', '--is-ancestor', commit, `origin/${branch}`)
} catch {
  fail(`${commit} is not on origin/${branch}, a ${match[2] ? 'beta' : 'stable'} release tags ${branch}`)
}
