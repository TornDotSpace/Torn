// The Torn.Space Server Entry Point

/** 
 * 			THIS FILE IS PART OF THE "Torn.Space" PROJECT 
 * 			Copyright (c) The Torn.Space Team 2018-2019
 * 						ALL RIGHTS RESERVED
 */

var fs = require('fs');
var logFileName = "logs/" + (new Date()) + ".log";

global.log = function (text) {
	console.log(text);
	fs.appendFile(logFileName, text+"\n", function (err) { if (err) throw err; });
}

global.initReboot = function () {
	log("\nInitializing server reboot...\n");
	chatAll("Server is restarting in 5 minutes. Please save your progress as soon as possible.");
	setTimeout(function () { chatAll("Server is restarting in 4 minutes. Please save your progress as soon as possible."); }, 1 * 60 * 1000);
	setTimeout(function () { chatAll("Server is restarting in 3 minutes. Please save your progress as soon as possible."); }, 2 * 60 * 1000);
	setTimeout(function () { chatAll("Server is restarting in 2 minutes. Please save your progress as soon as possible."); }, 3 * 60 * 1000);
	setTimeout(function () { chatAll("Server is restarting in 1 minute. Please save your progress as soon as possible."); }, 4 * 60 * 1000);
	setTimeout(function () { chatAll("Server is restarting in 30 seconds. Please save your progress as soon as possible."); }, (4 * 60 + 30) * 1000);
	setTimeout(function () { chatAll("Server is restarting in 10 seconds. Please save your progress as soon as possible."); }, (4 * 60 + 50) * 1000);
	setTimeout(function () { chatAll("Server restarting..."); }, (4 * 60 + 57) * 1000);
	setTimeout(shutdown, 5 * 60 * 1000);
}

global.saveTurrets = function () {

	//delete files
	var count = 0;
	var items = fs.readdirSync('server/turrets/');
	for (var i in items) {
		fs.unlinkSync('server/turrets/' + items[i]);
		count++;
	}
	chatAll(count + " Turrets Currently Saved");

	//save em
	setTimeout(function () {
		count = 0;
		chatAll("Saving Turrets...");
		for (var i = 0; i < mapSz; i++)
			for (var j = 0; j < mapSz; j++) {
				var base = bases[i][j];
				if (base != 0 && !base.isBase) {
					base.save();
					count++;
				}
			}
		chatAll(count + " Turrets Saved!");
	}, 1000);
}

// TODO: needs to be fixed for MongoDB
global.decayPlayers = function () {
	if (!enableDecay) return;
	sendAll("chat", { msg: "Decaying Players..." });
	log("\nDecaying players...")
	var items = fs.readdirSync('server/players/');


	sendAll("chat", { msg: "Files identified: " + items.length });
	for (var i = 0; i < items.length; i++) {
		var source = "server/players/" + items[i];
		if (fs.lstatSync(source).isDirectory()) continue;
		var data = fs.readFileSync(source, 'utf8');
		var split = data.split(":");
		if (split.length < 85) {
			if (split.length < 15) sendAll("chat", { msg: "File " + source + " unreadable. " + split.length + " entries." });
			else {
				var log = "Player " + split[14] + " failed to decay due to an unformatted save file with " + split.length + " entries. Cleaning file.";
				sendAll("chat", { msg: log });
				log("\n" + log + "\n");
				cleanFile(source);
			}
			continue;
		}
		data = "";
		var decayRate = (split[85] === "decay" ? .985 : .995);

		split[22] = decay(parseFloat(split[22]), decayRate);//xp
		split[15] = decay(parseFloat(split[15]), decayRate);//money
		//split[84] = decay(parseFloat(split[84]),decayRate);//energy
		//split[26] = decay(parseFloat(split[26]),decayRate);//thrust
		//split[27] = decay(parseFloat(split[27]),decayRate);//radar
		//split[28] = decay(parseFloat(split[28]),decayRate);//cargo
		//split[29] = decay(parseFloat(split[29]),decayRate);//hull

		split[23] = 0;
		split[85] = "decay"; //reset decaymachine
		while (split[22] > ranks[split[23]]) split[23]++;

		if (fs.existsSync("server/players/" + items[i])) fs.unlinkSync("server/players/" + items[i]);
		for (var j = 0; j < split.length; j++) data += split[j] + (j == split.length - 1 ? "" : ":");
		fs.writeFileSync(source, data, { "encoding": 'utf8' });
	}
}

