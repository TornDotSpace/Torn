/***********************************************************
 * 
 *              TORN ACCOUNT CONVERTER
 *   Converts legacy torn.space flatfiles into MongoDB format
 * 
 ***********************************************************/

var MONGO_CONNECTION_STR = "mongodb://localhost:27017/torn";
var Mongo = require('mongodb').MongoClient(MONGO_CONNECTION_STR, { useUnifiedTopology: true });
var PLAYERS_DIR = "../server/players";

global.parseBoolean = function (s) {
	return (s === 'true');
}


// legacy loader
async function writePlayer(player, _id, db) {
    var record = {
        _id: _id,
        color: player.color,
        ship: player.ship,
        weapons: player.weapons,
        name: player.name,
        trail: player.trail,
        money: player.money,
        kills: player.kills,
        planetsClaimed: player.planetsClaimed,
        iron: player.iron,
        silver: player.silver,
        platinum: player.platinum,
        aluminium: player.aluminium,
        experience: player.experience,
        rank: player.rank,
        thrust2: player.thrust2,
        radar2: player.radar2,
        agility2: player.agility2,
        capacity2: player.capacity2,
        maxHealth2: player.maxHealth2,
        energy2: player.energy2,
        killsAchs: player.killsAchs,
        baseKills: player.baseKills,
        oresMined: player.oresMined,
        moneyAchs: player.moneyAchs,
        questsDone: player.questsDone,
        driftTimer: player.driftTimer,
        driftAchs: player.driftAchs,
        cornersTouched: player.cornersTouched,
        lastLogin: player.lastLogin,
        randmAchs: player.randmAchs,
        lives: player.lives,
        password: player.password,
        sx: player.sx,
        sy: player.sy
    };

    await db.save(record);
    console.log("Saved: " + player.name);
}


function loadPlayerData(playerName, passwordHash) {
    if (!playerName || !passwordHash) return;

    // Read the old fashion way 
    var readSource = PLAYERS_DIR + "/" + playerName + "[" + passwordHash + ".txt";
    if (!fs.existsSync(readSource))
        return null;

    var player = new Player( { id: 0 });
    player._id = playerName;
    player.password = passwordHash;
    var fileData = fs.readFileSync(readSource, "utf8").split(':');
    player.color = fileData[0];
    player.ship = parseFloat(fileData[1]);
    for (var i = 0; i < 9; i++) player.weapons[i] = parseFloat(fileData[3 + i]);
    player.weapons[9] = parseFloat(fileData[83]);
    player.sx = Math.floor(parseFloat(fileData[12]));
    player.sy = Math.floor(parseFloat(fileData[13]));
    player.name = fileData[14];
    player.trail = parseFloat(fileData[2]) % 16 + (player.name.includes(" ") ? 16 : 0);
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
    player.thrust2 = Math.max(1, parseFloat(fileData[26]));
    player.radar2 = Math.max(1, parseFloat(fileData[27]));
    if (fileData.length > 87) player.agility2 = Math.max(1, parseFloat(fileData[87]));
    player.capacity2 = Math.max(1, parseFloat(fileData[28]));
    player.maxHealth2 = Math.max(1, parseFloat(fileData[29]));
    player.energy2 = parseFloat(fileData[84]);
    if (!(player.energy2 > 0)) player.energy2 = 1; //test undefined
    player.killsAchs[0] = parseBoolean(fileData[30]);
    player.killsAchs[1] = parseBoolean(fileData[31]);
    player.killsAchs[2] = parseBoolean(fileData[32]);
    player.killsAchs[3] = parseBoolean(fileData[33]);
    player.killsAchs[4] = parseBoolean(fileData[34]);
    player.killsAchs[5] = parseBoolean(fileData[35]);
    player.killsAchs[6] = parseBoolean(fileData[36]);
    player.killsAchs[7] = parseBoolean(fileData[37]);
    player.killsAchs[8] = parseBoolean(fileData[38]);
    player.killsAchs[9] = parseBoolean(fileData[39]);
    player.killsAchs[10] = parseBoolean(fileData[40]);
    player.killsAchs[11] = parseBoolean(fileData[41]);
    player.baseKills = parseFloat(fileData[42]);
    player.oresMined = parseFloat(fileData[43]);
    player.moneyAchs[0] = parseBoolean(fileData[44]);
    player.moneyAchs[1] = parseBoolean(fileData[45]);
    player.moneyAchs[2] = parseBoolean(fileData[46]);
    player.moneyAchs[3] = parseBoolean(fileData[47]);
    player.moneyAchs[4] = parseBoolean(fileData[48]);
    player.moneyAchs[5] = parseBoolean(fileData[49]);
    player.moneyAchs[6] = parseBoolean(fileData[50]);
    player.moneyAchs[7] = parseBoolean(fileData[51]);
    player.moneyAchs[8] = parseBoolean(fileData[52]);
    player.moneyAchs[9] = parseBoolean(fileData[53]);
    player.moneyAchs[10] = parseBoolean(fileData[54]);
    player.moneyAchs[11] = parseBoolean(fileData[55]);
    player.questsDone = parseFloat(fileData[56]);
    player.driftTimer = parseFloat(fileData[57]);
    player.driftAchs[0] = parseBoolean(fileData[58]);
    player.driftAchs[1] = parseBoolean(fileData[59]);
    player.driftAchs[2] = parseBoolean(fileData[60]);
    player.driftAchs[3] = parseBoolean(fileData[61]);
    player.driftAchs[4] = parseBoolean(fileData[62]);
    player.driftAchs[5] = parseBoolean(fileData[63]);
    player.driftAchs[6] = parseBoolean(fileData[64]);
    player.driftAchs[7] = parseBoolean(fileData[65]);
    player.driftAchs[8] = parseBoolean(fileData[66]);
    player.driftAchs[9] = parseBoolean(fileData[67]);
    player.driftAchs[10] = parseBoolean(fileData[68]);
    player.driftAchs[11] = parseBoolean(fileData[69]);
    player.cornersTouched = parseFloat(fileData[70]);
    player.randmAchs[0] = parseBoolean(fileData[71]);
    player.randmAchs[1] = parseBoolean(fileData[72]);
    player.randmAchs[2] = parseBoolean(fileData[73]);
    player.randmAchs[3] = parseBoolean(fileData[74]);
    player.randmAchs[4] = parseBoolean(fileData[75]);
    player.randmAchs[5] = parseBoolean(fileData[76]);
    player.randmAchs[6] = parseBoolean(fileData[77]);
    player.randmAchs[7] = parseBoolean(fileData[78]);
    player.randmAchs[8] = parseBoolean(fileData[79]);
    player.randmAchs[9] = parseBoolean(fileData[80]);
    player.randmAchs[10] = parseBoolean(fileData[81]);
    player.lives = parseFloat(fileData[82]);

    // Last login support
    if (fileData.length > 86) {
        player.lastLogin = new Date(parseInt(fileData[86]));
    }

    return player;
}

