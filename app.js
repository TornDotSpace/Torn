var fs = require('fs');
var Filter = require('bad-words');

console.log('Server started');
var io = require('socket.io')();
var port = process.argv[2];
io.listen(parseInt(port));

var jsn = JSON.parse(fs.readFileSync('client/weapons.json', 'utf8'));
var wepns = jsn.weapons, ships = jsn.ships, planets = jsn.planets;

filter = new Filter(); // bad-words node package





// bases                   (Red) / (Blue)
var baseMap = [	0,1,	//A2 / G6
				0,4,	//A5 / G3
				2,2,	//C3 / E5
				3,0,	//D1 / D7
				5,1];	//F2 / B6





//some global FINAL game mechanics
var bulletWidth = 16; // collision radius
var mineLifetime = 3; // mines despawn after 3 minutes
var baseHealth = 600; // max base health
var baseKillExp = 50; // Exp reward for killing a base
var baseKillMoney = 25000; // ditto but money
var mapSz = 7; // How many sectors across the server is. If changed, see planetsClaimed
var sectorWidth = 14336; // must be divisible by 2048.
var botFrequency = trainingMode?.7:1.6;//higher: more bots spawn. Standard: 1.6
var playerHeal = .2; // player healing speed
var baseHeal = 1; // base healing speed
var guestsCantChat = false;
var lbExp = new Array(1000); // Stores in memory where people stand on the global leaderboard.
var ranks = [0,5,10,20,50,100,200,500,1000,2000,4000,8000,14000,20000,40000,70000,100000,140000,200000,300000,500000,800000,1000000,1500000,2000000,3000000,5000000,8000000,12000000,16000000,32000000,64000000,100000000]; // exp to rank conversion.





//administrative-y variables
var tick = 0, lag = 0, ops = 0; // ticks elapsed since boot, lag, count of number of instances of update() running at once
var bp = 0, rp = 0, bg = 0, rg = 0, bb = 0, rb = 0; // blue/red players/guests/bots
var raidTimer = 50000, raidRed = 0, raidBlue = 0; // Timer and points
var IPSpam = {}; // Keeps track of ips flooding server.
var guestCount = 0; // Enumerate guests since server boot
var bQuests = [];//A list of the 10 available quests for humans and aliens
var rQuests = [];





//Object lists. All of them are in Y-MAJOR ORDER.
var sockets = {}; // network
var players = new Array(mapSz); // in game
var dockers = {}; // at a base
var lefts = {}; // Queued for deletion- left the game
var deads = {}; // Dead

var bullets = new Array(mapSz);
var missiles = new Array(mapSz);
var orbs = new Array(mapSz);
var mines = new Array(mapSz);
var beams = new Array(mapSz);
var blasts = new Array(mapSz);

var bases = new Array(mapSz);
var packs = new Array(mapSz); // Coins, ammo, packages, lives
var vorts = new Array(mapSz); // Worm/black holes
var asts = new Array(mapSz); // Asteroids
var planets = new Array(mapSz);

for(var i = 0; i < mapSz; i++){ // it's 2d
	players[i] = new Array(mapSz);
	
	bullets[i] = new Array(mapSz);
	missiles[i] = new Array(mapSz);
	orbs[i] = new Array(mapSz);
	mines[i] = new Array(mapSz);
	beams[i] = new Array(mapSz);
	blasts[i] = new Array(mapSz);
	
	bases[i] = new Array(mapSz);
	packs[i] = new Array(mapSz);
	vorts[i] = new Array(mapSz);
	asts[i] = new Array(mapSz);
	planets[i] = new Array(mapSz);
	for(var j = 0; j < mapSz; j++){ // it's 2d
		players[i][j] = {};
		
		bullets[i][j] = {};
		missiles[i][j] = {};
		orbs[i][j] = {};
		mines[i][j] = {};
		beams[i][j] = {};
		blasts[i][j] = {};
		
		bases[i][j] = 0; // only one base per sector
		packs[i][j] = {};
		vorts[i][j] = {};
		asts[i][j] = {};
		planets[i][j] = 0;
	}
}





//Machine Learning
var trainingMode = false; // specifies whether this server is being used strictly to train neural network bots.
var neuralFiles = 1500; // how many files should be in competition
var NeuralNet = function(){
	var self = {
		genes: {},
		id:-1
	};
	self.randomWeights = function(){
		for(var i = 0; i < 300; i++) self.genes[i] = mutate();
	};
	self.passThrough = function(input){
		
		//biases
		layer1 = [0,0,0,0,0,0,0,0,0,0,0,0,1];
		layer2 = [0,0,0,0,0,0,0,0,0,0,1];
		layer3 = [0,0,0,0,0,0,0,0,0,1];
		out = [0,0,0,0,0,0];
		
		var counter = 0;

		for(var a = 0; a < input.length; a++)
			for(var b = 0; b < layer1.length - 1; b++)
				layer1[b] += input[a] * self.genes[counter++];

		for(var i = 0; i < layer1.length; i++) layer1[i] = activate(layer1[i]);
		
		for(var a = 0; a < layer1.length; a++)
			for(var b = 0; b < layer2.length - 1; b++)
				layer2[b] += layer1[a] * self.genes[counter++];

		for(var i = 0; i < layer2.length; i++) layer2[i] = activate(layer2[i]);
		
		for(var a = 0; a < layer2.length; a++)
			for(var b = 0; b < layer3.length - 1; b++)
				layer3[b] += layer2[a] * self.genes[counter++];

		for(var i = 0; i < layer3.length; i++) layer3[i] = activate(layer3[i]);
		
		for(var a = 0; a < layer3.length; a++)
			for(var b = 0; b < out.length; b++)
				out[b] += layer3[a] * self.genes[counter++];

		for(var i = 0; i < out.length; i++) out[i]=out[i]>0;
		
		return out;
	};
	self.save = function(k){
		var source = 'server/neuralnets/' + k + '.bot';
		if (fs.existsSync(source)) fs.unlinkSync(source);
		var str = "";
		for(var i = 0; i < 300; i++) str += self.genes[i] + "\n";
		fs.writeFileSync(source, str, {"encoding":'utf8'});
	};
	self.load = function(){
		self.id = Math.floor(Math.random()*neuralFiles);
		self.randomWeights();

		var parentCount = Math.floor(Math.random()*3+1);
		for(var p = 0; p < parentCount; p++){
			var source = 'server/neuralnets/' + Math.floor(Math.random()*neuralFiles) + '.bot';
			if (fs.existsSync(source)) {
				var fileData = fs.readFileSync(source, "utf8").split('\n');
				for(var i = 0; i < 300; i++) self.genes[i] += parseFloat(fileData[i])/parentCount;
			}
		}
	};
	return self;
}
var mutate = function(){ // Low change of high variability, high chance of low.
	return Math.tan(Math.random()*Math.PI*2)/100;
}
var activate = function(x){ // Softsign activation function. See wikipedia.
	return x/(1+Math.abs(x));
}





//Game Objects
var Player = function(i){
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
		muteTimer: -1,
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
		planetsClaimed:"0000000000000000000000000000000000000000000000000"
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
				sendWeapons(self.id);
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
				if(bases[self.sx][self.sy] != 0){
					send(self.id, "chat",{msg:'There can only be one turret in any sector!', color:'yellow'});
					self.space = false;
					return;
				}
				var r = Math.random();
				var b = Base(r, false, self.sx, self.sy, self.color, self.x, self.y);
				b.owner = self.name;
				bases[self.sx][self.sy] = b;
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
			
			sendWeapons(self.id);
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
			self.iron -= 250; // This just shoots an asteroid out of the dhip as if it were a bullet.
			self.silver -= 250;
			self.aluminium -= 250;
			self.platinum -= 250;
			var r = Math.random();
			var a = new Asteroid(r,1000,self.sx,self.sy, Math.floor(Math.random()*4));
			a.x = self.x+Math.cos(self.angle) * 256;
			a.y = self.y+Math.sin(self.angle) * 256;
			a.vx = Math.cos(self.angle) * 15;
			a.vy = Math.sin(self.angle) * 15;
			asts[r] = a;
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
					beams[r] = beam;
					sendAllSector('sound', {file:"beam",x: m.x, y: m.y}, m.sx, m.sy);
					m.die();
				}
			}
		}
	}
	self.testSectorChange = function(){
		
		var callOnChangeSectors = true; // track whether we did change sectors.
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
		else callOnChangeSectors = false;
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
		
		if(callOnChangeSectors) self.onChangeSectors();
		
	}
	self.juke = function(left){
		if(self.energy < 7.5) return;
		self.energy -= 7.5;
		self.jukeTimer = (self.trail % 16 == 4?1.25:1)*(left?50:-50); // misc trail makes you juke further.
	}
	self.mute = function(minutes){
		self.muteCap = self.muteTimer = 25*60*minutes;
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
		
		var base = bases[self.sx][self.sy];
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
			for(var b in players){
				var player = players[b];
				if(player.sx == self.sx && player.sy == self.sy && player.color !== self.color){
					cleared = false;
					break;
				}
			}
			if(cleared && bases[self.sx][self.sy] != 0 && bases[self.sx][self.sy].turretLive) cleared = false;//also check base is dead
			
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
			
			players[self.id] = self;
			delete dockers[self.id];
			
			self.leaveBaseShield = 25;
			self.health = self.maxHealth;
			self.energy = 100;
			return;
		}
		
		self.checkTrailAchs();
		
		var base = 0;
		var b = bases[self.sx][self.sy];
		if(b.isBase && b.color == self.color && square(self.x - b.x)+square(self.y - b.y) < square(512)) base = b; // try to find a base on our team that's in range and isn't just a turret
		if(base == 0) return;
		
		self.refillAllAmmo();
		self.x = self.y = sectorWidth/2;
		self.save();
		self.docked = true;
		
		dockers[self.id] = self;
		delete players[self.id];
		
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
			if(currWep == 39)bAngle+=(i-1)/4.; // spreadshot
			if(currWep == 4) bAngle += Math.random() - .5; // shotgun
			
			var bullet = Bullet(self, r, currWep, bAngle, i * 2 - 1);
			bullets[r] = bullet;
			sendAllSector('sound', {file:(currWep == 5 || currWep == 6 || currWep == 39)?"minigun":"shot",x: self.x, y: self.y}, self.sx, self.sy);
		}
	}
	self.shootMissile = function(){
		var r = Math.random();
		var bAngle = self.angle;
		var missile = Missile(self, r, self.weapons[self.equipped], bAngle);
		missiles[r] = missile;
		sendAllSector('sound', {file:"missile",x: self.x, y: self.y}, self.sx, self.sy);
		
		self.reload = wepns[self.weapons[self.equipped]].Charge;
		self.energy-=wepns[self.weapons[self.equipped]].energy;
	}
	self.shootOrb = function(){
		var r = Math.random();
		var orb = Orb(self, r, self.weapons[self.equipped]);
		orbs[r] = orb;
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
				var b = bases[self.sx][self.sy];
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
		beams[r] = beam;
		sendAllSector('sound', {file:"beam",x: ox, y: oy}, self.sx, self.sy);
		
		self.reload = wepns[self.weapons[self.equipped]].Charge;
		if(!restricted) self.energy-=wepns[self.weapons[self.equipped]].energy; // don't take energy if it was a recursive shot from an asteroid
	}
	self.shootBlast = function(){
		var r = Math.random();
		var blast = Blast(self, r, self.weapons[self.equipped]);
		blasts[r] = blast;
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
			delete players[self.id];
			return;
		}
		sendAllSector('sound', {file:"bigboom",x:self.x, y:self.y, dx:Math.cos(self.angle) * self.speed, dy:Math.sin(self.angle)*self.speed}, self.sx, self.sy);
		
		if(b != 0){
			if(!self.isBot){

				//clear quest
				self.quest = 0;
				send(self.id, 'quest', {quest: 0});//reset quest and update client
				
				if(typeof b.owner !== "undefined" && b.owner.type === "Player"){
					sendAll('chat', {msg:("~`" + self.color + "~`" + self.name + "~`yellow~` was destroyed by ~`" + b.owner.color + "~`" + (b.owner.name===""?"a drone":b.owner.name) + "~`yellow~`'s `~"+b.wepnID+"`~!")});
					
					if(b.owner.w && b.owner.e && (b.owner.a || b.owner.d) && !b.owner.driftAchs[9]){ // driftkill
						b.owner.driftAchs[9] = true;
						b.owner.sendAchievementsDrift(true);
					}
				}

				//send msg
				else if(b.type == "Vortex") sendAll('chat', {msg:("~`" + self.color + "~`" + self.name + "~`yellow~` crashed into a black hole!")});
				else if(b.type == "Planet" || b.type == "Asteroid") sendAll('chat', {msg:("~`" + self.color + "~`" + self.name + "~`yellow~` crashed into an asteroid!")});
				else if(b.owner.type == "Base") sendAll('chat', {msg:("~`" + self.color + "~`" + self.name + "~`yellow~` was destroyed by an enemy base!")});

			}
			
			//drop a package
			var r = Math.random();
			if(self.hasPackage && !self.isBot) packs[r] = Package(self, r, 0); // an actual package (courier)
			else if(Math.random() < .004 && !self.guest) packs[r] = Package(self, r, 2);//life
			else if(Math.random() < .1 && !self.guest) packs[r] = Package(self, r, 3);//ammo
			else if(!self.guest) packs[r] = Package(self, r, 1);//coin
			
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
				sendWeapons(self.id);
				delete players[self.id];
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
			
			sendWeapons(self.id);
		}
		delete players[self.id];
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
		// TODO chris
		if(self.guest || self.isBot) return;
		var source = 'server/players/' + (self.name.startsWith("[")?self.name.split(" ")[1]:self.name) + "[" + hash(self.password) + '.txt';
		if (fs.existsSync(source)) fs.unlinkSync(source);
		var spawnX = ((self.sx==Math.floor(mapSz/2) && self.sx == self.sy)?(self.color === "blue"?4:2):self.sx);
		var spawnY = ((self.sx==Math.floor(mapSz/2) && self.sx == self.sy)?(self.color === "blue"?4:2):self.sy);
		var weapons = "";
		for(var i = 0; i < 9; i++) weapons += self.weapons[i] + ":";
		var str = self.color + ':' + self.ship + ':' + self.trail + ':' + weapons + /*no ":", see prev line*/ spawnX + ':' + spawnY + ':' + self.name + ':' + self.money + ':' + self.kills + ':' + self.planetsClaimed + ':' + self.iron + ':' + self.silver + ':' + self.platinum + ':' + self.aluminium + ':' + self.experience + ':' + self.rank + ':' + self.x + ':' + self.y + ':' + self.thrust2 + ':' + self.radar2 + ':' + self.capacity2 + ':' + self.maxHealth2 + ":";
		str+=self.kill1+":"+self.kill10+":"+self.kill100+":"+self.kill1k+":"+self.kill10k+":"+self.kill50k+":"+self.kill1m+":"+self.killBase+":"+self.kill100Bases+":"+self.killFriend+":"+self.killCourier+":"+self.suicide+":"+self.baseKills+":";
		str+=self.oresMined+":"+self.mined+":"+self.allOres+":"+self.mined3k+":"+self.mined15k+":"+self.total100k+":"+self.total1m+":"+self.total100m+":"+self.total1b+":"+self.packageTaken+":"+self.quested+":"+self.allQuests+":"+self.goldTrail+":"+self.questsDone+":";
		str+=self.driftTimer+":"+self.dr0+":"+self.dr1+":"+self.dr2+":"+self.dr3+":"+self.dr4+":"+self.dr5+":"+self.dr6+":"+self.dr7+":"+self.dr8+":"+self.dr9+":"+self.dr10+":"+self.dr11+":";
		str+=self.cornersTouched+":true:"/*ms0, acct made.*/+self.ms1+":"+self.ms2+":"+self.ms3+":"+self.ms4+":"+self.ms5+":"+self.ms6+":"+self.ms7+":"+self.ms8+":"+self.ms9+":"+self.ms10+":"+self.lives + ":" + self.weapons[9] + ":" + self.energy2 + ":nodecay:";
		str+=new Date().getTime()+":"+self.agility2; //reset timer
		fs.writeFileSync(source, str, {"encoding":'utf8'});
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
			var bullet = bullets[i];
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
		sendWeapons(self.id);
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

		sendWeapons(self.id);
		send(self.id, "chat", {msg:"Weapons swapped!"});
	}
	return self;
}

