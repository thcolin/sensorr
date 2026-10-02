import baseConfig from '../../eslint.config.mjs'
import nx from '@nx/eslint-plugin'

export default [
  ...baseConfig,
  ...nx.configs['flat/react'],
  // Color Thief, vendored as is
  { ignores: ['**/palette/src/lib/colorthief.js'] },
  // A worker's global is self
  { files: ['**/palette/src/lib/palette.worker.js'], rules: { 'no-restricted-globals': 'off' } },
]
