/* eslint strict:0 */
var path = require('path');

'use strict';

module.exports = {
  entry: {
    'flipping': './src/index',
    'flipping.web': './src/web',
    'flipping.animationFrame': './src/animationFrame',
  },
  output: {
    library: 'Flipping',
    libraryTarget: 'umd',
    filename: '[name].js',
    path: path.join(__dirname, 'dist/')
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    modules: ['node_modules']
  },
  module: {
    loaders: [
      { test: /\.tsx?$/, loader: 'awesome-typescript-loader' }
    ]
  }
};

