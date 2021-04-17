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

const fetch = require("node-fetch");
// Miscellaneous Networking
global.sendWeapons = function (player) { // tells a client what weapons that player has;
    if (player === 0) return;
    const worth = ships[player.ship].price * 0.75;
    player.emit("weapons", { weapons: player.weapons, worth: worth, ammos: player.ammos });
};

global.modmute = function (msg) {
    if (msg.split(" ").length !== 3) {
        return "Bad syntax! The message should look like '/modmute playernamewithouttag minutes'";
    } // split looks like {"/mute", "name", "minutesToMute"}
    const name = msg.split(" ")[1];
    const player = getPlayerFromName(name);
    if (player === -1) {
        return `Player '${name}' not found.`;
    }
    const minutes = parseFloat(msg.split(" ")[2]);
    if (typeof minutes !== "number") return;

    if (minutes < 0) return;

    muteTable[player.name] = (Date.now() + (minutes * 60 * 1000));
    chatAll(`~\`violet~\`${player.name}~\`yellow~\` has been muted for ${minutes} minutes!`);
    return `${player.name} has been muted for ${minutes} minutes!`;
};

global.ipmute = function (msg) {
    if (msg.split(" ").length !== 3) {
        return "Bad syntax! The message should look like '/ipmute playernamewithouttag minutes'";
    } // split looks like {"/mute", "name", "minutesToMute"}
    const name = msg.split(" ")[1];
    const player = getPlayerFromName(name);
    if (player === -1) {
        return `Player '${name}' not found.`;
    }
    const minutes = parseFloat(msg.split(" ")[2]);
    if (typeof minutes !== "number") return;

    if (minutes < 0) return;

    ipMuteTable[player.ip] = (Date.now() + (minutes * 60 * 1000));
    chatAll(`~\`violet~\`${player.name}~\`yellow~\` has been IP-muted for ${minutes} minutes!`);
    return `${player.name} has been IP-muted for ${minutes} minutes!`;
};

global.sendAllSector = function (out, data, sx, sy) {
    for (let p in players[sy][sx]) {
        p = players[sy][sx][p];
        p.emit(out, data);
    }
};

global.sendAllGlobal = function (out, data) {
    for (const i in sockets) {
        const p = sockets[i].player;
        if (p.globalChat === 0) p.emit(out, data);
    }
};

global.sendAll = function (out, data) {
    io.emit(out, data);
};

global.chatAll = function (msg) { // sends msg in the chat
    sendAll("chat", { msg: msg });
};

global.sendTeam = function (color, out, data) { // send a socket.io message to all the members of some team
    for (const i in sockets) {
        const player = sockets[i].player;
        if (typeof player !== "undefined" && player.color === color) sockets[i].emit(out, data);
    }
};

global.note = function (msg, x, y, sx, sy) { // a popup note in game that everone in the sector can see.
    sendAllSector("note", { msg: msg, x: x, y: y, local: false }, sx, sy);
};

global.strong = function (msg, x, y, sx, sy) { // a bigger note
    sendAllSector("strong", { msg: msg, x: x, y: y, local: false }, sx, sy);
};

global.parseBoolean = function (s) {
    return (s === "true");
};

module.exports = function () {

};

global.playerChat = function (msg, gc, team, guild) { // chat in whatever chat room the player is in
    for (const i in sockets) {
        const player = sockets[i].player;
        if (typeof player === "undefined") continue;
        if (gc === 1 && player.color !== team) continue; // they arent on the same team
        if (gc === 2 && guild !== undefined && (player.guild !== guild)) continue; // they arent in the same guild
        sockets[i].emit("chat", { msg: msg, gc: gc });
    }
};

global.send_rpc = async function (endpoint, data) {
    return await fetch(`${Config.getValue("rpc_server", undefined)}/rpc${endpoint}`, {
        method: "post",
        body: data,
        headers: { "Content-Type": "x-www-form-urlencoded" }
    });
};
