/* eslint strict:0 */
var path = require('path');

'use strict';

module.exports = {
  entry: path.join(__dirname, './src/index'),
  output: {
    library: 'Flipping',
    libraryTarget: 'umd',
    filename: 'dist/flipping.min.js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    loaders: [
      { test: /\.tsx?$/, loader: 'ts-loader' }
    ]
  }
}