// Load config 
var configEnvironment = (process.argv.length <= 3) ? "dev" : process.argv[3];
require('./server_src/config.js')(configEnvironment);
require('./server_src/netcode.js');
require('./server_src/math.js');

require('./server_src/db.js');
connectToDB();

var Base = require('./server_src/universe/base.js');
var Asteroid = require("./server_src/universe/asteroid.js");
var Planet = require("./server_src/universe/planet.js");
var Vortex = require("./server_src/universe/vortex.js");

var planetNames = fs.readFileSync("./server_src/resources/planetNames.txt").toString().split("\n");

var tickRate = 1000 / Config.getValue("server_tick_rate", 60);

global.createAsteroid = function () {
	var sx = Math.floor(Math.random() * mapSz);
	var sy = Math.floor(Math.random() * mapSz);
	var vert = (sy + 1) / (mapSz + 1);
	var hor = (sx + 1) / (mapSz + 1);
	var metal = (Math.random() < hor ? 1 : 0) + (Math.random() < vert ? 2 : 0);
	var randA = Math.random();
	var h = Math.ceil(Math.random() * 1200 + 200);
	var ast = Asteroid(randA, h, sx, sy, metal);
	asts[ast.sy][ast.sx][randA] = ast;
}

var jsn = JSON.parse(fs.readFileSync('client/weapons.json', 'utf8'));
global.wepns = jsn.weapons;
global.ships = jsn.ships;
global.planets = jsn.planets;


// bases                   (Red) / (Blue)
var baseMap = [0, 1,	//A2 / G6
	0, 4,	//A5 / G3
	2, 2,	//C3 / E5
	3, 0,	//D1 / D7
	5, 1];	//F2 / B6


//some global FINAL game mechanics
global.bulletWidth = 16; // collision radius
var mineLifetime = 3; // mines despawn after 3 minutes
global.baseHealth = 600; // max base health
global.baseKillExp = 50; // Exp reward for killing a base
global.baseKillMoney = 25000; // ditto but money
global.mapSz = 7; // How many sectors across the server is. If changed, see planetsClaimed
global.sectorWidth = 14336; // must be divisible by 2048.

//Machine Learning
global.trainingMode = false; // specifies whether this server is being used strictly to train neural network bots.
global.neuralFiles = 1500; // how many files should be in competition

global.botFrequency = trainingMode ? .7 : 1.6;//higher: more bots spawn. Standard: 1.6
global.playerHeal = .2; // player healing speed
global.baseHeal = 1; // base healing speed
global.guestsCantChat = !Config.getValue("want_guest_chat", true);
global.lbExp = new Array(1000); // Stores in memory where people stand on the global leaderboard.
global.ranks = [0, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 4000, 8000, 14000, 20000, 40000, 70000, 100000, 140000, 200000, 300000, 500000, 800000, 1000000, 1500000, 2000000, 3000000, 5000000, 8000000, 12000000, 16000000, 32000000, 64000000, 100000000]; // exp to rank conversion.


//administrative-y variables
global.tick = 0;
var lag = 0, ops = 0; // ticks elapsed since boot, lag, count of number of instances of update() running at once
var bp = 0, rp = 0, bg = 0, rg = 0, bb = 0, rb = 0; // blue/red players/guests/bots
global.raidTimer = 50000;
var raidRed = 0, raidBlue = 0; // Timer and points
global.IPSpam = {}; // Keeps track of ips flooding server.
global.bQuests = [];//A list of the 10 available quests for humans and aliens
global.rQuests = [];

