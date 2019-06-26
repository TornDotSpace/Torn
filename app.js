var fs = require('fs');
var http = require('http');
var express = require('express');
var Filter = require('bad-words');

console.log('Server started');
var io = require('socket.io')();
io.listen(parseInt(process.argv[2])); // normal is 8887, dev 7300

var jsn = JSON.parse(fs.readFileSync('client/weapons.json', 'utf8'));
var wepns = jsn.weapons, ships = jsn.ships, planets = jsn.planets;
var mapSz = 7;
var trainingMode = false;
var sectorWidth = 14336;//must be divisible by 2048, no need to be binary
var botFrequency = trainingMode?.7:1.6;//higher: more bots. Standard: 1.6
var neuralFiles = 1500;
var guestsCantChat = false;
var lbExp = new Array(1000);
var ranks = [0,5,10,20,50,100,200,500,1000,2000,4000,8000,14000,20000,40000,70000,100000,140000,200000,300000,500000,800000,1000000,1500000,2000000,3000000,5000000,8000000,12000000,16000000,32000000,64000000,100000000];

var SOCKET_LIST = {};
var PLAYER_LIST = {};
var DOCKED_LIST = {};
var LEFT_LIST = {};
var DEAD_LIST = {};
var BULLET_LIST = {};
var MISSILE_LIST = {};
var ORB_LIST = {};
var MINE_LIST = new Array(mapSz);
var BEAM_LIST = {};
var BLAST_LIST = {};
var bases = new Array(mapSz);
var DROP_LIST = {};
var VORTEX_LIST = {};
var ASTEROID_LIST = {};
var PLANET_LIST = new Array(mapSz);
var asteroids = new Array(mapSz);

filter = new Filter();

for(var i = 0; i < mapSz; i++){
	MINE_LIST[i] = new Array(mapSz);
	bases[i] = new Array(mapSz);
	for(var j = 0; j < mapSz; j++) MINE_LIST[i][j] = {};
	PLANET_LIST[i] = new Array(mapSz);
	asteroids[i] = [0,0,0,0,0,0,0];//mapsz sensitive
	bases[i] = [0,0,0,0,0,0,0];//mapsz sensitive
}
var PACKAGE_LIST = {};
var bQuests = [];
var rQuests = [];
var atans = [];
var tick = 0, lag = 0, ops = 0;
var bp = 0, rp = 0, bg = 0, rg = 0, bb = 0, rb = 0;
var raidTimer = 50000, raidRed = 0, raidBlue = 0;
var IPSpam = {};


var guestCount = 0;

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
var mutate = function(){
	return Math.tan(Math.random()*Math.PI*2)/100;
}
var activate = function(x){
	return x/(1+Math.abs(x));
}


