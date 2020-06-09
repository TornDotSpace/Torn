var Player = require('./player.js');
var fs = require('fs');

class Bot extends Player {
    constructor(id) {
        super({ id: id, emit: function () { } });
        this.isBot = true;
    }
    botPlay() { // don't mess with this pls
        if (tick % 8 != Math.floor(this.id * 8)) return; // Lag prevention, also makes the bots a bit easier
        if (this.empTimer > 0) return;//cant move if i'm emp'd

        this.equipped = 0;
        while (this.ammos[this.equipped] == 0) this.equipped++; // select the first available weapon with ammo
        var range = square(wepns[this.equipped].range * 10);

        this.w = this.e = this.s = this.c = this.space = false; // release all keys

        //Find closest enemy and any friendly in the sector
        var target = 0, close = 100000000;
        var anyFriend = 0;
        var friendlies = 0, enemies = 0;//keep track of the player counts in the sector
        for (var p in players[this.sy][this.sx]) {
            var player = players[this.sy][this.sx][p];
            if (this.id == player.id || player.disguise > 0) continue;
            if (player.color === this.color) { friendlies++; continue; }
            enemies++;
            var dist2 = hypot2(player.x, this.x, player.y, this.y);
            if (dist2 < close) {

                // Nerf bots 
                // Allow only low bots (0-3) to attack guests
                // Bots will avoid attack players where the player is 7 or more levels lower than it
                var nerfAmt = (player.guest) ? -4 : -7;

                if (player.rank - this.rank <= nerfAmt) continue;

                target = player; close = dist2;

            }

        }

        //Move towards the enemy
        var movex = 0, movey = 0;
        if (target != 0) { movex = target.x - this.x; movey = target.y - this.y; }

        var base = bases[this.sy][this.sx];
        if (base != 0 && base.color != this.color) {
            var dist2 = hypot2(base.x, this.x, base.y, this.y);
            if (friendlies > 0 && enemies == 0) target = base;
            else if (dist2 < square(10 * sectorWidth / 2)) { movex = this.x - base.x; movey = this.y - base.y; }
        }

        //at random, fill my ammo or die if there are no enemies to fight
        if (enemies == 0 && Math.random() < .001) this.refillAllAmmo();
        if (enemies == 0 && Math.random() < botDespawnRate) this.die();

        if (target == 0) target = anyFriend;

        if (movex == 0 && movey == 0 && anyFriend == 0) {//flocking
            this.d = Math.random() < .1;
            this.a = Math.random() < .1;
            this.w = true;
            if (this.brainwashedBy != 0) {
                var player = players[this.sy][this.sx][this.brainwashedBy];
                if (typeof player === "undefined") return;
                var myX = this.x + this.sx * sectorWidth;
                var myY = this.y + this.sy * sectorWidth;
                var theirX = player.x + player.sx * sectorWidth;
                var theirY = player.y + player.sy * sectorWidth;
                var turn = -(this.angle - Math.atan2(theirY - myY, theirX - myX) + Math.PI * 21) % (2 * Math.PI) + Math.PI;
                this.d = turn > this.cva * this.cva * 10;
                this.a = turn < -this.cva * this.cva * 10;
            }
        } else if (target == 0) {//escaping base
            var turn = -(this.angle - Math.atan2(base.y - this.y, base.x - this.x) + Math.PI * 21) % (2 * Math.PI) + Math.PI;
            this.a = turn > this.cva * this.cva * 10;
            this.d = turn < -this.cva * this.cva * 10;
            this.w = true;
        } else if (anyFriend != 0 || (this.health < this.maxHealth / 3.5)) {//fleeing
            var turn = -(this.angle - Math.atan2(target.y - this.y, target.x - this.x) + Math.PI * 21) % (2 * Math.PI) + Math.PI;
            this.a = turn > this.cva * this.cva * 10;
            this.d = turn < -this.cva * this.cva * 10;
            this.w = this.s = true;
        } else {//fighting
            this.space = this.e = close < range * 1.2;
            var turn = -(this.angle - calculateInterceptionAngle(target.x, target.y, target.vx, target.vy, this.x, this.y, wepns[this.equipped].speed) + Math.PI * 21) % (2 * Math.PI) + Math.PI;
            this.d = turn > this.cva * this.cva * 10;
            this.a = turn < -this.cva * this.cva * 10;
            this.s = this.space && Math.abs(turn) > Math.PI / 2 && close > Math.min(range * .75, 60 * 60);
            this.w = Math.abs(turn) < Math.PI / 2 && close > Math.min(range * .75, 60 * 60);
        }
    }
}

