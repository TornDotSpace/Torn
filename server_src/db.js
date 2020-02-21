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

global.checkRegistered = async function (name) {
    var record = await PLAYER_DATABASE.findOne({_id : name });
    
    return record == null;
}

global.loadPlayerData = async function (playerName, passwordHash, socket) {
    if (!playerName || !passwordHash) return;

    // Check if player exists in MongoDB (if we're using MongoDB)
    var record = await PLAYER_DATABASE.findOne({ _id: playerName });

    if (record == null || record["password"] !== passwordHash) {
        return { error: -1}; // Invalid credentials
    }

    var player = new Player(socket);

    for (key in record) {
        player[key] = record[key];
    }

    player.lastLogin = new Date(player.lastLogin);

    return {error: 0, player : player};
}

global.resetPassword = function (player) {
    var temp = debug(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
    var hash = passwor
};

global.savePlayerData = function (player) {
    var record = {
        _id: player._id,
        color: player.color,
        ship : player.ship,
        weapons : player.weapons,
        name : player.name,
        trail : player.trail,
        money : player.money,
        kills : player.kills,
        planetsClaimed : player.planetsClaimed,
        iron : player.iron,
        silver : player.silver,
        platinum : player.platinum,
        aluminium : player.aluminium,
        experience : player.experience,
        rank : player.rank,
        thrust2 : player.thrust2,
        radar2 : player.radar2,
        agility2 : player.agility2,
        capacity2 : player.capacity2,
        maxHealth2 : player.maxHealth2,
        energy2 : player.energy2,
        killsAchs : player.killsAchs,
        baseKills : player.baseKills,
        oresMined : player.oresMined,
        moneyAchs : player.moneyAchs,
        questsDone : player.questsDone,
        driftTimer : player.driftTimer,
        driftAchs : player.driftAchs,
        cornersTouched : player.cornersTouched,
        lastLogin : player.lastLogin,
        randomAchs : player.randomAchs,
        lives : player.lives,
        password : player.password,
        sx : player.sx,
        sy : player.sy
    };
    PLAYER_DATABASE.save(record, console.log);
}
