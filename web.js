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

const HTTP = require(`http`);
const express = require(`express`);

const cors = require(`cors`);
const helmet = require(`helmet`);

const path = require(`path`);

const app = express();
const server = HTTP.createServer(app);

app.use(express.json({ limit: `5mb` }));
app.use(express.urlencoded({ limit: `5mb`, extended: true }));

app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));

app.use(`/`, express.static(path.resolve(__dirname, `client`)));

// 8443 for production, 7301 for dev.
server.listen(parseInt(process.argv[2]), () => console.log(`Webfront bound to port ${process.argv[2]}.`));
