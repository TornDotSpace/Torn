const path = require("path")
const webpack = require("webpack")

module.exports = {
    entry: ["./src/index.js"],
    output: {
        path: path.resolve(__dirname, "client"),
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
}
