var Beam = require('./beam.js');

module.exports = function Mine(ownr, i, weaponID) {
	var self = {
		type: "Mine",
		id: i, // unique identifier
		time: 0, // time since spawned
		color: ownr.color, // what team owns me
		dmg: wepns[weaponID].damage,
		range: wepns[weaponID].range,

		x: ownr.x,
		y: ownr.y,
		vx: Math.cos(ownr.angle)*wepns[weaponID].speed, // grenades are the only mines that move
		vy: Math.sin(ownr.angle)*wepns[weaponID].speed,
		sx: ownr.sx,
		sy: ownr.sy,

		owner: ownr,
		wepnID: weaponID,
	}
	self.tick = function () {
		if (self.time == 0 && self.wepnID < 32) self.collideWithMines(); // When the mine is created, make sure it isn't placed on top of any other mines.
		if ((self.wepnID == 33 || self.wepnID == 32) && self.time++ > 25) self.die(); // grenade and impulse mine blow up after 1 second
		if (self.time++ > 25 * 3 * 60) self.die(); // all mines die after 3 minutes

		self.move(); // not only grenade, anything EM'ed
		if (self.wepnID == 43 && self.time % 8 == 0) self.doPulse(); // pulse
		if (self.wepnID == 44 && self.time % 25 == 0) self.doHeal(); // campfire
	}
	self.move = function() {
		self.x += self.vx;
		self.y += self.vy;
	}
	self.doPulse = function(){
		if (self.time > 25 * 40) self.die(); // pulse has a shorter lifespan
		var playerFound = false;
		for (var i in players[self.sy][self.sx]) {
			var p = players[self.sy][self.sx][i];
			if (p.color !== self.color && squaredDist(p, self) < square(self.range * 10)) {
				var mult = 400 / Math.max(10, .001 + Math.hypot(p.x - self.x, p.y - self.y)); // not sure what's going on here but it works
				p.vx = mult * (Math.cbrt(p.x - self.x));
				p.vy = mult * (Math.cbrt(p.y - self.y)); // push the player
				p.updatePolars();//we edited rectangulars
				p.angle = p.driftAngle; // turn them away from the mine
				p.dmg(self.dmg, self);
				playerFound = true;
			}
		}
		if(playerFound){
			sendAllSector('sound', { file: "bigboom", x: self.x, y: self.y, dx: 0, dy: 0 }, self.sx, self.sy);
			self.time += 25*3;
		}
	}
	self.doHeal = function(){
		if (self.time > 25 * 20) self.die(); // campfire has a shorter lifespan
		var playerFound = 0;

		//check there's 2 people
		for (var i in players[self.sy][self.sx]) {
			var p = players[self.sy][self.sx][i];
			if (squaredDist(p, self) < square(self.range * 10)) playerFound++;
		}
		if (playerFound < 2) return;

		//heal them
		for (var i in players[self.sy][self.sx]) {
			var p = players[self.sy][self.sx][i];
			if (squaredDist(p, self) < square(self.range * 10)) {
				p.health=Math.min(p.health-self.dmg, p.maxHealth); // heal them

				var r = Math.random(); // Laser Mine
				var beam = Beam(self, r, self.wepnID, p, self); // m.owner is the owner, m is the origin location
				beams[self.sy][self.sx][r] = beam;
			}
		}
		sendAllSector('sound', { file: "beam", x: self.x, y: self.y }, self.sx, self.sy);
	}
	self.collideWithMines = function(){ // When the mine is created, make sure it isn't placed on top of any other mines.
		for (var m in mines[self.sy][self.sx]) {
			var mine = mines[self.sy][self.sx][m];
			if (mine.id == self.id) continue; // ofc the mine is on top of itself
			if (squaredDist(mine, self) < square(wepns[self.wepnID].range)){ // if that mine is in this mine's "attack range"
				mine.die(); // destroy both
				self.die();
				break;
			}
		}
	}
	self.die = function () {
		self.die = function() { }; // Purpose unclear, please comment
		var power = 0; // how strongly this mine pushes people away on explosion
		if (self.wepnID == 15 || self.wepnID == 33) power = 400; //mine, grenade
		else if (self.wepnID == 32) power = 2000;
		for (var i in players[self.sy][self.sx]) {
			var p = players[self.sy][self.sx][i];
			if (squaredDist(p, self) < square(1024)) {
				var mult = power / Math.max(10, .001 + Math.hypot(p.x - self.x, p.y - self.y)); // not sure what's going on here but it works
				p.vx = mult * (Math.cbrt(p.x - self.x));
				p.vy = mult * (Math.cbrt(p.y - self.y)); // push the player
				p.updatePolars();//we edited rectangulars
				p.angle = p.driftAngle; // turn them away from the mine
			}
		}
		if (self.wepnID == 33) // if i'm a grenade
			for (var i in players[self.sy][self.sx]) {
				var p = players[self.sy][self.sx][i];
				if (squaredDist(p, self) < square(self.range * 40)) p.dmg(self.dmg, self); // if i'm in range of a player on explosion, damage them
			}
		sendAllSector('sound', { file: "boom", x: self.x, y: self.y, dx: 0, dy: 0 }, self.sx, self.sy);
		delete mines[self.sy][self.sx][self.id];
	}
	return self;
};
