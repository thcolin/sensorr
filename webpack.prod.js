const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const clean = require('clean-webpack-plugin')
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
    new clean([path.join(__dirname, 'dist')]),
    new html({
      template: path.join(__dirname, 'src', 'views', 'index.html'),
      config: '__WEBPACK_INJECT_CONFIG__'
    }),
  ],
})
