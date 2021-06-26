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
// The Torn.Space Server Entry Point
require(`./server_src/resources/torn_globals.js`);

global.initReboot = function () {
    console.log(`\nInitializing server reboot...\n`);
    chatAll(`${chatColor(`red`)}Server restarting in 120 seconds. Save your progress!`);
    setTimeout(() => {
        chatAll(`${chatColor(`red`)}Server restarting in 90 seconds. Save your progress!`);
    }, 30 * 1000);
    setTimeout(() => {
        chatAll(`${chatColor(`red`)}Server restarting in 60 seconds. Save your progress!`);
    }, 60 * 1000);
    setTimeout(() => {
        chatAll(`${chatColor(`red`)}Server restarting in 30 seconds. Save your progress!`);
    }, 90 * 1000);
    setTimeout(() => {
        chatAll(`${chatColor(`red`)}Server restarting in 10 seconds. Save your progress!`);
    }, 110 * 1000);
    setTimeout(() => {
        chatAll(`${chatColor(`red`)}Server restarting in 5...`);
    }, 115 * 1000);
    setTimeout(() => {
        chatAll(`${chatColor(`red`)}Server restarting in 4...`);
    }, 116 * 1000);
    setTimeout(() => {
        chatAll(`${chatColor(`red`)}Server restarting in 3...`);
    }, 117 * 1000);
    setTimeout(() => {
        chatAll(`${chatColor(`red`)}Server restarting in 2...`);
    }, 118 * 1000);
    setTimeout(() => {
        chatAll(`${chatColor(`red`)}Server restarting in 1...`);
    }, 119 * 1000);
    setTimeout(shutdown, 120 * 1000);
};

global.initFastReboot = function () {
    console.log(`\nInitializing fast server reboot...\n`);
    chatAll(`${chatColor(`red`)}Server restarting in 10 seconds. Save your progress!`);
    setTimeout(() => {
        chatAll(`${chatColor(`red`)}Server restarting in 5...`);
    }, 5 * 1000);
    setTimeout(() => {
        chatAll(`${chatColor(`red`)}Server restarting in 4...`);
    }, 6 * 1000);
    setTimeout(() => {
        chatAll(`${chatColor(`red`)}Server restarting in 3...`);
    }, 7 * 1000);
    setTimeout(() => {
        chatAll(`${chatColor(`red`)}Server restarting in 2...`);
    }, 8 * 1000);
    setTimeout(() => {
        chatAll(`${chatColor(`red`)}Server restarting in 1...`);
    }, 9 * 1000);
    setTimeout(shutdown, 10 * 1000);
};

global.saveTurrets = function () {
    // save em
    for (let i = 0; i < mapSz; i++) {
        for (let j = 0; j < mapSz; j++) {
            const base = bases[i][j];
            if (base != 0 && (base.baseType == TURRET || base.baseType == SENTRY)) {
                base.save();
            }
        }
    }
};

require(`./server_src/netcode.js`)();
const fs = require(`fs`);
// Activate uncaught exception handler
process.on(`uncaughtException`, onCrash);

// Activate unhandledRejection handler
process.on(`unhandledRejection`, (err) => {
    console.log(`[SERVER] Unhandled promise rejection - this is a bug!`);

    const crashReport = `==== TORN.SPACE ERROR REPORT ====\nUnhandled promise rejection\n\nTime: ${new Date()}\nStack Trace: ${err.stack}`;
    if (Config.getValue(`debug`, true)) {
        console.error(crashReport);
    } else {
        send_rpc(`/crash/`, crashReport);
    }
});

buildFileSystem(); // create folders for players, neural nets, and turrets if they dont exist

function onCrash (err) {
    onCrash = function () { };

    console.log(`[SERVER] Uncaught exception detected, kicking out players and terminating shard.`);

    let plyrs = ``;

    for (const y in players) {
        for (const x in players[y]) {
            for (const id in players[y][x]) {
                // Save & kick out
                const player = players[y][x][id];
                if (player.isBot) continue;
                player.save();
                player.kick(`The server you are playing on has encountered a problem and needs to reset. You should be able to log back into the game and start exploring the universe almost immediately. :(`);
                plyrs = `${plyrs + player.name}, `;
            }
        }
    }

    saveTurrets();

    const crashReport = `==== TORN.SPACE CRASH REPORT ====\nCrash Time: ${new Date()}\nPlayers Online: ${plyrs}\nStack Trace: ${err.stack}`;
    if (Config.getValue(`debug`, true)) {
        console.error(crashReport);
    } else {
        send_rpc(`/crash/`, crashReport).finally(setTimeout(() => {
            process.exit(3);
        }, 4000));
    }
}

