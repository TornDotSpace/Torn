var fs = require('fs');
var Blast = require('./battle/blast.js');
var Bullet = require('./battle/bullet.js');
var Asteroid = require("./universe/asteroid.js");
var Package = require("./universe/package.js");
var Missile = require("./battle/missile.js");
var NeuralNet = require('./neuralnet.js');
var Base = require('./universe/base.js');
var Orb = require('./battle/orb.js');
var Mine = require('./battle/mine.js');
var Beam = require('./battle/beam.js');

function Player(i){
	var self = {
		
		type:"Player",
		
		name:"ERR0",
		id:i, // unique identifier
		password:"password",
		ip:0,
		trail:0,
		color:i>.5?'red':'blue',
		ship:0,
		experience:0,
		rank:0,
		
		guest:false,
		dead: false,
		docked:false,
		
		//misc timers
		noDrift:50, // A timer used for decelerating angular momentum
		afkTimer:25 * 60 * 30, // check for afk
		pingTimer:125, // check for lag-out
		jukeTimer: 0,
		hyperdriveTimer:-1,
		borderJumpTimer:0, // for deciding whether to hurt the player
		planetTimer:0,
		leaveBaseShield:0,
		empTimer:-1,
		disguise:-1,
		timer:0,
		gyroTimer:0,
		reload:0,
		
		chatTimer: 100,
		muteCap: 250,
		globalChat:0,
		
		weapons:{}, // my equipped weapons and ammo counts
		ammos:{},
		bulletQueue:0, // For submachinegun (5 bullet bursts)
		
		sx:0, // sector
		sy:0,
		x:sectorWidth/2,
		y:sectorWidth/2,
		vx:0,
		vy:0,
		cva:0,
		angle:0,
		speed:0,
		driftAngle:0,
		
		money:8000,
		kills:0,
		killStreakTimer:-1,
		killStreak:0,
		baseKills:0,
		
		shield:false,
		generators:0,
		energy:100,
		isLocked: false,
		lives: 20,
		quest:0,
		health:1,
		
		iron:0,
		silver:0,
		platinum:0,
		aluminium:0,
		
		//bot stuff
		brainwashedBy:0, // for enslaved bots
		deleteRate:.0005,
		net:0, // where the neural network is stored
		isBot:false,
		isNNBot:false,
		
		/* please don't touch these
		nearestEnemyDist: 0,//for nnBots
		nearestFriendDist: 0,
		nearestBulletDist: 0,
		nearestEnemyAngle: 0,
		nearestFriendAngle: 0,
		nearestBulletAngle: 0,
		nearestEnemyDistV: 0,//velocities
		nearestFriendDistV: 0,
		nearestBulletDistV: 0,
		nearestEnemyAngleV: 0,
		nearestFriendAngleV: 0,
		nearestBulletAngleV: 0,
		*/

		thrust:1, // These are techs multiplied by ship stats, used for actual physics
		va:1,
		capacity:1,
		maxHealth:2,
		
		thrust2:1, // these just track the player tech levels
		radar2:1,
		agility2:1,
		capacity2:1,
		maxHealth2:1,
		energy2:1,
		
		w:false, // what keys are pressed currently
		s:false,
		a:false,
		d:false,
		e:false,
		c:false,
		space:false,

		reply:"nobody", // last person to pm / who pmed me
		
		killsAchs:{}, // 13 of em
		moneyAchs:{}, // 12
		driftAchs:{}, // 12
		randmAchs:{}, // 12
		
		//various achievement stuff
		driftTimer:0, // How many ticks this account has been drifting.
		cornersTouched:0, // bitmask
		oresMined:0, // bitmask
		questsDone:0, // bitmask
		planetsClaimed:"0000000000000000000000000000000000000000000000000",
		lastLogin: "A long, long time ago :(",
		points:0,

		email:""
	}

	self.tick = function(){
		
		//timer business
		if(self.killStreakTimer--<0) self.killStreak = 0; // EDIT AT YOUR PERIL. Sensitive to off-by-ones.
		if(self.borderJumpTimer>0) self.borderJumpTimer--;
		self.superchargerTimer--;
		self.empTimer--;
		self.disguise--;
		var reloadVal = self.energy2/2+.5; //reload speed scales with energy tech
		for(var i = 0; i < self.generators; i++) reloadVal *= 1.06;
		self.reload -= reloadVal;
		
		var amDrifting = self.e || self.gyroTimer > 0;
		self.shield = (self.s && !amDrifting && self.energy > 5 && self.gyroTimer < 1) || self.leaveBaseShield > 0;
		if(self.shield && !(self.leaveBaseShield-- > 0)){
			self.energy-=1.3;
			if(self.energy < 5) self.s = false;
		}
		
		if(!self.isBot){
			self.checkPlanetCollision();
			if(tick % 50 == 0 && planets[self.sy][self.sx].color === self.color) self.money++; // Earn $.5/sec for being in a sector w/ your color planet
			self.checkDisconnect(); // Did we lose communications?
		}
		
		self.move();
		self.energy+=reloadVal * .35*(self.superchargerTimer>0?2:1);
		if(self.energy > 100) self.energy = 100;
		if(self.health < self.maxHealth) self.health+=playerHeal;
		
		self.fire();
	}
	self.fire = function(){
		if(self.c) self.shootEliteWeapon();
		if(self.bulletQueue > 0)self.shootBullet(40); // SMG
		var wepId = self.weapons[self.equipped];
		// HACK: self.equppied is undefined before first base interaction(???). Alex!
		wepId = (wepId === undefined) ? 0 : wepId;
		var wep = wepns[wepId];
		
		if(self.space && wepId >= 0 && self.reload < -.01 && self.energy > wep.energy){
		
			//In case of insufficient ammo
			if(self.ammos[self.equipped] == 0){
				self.reload = Math.min(wep.Charge,10);
				send(self.id,"sound", {file:"noammo", x:self.x, y:self.y});
				return;
			} else if(self.ammos[self.equipped]>0) self.ammos[self.equipped]--;
			
			if(wep.Level > self.ship){
				send(self.id,"chat",{msg:'This weapon is incompatible with your current ship!', color:'yellow'});
				return;
			}
			
			if(wepId == 40 && self.bulletQueue == 0 && self.energy > wep.energy * 5){ // Submachinegun physics
				self.bulletQueue += 5;
				self.ammos[self.equipped]-=4; // 4 not 5 because the previous if did 1.
				sendWeapons(self);
				return;
			}
			
			//Traditional Weapons
			
			// <= 6 are traditional guns. 28 = Grav Bomb, 39 = Spreadshot
			if(wepId <= 6 || wepId == 28 || wepId == 39) self.shootBullet(wepId);
			
			// <= 9 are plasma, laser, hadron beams. 35: Energy Leech, 26: Mining Laser, 30: Ion Mine Beam, 31: Gyrodynamite
			else if(wepId <= 9 || wepId == 35 || wepId == 26 || wepId == 30 || wepId == 31) self.shootBeam(self, false);
			
			//Traditional missiles. 38: Proximity Fuze
			else if(wepId <= 14||wepId == 38) self.shootMissile();
			
			// <= 17: Traditional Mines, 32: Impulse Mine, 33: Grenades
			else if(wepId <= 17 || wepId == 32 || wepId == 33) self.shootMine();
			
			//Energy Disk
			else if(wepId == 37) self.shootOrb();
			
			// 34: Muon Ray, 25: EMP Blast, 41: Hypno Ray
			else if(wepId == 34 || wepId == 25 || wepId == 41) self.shootBlast();
			
			
			
			//Timery Weapons
			
			else if(wepId == 36 || wepId == 18 || wepId == 19 || wepId == 29){
				self.energy-=wep.energy;
				self.reload = wep.Charge;
				
				//Supercharger
				if(wepId == 36) self.superchargerTimer = 1500;//1 min
				
				//Hull Nanobots
				else if(wepId == 18) self.health += Math.min(80, self.maxHealth - self.health); // min prevents overflow
				
				//Photon Cloak
				else if(wepId == 19) self.disguise = 150;//6s
				
				//Warp Drive
				else if(wepId == 29) self.speed = self.thrust * (self.ship == 16?700:500);
			
			}
			
			
			
			//Movey Weapons
			
			//Pulse Wave
			else if(wepId == 23){
				sendAllSector('sound', {file:"bigboom",x:self.x, y:self.y, dx:Math.cos(self.angle) * self.speed, dy:Math.sin(self.angle)*self.speed}, self.sx, self.sy);
				for(var i in players[self.sy][self.sx]){
					var p = players[self.sy][self.sx][i];
					if(p.color !== self.color){ // only enemies
						var d2 = squaredDist(self,p); // distance squared between me and them
						if(d2 > square(10*wep.Range)) continue; // if out of range, then don't bother.
						var ang = angleBetween(self,p); // angle from the horizontal
						var vel = -10000 / Math.log(d2); // compute how fast to accelerate by
						p.vx += Math.cos(ang) * vel; // actually accelerate them
						p.vy += Math.sin(ang) * vel;
						p.gyroTimer = 25; // Make sure the player is drifting or else physics go wonk
						p.updatePolars(); // We changed their rectangular velocity.
					}
				}
				self.energy -= wep.energy;
				self.reload = wep.Charge;
			}
			
			//Electromagnet
			else if(wepId == 24){ // identical structurally to pulse wave, see above for comments.
				for(var i in asts[self.sy][self.sx]){
					var a = asts[self.sy][self.sx][i];
					var d2 = squaredDist(self,a);
					if(d2 > square(10*wep.Range)) continue; // These 10* are because the user sees 1 pixel as .1 distance whereas server sees it as 1 distance... or something like that
					var ang = angleBetween(self,a);
					var vel = 500000/Math.max(d2,200000);
					a.vx += Math.cos(ang) * vel;
					a.vy += Math.sin(ang) * vel;
				}
				for(var i in players[self.sy][self.sx]){
					var p = players[self.sy][self.sx][i];
					if(p.id != self.id){ // Not the user
						var d2 = squaredDist(self,p);
						if(d2 > square(10*wep.Range)) continue;
						var ang = angleBetween(self,p);
						var vel = 3000000/Math.max(d2,1000000);
						p.vx += Math.cos(ang) * vel;
						p.vy += Math.sin(ang) * vel;
						p.gyroTimer = 25;
						p.updatePolars();
					}
				}
				self.energy -= wep.energy;
				self.reload = wep.Charge;
			}
			
			
			
			//Misc
			
			//Turret
			else if(wepId == 27){
				if(self.x < sectorWidth / 4 || self.x > 3*sectorWidth/4 || self.y < sectorWidth / 4 || self.y > 3*sectorWidth/4){
					send(self.id, "chat",{msg:'Your turret must be closer to the center of the sector!', color:'yellow'});
					self.space = false;
					return;
				}
				if(bases[self.sy][self.sx] != 0){
					send(self.id, "chat",{msg:'There can only be one turret in any sector!', color:'yellow'});
					self.space = false;
					return;
				}
				var r = Math.random();
				var b = Base(r, false, self.sx, self.sy, self.color, self.x, self.y);
				b.owner = self.name;
				bases[self.sy][self.sx] = b;
				send(self.id, "chat",{msg:'You placed a turret! Coming soon, you will be able to name it.', color:'yellow'});
				self.reload =wep.Charge;
				self.energy-=wep.energy;
			}
			
			//Turbo
			else if(wepId == 21){
				var isDrifting = (self.e || self.gyroTimer > 0) && (self.a!=self.d);
				var mult = isDrifting?1.025:1.017; // Faster when drifting.
				
				var energyTake = wep.energy; // this structure lets the user still use turbo at limited capacity when they're out of energy.
				if(self.energy < wep.energy * 2){
					mult = 1 + (mult - 1) * 3.5 / 8;
					energyTake = .35;
				}
				
				self.speed*=mult;
				self.vx *= mult;
				self.vy *= mult;
				//no need to updatePolars, since force is parallel with the player... i think? is that the case when drifting?
				
				if(isDrifting && !self.driftAchs[5] && self.w){ // Forced Induction
					self.driftAchs[5] = true;
					self.sendAchievementsDrift(true);
				}
				else if(isDrifting && self.s && !self.driftAchs[10]){ // Reverse Turbo Drift
					self.driftAchs[10] = true;
					self.sendAchievementsDrift(true);
				}
				self.energy-=energyTake;
				self.reload = wep.Charge;// TODO can we put these all at the bottom of fire()?
			}
			
			//Hyperdrive
			else if(wepId == 22){
				var isDrifting = (self.e || self.gyroTimer > 0) && (self.a!=self.d);
				send(self.id,"sound", {file:"hyperspace", x:self.x, y:self.y});
				self.hyperdriveTimer = 200;
				if(isDrifting && self.w && !self.driftAchs[6]){ // Hyper-drift
					self.driftAchs[6] = true;
					self.sendAchievementsDrift(true);
				}
				self.energy-=wep.energy;
				self.reload = wep.Charge;
			}
			
			//If we run out of ammo on a one-use weapon, delete that weapon.
			if(self.ammos[self.equipped] == -2){
				self.weapons[self.equipped] = -1;
				self.save(); // And save, to prevent people from shooting then logging out if they don't succeed with it.
			}
			
			sendWeapons(self);
		}
	}
	self.shootEliteWeapon = function(){
		if(self.ship == 16){ // Elite Raider
			//This effectively just shoots turbo.
			self.reload -= wepns[21].Charge; // Turbo
			var mult = ((self.e || self.gyroTimer > 0) && self.w && (self.a!=self.d))?1.025:1.017;
			var energyTake = wepns[21].energy;
			if(self.energy < wepns[21].energy * 2){
				mult = 1 + (mult - 1) * 5 / 8;
				energyTake = .35;
			}
			self.speed*=mult;
			self.vx *= mult;
			self.vy *= mult;
			self.energy-=energyTake;
		}
		if(self.ship == 17 && self.iron >= 250 && self.silver >= 250 && self.aluminium >= 250 && self.platinum >= 250 && self.reload <= 0){ // Quarrier
			self.iron -= 250; // This just shoots an asteroid out of the ship as if it were a bullet.
			self.silver -= 250;
			self.aluminium -= 250;
			self.platinum -= 250;
			var r = Math.random();
			var a = new Asteroid(r,1000,self.sx,self.sy, Math.floor(Math.random()*4));
			a.x = self.x+Math.cos(self.angle) * 256;
			a.y = self.y+Math.sin(self.angle) * 256;
			a.vx = Math.cos(self.angle) * 15;
			a.vy = Math.sin(self.angle) * 15;
			asts[self.sy][self.sx][r] = a;
			self.reload = 50;
		}
		if(self.ship == 18 && self.energy > 0) self.shootBullet(39); // Built in spreadshot
	}
	self.checkDisconnect = function(){
		if(self.pingTimer-- < 0){
			var text = "~`"+self.color+"~`"+self.name + "~`yellow~` disconnected!";
			lefts[self.id] = 0; // note me for deletion
			console.log(text);
			chatAll(text);
			return;
		}
	}
	self.move = function(){
		
		if(self.hyperdriveTimer>0){
			self.hyperdriveTimer--;
			self.speed = (10000-square(100-self.hyperdriveTimer))/(self.ship == 16?7:10);
		}
		
		if(self.isNNBot) self.nnBotPlay();
		else if(self.isBot) self.botPlay(); // simulates a player and presses keys.
		
		var amDrifting = self.e || self.gyroTimer > 0;
		var ore = self.iron + self.silver + self.platinum + self.aluminium;

		//In english, your thrust is (self.thrust = your ship's thrust * thrust upgrade). Multiply by 1.8. Double if using supercharger. Reduce if carrying lots of ore. If drifting, *=1.6 if elite raider, *=1.45 if not.
		var newThrust = self.thrust * (self.superchargerTimer>0?2:1) * 1.8 / ((ore / self.capacity + 3)/3.5) * ((amDrifting && self.w && (self.a!=self.d))?(self.ship == 16?1.6:1.45):1);
		
		//Reusable Trig
		var ssa = Math.sin(self.angle), ssd = Math.sin(self.driftAngle), csa = Math.cos(self.angle), csd = Math.cos(self.driftAngle);
		
		self.vx = csd * self.speed; // convert polars to rectangulars
		self.vy = ssd * self.speed;
		self.vx*=(amDrifting && self.w && (Math.abs(self.cva) > self.va * .999))?.94:.92;
		self.vy*=(amDrifting && self.w && (Math.abs(self.cva) > self.va * .999))?.94:.92; //Air resistance
		
		if(self.w){ // Accelerate!
			self.vx += csa * newThrust;
			self.vy += ssa * newThrust;
		}
		if(self.s && amDrifting){ // Accelerate backwards, at half speed!
			self.vx -= csa * newThrust/2;
			self.vy -= ssa * newThrust/2;
		}
		
		self.updatePolars();//convert back to polars
		
		
		if(!amDrifting){ // Terraced angular decelerationy stuff to continuously match driftAngle (angle of motion) to the actual angle the ship is pointing
			self.noDrift++;
			if(self.noDrift > 18) self.driftAngle = self.angle;
			else if(self.noDrift > 12) self.driftAngle = findBisector(self.driftAngle, self.angle);
			else if(self.noDrift > 7) self.driftAngle = findBisector(findBisector(self.driftAngle, self.angle), self.driftAngle);
			else if(self.noDrift > 3) self.driftAngle = findBisector(findBisector(findBisector(self.driftAngle, self.angle), self.driftAngle), self.driftAngle);
			else self.driftAngle = findBisector(findBisector(findBisector(findBisector(self.driftAngle, self.angle), self.driftAngle), self.driftAngle), self.driftAngle);//This happens immediately after shift released, noDrift increases with time.
		} else { // In drift.
			self.gyroTimer--;
			if(self.a!=self.d){
				if(self.w) self.driftTimer++;
				else if(self.s && !self.driftAchs[7]){ // I can go backwards!?!
					self.driftAchs[7] = true;
					self.sendAchievementsDrift(true);
				}
			}
			self.noDrift = 0; // Time elapsed since last drift
		}
		
		self.x+=self.vx; // Update position from velocity
		self.y+=self.vy;
		if(self.jukeTimer > 1 || self.jukeTimer < -1){ // Q or E keys. Juke mechanics.
			self.x += self.jukeTimer * Math.sin(self.angle);
			self.y -= self.jukeTimer * Math.cos(self.angle);
			self.jukeTimer*=.8;
		}
		
		var angAccel = 0; // angular acceleration
		if(self.a) angAccel -= (self.va + self.cva / (amDrifting?1.5:1)) / 3;
		if(self.d) angAccel += (self.va - self.cva / (amDrifting?1.5:1)) / 3; // ternary reduces angular air resistance while drifting
		if(self.superchargerTimer > 0) angAccel *= 2;
		self.cva += angAccel; // update angular velofity from thrust
		if(!self.d && !self.a && !amDrifting) self.cva /= 2; // When not drifting, apply air resistance to angular velocity.
		
		//If we have a drift trail, we turn faster. Generators reduce turning speed.
		self.angle += self.cva*(1-self.generators/10)*(self.trail % 16 == 3?1.05:1) / 1.5;
		
		//Make sure everything is in the range 0-2pi
		self.driftAngle += Math.PI * 4;
		self.angle += Math.PI * 4;
		self.driftAngle %= Math.PI * 2;
		self.angle %= Math.PI * 2;
		
		self.testSectorChange();

		if(tick % 15 == 0) self.checkQuestStatus(false);
		if(tick % 2 == 0) return;
		
		self.checkMineCollision();
	}
	self.checkMineCollision = function(){
		for(var i in mines[self.sy][self.sx]){
			var m = mines[self.sy][self.sx][i];
			if(m.color!=self.color && m.wepnID != 32){ // enemy mine and not 
				if(m.wepnID != 16 && squaredDist(m,self) < square(16 + ships[self.ship].width)){
					self.dmg(m.dmg, m); // damage me
					if(m.wepnID == 17) self.EMP(50); // emp mine
					m.die();
					break;
				}else if(m.wepnID == 16 && squaredDist(m,self) < square(wepns[m.wepnID].Range + ships[self.ship].width)){ // TODO range * 10?
					var r = Math.random(); // Laser Mine
					var beam = Beam(m.owner, r, 400, self, m); // shoot a laser. TODO is this m supposed to be m.owner?
					beams[self.sy][self.sx][r] = beam;
					sendAllSector('sound', {file:"beam",x: m.x, y: m.y}, m.sx, m.sy);
					m.die();
				}
			}
		}
	}
	self.testSectorChange = function(){
		var old_sx = self.sx;
		var old_sy = self.sy;
		
		var giveBounce = false; // did they bounce on a galaxy edge?
		if(self.x > sectorWidth){//check each edge of the 4 they could bounce on
			self.x = 1;
			self.sx++;
			if(self.sx >= mapSz || self.guest || (trainingMode && self.isNNBot)){ // guests cant cross borders, nobody can go outside the galaxy
				giveBounce = true;
				self.sx--;
				self.x = (sectorWidth-5);
				self.driftAngle = self.angle = 3.1415 - self.angle;
				self.vx *= -1;
			}
			else self.borderJumpTimer += 100;
		}
		else if(self.y > sectorWidth){
			self.y = 1;
			self.sy++;
			if(self.sy >= mapSz || self.guest || (trainingMode && self.isNNBot)){
				giveBounce = true;
				self.sy--;
				self.y = (sectorWidth-5);
				self.driftAngle = self.angle = -self.angle;
				self.vy *= -1;
			}
			else self.borderJumpTimer += 100;
		}
		else if(self.x < 0){
			self.x = (sectorWidth-1);
			self.sx--;
			if(self.sx < 0 || self.guest || (trainingMode && self.isNNBot)){
				giveBounce = true;
				self.sx++;
				self.x = 5;
				self.driftAngle = self.angle = 3.1415 - self.angle;
				self.vx *= -1;
			}
			else self.borderJumpTimer += 100;
		}
		else if(self.y < 0){
			self.y = (sectorWidth-1);
			self.sy--;
			if(self.sy < 0 || (self.guest) || (trainingMode && self.isNNBot)){
				giveBounce = true;
				self.sy++;
				self.y = 5;
				self.driftAngle = self.angle = -self.angle;
				self.vy *= -1;
			}
			else self.borderJumpTimer += 100;
		}
		if(giveBounce && !self.randmAchs[5]){
			if(self.guest) send(self.id, "chat", {msg:"~`orange~`You must create an account to explore the universe!"});
			else{
				self.randmAchs[5] = true;
				self.sendAchievementsMisc(true);
			}
		}
		
		if(self.borderJumpTimer > 100){ // damage for running away from fights
			self.health = (self.health-1)*.9+1;
			self.borderJumpTimer = 50;
		}
		
		if(old_sx !== self.sx || old_sy !== self.sy) {
			delete players[old_sy][old_sx][self.id];

			players[self.sy][self.sx][self.id] = self;
			self.onChangeSectors();
		} 
		
	}
	self.juke = function(left){
		if(self.energy < 7.5) return;
		self.energy -= 7.5;
		self.jukeTimer = (self.trail % 16 == 4?1.25:1)*(left?50:-50); // misc trail makes you juke further.
	}
	self.mute = function(minutes){
		chatAll("~`violet~`" + self.name + "~`yellow~` has been " + (minutes > 0?"muted for " + minutes + " minutes!" : "unmuted!"));
	}
	self.onChangeSectors = function(){
		send(self.id, "clrBullets", {});
		
		//track my touched corners
		if(self.sx==0){
			if(self.sy==0 && (self.cornersTouched & 1) != 1) self.cornersTouched++;
			else if(self.sy==mapSz-1 && (self.cornersTouched & 2) != 2) self.cornersTouched+=2;
		}else if(self.sx==mapSz-1){
			if(self.sy==0 && (self.cornersTouched & 4) != 4) self.cornersTouched+=4;
			else if(self.sy==mapSz-1 && (self.cornersTouched & 8) != 8) self.cornersTouched+=8;
		}
		if(self.cornersTouched == 15){
			self.randmAchs[7] = true;
			self.sendAchievementsMisc(true);
		}
		
		if(self.sx == 3 && self.sy == 3 && self.quest.type === "Secret3"){
			self.spoils("money",self.quest.exp); // reward the player
			self.spoils("experience", Math.floor(self.quest.exp / 4000));
			
			noteLocal('Quest Completed!', self.x, self.y - 96, self.id); // variable width
			self.hasPackage = false;
			if((self.questsDone & 8) == 0) self.questsDone+=8;
			
			self.quest = 0; // reset quest and tell the client
			send(self.id, 'quest', {quest: self.quest});
			
			if(!self.moneyAchs[9]){ // Questor
				self.moneyAchs[9] = true;
				self.sendAchievementsCash(true);
			}
			if(self.questsDone == 15 && !self.moneyAchs[10]){ // Adventurer
				self.moneyAchs[10] = true;
				self.sendAchievementsCash(true);
			}
		}
		
		if(self.quest != 0 && self.quest.type === "Secret" && self.sx == self.quest.sx && self.sy == self.quest.sy){ // advance in secret quest to phase 2
			self.quest = {type:"Secret2", exp:self.quest.exp, sx:self.quest.sx, sy:self.quest.sy};
			send(self.id, 'quest', {quest: self.quest});
		}
		
		//tell client what's in this sector
		self.getAllBullets();
		self.getAllPlanets();
		
		//update list of visited sectors.
		var index = self.sx + self.sy * mapSz;
		var prevStr = self.planetsClaimed.substring(0,index);
		var checkStr = self.planetsClaimed.substring(index, index+1);
		var postStr = self.planetsClaimed.substring(index+1,mapSz*mapSz);
		if(checkStr !== "2") self.planetsClaimed = prevStr + "1" + postStr;
		
		if(!self.planetsClaimed.includes("0") && !self.randmAchs[6]){
			self.randmAchs[6] = true;
			self.sendAchievementsMisc(true);
		}
		
	}
	self.botPlay = function(){ // don't mess with this pls
		if(self.empTimer > 0) return;//cant move if i'm emp'd
		
		self.equipped = 0;
		while(self.ammos[self.equipped] == 0) self.equipped++; // select the first available weapon with ammo
		var range = square(wepns[self.equipped].Range * 10);
		
		self.w = self.e = self.s = self.c = self.space = false; // release all keys
		
		//Find closest enemy and any friendly in the sector
		var target = 0, close = 100000000;
		var anyFriend = 0;
		var friendlies = 0, enemies = 0;//keep track of the player counts in the sector
		for(var p in players[self.sy][self.sx]){
			var player = players[self.sy][self.sx][p];
			if(self.id == player.id || player.disguise > 0) continue;
			if(player.color === self.color) {if(friendlies++>3)anyFriend=player; continue;}
			enemies++;
			var dist2 = hypot2(player.x, self.x, player.y, self.y);
			if(dist2 < close){target = player;close = dist2;}
		}
		
		//Move towards the enemy
		var movex = 0, movey = 0;
		if(target != 0) {movex = target.x - self.x; movey = target.y - self.y;}
		
		var base = bases[self.sy][self.sx];
		if(base != 0 && base.color != self.color){
			var dist2 = hypot2(base.x, self.x, base.y, self.y);
			if(friendlies > 0 && enemies == 0) target = base;
			else if(dist2 < square(10*sectorWidth/2)) {movex = self.x - base.x; movey = self.y - base.y;}
		}
		
		//at random, fill my ammo or die if there are no enemies to fight
		if(enemies == 0 && Math.random() < .001) self.refillAllAmmo();
		if(enemies == 0 && Math.random() < self.deleteRate) self.die();
		
		if(target == 0) target = anyFriend;
		
		if(movex == 0 && movey == 0 && anyFriend == 0){//flocking
			self.d = Math.random() < .1;
			self.a = Math.random() < .1;
			self.w = true;
			if(self.brainwashedBy != 0){
				var player = players[self.brainwashedBy];
				if(typeof player === "undefined")return;
				var myX = self.x + self.sx * sectorWidth;
				var myY = self.y + self.sy * sectorWidth;
				var theirX = player.x + player.sx * sectorWidth;
				var theirY = player.y + player.sy * sectorWidth;
				var turn = -(self.angle-Math.atan2(theirY-myY,theirX-myX) + Math.PI * 21) % (2*Math.PI) + Math.PI;
				self.d = turn>self.cva*self.cva * 10;
				self.a = turn<-self.cva*self.cva * 10;
			}
		} else if(target == 0){//escaping base
			var turn = -(self.angle-Math.atan2(base.y-self.y,base.x-self.x) + Math.PI * 21) % (2*Math.PI) + Math.PI;
			self.a = turn>self.cva*self.cva * 10;
			self.d = turn<-self.cva*self.cva * 10;
			self.w = true;
		} else if(anyFriend != 0 || (self.energy < 5 || self.reload > 50 || self.health < self.maxHealth/3)){//fleeing
			var turn = -(self.angle-Math.atan2(target.y-self.y,target.x-self.x) + Math.PI * 21) % (2*Math.PI) + Math.PI;
			self.a = turn>self.cva*self.cva * 10;
			self.d = turn<-self.cva*self.cva * 10;
			self.w = true;
		}else{//fighting
			self.space = self.e = close < range * 1.2;
			var turn = -(self.angle-calculateInterceptionAngle(target.x,target.y,target.vx,target.vy,self.x,self.y) + Math.PI * 21) % (2*Math.PI) + Math.PI;
			self.d = turn>self.cva*self.cva * 10;
			self.a = turn<-self.cva*self.cva * 10;
			self.s = self.space && Math.abs(turn)>Math.PI/2 && close > Math.min(range * .75, 60*60);
			self.w = Math.abs(turn)<Math.PI/2 && close > Math.min(range * .75, 60*60);
		}
	}
	self.nnBotPlay = function(){
		//Play for a neural network bot
		if(tick % 5 != Math.floor(self.id * 5)) return; //Don't go too crazy running the whole network each tick. Lag prevention.

		if(self.net === 1){ // If we haven't yet initialized a neural net
			self.net = new NeuralNet();
			self.net.load();
		}

		if(self.empTimer > 0) return;//cant move if i'm emp'd
		
		self.equipped = 0; // select first weapon with ammo
		while(self.ammos[self.equipped] == 0) self.equipped++;
		var range = square(wepns[self.equipped].Range * 10);
		
		var totalFriends = 0; // in sector
		var totalEnemies = 0;
		var sumFriendRank = 0; // sum of ranks of all friends in this sector. Not using yet.
		var sumEnemyRank = 0;
		
		//Find the closest friend and enemy
		var target = 0, friend = 0, closeE = 100000000, closeF = 100000000;
		for(var p in players[self.sy][self.sx]){
			var player = players[self.sy][self.sx][p];
			if(self.id == player.id || player.disguise > 0) continue;
			if(player.color === self.color) {
				totalFriends++;
				var dist2 = squaredDist(player, self);
				if(dist2 < closeF){friend = player;closeF = dist2;}
			}else{
				totalEnemies++;
				var dist2 = squaredDist(player, self);
				if(dist2 < closeE){target = player;closeE = dist2;}
			}
		}
		
		//same as in botPlay
		if(totalEnemies == 0 && Math.random() < .005) self.refillAllAmmo();
		if(totalEnemies == 0 && Math.random() < self.deleteRate) self.die();
		
		//make input array (into neural net). Normalize the variables to prevent overflow
		var input = {};
		input[0] = self.rank / 8.;
		input[1] = self.ammos[self.equipped] / 50;
		input[2] = self.health / self.maxHealth;
		input[3] = self.energy / 100.;
		input[4] = self.reload / 50;
		input[5] = self.speed / 100;
		input[6] = self.cva;

		input[7] = target == 0? 0:1;
		input[8] = target == 0? 0:Math.atan2(target.y - self.y, target.x - self.x) - self.angle;
		input[9] = Math.sqrt(closeE) / 100;

		input[10] = friend == 0? 0:1;
		input[11] = friend == 0? 0:Math.atan2(friend.y - self.y, friend.x - self.x) - self.angle;
		input[12] = Math.sqrt(closeF) / 100;

		input[13] = target == 0? 0:target.angle;
		input[14] = target == 0? 0:target.speed;
		input[15] = target == 0? 0:target.ship;
		
		//forward NN
		var out = self.net.passThrough(input);
		
		//Set controls to output array
		self.space = out[0];
		self.e = out[1];
		self.w = out[2];
		self.s = out[3];
		self.a = out[4];
		self.d = out[5];
	}
	self.checkPlanetCollision = function(){
		
		var p = planets[self.sy][self.sx];
		
		//if out of range, return. Only try this once a second.
		if(tick % 25 != 0 || squaredDist(p,self) > square(512)) return;
			
		//cooldown to prevent chat spam when 2 people are on the planet
		var cool = p.cooldown;
		if(cool < 0){self.refillAllAmmo();p.cooldown = 150;}
		
		self.checkQuestStatus(true); // lots of quests are planet based
		
		if(self.guest) {
			sockets[self.id].emit("chat",{msg:'You must create an account in the base before you can claim planets!', color:'yellow'});
			return;
		}
		
		if(typeof self.quest !== "undefined" && self.quest != 0 && self.quest.type === "Secret2" && self.quest.sx == self.sx && self.quest.sy == self.sy){ // move on to last secret stage
			
			//compute whether there are any unkilled enemies in this sector
			var cleared = true;
			for(var player in players[self.sy][self.sx]){
				if (player.color != self.color) {
					cleared = false;
					break;
				}
			}
			if(cleared && bases[self.sy][self.sx] != 0 && bases[self.sy][self.sx].turretLive) cleared = false;//also check base is dead
			
			if(cleared){ // 2 ifs needed, don't merge this one with the last one
				self.hasPackage = true;
				self.quest = {type:"Secret3", exp:self.quest.exp};
				send(self.id, 'quest', {quest: self.quest}); //notify client
			}
		}
		
		if(p.color === self.color || cool > 0) return;
		
		p.color = self.color; // claim
		p.owner = self.name;
		sendAll('chat', {msg:'Planet ' + p.name + ' claimed by ~`' + self.color + '~`' + self.name + "~`yellow~`!"});
		
		for(var i in players[self.sy][self.sx]) players[self.sy][self.sx][i].getAllPlanets();//send them new planet data
		
		if(!self.randmAchs[8]){ // Astronaut
			self.randmAchs[8] = true;
			self.sendAchievementsMisc(true);
		}
		
		//Update list of claimed planets.
		var index = self.sx + self.sy * mapSz;
		var prevStr = self.planetsClaimed.substring(0,index);
		var postStr = self.planetsClaimed.substring(index+1,mapSz*mapSz);
		self.planetsClaimed = prevStr + "2" + postStr;
		
	}
	self.checkQuestStatus = function(touchingPlanet){
		
		if(self.quest == 0 || self.isBot) return;// no point if the person hasn't got a quest rn.
		
		if(self.quest.type === 'Mining' && self.sx == self.quest.sx && self.sy == self.quest.sy){
				
			//check the player has sufficient metal according to quest
			if(self.quest.metal == 'aluminium' && self.aluminium < self.quest.amt) return;
			if(self.quest.metal == 'iron' && self.iron < self.quest.amt) return;
			if(self.quest.metal == 'silver' && self.silver < self.quest.amt) return;
			if(self.quest.metal == 'platinum' && self.platinum < self.quest.amt) return;
			
			//take the amount from them
			if(self.quest.metal == 'aluminium') self.aluminium -= self.quest.amt;
			if(self.quest.metal == 'iron') self.iron -= self.quest.amt;
			if(self.quest.metal == 'silver') self.silver -= self.quest.amt;
			if(self.quest.metal == 'platinum') self.platinum -= self.quest.amt;
			
			//reward them
			self.spoils("money",self.quest.exp);
			self.spoils("experience",Math.floor(self.quest.exp / 1500));
			noteLocal('Quest Completed!', self.x, self.y - 96, self.id); // variable width
			
			self.quest = 0;
			send(self.id, 'quest', {quest: self.quest}); // tell client quest is over
			
			if(!self.moneyAchs[9]){ // Questor
				self.moneyAchs[9] = true;
				self.sendAchievementsCash(true);
			}
			
			if((self.questsDone & 1) == 0) self.questsDone+=1;
			
		}else if(self.quest.type === 'Delivery' && touchingPlanet){
			
			//pickup
			if(self.sx == self.quest.sx && self.sy == self.quest.sy && !self.hasPackage){
				self.hasPackage = true;
				strongLocal("Package obtained!", self.x, self.y - 192, self.id)
			}
			
			//dropoff
			if(self.hasPackage && self.sx == self.quest.dsx && self.sy == self.quest.dsy){
				
				self.spoils("money",self.quest.exp);//reward
				self.spoils("experience",Math.floor(self.quest.exp / 1500));
				noteLocal('Quest Completed!', self.x, self.y - 96, self.id); // variable width
				
				self.hasPackage = false;
				self.quest = 0;
				send(self.id, 'quest', {quest: self.quest}); // tell client it's over
				if((self.questsDone & 2) == 0) self.questsDone+=2;
				
				if(!self.moneyAchs[9]){ // Questor
					self.moneyAchs[9] = true;
					self.sendAchievementsCash(true);
				}
				
			}
			
		}
		
		if(self.questsDone == 15 && !self.moneyAchs[10]){ // Adventurer
			self.moneyAchs[10] = true;
			self.sendAchievementsCash(true);
		}
		
	}
	self.baseKilled = function(){
		
		if(self.isBot) return;
		
		self.baseKills++;
		
		//achievementy stuff
		self.killsAchs[7] = self.baseKills >= 1;
		self.killsAchs[8] = self.baseKills >= 100;
		self.sendAchievementsKill(true);
		
		//base quest checking
		if(self.quest != 0 && self.quest.type == 'Base'){
			if(self.sx == self.quest.sx && self.sy == self.quest.sy){
				
				// reward player
				self.spoils("money",self.quest.exp);
				self.spoils("experience",Math.floor(self.quest.exp / 4000));
				strongLocal('Quest Completed!', self.x, self.y - 96, self.id); // variable width
				
				self.quest = 0; //tell client it's done
				send(self.id, 'quest', {quest: self.quest});
				if((self.questsDone & 4) == 0) self.questsDone+=4;
				
				if(!self.moneyAchs[9]){ // Questor
					self.moneyAchs[9] = true;
					self.sendAchievementsCash(true);
				}
				
			}
		}
		
		if(self.questsDone == 15 && !self.moneyAchs[10]){ // Adventurer
			self.moneyAchs[10] = true;
			self.sendAchievementsCash(true);
		}
		
	}
	self.updateRank = function(){
		
		var prerank = self.rank;
		self.rank = 0;
		while(self.experience > ranks[self.rank]) self.rank++; //increment until we're in the right rank's range
		
		//congratulations!
		if(self.rank != prerank) strongLocal('Rank Up!', self.x, self.y - 64, self.id);
	}
	self.dock = function(){
		
		if(self.isBot) return; // can bots even get to this point in code?
		
		if(self.docked){ // undock if already docked. This toggles the player's dock status
		
			self.getAllBullets();
			self.getAllPlanets(); // tell client what's out in the sector
			
			self.docked = false;
			
			players[self.sy][self.sx][self.id] = self;
			delete dockers[self.id];
			
			self.leaveBaseShield = 25;
			self.health = self.maxHealth;
			self.energy = 100;
			return;
		}
		
		self.checkTrailAchs();
		
		var base = 0;
		var b = bases[self.sy][self.sx];
		if(b.isBase && b.color == self.color && squaredDist(self,b) < square(512)) base = b; // try to find a base on our team that's in range and isn't just a turret
		if(base == 0) return;
		
		self.refillAllAmmo();
		self.x = self.y = sectorWidth/2;
		self.save();
		self.docked = true;
		
		dockers[self.id] = self;
		delete players[self.sy][self.sx][self.id];
		
		self.sendStatus();
	}
	self.shootBullet = function(currWep){
		if(self.bulletQueue > 0){ // Submachinegun
			if(self.ammos[self.equipped] <= 0) return;
			self.bulletQueue--;
			currWep = 40;
		}
		
		self.energy-=wepns[currWep].energy;
		self.reload = wepns[currWep].Charge;
		
		//how many bullets are we firing?
		var n = 1;
		if(currWep == 4)  n = 4; // shotgun
		if(currWep == 39) n = 3; // spreadshot
		if(currWep == 6)  n = 2; // minigun
		
		for(var i = 0; i < n; i++){
			var r = Math.random();
			
			//find the angle of the bullets. Manipulate if one of the multi-bullet weapons.
			var bAngle = self.angle;
			if(currWep == 2) bAngle-=3.1415; // reverse gun
			if(currWep == 39) bAngle += ((i-1)/4); // spreadshot
			if(currWep == 4) bAngle += Math.random() - .5; // shotgun
			
			var bullet = Bullet(self, r, currWep, bAngle, i * 2 - 1);
			bullets[self.sy][self.sx][r] = bullet;
			sendAllSector('sound', {file:(currWep == 5 || currWep == 6 || currWep == 39)?"minigun":"shot",x: self.x, y: self.y}, self.sx, self.sy);
		}
	}
	self.shootMissile = function(){
		var r = Math.random();
		var bAngle = self.angle;
		var missile = Missile(self, r, self.weapons[self.equipped], bAngle);
		missiles[self.sy][self.sx][r] = missile;
		sendAllSector('sound', {file:"missile",x: self.x, y: self.y}, self.sx, self.sy);
		
		self.reload = wepns[self.weapons[self.equipped]].Charge;
		self.energy-=wepns[self.weapons[self.equipped]].energy;
	}
	self.shootOrb = function(){
		var r = Math.random();
		var orb = Orb(self, r, self.weapons[self.equipped]);
		orbs[self.sy][self.sx][r] = orb;
		sendAllSector('sound', {file:"beam",x: self.x, y: self.y}, self.sx, self.sy);
		
		self.reload = wepns[self.weapons[self.equipped]].Charge;
		self.energy-=wepns[self.weapons[self.equipped]].energy;
	}
	self.shootMine = function(){
		if(Object.keys(mines[self.sy][self.sx]).length >= 20 && self.weapons[self.equipped] < 30){
			self.ammos[self.equipped]++;
			self.reload = 5;
			send(self.id, "chat", {msg: "This sector has reached its limit of 20 mines."});
			return;
		}
		if(square(self.sx - sectorWidth/2) + square(self.sy - sectorWidth/2) < square(600 * 10)){
			self.ammos[self.equipped]++;
			self.reload = 5;
			send(self.id, "chat", {msg: "You may not place a mine here."});
			return;
		}
		var r = Math.random();
		var mine = Mine(self, r, self.weapons[self.equipped]);
		mines[self.sy][self.sx][r] = mine;
		sendAllSector('mine', {x: self.x, y: self.y}, self.sx, self.sy);
		
		self.reload = wepns[self.weapons[self.equipped]].Charge;
		self.energy-=wepns[self.weapons[self.equipped]].energy;
	}
	self.shootBeam = function(origin, restricted){// restricted is for recursive calls from quarriers
		var ox = origin.x, oy = origin.y;
		var nearP = 0; // target, which we will compute
		var range2 = square(wepns[self.weapons[self.equipped]].Range * 10);
		
		//base
		if(!restricted)
			if(self.weapons[self.equipped] == 7||self.weapons[self.equipped] == 8||self.weapons[self.equipped] == 9){
				var b = bases[self.sy][self.sx];
				if(b != 0 && b.color != self.color && b.turretLive && hypot2(b.x,ox,b.y,oy) < range2) nearP = b;
			}
		
		//search players
		if(!restricted)
			for(var i in players[self.sy][self.sx]){
				var p = players[self.sy][self.sx][i];
				if(p.ship != 17 && (self.weapons[self.equipped] == 26 || self.weapons[self.equipped] == 30)) continue; // elite quarrier is affected
				if(p.color == self.color || p.disguise > 0) continue;
				var dx = p.x - ox, dy = p.y - oy;
				var dist2 = dx*dx+dy*dy;
				if(dist2 < range2 && (nearP == 0 || dist2 < square(nearP.x - ox)+square(nearP.y - oy))) nearP = p;
			}
		
		//search asteroids
		if(nearP == 0 && self.weapons[self.equipped] != 35 && self.weapons[self.equipped] != 31)
			for(var i in asts[self.sy][self.sx]){
				var a = asts[self.sy][self.sx][i];
				if(a.sx != self.sx || a.sy != self.sy || a.hit) continue;
				var dx = a.x - ox, dy = a.y - oy;
				var dist2 = dx*dx+dy*dy;
				if(dist2 < range2 && (nearP == 0 || dist2 < square(nearP.x - ox)+square(nearP.y - oy))) nearP = a;
			}
		
		
		if(nearP == 0) return;
		
		//gyrodynamite
		if(self.weapons[self.equipped] == 31 && nearP.sx == self.sx && nearP.sy == self.sy && nearP.color != self.color){
			nearP.gyroTimer = 250;
			send(nearP.id, "gyro", {t:250});
		}
		
		//elite quarrier
		if(self.ship == 17 && nearP != 0 && nearP.type === "Asteroid"){
			nearP.hit = true;
			for(var i = 0; i < 3; i++) self.shootBeam(nearP, true);
		}
		
		var r = Math.random();
		var beam = Beam(self, r, self.weapons[self.equipped], nearP, origin);
		beams[self.sy][self.sx][r] = beam;
		sendAllSector('sound', {file:"beam",x: ox, y: oy}, self.sx, self.sy);
		
		self.reload = wepns[self.weapons[self.equipped]].Charge;
		if(!restricted) self.energy-=wepns[self.weapons[self.equipped]].energy; // don't take energy if it was a recursive shot from an asteroid
	}
	self.shootBlast = function(){
		var r = Math.random();
		var blast = Blast(self, r, self.weapons[self.equipped]);
		blasts[self.sy][self.sx][r] = blast;
		sendAllSector('sound', {file:"beam",x: self.x, y: self.y}, self.sx, self.sy);
		
		self.reload = wepns[self.weapons[self.equipped]].Charge;
		self.energy-=wepns[self.weapons[self.equipped]].energy;
	}
	self.die = function(b){ // b: bullet object or other object which killed us
		self.empTimer = -1;
		self.killStreak = 0;
		var diff = .02*self.experience;
		self.leaveBaseShield = 25;
		self.refillAllAmmo();
		if(typeof b === "undefined"){
			delete players[self.sy][self.sx][self.id];
			return;
		}
		sendAllSector('sound', {file:"bigboom",x:self.x, y:self.y, dx:Math.cos(self.angle) * self.speed, dy:Math.sin(self.angle)*self.speed}, self.sx, self.sy);
		
		if(b != 0){
			if(!self.isBot){

				//clear quest
				self.quest = 0;
				send(self.id, 'quest', {quest: 0});//reset quest and update client
				
				if(typeof b.owner !== "undefined" && b.owner.type === "Player"){
					sendAll('chat', {msg:("~`" + self.color + "~`" + self.name + "~`yellow~` was destroyed by ~`" + b.owner.color + "~`" + b.owner.name + "~`yellow~`'s `~"+b.wepnID+"`~!")});
					
					if(b.owner.w && b.owner.e && (b.owner.a || b.owner.d) && !b.owner.driftAchs[9]){ // driftkill
						b.owner.driftAchs[9] = true;
						b.owner.sendAchievementsDrift(true);
					}
				}

				//send msg
				else if(b.type == "Vortex") sendAll('chat', {msg:("~`" + self.color + "~`" + self.name + "~`yellow~` crashed into a black hole!")});
				else if(b.type == "Planet" || b.type == "Asteroid") sendAll('chat', {msg:("~`" + self.color + "~`" + self.name + "~`yellow~` crashed into an asteroid!")});
				else if(b.owner.type == "Base") sendAll('chat', {msg:("~`" + self.color + "~`" + self.name + "~`yellow~` was destroyed by an enemy base in sector " + b.owner.getSectorName() + "!")});

			}
			
			//drop a package
			var r = Math.random();
			if(self.hasPackage && !self.isBot) packs[self.sy][self.sx][r] = Package(self, r, 0); // an actual package (courier)
			else if(Math.random() < .004 && !self.guest) packs[self.sy][self.sx][r] = Package(self, r, 2);//life
			else if(Math.random() < .1 && !self.guest) packs[self.sy][self.sx][r] = Package(self, r, 3);//ammo
			else if(!self.guest) packs[self.sy][self.sx][r] = Package(self, r, 1);//coin
			
			//give the killer stuff
			if((b.owner != 0) && (typeof b.owner !== "undefined") && (b.owner.type === "Vortex" || b.owner.type === "Player" || b.owner.type === "Base")){
				b.owner.onKill(self);
				b.owner.spoils("experience",10+diff*(self.color===b.owner.color?-1:1));
				b.owner.spoils("money",1000*(b.owner.type === "Player"?b.owner.killStreak:1));
				
				if(self.points > 0){ // raid points
					b.owner.points++;
					self.points--;
				}
				
			}

		}
		
		self.hasPackage = false; // Maintained for onKill above
		delete players[self.sy][self.sx][self.id];

		//TODO Chris
		if(!self.isBot){
			self.health = self.maxHealth;
			var readSource = 'server/players/'+(self.name.startsWith("[")?self.name.split(" ")[1]:self.name) + "[" + hash(self.password) +'.txt';
			if(self.guest){
				self.lives--;
				self.sx = self.sy = (self.color == 'red' ? 2:4);
				self.x = self.y = sectorWidth/2;
				self.dead = true;
				if(self.lives <= 0) lefts[self.id] = 0;
				self.sendStatus();
				deads[self.id] = self;
				sendWeapons(self);
				return;
			}
			var fullFile = fs.readFileSync(readSource, "utf8");
			var fileData = fullFile.split(':');
			self.color = fileData[0];
			self.ship = parseFloat(fileData[1]);
			for(var i = 0; i < 9; i++) self.weapons[i] = parseFloat(fileData[3+i]);
			self.weapons[9] = parseFloat(fileData[83]);
			self.calculateGenerators();
			self.sx = Math.floor(parseFloat(fileData[12]));
			self.sy = Math.floor(parseFloat(fileData[13]));
			if(self.color === "blue" && self.sx == 4 && self.sy == 4){
				self.sx = 6;
				self.sy = 5;
			}else if(self.color === "red" && self.sx == 2 && self.sy == 2){
				self.sx = 0;
				self.sy = 1;
			}else self.sy=self.sx=(self.color==="blue"?4:2);
			self.name = fileData[14];
			self.trail = parseFloat(fileData[2]) % 16 + (self.name.includes(" ")?16:0);
			self.money = parseFloat(fileData[15]);
			self.kills = parseFloat(fileData[16]);
			self.planetsClaimed = fileData[17];
			self.iron = parseFloat(fileData[18]);
			self.silver = parseFloat(fileData[19]);
			self.platinum = parseFloat(fileData[20]);
			self.aluminium = parseFloat(fileData[21]);
			self.experience = parseFloat(fileData[22]) * .98;
			self.rank = parseFloat(fileData[23]);
			self.x = parseFloat(fileData[24]);
			self.y = parseFloat(fileData[25]);
			self.thrust2 = parseFloat(fileData[26]);
			self.radar2 = parseFloat(fileData[27]);
			if(fileData.length > 87)self.agility2 = parseFloat(fileData[87]);
			self.capacity2 = parseFloat(fileData[28]);
			self.maxhealth2 = parseFloat(fileData[29]);
			self.energy2 = parseFloat(fileData[84]);
			self.kill1 = parseBoolean(fileData[30]);
			self.kill10 = parseBoolean(fileData[31]);
			self.kill100 = parseBoolean(fileData[32]);
			self.kill1k = parseBoolean(fileData[33]);
			self.kill10k = parseBoolean(fileData[34]);
			self.kill50k = parseBoolean(fileData[35]);
			self.kill1m = parseBoolean(fileData[36]);
			self.killBase = parseBoolean(fileData[37]);
			self.kill100Bases = parseBoolean(fileData[38]);
			self.killFriend = parseBoolean(fileData[39]);
			self.killCourier = parseBoolean(fileData[40]);
			//self.suicide = parseBoolean(fileData[41]); DON'T update sui achievement.
			self.baseKills = parseFloat(fileData[42]);
			self.oresMined = parseFloat(fileData[43]);
			self.mined = parseBoolean(fileData[44]);
			self.allOres = parseBoolean(fileData[45]);
			self.mined3k = parseBoolean(fileData[46]);
			self.mined15k = parseBoolean(fileData[47]);
			self.total100k = parseBoolean(fileData[48]);
			self.total1m = parseBoolean(fileData[49]);
			self.total100m = parseBoolean(fileData[50]);
			self.total1b = parseBoolean(fileData[51]);
			self.packageTaken = parseBoolean(fileData[52]);
			self.quested = parseBoolean(fileData[53]);
			self.allQuests = parseBoolean(fileData[54]);
			self.goldTrail = parseBoolean(fileData[55]);
			self.questsDone = parseFloat(fileData[56]);
			self.driftTimer = parseFloat(fileData[57]);
			self.dr0 = parseBoolean(fileData[58]);
			self.dr1 = parseBoolean(fileData[59]);
			self.dr2 = parseBoolean(fileData[60]);
			self.dr3 = parseBoolean(fileData[61]);
			self.dr4 = parseBoolean(fileData[62]);
			self.dr5 = parseBoolean(fileData[63]);
			self.dr6 = parseBoolean(fileData[64]);
			self.dr7 = parseBoolean(fileData[65]);
			self.dr8 = parseBoolean(fileData[66]);
			self.dr9 = parseBoolean(fileData[67]);
			self.dr10 = parseBoolean(fileData[68]);
			self.dr11 = parseBoolean(fileData[69]);
			self.cornersTouched = parseFloat(fileData[70]);
			self.ms0 = parseBoolean(fileData[71]);
			self.ms1 = true;//died!
			self.ms2 = parseBoolean(fileData[73]);
			self.ms3 = parseBoolean(fileData[74]);
			self.ms4 = parseBoolean(fileData[75]);
			self.ms5 = parseBoolean(fileData[76]);
			self.ms6 = parseBoolean(fileData[77]);
			self.ms7 = parseBoolean(fileData[78]);
			self.ms8 = parseBoolean(fileData[79]);
			self.ms9 = parseBoolean(fileData[80]);
			self.ms10 = parseBoolean(fileData[81]);

			// Last login support
			if (fileData.length > 86) {
				self.lastLogin = new Date(parseInt(fileData[86]));
			}
			self.lives--;
			self.dead = true;
			if(self.lives <= 0){
				fs.writeFileSync('server/players/dead/' + (self.name.startsWith("[")?self.name.split(" ")[1]:self.name) + "[" + hash(self.password) + '.txt', fullFile, {"encoding":'utf8'});
				fs.unlinkSync('server/players/' + (self.name.startsWith("[")?self.name.split(" ")[1]:self.name) + "[" + hash(self.password) + '.txt');
				lefts[self.id] = 0;
			}
			else self.save();
			self.sendStatus();
			self.sendAchievementsMisc(true);
			
			//put this player in the dead list
			deads[self.id] = self;
			
			sendWeapons(self);
		}
	}
	self.dmg = function(d,origin){
		
		//reward nn bots for hurting other players
		if(self.isNNBot && origin.type === "Bullet" && origin.owner.type === "Player" && origin.owner.net != 0){
			origin.owner.net.save(self.isNNBot?self.net.id:Math.floor(Math.random()));
			self.health -= 10000;
		}
		
		//blood trail: less damage
		if(self.trail % 16 == 1) d /= 1.05;
		
		self.health-=d*(self.shield?.25:1); // Shield- 1/4th damage
		if(self.health < 0)self.die(origin);
		
		note('-'+Math.floor(d), self.x, self.y - 64, self.sx, self.sy); // e.g. "-8" pops up on screen to mark 8 hp was lost (for all players)
		send(self.id, 'dmg', {});
		return self.health < 0;
	}
	self.EMP = function(t){
		if(self.empTimer > 0) return; // emps don't stack. can't emp an already emp's ship
		if(self.ship >= 16) t *= 1.3; // Emp works better on elites
		self.empTimer = t;
		
		//turn off all keys
		self.w = self.e = self.a = self.s = self.d = self.c = self.space = false;
		if(!self.isBot) send(self.id, 'emp', {t:t});
	}
	self.save = function(){
		if(self.guest || self.isBot) return;
		savePlayerData(self);
	}
	
	self.onKill = function(p){
		
		//kill streaks
		if(!p.guest && p.color !== self.color) self.killStreak++;
		self.killStreakTimer = 750;//30s
		self.kills++;
		
		if(self.isBot) return;
		
		//achievementy stuff
		self.killsAchs[0] = self.kills >= 1;
		self.killsAchs[1] = self.kills >= 10;
		self.killsAchs[2] = self.kills >= 100;
		self.killsAchs[3] = self.kills >= 1000;
		self.killsAchs[4] = self.kills >= 4000;
		self.killsAchs[5] = self.kills >= 10000;
		if(p.trail != 0) self.killsAchs[6] = true;
		if(p.hasPackage) self.killsAchs[10] = true;
		if(p.name === self.name) self.killsAchs[11] = true;
		else if(p.color === self.color) self.killsAchs[9] = true;
		self.sendAchievementsKill(true);
	}
	self.onMined = function(a){
		if(self.isBot) return;
		
		//bitmask of what types of ores this player has mined
		if((self.oresMined & (1 << a)) == 0) self.oresMined += 1 << a;
		
		//achievementy stuff
		if(self.oresMined == 15 && !self.moneyAchs[1]) self.moneyAchs[1] = true;
		else if(!self.moneyAchs[0]) self.moneyAchs[0] = true;
		else if(!self.moneyAchs[2] && 3000 <= self.iron + self.silver + self.aluminium + self.platinum) self.moneyAchs[2] = true;
		else if(!self.moneyAchs[3] && 15000 <= self.iron + self.silver + self.aluminium + self.platinum) self.moneyAchs[3] = true;
		else return;
		self.sendAchievementsCash(true);
	}
	self.sendAchievementsKill = function(note){
		if(self.isBot) return;
		send(self.id, "achievementsKill", {note:note,achs:self.killsAchs});
	}
	self.sendAchievementsCash = function(note){
		if(self.isBot) return;
		send(self.id, "achievementsCash", {note:note,achs:self.moneyAchs});
	}
	self.sendAchievementsDrift = function(note){
		if(self.isBot) return;
		send(self.id, "achievementsDrift", {note:note,achs:self.driftAchs});
	}
	self.sendAchievementsMisc = function(note){
		self.randmAchs[9] = !self.planetsClaimed.includes("0") && !self.planetsClaimed.includes("1"); // I had no clue where to put this. couldn't go in onPlanetCollision, trust me.
		if(self.isBot) return;
		send(self.id, "achievementsMisc", {note:note,achs:self.randmAchs});
	}
	self.sendStatus = function(){
		if(!self.isBot) send(self.id, "status", {docked:self.docked, state:self.dead,lives:self.lives});
	}
	self.checkMoneyAchievements = function(){
		if(self.isBot) return;
		if(self.money >= 10000 && !self.moneyAchs[4]) self.moneyAchs[4] = true;
		else if(self.money >= 100000 && !self.moneyAchs[5]) self.moneyAchs[5] = true;
		else if(self.money >= 1000000 && !self.moneyAchs[6]) self.moneyAchs[6] = true;
		else if(self.money >= 10000000 && !self.moneyAchs[7]) self.moneyAchs[7] = true;
		else return;
		self.sendAchievementsCash(true);
	}
	self.checkDriftAchs = function(){
		if(self.isBot) return;
		if(self.driftTimer >= 25 && !self.driftAchs[0]) self.driftAchs[0] = true; // drift 1sex
		else if(self.driftTimer >= 25 * 60 && !self.driftAchs[1]) self.driftAchs[1] = true; // 1min
		else if(self.driftTimer >= 25 * 60 * 10 && !self.driftAchs[2]) self.driftAchs[2] = true; // 10mins
		else if(self.driftTimer >= 25 * 60 * 60 && !self.driftAchs[3]) self.driftAchs[3] = true; // 1hr
		else if(self.driftTimer >= 25 * 60 * 60 * 10 && !self.driftAchs[4]) self.driftAchs[4] = true; // 10hrs
		else return;
		self.sendAchievementsDrift(true);
	}
	self.checkTrailAchs = function(){
		
		//Check if they have all achievements of a type. If so, give them the corresponding trail achievement of that type
		
		var rAll = true;
		for(var i = 0; i < 11; i++) if(!self.randmAchs[i]) rAll = false;
		if(!self.randmAchs[11] && rAll){
			self.randmAchs[11] = true;
			self.sendAchievementsMisc(true);
		}
		
		rAll = true;
		for(var i = 0; i < 12; i++) if(!self.killsAchs[i]) rAll = false;
		if(!self.killsAchs[12] && rAll){
			self.killsAchs[12] = true;
			self.sendAchievementsKill(true);
		}
		
		rAll = true;
		for(var i = 0; i < 11; i++) if(!self.driftAchs[i]) rAll = false;
		if(!self.driftAchs[11] && rAll){
			self.driftAchs[11] = true;
			self.sendAchievementsDrift(true);
		}
		
		rAll = true;
		for(var i = 0; i < 11; i++) if(!self.moneyAchs[i]) rAll = false;
		if(!self.moneyAchs[11] && rAll){
			self.moneyAchs[11] = true;
			self.sendAchievementsCash(true);
		}
	}
	self.getAllBullets = function(){ // sends to client all the bullets in this sector.
		if(self.isBot) return;
		var packHere = [];
		for(var i in bullets[self.sy][self.sx]){
			var bullet = bullets[self.sy][self.sx][i];
			packHere.push({wepnID:bullet.wepnID,color:bullet.color,x:bullet.x,vx:self.vx,vy:self.vy,y:bullet.y,angle:bullet.angle,id:self.id});
		}
		send(self.id, 'clrBullets', {pack:packHere});
	}
	self.getAllPlanets = function(){ // same, but with planets
		if(self.isBot) return;
		var packHere = 0;
		var planet = planets[self.sy][self.sx];
		packHere = {id:planet.id, name:planet.name, x:planet.x, y:planet.y, color:planet.color};
		send(self.id, 'planets', {pack:packHere});
	}
	self.updatePolars = function(){ // Convert my rectangular motion/position data to polar
		self.driftAngle = Math.atan2(self.vy, self.vx);
		self.speed = Math.sqrt(square(self.vy) + square(self.vx));
	}
	self.refillAmmo = function(i){
		if(typeof wepns[self.weapons[i]] !== "undefined") self.ammos[i] = wepns[self.weapons[i]].ammo;
	}
	self.refillAllAmmo = function(){
		for(var i = 0; i < 10; i++) self.refillAmmo(i);
		sendWeapons(self);
		strongLocal("Ammo Replenished!", self.x, self.y+256, self.id);
	}
	self.testAfk = function(){
		if(self.afkTimer-- < 0){
			send(self.id, "AFK",{t:0});
			lefts[self.id] = 0;
			if(!self.isBot){
				var text = "~`"+self.color+"~`"+self.name + "~`yellow~` went AFK!";
				console.log(text);
				chatAll(text);
			}
			return true;
		}
		return false;
	}
	self.changePass = function(pass){ // /password
	// TODO chris
		if(!self.docked){
			send(self.id, "chat", {msg:"~`red~`This command is only available when docked at a base."});
			return;
		}
		if(pass.length > 32 || pass.length < 1){
			send(self.id, "chat", {msg:"~`red~`Password must be 1-32 characters."});
			return;
		}
		self.tentativePassword = pass;
		send(self.id, "chat", {msg:"~`lime~`Type \"/confirm your_new_password\" to complete the change."});
	}
	self.confirmPass = function(pass){ // /confirm
	// TODO chris
		if(!self.docked){
			send(self.id, "chat", {msg:"~`red~`This command is only available when docked at a base."});
			return;
		}
		if(pass !== self.tentativePassword){
			send(self.id, "chat", {msg:"~`red~`Passwords do not match! Start over from /password."});
			return;
		}
		var currSource = 'server/players/' + (self.name.startsWith("[")?self.name.split(" ")[1]:self.name) + "[" + hash(self.password) + '.txt';
		if (fs.existsSync(currSource)) fs.unlinkSync(currSource);
		self.password = self.tentativePassword;
		self.save();
		send(self.id, "chat", {msg:"~`lime~`Password changed successfully."});
	}
	self.calculateGenerators = function(){ // count how many gens I have
		self.generators = 0;
		for(var slot = 0; slot<ships[self.ship].weapons;slot++)
			if(self.weapons[slot]==20) self.generators++;
		if(self.ship <= wepns[20].Level) self.generators = 0; // gotta have sufficiently high ship
	}
	self.spoils = function(type,amt){ // gives you something. Called wenever you earn money / exp / w/e
		if(typeof amt === "undefined") return;
		if(type === "experience"){
			// TODO This is broken- it announces your rank always whenever you log in
			var oldPosition = lbIndex(self.experience);
			self.experience+=amt;
			var newPosition = lbIndex(self.experience);
			if(newPosition < oldPosition && newPosition != -1 && !self.guest && !self.isBot){
				if(newPosition < 501) sendAll('chat', {msg:"~`" + self.color + "~`" + self.name + "~`yellow~` is now ranked #" + newPosition + " in the universe!"});
				else send(self.id, {msg:"~`yellow~` Your global rank is now #" + newPosition + "!"});
			}
			self.updateRank();
		}
		else if(type === "money") self.money+=amt*(self.trail % 16 == 2?1.05:1);
		else if(type === "life" && self.lives < 20) self.lives+=amt;
		self.experience = Math.max(self.experience, 0);
		send(self.id,"spoils",{type:type,amt:amt});
	}
	self.r = function(msg){ // pm reply
		if(self.reply.includes(" ")) self.reply = self.reply.split(" ")[1];
		self.pm("/pm "+self.reply+" "+msg.substring(3));
	}
	self.setEmail =function(msg) {
		var email = msg.substring(7);
		var regex = new RegExp("^(([^<>()\\[\\]\\\\.,;:\\s@\"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@\"]+)*)|(\".+\"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$");
		if(regex.test(email)) {
			self.email = email;
			self.save();
		} else {
			send(self.id, "chat", {msg:"Invalid Email!"});
		}
	}
	self.pm = function(msg){ // msg looks like "/pm luunch hey there pal". If a moderator, you use "2swap" not "[O] 2swap".
		if(msg.split(" ").length < 3){ // gotta have pm, name, then message
			send(self.id, "chat", {msg:"Invalid Syntax!"});
			return;
		}
		var name = msg.split(" ")[1];
		var raw = msg.substring(name.length+5);
		send(self.id, "chat", {msg:"Sending private message to "+name+"..."});
		for(var i = 0; i < mapSz; i++) for(var j = 0; j < mapSz; j++)
			for(var p in players[j][i]){
				var player = players[j][i][p];
				if((player.name.includes(" ")?player.name.split(" ")[1]:player.name) === name){
					send(player.id, "chat", {msg:"~`lime~`[PM] [" + self.name + "]: " + raw});
					send(self.id, "chat", {msg:"Message sent!"});
					self.reply = player.name;
					player.reply = self.name;
					return;
				}	
		}for(var p in dockers){
			var player = dockers[p];
			if((player.name.includes(" ")?player.name.split(" ")[1]:player.name) === name){
				send(player.id, "chat", {msg:"~`lime~`[PM] [" + self.name + "]: " + raw});
				send(self.id, "chat", {msg:"Message sent!"});
				self.reply = player.name;
				player.reply = self.name;
				return;
			}	
		}for(var p in deads){
			var player = deads[p];
			if((player.name.includes(" ")?player.name.split(" ")[1]:player.name) === name){
				send(player.id, "chat", {msg:"~`lime~`[PM] [" + self.name + "]: " + raw});
				send(self.id, "chat", {msg:"Message sent!"});
				self.reply = player.name;
				player.reply = self.name;
				return;
			}	
		}
		send(self.id, "chat", {msg:"Player not found!"});
	}
	self.swap = function(msg){ // msg looks like "/swap 2 5". Swaps two weapons.
		var spl = msg.split(" ");
		if(spl.length != 3){ // not enough arguments
			send(self.id, "chat", {msg:"Invalid Syntax!"});
			return;
		}
		var slot1 = parseFloat(spl[1]), slot2 = parseFloat(spl[2]);
		if(slot1 > 10 || slot2 > 10 || slot1 < 1 || slot2 < 1 || !slot1 || !slot2 || !Number.isInteger(slot1) || !Number.isInteger(slot2)){
			send(self.id, "chat", {msg:"Invalid Syntax!"});
			return;
		}
		
		slot1--;slot2--;//done later for NaN checking above: "!slot1"
		
		var temp = self.weapons[slot1];
		self.weapons[slot1] = self.weapons[slot2];
		self.weapons[slot2] = temp;
		temp = self.ammos[slot1];
		self.ammos[slot1] = self.ammos[slot2];
		self.ammos[slot2] = temp;

		sendWeapons(self);
		send(self.id, "chat", {msg:"Weapons swapped!"});
	}
	return self;
};

