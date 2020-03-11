module.exports = function Beam(ownr, i, weaponID, enemy, orign) {
	var self = {
		type: "Beam",
		id: i, // unique identifier
		dmg: wepns[weaponID].damage,
		sx: ownr.sx,
		sy: ownr.sy,
		origin: orign,
		owner: ownr,
		enemy: enemy, // person we're hitting
		wepnID: weaponID,
		time: 0, // since spawn
	}
	self.tick = function () {
		if (self.time == 0){
			var divideBy = self.enemy.ship == 17 && (self.wepnID == 30 || self.wepnID == 26) ? 2 : 1; // i think this is about mining lasers shooting elite quarrier?
			self.enemy.dmg(self.dmg / divideBy, self);
			if (enemy.type === "Asteroid") enemy.hit = false; // Note that the asteroid is hit for elite quarrier branching
			else if (self.wepnID == 35){ self.enemy.charge = -70;} // jammer
		}
		if (self.time++ > 10) delete beams[self.sy][self.sx][self.id];
	}
	return self;
};
