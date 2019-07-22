var fs = require('fs');
require('./server_src/netcode.js');
require('./server_src/math.js');

var Bullet = require('./server_src/battle/bullet.js');
var Player = require("./server_src/player.js");
var Missile = require('./server_src/missile.js');

var jsn = JSON.parse(fs.readFileSync('client/weapons.json', 'utf8'));
global.wepns = jsn.weapons;
global.ships = jsn.ships;
global.planets = jsn.planets;


// bases                   (Red) / (Blue)
var baseMap = [	0,1,	//A2 / G6
				0,4,	//A5 / G3
				2,2,	//C3 / E5
				3,0,	//D1 / D7
				5,1];	//F2 / B6





//some global FINAL game mechanics
global.bulletWidth = 16; // collision radius
var mineLifetime = 3; // mines despawn after 3 minutes
var baseHealth = 600; // max base health
var baseKillExp = 50; // Exp reward for killing a base
var baseKillMoney = 25000; // ditto but money
global.mapSz = 7; // How many sectors across the server is. If changed, see planetsClaimed
global.sectorWidth = 14336; // must be divisible by 2048.
var botFrequency = trainingMode?.7:1.6;//higher: more bots spawn. Standard: 1.6
var playerHeal = .2; // player healing speed
var baseHeal = 1; // base healing speed
global.guestsCantChat = false;
var lbExp = new Array(1000); // Stores in memory where people stand on the global leaderboard.
var ranks = [0,5,10,20,50,100,200,500,1000,2000,4000,8000,14000,20000,40000,70000,100000,140000,200000,300000,500000,800000,1000000,1500000,2000000,3000000,5000000,8000000,12000000,16000000,32000000,64000000,100000000]; // exp to rank conversion.


//administrative-y variables
global.tick = 0;
var lag = 0, ops = 0; // ticks elapsed since boot, lag, count of number of instances of update() running at once
var bp = 0, rp = 0, bg = 0, rg = 0, bb = 0, rb = 0; // blue/red players/guests/bots
global.raidTimer = 50000;
var raidRed = 0, raidBlue = 0; // Timer and points
global.IPSpam = {}; // Keeps track of ips flooding server.
var bQuests = [];//A list of the 10 available quests for humans and aliens
var rQuests = [];





//Object lists. All of them are in Y-MAJOR ORDER.
global.sockets = {}; // network
global.players = new Array(mapSz); // in game
global.dockers = {}; // at a base
global.lefts = {}; // Queued for deletion- left the game
global.deads = {}; // Dead

global.bullets = new Array(mapSz);
global.missiles = new Array(mapSz);
global.orbs = new Array(mapSz);
global.mines = new Array(mapSz);
global.beams = new Array(mapSz);
global.blasts = new Array(mapSz);

