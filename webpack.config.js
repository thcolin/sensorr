const path = require('path')
const dotenv = require('dotenv-webpack')

module.exports = {
  entry: ['@babel/polyfill', 'reset-css', path.resolve(__dirname, 'src', 'index.js')],
  output: {
    filename: 'assets/scripts/[name].[hash].js',
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
        use: ['file-loader'],
      },
      {
        test: /\.(css)?$/,
        use: ['style-loader','css-loader'],
      },
      {
        test: /\.(eot|ttf|svg|woff2?)(\?v=\d+\.\d+\.\d+)?$/,
        use: ['url-loader'],
      }
    ],
  },
  resolve: {
    modules: [
      path.join(__dirname, 'src'),
      'node_modules',
    ],
    alias: {
      shared: path.join(__dirname, 'shared'),
    }
  },
  plugins: [
    new dotenv(),
  ],
}
