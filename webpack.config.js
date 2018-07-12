/* eslint strict:0 */
var path = require('path');

('use strict');

module.exports = {
  entry: {
    flipping: './src/index',
    'flipping.web': './src/adapters/web',
    // 'flipping.gsap': './src/adapters/gsap',
    'flipping.css': './src/adapters/css'
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