console.log(`************************************************************************************************************************`);
console.log(` ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄        ▄     ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄ `);
console.log(`▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░▌      ▐░▌   ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌`);
console.log(` ▀▀▀▀█░█▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌▐░▌░▌     ▐░▌   ▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀▀▀ `);
console.log(`     ▐░▌     ▐░▌       ▐░▌▐░▌       ▐░▌▐░▌▐░▌    ▐░▌   ▐░▌          ▐░▌       ▐░▌▐░▌       ▐░▌▐░▌          ▐░▌          `);
console.log(`     ▐░▌     ▐░▌       ▐░▌▐░█▄▄▄▄▄▄▄█░▌▐░▌ ▐░▌   ▐░▌   ▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄█░▌▐░▌          ▐░█▄▄▄▄▄▄▄▄▄ `);
console.log(`     ▐░▌     ▐░▌       ▐░▌▐░░░░░░░░░░░▌▐░▌  ▐░▌  ▐░▌   ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░▌          ▐░░░░░░░░░░░▌`);
console.log(`     ▐░▌     ▐░▌       ▐░▌▐░█▀▀▀▀█░█▀▀ ▐░▌   ▐░▌ ▐░▌    ▀▀▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌▐░▌          ▐░█▀▀▀▀▀▀▀▀▀ `);
console.log(`     ▐░▌     ▐░▌       ▐░▌▐░▌     ▐░▌  ▐░▌    ▐░▌▐░▌             ▐░▌▐░▌          ▐░▌       ▐░▌▐░▌          ▐░▌          `);
console.log(`     ▐░▌     ▐░█▄▄▄▄▄▄▄█░▌▐░▌      ▐░▌ ▐░▌     ▐░▐░▌ ▄  ▄▄▄▄▄▄▄▄▄█░▌▐░▌          ▐░▌       ▐░▌▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄▄▄ `);
console.log(`     ▐░▌     ▐░░░░░░░░░░░▌▐░▌       ▐░▌▐░▌      ▐░░▌▐░▌▐░░░░░░░░░░░▌▐░▌          ▐░▌       ▐░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌`);
console.log(`      ▀       ▀▀▀▀▀▀▀▀▀▀▀  ▀         ▀  ▀        ▀▀  ▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀            ▀         ▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀ `);
console.log(`                                                                                                                        `);
console.log(`***************************f*********************************************************************************************`);

console.log(`This software is free software, licensed under the terms of the AGPL v3. For more information, please see LICENSE.txt`);
console.log(`Source available at: https://github.com/TornDotSpace/Torn`);

if (!Config.getValue(`debug`, `false`)) {
    const d = new Date();
    const start = new Date(d.getFullYear(), 0, 0);
    const diff = d - start;
    const oneDay = 1000 * 60 * 60 * 24;
    let day = Math.floor(diff / oneDay);
    day += 1000;
    const stdoutFileName = `logs/${day}${d}.log`;
    const stderrFilename = `error_logs/${day}${d}.log`;
    global.console = new console.Console(fs.createWriteStream(stdoutFileName), fs.createWriteStream(stderrFilename));
}

global.readMuteTable = function () {
    const source = `server/permamute`;
    const data = fs.readFileSync(source, `utf8`);
    const split = data.split(`:`);
    for (let i = 0; i < split.length; i++) {
        muteTable[split[i]] = 10000000000000;
    }
    console.log(muteTable);
};

global.guildList = {};

global.readGuildList = function () {
    const source = `server/guildnames`;
    const data = fs.readFileSync(source, `utf8`);
    const split = data.split(`\n`);
    for (let i = 0; i < split.length - 1; i++) { // minus 1 because an extra \n is at the end of the file.
        const splitGuild = split[i].split(`:`);
        guildList[splitGuild[0]] = { owner: splitGuild[1], public: splitGuild[2], invite: `AdminInviteKey` };
    }
};

global.writeGuildList = function () {
    const source = `server/guildnames`;
    writeStr = ``;
    for (const i in guildList) {
        const guildData = guildList[i];
        writeStr += `${i}:${guildData.owner}:${guildData.public}\n`;
    }
    fs.writeFileSync(source, writeStr);
};

require(`./server_src/math.js`);
if (Config.getValue(`enable_discord_moderation`, false)) {
    require(`./server_src/discord.js`);
}

const Base = require(`./server_src/universe/base.js`);
const Planet = require(`./server_src/universe/planet.js`);
const Vortex = require(`./server_src/universe/vortex.js`);

require(`./server_src/db.js`);
connectToDB();

require(`./server_src/bot.js`);
require(`./server_src/universe/asteroid.js`);

let broadcastMsg = 0;
let lag = 0; let ops = 0; // ticks elapsed since boot, lag, count of number of instances of update() running at once
let raidRed = 0; let raidBlue = 0; let raidGreen = 0; // Timer and points

function sendRaidData () { // tell everyone when the next raid is happening
    sendAll(`raid`, { raidTimer: raidTimer });
}

const getPlayer = (i) => // given a socket id, find the corresponding player object.
    sockets[i].player;

