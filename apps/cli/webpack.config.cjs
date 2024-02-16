const nodeExternals = require('webpack-node-externals')
const { composePlugins, withNx } = require('@nx/webpack')

module.exports = composePlugins(
  withNx(),
  (config) => ({
    ...config,
    externalsPresets: {
      node: true
    },
    output: {
      ...config.output,
      module: true,
      libraryTarget: 'module',
      chunkFormat: 'module',
      library: {
        type: 'module'
      },
      environment: {
        module: true
      }
    },
    experiments: {
      outputModule: true,
    },
    externals: nodeExternals({
      importType: 'module'
    }),
  })
)
