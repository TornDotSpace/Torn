// The Torn.Space Server Entry Point

/** 
 * 			THIS FILE IS PART OF THE "Torn.Space" PROJECT 
 * 			Copyright (c) The Torn.Space Team 2018-2019
 * 						ALL RIGHTS RESERVED
 */

console.log("************************************************************************************************************************");
console.log(" ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄        ▄     ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄ ");
console.log("▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░▌      ▐░▌   ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌");
console.log(" ▀▀▀▀█░█▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌▐░▌░▌     ▐░▌   ▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀▀▀ ");
console.log("     ▐░▌     ▐░▌       ▐░▌▐░▌       ▐░▌▐░▌▐░▌    ▐░▌   ▐░▌          ▐░▌       ▐░▌▐░▌       ▐░▌▐░▌          ▐░▌          ");
console.log("     ▐░▌     ▐░▌       ▐░▌▐░█▄▄▄▄▄▄▄█░▌▐░▌ ▐░▌   ▐░▌   ▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄█░▌▐░▌          ▐░█▄▄▄▄▄▄▄▄▄ ");
console.log("     ▐░▌     ▐░▌       ▐░▌▐░░░░░░░░░░░▌▐░▌  ▐░▌  ▐░▌   ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░▌          ▐░░░░░░░░░░░▌");
console.log("     ▐░▌     ▐░▌       ▐░▌▐░█▀▀▀▀█░█▀▀ ▐░▌   ▐░▌ ▐░▌    ▀▀▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌▐░▌          ▐░█▀▀▀▀▀▀▀▀▀ ");
console.log("     ▐░▌     ▐░▌       ▐░▌▐░▌     ▐░▌  ▐░▌    ▐░▌▐░▌             ▐░▌▐░▌          ▐░▌       ▐░▌▐░▌          ▐░▌          ");
console.log("     ▐░▌     ▐░█▄▄▄▄▄▄▄█░▌▐░▌      ▐░▌ ▐░▌     ▐░▐░▌ ▄  ▄▄▄▄▄▄▄▄▄█░▌▐░▌          ▐░▌       ▐░▌▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄▄▄ ");
console.log("     ▐░▌     ▐░░░░░░░░░░░▌▐░▌       ▐░▌▐░▌      ▐░░▌▐░▌▐░░░░░░░░░░░▌▐░▌          ▐░▌       ▐░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌");
console.log("      ▀       ▀▀▀▀▀▀▀▀▀▀▀  ▀         ▀  ▀        ▀▀  ▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀            ▀         ▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀ ");
console.log("                                                                                                                        ");
console.log("************************************************************************************************************************");

// Load config 
var configEnvironment = (process.argv.length <= 3) ? "dev" : process.argv[3];
require('./server_src/config.js')(configEnvironment);
// Hack for strict mode - we define IO later
global.io = { }
io.emit = function(a,b) { };

var fs = require('fs');

buildFileSystem(); // create folders for players, neural nets, and turrets if they dont exist

if (!Config.getValue("debug", "false")) {
	var stdoutFileName = "logs/" + (new Date()) + ".log";
	var stderrFilename = "error_logs/" + (new Date()) + ".log";
	global.console = new console.Console(fs.createWriteStream(stdoutFileName), fs.createWriteStream(stderrFilename));
}

global.initReboot = function () {
	console.log("\nInitializing server reboot...\n");
	chatAll("~`#f00~`Server restarting in 120 seconds. Save your progress!");
	setTimeout(function () { chatAll("~`#f00~`Server restarting in 90 seconds. Save your progress!"); }, 30 * 1000);
	setTimeout(function () { chatAll("~`#f00~`Server restarting in 60 seconds. Save your progress!"); }, 60 * 1000);
	setTimeout(function () { chatAll("~`#f00~`Server restarting in 30 seconds. Save your progress!"); }, 90 * 1000);
	setTimeout(function () { chatAll("~`#f00~`Server restarting in 10 seconds. Save your progress!"); }, 110 * 1000);
	setTimeout(function () { chatAll("~`#f00~`Server restarting in 5..."); }, 115 * 1000);
	setTimeout(function () { chatAll("~`#f00~`Server restarting in 4..."); }, 116 * 1000);
	setTimeout(function () { chatAll("~`#f00~`Server restarting in 3..."); }, 117 * 1000);
	setTimeout(function () { chatAll("~`#f00~`Server restarting in 2..."); }, 118 * 1000);
	setTimeout(function () { chatAll("~`#f00~`Server restarting in 1..."); }, 119 * 1000);
	setTimeout(shutdown, 120 * 1000);
}

global.saveTurrets = function () {
	//save em
	var count = 0;
	for (var i = 0; i < mapSz; i++)
		for (var j = 0; j < mapSz; j++) {
			var base = bases[i][j];
			if (base != 0 && !base.isBase) {
				base.save();
				count++;
			}
		}
}

global.readMuteTable = function(){
	var source = "server/permamute";
	var data = fs.readFileSync(source, 'utf8');
	var split = data.split(":");
	for(var i = 0; i < split.length; i++)
		muteTable[split[i]] = 10000000000000;
	console.log(muteTable);
}

