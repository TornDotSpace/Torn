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

require(`./netutils.js`);
require(`./command.js`);

const fs = require(`fs`);

const Filter = require(`bad-words`);
const filter = new Filter();

filter.removeWords(`god`, `hell`, `crap`, `flipping the bird`, `Lipshitz`, `Lipshits`, `polack`, `screwing`, `slut`, `sluts`, `hui`, `poop`, `screw`, `coño`, `puta`, `hijoputa`, `cabrón`, `cabron`, `mierda`);

const PlayerMP = require(`./player_mp.js`);

const exec = require(`child_process`).execSync;
const msgpack = require(`socket.io-msgpack-parser`);

let guestNumber = 0; // Enumerate guests since server boot

// Global mute table
global.muteTable = {};
global.ipMuteTable = {};

global.protocolVersion = undefined;

const runCommand = (player, msg) => {
    const args = msg.slice(1).trim().split(` `);
    const cmd = args.shift().toLowerCase();

    const command = cmds[cmd];

    if (!command) player.socket.emit(`chat`, { msg: `${chatColor(`red`)}Unknown Command. Use /help for a list of commands! ${chatColor(`red`)}` });
    else {
        // Check for permissions
        let permitted = false;
        for (const p in player.permissionLevels) {
            if (command.permissions.includes(player.permissionLevels[p])) {
                permitted = true;
                break;
            }
        }
        if (!permitted) {
            player.socket.emit(`chat`, { msg: `${chatColor(`red`)}You don't have permission to access this command. ${chatColor(`red`)}` });
            return;
        }

        command.invoke(player, msg);
    }
};

