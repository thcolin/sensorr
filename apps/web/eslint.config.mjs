import baseConfig, { literalStrings } from '../../eslint.config.mjs'
import nx from '@nx/eslint-plugin'

export default [
  ...baseConfig,
  ...nx.configs['flat/react'],
  // A service worker's global is self
  { files: ['**/web/src/service-worker.js'], rules: { 'no-restricted-globals': 'off' } },
  literalStrings(['**/web/src/pages/Jobs/**', '**/web/src/components/Sensorr/**']),
]
