var Blast = require('./battle/blast.js');
var Bullet = require('./battle/bullet.js');
var Asteroid = require("./universe/asteroid.js");
var Missile = require("./battle/missile.js");
var Base = require('./universe/base.js');
var Orb = require('./battle/orb.js');
var Mine = require('./battle/mine.js');
var Beam = require('./battle/beam.js');

class Player {
	constructor(id) {
		this._id = "",
		this.type = "Player",

		this.name = "ERR0",
		this.id = id, // unique identifier
		this.trail = 0,
		this.color = id > .5 ? 'red' : 'blue',
		this.ship = 0,
		this.experience = 0,
		this.rank = 0,

		this.guest = false,
		this.dead = false,
		this.docked = false,

		//misc timers
		this.noDrift = 50, // A timer used for decelerating angular momentum
		this.jukeTimer = 0,
		this.hyperdriveTimer = -1,
		this.borderJumpTimer = 0, // for deciding whether to hurt the player
		this.planetTimer = 0,
		this.leaveBaseShield = 0,
		this.empTimer = -1,
		this.disguise = -1,
		this.timer = 0,
		this.gyroTimer = 0,
		this.charge = 0,

		this.weapons = {}, // my equipped weapons and ammo counts
		this.ammos = {},
		this.bulletQueue = 0, // For submachinegun (5 bullet bursts)

		this.sx = 0, // sector
		this.sy = 0,
		this.x = sectorWidth / 2,
		this.y = sectorWidth / 2,
		this.vx = 0,
		this.vy = 0,
		this.cva = 0,
		this.angle = 0,
		this.speed = 0,
		this.driftAngle = 0,

		this.money = 8000,
		this.kills = 0,
		this.killStreakTimer = -1,
		this.killStreak = 0,
		this.baseKills = 0,

		this.shield = false,
		this.generators = 0,
		this.isLocked = false,
		this.lives = 20,
		this.quest = 0,
		this.health = 1,

		this.iron = 0,
		this.silver = 0,
		this.platinum = 0,
		this.aluminium = 0,

		//bot stuff
		this.net = 0, // where the neural network is stored
		this.isBot = false,
		this.isNNBot = false,

		/* please don't touch these
		nearestEnemyDist = 0,//for nnBots
		nearestFriendDist = 0,
		nearestBulletDist = 0,
		nearestEnemyAngle = 0,
		nearestFriendAngle = 0,
		nearestBulletAngle = 0,
		nearestEnemyDistV = 0,//velocities
		nearestFriendDistV = 0,
		nearestBulletDistV = 0,
		nearestEnemyAngleV = 0,
		nearestFriendAngleV = 0,
		nearestBulletAngleV = 0,
		*/

		this.thrust = 1, // These are techs multiplied by ship stats, used for actual physics
		this.va = 1,
		this.capacity = 1,
		this.maxHealth = 2,

		this.thrust2 = 1, // these just track the player tech levels
		this.radar2 = 1,
		this.agility2 = 1,
		this.capacity2 = 1,
		this.maxHealth2 = 1,
		this.energy2 = 1,

		this.w = false, // what keys are pressed currently
		this.s = false,
		this.a = false,
		this.d = false,
		this.e = false,
		this.c = false,
		this.space = false,

		this.killsAchs = {}, // 13 of em
		this.moneyAchs = {}, // 12
		this.driftAchs = {}, // 12
		this.randmAchs = {}, // 12

		//various achievement stuff
		this.driftTimer = 0, // How many ticks this account has been drifting.
		this.cornersTouched = 0, // bitmask
		this.oresMined = 0, // bitmask
		this.questsDone = 0, // bitmask
		this.planetsClaimed = "0000000000000000000000000000000000000000000000000",
		this.points = 0,

		this.equipped = 0;
	}

