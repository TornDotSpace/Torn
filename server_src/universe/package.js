module.exports = function Package(ownr, i, type) {
	var self = {
		id: i, // unique identifier
		type: type, // ammo? coin? lives? actual courier package?
		x: ownr.x,
		y: ownr.y,
		sx: ownr.sx,
		sy: ownr.sy,
		time: 0, // since spawn
	}
	self.tick = function () {
		if (self.time++ > 25 * 60) { // 1 minute despawn
			sendAllSector('sound', { file: "boom", x: self.x, y: self.y, dx: 0, dy: 0 }, self.sx, self.sy);
			delete packs[self.sy][self.sx][self.id];
		}
		for (var i in players[self.sy][self.sx]) { // loop for collision
			var p = players[self.sy][self.sx][i];
			if (squaredDist(p, self) < square(16 + ships[p.ship].width)) { // someone hit me

				self.onCollide(p);

				delete packs[self.sy][self.sx][self.id]; // despawn
				break; // stop looping thru players
			}
		}
	}
	self.onCollide = function (p) {

		if (self.type == 0) {

			p.moneyAchs[8] = true; // Thief: steal a package
			p.sendAchievementsCash(true);

			var possible = ['money', 'ore'];
			var contents = possible[Math.floor(Math.random() * 2)]; // figure out what reward to give

			var amt = Math.floor(Math.random() * 2000) + 2000; // how much ore we're gonna give
			if (contents == 'ore') {
				var left = p.capacity - p.iron - p.aluminium - p.silver - p.platinum; // how much more cargo space they have
				if (amt > left) { // if they don't have enough cargo space for the ore we're about to give
					amt = left; // give them as much as they can take
					p.strongLocal("Cargo Bay Full", p.x, p.y + 256); //tell them they have no room left
				}
				amt /= 4; // give them some of each
				p.iron += amt
				p.platinum += amt;
				p.aluminium += amt;
				p.silver += amt;
			}

			else if (contents == 'money') p.spoils("money", 20000);

			var title = "Package collected: "; // the message we're going to send them
			if (contents == 'ore') title += (amt * 4) + ' ore!';
			if (contents == 'money') title += '20000 money!';
			p.strongLocal(title, p.x, p.y - 192); // send it
		}

		else if (self.type == 1) p.spoils("money", 5000); // coin
		else if (self.type == 2) p.spoils("life", 1); // floating life
		else if (self.type == 3) p.refillAllAmmo(); // ammo package

	}
	return self;
}
