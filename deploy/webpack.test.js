const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
module.exports = merge(common, {
	//mode: 'development',
	// devtool: 'inline-source-map', -- disabled due to bug	
	plugins: [
		new webpack.DefinePlugin({
			TORN_GAMESERVER_URL: '"test.torn.space:8080"',
			TORN_API_URL: 		'' ///> @TODO: add API_URL for test
		}),
	]
});
