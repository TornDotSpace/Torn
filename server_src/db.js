let PlayerMP = require("./player_mp.js");
let MONGO_CONNECTION_STR = Config.getValue("mongo_connection_string", "mongodb://localhost:27017/torn");
let PLAYER_DATABASE = null;
let TURRET_DATABASE = null;
let Mongo = require('mongodb').MongoClient(MONGO_CONNECTION_STR, { useUnifiedTopology: true })
let Base = require('./universe/base.js');

// TODO: Implement failover in the event we lose connection
// to MongoDB
global.connectToDB = function () {
    if (PLAYER_DATABASE != null) {
        console.log("[DB] Already connected to MongoDB database...");
        return;
    }

    console.log("[DB] Connecting to MongoDB instance @ " + MONGO_CONNECTION_STR);

    Mongo.connect(function (err, client) {
        if (err) {
            console.log("[DB] Connection failed! (ERROR: " + err + ")");
            return;
        }

        let db = client.db('torn');
        PLAYER_DATABASE = db.collection('players');
        TURRET_DATABASE = db.collection('turrets');

        loadTurretData();
        setTimeout(saveTurrets, 1000);
        console.log("[DB] Connection successful!");
    });
}

global.handlePlayerDeath = async function (player) {

    if (player.guest) return;
    
    let record = await PLAYER_DATABASE.findOne({_id: player._id});

    if (record == null) return;
    
    // Certain variables should NOT be reverted
    const persist = [ "lastLogin", "randAchs", "killAchs", "moneyAchs", "driftAchs", "planetsClaimed", "lives", "experience", "rank" ];
    for (let key in record) {
        if (key in persist) continue;

        player[key] = record[key];
    }

    player.experience *= .98;
    player.randmAchs[1] = true; // Death Achievement;
}

global.loadPlayerData = async function (playerName, socket) {
    
    let record = await PLAYER_DATABASE.findOne({ _id: playerName });
    let player = new PlayerMP(socket);

    for (let key in record) {
        if (key === "password" || key === "email") continue; // don't load passwords into memory
        player[key] = record[key];
    }

    if(bases[player.sy][player.sx] === 0 || bases[player.sy][player.sx].color != player.color) {
        player.sx = baseMap[player.color][0];
        player.sy = baseMap[player.color][1];
    }

    if(!(player.guild in guildPlayers)) player.guild = ""; // This accounts for players with old/undefined guilds 

    player.lastLogin = new Date(player.lastLogin); // this also exists in the login call in netcode, should we toss either?
    
    player.permissionLevels = [0];
    if (player.name.includes("O")) player.permissionLevels.push(30); // they're capital, it's fine
    if (player.name.includes("A")) player.permissionLevels.push(20);
    if (player.name.includes("M")) player.permissionLevels.push(10);
    if (player.name.includes("B")) player.permissionLevels.push(7);
    if (player.name.includes("V")) player.permissionLevels.push(5);
    if (player.name.includes("Y")) player.permissionLevels.push(3);

    return player;
}

global.saveTurret = function (turret) {
    let record = {
        id : turret.id,
        kills: turret.kills,
        experience: turret.experience,
        money: turret.money,
        color: turret.color,
        owner: turret.owner,
        x: turret.x,
        y: turret.y,
        sx: turret.sx,
        sy: turret.sy,
        name: turret.name
    };
    TURRET_DATABASE.replaceOne( { id : turret.id }, record, { upsert: true});
}

global.deleteTurret = function (turret) {
    TURRET_DATABASE.deleteOne( {_id: turret._id });
}

global.loadTurretData = async function() {
    console.log("\nLoading Turrets...");
    let items = await TURRET_DATABASE.find();

    items.forEach(i => {
        let b = new Base(0, false, 0, 0, 0, 0, 0);
        for (let x in i) {
            b[x] = i[x];
        }
        bases[b.sy][b.sx] = b;
        console.log("Turret (" + b.sy + "," + b.sx + ") loaded!");
    });
}

global.savePlayerEmail = function(player, email) {
    PLAYER_DATABASE.updateOne( {_id : player._id}, {$set : { "email" : email }}, {upsert : true});
}
global.savePlayerData = function (player) {
    let record = {
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
        copper : player.copper,
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
        randmAchs : player.randmAchs,
        lives : player.lives,
        guild : player.guild
    };
    PLAYER_DATABASE.updateOne( { _id: player._id }, {$set : record}, { upsert: true });
}