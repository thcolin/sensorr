const path = require('path')
const merge = require('webpack-merge')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const clean = CleanWebpackPlugin
const html = require('html-webpack-plugin')
const common = require('./webpack.config.js')

module.exports = merge(common, {
  mode: 'production',
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
  plugins: [
    new clean(),
    new html({
      template: path.join(__dirname, 'src', 'views', 'index.html'),
      config: '__WEBPACK_INJECT_CONFIG__'
    }),
  ],
})
