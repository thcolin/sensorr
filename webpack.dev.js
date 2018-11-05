const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const html = require('html-webpack-plugin')
const common = require('./webpack.config.js')
const config = require('./config.json')

module.exports = merge(common, {
  mode: 'development',
  devtool: false,
  plugins: [
    new webpack.SourceMapDevToolPlugin({}),
    new html({
      template: path.join(__dirname, 'src', 'views', 'index.html'),
      config,
    }),
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
