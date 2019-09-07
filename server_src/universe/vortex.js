module.exports = function Vortex(i, x, y, sxx, syy, size, ownr, isWorm) {
	var self = {

		isWorm: isWorm, // am i a wormhole or black hole

		sxo: Math.floor(Math.random() * mapSz), // output node location for wormhole
		syo: Math.floor(Math.random() * mapSz),
		xo: Math.random() * sectorWidth,
		yo: Math.random() * sectorWidth,

		type: "Vortex",
		owner: ownr,
		id: i, // unique identifier

		x: x, //input node or black hole location
		y: y,
		sx: sxx,
		sy: syy,

		size: size,
	}
	self.tick = function () {

		if (tick % 2 == 0) self.move();

		if (self.owner != 0) { // if I'm a gravity bomb
			self.size -= 6; // shrink with time
			if (self.size < 0) self.die();
		}

		else self.size = 2500;
	}

	self.move = function () {
		if (self.isWorm) {

			var t = tick / 40000;

			//the doubles in here are just random numbers for chaotic motion. Don't mind them.

			//input node
			var bx = Math.sin(7.197 * t) / 2 + .5;
			var by = -Math.sin(5.019 * t) / 2 + .5;

			var oldSx = self.sx;
			var oldSy = self.sy;

			self.sx = Math.floor(bx * mapSz);
			self.sy = Math.floor(by * mapSz);

			if (oldSx != self.sx || oldSy != self.sy) {
				vorts[self.sy][self.sx][self.id] = vorts[oldSy][oldSx][self.id];
				delete vorts[oldSy][oldSx][self.id];
			}

			self.x = ((bx * mapSz) % 1) * sectorWidth;
			self.y = ((by * mapSz) % 1) * sectorWidth;

			//output node
			var bxo = -Math.sin(9.180 * t) / 2 + .5;
			var byo = Math.sin(10.3847 * t) / 2 + .5;
			self.sxo = Math.floor(bxo * mapSz);
			self.syo = Math.floor(byo * mapSz);
			self.xo = ((bxo * mapSz) % 1) * sectorWidth;
			self.yo = ((byo * mapSz) % 1) * sectorWidth;

			// every 2 seconds, tell the players where I am (for radar only, I think)
			if (tick % 50 == 0) sendAll('worm', { bx: bx, by: by, bxo: bxo, byo: byo });

		}


		for (var i in players[self.sy][self.sx]) {
			var p = players[self.sy][self.sx][i];

			// compute distance and angle to players
			var dist = Math.pow(squaredDist(self, p), 0.25);
			var a = angleBetween(p, self);
			//then move them.
			var guestMult = (p.guest || p.isNNBot) ? -1 : 1; // guests are pushed away, since they aren't allowed to leave their sector.
			p.x -= guestMult * .40 * self.size / dist * Math.cos(a);
			p.y -= guestMult * .40 * self.size / dist * Math.sin(a);

			if (dist < 15 && !self.isWorm) { // collision with black hole

				p.die(self); // i think it's important that this happens before we give them the achievements

				if (p.e) {
					p.driftAchs[8] = true; // drift into a black hole
					p.sendAchievementsDrift(true);
				}

				p.randmAchs[4] = true; // fall into a black hole
				p.sendAchievementsMisc(true);

			} else if (dist < 15 && self.isWorm) { // collision with wormhole

				p.randmAchs[3] = true; // fall into a wormhole
				p.sendAchievementsMisc(true);

				delete players[p.sy][p.sx][p.id];
				p.sx = self.sxo;
				p.sy = self.syo;
				p.y = self.yo;
				p.x = self.xo; // teleport them to the output node

				players[p.sy][p.sx][p.id] = p;

				p.planetTimer = 2501; // what is this?
			}
		}
	}
	self.die = function (b) {
		sendAllSector('sound', { file: "bigboom", x: self.x, y: self.y, dx: 0, dy: 0 }, self.sx, self.sy);
		delete vorts[self.sy][self.sx][self.id];
	}
	self.onKill = function () {
	} // do we need these functions here? :thonk: I think we might be calling em
	self.spoils = function (type, amt) {
	}
	return self;
};