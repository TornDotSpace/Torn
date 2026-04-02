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

// TO-DO THIS IS A WORK IN PROGRESS - I HAD MANAGED TO MAKE IT WORK ONCE AND THEN IT BROKE :(
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
            // TORN_GAMESERVER_URL: `"http://localhost:7300"`, //works interface-local
            // TORN_API_URL: `"http://localhost:8080"`, //works interface-local
            // Below a test with local IPv4, it works TO-DO Fix this so it works, re-do the entire certificates from the ground-up if necessary!
            // TORN_GAMESERVER_URL: `"http://192.168.1.130:7300"`, // A test, works on the same private LAN
            // TORN_API_URL: `"http://192.168.1.130:8080"`  // A test, works on the same private LAN
            // TO-DO random test with private Ipv4 LAN because I lost my IPv6 nice certificates );
            // TORN_GAMESERVER_URL: `"https://192.168.1.130:7300"`, // A test, works on the same private LAN
            // TORN_API_URL: `"https://192.168.1.130:8080"`  // A test, works on the same private LAN
            // Below a test with IPv6 - works on the local machine but regular machines cannot seem to find it
            // TORN_GAMESERVER_URL: `"http://[2a0c:5a82:9205:2b01::7fb4]:7300"`,
            // TORN_API_URL: `"http://[2a0c:5a82:9205:2b01::7fb4]:8080"`
            // Now IPv6 + https... it gets blocked by CORS TO-DO
            // TORN_GAMESERVER_URL: `"https://[2a0c:5a82:9205:2b01::7fb4]:7300"`,
            // TORN_API_URL: `"https://[2a0c:5a82:9205:2b01::7fb4]:8080"`
            // Now with CORS disabled, this one works
            TORN_GAMESERVER_URL: `"https://[2a0c:5a82:9205:2b01:0000:0000:0000:7fb4]:7300"`,
            // TORN_API_URL: `"https://[2a0c:5a82:9205:2b01:0000:0000:0000:7fb4]:8080"`
            // TO-DO this one doesn't work -> TORN_API_URL: `"https://[2a0c:5a82:9205:2b01:0000:0000:0000:7fb4]:8080"`
            TORN_API_URL: `"http://localhost:8080"` // TO-DO YES, I KNOW, THIS MAKES IT ONLY VISIBLE TO THE SERVER ITSELF... BUT AT THE MOMENT CORS IS NOT BEING VERY COOPERATIVE TO-DO FIX THAT

            // This also gets blocked by CORS - wth where are my certificates which made this work????
            // TORN_GAMESERVER_URL: `"https://torn.space:7300"`,
            // TORN_API_URL: `"https://torn.space:8080"`
            // Now testing with production-build style... still gets blocked
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
        host: `2a0c:5a82:9205:2b01:0000:0000:0000:7fb4`, // "torn.space", //<- does work on https but TORN_API_URL AND TORN_GAMESERVER_URL STILL DON'T WORK... //"2a0c:5a82:9205:2b01::7fb4", //"::", <- doesn't work on IPv6 outside the local machine //'local-ip', <- works locally //"0.0.0.0",
        port: 7301,
        bonjour: true,
        allowedHosts: [`all`],
        // proxy: [ // TO-DO CHECK
        //      {
        //        context: ["/api"],
        //        target: "http://localhost:8080",
        //        secure: false
        //      },
        //      {
        //        context: [":7300"],
        //        target: "https://[2a0c:5a82:9205:2b01::7fb4]:7300",
        //        secure: true
        //      }//,
        //      {
        //        context: ["/Torn"],
        //        target: "http://localhost:27017",
        //        secure: false
        //      },
        // ],
        hot: false,
        liveReload: false,
        server: {
            type: `https`,
            options: {
                // Certificates currently for torn.space (but mostly the IPv6 version, [2a0c:5a82:9205:2b01::3043])
                // Also another certificate for [2a0c:5a82:9205:2b01::7fb4], but that one is on an encypted zip
                key: fs.readFileSync(`test-ssl/localhost.key`),
                cert: fs.readFileSync(`test-ssl/localhost.crt`),
                ca: fs.readFileSync(`test-ssl/localhostCA.pem`) // TO-DO MAYBE IT'S THIS PARAMETER
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
