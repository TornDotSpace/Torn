var fs = require('fs');

var Filter = require('bad-words'); // bad-words node package
var filter = new Filter();

filter.removeWords('god', 'hell', 'crap', 'flipping the bird', 'Lipshitz', 'Lipshits', 'polack', 'screwing', 'slut', 'sluts', 'hui', 'poop', 'screw');

var Player = require('./player.js');
require('./netutils.js');
require("./command.js");
var exec = require('child_process').execSync;
const msgpack = require('socket.io-msgpack-parser');

var guestCount = 0; // Enumerate guests since server boot

// Global mute table 
global.muteTable = {};

global.protocolVersion = undefined;

function flood(ip) {
    var safe = false;
    for (var i = 0; i < 20; i++) if (ip !== IPSpam[i]) {
        IPSpam[i] = ip;
        safe = true;
        break;
    }
    return safe;
}

global.hash = function (str) { // ass. TODO chris
    var hash = 0;
    if (str.length == 0) return hash;
    for (var i = 0; i < str.length; i++) {
        var ch = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + ch;
        hash &= hash;
    }
    return hash;
}


function expToLife(exp, guest) { // how much a life costs, given your exp and whether you're logged in
    return Math.floor(guest ? 0 : 200000 * (1 / (1 + Math.exp(-exp / 15000.)) + Math.atan(exp / 150000.) - .5)) + 500;
}

function runCommand(player, msg) { // player just sent msg in chat and msg starts with a /
    var toLower = msg.toLowerCase();
    var command = cmds[toLower.split(" ")[0]];
    if (command === undefined) {
        player.socket.emit("chat", { msg: "~`red~`Unknown Command. Use /help for a list of commands! ~`red~`" });
    } else {
        // Check for permissions
        var permitted = false;
        for(var p in player.permissionLevels){
            if (command.permissions.includes(player.permissionLevels[p])) {
                permitted = true;
                break;
            }
        }
        if(!permitted){
            player.socket.emit("chat", { msg: "~`red~`You don't have permission to access this command. ~`red~`" });
            return;
        }

        // Commands are probably one of the more bug-prone activities as they involve changing game state, et. al
        // Wrap their invocation in a try/catch block to avoid shard death on error
        try {
            command.invoke(player, msg);
        } catch (e) {
            player.socket.emit("chat", { msg: "~`red~`An internal error occurred while running this command, please report this to a developer ~`red~`" });
            console.error(e);
        }
    }
}