// Player object

function Player(sock) {
    var self = {

        type: "Player",

        name: "ERR0",
        id: sock.id, // unique identifier
        socket: sock,
        password: "password",
        ip: 0,
        trail: 0,
        color: sock.id > .5 ? 'red' : 'blue',
        ship: 0,
        experience: 0,
        rank: 0,

        guest: false,
        dead: false,
        docked: false,

        //misc timers
        noDrift: 50, // A timer used for decelerating angular momentum
        afkTimer: 25 * 60 * 30, // check for afk
        jukeTimer: 0,
        hyperdriveTimer: -1,
        borderJumpTimer: 0, // for deciding whether to hurt the player
        planetTimer: 0,
        leaveBaseShield: 0,
        empTimer: -1,
        disguise: -1,
        timer: 0,
        gyroTimer: 0,
        charge: 0,

        chatTimer: 100,
        muteCap: 250,
        globalChat: 0,

        weapons: {}, // my equipped weapons and ammo counts
        ammos: {},
        bulletQueue: 0, // For submachinegun (5 bullet bursts)

        sx: 0, // sector
        sy: 0,
        x: 2 / 2,
        y: 2 / 2,
        vx: 0,
        vy: 0,
        cva: 0,
        angle: 0,
        speed: 0,
        driftAngle: 0,

        money: 8000,
        kills: 0,
        killStreakTimer: -1,
        killStreak: 0,
        baseKills: 0,

        shield: false,
        generators: 0,
        isLocked: false,
        lives: 20,
        quest: 0,
        health: 1,

        iron: 0,
        silver: 0,
        platinum: 0,
        aluminium: 0,

        //bot stuff
        brainwashedBy: 0, // for enslaved bots
        deleteRate: .0005,
        net: 0, // where the neural network is stored
        isBot: false,
        isNNBot: false,

		/* please don't touch these
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

        thrust: 1, // These are techs multiplied by ship stats, used for actual physics
        va: 1,
        capacity: 1,
        maxHealth: 2,

        thrust2: 1, // these just track the player tech levels
        radar2: 1,
        agility2: 1,
        capacity2: 1,
        maxHealth2: 1,
        energy2: 1,

        w: false, // what keys are pressed currently
        s: false,
        a: false,
        d: false,
        e: false,
        c: false,
        space: false,

        reply: "nobody", // last person to pm / who pmed me

        killsAchs: {}, // 13 of em
        moneyAchs: {}, // 12
        driftAchs: {}, // 12
        randmAchs: {}, // 12

        //various achievement stuff
        driftTimer: 0, // How many ticks this account has been drifting.
        cornersTouched: 0, // bitmask
        oresMined: 0, // bitmask
        questsDone: 0, // bitmask
        planetsClaimed: "0000000000000000000000000000000000000000000000000",
        lastLogin: "A long, long time ago :(",
        points: 0,

        email: "",
        permissionLevels: [-1],
        equipped: 0
    };

    return self;
}

const fs = require('fs');

function main() {
    Mongo.connect(function (err, client) {
        var db = client.db('torn');
        var player_db = db.collection('players');

        fs.readdirSync(PLAYERS_DIR).forEach(file => {
            var stat = fs.statSync(PLAYERS_DIR + "/" + file);

            if (!stat.isDirectory()) {
                console.log("Beginning conversion of: " + file);

                var f_str = file.split("[");
    
                var player_name = f_str[0];
                var player_hash = f_str[1].split(".txt")[0];
    
                console.log("Got player (" + player_name + "," + player_hash + ")");

                var player = loadPlayerData(player_name, player_hash);

                // Don't convert players who aren't rank 1 or higher
                if (player.rank > 0) {
                    writePlayer(player, player_name, player_db);
                } else {
                    console.log("Skipping player " + player_name + " because they are < rank 1");
                }
            }
        });
    });
}

main();