var enableDecay = Config.getValue("want_decay", false); // Enable player decay algorithm




//Object lists. All of them are in Y-MAJOR ORDER.
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
	return io.to(i).player;
}

//Alex: I rewrote everything up to here thoroughly, and the rest not so thoroughly. 7/1/19

//TODO Merge these
function updateQuestsR() {
	var i = 0;
	for (i = 0; i < 10; i++) {
		if (rQuests[i] == 0) break;
		if (i == 9) return;
	}
	var r = Math.random();
	var r2 = Math.random();
	var metals = ["aluminium", "silver", "platinum", "iron"];
	var nm = 0;
	if (i < 4) {
		var dsxv = Math.floor(r2 * 100 % 1 * mapSz), dsyv = Math.floor(r2 * 1000 % 1 * mapSz);
		var sxv = Math.floor(r2 * mapSz), syv = Math.floor(r2 * 10 % 1 * mapSz);
		if (dsxv == sxv && dsyv == syv) return;
		nm = { type: "Delivery", metal: metals[Math.floor((r * 4 - 2.8) * 4)], exp: Math.floor(1 + Math.sqrt(square(sxv - dsxv) + square(syv - dsyv))) * 16000, sx: sxv, sy: syv, dsx: dsxv, dsy: dsyv };
	}
	else if (i < 7) nm = { type: "Mining", metal: metals[Math.floor(r * 4)], exp: 50000, amt: Math.floor(1200 + r * 400), sx: baseMap[Math.floor(r2 * 5) * 2], sy: baseMap[Math.floor(r2 * 5) * 2 + 1] };
	else if (i < 9) nm = { type: "Base", exp: 75000, sx: mapSz - 1 - baseMap[Math.floor(r2 * 5) * 2], sy: mapSz - 1 - baseMap[Math.floor(r2 * 5) * 2 + 1] };
	else nm = { type: "Secret", exp: 300000, sx: mapSz - 1 - baseMap[Math.floor(r2 * 5) * 2], sy: mapSz - 1 - baseMap[Math.floor(r2 * 5) * 2 + 1] };
	rQuests[i] = nm;
}
function updateQuestsB() {
	var i = 0;
	for (i = 0; i < 10; i++) {
		if (bQuests[i] == 0) break;
		if (i == 9) return;
	}
	var r = Math.random();
	var r2 = Math.random();
	var metals = ["aluminium", "silver", "platinum", "iron"];
	var nm = 0;
	if (i < 4) {
		var dsxv = Math.floor(r2 * 100 % 1 * mapSz), dsyv = Math.floor(r2 * 1000 % 1 * mapSz);
		var sxv = Math.floor(r2 * mapSz), syv = Math.floor(r2 * 10 % 1 * mapSz);
		if (dsxv == sxv && dsyv == syv) return;
		nm = { type: "Delivery", metal: metals[Math.floor((r * 4 - 2.8) * 4)], exp: Math.floor(1 + Math.sqrt((sxv - dsxv) * (sxv - dsxv) + (syv - dsyv) * (syv - dsyv))) * 16000, sx: sxv, sy: syv, dsx: dsxv, dsy: dsyv };
	} else if (i < 7) nm = { type: "Mining", metal: metals[Math.floor(r * 4)], exp: 50000, amt: Math.floor(1200 + r * 400), sx: mapSz - 1 - baseMap[Math.floor(r2 * 5) * 2], sy: mapSz - 1 - baseMap[Math.floor(r2 * 5) * 2 + 1] };
	else if (i < 9) nm = { type: "Base", exp: 75000, sx: baseMap[Math.floor(r2 * 5) * 2], sy: baseMap[Math.floor(r2 * 5) * 2 + 1] };
	else nm = { type: "Secret", exp: 300000, sx: baseMap[Math.floor(r2 * 5) * 2], sy: baseMap[Math.floor(r2 * 5) * 2 + 1] };
	bQuests[i] = nm;
}



