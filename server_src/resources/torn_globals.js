// Load config 
let configEnvironment = (process.argv.length <= 3) ? "dev" : process.argv[3];
require('../config.js')(configEnvironment);
let fs = require('fs');

global.serverInitialized = false;
global.tickRate = 1000 / Config.getValue("server_tick_rate", 60);
//some global FINAL game mechanics
global.bulletWidth = 16; // collision radius
global.mineLifetime = 3 * tickRate * 60; // mines despawn after this many minutes (3)
global.botDespawnRate = 0.0005; // Probability a bot with no nearby enemies despawns each tick
global.baseHealth = 4000; // max base health
global.baseKillExp = 20000; // Exp reward for killing a base
global.baseKillMoney = 250000; // ditto but money
global.baseRegenSpeed = 3; // How many times faster bases regenerate health than players
global.baseClaimRange = 1000; // How far you must be from a base (times ten) to get rewards
global.mapSz = 9; // How many sectors across the server is. If changed, see planetsClaimed
global.sectorWidth = 14336; // must be divisible by 2048.
global.moneyPerRaidPoint = 300000;
global.playerLimit = 130; // A soft limit on the max number of players+bots+guests online. When reached, bots do not spawn as much
global.playerKillMoney = 2500;
global.playerKillExpFraction = .04; // The amount of xp you steal from someone you kill
global.playerKillMoneyFraction = .01; // The amount of money you steal from someone you kill
global.minSectorAsteroidCount = 8;
global.missileLockTimeout = 7 * tickRate; // if locked for >7s, die

//Machine Learning
global.trainingMode = false; // specifies whether this server is being used strictly to train neural network bots.
global.neuralFiles = 1500; // how many files should be in competition


//administrative-y variables
global.botFrequency = trainingMode ? .0014 : .003;//higher: more bots spawn.
global.playerHeal = .2; // player healing speed
global.baseHeal = 1; // base healing speed
global.guestsCantChat = !Config.getValue("want_guest_chat", true);
global.ranks = [0, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 4000, 8000, 14000, 20000, 40000, 70000, 100000, 140000, 200000, 300000, 500000, 800000, 1000000, 1500000, 2000000, 3000000, 5000000, 8000000, 12000000, 16000000, 32000000, 64000000, 100000000, 200000000, 400000000, 1000000000]; // exp to rank conversion.
global.afkTimerConst = 15 * tickRate * 60; // 15 minutes till we kick players for being afk

global.tick = 0;
global.playerCount = 0;
global.botCount = 0;
global.guestCount = 0; // blue/red players/guests/bots
global.raidTimer = 50000;
global.teamQuests = {"blue":[], "red":[], "green":[]};//A list of the 10 available quests for humans and aliens

//Object lists. All of them are in Y-MAJOR ORDER.
global.guildPlayers = {};
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

let jsn = JSON.parse(fs.readFileSync('client/weapons.json', 'utf8'));
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

for (let i = 0; i < mapSz; i++) { // it's 2d
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
	for (let j = 0; j < mapSz; j++) { // it's 2d
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