global.guildList = {};

global.readGuildList = function(){
	var source = "server/guildnames";
	var data = fs.readFileSync(source, 'utf8');
	var split = data.split(":");
	console.log(split);
	for(var i = 0; i+4 < split.length; i+=5)
		guildList[split[i]] = {owner:split[i+1], team:split[i+2], public:split[i+3], rank:split[i+4]};
	console.log(guildList);
}

require('./server_src/math.js');

var Base = require('./server_src/universe/base.js');
var Asteroid = require("./server_src/universe/asteroid.js");
var Planet = require("./server_src/universe/planet.js");
var Vortex = require("./server_src/universe/vortex.js");
var netcode = require('./server_src/netcode.js');

require('./server_src/db.js');
connectToDB();

var tickRate = 1000 / Config.getValue("server_tick_rate", 60);

var jsn = JSON.parse(fs.readFileSync('client/weapons.json', 'utf8'));
global.eng = JSON.parse(fs.readFileSync('client/english.json', 'utf8'));
global.wepns = jsn.weapons;
global.ships = jsn.ships;
global.planetNames = jsn.planets;


// bases
global.basesPerTeam = 6;
global.baseMap=	{
					"red":[	//x, y
					1, 1,
					2, 8,
					2, 3,
					0, 4,
					1, 6,
					0, 8
					],
					"blue":[
					4, 1,
					5, 8,
					5, 3,
					3, 4,
					4, 6,
					3, 8
					],
					"green":[
					7, 1,
					8, 8,
					8, 3,
					6, 4,
					7, 6,
					6, 8
					],
				};

//some global FINAL game mechanics
global.bulletWidth = 16; // collision radius
var mineLifetime = 3; // mines despawn after this many minutes
global.botDespawnRate = 0.0005; // Probability a bot with no nearby enemies despawns each tick
global.baseHealth = 4500; // max base health
global.baseKillExp = 7500; // Exp reward for killing a base
global.baseKillMoney = 250000; // ditto but money
global.mapSz = 9; // How many sectors across the server is. If changed, see planetsClaimed
global.sectorWidth = 14336; // must be divisible by 2048.
global.moneyPerRaidPoint = 300000;
global.playerLimit = 130; // A soft limit on the max number of players+bots+guests online. When reached, bots do not spawn as much
global.playerKillMoney = 2500;

//Machine Learning
global.trainingMode = false; // specifies whether this server is being used strictly to train neural network bots.
global.neuralFiles = 1500; // how many files should be in competition

global.botFrequency = trainingMode ? .0014 : .003;//higher: more bots spawn.
global.playerHeal = .2; // player healing speed
global.baseHeal = 1; // base healing speed
global.guestsCantChat = !Config.getValue("want_guest_chat", true);
global.lbExp = new Array(1000); // Stores in memory where people stand on the global leaderboard.
global.ranks = [0, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 4000, 8000, 14000, 20000, 40000, 70000, 100000, 140000, 200000, 300000, 500000, 800000, 1000000, 1500000, 2000000, 3000000, 5000000, 8000000, 12000000, 16000000, 32000000, 64000000, 100000000]; // exp to rank conversion.


//administrative-y variables
global.tick = 0;
var lag = 0, ops = 0; // ticks elapsed since boot, lag, count of number of instances of update() running at once
global.playerCount = 0;
global.botCount = 0;
global.guestCount = 0; // blue/red players/guests/bots
global.raidTimer = 50000;
var raidRed = 0, raidBlue = 0, raidGreen = 0; // Timer and points
global.teamQuests = {"blue":[], "red":[], "green":[]};//A list of the 10 available quests for humans and aliens

var broadcastMsg=0;



//Object lists. All of them are in Y-MAJOR ORDER.
global.sockets = {}; // network
global.players = new Array(mapSz); // in game
global.dockers = {}; // at a base
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

