/* eslint strict:0 */
var path = require('path');

'use strict';

module.exports = {
  entry: {
    'flipping': './src/index',
    'flipping.web': './src/strategies/web',
    'flipping.gsap': './src/strategies/gsap',
  },
  output: {
    library: 'Flipping',
    libraryTarget: 'umd',
    filename: '[name].js',
    path: path.join(__dirname, 'dist/')
  },
  resolve: {
    extensions: ['.ts', '.js'],
    modules: ['node_modules']
  },
  module: {
    loaders: [
      { test: /\.ts$/, loader: 'ts-loader' }
    ]
  },
  devtool: 'inline-source-map',
};