module.exports = initNetcode = () => {
    const port = process.argv[2];
    console.log(``);

    const http = require(`http`);
    const https = require(`https`);

    const protocol = Config.getValue(`want-tls`, false) ? https : http;
    const key = Config.getValue(`tls-key-path`, null);
    const cert = Config.getValue(`tls-cert-path`, null);

    const options = (protocol === https)
        ? {
            key: (key != null) ? fs.readFileSync(key) : key,
            cert: (cert != null) ? fs.readFileSync(cert) : cert
        }
        : {};

    const server = (protocol == https)
        ? protocol.createServer(options)
        : protocol.createServer();

    if (Config.getValue(`want-unix-sockets`, false)) {
    // Open a unix socket on current dir
        server.listen(`torn.socket`);
    } else {
        console.log(`=== STARTING SERVER ON PORT ${port} ===`);
        server.listen(parseInt(port));
    }

    // Try to grab the protocol version from the current git tag
    try {
        global.protocolVersion = exec(`git tag -l --points-at HEAD`).toString().trim();

        if (!global.protocolVersion) {
            global.protocolVersion = undefined;
            console.error(`Failed to retrieve protocol version, all clients will be allowed!`);
        } else console.log(`Protocol Version: ${global.protocolVersion}`);
    } catch (e) {
        console.error(`Failed to retrieve protocol version, all clients will be allowed!`);
    }

    const socketIO = require(`socket.io`);
    // https://github.com/socketio/engine.io/blob/c1448951334c7cfc5f1d1fff83c35117b6cf729f/lib/server.js
    global.io = socketIO(server, {
        serveClient: false,
        // parser: msgpack,
        cors: {
            origin: `*`
        }
    });

    io.sockets.on(`connection`, (socket) => {
        if (!serverInitialized) {
            socket.emit(`kick`, { msg: `Server is still starting up!` });
            return socket.disconnect();
        }

        socket.start = Date.now();
        let instance = false;
        sockets[socket.id] = socket;

        const ip = Config.getValue(`want-xreal-ip`, true)
            ? socket.handshake.headers[`x-real-ip`]
            : socket.handshake.address;

        let player = 0;

        let socket_color = `green`; // the color of this socket, only used for when spawning a guest for the first time.

        socket.io_on = socket.on;

        socket.on = function (the_event, listener) {
            socket.io_on(the_event, (data) => {
                try {
                    listener(data);
                } catch (err) {
                    // Log data to help us perform bug triage
                    const crashReport = `==== TORN.SPACE ERROR REPORT ====\nError Time: ${new Date()}\n\Event: ${the_event}\n\Stack Trace: ${err.stack}`;
                    if (Config.getValue(`debug`, true)) console.error(crashReport);
                    else send_rpc(`/crash/`, crashReport);

                    // Eject the player from the game: we don't know if they're in a valid state
                    socket.emit(`kick`, { msg: `Internal server error.` });
                    socket.disconnect();
                }
            });
        };

        socket.on(`lore`, (data) => { // player is requesting lore screen.
            if (typeof data === `undefined` || typeof data.team !== `string`) return;
            if (data.team !== `red` && data.team !== `blue` && data.team !== `green`) return;
            socket_color = data.team;
            socket.emit(`lored`, { pc: socket_color });
        });

        socket.on(`guest`, (data) => {
            if (instance) return;

            if (global.protocolVersion !== undefined) {
                // Verify client is running the same protocol implementation
                if (typeof data !== `string` || data.trim() !== global.protocolVersion) {
                    socket.emit(`outdated`, 0);
                    return;
                }
            }

            player = new PlayerMP(socket);
            socket.player = player;
            player.guest = true;
            instance = true;
            player.ip = ip;
            player.name = `GUEST${guestNumber++}`;
            console.log(`${player.ip} logged in as ${player.name}`);

            player.color = socket_color;
            player.sx = baseMap[player.color][0];
            player.sy = baseMap[player.color][1];
            for (let i = 0; i < ships[player.ship].weapons; i++) player.weapons[i] = -1;
            for (let i = ships[player.ship].weapons; i < 10; i++) player.weapons[i] = -2;
            player.weapons[0] = 0;
            socket.emit(`guested`, { id: player.id });
            player.sendStatus();

            player.getAllPlanets();

            players[player.sy][player.sx][socket.id] = player;
            player.va = ships[player.ship].agility * 0.08 * player.agility2;
            player.thrust = ships[player.ship].thrust * player.thrust2;
            player.capacity = Math.round(ships[player.ship].capacity * player.capacity2);
            player.maxHealth = player.health = Math.round(ships[player.ship].health * player.maxHealth2);
            sendWeapons(player);
            socket.emit(`raid`, { raidTimer: raidTimer });
            socket.emit(`baseMap`, { baseMap: baseMap, mapSz: mapSz });

            chatAll(`Welcome ${player.nameWithColor()} to the universe!`);
        });

        socket.on(`register`, async (data) => {
            console.log(`Registration attempted...`);
            if (typeof data === `undefined`) return;
            // Block registrations being triggered from non-guests or unconnected accounts
            // Fixes some registration spam and crash exploits

            if (!player) return;
            if (!player.guest) return;
            if (player.rank < 1) {
                socket.emit(`invalidReg`, { reason: 8 });
                return;
            }

            const playerDocked = dockers[socket.id];
            if (typeof playerDocked === `undefined`) return;

            let user = data.user; const pass = data.pass;

            if (typeof user !== `string` || user.length > 16 || user.length < 4 || /[^a-zA-Z0-9]/.test(user)) {
                socket.emit(`invalidReg`, { reason: 2 });
                return;
            }
            user = user.toLowerCase();
            if (typeof pass !== `string` || pass.length > 128 || pass.length < 6 || pass == user) {
                socket.emit(`invalidReg`, { reason: 3 });
                return;
            }

            // Test for profanity
            if (filter.isProfane(user)) {
                socket.emit(`invalidReg`, { reason: 5 });
                return;
            }

            player.guest = false;
            const response = await send_rpc(`/register/`, `${user}%${pass}`);

            if (!response.ok) {
                player.guest = true;
                socket.emit(`invalidReg`, { reason: 4 });
                return;
            }
            player.name = user;

            player.permissionLevels = [0];
            socket.emit(`registered`, { user: data.user, pass: data.pass });
            const text = `${player.nameWithColor()} registered!`;
            console.log(text);
            chatAll(text);

            player.save();
        });

        socket.on(`login`, async (data) => {
            if (typeof data === `undefined` || data.cookie == undefined) return;

            if (instance) return;
            instance = true;

            if (global.protocolVersion !== undefined) {
                // Verify client is running the same protocol implementation
                if (typeof data.version !== `string` || global.protocolVersion !== data.version.trim()) {
                    instance = false;
                    socket.emit(`outdated`);
                    return;
                }
            }

            const response = await send_rpc(`/login/`, data.cookie);

            if (!response.ok) {
                socket.emit(`badcookie`);
                instance = false;
                return;
            }

            const name = await response.text();
            player = new PlayerMP(socket);

            let wait_time = 0;
            for (const p in sockets) {
                const curr_socket = sockets[p];
                if (curr_socket.player !== undefined && curr_socket.player.name == name && curr_socket != socket) {
                    curr_socket.player.kickMsg = `A user has logged into this account from another location.`;
                    curr_socket.player.socket.disconnect();
                    wait_time = 6000;
                }
            }

            setTimeout(async () => {
                player.name = name;
                await loadPlayerData(player);
                player.ip = ip;
                socket.emit(`loginSuccess`, { id: player.id });

                if (player.sx >= mapSz) player.sx--;
                if (player.sy >= mapSz) player.sy--;

                players[player.sy][player.sx][socket.id] = player;

                player.calculateGenerators();
                socket.emit(`raid`, { raidTimer: raidTimer });
                player.checkTrailAchs();
                player.randmAchs[0] = true;
                player.sendAchievementsKill(false);
                player.sendAchievementsCash(false);
                player.sendAchievementsDrift(false);
                player.sendAchievementsMisc(false);
                player.sendStatus();

                player.getAllPlanets();
                player.refillAllAmmo();
                console.log(`${ip} logged in as ${name}! (last save: ${new Date(player.lastLogin)})`);
                const text = `${player.nameWithColor()} logged in!`;
                chatAll(text);

                // Update last login
                player.lastLogin = Date.now();
                player.va = ships[player.ship].agility * 0.08 * player.agility2;
                player.thrust = ships[player.ship].thrust * player.thrust2;
                player.capacity = Math.round(ships[player.ship].capacity * player.capacity2);
                player.maxHealth = player.health = Math.round(ships[player.ship].health * player.maxHealth2);
                sendWeapons(player);
                socket.emit(`baseMap`, { baseMap: baseMap, mapSz: mapSz });
                socket.emit(`you`, { trail: player.trail, killStreak: player.killStreak, killStreakTimer: player.killStreakTimer, name: player.name, t2: player.thrust2, va2: player.radar2, ag2: player.agility2, c2: player.capacity2, e2: player.energy2, mh2: player.maxHealth2, experience: player.experience, rank: player.rank, ship: player.ship, charge: player.charge, sx: player.sx, sy: player.sy, docked: player.docked, color: player.color, baseKills: player.baseKills, x: player.x, y: player.y, money: player.money, kills: player.kills, iron: player.iron, silver: player.silver, platinum: player.platinum, copper: player.copper });
            }, wait_time);
        });

        socket.on(`disconnect`, (data) => { // Emitted by socket.IO when connection is terminated or ping timeout
            if (!player) return; // Don't allow unauthenticated clients to crash the server

            // If the player is indeed found
            let reason = player.kickMsg;

            if (reason === undefined || !reason.localeCompare(``)) {
                reason = data;
            }
            const text = `${player.nameWithColor()} left the game (reason: ${reason})`; // write a message about the player leaving

            console.log(text); // print in terminal
            chatAll(text); // send it to all the players

            setTimeout(() => {
                // Cleanup
                // Kill socket
                socket.disconnect();
                delete dockers[player.id];
                delete deads[player.id];
                delete sockets[socket.id];
                delete players[player.sy][player.sx][player.id];
            }, 6000);
        });

        socket.on(`key`, (data) => { // on client keypress or key release
            if (typeof data === `undefined` || typeof data.inputId === `undefined` || typeof data.state === `undefined`) return;
            if (player == 0) return;

            player.afkTimer = afkTimerConst;

            // if they want to be revived after dying
            if (player.dead && data.inputId === `e`) {
                player.dead = false;

                // Spawn was computed in die()
                players[player.sy][player.sx][player.id] = player;
                delete deads[player.id];
                player.sendStatus();
                return;
            }
            /*
            if (player.empTimer > 0) return; // if they're EMPed, don't bother accepting key inputs.
*/
            if (data.inputId === `e` && !player.docked) player.juke(false); // Q/E are juke keys
            if (data.inputId === `q` && !player.docked) player.juke(true);

            if (data.inputId === `w`) player.w = data.state; // standard movement keys
            if (data.inputId === `s`) player.s = data.state;
            if (data.inputId === `a`) player.a = data.state;
            if (data.inputId === `d`) player.d = data.state;
            if (data.inputId === `c`) player.c = data.state; // elite special slot
            if (data.inputId === ` `) player.space = data.state; // fire
            if (data.inputId === `x`) player.dock(); // x or esc to enter base
            if (data.inputId === `shift`) { // drift
                player.e = data.state;
                if (!data.state) player.checkDriftAchs(); // if they let go of the drift key
            }
        });

        socket.on(`chat`, (data) => { // when someone sends a chat message
            if (typeof data === `undefined` || typeof data.msg !== `string` || data.msg.length > 128) return;

            data.msg = data.msg.trim(); // "   h i   " => "h i"

            // const re = /%CC%/g;
            // const hasZalgo = re.test(encodeURIComponent(data.msg));
            // data.msg = data.msg.replace(/%CC(%[A-Z0-9]{2})+%20/g, " ").replace(/%CC(%[A-Z0-9]{2})+(\w)/g, "$2"); / /replace anything else

            if (player == 0 || data.msg.length == 0) return;

            if (guestsCantChat && player.guest) {
                socket.emit(`chat`, { msg: `${chatColor(`red`)}You must create an account in the base before you can chat!` });
                return;
            }

            if (player.tag === ``) data.msg = data.msg.replace(/`/ig, ``); // Non-tags can't use colored text

            const time = Date.now();

            if (data.msg.startsWith(`/`) && !data.msg.startsWith(`/me `) && !data.msg.startsWith(`/r `) && !data.msg.startsWith(`/pm `)) {
                runCommand(player, data.msg); return;
            } // non spammable commands

            if (muteTable[player.name] > time || ipMuteTable[player.ip] > time) {
                let secondsLeft = 0;
                if (muteTable[player.name] > secondsLeft) secondsLeft = Math.floor((muteTable[player.name] - time) / 1000); // We aren't using math.max here because it misbehaves with NaN arguments, which these dictionary accesses can be.
                if (ipMuteTable[player.ip] > secondsLeft) secondsLeft = Math.floor((ipMuteTable[player.ip] - time) / 1000);
                socket.emit(`chat`, { msg: (`${chatColor(`red`)}You are muted for ${Math.floor(secondsLeft / 60)} minutes and ${secondsLeft % 60} seconds!`) });
                return;
            }
            delete muteTable[player.name];
            delete ipMuteTable[player.ip];

            // TODO: FIXME: https://github.com/web-mech/badwords/issues/93
            try {
                newmsg = filter.clean(data.msg); // censor swear words.
            } catch (e) {
                newmsg = data.msg;
            }

            if (newmsg.startsWith(`/`)) runCommand(player, newmsg); // spammable commands
            else console.log(`[CHAT] ${player.name}: ${data.msg}`); // print their (cleaned) message

            const repeat = newmsg === player.lastmsg;
            player.lastmsg = newmsg;
            player.chatTimer += 140; // note this as potential spam
            if (repeat) player.chatTimer *= 2;
            // if (hasZalgo) player.chatTimer*=3;
            if (player.chatTimer > 600) { // exceeded spam limit: they are now muted
                muteTable[player.name] = time + (Math.floor(player.muteCap / 25) * 1000);
                chatAll(`${player.nameWithColor()} has been muted for ${Math.floor(player.muteCap / 25)} seconds!`);
                if (Config.getValue(`enable_discord_moderation`, false)) {
                    global.autoMuteNote(`${player.name} has been auto-muted for ${Math.floor(player.muteCap / 25)} seconds!`);
                }
                player.muteCap *= repeat ? 4 : 2; // their next mute will be twice as long
                return;
            }

            if (!newmsg.startsWith(`/`)) { // otherwise send the text
                let spaces = ``;
                for (let i = player.name.length; i < 16; i++) spaces += ` `; // align the message
                const finalMsg = `${spaces + player.nameWithColor()}: ${newmsg}`;

                // Send it to the client up to what chat room theyre in
                if (player.globalChat == 2 && player.guild === ``) socket.emit(`chat`, { msg: (`${chatColor(`red`)}You are not in a guild!`) });
                else playerChat(finalMsg, player.globalChat, player.color, player.guild);

                if (Config.getValue(`enable_discord_moderation`, false)) {
                    fewSpaces = ((newmsg.match(/ /g) || []).length) < Math.floor(newmsg.length / 15);
                    frequentMsgs = player.chatTimer > 400;
                    allUpperCase = newmsg === newmsg.toUpperCase() && newmsg.length > 6;
                    isSweary = newmsg !== data.msg;
                    if (frequentMsgs || fewSpaces || isSweary || repeat || allUpperCase) {
                        detectSpam(player.name, newmsg);
                        player.chatTimer += 75;
                    }
                }
            }
        });
        socket.on(`toggleGlobal`, (data) => { // player wants to switch what chat room they're in
            if (player == 0 || typeof data.gc !== `number` || data.gc != Math.floor(data.gc) || data.gc < 0 || data.gc >= 3) return;
            player.globalChat = data.gc;
        });
        socket.on(`jettison`, (data) => { // Drop all ores
            player.iron = player.silver = player.platinum = player.copper = 0;
        });
        socket.on(`sell`, (data) => { // selling ore
            if (typeof data === `undefined` || player == 0 || !player.docked || typeof data.item !== `string`) return;
            player.sellOre(data.item);
        });
        socket.on(`buyShip`, (data) => { // client wants to buy a new ship
            if (typeof data === `undefined` || player == 0 || !player.docked || typeof data.ship !== `number`) return;

            data.ship = Math.floor(data.ship); // the ship index must be integer. It must be no higher than your rank, and cannot be your current ship or out of bounds.
            if (data.ship > player.rank || data.ship < 0 || data.ship > ships.length || data.ship == player.ship) return;

            let price = ships[player.ship].price * -0.75; // refund them .75x their own ship's price.
            price += ships[data.ship].price;
            if (player.money < price) return; // if it cannot be afforded

            player.sellOre(`all`); // sell all ore, because their new ship may not have the cargo room to hold it all

            player.money -= price; // charge them money
            player.ship = data.ship; // Give them the new ship

            player.va = ships[data.ship].agility * 0.08 * player.agility2; // TODO this is going to be redone
            player.thrust = ships[data.ship].thrust * player.thrust2;
            player.maxHealth = Math.round(player.health = ships[data.ship].health * player.maxHealth2);
            player.capacity = Math.round(ships[data.ship].capacity * player.capacity2);

            player.equipped = 0; // set them as being equipped on their first weapon
            socket.emit(`equip`, { scroll: player.equipped });

            for (let i = 0; i < 10; i++) if (player.weapons[i] == -2 && i < ships[player.ship].weapons) player.weapons[i] = -1; // unlock new possible weapon slots
            player.calculateGenerators();
            sendWeapons(player);
            player.save();
        });
        socket.on(`buyW`, (data) => { // client wants to buy a weapon
            if (typeof data === `undefined` || player == 0 || !player.docked || typeof data.slot !== `number` || typeof data.weapon !== `number`) return;

            data.slot = Math.floor(data.slot);
            data.weapon = Math.floor(data.weapon);
            if (data.slot < 0 || data.slot > 9 || data.weapon < 0 || data.weapon >= wepns.length) return; // if they sent out of bound variables

            // This is a bug
            if (typeof wepns[data.weapon] === `undefined`) return;

            // they cant buy when not docked. That slot must be unlocked. They need to have enough money. They need to have sufficiently high of a ship.
            if (!player.docked || player.weapons[data.slot] != -1 || player.money < wepns[data.weapon].price || wepns[data.weapon].level > player.ship) return;

            player.money -= wepns[data.weapon].price; // take their money
            player.weapons[data.slot] = data.weapon; // give them the weapon
            player.refillAllAmmo(); // give them ammo
            sendWeapons(player); // tell the client what they've been given
            player.calculateGenerators();
            player.save();
        });
        socket.on(`buyLife`, (data) => { // client wants to buy a life
            if (player == 0 || !player.docked || player.lives >= 20) return;
            const price = expToLife(player.experience, player.guest); // compute how much the life costs them
            if (player.money < price) return; // cant afford

            player.money -= price; // take money
            player.lives++; // give life
            player.sendStatus(); // tell the client about it
            player.save();
        });
        socket.on(`upgrade`, (data) => { // client wants to upgrade a tech
            // TODO im totally redoing this
            if (typeof data === `undefined` || player == 0 || !player.docked || typeof data.item !== `number` || data.item > 5 || data.item < 0) return;
            const item = Math.floor(data.item);

            switch (item) {
                case 1: { // radar
            		const price = techPrice(player.radar2);
                    if (player.money >= price) {
                        player.money -= price;
                        player.radar2 = nextTechLevel(player.radar2);
                    }
                    break;
                }
                case 2: { // cargo
            		const price = techPrice(player.capacity2);
                    if (player.money >= price) {
                        player.money -= price;
                        player.capacity2 = nextTechLevel(player.capacity2);
                        player.capacity = Math.round(ships[player.ship].capacity * player.capacity2);
                    }
                    break;
                }
                case 3: { // hull
            		const price = techPrice(player.maxHealth2);
                    if (player.money >= price) {
                        player.money -= price;
                        player.maxHealth2 = nextTechLevel(player.maxHealth2);
                        player.maxHealth = Math.round(ships[player.ship].health * player.maxHealth2);
                    }
                    break;
                }
                case 4: { // energy
            		const price = techPrice(player.energy2) * 8;
                    if (player.money >= price) {
                        player.money -= price;
                        player.energy2 = nextTechLevel(player.energy2);
                    }
                    break;
                }
                case 5: { // agility
            		const price = techPrice(player.agility2);
                    if (player.money >= price) {
                        player.money -= price;
                        player.agility2 = nextTechLevel(player.agility2);
                        player.va = ships[player.ship].agility * 0.08 * player.agility2;
                    }
                    break;
                }
                default: { // 0: thrust
            		const price = techPrice(player.thrust2);
                    if (player.money >= price) {
                        player.money -= price;
                        player.thrust2 = nextTechLevel(player.thrust2);
                        player.thrust = ships[player.ship].thrust * player.thrust2;
                    }
                    break;
                }
            }
            player.save();
        });
        socket.on(`downgrade`, (data) => { // client wants to downgrade a tech
            if (typeof data === `undefined` || player == 0 || !player.docked || typeof data.item !== `number` || data.item > 5 || data.item < 0) return;
            const item = Math.floor(data.item);

            switch (item) {
                case 1: { // radar
                	if (player.radar2 <= 1) break;
            		const price = techPriceForDowngrade(player.radar2, player.tag === `V` || player.tag === `B`);
                    if (player.money >= price) {
                        player.money -= price;
                        player.radar2 = lastTechLevel(player.radar2);
                    }
                    break;
                }
                case 2: { // cargo
                	if (player.capacity2 <= 1) break;
            		const price = techPriceForDowngrade(player.capacity2, player.tag === `V` || player.tag === `B`);
                    if (player.money >= price) {
                        player.money -= price;
                        player.capacity2 = lastTechLevel(player.capacity2);
                        player.capacity = Math.round(ships[player.ship].capacity * player.capacity2);
                    }
                    break;
                }
                case 3: { // hull
                	if (player.maxHealth2 <= 1) break;
            		const price = techPriceForDowngrade(player.maxHealth2, player.tag === `V` || player.tag === `B`);
                    if (player.money >= price) {
                        player.money -= price;
                        player.maxHealth2 = lastTechLevel(player.maxHealth2);
                        player.maxHealth = Math.round(ships[player.ship].health * player.maxHealth2);
                    }
                    break;
                }
                case 4: { // energy
                	if (player.energy2 <= 1) break;
            		const price = techPriceForDowngrade(player.energy2, player.tag === `V` || player.tag === `B`) * 8;
                    if (player.money >= price) {
                        player.money -= price;
                        player.energy2 = lastTechLevel(player.energy2);
                    }
                    break;
                }
                case 5: { // agility
                	if (player.agility2 <= 1) break;
            		const price = techPriceForDowngrade(player.agility2, player.tag === `V` || player.tag === `B`);
                    if (player.money >= price) {
                        player.money -= price;
                        player.agility2 = lastTechLevel(player.agility2);
                        player.va = ships[player.ship].agility * 0.08 * player.agility2;
                    }
                    break;
                }
                default: { // 0: thrust
                	if (player.thrust2 <= 1) break;
            		const price = techPriceForDowngrade(player.thrust2, player.tag === `V` || player.tag === `B`);
                    if (player.money >= price) {
                        player.money -= price;
                        player.thrust2 = lastTechLevel(player.thrust2);
                        player.thrust = ships[player.ship].thrust * player.thrust2;
                    }
                    break;
                }
            }
            player.save();
        });
        socket.on(`sellW`, (data) => { // wants to sell a weapon.
            if (typeof data === `undefined` || player == 0 || !player.docked || typeof data.slot !== `number` || data.slot < 0 || data.slot > 9 || player.weapons[data.slot] < 0 || player.weapons[data.slot] > wepns.length - 1) return;

            data.slot = Math.floor(data.slot);
            if (!player.docked || player.weapons[data.slot] < 0) return; // can't sell what you don't have. or when you're not in base.
            player.money += wepns[player.weapons[data.slot]].price * 0.75; // refund them a good bit
            player.calculateGenerators();
            player.weapons[data.slot] = -1; // no weapon here anymore. TODO should this ever turn into -2?
            player.refillAllAmmo(); // remove their ammo
            sendWeapons(player); // alert client of transaction
            player.save();
        });
        socket.on(`quest`, (data) => { // wants to accept a quest
            if (typeof data === `undefined` || player == 0 || !player.docked || player.quest != 0 || typeof data.quest !== `number` || data.quest < 0 || data.quest > 9) return;

            const qid = Math.floor(data.quest); // Find the correct quest.
            const quest = teamQuests[player.color][qid];

            // You need to have unlocked this quest type.
            if (quest == 0 || (quest.type === `Base` && player.rank < 7) || (quest.type === `Secret` && player.rank <= 14)) return;

            let hasBH = false;
            if (typeof quest.dsyv === `number`) {
                for (let bh in vorts[quest.dsyv][quest.dsxv]) {
                    hasBH = hasBH || !bh.isWorm;
                }
            }
            if (typeof quest.syv === `number`) {
                for (let bh in vorts[quest.syv][quest.sxv]) {
                    hasBH = hasBH || !bh.isWorm;
                }
            }
            if (hasBH && !player.randmAchs[2]) { // risky business
                player.randmAchs[2] = true;
                player.sendAchievementsMisc(true);
            }

            teamQuests[player.color][qid] = 0;
            player.quest = quest; // give them the quest and tell the client.
            socket.emit(`quest`, { quest: quest });
        });
        socket.on(`equip`, (data) => { // Player wants to select a new weapon to hold
            if (player == 0 || typeof data === `undefined` || typeof player === `undefined` || typeof data.scroll !== `number` || data.scroll >= ships[player.ship].weapons) return;

            player.equipped = Math.floor(data.scroll); // Set their equipped weapon
            if (player.equipped < 0) player.equipped = 0; // Ensure it's in range
            else if (player.equipped > 9) player.equipped = 9;
            player.charge = Math.min(player.charge, 0); // to prevent scroll charge exploit

            socket.emit(`equip`, { scroll: player.equipped }); // Alert the client
        });
        socket.on(`trail`, (data) => { // Player requests an update to their trail
            if (typeof data === `undefined` || player == 0 || !player.docked || typeof data.trail !== `number`) return;

            if (data.trail == 0) player.trail = 0;
            if (data.trail == 1 && (player.killsAchs[12] || player.tag === `B`)) player.trail = 1;
            if (data.trail == 2 && (player.moneyAchs[11] || player.tag === `B`)) player.trail = 2;
            if (data.trail == 3 && (player.driftAchs[11] || player.tag === `B`)) player.trail = 3;
            if (data.trail == 4 && (player.randmAchs[10] || player.tag === `B`)) player.trail = 4;
            if (data.trail == 5 && (player.tag === `B` || player.tag === `O` || player.tag === `A`)) player.trail = 5;
            if (player.tag === `V` || player.tag === `B` || player.tag === `O` || player.tag === `A`) player.trail += 16;
        });
    });
};
