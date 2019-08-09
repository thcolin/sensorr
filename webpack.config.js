const fs = require('fs')
const path = require('path')
const favicon = require('favicons-webpack-plugin')

try {
  fs.accessSync(path.resolve(__dirname, 'config', 'config.json'), fs.constants.R_OK)
} catch(e) {
  const fallback = require(path.resolve(__dirname, 'config.default.json'))
  fs.writeFileSync(path.resolve(__dirname, 'config', 'config.json'), JSON.stringify(fallback, null, 2))
}

module.exports = {
  entry: [
    'reset-css',
    path.resolve(__dirname, 'src', 'index.js')
  ],
  output: {
    filename: '[name].bundle.js',
    chunkFilename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        use: ['babel-loader'],
      },
      {
        test: /\.(jpe?g|png)?$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[hash].[ext]',
            outputPath: 'assets/images/',
          },
        }],
      },
      {
        test: /\.(css)?$/,
        use: ['style-loader','css-loader'],
      },
      {
        test: /\.(eot|ttf|svg|woff2?)(\?v=\d+\.\d+\.\d+)?$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[hash].[ext]',
            outputPath: 'assets/fonts/',
          },
        }],
      }
    ],
  },
  resolve: {
    modules: [
      path.resolve(__dirname, 'src'),
      'node_modules',
    ],
    alias: {
      shared: path.resolve(__dirname, 'shared'),
    }
  },
  plugins: [
    new favicon({
      logo: path.resolve(__dirname, 'src', 'ressources', 'favicon.png'),
      prefix: 'assets/favicon/'
    }),
  ],
}