class NeuralNetBot extends Bot {
    constructor(id) {
        super(id);
        this.isNNBot = true;
    }

    botPlay() {
        //Play for a neural network bot
        if (tick % 8 != Math.floor(this.id * 8)) return; //Don't go too crazy running the whole network each tick. Lag prevention.

        if (this.net === 1) { // If we haven't yet initialized a neural net
            this.net = new NeuralNet();
            this.net.load();
        }

        if (this.empTimer > 0) return;//cant move if i'm emp'd

        this.equipped = 0; // select first weapon with ammo
        while (this.ammos[this.equipped] == 0) this.equipped++;
        var range = square(wepns[this.equipped].range * 10);

        var totalFriends = 0; // in sector
        var totalEnemies = 0;
        var sumFriendRank = 0; // sum of ranks of all friends in this sector. Not using yet.
        var sumEnemyRank = 0;

        //Find the closest friend and enemy
        var target = 0, friend = 0, closeE = 100000000, closeF = 100000000;
        for (var p in players[this.sy][this.sx]) {
            var player = players[this.sy][this.sx][p];
            if (this.id == player.id || player.disguise > 0) continue;
            if (player.color === this.color) {
                totalFriends++;
                var dist2 = squaredDist(player, this);
                if (dist2 < closeF) { friend = player; closeF = dist2; }
            } else {
                totalEnemies++;
                var dist2 = squaredDist(player, this);
                if (dist2 < closeE) { target = player; closeE = dist2; }
            }
        }

        //same as in botPlay
        if (totalEnemies == 0 && Math.random() < .005) this.refillAllAmmo();
        if (totalEnemies == 0 && Math.random() < botDespawnRate) this.die();

        //make input array (into neural net). Normalize the variables to prevent overflow
        var input = {};
        input[0] = this.rank / 8.;
        input[1] = this.ammos[this.equipped] / 50;
        input[2] = this.health / this.maxHealth;
        input[3] = 1; // energy used to be here
        input[4] = this.charge / 50;
        input[5] = this.speed / 100;
        input[6] = this.cva;

        input[7] = target == 0 ? 0 : 1;
        input[8] = target == 0 ? 0 : Math.atan2(target.y - this.y, target.x - this.x) - this.angle;
        input[9] = Math.sqrt(closeE) / 100;

        input[10] = friend == 0 ? 0 : 1;
        input[11] = friend == 0 ? 0 : Math.atan2(friend.y - this.y, friend.x - this.x) - this.angle;
        input[12] = Math.sqrt(closeF) / 100;

        input[13] = target == 0 ? 0 : target.angle;
        input[14] = target == 0 ? 0 : target.speed;
        input[15] = target == 0 ? 0 : target.ship;

        //forward NN
        var out = this.net.passThrough(input);

        //Set controls to output array
        this.space = out[0];
        this.e = out[1];
        this.w = out[2];
        this.s = out[3];
        this.a = out[4];
        this.d = out[5];
    }
}
var botNames = fs.readFileSync("./server_src/resources/botNames.txt").toString().split("\n");

