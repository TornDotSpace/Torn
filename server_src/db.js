var MONGO_CONNECTION_STR = Config.getValue("mongo_connection_string", "mongodb://localhost:27017/torn");
var PLAYER_DATABASE = null;
var USE_MONGO = Config.getValue("want_mongo_db", false);

var Mongo = require('mongodb').MongoClient;
var fs = require('fs');

// TODO: Implement failover in the event we lose connection
// to MongoDB
global.connectToDB = function() {
    if (!USE_MONGO) {
        console.log("[DB] Using legacy flat-file based database");
        return;
    }

    if (PLAYER_DATABASE != null) {
        console.log("[DB] Already connected to MongoDB database...");
        return;
    }

    console.log("[DB] Connecting to MongoDB instance @ " + MONGO_CONNECTION_STR);
    Mongo.connect(MONGO_CONNECTION_STR, function (err, client) {
        if (err) {
            console.log("[DB] Connection failed! (ERROR: " + err + ")");
            return;
        }

        PLAYER_DATABASE = client.db('torn').collection('players');
        console.log("[DB] Connection successful!");
    });
}

global.loadPlayerData = async function(player, passwordHash) {
    if (!player) return;
    if (player.isBot || player.guest) return;

    // Check if player exists in MongoDB (if we're using MongoDB)
    var record = (USE_MONGO) ? await PLAYER_DATABASE.findOne({_id: player.name}) : null;

    if (record != null) {
        if (record["password"] !== passwordHash) {
            console.log(record["password"]);
            console.log(passwordHash);
            return -1; // Invalid credentials
        }
        for (key in record) {
            player[key] = record[key];
        }

        player.lastLogin = new Date(player.lastLogin);
    } else {
        // Read the old fashion way 
        var readSource = "server/players/" + player.name + "[" + passwordHash + ".txt";
        if (!fs.existsSync(readSource)) {
            return -1; // Invalid credentials
        } else {
            var fileData = fs.readFileSync(readSource, "utf8").split(':');
            player.color = fileData[0];
            player.ship = parseFloat(fileData[1]);
            for(var i = 0; i < 9; i++) player.weapons[i] = parseFloat(fileData[3+i]);
            player.weapons[9] = parseFloat(fileData[83]);
            player.sx = Math.floor(parseFloat(fileData[12]));
            player.sy = Math.floor(parseFloat(fileData[13]));
            if(player.sx > mapSz - 1) player.sx = mapSz - 1;
            if(player.sy > mapSz - 1) player.sy = mapSz - 1;
            player.name = fileData[14];
            player.trail = parseFloat(fileData[2]) % 16 + (player.name.includes(" ")?16:0);
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
            player.thrust2 = Math.max(1,parseFloat(fileData[26]));
            player.radar2 = Math.max(1,parseFloat(fileData[27]));
            if(fileData.length > 87) player.agility2 = Math.max(1,parseFloat(fileData[87]));
            player.capacity2 = Math.max(1,parseFloat(fileData[28]));
            player.maxHealth2 = Math.max(1,parseFloat(fileData[29]));
            player.energy2 = parseFloat(fileData[84]);
            if(!(player.energy2 > 0)) player.energy2 = 1; //test undefined
            player.kill1 = parseBoolean(fileData[30]);
            player.kill10 = parseBoolean(fileData[31]);
            player.kill100 = parseBoolean(fileData[32]);
            player.kill1k = parseBoolean(fileData[33]);
            player.kill10k = parseBoolean(fileData[34]);
            player.kill50k = parseBoolean(fileData[35]);
            player.kill1m = parseBoolean(fileData[36]);
            player.killBase = parseBoolean(fileData[37]);
            player.kill100Bases = parseBoolean(fileData[38]);
            player.killFriend = parseBoolean(fileData[39]);
            player.killCourier = parseBoolean(fileData[40]);
            player.suicide = parseBoolean(fileData[41]);
            player.baseKills = parseFloat(fileData[42]);
            player.oresMined = parseFloat(fileData[43]);
            player.mined = parseBoolean(fileData[44]);
            player.allOres = parseBoolean(fileData[45]);
            player.mined3k = parseBoolean(fileData[46]);
            player.mined15k = parseBoolean(fileData[47]);
            player.total100k = parseBoolean(fileData[48]);
            player.total1m = parseBoolean(fileData[49]);
            player.total100m = parseBoolean(fileData[50]);
            player.total1b = parseBoolean(fileData[51]);
            player.packageTaken = parseBoolean(fileData[52]);
            player.quested = parseBoolean(fileData[53]);
            player.allQuests = parseBoolean(fileData[54]);
            player.goldTrail = parseBoolean(fileData[55]);
            player.questsDone = parseFloat(fileData[56]);
            player.driftTimer = parseFloat(fileData[57]);
            player.dr0 = parseBoolean(fileData[58]);
            player.dr1 = parseBoolean(fileData[59]);
            player.dr2 = parseBoolean(fileData[60]);
            player.dr3 = parseBoolean(fileData[61]);
            player.dr4 = parseBoolean(fileData[62]);
            player.dr5 = parseBoolean(fileData[63]);
            player.dr6 = parseBoolean(fileData[64]);
            player.dr7 = parseBoolean(fileData[65]);
            player.dr8 = parseBoolean(fileData[66]);
            player.dr9 = parseBoolean(fileData[67]);
            player.dr10 = parseBoolean(fileData[68]);
            player.dr11 = parseBoolean(fileData[69]);
            player.cornersTouched = parseFloat(fileData[70]);
            player.ms0 = parseBoolean(fileData[71]);
            player.ms1 = parseBoolean(fileData[72]);
            player.ms2 = parseBoolean(fileData[73]);
            player.ms3 = parseBoolean(fileData[74]);
            player.ms4 = parseBoolean(fileData[75]);
            player.ms5 = parseBoolean(fileData[76]);
            player.ms6 = parseBoolean(fileData[77]);
            player.ms7 = parseBoolean(fileData[78]);
            player.ms8 = parseBoolean(fileData[79]);
            player.ms9 = parseBoolean(fileData[80]);
            player.ms10 = parseBoolean(fileData[81]);
            player.lives = parseFloat(fileData[82]);

            // Last login support
            if (fileData.length > 86) {
                player.lastLogin = new Date(parseInt(fileData[86]));
            }
        }
    }

    return 0;
}

