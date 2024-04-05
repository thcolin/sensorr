const webpack = require('webpack')
const { composePlugins, withNx } = require('@nx/webpack')
const { withReact } = require('@nx/react')
const workbox = require('workbox-webpack-plugin')

module.exports = composePlugins(
  withNx({
    outputHashing: process.env['NODE_ENV'] === 'production' ? 'all' : 'none',
    optimization: process.env['NODE_ENV'] === 'production',
    sourceMap: process.env['NODE_ENV'] !== 'production',
  }),
  withReact(),
  (config, { options, context }) => {
    // `config` is the Webpack configuration object
    // `options` is the options passed to the `@nx/webpack:webpack` executor
    // `context` is the context passed to the `@nx/webpack:webpack` executor
    return {
      ...config,
      ignoreWarnings: [
        // Ignore warnings due to yarg's dynamic module loading
        { module:  /node_modules\/yargs/ },
        // { module: /node_modules\/workbox-webpack-plugin/ },
      ],
      output: {
        ...config?.output,
        scriptType: 'text/javascript',
      },
      resolve: {
        ...config?.resolve,
        fallback: {
          ...config?.resolve?.fallback,
          path: false,
          tty: false,
          net: false,
          fs: false,
        },
      },
      plugins: [
        ...config.plugins,
        new webpack.DefinePlugin({
          SENSORR_DEFAULTS: {
            region: 'en', // local.region,
          },
        }),
        new webpack.ProvidePlugin({
          // Make a global `process` variable that points to the `process` package,
          // because the `util` package expects there to be a global variable named `process`.
          // Thanks to https://stackoverflow.com/a/65018686/14239942
          process: 'process/browser'
        }),
        new workbox.InjectManifest({
          swSrc: './src/service-worker.js',
        }),
      ]
    }
  }
)
