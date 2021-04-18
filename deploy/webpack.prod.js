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

const Webpack = require(`webpack`);

const { merge } = require(`webpack-merge`);
const common = require(`./webpack.common.js`);

module.exports = merge(common, {
    mode: `production`,
    plugins: [
        new Webpack.DefinePlugin({
            TORN_GAMESERVER_URL: `"https://torn.space"`,
            TORN_API_URL: `"https://torn.space"`
        })
    ]

});
