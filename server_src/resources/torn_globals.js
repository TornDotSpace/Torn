/*
Copyright (C) 2021  torn.space (https://torn.space)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// Load config
const configEnvironment = (process.argv.length <= 3) ? `dev` : process.argv[3];
require(`../config.js`)(configEnvironment);
const fs = require(`fs`);

global.serverInitialized = false;
global.tickRate = 1000 / Config.getValue(`server_tick_rate`, 60);
global.colorCircumfix = `\`c`;
global.weaponCircumfix = `\`w`;
global.translateCircumfix = `\`t`;

// some global FINAL game mechanics
global.eloVolatility = 30;
global.bulletWidth = 16; // collision radius
global.mineLifetime = 3 * tickRate * 60; // mines despawn after this many minutes (3)
global.botDespawnRate = 0.0005; // Probability a bot with no nearby enemies despawns each tick
global.baseHealth = 3000; // max base health
global.baseKillExp = 5000; // Exp reward for killing a base
global.baseKillMoney = 250000; // ditto but money
global.baseRegenSpeed = 3; // How many times faster bases regenerate health than players
global.baseClaimRange = 1000; // How far you must be from a base (times ten) to get rewards
global.mapSz = 7; // How many sectors across the server is. If changed, see planetsClaimed
global.sectorWidth = 14336; // must be divisible by 2048.
global.moneyPerRaidPoint = 300000;
global.playerLimit = 130; // A soft limit on the max number of players+bots+guests online. When reached, bots do not spawn as much
global.playerKillMoney = 2500;
global.playerKillExpFraction = 0.04; // The amount of xp you steal from someone you kill
global.playerKillMoneyFraction = 0.01; // The amount of money you steal from someone you kill
global.minSectorAsteroidCount = 8;
global.missileLockTimeout = 7 * tickRate; // if locked for >7s, die

// achievements
global.killAchievementsAmount = 10;
global.moneyAchievementsAmount = 5;
global.driftAchievementsAmount = 5;
global.randomAchievementsAmount = 5;

// Machine Learning
global.trainingMode = false; // specifies whether this server is being used strictly to train neural network bots.
global.neuralFiles = 1500; // how many files should be in competition

// administrative-y variables
global.botFrequency = trainingMode ? 0.0014 : 0.003;// higher: more bots spawn.
global.playerHeal = 0.2; // player healing speed
global.baseHeal = 1; // base healing speed
global.guestsCantChat = !Config.getValue(`want_guest_chat`, true);
global.ranks = [0, 5, 12, 25, 50, 100, 150, 250, 400, 800, 1200, 1800, 2500, 4000, 6000, 9000, 12000, 15000, 20000, 30000, 50000, 80000, 100000, 150000, 200000, 300000, 500000, 800000, 1200000, 1600000, 3200000, 6400000, 10000000, 20000000, 40000000, 100000000]; // exp to rank conversion.
global.afkTimerConst = 15 * tickRate * 60; // 15 minutes till we kick players for being afk

global.tick = 0;
global.playerCount = 0;
global.botCount = 0;
global.guestCount = 0; // blue/red players/guests/bots
global.raidTimer = 50000;
global.teamQuests = { blue: [], red: [], green: [] };// A list of the 10 available quests for humans and aliens

// Object lists. All of them are in Y-MAJOR ORDER.
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

const jsn = JSON.parse(fs.readFileSync(`client/weapons.json`, `utf8`));
global.eng = JSON.parse(fs.readFileSync(`client/english.json`, `utf8`));
global.wepns = jsn.weapons;
global.ships = jsn.ships;
global.planetNames = jsn.planets;

// bases
global.basesPerTeam = 4;
global.baseMap = {
    red: [ // x, y
        1, 0,
        3, 0,
        2, 2,
        5, 1
    ],
    blue: [
        4, 2,
        6, 2,
        5, 4,
        4, 6
    ],
    green: [
        1, 3,
        0, 5,
        2, 6,
        3, 4
    ]
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
