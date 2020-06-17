const fetch = require('node-fetch');
//Miscellaneous Networking
global.sendWeapons = function (player) { // tells a client what weapons that player has;
	if (player == 0) return;
	let worth = ships[player.ship].price * .75;
	player.emit('weapons', { weapons: player.weapons, worth: worth, ammos: player.ammos });
}

global.sendAllSector = function (out, data, sx, sy) {
	for (let p in players[sy][sx]) {
		p = players[sy][sx][p];
		p.emit(out, data);
	}
}

global.sendAllGlobal = function (out, data) {
	for (let i in sockets) {
		let p = sockets[i].player;
		if(p.globalChat == 0) p.emit(out, data);
	}
}

global.sendAll = function (out, data) {
	io.emit(out, data);
}

global.chatAll = function (msg) { // sends msg in the chat
	sendAll("chat", { msg: msg });
}

global.sendTeam = function (color, out, data) { // send a socket.io message to all the members of some team
	for (let i in sockets) {
		let player = sockets[i].player;
		if (typeof player !== "undefined" && player.color === color) sockets[i].emit(out, data);
	}
}

global.note = function (msg, x, y, sx, sy) { // a popup note in game that everone in the sector can see.
	sendAllSector('note', { msg: msg, x: x, y: y, local: false }, sx, sy);
}

global.strong = function (msg, x, y, sx, sy) { // a bigger note
	sendAllSector('strong', { msg: msg, x: x, y: y, local: false }, sx, sy);
}

global.parseBoolean = function (s) {
	return (s === 'true');
}

module.exports = function () {

};


global.playerChat = function (msg, gc, team, guild) { // chat in whatever chat room the player is in
	for (let i in sockets) {
		let player = sockets[i].player;
		if (typeof player === "undefined") continue;
		if (gc == 1 && player.color != team) continue; // they arent on the same team
		if (gc == 2 && guild != undefined && (player.guild !== guild)) continue; // they arent in the same guild
		sockets[i].emit("chat", {msg:msg, gc:gc});
	}
}

global.send_rpc = async function(endpoint, data) {
	return await fetch(Config.getValue("rpc_server", undefined) + "/rpc" + endpoint, {
		method: 'post',
		body: data,
		headers: { 'Content-Type': 'x-www-form-urlencoded'}
	});
}