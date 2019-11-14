var Vortex = require("../universe/vortex.js");

module.exports = function Bullet(ownr, i, weaponID, angl, info) {
	var self = {
		type: "Bullet",
		id: i, // unique identifier
		time: 0, // time since spawn
		color: ownr.color, // whose team
		dist: 0, // TRACKS distance. Doesn't control it.
		dmg: wepns[weaponID].damage,

		x: ownr.x + (weaponID == 6 ? Math.sin(angl) * 16 * info : 0), // spawn where my owner was
		y: ownr.y - (weaponID == 6 ? Math.cos(angl) * 16 * info : 0), // if minigun, move left or right based on which bullet I am
		sx: ownr.sx,
		sy: ownr.sy,
		vx: Math.cos(angl) * wepns[weaponID].speed,
		vy: Math.sin(angl) * wepns[weaponID].speed,

		owner: ownr,
		angle: angl, // has to be a parameter since not all bullets shoot straight
		info: info, // used to differentiate left and right minigun bullets
		wepnID: weaponID,
	}
	self.tick = function () {
		if (self.time++ == 0) { // if this was just spawned
			sendAllSector("newBullet", { x: self.x, y: self.y, vx: self.vx, vy: self.vy, id: self.id, angle: self.angle, wepnID: self.wepnID, color: self.color }, self.sx, self.sy);
			//self.x -= self.vx; //These were here before Alex's refactor. Not sure if they should exist.
			//self.y -= self.vy;
		}
		self.move();
		self.dist += wepns[weaponID].speed / 10;
		if (self.wepnID == 28 && self.time > 25 * 3) { // gravity bomb has 3 seconds to explode
			var base = bases[self.sy][self.sx];
			if (squaredDist(base, self) < square(1000)) return; // don't spawn too close to a base, just keep moving if too close to base and explode when out of range.
			self.dieAndMakeVortex(); // collapse into black hole
		}
		else if (self.dist > wepns[weaponID].range) self.die(); // out of range
	}
	self.move = function () {
		self.x += self.vx;
		self.y += self.vy; // move on tick
		if (self.x > sectorWidth || self.x < 0 || self.y > sectorWidth || self.y < 0) self.die();

		var b = bases[self.sy][self.sx];
		if (b != 0 && b.turretLive && b.color != self.color && squaredDist(b, self) < square(16 + 32)) {
			b.dmg(self.dmg, self);
			self.die();
		}

		for (var i in players[self.sy][self.sx]) {
			var p = players[self.sy][self.sx][i];
			if (p.color != self.color && squaredDist(p, self) < square(bulletWidth + ships[p.ship].width)) { // on collision with enemy
				if (self.wepnId == 28) { // if a grav bomb hits a player, explode into a black hole
					self.dieAndMakeVortex();
					return;
				}
				p.dmg(self.dmg, self); // damage the enemy
				self.die();//despawn this bullet
				break;
			}
		}
		if (self.time % 2 == 0 || wepns[self.wepnID].speed > 75) { // Only check for collisions once every 2 ticks, unless this weapon is really fast (in which case the bullet would skip over it)
			for (var i in asts[self.sy][self.sx]) {
				var a = asts[self.sy][self.sx][i];
				if (squaredDist(a, self) < square(bulletWidth + 64)) { // if we collide
					a.dmg(self.dmg * (self.weaponID == 0 ? 2 : 1), self); // hurt the asteroid. ternary: stock gun does double damage
					a.vx += self.vx / 256; // push the asteroid
					a.vy += self.vy / 256;
					self.die(); // delete this bullet
					break;
				}
			}
		}
	}
	self.die = function () {
		sendAllSector("delBullet", { id: self.id }, self.sx, self.sy);
		var reverse = weaponID == 2 ? -1 : 1; // for reverse gun, particles should shoot the other way
		sendAllSector('sound', { file: "boom", x: self.x, y: self.y, dx: reverse * self.vx, dy: reverse * self.vy }, self.sx, self.sy);
		delete bullets[self.sy][self.sx][self.id];
	}
	self.dieAndMakeVortex = function () {
		var r = Math.random();
		var vort = Vortex(r, self.x, self.y, self.sx, self.sy, 3000, self.owner, false); // 3000 is the size of a grav bomb vortex
		vorts[self.sy][self.sx][r] = vort;
		self.die();
	}
	return self;
};