	tick() {

		//timer business
		if (this.killStreakTimer-- < 0) this.killStreak = 0; // EDIT AT YOUR PERIL. Sensitive to off-by-ones.
		if (this.borderJumpTimer > 0) this.borderJumpTimer--;
		this.superchargerTimer--;
		this.empTimer--;
		this.disguise--;

		var amDrifting = this.e || this.gyroTimer > 0;
		this.shield = (this.s && !amDrifting && this.gyroTimer < 1) || this.leaveBaseShield > 0;
		if(this.disguise>0 || (this.shield && this.weapons[this.equipped]>0 && wepns[this.weapons[this.equipped]].type !== "Misc" && wepns[this.weapons[this.equipped]].type !== "Mine" && this.space))this.charge=Math.min(this.charge,0);
		this.leaveBaseShield--;

		if (!this.isBot) {
			this.checkPlanetCollision();
			if (tick % 50 == 0 && planets[this.sy][this.sx].color === this.color && !this.guest) this.money++; // Earn $.5/sec for being in a sector w/ your color planet
		}

		this.move();
		if (this.health < this.maxHealth && !this.shield) this.health += playerHeal;

		this.fire();

		var chargeVal = (this.energy2 + 1)/1.8; //charge speed scales with energy tech
		for (var i = 0; i < this.generators; i++) chargeVal *= 1.035;
		if(this.charge < 0 || this.space || this.c) this.charge+=chargeVal;
		else if(this.charge > 0 && !this.space && !this.c) this.charge = 0;
	}
	fire() {
		if (this.c && this.charge > 0) this.shootEliteWeapon();
		if (this.bulletQueue > 0) this.shootBullet(40); // SMG
		var wepId = this.weapons[this.equipped];
		var wep = wepns[wepId];

		//In case of insufficient ammo
		if (this.ammos[this.equipped] == 0 && this.charge > 10) {
			this.charge = 0;
			this.emit("sound", { file: "noammo", x: this.x, y: this.y });
			return;
		} 

		if (this.canShoot(wepId)) {

			if (this.ammos[this.equipped] == 0) return;

			if (wep.level > this.ship) {
				this.emit("chat", { msg: 'This weapon is incompatible with your current ship!', color: 'yellow' });
				return;
			}

			if (wep.name === "Submachinegun") { // Submachinegun physics
				if(this.bulletQueue == 0){
					this.bulletQueue += 5;
					this.ammos[this.equipped] -= 5;
					this.reload(false, wepId);
					sendWeapons(this);
				}
				return;
			}

			if (this.ammos[this.equipped] > 0) this.ammos[this.equipped]--;

			//Traditional Weapons
			// <= 6 are traditional guns.
			if (wepId <= 6 || wep.name === "Gravity Bomb" || wep.name === "Spreadshot") this.shootBullet(wepId);
			// <= 9 are plasma, laser, hadron beams.
			else if (wepId <= 9 || wep.name === "Jammer" || wep.name === "Mining Laser" || wep.name === "Ore Cannon" || wep.name === "Destabilizer" || wep.name === "Healing Beam") this.shootBeam(this, false);
			//Traditional missiles
			else if (wepId <= 14 || wep.name === "Proximity Fuze") this.shootMissile();
			// <= 17: Traditional Mines
			else if (wepId <= 17 || wep.name === "Impulse Mine" || wep.name === "Grenades" || wep.name === "Pulse Mine" || wep.name === "Campfire") this.shootMine();
			else if (wep.name === "Energy Disk" || wep.name === "Photon Orb") this.shootOrb();
			else if (wep.name === "Muon Ray" || wep.name === "EMP Blast" || wep.name === "Hypno Ray") this.shootBlast(wepId);



			//Timery Weapons

			else if (wepId == 36 || wepId == 18 || wepId == 19 || wepId == 29) {
				if (wep.name === "Supercharger") this.superchargerTimer = 1500;//1 min
				else if (wep.name === "Hull Nanobots") this.health += Math.min(this.maxHealth*.2, this.maxHealth - this.health); // min prevents overflow
				else if (wep.name === "Photon Cloak") this.disguise = 200;//6s
				else if (wep.name === "Warp Drive") this.speed = this.ship == 16 ? 1500 : 1000;
			}



			//Movey Weapons

			else if (wep.name === "Pulse Wave") {
				sendAllSector('sound', { file: "bigboom", x: this.x, y: this.y, dx: Math.cos(this.angle) * this.speed, dy: Math.sin(this.angle) * this.speed }, this.sx, this.sy);
				for (var i in players[this.sy][this.sx]) {
					var p = players[this.sy][this.sx][i];
					if (p.color !== this.color) { // only enemies
						var d2 = squaredDist(this, p); // distance squared between me and them
						if (d2 > square(10 * wep.range)) continue; // if out of range, then don't bother.
						var ang = angleBetween(this, p); // angle from the horizontal
						var vel = -10000 / Math.log(d2); // compute how fast to accelerate by
						p.vx += Math.cos(ang) * vel; // actually accelerate them
						p.vy += Math.sin(ang) * vel;
						p.gyroTimer = 25; // Make sure the player is drifting or else physics go wonk
						p.updatePolars(); // We changed their rectangular velocity.
					}
				}
			}

			else if (wep.name === "Electromagnet") { // identical structurally to pulse wave, see above for comments.
				if(global.tick % 2 == 0){
					for (var i in asts[this.sy][this.sx]) {
						var a = asts[this.sy][this.sx][i];
						var d2 = squaredDist(this, a);
						if (d2 > square(10 * wep.range)) continue; // These 10* are because the user sees 1 pixel as .1 distance whereas server sees it as 1 distance... or something like that
						var ang = angleBetween(this, a);
						var vel = -1000000 / Math.max(d2, 200000);
						a.vx += Math.cos(ang) * vel;
						a.vy += Math.sin(ang) * vel;
					}
					for (var i in missiles[this.sy][this.sx]) {
						var m = missiles[this.sy][this.sx][i];
						var d2 = squaredDist(this, m);
						if (d2 > square(10 * wep.range)) continue;
						var ang = angleBetween(this, m);
						var vel = -10000000 / Math.max(d2, 2000000);
						m.emvx += Math.cos(ang) * vel;
						m.emvy += Math.sin(ang) * vel;
					}
					for (var i in orbs[this.sy][this.sx]) {
						var o = orbs[this.sy][this.sx][i];
						var d2 = squaredDist(this, o);
						if (d2 > square(10 * wep.range)) continue;
						var ang = angleBetween(this, o);
						var vel = -25000000 / Math.max(d2, 2000000);
						o.vx += Math.cos(ang) * vel;
						o.vy += Math.sin(ang) * vel;
					}
					for (var i in mines[this.sy][this.sx]) {
						var m = mines[this.sy][this.sx][i];
						var d2 = squaredDist(this, m);
						if (d2 > square(10 * wep.range)) continue;
						var ang = angleBetween(this, m);
						var vel = -5000000 / Math.max(d2, 2000000);
						m.vx += Math.cos(ang) * vel;
						m.vy += Math.sin(ang) * vel;
					}
				}
			}



			//Misc

			else if (wep.name === "Turret") {
				if (this.x < sectorWidth / 4 || this.x > 3 * sectorWidth / 4 || this.y < sectorWidth / 4 || this.y > 3 * sectorWidth / 4) {
					this.emit("chat", { msg: 'Your turret must be closer to the center of the sector!', color: 'yellow' });
					this.space = false;
					return;
				}
				if (bases[this.sy][this.sx] != 0) {
					this.emit("chat", { msg: 'There can only be one turret in any sector!', color: 'yellow' });
					this.space = false;
					return;
				}
				var r = Math.random();
				var b = new Base(r, false, this.sx, this.sy, this.color, this.x, this.y, false);
				b.owner = this.name;
				bases[this.sy][this.sx] = b;
				this.emit("chat", { msg: 'You placed a turret! Name it with "/nameturret <name>".', color: 'yellow' });
			}

			else if (wep.name === "Sentry") {
				if (bases[this.sy][this.sx] != 0) {
					this.emit("chat", { msg: 'There can only be one turret in any sector!', color: 'yellow' });
					this.space = false;
					return;
				}
				var r = Math.random();
				var b = new Base(r, false, this.sx, this.sy, this.color, this.x, this.y, true);
				b.owner = this.name;
				bases[this.sy][this.sx] = b;
				this.emit("chat", { msg: 'You placed a sentry! Name it with "/nameturret <name>".', color: 'yellow' });
			}

			else if (wep.name === "Turbo") {
				var isDrifting = (this.e || this.gyroTimer > 0) && (this.a != this.d);
				var mult = isDrifting ? 1.025 : 1.017; // Faster when drifting.

				this.speed *= mult;
				this.vx *= mult;
				this.vy *= mult;
				//no need to updatePolars, since force is parallel with the player... i think? is that the case when drifting?

				if (isDrifting && !this.driftAchs[5] && this.w) { // Forced Induction
					this.driftAchs[5] = true;
					this.sendAchievementsDrift(true);
				}
				else if (isDrifting && this.s && !this.driftAchs[10]) { // Reverse Turbo Drift
					this.driftAchs[10] = true;
					this.sendAchievementsDrift(true);
				}
			}

			else if (wep.name === "Hyperdrive") {
				var isDrifting = (this.e || this.gyroTimer > 0) && (this.a != this.d);
				this.emit("sound", { file: "hyperspace", x: this.x, y: this.y });
				this.hyperdriveTimer = 200;
				if (isDrifting && this.w && !this.driftAchs[6]) { // Hyper-drift
					this.driftAchs[6] = true;
					this.sendAchievementsDrift(true);
				}
			}

			//If we run out of ammo on a one-use weapon, delete that weapon.
			if (this.ammos[this.equipped] == -2) {
				this.weapons[this.equipped] = -1;
				this.save(); // And save, to prevent people from shooting then logging out if they don't succeed with it.
			}

			sendWeapons(this);
			this.reload(false, wepId);
		}
	}
	shootEliteWeapon() {
		if(this.rank < this.ship) return;
		if (this.ship == 16) { // Elite Raider
			if(this.disguise > 0) return;
			//This effectively just shoots turbo.
			var mult = ((this.e || this.gyroTimer > 0) && this.w && (this.a != this.d)) ? 1.025 : 1.017;
			this.speed *= mult;
			this.vx *= mult;
			this.vy *= mult;
		} else if (this.ship == 17 && this.iron >= 250 && this.silver >= 250 && this.aluminium >= 250 && this.platinum >= 250) { // Quarrier
			if(this.disguise > 0 || this.shield) return;
			this.iron -= 250; // This just shoots an asteroid out of the ship as if it were a bullet.
			this.silver -= 250;
			this.aluminium -= 250;
			this.platinum -= 250;
			var r = Math.random();
			var a = new Asteroid(r, 1000, this.sx, this.sy, Math.floor(Math.random() * 4));
			a.x = this.x + Math.cos(this.angle) * 256;
			a.y = this.y + Math.sin(this.angle) * 256;
			a.vx = Math.cos(this.angle) * 15;
			a.vy = Math.sin(this.angle) * 15;
			asts[this.sy][this.sx][r] = a;
		} else if (this.ship == 18) {
			if(this.disguise > 0 || this.shield) return;
			this.shootBullet(39);
		} // Built in spreadshot
		else if (this.ship == 19) {
			if(this.disguise > 0) return;
			if (this.health < this.maxHealth) this.health++;
		} // Heals you
		else if (this.ship == 20) {
			this.shootBlast(41);
			this.save();
		} // Built in Hypno
		this.reload(true, 0);
	}
	reload(elite, wepId){
		if(elite){
			if(this.ship == 20) this.charge = -2000;
			if(this.ship == 18) this.charge = -wepns[39].charge;
			if(this.ship == 19 && this.charge > -200) this.charge-=10;
			if(this.ship == 17) this.charge = -150;
			return;
		}
		if(wepns[wepId].charge > 12) this.charge = 0;
		else this.charge = -wepns[wepId].charge;
	}
	canShoot(wepId){
		if(typeof wepns[wepId] === "undefined") return false;
		if(this.disguise > 0 || (this.shield && wepns[wepId].type !== "Misc")) return false;
		var sufficientCharge = this.charge > (wepns[wepId].charge > 12 ? wepns[wepId].charge : 0);
		return this.space && sufficientCharge;
	}
	move() {

		if (this.hyperdriveTimer > 0) {
			this.hyperdriveTimer--;
			this.speed = (10000 - square(100 - this.hyperdriveTimer)) / (this.ship == 16 ? 7 : 10);
		}

		this.botPlay(); // simulates a player and presses keys.

		var amDrifting = this.e || this.gyroTimer > 0;
		var ore = this.iron + this.silver + this.platinum + this.aluminium;

		//In english, your thrust is (this.thrust = your ship's thrust * thrust upgrade). Multiply by 1.8. Double if using supercharger. Reduce if carrying lots of ore. If drifting, *=1.6 if elite raider, *=1.45 if not.
		var newThrust = this.thrust * (this.superchargerTimer > 0 ? 2 : 1) * 1.8 / ((ore / this.capacity + 3) / 3.5) * ((amDrifting && this.w && (this.a != this.d)) ? (this.ship == 16 ? 1.6 : 1.45) : 1);

		//Reusable Trig
		var ssa = Math.sin(this.angle), ssd = Math.sin(this.driftAngle), csa = Math.cos(this.angle), csd = Math.cos(this.driftAngle);

		this.vx = csd * this.speed; // convert polars to rectangulars
		this.vy = ssd * this.speed;
		this.vx *= (amDrifting && this.w && (Math.abs(this.cva) > this.va * .999)) ? .94 : .92;
		this.vy *= (amDrifting && this.w && (Math.abs(this.cva) > this.va * .999)) ? .94 : .92; //Air resistance

		if (this.w) { // Accelerate!
			this.vx += csa * newThrust;
			this.vy += ssa * newThrust;
		}
		if (this.s && amDrifting) { // Accelerate backwards, at half speed!
			this.vx -= csa * newThrust / 2;
			this.vy -= ssa * newThrust / 2;
		}

		this.updatePolars();//convert back to polars


		if (!amDrifting) { // Terraced angular decelerationy stuff to continuously match driftAngle (angle of motion) to the actual angle the ship is pointing
			this.noDrift++;
			if (this.noDrift > 18) this.driftAngle = this.angle;
			else if (this.noDrift > 12) this.driftAngle = findBisector(this.driftAngle, this.angle);
			else if (this.noDrift > 7) this.driftAngle = findBisector(findBisector(this.driftAngle, this.angle), this.driftAngle);
			else if (this.noDrift > 3) this.driftAngle = findBisector(findBisector(findBisector(this.driftAngle, this.angle), this.driftAngle), this.driftAngle);
			else this.driftAngle = findBisector(findBisector(findBisector(findBisector(this.driftAngle, this.angle), this.driftAngle), this.driftAngle), this.driftAngle);//This happens immediately after shift released, noDrift increases with time.
		} else { // In drift.
			this.gyroTimer--;
			if (this.a != this.d) {
				if (this.w) this.driftTimer++;
				else if (this.s && !this.driftAchs[7]) { // I can go backwards!?!
					this.driftAchs[7] = true;
					this.sendAchievementsDrift(true);
				}
			}
			this.noDrift = 0; // Time elapsed since last drift
		}

		this.x += this.vx; // Update position from velocity
		this.y += this.vy;
		if (this.jukeTimer > 1 || this.jukeTimer < -1) { // Q or E keys. Juke mechanics.
			this.x += this.jukeTimer * Math.sin(this.angle);
			this.y -= this.jukeTimer * Math.cos(this.angle);
			this.jukeTimer *= .8;
		}

		var angAccel = 0; // angular acceleration
		if (this.a) angAccel -= (this.va + this.cva / (amDrifting ? 1.5 : 1)) / 3;
		if (this.d) angAccel += (this.va - this.cva / (amDrifting ? 1.5 : 1)) / 3; // ternary reduces angular air resistance while drifting
		if (this.superchargerTimer > 0) angAccel *= 2;
		this.cva += angAccel; // update angular velofity from thrust
		if (!this.d && !this.a && !amDrifting) this.cva /= 2; // When not drifting, apply air resistance to angular velocity.

		//If we have a drift trail, we turn faster. Generators reduce turning speed.
		this.angle += this.cva * (1 - this.generators / 10) * (this.trail % 16 == 3 ? 1.05 : 1) / 1.5;

		//Make sure everything is in the range 0-2pi
		this.driftAngle += Math.PI * 4;
		this.angle += Math.PI * 4;
		this.driftAngle %= Math.PI * 2;
		this.angle %= Math.PI * 2;

		this.testSectorChange();

		if (tick % 15 == 0) this.checkQuestStatus(false);
		if (tick % 2 == 0) return;

		this.checkMineCollision();
	}
	checkMineCollision() {
		for (var i in mines[this.sy][this.sx]) {
			var m = mines[this.sy][this.sx][i];
			if (m.color != this.color && m.wepnID != 32 && m.wepnID != 44) { // enemy mine and not either impulse or campfire
				if (m.wepnID != 16 && squaredDist(m, this) < square(16 + ships[this.ship].width)) {
					this.dmg(m.dmg, m); // damage me
					if (m.wepnID == 17) this.EMP(50); // emp mine
					m.die();
					break;
				} else if (m.wepnID == 16 && squaredDist(m, this) < square(wepns[m.wepnID].range + ships[this.ship].width)) { // TODO range * 10?
					var r = Math.random(); // Laser Mine
					var beam = new Beam(m.owner, r, m.wepnID, this, m); // m.owner is the owner, m is the origin location
					beams[this.sy][this.sx][r] = beam;
					sendAllSector('sound', { file: "beam", x: m.x, y: m.y }, m.sx, m.sy);
					m.die();
				}
			}
		}
	}
	testSectorChange() {
		var old_sx = this.sx;
		var old_sy = this.sy;

		var giveBounce = false; // did they bounce on a galaxy edge?
		if (this.x > sectorWidth) {//check each edge of the 4 they could bounce on
			this.x = 1;
			if (this.guest || (trainingMode && this.isNNBot)) { // guests cant cross borders, nobody can go outside the galaxy
				giveBounce = true;
				this.x = (sectorWidth - 5);
				this.driftAngle = this.angle = 3.1415 - this.angle;
				this.vx *= -1;
			}
			else {
				this.sx = (this.sx+1+mapSz)%mapSz;
				this.borderJumpTimer += 100;
			}
		}
		else if (this.y > sectorWidth) {
			this.y = 1;
			if (this.sy == mapSz-1 || this.guest || (trainingMode && this.isNNBot)) {
				giveBounce = true;
				this.y = (sectorWidth - 5);
				this.driftAngle = this.angle = -this.angle;
				this.vy *= -1;
			}
			else {
				this.sy++;
				this.borderJumpTimer += 100;
			}
		}
		else if (this.x < 0) {
			this.x = (sectorWidth - 1);
			if (this.guest || (trainingMode && this.isNNBot)) {
				giveBounce = true;
				this.x = 5;
				this.driftAngle = this.angle = 3.1415 - this.angle;
				this.vx *= -1;
			}
			else {
				this.sx = (this.sx-1+mapSz)%mapSz;
				this.borderJumpTimer += 100;
			}
		}
		else if (this.y < 0) {
			this.y = (sectorWidth - 1);
			if (this.sy == 0 || this.guest || (trainingMode && this.isNNBot)) {
				giveBounce = true;
				this.y = 5;
				this.driftAngle = this.angle = -this.angle;
				this.vy *= -1;
			}
			else {
				this.sy--;
				this.borderJumpTimer += 100;
			}
		}
		if (giveBounce && !this.randmAchs[5]) {
			if (this.guest) this.emit("chat", { msg: "~`orange~`You must create an account to explore the universe!" });
			else {
				this.randmAchs[5] = true;
				this.sendAchievementsMisc(true);
			}
		}

		if (this.borderJumpTimer > 100) { // damage for running away from fights
			this.health = (this.health - 1) * .9 + 1;
			this.borderJumpTimer = 50;
		}

		if (old_sx !== this.sx || old_sy !== this.sy) {
			delete players[old_sy][old_sx][this.id];

			players[this.sy][this.sx][this.id] = this;
			this.onChangeSectors();
		}

	}
	juke(left) {
		if (this.charge < 0) return;
		this.charge = -20;
		this.jukeTimer = (this.trail % 16 == 4 ? 1.25 : 1) * (left ? 50 : -50); // misc trail makes you juke further.
	}
	mute(minutes) {
		chatAll(this.nameWithColor() + " has been " + (minutes > 0 ? "muted for " + minutes + " minutes!" : "unmuted!"));
	}
	onChangeSectors() {
		//track my touched corners
		if (this.sx == 0) {
			if (this.sy == 0 && (this.cornersTouched & 1) != 1) this.cornersTouched++;
			else if (this.sy == mapSz - 1 && (this.cornersTouched & 2) != 2) this.cornersTouched += 2;
		} else if (this.sx == mapSz - 1) {
			if (this.sy == 0 && (this.cornersTouched & 4) != 4) this.cornersTouched += 4;
			else if (this.sy == mapSz - 1 && (this.cornersTouched & 8) != 8) this.cornersTouched += 8;
		}
		if (this.cornersTouched == 15) {
			this.randmAchs[7] = true;
			this.sendAchievementsMisc(true);
		}

		if ((this.sx % 3 != 0 && this.sy == 8) && this.quest.type === "Secret3") {
			this.spoils("money", this.quest.exp); // reward the player
			this.spoils("experience", Math.floor(this.quest.exp / 4000));

			this.hasPackage = false;
			if ((this.questsDone & 8) == 0) this.questsDone += 8;

			this.quest = 0; // reset quest and tell the client
			this.emit('quest', { quest: this.quest, complete: true});

			if (!this.moneyAchs[9]) { // Questor
				this.moneyAchs[9] = true;
				this.sendAchievementsCash(true);
			}
			if (this.questsDone == 15 && !this.moneyAchs[10]) { // Adventurer
				this.moneyAchs[10] = true;
				this.sendAchievementsCash(true);
			}
		}

		if (this.quest != 0 && this.quest.type === "Secret" && this.sx == this.quest.sx && this.sy == this.quest.sy) { // advance in secret quest to phase 2
			this.quest = { type: "Secret2", exp: this.quest.exp, sx: this.quest.sx, sy: this.quest.sy };
			this.emit('quest', { quest: this.quest, complete: false});
		}

		//tell client what's in this sector
		this.getAllPlanets();

		//update list of visited sectors.
		var index = this.sx + this.sy * mapSz;
		var prevStr = this.planetsClaimed.substring(0, index);
		var checkStr = this.planetsClaimed.substring(index, index + 1);
		var postStr = this.planetsClaimed.substring(index + 1, mapSz * mapSz);
		if (checkStr !== "2") this.planetsClaimed = prevStr + "1" + postStr;

		if (!this.planetsClaimed.includes("0") && !this.randmAchs[6]) {
			this.randmAchs[6] = true;
			this.sendAchievementsMisc(true);
		}

	}
	checkPlanetCollision() {

		var p = planets[this.sy][this.sx];

		//if out of range, return. Only try this once a second.
		if (tick % 10 != 0 || squaredDist(p, this) > square(512)) return;

		//cooldown to prevent chat spam when 2 people are on the planet
		var cool = p.cooldown;
		if (cool < 0) { this.refillAllAmmo(); p.cooldown = 50; }

		this.checkQuestStatus(true); // lots of quests are planet based

		if (this.guest) {
			this.emit("chat", { msg: 'You must create an account in the base before you can claim planets!', color: 'yellow' });
			return;
		}

		if (typeof this.quest !== "undefined" && this.quest != 0 && this.quest.type === "Secret2" && this.quest.sx == this.sx && this.quest.sy == this.sy) { // move on to last secret stage

			//compute whether there are any unkilled enemies in this sector
			var cleared = true;
			for (var i in players[this.sy][this.sx]) {
				var player = players[this.sy][this.sx][i];
				if (player.color !== this.color) {
					cleared = false;
					break;
				}
			}
			if (bases[this.sy][this.sx] != 0 && bases[this.sy][this.sx].turretLive) cleared = false;//also check base is dead

			if (cleared) { // 2 ifs needed, don't merge this one with the last one
				this.hasPackage = true;
				this.quest = { type: "Secret3", exp: this.quest.exp };
				this.emit('quest', { quest: this.quest, complete:false}); //notify client
			}
		}

		if (p.color === this.color || cool > 0) return;

		p.color = this.color; // claim
		p.owner = this.name;
		//chatAll('Planet ' + p.name + ' claimed by ' + this.nameWithColor() + "!"); This gets bothersome and spammy

		for (var i in players[this.sy][this.sx]) players[this.sy][this.sx][i].getAllPlanets();//send them new planet data

		if (!this.randmAchs[8]) { // Astronaut
			this.randmAchs[8] = true;
			this.sendAchievementsMisc(true);
		}

		this.emit("planetMap", { x:p.x, y:p.y, sx:p.sx, sy:p.sy });

		//Update list of claimed planets.
		var index = this.sx + this.sy * mapSz;
		var prevStr = this.planetsClaimed.substring(0, index);
		var postStr = this.planetsClaimed.substring(index + 1, mapSz * mapSz);
		this.planetsClaimed = prevStr + "2" + postStr;

	}
	checkQuestStatus(touchingPlanet) {

		if (this.quest == 0 || this.isBot) return;// no point if the person hasn't got a quest rn.

		if (this.quest.type === 'Mining' && this.sx == this.quest.sx && this.sy == this.quest.sy) {

			//check the player has sufficient metal according to quest
			if (this.quest.metal == 'aluminium' && this.aluminium < this.quest.amt) return;
			if (this.quest.metal == 'iron' && this.iron < this.quest.amt) return;
			if (this.quest.metal == 'silver' && this.silver < this.quest.amt) return;
			if (this.quest.metal == 'platinum' && this.platinum < this.quest.amt) return;

			//take the amount from them
			if (this.quest.metal == 'aluminium') this.aluminium -= this.quest.amt;
			if (this.quest.metal == 'iron') this.iron -= this.quest.amt;
			if (this.quest.metal == 'silver') this.silver -= this.quest.amt;
			if (this.quest.metal == 'platinum') this.platinum -= this.quest.amt;

			//reward them
			this.spoils("money", this.quest.exp);
			this.spoils("experience", Math.floor(this.quest.exp / 1500));

			this.quest = 0;
			this.emit('quest', { quest: this.quest, complete:true}); // tell client quest is over

			if (!this.moneyAchs[9]) { // Questor
				this.moneyAchs[9] = true;
				this.sendAchievementsCash(true);
			}

			if ((this.questsDone & 1) == 0) this.questsDone += 1;

		} else if (this.quest.type === 'Delivery' && touchingPlanet) {

			//pickup
			if (this.sx == this.quest.sx && this.sy == this.quest.sy && !this.hasPackage) {
				this.hasPackage = true;
				this.strongLocal("Package obtained!", this.x, this.y - 192);
			}

			//dropoff
			if (this.hasPackage && this.sx == this.quest.dsx && this.sy == this.quest.dsy) {

				this.spoils("money", this.quest.exp);//reward
				this.spoils("experience", Math.floor(this.quest.exp / 1500));

				this.hasPackage = false;
				this.quest = 0;
				this.emit('quest', { quest: this.quest, complete:true}); // tell client it's over
				if ((this.questsDone & 2) == 0) this.questsDone += 2;

				if (!this.moneyAchs[9]) { // Questor
					this.moneyAchs[9] = true;
					this.sendAchievementsCash(true);
				}

			}

		}

		if (this.questsDone == 15 && !this.moneyAchs[10]) { // Adventurer
			this.moneyAchs[10] = true;
			this.sendAchievementsCash(true);
		}

	}
	baseKilled() {

		if (this.isBot) return;

		this.baseKills++;

		//achievementy stuff
		this.killsAchs[7] = this.baseKills >= 1;
		this.killsAchs[8] = this.baseKills >= 100;
		this.sendAchievementsKill(true);

		//base quest checking
		if (this.quest != 0 && this.quest.type == 'Base') {
			if (this.sx == this.quest.sx && this.sy == this.quest.sy) {

				// reward player
				this.spoils("money", this.quest.exp);
				this.spoils("experience", Math.floor(this.quest.exp / 4000));

				this.quest = 0; //tell client it's done
				this.emit('quest', { quest: this.quest, complete: true});
				if ((this.questsDone & 4) == 0) this.questsDone += 4;

				if (!this.moneyAchs[9]) { // Questor
					this.moneyAchs[9] = true;
					this.sendAchievementsCash(true);
				}

			}
		}

		if (this.questsDone == 15 && !this.moneyAchs[10]) { // Adventurer
			this.moneyAchs[10] = true;
			this.sendAchievementsCash(true);
		}

	}
	updateRank() {
		var prerank = this.rank;
		this.rank = 0;
		while (this.experience > ranks[this.rank]) this.rank++; //increment until we're in the right rank's range
		if (!this.isBot && this.rank > prerank && this.rank > 5){
			this.emit('rank', {}); //congratulations!
			chatAll(this.nameWithColor() + " just leveled up to rank " + this.rank + "!");
		}
	}
	sellOre(oretype){
            //pay them appropriately
              if (oretype == 'iron' || oretype == 'all') {
                this.spoils("money", this.iron);
                this.iron = 0;
            } if (oretype == 'silver' || oretype == 'all') {
                this.spoils("money", this.silver);
                this.silver = 0;
            } if (oretype == 'platinum' || oretype == 'all') {
                this.spoils("money", this.platinum);
                this.platinum = 0;
            } if (oretype == 'aluminium' || oretype == 'all') {
                this.spoils("money", this.aluminium);
                this.aluminium = 0;
            }
            this.save();
	}
	dock() {

		if (this.isBot) return; // can bots even get to this point in code?

		if (this.docked) { // undock if already docked. This toggles the player's dock status
			this.getAllPlanets(); // tell client what's out in the sector
			this.docked = false;
			players[this.sy][this.sx][this.id] = this;
			delete dockers[this.id];
			this.leaveBaseShield = 25;
			this.health = this.maxHealth;
			return;
		}

		this.checkTrailAchs();

		var base = 0;
		var b = bases[this.sy][this.sx];
		if (b.isBase && b.color == this.color && squaredDist(this, b) < square(512)) base = b; // try to find a base on our team that's in range and isn't just a turret
		if (base == 0) return;

		this.refillAllAmmo();
		this.x = this.y = sectorWidth / 2;
		this.save();
		this.docked = true;

		dockers[this.id] = this;
		delete players[this.sy][this.sx][this.id];

		this.sendStatus();
	}
	shootBullet(currWep) {
		if (this.bulletQueue > 0) { // Submachinegun
			if (this.ammos[this.equipped] <= 0) return;
			this.bulletQueue--;
			this.reload(false, currWep);
			currWep = 40;
		}

		//how many bullets are we firing?
		var n = 1;
		if (currWep == 4) n = 4; // shotgun
		if (currWep == 39) n = 3; // spreadshot
		if (currWep == 6) n = 2; // minigun

		for (var i = 0; i < n; i++) {
			var r = Math.random();

			//find the angle of the bullets. Manipulate if one of the multi-bullet weapons.
			var bAngle = this.angle;
			if (currWep == 2) bAngle -= 3.1415; // reverse gun
			if (currWep == 39) bAngle += ((i - 1) / 3.5); // spreadshot
			if (currWep == 4) bAngle += Math.random() - .5; // shotgun

			var bullet = new Bullet(this, r, currWep, bAngle, i * 2 - 1);
			bullets[this.sy][this.sx][r] = bullet;
			sendAllSector('sound', { file: (currWep == 5 || currWep == 6 || currWep == 39) ? "minigun" : "shot", x: this.x, y: this.y }, this.sx, this.sy);
		}
	}
	shootMissile() {
		var r = Math.random();
		var bAngle = this.angle;
		var missile = new Missile(this, r, this.weapons[this.equipped], bAngle);
		missiles[this.sy][this.sx][r] = missile;
		sendAllSector('sound', { file: "missile", x: this.x, y: this.y }, this.sx, this.sy);
	}
	shootOrb() {
		var r = Math.random();
		var orb = new Orb(this, r, this.weapons[this.equipped]);
		orbs[this.sy][this.sx][r] = orb;
		sendAllSector('sound', { file: "beam", x: this.x, y: this.y }, this.sx, this.sy);
	}
	shootMine() {
		if (Object.keys(mines[this.sy][this.sx]).length >= 20 && this.weapons[this.equipped] < 30) {
			this.ammos[this.equipped]++;
			this.emit("chat", { msg: "This sector has reached its limit of 20 mines." });
			return;
		}
		if (square(this.sx - sectorWidth / 2) + square(this.sy - sectorWidth / 2) < square(600 * 10)) {
			this.ammos[this.equipped]++;
			this.emit("chat", { msg: "You may not place a mine here." });
			return;
		}
		var r = Math.random();
		var mine = new Mine(this, r, this.weapons[this.equipped]);
		mines[this.sy][this.sx][r] = mine;
		sendAllSector('mine', { x: this.x, y: this.y }, this.sx, this.sy);
	}
	shootBeam(origin, restricted) {// restricted is for recursive calls from quarriers
		var ox = origin.x, oy = origin.y;
		var nearP = 0; // target, which we will compute
		var range2 = square(wepns[this.weapons[this.equipped]].range * 10);

		//base
		if (!restricted)
			if (this.weapons[this.equipped] == 7 || this.weapons[this.equipped] == 8 || this.weapons[this.equipped] == 9 || this.weapons[this.equipped] == 45) {
				var b = bases[this.sy][this.sx];
				if (b != 0 && ((b.color == this.color) == (this.weapons[this.equipped] == 45)) && !(this.weapons[this.equipped] == 45 && b.health > baseHealth*.9995) && b.turretLive && hypot2(b.x, ox, b.y, oy) < range2) nearP = b;
			}

		//search players
		if (!restricted)
			for (var i in players[this.sy][this.sx]) {
				var p = players[this.sy][this.sx][i];
				if (p.ship != 17 && (this.weapons[this.equipped] == 26 || this.weapons[this.equipped] == 30)) continue; // elite quarrier is affected
				if (((p.color == this.color) != (this.weapons[this.equipped] == 45)) || p.disguise > 0 || this.id == p.id) continue;
				if (this.weapons[this.equipped] == 45 && p.health > p.maxHealth*.9995) continue;
				var dx = p.x - ox, dy = p.y - oy;
				var dist2 = dx * dx + dy * dy;
				if (dist2 < range2 && (nearP == 0 || dist2 < square(nearP.x - ox) + square(nearP.y - oy))) nearP = p;
			}

		//search asteroids
		if (nearP == 0 && this.weapons[this.equipped] != 35 && this.weapons[this.equipped] != 31 && this.weapons[this.equipped] != 45)
			for (var i in asts[this.sy][this.sx]) {
				var a = asts[this.sy][this.sx][i];
				if (a.sx != this.sx || a.sy != this.sy || a.hit) continue;
				var dx = a.x - ox, dy = a.y - oy;
				var dist2 = dx * dx + dy * dy;
				if (dist2 < range2 && (nearP == 0 || dist2 < square(nearP.x - ox) + square(nearP.y - oy))) nearP = a;
			}


		if (nearP == 0) return;

		//gyrodynamite
		if (this.weapons[this.equipped] == 31 && nearP.sx == this.sx && nearP.sy == this.sy && nearP.color != this.color) {
			nearP.gyroTimer = 250;
			nearP.emit("gyro", { t: 250 });
		}

		//elite quarrier
		if (this.ship == 17 && nearP != 0 && nearP.type === "Asteroid") {
			nearP.hit = true;
			for (var i = 0; i < 3; i++) this.shootBeam(nearP, true);
		}

		var r = Math.random();
		var beam = new Beam(this, r, this.weapons[this.equipped], nearP, origin);
		beams[this.sy][this.sx][r] = beam;
		sendAllSector('sound', { file: "beam", x: ox, y: oy }, this.sx, this.sy);
	}
	shootBlast(currWep) {
		var r = Math.random();
		var blast = new Blast(this, r, currWep);
		blasts[this.sy][this.sx][r] = blast;
		sendAllSector('sound', { file: "beam", x: this.x, y: this.y }, this.sx, this.sy);
	}
	// Bot specific
	die = async function (b) {
	}
	dmg(d, origin) {

		if (!players[this.sy][this.sx][this.id]) return; //multi-kill bug

		//reward nn bots for hurting other players
		if (this.isNNBot && origin.type === "Bullet" && origin.owner.type === "Player" && origin.owner.net != 0) {
			origin.owner.net.save(this.isNNBot ? this.net.id : Math.floor(Math.random()));
			this.health -= 10000;
		}

		//blood trail: less damage
		if (this.trail % 16 == 1) d /= 1.05;

		d *= (this.shield ? .25 : 1); // Shield- 1/4th damage

		this.health -= d;
		if (this.health > this.maxHealth) this.health = this.maxHealth;
		if (this.health < 0) this.die(origin);

		note('-' + Math.floor(d), this.x, this.y - 64, this.sx, this.sy); // e.g. "-8" pops up on screen to mark 8 hp was lost (for all players)
		this.emit('dmg', {});
		return this.health < 0;
	}
	EMP(t) {
		if (this.empTimer > 0) return; // emps don't stack. can't emp an already emp's ship
		if (this.ship >= 16) t *= 1.5; // Emp works better on elites
		this.empTimer = t;

		//turn off all keys
		this.w = this.e = this.a = this.s = this.d = this.c = this.space = false;
		if (!this.isBot) this.emit('emp', { t: t });
	}
	save() {
	}