global.sectors = new Array(mapSz);

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
	log("[SERVER] Caught termination signal...");

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

	log("[SERVER] Uncaught exception detected, kicking out players and terminating shard.");

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

	process.stderr.write("==== TORN.SPACE CRASH REPORT ====\n");
	process.stderr.write("Crash Time: " + new Date() + "\n");
	process.stderr.write("Players online: " + plyrs + "\n");
	process.stderr.write("Exception information: " + "\n");
	process.stderr.write("Trace: " + err.stack + "\n");

	// Exit with status code 3 to indicate uncaught exception
	setTimeout(function() { process.exit(3); }, 4000);
}
function init() { // start the server!
	// Activate uncaught exception handler
	process.on('uncaughtException', onCrash);

	// Add signal handlers
	process.on('SIGINT', sigHandle);
	process.on('SIGTERM', sigHandle);

	log("************************************************************************************************************************");
	log(" ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄        ▄     ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄ ");
	log("▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░▌      ▐░▌   ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌");
	log(" ▀▀▀▀█░█▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌▐░▌░▌     ▐░▌   ▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀▀▀ ");
	log("     ▐░▌     ▐░▌       ▐░▌▐░▌       ▐░▌▐░▌▐░▌    ▐░▌   ▐░▌          ▐░▌       ▐░▌▐░▌       ▐░▌▐░▌          ▐░▌          ");
	log("     ▐░▌     ▐░▌       ▐░▌▐░█▄▄▄▄▄▄▄█░▌▐░▌ ▐░▌   ▐░▌   ▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄█░▌▐░▌          ▐░█▄▄▄▄▄▄▄▄▄ ");
	log("     ▐░▌     ▐░▌       ▐░▌▐░░░░░░░░░░░▌▐░▌  ▐░▌  ▐░▌   ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░▌          ▐░░░░░░░░░░░▌");
	log("     ▐░▌     ▐░▌       ▐░▌▐░█▀▀▀▀█░█▀▀ ▐░▌   ▐░▌ ▐░▌    ▀▀▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌▐░▌          ▐░█▀▀▀▀▀▀▀▀▀ ");
	log("     ▐░▌     ▐░▌       ▐░▌▐░▌     ▐░▌  ▐░▌    ▐░▌▐░▌             ▐░▌▐░▌          ▐░▌       ▐░▌▐░▌          ▐░▌          ");
	log("     ▐░▌     ▐░█▄▄▄▄▄▄▄█░▌▐░▌      ▐░▌ ▐░▌     ▐░▐░▌ ▄  ▄▄▄▄▄▄▄▄▄█░▌▐░▌          ▐░▌       ▐░▌▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄▄▄ ");
	log("     ▐░▌     ▐░░░░░░░░░░░▌▐░▌       ▐░▌▐░▌      ▐░░▌▐░▌▐░░░░░░░░░░░▌▐░▌          ▐░▌       ▐░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌");
	log("      ▀       ▀▀▀▀▀▀▀▀▀▀▀  ▀         ▀  ▀        ▀▀  ▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀            ▀         ▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀ ");
	log("                                                                                                                        ");
	log("************************************************************************************************************************");
	// create folders for players, neural nets, and turrets if they dont exist
	buildFileSystem();

	//initialize lists of quests
	for (var i = 0; i < 10; i++) {
		bQuests[i] = 0;
		rQuests[i] = 0;
	}

	spawnBases();

	//make asteroids. Make 10 times the number of sectors.
	for (var i = 0; i < mapSz * mapSz * 10; i++) createAsteroid();

	//Make exactly one planet in each sector.
	for (var s = 0; s < mapSz * mapSz; s++) {
		var x = s % mapSz;
		var y = Math.floor(s / mapSz);
		createPlanet(planetNames[s], x, y);
	}
	for (var i = 0; i < mapSz; i++)
		sectors[i] = new Array(mapSz);
	for (var i = 0; i < baseMap.length; i += 2) {
		sectors[baseMap[i]][baseMap[i + 1]] = 1;
		sectors[mapSz - 1 - baseMap[i]][mapSz - 1 - baseMap[i + 1]] = 2;
	}

	//wormhole
	var id = Math.random();
	var v = new Vortex(id, Math.random() * sectorWidth, Math.random() * sectorWidth, Math.floor(Math.random() * mapSz), Math.floor(Math.random() * mapSz), .5, 0, true);
	vorts[v.sy][v.sx][id] = v;

	//Black Hole in D4
	id = Math.random();
	v = new Vortex(id, sectorWidth / 2, sectorWidth / 2, 3, 3, .15, 0, false);
	vorts[v.sy][v.sx][id] = v;

	//load existing turrets
	loadTurrets();

	//start ticking

	setTimeout(update, tickRate);
	setTimeout(updateLB, 60000);

	var netcode = require('./server_src/netcode.js');
	netcode();

	log("Server initialized successfully. Game log below.\n");
}