global.bases = new Array(mapSz);
global.packs = new Array(mapSz); // Coins, ammo, packages, lives
global.vorts = new Array(mapSz); // Worm/black holes
global.asts = new Array(mapSz); // Asteroids
global.planets = new Array(mapSz);

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
global.trainingMode = false; // specifies whether this server is being used strictly to train neural network bots.
global.neuralFiles = 1500; // how many files should be in competition


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
		
		if(squaredDist(player,self) > 40000) return;
		
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
		orbs[self.sy][self.sx][r] = orb;
		sendAllSector('sound', {file:"beam",x: self.x, y: self.y}, self.sx, self.sy);
	}
	self.shootRifle = function(){
		self.reload = wepns[3].Charge/2;
		var r = Math.random();
		var bullet = Bullet(self, r, 3, self.angle, 0);
		bullets[self.sy][self.sx][r] = bullet;
		sendAllSector('sound', {file:"shot",x: self.x, y: self.y}, self.sx, self.sy);
	}
	self.shootMissile = function(){
		self.reload = wepns[10].Charge;
		var r = Math.random();
		var bAngle = self.angle;
		var missile = Missile(self, r, 10, bAngle);
		missiles[self.sy][self.sx][r] = missile;
		sendAllSector('sound', {file:"missile",x: self.x, y: self.y}, self.sx, self.sy);
	}
	self.shootLaser = function(){ // TODO merge this into Beam object, along with player.shootBeam()
		var nearP = 0;
		for(var i in players[self.sy][self.sx]){
			var p = players[self.sy][self.sx][i];
			if(p.color == self.color || p.sx != self.sx || p.sy != self.sy) continue;
			if(nearP == 0){
				nearP = p;
				continue;
			}
			var dx = p.x - self.x, dy = p.y - self.y;
			if(dx * dx + dy * dy < squaredDist(nearP, self)) nearP = p;
		}
		if(nearP == 0) return;
		var r = Math.random();
		var beam = Beam(self, r, 8, nearP, self);
		beams[self.sy][self.sx][r] = beam;
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
		
		if(!self.isBase) bases[self.sy][self.sx] = 0;
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
		delete vorts[self.sy][self.sx][self.id];
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
			
			var b = bases[self.sy][self.sx];
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
		delete asts[self.sy][self.sx][self.id];
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
			delete packs[self.sy][self.sx][self.id];
		}
		for(var i in players[self.sy][self.sx]){ // loop for collision
			var p = players[self.sy][self.sx][i];
			if(squaredDist(p,self) < square(16 + ships[p.ship].width)){ // someone hit me
				
				onCollide(p);
				
				delete packs[self.sy][self.sx][self.id]; // despawn
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
			var target = players[self.sy][self.sx][self.locked];
			if(typeof target === 'undefined' && bases[self.sy][self.sx].color != self.color) target = bases[self.sy][self.sx];
			if(target == 0) target = asts[self.sy][self.sx][self.locked];
			if(typeof target === 'undefined') self.locked = 0;
			else{ // if we are locked onto something
				if(target.type === "Player") target.isLocked = true; // tell the player they're locked onto for an alert message
				var d2 = squaredDist(target,self);
				if(sameSector(target,self) && d2 < square(100) && target.turretLive != false){ // if it's a base we can't attack when it's dead
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
		delete orbs[self.sy][self.sx][self.id];
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
			delete beams[self.sy][self.sx][self.id];
		}
	}
	return self;
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
function sameSector(a,b){
	return a.sx == b.sx && a.sy == b.sy
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



global.sectors = new Array(9);
init();
function init(){ // start the server!
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

	var netcode = require('./server_src/netcode.js');
	netcode();

	console.log('Server started');

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
		
		planets[y][x].tick();
		
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
					var dist = squaredDist(player,orb);
					if(player.empTimer <= 0 && player.color != orb.color && dist < wepns[orb.wepnID].Range * wepns[orb.wepnID].Range * 100){
						if(locked == 0) locked = player.id;
						else if(typeof players[orb.sy][orb.sx][locked] !== 'undefined' && dist < square(players[orb.sy][orb.sx][locked].x - orb.x)+square(players[orb.sy][orb.sx][locked].y - orb.y)) locked = player.id;
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
						else if(typeof asts[orb.sy][orb.sx][locked] != "undefined" && dist < squaredDist(asts[orb.sy][orb.sx][locked],orb)) locked = player.id;
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
					var dist = squaredDist(player,missile);
					if(player.empTimer <= 0 && player.color != missile.color && dist < wepns[missile.wepnID].Range * wepns[missile.wepnID].Range * 100){
						if(locked == 0) locked = player.id;
						else if(typeof players[missle.sy][missle.sx][locked] !== 'undefined' && dist < squaredDist(players[missle.sy][missle.sx][locked],missile))locked = player.id;
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
						else if(typeof asts[missle.sy][missle.sx][locked] != "undefined" && dist < squaredDist(asts[missle.sy][missle.sx][locked],missile)) locked = player.id;
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
