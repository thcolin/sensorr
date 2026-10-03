// `config.default.json` ships this placeholder, and the installer keeps it when the key is left for later
export const TMDB_PLACEHOLDER = 'tmdb-api-key'

export const hasTMDBKey = (config) => !!config.get('tmdb') && config.get('tmdb') !== TMDB_PLACEHOLDER

// An instance that already searches somewhere never sees it: a running library is not sent back to the start
export const needsOnboarding = (config) => !config.get('onboarding.done') && (
  !hasTMDBKey(config) || !(config.get('znabs') || []).length || !!config.get('onboarding.legacy')
)