global.getPlayerFromName = function (name) { // given a socket id, find the corresponding player object.
    for (const p in sockets) {
        const player = sockets[p].player;
        if (typeof player !== `undefined` && player.name === name) return player;
    }
    return -1;
};

function updateQuests () {
    for (const teamColor in baseMap) {
        const thisMap = baseMap[teamColor];
        for (let i = 0; i < 10; i++) {
            if (teamQuests[teamColor][i] !== 0) continue;
            const r = Math.random();
            const r2 = Math.random();
            const whatTeam = (Math.random() < 0.5) ? colorSelect(teamColor, `blue`, `green`, `red`) : colorSelect(teamColor, `green`, `red`, `blue`);
            const metals = [`copper`, `silver`, `platinum`, `iron`];
            let nm = 0;
            if (i < 4) {
                const dsxv = Math.floor(r2 * 100 % 1 * mapSz); const dsyv = Math.floor(r2 * 1000 % 1 * mapSz);
                const sxv = Math.floor(r2 * mapSz); const syv = Math.floor(r2 * 10 % 1 * mapSz);
                if (dsxv == sxv && dsyv == syv) return;
                nm = { type: `Delivery`, metal: metals[Math.floor(r * 4)], exp: Math.floor(1 + Math.sqrt(square(sxv - dsxv) + square(syv - dsyv))) * 20000, sx: sxv, sy: syv, dsx: dsxv, dsy: dsyv };
            } else if (i < 7) nm = { type: `Mining`, metal: metals[Math.floor(r * 4)], exp: 65000, amt: Math.floor(1200 + r * 400), sx: thisMap[Math.floor(r2 * basesPerTeam) * 2], sy: thisMap[Math.floor(r2 * basesPerTeam) * 2 + 1] };
            else if (i < 9) nm = { type: `Base`, 	exp: 500000, sx: baseMap[whatTeam][Math.floor(r2 * basesPerTeam) * 2], sy: baseMap[whatTeam][Math.floor(r2 * basesPerTeam) * 2 + 1] };
            else 			nm = { type: `Secret`, 	exp: 1000000, sx: baseMap[whatTeam][Math.floor(r2 * basesPerTeam) * 2], sy: baseMap[whatTeam][Math.floor(r2 * basesPerTeam) * 2 + 1] };
            teamQuests[teamColor][i] = nm;
        }
    }
}

// packs are how we send data to the client

const playerPack = new Array(mapSz);
const missilePack = new Array(mapSz);
const orbPack = new Array(mapSz);
const minePack = new Array(mapSz);
const blastPack = new Array(mapSz);
const beamPack = new Array(mapSz);
const planetPack = new Array(mapSz);
const packPack = new Array(mapSz);
const basePack = new Array(mapSz);
const astPack = new Array(mapSz);
const vortPack = new Array(mapSz);

