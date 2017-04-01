/* eslint strict:0 */
var path = require('path');

'use strict';

module.exports = {
  entry: {
    'flipping': './src/index',
    'flipping.web': './src/web'
  },
  output: {
    library: 'Flipping',
    libraryTarget: 'umd',
    filename: '[name].js',
    path: 'dist/'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    loaders: [
      { test: /\.tsx?$/, loader: 'ts-loader' }
    ]
  }
};

