const path = require("path")
const webpack = require("webpack")

const git = require('git-revision-webpack-plugin');
var gitRevisionPlugin = new git({
	lightweightTags: true
	});

module.exports = {
    entry: ["./client_src/index.js"],
    output: {
        path: path.resolve("./", "client"),
        filename: "client.js"
    },
    module: {
        rules: [{
            test: /\.jsx?$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
	    query: {
		presets: ['@babel/react', '@babel/preset-env'],
		plugins: ['@babel/proposal-class-properties']
	    }
        }]
    },
    resolve: {
        extensions: ['*', '.js', '.jsx']
    },
    devServer: {
        contentBase: './client',
        hot: true
    },
    optimization: {
        splitChunks: {
          chunks: "initial",
        },
    },
    plugins: [
	    new webpack.DefinePlugin({
      VERSION: JSON.stringify(gitRevisionPlugin.version()),
      COMMITHASH: JSON.stringify(gitRevisionPlugin.commithash()),
      BRANCH: JSON.stringify(gitRevisionPlugin.branch())
    })
   ]
}
