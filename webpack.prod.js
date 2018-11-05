const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const html = require('html-webpack-plugin')
const common = require('./webpack.config.js')

module.exports = merge(common, {
  mode: 'production',
  optimization: {
    minimize: false,
  },
  plugins: [
    new html({
      template: path.join(__dirname, 'src', 'views', 'index.html'),
      config: '__WEBPACK_INJECT_CONFIG__'
    }),
  ],
  output: {
    filename: '[name].bundle.js',
    chunkFilename: '[name].bundle.js',
    path: path.join(__dirname, 'dist'),
    publicPath: '/',
  },
})