var Planet = function(i, name){
	var self = {
		type:"Planet",
		name:name,
		color:"yellow",
		owner:0, // string name of the player who owns it.
		id:i, // unique identifier
		x:sectorWidth/2, // this is updated by the createPlanet function to a random location
		y:sectorWidth/2,
		cooldown:0 // to prevent chat "planet claimed" spam
	}
	self.tick = function(){
		self.cooldown--;
		if(tick % 12 == 6 && self.owner != 0) for(var i in players[self.sy][self.sx]) {
			var p = players[self.sy][self.sx][i];
			if(self.owner === p.name) p.money++; // give money to owner
		}
	}
	return self;
}
var Base = function(i, b, sxx, syy, col, x, y){
	var self = {
		type:"Base",
		kills:0,
		experience:0,
		money:0,
		id:i, // unique identifier
		color:col,
		owner:0,
		isBase:b, // This differentiates between turrets and turrets connected to bases
		turretLive:true, // When killed, this becomes false and turret vanishes
		angle:0, // angle of the turret
		
		x:x,
		y:y,
		sx:sxx,
		sy:syy,
		
		reload:0, // timer for shooting
		health:baseHealth,
		maxHealth:baseHealth,
		heal:1,
		empTimer:-1,
		speed:0,//vs unused but there for bullets
	}
	self.tick = function(rbNow,bbNow){
		
		//spawn a bot if we need more bots
		if(self.isBase && Math.random()<botFrequency/square(rbNow+bbNow+5)) spawnBot(self.sx,self.sy,self.color,rbNow,bbNow);
		
		if(!self.turretLive && (tick % (25 * 60 * 10) == 0 || (raidTimer < 15000 && tick % (25*150) == 0))) self.turretLive = true; // revive. TODO: add a timer
		
		self.move(); // aim and fire
		
		self.empTimer--;
		self.reload--;
		
		if(self.health < self.maxHealth) self.health+=self.heal;
		if(tick % 50 == 0 && !self.isBase) self.tryGiveToOwner();
	}
	self.tryGiveToOwner = function(){ // if a base's owner stands over it, they get the stuff it's earned from killing people
	
		var player = 0; // find owner
		for(var i in players[self.sy][self.sx])
			if(players[self.sy][self.sx][i].name === self.owner){
				player = players[self.sy][self.sx][i];
				break;
			}
		if(player == 0) return;//if we couldn't find them (they aren't in the sector)
		
		if(squareDist(player,self) > 40000) return;
		
		player.kills += self.kills;//reward them with my earnings
		player.spoils("experience",self.experience);
		if(self.money > 0) player.spoils("money",self.money);
		
		self.experience = self.money = self.kills = 0; // and delete my earnings
	}
	self.move = function(){ // aim and fire
		
		if(self.empTimer > 0) return; // can't do anything if emp'd
		
		var c = 0; // nearest player
		var cDist2 = 1000000000; // min dist to player
		for(var i in players[self.sy][self.sx]){
			var player = players[self.sy][self.sx][i];
			if(player.color==self.color) continue; // don't shoot at friendlies
			var dist2 = squaredDist(player,self);
			if(dist2<cDist2){ c = player; cDist2 = dist2; } // update nearest player
		}
		
		self.angle = calculateInterceptionAngle(c.x,c.y,c.vx,c.vy,self.x,self.y); // find out where to aim (since the player could be moving). TODO make the turret move smoothly
		
		if(self.turretLive && self.reload < 0){
				 if(cDist2 < square(wepns[8].Range*10))  self.shootLaser();//range:60
			else if(cDist2 < square(wepns[37].Range*10)) self.shootOrb();//range:125
			else if(cDist2 < square(175*10))             self.shootMissile();//range:175
			else if(cDist2 < square(wepns[3].Range*10))  self.shootRifle();//range:750
		}
	}
	self.shootOrb = function(){
		self.reload = wepns[37].Charge/2;
		var r = Math.random();
		var orb = Orb(self, r, 37);
		orbs[r] = orb;
		sendAllSector('sound', {file:"beam",x: self.x, y: self.y}, self.sx, self.sy);
	}
	self.shootRifle = function(){
		self.reload = wepns[3].Charge/2;
		var r = Math.random();
		var bullet = Bullet(self, r, 3, self.angle, 0);
		bullets[r] = bullet;
		sendAllSector('sound', {file:"shot",x: self.x, y: self.y}, self.sx, self.sy);
	}
	self.shootMissile = function(){
		self.reload = wepns[10].Charge;
		var r = Math.random();
		var bAngle = self.angle;
		var missile = Missile(self, r, 10, bAngle);
		missiles[r] = missile;
		sendAllSector('sound', {file:"missile",x: self.x, y: self.y}, self.sx, self.sy);
	}
	self.shootLaser = function(){ // TODO merge this into Beam object, along with player.shootBeam()
		var nearP = 0;
		for(var i in players){
			var p = players[i];
			if(p.color == self.color || p.sx != self.sx || p.sy != self.sy) continue;
			if(nearP == 0){
				nearP = p;
				continue;
			}
			var dx = p.x - self.x, dy = p.y - self.y;
			if(dx * dx + dy * dy < square(nearP.x - self.x)+square(nearP.y - self.y)) nearP = p;
		}
		if(nearP == 0) return;
		var r = Math.random();
		var beam = Beam(self, r, 8, nearP, self);
		beams[r] = beam;
		sendAllSector('sound', {file:"beam",x: self.x, y: self.y}, self.sx, self.sy);
		self.reload = wepns[8].Charge/2;
	}
	self.die = function(b){
		self.health = self.maxHealth;
		self.turretLive = false;
		sendAllSector('sound', {file:"bigboom",x:self.x, y:self.y, dx:0, dy:0}, self.sx, self.sy);
		
		//If I was killed by an asteroid...
		if(b.type == 'Asteroid') {
			sendAll('chat', {msg:("The base at sector ~`" + col + "~`" + String.fromCharCode(97 + sxx).toUpperCase() + (syy + 1) + "~`yellow~` was destroyed by an asteroid!")});
			return;
		}
		
		//Or a player...
		if(typeof b.owner !== "undefined" && b.owner.type === "Player") {
			sendAll('chat', {msg:("The base at sector ~`" + col + "~`" + String.fromCharCode(97 + sxx).toUpperCase() + (syy + 1) + "~`yellow~` was destroyed by ~`" + b.color + "~`" + (b.owner.name===""?"a drone":b.owner.name) + "~`yellow~`'s `~"+b.wepnID+"`~.")});
			b.owner.baseKilled();
			b.owner.spoils("experience",baseKillExp); // reward them
			b.owner.spoils("money",baseKillMoney);
			
			if(raidTimer < 15000){ // during a raid
				b.owner.points++; // give a point to the killer
	
				for(var i in players[self.sy][self.sx]){ // as well as all other players in that sector
					var p = players[self.sy][self.sx][i];
					if(p.color !== self.color) p.points++;
				}
			}
		}
		
		if(!self.isBase) bases[self.sx][self.sy] = 0;
	}
	self.EMP = function(t){
		self.empTimer = t;
	}
	self.save = function(){// TODO Chris
		if(self.isBase) return;
		var source = 'server/turrets/' + self.id + '.txt';
		if (fs.existsSync(source)) fs.unlinkSync(source);
		var str = self.kills + ':' + self.experience + ':' + self.money + ':' + self.id + ":" + self.color + ":" + self.owner+":"+self.x+":"+self.y+":"+self.sx+":"+self.sy;
		fs.writeFileSync(source, str, {"encoding":'utf8'});
	}
	self.onKill = function(){
		self.kills++;
	}
	self.dmg = function(d, origin){
		self.health-=d;
		if(self.health < 0)self.die(origin);
		note('-'+d, self.x, self.y - 64, self.sx, self.sy);
		return self.health < 0;
	}
	self.spoils = function(type,amt){
		if(type === "experience") self.experience+=amt;
		if(type === "money") self.money+=amt;
	}
	return self;
}
var Vortex = function(i, x, y, sxx, syy, size, ownr, isWorm){
	var self = {
		
		isWorm:isWorm, // am i a wormhole or black hole
		
		sxo:Math.floor(Math.random() * mapSz), // output node location for wormhole
		syo:Math.floor(Math.random() * mapSz),
		xo:Math.random() * sectorWidth,
		yo:Math.random() * sectorWidth,
		
		type:"Vortex",
		owner:ownr,
		id:i, // unique identifier
		
		x:x, //input node or black hole location
		y:y,
		sx:sxx,
		sy:syy,
		
		size:size,
	}
	self.tick = function(){
		
		if(tick % 2 == 0) self.move();
		
		if(self.owner != 0){ // if I'm a gravity bomb
			self.size -= 6; // shrink with time
			if(self.size < 0) self.die();
		}
		
		else self.size = 2500;
	}
	self.move = function(){
		if(self.isWorm){
			
			var t = tick / 40000;
			
			//the doubles in here are just random numbers for chaotic motion. Don't mind them.
			
			//input node
			var bx = Math.sin(7.197 * t) / 2 + .5;
			var by = -Math.sin(5.019 * t) / 2 + .5;
			self.sx = Math.floor(bx * mapSz);
			self.sy = Math.floor(by * mapSz);
			self.x = ((bx * mapSz) % 1) * sectorWidth;
			self.y = ((by * mapSz) % 1) * sectorWidth;
			
			//output node
			var bxo = -Math.sin(9.180 * t) / 2 + .5;
			var byo = Math.sin(10.3847 * t) / 2 + .5;
			self.sxo = Math.floor(bxo * mapSz);
			self.syo = Math.floor(byo * mapSz);
			self.xo = ((bxo * mapSz) % 1) * sectorWidth;
			self.yo = ((byo * mapSz) % 1) * sectorWidth;
			
			// every 2 seconds, tell the players where I am (for radar only, I think)
			if(tick % 50 == 0) sendAll('worm', {bx: bx, by: by, bxo: bxo, byo: byo});
			
		}
		for(var i in players[self.sy][self.sx]){
			var p = players[self.sy][self.sx][i];
			
			// compute distance and angle to players
			var dist = Math.sqrt(Math.sqrt(squaredDist(self,p)));
			var a = angleBetween(self,p);
			//then move them.
			var guestMult = (p.guest || p.isNNBot) ? -1 : 1; // guests are pushed away, since they aren't allowed to leave their sector.
			p.x -= guestMult * .25 * self.size / dist * Math.cos(a);
			p.y -= guestMult * .25 * self.size / dist * Math.sin(a);
			
			if(dist < 15 && !self.isWorm){ // collision with black hole
			
				p.die(self); // i think it's important that this happens before we give them the achievements
				
				if(p.e){
					p.driftAchs[8] = true; // drift into a black hole
					p.sendAchievementsDrift(true);
				}
				
				p.randmAchs[4] = true; // fall into a black hole
				p.sendAchievementsMisc(true);
					
			}else if(dist<15 && self.isWorm){ // collision with wormhole
			
				p.randmAchs[3] = true; // fall into a wormhole
				p.sendAchievementsMisc(true);
				
				p.sx = self.sxo;
				p.sy = self.syo;
				p.y = self.yo;
				p.x = self.xo; // teleport them to the output node
				
				p.planetTimer = 2501; // what is this?
			}
		}
	}
	self.die = function(b){
		sendAllSector('sound', {file:"bigboom",x:self.x, y:self.y, dx:0, dy:0}, self.sx, self.sy);
		delete vorts[self.id];
	}
	self.onKill = function(){
	} // do we need these functions here? :thonk: I think we might be calling em
	self.spoils = function(type,amt){
	}
	return self;
}
var Asteroid = function(i, h, sxx, syy, metal){
	var self = {
		type:"Asteroid",
		id:i, // unique identifier
		x:Math.floor(Math.random() * sectorWidth),
		y:Math.floor(Math.random() * sectorWidth),
		angle:0,
		health:h,
		maxHealth:h,
		sx: sxx,
		sy: syy,
		vx: 0,
		vy: 0,
		metal:metal,
		va:(Math.random() - .5) / 10,
	}
	self.tick = function(){
		if(Math.random() < .0001) self.die(0);
		self.move();
		if(Math.abs(self.vx) + Math.abs(self.vy) > 1.5){ // if we're moving sufficiently fast, check for collisions with players.
			for(var i in players[self.sy][self.sx]){
				var p = players[self.sy][self.sx][i];
				if(squaredDist(p,self) < square(32 + ships[p.ship].width) / 10){ // on collision,
					p.dmg(5*Math.hypot(p.vx-self.vx,p.vy-self.vy), self); // damage proportional to impact velocity
					sendAllSector('sound', {file:"boom2",x:self.x, y:self.y, dx:0, dy:0}, self.sx, self.sy);
					
					//bounce the player off. Same formula as used for mine impulse.
					var mult = 200 / Math.max(1,.001+Math.hypot(p.x - self.x,p.y - self.y))
					p.vx = mult*(Math.cbrt(p.x - self.x));
					p.vy = mult*(Math.cbrt(p.y - self.y));
					
					p.updatePolars(); // we just modified their rectangular info.
					p.angle = p.driftAngle; // make them look in the direction they're moving.
				}
			}
			
			var b = bases[self.sx][self.sy];
			if(b != 0 && b.turretLive && squaredDist(self,b) < 3686.4){ // collision with base
				b.dmg(10*Math.hypot(self.vx,self.vy), self);
				sendAllSector('sound', {file:"boom2",x:self.x, y:self.y, dx:0, dy:0}, self.sx, self.sy);
				self.die(b);
			}
			
		}
	}
	self.move = function(){
		self.angle+=self.va;
		if(Math.abs(self.vx) + Math.abs(self.vy) < .5) return;
		self.vx *= .997;
		self.vy *= .997;
		self.x += self.vx;
		self.y += self.vy;
		if(isOutOfBounds(self)) self.die(0);
	}
	self.die = function(b){
		createAsteroid();
		delete asts[self.id];
		if(b == 0) return;
		switch(metal){
			case 0:
				b.owner.iron+=self.maxHealth;
				if(b.owner.platinum + b.owner.iron + b.owner.aluminium + b.owner.silver > b.owner.capacity){
					b.owner.iron = b.owner.capacity - (b.owner.platinum + b.owner.aluminium + b.owner.silver);
					strongLocal("Cargo Bay Full", b.owner.x, b.owner.y + 256, b.owner.id);
				}
				break;
			case 1:
				b.owner.silver+=self.maxHealth;
				if(b.owner.platinum + b.owner.iron + b.owner.aluminium + b.owner.silver > b.owner.capacity){
					b.owner.silver = b.owner.capacity - (b.owner.platinum + b.owner.aluminium + b.owner.iron);
					strongLocal("Cargo Bay Full", b.owner.x, b.owner.y + 256, b.owner.id);
				}
				break;
			case 2:
				b.owner.aluminium+=self.maxHealth;
				if(b.owner.platinum + b.owner.iron + b.owner.aluminium + b.owner.silver > b.owner.capacity){
					b.owner.aluminium = b.owner.capacity - (b.owner.platinum + b.owner.iron + b.owner.silver);
					strongLocal("Cargo Bay Full", b.owner.x, b.owner.y + 256, b.owner.id);
				}
				break;
			default:
				b.owner.platinum+=self.maxHealth;
				if(b.owner.platinum + b.owner.iron + b.owner.aluminium + b.owner.silver > b.owner.capacity){
					b.owner.platinum = b.owner.capacity - (b.owner.iron + b.owner.aluminium + b.owner.silver);
					strongLocal("Cargo Bay Full", b.owner.x, b.owner.y + 256, b.owner.id);
				}
				break;
		}
		if(b.owner.type == "Player"){
			b.owner.onMined(self.metal);
			b.owner.spoils("ore",self.maxHealth);//just sends the message
		}
		noteLocal('+'+self.maxHealth + ' ore', b.owner.x, b.owner.y - 64, b.owner.id);
		var expGained = 1;
		if(b.owner.type === "Player" && b.owner.rank > 5) expGained = (Math.random() * 5 > b.owner.rank - 5)?1:0;
		if(b.owner.type === "Player"||b.owner.type === "Base") b.owner.spoils("experience",expGained);
		sendAllSector('sound', {file:"bigboom",x:self.x, y:self.y, dx:0, dy:0}, self.sx, self.sy);
	}
	self.dmg = function(d, origin){
		self.health-=d;
		if(self.health < 0)self.die(origin);
		note('-'+d, self.x, self.y - 64, self.sx, self.sy);
		send(self.id, 'dmg', {});
		return self.health < 0;
	}
	self.EMP = function(d){
		//this page intentionally left blank
	}
	return self;
}
var Package = function(ownr, i, type){
	var self = {
		id:i, // unique identifier
		type: type, // ammo? coin? lives? actual courier package?
		x:ownr.x,
		y:ownr.y,
		sx:ownr.sx,
		sy:ownr.sy,
		time:0, // since spawn
	}
	self.tick = function(){
		if(self.time++ > 25*60){ // 1 minute despawn
			sendAllSector('sound', {file:"boom2",x:self.x, y:self.y, dx:0, dy:0}, self.sx, self.sy);
			delete packs[self.id];
		}
		for(var i in players[self.sy][self.sx]){ // loop for collision
			var p = players[self.sy][self.sx][i];
			if(squaredDist(p,self) < square(16 + ships[p.ship].width)){ // someone hit me
				
				onCollide(p);
				
				delete packs[self.id]; // despawn
				break; // stop looping thru players
			}
		}
	}
	self.onCollide = function(p){
		
		if(self.type == 0){
			
			p.moneyAchs[8] = true; // Thief: steal a package
			p.sendAchievementsCash(true);
			
			var possible = ['money', 'ore', 'upgrade'];
			var contents = possible[Math.floor(Math.random() * 2.05)]; // figure out what reward to give
			
			var amt = Math.floor(Math.random() * 2000) + 2000; // how much ore we're gonna give
			if(contents == 'ore'){
				var left = p.capacity - p.iron - p.aluminium - p.silver - p.platinum; // how much more cargo space they have
				if(amt > left){ // if they don't have enough cargo space for the ore we're about to give
					amt = left; // give them as much as they can take
					strongLocal("Cargo Bay Full", p.x, p.y + 256, p.id); //tell them they have no room left
				}
				amt /= 4; // give them some of each
				p.iron += amt
				p.platinum += amt;
				p.aluminium += amt;
				p.silver += amt;
			}
				
			else if(contents == 'money') p.spoils("money",20000);
			else if(contents == 'upgrade') { p.radar2+=.2; p.recomputeTechs(); }
			
			var title = "Package collected: "; // the message we're going to send them
			if(contents == 'ore')     title += (amt*4) + ' ore!';
			if(contents == 'upgrade') title += 'New radar!';
			if(contents == 'money')   title += '20000 money!';
			strongLocal(title, p.x, p.y - 192, p.id); // send it
		}
		
		else if(self.type == 1) p.spoils("money",1000); // coin
		else if(self.type == 2) p.spoils("life",1); // floating life
		else if(self.type == 3) p.refillAllAmmo(); // ammo package
		
	}
	return self;
}

