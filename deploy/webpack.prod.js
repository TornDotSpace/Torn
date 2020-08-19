const {merge} = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');

module.exports = merge(common, {
  mode: 'production',
  plugins: [
    new webpack.DefinePlugin({
      TORN_GAMESERVER_URL: '"https://torn.space"',
      TORN_API_URL: '"https://torn.space"',
    }),
  ],

});