	onKill(p) {

		//kill streaks
		// Don't award for guest kills
		if (!p.guest && p.color !== this.color) {
			this.killStreak++;
			this.killStreakTimer = 750;//30s
		}
		
		if (this.ship == 19) for (var i in players[this.sy][this.sx]){
			var p = players[this.sy][this.sx][i];
			if(p.id !== this.id) p.EMP(15);
		}
		
		this.kills++;

		if (this.isBot) return;

		//achievementy stuff
		this.killsAchs[0] = this.kills >= 1;
		this.killsAchs[1] = this.kills >= 10;
		this.killsAchs[2] = this.kills >= 100;
		this.killsAchs[3] = this.kills >= 1000;
		this.killsAchs[4] = this.kills >= 4000;
		this.killsAchs[5] = this.kills >= 10000;
		if (p.trail != 0) this.killsAchs[6] = true;
		if (p.hasPackage) this.killsAchs[10] = true;
		if (p.name === this.name) this.killsAchs[11] = true;
		else if (p.color === this.color) this.killsAchs[9] = true;
		this.sendAchievementsKill(true);
	}
	onMined(a) {
		if (this.isBot) return;

		//bitmask of what types of ores this player has mined
		if ((this.oresMined & (1 << a)) == 0) this.oresMined += 1 << a;

		//achievementy stuff
		if (this.oresMined == 15 && !this.moneyAchs[1]) this.moneyAchs[1] = true;
		else if (!this.moneyAchs[0]) this.moneyAchs[0] = true;
		else if (!this.moneyAchs[2] && 4000 <= this.iron + this.silver + this.aluminium + this.platinum) this.moneyAchs[2] = true;
		else if (!this.moneyAchs[3] && 15000 <= this.iron + this.silver + this.aluminium + this.platinum) this.moneyAchs[3] = true;
		else return;
		this.sendAchievementsCash(true);
	}
	sendAchievementsKill(note) {
		if (this.isBot) return;
		this.emit("achievementsKill", { note: note, achs: this.killsAchs });
	}
	sendAchievementsCash(note) {
		if (this.isBot) return;
		this.emit("achievementsCash", { note: note, achs: this.moneyAchs });
	}
	sendAchievementsDrift(note) {
		if (this.isBot) return;
		this.emit("achievementsDrift", { note: note, achs: this.driftAchs });
	}
	sendAchievementsMisc(note) {
		this.randmAchs[9] = !this.planetsClaimed.includes("0") && !this.planetsClaimed.includes("1"); // I had no clue where to put this. couldn't go in onPlanetCollision, trust me.
		if (this.isBot) return;
		this.emit("achievementsMisc", { note: note, achs: this.randmAchs });
	}
	sendStatus() {
		if (!this.isBot) this.emit("status", { docked: this.docked, state: this.dead, lives: this.lives });
	}
	checkMoneyAchievements() {
		if (this.isBot) return;
		if (this.money >= 10000 && !this.moneyAchs[4]) this.moneyAchs[4] = true;
		else if (this.money >= 100000 && !this.moneyAchs[5]) this.moneyAchs[5] = true;
		else if (this.money >= 1000000 && !this.moneyAchs[6]) this.moneyAchs[6] = true;
		else if (this.money >= 10000000 && !this.moneyAchs[7]) this.moneyAchs[7] = true;
		else return;
		this.sendAchievementsCash(true);
	}
	checkDriftAchs() {
		if (this.isBot) return;
		if (this.driftTimer >= 25 && !this.driftAchs[0]) this.driftAchs[0] = true; // drift 1sex
		else if (this.driftTimer >= 25 * 60 && !this.driftAchs[1]) this.driftAchs[1] = true; // 1min
		else if (this.driftTimer >= 25 * 60 * 10 && !this.driftAchs[2]) this.driftAchs[2] = true; // 10mins
		else if (this.driftTimer >= 25 * 60 * 60 && !this.driftAchs[3]) this.driftAchs[3] = true; // 1hr
		else if (this.driftTimer >= 25 * 60 * 60 * 10 && !this.driftAchs[4]) this.driftAchs[4] = true; // 10hrs
		else return;
		this.sendAchievementsDrift(true);
	}
	checkTrailAchs() {

		//Check if they have all achievements of a type. If so, give them the corresponding trail achievement of that type

		var rAll = true;
		for (var i = 0; i < 10; i++) if (!this.randmAchs[i]) rAll = false;
		if (!this.randmAchs[10] && rAll) {
			this.randmAchs[10] = true;
			this.sendAchievementsMisc(false);
		}

		rAll = true;
		for (var i = 0; i < 12; i++) if (!this.killsAchs[i]) rAll = false;
		if (!this.killsAchs[12] && rAll) {
			this.killsAchs[12] = true;
			this.sendAchievementsKill(false);
		}

		rAll = true;
		for (var i = 0; i < 11; i++) if (!this.driftAchs[i]) rAll = false;
		if (!this.driftAchs[11] && rAll) {
			this.driftAchs[11] = true;
			this.sendAchievementsDrift(false);
		}

		rAll = true;
		for (var i = 0; i < 11; i++) if (!this.moneyAchs[i]) rAll = false;
		if (!this.moneyAchs[11] && rAll) {
			this.moneyAchs[11] = true;
			this.sendAchievementsCash(false);
		}
	}
	
