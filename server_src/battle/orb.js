module.exports = function Orb(ownr, i, weaponID) {//currently the only orb is energy disk
	var self = {
		type: "Orb",
		id: i, // unique identifier
		color: ownr.color, // owned by which team
		dmg: wepns[weaponID].damage,

		owner: ownr,
		x: ownr.x,
		y: ownr.y, // spawn where its owner is
		sx: ownr.sx,
		sy: ownr.sy,
		vx: wepns[weaponID].speed * Math.cos(ownr.angle) * 2,
		vy: wepns[weaponID].speed * Math.sin(ownr.angle) * 2,

		locked: 0, // the id of the player I'm locked on to
		timer: 0, // how long this orb has existed
		lockedTimer: 0, // timer of how long it's been locked onto a player
		wepnID: weaponID
	}
	self.tick = function () {
		if (self.timer++ > 3 * wepns[self.wepnID].range / wepns[self.wepnID].speed) self.die();
		self.move();


		// Find next target
		var closest = -1;
		if (tick % 5 == 0 && self.locked == 0) {
			//search players
			for (var i in players[self.sy][self.sx]) {
				var player = players[self.sy][self.sx][i];
				if(player.disguise>0 && self.wepnID != 42) continue;
				var dist = squaredDist(player, self);
				if ((player.color != self.color && dist < square(wepns[self.wepnID].range * 10)) && (self.locked == 0 || dist < closest)) {
					self.locked = player.id;
					closest = dist;
				}
			}
			if (self.locked != 0) return;
			
			//check base
			if (bases[self.sy][self.sx] != 0 && bases[self.sy][self.sx].color !== self.color && bases[self.sy][self.sx].turretLive && squaredDist(bases[self.sy][self.sx], self) < square(wepns[self.wepnID].range * 10)) {
				self.locked = bases[self.sy][self.sx].id;
				return;
			}
			

			//search asteroids
			for (var i in asts[self.sy][self.sx]) {
				var ast = asts[self.sy][self.sx][i];
				var dist = squaredDist(ast, self);
				if (dist < square(wepns[self.wepnID].range * 10) && (self.locked == 0 || dist < closest)) {
					self.locked = ast.id;
					closest = dist;
				}
			}
		}
	}
	self.move = function () {
		if (self.locked != 0) {
			if (self.lockedTimer++ > secs(2.5)) self.die(); // after 2.5 seconds of being locked on -> delete self

			var baseHere = bases[self.sy][self.sx];
			var target = players[self.sy][self.sx][self.locked];
			if (typeof target === 'undefined' && bases[self.sy][self.sx].color != self.color) target = bases[self.sy][self.sx];
			if (target == 0) target = asts[self.sy][self.sx][self.locked];
			if (typeof target === 'undefined') self.locked = 0;
			else { // if we are locked onto something
				if (target.type === "Player") target.isLocked = true; // tell the player they're locked on so they will get an alert message
				var dist = Math.hypot(target.x-self.x,target.y-self.y);
				if (dist < 64 && target.turretLive !== false) { // if it's a base we can't attack when it's dead. !== false works in case of non-bases
					target.dmg(self.dmg, self);
					self.die();
					return;
				}
				self.vx += wepns[weaponID].speed * (target.x - self.x) / dist; // accelerate towards target
				self.vy += wepns[weaponID].speed * (target.y - self.y) / dist;
				self.vx *= .9; // air resistance
				self.vy *= .9;
			}
		}
		if (self.locked == 0) self.lockedTimer = 0;
		self.x += self.vx;
		self.y += self.vy; // move
		if (self.x > sectorWidth || self.x < 0 || self.y > sectorWidth || self.y < 0) self.die(); // if out of bounds
	}
	self.die = function () {
		sendAllSector('sound', { file: "boom", x: self.x, y: self.y, dx: self.vx, dy: self.vy }, self.sx, self.sy);
		delete orbs[self.sy][self.sx][self.id];
	}
	return self;
};