function buildFileSystem() { // create the server files/folders
	log("\nCreating any potential missing files and folders needed for the server...");
	var allGood = true;

	var dirs = ['./server', './server/neuralnets', './server/players', './server/turrets', './server/players/dead', './client/leaderboard'];
	for(var i in dirs){
		var dir = dirs[i];
		if (!fs.existsSync(dir)) {
			log("Creating " + dir + " directory...");
			fs.mkdirSync(dir);
			allGood = false;
		}
	}

	if (allGood) log("All server directories were already present!");

	fs.writeFileSync("client/leaderboard/index.html", "Leaderboard not ready yet...", (err) => {
		if (err) log(err); log("Created leaderboard file.");
	});
}
function spawnBases() {
	log("\nSpawning " + (baseMap.length / 2) + " Bases...");
	//spawn bases
	for (var i = 0; i < baseMap.length; i += 2) {
		//make a red base at these coords
		var randBase = Math.random();
		var redBase = Base(randBase, true, baseMap[i], baseMap[i + 1], 'red', sectorWidth / 2, sectorWidth / 2);
		bases[baseMap[i + 1]][baseMap[i]] = redBase;

		//mirror coordinates and make a blue base
		randBase = Math.random();
		var blueBase = Base(randBase, true, mapSz - 1 - baseMap[i], mapSz - 1 - baseMap[i + 1], 'blue', sectorWidth / 2, sectorWidth / 2);
		bases[mapSz - 1 - baseMap[i + 1]][mapSz - 1 - baseMap[i]] = blueBase;
	}
}
function loadTurrets() {
	var count = 0;
	log("\nLoading Turrets...");
	var items = fs.readdirSync('server/turrets/');

	for (var i in items) {
		count++;
		log("Turret found: " + items[i]);
		var data = fs.readFileSync("server/turrets/" + items[i], 'utf8').split(":");
		var id = parseFloat(data[3]);
		var b = new Base(id, false, parseFloat(data[8]), parseFloat(data[9]), data[4], parseFloat(data[6]), parseFloat(data[7]));
		b.name = data[10];
		b.kills = parseFloat(data[0]);
		b.experience = parseFloat(data[1]);
		b.money = parseFloat(data[2]);
		b.owner = data[5];
		bases[parseFloat(data[9])][parseFloat(data[8])] = b;
	}

	log(count + " turret(s) loaded.\n");
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
	if (raidRed > raidBlue) winners = "red";
	else if (raidBlue > raidRed) winners = "blue";
	raidTimer = 360000;

	for (var y in players) {
		for (var x in players[y]) {
			for (var i in players[y][x]) {
				var p = players[y][x][i];
				if (p === undefined || p.color !== winners) continue;
				p.spoils("money", p.points * 40000);
				p.points = 0;
			}
		}
	}
	sendRaidData();
}

