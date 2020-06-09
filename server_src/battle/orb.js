module.exports = class Orb {
	constructor(ownr, i, weaponID) {//currently the only orb is energy disk
		this.type = "Orb",
		this.id = i, // unique identifier
		this.color = ownr.color, // owned by which team
		this.dmg = wepns[weaponID].damage,

		this.owner = ownr,
		this.x = ownr.x,
		this.y = ownr.y, // spawn where its owner is
		this.sx = ownr.sx,
		this.sy = ownr.sy,
		this.vx = wepns[weaponID].speed * Math.cos(ownr.angle) * 2,
		this.vy = wepns[weaponID].speed * Math.sin(ownr.angle) * 2,

		this.locked = 0, // the id of the player I'm locked on to
		this.timer = 0, // how long this orb has existed
		this.lockedTimer = 0, // timer of how long it's been locked onto a player
		this.wepnID = weaponID;
	}
	tick() {
		if (this.timer++ > 3 * wepns[this.wepnID].range / wepns[this.wepnID].speed) this.die();
		this.move();


		// Find next target
		var closest = -1;
		if (tick % 5 == 0 && this.locked == 0) {
			//search players
			for (var i in players[this.sy][this.sx]) {
				var player = players[this.sy][this.sx][i];
				if(player.disguise>0 && this.wepnID != 42) continue;
				var dist = squaredDist(player, this);
				if ((player.color != this.color && dist < square(wepns[this.wepnID].range * 10)) && (this.locked == 0 || dist < closest)) {
					this.locked = player.id;
					closest = dist;
				}
			}
			if (this.locked != 0) return;
			
			//check base
			if (bases[this.sy][this.sx] != 0 && bases[this.sy][this.sx].color !== this.color && bases[this.sy][this.sx].turretLive && squaredDist(bases[this.sy][this.sx], this) < square(wepns[this.wepnID].range * 10)) {
				this.locked = bases[this.sy][this.sx].id;
				return;
			}
			

			//search asteroids
			for (var i in asts[this.sy][this.sx]) {
				var ast = asts[this.sy][this.sx][i];
				var dist = squaredDist(ast, this);
				if (dist < square(wepns[this.wepnID].range * 10) && (this.locked == 0 || dist < closest)) {
					this.locked = ast.id;
					closest = dist;
				}
			}
		}
	}
	move() {
		if (this.locked != 0) {
			if (this.lockedTimer++ > secs(2.5)) this.die(); // after 2.5 seconds of being locked on -> delete this

			var baseHere = bases[this.sy][this.sx];
			var target = players[this.sy][this.sx][this.locked];
			if (typeof target === 'undefined' && bases[this.sy][this.sx].color != this.color) target = bases[this.sy][this.sx];
			if (target == 0) target = asts[this.sy][this.sx][this.locked];
			if (typeof target === 'undefined') this.locked = 0;
			else { // if we are locked onto something
				if (target.type === "Player") target.isLocked = true; // tell the player they're locked on so they will get an alert message
				var dist = Math.hypot(target.x-this.x,target.y-this.y);
				if (dist < 64 && target.turretLive !== false) { // if it's a base we can't attack when it's dead. !== false works in case of non-bases
					target.dmg(this.dmg, this);
					this.die();
					return;
				}
				this.vx += wepns[weaponID].speed * (target.x - this.x) / dist; // accelerate towards target
				this.vy += wepns[weaponID].speed * (target.y - this.y) / dist;
				this.vx *= .9; // air resistance
				this.vy *= .9;
			}
		}
		if (this.locked == 0) this.lockedTimer = 0;
		this.x += this.vx;
		this.y += this.vy; // move
		if (this.x > sectorWidth || this.x < 0 || this.y > sectorWidth || this.y < 0) this.die(); // if out of bounds
	}
	die() {
		sendAllSector('sound', { file: "boom", x: this.x, y: this.y, dx: this.vx, dy: this.vy }, this.sx, this.sy);
		delete orbs[this.sy][this.sx][this.id];
	}
}