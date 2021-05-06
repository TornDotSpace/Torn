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

const { GitRevisionPlugin } = require(`git-revision-webpack-plugin`);
const Webpack = require(`webpack`);

const gitRevisionPlugin = new GitRevisionPlugin({ lightweightTags: true });
const path = require(`path`);

module.exports = {
    entry: [path.resolve(__dirname, `../client_src/index.js`)],
    output: {
        path: path.resolve(__dirname, `../client`),
        filename: `client.js`
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: `ts-loader`,
                        options: {
                            transpileOnly: true,
                            experimentalWatchApi: true
                        }
                    }
                ],
                exclude: /node_modules/
            },
            {
                test: /\.jsx?$/,
                use: [
                    {
                        loader: `babel-loader`,
                        options: {
                            presets: [`@babel/react`, `@babel/preset-env`],
                            plugins: [`@babel/proposal-class-properties`]
                        }
                    }
                ],
                exclude: /node_modules/
            }
        ]
    },

    resolve: {
        extensions: [`*`, `.js`, `.tsx`, `.ts`, `.jsx`]
    },

    devServer: {
        contentBase: `./client`,
        hot: true
    },

    optimization: {
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false
    },

    plugins: [
	    new Webpack.DefinePlugin({
            VERSION: JSON.stringify(gitRevisionPlugin.version()),
            COMMITHASH: JSON.stringify(gitRevisionPlugin.commithash()),
            BRANCH: JSON.stringify(gitRevisionPlugin.branch())
        })
    ]
};