for (let i = 0; i < mapSz; i++) {
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

    for (let j = 0; j < mapSz; j++) {
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

function sigHandle () {
    console.log(`[SERVER] Caught termination signal...`);

    for (const y in players) {
        for (const x in players[y]) {
            for (const id in players[y][x]) {
                // Save & kick out
                const player = players[y][x][id];
                if (player.isBot) continue;
                player.save();
                player.kick(`You have been logged out by an administrator working on the servers.`);
            }
        }
    }
    setTimeout(shutdown, 5000);
}

function init () { // start the server!
    // Add signal handlers
    process.on(`SIGINT`, sigHandle);
    process.on(`SIGTERM`, sigHandle);

    // initialize lists of quests
    for (const s in teamQuests) {
        for (let i = 0; i < 10; i++) {
            teamQuests[s][i] = 0;
        }
    }

    readMuteTable();
    readGuildList();

    spawnBases();

    // meta
    setTimeout(initReboot, 86400 * 1000 - 6 * 60 * 1000);
    setTimeout(idleSocketCheck, 1000 * 60 * 5);

    // make asteroids. Make 10 times the number of sectors.
    for (let i = 0; i < mapSz * mapSz * minSectorAsteroidCount; i++) spawnAsteroid();

    // Make exactly one planet in each sector.
    for (let s = 0; s < mapSz * mapSz; s++) {
        const x = s % mapSz;
        const y = Math.floor(s / mapSz);
        createPlanet(planetNames[s], x, y);
    }

    // wormhole
    let id = Math.random();
    let v = new Vortex(id, Math.random() * sectorWidth, Math.random() * sectorWidth, Math.floor(Math.random() * mapSz), Math.floor(Math.random() * mapSz), 0.5, 0, true);
    global.wormhole = vorts[v.sy][v.sx][id] = v;

    // 3 Black Holes
    id = Math.random();
    v = new Vortex(id, sectorWidth / 2, sectorWidth / 2, Math.floor(mapSz / 2), Math.floor(mapSz / 2), 0.15, 0, false);
    vorts[v.sy][v.sx][id] = v;

    setTimeout(update, tickRate);
    broadcastInfo();

    serverInitialized = true;
    console.log(`Server initialized successfully. Game log below.\n`);
}

function buildFileSystem () { // create the server files/folders
    // IMPORTANT that we do not log to file in this function, as this function does not assume the logs folder exists.
    console.log(`\nCreating any potential missing files and folders needed for the server...`);
    let allGood = true;

    const dirs = [`./server`, `./server/neuralnets`, `./logs`, `./error_logs`];
    for (const i in dirs) {
        const dir = dirs[i];
        if (!fs.existsSync(dir)) {
            console.log(`Creating ${dir} directory...`);
            fs.mkdirSync(dir);
            allGood = false;
        }
    }

    const mutesource = `server/permamute`;
    if (!fs.existsSync(mutesource)) {
        fs.writeFileSync(mutesource, ``);
        console.log(`Creating muted player list...`);
        allGood = false;
    }

    const guildsource = `server/guildnames`;
    if (!fs.existsSync(guildsource)) {
        fs.writeFileSync(guildsource, ``);
        console.log(`Creating guild file...`);
        allGood = false;
    }

    if (allGood) console.log(`All server directories and files were already present!`);
}
function spawnBases () {
    console.log(`\nSpawning Bases...`);
    for (const teamColor in baseMap) {
        const thisMap = baseMap[teamColor];
        for (let i = 0; i < thisMap.length; i += 2) {
            // make a base at these coords
            const randBase = Math.random();
            const thisBase = new Base(randBase, LIVEBASE, thisMap[i], thisMap[i + 1], teamColor, sectorWidth / 2, sectorWidth / 2);
            bases[thisMap[i + 1]][thisMap[i]] = thisBase;
        }
    }
    console.log(`\nBases Spawned!`);
}

function createPlanet (name, sx, sy) {
    const randA = Math.random();
    const planet = new Planet(randA, name);
    planet.sx = sx;
    planet.sy = sy;
    while (square(planet.x - sectorWidth / 2) + square(planet.y - sectorWidth / 2) < 3000000) {
        planet.x = Math.floor(Math.random() * sectorWidth * 15 / 16 + sectorWidth / 32);
        planet.y = Math.floor(Math.random() * sectorWidth * 15 / 16 + sectorWidth / 32);
    }
    planets[sy][sx] = planet;
}
function endRaid () {
    let winners = `yellow`;
    if (raidRed > raidBlue && raidRed > raidGreen) winners = `red`;
    else if (raidBlue > raidRed && raidBlue > raidGreen) winners = `blue`;
    else if (raidGreen > raidRed && raidGreen > raidBlue) winners = `green`;
    raidTimer = 100 * 1000;
    const winnerPoints = Math.max(raidGreen, Math.max(raidBlue, raidRed));
    for (const i in sockets) {
        const p = getPlayer(i);
        if (p === undefined) continue;
        if (p.color === winners) p.spoils(`money`, p.points * moneyPerRaidPoint);
        p.points = 0;
    }
    sendRaidData();
    if (winners !== `yellow`) chatAll(`${chatColor(winners)}${winners}${chatColor(`yellow`)} team won the raid, and made $${winnerPoints * moneyPerRaidPoint}!`);
}

function update () {
    ops++;
    if (ops < 2) setTimeout(update, tickRate);
    tick++;
    let d = new Date();
    const lagTimer = d.getTime();
    updateQuests();

    guildPlayers = {};
    for (const g in guildList) {
        guildPlayers[g] = {};
    }

    for (const i in dockers) {
        const player = dockers[i];
        if (player.dead) continue;
        if (player.testAfk()) continue;
        if (tick % 30 == 0) player.checkMoneyAchievements();
        if (player.chatTimer > 0) player.chatTimer--;
        player.muteTimer--;
    }

    for (let y = 0; y < mapSz; y++) {
        for (let x = 0; x < mapSz; x++) {
            const gameState = {
                vorts: [],
                players: [],
                mines: [],
                packs: [],
                beams: [],
                blasts: [],
                asteroids: [],
                orbs: [],
                missiles: [],
                base: undefined
            };

            for (const i in players[y][x]) {
                const player = players[y][x][i];
                let pack = playerPack[y][x][i];

                if (!player.isBot && player.chatTimer > 0) player.chatTimer--;
                player.muteTimer--;
                if (player.testAfk()) continue;
                player.isLocked = false;
                player.tick();

                // Check for creation
                if (pack === undefined) {
                    // Store pack for joining clients & delta calculation
                    pack = playerPack[y][x][i] = { disguise: player.disguise, trail: player.trail, shield: player.shield, empTimer: player.empTimer, hasPackage: player.hasPackage, id: player.id, ship: player.ship, speed: player.speed, maxHealth: player.maxHealth, color: player.color, x: player.x, y: player.y, name: player.name, health: player.health, angle: player.angle, driftAngle: player.driftAngle };
                    // Send create
                    sendAllSector(`player_create`, pack, x, y);

                    // Send full update to the player
                    if (!player.isBot) {
                        player.socket.emit(`posUp`, { disguise: player.disguise, trail: player.trail, isLocked: player.isLocked, health: player.health, shield: player.shield, planetTimer: player.planetTimer, energy: player.energy, sx: player.sx, sy: player.sy, charge: player.charge, x: player.x, y: player.y, angle: player.angle, speed: player.speed, packs: packPack[player.sy][player.sx], vorts: vortPack[player.sy][player.sx], mines: minePack[player.sy][player.sx], missiles: missilePack[player.sy][player.sx], orbs: orbPack[player.sy][player.sx], blasts: blastPack[player.sy][player.sx], beams: beamPack[player.sy][player.sx], planets: planetPack[player.sy][player.sx], asteroids: astPack[player.sy][player.sx], players: playerPack[player.sy][player.sx], bases: basePack[player.sy][player.sx] });
                    }
                    continue;
                }

                const delta = { };
                let need_update = false;

                let cloak = false;

                if (!player.isBot && pack.disguise > 0) {
                    cloak = true;
                }

                // Compute delta
                for (const key in pack) {
                    if (pack[key] !== player[key]) {
                        delta[key] = pack[key] = player[key];
                        need_update = true;
                    }
                }

                // Handle cloaking
                if (need_update && cloak) {
                    player.socket.emit(`update`, { disguise: player.disguise, isLocked: player.isLocked, planetTimer: player.planetTimer, charge: player.charge, energy: player.energy, state: { players: [{ delta: delta, id: i }] } });
                    continue;
                }

                if (!need_update) continue;

                gameState.players.push({ delta: delta, id: i });
            }

            for (const i in vorts[y][x]) {
                const vort = vorts[y][x][i];
                let pack = vortPack[y][x][i];

                vort.tick();
                // Check for creation
                if (pack === undefined) {
                    // Store pack for joining clients & delta calculation
                    pack = vortPack[y][x][i] = { x: vort.x, y: vort.y, size: vort.size, isWorm: vort.isWorm };
                    // Send create
                    sendAllSector(`vort_create`, { pack: pack, id: i }, x, y);
                    continue;
                }

                const delta = { };
                let need_update = false;

                // Compute delta
                for (const key in pack) {
                    if (pack[key] !== vort[key]) {
                        delta[key] = pack[key] = vort[key];
                        need_update = true;
                    }
                }

                if (!need_update) continue;

                gameState.vorts.push({ delta: delta, id: i });
            }

            for (const i in bullets[y][x]) bullets[y][x][i].tick();

            for (const i in mines[y][x]) {
                const mine = mines[y][x][i];
                let pack = minePack[y][x][i];

                mine.tick();

                // Check for creation
                if (pack === undefined) {
                    pack = minePack[y][x][i] = { wepnID: mine.wepnID, color: mine.color, x: mine.x, y: mine.y, angle: mine.angle };
                    // Send create
                    sendAllSector(`mine_create`, { pack: pack, id: i }, x, y);
                    continue;
                }

                const delta = { };
                let need_update = false;

                // Compute delta
                for (const key in pack) {
                    if (pack[key] !== mine[key]) {
                        delta[key] = pack[key] = mine[key];
                        need_update = true;
                    }
                }

                if (!need_update) continue;
                gameState.mines.push({ delta: delta, id: i });
            }

            planets[y][x].tick();

            // We only pulse these every 5 ticks
            if (tick % 5 == 0) {
                for (const i in packs[y][x]) {
                    const boon = packs[y][x][i];
                    let pack = packPack[y][x][i];

                    boon.tick();

                    // Check for creation
                    if (pack === undefined) {
                        pack = packPack[y][x][i] = { x: boon.x, y: boon.y, type: boon.type };

                        // Send create
                        sendAllSector(`pack_create`, { pack: pack, id: i }, x, y);
                        continue;
                    }

                    const delta = { };
                    let need_update = false;

                    // Compute delta
                    for (const key in pack) {
                        if (pack[key] !== boon[key]) {
                            delta[key] = pack[key] = boon[key];
                            need_update = true;
                        }
                    }

                    if (!need_update) continue;
                    gameState.packs.push({ delta: delta, id: i });
                }
            }

            for (const i in beams[y][x]) {
                const beam = beams[y][x][i];
                let pack = beamPack[y][x][i];

                beam.tick();

                // Check for creation
                if (pack == undefined) {
                    // Store pack for joining clients & delta calculation
                    pack = beamPack[y][x][i] = { time: beam.time, wepnID: beam.wepnID, bx: beam.origin.x, by: beam.origin.y, ex: beam.enemy.x, ey: beam.enemy.y };
                    // Send create
                    sendAllSector(`beam_create`, { pack: pack, id: i }, x, y);
                    continue;
                }

                const delta = { };
                let need_update = false;

                // Compute delta
                for (const key in pack) {
                    let beam_key;

                    if (key === `bx`) {
                        beam_key = beam.origin.x;
                    }

                    if (key === `by`) {
                        beam_key = beam.origin.y;
                    }

                    if (key === `ex`) {
                        beam_key = beam.enemy.x;
                    }

                    if (key === `ey`) {
                        beam_key = beam.enemy.y;
                    }

                    if (beam_key === undefined) {
                        beam_key = beam[key];
                    }

                    if (pack[key] !== beam_key) {
                        delta[key] = pack[key] = beam_key;
                        need_update = true;
                    }
                }

                if (beam.sy != y || beam.sx != x) {
                    beam.sy = y;
                    beam.sx = x;
                }

                if (!need_update) continue;
                gameState.beams.push({ delta: delta, id: i });
            }

            for (const i in blasts[y][x]) {
                const blast = blasts[y][x][i];
                let pack = blastPack[y][x][i];

                blast.tick();

                // Check for creation
                if (pack === undefined) {
                    pack = blastPack[y][x][i] = { time: blast.time, wepnID: blast.wepnID, bx: blast.bx, by: blast.by, angle: blast.angle };

                    sendAllSector(`blast_create`, { pack: pack, id: i }, x, y);
                    continue;
                }

                const delta = { };
                let need_update = false;

                // Compute delta
                for (const key in pack) {
                    if (pack[key] !== blast[key]) {
                        delta[key] = pack[key] = blast[key];
                        need_update = true;
                    }
                }

                if (!need_update) continue;
                gameState.blasts.push({ delta: delta, id: i });
            }

            const base = bases[y][x];

            if (base !== 0) {
                let pack = basePack[y][x];

                base.tick();

                // Check for creation (only happens once, on first tick, or when a turret is placd)
                if (pack === undefined) {
                    pack = basePack[y][x] = { id: base.id, baseType: base.baseType, maxHealth: base.maxHealth, health: base.health, color: base.color, x: base.x, y: base.y, angle: base.angle, name: base.name };
                    sendAllSector(`base_create`, pack, x, y);
                    continue;
                }

                const delta = { };
                let need_update = false;

                // Compute delta
                for (const key in pack) {
                    if (pack[key] !== base[key]) {
                        delta[key] = pack[key] = base[key];
                        need_update = true;
                    }
                }

                if (need_update) {
                    gameState.base = { delta: delta };
                }
            }

            astCt = 0;
            for (const i in asts[y][x]) {
                const ast = asts[y][x][i];
                let pack = astPack[y][x][i];
                astCt++;

                ast.tick();
                // Check for creation
                if (pack === undefined) {
                    pack = astPack[y][x][i] = { metal: ast.metal, id: i, x: ast.x, y: ast.y, angle: ast.angle, health: ast.health, maxHealth: ast.maxHealth };
                    sendAllSector(`asteroid_create`, pack, x, y);
                    continue;
                }

                const delta = { };
                let need_update = false;

                // Compute delta
                for (const key in pack) {
                    if (pack[key] !== ast[key]) {
                        delta[key] = pack[key] = ast[key];
                        need_update = true;
                    }
                }

                if (!need_update) continue;

                gameState.asteroids.push({ delta: delta, id: i });
            }
            astCount[y][x] = astCt;

            for (const j in orbs[y][x]) {
                const orb = orbs[y][x][j];
                let pack = orbPack[y][x][j];

                orb.tick();

                // Check for creation
                if (pack === undefined) {
                    pack = orbPack[y][x][j] = { wepnID: orb.wepnID, x: orb.x, y: orb.y };
                    sendAllSector(`orb_create`, { pack: pack, id: j }, x, y);

                    continue;
                }

                const delta = { };
                let need_update = false;

                // Compute delta
                for (const key in pack) {
                    if (pack[key] !== orb[key]) {
                        delta[key] = pack[key] = orb[key];
                        need_update = true;
                    }
                }

                if (!need_update) continue;

                gameState.orbs.push({ delta: delta, id: j });
            }

            for (const j in missiles[y][x]) {
                const missile = missiles[y][x][j];
                let pack = missilePack[y][x][j];

                missile.tick();

                // Check for creation
                if (pack === undefined) {
                    pack = missilePack[y][x][j] = { wepnID: missile.wepnID, x: missile.x, y: missile.y, angle: missile.angle };

                    sendAllSector(`missile_create`, { pack: pack, id: j }, x, y);
                    continue;
                }

                const delta = { };
                let need_update = false;

                // Compute delta
                for (const key in pack) {
                    if (pack[key] !== missile[key]) {
                        delta[key] = pack[key] = missile[key];
                        need_update = true;
                    }
                }

                if (!need_update) continue;

                gameState.missiles.push({ delta: delta, id: j });
            }

            for (const i in vortPack[y][x]) {
                if (vorts[y][x][i] === undefined) {
                    // Send delete
                    sendAllSector(`vort_delete`, i, x, y);

                    delete vortPack[y][x][i];
                    continue;
                }
            }

            // Check for deletions
            for (const i in playerPack[y][x]) {
                if (players[y][x][i] === undefined) {
                    // Send delete
                    sendAllSector(`player_delete`, i, x, y);
                    delete playerPack[y][x][i];
                    continue;
                }
            }

            for (const i in minePack[y][x]) {
                if (mines[y][x][i] === undefined) {
                    // Send delete
                    sendAllSector(`mine_delete`, i, x, y);
                    delete minePack[y][x][i];
                    continue;
                }
            }

            for (const i in missilePack[y][x]) {
                if (missiles[y][x][i] === undefined) {
                    sendAllSector(`missile_delete`, i, x, y);

                    delete missilePack[y][x][i];
                    continue;
                }
            }

            for (const i in orbPack[y][x]) {
                if (orbs[y][x][i] === undefined) {
                    sendAllSector(`orb_delete`, i, x, y);

                    delete orbPack[y][x][i];
                    continue;
                }
            }

            for (const i in blastPack[y][x]) {
                if (blasts[y][x][i] === undefined) {
                    // Send delete
                    sendAllSector(`blast_delete`, i, x, y);
                    delete blastPack[y][x][i];
                    continue;
                }
            }

            for (const i in beamPack[y][x]) {
                if (beams[y][x][i] === undefined) {
                    sendAllSector(`beam_delete`, i, x, y);

                    delete beamPack[y][x][i];
                    continue;
                }
            }

            for (const i in packPack[y][x]) {
                if (packs[y][x][i] === undefined) {
                    // Send delete
                    sendAllSector(`pack_delete`, i, x, y);

                    delete packPack[y][x][i];
                    continue;
                }
            }

            for (const i in astPack[y][x]) {
                if (asts[y][x][i] === undefined) {
                    sendAllSector(`asteroid_delete`, i, x, y);
                    delete astPack[y][x][i];
                    continue;
                }
            }

            if (basePack[y][x] !== undefined && bases[y][x] === 0) {
                sendAllSector(`base_delete`, 0, x, y);
                delete basePack[y][x];
            }

            for (const i in players[y][x]) {
                const player = players[y][x][i];
                if (player.isBot) continue;
                if (tick % 12 == 0) { // LAG CONTROL
                    player.socket.emit(`online`, { lag: lag });
                    player.socket.emit(`you`, { tag: player.tag, trail: player.trail, killStreak: player.killStreak, killStreakTimer: player.killStreakTimer, name: player.name, points: player.points, va2: player.radar2, experience: player.experience, rank: player.rank, ship: player.ship, docked: player.docked, color: player.color, money: player.money, kills: player.kills, baseKills: player.baseKills, iron: player.iron, silver: player.silver, platinum: player.platinum, copper: player.copper }); // TODO combine this with the lower YOU message, send less frequently, but send in base when player upgrades a stat
                }

                player.socket.emit(`update`, { cloaked: player.disguise > 0, isLocked: player.isLocked, planetTimer: player.planetTimer, charge: player.charge, energy: player.energy, state: gameState });
            }

            // Clear
        }
    }

    // re-spawn asteroids if we've fallen below the sector avg (8)
    let sumAsts = 0;
    for (const i in astCount) for (const j in astCount[i])sumAsts += astCount[i][j];
    if (sumAsts < 8 * mapSz * mapSz) spawnAsteroid();

    if (tick % 12 == 0) {
        // LAG CONTROL
        for (const i in deads) {
            const player = deads[i];
            player.socket.emit(`online`, { lag: lag });
        }
    }

    if (tick % 12 == 0) { // LAG CONTROL
        for (const i in dockers) {
            const player = dockers[i];
            player.socket.emit(`you`, { tag: player.tag, trail: player.trail, killStreak: player.killStreak, killStreakTimer: player.killStreakTimer, name: player.name, t2: player.thrust2, va2: player.radar2, ag2: player.agility2, c2: player.capacity2, e2: player.energy2, mh2: player.maxHealth2, experience: player.experience, rank: player.rank, ship: player.ship, charge: player.charge, sx: player.sx, sy: player.sy, docked: player.docked, color: player.color, baseKills: player.baseKills, x: player.x, y: player.y, money: player.money, kills: player.kills, iron: player.iron, silver: player.silver, platinum: player.platinum, copper: player.copper });
            player.socket.emit(`quests`, { quests: teamQuests[player.color] });
        }
    }

    if (raidTimer-- % 4000 == 0) sendRaidData();
    if (raidTimer <= 0) endRaid();

    d = new Date();
    lag = d.getTime() - lagTimer;
    ops--;
}

if (Config.getValue(`enable_discord_moderation`, false)) setInterval(setDiscordActivity, 60000);

setInterval(updateHeatmap, 500);
function updateHeatmap () {
    const hmap = [];
    const lb = [];
    for (let i = 0; i < mapSz; i++) {
        hmap[i] = [];
        for (let j = 0; j < mapSz; j++) hmap[i][j] = 0;
    }
    let j = 0;
    raidRed = raidBlue = raidGreen = playerCount = botCount = guestCount = 0;

    for (let x = 0; x < mapSz; x++) {
        for (let y = 0; y < mapSz; y++) {
            for (const i in players[y][x]) {
                const p = players[y][x][i];
                if (p.color === `red`) raidRed += p.points;
                else if (p.color === `blue`) raidBlue += p.points;
                else if (p.color === `green`) raidGreen += p.points;
                if (p.name !== `` && !p.isBot) {
                    lb[j] = p;
                    j++;
                }
                if (p.isBot) botCount++;
                else if (p.guest) guestCount++;
                else playerCount++;
                hmap[p.sx][p.sy] += 0.1 + colorSelect(p.color, 1 << 16, 1, 1 << 8); // this is not supposed to be x-y order. TODO fix
            }
        }
    }
    for (const i in dockers) {
        const p = dockers[i];
        if (p.color === `red`) raidRed += p.points;
        else if (p.color === `blue`) raidBlue += p.points;
        else if (p.color === `green`) raidGreen += p.points;
        if (p.isBot) botCount++;
        else if (p.guest) botCount++;
        else playerCount++;
        lb[j] = p;
        j++;
    }
    for (const i in deads) {
        const p = deads[i];
        if (p.color === `red`) raidRed += p.points;
        else if (p.color === `blue`) raidBlue += p.points;
        else if (p.color === `green`) raidGreen += p.points;
        if (p.isBot) botCount++;
        else if (p.guest) botCount++;
        else playerCount++;
        lb[j] = p;
        j++;
    }

    for (let i = 0; i < lb.length - 1; i++) {
        // sort it
        for (let k = 0; k < lb.length - i - 1; k++) {
            if (lb[k + 1].experience > lb[k].experience) {
                const temp = lb[k + 1];
                lb[k + 1] = lb[k];
                lb[k] = temp;
            }
        }
    }

    const lbSend = [];
    for (let i = 0; i < Math.min(20, j); i++) lbSend[i] = { name: lb[i].name, tag: lb[i].tag, exp: Math.round(lb[i].experience), color: lb[i].color, rank: lb[i].rank };

    // Normalize colors as though they are vectors to length 255
    for (let i = 0; i < mapSz; i++) {
        for (let j = 0; j < mapSz; j++) {
            const col = hmap[i][j];
            let r = Math.floor(col / 0x10000) % 0x100;
            let g = Math.floor(col / 0x100) % 0x100;
            let b = Math.floor(col) % 0x100;
            const a = col - Math.floor(col);
            const length = Math.sqrt(r * r + g * g + b * b) + 0.01;
            r /= length;
            b /= length;
            g /= length;
            hmap[i][j] = Math.floor(r * 256) * 0x10000 + Math.floor(g * 256) * 0x100 + Math.floor(b * 256) + a;
        }
    }

    for (const i in lb) {
        const myGuild = guildPlayers[lb[i].guild];
        lb[i].socket.emit(`heatmap`, { myGuild: myGuild, hmap: hmap, lb: lbSend, youi: i, raidBlue: raidBlue, raidRed: raidRed, raidGreen: raidGreen });
    }
}

function idleSocketCheck () {
    const time = Date.now();
    const timeout = 1000 * 60 * 5;

    for (const x in sockets) {
        const s = sockets[x];

        if (s.player === undefined && (time - s.start) >= timeout) {
            s.disconnect();
            delete sockets[x];
        }
    }

    // Let clients refresh their lag
    sendAll(`torn-ping`, Date.now());
    setTimeout(idleSocketCheck, timeout);
}

function shutdown () {
    writeGuildList();
    saveTurrets();
    process.exit();
}

function broadcastInfo () {
    const randomMsgs = [
        `Contact us if you want to translate Torn into your language!`,
        `Never give anyone your password, for any reason!`,
        `Support the game by buying a VIP pass in the store!`,
        `Join the torn.space discord in the 'more' tab!`,
        `If you find a bug, report it in the 'more' menu!`,
        `Type /changeteam to switch teams!`,
        `Mute bothersome players with /mute username`,
        `Register your email with /email you@example.net`
    ];
    chatAll(`${chatColor(`#ff0000`)}${randomMsgs[broadcastMsg % randomMsgs.length]}`);
    broadcastMsg++;
    setTimeout(broadcastInfo, 20 * 60 * 1000);
}

init();
