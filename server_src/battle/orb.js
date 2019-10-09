//weapon objects
function sameSector(a, b) {
	return a.sx == b.sx && a.sy == b.sy
}



module.exports = function Orb(ownr, i, weaponID) {//currently the only orb is energy disk
	var self = {
		type: "Orb",
		id: i, // unique identifier
		color: ownr.color, // owned by which team
		dmg: wepns[weaponID].Damage,

		owner: ownr,
		x: ownr.x,
		y: ownr.y, // spawn where its owner is
		sx: ownr.sx,
		sy: ownr.sy,
		vx: 2 * ownr.vx + wepns[weaponID].Speed * Math.cos(ownr.angle), // velocity is 2*owner's velocity plus this weapon's speed
		vy: 2 * ownr.vy + wepns[weaponID].Speed * Math.sin(ownr.angle),

		locked: 0, // the player I'm locked on to
		timer: 0, // how long this orb has existed
		lockedTimer: 0, // timer of how long it's been locked onto a player
		wepnID: weaponID
	}
	self.tick = function () {
		if (self.timer++ > 3 * wepns[weaponID].Range / wepns[weaponID].Speed) self.die();
		console.log("my color: " + self.color);
		console.log("target detected: " + self.locked);

		self.move();
	}
	self.move = function () {
		if (self.locked != 0 && typeof self.locked === 'number') {
			if (self.lockedTimer++ > 2.5 * 25) self.die(); // after 2.5 seconds of being locked on -> delete self
			var target = players[self.sy][self.sx][self.locked];
			if (typeof target === 'undefined' && bases[self.sy][self.sx].color != self.color) target = bases[self.sy][self.sx];
			if (target == 0) target = asts[self.sy][self.sx][self.locked];
			if (typeof target === 'undefined') self.locked = 0;
			else { // if we are locked onto something
				if (target.type === "Player") target.isLocked = true; // tell the player they're locked onto for an alert message
				var d2 = hypot2(target.x,self.x,target.y,self.y);
				if (sameSector(target, self) && d2 < 15 && target.turretLive != false) { // if it's a base we can't attack when it's dead
					target.dmg(self.dmg, self);
					self.die();
					return;
				}
				var dist = d2;
				self.vx += wepns[weaponID].Speed * (target.x - self.x) / dist; // accelerate towards target
				self.vy += wepns[weaponID].Speed * (target.y - self.y) / dist;
				//self.vx *= .9; // air resistance
				//self.vy *= .9;
			}
		}
		if (self.locked == 0) self.lockedTimer = 0;
		self.x += self.vx;
		self.y += self.vy; // move
		if (self.x > sectorWidth || self.x < 0 || self.y > sectorWidth || self.y < 0) self.die(); // if out of bounds
	}
	self.die = function () {
		sendAllSector('sound', { file: "boom2", x: self.x, y: self.y, dx: self.vx, dy: self.vy }, self.sx, self.sy);
		delete orbs[self.sy][self.sx][self.id];
	}
	return self;
};