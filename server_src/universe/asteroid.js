function isOutOfBounds(obj) { // TODO this works but I'm not even using it anywhere. it would simplify some code if used.
	return obj.x < 0 || obj.y < 0 || obj.x >= sectorWidth || obj.y >= sectorWidth;
}

class Asteroid {
	constructor(i, h, sxx, syy, metal) {
		this.type = "Asteroid",
		this.id = i, // unique identifier
		this.x = Math.floor(Math.random() * sectorWidth),
		this.y = Math.floor(Math.random() * sectorWidth),
		this.angle = 0,
		this.health = h,
		this.maxHealth = h,
		this.sx = sxx,
		this.sy = syy,
		this.vx = 0,
		this.vy = 0,
		this.metal = metal,
		this.va = (Math.random() - .5) / 10;
	}
	tick() {
		let asteroidsHere = Object.keys(asts[this.sy][this.sx]).length;
		this.health-=asteroidsHere/200; // decay asteroids so they don't get too bunched up in any one area
		if(this.health < -50)this.die(0);
		this.move();
		if (Math.abs(this.vx) + Math.abs(this.vy) > 1.5) { // if we're moving sufficiently fast, check for collisions with players.
			for (let i in players[this.sy][this.sx]) {
				let p = players[this.sy][this.sx][i];
				if (squaredDist(p, this) < square(32 + ships[p.ship].width) / 10) { // on collision,
					p.dmg(5 * Math.hypot(p.vx - this.vx, p.vy - this.vy), this); // damage proportional to impact velocity
					sendAllSector('sound', { file: "boom", x: this.x, y: this.y, dx: 0, dy: 0 }, this.sx, this.sy);

					//bounce the player off. Same formula as used for mine impulse.
					let mult = 200 / Math.max(1, .001 + Math.hypot(p.x - this.x, p.y - this.y))
					p.vx = mult * (Math.cbrt(p.x - this.x));
					p.vy = mult * (Math.cbrt(p.y - this.y));

					p.updatePolars(); // we just modified their rectangular info.
					p.angle = p.driftAngle; // make them look in the direction they're moving.
				}
			}

			let b = bases[this.sy][this.sx];
			if (b != 0 && b.turretLive && squaredDist(this, b) < 3686.4) { // collision with base
				b.dmg(10 * Math.hypot(this.vx, this.vy), this);
				sendAllSector('sound', { file: "boom", x: this.x, y: this.y, dx: 0, dy: 0 }, this.sx, this.sy);
				this.die(b);
			}

		}
	}
	move() {
		this.angle += this.va;
		if (Math.abs(this.vx) + Math.abs(this.vy) < .5) return;
		this.vx *= .997;
		this.vy *= .997;
		this.x += this.vx;
		this.y += this.vy;
		if (isOutOfBounds(this)) this.die(0);
	}
	die(b) {
		// Bugfix for ion beam destroying multiple times
		this.die = function () { };
		createAsteroid(this.sx, this.sy);
		delete asts[this.sy][this.sx][this.id];
		if (b == 0) return;

		if (b.owner.type == "Player") {
			switch (this.metal) {
				case 0:
					b.owner.iron += this.maxHealth;
					if (b.owner.platinum + b.owner.iron + b.owner.aluminium + b.owner.silver > b.owner.capacity) { // TODO represent player.ores as an array to make this much less stupid
						b.owner.iron = b.owner.capacity - (b.owner.platinum + b.owner.aluminium + b.owner.silver);
						if (b.owner.strongLocal !== undefined) b.owner.strongLocal("Cargo Bay Full", b.owner.x, b.owner.y + 256);
					}
					break;
				case 1:
					b.owner.silver += this.maxHealth;
					if (b.owner.platinum + b.owner.iron + b.owner.aluminium + b.owner.silver > b.owner.capacity) {
						b.owner.silver = b.owner.capacity - (b.owner.platinum + b.owner.aluminium + b.owner.iron);
						if (b.owner.strongLocal !== undefined) b.owner.strongLocal("Cargo Bay Full", b.owner.x, b.owner.y + 256);
					}
					break;
				case 2:
					b.owner.aluminium += this.maxHealth;
					if (b.owner.platinum + b.owner.iron + b.owner.aluminium + b.owner.silver > b.owner.capacity) {
						b.owner.aluminium = b.owner.capacity - (b.owner.platinum + b.owner.iron + b.owner.silver);
						if (b.owner.strongLocal !== undefined) b.owner.strongLocal("Cargo Bay Full", b.owner.x, b.owner.y + 256);
					}
					break;
				default:
					b.owner.platinum += this.maxHealth;
					if (b.owner.platinum + b.owner.iron + b.owner.aluminium + b.owner.silver > b.owner.capacity) {
						b.owner.platinum = b.owner.capacity - (b.owner.iron + b.owner.aluminium + b.owner.silver);
						if (b.owner.strongLocal !== undefined) b.owner.strongLocal("Cargo Bay Full", b.owner.x, b.owner.y + 256);
					}
					break;
			}
			b.owner.onMined(this.metal);
			b.owner.spoils("ore", this.maxHealth);//just sends the message
			b.owner.noteLocal('+' + this.maxHealth + ' ore', b.owner.x, b.owner.y - 64);
		}
		let expGained = 1;
		if (b.owner.type === "Player") expGained = b.owner.rank < 10?2-b.owner.rank/5:0;
		if (b.owner.type === "Player" || b.owner.type === "Base") b.owner.spoils("experience", expGained);
		sendAllSector('sound', { file: "bigboom", x: this.x, y: this.y, dx: 0, dy: 0 }, this.sx, this.sy);
	}
	dmg(d, origin) {
		this.health -= d;
		if (this.health < 0) this.die(origin);
		note('-' + d, this.x, this.y - 64, this.sx, this.sy);
		return this.health < 0;
	}
	EMP(d) {
		//this page intentionally left blank
	}
}

module.exports = Asteroid;

global.createAsteroid = function (sx, sy) {
	let vert = (sy + 1) / (mapSz + 1);
	let hor = (sx + 1) / (mapSz + 1);
	let metal = (Math.random() < hor ? 1 : 0) + (Math.random() < vert ? 2 : 0);
	let randA = Math.random();
	let h = Math.ceil(Math.random() * 1200 + 200);
	let ast = new Asteroid(randA, h, sx, sy, metal);
	asts[ast.sy][ast.sx][randA] = ast;
}