//weapon objects
var Orb = function(ownr, i, weaponID){//currently the only orb is energy disk
	var self = {
		type:"Orb",
		id:i, // unique identifier
		color:ownr.color, // owned by which team
		dmg:wepns[weaponID].Damage,
		
		owner:ownr,
		x:ownr.x,
		y:ownr.y, // spawn where its owner is
		sx:ownr.sx,
		sy:ownr.sy,
		vx:2*ownr.vx+wepns[weaponID].Speed*Math.cos(ownr.angle), // velocity is 2*owner's velocity plus this weapon's speed
		vy:2*ownr.vy+wepns[weaponID].Speed*Math.sin(ownr.angle),
		
		locked:0, // the player I'm locked on to
		timer: 0, // how long this orb has existed
		lockedTimer: 0, // timer of how long it's been locked onto a player
		wepnID:weaponID
	}
	self.tick = function(){
		if(self.timer++ > 3 * wepns[weaponID].Range / wepns[weaponID].Speed) self.die();
		self.move();
	}
	self.move = function(){
		if(self.locked != 0 && typeof self.locked === 'number'){
			if(self.lockedTimer++ > 2.5 * 25) self.die(); // after 2.5 seconds of being locked on -> delete self
			var target = players[self.locked];
			if(typeof target === 'undefined' && bases[self.sx][self.sy].color != self.color) target = bases[self.sx][self.sy];
			if(target == 0) target = asts[self.locked];
			if(typeof target === 'undefined') self.locked = 0;
			else{ // if we are locked onto something
				if(target.type === "Player") target.isLocked = true; // tell the player they're locked onto for an alert message
				var d2 = squaredDist(target,self);
				if(target.sx == self.sx && target.sy == self.sy && d2 < square(100) && target.turretLive != false){ // if it's a base we can't attack when it's dead
					target.dmg(self.dmg, self);
					self.die();
					return;
				}
				var dist = Math.sqrt(d2);
				self.vx += wepns[weaponID].Speed*(target.x - self.x)/dist; // accelerate towards target
				self.vy += wepns[weaponID].Speed*(target.y - self.y)/dist;
				self.vx *= .9; // air resistance
				self.vy *= .9;
			}
		}
		if(self.locked == 0) self.lockedTimer = 0;
		self.x+=self.vx;
		self.y+=self.vy; // move
		if(self.x > sectorWidth || self.x < 0 || self.y > sectorWidth || self.y < 0) self.die(); // if out of bounds
	}
	self.die = function(){
		sendAllSector('sound', {file:"boom2",x:self.x, y:self.y, dx:self.vx, dy:self.vy}, self.sx, self.sy);
		delete orbs[self.id];
	}
	return self;
}
var Bullet = function(ownr, i, weaponID, angl, info){
	var self = {
		type:"Bullet",
		id:i, // unique identifier
		time:0, // time since spawn
		color:ownr.color, // whose team
		dist:0, // TRACKS distance. Doesn't control it.
		dmg:wepns[weaponID].Damage,
		
		x:ownr.x + (weaponID == 6?Math.sin(self.angle) * 16 * self.info:0), // spawn where my owner was
		y:ownr.y - (weaponID == 6?Math.cos(self.angle) * 16 * self.info:0), // if minigun, move left or right based on which bullet I am
		sx:ownr.sx,
		sy:ownr.sy,
		vx:Math.cos(angl) * wepns[weaponID].Speed,
		vy:Math.sin(angl) * wepns[weaponID].Speed,
		
		owner:ownr,
		angle:angl, // has to be a parameter since not all bullets shoot straight
		info:info, // used to differentiate left and right minigun bullets
		wepnID:weaponID,
	}
	self.tick = function(){
		if(self.time++ == 0){ // if this was just spawned
			sendAllSector("newBullet", {x:self.x, y:self.y, vx:self.vx,vy:self.vy,id:self.id,angle:self.angle,wepnID:self.wepnID, color:self.color}, self.sx, self.sy);
			//self.x -= self.vx; These were here before Alex's refactor. Not sure if they should exist.
			//self.y -= self.vy;
		}
		self.move();
		self.dist+=wepns[weaponID].Speed / 10;
		if(self.wepnID == 28 && self.time > 25 * 3){ // gravity bomb has 3 seconds to explode
			var base = bases[self.sx][self.sy];
			if(squaredDist(base,self)<square(1000)) return; // don't spawn too close to a base, just keep moving if too close to base and explode when out of range.
			self.dieAndMakeVortex(); // collapse into black hole
		}
		else if(self.dist>wepns[weaponID].Range) self.die(); // out of range
	}
	self.move = function(){
		self.x+=self.vx;
		self.y+=self.vy; // move on tick
		if(self.x > sectorWidth || self.x < 0 || self.y > sectorWidth || self.y < 0) self.die();
			
		var b = bases[self.sx][self.sy];
		if(b != 0 && b.turretLive && b.color!=self.color && square(b.x - self.x) + square(b.y - self.y) < square(16 + 32)){
			b.dmg(self.dmg, self);
			self.die();
		}
		
		for(var i in players[self.sy][self.sx]){
			var p = players[self.sy][self.sx][i];
			if(p.color!=self.color && squaredDist(p,self) < square(bulletWidth + ships[p.ship].width)){ // on collision with enemy
				if(self.wepnId == 28){ // if a grav bomb hits a player, explode into a black hole
					self.dieAndMakeVortex();
					return;
				}
				p.dmg(self.dmg, self); // damage the enemy
				self.die();//despawn this bullet
				break;
			}
		}
		if(self.time % 2 == 0 || wepns[self.wepnID].Speed > 75){ // Only check for collisions once every 2 ticks, unless this weapon is really fast (in which case the bullet would skip over it)
			for(var i in asts[self.sy][self.sx]){
				var a = asts[self.sy][self.sx][i];
				if(squaredDist(a,self) < square(bulletWidth + 64)){ // if we collide
					a.dmg(self.dmg * (self.weaponID == 0?2:1), self); // hurt the asteroid. ternary: stock gun does double damage
					a.vx += self.vx / 256; // push the asteroid
					a.vy += self.vy / 256;
					self.die(); // delete this bullet
					break;
				}
			}
		}
	}
	self.die = function(){
		sendAllSector("delBullet", {id:self.id},self.sx,self.sy);
		var reverse = weaponID == 2? -1:1; // for reverse gun, particles should shoot the other way
		sendAllSector('sound', {file:"boom2",x:self.x, y:self.y, dx:reverse * self.vx, dy:reverse * self.vy}, self.sx, self.sy);
		delete bullets[self.id];
	}
	self.dieAndMakeVortex = function(){
		var r = Math.random();
		var vort = Vortex(r, self.x, self.y, self.sx, self.sy, 3000, self.owner, false); // 3000 is the size of a grav bomb vortex
		vorts[r] = vort;
		self.die();
	}
	return self;
}
var Mine = function(ownr, i, weaponID){
	var self = {
		type:"Mine",
		id:i, // unique identifier
		time:0, // time since spawned
		color:ownr.color, // what team owns me
		dmg:wepns[weaponID].Damage,
		
		x:ownr.x,
		y:ownr.y,
		vx:weaponID != 33?0:Math.cos(ownr.angle)*30, // grnades are the only mines that move
		vy:weaponID != 33?0:Math.sin(ownr.angle)*30,
		sx:ownr.sx,
		sy:ownr.sy,
		
		owner:ownr,
		wepnID:weaponID,
	}
	self.tick = function(){
		self.x += self.vx; // move
		self.y += self.vy;
		if(self.wepnID > 25 && self.time++ > 25) self.die(); // pulse wave and grenade blow up after 1 second
		if(self.time++ > 25 * 3 * 60) self.die(); // all mines die after 3 minutes
	}
	self.die = function(){
		var power = 0; // how strongly this mine pushes people away on explosion
		if(self.wepnID == 15 || self.wepnID == 33) power = 400; //mine, grenade
		else if(self.wepnID == 32) power = 2000;
		for(var i in players[self.sy][self.sx]){
			var p = players[self.sy][self.sx][i];
			if(squaredDist(p,self) < square(1024)){
				var mult = power/Math.max(10,.001+Math.hypot(p.x - self.x,p.y - self.y)); // not sure what's going on here but it works
				p.vx = mult*(Math.cbrt(p.x - self.x));
				p.vy = mult*(Math.cbrt(p.y - self.y)); // push the player
				p.updatePolars();//we edited rectangulars
				p.angle = p.driftAngle; // turn them away from the mine
			}
		}
		if(self.wepnID == 33) // if i'm a grenade
			for(var i in players[self.sy][self.sx]){
				var p = players[self.sy][self.sx][i];
				if(squaredDist(p,self) < square(wepns[33].Range*10)) p.dmg(self.dmg, self); // if i'm in range of a player on explosion, damage them
			}
		sendAllSector('sound', {file:"boom2",x:self.x, y:self.y, dx:0, dy:0}, self.sx, self.sy);
		delete mines[self.sy][self.sx][self.id];
	}
	return self;
}
var Beam = function(ownr, i, weaponID, enemy, orign){
	var self = {
		type:"Beam",
		id:i, // unique identifier
		dmg:weaponID == 400?wepns[16].Damage:wepns[weaponID].Damage,
		sx:ownr.sx,
		sy:ownr.sy,
		origin:orign,
		owner:ownr,
		enemy:enemy, // person we're hitting
		wepnID:weaponID,
		time:0, // since spawn
	}
	self.tick = function(){
		if(self.time++>10){
			var divideBy = self.enemy.ship == 17 && (self.wepnID == 30 || self.wepnID == 26)? 2 : 1; // i think this is about mining lasers shooting elite quarrier?
			self.enemy.dmg(self.dmg / divideBy, self.wepnID == 400?self.owner:self);
			if(enemy.type === "Asteroid") enemy.hit = false; // idk what this is
			else if(self.wepnID == 34){ // energy leech
				self.enemy.energy += wepns[self.wepnID].energy;
				self.owner.energy -= wepns[self.wepnID].energy;
			}
			delete beams[self.id];
		}
	}
	return self;
}
var Blast = function(ownr, i, weaponID){
	var self = {
		type:"Blast",
		id:i, // unique identifier
		dmg:wepns[weaponID].Damage,
		sx:ownr.sx,
		sy:ownr.sy,
		owner:ownr,
		angle:ownr.angle,
		bx:ownr.x,
		by:ownr.y,
		wepnID:weaponID,
		time:0, // since spawn
	}
	self.tick = function(){
		self.time++;
		if(self.time>11) delete blasts[self.id];
		if(self.time == 1){
			
			for(var i in players[self.sy][self.sx]){
				var player = players[self.sy][self.sx][i];
				if((self.bx-player.x) * Math.cos(self.angle) + (self.by-player.y) * Math.sin(self.angle) > 0) continue;
				var pDist = Math.hypot(player.x - self.bx, player.y - self.by);
				var fx = player.x - Math.cos(self.angle) * pDist; // all this ugly math is just to check collision of a player with a ray
				var fy = player.y - Math.sin(self.angle) * pDist;
				if(Math.hypot(fx-self.bx,fy-self.by) < ships[player.ship].width*2/3) self.hit(player);
			}
			
			/*for(var i in asts[self.sy][self.sx]){
				var ast = asts[self.sy][self.sx][i];
				if((self.bx-ast.x) * Math.cos(self.angle) + (self.by-ast.y) * Math.sin(self.angle) > 0) continue;
				var pDist = Math.hypot(ast.x - self.bx, ast.y - self.by);
				var fx = ast.x - Math.cos(self.angle) * pDist;
				var fy = ast.y - Math.sin(self.angle) * pDist;
				if(Math.hypot(fx-self.bx,fy-self.by) < 64*2/3) self.hit(ast);
			} // not using this atm */
			
			var base = bases[self.sx][self.sy];
			if(base.color == self.owner.color || !base.turretLive) return;
			if((self.bx-base.x) * Math.cos(self.angle) + (self.by-base.y) * Math.sin(self.angle) > 0) return;
			var pDist = Math.hypot(base.x - self.bx, base.y - self.by);
			var fx = base.x - Math.cos(self.angle) * pDist;
			var fy = base.y - Math.sin(self.angle) * pDist;
			if(Math.hypot(fx-self.bx,fy-self.by) < 128*2/3) self.hit(base);
		}
	}
	self.hit = function(b){
		if(self.wepnID == 25 && self.owner.color !== b.color) b.EMP(wepns[25].Charge*.6); // emp blast
		else if(self.wepnID == 34 && self.owner.color !== b.color) b.dmg(self.dmg, self); // muon
		else if(self.wepnID == 41) b.brainwashedBy = self.owner.id; // brainwashing laser
	}
	return self;
}
var Missile = function(ownr, i, weaponID, angl){
	var self = {
		type:"Missile",
		id:i, // unique identifier
		color:ownr.color, // whose side i'm on
		dmg:wepns[weaponID].Damage,
		
		x:ownr.x,
		y:ownr.y,
		sx:ownr.sx,
		sy:ownr.sy,
		vx:Math.cos(angl) * wepns[weaponID].Speed,
		vy:Math.sin(angl) * wepns[weaponID].Speed,
		angle:angl,
		
		owner:ownr,
		locked:0, // player I'm locked onto
		timer: 0, // since spawn
		lockedTimer: 0, // since locking on to my current target (or is it since first locking onto anyone?)
		wepnID:weaponID,
		goalAngle:0 // the angle I'm turning to match
	}
	self.tick = function(){
		
		self.move();
		if(self.timer++ > 10 * wepns[weaponID].Range / wepns[weaponID].Speed) self.die(); // out of range -> die
		if(self.x > sectorWidth || self.x < 0 || self.y > sectorWidth || self.y < 0) self.die();//out of sector
		
		if(self.timer >= 20 && self.wepnID == 13){ // missile swarm
			for(var i = 0; i < 6; i++){ // spawn 6 missiles
				var r = Math.random();
				var bAngle = self.angle + r * 2 - 1;
				var missile = Missile(self.owner, r, 10, bAngle);
				missile.x = self.x;
				missile.y = self.y;
				missiles[r] = missile;
			}
			self.die(); // and then die
		}
	}
	self.move = function(){
		
		if(self.locked != 0 && typeof self.locked === 'number'){
			if(self.lockedTimer++ > 7 * 25) self.die(); // if locked for >7s, die
			
			var target = players[self.locked]; // try 2 find the target object
			if(typeof target === 'undefined' && bases[self.sx][self.sy].color != self.color) target = bases[self.sx][self.sy];
			if(target == 0) target = asts[self.locked];
			if(typeof target === 'undefined') self.locked = 0;
			
			else{ // if we found it, then...
			
				if(target.type === "Player") target.isLocked = true;
				
				//on impact
				if(target.sx == self.sx && target.sy == self.sy && squaredDist(target,self) < 10000*(self.wepnID == 38?5:1) && target.turretLive != false /*we don't know it's a base. can't just say ==true.*/ ){
					target.dmg(self.dmg, self);
					self.die();
					if(self.wepnID == 12 && (target.type === 'Player' || target.type === 'Base')) target.EMP(40); // emp missile
					return;
				}
				
				if(self.wepnID != 38){ // 38: proximity fuze
					if(self.timer == 1 || tick % 4 == 0) self.goalAngle = angleBetween(target,self);
					self.angle = findBisector(findBisector(self.goalAngle, self.angle), self.angle);// turn towards goal
				}
				self.vx = Math.cos(self.angle) * wepns[weaponID].Speed; // update velocity
				self.vy = Math.sin(self.angle) * wepns[weaponID].Speed;
				
			}
		}
		
		if(self.locked == 0) self.lockedTimer = 0;
		
		var accelMult = 1-25/(self.timer+25); // pick up speed w/ time
		self.x+=self.vx*accelMult;
		self.y+=self.vy*accelMult; // move on tick
		
	}
	self.die = function(){
		sendAllSector('sound', {file:"boom2",x:self.x, y:self.y, dx:self.vx, dy:self.vy}, self.sx, self.sy);
		delete missiles[self.id];
	}
	return self;
}



