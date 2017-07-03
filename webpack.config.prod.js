/* eslint strict:0 */
'use strict';

var path = require('path');

const webpack = require('webpack');
const baseConfig = require('./webpack.config');

const config = Object.create(baseConfig);

config.plugins = (config.plugins || []).concat([
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify('production'),
  }),
  new webpack.optimize.UglifyJsPlugin({
    compressor: {
      screw_ie8: true,
      warnings: false,
    },
    output: {
      comments: false
    }
  }),
]);

module.exports = config;