module.exports = function initNetcode() {
    var port = process.argv[2];
    console.log("");
    for (var i = 0; i < 5; i++) console.log("=== STARTING SERVER ON PORT " + port + " ===");

    const http = require("http");
    const https = require("https");

    const protocol = Config.getValue("want-tls", false) ? https : http;
    const key = Config.getValue("tls-key-path", null);
    const cert = Config.getValue("tls-cert-path", null);

    const options = (protocol === https) ? {
        key: (key != null) ? fs.readFileSync(key) : key,
        cert: (cert != null) ? fs.readFileSync(cert) : cert
    } : {};

    var server = (protocol == https) ?
        protocol.createServer(options)
        : protocol.createServer();

    server.listen(parseInt(port));


    // Try to grab the protocol version from the current git tag
    try {
        global.protocolVersion = exec('git tag -l --points-at HEAD').toString().trim();

        if (!global.protocolVersion)
            global.protocolVersion = undefined;
        console.log("Protocol Version: " + global.protocolVersion);
    } catch (e) {
        console.error("Failed to retrieve protocol version, all clients will be allowed!");
    }

    var socketio = require('socket.io');
    // https://github.com/socketio/engine.io/blob/c1448951334c7cfc5f1d1fff83c35117b6cf729f/lib/server.js    
    global.io = socketio(server, {
        serveClient: false,
        origins: "*:*",
        wsEngine: Config.getValue("ws-engine", "ws"),
        timeout: 500,
        parser: msgpack
    });

    io.sockets.on('connection', function (socket) {
        socket.start = Date.now();
        var instance = false;
        sockets[socket.id] = socket;

        var ip = Config.getValue("want-xreal-ip", true)
            ? socket.handshake.headers['x-real-ip']
            : socket.handshake.address;

        if (!flood(ip)) return;

        var player = 0;

        var socket_color = 0; // the color of this socket, only used for when spawning a guest for the first time.

        socket.io_on = socket.on;

        socket.on = function(the_event, listener) {
            socket.io_on(the_event, function(data) {
                try {
                    listener(data);
                } catch (err) {

                    // Log data to help us perform bug triage

                    console.error("Exception caught in player event " + the_event);

                    console.error("==== TORN.SPACE ERROR REPORT ====\n");
                    console.error("Error Time: " + new Date() + "\n");
                    console.error("Event: " + the_event + "\n");
                    console.error("Exception information: " + err + "\n");
                    console.error("Trace: " + err.stack + "\n");

                    // Eject the player from the game: we don't know if they're in a valid state
                    socket.emit("kick", { msg: "Internal server error." });
                    socket.disconnect();
                }
            });
        };

        socket.on('lore', function (data) { //player is requesting lore screen.
            if (typeof data === "undefined" || typeof data.alien !== "boolean") return;
            socket_color = data.alien; // note whether they want to be alien for when they spawn
            socket.emit("lored", { pc: socket_color });
        });

        socket.on('guest', function (data) { // TODO Chris
            if (!flood(ip)) return;
            if (instance) return;

            if (global.protocolVersion !== undefined) {
                // Verify client is running the same protocol implementation
                if (typeof data !== "string" || data.trim() !== global.protocolVersion) {
                    socket.emit('outdated', 0);
                    return;
                }
            }

            player = new Player(socket);
            socket.player = player;
            player.guest = true;
            instance = true;
            player.ip = ip;
            player.name = "GUEST" + guestCount;
            console.log(player.ip + " logged in as " + player.name);
            guestCount++;

            player.color = socket_color ? "red" : "blue";
            if (mapSz % 2 == 0) player.sx = player.sy = (socket_color ? (mapSz / 2 - 1) : (mapSz / 2));
            else player.sx = player.sy = (socket_color ? (mapSz / 2 - 1.5) : (mapSz / 2 + .5));
            for (var i = 0; i < ships[player.ship].weapons; i++) player.weapons[i] = -1;
            for (var i = ships[player.ship].weapons; i < 10; i++) player.weapons[i] = -2;
            player.weapons[0] = 0;
            socket.emit("guested", {id: player.id});
            player.sendStatus();
            
            player.getAllPlanets();

            players[player.sy][player.sx][socket.id] = player;
            player.va = ships[player.ship].agility * .08 * player.agility2;
            player.thrust = ships[player.ship].thrust * player.thrust2;
            player.capacity = Math.round(ships[player.ship].capacity * player.capacity2);
            player.maxHealth = player.health = Math.round(ships[player.ship].health * player.maxHealth2);
            sendWeapons(player);
            socket.emit("raid", { raidTimer: raidTimer });
            socket.emit('baseMap', {baseMap: baseMap});

            chatAll("Welcome " + player.name + " to the universe!");
        });
        socket.on('register', function (data) { // TODO Chris
            if (typeof data === "undefined") return;
            if (!flood(ip)) return;
            // Block registrations being triggered from non-guests or unconnected accounts
            // Fixes some registration spam and crash exploits

            if (!player) return;
            if (!player.guest) return;
            if (player.rank < 1) return;

            var user = data.user, pass = data.pass;

            if (typeof user !== "string" || user.length > 16 || user.length < 4 || /[^a-zA-Z0-9]/.test(user)) {
                socket.emit("invalidReg", { reason: 2 });
                return;
            }
            user = user.toLowerCase();
            if (typeof pass !== "string" || pass.length > 128 || pass.length < 6) {
                socket.emit("invalidReg", { reason: 3 });
                return;
            }

            // Test for profanity
            if (filter.isProfane(user)) {
                socket.emit("invalidReg", { reason: 5 });
                return;
            }
            
            player.guest = false;

            checkRegistered(user).then(function(ret) {

                if (!ret) {
                    player.guest = true;
                    socket.emit("invalidReg", { reason: 4});
                    return;
                }
                var playerDocked = dockers[socket.id];
                if (typeof playerDocked === "undefined") return;
                    
                player._id = user;
                player.name = user;
                player.password = hash(pass);
                player.permissionLevels=[0];
                socket.emit("registered", { user: data.user, pass: data.pass });
                var text = user + ' registered!';
                console.log(text);
                chatAll(text);
    
                player.save();
            });
        });

        socket.on('login', function (data) {
            if (typeof data === "undefined" || typeof data.amNew !== "boolean") return;

            if (!flood(ip)) return;
            if (instance) return;

            if (global.protocolVersion !== undefined) {
                // Verify client is running the same protocol implementation
                if (typeof data.version !== "string" || global.protocolVersion !== data.version.trim()) {
                    socket.emit('outdated', 0);
                    return;
                }
            }

            //Validate and save IP
            var name = data.user, pass = data.pass;

            if (typeof name !== "string" || name.length > 16 || name.length < 4 || /[^a-zA-Z0-9_]/.test(name)) {
                socket.emit("invalidCredentials", {});
                return;
            }
            if (typeof pass !== "string" || pass.length > 32 || pass.length < 1) {
                socket.emit("invalidCredentials", {});
                return;
            }

            name = name.toLowerCase();

            instance = true;

            //Load account
            var retCode = loadPlayerData(name, hash(data.pass), socket);
            retCode.then(function(ret) {
                if (ret.error != 0) {
                    if (ret.error == -1) socket.emit("invalidCredentials", {});
                    instance = false;
                    return;
                }

                player = ret.player;

                for (var p in sockets) {
                    if (sockets[p].player !== undefined) {
                        if (sockets[p].player.name === player.name) {
                            sockets[p].player.kick("A user has logged into this account from another location.");
                        }
                    }
                }
    
                socket.player = player;
                player.ip = ip;

                socket.emit("loginSuccess", {id: player.id});

                if (player.sx >= mapSz) player.sx--;
                if (player.sy >= mapSz) player.sy--;
    
                players[player.sy][player.sx][socket.id] = player;
                
                player.calculateGenerators();
                socket.emit("raid", { raidTimer: raidTimer })
                player.checkTrailAchs();
                player.sendAchievementsKill(false);
                player.sendAchievementsCash(false);
                player.sendAchievementsDrift(false);
                player.sendAchievementsMisc(false);
                player.sendStatus();
    
                player.getAllPlanets();
                player.refillAllAmmo();
                console.log(ip + " logged in as " + name + "! (last login: " + player.lastLogin + ")");
                var text = "~`" + player.color + "~`" + player.name + '~`yellow~` logged in!';
                chatAll(text);

                // Update last login
                player.lastLogin = Date.now();
                player.va = ships[player.ship].agility * .08 * player.agility2;
                player.thrust = ships[player.ship].thrust * player.thrust2;
                player.capacity = Math.round(ships[player.ship].capacity * player.capacity2);
                player.maxHealth = player.health = Math.round(ships[player.ship].health * player.maxHealth2);
                sendWeapons(player);
                socket.emit('baseMap', {baseMap: baseMap});
            });
        });
        socket.on('disconnect', function (data) { // Emitted by socket.IO when connection is terminated or ping timeout
            if (!player) return; // Don't allow unauthenticated clients to crash the server

            // Cleanup
            delete dockers[player.id];
            delete deads[player.id];
            delete sockets[socket.id];

            //If the player is indeed found
            var reason = player.kickMsg;

            if (reason === undefined || !reason.localeCompare("")) {
                reason = data;
            }

            var text = "~`" + player.color + "~`" + player.name + "~`yellow~` left the game (reason: " + reason + ")"; // write a message about the player leaving

            console.log(text); // print in terminal
            chatAll(text); // send it to all the players
            //DO NOT save the player's game data.

            // Kill socket
            socket.disconnect();

            // Delay deletion for 5 seconds
            setTimeout(function() {             
                delete players[player.sy][player.sx][player.id];
                delete socket;
                delete player; }, 6000);
        });

        socket.on('key', function (data) { // on client keypress or key release
            if (typeof data === "undefined" || typeof data.inputId === 'undefined' || typeof data.state === 'undefined') return;
            if (player == 0) return;

            player.afkTimer = 20 * 25 * 60; // 20 minutes till we kick them for being afk

            //if they want to be revived after dying
            if (player.dead && data.inputId === 'e') {
                player.dead = false;

                // Spawn was computed in die()
                players[player.sy][player.sx][player.id] = player;
                delete deads[player.id];
                player.sendStatus();
                return;
            }

            if (player.empTimer > 0) return; // if they're EMPed, don't bother accepting key inputs.

            if (data.inputId === 'e' && !player.docked) player.juke(false); // Q/E are juke keys
            if (data.inputId === 'q' && !player.docked) player.juke(true);

            if (data.inputId === 'w') player.w = data.state; // standard movement keys
            if (data.inputId === 's') player.s = data.state;
            if (data.inputId === 'a') player.a = data.state;
            if (data.inputId === 'd') player.d = data.state;
            if (data.inputId === 'c') player.c = data.state; // elite special slot
            if (data.inputId === ' ') player.space = data.state; // fire
            if (data.inputId === 'x') player.dock(); // x or esc to enter base
            if (data.inputId === 'shift') { // drift
                player.e = data.state;
                if (!data.state) player.checkDriftAchs(); // if they let go of the drift key
            }
        });
        socket.on('chat', function (data) { // when someone sends a chat message
            if (typeof data === "undefined" || typeof data.msg !== 'string' || data.msg.length > 128) return;

            data.msg = data.msg.trim(); // "   hi   " => "hi"

            if (player == 0 || data.msg.length == 0) return;

            if (guestsCantChat && player.guest) {
                socket.emit("chat", { msg: 'You must create an account in the base before you can chat!', color: 'yellow' });
                return;
            }

            console.log("[CHAT] " + player.name + ": " + data.msg); // print their raw message
            if (!player.name.includes("[")) data.msg = data.msg.replace(/`/ig, ''); // Normies can't triforce

            var time = Date.now();

            if (data.msg.startsWith("/") && !data.msg.startsWith("/me") && !data.msg.startsWith("/r") && !data.msg.startsWith("/pm ")) { runCommand(player, data.msg); return; } // non spammable commands

            if (muteTable[player.name] > time) return;
            delete muteTable[player.name];

            data.msg = filter.clean(data.msg); // censor
            
            if (data.msg.startsWith("/")) runCommand(player, data.msg); // spammable commands

            player.chatTimer += 100; // note this as potential spam
            if (player.chatTimer > 600) { // exceeded spam limit: they are now muted
                socket.emit('chat', { msg: ("~`red~`You have been muted for " + Math.floor(player.muteCap / 25) + " seconds!") });
                muteTable[player.name] = time + (Math.floor(player.muteCap / 25) * 1000);
                player.muteCap *= 2; // their next mute will be twice as long
                return;
            }

            if(!data.msg.startsWith("/")) { // otherwise send the text
                var spaces = "";
                for (var i = player.name.length; i < 16; i++) spaces += " "; // align the message
                const finalMsg = "~`" + player.color + "~`" + spaces + player.name + "~`yellow~`: " + data.msg;
                if (player.globalChat == 0) chatAll(finalMsg);//sendTeam(player.color, 'chat', {msg:finalMsg});
            }
        });
        socket.on('toggleGlobal', function (data) { // player wants to switch what chat room they're in
            if (player == 0) return;
            player.globalChat = (player.globalChat + 1) % 2;
        });
        socket.on('sell', function (data) { // selling ore
            if (typeof data === "undefined" || player == 0 || !player.docked || typeof data.item !== 'string') return;
            player.sellOre(data.item);
        });
        socket.on('buyShip', function (data) { // client wants to buy a new ship
            if (typeof data === "undefined" || player == 0 || !player.docked || typeof data.ship !== 'number') return;

            data.ship = Math.floor(data.ship); // the ship index must be integer. It must be no higher than your rank, and cannot be your current ship or out of bounds.
            if (data.ship > player.rank || data.ship < 0 || data.ship > ships.length || data.ship == player.ship) return;

            var price = ships[player.ship].price * -.75; // refund them .75x their own ship's price.
            price += ships[data.ship].price;
            if (player.money < price) return; // if it cannot be afforded

            player.sellOre("all"); //sell all ore, because their new ship may not have the cargo room to hold it all

            player.money -= price; // charge them money
            player.ship = data.ship; // Give them the new ship

            player.va = ships[data.ship].agility * .08 * player.agility2; // TODO this is going to be redone
            player.thrust = ships[data.ship].thrust * player.thrust2;
            player.maxHealth = Math.round(player.health = ships[data.ship].health * player.maxHealth2);
            player.capacity = Math.round(ships[data.ship].capacity * player.capacity2);

            player.equipped = 0; // set them as being equipped on their first weapon
            socket.emit('equip', { scroll: player.equipped });

            for (var i = 0; i < 10; i++) if (player.weapons[i] == -2 && i < ships[player.ship].weapons) player.weapons[i] = -1; // unlock new possible weapon slots
            player.calculateGenerators();
            sendWeapons(player);
            player.save();
        });
        socket.on('buyW', function (data) { // client wants to buy a weapon
            if (typeof data === "undefined" || player == 0 || !player.docked || typeof data.slot !== 'number' || typeof data.weapon !== 'number') return;

            data.slot = Math.floor(data.slot);
            data.weapon = Math.floor(data.weapon);
            if (data.slot < 0 || data.slot > 9 || data.weapon < 0 || data.weapon >= wepns.length) return; // if they sent out of bound variables

            // they cant buy when not docked. That slot must be unlocked. They need to have enough money. They need to have sufficiently high of a ship.
            if (!player.docked || player.weapons[data.slot] != -1 || player.money < wepns[data.weapon].price || wepns[data.weapon].level > player.ship) return;

            player.money -= wepns[data.weapon].price; // take their money
            player.weapons[data.slot] = data.weapon; // give them the weapon
            player.refillAllAmmo(); // give them ammo
            sendWeapons(player); // tell the client what they've been given
            player.calculateGenerators();
            player.save();
        });
        socket.on('buyLife', function (data) { // client wants to buy a life
            if (player == 0 || !player.docked || player.lives >= 20) return;
            var price = expToLife(player.experience, player.guest); // compute how much the life costs them
            if (player.money < price) return; // cant afford

            player.money -= price; // take money
            player.lives++; // give life
            player.sendStatus(); // tell the client about it
            player.save();
        });
        socket.on('upgrade', function (data) { // client wants to upgrade a tech
            //TODO im totally redoing this
            if (typeof data === "undefined" || player == 0 || !player.docked || typeof data.item !== 'number' || data.item > 5 || data.item < 0) return;
            var item = Math.floor(data.item);


            switch (item) {
                case 1: // radar
            		var price = techPrice(player.radar2);
                    if (player.money >= price) {
                        player.money -= price;
                        player.radar2 = nextTechLevel(player.radar2);
                    }
                    break;
                case 2: // cargo
            		var price = techPrice(player.capacity2);
                    if (player.money >= price) {
                        player.money -= price;
                        player.capacity2 = nextTechLevel(player.capacity2);
                        player.capacity = Math.round(ships[player.ship].capacity * player.capacity2);
                    }
                    break;
                case 3: //hull
            		var price = techPrice(player.maxHealth2);
                    if (player.money >= price) {
                        player.money -= price;
                        player.maxHealth2 = nextTechLevel(player.maxHealth2);
                        player.maxHealth = Math.round(ships[player.ship].health * player.maxHealth2);
                    }
                    break;
                case 4: // energy
            		var price = techPrice(player.energy2)*8;
                    if (player.money >= price) {
                        player.money -= price;
                        player.energy2 = nextTechLevel(player.energy2);
                    }
                    break;
                case 5: // agility
            		var price = techPrice(player.agility2);
                    if (player.money >= price) {
                        player.money -= price;
                        player.agility2 = nextTechLevel(player.agility2);
                        player.va = ships[player.ship].agility * .08 * player.agility2;
                    }
                    break;
                default: //0: thrust
            		var price = techPrice(player.thrust2);
                    if (player.money >= price) {
                        player.money -= price;
                        player.thrust2 = nextTechLevel(player.thrust2);
                        player.thrust = ships[player.ship].thrust * player.thrust2;
                    }
                    break;
            }
            player.save();
        });
        socket.on('sellW', function (data) { // wants to sell a weapon.
            if (typeof data === "undefined" || player == 0 || !player.docked || typeof data.slot !== 'number' || data.slot < 0 || data.slot > 9 || player.weapons[data.slot] < 0 || player.weapons[data.slot] > wepns.length - 1) return;

            data.slot = Math.floor(data.slot);
            if (!player.docked || player.weapons[data.slot] < 0) return; // can't sell what you don't have. or when you're not in base.
            player.money += wepns[player.weapons[data.slot]].price * .75; // refund them a good bit
            player.calculateGenerators();
            player.weapons[data.slot] = -1; // no weapon here anymore. TODO should this ever turn into -2?
            player.refillAllAmmo(); // remove their ammo
            sendWeapons(player); // alert client of transaction
            player.save();
        });
        socket.on('quest', function (data) { // wants to accept a quest
            if (typeof data === "undefined" || player == 0 || !player.docked || player.quest != 0 || typeof data.quest !== 'number' || data.quest < 0 || data.quest > 9) return;

            var qid = Math.floor(data.quest); // Find the correct quest.
            var quest = teamQuests[player.color][qid];

            //You need to have unlocked this quest type.
            if (quest == 0 || (quest.type === "Base" && player.rank < 7) || (quest.type === "Secret" && player.rank <= 14)) return;

            if (((quest.dsx == 3 && quest.dsy == 3) || (quest.sx == 3 && quest.sy == 3)) && !player.randmAchs[2]) { // risky business
                player.randmAchs[2] = true;
                player.sendAchievementsMisc(true);
            }

            teamQuests[player.color][qid] = 0;
            player.quest = quest; // give them the quest and tell the client.
            socket.emit('quest', { quest: quest });

        });
        /*socket.on('cancelquest',function(data){ // THIS IS NO LONGER ALLOWED.
            var player = dockers[socket.id];
            if(typeof player === "undefined")
                return;
            player.quest = 0;
            socket.emit('quest', {quest: player.quest});
        }); // no longer allowed.*/
        socket.on('equip', function (data) { // Player wants to select a new weapon to hold
            if (player == 0 || typeof data === "undefined" || typeof player === "undefined" || typeof data.scroll !== 'number' || data.scroll >= ships[player.ship].weapons) return;

            player.equipped = Math.floor(data.scroll); // Set their equipped weapon
            if (player.equipped < 0) player.equipped = 0; // Ensure it's in range
            else if (player.equipped > 9) player.equipped = 9;
            player.charge = Math.min(player.charge, 0); // to prevent scroll charge exploit

            socket.emit('equip', { scroll: player.equipped }); // Alert the client
        });
        socket.on('trail', function (data) { // Player requests an update to their trail
            if (typeof data === "undefined" || player == 0 || !player.docked || typeof data.trail !== 'number') return;

            if (data.trail == 0) player.trail = 0;
            if (data.trail == 1 && player.killsAchs[12]) player.trail = 1;
            if (data.trail == 2 && player.moneyAchs[11]) player.trail = 2;
            if (data.trail == 3 && player.driftAchs[11]) player.trail = 3;
            if (data.trail == 4 && player.randmAchs[10]) player.trail = 4;
            if (player.name.includes(" ")) player.trail += 16;

        });
    });
}
