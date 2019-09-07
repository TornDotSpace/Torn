function isOutOfBounds(obj) { // TODO this works but I'm not even using it anywhere. it would simplify some code if used.
	return obj.x < 0 || obj.y < 0 || obj.x >= sectorWidth || obj.y >= sectorWidth;
}

module.exports = function Asteroid(i, h, sxx, syy, metal) {
	var self = {
		type: "Asteroid",
		id: i, // unique identifier
		x: Math.floor(Math.random() * sectorWidth),
		y: Math.floor(Math.random() * sectorWidth),
		angle: 0,
		health: h,
		maxHealth: h,
		sx: sxx,
		sy: syy,
		vx: 0,
		vy: 0,
		metal: metal,
		va: (Math.random() - .5) / 10
	}
	self.tick = function () {
		if (Math.random() < .0001) self.die(0);
		self.move();
		if (Math.abs(self.vx) + Math.abs(self.vy) > 1.5) { // if we're moving sufficiently fast, check for collisions with players.
			for (var i in players[self.sy][self.sx]) {
				var p = players[self.sy][self.sx][i];
				if (squaredDist(p, self) < square(32 + ships[p.ship].width) / 10) { // on collision,
					p.dmg(5 * Math.hypot(p.vx - self.vx, p.vy - self.vy), self); // damage proportional to impact velocity
					sendAllSector('sound', { file: "boom2", x: self.x, y: self.y, dx: 0, dy: 0 }, self.sx, self.sy);

					//bounce the player off. Same formula as used for mine impulse.
					var mult = 200 / Math.max(1, .001 + Math.hypot(p.x - self.x, p.y - self.y))
					p.vx = mult * (Math.cbrt(p.x - self.x));
					p.vy = mult * (Math.cbrt(p.y - self.y));

					p.updatePolars(); // we just modified their rectangular info.
					p.angle = p.driftAngle; // make them look in the direction they're moving.
				}
			}

			var b = bases[self.sy][self.sx];
			if (b != 0 && b.turretLive && squaredDist(self, b) < 3686.4) { // collision with base
				b.dmg(10 * Math.hypot(self.vx, self.vy), self);
				sendAllSector('sound', { file: "boom2", x: self.x, y: self.y, dx: 0, dy: 0 }, self.sx, self.sy);
				self.die(b);
			}

		}
	}
	self.move = function () {
		self.angle += self.va;
		if (Math.abs(self.vx) + Math.abs(self.vy) < .5) return;
		self.vx *= .997;
		self.vy *= .997;
		self.x += self.vx;
		self.y += self.vy;
		if (isOutOfBounds(self)) self.die(0);
	}
	self.die = function (b) {
		// Bugfix for ion beam destroying multiple times
		self.die = function () { };
		createAsteroid();
		delete asts[self.sy][self.sx][self.id];
		if (b == 0) return;

		switch (metal) {
			case 0:
				b.owner.iron += self.maxHealth;
				if (b.owner.platinum + b.owner.iron + b.owner.aluminium + b.owner.silver > b.owner.capacity) {
					b.owner.iron = b.owner.capacity - (b.owner.platinum + b.owner.aluminium + b.owner.silver);
					strongLocal("Cargo Bay Full", b.owner.x, b.owner.y + 256, b.owner.id);
				}
				break;
			case 1:
				b.owner.silver += self.maxHealth;
				if (b.owner.platinum + b.owner.iron + b.owner.aluminium + b.owner.silver > b.owner.capacity) {
					b.owner.silver = b.owner.capacity - (b.owner.platinum + b.owner.aluminium + b.owner.iron);
					strongLocal("Cargo Bay Full", b.owner.x, b.owner.y + 256, b.owner.id);
				}
				break;
			case 2:
				b.owner.aluminium += self.maxHealth;
				if (b.owner.platinum + b.owner.iron + b.owner.aluminium + b.owner.silver > b.owner.capacity) {
					b.owner.aluminium = b.owner.capacity - (b.owner.platinum + b.owner.iron + b.owner.silver);
					strongLocal("Cargo Bay Full", b.owner.x, b.owner.y + 256, b.owner.id);
				}
				break;
			default:
				b.owner.platinum += self.maxHealth;
				if (b.owner.platinum + b.owner.iron + b.owner.aluminium + b.owner.silver > b.owner.capacity) {
					b.owner.platinum = b.owner.capacity - (b.owner.iron + b.owner.aluminium + b.owner.silver);
					strongLocal("Cargo Bay Full", b.owner.x, b.owner.y + 256, b.owner.id);
				}
				break;
		}
		if (b.owner.type == "Player") {
			b.owner.onMined(self.metal);
			b.owner.spoils("ore", self.maxHealth);//just sends the message
		}
		noteLocal('+' + self.maxHealth + ' ore', b.owner.x, b.owner.y - 64, b.owner.id);
		var expGained = 1;
		if (b.owner.type === "Player" && b.owner.rank > 5) expGained = (Math.random() * 5 > b.owner.rank - 5) ? 1 : 0;
		if (b.owner.type === "Player" || b.owner.type === "Base") b.owner.spoils("experience", expGained);
		sendAllSector('sound', { file: "bigboom", x: self.x, y: self.y, dx: 0, dy: 0 }, self.sx, self.sy);
	}
	self.dmg = function (d, origin) {
		self.health -= d;
		if (self.health < 0) self.die(origin);
		note('-' + d, self.x, self.y - 64, self.sx, self.sy);
		return self.health < 0;
	}
	self.EMP = function (d) {
		//this page intentionally left blank
	}
	return self;
};
