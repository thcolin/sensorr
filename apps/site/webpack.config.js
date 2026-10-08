const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const { composePlugins, withNx } = require('@nx/webpack')
const { withReact } = require('@nx/react')

// `@sensorr/ui` and `@sensorr/utils` carry what the web app needs, Node built-ins included: resolved as `apps/web` does
module.exports = composePlugins(
  withNx({
    outputHashing: process.env['NODE_ENV'] === 'production' ? 'all' : 'none',
    optimization: process.env['NODE_ENV'] === 'production',
    sourceMap: process.env['NODE_ENV'] !== 'production',
  }),
  withReact(),
  (config) => ({
    ...config,
    // The palette worker of `@sensorr/palette` is a classic script, as in `apps/web`
    output: {
      ...config.output,
      scriptType: 'text/javascript',
    },
    module: {
      ...config.module,
      rules: [
        ...config.module.rules,
        // The page takes a few atoms of the libraries: what it does not import is left out of the bundle
        { test: /libs\/(ui|utils)\/src\/.*\.(js|ts|tsx)$/, sideEffects: false },
      ],
    },
    resolve: {
      ...config?.resolve,
      fallback: {
        ...config?.resolve?.fallback,
        path: false,
        tty: false,
        net: false,
        fs: false,
        'fs/promises': false,
      },
    },
    plugins: [
      ...config.plugins,
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, '')
      }),
      new webpack.DefinePlugin({
        SENSORR_VERSION: JSON.stringify(JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'))).version),
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
    ],
  }),
)
