module.exports = class Beam {
	constructor(ownr, i, weaponID, enemy, orign) {
		this.type = "Beam",
		this.id = i, // unique identifier
		this.dmg = wepns[weaponID].damage,
		this.sx = ownr.sx,
		this.sy = ownr.sy,
		this.origin = orign,
		this.owner = ownr,
		this.enemy = enemy, // person we're hitting
		this.wepnID = weaponID,
		this.time = 0; // since spawn
	}

	tick() {
		if (this.time == 0 && this.wepnID != 44){ // don't do this for Campfire beams
			var divideBy = this.enemy.ship == 17 && (this.wepnID == 30 || this.wepnID == 26) ? 2 : 1; // i think this is about mining lasers shooting elite quarrier?
			this.enemy.dmg(this.dmg / divideBy, this);
			if (this.enemy.type === "Asteroid") this.enemy.hit = false; // Note that the asteroid is hit for elite quarrier branching
			else if (this.wepnID == 35){ this.enemy.charge = -70;} // jammer
		}
		if (this.time++ > 10) delete beams[this.sy][this.sx][this.id];
	}
}
