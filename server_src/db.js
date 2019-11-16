var Player = require("./player.js");
var MONGO_CONNECTION_STR = Config.getValue("mongo_connection_string", "mongodb://localhost:27017/torn");
var PLAYER_DATABASE = null;
var TURRET_DATABASE = null;
var Mongo = require('mongodb').MongoClient;

// TODO: Implement failover in the event we lose connection
// to MongoDB
global.connectToDB = function () {
    if (PLAYER_DATABASE != null) {
        log("[DB] Already connected to MongoDB database...");
        return;
    }

    log("[DB] Connecting to MongoDB instance @ " + MONGO_CONNECTION_STR);

    Mongo.connect(MONGO_CONNECTION_STR, function (err, client) {
        if (err) {
            log("[DB] Connection failed! (ERROR: " + err + ")");
            return;
        }

        var db = client.db('torn');
        PLAYER_DATABASE = db.collection('players');
        TURRET_DATABASE = db.collection('turrets');
        log("[DB] Connection successful!");
    });
}

global.loadPlayerData = async function (playerName, passwordHash, socket) {
    if (!playerName || !passwordHash) return;

    // Check if player exists in MongoDB (if we're using MongoDB)
    var record = (USE_MONGO) ? await PLAYER_DATABASE.findOne({ _id: playerName }) : null;

    if (record != null) {
        if (record["password"] !== passwordHash) {
            return { error: -1}; // Invalid credentials
        }

        var player = new Player(socket);

        for (key in record) {
            player[key] = record[key];
        }

        player.lastLogin = new Date(player.lastLogin);

        return {error: 0, player : player};
    } else {
        // Read the old fashion way 
        var readSource = "server/players/" + playerName + "[" + passwordHash + ".txt";
        if (!fs.existsSync(readSource)) {
            return { error : -1 }; // Invalid credentials
        } else {
            var player = new Player(socket);
            var fileData = fs.readFileSync(readSource, "utf8").split(':');
            player.color = fileData[0];
            player.ship = parseFloat(fileData[1]);
            for (var i = 0; i < 9; i++) player.weapons[i] = parseFloat(fileData[3 + i]);
            player.weapons[9] = parseFloat(fileData[83]);
            player.sx = Math.floor(parseFloat(fileData[12]));
            player.sy = Math.floor(parseFloat(fileData[13]));
            if (player.sx > mapSz - 1) player.sx = mapSz - 1;
            if (player.sy > mapSz - 1) player.sy = mapSz - 1;
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

            player.permissionLevels = [0];
            if (player.name.includes("O")) player.permissionLevels.push(30); // they're capital, it's fine
            if (player.name.includes("A")) player.permissionLevels.push(20);
            if (player.name.includes("M")) player.permissionLevels.push(10);
            if (player.name.includes("B")) player.permissionLevels.push(7);
            if (player.name.includes("V")) player.permissionLevels.push(5);
            if (player.name.includes("Y")) player.permissionLevels.push(3);
            return { error: 0, player: player };
        }
    }

    return { error: 2 };
}

global.resetPassword = function (player) {
    var temp = debug(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
    var hash = passwor
};

global.savePlayerData = function (player) {
    var record = {
        _id: player._id,
        lastLogin: new Date().getTime(),
        weapon9: player.weapons[9],

        color: player.color,
        ship: player.ship,
        weapons: player.weapons,
        name: player.name,
        password: player.password,
        money: player.money,
        kills: player.kills,

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
        energy2: "nodecay",

        lives: player.lives,

        x: player.x,
        y: player.y,

        sx: player.sx,
        sy: player.sy,

        trail: player.trail,

        kill1: player.killsAchs[0],
        kill10: player.killsAchs[1],
        kill100: player.killsAchs[2],
        kill1k: player.killsAchs[3],
        kill10k: player.killsAchs[4],
        kill50k: player.killsAchs[5],
        kill1m: player.killsAchs[6],
        killBase: player.killsAchs[7],
        kill100Bases: player.killsAchs[8],
        killFriend: player.killsAchs[9],
        killCourier: player.killsAchs[10],
        suicide: player.killsAchs[11],
        bloodTrail: player.killsAchs[12],

        oresMined: player.oresMined,
        questsDone: player.questsDone,

        mined: player.moneyAchs[0],
        allOres: player.moneyAchs[1],
        mined3k: player.moneyAchs[2],
        mined15k: player.moneyAchs[3],
        total100k: player.moneyAchs[4],//High Rollin
        total1m: player.moneyAchs[5],//Millionaire
        total100m: player.moneyAchs[6],//That's a lot of digits
        total1b: player.moneyAchs[7],//Billionaire
        packageTaken: player.moneyAchs[8],//Freeloader
        quested: player.moneyAchs[9],//Community Service
        allQuests: player.moneyAchs[10],//Adventurer XXX
        goldTrail: player.moneyAchs[11],//Affluenza XXX

        driftTimer: player.driftTimer,

        dr0: player.driftAchs[0],//Shift To Drift
        dr1: player.driftAchs[1],//Tofu Guy (1 min total)
        dr2: player.driftAchs[2],//Paper Cup (10 min total)
        dr3: player.driftAchs[3],//Takumi (1 hr total)
        dr4: player.driftAchs[4],//Bunta (10 hr total)
        dr5: player.driftAchs[5],//Turbodrift
        dr6: player.driftAchs[6],//Hyperdrift
        dr7: player.driftAchs[7],//Oversteer (Reverse drift)
        dr8: player.driftAchs[8],//Inertia Drift (BH drift)
        dr9: player.driftAchs[9],//Driftkill
        dr10: player.driftAchs[10],//Spinout (Reverse Drift + turbo)
        dr11: player.driftAchs[11],//Panda AE86 XXXxxxxxxxxxxxxxxxxxxxxxx

        cornersTouched: player.cornersTouched,
        planetsClaimed: player.planetsClaimed,

        ms0: player.randmAchs[0],//Go AFK
        ms1: player.randmAchs[1],//Die
        ms2: player.randmAchs[2],//Risky Business
        ms3: player.randmAchs[3],//Sucked In
        ms4: player.randmAchs[4],//Oops...
        ms5: player.randmAchs[5],//Boing!
        ms6: player.randmAchs[6],//Corner XXX
        ms7: player.randmAchs[7],//4 Corners XXX
        ms8: player.randmAchs[8],//Claim a planet
        ms9: player.randmAchs[9],//Claim every planet XXX
        ms10: player.randmAchs[10],//Random Trail XXX

        email: player.email // Player email for password resets, etc.
    };
    PLAYER_DATABASE.save(record, console.log);
}
