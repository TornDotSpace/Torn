const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
module.exports = merge(common, {
	mode: 'development',
	devtool: 'inline-source-map', // -- disabled due to bug	
	optimization: {
		minimize: false
	},
	plugins: [
		new webpack.DefinePlugin({
			TORN_GAMESERVER_URL: '"localhost:7300"',
			TORN_API_URL: '"http://localhost:8080"'
		}),
	]
});
