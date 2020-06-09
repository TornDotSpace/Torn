var Bullet = require('../battle/bullet.js');
var Missile = require('../battle/missile.js');
var Blast = require('../battle/blast.js');
var Orb = require('../battle/orb.js');
var Beam = require('../battle/beam.js');

var fs = require('fs');

module.exports = class Base {
	constructor(i, b, sx, syy, col, x, y, m) {
		this.type = "Base",
		this.kills = 0,
		this.experience = 0,
		this.money = 0,
		this.id = i, // unique identifier
		this.color = col,
		this.owner = 0,
		this.name = "",
		this.isBase = b, // This differentiates between turrets and turrets connected to bases
		this.isMini = m, // This differentiates between mini turrets and normal turrets
		this.turretLive = true, // When killed, this becomes false and turret vanishes
		this.angle = 0, // angle of the turret

		this.x = x,
		this.y = y,
		this.sx = sx,
		this.sy = syy,

		this.reload = 0, // timer for shooting
		this.health = (m?.5:1)*baseHealth,
		this.maxHealth = (m?.5:1)*baseHealth,
		this.empTimer = -1,
		this.speed = 0; //vs unused but there for bullets,
	}
	tick() {
		//spawn a bot if we need more bots
		if(!this.isMini){
			var botSpawn = Math.random();
			var healthPercent = Math.max(this.health/this.maxHealth,.1);
			if (botSpawn*healthPercent < botFrequency)
				spawnBot(this.sx, this.sy, this.color, healthPercent < .9);
		}

		if (!this.turretLive && (tick % (25 * 60 * 10) == 0 || (raidTimer < 15000 && tick % (25 * 150) == 0))) this.turretLive = true; // revive. TODO: add a timer

		this.move(); // aim and fire

		this.empTimer--;
		this.reload--;

		if (this.health < this.maxHealth) this.health += 2;
		if (tick % 50 == 0 && !this.isBase) this.tryGiveToOwner();
	}
	tryGiveToOwner() { // if a base's owner stands over it, they get the stuff it's earned from killing people

		var player = 0; // find owner
		for (var i in players[this.sy][this.sx])
			if (players[this.sy][this.sx][i].name === this.owner) {
				player = players[this.sy][this.sx][i];
				break;
			}
		if (player == 0) return;//if we couldn't find them (they aren't in the sector)

		if (squaredDist(player, this) > 40000) return;

		player.kills += this.kills;//reward them with my earnings
		player.spoils("experience", this.experience);
		if (this.money > 0) player.spoils("money", this.money);

		this.experience = this.money = this.kills = 0; // and delete my earnings
	}
	move() { // aim and fire
		if (!this.turretLive) return;

		if (this.empTimer > 0) return; // can't do anything if emp'd

		if(this.isMini)this.fireMini();
		else this.fire();
	}
	fire() {
		var c = 0; // nearest player
		var cDist2 = 1000000000; // min dist to player
		for (var i in players[this.sy][this.sx]) {
			var player = players[this.sy][this.sx][i];
			if (player.color == this.color || player.disguise > 0) continue; // don't shoot at friendlies
			var dist2 = squaredDist(player, this);
			if (dist2 < cDist2) { c = player; cDist2 = dist2; } // update nearest player
		}

		if (c == 0) return;

		var shouldMuon = this.reload < 0 && Math.random()<.015;
		var newAngle = calculateInterceptionAngle(c.x, c.y, c.vx, c.vy, this.x, this.y, shouldMuon?10000:wepns[3].speed);
		this.angle = (this.angle+newAngle*2)/3;

		if (this.reload < 0) {
			if (cDist2 < square(wepns[3].range * 10) && shouldMuon) {this.shootMuon(); return;}
			if (cDist2 < square(wepns[8].range * 10)) this.shootLaser();//range:60
			else if (cDist2 < square(wepns[37].range * 10)) this.shootOrb();//range:125
			else if (cDist2 < square(175 * 10)) this.shootMissile();//range:175
			else if (cDist2 < square(wepns[3].range * 10)) this.shootRifle();//range:750
		}
	}
	fireMini() {
		var c = 0; // nearest player
		var cDist2 = 1000000000; // min dist to player
		for (var i in players[this.sy][this.sx]) {
			var player = players[this.sy][this.sx][i];
			if (player.color == this.color || player.disguise > 0) continue; // don't shoot at friendlies
			var dist2 = squaredDist(player, this);
			if (dist2 < cDist2) { c = player; cDist2 = dist2; } // update nearest player
		}

		if (c == 0) return;

		var newAngle = calculateInterceptionAngle(c.x, c.y, c.vx, c.vy, this.x, this.y, wepns[5].speed);
		this.angle = (this.angle+newAngle*2)/3;

		if (this.reload < 0) {
			if (cDist2 < square(wepns[5].range * 10)) this.shootMachineGun();//range:???
		}
	}
	shootOrb() {
		this.reload = wepns[37].charge / 2;
		var r = Math.random();
		var orb = new Orb(this, r, 37);
		orbs[this.sy][this.sx][r] = orb;
		sendAllSector('sound', { file: "beam", x: this.x, y: this.y }, this.sx, this.sy);
	}
	shootMuon() {
		this.reload = wepns[34].charge / 2;
		var r = Math.random();
		var blast = new Blast(this, r, 34);
		blasts[this.sy][this.sx][r] = blast;
		sendAllSector('sound', { file: "beam", x: this.x, y: this.y }, this.sx, this.sy);
	}
	shootRifle() {
		this.reload = wepns[3].charge / 2;
		var r = Math.random();
		var bullet = new Bullet(this, r, 3, this.angle, 0);
		bullets[this.sy][this.sx][r] = bullet;
		sendAllSector('sound', { file: "shot", x: this.x, y: this.y }, this.sx, this.sy);
	}
	shootMachineGun() {
		this.reload = wepns[5].charge/2;
		var r = Math.random();
		var bullet = new Bullet(this, r, 5, this.angle, 0);
		bullets[this.sy][this.sx][r] = bullet;
		sendAllSector('sound', { file: "shot", x: this.x, y: this.y }, this.sx, this.sy);
	}
	shootMissile() {//this is a torpedo
		this.reload = wepns[14].charge/2;
		var r = Math.random();
		var bAngle = this.angle;
		var missile = new Missile(this, r, 14, bAngle);
		missiles[this.sy][this.sx][r] = missile;
		sendAllSector('sound', { file: "missile", x: this.x, y: this.y }, this.sx, this.sy);
	}
	shootLaser () { // TODO merge this into Beam object, along with player.shootBeam()
		var nearP = 0;
		for (var i in players[this.sy][this.sx]) {
			var p = players[this.sy][this.sx][i];
			if (p.color == this.color || p.sx != this.sx || p.sy != this.sy) continue;
			if (nearP == 0) {
				nearP = p;
				continue;
			}
			var dx = p.x - this.x, dy = p.y - this.y;
			if (dx * dx + dy * dy < squaredDist(nearP, this)) nearP = p;
		}
		if (nearP == 0) return;
		var r = Math.random();
		var beam = new Beam(this, r, 8, nearP, this);
		beams[this.sy][this.sx][r] = beam;
		sendAllSector('sound', { file: "beam", x: this.x, y: this.y }, this.sx, this.sy);
		this.reload = wepns[8].charge / 2;
	}
	die (b) {
		if (!this.turretLive) return;

		deleteTurret(this);
		
		this.health = this.maxHealth;
		this.turretLive = false;
		sendAllSector('sound', { file: "bigboom", x: this.x, y: this.y, dx: 0, dy: 0 }, this.sx, this.sy);

		if (!this.isBase) {
			bases[this.sy][this.sx] = 0;
			this.die = function() { };
		} else {
			var numBotsToSpawn = 2+4*Math.random()*Math.random();
			for(var i = 0; i < numBotsToSpawn; i++) spawnBot(this.sx, this.sy, this.color, true);
		}

		//If I was killed by an asteroid...
		if (b.type == 'Asteroid') {
			this.sendDeathMsg("an asteroid");
			return;
		}

		//Or a player...
		if (typeof b.owner !== "undefined" && b.owner.type === "Player") {
			this.sendDeathMsg(b.owner.nameWithColor() + "'s `~" + b.wepnID + "`~");
			b.owner.baseKilled();
			var multiplier = this.isMini?.4:this.sy;
			var numInRange = 0;
			for (var i in players[this.sy][this.sx]) { // Count all players in range
				var p = players[this.sy][this.sx][i];
				if (squaredDist(p, this) < square(baseClaimRange) && p.color === b.owner.color) numInRange++;
			}
			multiplier/=numInRange;
			for (var i in players[this.sy][this.sx]) { // Reward appropriately
				var p = players[this.sy][this.sx][i];
				if (squaredDist(p, this) < square(baseClaimRange) && p.color === b.owner.color) {
					p.spoils("experience", baseKillExp*multiplier); // reward them
					p.spoils("money", baseKillMoney*multiplier);
				}
			}

			if (raidTimer < 15000 && !this.isMini) { // during a raid
				b.owner.points++; // give a point to the killer

				for (var i in players[this.sy][this.sx]) { // as well as all other players in that sector
					var p = players[this.sy][this.sx][i];
					if (p.color !== this.color) p.points+=2;
				}
			}
		}
	}

	save() {
		saveTurret(this);
	}
	sendDeathMsg(killedBy) {
		chatAll("The " + (this.isBase ? "base" : (this.isMini?"Sentry":"Turret")) + " at sector " + this.nameWithColor() + " was destroyed by " + killedBy + ".");
	}
	getSectorName() {
		return String.fromCharCode(97 + this.sx).toUpperCase() + "" + (this.sy + 1);
	}
	EMP(t) {
		this.empTimer = t;
	}

	onKill() {
		this.kills++;
	}
	dmg(d, origin) {
		this.health -= d;
		if (this.health < 0) this.die(origin);
		note('-' + d, this.x, this.y - 64, this.sx, this.sy);
		return this.health < 0;
	}
	spoils(type, amt) {
		if (type === "experience") this.experience += amt;
		if (type === "money") this.money += amt;
	}
	nameWithColor(){ // returns something like "~`green~`B6~`yellow~`"
		return "~`"+this.color+"~`"+this.getSectorName()+"~`yellow~`";
	}
}