var Player = function(i){
	var self = {
		net:0,
		cookie:0,
		bulletQueue:0,
		isBot:false,
		isNNBot:false,
		brainwashedBy:0,
		type:"Player",
		shield:false,
		ip:0,
		afkTimer:25 * 60 * 30,
		pingTimer:125,
		color:i>.5?'red':'blue',
		ship:0,
		generators:0,
		weapons:{},
		ammos:{},
		sx:0,
		sy:0,
		name:"ERR0",
		password:"password",
		money:8000,
		kills:0,
		killStreakTimer:-1,
		killStreak:0,
		baseKills:0,
		borderJumpTimer:0,
		iron:0,
		silver:0,
		platinum:0,
		aluminium:0,
		experience:0,
		rank:0,
		noDrift:50,
		energy:100,
		planetTimer:0,
		leaveBaseShield:0,
		globalChat:0,
		hyperdriveTimer:-1,
		deleteRate:.0005,
		
		/*
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

		thrust:1, // Read from ships, same for other variables
		va:1,
		capacity:1,
		maxHealth:2,
		
		thrust2:1,
		radar2:1,
		agility2:1,
		capacity2:1,
		maxHealth2:1,
		energy2:1,
		trail:0,
		
		jukeTimer: 0,
		isLocked: false,
		dead: false,
		lives: 20,
		quest:0,
		cva:0,
		chatTimer: 100,
		muteTimer: -1,
		muteCap: 250,
		health:1,
		x:sectorWidth/2,
		y:sectorWidth/2,
		reload:0,
		angle:0,
		vx:0,
		vy:0,
		id:i,
		speed:0,
		driftAngle:0,
		w:false,
		s:false,
		a:false,
		d:false,
		e:false,
		z:false,
		hasPackage:false,
		space:false,
		docked:false,
		heal:.2,
		empTimer:-1,
		disguise:-1,
		timer:0,
		equipped:0,
		gyroTimer:0,
		trail:0,
		points:0,


		reply:"nobody",
		
		
		kill1:false,//First Blood
		kill10:false,//Private
		kill100:false,//Specialist
		kill1k:false,//Corporal
		kill10k:false,//Sergeant
		kill50k:false,//General
		kill1m:false,//Warlord
		killBase:false,//Invader
		kill100Bases:false,//conqueror
		killFriend:false,//Double Agent
		killCourier:false,//Gone Postal
		suicide:false,//kms
		bloodTrail:false,//Shinigami (scythe) XXX
		
		oresMined:0,
		questsDone:0,
		
		mined:false,
		allOres:false,
		mined3k:false,
		mined15k:false,
		total100k:false,//High Rollin
		total1m:false,//Millionaire
		total100m:false,//That's a lot of digits
		total1b:false,//Billionaire
		packageTaken:false,//Freeloader
		quested:false,//Community Service
		allQuests:false,//Adventurer XXX
		goldTrail:false,//Affluenza XXX
		
		driftTimer:0,
		
		dr0:false,//Shift To Drift
		dr1:false,//Tofu Guy (1 min total)
		dr2:false,//Paper Cup (10 min total)
		dr3:false,//Takumi (1 hr total)
		dr4:false,//Bunta (10 hr total)
		dr5:false,//Turbodrift
		dr6:false,//Hyperdrift
		dr7:false,//Oversteer (Reverse drift)
		dr8:false,//Inertia Drift (BH drift)
		dr9:false,//Driftkill
		dr10:false,//Spinout (Reverse Drift + turbo)
		dr11:false,//Panda AE86 XXXxxxxxxxxxxxxxxxxxxxxxx
		
		cornersTouched:0,
		planetsClaimed:"0000000000000000000000000000000000000000000000000",
		
		ms0:false,//Go AFK
		ms1:false,//Die
		ms2:false,//Risky Business
		ms3:false,//Sucked In
		ms4:false,//Oops...
		ms5:false,//Boing!
		ms6:false,//Corner XXX
		ms7:false,//4 Corners XXX
		ms8:false,//Claim a planet
		ms9:false,//Claim every planet XXX
		ms10:false,//Random Trail XXX
		guest:false,
	}

	self.tick = function(){

		if(self.killStreakTimer--<0) self.killStreak = 0;
		if(self.borderJumpTimer>0) self.borderJumpTimer--;
		var amDrifting = self.e || self.gyroTimer > 0;
		self.shield = (self.s && !amDrifting && self.energy > 5 && self.gyroTimer < 1) || self.leaveBaseShield > 0;
		if(self.shield && !(self.leaveBaseShield-- > 0)){
			self.energy-=1.3;
			if(self.energy < 5) self.s = false;
		}
		
		if(!self.isBot){
			self.checkPlanetCollision();
			if(!self.guest && tick % 48 == 0 && PLANET_LIST[self.sy][self.sx].color === self.color) self.money++;
			if(self.pingTimer-- < 0){
				var text = "~`"+self.color+"~`"+self.name + "~`yellow~` disconnected!";
				LEFT_LIST[self.id] = 0;
				console.log(text);
				chatAll(text);
				return;
			}
		}
		
		self.move();
		self.superchargerTimer--;
		self.empTimer--;
		var reloadVal = self.energy2/2+.5;
		for(var i = 0; i < self.generators; i++) reloadVal *= 1.06;
		self.reload -= reloadVal;
		self.disguise--;
		self.energy+=reloadVal * .35*(self.superchargerTimer>0?2:1);
		if(self.energy > 100) self.energy = 100;
		if(self.health < self.maxHealth) self.health+=self.heal;
		
		
		//elite ships
		if(self.z){
			if(self.ship == 16){
				self.reload -= wepns[21].Charge;
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
			if(self.ship == 17 && self.iron >= 250 && self.silver >= 250 && self.aluminium >= 250 && self.platinum >= 250){
				self.iron -= 250;
				self.silver -= 250;
				self.aluminium -= 250;
				self.platinum -= 250;
				var r = Math.random();
				var a = new Asteroid(r,1000,self.sx,self.sy, Math.floor(Math.random()*4));
				a.x = self.x+Math.cos(self.angle) * 256;
				a.y = self.y+Math.sin(self.angle) * 256;
				a.vx = Math.cos(self.angle) * 15;
				a.vy = Math.sin(self.angle) * 15;
				ASTEROID_LIST[r] = a;
				self.reload = 50;
			}
			if(self.ship == 18 && self.energy > 0) self.shootBullet(39);
		}
		
		if(self.bulletQueue > 0)self.shootBullet(40);
		
		var wepId = self.weapons[self.equipped];
		var wep = wepns[wepId];
		if(self.space && wepId >= 0 && self.reload < -.01 && self.energy > wep.energy){
		
			if(wepId == 40 && self.bulletQueue == 0 && self.energy > wep.energy * 5 && self.ammos[self.equipped] > 0){
				self.bulletQueue += 5;
				self.ammos[self.equipped]-=5;
				sendWeapons(self.id);
				return;
			}
		
			//ammo shenanigans
			if(self.ammos[self.equipped] == 0){
				self.reload = Math.min(wep.Charge,10);
				send(self.id,"sound", {file:"noammo", x:self.x, y:self.y});
				return;
			} else if(self.ammos[self.equipped]>0) self.ammos[self.equipped]--;
			
			if(wep.Level > self.ship){
				send(self.id,"chat",{msg:'This weapon is incompatible with your current ship!', color:'yellow'});
				return;
			}
			
			if(wepId <= 6 || wepId == 28 || wepId == 39) self.shootBullet(self.weapons[self.equipped]);
			else if(wepId == 29){
				self.reload = wep.Charge;
				self.speed = self.thrust * (self.ship == 16?700:500);
				self.energy-=wep.energy;
			}
			else if(wepId == 23){
				sendAllSector('sound', {file:"bigboom",x:self.x, y:self.y, dx:Math.cos(self.angle) * self.speed, dy:Math.sin(self.angle)*self.speed}, self.sx, self.sy);
				for(var i in PLAYER_LIST){
					var p = PLAYER_LIST[i];
					if(p.sx == self.sx && p.sy == self.sy && p.color !== self.color){
						var d2 = (self.x - p.x) * (self.x - p.x) + (self.y - p.y) * (self.y - p.y);
						if(d2 > wep.Range * wep.Range * 100) continue;
						var vel = -10000 / Math.log(d2);
						var ang = Math.atan2(self.y - p.y, self.x - p.x);
						p.vx += Math.cos(ang) * vel;
						p.vy += Math.sin(ang) * vel;
						p.updatePolars();
					}
				}
				self.reload = wep.Charge;
			}
			else if(wepId <= 9 || wepId == 35 || wepId == 26 || wepId == 30 || wepId == 31) self.shootBeam(self, false);
			else if(wepId == 34 || wepId == 25 || wepId == 41) self.shootBlast();
			else if(wepId == 24){//EM
				for(var i in ASTEROID_LIST){
					var a = ASTEROID_LIST[i];
					if(a.sx == self.sx && a.sy == self.sy){
						var d2 = square(self.x - a.x) + square(self.y - a.y);
						if(d2 > wep.Range * wep.Range * 100) continue;
						var ang = Math.atan2(self.y - a.y, self.x - a.x);
						var vel = 500000/Math.max(d2,200000);
						a.vx += Math.cos(ang) * vel;
						a.vy += Math.sin(ang) * vel;
					}
				}
				for(var i in PLAYER_LIST){
					var a = PLAYER_LIST[i];
					if(a.sx == self.sx && a.sy == self.sy && a.id != self.id){
						var d2 = square(self.x - a.x) + square(self.y - a.y);
						if(d2 > wep.Range * wep.Range * 100) continue;
						var ang = Math.atan2(self.y - a.y, self.x - a.x);
						var vel = 3000000/Math.max(d2,1000000);
						a.vx += Math.cos(ang) * vel;
						a.vy += Math.sin(ang) * vel;
						a.gyroTimer = 25;
						a.updatePolars();
					}
				}
				self.energy -= wep.energy;
			}
			else if(wepId == 27){//turret
				var r = Math.random();
				if(self.x < sectorWidth / 4 || self.x > 3*sectorWidth/4 || self.y < sectorWidth / 4 || self.y > 3*sectorWidth/4){
					send(self.id, "chat",{msg:'Your turret must be closer to the center of the sector!', color:'yellow'});
					return;
				}
				if(bases[self.sx][self.sy] != 0){
					send(self.id, "chat",{msg:'There can only be one turret in any sector!', color:'yellow'});
					self.space = false;
					return;
				}
				
				var b = Base(r, false, self.sx, self.sy, self.color, self.x, self.y);
				b.owner = self.name;
				bases[self.sx][self.sy] = b;
				self.reload =wep.Charge;
				self.energy-=wep.energy;
			}
			else if(wepId <= 14||wepId == 38) self.shootMissile();
			else if(wepId == 37) self.shootOrb();
			else if(wepId == 36){//supercharger
				self.superchargerTimer = 1500;//1 min
				self.energy-=wep.energy;
				self.reload = wep.Charge;//currently, supe doesn't take any energy or charge
			}
			else if(wepId <= 17 || wepId == 32 || wepId == 33) self.shootMine();
			else if(wepId == 18){//hull bots
				self.health += Math.min(80, self.maxHealth - self.health);
				self.reload = wep.Charge;
				self.energy-=wep.energy;
			}
			else if(wepId == 19){//cloak
				self.disguise = 150;//6s
				self.energy-=wep.energy;
				self.reload = wep.Charge;
			}
			else if(wepId == 21){
				self.reload = wep.Charge;
				var mult = ((self.e || self.gyroTimer > 0) && self.w && (self.a!=self.d))?1.025:1.017;
				var energyTake = wep.energy;
				if(self.energy < wep.energy * 2){
					mult = 1 + (mult - 1) * 3.5 / 8;
					energyTake = .35;
				}
				self.speed*=mult;
				self.vx *= mult;
				self.vy *= mult;
				if((self.e || self.gyroTimer > 0) && self.w && (self.a!=self.d) && !self.dr5){
					self.dr5 = true;
					self.sendAchievementsDrift(true);
				}
				else if((self.e || self.gyroTimer > 0) && self.s && !self.dr10 && (self.a!=self.d)){
					self.dr10 = true;
					self.sendAchievementsDrift(true);
				}
				self.energy-=energyTake;
			}
			else if(wepId == 22){//hyperspace
				send(self.id,"sound", {file:"hyperspace", x:self.x, y:self.y});
				self.hyperdriveTimer = 200;
				self.energy-=wep.energy;
				self.reload = wep.Charge;
				if((self.e || self.gyroTimer > 0) && self.w && (self.a!=self.d) && !self.dr6){
					self.dr6 = true;
					self.sendAchievementsDrift(true);
				}
			}
			if(self.ammos[self.equipped] == -2){
				self.weapons[self.equipped] = -1;
				self.save();
			}
			sendWeapons(self.id);
		}
	}
	self.move = function(){
		if(self.hyperdriveTimer>0){
			self.hyperdriveTimer--;
			self.speed = (10000-square(100-self.hyperdriveTimer))/(self.ship == 16?7:10);
		}
		if(self.isNNBot) self.nnBotPlay();
		else if(self.isBot) self.botPlay();
		var amDrifting = self.e || self.gyroTimer > 0;
		var ore = self.iron + self.silver + self.platinum + self.aluminium;
		var newThrust = (self.superchargerTimer>0?2:1) * .9 * self.thrust / ((ore / self.capacity + 3)/3.5) * 2 * ((amDrifting && self.w && (self.a!=self.d))?(self.ship == 16?1.6:1.45):1);
		var ssa = Math.sin(self.angle), ssd = Math.sin(self.driftAngle), csa = Math.cos(self.angle), csd = Math.cos(self.driftAngle);
		var dcva = 0;
		self.vx = csd * self.speed;
		self.vy = ssd * self.speed;
		self.vx*=(amDrifting && self.w && (Math.abs(self.cva) > self.va * .999))?.94:.92;
		self.vy*=(amDrifting && self.w && (Math.abs(self.cva) > self.va * .999))?.94:.92;
		if(self.w){
			self.vx += csa * newThrust;
			self.vy += ssa * newThrust;
		}
		if(self.s && amDrifting){
			self.vx -= csa * newThrust/2;
			self.vy -= ssa * newThrust/2;
		}
		self.updatePolars();
		if(!amDrifting){
			self.noDrift++;
			if(self.noDrift > 18) self.driftAngle = self.angle;
			else if(self.noDrift > 12) self.driftAngle = findBisector(self.driftAngle, self.angle);
			else if(self.noDrift > 7) self.driftAngle = findBisector(findBisector(self.driftAngle, self.angle), self.driftAngle);
			else if(self.noDrift > 3) self.driftAngle = findBisector(findBisector(findBisector(self.driftAngle, self.angle), self.driftAngle), self.driftAngle);
			else self.driftAngle = findBisector(findBisector(findBisector(findBisector(self.driftAngle, self.angle), self.driftAngle), self.driftAngle), self.driftAngle);
		}
		else {
			self.gyroTimer--;
			if(self.a!=self.d){
				if(self.w) self.driftTimer++;
				else if(self.s && !self.dr7){
					self.dr7 = true;
					self.sendAchievementsDrift(true);
				}
			}
			self.noDrift = 0;
		}
		self.x+=self.vx;
		self.y+=self.vy;
		if(self.jukeTimer > 1 || self.jukeTimer < -1){
			self.x += self.jukeTimer * Math.sin(self.angle);
			self.y -= self.jukeTimer * Math.cos(self.angle);
			self.jukeTimer*=.8;
		}
		
		if(self.a) dcva -= (self.va + self.cva / (amDrifting?1.5:1)) / 3;
		if(self.d) dcva += (self.va - self.cva / (amDrifting?1.5:1)) / 3; // ternary reduces angular air resistance while drifting
		if(self.superchargerTimer > 0) dcva *= 2;
		self.cva += dcva;
		if(!self.d && !self.a && !amDrifting) self.cva /= 2;
		self.angle += self.cva*(1-self.generators/10)*(self.trail % 16 == 3?1.05:1) / 1.5;
		self.driftAngle += Math.PI * 4;
		self.angle += Math.PI * 4;
		self.driftAngle %= Math.PI * 2;
		self.angle %= Math.PI * 2;
		
		self.testSectorChange();

		if(tick % 15 == 0) self.checkQuestStatus(false);
		if(tick % 2 == 0) return;
		for(var i in MINE_LIST[self.sy][self.sx]){ // Checking for mine collision
			var m = MINE_LIST[self.sy][self.sx][i];
			if(m.wepnID != 16 && m.color!=self.color && m.wepnID != 32 && square(m.x - self.x) + square(m.y - self.y) < square(16 + ships[self.ship].width)){
				self.dmg(m.dmg, m);
				if(m.wepnID == 17) self.EMP(50);
				m.die();
				break;
			}
			else if(m.wepnID == 16 && self.color!=m.color && (self.x - m.x) * (self.x - m.x) + (self.y - m.y) * (self.y - m.y) < (wepns[m.wepnID].Range + ships[self.ship].width) * (wepns[m.wepnID].Range + ships[self.ship].width)){
				var r = Math.random();
				var beam = Beam(m.owner, r, 400, self, m);
				BEAM_LIST[r] = beam;
				sendAllSector('sound', {file:"beam",x: m.x, y: m.y}, m.sx, m.sy);
				m.die();
			}
		}
	}
	self.testSectorChange = function(){
		var callOnChangeSectors = true;
		var giveBounce = false;
		if(self.x > sectorWidth){
			self.x = 1;
			self.sx++;
			if(self.sx >= mapSz || self.guest || (trainingMode && self.isNNBot)){
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
		if(giveBounce && !self.ms5){
			if(self.guest) send(self.id, "chat", {msg:"~`orange~`You must create an account to explore the universe!"});
			else{
				self.ms5 = true;
				self.sendAchievementsMisc(true);
			}
		}
		if(self.borderJumpTimer > 100){
			self.health = (self.health-1)*.9+1;
			self.borderJumpTimer = 50;
		}
		if(callOnChangeSectors) self.onChangeSectors();
	}
	self.juke = function(left){
		if(self.energy < 7.5)
			return;
		self.jukeTimer = (self.trail % 16 == 4?1.25:1)*(left?50:-50);
		self.energy -= 7.5;
	}
	self.onChangeSectors = function(){
		send(self.id, "clrBullets", {});
		if(self.sx==0){
			if(self.sy==0 && (self.cornersTouched & 1) != 1) self.cornersTouched++;
			else if(self.sy==mapSz-1 && (self.cornersTouched & 2) != 2) self.cornersTouched+=2;
		}else if(self.sx==mapSz-1){
			if(self.sy==0 && (self.cornersTouched & 4) != 4) self.cornersTouched+=4;
			else if(self.sy==mapSz-1 && (self.cornersTouched & 8) != 8) self.cornersTouched+=8;
		}
		if(self.cornersTouched == 15){
			self.ms7 = true;
			self.sendAchievementsMisc(true);
		}
		if(self.sx == 3 && self.sy == 3 && self.quest.type === "Secret3"){
			self.spoils("money",self.quest.exp);
			self.spoils("experience", Math.floor(self.quest.exp / 4000));
			noteLocal('Quest Completed!', self.x, self.y - 96, self.id); // variable width
			self.quest = 0;
			self.hasPackage = false;
			if(!self.quested){
				self.quested = true;
				self.sendAchievementsCash(true);
			}
			send(self.id, 'quest', {quest: self.quest});
			if((self.questsDone & 8) == 0) self.questsDone+=8;
			if(self.questsDone == 15 && !self.allQuests){
				self.allQuests = true;
				self.sendAchievementsCash(true);
			}
		}
		if(self.quest != 0 && self.quest.type === "Secret")
			if(self.sx == self.quest.sx && self.sy == self.quest.sy){
				self.quest = {type:"Secret2", exp:self.quest.exp, sx:self.quest.sx, sy:self.quest.sy};
				send(self.id, 'quest', {quest: self.quest});
			}
		self.getAllBullets();
		self.getAllPlanets();
		var index = self.sx + self.sy * mapSz;
		var prevStr = self.planetsClaimed.substring(0,index);
		var checkStr = self.planetsClaimed.substring(index, index+1);
		var postStr = self.planetsClaimed.substring(index+1,mapSz*mapSz);
		if(checkStr !== "2") self.planetsClaimed = prevStr + "1" + postStr;
		if(!self.planetsClaimed.includes("0") && !self.ms6){
			self.ms6 = true;
			self.sendAchievementsMisc(true);
		}
	}
	self.botPlay = function(){
		if(self.empTimer > 0) return;//cant move if i'm emp'd
		
		self.equipped = 0;
		while(self.ammos[self.equipped] == 0) self.equipped++;
		var range = square(wepns[self.equipped].Range * 10);
		
		self.w = self.e = self.s = self.z = self.space = false;
		
		var target = 0, close = 100000000;
		var anyFriend = 0;
		var friendlies = 0, enemies = 0;//keep track of the player counts in the sector
		for(var p in PLAYER_LIST){
			var player = PLAYER_LIST[p];
			if(player.sx != self.sx || player.sy != self.sy || self.id == player.id || player.disguise > 0) continue;
			if(player.color === self.color) {if(friendlies++>3)anyFriend=player; continue;}
			enemies++;
			var dist2 = hypot2(player.x, self.x, player.y, self.y);
			if(dist2 < close){target = player;close = dist2;}
		}
		var movex = 0, movey = 0;
		if(target != 0) {movex = target.x - self.x; movey = target.y - self.y;}
		
		var base = bases[self.sx][self.sy];
		if(base != 0 && base.color != self.color){
			var dist2 = hypot2(base.x, self.x, base.y, self.y);
			if(friendlies > 0 && enemies == 0) target = base;
			else if(dist2 < square(10*sectorWidth/2)) {movex = self.x - base.x; movey = self.y - base.y;}
		}
		
		if(enemies == 0 && Math.random() < .001) self.refillAllAmmo();
		if(enemies == 0 && Math.random() < self.deleteRate) self.die();
		
		if(target == 0) target = anyFriend;
		
		if(movex == 0 && movey == 0 && anyFriend == 0){//flocking
			self.d = Math.random() < .1;
			self.a = Math.random() < .1;
			self.w = true;
			if(self.brainwashedBy != 0){
				var player = PLAYER_LIST[self.brainwashedBy];
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

		if(tick % 5 != Math.floor(self.id * 5)) return;

		if(self.net === 1){
			self.net = new NeuralNet();
			self.net.load();
		}

		if(self.empTimer > 0) return;//cant move if i'm emp'd
		
		self.equipped = 0;
		while(self.ammos[self.equipped] == 0) self.equipped++;
		var range = square(wepns[self.equipped].Range * 10);
		
		var totalFriends = 0;
		var totalEnemies = 0;
		var sumFriendRank = 0;
		var sumEnemyRank = 0;
		
		var target = 0, friend = 0, closeE = 100000000, closeF = 100000000;
		for(var p in PLAYER_LIST){
			var player = PLAYER_LIST[p];
			if(player.sx != self.sx || player.sy != self.sy || self.id == player.id || player.disguise > 0) continue;
			if(player.color === self.color) {
				totalFriends++;
				var dist2 = hypot2(player.x, self.x, player.y, self.y);
				if(dist2 < closeF){friend = player;closeF = dist2;}
			}else{
				totalEnemies++;
				var dist2 = hypot2(player.x, self.x, player.y, self.y);
				if(dist2 < closeE){target = player;closeE = dist2;}
			}
		}
		
		if(totalEnemies == 0 && Math.random() < .005) self.refillAllAmmo();
		if(totalEnemies == 0 && Math.random() < self.deleteRate) self.die();
		
		//make input array
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
		if(self.isBot) return;
		var p = PLANET_LIST[self.sy][self.sx];
		if(tick % 25 == 0 && hypot2(p.x,self.x,p.y,self.y) < sectorWidth/2 * 4){
			var cool = p.cooldown;
			if(cool < 0){self.refillAllAmmo();p.cooldown = 150;}
			self.checkQuestStatus(true);
			if(self.guest) {
				SOCKET_LIST[self.id].emit("chat",{msg:'You must create an account in the base before you can claim planets!', color:'yellow'});
				return;
			}
			if(typeof self.quest !== "undefined" && self.quest != 0 && self.quest.type === "Secret2" && self.quest.sx == self.sx && self.quest.sy == self.sy){
				var cleared = true;
				for(var b in PLAYER_LIST){
					var player = PLAYER_LIST[b];
					if(player.sx == self.sx && player.sy == self.sy && player.color !== self.color){
						cleared = false;
						break;
					}
				}
				if(cleared && bases[self.sx][self.sy] != 0 && bases[self.sx][self.sy].turretLive) cleared = false;
				if(cleared){ // 2 ifs needed
					self.hasPackage = true;
					self.quest = {type:"Secret3", exp:self.quest.exp};
					send(self.id, 'quest', {quest: self.quest});
				}
			}
			if(p.color === self.color || cool > 0) return;
			p.color = self.color;
			p.owner = self.name;
			sendAll('chat', {msg:'Planet ' + p.name + ' claimed by ~`' + self.color + '~`' + self.name + "~`yellow~`!"});
			for(var i in PLAYER_LIST){
				var player = PLAYER_LIST[i];
				if(player.sx == self.sx && player.sy == self.sy) player.getAllPlanets();//send them new planet data
			}
			if(!self.ms8){
				self.ms8 = true;
				self.sendAchievementsMisc(true);
			}
			var index = self.sx + self.sy * mapSz;
			var prevStr = self.planetsClaimed.substring(0,index);
			var postStr = self.planetsClaimed.substring(index+1,mapSz*mapSz);
			self.planetsClaimed = prevStr + "2" + postStr;
			return;
		}
	}
	self.checkQuestStatus = function(touchingPlanet){
		if(self.quest == 0 || self.isBot) return;
		if(self.quest.type === 'Mining')
			if(self.sx == self.quest.sx && self.sy == self.quest.sy){
				if(self.quest.metal == 'aluminium' && self.aluminium < self.quest.amt) return;
				if(self.quest.metal == 'iron' && self.iron < self.quest.amt) return;
				if(self.quest.metal == 'silver' && self.silver < self.quest.amt) return;
				if(self.quest.metal == 'platinum' && self.platinum < self.quest.amt) return;
				if(self.quest.metal == 'aluminium') self.aluminium -= self.quest.amt;
				if(self.quest.metal == 'iron') self.iron -= self.quest.amt;
				if(self.quest.metal == 'silver') self.silver -= self.quest.amt;
				if(self.quest.metal == 'platinum') self.platinum -= self.quest.amt;
				self.spoils("money",self.quest.exp);
				self.spoils("experience",Math.floor(self.quest.exp / 1500));
				noteLocal('Quest Completed!', self.x, self.y - 96, self.id); // variable width
				self.quest = 0;
				if(!self.quested){
					self.quested = true;
					self.sendAchievementsCash(true);
				}
				send(self.id, 'quest', {quest: self.quest});
				if((self.questsDone & 1) == 0) self.questsDone+=1;
			}
		if(self.quest.type === 'Delivery' && touchingPlanet){
			if(self.sx == self.quest.sx && self.sy == self.quest.sy && !self.hasPackage){
				self.hasPackage = true;
				strongLocal("Package obtained!", self.x, self.y - 192, self.id)
			}
			if(self.hasPackage && self.sx == self.quest.dsx && self.sy == self.quest.dsy){
				self.spoils("money",self.quest.exp);
				self.spoils("experience",Math.floor(self.quest.exp / 1500));
				noteLocal('Quest Completed!', self.x, self.y - 96, self.id); // variable width
				self.hasPackage = false;
				self.quest = 0;
				if(!self.quested){
					self.quested = true;
					self.sendAchievementsCash(true);
				}
				send(self.id, 'quest', {quest: self.quest});
				if((self.questsDone & 2) == 0) self.questsDone+=2;
			}
		}
		if(self.questsDone == 15 && !self.allQuests){
			self.allQuests = true;
			self.sendAchievementsCash(true);
		}
	}
	self.baseKilled = function(){
		if(self.isBot) return;
		if(self.quest != 0 && self.quest.type == 'Base'){
			if(self.sx == self.quest.sx && self.sy == self.quest.sy){
				self.spoils("money",self.quest.exp);
				self.spoils("experience",Math.floor(self.quest.exp / 4000));
				strongLocal('Quest Completed!', self.x, self.y - 96, self.id); // variable width
				self.quest = 0;
				if(!self.quested){
					self.quested = true;
					self.sendAchievementsCash(true);
				}
				send(self.id, 'quest', {quest: self.quest});
				if((self.questsDone & 4) == 0) self.questsDone+=4;
			}
		}
		if(self.questsDone == 15 && !self.allQuests){
			self.allQuests = true;
			self.sendAchievementsCash(true);
		}
	}
	self.updateRank = function(){
		var prerank = self.rank;
		self.rank = 0;
		while(self.experience > ranks[self.rank]) self.rank++;
		if(self.rank != prerank) strongLocal('Rank Up!', self.x, self.y - 64, self.id);
	}
	self.dock = function(){
		if(self.isBot) return;
		if(self.docked){
			self.getAllBullets();
			self.getAllPlanets();
			self.docked = false;
			PLAYER_LIST[self.id] = self;
			delete DOCKED_LIST[self.id];
			self.leaveBaseShield = 25;
			self.health = self.maxHealth;
			self.energy = 100;
			return;
		}
		self.checkTrailAchs();
		
		var base = 0;
		var b = bases[self.sx][self.sy];
		if(b.isBase && b.color == self.color && square(self.x - b.x)+square(self.y - b.y) < square(512)) base = b;
		if(base == 0) return;
		
		self.refillAllAmmo();
		self.x = self.y = sectorWidth/2;
		self.save();
		self.docked = true;
		DOCKED_LIST[self.id] = self;
		delete PLAYER_LIST[self.id];
		self.sendStatus();
	}
	self.shootBullet = function(currWep){
	
		if(self.bulletQueue > 0){
			if(self.ammos[self.equipped] <= 0) return;
			self.bulletQueue--;
			currWep = 40;
		}
		
		self.energy-=wepns[currWep].energy;
		self.reload = wepns[currWep].Charge;
		
		var n = 1;
		if(currWep == 4)  n = 4;
		if(currWep == 39) n = 3;
		if(currWep == 6)  n = 2;
		
		for(var i = 0; i < n; i++){
			var r = Math.random();
			
			var bAngle = self.angle;
			if(currWep == 2) bAngle-=3.1415;
			if(currWep == 39)bAngle+=(i-1)/4.;
			if(currWep == 4) bAngle += Math.random() - .5;
			
			var bullet = Bullet(self, r, currWep, bAngle, i * 2 - 1);
			BULLET_LIST[r] = bullet;
			sendAllSector('sound', {file:(currWep == 5 || currWep == 6 || currWep == 39)?"minigun":"shot",x: self.x, y: self.y}, self.sx, self.sy);
		}
	}
	self.shootMissile = function(){
		self.reload = wepns[self.weapons[self.equipped]].Charge;
		var r = Math.random();
		var bAngle = self.angle;
		var missile = Missile(self, r, self.weapons[self.equipped], bAngle);
		MISSILE_LIST[r] = missile;
		sendAllSector('sound', {file:"missile",x: self.x, y: self.y}, self.sx, self.sy);
		self.energy-=wepns[self.weapons[self.equipped]].energy;
	}
	self.shootOrb = function(){
		self.reload = wepns[self.weapons[self.equipped]].Charge;
		var r = Math.random();
		var orb = Orb(self, r, self.weapons[self.equipped]);
		ORB_LIST[r] = orb;
		sendAllSector('sound', {file:"beam",x: self.x, y: self.y}, self.sx, self.sy);
		self.energy-=wepns[self.weapons[self.equipped]].energy;
	}
	self.shootMine = function(){
		if(Object.keys(MINE_LIST[self.sy][self.sx]).length >= 20 && self.weapons[self.equipped] < 30){
			self.ammos[self.equipped]++;
			self.reload = 5;
			send(self.id, "chat", {msg: "This sector has reached its limit of 20 mines."});
			return;
		}
		if(square(self.sx - sectorWidth/2) + square(self.sy - sectorWidth/2) < square(500)){
			self.ammos[self.equipped]++;
			self.reload = 5;
			send(self.id, "chat", {msg: "You may not place a mine here."});
			return;
		}
		self.reload = wepns[self.weapons[self.equipped]].Charge;
		var r = Math.random();
		var mine = Mine(self, r, self.weapons[self.equipped]);
		MINE_LIST[self.sy][self.sx][r] = mine;
		sendAllSector('mine', {x: self.x, y: self.y}, self.sx, self.sy);
		self.energy-=wepns[self.weapons[self.equipped]].energy;
	}
	self.shootBeam = function(origin, restricted){
		var ox = origin.x, oy = origin.y;
		var nearP = 0;
		var range2 = square(wepns[self.weapons[self.equipped]].Range * 10);
		
		//base
		if(!restricted)
			if(self.weapons[self.equipped] == 7||self.weapons[self.equipped] == 8||self.weapons[self.equipped] == 9){
				var b = bases[self.sx][self.sy];
				if(b != 0 && b.color != self.color && b.turretLive && hypot2(b.x,ox,b.y,oy) < range2) nearP = b;
			}
		
		//search players
		if(!restricted)
			for(var i in PLAYER_LIST){
				var p = PLAYER_LIST[i];
				if(p.ship != 17 && (self.weapons[self.equipped] == 26 || self.weapons[self.equipped] == 30)) continue; // elite quarrier is affected
				if(p.color == self.color || p.sx != self.sx || p.sy != self.sy || p.disguise > 0) continue;
				var dx = p.x - ox, dy = p.y - oy;
				var dist2 = dx*dx+dy*dy;
				if(dist2 < range2 && (nearP == 0 || dist2 < square(nearP.x - ox)+square(nearP.y - oy))) nearP = p;
			}
		
		//search asteroids
		if(nearP == 0 && self.weapons[self.equipped] != 35 && self.weapons[self.equipped] != 31)
			for(var i in ASTEROID_LIST){
				var a = ASTEROID_LIST[i];
				if(a.sx != self.sx || a.sy != self.sy || a.hit) continue;
				var dx = a.x - ox, dy = a.y - oy;
				var dist2 = dx*dx+dy*dy;
				if(dist2 < range2 && (nearP == 0 || dist2 < square(nearP.x - ox)+square(nearP.y - oy))) nearP = a;
			}
		
		
		if(nearP == 0) return;
		if(self.weapons[self.equipped] == 31 && nearP.sx == self.sx && nearP.sy == self.sy && nearP.color != self.color){
			nearP.gyroTimer = 250;
			send(nearP.id, "gyro", {t:250});
		}
		if(self.ship == 17 && nearP != 0 && nearP.type === "Asteroid"){
			nearP.hit = true;
			for(var i = 0; i < 3; i++) self.shootBeam(nearP, true);
		}
		self.reload = wepns[self.weapons[self.equipped]].Charge;
		var r = Math.random();
		var beam = Beam(self, r, self.weapons[self.equipped], nearP, origin);
		BEAM_LIST[r] = beam;
		sendAllSector('sound', {file:"beam",x: ox, y: oy}, self.sx, self.sy);
		if(!restricted) self.energy-=wepns[self.weapons[self.equipped]].energy;
	}
	self.shootBlast = function(){
		self.reload = wepns[self.weapons[self.equipped]].Charge;
		var r = Math.random();
		var blast = Blast(self, r, self.weapons[self.equipped]);
		BLAST_LIST[r] = blast;
		sendAllSector('sound', {file:"beam",x: self.x, y: self.y}, self.sx, self.sy);
		self.energy-=wepns[self.weapons[self.equipped]].energy;
	}
	self.die = function(b){
		self.empTimer = -1;
		self.killStreak = 0;
		var diff = .02*self.experience;
		self.leaveBaseShield = 25;
		self.refillAllAmmo();
		if(typeof b === "undefined"){
			delete PLAYER_LIST[self.id];
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
					if(b.owner.w && b.owner.e && (b.owner.a || b.owner.d) && !b.owner.dr9){
						b.owner.dr9 = true;
						b.owner.sendAchievementsDrift(true);
					}
				}

				//send msg
				else if(b.type == "Vortex") sendAll('chat', {msg:("~`" + self.color + "~`" + self.name + "~`yellow~` crashed into a black hole!")});
				else if(b.type == "Planet" || b.type == "Asteroid") sendAll('chat', {msg:("~`" + self.color + "~`" + self.name + "~`yellow~` crashed into an asteroid!")});
				else if(b.owner.type == "Base") sendAll('chat', {msg:("~`" + self.color + "~`" + self.name + "~`yellow~` was destroyed by an enemy base!")});

			}
			var r = Math.random();
			if(self.hasPackage && !self.isBot) PACKAGE_LIST[r] = Package(self, r, 0);
			else if(Math.random() < .004 && !self.guest) PACKAGE_LIST[r] = Package(self, r, 2);//life
			else if(Math.random() < .1 && !self.guest) PACKAGE_LIST[r] = Package(self, r, 3);//ammo
			else if(!self.guest) PACKAGE_LIST[r] = Package(self, r, 1);//coin
			
			if((b.owner != 0) && (typeof b.owner !== "undefined") && (b.owner.type === "Vortex" || b.owner.type === "Player" || b.owner.type === "Base")){
				b.owner.onKill(self);
				b.owner.spoils("experience",10+diff*(self.color===b.owner.color?-1:1));
				if(self.points > 0){
					b.owner.points++;
					self.points--;
				}
				b.owner.spoils("money",1000*(b.owner.type === "Player"?b.owner.killStreak:1));
			}//give the killer stuff

		}
		

		if(!self.isBot){
			self.hasPackage = false; // Maintained for onKill above
			self.health = self.maxHealth;
			var readSource = 'server/players/'+(self.name.startsWith("[")?self.name.split(" ")[1]:self.name) + "[" + hash(self.password) +'.txt';
			if(self.guest){
				self.lives--;
				self.sx = self.sy = (self.color == 'red' ? 2:4);
				self.x = self.y = sectorWidth/2;
				self.dead = true;
				if(self.lives <= 0) LEFT_LIST[self.id] = 0;
				self.sendStatus();
				DEAD_LIST[self.id] = self;
				delete PLAYER_LIST[self.id];
				sendWeapons(self.id);
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
				LEFT_LIST[self.id] = 0;
			}
			else self.save();
			self.sendStatus();
			self.sendAchievementsMisc(true);
			DEAD_LIST[self.id] = self;
			sendWeapons(self.id);
		}
		delete PLAYER_LIST[self.id];
	}
	self.dmg = function(d,origin){
		if(self.isNNBot && origin.type === "Bullet" && origin.owner.type === "Player" && origin.owner.net != 0){
			origin.owner.net.save(self.isNNBot?self.net.id:Math.floor(Math.random()));
			self.health -= 10000;
		}
		if(self.trail % 16 == 1) d /= 1.05;
		self.health-=d*(self.shield?.25:1);
		if(self.health < 0)self.die(origin);
		note('-'+Math.floor(d), self.x, self.y - 64, self.sx, self.sy);
		send(self.id, 'dmg', {});
		return self.health < 0;
	}
	self.EMP = function(t){
		if(self.empTimer > 0) return;
		if(self.ship == 16) t *= 1.3;
		self.empTimer = t;
		self.w = self.e = self.a = self.s = self.d = self.z = self.space = false;
		if(!self.isBot) send(self.id, 'emp', {t:t});
	}
	self.save = function(){
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
		if(!p.guest && p.color !== self.color) self.killStreak++;
		self.killStreakTimer = 750;//30s
		if(self.isBot) return;
		self.kills++;
		self.kill1 = self.kills >= 1;
		self.kill10 = self.kills >= 10;
		self.kill100 = self.kills >= 100;
		self.kill1k = self.kills >= 1000;
		self.kill10k = self.kills >= 4000;
		self.kill50k = self.kills >= 10000;
		if(p.trail != 0) self.kill1m = true;
		if(p.hasPackage) self.killCourier = true;
		if(p.name === self.name) self.suicide = true;
		else if(p.color === self.color) self.killFriend = true;
		self.sendAchievementsKill(true);
	}
 	self.onBaseKill = function(p){
		if(self.isBot) return;
		self.baseKills++;
		self.killBase = self.baseKills >= 1;
		self.kill100Bases = self.baseKills >= 100;
		self.sendAchievementsKill(true);
	}
	self.onMined = function(a){
		if(self.isBot) return;
		if((self.oresMined & (1 << a)) == 0) self.oresMined += 1 << a;
		if(self.oresMined == 15 && !self.allOres) self.allOres = true;
		else if(!self.mined) self.mined = true;
		else if(!self.mined3k && 3000 <= self.iron + self.silver + self.aluminium + self.platinum) self.mined3k = true;
		else if(!self.mined15k && 15000 <= self.iron + self.silver + self.aluminium + self.platinum) self.mined15k = true;
		else return;
		self.sendAchievementsCash(true);
	}
	self.sendAchievementsKill = function(note){
		if(self.isBot) return;
		send(self.id, "achievementsKill", {note:note,kill1:self.kill1,kill10:self.kill10,kill100:self.kill100,kill1k:self.kill1k,kill10k:self.kill10k,kill50k:self.kill50k,kill1m:self.kill1m,killBase:self.killBase,kill100Bases:self.kill100Bases,killFriend:self.killFriend,killCourier:self.killCourier,suicide:self.suicide,bloodTrail:self.bloodTrail});
	}
	self.sendAchievementsCash = function(note){
		if(self.isBot) return;
		send(self.id, "achievementsCash", {note:note,achs:[self.mined, self.allOres, self.mined3k, self.mined15k, self.total100k, self.total1m, self.total100m, self.total1b, self.packageTaken, self.quested, self.allQuests, self.goldTrail]});
	}
	self.sendAchievementsDrift = function(note){
		if(self.isBot) return;
		send(self.id, "achievementsDrift", {note:note,achs:[self.dr0, self.dr1, self.dr2, self.dr3, self.dr4, self.dr5, self.dr6, self.dr7, self.dr8, self.dr9, self.dr10, self.dr11]});
	}
	self.sendAchievementsMisc = function(note){
		self.ms9 = !self.planetsClaimed.includes("0") && !self.planetsClaimed.includes("1"); // I had no clue where to put this. couldn't go in onPlanetCollision, trust me.
		if(self.isBot) return;
		send(self.id, "achievementsMisc", {note:note,achs:[self.ms0, self.ms1, self.ms2, self.ms3, self.ms4, self.ms5, self.ms6, self.ms7, self.ms8, self.ms9, self.ms10]});
	}
	self.sendStatus = function(){
		if(self.isBot) return;
		send(self.id, "status", {docked:self.docked, state:self.dead,lives:self.lives});
	}
	self.checkMoneyAchievements = function(){
		if(self.isBot) return;
		if(self.money >= 10000 && !self.total100k) self.total100k = true;
		else if(self.money >= 100000 && !self.total1m) self.total1m = true;
		else if(self.money >= 1000000 && !self.total100m) self.total100m = true;
		else if(self.money >= 10000000 && !self.total1b) self.total1b = true;
		else return;
		self.sendAchievementsCash(true);
	}
	self.checkDriftAchs = function(){
		if(self.isBot) return;
		if(self.driftTimer >= 25 && !self.dr0) self.dr0 = true;
		else if(self.driftTimer >= 25 * 60 && !self.dr1) self.dr1 = true;
		else if(self.driftTimer >= 25 * 60 * 10 && !self.dr2) self.dr2 = true;
		else if(self.driftTimer >= 25 * 60 * 60 && !self.dr3) self.dr3 = true;
		else if(self.driftTimer >= 25 * 60 * 60 * 10 && !self.dr4) self.dr4 = true;
		else return;
		self.sendAchievementsDrift(true);
	}
	self.checkTrailAchs = function(){
		if(!self.ms10 && self.ms0 && self.ms1 && self.ms2 && self.ms3 && self.ms4 && self.ms5 && self.ms6 && self.ms7 && self.ms8 && self.ms9){
			self.ms10 = true;
			self.sendAchievementsMisc(true);
		}
		if(!self.dr11 && self.dr0 && self.dr1 && self.dr2 && self.dr3 && self.dr4 && self.dr5 && self.dr6 && self.dr7 && self.dr8 && self.dr9 && self.dr10){
			self.dr11 = true;
			self.sendAchievementsDrift(true);
		}
		if(!self.bloodTrail && self.kill1 && self.kill10 && self.kill100 && self.kill1k && self.kill10k && self.kill50k && self.kill1m && self.killBase && self.kill100Bases && self.killFriend && self.killCourier && self.suicide){
			self.bloodTrail = true;
			self.sendAchievementsKill(true);
		}
		if(!self.goldTrail && self.mined && self.allOres && self.mined3k && self.mined15k && self.total100k && self.total1m && self.total100m && self.total1b && self.packageTaken && self.quested && self.allQuests){
			self.goldTrail = true;
			self.sendAchievementsCash(true);
		}
	}
	self.getAllBullets = function(){
		if(self.isBot)
			return;
		var packHere = [];
		for(var i in BULLET_LIST){
			var bullet = BULLET_LIST[i];
			if(bullet.sx == self.sx && bullet.sy == self.sy)
				packHere.push({wepnID:bullet.wepnID,color:bullet.color,x:bullet.x,vx:self.vx,vy:self.vy,y:bullet.y,angle:bullet.angle,id:self.id});
		}
		send(self.id, 'clrBullets', {pack:packHere});
	}
	self.getAllPlanets = function(){
		if(self.isBot)
			return;
		var packHere = 0;
		var planet = PLANET_LIST[self.sy][self.sx];
		packHere = {id:planet.id, name:planet.name, x:planet.x, y:planet.y, color:planet.color};
		send(self.id, 'planets', {pack:packHere});
	}
	self.updatePolars = function(){
		self.driftAngle = Math.atan2(self.vy, self.vx);
		self.speed = Math.sqrt(self.vy * self.vy + self.vx * self.vx);
	}
	self.refillAmmo = function(i){
		if(typeof wepns[self.weapons[i]] !== "undefined")
			self.ammos[i] = wepns[self.weapons[i]].ammo;
	}
	self.refillAllAmmo = function(){
		for(var i = 0; i < 10; i++)
			self.refillAmmo(i);
		sendWeapons(self.id);
		strongLocal("Ammo Replenished!", self.x, self.y+256, self.id);
	}
	self.testAfk = function(){
		if(self.afkTimer-- < 0){
			send(self.id, "AFK",{t:0});
			LEFT_LIST[self.id] = 0;
			if(!self.isBot){
				var text = "~`"+self.color+"~`"+self.name + "~`yellow~` went AFK!";
				console.log(text);
				chatAll(text);
			}
			return true;
		}
		return false;
	}
	self.changePass = function(pass){
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
	self.confirmPass = function(pass){
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
	self.calculateGenerators = function(){
		self.generators = 0;
		for(var slot = 0; slot<ships[self.ship].weapons;slot++)
			if(self.weapons[slot]==20)
				self.generators++;
		if(self.rank <= wepns[20].Level)
			self.generators = 0;
	}
	self.spoils = function(type,amt){
		if(typeof amt === "undefined") return;
		if(type === "experience"){
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
	self.r = function(msg){
		if(self.reply.includes(" ")) self.reply = self.reply.split(" ")[1];
		self.pm("/pm "+self.reply+" "+msg.substring(3));
	}
	self.pm = function(msg){ // msg looks like "/pm luunch hey there pal"
		if(msg.split(" ").length < 3){
			send(self.id, "chat", {msg:"Invalid Syntax!"});
			return;
		}
		var name = msg.split(" ")[1];
		var raw = msg.substring(name.length+5);
		send(self.id, "chat", {msg:"Sending private message to "+name+"..."});
		for(var p in PLAYER_LIST){
			var player = PLAYER_LIST[p];
			if((player.name.includes(" ")?player.name.split(" ")[1]:player.name) === name){
				send(player.id, "chat", {msg:"~`lime~`[PM] [" + self.name + "]: " + raw});
				send(self.id, "chat", {msg:"Message sent!"});
				self.reply = player.name;
				player.reply = self.name;
				return;
			}	
		}for(var p in DOCKED_LIST){
			var player = DOCKED_LIST[p];
			if((player.name.includes(" ")?player.name.split(" ")[1]:player.name) === name){
				send(player.id, "chat", {msg:"~`lime~`[PM] [" + self.name + "]: " + raw});
				send(self.id, "chat", {msg:"Message sent!"});
				self.reply = player.name;
				player.reply = self.name;
				return;
			}	
		}for(var p in DEAD_LIST){
			var player = DEAD_LIST[p];
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
	self.swap = function(msg){ // msg looks like "/swap 2 5"
		var spl = msg.split(" ");
		if(spl.length != 3){
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
var Orb = function(ownr, i, weaponID){
	var self = {
		type:"Orb",
		id:i,
		color:ownr.color,
		dmg:wepns[weaponID].Damage,
		x:ownr.x,
		y:ownr.y,
		sx:ownr.sx,
		sy:ownr.sy,
		owner:ownr,
		locked:0,
		timer: 0,
		vx:2*ownr.vx+wepns[weaponID].Speed*Math.cos(ownr.angle),
		vy:2*ownr.vy+wepns[weaponID].Speed*Math.sin(ownr.angle),
		lockedTimer: 0,
		wepnID:weaponID,
		goalAngle:0
	}
	self.tick = function(){
		if(self.timer++ > 3 * wepns[weaponID].Range / wepns[weaponID].Speed) self.die();
		self.move();
	}
	self.move = function(){
		if(self.locked != 0 && typeof self.locked === 'number'){
			if(self.lockedTimer++ > 2.5 * 25) self.die();
			var target = PLAYER_LIST[self.locked];
			if(typeof target === 'undefined' && bases[self.sx][self.sy].color != self.color) target = bases[self.sx][self.sy];
			if(target == 0) target = ASTEROID_LIST[self.locked];
			if(typeof target === 'undefined') self.locked = 0;
			else{
				if(target.type === "Player") target.isLocked = true;
				if(target.sx == self.sx && target.sy == self.sy && hypot2(target.x,self.x,target.y,self.y) < square(100) && target.turretLive != false){
					target.dmg(self.dmg, self);
					self.die();
					return;
				}
				var dist = Math.hypot(target.x - self.x,target.y - self.y);
				self.vx += wepns[weaponID].Speed*(target.x - self.x)/dist;
				self.vy += wepns[weaponID].Speed*(target.y - self.y)/dist;
				self.vx *= .9;
				self.vy *= .9;
			}
		}
		if(self.locked == 0) self.lockedTimer = 0;
		self.x+=self.vx;
		self.y+=self.vy;
		if(self.x > sectorWidth || self.x < 0 || self.y > sectorWidth || self.y < 0) self.die();
	}
	self.die = function(){
		sendAllSector('sound', {file:"boom2",x:self.x, y:self.y, dx:self.vx, dy:self.vy}, self.sx, self.sy);
		delete ORB_LIST[self.id];
	}
	return self;
}
var Bullet = function(ownr, i, weaponID, angl, info){
	var self = {
		type:"Bullet",
		id:i,
		time:0,
		color:ownr.color,
		dist:0, // TRACKS distance. Doesn't control it.
		dmg:wepns[weaponID].Damage,
		x:ownr.x,
		y:ownr.y,
		sx:ownr.sx,
		sy:ownr.sy,
		owner:ownr,
		angle:angl,
		info:info,
		vx:Math.cos(angl) * wepns[weaponID].Speed,
		vy:Math.sin(angl) * wepns[weaponID].Speed,
		wepnID:weaponID,
	}
	self.tick = function(){
		if(weaponID == 6 && self.dist == 0){
			self.x += Math.sin(self.angle) * 16 * self.info;
			self.y -= Math.cos(self.angle) * 16 * self.info;
		}
		if(self.time++ == 0){
			sendAllSector("newBullet", {x:self.x, y:self.y, vx:self.vx,vy:self.vy,id:self.id,angle:self.angle,wepnID:self.wepnID, color:self.color}, self.sx, self.sy);
			self.x -= self.vx;
			self.y -= self.vy;
		}
		self.move();
		self.dist+=wepns[weaponID].Speed / 10;
		if(self.wepnID == 28 && self.time > 25 * 3){
			var base = bases[self.sx][self.sy];
			if(square(base.x-self.x)+square(base.y-self.y)<square(5000)) return;
			self.dieAndMakeVortex();
		}
		else if(self.dist>wepns[weaponID].Range) self.die();
	}
	self.move = function(){
		self.x+=self.vx;
		self.y+=self.vy;
		if(self.x > sectorWidth || self.x < 0 || self.y > sectorWidth || self.y < 0) self.die();
			
		var b = bases[self.sx][self.sy];
		if(b != 0 && b.turretLive && b.color!=self.color && square(b.x - self.x) + square(b.y - self.y) < square(16 + 32)){
			b.dmg(self.dmg, self);
			self.die();
		}
		
		for(var i in PLAYER_LIST){
			var p = PLAYER_LIST[i];
			if(p.sx == self.sx && p.sy == self.sy && p.color!=self.color && (p.x - self.x) * (p.x - self.x) + (p.y - self.y) * (p.y - self.y) < (16 + ships[p.ship].width) * (16 + ships[p.ship].width)){
				if(self.wepnId == 28){
					self.dieAndMakeVortex();
					return;
				}
				p.dmg(self.dmg, self);
				self.die();
				break;
			}
		}
		var astCount = 0;
		if(self.time % 2 == 0){
			for(var i in ASTEROID_LIST){
				var a = ASTEROID_LIST[i];
				if(a.sx == self.sx && a.sy == self.sy){
					if(hypot2(a.x,self.x,a.y,self.y) < square(16 + 64)){
						a.dmg(self.dmg * (self.weaponID == 0?2:1), self);
						a.vx += self.vx / 256;
						a.vy += self.vy / 256;
						self.die();
						break;
					}
					astCount++;
					if(astCount > 26) delete ASTEROID_LIST[i];
				}
			}
		}
	}
	self.die = function(){
		sendAllSector("delBullet", {id:self.id},self.sx,self.sy);
		var reverse = weaponID == 2? -1:1;
		sendAllSector('sound', {file:"boom2",x:self.x, y:self.y, dx:reverse * self.vx, dy:reverse * self.vy}, self.sx, self.sy);
		delete BULLET_LIST[self.id];
	}
	self.dieAndMakeVortex = function(){
		var r = Math.random();
		var vort = Vortex(r, self.x, self.y, self.sx, self.sy, 3000, self.owner, false);
		VORTEX_LIST[r] = vort;
		self.die();
	}
	return self;
}
var Mine = function(ownr, i, weaponID){
	var self = {
		type:"Mine",
		id:i,
		time:0,
		color:ownr.color,
		dmg:wepns[weaponID].Damage,
		x:ownr.x,
		y:ownr.y,
		vx:weaponID != 33?0:Math.cos(ownr.angle)*30,
		vy:weaponID != 33?0:Math.sin(ownr.angle)*30,
		sx:ownr.sx,
		sy:ownr.sy,
		owner:ownr,
		angle:Math.random()*6.28,
		wepnID:weaponID,
	}
	self.tick = function(){
		self.x += self.vx;
		self.y += self.vy;
		if(self.wepnID > 25 && self.time++ > 25) self.die();
		if(self.time++ > 25 * 3 * 60) self.die();
	}
	self.die = function(){
		var power = 0;
		if(self.wepnID == 15 || self.wepnID == 33)//mine, grenade
			power = 400;
		else if(self.wepnID == 32) power = 2000;
		for(var i in PLAYER_LIST){
			var p = PLAYER_LIST[i];
			if(p.sx == self.sx && p.sy == self.sy)
				if(square(p.x - self.x) + square(p.y - self.y) < square(1024 + ships[p.ship].width)){
					p.vx = power*(Math.cbrt(p.x - self.x))/Math.max(10,.001+Math.hypot(p.x - self.x,p.y - self.y));
					p.vy = power*(Math.cbrt(p.y - self.y))/Math.max(10,.001+Math.hypot(p.x - self.x,p.y - self.y));
					p.updatePolars();
					p.angle = p.driftAngle;
				}
		}
		if(self.wepnID == 33)
			for(var i in PLAYER_LIST){
				var p = PLAYER_LIST[i];
				if(p.sx == self.sx && p.sy == self.sy && square(p.x - self.x) + square(p.y - self.y) < square(wepns[33].Range*10))
					p.dmg(self.dmg, self);
			}
		sendAllSector('sound', {file:"boom2",x:self.x, y:self.y, dx:0, dy:0}, self.sx, self.sy);
		delete MINE_LIST[self.sy][self.sx][self.id];
	}
	return self;
}
var Package = function(ownr, i, type){
	var self = {
		id:i,
		type: type,
		x:ownr.x,
		y:ownr.y,
		sx:ownr.sx,
		sy:ownr.sy,
		time:0,
	}
	self.tick = function(){
		if(self.time++ > 2000){
			sendAllSector('sound', {file:"boom2",x:self.x, y:self.y, dx:0, dy:0}, self.sx, self.sy);
			delete PACKAGE_LIST[self.id];
		}
		for(var i in PLAYER_LIST){
			var p = PLAYER_LIST[i];
			if(p.sx == self.sx && p.sy == self.sy && square(p.x - self.x) + square(p.y - self.y) < square(16 + ships[p.ship].width)){
				if(self.type == 0){
					if(!p.packageTaken){
						p.packageTaken = true;
						p.sendAchievementsCash(true);
					}
					var possible = ['money', 'ore', 'upgrade'];
					var contents = possible[Math.floor(Math.random() * 2.05)];
					var amt = Math.floor(Math.random() * 2000) + 2000;
					if(contents == 'ore'){//second bit is a fix for kristens hull exploit
						amt = Math.min(amt, p.capacity - p.iron - p.aluminium - p.silver - p.platinum);
						if(amt == p.capacity - p.iron - p.aluminium - p.silver - p.platinum) strongLocal("Cargo Bay Full", p.x, p.y + 256, p.id);
					}
					var title = "Package collected: ";
					if(contents == 'money'){
						title += '500 money';
						p.spoils("money",500);
					}else if(contents == 'upgrade'){
						title += 'New radar!';
						p.radar2+=.2;
					}else{
						title += amt + ' ore';
						p.iron += Math.floor(amt/4);
						p.platinum += Math.floor(amt/4);
						p.aluminium += Math.floor(amt/4);
						p.silver += Math.floor(amt/4);
					}
					strongLocal(title, p.x, p.y - 192, p.id);
					delete PACKAGE_LIST[self.id];
					break;
				} else if(self.type == 1) {
					p.spoils("money",1000);
					delete PACKAGE_LIST[self.id];
					break;
				} else if(self.type == 3) {
					p.refillAllAmmo();
					delete PACKAGE_LIST[self.id];
					break;
				} else {
					p.spoils("life",1);
					delete PACKAGE_LIST[self.id];
					break;
				}
			}
		}
	}
	return self;
}
var Beam = function(ownr, i, weaponID, enemy, orign){
	var self = {
		type:"Beam",
		id:i,
		dmg:weaponID == 400?wepns[16].Damage:wepns[weaponID].Damage,
		sx:ownr.sx,
		sy:ownr.sy,
		origin:orign,
		owner:ownr,
		enemy:enemy,
		wepnID:weaponID,
		time:0,
	}
	self.tick = function(){
		if(self.time>10){
			if(enemy.type === "Asteroid") enemy.hit = false;
			delete BEAM_LIST[self.id];
		}
		if(self.time == 0){
			enemy.hit = false;
			var divideBy = self.enemy.ship == 17 && (self.wepnID == 30 || self.wepnID == 26)? 2 : 1;
			var didDie = self.enemy.dmg(self.dmg / divideBy, self.wepnID == 400?self.owner:self);
			if(self.wepnID == 34){
				self.enemy.energy += wepns[self.wepnID].energy;
				self.owner.energy -= wepns[self.wepnID].energy;
			}
			if(didDie) delete BEAM_LIST[self.id];
		}
		self.time++;
	}
	return self;
}
var Asteroid = function(i, h, sxx, syy, metal){
	var self = {
		type:"Asteroid",
		id:i,
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
		if(Math.abs(self.vx) + Math.abs(self.vy) > 1.5){
			for(var i in PLAYER_LIST){
				var p = PLAYER_LIST[i];
				if(p.sx == self.sx && p.sy == self.sy)
					if(square(p.x - self.x) + square(p.y - self.y) < square(32 + ships[p.ship].width) / 10){
						p.dmg(5*Math.hypot(p.vx-self.vx,p.vy-self.vy), self);
						sendAllSector('sound', {file:"boom2",x:self.x, y:self.y, dx:0, dy:0}, self.sx, self.sy);
						p.vx = 200*(Math.cbrt(p.x - self.x))/Math.max(1,.001+Math.hypot(p.x - self.x,p.y - self.y));
						p.vy = 200*(Math.cbrt(p.y - self.y))/Math.max(1,.001+Math.hypot(p.x - self.x,p.y - self.y));
						p.updatePolars();
						p.angle = p.driftAngle;
					}
			}
			
			var b = bases[self.sx][self.sy];
			if(b != 0 && b.turretLive && square(self.x - b.x) + square(self.y - b.y) < 3686.4){
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
		asteroids[self.sx][self.sy]--;
		createAsteroid();
		delete ASTEROID_LIST[self.id];
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
var Planet = function(i, name){
	var self = {
		type:"Planet",
		name:name,
		color:"yellow",
		owner:0,
		id:i,
		x:sectorWidth/2,
		y:sectorWidth/2,
		cooldown:0
	}
	self.tick = function(){
		self.cooldown--;
		if(tick % 12 == 6)
		for(var p in PLAYER_LIST)
			if(self.owner === PLAYER_LIST[p].name)
				PLAYER_LIST[p].money++;
	}
	return self;
}
var Base = function(i, b, sxx, syy, col, x, y){
	var self = {
		type:"Base",
		name:"Press X to enter Base",
		kills:0,
		experience:0,
		money:0,
		id:i,
		color:col,
		owner:0,
		isBase:b, // This differentiates between turrets and turrets connected to bases
		turretLive:true, // When killed, this becomes false and turret vanishes
		angle:0,
		x:x,
		y:y,
		vx:0,
		vy:0,
		sx:sxx,
		sy:syy,
		reload:0,
		spinAngle:0,
		health:500,
		maxHealth:500,
		heal:1,
		empTimer:-1,
		speed:0,//vs unused but there for bullets
	}
	self.tick = function(rbNow,bbNow){
		if(self.isBase && Math.random()<botFrequency/square(rbNow+bbNow+5)) spawnBot(self.sx,self.sy,self.color,rbNow,bbNow);
		if(!self.turretLive && (tick % (25 * 60 * 10) == 0 || (raidTimer < 15000 && tick % (25*150) == 0))) self.turretLive = true;
		self.move();
		self.empTimer--;
		self.reload--;
		if(self.health < self.maxHealth) self.health+=self.heal;
		if(tick % 25 == 0) self.giveToOwner();
	}
	self.giveToOwner = function(){
		if(self.owner == 0) return;
		var player = 0;
		for(var i in PLAYER_LIST)
			if(PLAYER_LIST[i].name === self.owner){
				player = PLAYER_LIST[i];
				break;
			}
		if(player == 0 || self.sx != player.sx || player.sy != self.sy || square(player.x - self.x) + square(player.y - self.y) > 40000)
			return;
		player.kills += self.kills;
		player.spoils("experience",self.experience);
		if(self.money > 0)
			player.spoils("money",self.money);
		self.experience = self.money = self.kills = 0;
	}
	self.move = function(){
		if(self.empTimer > 0) return;
		var c = 0;
		var cDist2 = 1000000000;
		for(var i in PLAYER_LIST){
			var player = PLAYER_LIST[i];
			if(player.color==self.color || player.sx != self.sx || player.sy != self.sy)
				continue;
			var dist2 = square(player.x - self.x)+square(player.y - self.y);
			if(c == 0){c = player;cDist2 = dist2;continue;}
			if(dist2<cDist2){
				c = player;
				cDist2 = dist2;
			}
		}
		self.angle = calculateInterceptionAngle(c.x,c.y,c.vx,c.vy,self.x,self.y);
		self.spinAngle+=.001;
		if(self.turretLive && self.reload < 0){
			if(cDist2 < square(wepns[8].Range*10))//range:60
				self.shootLaser();
			else if(cDist2 < square(wepns[37].Range*10))//range:125
				self.shootOrb();
			else if(cDist2 < square(175*10))//range:175
				self.shootMissile();
			else if(cDist2 < square(wepns[3].Range*10))//range:750
				self.shootRifle();
		}
	}
	self.shootOrb = function(){
		self.reload = wepns[37].Charge/2;
		var r = Math.random();
		var orb = Orb(self, r, 37);
		ORB_LIST[r] = orb;
		sendAllSector('sound', {file:"beam",x: self.x, y: self.y}, self.sx, self.sy);
	}
	self.shootRifle = function(){
		self.reload = wepns[3].Charge/2;
		var r = Math.random();
		var bullet = Bullet(self, r, 3, self.angle, 0);
		BULLET_LIST[r] = bullet;
		sendAllSector('sound', {file:"shot",x: self.x, y: self.y}, self.sx, self.sy);
	}
	self.shootMissile = function(){
		self.reload = wepns[10].Charge;
		var r = Math.random();
		var bAngle = self.angle;
		var missile = Missile(self, r, 10, bAngle);
		MISSILE_LIST[r] = missile;
		sendAllSector('sound', {file:"missile",x: self.x, y: self.y}, self.sx, self.sy);
	}
	self.shootLaser = function(){
		var nearP = 0;
		for(var i in PLAYER_LIST){
			var p = PLAYER_LIST[i];
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
		BEAM_LIST[r] = beam;
		sendAllSector('sound', {file:"beam",x: self.x, y: self.y}, self.sx, self.sy);
		self.reload = wepns[8].Charge/2;
	}
	self.die = function(b){
		self.giveToOwner();
		self.turretLive = false;
		sendAllSector('sound', {file:"bigboom",x:self.x, y:self.y, dx:0, dy:0}, self.sx, self.sy);
		if(b.type == 'Asteroid') return;
		if(typeof b.owner !== "undefined" && b.owner.type === "Player") sendAll('chat', {msg:("The base at sector ~`" + col + "~`" + String.fromCharCode(97 + sxx).toUpperCase() + (syy + 1) + "~`yellow~` was destroyed by ~`" + b.color + "~`" + (b.owner.name===""?"a drone":b.owner.name) + "~`yellow~`'s `~"+b.wepnID+"`~.")});
		if(b.owner.type === "Player") b.owner.baseKilled();
		else 	console.log("IMPORTANT:"+b.type + b.owner.type)
		b.owner.onBaseKill();
		self.health = self.maxHealth;
		if(raidTimer < 15000){
			b.owner.points++;
			for(var i in PLAYER_LIST){
				var p = PLAYER_LIST[i];
				if(p.sx == self.sx && p.sy == self.sy && p.color !== self.color) p.points++;
			}
		}
		var expGained = 50;
		b.owner.spoils("experience",expGained);
		b.owner.spoils("money",25000);
		if(!self.isBase) bases[self.sx][self.sy] = 0;
	}
	self.EMP = function(t){
		self.empTimer = t;
	}
	self.save = function(){
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
	self.onBaseKill = function(){
		//nothing.
	}
	return self;
}
var Vortex = function(i, x, y, sxx, syy, size, ownr, isWorm){
	var self = {
		isWorm:isWorm,
		sxo:Math.floor(Math.random() * mapSz),
		syo:Math.floor(Math.random() * mapSz),
		xo:Math.random() * sectorWidth,
		yo:Math.random() * sectorWidth,
		type:"Vortex",
		owner:ownr,
		id:i,
		x:x,
		y:y,
		sx:sxx,
		sy:syy,
		size:size,
	}
	self.tick = function(){
		self.move();
		if(self.owner != 0){
			self.size -= 6;
			if(self.size < 0) self.die();
		}
		else self.size = 2500;
	}
	self.move = function(){
		if(self.isWorm){
			var t = tick / 40000;
			var bx = Math.sin(7.197 * t) / 2 + .5;
			var by = -Math.sin(5.019 * t) / 2 + .5;
			self.sx = Math.floor(bx * mapSz);
			self.sy = Math.floor(by * mapSz);
			self.x = ((bx * mapSz) % 1) * sectorWidth;
			self.y = ((by * mapSz) % 1) * sectorWidth;
			var bxo = -Math.sin(9.180 * t) / 2 + .5;
			var byo = Math.sin(10.3847 * t) / 2 + .5;
			self.sxo = Math.floor(bxo * mapSz);
			self.syo = Math.floor(byo * mapSz);
			self.xo = ((bxo * mapSz) % 1) * sectorWidth;
			self.yo = ((byo * mapSz) % 1) * sectorWidth;
			if(tick % 50 == 0) sendAll('worm', {bx: bx, by: by, bxo: bxo, byo: byo});
		}
		for(var i in PLAYER_LIST){
			var p = PLAYER_LIST[i];
			if(self.sx == p.sx && self.sy == p.sy){
				var dy = p.y - self.y;
				var dx = p.x - self.x;
				var dist = Math.pow(dy * dy + dx * dx, .25);
				var a = Math.atan2(dy, dx);
				var guestMult = (p.guest || p.isNNBot) ? -1 : 1; 
				p.x -= guestMult * .25 * self.size / dist * Math.cos(a);
				p.y -= guestMult * .25 * self.size / dist * Math.sin(a);
				if(dist < 15 && !self.isWorm){
					p.die(self);
					if(p.e){
						p.dr8 = true;
						p.sendAchievementsDrift(true);
					}				
					if(self.sx == 3 && self.sy == 3)
						if(!p.ms4) {
							p.ms4 = true;
							p.sendAchievementsMisc(true);
						}
				}else if(dist<15 && self.isWorm){
					if(!p.ms3){
						p.ms3 = true;
						p.sendAchievementsMisc(true);
					}
					p.sx = self.sxo;
					p.sy = self.syo;
					p.y = self.yo;
					p.x = self.xo;
					p.planetTimer = 2501;
				}
			}
		}
	}
	self.die = function(b){
		sendAllSector('sound', {file:"bigboom",x:self.x, y:self.y, dx:0, dy:0}, self.sx, self.sy);
		delete VORTEX_LIST[self.id];
	}
	self.onKill = function(){
	}
	self.spoils = function(type,amt){
	}
	return self;
}
var Blast = function(ownr, i, weaponID){
	var self = {
		type:"Blast",
		id:i,
		dmg:wepns[weaponID].Damage,
		sx:ownr.sx,
		sy:ownr.sy,
		owner:ownr,
		angle:ownr.angle,
		bx:ownr.x,
		by:ownr.y,
		wepnID:weaponID,
		time:0,
	}
	self.tick = function(){
		self.time++;
		if(self.time>11)
			delete BLAST_LIST[self.id];
		if(self.time == 1){
			for(var i in PLAYER_LIST){
				var player = PLAYER_LIST[i];
				if(player.sx == self.sx && player.sy == self.sy){
					if((self.bx-player.x) * Math.cos(self.angle) + (self.by-player.y) * Math.sin(self.angle) > 0) continue;
					var pDist = Math.hypot(player.x - self.bx, player.y - self.by);
					var fx = player.x - Math.cos(self.angle) * pDist;
					var fy = player.y - Math.sin(self.angle) * pDist;
					if(Math.hypot(fx-self.bx,fy-self.by) < ships[player.ship].width*2/3) self.hit(player);
				}
			}
			for(var i in ASTEROID_LIST){
				var ast = ASTEROID_LIST[i];
				if(ast.sx == self.sx && ast.sy == self.sy){
					if((self.bx-ast.x) * Math.cos(self.angle) + (self.by-ast.y) * Math.sin(self.angle) > 0) continue;
					var pDist = Math.hypot(ast.x - self.bx, ast.y - self.by);
					var fx = ast.x - Math.cos(self.angle) * pDist;
					var fy = ast.y - Math.sin(self.angle) * pDist;
					if(Math.hypot(fx-self.bx,fy-self.by) < 64*2/3) self.hit(ast);
				}
			}
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
		if(self.wepnID == 25 && self.owner.color !== b.color) b.EMP(wepns[25].Charge*.6);
		else if(self.wepnID == 34 && self.owner.color !== b.color) b.dmg(self.dmg, self);
		else if(self.wepnID == 41) b.brainwashedBy = self.owner.id;
	}
	return self;
}
var Missile = function(ownr, i, weaponID, angl){
	var self = {
		type:"Missile",
		id:i,
		color:ownr.color,
		dmg:wepns[weaponID].Damage,
		x:ownr.x,
		y:ownr.y,
		sx:ownr.sx,
		sy:ownr.sy,
		owner:ownr,
		angle:angl,
		locked:0,
		timer: 0,
		lockedTimer: 0,
		wepnID:weaponID,
		vx:Math.cos(angl) * wepns[weaponID].Speed,
		vy:Math.sin(angl) * wepns[weaponID].Speed,
		goalAngle:0
	}
	self.tick = function(){
		if(self.timer++ > 10 * wepns[weaponID].Range / wepns[weaponID].Speed)
			self.die();
		self.move();
		if(self.timer >= 20 && self.wepnID == 13){
			for(var i = 0; i < 6; i++){
				var r = Math.random();
				var bAngle = self.angle + r * 2 - 1;
				var missile = Missile(self.owner, r, 10, bAngle);
				missile.x = self.x;
				missile.y = self.y;
				MISSILE_LIST[r] = missile;
			}
			self.die();
		}
	}
	self.move = function(){
		if(self.locked != 0 && typeof self.locked === 'number'){
			if(self.lockedTimer++ > 7 * 25) self.die();
			var target = PLAYER_LIST[self.locked];
			if(typeof target === 'undefined' && bases[self.sx][self.sy].color != self.color) target = bases[self.sx][self.sy];
			if(target == 0) target = ASTEROID_LIST[self.locked];
			if(typeof target === 'undefined') self.locked = 0;
			else{
				if(target.type === "Player") target.isLocked = true;
				if(target.sx == self.sx && target.sy == self.sy && hypot2(target.x,self.x,target.y,self.y) < 10000*(self.wepnID == 38?5:1) && target.turretLive != false){
					target.dmg(self.dmg, self);
					self.die();
					if(self.wepnID == 12 && (target.type === 'Player' || target.type === 'Base')) target.EMP(40);
					return;
				}
				if(self.wepnID != 38){
					if(self.timer == 1 || tick % 4 == 0) self.goalAngle = atan(target.y - self.y,target.x - self.x);
					self.angle = findBisector(findBisector(self.goalAngle, self.angle), self.angle);
				}
				self.vx = Math.cos(self.angle) * wepns[weaponID].Speed;
				self.vy = Math.sin(self.angle) * wepns[weaponID].Speed;
			}
		}
		if(self.locked == 0) self.lockedTimer = 0;
		var accelMult = 1-25/(self.timer+25);
		self.x+=self.vx*accelMult;
		self.y+=self.vy*accelMult;
		if(self.x > sectorWidth || self.x < 0 || self.y > sectorWidth || self.y < 0) self.die();
	}
	self.die = function(){
		sendAllSector('sound', {file:"boom2",x:self.x, y:self.y, dx:self.vx, dy:self.vy}, self.sx, self.sy);
		delete MISSILE_LIST[self.id];
	}
	return self;
}



function send(id, msg, data){
	var s = SOCKET_LIST[id];
	if(typeof s !== "undefined")
		s.emit(msg, data);
}
function note(msg, x, y, sx, sy){
	sendAllSector('note', {msg: msg, x: x, y: y, local:false}, sx, sy);
}
function noteLocal(msg, x, y, id){
	send(id, 'note', {msg: msg, x: x, y: y, local:true});
}
function strong(msg, x, y, sx, sy){
	sendAllSector('strong', {msg: msg, x: x, y: y, local:false}, sx, sy);
}
function strongLocal(msg, x, y, id){
	send(id, 'strong', {msg: msg, x: x, y: y, local:true});
}



io.sockets.on('connection', function(socket){
	var instance = false;
	socket.id = Math.random();
	SOCKET_LIST[socket.id]=socket;

	var ip = socket.handshake.headers['x-real-ip'] || socket.handshake.address.address;
	console.log(ip + " Connected!");
	flood(ip);

	var sockcol = 0;
	socket.on('lore',function(data){
		sockcol = data.alien;
		socket.emit("lored",{pc:sockcol});
	});
	socket.on('guest',function(data){
		flood(ip);
		if(instance) return;
		var player = Player(socket.id);
		player.guest = true;
		PLAYER_LIST[socket.id]=player;
		instance = true;
		player.ip = ip;
		player.name = "GUEST " + guestCount;
		guestCount++;
		
		player.color = sockcol?"red":"blue";
		if(mapSz % 2 == 0) player.sx = player.sy = (sockcol?(mapSz / 2 - 1):(mapSz / 2));
		else player.sx = player.sy = (sockcol?(mapSz / 2 - 1.5):(mapSz / 2 + .5));
		for(var i = 0; i < ships[player.ship].weapons; i++) player.weapons[i] = -1;
		for(var i = ships[player.ship].weapons; i < 10; i++) player.weapons[i] = -2;
		player.weapons[0] = 0;
		socket.emit("guested",{});
		player.sendStatus();
		player.getAllBullets();
		player.getAllPlanets();
		player.va = ships[player.ship].agility * .08 * player.agility2;
		player.thrust = ships[player.ship].thrust * player.thrust2;
		player.capacity = Math.round(ships[player.ship].capacity * player.capacity2);
		player.maxHealth = player.health = Math.round(ships[player.ship].health * player.maxHealth2);
		socket.emit('sectors', {sectors:sectors});
		sendWeapons(player.id);
	});
	socket.on('register',function(data){
		flood(ip);
		var user = data.user, pass = data.pass;

		if(typeof user !== "string" || user.length > 16 || user.length < 4 || /[^a-zA-Z0-9]/.test(user)){
			socket.emit("invalidReg", {reason:2});
			return;
		}
		user = user.toLowerCase();
		if(typeof pass !== "string" || pass.length > 32 || pass.length < 1){
			socket.emit("invalidReg", {reason:3});
			return;
		}

		// Test for profanity
		if(filter.isProfane(user)){ 
			socket.emit("invalidReg", {reason:5});
			return;
		}

		var readSource = 'server/players/'+user+"["+hash(pass)+'.txt';
		var valid = true;
		fs.readdir('server/players/', function(err, items) {
			for (var i=0; i<items.length; i++) {
				if(items[i].startsWith(user+"[")){
					console.log(items[i] + ":" + (user+"["));
					socket.emit("invalidReg", {reason:4});
					valid = false;
					break;
				}
			}
			if(!valid) return;
			var player = DOCKED_LIST[socket.id];
			if(typeof player === "undefined") return;
			player.name = user;
			player.password = pass;
			player.guest = false;
			socket.emit("registered",{user:data.user,pass:data.pass});
			var text = user+' registered!';
			console.log(text);
			player.save();
			delete DOCKED_LIST[player.id];
			instance = false;
		});
		socket.emit("raid", {raidTimer:raidTimer})
	});
	socket.on('login',function(data){
		flood(ip);
		if(instance) return;
		//Validate and save IP
		var name = data.user, pass = data.pass;
		if(typeof name !== "string" || name.length > 16 || name.length < 4 || /[^a-zA-Z0-9_]/.test(name)){
			socket.emit("invalidCredentials", {});
			return;
		}
		if(typeof pass !== "string" || pass.length > 32 || pass.length < 1){
			socket.emit("invalidCredentials", {});
			return;
		}
		name = name.toLowerCase();
		var readSource = 'server/players/'+name+"["+hash(data.pass)+'.txt';
		if (!fs.existsSync(readSource)){
			socket.emit("invalidCredentials", {});
			return;
		}
		for(var i in PLAYER_LIST)
			if(PLAYER_LIST[i].name === name || PLAYER_LIST[i].name.includes(" "+name)){// || socket.handshake.headers.cookie == PLAYER_LIST[i].cookie){
				socket.emit("accInUse", {});
				return;
			}
		for(var i in DOCKED_LIST)
			if(DOCKED_LIST[i].name === name || DOCKED_LIST[i].name.includes(" "+name)){// || socket.handshake.headers.cookie == DOCKED_LIST[i].cookie){
				socket.emit("accInUse", {});
				return;
			}
		for(var i in DEAD_LIST)
			if(DEAD_LIST[i].name === name || DEAD_LIST[i].name.includes(" "+name)){// || socket.handshake.headers.cookie == DEAD_LIST[i].cookie){
				socket.emit("accInUse", {});
				return;
			}
		for(var i in LEFT_LIST)
			if(LEFT_LIST[i].name === name){// || LEFT_LIST[i].name.includes(" "+name)){// || socket.handshake.headers.cookie == LEFT_LIST[i].cookie){
				socket.emit("accInUse", {});
				return;
			}
		var player = Player(socket.id);
		instance = true;
		player.ip = ip;
		player.name = name;
		player.password = pass;
		socket.emit("loginSuccess",{});
		
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
		socket.emit("raid", {raidTimer:raidTimer})
		player.refillAllAmmo();
		player.checkTrailAchs();
		player.sendAchievementsKill(false);
		player.sendAchievementsCash(false);
		player.sendAchievementsDrift(false);
		player.sendAchievementsMisc(false);
		player.sendStatus();
		PLAYER_LIST[socket.id]=player;
		player.getAllBullets();
		player.getAllPlanets();
		if(player.sx >= mapSz) player.sx--;
		if(player.sy >= mapSz) player.sy--;
			
		var text = "~`" + player.color + "~`"+player.name+'~`yellow~` logged in!';
		console.log(text);
		chatAll(text);
		player.cookie = socket.handshake.headers.cookie;
		player.va = ships[player.ship].agility * .08 * player.agility2;
		player.thrust = ships[player.ship].thrust * player.thrust2;
		player.capacity = Math.round(ships[player.ship].capacity * player.capacity2);
		player.maxHealth = player.health = Math.round(ships[player.ship].health * player.maxHealth2);
		if(!data.amNew) socket.emit('sectors', {sectors:sectors});
		sendWeapons(player.id);
	});
	socket.on('disconnect',function(data){
		var player = PLAYER_LIST[socket.id];
		if(typeof player === "undefined"){
			LEFT_LIST[socket.id] = 0;
			player = DOCKED_LIST[socket.id];
			if(typeof player === "undefined") player = DEAD_LIST[socket.id];
			if(typeof player === "undefined") return;
		} else LEFT_LIST[socket.id] = 150;
		var text = "~`" + player.color + "~`" + player.name + "~`yellow~` left the game!";
		console.log(text);
		chatAll(text);
	});
	socket.on('pingmsg',function(data){
		var player = PLAYER_LIST[socket.id];
		if(typeof player === "undefined"){
			player = DOCKED_LIST[socket.id];
			if(typeof player === "undefined") player = DEAD_LIST[socket.id];
			if(typeof player === "undefined") return;
		}
		socket.emit('reping', {time:data.time});
		player.pingTimer = 250;
	});
	socket.on('key',function(data){
		var player = (typeof PLAYER_LIST[socket.id] !== "undefined")?PLAYER_LIST[socket.id]:DOCKED_LIST[socket.id];
		if(typeof player === "undefined") player = DEAD_LIST[socket.id];
		if(typeof player === "undefined") return;
		if(typeof data.inputId === 'undefined' || typeof data.state === 'undefined') return;
		player.afkTimer = 30 * 25 * 60;
		if(player.dead && data.inputId==='e'){
			player.dead = false;
			PLAYER_LIST[player.id] = player;
			delete DEAD_LIST[player.id];
			player.sendStatus();
		}
		if(player.empTimer > 0) return;
		if(!player.docked && data.inputId==='e') player.juke(false);
		if(data.inputId==='w') player.w = data.state;
		if(data.inputId==='shift'){
			player.e = data.state;
			if(!data.state) player.checkDriftAchs();
		}
		if(data.inputId==='s') player.s = data.state;
		if(data.inputId==='a') player.a = data.state;
		if(data.inputId==='d') player.d = data.state;
		if(data.inputId==='q' && !player.docked) player.juke(true);
		if(data.inputId==='x') player.dock();
		if(data.inputId==='z') player.z = data.state;
		if(data.inputId===' '){ player.space = data.state;
		}
	});
	socket.on('chat',function(data){
		var player = (typeof PLAYER_LIST[socket.id] !== "undefined")?PLAYER_LIST[socket.id]:DOCKED_LIST[socket.id];
		if(typeof player === "undefined") player = DEAD_LIST[socket.id];
		if(typeof player === "undefined" || typeof data.msg !== "string") return;
		if(guestsCantChat && player.guest) {
			socket.emit("chat",{msg:'You must create an account in the base before you can chat!', color:'yellow'});
			return;
		}
		if(typeof data.msg !== 'string' || data.msg.length == 0 || data.msg.length > 128) return;
		data.msg = data.msg.trim();
		if(!player.name.includes(" ")) data.msg = data.msg.replace(/~`/ig, '');
		data.msg = filter.clean(data.msg);
		
		if(player.muteTimer > 0) return;
		player.chatTimer += 100;
		console.log(player.name + ": " + data.msg);
		var spaces = "";
		for(var i = player.name.length; i < 16; i++) spaces += " ";
		if(player.chatTimer > 600){
			socket.emit('chat', {msg:("~`red~`You have been muted for " +Math.floor(player.muteCap/25) + " seconds!")});
			player.muteTimer = player.muteCap;
			player.muteCap *= 2;
		}

		if(!player.guest && data.msg.startsWith("/")){
			if(data.msg.startsWith("/password ")) player.changePass(data.msg.substring(10));
			else if(data.msg.startsWith("/me ")) chatAll("~~`" + player.color + "~`" + player.name + "~`yellow~` " + data.msg.substring(4));
			else if(data.msg.startsWith("/confirm ")) player.confirmPass(data.msg.substring(9));
			else if(data.msg === "/changeteam") send(player.id, "chat", {msg:"Are you sure? This costs 10% of your experience and money. You must have 10,000 exp. Type /confirmteam to continue."});
			else if(data.msg === "/confirmteam" && player.experience > 10000) {player.color = (player.color === "red"?"blue":"red"); player.money *= .9; player.experience *= .9; player.save();}
			else if(data.msg.toLowerCase().startsWith("/pm ")) player.pm(data.msg);
			else if(data.msg.toLowerCase().startsWith("/r ")) player.r(data.msg);
			else if(data.msg.toLowerCase().startsWith("/swap ")) player.swap(data.msg);
			else if(player.name.includes(" ") && data.msg.startsWith("/broadcast ")) sendAll('chat', {msg:"~`#f66~`       BROADCAST: ~`lime~`"+data.msg.substring(11)});
			else if(player.name.includes(" ") && data.msg.startsWith("/mute ")) mute(data.msg);
			else if(player.name.includes("[O]")){
				if(data.msg === "/reboot") initReboot();
				else if(data.msg.startsWith("/smite ")) smite(data.msg);
				else if(data.msg === "/undecayPlayers") decayPlayers(undecay);
				else if(data.msg === "/spawnNN") spawnNNBot(player.sx, player.sy, Math.random()>.5?"red":"blue");
				else if(data.msg === "/decayPlayers") decayPlayers(decay);
				else if(data.msg === "/saveTurrets") saveTurrets();
			}
			else send(player.id, "chat", {msg:"~`red~`Unknown Command."});
			return;
		}
			
		const finalMsg = "~`" + player.color + "~`" + spaces + player.name + "~`yellow~`: " + data.msg;
		if(player.globalChat == 0) sendAll('chat', {msg:finalMsg});//sendTeam(player.color, 'chat', {msg:finalMsg});
	});
	socket.on('toggleGlobal',function(data){
		var player = (typeof PLAYER_LIST[socket.id] !== "undefined")?PLAYER_LIST[socket.id]:DOCKED_LIST[socket.id];
		if(typeof player === "undefined") player = DEAD_LIST[socket.id];
		if(typeof player === "undefined") return;
		player.globalChat = (player.globalChat+1)%2;
	});
	socket.on('sell',function(data){
		var player = DOCKED_LIST[socket.id];
		if(typeof player === "undefined" || typeof data.item !== 'string' || !player.docked) return;
		if(data.item == 'iron'){
			player.money += player.iron * 1.5;
			player.iron = 0;
		}
		else if(data.item == 'silver'){
			player.money += player.silver * 1.5;
			player.silver = 0;
		}
		else if(data.item == 'platinum'){
			player.money += player.platinum * 1.5;
			player.platinum = 0;
		}
		else if(data.item == 'aluminium'){
			player.money += player.aluminium * 1.5;
			player.aluminium = 0;
		}
		else if(data.item == 'all'){
			player.money += (player.aluminium+player.platinum+player.silver+player.iron) * 1.5;
			player.aluminium = player.iron = player.silver = player.platinum = 0;
		}
		player.save();
	});
	socket.on('buyShip',function(data){
		var player = DOCKED_LIST[socket.id];
		if(typeof player === "undefined" || typeof data.ship !== 'number') return;
		data.ship = Math.floor(data.ship);
		if(data.ship > player.rank || data.ship < 0 || data.ship > ships.length || data.ship == player.ship) return;
		var price = -ships[player.ship].price;
		price*=3/4;
		price += ships[data.ship].price;
		if(player.money < price) return;
			
		//sell all ore
		player.money += (player.aluminium+player.platinum+player.silver+player.iron) * 1.5;
		player.aluminium = player.iron = player.silver = player.platinum = 0;
			
		player.money -= price;
		player.ship = data.ship;
		player.va = ships[data.ship].agility * .08 * player.agility2;
		player.thrust = ships[data.ship].thrust * player.thrust2;
		player.maxHealth = Math.round(player.health = ships[data.ship].health * player.maxHealth2);
		player.capacity = Math.round(ships[data.ship].capacity * player.capacity2);
		player.equipped = 0;
		for(var i = 0; i < 10; i++) if(player.weapons[i]==-2 && i < ships[player.ship].weapons) player.weapons[i] = -1;
		player.calculateGenerators();
		socket.emit('equip', {scroll:player.equipped});
		sendWeapons(socket.id);
		player.save();
	});
	socket.on('buyW',function(data){
		var player = DOCKED_LIST[socket.id];
		if(typeof player === "undefined" || typeof data.slot !== 'number' || typeof data.weapon !== 'number') return;
		data.slot = Math.floor(data.slot);
		data.weapon = Math.floor(data.weapon);
		if(data.slot < 0 || data.slot > 9 || data.weapon < 0 || data.weapon >= wepns.length || !player.docked || player.weapons[data.slot] != -1 || player.money < wepns[data.weapon].price || wepns[data.weapon].Level > player.ship) return;
		player.money -= wepns[data.weapon].price;
		player.weapons[data.slot] = data.weapon;
		player.refillAllAmmo();
		sendWeapons(socket.id);
		player.calculateGenerators();
		player.save();
	});
	socket.on('buyLife',function(data){
		var player = DOCKED_LIST[socket.id];
		if(typeof player === "undefined" || player.lives >= 20) return;
		var price = expToLife(player.experience,player.guest);
		if(player.money < price) return;
		player.money -= price;
		player.lives++;
		player.sendStatus();
		player.save();
	});
	socket.on('upgrade',function(data){
		var player = DOCKED_LIST[socket.id];
		if(typeof player === "undefined" || typeof data.item !== 'number' || data.item > 5 || data.item < 0) return;
		var item = Math.floor(data.item);
		switch(item){
			case 1:
				if(player.money>=Math.round(Math.pow(1024,player.radar2)/1000)*1000){
					player.money-=Math.round(Math.pow(1024,player.radar2)/1000)*1000;
					player.radar2+=.2;
				}
				break;
			case 2:
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
				}
				if(player.money>=Math.round(Math.pow(1024,player.maxHealth2)/1000)*1000){
					player.money-=Math.round(Math.pow(1024,player.maxHealth2)/1000)*1000;
					player.maxHealth2+=.2
					player.maxHealth = Math.round(ships[player.ship].health * player.maxHealth2);
				}
				break;
			case 4:
				if(player.money>=Math.round(Math.pow(4096,player.energy2)/1000)*1000){
					player.money-=Math.round(Math.pow(4096,player.energy2)/1000)*1000;
					player.energy2+=.2;
				}
				break;
			case 5:
				if(player.money>=Math.round(Math.pow(1024,player.agility2)/1000)*1000){
					player.money-=Math.round(Math.pow(1024,player.agility2)/1000)*1000;
					player.agility2+=.2;
					player.va = ships[player.ship].agility * .08 * player.agility2;
				}
				break;
			default://0
				if(player.money>=Math.round(Math.pow(1024,player.thrust2)/1000)*1000){
					player.money-=Math.round(Math.pow(1024,player.thrust2)/1000)*1000;
					player.thrust2+=.2;
					player.thrust = ships[player.ship].thrust * player.thrust2;
				}
				break;
		}
		player.save();
	});
	socket.on('sellW',function(data){
		var player = DOCKED_LIST[socket.id];
		if(typeof player === "undefined" || typeof data.slot !== 'number' || data.slot < 0 || data.slot > 9 || player.weapons[data.slot] < 0 || player.weapons[data.slot] > wepns.length - 1) return;
		data.slot = Math.floor(data.slot);
		if(!player.docked || player.weapons[data.slot] < 0) return;
		player.money += wepns[player.weapons[data.slot]].price * .75;
		player.calculateGenerators();
		player.weapons[data.slot] = -1;
		player.refillAllAmmo();
		sendWeapons(socket.id);
		player.save();
	});
	socket.on('quest',function(data){
		var player = DOCKED_LIST[socket.id];
		if(typeof player === "undefined" || player.quest!=0 || typeof data.quest !== 'number' || data.quest < 0 || data.quest > 9) return;
		var qid = Math.floor(data.quest);
		var quest = (player.color === "red"?rQuests:bQuests)[qid];
		if(quest == 0 || (quest.type === "Base" && player.rank < 7) || (quest.type === "Secret" && player.rank <= 14)) return;
		player.quest = quest;
		if(player.color === "red") rQuests[qid] = 0;
		else bQuests[qid] = 0;
		if(((quest.dsx == 3 && quest.dsy == 3) || (quest.sx == 3 && quest.sy == 3)) && !player.ms2){
			player.ms2 = true;
			player.sendAchievementsMisc(true);
		}
		socket.emit('quest', {quest: quest});
	});
	/*socket.on('cancelquest',function(data){
		var player = DOCKED_LIST[socket.id];
		if(typeof player === "undefined")
			return;
		player.quest = 0;
		socket.emit('quest', {quest: player.quest});
	});*/
	socket.on('equip',function(data){
		var player = (typeof PLAYER_LIST[socket.id] !== "undefined")?PLAYER_LIST[socket.id]:DOCKED_LIST[socket.id];
		if(typeof player === "undefined" || typeof data.scroll !== 'number' || data.scroll >= ships[player.ship].weapons) return;
		player.equipped = Math.floor(data.scroll);
		if(player.equipped < 0) player.equipped = 0;
		else if(player.equipped > 9) player.equipped = 9;
		socket.emit('equip', {scroll:player.equipped});
	});
	socket.on('trail',function(data){
		var player = DOCKED_LIST[socket.id];
		if(typeof player === "undefined" || typeof data.trail !== 'number') return;
		if(data.trail == 0) player.trail = 0;
		if(data.trail == 1 && player.bloodTrail) player.trail = 1;
		if(data.trail == 2 && player.goldTrail) player.trail = 2;
		if(data.trail == 3 && player.dr11) player.trail = 3;
		if(data.trail == 4 && player.ms10) player.trail = 4;
		if(player.name.includes(" ")) player.trail += 16;
	});
});
function parseBoolean(s){
	return (s === 'true');
}
function findBisector(a1, a2){
	a1 = a1 * 180 / Math.PI;
	a2 = a2 * 180 / Math.PI;
	a1 = mod(a1, 360);
	a2 = mod(a2, 360);
	var small = Math.min(a1, a2);
	var big = Math.max(a1, a2);
	var angle = (big - small) / 2 + small;
	if(big - small > 180)
		angle += 180;
	return angle * Math.PI / 180;
}
function atan(y, x){
	var a = Math.min(abs(x), abs(y)) / Math.max(abs(x), abs(y));
	var s = a * a;
	var r = ((-0.0464964749 * s + 0.15931422) * s - 0.327622764) * s * a + a;
	if (abs(y) > abs(x))
		r = 1.57079637 - r;
	if (x < 0)
		r = 3.14159274 - r;
	if (y < 0)
		r = -r;
	return r;
}
function expToLife(exp, guest){
	return Math.floor(guest?0:200000*(1/(1+Math.exp(-exp/15000.))+Math.atan(exp/150000.)-.5))+500;
}
function calculateInterceptionAngle(ax,ay,vx,vy,bx,by) {
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
function pdist(x, sx, sy){
	var i1 = ((sx * sx * sx + sy * sy) % 5 + 1) / 2.23; // Geometric mean of 5 and 1
	var i2 = ((sx * sx + sy) % 5 + 1) / 2.23;
	return (Math.cbrt(Math.abs(Math.tan(x))) % i2) * 3500 * i2 + 800 * i1 + 600;
}
function hash(str){
	var hash = 0;
	if (str.length == 0) return hash;
	for (var i = 0; i < str.length; i++) {
		var ch = str.charCodeAt(i);
		hash = ((hash<<5)-hash)+ch;
		hash &= hash;
	}
	return hash;
}
function maxPD(sx, sy){
	var i1 = ((sx * sx * sx + sy * sy) % 5 + 1) / 2.23; // Geometric mean of 5 and 1
	var i2 = ((sx * sx + sy) % 5 + 1) / 2.23;
	return i2 * 3500 * i2 + 800 * i1 + 600;
}
function minPD(sx, sy){
	var i1 = ((sx * sx * sx + sy * sy) % 5 + 1) / 2.23; // Geometric mean of 5 and 1
	var i2 = ((sx * sx + sy) % 5 + 1) / 2.23;
	return 800 * i1 + 600;
}
function mod(n, m) {
    var remain = n % m;
    return Math.floor(remain >= 0 ? remain : remain + m);
}
function isOutOfBounds(obj){
	return obj.x < 0 || obj.y < 0 || obj.x >= sectorWidth || obj.y >= sectorWidth;
}
function getDanger() {
	if (sx == Math.floor(mapSz/2) && sy == Math.floor(mapSz/2)) return 1;
	var secRed = ((sx + sy) / 12);
	var enemiesRed = Math.atan(bs-rs)/Math.PI + .5;
	var totalRed = Math.floor((secRed + enemiesRed)*16/2) / 16;
	return (pc == 'red' ? totalRed : (1-totalRed));
}
function lbIndex(exp){
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
function hypot2(a,b,c,d){
	return square(a-b)+square(c-d);
}

function sendWeapons(id){
	var player = (typeof DOCKED_LIST[id] !== 'undefined')?DOCKED_LIST[id]:PLAYER_LIST[id];
	if(typeof PLAYER_LIST[id] === 'undefined' && typeof DOCKED_LIST[id] === 'undefined')//Could be dead? Check to be safe
		return;
	var worth = ships[player.ship].price*.75;
	send(id, 'weapons', {weapons: player.weapons, worth:worth, ammos:player.ammos});
}
function sendAllSector(out, data, sx, sy){
	for(var i in SOCKET_LIST){
		var p = PLAYER_LIST[i];
		if(typeof p !== "undefined" && p.sx == sx && p.sy == sy)
			SOCKET_LIST[i].emit(out, data);
	}
}
function sendAll(out, data){
	for(var i in SOCKET_LIST)
		SOCKET_LIST[i].emit(out, data);
}
function chatAll(msg){
	sendAll("chat", {msg:msg});
}
function sendTeam(color, out, data){
	for(var i in SOCKET_LIST){
		var player = PLAYER_LIST[i];
		if(typeof player === "undefined") player = DOCKED_LIST[i];
		if(typeof player === "undefined") player = DEAD_LIST[i];
		if(typeof player !== "undefined" && player.color === color) SOCKET_LIST[i].emit(out, data);
	}
}
function updateQuestsR(){
	var baseMap = [0,1,0,4,2,2,3,0,5,1];
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
	var baseMap = [0,1,0,4,2,2,3,0,5,1];
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






function mute(msg){
	if(msg.split(" ").length != 3) return;
	var name = msg.split(" ")[1];
	var time = parseFloat(msg.split(" ")[2]);
	if(typeof time !== "number") return;
	for(var p in PLAYER_LIST){
		var player = PLAYER_LIST[p];
		if(player.name === name){
			player.muteCap = player.muteTimer = 25*60*time;
			chatAll("~`violet~`" + player.name + "~`yellow~` has been " + (time > 0?"muted for " + time + " minutes!" : "unmuted!"));
			return;
		}
	}for(var p in DOCKED_LIST){
		var player = DOCKED_LIST[p];
		if(player.name === name){
			player.muteCap = player.muteTimer = 25*60*time;
			chatAll("~`violet~`" + player.name + "~`yellow~` has been " + (time > 0?"muted for " + time + " minutes!" : "unmuted!"));
			return;
		}
	}for(var p in DEAD_LIST){
		var player = DEAD_LIST[p];
		if(player.name === name){
			player.muteCap = player.muteTimer = 25*60*time;
			chatAll("~`violet~`" + player.name + "~`yellow~` has been " + (time > 0?"muted for " + time + " minutes!" : "unmuted!"));
			return;
		}
	}
}
function smite(msg){
	if(msg.split(" ").length != 2) return;
	var name = msg.split(" ")[1];
	for(var p in PLAYER_LIST){
		var player = PLAYER_LIST[p];
		if(player.name === name){
			player.die(0);
			chatAll("~`violet~`" + player.name + "~`yellow~` has been Smitten!");
			return;
		}
	}
}






var sectors = new Array(9);
init();
function init(){
	for(var i = 0; i < 10; i++){
		bQuests[i] = 0;
		rQuests[i] = 0;
	}
	var r = Math.random();
	
	var baseMap = [0,1,0,4,2,2,3,0,5,1];
	for(var i = 0; i < baseMap.length; i+=2){
		var randBase = Math.random();
		var baase = Base(randBase, true, baseMap[i], baseMap[i+1], 'red', sectorWidth/2, sectorWidth/2);
		bases[baseMap[i]][baseMap[i+1]] = baase;
		var randBase2 = Math.random();
		var baase2 = Base(randBase2, true, mapSz - 1-baseMap[i], mapSz - 1-baseMap[i+1], 'blue', sectorWidth/2, sectorWidth/2);
		bases[mapSz - 1-baseMap[i]][mapSz - 1-baseMap[i+1]] = baase2;
	}
	
	for(var i = 0; i < mapSz*mapSz*10; i++) createAsteroid();
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
	for(var i in ASTEROID_LIST){
		var ast = ASTEROID_LIST[i];
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
	VORTEX_LIST[id] = v;
	
	//smbh
	id = Math.random();
	var v = new Vortex(id, sectorWidth/2, sectorWidth/2, 3, 3, .15, 0, false);
	VORTEX_LIST[id] = v;
	
	//load existing turrets
	loadTurrets();
	
	net = NeuralNet();
	net.randomWeights();
	
	//start ticking
	setTimeout(update, 40);
	setTimeout(updateLB,60000);
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
	PLAYER_LIST[id] = bot;
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
	PLAYER_LIST[id] = bot;
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
	
	console.log(count+" turret(s) loaded.");
}



function sendRef(){
	sendAll('refresh', {});
}
function kill(){
	process.exit();
}
function createAsteroid(){
	if(Object.keys(ASTEROID_LIST).length > mapSz*mapSz*10)return;
	var sx = Math.floor(Math.random()*mapSz);
	var sy = Math.floor(Math.random()*mapSz);
	if(asteroids[2][2]<2) sx = sy = 2;
	else if(asteroids[4][4]<2) sx = sy = 4;
	asteroids[sx][sy]++;
	var vert = (sy + 1) / (mapSz + 1);
	var hor = (sx + 1) / (mapSz + 1);
	var metal = (Math.random()<hor?1:0) + (Math.random()<vert?2:0);
	var randA = Math.random();
	var h = Math.ceil(Math.random()*1200+200);
	var ast = Asteroid(randA, h, sx, sy, metal);
	ASTEROID_LIST[randA] = ast;
}
function createPlanet(name, sx, sy){
	var randA = Math.random();
	var planet = Planet(randA, name);
	while(square(planet.x - sectorWidth/2)+square(planet.y - sectorWidth/2) < 3000000){
		planet.x=Math.floor(Math.random() * sectorWidth*15/16 + sectorWidth/32);
		planet.y=Math.floor(Math.random() * sectorWidth*15/16 + sectorWidth/32);
	}
	PLANET_LIST[sy][sx] = planet;
}
function getPlayer(i){
	var p = PLAYER_LIST[i];
	if(typeof p === "undefined") p = DOCKED_LIST[i];
	if(typeof p === "undefined") p = DEAD_LIST[i];
	if(typeof p !== "undefined") return p;
	return 0;
}
function sendRaidData(){
	sendAll("raid",{raidTimer:raidTimer});
}
function endRaid(){
	var winners = "yellow";
	if(raidRed > raidBlue) winners = "red";
	else if(raidBlue > raidRed) winners = "blue";
	raidTimer = 360000;
	for(var i in SOCKET_LIST){
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
	for(var i in PLAYER_LIST){
		var player = PLAYER_LIST[i];
		if(!player.isBot && player.chatTimer > 0) player.chatTimer--;
		player.muteTimer--;
		if(player.testAfk()) continue;
		player.isLocked = false;
		player.tick();
		if(player.disguise > 0) continue;
		pack[player.sx][player.sy].push({trail:player.trail,shield:player.shield,empTimer:player.empTimer,hasPackage:player.hasPackage,id:player.id,ship:player.ship,speed:player.speed,maxHealth:player.maxHealth,color:player.color, x:player.x,y:player.y, name:player.name, health: player.health, angle:player.angle, driftAngle: player.driftAngle});
	}
	for(var i in DOCKED_LIST){
		var player = DOCKED_LIST[i];
		if(player.dead) continue;
		if(player.testAfk()) continue;
		if(tick % 30 == 0) player.checkMoneyAchievements();
		if(player.chatTimer > 0) player.chatTimer--;
		player.muteTimer--;
	}
	for(var i in BULLET_LIST) BULLET_LIST[i].tick();
	for(var i in VORTEX_LIST){
		var vort = VORTEX_LIST[i];
		vort.tick();
		if(typeof vortPack[vort.sx][vort.sy] !== "undefined") vortPack[vort.sx][vort.sy].push({x:vort.x,y:vort.y,size:vort.size, isWorm:vort.isWorm});
	}
	for(var x = 0; x < mapSz; x++) for(var y = 0; y < mapSz; y++){
		for(var i in MINE_LIST[y][x]){
			var mine = MINE_LIST[y][x][i];
			mine.tick();
			minePack[x][y].push({wepnID:mine.wepnID,color:mine.color,x:mine.x,y:mine.y, angle:mine.angle});
		}
		PLANET_LIST[x][y].tick();
	}
	for(var i in PACKAGE_LIST){
		var boon = PACKAGE_LIST[i];
		if(tick % 5 == 0) boon.tick();
		packPack[boon.sx][boon.sy].push({x:boon.x, y:boon.y, type:boon.type});
	}
	for(var i in BEAM_LIST){
		var beam = BEAM_LIST[i];
		beam.tick();
		if(beam.time == 0) continue;
		beamPack[beam.sx][beam.sy].push({time:beam.time,wepnID:beam.wepnID,bx:beam.origin.x,by:beam.origin.y,ex:beam.enemy.x,ey:beam.enemy.y});
	}
	for(var i in BLAST_LIST){
		var blast = BLAST_LIST[i];
		blast.tick();
		if(blast.time == 0) continue;
		blastPack[blast.sx][blast.sy].push({time:blast.time,wepnID:blast.wepnID,bx:blast.bx,by:blast.by,angle:blast.angle});
	}
	var rbNow = rb;//important to calculate here, otherwise bots weighted on left.
	var bbNow = bb;
	
	for(var i = 0; i < mapSz; i++)
		for(var j = 0; j < mapSz; j++){
			var base = bases[i][j];
			if(base == 0) continue;
			base.tick(rbNow,bbNow);
			basePack[i][j] = {id:base.id,live:base.turretLive, isBase: base.isBase,maxHealth:base.maxHealth,health:base.health,color:base.color,x:base.x,y:base.y, angle:base.angle, spinAngle:base.spinAngle,owner:base.owner};
		}

	for(var i in ASTEROID_LIST){
		var ast = ASTEROID_LIST[i];
		ast.tick();
		astPack[ast.sx][ast.sy].push({metal:ast.metal,id:ast.id,x:ast.x,y:ast.y, angle:ast.angle,health:ast.health,maxHealth:ast.maxHealth});
	}
	for(var j in ORB_LIST){
		var orb = ORB_LIST[j];
		orb.tick();
		if(typeof orb === 'undefined') return;
		orbPack[orb.sx][orb.sy].push({wepnID:orb.wepnID,x:orb.x,y:orb.y});
		if(tick % 5 == 0 && orb.locked == 0){
			var locked = 0;
			for(var i in pack[orb.sx][orb.sy]){
				var player = pack[orb.sx][orb.sy][i];
				var dist = (player.x - orb.x)*(player.x - orb.x)+(player.y - orb.y)*(player.y - orb.y);
				if(player.empTimer <= 0 && player.color != orb.color && dist < wepns[orb.wepnID].Range * wepns[orb.wepnID].Range * 100){
					if(locked == 0) locked = player.id;
					else if(typeof PLAYER_LIST[locked] !== 'undefined' && dist < square(PLAYER_LIST[locked].x - orb.x)+square(PLAYER_LIST[locked].y - orb.y)) locked = player.id;
				}
			}
			orb.locked = locked;
			if(locked != 0) continue;
			if(basePack[orb.sx][orb.sy] != 0 && basePack[orb.sx][orb.sy].color != orb.color && basePack[orb.sx][orb.sy].turretLive && locked == 0) locked = base.id;
			orb.locked = locked;
			if(locked != 0) continue;
			for(var i in astPack[orb.sx][orb.sy]){
				var player = astPack[orb.sx][orb.sy][i];
				var dist = (player.x - orb.x)*(player.x - orb.x)+(player.y - orb.y)*(player.y - orb.y);
				if(dist < wepns[orb.wepnID].Range * wepns[orb.wepnID].Range * 100){
					if(locked == 0) locked = player.id;
					else if(typeof ASTEROID_LIST[locked] != "undefined" && dist < square(ASTEROID_LIST[locked].x - orb.x)+square(ASTEROID_LIST[locked].y - orb.y)) locked = player.id;
				}
			}
			orb.locked = locked;
		}
	}
	for(var j in MISSILE_LIST){
		var missile = MISSILE_LIST[j];
		missile.tick();
		if(typeof missile === 'undefined') return;
		missilePack[missile.sx][missile.sy].push({wepnID:missile.wepnID,x:missile.x,y:missile.y,angle:missile.angle});
		if(tick % 5 == 0 && missile.locked == 0){
			var locked = 0;
			for(var i in pack[missile.sx][missile.sy]){
				var player = pack[missile.sx][missile.sy][i];
				var dist = (player.x - missile.x)*(player.x - missile.x)+(player.y - missile.y)*(player.y - missile.y);
				if(player.empTimer <= 0 && player.color != missile.color && dist < wepns[missile.wepnID].Range * wepns[missile.wepnID].Range * 100){
					if(locked == 0) locked = player.id;
					else if(typeof PLAYER_LIST[locked] !== 'undefined' && dist < (PLAYER_LIST[locked].x - missile.x)*(PLAYER_LIST[locked].x - missile.x)+(PLAYER_LIST[locked].y - missile.y)*(PLAYER_LIST[locked].y - missile.y))locked = player.id;
				}
			}
			missile.locked = locked;
			if(locked != 0) continue;
			if(basePack[missile.sx][missile.sy] != 0 && basePack[missile.sx][missile.sy].turretLive && locked == 0) locked = base.id;
			
			missile.locked = locked;
			if(locked != 0) continue;
			for(var i in astPack[missile.sx][missile.sy]){
				var player = astPack[missile.sx][missile.sy][i];
				var dist = (player.x - missile.x)*(player.x - missile.x)+(player.y - missile.y)*(player.y - missile.y);
				if(dist < wepns[missile.wepnID].Range * wepns[missile.wepnID].Range * 100){
					if(locked == 0) locked = player.id;
					else if(typeof ASTEROID_LIST[locked] != "undefined" && dist < (ASTEROID_LIST[locked].x - missile.x)*(ASTEROID_LIST[locked].x - missile.x)+(ASTEROID_LIST[locked].y - missile.y)*(ASTEROID_LIST[locked].y - missile.y)) locked = player.id;
				}
			}
			missile.locked = locked;
		}
	}
	for(var i in PLAYER_LIST){
		var player = PLAYER_LIST[i];
		if(player.isBot)
			continue;
		if(tick % 12 == 0){ // LAG CONTROL
			send(i, 'online', {lag:lag, bp:bp, rp:rp, bg:bg, rg:rg, bb:bb, rb:rb});
			send(i, 'you', {killStreak:player.killStreak, killStreakTimer:player.killStreakTimer, name: player.name, points:player.points, va2:player.radar2, experience: player.experience, rank:player.rank, ship:player.ship, docked: player.docked,color:player.color, money: player.money, kills:player.kills, baseKills:player.baseKills, iron: player.iron, silver: player.silver, platinum: player.platinum, aluminium: player.aluminium});
		}
		send(i, 'posUp', {cloaked: player.disguise > 0, isLocked: player.isLocked, health:player.health, shield:player.shield, planetTimer: player.planetTimer, energy:player.energy, sx: player.sx, sy: player.sy,charge:player.reload,x:player.x,y:player.y, angle:player.angle, speed: player.speed,packs:packPack[player.sx][player.sy],vorts:vortPack[player.sx][player.sy],mines:minePack[player.sx][player.sy],missiles:missilePack[player.sx][player.sy],orbs:orbPack[player.sx][player.sy],blasts:blastPack[player.sx][player.sy],beams:beamPack[player.sx][player.sy],planets:planetPack[player.sx][player.sy], asteroids:astPack[player.sx][player.sy],players:pack[player.sx][player.sy], projectiles:bPack[player.sx][player.sy],bases:basePack[player.sx][player.sy]});
	}
	for(var i in DEAD_LIST){
		var player = DEAD_LIST[i];
		if(tick % 12 == 0) // LAG CONTROL
			send(i, 'online', {lag:lag, bb:bb,rb:rb,bp:bp,rp:rp,rg:rg,bg:bg});
		send(i, 'posUp', {packs:packPack[player.sx][player.sy],vorts:vortPack[player.sx][player.sy],mines:minePack[player.sx][player.sy],missiles:missilePack[player.sx][player.sy],orbs:orbPack[player.sx][player.sy],beams:beamPack[player.sx][player.sy],blasts:blastPack[player.sx][player.sy],planets:planetPack[player.sx][player.sy], asteroids:astPack[player.sx][player.sy],players:pack[player.sx][player.sy], projectiles:bPack[player.sx][player.sy],bases:basePack[player.sx][player.sy]});
	}
	for(var i in DOCKED_LIST){
		var player = DOCKED_LIST[i];
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
function deletePlayers(){
	for(var i in LEFT_LIST){
		if(LEFT_LIST[i]-- > 1) continue;
		delete SOCKET_LIST[i];
		delete DOCKED_LIST[i];
		delete PLAYER_LIST[i];
		delete DEAD_LIST[i];
		delete LEFT_LIST[i];
	}
}
setInterval(updateHeatmap, 1000);
function updateHeatmap(){
	var hmap = [];
	var lb = [];
	for(var i = 0; i < mapSz; i++){
		hmap[i] = [];
		for(var j = 0; j < mapSz; j++)
			hmap[i][j] = 0;
	}
	var j = 0;
	rb = rg = rp = bp = bg = bb = raidRed = raidBlue = 0;
	
	for(var i in PLAYER_LIST){
		var p = PLAYER_LIST[i];
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
		hmap[p.sx][p.sy]+=p.color === 'blue'?-1:1;
	}
	for(var i in DOCKED_LIST){
		var p = DOCKED_LIST[i];
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
	for(var i in DEAD_LIST){
		var p = DEAD_LIST[i];
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
	
	
	for(var i = 0; i < lb.length-1; i++)
		for(var k = 0; k < lb.length - i - 1; k++){
			if(lb[k + 1].experience > lb[k].experience){
				var temp = lb[k + 1];
				lb[k + 1] = lb[k];
				lb[k] = temp;
			}
		}
	var lbSend = [];
	for(var i = 0; i < Math.min(16,j); i++) lbSend[i] = {name:lb[i].name,exp:Math.round(lb[i].experience),color:lb[i].color,rank:lb[i].rank};
	for(var i = 0; i < mapSz; i++)
		for(var j = 0; j < mapSz; j++)
			if(asteroids[i][j] >= 15) hmap[i][j] += 1500;
			else hmap[i][j] += 500;
	for(var i in lb) send(lb[i].id, 'heatmap', {hmap:hmap, lb:lbSend, youi:i, raidBlue:raidBlue, raidRed:raidRed});
}
function updateLB(){
	chatAll("Updating torn.space/leaderboard...");
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
setTimeout(initReboot,86400*1000*10-6*60*1000);
function initReboot(){
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
	//decayPlayers();
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
				sendAll("chat",{msg:"Player " + split[14] + " failed to decay due to an unformatted save file with " + split.length + " entries. Cleaning file."});
				cleanFile(source);
			}
			continue;
		}
		data = "";
		var decayRate = (split[85] === "decay"?.98:.9995);

		split[22] = decay(parseFloat(split[22]),decayRate);//xp
		split[15] = decay(parseFloat(split[15]),decayRate);//money
		split[84] = decay(parseFloat(split[84]),decayRate);//energy
		split[26] = decay(parseFloat(split[26]),decayRate);//thrust
		split[27] = decay(parseFloat(split[27]),decayRate);//radar
		split[28] = decay(parseFloat(split[28]),decayRate);//cargo
		split[29] = decay(parseFloat(split[29]),decayRate);//hull

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
	if (fs.existsSync(x))
		fs.unlinkSync(x);
	data = "";
	for(var j = 0; j < 85; j++)
		data += split[j] + (j==84?"":":");
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