function lbIndex(exp){ // binary search to find where a player is on the leaderboard. TODO there is a bug where this prints stuff when someone gets their first kill of the day
	if(exp < lbExp[999]) return -1;
	if(exp > lbExp[0]) return 1;
	var ub = 999, lb = 0;
	while(ub > lb){
		if(exp >= lbExp[ub] && exp < lbExp[ub-1]) return ub+1;
		ub--;
		var index = Math.floor((ub + lb) / 2);
		if(exp<lbExp[index]) lb = index;
		else ub = index;
	}
	return ub+1;//1-indexed
}

module.exports = Player;

var botNames = fs.readFileSync("././botNames.txt").toString().split("\n");

global.spawnBot = function(sx,sy,col,rbNow,bbNow){
	if(sx < 0 || sy < 0 || sx >= mapSz || sy >= mapSz) return;
	if((rbNow > bbNow + 5 && col == "red")||(rbNow + 5 < bbNow && col == "blue")) return;
	if(Math.random() > trainingMode?0:1){
		spawnNNBot(sx,sy,col);
		return;
	}
	id = Math.random();
	var bot = new Player(id);
	bot.isBot = true;
	bot.sx = sx;
	bot.sy = sy;
	var rand = .33 + 3.67*Math.random();
	bot.experience = Math.floor(Math.pow(2,Math.pow(2,rand)))/4 + 3*rand;
	bot.updateRank();
	bot.ship = bot.rank;
	bot.x = bot.y = sectorWidth/2;
	bot.color = col;
	bot.name = Config.getValue("want_bot_names", false) ? "BOT " + botNames[Math.floor(Math.random() * (botNames.length))] : "DRONE";
	bot.thrust2 = bot.capacity2 = bot.maxHealth2 = bot.agility2 = Math.max(1, (Math.floor(rand*2) * .2) + .6);
	bot.energy2 = Math.floor((bot.thrust2-1)*5/2)/5+1;
	bot.va = ships[bot.ship].agility * .08 * bot.agility2;
	bot.thrust = ships[bot.ship].thrust * bot.thrust2;
	bot.capacity = Math.round(ships[bot.ship].capacity * bot.capacity2);
	bot.maxHealth = bot.health = Math.round(ships[bot.ship].health * bot.maxHealth2);
	for(var i = 0; i < 10; i++){
		do bot.weapons[i] = Math.floor(Math.random()*wepns.length);
		while(wepns[bot.weapons[i]].Level>bot.rank || !wepns[bot.weapons[i]].bot)
	}
	bot.refillAllAmmo();
	players[bot.sy][bot.sx][id] = bot;
}