function update() {
	ops++;
	if (ops < 2) setTimeout(update, tickRate);
	tick++;
	if (Math.random() < 0.0001) IPSpam[Math.floor(Math.random())] = 0;
	var d = new Date();
	var lagTimer = d.getTime();
	updateQuestsR();
	updateQuestsB();

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
			if (player.disguise > 0) continue;

			// Check for creation
			if (pack === undefined) {
				// Store pack for joining clients & delta calculation
				pack = playerPack[y][x][i] = { trail: player.trail, shield: player.shield, empTimer: player.empTimer, hasPackage: player.hasPackage, id: player.id, ship: player.ship, speed: player.speed, maxHealth: player.maxHealth, color: player.color, x: player.x, y: player.y, name: player.name, health: player.health, angle: player.angle, driftAngle: player.driftAngle };
				// Send create 
				sendAllSector("player_create", pack, x, y);

				// Send full update to the player
				if (!player.isBot) 
					send(i, 'posUp', {cloaked: player.disguise > 0, isLocked: player.isLocked, health:player.health, shield:player.shield, planetTimer: player.planetTimer, energy:player.energy, sx: player.sx, sy: player.sy,charge:player.charge,x:player.x,y:player.y, angle:player.angle, speed: player.speed,packs:packPack[player.sy][player.sx],vorts:vortPack[player.sy][player.sx],mines:minePack[player.sy][player.sx],missiles:missilePack[player.sy][player.sx],orbs:orbPack[player.sy][player.sx],blasts:blastPack[player.sy][player.sx],beams:beamPack[player.sy][player.sx],planets:planetPack[player.sy][player.sx], asteroids:astPack[player.sy][player.sx],players:playerPack[player.sy][player.sx],bases:basePack[player.sy][player.sx]});
				continue;
			}

			var delta = { };
			var need_update = false;

			// Compute delta
			for (var key in pack) {
				if (pack[key] !== player[key]) {
					delta[key] = pack[key] = player[key];
					need_update = true;
				}
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

		var rbNow = rb;//important to calculate here, otherwise bots weighted on left.
		var bbNow = bb;

		var base = bases[y][x];

		if (base !== 0) {
			var pack = basePack[y][x];

			base.tick(rbNow, bbNow);

			// Check for creation (only happens once, on first tick, or when a turret is placd)
			if (pack === undefined) {
				pack = basePack[y][x] = { id: base.id, turretLive: base.turretLive, isBase: base.isBase, maxHealth: base.maxHealth, health: base.health, color: base.color, x: base.x, y: base.y, angle: base.angle, spinAngle: base.spinAngle, name: base.name };
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
				send(i, 'online', { lag: lag, bp: bp, rp: rp, bg: bg, rg: rg, bb: bb, rb: rb });
				send(i, 'you', { killStreak: player.killStreak, killStreakTimer: player.killStreakTimer, name: player.name, points: player.points, va2: player.radar2, experience: player.experience, rank: player.rank, ship: player.ship, docked: player.docked, color: player.color, money: player.money, kills: player.kills, baseKills: player.baseKills, iron: player.iron, silver: player.silver, platinum: player.platinum, aluminium: player.aluminium });
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
			send(i, 'update', {cloaked: player.disguise > 0, isLocked: player.isLocked, planetTimer: player.planetTimer, sx: x, sy: y, charge: player.charge, energy: player.energy, state: gameState });
		}

		// Clear
	}
	for (var i in deads) {
		var player = deads[i];
		if (tick % 12 == 0) // LAG CONTROL
			send(i, 'online', { lag: lag, bb: bb, rb: rb, bp: bp, rp: rp, rg: rg, bg: bg });
	}
	for (var i in dockers) {
		var player = dockers[i];
		if (tick % 12 == 0) { // LAG CONTROL
			send(i, 'you', { killStreak: player.killStreak, killStreakTimer: player.killStreakTimer, name: player.name, t2: player.thrust2, va2: player.radar2, ag2: player.agility2, c2: player.capacity2, e2: player.energy2, mh2: player.maxHealth2, experience: player.experience, rank: player.rank, ship: player.ship, charge: player.charge, sx: player.sx, sy: player.sy, docked: player.docked, color: player.color, baseKills: player.baseKills, x: player.x, y: player.y, money: player.money, kills: player.kills, iron: player.iron, silver: player.silver, platinum: player.platinum, aluminium: player.aluminium });
			send(i, 'quests', { quests: player.color == 'red' ? rQuests : bQuests });
		}
	}
	if (raidTimer-- % 4000 == 0) sendRaidData();
	if (raidTimer <= 0) endRaid();
	deletePlayers();
	d = new Date();
	lag = d.getTime() - lagTimer;
	ops--;
}
function deletePlayers() { // remove players that have left or are afk or whatever else
	for (var i in lefts) {
		if (lefts[i]-- > 1) continue;
		for (var x = 0; x < mapSz; x++) for (var y = 0; y < mapSz; y++) if(i in players[y][x]) delete players[y][x][i];
		if(i in dockers) delete dockers[i];
		if(i in deads) delete deads[i];
		delete lefts[i];
	}
}
setInterval(updateHeatmap, 1000);
function updateHeatmap() {
	var hmap = [];
	var lb = [];
	for (var i = 0; i < mapSz; i++) {
		hmap[i] = [];
		for (var j = 0; j < mapSz; j++) hmap[i][j] = 0;
	}
	var j = 0;
	rb = rg = rp = bp = bg = bb = raidRed = raidBlue = 0;

	for (var x = 0; x < mapSz; x++) for (var y = 0; y < mapSz; y++) {
		for (var i in players[y][x]) {
			var p = players[y][x][i];
			if (p.color === "red") {
				raidRed += p.points;
				if (p.isBot) rb++;
				else if (p.guest) rg++;
				else rp++;
			} else {
				raidBlue += p.points;
				if (p.isBot) bb++;
				else if (p.guest) bg++;
				else bp++;
			}
			if (p.name !== "" && !p.isBot) {
				lb[j] = p;
				j++;
			}
			hmap[p.sx][p.sy] += p.color === 'blue' ? -1 : 1; // this is supposed to be x-y order. TODO fix
		}
	}
	for (var i in dockers) {
		var p = dockers[i];
		if (p.color === "red") {
			raidRed += p.points;
			if (p.isBot) rb++;
			else if (p.guest) rg++;
			else rp++;
		} else {
			raidBlue += p.points;
			if (p.isBot) bb++;
			else if (p.guest) bg++;
			else bp++;
		}
		lb[j] = p;
		j++;
	}
	for (var i in deads) {
		var p = deads[i];
		if (p.color === "red") {
			raidRed += p.points;
			if (p.isBot) rb++;
			else if (p.guest) rg++;
			else rp++;
		} else {
			raidBlue += p.points;
			if (p.isBot) bb++;
			else if (p.guest) bg++;
			else bp++;
		}
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
	for (var i = 0; i < mapSz; i++) for (var j = 0; j < mapSz; j++) {
		/*if(asts[i][j] >= 15) hmap[i][j] += 1500;
		else */hmap[i][j] += 500;
	}

	for (var i in lb) send(lb[i].id, 'heatmap', { hmap: hmap, lb: lbSend, youi: i, raidBlue: raidBlue, raidRed: raidRed });
}
function updateLB() {
	// TODO: Needs to be fixed for MongoDB
	chatAll("Updating torn.space/leaderboard...\n");
	log("\nUpdating torn.space/leaderboard...");
	fs.readdir('server/players/', function (err, items) {
		var top1000names = [];
		var top1000kills = [];
		var top1000colors = [];
		var top1000exp = [];
		var top1000rank = [];
		var top1000money = [];
		var top1000tech = [];
		for (var i = 0; i < 1000; i++) {
			top1000names[i] = "Nobody!";
			top1000kills[i] = -1;
			top1000exp[i] = -1;
			top1000rank[i] = -1;
			top1000colors[i] = "yellow";
			top1000money[i] = -1;
			top1000tech[i] = -1;
		}
		for (var i = 0; i < items.length; i++) {//insertion sort cause lazy
			if (fs.lstatSync("server/players/" + items[i]).isDirectory()) continue;
			var data = fs.readFileSync("server/players/" + items[i], 'utf8').split(":");
			var exp = Math.round(parseFloat(data[22]));
			if (exp > top1000exp[999]) {
				var name = data[14];
				var kills = parseFloat(data[16]);
				var rank = parseFloat(data[23]);
				var money = parseFloat(data[15]);
				var tech = Math.floor((parseFloat(data[26]) + parseFloat(data[27]) + parseFloat(data[28]) + parseFloat(data[29]) + parseFloat(data[84]))*2)/10;
				var color = data[0] === "red" ? "pink" : "cyan";
				for (var j = 999; j >= 1; j--) {
					if (exp > top1000exp[j - 1]) {
						top1000kills[j] = top1000kills[j - 1];
						top1000rank[j] = top1000rank[j - 1];
						top1000exp[j] = top1000exp[j - 1];
						top1000names[j] = top1000names[j - 1];
						top1000colors[j] = top1000colors[j - 1];
						top1000money[j] = top1000money[j - 1];
						top1000tech[j] = top1000tech[j - 1];
						top1000kills[j - 1] = kills;
						top1000rank[j - 1] = rank;
						top1000names[j - 1] = name;
						top1000colors[j - 1] = color;
						top1000exp[j - 1] = exp;
						top1000money[j - 1] = money;
						top1000tech[j - 1] = tech;
					}
					else break;
				}
			}
		}
		var source = 'client/leaderboard/index.html';
		if (fs.existsSync(source))
			fs.unlinkSync(source);
		var newFile = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml" dir="ltr" lang="en"><head>' +
			'<title>Leaderboard</title><link rel="stylesheet" href="../page.css" /></head>' +
			'<body><br><br><h1><div style="padding: 20px"><center><font color="#0099ff">Leaderboard' +
			'</font></center></div></h1>' +
			'<font color="#0099ff"><center><nobr><table><tr><th>#</th><th>Name</th><th>Exp</th><th>Rank</th><th>Kills</th><th>Money</th><th>Tech</th></tr>';
		for (var i = 0; i < 1000; i++) {
			newFile += '<tr style="color:' + top1000colors[i] + ';"><td>' + (i + 1) + ".</td><td>" + top1000names[i] + "</td><td> " + top1000exp[i] + " </td><td>" + top1000rank[i] + "</td><td>" + top1000kills[i] + "</td><td>" + (top1000money[i]>10000000?Math.floor(top1000money[i]/1000000+.5)+"M":(Math.floor(top1000money[i]/1000+.5)+"K")) + "</td><td>" + top1000tech[i] + "</td></tr>";
			lbExp[i] = top1000exp[i];
		}
		newFile += '</table></nobr><br/>Updates every 25 minutes Last updated: ' + new Date() + '</center></font></body></html>';
		fs.writeFileSync(source, newFile, { "encoding": 'utf8' });
	});
	saveTurrets();
	setTimeout(updateLB, 1000 * 25 * 60);
}



//meta
setTimeout(initReboot, 86400 * 1000 - 6 * 60 * 1000);
function shutdown() {
	saveTurrets();
	decayPlayers();
	process.exit();
}

function cleanFile(x) {
	var data = fs.readFileSync(x, 'utf8');
	var split = data.split(":");
	if (fs.existsSync(x)) fs.unlinkSync(x);
	data = "";
	for (var j = 0; j < 85; j++) data += split[j] + (j == 84 ? "" : ":");
	fs.writeFileSync(x, data, { "encoding": 'utf8' });
}
var decay = function (x, decayRate) {
	if (x < 1) return 1;
	return (x - 1) * decayRate + 1;
}
var undecay = function (x, decayRate) {
	if (x < 1) return 1;
	return (x - 1) / decayRate + 1;
}
