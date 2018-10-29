const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const config = require('./webpack.config.js')

module.exports = merge(config, {
  mode: 'production',
  optimization: {
    minimize: false,
  },
  output: {
    filename: '[name].bundle.js',
    chunkFilename: '[name].bundle.js',
    path: path.join(__dirname, 'dist'),
    publicPath: '/',
  },
})
