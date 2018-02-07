/* eslint strict:0 */
var path = require('path');

('use strict');

module.exports = {
  entry: {
    flipping: './lib/index',
    'flipping.web': './lib/adapters/web',
    'flipping.gsap': './lib/adapters/gsap'
  },
  output: {
    library: 'Flipping',
    libraryTarget: 'umd',
    filename: '[name].js',
    path: path.join(__dirname, 'dist/')
  },
  resolve: {
    extensions: ['.ts', '.js'],
    modules: ['node_modules'],
    alias: {
      mitt: path.resolve(__dirname, './node_modules/mitt/dist/mitt.umd.js')
    }
  },
  module: {
    loaders: [{ test: /\.ts$/, loader: 'ts-loader' }]
  },
  devtool: 'inline-source-map'
};
