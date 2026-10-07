import semver from 'semver'

export const CHANNELS = {
  stable: { emoji: '📦', tag: 'latest' },
  beta: { emoji: '🧪', tag: 'beta' },
  dev: { emoji: '🚧', tag: 'dev' },
}

// The dev image always carries the version "dev": its revision tells one push from the next
export const labelOf = (key, { version = null, revision = null } = {}) => key === 'dev' ? revision?.slice(0, 7) : version && `v${version}`

// A dev build carries the package.json version of a release: only the tag tells the two apart
export const runs = (update, key, { version = null, revision = null } = {}) => update.tag === CHANNELS[key].tag && (key === 'dev' ? update.revision === revision : update.version === version)

// GHCR's answer is cached for 15 minutes: the pull may bring a newer push than the one announced
export const arrived = (update, { key, image, from }) => key === 'dev'
  ? update.tag === 'dev' && (from.tag !== 'dev' || update.revision !== from.revision)
  : runs(update, key, image)

export const availableOf = (update) => {
  const { version, revision } = update?.channels?.[update?.channel] || {}

  if (update?.channel === 'dev') {
    return (revision && update.revision && revision !== update.revision) ? labelOf('dev', { revision }) : null
  }

  return (version && semver.valid(version) && semver.valid(update.version) && semver.gt(version, update.version)) ? labelOf(update.channel, { version }) : null
}
