const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
module.exports = merge(common, {
	mode: 'development',
	// devtool: 'inline-source-map', -- disabled due to bug	
	plugins: [
		new webpack.DefinePlugin({
			GAMESERVER_URL: "localhost:7300",
		}),
	]
});
