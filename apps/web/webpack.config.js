const webpack = require('webpack')
const { composePlugins, withNx } = require('@nx/webpack')
const { withReact } = require('@nx/react')
const workbox = require('workbox-webpack-plugin')

module.exports = composePlugins(
  withNx({
    outputHashing: process.env['NODE_ENV'] === 'production' ? 'all' : 'none',
    optimization: process.env['NODE_ENV'] === 'production',
    sourceMap: process.env['NODE_ENV'] !== 'production'
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
        new workbox.GenerateSW({
          clientsClaim: true,
          skipWaiting: true,
          maximumFileSizeToCacheInBytes: 5000000,
        }),
      ]
    }
  }
)

// const webpack = require('webpack')
// const worker = require('worker-plugin')
// // const terser = require('terser-webpack-plugin')
// const pwaManifest = require('webpack-pwa-manifest')
// const nrwlConfig = require('@nx/react/plugins/webpack.js')

// const manifest = require('./manifest.js')
// // const local = require('../../config.json')

// module.exports = (config, context) => {
//   nrwlConfig(config)

//   return {
//     ...config,
//     // resolve: {
//     //   ...(config.resolve || {}),
//     //   alias: {
//     //     ...((config.resolve || {}).alias || {}),
//     //     'react-dom$': 'react-dom/profiling',
//     //     'scheduler/tracing': 'scheduler/tracing-profiling',
//     //   },
//     // },
//     stats: {
//       ...(config.stats || {}),
//       // Ignore warnings due to yarg's dynamic module loading
//       warningsFilter: [...((config.stats || {}).warningsFilter || []), /node_modules\/yargs/, /node_modules\/workbox-webpack-plugin/],
//     },
//     node: {
//       ...(config.node || {}),
//       fs: 'empty',
//       path: 'empty',
//     },
//     // optimization: {
//     //   ...(config.optimization || {}),
//     //   // Only intended for debug purposes, comment for production
//     //   minimize: true,
//     //   minimizer: [
//     //     new terser({
//     //       terserOptions: {
//     //         keep_classnames: true,
//     //         keep_fnames: true,
//     //       },
//     //     }),
//     //   ],
//     // },
//     plugins: [
//       ...(config.plugins || []),
//       new webpack.NormalModuleReplacementPlugin(/^yargs-parser$/, 'yargs-parser/build/index.cjs'),
//       new worker({
//         filename: '[name].worker.js',
//       }),
//       new pwaManifest(manifest),
//     ],
//   }
// }
