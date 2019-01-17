const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const html = require('html-webpack-plugin')
const common = require('./webpack.config.js')

module.exports = merge(common, {
  mode: 'development',
  devtool: false,
  plugins: [
    new webpack.SourceMapDevToolPlugin({}),
    new html({
      template: path.join(__dirname, 'src', 'views', 'index.html'),
    }),
  ],
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    port: 8000,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    proxy: {
      '/db': 'http://localhost:5070',
      '/api': 'http://localhost:5070',
      '/proxy': 'http://localhost:5070',
      '/socket.io': 'http://localhost:5070',
    },
  },
})
