var fs = require('fs');

var Filter = require('bad-words'); // bad-words node package
var filter = new Filter();
var Player = require('./player.js');
require('./netutils.js');
require("./command.js");

var guestCount = 0; // Enumerate guests since server boot

// Global mute table 
global.muteTable = {};

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
        if (command.permission > player.permissionLevel) {
            player.socket.emit("chat", { msg: "~`red~`You don't have permission to access this command. ~`red~`" });
            return;
        }
        command.invoke(player, msg);
    }
}

var onlineNames = {};

module.exports = function initNetcode() {
    var port = process.argv[2];
    console.log("");
    for (var i = 0; i < 5; i++)console.log("=== STARTING SERVER ON PORT " + port + " ===");

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

    var io = require('socket.io')(server, {
        serveClient: false,
        origins: "*:*"
    });

    io.sockets.on('connection', function (socket) {
        var instance = false;
        socket.id = Math.random();
        sockets[socket.id] = socket;

        var ip = Config.getValue("want-xreal-ip", true)
            ? socket.handshake.headers['x-real-ip']
            : socket.handshake.address;
        console.log(ip + " Connected!");
        if (!flood(ip)) return;

        var player = 0;

        var socket_color = 0; // the color of this socket, only used for when spawning a guest for the first time.


        socket.on('lore', function (data) { //player is requesting lore screen.
            if (typeof data === "undefined" || typeof data.alien !== "boolean") return;
            socket_color = data.alien; // note whether they want to be alien for when they spawn
            socket.binary(false).emit("lored", { pc: socket_color });
        });

        socket.on('guest', function (data) { // TODO Chris
            if (!flood(ip)) return;
            if (instance) return;
            player = new Player(socket);
            socket.player = player;
            player.guest = true;
            instance = true;
            player.ip = ip;
            player.name = "GUEST " + guestCount;
            guestCount++;

            player.color = socket_color ? "red" : "blue";
            if (mapSz % 2 == 0) player.sx = player.sy = (socket_color ? (mapSz / 2 - 1) : (mapSz / 2));
            else player.sx = player.sy = (socket_color ? (mapSz / 2 - 1.5) : (mapSz / 2 + .5));
            for (var i = 0; i < ships[player.ship].weapons; i++) player.weapons[i] = -1;
            for (var i = ships[player.ship].weapons; i < 10; i++) player.weapons[i] = -2;
            player.weapons[0] = 0;
            socket.binary(false).emit("guested", {});
            player.sendStatus();
            player.getAllBullets();
            player.getAllPlanets();

            players[player.sy][player.sx][socket.id] = player;
            player.va = ships[player.ship].agility * .08 * player.agility2;
            player.thrust = ships[player.ship].thrust * player.thrust2;
            player.capacity = Math.round(ships[player.ship].capacity * player.capacity2);
            player.maxHealth = player.health = Math.round(ships[player.ship].health * player.maxHealth2);
            socket.binary(false).emit('sectors', { sectors: sectors });
            sendWeapons(player);
            socket.binary(false).emit("raid", { raidTimer: raidTimer })

            chatAll("Welcome " + player.name + " to the universe!");
        });
        socket.on('register', function (data) { // TODO Chris
            if (typeof data === "undefined") return;
            if (!flood(ip)) return;
            // Block registrations being triggered from non-guests or unconnected accounts
            // Fixes some registration spam and crash exploits

            if (!player) return;
            if (!player.guest) return;

            var user = data.user, pass = data.pass;

            if (typeof user !== "string" || user.length > 16 || user.length < 4 || /[^a-zA-Z0-9]/.test(user)) {
                socket.binary(false).emit("invalidReg", { reason: 2 });
                return;
            }
            user = user.toLowerCase();
            if (typeof pass !== "string" || pass.length > 32 || pass.length < 1) {
                socket.binary(false).emit("invalidReg", { reason: 3 });
                return;
            }

            // Test for profanity
            if (filter.isProfane(user)) {
                socket.binary(false).emit("invalidReg", { reason: 5 });
                return;
            }

            var valid = true;
            // TODO: FIX FOR MONGODB
            fs.readdir('server/players/', function (err, items) {
                for (var i = 0; i < items.length; i++) {
                    if (items[i].startsWith(user + "[")) {
                        debug(items[i] + ":" + (user + "["));
                        socket.binary(false).emit("invalidReg", { reason: 4 });
                        valid = false;
                        break;
                    }
                }

                if (!valid) return;
                var playerDocked = dockers[socket.id];
                if (typeof playerDocked === "undefined") return;

                player.name = user;
                player.password = hash(pass);
                player.guest = false;
                player.permissionLevel = 0;
                socket.binary(false).emit("registered", { user: data.user, pass: data.pass });
                var text = user + ' registered!';
                console.log(text);
                player.save();
                delete dockers[player.id];
                onlineNames[user] = 1;
                instance = false;
            });
            socket.binary(false).emit("raid", { raidTimer: raidTimer })
        });
        socket.on('login', async function (data) {
            if (typeof data === "undefined" || typeof data.amNew !== "boolean") return;

            if (!flood(ip)) return;
            if (instance) return;
            //Validate and save IP
            var name = data.user, pass = data.pass;
            if (typeof name !== "string" || name.length > 16 || name.length < 4 || /[^a-zA-Z0-9_]/.test(name)) {
                socket.binary(false).emit("invalidCredentials", {});
                return;
            }
            if (typeof pass !== "string" || pass.length > 32 || pass.length < 1) {
                socket.binary(false).emit("invalidCredentials", {});
                return;
            }
            name = name.toLowerCase();

            if (onlineNames[name] === 1) {
                socket.binary(false).emit("accInUse", {});
                return;
            }

            player = new Player(socket);
            socket.player = player;
            player.ip = ip;
            player.name = name;
            player.password = hash(data.pass);

            //Load account
            var retCode = await loadPlayerData(player, player.password);
            debug("retCode: " + retCode);
            if (retCode != 0) {
                if (retCode == -1) {
                    socket.binary(false).emit("invalidCredentials", {});
                }

                return;
            }

            instance = true;

            onlineNames[name] = 1;
            socket.binary(false).emit("loginSuccess", {});


            if (player.sx >= mapSz) player.sx--;
            if (player.sy >= mapSz) player.sy--;

            players[player.sy][player.sx][socket.id] = player;

            player.calculateGenerators();
            socket.binary(false).emit("raid", { raidTimer: raidTimer })
            player.checkTrailAchs();
            player.sendAchievementsKill(false);
            player.sendAchievementsCash(false);
            player.sendAchievementsDrift(false);
            player.sendAchievementsMisc(false);
            player.sendStatus();

            player.getAllBullets();
            player.getAllPlanets();
            player.refillAllAmmo();
            console.log(ip + " logged in as " + name + "! (last login: " + player.lastLogin + ")");
            var text = "~`" + player.color + "~`" + player.name + '~`yellow~` logged in!';
            chatAll(text);
            player.va = ships[player.ship].agility * .08 * player.agility2;
            player.thrust = ships[player.ship].thrust * player.thrust2;
            player.capacity = Math.round(ships[player.ship].capacity * player.capacity2);
            player.maxHealth = player.health = Math.round(ships[player.ship].health * player.maxHealth2);
            if (!data.amNew) socket.binary(false).emit('sectors', { sectors: sectors });
            sendWeapons(player);
        });
        socket.on('disconnect', function (data) { // graceful disconnect
            lefts[socket.id] = 150; // note that this player has left and queue it for deletion

            //try to locate the player object from their ID
            if (player == 0) return;

            //If the player is indeed found
            var text = "~`" + player.color + "~`" + player.name + "~`yellow~` left the game!"; // write a message about the player leaving
            console.log(text); // print in terminal
            chatAll(text); // send it to all the players
            onlineNames[player.name] = 0;
            //DO NOT save the player's data.
        });
        socket.on('pingmsg', function (data) { // when the player pings to tell us that it's still connected
            if (typeof data === "undefined") return;
            // We don't need to check that data.time is well-defined.
            if (player == 0) return; // if player can't be found

            socket.binary(false).emit('reping', { time: data.time });
            player.pingTimer = 250; // make sure they dont get disconnected.
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
            if (typeof data === "undefined" || typeof data.msg !== 'string' || data.msg.length == 0 || data.msg.length > 128) return;

            if (player == 0) return;

            if (guestsCantChat && player.guest) {
                socket.binary(false).emit("chat", { msg: 'You must create an account in the base before you can chat!', color: 'yellow' });
                return;
            }

            console.log("[CHAT] " + player.name + ": " + data.msg); // print their raw message

            data.msg = data.msg.trim(); // "   hi   " => "hi"
            if (!player.name.includes(" ")) data.msg = data.msg.replace(/~`/ig, ''); // Normies can't triforce
            data.msg = filter.clean(data.msg); // censor

            var time = Date.now();

            if (muteTable[player.name] > time) return;
            delete muteTable[player.name];

            player.chatTimer += 100; // note this as potential spam
            if (player.chatTimer > 600) { // exceeded spam limit: they are now muted
                socket.binary(false).emit('chat', { msg: ("~`red~`You have been muted for " + Math.floor(player.muteCap / 25) + " seconds!") });
                muteTable[player.name] = time + (Math.floor(player.muteCap / 25) * 1000);
                player.muteCap *= 2; // their next mute will be twice as long
                return;
            }

            if (data.msg.startsWith("/")) {//handle commands
                runCommand(player, data.msg);
            } else { // otherwise send the text
                var spaces = "";
                for (var i = player.name.length; i < 16; i++) spaces += " "; // align the message
                const finalMsg = "~`" + player.color + "~`" + spaces + player.name + "~`yellow~`: " + data.msg;
                if (player.globalChat == 0) sendAll('chat', { msg: finalMsg });//sendTeam(player.color, 'chat', {msg:finalMsg});
            }
        });
        socket.on('toggleGlobal', function (data) { // player wants to switch what chat room they're in
            if (player == 0) return;
            player.globalChat = (player.globalChat + 1) % 2;
        });
        socket.on('sell', function (data) { // selling ore
            if (typeof data === "undefined" || player == 0 || !player.docked || typeof data.item !== 'string' || !player.docked) return;

            //pay them appropriately
            if (data.item == 'iron' || data.item == 'all') {
                player.money += player.iron * (player.color == "red" ? 1 : 2);
                player.iron = 0;
            } if (data.item == 'silver' || data.item == 'all') {
                player.money += player.silver * 1.5;
                player.silver = 0;
            } if (data.item == 'platinum' || data.item == 'all') {
                player.money += player.platinum * (player.color == "blue" ? 1 : 2);
                player.platinum = 0;
            } if (data.item == 'aluminium' || data.item == 'all') {
                player.money += player.aluminium * 1.5;
                player.aluminium = 0;
            }

            player.save();

        });
        socket.on('buyShip', function (data) { // client wants to buy a new ship
            if (typeof data === "undefined" || player == 0 || !player.docked || typeof data.ship !== 'number') return;

            data.ship = Math.floor(data.ship); // the ship index must be integer. It must be no higher than your rank, and cannot be your current ship or out of bounds.
            if (data.ship > player.rank || data.ship < 0 || data.ship > ships.length || data.ship == player.ship) return;

            var price = ships[player.ship].price * -.75; // refund them .75x their own ship's price.
            price += ships[data.ship].price;
            if (player.money < price) return; // if it cannot be afforded

            //sell all ore
            player.money += (player.aluminium + player.platinum + player.silver + player.iron) * 1.5; // TODO this is wrong.
            player.aluminium = player.iron = player.silver = player.platinum = 0;

            player.money -= price; // charge them money
            player.ship = data.ship; // Give them the next ship

            player.va = ships[data.ship].agility * .08 * player.agility2; // TODO this is going to be redone
            player.thrust = ships[data.ship].thrust * player.thrust2;
            player.maxHealth = Math.round(player.health = ships[data.ship].health * player.maxHealth2);
            player.capacity = Math.round(ships[data.ship].capacity * player.capacity2);

            player.equipped = 0; // set them as being equipped on their first weapon
            socket.binary(false).emit('equip', { scroll: player.equipped });

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
            if (!player.docked || player.weapons[data.slot] != -1 || player.money < wepns[data.weapon].price || wepns[data.weapon].Level > player.ship) return;

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
                    if (player.money >= Math.round(Math.pow(1024, player.radar2) / 1000) * 1000) {
                        player.money -= Math.round(Math.pow(1024, player.radar2) / 1000) * 1000;
                        player.radar2 += .2;
                    }
                    break;
                case 2: // cargo
                    if (player.money >= Math.round(Math.pow(1024, player.capacity2) / 1000) * 1000) {
                        player.money -= Math.round(Math.pow(1024, player.capacity2) / 1000) * 1000;
                        player.capacity2 += .2;
                        player.capacity = Math.round(ships[player.ship].capacity * player.capacity2);
                    }
                    break;
                case 3:
                    if (player.maxHealth2 > 3.99) {
                        player.maxHealth2 = 4;
                        break;
                    } // hull
                    if (player.money >= Math.round(Math.pow(1024, player.maxHealth2) / 1000) * 1000) {
                        player.money -= Math.round(Math.pow(1024, player.maxHealth2) / 1000) * 1000;
                        player.maxHealth2 += .2
                        player.maxHealth = Math.round(ships[player.ship].health * player.maxHealth2);
                    }
                    break;
                case 4: // energy
                    if (player.money >= Math.round(Math.pow(4096, player.energy2) / 1000) * 1000) {
                        player.money -= Math.round(Math.pow(4096, player.energy2) / 1000) * 1000;
                        player.energy2 += .2;
                    }
                    break;
                case 5: // agility
                    if (player.money >= Math.round(Math.pow(1024, player.agility2) / 1000) * 1000) {
                        player.money -= Math.round(Math.pow(1024, player.agility2) / 1000) * 1000;
                        player.agility2 += .2;
                        player.va = ships[player.ship].agility * .08 * player.agility2;
                    }
                    break;
                default: //0: thrust
                    if (player.money >= Math.round(Math.pow(1024, player.thrust2) / 1000) * 1000) {
                        player.money -= Math.round(Math.pow(1024, player.thrust2) / 1000) * 1000;
                        player.thrust2 += .2;
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
            var quest = (player.color === "red" ? rQuests : bQuests)[qid];

            //You need to have unlocked this quest type.
            if (quest == 0 || (quest.type === "Base" && player.rank < 7) || (quest.type === "Secret" && player.rank <= 14)) return;

            if (((quest.dsx == 3 && quest.dsy == 3) || (quest.sx == 3 && quest.sy == 3)) && !player.randmQuest[2]) { // risky business
                player.randmQuest[2] = true;
                player.sendAchievementsMisc(true);
            }

            if (player.color === "red") rQuests[qid] = 0; else bQuests[qid] = 0; // note that quest as taken and queue it to be remade. TODO can we just remake it here?
            player.quest = quest; // give them the quest and tell the client.
            socket.binary(false).emit('quest', { quest: quest });

        });
        /*socket.on('cancelquest',function(data){ // THIS IS NO LONGER ALLOWED.
            var player = dockers[socket.id];
            if(typeof player === "undefined")
                return;
            player.quest = 0;
            socket.binary(false).emit('quest', {quest: player.quest});
        }); // no longer allowed.*/
        socket.on('equip', function (data) { // Player wants to select a new weapon to hold
            if (player == 0 || typeof data === "undefined" || typeof player === "undefined" || typeof data.scroll !== 'number' || data.scroll >= ships[player.ship].weapons) return;

            player.equipped = Math.floor(data.scroll); // Set their equipped weapon
            if (player.equipped < 0) player.equipped = 0; // Ensure it's in range
            else if (player.equipped > 9) player.equipped = 9;

            socket.binary(false).emit('equip', { scroll: player.equipped }); // Alert the client
        });
        socket.on('trail', function (data) { // Player requests an update to their trail
            if (typeof data === "undefined" || player == 0 || !player.docked || typeof data.trail !== 'number') return;

            if (data.trail == 0) player.trail = 0;
            if (data.trail == 1 && player.killsAchs[12]) player.trail = 1;
            if (data.trail == 2 && player.moneyAchs[11]) player.trail = 2;
            if (data.trail == 3 && player.driftAchs[11]) player.trail = 3;
            if (data.trail == 4 && player.randmAchs[11]) player.trail = 4;
            if (player.name.includes(" ")) player.trail += 16;

        });
    });
}