for (var i = 0; i < mapSz; i++) { // it's 2d
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
	for (var j = 0; j < mapSz; j++) { // it's 2d
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

function sendRaidData() { // tell everyone when the next raid is happening
	sendAll("raid", { raidTimer: raidTimer });
}

function getPlayer(i) { // given a socket id, find the corresponding player object.
	return sockets[i].player;
}

global.getPlayerFromName = function(name) { // given a socket id, find the corresponding player object.
    for (var p in sockets) {
        var player = sockets[p].player;
        if (typeof player !== "undefined" && player.nameWithoutTag() === name) return player;
    }
    return -1;
}

function updateQuests() {
	for(var teamColor in baseMap) {
		var thisMap = baseMap[teamColor];
		for (var i = 0; i < 10; i++) {
			if (teamQuests[teamColor][i] !== 0) continue;
			var r = Math.random();
			var r2 = Math.random();
			var whatTeam = (Math.random()<.5)?colorSelect(teamColor,"blue","green","red"):colorSelect(teamColor,"green","red","blue");
			var metals = ["aluminium", "silver", "platinum", "iron"];
			var nm = 0;
			if (i < 4) {
				var dsxv = Math.floor(r2 * 100 % 1 * mapSz), dsyv = Math.floor(r2 * 1000 % 1 * mapSz);
				var sxv = Math.floor(r2 * mapSz), syv = Math.floor(r2 * 10 % 1 * mapSz);
				if (dsxv == sxv && dsyv == syv) return;
				nm = { type: "Delivery", metal: metals[Math.floor(r * 4)], exp: Math.floor(1 + Math.sqrt(square(sxv - dsxv) + square(syv - dsyv))) * 20000, sx: sxv, sy: syv, dsx: dsxv, dsy: dsyv };
			}
			else if (i < 7) nm = { type: "Mining", metal: metals[Math.floor(r * 4)], exp: 65000, amt: Math.floor(1200 + r * 400), sx: thisMap[Math.floor(r2 * basesPerTeam) * 2], sy: thisMap[Math.floor(r2 * basesPerTeam) * 2 + 1] };
			else if (i < 9) nm = { type: "Base", 	exp: 500000, sx: baseMap[whatTeam][Math.floor(r2 * basesPerTeam) * 2], sy: baseMap[whatTeam][Math.floor(r2 * basesPerTeam) * 2 + 1] };
			else 			nm = { type: "Secret", 	exp: 1000000, sx: baseMap[whatTeam][Math.floor(r2 * basesPerTeam) * 2], sy: baseMap[whatTeam][Math.floor(r2 * basesPerTeam) * 2 + 1] };
			teamQuests[teamColor][i] = nm;
		}
	}
}

// packs are how we send data to the client

var playerPack = new Array(mapSz);
var missilePack = new Array(mapSz);
var orbPack = new Array(mapSz);
var minePack = new Array(mapSz);
var blastPack = new Array(mapSz);
var beamPack = new Array(mapSz);
var planetPack = new Array(mapSz);
var packPack = new Array(mapSz);
var basePack = new Array(mapSz);
var astPack = new Array(mapSz);
var vortPack = new Array(mapSz);

for(var i = 0; i < mapSz; i++){
	playerPack[i] = new Array(mapSz);
	missilePack[i] = new Array(mapSz);
	orbPack[i] = new Array(mapSz);
	minePack[i] = new Array(mapSz);
	blastPack[i] = new Array(mapSz);
	beamPack[i] = new Array(mapSz);
	planetPack[i] = new Array(mapSz);
	packPack[i] = new Array(mapSz);
	astPack[i] = new Array(mapSz);
	vortPack[i] = new Array(mapSz);
	basePack[i] = { };

	for(var j = 0; j < mapSz; j++){
		playerPack[i][j] = { };
		packPack[i][j] = { };
		missilePack[i][j] = { };
		orbPack[i][j] = { };
		minePack[i][j] = { };
		blastPack[i][j] = { };
		beamPack[i][j] = { };
		planetPack[i][j] = { };
		astPack[i][j] = { };
		vortPack[i][j] = { };
	}
}


init();

function sigHandle() {
	console.log("[SERVER] Caught termination signal...");

	sendAll("kick", { msg: "You have been logged out by an adminstrator working on the servers." });

	for (var y in players) {
		for (var x in players[y]) {
			for (var id in players[y][x]) {
				// Save & kick out
				var player = players[y][x][id];
				player.save();
			}
		}
	}
	setTimeout(kill, 5000);
}

function onCrash(err) {
	onCrash = function() { };

	console.log("[SERVER] Uncaught exception detected, kicking out players and terminating shard.");

	sendAll("kick", {msg: ":( The server you are playing on has encountered a problem and needs to reset. Please tell a developer that this happened. You should be able to log back into the game and start exploring the universe almost immediately. :("});

	var plyrs = '';

	for (var y in players) {
		for (var x in players[y]) {
			for (var id in players[y][x]) {
				// Save & kick out
				var player = players[y][x][id];
				player.save();
				plyrs = plyrs + player.name + ', ';
			}
		}
	}

	console.error("==== TORN.SPACE CRASH REPORT ====\n");
	console.error("Crash Time: " + new Date() + "\n");
	console.error("Players online: " + plyrs + "\n");
	console.error("Exception information: " + "\n");
	console.error("Trace: " + err.stack + "\n");

	// Exit with status code 3 to indicate uncaught exception
	setTimeout(function() { process.exit(3); }, 4000);
}
function init() { // start the server!
	// Activate uncaught exception handler
	process.on('uncaughtException', onCrash);

	// Add signal handlers
	process.on('SIGINT', sigHandle);
	process.on('SIGTERM', sigHandle);

	//initialize lists of quests
	for(var s in teamQuests){
		for (var i = 0; i < 10; i++) {
			teamQuests[s][i] = 0;
		}
	}

	readMuteTable();
	readGuildList();

	spawnBases();

	//make asteroids. Make 10 times the number of sectors.
	for (var i = 0; i < mapSz * mapSz * 8; i++) createAsteroid(Math.floor(i/mapSz), i%mapSz);

	//Make exactly one planet in each sector.
	for (var s = 0; s < mapSz * mapSz; s++) {
		var x = s % mapSz;
		var y = Math.floor(s / mapSz);
		createPlanet(planetNames[s], x, y);
	}

	//wormhole
	var id = Math.random();
	var v = new Vortex(id, Math.random() * sectorWidth, Math.random() * sectorWidth, Math.floor(Math.random() * mapSz), Math.floor(Math.random() * mapSz), .5, 0, true);
	vorts[v.sy][v.sx][id] = v;

	//3 Black Holes
	for(var vortno = 0; vortno < 9; vortno++){
		if(vortno % 3 != 1) continue;
		id = Math.random();
		v = new Vortex(id, sectorWidth / 2, sectorWidth / 2, vortno, 8, .15, 0, false);
		vorts[v.sy][v.sx][id] = v;
	}

	//start ticking
	netcode();

	setTimeout(update, tickRate);
	broadcastInfo();

	console.log("Server initialized successfully. Game log below.\n");
}

function buildFileSystem() { // create the server files/folders
	//IMPORTANT that we do not log to file in this function, as this function does not assume the logs folder exists.
	console.log("\nCreating any potential missing files and folders needed for the server...");
	var allGood = true;

	var dirs = ['./server', './server/neuralnets', './logs', './error_logs'];
	for(var i in dirs){
		var dir = dirs[i];
		if (!fs.existsSync(dir)) {
			console.log("Creating " + dir + " directory...");
			fs.mkdirSync(dir);
			allGood = false;
		}
	}

	var mutesource = "server/permamute";
	if (!fs.existsSync(mutesource)) {
		fs.writeFileSync(mutesource,"");
		console.log("Creating muted player list...");
		allGood = false;
	}

	var guildsource = "server/guildnames";
	if (!fs.existsSync(guildsource)) {
		fs.writeFileSync(guildsource,"");
		console.log("Creating guild file...");
		allGood = false;
	}

	if (allGood) console.log("All server directories and files were already present!");

}
function spawnBases() {
	console.log("\nSpawning Bases...");
	for (var teamColor in baseMap) {
		var thisMap = baseMap[teamColor];
		for (var i = 0; i < thisMap.length; i += 2) {
			//make a base at these coords
			var randBase = Math.random();
			var thisBase = Base(randBase, true, thisMap[i], thisMap[i + 1], teamColor, sectorWidth / 2, sectorWidth / 2, false);
			bases[thisMap[i + 1]][thisMap[i]] = thisBase;
		}
	}
	console.log("\nBases Spawned!");
}


function kill() {
	process.exit();
}


function createPlanet(name, sx, sy) {
	var randA = Math.random();
	var planet = Planet(randA, name);
	planet.sx = sx;
	planet.sy = sy;
	while (square(planet.x - sectorWidth / 2) + square(planet.y - sectorWidth / 2) < 3000000) {
		planet.x = Math.floor(Math.random() * sectorWidth * 15 / 16 + sectorWidth / 32);
		planet.y = Math.floor(Math.random() * sectorWidth * 15 / 16 + sectorWidth / 32);
	}
	planets[sy][sx] = planet;
}
function endRaid() {
	var winners = "yellow";
	if (raidRed > raidBlue && raidRed > raidGreen) winners = "red";
	else if (raidBlue > raidRed && raidBlue > raidGreen) winners = "blue";
	else if (raidGreen > raidRed && raidGreen > raidBlue) winners = "green";
	raidTimer = 100*1000;
	var winnerPoints = Math.max(raidGreen, Math.max(raidBlue, raidRed));
	for (var i in sockets) {
		var p = getPlayer(i);
		if (p === undefined) continue;
		if (p.color === winners) p.spoils("money", p.points * moneyPerRaidPoint);
		p.points = 0;
	}
	sendRaidData();
	if(winners !== "yellow") chatAll("~`" + winners + "~`" + winners + "~`yellow~` team won the raid, and made $"+(winnerPoints*moneyPerRaidPoint)+"!");
}

function update() {
	ops++;
	if (ops < 2) setTimeout(update, tickRate);
	tick++;
	var d = new Date();
	var lagTimer = d.getTime();
	updateQuests();

	for (var i in dockers) {
		var player = dockers[i];
		if (player.dead) continue;
		if (player.testAfk()) continue;
		if (tick % 30 == 0) player.checkMoneyAchievements();
		if (player.chatTimer > 0) player.chatTimer--;
		player.muteTimer--;
	}

	for (var y = 0; y < mapSz; y++) for (var x = 0; x < mapSz; x++) {

		var gameState = {
			vorts : new Array(),
			players : new Array(),
			mines : new Array(),
			packs : new Array(),
			beams :  new Array(),
			blasts :  new Array(),
			asteroids :  new Array(),
			orbs : new Array(),
			missiles : new Array(),
			base : undefined
		}

		for (var i in players[y][x]) {
			var player = players[y][x][i];
			var pack = playerPack[y][x][i];

			if (!player.isBot && player.chatTimer > 0) player.chatTimer--;
			player.muteTimer--;
			if (player.testAfk()) continue;
			player.isLocked = false;
			player.tick();

			// Check for creation
			if (pack === undefined) {
				// Store pack for joining clients & delta calculation
				pack = playerPack[y][x][i] = {disguise : player.disguise, trail: player.trail, shield: player.shield, empTimer: player.empTimer, hasPackage: player.hasPackage, id: player.id, ship: player.ship, speed: player.speed, maxHealth: player.maxHealth, color: player.color, x: player.x, y: player.y, name: player.name, health: player.health, angle: player.angle, driftAngle: player.driftAngle };
				// Send create 
				sendAllSector("player_create", pack, x, y);

				// Send full update to the player
				if (!player.isBot) 
					player.socket.emit('posUp', {disguise : player.disguise, trail:player.trail, isLocked: player.isLocked, health:player.health, shield:player.shield, planetTimer: player.planetTimer, energy:player.energy, sx: player.sx, sy: player.sy,charge:player.charge,x:player.x,y:player.y, angle:player.angle, speed: player.speed,packs:packPack[player.sy][player.sx],vorts:vortPack[player.sy][player.sx],mines:minePack[player.sy][player.sx],missiles:missilePack[player.sy][player.sx],orbs:orbPack[player.sy][player.sx],blasts:blastPack[player.sy][player.sx],beams:beamPack[player.sy][player.sx],planets:planetPack[player.sy][player.sx], asteroids:astPack[player.sy][player.sx],players:playerPack[player.sy][player.sx],bases:basePack[player.sy][player.sx]});
				continue;
			}

			var delta = { };
			var need_update = false;

			var cloak = false;

			if (!player.isBot && pack.disguise > 0)
				cloak = true;


			// Compute delta
			for (var key in pack) {
				if (pack[key] !== player[key]) {
					delta[key] = pack[key] = player[key];
					need_update = true;
				}
			}

			// Handle cloaking
			if (need_update && cloak) {
				player.socket.emit('update', {disguise: player.disguise, isLocked: player.isLocked, planetTimer: player.planetTimer, charge: player.charge, energy: player.energy, state: { players: [ {delta: delta, id: i} ] }} );
				continue;
			}

			if (!need_update) continue;

			gameState.players.push({delta: delta, id: i});
		}

		for (var i in vorts[y][x]) {
			var vort = vorts[y][x][i];
			var pack = vortPack[y][x][i];

			vort.tick();
			// Check for creation 
			if (pack === undefined) {
				// Store pack for joining clients & delta calculation
				pack = vortPack[y][x][i] = { x: vort.x, y: vort.y, size: vort.size, isWorm: vort.isWorm };
				// Send create
				sendAllSector("vort_create", {pack : pack, id: i}, x, y);
				continue;
			}

			var delta = { };
			var need_update = false;

			// Compute delta
			for (var key in pack) {
				if (pack[key] !== vort[key]) {
					delta[key] = pack[key] = vort[key];
					need_update = true;
				}
			}

			if (!need_update) continue;

			gameState.vorts.push({delta: delta, id: i});
		}

		for (var i in bullets[y][x]) bullets[y][x][i].tick();

		for (var i in mines[y][x]) {
			var mine = mines[y][x][i];
			var pack = minePack[y][x][i];

			mine.tick();

			// Check for creation
			if (pack === undefined) {
				pack = minePack[y][x][i] = { wepnID: mine.wepnID, color: mine.color, x: mine.x, y: mine.y, angle: mine.angle };
				// Send create 
				sendAllSector('mine_create', { pack: pack, id: i}, x, y);
				continue;
			}

			var delta = { };
			var need_update = false;

			// Compute delta
			for (var key in pack) {
				if (pack[key] !== mine[key]) {
					delta[key] = pack[key] = mine[key];
					need_update = true;
				}
			}

			if (!need_update) continue;
			gameState.mines.push({delta: delta, id: i});
		}

		planets[y][x].tick();

		// We only pulse these every 5 ticks
		if (tick % 5 == 0) {
			for (var i in packs[y][x]) {
				var boon = packs[y][x][i];
				var pack = packPack[y][x][i];

				boon.tick();

				// Check for creation 
				if (pack === undefined) {
					pack = packPack[y][x][i] = { x: boon.x, y: boon.y, type: boon.type };

					// Send create
					sendAllSector('pack_create', {pack: pack, id: i}, x, y);
					continue;
				}


				var delta = { };
				var need_update = false;

				// Compute delta
				for (var key in pack) {
					if (pack[key] !== boon[key]) {
						delta[key] = pack[key] = boon[key];
						need_update = true;
					}
				}

				if (!need_update) continue;
				gameState.packs.push({delta: delta, id: i});
			}
		}

		for (var i in beams[y][x]) {
			var beam = beams[y][x][i];
			var pack = beamPack[y][x][i];

			beam.tick();

			// Check for creation
			if (pack == undefined) {
				// Store pack for joining clients & delta calculation
				pack = beamPack[y][x][i] = { time: beam.time, wepnID: beam.wepnID, bx: beam.origin.x, by: beam.origin.y, ex: beam.enemy.x, ey: beam.enemy.y };
				// Send create
				sendAllSector('beam_create', {pack: pack, id: i}, x, y);
				continue;
			}

			var delta = { };
			var need_update = false;

			// Compute delta
			for (var key in pack) {
				var beam_key = undefined;

				if (key === 'bx') {
					beam_key = beam.origin.x;
				}

				if (key === 'by') {
					beam_key = beam.origin.y;
				}

				if (key === 'ex') {
					beam_key = beam.enemy.x;
				}

				if (key === 'ey') {
					beam_key = beam.enemy.y;
				}

				if (beam_key === undefined) {
					beam_key = beam[key];
				}

				if (pack[key] !==  beam_key) {
					delta[key] = pack[key] = beam_key;
					need_update = true;
				}
			}

			if (beam.sy != y || beam.sx != x) {
				beam.sy = y;
				beam.sx = x;
			}

			if (!need_update) continue;
			gameState.beams.push({delta : delta, id : i});
		}

		for (var i in blasts[y][x]) {
			var blast = blasts[y][x][i];
			var pack = blastPack[y][x][i];

			blast.tick();

			// Check for creation
			if (pack === undefined) {
				pack = blastPack[y][x][i] = { time: blast.time, wepnID: blast.wepnID, bx: blast.bx, by: blast.by, angle: blast.angle };

				sendAllSector('blast_create', {pack: pack, id: i}, x, y);
				continue;
			}

			var delta = { };
			var need_update = false;

			// Compute delta
			for (var key in pack) {
				if (pack[key] !== blast[key]) {
					delta[key] = pack[key] = blast[key];
					need_update = true;
				}
			}

			if (!need_update) continue;
			gameState.blasts.push({ delta: delta, id : i});
		}

		var base = bases[y][x];

		if (base !== 0) {
			var pack = basePack[y][x];

			base.tick();

			// Check for creation (only happens once, on first tick, or when a turret is placd)
			if (pack === undefined) {
				pack = basePack[y][x] = { id: base.id, turretLive: base.turretLive, isBase: base.isBase, isMini:base.isMini, maxHealth: base.maxHealth, health: base.health, color: base.color, x: base.x, y: base.y, angle: base.angle, spinAngle: base.spinAngle, name: base.name };
				sendAllSector('base_create', pack, x, y);
				continue;
			}

			var delta = { };
			var need_update = false;

			// Compute delta
			for (var key in pack) {
				if (pack[key] !== base[key]) {
					delta[key] = pack[key] = base[key];
					need_update = true;
				}
			}

			if (need_update) {
				gameState.base = {delta: delta};
			}
		}

		for (var i in asts[y][x]) {
			var ast = asts[y][x][i];
			var pack = astPack[y][x][i];

			ast.tick();
			// Check for creation 
			if (pack === undefined) {
				pack = astPack[y][x][i] = { metal: ast.metal, id: i, x: ast.x, y: ast.y, angle: ast.angle, health: ast.health, maxHealth: ast.maxHealth };
				sendAllSector('asteroid_create', pack, x, y);
				continue;
			}

			var delta = { };
			var need_update = false;

			// Compute delta
			for (var key in pack) {
				if (pack[key] !== ast[key]) {
					delta[key] = pack[key] = ast[key];
					need_update = true;
				}
			}

			if (!need_update) continue;

			gameState.asteroids.push({delta: delta, id: i});
		}

		for (var j in orbs[y][x]) {
			var orb = orbs[y][x][j];
			var pack = orbPack[y][x][j];

			orb.tick();

			// Check for creation
			if (pack === undefined) {
				pack = orbPack[y][x][j] = { wepnID: orb.wepnID, x: orb.x, y: orb.y };
				sendAllSector('orb_create', {pack: pack, id: j}, x, y);

				continue;
			}
			
			var delta = { };
			var need_update = false;

			// Compute delta
			for (var key in pack) {
				if (pack[key] !== orb[key]) {
					delta[key] = pack[key] = orb[key];
					need_update = true;
				}
			}

			if (!need_update) continue;
			
			gameState.orbs.push({delta: delta, id: j});
		}

		for (var j in missiles[y][x]) {
			var missile = missiles[y][x][j];
			var pack = missilePack[y][x][j];

			missile.tick();

			// Check for creation 
			if (pack === undefined) {
				pack = missilePack[y][x][j] = { wepnID: missile.wepnID, x: missile.x, y: missile.y, angle: missile.angle };

				sendAllSector('missile_create', {pack : pack, id : j}, x, y);
				continue;
			}

			var delta = { };
			var need_update = false;

			// Compute delta
			for (var key in pack) {
				if (pack[key] !== missile[key]) {
					delta[key] = pack[key] = missile[key];
					need_update = true;
				}
			}

			if (!need_update) continue;

			gameState.missiles.push({delta: delta, id: j});
		}

		for (var i in vortPack[y][x]) {
			if (vorts[y][x][i] === undefined) {
				// Send delete
				sendAllSector('vort_delete', i, x, y);

				delete vortPack[y][x][i];
				continue;
			}
		}

		// Check for deletions
		for (var i in playerPack[y][x]) {
			if (players[y][x][i] === undefined) {
				// Send delete 
				sendAllSector('player_delete', i, x, y);
				delete playerPack[y][x][i];
				continue;
			}
		}

		for (var i in minePack[y][x]) {
			if (mines[y][x][i] === undefined) {
				// Send delete 
				sendAllSector('mine_delete', i, x, y);
				delete minePack[y][x][i];
				continue;
			}
		}

		for (var i in missilePack[y][x]) {
			if (missiles[y][x][i] === undefined) {
				sendAllSector('missile_delete', i, x, y);

				delete missilePack[y][x][i];
				continue;
			}
		}

		for (var i in orbPack[y][x]) {
			if (orbs[y][x][i] === undefined) {
				sendAllSector('orb_delete', i, x, y);

				delete orbPack[y][x][i];
				continue;
			}

		}

		for (var i in blastPack[y][x]) {
			if (blasts[y][x][i] === undefined) {
				// Send delete
				sendAllSector('blast_delete', i, x, y);
				delete blastPack[y][x][i];
				continue;
			}
		}

		for (var i in beamPack[y][x]) {
			if (beams[y][x][i] === undefined) {
				sendAllSector('beam_delete', i, x, y);

				delete beamPack[y][x][i];
				continue;
			}
		}

		for (var i in packPack[y][x]) {
			if (packs[y][x][i] === undefined) {
				// Send delete 
				sendAllSector('pack_delete', i, x, y);

				delete packPack[y][x][i];
				continue;
			}
		}

		for (var i in astPack[y][x]) {
			if (asts[y][x][i] === undefined) {
				sendAllSector('asteroid_delete', i, x, y);
				delete astPack[y][x][i];
				continue;
			}
		}

		if (basePack[y][x] !== undefined && bases[y][x] === 0) {
			sendAllSector('base_delete', 0, x, y);
			delete basePack[y][x];
		}

		for (var i in players[y][x]) {
			var player = players[y][x][i];
			if (player.isBot) continue;
			if (tick % 12 == 0) { // LAG CONTROL
				player.socket.emit('online', { lag: lag });
				player.socket.emit('you', { trail:player.trail, killStreak: player.killStreak, killStreakTimer: player.killStreakTimer, name: player.name, points: player.points, va2: player.radar2, experience: player.experience, rank: player.rank, ship: player.ship, docked: player.docked, color: player.color, money: player.money, kills: player.kills, baseKills: player.baseKills, iron: player.iron, silver: player.silver, platinum: player.platinum, aluminium: player.aluminium });
			}

			//send(i, 'posUp', {cloaked: player.disguise > 0, isLocked: player.isLocked, health:player.health, shield:player.shield, planetTimer: player.planetTimer, energy:player.energy, sx: player.sx, sy: player.sy,charge:player.charge,x:player.x,y:player.y, angle:player.angle, speed: player.speed,packs:packPack[player.sy][player.sx],vorts:vortPack[player.sy][player.sx],mines:minePack[player.sy][player.sx],missiles:missilePack[player.sy][player.sx],orbs:orbPack[player.sy][player.sx],blasts:blastPack[player.sy][player.sx],beams:beamPack[player.sy][player.sx],planets:planetPack[player.sy][player.sx], asteroids:astPack[player.sy][player.sx],players:playerPack[player.sy][player.sx],bases:basePack[player.sy][player.sx]});
			//send(i, 'partialposUp', {cloaked: player.distance > 0, isLocked: player.isLocked, health:player.health;
			// trail
			// shield
			// empTimer
			// hasPackage
			// id: player.id
			// ship: ship
			// speed
			// maxHealth
			// color 
			// x 
			// y
			// name
			// health
			// angle
			// drift 

			// missing: cloaked, isLocked,planetTimer, sx, sy, charge:player.charge
			player.socket.emit('update', {cloaked: player.disguise > 0, isLocked: player.isLocked, planetTimer: player.planetTimer, charge: player.charge, energy: player.energy, state: gameState });
		}

		// Clear
	}
	for (var i in deads) {
		var player = deads[i];
		if (tick % 12 == 0) // LAG CONTROL
			player.socket.emit('online', { lag: lag });
	}
	for (var i in dockers) {
		var player = dockers[i];
		if (tick % 12 == 0) { // LAG CONTROL
			player.socket.emit('you', { trail:player.trail, killStreak: player.killStreak, killStreakTimer: player.killStreakTimer, name: player.name, t2: player.thrust2, va2: player.radar2, ag2: player.agility2, c2: player.capacity2, e2: player.energy2, mh2: player.maxHealth2, experience: player.experience, rank: player.rank, ship: player.ship, charge: player.charge, sx: player.sx, sy: player.sy, docked: player.docked, color: player.color, baseKills: player.baseKills, x: player.x, y: player.y, money: player.money, kills: player.kills, iron: player.iron, silver: player.silver, platinum: player.platinum, aluminium: player.aluminium });
			player.socket.emit('quests', { quests: teamQuests[player.color]});
		}
	}
	if (raidTimer-- % 4000 == 0) sendRaidData();
	if (raidTimer <= 0) endRaid();
	
	d = new Date();
	lag = d.getTime() - lagTimer;
	ops--;
}

setInterval(updateHeatmap, 700);
function updateHeatmap() {
	var hmap = [];
	var lb = [];
	for (var i = 0; i < mapSz; i++) {
		hmap[i] = [];
		for (var j = 0; j < mapSz; j++) hmap[i][j] = 0;
	}
	var j = 0;
	raidRed = raidBlue = raidGreen = playerCount = botCount = guestCount = 0;

	for (var x = 0; x < mapSz; x++) for (var y = 0; y < mapSz; y++) {
		for (var i in players[y][x]) {
			var p = players[y][x][i];
			if (p.color === "red") raidRed += p.points;
			else if (p.color === "blue") raidBlue += p.points;
			else if (p.color === "green") raidGreen += p.points;
			if (p.name !== "" && !p.isBot) {
				lb[j] = p;
				j++;
			}
			if(p.isBot) botCount++;
			else if(p.guest) botCount++;
			else playerCount++;
			hmap[p.sx][p.sy] += .1 + colorSelect(p.color, 1<<16, 1, 1<<8); // this is not supposed to be x-y order. TODO fix
		}
	}
	for (var i in dockers) {
		var p = dockers[i];
		if (p.color === "red") raidRed += p.points;
		else if (p.color === "blue") raidBlue += p.points;
		else if (p.color === "green") raidGreen += p.points;
		if(p.isBot) botCount++;
		else if(p.guest) botCount++;
		else playerCount++;
		lb[j] = p;
		j++;
	}
	for (var i in deads) {
		var p = deads[i];
		if (p.color === "red") raidRed += p.points;
		else if (p.color === "blue") raidBlue += p.points;
		else if (p.color === "green") raidGreen += p.points;
		if(p.isBot) botCount++;
		else if(p.guest) botCount++;
		else playerCount++;
		lb[j] = p;
		j++;
	}


	for (var i = 0; i < lb.length - 1; i++) // sort it
		for (var k = 0; k < lb.length - i - 1; k++) {
			if (lb[k + 1].experience > lb[k].experience) {
				var temp = lb[k + 1];
				lb[k + 1] = lb[k];
				lb[k] = temp;
			}
		}

	var lbSend = [];
	for (var i = 0; i < Math.min(16, j); i++) lbSend[i] = { name: lb[i].name, exp: Math.round(lb[i].experience), color: lb[i].color, rank: lb[i].rank };

	//Normalize colors as though they are vectors to length 255
	for (var i = 0; i < mapSz; i++) for (var j = 0; j < mapSz; j++) {
		var col = hmap[i][j];
		var r = Math.floor(col/0x10000)%0x100;
		var g = Math.floor(col/0x100)%0x100;
		var b = Math.floor(col)%0x100;
		var a = col-Math.floor(col);
		var length = Math.sqrt(r*r+g*g+b*b)+.01;
		r/=length;
		b/=length;
		g/=length;
		hmap[i][j]=Math.floor(r*256)*0x10000+Math.floor(g*256)*0x100+Math.floor(b*256)+a;
	}

	for (var i in lb) lb[i].socket.emit('heatmap', { hmap: hmap, lb: lbSend, youi: i, raidBlue: raidBlue, raidRed: raidRed, raidGreen: raidGreen});
}

saveTurrets();

function idleSocketCheck() {
	var time = Date.now();
	const timeout = 1000 * 60 * 5;

	for (var x in sockets) {
		var s = sockets[x];

		if (s.player === undefined && (time - s.start) >= timeout) {
			s.disconnect();
			delete sockets[x];
		}
	}

	setTimeout(idleSocketCheck, timeout);
}
//meta
setTimeout(initReboot, 86400 * 1000 - 6 * 60 * 1000);
setTimeout(idleSocketCheck, 1000 * 60 * 5);

function shutdown() {
	process.exit();
}

function broadcastInfo(){
	var randomMsgs = [
		"Never give anyone your password, for any reason!",
		"Support the game by buying a VIP pass in the store!",
		"Join the torn.space discord in the 'more' tab!",
		"If you find a bug, report it in the 'more' menu!",
		"Type /changeteam to switch teams!",
		"Mute bothersome players with /mute username"
	]
	chatAll("~`#ff0000~`SERVER: "+randomMsgs[broadcastMsg%randomMsgs.length]);
	broadcastMsg++
	setTimeout(broadcastInfo,20*60*1000);
}