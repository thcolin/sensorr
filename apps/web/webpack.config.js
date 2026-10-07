const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const { composePlugins, withNx } = require('@nx/webpack')
const { withReact } = require('@nx/react')
const workbox = require('workbox-webpack-plugin')

const API = path.join(__dirname, '../api/src')

// What `apps/api` imports and a page cannot run, see `src/demo/server/shims`
const shim = (name) => path.join(__dirname, 'src/demo/server/shims', name)
const DEMO_ALIASES = {
  '@nestjs/common$': shim('nest-common.ts'),
  '@nestjs/mongoose$': shim('nest-mongoose.ts'),
  '@nestjs/event-emitter$': shim('nest-event-emitter.ts'),
  '@nestjs/schedule$': shim('nest-schedule.ts'),
  '@nestjs/jwt$': shim('nest-jwt.ts'),
  '@nestjs/platform-express$': shim('nest-platform-express.ts'),
  'mongoose$': shim('mongoose.ts'),
  'mongoose-paginate-v2$': shim('empty.ts'),
  'web-push$': shim('empty.ts'),
  'child_process$': shim('empty.ts'),
  'fs$': shim('fs.ts'),
  'fs/promises$': shim('fs-promises.ts'),
  'path$': shim('path.ts'),
  'url$': shim('url.ts'),
  'crypto$': shim('crypto.ts'),
}

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
    const demo = context.configurationName === 'demo'

    return {
      ...config,
      ignoreWarnings: [
        // Ignore warnings due to yarg's dynamic module loading
        { module:  /node_modules\/yargs/ },
        // The types the demo replaces `@sensorr/plex` without, see below
        ...(demo ? [{ message: /PlexArtworks.*@sensorr\/plex/ }] : []),
        // { module: /node_modules\/workbox-webpack-plugin/ },
      ],
      module: demo ? {
        ...config.module,
        rules: [
          ...config.module.rules.map((rule) => rule?.loader?.includes('babel-loader') ? { ...rule, exclude: [rule.exclude, API].filter(Boolean) } : rule),
          // `apps/api` builds with tsc, its decorated parameters included
          {
            test: /\.ts$/,
            include: API,
            loader: require.resolve('ts-loader'),
            options: {
              configFile: path.join(__dirname, '../api/tsconfig.app.json'),
              transpileOnly: true,
            },
          },
        ],
      } : config.module,
      output: {
        ...config?.output,
        clean: true,
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
          'fs/promises': false,
        },
        alias: {
          ...config?.resolve?.alias,
          ...(demo ? DEMO_ALIASES : {}),
        },
      },
      plugins: [
        ...config.plugins,
        // Node built-ins imported as node:x resolve like x, to the fallbacks above
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, '')
        }),
        new webpack.DefinePlugin({
          SENSORR_VERSION: JSON.stringify(JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'))).version),
          // The login `apps/api/src/app/auth/auth.service.ts` checks, and the TMDB key of the demo, never committed
          ...(demo ? {
            'process.env.NX_SENSORR_USERNAME': JSON.stringify('demo'),
            'process.env.NX_SENSORR_PASSWORD': JSON.stringify('demo'),
            SENSORR_DEMO_TMDB_KEY: JSON.stringify(process.env.SENSORR_DEMO_TMDB_KEY || ''),
          } : {}),
        }),
        // The demo runs `apps/api` in the page, without the service that writes to the blackhole and starts the CLI.
        // `apps/api` reads the types of `@sensorr/plex` only, but compiled file by file a schema keeps the import its
        // decorator metadata names, `PlexArtworks`
        ...(demo ? [new webpack.NormalModuleReplacementPlugin(/(^|\/)sensorr\.service$|^@sensorr\/plex$/, (resource) => {
          if (resource.context.startsWith(API)) {
            resource.request = resource.request === '@sensorr/plex' ? shim('empty.ts') : path.join(__dirname, 'src/demo/server/sensorr.service.ts')
          }
        })] : []),
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
