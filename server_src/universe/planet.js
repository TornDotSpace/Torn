module.exports = function Planet(i, name) {
	var self = {
		type: "Planet",
		name: name,
		color: "yellow",
		owner: 0, // string name of the player who owns it.
		id: i, // unique identifier
		x: sectorWidth / 2, // this is updated by the createPlanet function to a random location
		y: sectorWidth / 2,
		cooldown: 0, // to prevent chat "planet claimed" spam
		sx: 0,
		sy: 0
	}
	self.tick = function () {
		self.cooldown--;
		if (tick % 12 == 6 && self.owner != 0) for (var i in players[self.sy][self.sx]) {
			var p = players[self.sy][self.sx][i];
			if (self.owner === p.name) p.money++; // give money to owner
		}
	}
	return self;
};