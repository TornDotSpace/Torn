//Miscellaneous Networking
global.send = function (id, msg, data) { // send a socketio message to id
	var s = io.to(id);
	if (typeof s !== "undefined") s.emit(msg, data);
}

global.sendWeapons = function (player) { // tells a client what weapons that player has;
	if (player == 0) return;
	var worth = ships[player.ship].price * .75;
	send(player.id, 'weapons', { weapons: player.weapons, worth: worth, ammos: player.ammos });
}
global.sendAllSector = function (out, data, sx, sy) {
	io.to("" + sy + "," + sx).emit(out, data);
}

global.sendAll = function (out, data) {
	io.emit(out, data);
}

global.chatAll = function (msg) { // sends msg in the chat
	sendAll("chat", { msg: msg });
}

global.sendTeam = function (color, out, data) { // send a socket.io message to all the members of some team
	io.to("team-" + color).emit(out, data);
}

global.note = function (msg, x, y, sx, sy) { // a popup note in game that everone in the sector can see.
	sendAllSector('note', { msg: msg, x: x, y: y, local: false }, sx, sy);
}
global.noteLocal = function (msg, x, y, id) { // same as above but only id can see it.
	send(id, 'note', { msg: msg, x: x, y: y, local: true });
}

global.strong = function (msg, x, y, sx, sy) { // a bigger note
	sendAllSector('strong', { msg: msg, x: x, y: y, local: false }, sx, sy);
}

global.strongLocal = function (msg, x, y, id) { // you get the gist
	send(id, 'strong', { msg: msg, x: x, y: y, local: true });
}

global.parseBoolean = function (s) {
	return (s === 'true');
}

module.exports = function () {

};