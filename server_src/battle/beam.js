module.exports = function Beam(ownr, i, weaponID, enemy, orign) {
	var self = {
		type: "Beam",
		id: i, // unique identifier
		dmg: weaponID == 400 ? wepns[16].Damage : wepns[weaponID].Damage,
		sx: ownr.sx,
		sy: ownr.sy,
		origin: orign,
		owner: ownr,
		enemy: enemy, // person we're hitting
		wepnID: weaponID,
		time: 0, // since spawn
	}
	self.tick = function () {
		if (self.time++ > 10) {
			var divideBy = self.enemy.ship == 17 && (self.wepnID == 30 || self.wepnID == 26) ? 2 : 1; // i think this is about mining lasers shooting elite quarrier?
			self.enemy.dmg(self.dmg / divideBy, self.wepnID == 400 ? self.owner : self);
			if (enemy.type === "Asteroid") enemy.hit = false; // idk what this is
			else if (self.wepnID == 34) { // energy leech
				self.enemy.energy += wepns[self.wepnID].energy;
				self.owner.energy -= wepns[self.wepnID].energy;
			}
			delete beams[self.sy][self.sx][self.id];
		}
	}
	return self;
};