//Miscellaneous Networking
function send(id, msg, data){ // send a socketio message to id
	var s = sockets[id];
	if(typeof s !== "undefined") s.emit(msg, data);
}
function note(msg, x, y, sx, sy){ // a popup note in game that everone in the sector can see.
	sendAllSector('note', {msg: msg, x: x, y: y, local:false}, sx, sy);
}
function noteLocal(msg, x, y, id){ // same as above but only id can see it.
	send(id, 'note', {msg: msg, x: x, y: y, local:true});
}
function strong(msg, x, y, sx, sy){ // a bigger note
	sendAllSector('strong', {msg: msg, x: x, y: y, local:false}, sx, sy);
}
function strongLocal(msg, x, y, id){ // you get the gist
	send(id, 'strong', {msg: msg, x: x, y: y, local:true});
}
function sendWeapons(id){ // tells a client what weapons that player has
	var player = getPlayer(id);
	if(player == 0) return;
	var worth = ships[player.ship].price*.75;
	send(id, 'weapons', {weapons: player.weapons, worth:worth, ammos:player.ammos});
}
function sendAllSector(out, data, sx, sy){
	for(var i in sockets){
		var p = players[i];
		if(typeof p !== "undefined" && p.sx == sx && p.sy == sy) sockets[i].emit(out, data);
	}
}
function sendAll(out, data){
	for(var i in sockets) sockets[i].emit(out, data);
}
function chatAll(msg){ // sends msg in the chat
	sendAll("chat", {msg:msg});
}
function sendTeam(color, out, data){ // send a socket.io message to all the members of some team
	for(var i in sockets){
		var player = dockers[i];
		for(var y = 0; y < mapSz; y++) for(var y = 0; y < mapSz; y++) if(typeof player === "undefined") player = players[y][x][i];
		if(typeof player === "undefined") player = deads[i];
		if(typeof player !== "undefined" && player.color === color) sockets[i].emit(out, data);
	}
}
function sendRaidData(){ // tell everyone when the next raid is happening
	sendAll("raid",{raidTimer:raidTimer});
}

function getPlayer(i){ // given a socket id, find the corresponding player object.
	var p = deads[i];
	for(var x = 0; x < mapSz; x++) for(var y = 0; y < mapSz; y++) if(typeof p === "undefined") p = players[y][x][i]; // check all sectors
	if(typeof p === "undefined") p = dockers[i]; // check dock
	if(typeof p !== "undefined") return p;
	return 0;
}

//Alex: I rewrote everything up to here thoroughly, and the rest not so thoroughly. 7/1/19

