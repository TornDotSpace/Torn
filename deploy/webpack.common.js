/*
Copyright (C) 2021  torn.space (https://torn.space)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
const path = require("path");
const webpack = require("webpack");

const Git = require("git-revision-webpack-plugin");

const gitRevisionPlugin = new Git({
    lightweightTags: true
});

module.exports = {
    entry: ["./client_src/index.js"],
    output: {
        path: path.resolve("./", "client"),
        filename: "client.js"
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: "ts-loader"
                    }
                ],
                exclude: /node_modules/
            },
            {
                test: /\.jsx?$/,
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            presets: ["@babel/react", "@babel/preset-env"],
                            plugins: ["@babel/proposal-class-properties"]
                        }
                    }
                ],
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ["*", ".js", ".tsx", ".ts", ".jsx"]
    },
    devServer: {
        contentBase: "./client",
        hot: true
    },
    optimization: {
        splitChunks: {
            // chunks: "initial",
        }
    },
    plugins: [
	    new webpack.DefinePlugin({
            VERSION: JSON.stringify(gitRevisionPlugin.version()),
            COMMITHASH: JSON.stringify(gitRevisionPlugin.commithash()),
            BRANCH: JSON.stringify(gitRevisionPlugin.branch())
        })
    ]
};
