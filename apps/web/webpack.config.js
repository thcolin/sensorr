const webpack = require('webpack')
const worker = require('worker-plugin')
const workbox = require('workbox-webpack-plugin')
const terser = require('terser-webpack-plugin')
const pwaManifest = require('webpack-pwa-manifest')
const nrwlConfig = require('@nrwl/react/plugins/webpack.js')

const manifest = require('./manifest.js')
const local = require('../../config/local.json')

module.exports = (config, context) => {
  nrwlConfig(config)

  return {
    ...config,
    // resolve: {
    //   ...(config.resolve || {}),
    //   alias: {
    //     ...((config.resolve || {}).alias || {}),
    //     'react-dom$': 'react-dom/profiling',
    //     'scheduler/tracing': 'scheduler/tracing-profiling',
    //   },
    // },
    stats: {
      ...(config.stats || {}),
      // Ignore warnings due to yarg's dynamic module loading
      warningsFilter: [...((config.stats || {}).warningsFilter || []), /node_modules\/yargs/, /node_modules\/workbox-webpack-plugin/]
    },
    node: {
      ...(config.node || {}),
      fs: 'empty',
      path: 'empty',
    },
    // optimization: {
    //   ...(config.optimization || {}),
    //   // TODO: Only intended for dev purposes, comment for production
    //   minimize: true,
    //   minimizer: [
    //     new terser({
    //       terserOptions: {
    //         keep_classnames: true,
    //         keep_fnames: true,
    //       },
    //     }),
    //   ],
    // },
    plugins: [
      ...(config.plugins || []),
      new webpack.DefinePlugin({
        SENSORR: JSON.stringify({ config: local }),
      }),
      new webpack.NormalModuleReplacementPlugin(
        /^yargs-parser$/,
        'yargs-parser/build/index.cjs'
      ),
      new worker({
        filename: '[name].worker.js',
      }),
      new workbox.GenerateSW({
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 5000000,
      }),
      new pwaManifest(manifest),
    ],
  }
}
