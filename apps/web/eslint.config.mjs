import baseConfig, { literalStrings } from '../../eslint.config.mjs'
import nx from '@nx/eslint-plugin'

export default [
  ...baseConfig,
  ...nx.configs['flat/react'],
  // A service worker's global is self
  { files: ['**/web/src/service-worker.js'], rules: { 'no-restricted-globals': 'off' } },
  literalStrings(['**/web/src/components/**', '**/web/src/pages/Details/**', '**/web/src/pages/Proposals/**', '**/web/src/pages/Shows/**', '**/web/src/pages/Movie/**', '**/web/src/pages/Person/**', '**/web/src/pages/Collection/**', '**/web/src/layout/**', '**/web/src/contexts/**', '**/web/src/demo/**', '**/web/src/pages/App.tsx', '**/web/src/pages/Onboarding/**', '**/web/src/pages/Login/**', '**/web/src/pages/KeepInTouch/**', '**/web/src/pages/Jobs/**', '**/web/src/pages/Settings/**']),
]
