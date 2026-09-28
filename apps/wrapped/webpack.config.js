const { composePlugins, withNx } = require('@nx/webpack')
const { withReact } = require('@nx/react')

module.exports = composePlugins(
  withNx({
    outputHashing: process.env['NODE_ENV'] === 'production' ? 'all' : 'none',
    optimization: process.env['NODE_ENV'] === 'production',
    sourceMap: process.env['NODE_ENV'] !== 'production',
  }),
  withReact(),
  (config) => ({
    ...config,
    devServer: {
      ...config.devServer,
      historyApiFallback: { index: '/wrapped/index.html' },
    },
  }),
)
