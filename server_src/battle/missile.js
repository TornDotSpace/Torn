module.exports = class Missile {
	constructor(ownr, i, wepnID, angl) {
		this.type = "Missile",
		this.id = i, // unique identifier
		this.color = ownr.color, // whose side i'm on
		this.dmg = wepns[wepnID].damage,

		this.x = ownr.x,
		this.y = ownr.y,
		this.sx = ownr.sx,
		this.sy = ownr.sy,
		this.vx = Math.cos(angl) * wepns[wepnID].speed,
		this.vy = Math.sin(angl) * wepns[wepnID].speed,
		this.emvx = 0,
		this.emvy = 0,
		this.angle = angl,

		this.owner = ownr,
		this.locked = 0, // player I'm locked onto
		this.timer = 0, // since spawn
		this.lockedTimer = 0, // since locking on to my current target (or is it since first locking onto anyone?)
		this.wepnID = wepnID,
		this.goalAngle = 0; // the angle I'm turning to match
	}
	tick() {

		this.move();
		if (this.timer++ > 10 * wepns[this.wepnID].range / wepns[this.wepnID].speed) this.die(); // out of range -> die
		if (this.x > sectorWidth || this.x < 0 || this.y > sectorWidth || this.y < 0) this.die();//out of sector

		if (this.timer == 20 && this.wepnID == 13) { // missile swarm
			for (var i = 0; i < 6; i++) { // spawn 6 missiles
				var r = Math.random();
				var bAngle = this.angle + r * 2 - 1;
				var missile = new Missile(this.owner, r, 10, bAngle);
				missile.x = this.x;
				missile.y = this.y;
				missile.sx = this.sx; // this is crucial, otherwise rings of fire happen
				missile.sy = this.sy; // because owner is not necessarily in the same sector as parent missile
				missiles[this.sy][this.sx][r] = missile;
			}
			this.die(); // and then die
		}

		
		if (tick % 5 == 0 && this.locked == 0) {
			var closest = Number.MAX_SAFE_INTEGER;
			//search players
			for (var i in players[this.sy][this.sx]) {
				var player = players[this.sy][this.sx][i];
				if(player.disguise>0) continue;
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

		if (this.locked != 0)  {
			if (this.lockedTimer++ > 7 * 25) this.die(); // if locked for >7s, die

			var target = players[this.sy][this.sx][this.locked]; // try 2 find the target object
			if (typeof target === 'undefined' && bases[this.sy][this.sx].color != this.color) target = bases[this.sy][this.sx];
			if (target == 0) target = asts[this.sy][this.sx][this.locked];
			if (typeof target === 'undefined') this.locked = 0;

			else { // if we found it, then...

				if (target.type === "Player") target.isLocked = true;

				//on impact
				if (target.sx == this.sx && target.sy == this.sy && squaredDist(target, this) < 10000 * (this.wepnID == 38 ? 5 : 1) && target.turretLive != false /*we don't know it's a base. can't just say ==true.*/) {
					target.dmg(this.dmg, this);
					this.die();
					if (this.wepnID == 12 && (target.type === 'Player' || target.type === 'Base')) target.EMP(18); // emp missile
					return;
				}

				if (this.wepnID != 38) { // 38: proximity fuze
					if (this.timer == 1 || tick % 4 == 0) this.goalAngle = angleBetween(target, this);
					this.angle = findBisector(findBisector(this.goalAngle, this.angle), this.angle);// turn towards goal
				}
				this.vx = Math.cos(this.angle) * wepns[this.wepnID].speed; // update velocity
				this.vy = Math.sin(this.angle) * wepns[this.wepnID].speed;
			}
		}

		if (this.locked == 0) this.lockedTimer = 0;

		var accelMult = 1 - 25 / (this.timer + 25); // pick up speed w/ time
		this.x += this.vx * accelMult + this.emvx;
		this.y += this.vy * accelMult + this.emvy; // move on tick
		this.emvx *= .95;
		this.emvy *= .95;

	}
	die() {
		sendAllSector('sound', { file: "boom", x: this.x, y: this.y, dx: this.vx, dy: this.vy }, this.sx, this.sy);
		delete missiles[this.sy][this.sx][this.id];
	}
}
