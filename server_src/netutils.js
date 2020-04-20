//Miscellaneous Networking
global.sendWeapons = function (player) { // tells a client what weapons that player has;
	if (player == 0) return;
	var worth = ships[player.ship].price * .75;
	player.socket.emit('weapons', { weapons: player.weapons, worth: worth, ammos: player.ammos });
}
global.sendAllSector = function (out, data, sx, sy) {
	for (var p in players[sy][sx]) {
		p = players[sy][sx][p];
		p.socket.emit(out, data);
	}
}

global.sendAll = function (out, data) {
	io.emit(out, data);
}

global.chatAll = function (msg) { // sends msg in the chat
	sendAll("chat", { msg: msg });
}

global.sendTeam = function (color, out, data) { // send a socket.io message to all the members of some team
	for (var i in sockets) {
		var player = sockets[i].player;
		if (typeof player !== "undefined" && player.color === color) sockets[i].emit(out, data);
	}
}

global.note = function (msg, x, y, sx, sy) { // a popup note in game that everone in the sector can see.
	sendAllSector('note', { msg: msg, x: x, y: y, local: false }, sx, sy);
}
global.noteLocal = function (msg, x, y, player) { // same as above but only id can see it.
	player.socket.emit('note', { msg: msg, x: x, y: y, local: true });
}

global.strong = function (msg, x, y, sx, sy) { // a bigger note
	sendAllSector('strong', { msg: msg, x: x, y: y, local: false }, sx, sy);
}

global.strongLocal = function (msg, x, y, player) { // you get the gist
	player.socket.emit('strong', { msg: msg, x: x, y: y, local: true });
}

global.parseBoolean = function (s) {
	return (s === 'true');
}

module.exports = function () {

};