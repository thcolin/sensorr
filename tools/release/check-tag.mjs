import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Exits 1 when the CI would refuse this release tag, the rules are in `RELEASING.md`.
// `node tools/release/check-tag.mjs <tag> [commit]`, the commit defaulting to `HEAD`.

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
