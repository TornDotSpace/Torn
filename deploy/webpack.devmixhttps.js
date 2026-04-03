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
const path = require(`path`);
const fs = require(`fs`);

module.exports = merge(common, {
    mode: `development`,
    devtool: `inline-source-map`,
    optimization: {
        minimize: false
    },
    plugins: [
        new Webpack.DefinePlugin({
            // works interface-local, remember these will only work for the server itself!
            // TORN_GAMESERVER_URL: `"http://localhost:7300"`,
            // TORN_API_URL: `"http://localhost:8080"`,

            // Below a test with local IPv4 with http only, it works
            // TORN_GAMESERVER_URL: `"http://192.168.1.130:7300"`, // A test, works on the same private LAN
            // TORN_API_URL: `"http://192.168.1.130:8080"`  // A test, works on the same private LAN

            // Below a test with http over IPv6 - works on the local machine but regular machines cannot seem to find it
            // TORN_GAMESERVER_URL: `"http://[2a0c:5a82:9205:2b01:0000:0000:0000:3abb]:7300"`,
            // TORN_API_URL: `"http://[2a0c:5a82:9205:2b01:0000:0000:0000:3abb]:8080"`

            // Now IPv6 + https without DNS... it will get blocked by CORS unless apropiatedly handled
            // TORN_GAMESERVER_URL: `"https://[2a0c:5a82:9205:2b01:0000:0000:0000:3abb]:7300"`,
            // TORN_API_URL: `"https://[2a0c:5a82:9205:2b01:0000:0000:0000:3abb]:8080"`

            // TO-DO If you need to create a new domain or change the IPs, re-do the entire certificates from the ground-up if necessary!
            // I provided a certificate for torn.space CA, it is self-signed so you'll need to install it on the browser
            // *** Now this one works ***
            TORN_GAMESERVER_URL: `"https://[2a0c:5a82:9205:2b01:0000:0000:0000:3abb]:7300"`,
            // *** Now this one below works if we perform some devServer's proxying ***
            TORN_API_URL: `"https://[2a0c:5a82:9205:2b01:0000:0000:0000:3abb]:7301"`

            // This one doesn't work at the moment because of CORS over https + inner handling of that database ->
            // TORN_API_URL: `"https://[2a0c:5a82:9205:2b01:0000:0000:0000:3abb]:8080"`

            // These may also get blocked by CORS if you don't have the proper certificate. TORN_API_URL with a different port than the devServer's will definetely get CORS-red-flagged over https without DNS because of inner account configuration
            // TORN_GAMESERVER_URL: `"https://torn.space:7300"`,
            // TORN_API_URL: `"https://torn.space:8080"`

            // Now testing with production-build style... TORN_API_URL will still get blocked unless you proxy it properly.
            // TORN_GAMESERVER_URL: `"https://torn.space"`,
            // TORN_API_URL: `"https://torn.space"`
        })
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, `../client`),
            watch: {
                ignored: path.join(__dirname, `../client/leaderboard/players.json`)
            }
        },
        compress: true,
        host: `2a0c:5a82:9205:2b01:0000:0000:0000:3abb`, // "torn.space", //<- does work on https but TORN_API_URL AND TORN_GAMESERVER_URL STILL DON'T WORK... //"2a0c:5a82:9205:2b01:0000:0000:0000:3abb", //"::", <- doesn't work on IPv6 outside the local machine //'local-ip', <- works locally //"0.0.0.0",
        port: 7301,
        bonjour: true,
        allowedHosts: [`all`],
        proxy: [
            {
                context: [`/api`],
                target: `http://localhost:8080`,
                secure: false
            },
            {
                context: [`/rpc`],
                target: `http://localhost:8080`,
                secure: true
            }//,
        //      {
        //        context: ["/Torn"],
        //        target: "http://localhost:27017",
        //        secure: false
        //      },
        ],
        hot: false,
        liveReload: false,
        server: {
            type: `https`,
            options: {
                // Certificates currently for torn.space (but mostly the IPv6 version, [2a0c:5a82:9205:2b01::3043])
                // Also another certificate for [2a0c:5a82:9205:2b01::7fb4], but that one is on an encrypted zip
                // Also another certificate for [2a0c:5a82:9205:2b01:0000:0000:0000:3abb], on an encrypted zip
                key: fs.readFileSync(`test-ssl/localhost.key`),
                cert: fs.readFileSync(`test-ssl/localhost.crt`),
                ca: fs.readFileSync(`test-ssl/localhostCA.pem`)
            }
        }//,
        // client: {
        //    //webSocketTransport: "wss",
        //    webSocketURL: {
        //        hostname: "[2a0c:5a82:9205:2b01::7fb4]",
        //        pathname: "/",
        //        port: 7300,
        //        protocol: "https"
        //    }//, // Explicit WSS URL
        //    overlay: true // Show errors as overlays in the browser
        // }//,
        // webSocketServer: "wss",
        // headers: {
        //   "Access-Control-Allow-Origin": "*" //, TO-DO MAYBE CHECK CORS?
        // }//,*/
    }
});
