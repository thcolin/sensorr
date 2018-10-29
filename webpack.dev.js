const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const config = require('./webpack.config.js')

module.exports = merge(config, {
  mode: 'development',
  devtool: false,
  plugins: [
    new webpack.SourceMapDevToolPlugin({}),
  ],
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    port: 8000,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
})