global.spawnBot = function (sx, sy, col, force) {
	if (!Config.getValue("want-bots", true)) return;

	if (playerCount + botCount + guestCount > playerLimit && !force) return;
	
	if (sx < 0 || sy < 0 || sx >= mapSz || sy >= mapSz) return;

	if (trainingMode && Math.random() < .5) {
		spawnNNBot(sx, sy, col);
		return;
	}
	var id = Math.random();
	var bot = new Bot(id);
	bot.angle = Math.random()*Math.PI*2;
	bot.sx = sx;
	bot.sy = sy;
	var rand = 4.2 * Math.random();
	bot.experience = Math.sqrt(Math.pow(2, Math.pow(2, rand))-2)*sy*sy*sy + 3 * rand;
	bot.updateRank();
	bot.ship = bot.rank;
	bot.x = bot.y = sectorWidth / 2;
	bot.color = col;
	bot.name = Config.getValue("want_bot_names", false) ? "BOT " + botNames[Math.floor(Math.random() * (botNames.length))] : "DRONE";
	bot.thrust2 = bot.capacity2 = bot.maxHealth2 = bot.agility2 = Math.max(1, (Math.floor(rand * 2) * .2) + .6);
	bot.energy2 = Math.floor((bot.thrust2 - 1) * 5 / 2) / 5 + 1;
	bot.va = ships[bot.ship].agility * .08 * bot.agility2;
	bot.thrust = ships[bot.ship].thrust * bot.thrust2;
	bot.capacity = Math.round(ships[bot.ship].capacity * bot.capacity2);
	bot.maxHealth = bot.health = Math.round(ships[bot.ship].health * bot.maxHealth2);
	for (var i = 0; i < 10; i++) {
		do bot.weapons[i] = Math.floor(Math.random() * wepns.length);
		while (wepns[bot.weapons[i]].level > bot.rank || !wepns[bot.weapons[i]].bot)
	}
	bot.refillAllAmmo();
	players[bot.sy][bot.sx][id] = bot;
}

global.spawnNNBot = function (sx, sy, col) {
	if (trainingMode) { sx = 2; sy = 4; }
	if (sx < 0 || sy < 0 || sx >= mapSz || sy >= mapSz) return;
	id = Math.random();
	var bot = new NeuralNetBot(id);
	bot.sx = sx;
	bot.sy = sy;
	var rand = .33 + 3.67 * Math.random();
	bot.experience = trainingMode ? 150 : (Math.floor(Math.pow(2, Math.pow(2, rand))) / 8 + 3 * rand);//TODO change /8 to /4
	bot.updateRank();
	bot.ship = bot.rank;
	bot.x = trainingMode ? sectorWidth * Math.random() : (sectorWidth / 2);
	bot.y = trainingMode ? sectorWidth * Math.random() : (sectorWidth / 2);
	bot.color = col;
	bot.net = 1;
	bot.name = "BOT " + botNames[Math.floor(Math.random() * (botNames.length))];
	bot.angle = Math.random() * Math.PI * 2;
	bot.thrust2 = bot.capacity2 = bot.maxHealth2 = bot.agility2 = Math.max(1, (Math.floor(rand * 2) * .2) + .6);
	bot.energy2 = Math.floor((bot.thrust2 - 1) * 5 / 2) / 5 + 1;
	bot.va = ships[bot.ship].agility * .08 * bot.agility2;
	bot.thrust = ships[bot.ship].thrust * bot.thrust2;
	bot.capacity = Math.round(ships[bot.ship].capacity * bot.capacity2);
	bot.maxHealth = bot.health = Math.round(ships[bot.ship].health * bot.maxHealth2);
	for (var i = 0; i < 10; i++) {
		do bot.weapons[i] = Math.floor(Math.random() * wepns.length);
		while (wepns[bot.weapons[i]].level > bot.rank || !wepns[bot.weapons[i]].bot)
		if (trainingMode) bot.weapons[i] = 1;
	}
	bot.refillAllAmmo();
	players[bot.sy][bot.sx][id] = bot;
}