global.spawnNNBot = function(sx,sy,col){
	if(trainingMode){sx = 2; sy = 4;}
	if(sx < 0 || sy < 0 || sx >= mapSz || sy >= mapSz) return;
	id = Math.random();
	var bot = new Player(id);
	bot.isNNBot = bot.isBot = true;
	bot.sx = sx;
	bot.sy = sy;
	var rand = .33 + 3.67*Math.random();
	bot.experience = trainingMode?150:(Math.floor(Math.pow(2,Math.pow(2,rand)))/8 + 3*rand);//TODO change /8 to /4
	bot.updateRank();
	bot.ship = bot.rank;
	bot.x = trainingMode?sectorWidth * Math.random():(sectorWidth/2);
	bot.y = trainingMode?sectorWidth * Math.random():(sectorWidth/2);
	bot.color = col;
	bot.net = 1;
	bot.name = "BOT " + botNames[Math.floor(Math.random() * (botNames.length))];
	bot.angle = Math.random() * Math.PI * 2;
	bot.thrust2 = bot.capacity2 = bot.maxHealth2 = bot.agility2 = Math.max(1, (Math.floor(rand*2) * .2) + .6);
	bot.energy2 = Math.floor((bot.thrust2-1)*5/2)/5+1;
	bot.va = ships[bot.ship].agility * .08 * bot.agility2;
	bot.thrust = ships[bot.ship].thrust * bot.thrust2;
	bot.capacity = Math.round(ships[bot.ship].capacity * bot.capacity2);
	bot.maxHealth = bot.health = Math.round(ships[bot.ship].health * bot.maxHealth2);
	for(var i = 0; i < 10; i++){
		do bot.weapons[i] = Math.floor(Math.random()*wepns.length);
		while(wepns[bot.weapons[i]].Level>bot.rank || !wepns[bot.weapons[i]].bot)
		if(trainingMode) bot.weapons[i] = 1;
	}
	bot.refillAllAmmo();
	players[bot.sy][bot.sx][id] = bot;
}