global.resetPassword = function(player) {
  var temp = console.log(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  var hash = passwor
};

global.savePlayerData = function(player) {
    if (!player) return;

    var spawnX = ((player.sx==Math.floor(mapSz/2) && player.sx == player.sy)?(player.color === "blue"?4:2):player.sx);
    var spawnY = ((player.sx==Math.floor(mapSz/2) && player.sx == player.sy)?(player.color === "blue"?4:2):player.sy);

    // Check if we're using legacy flat files
    if (!USE_MONGO) {
        var source = 'server/players/' + (player.name.startsWith("[")?player.name.split(" ")[1]:player.name) + "[" + player.password + '.txt';
		if (fs.existsSync(source)) fs.unlinkSync(source);
		var weapons = "";
		for(var i = 0; i < 9; i++) weapons += player.weapons[i] + ":";
		var str = player.color + ':' + player.ship + ':' + player.trail + ':' + weapons + /*no ":", see prev line*/ spawnX + ':' + spawnY + ':' + player.name + ':' + player.money + ':' + player.kills + ':' + player.planetsClaimed + ':' + player.iron + ':' + player.silver + ':' + player.platinum + ':' + player.aluminium + ':' + player.experience + ':' + player.rank + ':' + player.x + ':' + player.y + ':' + player.thrust2 + ':' + player.radar2 + ':' + player.capacity2 + ':' + player.maxHealth2 + ":";
		str+=player.kill1+":"+player.kill10+":"+player.kill100+":"+player.kill1k+":"+player.kill10k+":"+player.kill50k+":"+player.kill1m+":"+player.killBase+":"+player.kill100Bases+":"+player.killFriend+":"+player.killCourier+":"+player.suicide+":"+player.baseKills+":";
		str+=player.oresMined+":"+player.mined+":"+player.allOres+":"+player.mined3k+":"+player.mined15k+":"+player.total100k+":"+player.total1m+":"+player.total100m+":"+player.total1b+":"+player.packageTaken+":"+player.quested+":"+player.allQuests+":"+player.goldTrail+":"+player.questsDone+":";
		str+=player.driftTimer+":"+player.dr0+":"+player.dr1+":"+player.dr2+":"+player.dr3+":"+player.dr4+":"+player.dr5+":"+player.dr6+":"+player.dr7+":"+player.dr8+":"+player.dr9+":"+player.dr10+":"+player.dr11+":";
		str+=player.cornersTouched+":true:"/*ms0, acct made.*/+player.ms1+":"+player.ms2+":"+player.ms3+":"+player.ms4+":"+player.ms5+":"+player.ms6+":"+player.ms7+":"+player.ms8+":"+player.ms9+":"+player.ms10+":"+player.lives + ":" + player.weapons[9] + ":" + player.energy2 + ":nodecay:";
		str+=new Date().getTime()+":"+player.agility2; //reset timer
		fs.writeFileSync(source, str, {"encoding":'utf8'});
        return;
    }

    var record = {
        _id:player.name,
        lastLogin:new Date().getTime(),
        weapon9:player.weapons[9],

        spawnX: spawnX,
        spawnY: spawnY,

        color:player.color,
        ship:player.ship,
        weapons:player.weapons,
        name:player.name,
        password:player.password,
        money:player.money,
        kills:player.kills,

        iron:player.iron,
        silver:player.silver,
        platinum:player.platinum,
        aluminium:player.aluminium,
        experience:player.experience,
        rank:player.rank,

        thrust2:player.thrust2,
        radar2:player.radar2,
        agility2:player.agility2,
        capacity2:player.capacity2,
        maxHealth2:player.maxHealth2,
        energy2:"nodecay",

        lives: player.lives,

        x:player.x,
        y:player.y,

        sx:player.sx,
        sy:player.sy,

        trail:player.trail,

        kill1:player.kill1,//First Blood
        kill10:player.kill10,//Private
        kill100:player.kill100,//Specialist
        kill1k:player.kill1k,//Corporal
        kill10k:player.kill10k,//Sergeant
        kill50k:player.kill50k,//General
        kill1m:player.kill1m,//Warlord
        killBase:player.killBase,//Invader
        kill100Bases:player.kill100Bases,//conqueror
        killFriend:player.killFriend,//Double Agent
        killCourier:player.killCourier,//Gone Postal
        suicide:player.suicide,//kms
        bloodTrail:player.bloodTrail,//Shinigami (scythe) XXX

        oresMined:player.oresMined,
        questsDone:player.questsDone,

        mined:player.mined,
        allOres:player.allOres,
        mined3k:player.mined3k,
        mined15k:player.mined15k,
        total100k:player.total100k,//High Rollin
        total1m:player.total1m,//Millionaire
        total100m:player.total100m,//That's a lot of digits
        total1b:player.total1b,//Billionaire
        packageTaken:player.packageTaken,//Freeloader
        quested:player.quested,//Community Service
        allQuests:player.allQuests,//Adventurer XXX
        goldTrail:player.goldTrail,//Affluenza XXX

        driftTimer:player.driftTimer,

        dr0:player.dr0,//Shift To Drift
        dr1:player.dr1,//Tofu Guy (1 min total)
        dr2:player.dr2,//Paper Cup (10 min total)
        dr3:player.dr3,//Takumi (1 hr total)
        dr4:player.dr4,//Bunta (10 hr total)
        dr5:player.dr5,//Turbodrift
        dr6:player.dr6,//Hyperdrift
        dr7:player.dr7,//Oversteer (Reverse drift)
        dr8:player.dr8,//Inertia Drift (BH drift)
        dr9:player.dr9,//Driftkill
        dr10:player.dr10,//Spinout (Reverse Drift + turbo)
        dr11:player.dr11,//Panda AE86 XXXxxxxxxxxxxxxxxxxxxxxxx

        cornersTouched:player.cornersTouched,
        planetsClaimed:player.planetsClaimed,

        ms0:player.ms0,//Go AFK
        ms1:player.ms1,//Die
        ms2:player.ms2,//Risky Business
        ms3:player.ms3,//Sucked In
        ms4:player.ms4,//Oops...
        ms5:player.ms5,//Boing!
        ms6:player.ms6,//Corner XXX
        ms7:player.ms7,//4 Corners XXX
        ms8:player.ms8,//Claim a planet
        ms9:player.ms9,//Claim every planet XXX
        ms10:player.ms10,//Random Trail XXX

        email:player.email // Player email for password resets, etc.
    };

    PLAYER_DATABASE.save(record, function() { });
}