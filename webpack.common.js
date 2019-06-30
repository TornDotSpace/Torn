const path = require("path")
const webpack = require("webpack")

module.exports = {
    entry: ["./src/index.js"],
    output: {
        path: path.resolve(__dirname, "client"),
        filename: "client.js"
    },
    module: {
        loaders: [{
            test: /\.jsx?$/,
            exclude: /node_modules/,
            loader: 'react-hot-loader!babel-loader'
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