	getAllPlanets() { // same, but with planets
		if (this.isBot) return;
		var packHere = 0;
		var planet = planets[this.sy][this.sx];
		packHere = { id: planet.id, name: planet.name, x: planet.x, y: planet.y, color: planet.color };
		this.emit('planets', { pack: packHere });
	}
	updatePolars() { // Convert my rectangular motion/position data to polar
		this.driftAngle = Math.atan2(this.vy, this.vx);
		this.speed = Math.sqrt(square(this.vy) + square(this.vx));
	}
	refillAmmo(i) {
		if (typeof wepns[this.weapons[i]] !== "undefined") this.ammos[i] = wepns[this.weapons[i]].ammo;
	}
	refillAllAmmo() {
		for (var i = 0; i < 10; i++) this.refillAmmo(i);
		sendWeapons(this);
		this.strongLocal("Ammo Replenished!", this.x, this.y + 256);
	}
	testAfk() {
		return false;
	}
	calculateGenerators() { // count how many gens I have
		this.generators = 0;
		for (var slot = 0; slot < ships[this.ship].weapons; slot++)
			if (this.weapons[slot] == 20) this.generators++;
		if (this.ship <= wepns[20].level) this.generators = 0; // gotta have sufficiently high ship
	}
	spoils(type, amt) { // gives you something. Called wenever you earn money / exp / w/e
		if (typeof amt === "undefined") return;
		if (type === "experience") {
			this.experience += amt;
			this.updateRank();
		}
		else if (type === "money") this.money += amt * ((amt > 0 && this.trail % 16 == 2) ? 1.05 : 1);
		else if (type === "life" && this.lives < 20) this.lives += amt;
		this.experience = Math.max(this.experience, 0);
		this.emit("spoils", { type: type, amt: amt });
	}
	nameWithoutTag(){
		if(this.name.includes(" ")) return this.name.split(" ")[1];
		return this.name;
	}
	nameWithColor(){ // returns something like "~`green~`[O] 2swap~`yellow~`"
		return "~`"+this.color+"~`"+this.name+"~`yellow~`";
	}
	noteLocal(msg, x, y) {
		this.emit('note', { msg: msg, x: x, y: y, local: true })
	}
	strongLocal(msg, x, y) {
		this.emit('strong', { msg: msg, x: x, y: y, local: true });
	}
	
	botPlay() {}
	emit(a,b) {}
};

module.exports = Player;