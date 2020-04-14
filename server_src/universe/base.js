var Bullet = require('../battle/bullet.js');
var Missile = require('../battle/missile.js');
var Orb = require('../battle/orb.js');
var Beam = require('../battle/beam.js');

var fs = require('fs');

module.exports = function Base(i, b, sxx, syy, col, x, y) {
	var self = {
		type: "Base",
		kills: 0,
		experience: 0,
		money: 0,
		id: i, // unique identifier
		color: col,
		owner: 0,
		name: "",
		isBase: b, // This differentiates between turrets and turrets connected to bases
		turretLive: true, // When killed, this becomes false and turret vanishes
		angle: 0, // angle of the turret

		x: x,
		y: y,
		sx: sxx,
		sy: syy,

		reload: 0, // timer for shooting
		health: baseHealth,
		maxHealth: baseHealth,
		empTimer: -1,
		speed: 0,//vs unused but there for bullets,
	}
	self.tick = function (rbNow, bbNow) {
		//spawn a bot if we need more bots
		var botSpawn = Math.random();
		if (self.isBase && botSpawn < botFrequency / square(rbNow + bbNow + 5)) {
			spawnBot(self.sx, self.sy, self.color, rbNow, bbNow);
		}

		if (!self.turretLive && (tick % (25 * 60 * 10) == 0 || (raidTimer < 15000 && tick % (25 * 150) == 0))) self.turretLive = true; // revive. TODO: add a timer

		self.move(); // aim and fire

		self.empTimer--;
		self.reload--;

		if (self.health < self.maxHealth) self.health += 1.5;
		if (tick % 50 == 0 && !self.isBase) self.tryGiveToOwner();
	}
	self.tryGiveToOwner = function () { // if a base's owner stands over it, they get the stuff it's earned from killing people

		var player = 0; // find owner
		for (var i in players[self.sy][self.sx])
			if (players[self.sy][self.sx][i].name === self.owner) {
				player = players[self.sy][self.sx][i];
				break;
			}
		if (player == 0) return;//if we couldn't find them (they aren't in the sector)

		if (squaredDist(player, self) > 40000) return;

		player.kills += self.kills;//reward them with my earnings
		player.spoils("experience", self.experience);
		if (self.money > 0) player.spoils("money", self.money);

		self.experience = self.money = self.kills = 0; // and delete my earnings
	}
	self.move = function () { // aim and fire
		if (!self.turretLive) return;

		if (self.empTimer > 0) return; // can't do anything if emp'd

		var c = 0; // nearest player
		var cDist2 = 1000000000; // min dist to player
		for (var i in players[self.sy][self.sx]) {
			var player = players[self.sy][self.sx][i];
			if (player.color == self.color) continue; // don't shoot at friendlies
			var dist2 = squaredDist(player, self);
			if (dist2 < cDist2) { c = player; cDist2 = dist2; } // update nearest player
		}

		if (c == 0) return;

		self.angle = calculateInterceptionAngle(c.x, c.y, c.vx, c.vy, self.x, self.y); // find out where to aim (since the player could be moving). TODO make the turret move smoothly

		if (self.reload < 0) {
			if (cDist2 < square(wepns[8].range * 10)) self.shootLaser();//range:60
			else if (cDist2 < square(wepns[37].range * 10)) self.shootOrb();//range:125
			else if (cDist2 < square(175 * 10)) self.shootMissile();//range:175
			else if (cDist2 < square(wepns[3].range * 10)) self.shootRifle();//range:750
		}
	}
	self.shootOrb = function () {
		self.reload = wepns[37].charge / 2;
		var r = Math.random();
		var orb = Orb(self, r, 37);
		orbs[self.sy][self.sx][r] = orb;
		sendAllSector('sound', { file: "beam", x: self.x, y: self.y }, self.sx, self.sy);
	}
	self.shootRifle = function () {
		self.reload = wepns[3].charge / 2;
		var r = Math.random();
		var bullet = Bullet(self, r, 3, self.angle, 0);
		bullets[self.sy][self.sx][r] = bullet;
		sendAllSector('sound', { file: "shot", x: self.x, y: self.y }, self.sx, self.sy);
	}
	self.shootMissile = function () {
		self.reload = wepns[10].charge;
		var r = Math.random();
		var bAngle = self.angle;
		var missile = Missile(self, r, 10, bAngle);
		missiles[self.sy][self.sx][r] = missile;
		sendAllSector('sound', { file: "missile", x: self.x, y: self.y }, self.sx, self.sy);
	}
	self.shootLaser = function () { // TODO merge this into Beam object, along with player.shootBeam()
		var nearP = 0;
		for (var i in players[self.sy][self.sx]) {
			var p = players[self.sy][self.sx][i];
			if (p.color == self.color || p.sx != self.sx || p.sy != self.sy) continue;
			if (nearP == 0) {
				nearP = p;
				continue;
			}
			var dx = p.x - self.x, dy = p.y - self.y;
			if (dx * dx + dy * dy < squaredDist(nearP, self)) nearP = p;
		}
		if (nearP == 0) return;
		var r = Math.random();
		var beam = Beam(self, r, 8, nearP, self);
		beams[self.sy][self.sx][r] = beam;
		sendAllSector('sound', { file: "beam", x: self.x, y: self.y }, self.sx, self.sy);
		self.reload = wepns[8].charge / 2;
	}
	self.die = function (b) {
		if (!self.turretLive) return;

		deleteTurret(self);
		
		self.health = self.maxHealth;
		self.turretLive = false;
		sendAllSector('sound', { file: "bigboom", x: self.x, y: self.y, dx: 0, dy: 0 }, self.sx, self.sy);

		if (!self.isBase) {
			bases[self.sy][self.sx] = 0;
			self.die = function() { };
		} else {
			var numBotsToSpawn = 2+4*Math.random()*Math.random();
			for(var i = 0; i < numBotsToSpawn; i++) spawnBot(self.sx, self.sy, self.color, 0, 0);
		}

		//If I was killed by an asteroid...
		if (b.type == 'Asteroid') {
			self.sendDeathMsg("an asteroid");
			return;
		}

		//Or a player...
		if (typeof b.owner !== "undefined" && b.owner.type === "Player") {
			self.sendDeathMsg("~`" + b.color + "~`" + b.owner.name + "~`yellow~`'s `~" + b.wepnID + "`~");
			b.owner.baseKilled();
			b.owner.spoils("experience", baseKillExp); // reward them
			b.owner.spoils("money", baseKillMoney);

			if (raidTimer < 15000) { // during a raid
				b.owner.points++; // give a point to the killer

				for (var i in players[self.sy][self.sx]) { // as well as all other players in that sector
					var p = players[self.sy][self.sx][i];
					if (p.color !== self.color) p.points++;
				}
			}
		}
	}

	self.save = function () {
		saveTurret(self);
	}
	self.sendDeathMsg = function (killedBy) {
		chatAll("The " + (self.isBase ? "base" : "turret") + " at sector ~`" + col + "~`" + self.getSectorName() + "~`yellow~` was destroyed by " + killedBy + ".");
	}
	self.getSectorName = function () {
		return String.fromCharCode(97 + sxx).toUpperCase() + "" + (syy + 1);
	}
	self.EMP = function (t) {
		self.empTimer = t;
	}

	self.onKill = function () {
		self.kills++;
	}
	self.dmg = function (d, origin) {
		self.health -= d;
		if (self.health < 0) self.die(origin);
		note('-' + d, self.x, self.y - 64, self.sx, self.sy);
		return self.health < 0;
	}
	self.spoils = function (type, amt) {
		if (type === "experience") self.experience += amt;
		if (type === "money") self.money += amt;
	}
	return self;
};