io.sockets.on('connection', function(socket){
	var instance = false;
	socket.id = Math.random();
	sockets[socket.id]=socket;

	var ip = socket.handshake.headers['x-real-ip'] || socket.handshake.address.address;
	console.log(ip + " Connected!");
	flood(ip);

	var player = 0;

	var socket_color = 0; // the color of this socket, only used for when spawning a guest for the first time.

	
	socket.on('lore',function(data){ //player is requesting lore screen.
		if (typeof data === "undefined" || typeof data.alien !== "boolean") return;
		socket_color = data.alien; // note whether they want to be alien for when they spawn
		socket.binary(false).emit("lored",{pc:socket_color});
	});

	socket.on('guest',function(data){ // TODO Chris
		flood(ip);
		if(instance) return;
		player = Player(socket.id);
		player.guest = true;
		instance = true;
		player.ip = ip;
		player.name = "GUEST" + guestCount;
		guestCount++;
		
		player.color = socket_color ?"red":"blue";
		if(mapSz % 2 == 0) player.sx = player.sy = (socket_color ?(mapSz / 2 - 1):(mapSz / 2));
		else player.sx = player.sy = (socket_color ?(mapSz / 2 - 1.5):(mapSz / 2 + .5));
		for(var i = 0; i < ships[player.ship].weapons; i++) player.weapons[i] = -1;
		for(var i = ships[player.ship].weapons; i < 10; i++) player.weapons[i] = -2;
		player.weapons[0] = 0;
		socket.binary(false).emit("guested",{});
		player.sendStatus();
		player.getAllBullets();
		player.getAllPlanets();
		// TODO: FIXME 
		players[player.sy][player.sx][socket.id] = player;
		player.va = ships[player.ship].agility * .08 * player.agility2;
		player.thrust = ships[player.ship].thrust * player.thrust2;
		player.capacity = Math.round(ships[player.ship].capacity * player.capacity2);
		player.maxHealth = player.health = Math.round(ships[player.ship].health * player.maxHealth2);
		socket.binary(false).emit('sectors', {sectors:sectors});
		sendWeapons(player.id);
	});
	socket.on('register',function(data){ // TODO Chris
		if (typeof data === "undefined") return;
		flood(ip);
		// Block registrations being triggered from non-guests or unconnected accounts
		// Fixes some registration spam and crash exploits

		if (!player) return;
		if (!player.guest) return;

		var user = data.user, pass = data.pass;

		if(typeof user !== "string" || user.length > 16 || user.length < 4 || /[^a-zA-Z0-9]/.test(user)){
			socket.binary(false).emit("invalidReg", {reason:2});
			return;
		}
		user = user.toLowerCase();
		if(typeof pass !== "string" || pass.length > 32 || pass.length < 1){
			socket.binary(false).emit("invalidReg", {reason:3});
			return;
		}

		// Test for profanity
		if(filter.isProfane(user)){ 
			socket.binary(false).emit("invalidReg", {reason:5});
			return;
		}

		var readSource = 'server/players/'+user+"["+hash(pass)+'.txt';
		var valid = true;
		fs.readdir('server/players/', function(err, items) {
			for (var i=0; i<items.length; i++) {
				if(items[i].startsWith(user+"[")){
					console.log(items[i] + ":" + (user+"["));
					socket.binary(false).emit("invalidReg", {reason:4});
					valid = false;
					break;
				}
			}
			if(!valid) return;
			var player = dockers[socket.id];
			if(typeof player === "undefined") return;
			player.name = user;
			player.password = pass;
			player.guest = false;
			socket.binary(false).emit("registered",{user:data.user,pass:data.pass});
			var text = user+' registered!';
			console.log(text);
			player.save();
			delete dockers[player.id];
			instance = false;
		});
		socket.binary(false).emit("raid", {raidTimer:raidTimer})
	});
	socket.on('login',function(data){ // TODO Chris
		if (typeof data === "undefined" || typeof data.amNew !== "boolean") return;
			
		flood(ip);
		if(instance) return;
		//Validate and save IP
		var name = data.user, pass = data.pass;
		if(typeof name !== "string" || name.length > 16 || name.length < 4 || /[^a-zA-Z0-9_]/.test(name)){
			socket.binary(false).emit("invalidCredentials", {});
			return;
		}
		if(typeof pass !== "string" || pass.length > 32 || pass.length < 1){
			socket.binary(false).emit("invalidCredentials", {});
			return;
		}
		name = name.toLowerCase();
		var readSource = 'server/players/'+name+"["+hash(data.pass)+'.txt';
		if (!fs.existsSync(readSource)){
			socket.binary(false).emit("invalidCredentials", {});
			return;
		}
		console.log("login: 2844");
		/*for(var i in players)
			console.log(players[i]);
			if(players[i].name === name || players[i].name.includes(" "+name)){// || socket.handshake.headers.cookie == players[i].cookie){
				socket.binary(false).emit("accInUse", {});
				return;
			}
		for(var i in dockers)
			if(dockers[i].name === name || dockers[i].name.includes(" "+name)){// || socket.handshake.headers.cookie == dockers[i].cookie){
				socket.binary(false).emit("accInUse", {});
				return;
			}
		for(var i in deads)
			if(deads[i].name === name || deads[i].name.includes(" "+name)){// || socket.handshake.headers.cookie == deads[i].cookie){
				socket.binary(false).emit("accInUse", {});
				return;
			}
		for(var i in lefts)
			if(lefts[i].name === name){// || lefts[i].name.includes(" "+name)){// || socket.handshake.headers.cookie == lefts[i].cookie){
				socket.binary(false).emit("accInUse", {});
				return;
			} */
		player = Player(socket.id);
		instance = true;
		player.ip = ip;
		player.name = name;
		player.password = pass;
		socket.binary(false).emit("loginSuccess",{});
		
		console.log(ip + " logged in as " + name + "!");
	
		//Load account
		if (fs.existsSync(readSource)) {
			var fileData = fs.readFileSync(readSource, "utf8").split(':');
			player.color = fileData[0];
			player.ship = parseFloat(fileData[1]);
			for(var i = 0; i < 9; i++) player.weapons[i] = parseFloat(fileData[3+i]);
			player.weapons[9] = parseFloat(fileData[83]);
			player.sx = Math.floor(parseFloat(fileData[12]));
			player.sy = Math.floor(parseFloat(fileData[13]));
			if(player.sx > mapSz - 1) player.sx = mapSz - 1;
			if(player.sy > mapSz - 1) player.sy = mapSz - 1;
			player.name = fileData[14];
			player.trail = parseFloat(fileData[2]) % 16 + (player.name.includes(" ")?16:0);
			player.money = parseFloat(fileData[15]);
			player.kills = parseFloat(fileData[16]);
			player.planetsClaimed = fileData[17];
			player.iron = parseFloat(fileData[18]);
			player.silver = parseFloat(fileData[19]);
			player.platinum = parseFloat(fileData[20]);
			player.aluminium = parseFloat(fileData[21]);
			player.experience = parseFloat(fileData[22]);
			player.rank = parseFloat(fileData[23]);
			player.x = parseFloat(fileData[24]);
			player.y = parseFloat(fileData[25]);
			player.thrust2 = Math.max(1,parseFloat(fileData[26]));
			player.radar2 = Math.max(1,parseFloat(fileData[27]));
			if(fileData.length > 87) player.agility2 = Math.max(1,parseFloat(fileData[87]));
			player.capacity2 = Math.max(1,parseFloat(fileData[28]));
			player.maxHealth2 = Math.max(1,parseFloat(fileData[29]));
			player.energy2 = parseFloat(fileData[84]);
			if(!(player.energy2 > 0)) player.energy2 = 1; //test undefined
			player.kill1 = parseBoolean(fileData[30]);
			player.kill10 = parseBoolean(fileData[31]);
			player.kill100 = parseBoolean(fileData[32]);
			player.kill1k = parseBoolean(fileData[33]);
			player.kill10k = parseBoolean(fileData[34]);
			player.kill50k = parseBoolean(fileData[35]);
			player.kill1m = parseBoolean(fileData[36]);
			player.killBase = parseBoolean(fileData[37]);
			player.kill100Bases = parseBoolean(fileData[38]);
			player.killFriend = parseBoolean(fileData[39]);
			player.killCourier = parseBoolean(fileData[40]);
			player.suicide = parseBoolean(fileData[41]);
			player.baseKills = parseFloat(fileData[42]);
			player.oresMined = parseFloat(fileData[43]);
			player.mined = parseBoolean(fileData[44]);
			player.allOres = parseBoolean(fileData[45]);
			player.mined3k = parseBoolean(fileData[46]);
			player.mined15k = parseBoolean(fileData[47]);
			player.total100k = parseBoolean(fileData[48]);
			player.total1m = parseBoolean(fileData[49]);
			player.total100m = parseBoolean(fileData[50]);
			player.total1b = parseBoolean(fileData[51]);
			player.packageTaken = parseBoolean(fileData[52]);
			player.quested = parseBoolean(fileData[53]);
			player.allQuests = parseBoolean(fileData[54]);
			player.goldTrail = parseBoolean(fileData[55]);
			player.questsDone = parseFloat(fileData[56]);
			player.driftTimer = parseFloat(fileData[57]);
			player.dr0 = parseBoolean(fileData[58]);
			player.dr1 = parseBoolean(fileData[59]);
			player.dr2 = parseBoolean(fileData[60]);
			player.dr3 = parseBoolean(fileData[61]);
			player.dr4 = parseBoolean(fileData[62]);
			player.dr5 = parseBoolean(fileData[63]);
			player.dr6 = parseBoolean(fileData[64]);
			player.dr7 = parseBoolean(fileData[65]);
			player.dr8 = parseBoolean(fileData[66]);
			player.dr9 = parseBoolean(fileData[67]);
			player.dr10 = parseBoolean(fileData[68]);
			player.dr11 = parseBoolean(fileData[69]);
			player.cornersTouched = parseFloat(fileData[70]);
			player.ms0 = parseBoolean(fileData[71]);
			player.ms1 = parseBoolean(fileData[72]);
			player.ms2 = parseBoolean(fileData[73]);
			player.ms3 = parseBoolean(fileData[74]);
			player.ms4 = parseBoolean(fileData[75]);
			player.ms5 = parseBoolean(fileData[76]);
			player.ms6 = parseBoolean(fileData[77]);
			player.ms7 = parseBoolean(fileData[78]);
			player.ms8 = parseBoolean(fileData[79]);
			player.ms9 = parseBoolean(fileData[80]);
			player.ms10 = parseBoolean(fileData[81]);
			player.lives = parseFloat(fileData[82]);
		}
		player.calculateGenerators();
		socket.binary(false).emit("raid", {raidTimer:raidTimer})
		player.refillAllAmmo();
		player.checkTrailAchs();
		player.sendAchievementsKill(false);
		player.sendAchievementsCash(false);
		player.sendAchievementsDrift(false);
		player.sendAchievementsMisc(false);
		player.sendStatus();

		players[player.sy][player.sx][socket.id]=player;
		player.getAllBullets();
		player.getAllPlanets();
		if(player.sx >= mapSz) player.sx--;
		if(player.sy >= mapSz) player.sy--;

		var text = "~`" + player.color + "~`"+player.name+'~`yellow~` logged in!';
		console.log(text);
		chatAll(text);
		player.va = ships[player.ship].agility * .08 * player.agility2;
		player.thrust = ships[player.ship].thrust * player.thrust2;
		player.capacity = Math.round(ships[player.ship].capacity * player.capacity2);
		player.maxHealth = player.health = Math.round(ships[player.ship].health * player.maxHealth2);
		if(!data.amNew) socket.binary(false).emit('sectors', {sectors:sectors});
		sendWeapons(player.id);
	});
	socket.on('disconnect',function(data){ // graceful disconnect
	
		lefts[socket.id] = 150; // note that this player has left and queue it for deletion
	
		//try to locate the player object from their ID
		if(player == 0) return;
		
		//If the player is indeed found
		var text = "~`" + player.color + "~`" + player.name + "~`yellow~` left the game!"; // write a message about the player leaving
		console.log(text); // print in terminal
		chatAll(text); // send it to all the players
		
		//DO NOT save the player's data.
	});
	socket.on('pingmsg',function(data){ // when the player pings to tell us that it's still connected
		if (typeof data === "undefined") return;
		// We don't need to check that data.time is well-defined.
		if(player == 0) return; // if player can't be found
		
		socket.binary(false).emit('reping', {time:data.time});
		player.pingTimer = 250; // make sure they dont get disconnected.
	});
	socket.on('key',function(data){ // on client keypress or key release
		if(typeof data === "undefined" || typeof data.inputId === 'undefined' || typeof data.state === 'undefined') return;
		if(player == 0) return;
		
		player.afkTimer = 20 * 25 * 60; // 20 minutes till we kick them for being afk
		
		//if they want to be revived after dying
		if(player.dead && data.inputId==='e'){
			player.dead = false;
			players[player.id] = player;
			delete deads[player.id];
			player.sendStatus();
			return;
		}
		
		if(player.empTimer > 0) return; // if they're EMPed, don't bother accepting key inputs.
		
		if(data.inputId==='e' && !player.docked) player.juke(false); // Q/E are juke keys
		if(data.inputId==='q' && !player.docked) player.juke(true);
		
		if(data.inputId==='w') player.w = data.state; // standard movement keys
		if(data.inputId==='s') player.s = data.state;
		if(data.inputId==='a') player.a = data.state;
		if(data.inputId==='d') player.d = data.state;
		if(data.inputId==='c') player.c = data.state; // elite special slot
		if(data.inputId===' ') player.space = data.state; // fire
		if(data.inputId==='x') player.dock(); // x or esc to enter base
		if(data.inputId==='shift'){ // drift
			player.e = data.state;
			if(!data.state) player.checkDriftAchs(); // if they let go of the drift key
		}
	});
	socket.on('chat',function(data){ // when someone sends a chat message
		if (typeof data === "undefined" || typeof data.msg !== 'string' || data.msg.length == 0 || data.msg.length > 128) return;

		if(player == 0) return;
		
		if(guestsCantChat && player.guest) {
			socket.binary(false).emit("chat",{msg:'You must create an account in the base before you can chat!', color:'yellow'});
			return;
		}
		
		console.log(player.name + ": " + data.msg); // print their raw message
		
		data.msg = data.msg.trim(); // "   hi   " => "hi"
		if(!player.name.includes(" ")) data.msg = data.msg.replace(/~`/ig, ''); // Normies can't triforce
		data.msg = filter.clean(data.msg); // censor
		
		if(player.muteTimer > 0) return; // if they're muted
		player.chatTimer += 100; // note this as potential spam
		if(player.chatTimer > 600){ // exceeded spam limit: they are now muted
			socket.binary(false).emit('chat', {msg:("~`red~`You have been muted for " +Math.floor(player.muteCap/25) + " seconds!")});
			player.muteTimer = player.muteCap;
			player.muteCap *= 2; // their next mute will be twice as long
		}

		if(data.msg.startsWith("/")){//handle commands
			if(player.guest) return;
			runCommand(player, data.msg);
		} else { // otherwise send the text
			var spaces = "";
			for(var i = player.name.length; i < 16; i++) spaces += " "; // align the message
			const finalMsg = "~`" + player.color + "~`" + spaces + player.name + "~`yellow~`: " + data.msg;
			if(player.globalChat == 0) sendAll('chat', {msg:finalMsg});//sendTeam(player.color, 'chat', {msg:finalMsg});
		}
	});
	socket.on('toggleGlobal',function(data){ // player wants to switch what chat room they're in
		if(player == 0) return;
		player.globalChat = (player.globalChat+1)%2;
	});
	socket.on('sell',function(data){ // selling ore
		if (typeof data === "undefined" || player == 0  || !player.docked || typeof data.item !== 'string' || !player.docked) return;
		
		//pay them appropriately
		if(data.item == 'iron' || data.item == 'all'){
			player.money += player.iron * (player.color == "red"?1:2);
			player.iron = 0;
		} if(data.item == 'silver' || data.item == 'all'){
			player.money += player.silver * 1.5;
			player.silver = 0;
		} if(data.item == 'platinum' || data.item == 'all'){
			player.money += player.platinum * (player.color == "blue"?1:2);
			player.platinum = 0;
		} if(data.item == 'aluminium' || data.item == 'all'){
			player.money += player.aluminium * 1.5;
			player.aluminium = 0;
		}
		
		player.save();
		
	});
	socket.on('buyShip',function(data){ // client wants to buy a new ship
		if (typeof data === "undefined" || player == 0  || !player.docked || typeof data.ship !== 'number') return;
		
		data.ship = Math.floor(data.ship); // the ship index must be integer. It must be no higher than your rank, and cannot be your current ship or out of bounds.
		if(data.ship > player.rank || data.ship < 0 || data.ship > ships.length || data.ship == player.ship) return;
		
		var price = -ships[player.ship].price * -.75; // refund them .75x their own ship's price.
		price += ships[data.ship].price;
		if(player.money < price) return; // if it cannot be afforded
			
		//sell all ore
		player.money += (player.aluminium+player.platinum+player.silver+player.iron) * 1.5; // TODO this is wrong.
		player.aluminium = player.iron = player.silver = player.platinum = 0;
			
		player.money -= price; // charge them money
		player.ship = data.ship; // Give them the next ship
		
		player.va = ships[data.ship].agility * .08 * player.agility2; // TODO this is going to be redone
		player.thrust = ships[data.ship].thrust * player.thrust2;
		player.maxHealth = Math.round(player.health = ships[data.ship].health * player.maxHealth2);
		player.capacity = Math.round(ships[data.ship].capacity * player.capacity2);
		
		player.equipped = 0; // set them as being equipped on their first weapon
		socket.binary(false).emit('equip', {scroll:player.equipped});
		
		for(var i = 0; i < 10; i++) if(player.weapons[i]==-2 && i < ships[player.ship].weapons) player.weapons[i] = -1; // unlock new possible weapon slots
		player.calculateGenerators();
		sendWeapons(socket.id);
		player.save();
	});
	socket.on('buyW',function(data){ // client wants to buy a weapon
		if (typeof data === "undefined" || player == 0  || !player.docked || typeof data.slot !== 'number' || typeof data.weapon !== 'number') return;
		
		data.slot = Math.floor(data.slot);
		data.weapon = Math.floor(data.weapon);
		if(data.slot < 0 || data.slot > 9 || data.weapon < 0 || data.weapon >= wepns.length) return; // if they sent out of bound variables
		
		// they cant buy when not docked. That slot must be unlocked. They need to have enough money. They need to have sufficiently high of a ship.
		if(!player.docked || player.weapons[data.slot] != -1 || player.money < wepns[data.weapon].price || wepns[data.weapon].Level > player.ship) return;
		
		player.money -= wepns[data.weapon].price; // take their money
		player.weapons[data.slot] = data.weapon; // give them the weapon
		player.refillAllAmmo(); // give them ammo
		sendWeapons(socket.id); // tell the client what they've been given
		player.calculateGenerators();
		player.save();
	});
	socket.on('buyLife',function(data){ // client wants to buy a life
		if(player == 0  || !player.docked|| player.lives >= 20) return;
		var price = expToLife(player.experience,player.guest); // compute how much the life costs them
		if(player.money < price) return; // cant afford
		
		player.money -= price; // take money
		player.lives++; // give life
		player.sendStatus(); // tell the client about it
		player.save();
	});
	socket.on('upgrade',function(data){ // client wants to upgrade a tech
		//TODO im totally redoing this
		if (typeof data === "undefined" || player == 0  || !player.docked || typeof data.item !== 'number' || data.item > 5 || data.item < 0) return;
		var item = Math.floor(data.item);
		
		switch(item){
			case 1: // radar
				if(player.money>=Math.round(Math.pow(1024,player.radar2)/1000)*1000){
					player.money-=Math.round(Math.pow(1024,player.radar2)/1000)*1000;
					player.radar2+=.2;
				}
				break;
			case 2: // cargo
				if(player.money>=Math.round(Math.pow(1024,player.capacity2)/1000)*1000){
					player.money-=Math.round(Math.pow(1024,player.capacity2)/1000)*1000;
					player.capacity2+=.2;
					player.capacity = Math.round(ships[player.ship].capacity * player.capacity2);
				}
				break;
			case 3:
				if(player.maxHealth2 > 3.99){
					player.maxHealth2 = 4;
					break;
				} // hull
				if(player.money>=Math.round(Math.pow(1024,player.maxHealth2)/1000)*1000){
					player.money-=Math.round(Math.pow(1024,player.maxHealth2)/1000)*1000;
					player.maxHealth2+=.2
					player.maxHealth = Math.round(ships[player.ship].health * player.maxHealth2);
				}
				break;
			case 4: // energy
				if(player.money>=Math.round(Math.pow(4096,player.energy2)/1000)*1000){
					player.money-=Math.round(Math.pow(4096,player.energy2)/1000)*1000;
					player.energy2+=.2;
				}
				break;
			case 5: // agility
				if(player.money>=Math.round(Math.pow(1024,player.agility2)/1000)*1000){
					player.money-=Math.round(Math.pow(1024,player.agility2)/1000)*1000;
					player.agility2+=.2;
					player.va = ships[player.ship].agility * .08 * player.agility2;
				}
				break;
			default: //0: thrust
				if(player.money>=Math.round(Math.pow(1024,player.thrust2)/1000)*1000){
					player.money-=Math.round(Math.pow(1024,player.thrust2)/1000)*1000;
					player.thrust2+=.2;
					player.thrust = ships[player.ship].thrust * player.thrust2;
				}
				break;
		}
		player.save();
	});
	socket.on('sellW',function(data){ // wants to sell a weapon.
		if (typeof data === "undefined" || player == 0  || !player.docked || typeof data.slot !== 'number' || data.slot < 0 || data.slot > 9 || player.weapons[data.slot] < 0 || player.weapons[data.slot] > wepns.length - 1) return;
		
		data.slot = Math.floor(data.slot);
		if(!player.docked || player.weapons[data.slot] < 0) return; // can't sell what you don't have. or when you're not in base.
		player.money += wepns[player.weapons[data.slot]].price * .75; // refund them a good bit
		player.calculateGenerators();
		player.weapons[data.slot] = -1; // no weapon here anymore. TODO should this ever turn into -2?
		player.refillAllAmmo(); // remove their ammo
		sendWeapons(socket.id); // alert client of transaction
		player.save();
	});
	socket.on('quest',function(data){ // wants to accept a quest
		if (typeof data === "undefined" || player == 0  || !player.docked || player.quest!=0 || typeof data.quest !== 'number' || data.quest < 0 || data.quest > 9) return;
		
		var qid = Math.floor(data.quest); // Find the correct quest.
		var quest = (player.color === "red"?rQuests:bQuests)[qid];
		
		//You need to have unlocked this quest type.
		if(quest == 0 || (quest.type === "Base" && player.rank < 7) || (quest.type === "Secret" && player.rank <= 14)) return;
		
		if(((quest.dsx == 3 && quest.dsy == 3) || (quest.sx == 3 && quest.sy == 3)) && !player.randmQuest[2]){ // risky business
			player.randmQuest[2] = true;
			player.sendAchievementsMisc(true);
		}
		
		if(player.color === "red") rQuests[qid] = 0; else bQuests[qid] = 0; // note that quest as taken and queue it to be remade. TODO can we just remake it here?
		player.quest = quest; // give them the quest and tell the client.
		socket.binary(false).emit('quest', {quest: quest});
		
	});
	/*socket.on('cancelquest',function(data){ // THIS IS NO LONGER ALLOWED.
		var player = dockers[socket.id];
		if(typeof player === "undefined")
			return;
		player.quest = 0;
		socket.binary(false).emit('quest', {quest: player.quest});
	}); // no longer allowed.*/
	socket.on('equip',function(data){ // Player wants to select a new weapon to hold
		if (player == 0 || typeof data === "undefined" || typeof player === "undefined" || typeof data.scroll !== 'number' || data.scroll >= ships[player.ship].weapons) return;
		
		player.equipped = Math.floor(data.scroll); // Set their equipped weapon
		if(player.equipped < 0) player.equipped = 0; // Ensure it's in range
		else if(player.equipped > 9) player.equipped = 9;
		
		socket.binary(false).emit('equip', {scroll:player.equipped}); // Alert the client
	});
	socket.on('trail',function(data){ // Player requests an update to their trail
		if (typeof data === "undefined" || player == 0  || !player.docked || typeof data.trail !== 'number') return;
		
		if(data.trail == 0) player.trail = 0;
		if(data.trail == 1 && player.killsAchs[12]) player.trail = 1;
		if(data.trail == 2 && player.moneyAchs[11]) player.trail = 2;
		if(data.trail == 3 && player.driftAchs[11]) player.trail = 3;
		if(data.trail == 4 && player.randmAchs[11]) player.trail = 4;
		if(player.name.includes(" ")) player.trail += 16;
		
	});
});
function parseBoolean(s){
	return (s === 'true');
}
function findBisector(a1, a2){ // finds the angle bisector of a1 and a2
	a1 = a1 * 180 / Math.PI;
	a2 = a2 * 180 / Math.PI;
	a1 = mod(a1, 360);
	a2 = mod(a2, 360);
	var small = Math.min(a1, a2);
	var big = Math.max(a1, a2);
	var angle = (big - small) / 2 + small;
	if(big - small > 180) angle += 180;
	return angle * Math.PI / 180;
}
function atan(y, x){ // arctangent, but fast
	var a = Math.min(abs(x), abs(y)) / Math.max(abs(x), abs(y));
	var s = a * a;
	var r = ((-0.0464964749 * s + 0.15931422) * s - 0.327622764) * s * a + a;
	if (abs(y) > abs(x)) r = 1.57079637 - r;
	if (x < 0) r = 3.14159274 - r;
	if (y < 0) r = -r;
	return r;
}
function expToLife(exp, guest){ // how much a life costs, given your exp and whether you're logged in
	return Math.floor(guest?0:200000*(1/(1+Math.exp(-exp/15000.))+Math.atan(exp/150000.)-.5))+500;
}
function calculateInterceptionAngle(ax,ay,vx,vy,bx,by) { // for finding where to shoot at a moving object
	var s = wepns[3].Speed;
	var ox = ax-bx;
	var oy = ay-by;

	var h1 = vx*vx + vy*vy - s*s;
	var h2 = ox*vx + oy*vy;
	var t;
	if (h1 == 0) { // problem collapses into a simple linear equation 
		t = -(ox * ox + oy * oy) / (2*h2);
	} else { // solve the quadratic equation
		var minusPHalf = -h2 / h1;

		var discriminant = minusPHalf * minusPHalf - (ox * ox + oy * oy) / h1; // term in brackets is h3
		if (discriminant < 0) return Math.atan2(by-ay,bx-ax); //complex solution

		var root = Math.sqrt(discriminant);

		var t1 = minusPHalf + root;
		var t2 = minusPHalf - root;

		var tMin = Math.min(t1, t2);
		var tMax = Math.max(t1, t2);

		t = tMin > 0 ? tMin : tMax; // get the smaller of the two times, unless it's negative
		if (t < 0) return Math.atan2(by-ay,bx-ax); // solution in the past
	}
	
	// calculate the point of interception using the found intercept time
	var ix = ax + t*vx, iy = ay + t*vy;
	return Math.atan2(by-iy,bx-ix)+Math.PI;
}
function square(x){
	return x * x;
}
function abs(x){
	return x > 0?x:-x;
}
function pdist(x, sx, sy){ // used in blast collision algorithm
	var i1 = ((sx * sx * sx + sy * sy) % 5 + 1) / 2.23; // Geometric mean of 5 and 1
	var i2 = ((sx * sx + sy) % 5 + 1) / 2.23;
	return (Math.cbrt(Math.abs(Math.tan(x))) % i2) * 3500 * i2 + 800 * i1 + 600;
}
function hash(str){ // ass. TODO chris
	var hash = 0;
	if (str.length == 0) return hash;
	for (var i = 0; i < str.length; i++) {
		var ch = str.charCodeAt(i);
		hash = ((hash<<5)-hash)+ch;
		hash &= hash;
	}
	return hash;
}
function mod(n, m) { // used in findBisector
    var remain = n % m;
    return Math.floor(remain >= 0 ? remain : remain + m);
}
function isOutOfBounds(obj){ // TODO this works but I'm not even using it anywhere. it would simplify some code if used.
	return obj.x < 0 || obj.y < 0 || obj.x >= sectorWidth || obj.y >= sectorWidth;
}
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
function angleBetween(a, b){ // delimited to [-pi,pi]
	return Math.atan2(a.y - b.y, a.x - b.x);
}
function squaredDist(a, b){ // distance between two points squared. i.e. c^2
	return square(a.y - b.y) + square(a.x - b.x);
}



//TODO Merge these
function updateQuestsR(){
	var i = 0;
	for(i = 0; i < 10; i++){
		if(rQuests[i] == 0) break;
		if(i == 9) return;
	}
	var r = Math.random();
	var r2 = Math.random();
	var metals = ["aluminium", "silver", "platinum", "iron"];
	var nm = 0;
	if(i < 4){
		var dsxv = Math.floor(r2 * 100 % 1 * mapSz), dsyv = Math.floor(r2 * 1000 % 1 * mapSz);
		var sxv = Math.floor(r2 * mapSz), syv = Math.floor(r2 * 10 % 1 * mapSz);
		if(dsxv == sxv && dsyv == syv) return;
		nm = {type:"Delivery", metal: metals[Math.floor((r * 4 - 2.8) * 4)], exp: Math.floor(1+Math.sqrt(square(sxv - dsxv) + square(syv - dsyv))) * 16000, sx: sxv, sy: syv, dsx: dsxv, dsy: dsyv};
	}
	else if(i < 7) nm = {type:"Mining", metal: metals[Math.floor(r * 4)], exp: 50000, amt: Math.floor(1200 + r * 400), sx: baseMap[Math.floor(r2 * 5) * 2], sy: baseMap[Math.floor(r2 * 5) * 2 + 1]};
	else if(i < 9) nm = {type:"Base", exp: 75000, sx: mapSz - 1 - baseMap[Math.floor(r2 * 5) * 2], sy: mapSz - 1 - baseMap[Math.floor(r2 * 5) * 2 + 1]};
	else nm = {type:"Secret", exp: 300000, sx: mapSz - 1 - baseMap[Math.floor(r2 * 5) * 2], sy: mapSz - 1 - baseMap[Math.floor(r2 * 5) * 2 + 1]};
	rQuests[i] = nm;
}
function updateQuestsB(){
	var i = 0;
	for(i = 0; i < 10; i++){
		if(bQuests[i] == 0) break;
		if(i == 9) return;
	}
	var r = Math.random();
	var r2 = Math.random();
	var metals = ["aluminium", "silver", "platinum", "iron"];
	var nm = 0;
	if(i < 4){
		var dsxv = Math.floor(r2 * 100 % 1 * mapSz), dsyv = Math.floor(r2 * 1000 % 1 * mapSz);
		var sxv = Math.floor(r2 * mapSz), syv = Math.floor(r2 * 10 % 1 * mapSz);
		if(dsxv == sxv && dsyv == syv) return;
		nm = {type:"Delivery", metal: metals[Math.floor((r * 4 - 2.8) * 4)], exp: Math.floor(1+Math.sqrt((sxv - dsxv)*(sxv - dsxv) + (syv - dsyv)*(syv - dsyv))) * 16000, sx: sxv, sy: syv, dsx: dsxv, dsy: dsyv};
	}else if(i < 7) nm = {type:"Mining", metal: metals[Math.floor(r * 4)], exp: 50000, amt: Math.floor(1200 + r * 400), sx: mapSz - 1 - baseMap[Math.floor(r2 * 5) * 2], sy: mapSz - 1 - baseMap[Math.floor(r2 * 5) * 2 + 1]};
	else if(i < 9) nm = {type:"Base", exp: 75000, sx: baseMap[Math.floor(r2 * 5) * 2], sy: baseMap[Math.floor(r2 * 5) * 2 + 1]};
	else nm = {type:"Secret", exp: 300000, sx: baseMap[Math.floor(r2 * 5) * 2], sy: baseMap[Math.floor(r2 * 5) * 2 + 1]};
	bQuests[i] = nm;
}





function runCommand(player, msg){ // player just sent msg in chat and msg starts with a /

	var correct = true;
	
	if(msg.startsWith("/password ")) player.changePass(msg.substring(10));
	else if(msg.startsWith("/me ")) chatAll("~~`" + player.color + "~`" + player.name + "~`yellow~` " + msg.substring(4));
	else if(msg.startsWith("/confirm ")) player.confirmPass(msg.substring(9));
	else if(msg === "/changeteam") send(player.id, "chat", {msg:"Are you sure? This costs 10% of your experience and money. You must have 10,000 exp. Type /confirmteam to continue."});
	else if(msg === "/confirmteam" && player.experience > 10000) {player.color = (player.color === "red"?"blue":"red"); player.money *= .9; player.experience *= .9; player.save();}
	else if(msg.toLowerCase().startsWith("/pm ")) player.pm(msg);
	else if(msg.toLowerCase().startsWith("/r ")) player.r(msg);
	else if(msg.toLowerCase().startsWith("/swap ")) player.swap(msg);
	else correct = false;
	
	//moderator commands
	if(player.name.includes(" ")){
		if(msg.startsWith("/broadcast ")) sendAll('chat', {msg:"~`#f66~`       BROADCAST: ~`lime~`"+msg.substring(11)});
		else if(msg.startsWith("/mute ")) mute(msg);
		else correct = false;
	}
	
	//owner commands
	else if(player.name.includes("[O]")){
		if(msg === "/reboot") initReboot();
		else if(msg.startsWith("/smite ")) smite(msg);
		else if(msg === "/undecayPlayers") decayPlayers(undecay);
		else if(msg === "/spawnNN") spawnNNBot(player.sx, player.sy, Math.random()>.5?"red":"blue");
		else if(msg === "/decayPlayers") decayPlayers(decay);
		else if(msg === "/saveTurrets") saveTurrets();
		else correct = false;
	}
	
	if(!correct) send(player.id, "chat", {msg:"~`red~`Unknown Command."});
	
	return;
}
function mute(msg){
	
	if(msg.split(" ").length != 3) return; // split looks like {"/mute", "name", "minutesToMute"}
	var name = msg.split(" ")[1];
	var minutes = parseFloat(msg.split(" ")[2]);
	if(typeof time !== "number") return;
	
	for(var x = 0; x < mapSz; x++) for(var y = 0; y < mapSz; y++)
		for(var p in players[y][x]){ // search all players
			var player = players[y][x][p];
			if(player.name === name){player.mute(minutes);return;}
	}
	for(var p in dockers){
		var player = dockers[p];
		if(player.name === name){player.mute(minutes);return;}
	}
	for(var p in deads){
		var player = deads[p];
		if(player.name === name){player.mute(minutes);return;}
	}
}
function smite(msg){
	if(msg.split(" ").length != 2) return;
	var name = msg.split(" ")[1];
	for(var x = 0; x < mapSz; x++) for(var y = 0; y < mapSz; y++)
		for(var p in players[y][x]){ // only search players who are in game
			var player = players[y][x][p];
			if(player.name === name){
				player.die(0);
				chatAll("~`violet~`" + player.name + "~`yellow~` has been Smitten!");
				return;
			}
		}
}






var sectors = new Array(9);
init();
function init(){ // start the server!

	console.log("");
	for(var i = 0; i < 5; i++)console.log("=== STARTING SERVER ON PORT "+port+" ===");

	// create folders for players, neural nets, and turrets if they dont exist
	buildFileSystem();
	
	//initialize lists of quests
	for(var i = 0; i < 10; i++){
		bQuests[i] = 0;
		rQuests[i] = 0;
	}
	
	spawnBases();
	
	//make asteroids. Make 10 times the number of sectors.
	for(var i = 0; i < mapSz*mapSz*10; i++) createAsteroid();
	
	//Make exactly one planet in each sector.
	for(var s = 0; s < mapSz * mapSz; s++){
		var x = s % mapSz;
		var y = Math.floor(s / mapSz);
		createPlanet(planets[s], x, y);
	}
	
	var astPack = new Array(mapSz);
	for(var i = 0; i < mapSz; i++){
		astPack[i] = new Array(mapSz);
		for(var j = 0; j < mapSz; j++) astPack[i][j] = [];
	}
	for(var x = 0; x < mapSz; x++) for(var y = 0; y < mapSz; y++) for(var i in asts[y][x]){
		var ast = asts[y][x][i];
		astPack[ast.sx][ast.sy].push({metal:ast.metal,id:ast.id,x:ast.x,y:ast.y, angle:ast.angle,health:ast.health,maxHealth:ast.maxHealth});
	}
	for(var i = 0; i < mapSz; i++)
		sectors[i] = new Array(mapSz);
	for(var i = 0; i < baseMap.length; i+=2){
		sectors[baseMap[i]][baseMap[i+1]] = 1;
		sectors[mapSz-1-baseMap[i]][mapSz-1-baseMap[i+1]] = 2;
	}
	
	//wormhole
	var id = Math.random();
	var v = new Vortex(id, Math.random() * sectorWidth, Math.random() * sectorWidth, Math.floor(Math.random() * mapSz), Math.floor(Math.random() * mapSz), .5, 0, true);
	vorts[v.sy][v.sx][id] = v;
	
	//Black Hole in D4
	id = Math.random();
	v = new Vortex(id, sectorWidth/2, sectorWidth/2, 3, 3, .15, 0, false);
	vorts[v.sy][v.sx][id] = v;
	
	//load existing turrets
	loadTurrets();
	
	//start ticking
	setTimeout(update, 40);
	setTimeout(updateLB,60000);

	console.log("Server initialized successfully. Game log below.\n");
}
function buildFileSystem(){ // create the server files/folders
	console.log("\nCreating any potential missing files and folders needed for the server...");
	var allGood = true;


	var dir = './client/leaderboard';
	if (!fs.existsSync(dir)) {console.log("Creating "+dir+" directory..."); fs.mkdirSync(dir); allGood = false;}

	fs.writeFileSync("client/leaderboard/index.html", "Leaderboard not ready yet...", (err) => {
		if (err) console.log(err); console.log("Created leaderboard file.");
	});

	var dir = './server';
	if (!fs.existsSync(dir)) {console.log("Creating "+dir+" directory..."); fs.mkdirSync(dir); allGood = false;}
	dir = './server/neuralnets';
	if (!fs.existsSync(dir)) {console.log("Creating "+dir+" directory..."); fs.mkdirSync(dir); allGood = false;}
	dir = './server/players';
	if (!fs.existsSync(dir)) {console.log("Creating "+dir+" directory..."); fs.mkdirSync(dir); allGood = false;}
	dir = './server/turrets';
	if (!fs.existsSync(dir)) {console.log("Creating "+dir+" directory..."); fs.mkdirSync(dir); allGood = false;}


	if(allGood) console.log("All server files were already present!");
}
function spawnBases(){
	console.log("\nSpawning "+(baseMap.length/2)+" Bases...");
	//spawn bases
	for(var i = 0; i < baseMap.length; i+=2){
		//make a red base at these coords
		var randBase = Math.random();
		var redBase = Base(randBase, true, baseMap[i], baseMap[i+1], 'red', sectorWidth/2, sectorWidth/2);
		bases[baseMap[i]][baseMap[i+1]] = redBase;
		
		//mirror coordinates and make a blue base
		randBase = Math.random();
		var blueBase = Base(randBase, true, mapSz - 1-baseMap[i], mapSz - 1-baseMap[i+1], 'blue', sectorWidth/2, sectorWidth/2);
		bases[mapSz - 1-baseMap[i]][mapSz - 1-baseMap[i+1]] = blueBase;
	}
}
function loadTurrets(){
	var count = 0;
	console.log("\nLoading Turrets...");
	var items = fs.readdirSync('server/turrets/');
	
	for(var i in items){
		count++;
		console.log("Turret found: " + items[i]);
		var data = fs.readFileSync("server/turrets/"+items[i], 'utf8').split(":");
		var id = parseFloat(data[3]);
		var b = new Base(id, false, parseFloat(data[8]), parseFloat(data[9]), data[4], parseFloat(data[6]), parseFloat(data[7]));
		b.kills = parseFloat(data[0]);
		b.experience = parseFloat(data[1]);
		b.money = parseFloat(data[2]);
		b.owner = data[5];
		bases[parseFloat(data[8])][parseFloat(data[9])] = b;
	}
	
	console.log(count+" turret(s) loaded.\n");
}



function spawnBot(sx,sy,col,rbNow,bbNow){
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
	bot.name = "";
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
function spawnNNBot(sx,sy,col){
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
	bot.name = "Drone";
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



function sendRef(){
	sendAll('refresh', {});
}
function kill(){
	process.exit();
}
function createAsteroid(){
	var sx = Math.floor(Math.random()*mapSz);
	var sy = Math.floor(Math.random()*mapSz);
	var vert = (sy + 1) / (mapSz + 1);
	var hor = (sx + 1) / (mapSz + 1);
	var metal = (Math.random()<hor?1:0) + (Math.random()<vert?2:0);
	var randA = Math.random();
	var h = Math.ceil(Math.random()*1200+200);
	var ast = Asteroid(randA, h, sx, sy, metal);
	asts[ast.sy][ast.sx][randA] = ast;
}
function createPlanet(name, sx, sy){
	var randA = Math.random();
	var planet = Planet(randA, name);
	while(square(planet.x - sectorWidth/2)+square(planet.y - sectorWidth/2) < 3000000){
		planet.x=Math.floor(Math.random() * sectorWidth*15/16 + sectorWidth/32);
		planet.y=Math.floor(Math.random() * sectorWidth*15/16 + sectorWidth/32);
	}
	planets[sy][sx] = planet;
}
function endRaid(){
	var winners = "yellow";
	if(raidRed > raidBlue) winners = "red";
	else if(raidBlue > raidRed) winners = "blue";
	raidTimer = 360000;
	for(var i in sockets){
		var p = getPlayer(i);
		if(p == 0 || p.color !== winners) continue;
		p.spoils("money",p.points * 40000);
		p.points = 0;
	}
	sendRaidData();
}
function update(){
	ops++;
	if(ops < 2) setTimeout(update, 40);
	tick++;
	if(Math.random() < 0.0001) IPSpam[Math.floor(Math.random())] = 0;
	var d = new Date();
	var lagTimer = d.getTime();
	updateQuestsR();
	updateQuestsB();
	var pack = new Array(mapSz);
	var missilePack = new Array(mapSz);
	var orbPack = new Array(mapSz);
	var minePack = new Array(mapSz);
	var bPack = new Array(mapSz);
	var blastPack = new Array(mapSz);
	var beamPack = new Array(mapSz);
	var planetPack = new Array(mapSz);
	var packPack = new Array(mapSz);
	var basePack = new Array(mapSz);
	var astPack = new Array(mapSz);
	var vortPack = new Array(mapSz);
	for(var i = 0; i < mapSz; i++){
		pack[i] = new Array(mapSz);
		missilePack[i] = new Array(mapSz);
		orbPack[i] = new Array(mapSz);
		minePack[i] = new Array(mapSz);
		bPack[i] = new Array(mapSz);
		blastPack[i] = new Array(mapSz);
		beamPack[i] = new Array(mapSz);
		planetPack[i] = new Array(mapSz);
		basePack[i] = new Array(mapSz);
		packPack[i] = new Array(mapSz);
		astPack[i] = new Array(mapSz);
		vortPack[i] = new Array(mapSz);
		for(var j = 0; j < mapSz; j++){
			pack[i][j] = [];
			packPack[i][j] = [];
			missilePack[i][j] = [];
			orbPack[i][j] = [];
			minePack[i][j] = [];
			bPack[i][j] = [];
			blastPack[i][j] = [];
			beamPack[i][j] = [];
			planetPack[i][j] = [];
			basePack[i][j] = 0;
			astPack[i][j] = [];
			vortPack[i][j] = [];
		}
	}
	
	for(var i in dockers){
		var player = dockers[i];
		if(player.dead) continue;
		if(player.testAfk()) continue;
		if(tick % 30 == 0) player.checkMoneyAchievements();
		if(player.chatTimer > 0) player.chatTimer--;
		player.muteTimer--;
	}
	
	for(var y = 0; y < mapSz; y++) for(var x = 0; x < mapSz; x++){
		for(var i in players[y][x]){
			var player = players[y][x][i];
			if(!player.isBot && player.chatTimer > 0) player.chatTimer--;
			player.muteTimer--;
			if(player.testAfk()) continue;
			player.isLocked = false;
			player.tick();
			if(player.disguise > 0) continue;
			pack[player.sy][player.sx].push({trail:player.trail,shield:player.shield,empTimer:player.empTimer,hasPackage:player.hasPackage,id:player.id,ship:player.ship,speed:player.speed,maxHealth:player.maxHealth,color:player.color, x:player.x,y:player.y, name:player.name, health: player.health, angle:player.angle, driftAngle: player.driftAngle});
		}
		
		for(var i in bullets[y][x]) bullets[y][x][i].tick();
		
		for(var i in vorts[y][x]){
			var vort = vorts[y][x][i];
			vort.tick();
			if(typeof vortPack[vort.sy][vort.sx] !== "undefined") vortPack[vort.sy][vort.sx].push({x:vort.x,y:vort.y,size:vort.size, isWorm:vort.isWorm});
		}
		
		for(var i in mines[y][x]){
			var mine = mines[y][x][i];
			mine.tick();
			minePack[y][x].push({wepnID:mine.wepnID,color:mine.color,x:mine.x,y:mine.y, angle:mine.angle});
		}
		
		planets[x][y].tick();
		
		for(var i in packs[y][x]){
			var boon = packs[y][x][i];
			if(tick % 5 == 0) boon.tick();
			packPack[boon.sy][boon.sx].push({x:boon.x, y:boon.y, type:boon.type});
		}
		
		for(var i in beams[y][x]){
			var beam = beams[y][x][i];
			beam.tick();
			if(beam.time == 0) continue;
			beamPack[beam.sy][beam.sx].push({time:beam.time,wepnID:beam.wepnID,bx:beam.origin.x,by:beam.origin.y,ex:beam.enemy.x,ey:beam.enemy.y});
		}
		
		for(var i in blasts[y][x]){
			var blast = blasts[y][x][i];
			blast.tick();
			if(blast.time == 0) continue;
			blastPack[blast.sy][blast.sx].push({time:blast.time,wepnID:blast.wepnID,bx:blast.bx,by:blast.by,angle:blast.angle});
		}
		
		var base = bases[y][x];
		if(base != 0){
			base.tick(rbNow,bbNow);
			basePack[base.sy][base.sx] = {id:base.id,live:base.turretLive, isBase: base.isBase,maxHealth:base.maxHealth,health:base.health,color:base.color,x:base.x,y:base.y, angle:base.angle, spinAngle:base.spinAngle,owner:base.owner};
		}
		
		for(var i in asts[y][x]){
			var ast = asts[y][x][i];
			ast.tick();
			astPack[ast.sy][ast.sx].push({metal:ast.metal,id:ast.id,x:ast.x,y:ast.y, angle:ast.angle,health:ast.health,maxHealth:ast.maxHealth});
		}
		
		for(var j in orbs[y][x]){
			var orb = orbs[y][x][j];
			orb.tick();
			if(typeof orb === 'undefined') return;
			orbPack[orb.sy][orb.sx].push({wepnID:orb.wepnID,x:orb.x,y:orb.y});
			if(tick % 5 == 0 && orb.locked == 0){
				var locked = 0;
				for(var i in pack[orb.sy][orb.sx]){
					var player = pack[orb.sy][orb.sx][i];
					var dist = squareDist(player,orb);
					if(player.empTimer <= 0 && player.color != orb.color && dist < wepns[orb.wepnID].Range * wepns[orb.wepnID].Range * 100){
						if(locked == 0) locked = player.id;
						else if(typeof players[locked] !== 'undefined' && dist < square(players[locked].x - orb.x)+square(players[locked].y - orb.y)) locked = player.id;
					}
				}
				orb.locked = locked;
				if(locked != 0) continue;
				if(basePack[orb.sy][orb.sx] != 0 && basePack[orb.sy][orb.sx].color != orb.color && basePack[orb.sy][orb.sx].turretLive && locked == 0) locked = base.id;
				orb.locked = locked;
				if(locked != 0) continue;
				for(var i in astPack[orb.sy][orb.sx]){
					var ast = astPack[orb.sy][orb.sx][i];
					var dist = squaredDist(ast,orb);
					if(dist < wepns[orb.wepnID].Range * wepns[orb.wepnID].Range * 100){
						if(locked == 0) locked = ast.id;
						else if(typeof asts[locked] != "undefined" && dist < squaredDist(asts[locked],orb)) locked = player.id;
					}
				}
				orb.locked = locked;
			}
		}
		for(var j in missiles[y][x]){
			var missile = missiles[y][x][j];
			missile.tick();
			if(typeof missile === 'undefined') return;
			missilePack[missile.sy][missile.sx].push({wepnID:missile.wepnID,x:missile.x,y:missile.y,angle:missile.angle});
			if(tick % 5 == 0 && missile.locked == 0){
				var locked = 0;
				for(var i in pack[missile.sy][missile.sx]){
					var player = pack[missile.sy][missile.sx][i];
					var dist = squareDist(player,missile);
					if(player.empTimer <= 0 && player.color != missile.color && dist < wepns[missile.wepnID].Range * wepns[missile.wepnID].Range * 100){
						if(locked == 0) locked = player.id;
						else if(typeof players[locked] !== 'undefined' && dist < squareDist(players[locked],missile))locked = player.id;
					}
				}
				missile.locked = locked;
				if(locked != 0) continue;
				if(basePack[missile.sy][missile.sx] != 0 && basePack[missile.sy][missile.sx].turretLive && locked == 0) locked = base.id;
				
				missile.locked = locked;
				if(locked != 0) continue;
				for(var i in astPack[missile.sy][missile.sx]){
					var player = astPack[missile.sy][missile.sx][i];
					var dist = squaredDist(player,missile);
					if(dist < wepns[missile.wepnID].Range * wepns[missile.wepnID].Range * 100){
						if(locked == 0) locked = player.id;
						else if(typeof asts[locked] != "undefined" && dist < squaredDist(asts[locked],missile)) locked = player.id;
					}
				}
				missile.locked = locked;
			}
		}
		for(var i in players[y][x]){
			var player = players[y][x][i];
			if(player.isBot) continue;
			if(tick % 12 == 0){ // LAG CONTROL
				send(i, 'online', {lag:lag, bp:bp, rp:rp, bg:bg, rg:rg, bb:bb, rb:rb});
				send(i, 'you', {killStreak:player.killStreak, killStreakTimer:player.killStreakTimer, name: player.name, points:player.points, va2:player.radar2, experience: player.experience, rank:player.rank, ship:player.ship, docked: player.docked,color:player.color, money: player.money, kills:player.kills, baseKills:player.baseKills, iron: player.iron, silver: player.silver, platinum: player.platinum, aluminium: player.aluminium});
			}
			send(i, 'posUp', {cloaked: player.disguise > 0, isLocked: player.isLocked, health:player.health, shield:player.shield, planetTimer: player.planetTimer, energy:player.energy, sx: player.sx, sy: player.sy,charge:player.reload,x:player.x,y:player.y, angle:player.angle, speed: player.speed,packs:packPack[player.sy][player.sx],vorts:vortPack[player.sy][player.sx],mines:minePack[player.sy][player.sx],missiles:missilePack[player.sy][player.sx],orbs:orbPack[player.sy][player.sx],blasts:blastPack[player.sy][player.sx],beams:beamPack[player.sy][player.sx],planets:planetPack[player.sy][player.sx], asteroids:astPack[player.sy][player.sx],players:pack[player.sy][player.sx], projectiles:bPack[player.sy][player.sx],bases:basePack[player.sy][player.sx]});
		}
	}
	
	var rbNow = rb;//important to calculate here, otherwise bots weighted on left.
	var bbNow = bb;

	
	for(var i in deads){
		var player = deads[i];
		if(tick % 12 == 0) // LAG CONTROL
			send(i, 'online', {lag:lag, bb:bb,rb:rb,bp:bp,rp:rp,rg:rg,bg:bg});
	}
	for(var i in dockers){
		var player = dockers[i];
		if(tick % 10 == 0){ // LAG CONTROL
			send(i, 'you', {killStreak:player.killStreak, killStreakTimer:player.killStreakTimer, name: player.name, t2: player.thrust2, va2:player.radar2, ag2:player.agility2, c2: player.capacity2, e2:player.energy2, mh2: player.maxHealth2, experience: player.experience, rank:player.rank, ship:player.ship,charge:player.reload, sx: player.sx, sy: player.sy,docked: player.docked,color:player.color,baseKills:player.baseKills,x:player.x,y:player.y, money: player.money, kills:player.kills, iron: player.iron, silver: player.silver, platinum: player.platinum, aluminium: player.aluminium});
			send(i, 'quests', {quests:player.color=='red'?rQuests:bQuests});
		}
	}
	if(raidTimer-- % 4000 == 0) sendRaidData();
	if(raidTimer <= 0) endRaid();
	deletePlayers();
	d = new Date();
	lag = d.getTime() - lagTimer;
	ops--;
}
function deletePlayers(){ // remove players that have left or are afk or whatever else
	for(var i in lefts){
		if(lefts[i]-- > 1) continue;
		for(var x = 0; x < mapSz; x++) for(var y = 0; y < mapSz; y++) delete players[y][x][i];
		delete sockets[i];
		delete dockers[i];
		delete deads[i];
		delete lefts[i];
	}
}
setInterval(updateHeatmap, 1000);
function updateHeatmap(){
	var hmap = [];
	var lb = [];
	for(var i = 0; i < mapSz; i++){
		hmap[i] = [];
		for(var j = 0; j < mapSz; j++) hmap[i][j] = 0;
	}
	var j = 0;
	rb = rg = rp = bp = bg = bb = raidRed = raidBlue = 0;
	
	for(var x = 0; x < mapSz; x++) for(var y = 0; y < mapSz; y++){
		for(var i in players[y][x]){
			var p = players[y][x][i];
			if(p.color === "red"){
				raidRed += p.points;
				if(p.isBot) rb++;
				else if(p.guest) rg++;
				else rp++;
			}else{
				raidBlue += p.points;
				if(p.isBot) bb++;
				else if(p.guest) bg++;
				else bp++;
			}
			if(p.name !== "" && p.name !== "Drone"){
				lb[j] = p;
				j++;
			}
			hmap[p.sx][p.sy]+=p.color === 'blue'?-1:1; // this is supposed to be x-y order. TODO fix
		}
	}
	for(var i in dockers){
		var p = dockers[i];
		if(p.color === "red"){
			raidRed += p.points;
			if(p.isBot) rb++;
			else if(p.guest) rg++;
			else rp++;
		}else{
			raidBlue += p.points;
			if(p.isBot) bb++;
			else if(p.guest) bg++;
			else bp++;
		}
		lb[j] = p;
		j++;
	}
	for(var i in deads){
		var p = deads[i];
		if(p.color === "red"){
			raidRed += p.points;
			if(p.isBot) rb++;
			else if(p.guest) rg++;
			else rp++;
		}else{
			raidBlue += p.points;
			if(p.isBot) bb++;
			else if(p.guest) bg++;
			else bp++;
		}
		lb[j] = p;
		j++;
	}
	
	
	for(var i = 0; i < lb.length-1; i++) // sort it
		for(var k = 0; k < lb.length - i - 1; k++){
			if(lb[k + 1].experience > lb[k].experience){
				var temp = lb[k + 1];
				lb[k + 1] = lb[k];
				lb[k] = temp;
			}
		}
		
	var lbSend = [];
	for(var i = 0; i < Math.min(16,j); i++) lbSend[i] = {name:lb[i].name,exp:Math.round(lb[i].experience),color:lb[i].color,rank:lb[i].rank};
	for(var i = 0; i < mapSz; i++) for(var j = 0; j < mapSz; j++){
		/*if(asteroids[i][j] >= 15) hmap[i][j] += 1500;
		else */hmap[i][j] += 500;
	}
	for(var i in lb) send(lb[i].id, 'heatmap', {hmap:hmap, lb:lbSend, youi:i, raidBlue:raidBlue, raidRed:raidRed});
}
function updateLB(){
	chatAll("Updating torn.space/leaderboard...\n");
	console.log("\nUpdating torn.space/leaderboard...");
	fs.readdir('server/players/', function(err, items) {
		var top1000names = [];
		var top1000kills = [];
		var top1000colors = [];
		var top1000exp = [];
		var top1000rank = [];
		for(var i = 0; i < 1000; i++){
			top1000names[i] = "Nobody!";
			top1000kills[i] = -1;
			top1000exp[i] = -1;
			top1000rank[i] = -1;
			top1000colors[i] = "yellow";
		}
		for (var i=0; i<items.length; i++) {//insertion sort cause lazy
			if(fs.lstatSync("server/players/"+items[i]).isDirectory())
				continue;
			var data = fs.readFileSync("server/players/"+items[i], 'utf8').split(":");
			var exp = Math.round(parseFloat(data[22]));
			if(exp > top1000exp[999]){
				var name = data[14];
				var kills = parseFloat(data[16]);
				var rank = parseFloat(data[23]);
				var color = ((name.includes(" "))?"lime":(data[0] === "red"?"pink":"cyan"));
				for(var j = 999; j >= 1; j--){
					if(exp > top1000exp[j - 1]){
						top1000kills[j] = top1000kills[j-1];
						top1000rank[j] = top1000rank[j-1];
						top1000exp[j] = top1000exp[j-1];
						top1000names[j] = top1000names[j-1];
						top1000colors[j] = top1000colors[j-1];
						top1000kills[j - 1] = kills;
						top1000rank[j - 1] = rank;
						top1000names[j - 1] = name;
						top1000colors[j - 1] = color;
						top1000exp[j - 1] = exp;
					}
					else break;
				}
			}
		}
		var source = 'client/leaderboard/index.html';
		if (fs.existsSync(source))
			fs.unlinkSync(source);
		var newFile = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml" dir="ltr" lang="en"><head>'+
		'<title>Leaderboard</title><link rel="stylesheet" href="../page.css" /></head>'+
		'<body><br><br><h1><div style="padding: 20px"><center><font color="#0099ff">Leaderboard'+
		'</font></center></div></h1>'+
		'<font color="#0099ff"><center><nobr><table><tr><th>#</th><th>Name</th><th>Exp</th><th>Rank</th><th>Kills</th></tr>';
		for(var i = 0; i < 1000; i++){
			newFile+='<tr style="color:' + top1000colors[i] + ';"><th>' + (i+1) + ".</th><th>" + top1000names[i] + "</th><th> " + top1000exp[i] + " </th><th>" + top1000rank[i] + "</th><th>" + top1000kills[i] + "</th></tr>";
			lbExp[i] = top1000exp[i];
		}
		newFile+='</table></nobr><br/>Updates every 25 minutes.</center></font></body></html>';
		fs.writeFileSync(source, newFile, {"encoding":'utf8'});
	});
	saveTurrets();
	setTimeout(updateLB,1000 * 25 * 60);
}



//meta
setTimeout(initReboot,86400*1000-6*60*1000);
function initReboot(){
	console.log("\nInitializing server reboot...\n");
	chatAll("Server is restarting in 5 minutes. Please save your progress as soon as possible.");
	setTimeout(function(){chatAll("Server is restarting in 4 minutes. Please save your progress as soon as possible.");}, 1*60*1000);
	setTimeout(function(){chatAll("Server is restarting in 3 minutes. Please save your progress as soon as possible.");}, 2*60*1000);
	setTimeout(function(){chatAll("Server is restarting in 2 minutes. Please save your progress as soon as possible.");}, 3*60*1000);
	setTimeout(function(){chatAll("Server is restarting in 1 minute. Please save your progress as soon as possible.");}, 4*60*1000);
	setTimeout(function(){chatAll("Server is restarting in 30 seconds. Please save your progress as soon as possible.");}, (4*60+30)*1000);
	setTimeout(function(){chatAll("Server is restarting in 10 seconds. Please save your progress as soon as possible.");}, (4*60+50)*1000);
	setTimeout(function(){chatAll("Server restarting...");}, (4*60+57)*1000);
	setTimeout(shutdown, 5*60*1000);
}
function shutdown(){
	saveTurrets();
	decayPlayers();
	process.exit();
}
function saveTurrets(){

	//delete files
	var count = 0;
	var items = fs.readdirSync('server/turrets/');
	for(var i in items){
		fs.unlinkSync('server/turrets/' + items[i]);
		count++;
	}
	chatAll(count + " Turrets Currently Saved");

	//save em
	setTimeout(function(){
		count = 0;
		chatAll("Saving Turrets...");
		for(var i = 0; i < mapSz; i++)
			for(var j = 0; j < mapSz; j++){
				var base = bases[i][j];
				if(base != 0 && !base.isBase){
					base.save();
					count++;
				}
			}
		chatAll(count + " Turrets Saved!");
	},1000);
}
function decayPlayers(){
	sendAll("chat",{msg:"Decaying Players..."});
	console.log("\nDecaying players...")
	var items = fs.readdirSync('server/players/');
	
	
	sendAll("chat",{msg:"Files identified: " + items.length});
	for (var i=0; i<items.length; i++) {
		var source = "server/players/"+items[i];
		if(fs.lstatSync(source).isDirectory()) continue;
		var data = fs.readFileSync(source, 'utf8');
		var split = data.split(":");
		if(split.length < 85){
			if(split.length < 15) sendAll("chat",{msg:"File " + source + " unreadable. " + split.length + " entries."});
			else{
				var log = "Player " + split[14] + " failed to decay due to an unformatted save file with " + split.length + " entries. Cleaning file.";
				sendAll("chat",{msg:log});
				console.log("\n"+log+"\n");
				cleanFile(source);
			}
			continue;
		}
		data = "";
		var decayRate = (split[85] === "decay"?.985:.995);

		split[22] = decay(parseFloat(split[22]),decayRate);//xp
		split[15] = decay(parseFloat(split[15]),decayRate);//money
		//split[84] = decay(parseFloat(split[84]),decayRate);//energy
		//split[26] = decay(parseFloat(split[26]),decayRate);//thrust
		//split[27] = decay(parseFloat(split[27]),decayRate);//radar
		//split[28] = decay(parseFloat(split[28]),decayRate);//cargo
		//split[29] = decay(parseFloat(split[29]),decayRate);//hull

		split[23] = 0;
		split[85] = "decay"; //reset decaymachine
		while(split[22] > ranks[split[23]]) split[23]++;
		
		if (fs.existsSync("server/players/"+items[i])) fs.unlinkSync("server/players/"+items[i]);
		for(var j = 0; j < split.length; j++) data += split[j] + (j==split.length-1?"":":");
		fs.writeFileSync(source, data, {"encoding":'utf8'});
	}
}
function cleanFile(x){
	var data = fs.readFileSync(x, 'utf8');
	var split = data.split(":");
	if (fs.existsSync(x)) fs.unlinkSync(x);
	data = "";
	for(var j = 0; j < 85; j++) data += split[j] + (j==84?"":":");
	fs.writeFileSync(x, data, {"encoding":'utf8'});
}
var decay = function(x, decayRate){
	if(x<1) return 1;
	return (x-1)*decayRate+1;
}
var undecay = function(x, decayRate){
	if(x<1) return 1;
	return (x-1)/decayRate+1;
}

function flood(ip){
	var safe = false;
	for(var i = 0; i < 20; i++) if(ip !== IPSpam[i]) {
		IPSpam[i] = ip;
		safe = true;
		break;
	}
	if(!safe) return;
}