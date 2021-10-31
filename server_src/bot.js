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

const Player = require(`./player.js`);
const Package = require(`./universe/package.js`);
const fs = require(`fs`);

class Bot extends Player {
    constructor () {
        super();
        this.isBot = true;
        this.brainwashedBy = 0; // for enslaved bots
        this.rng = Math.random();
    }

    flock () {
        this.d = Math.random() < 0.1;
        this.a = Math.random() < 0.1;
        this.w = true;
    }

    goToOwner () {
        let owner = 0;
        for (let sy = 0; sy < mapSz; sy++) {
            for (let sx = 0; sx < mapSz; sx++) {
                if (this.brainwashedBy in players[sy][sx]) {
                    owner = players[sy][sx][this.brainwashedBy];
                    break;
                }
            }
        }
        if (typeof owner === `undefined` || owner === 0) {
            this.isBrainwashedBy = 0;
            return;
        }
        const myX = this.x + this.sx * sectorWidth; // Universal coordinates of this bot
        const myY = this.y + this.sy * sectorWidth;
        const theirX1 = owner.x + owner.sx * sectorWidth; // Coords of owner
        const theirY1 = owner.y + owner.sy * sectorWidth;
        const dist1 = hypot2(myX, theirX1, myY, theirY1);
        const theirX2 = owner.x + owner.sx - mapSz * sectorWidth; // Coords of owner, wrapped backwards one to handle left/right universe wrapping
        const theirY2 = owner.y + owner.sy - mapSz * sectorWidth;
        const dist2 = hypot2(myX, theirX2, myY, theirY2);
        const theirX3 = owner.x + owner.sx + mapSz * sectorWidth; // Coords of owner, wrapped forwards one
        const theirY3 = owner.y + owner.sy + mapSz * sectorWidth;
        const dist3 = hypot2(myX, theirX3, myY, theirY3);

        // Determine which way to wrap is fastest
        let finalX = theirX3;
        let finalY = theirY3;
        if (dist1 < dist2 && dist1 < dist3) {
            finalX = theirX1;
            finalY = theirY1;
        } else if (dist2 < dist3) {
            finalX = theirX2;
            finalY = theirY2;
        }

        const turn = -(this.angle - Math.atan2(finalY - myY, finalX - myX) + Math.PI * 21) % (2 * Math.PI) + Math.PI;
        this.d = turn > this.cva * this.cva * 10;
        this.a = turn < -this.cva * this.cva * 10;
        this.w = true;
    }

    flee (target) {
        const turn = -(this.angle - Math.atan2(target.y - this.y, target.x - this.x) + Math.PI * 21) % (2 * Math.PI) + Math.PI;
        this.a = turn > this.cva * this.cva * 10;
        this.d = turn < -this.cva * this.cva * 10;
        this.w = this.s = true;
    }

    fight (target, close) {
        const isBase = target.type === `Base`;
        const range = square(wepns[this.equipped].range * 10);
        this.space = this.e = close < range * 1.2 || isBase;
        const intercept = calculateInterceptionAngle(target.x, target.y, isBase ? 0 : target.vx, isBase ? 0 : target.vy, this.x, this.y, wepns[this.equipped].speed);
        const turn = -(this.angle - intercept + Math.PI * 21) % (2 * Math.PI) + Math.PI;
        this.d = turn > this.cva * this.cva * 10;
        this.a = turn < -this.cva * this.cva * 10;
        this.s = this.space && Math.abs(turn) > Math.PI / 2 && close > Math.min(range * 0.75, 60 * 60);
        this.w = Math.abs(turn) < Math.PI / 2 && close > Math.min(range * 0.75, 60 * 60);
    }

    botPlay () {
        if (tick % 8 != Math.floor(this.rng * 8)) return; // Lag prevention, also makes the bots a bit easier
        if (this.empTimer > 0) return; // cant move if i'm emp'd

        this.equipped = 0;
        while (this.ammos[this.equipped] == 0) this.equipped++; // select the first available weapon with ammo

        this.w = this.e = this.s = this.c = this.space = false; // release all keys

        // Find closest enemy and any friendly in the sector
        let target = 0; let close = 100000000;
        let friendlies = 0; let enemies = 0; // keep track of the player counts in the sector
        for (const p in players[this.sy][this.sx]) {
            const player = players[this.sy][this.sx][p];
            if (this.id == player.id || player.disguise > 0) continue;
            if (player.color === this.color) {
                friendlies++; continue;
            }
            enemies++;
            const dist2 = hypot2(player.x, this.x, player.y, this.y);
            if (dist2 < close) {
                target = player; close = dist2;
            }
        }

        // at random, fill my ammo or die if there are no enemies to fight
        if (enemies == 0 && Math.random() < 0.001) this.refillAllAmmo();
        let myDespawnRate = botDespawnRate;
        if (this.brainwashedBy !== 0) myDespawnRate /= 4;
        if (enemies == 0 && Math.random() < myDespawnRate) this.die();

        const base = bases[this.sy][this.sx];
        if (base != 0 && hypot2(base.x, this.x, base.y, this.y) < close * 3 + square(150) && base.color != this.color) {
            target = base; enemies++;
        }

        if (this.brainwashedBy !== 0 && (!(this.brainwashedBy in players[this.sy][this.sx]) || target == 0)) this.goToOwner();
        else if (target == 0) this.flock();
        else if (this.health < this.maxHealth / 5.5 && this.brainwashedBy === 0) this.flee(target);
        else this.fight(target, close);
    }

    async die (b) {
        delete players[this.sy][this.sx][this.id];
        if (b === undefined) {
            return;
        }
        const diff = 0.02 * this.experience;
        if (b.type !== `Vortex`) {
            // drop a package
            const r = Math.random();
            if (this.hasPackage && !this.isBot) packs[this.sy][this.sx][r] = new Package(this, r, 0); // an actual package (courier), only makes sense if this is not a bot
            else if (Math.random() < 0.012 && !this.guest) packs[this.sy][this.sx][r] = new Package(this, r, 2);// life
            else if (Math.random() < 0.1 && !this.guest) packs[this.sy][this.sx][r] = new Package(this, r, 3);// ammo
            else packs[this.sy][this.sx][r] = new Package(this, r, 1);// coin
        }

        // give the killer stuff
        if ((b.owner != 0) && (typeof b.owner !== `undefined`) && (b.owner.type === `Player` || b.owner.type === `Base`)) {
            b.owner.onKill(this);
            b.owner.spoils(`experience`, (10 + diff * (this.color === b.owner.color ? -1 : 1)));
            // Prevent farming and disincentivize targetting guests
            b.owner.spoils(`money`, b.owner.type === `Player` ? (b.owner.killStreak * playerKillMoney) : playerKillMoney);

            if (this.points > 0) { // raid points
                b.owner.points++;
            }
        }
    }
}

class NeuralNetBot extends Bot {
    constructor (id) {
        super(id);
        this.isNNBot = true;
    }

    botPlay () {
    // Play for a neural network bot
        if (tick % 8 != Math.floor(this.rng * 8)) return; // Don't go too crazy running the whole network each tick. Lag prevention.

        if (this.net === 1) { // If we haven't yet initialized a neural net
            this.net = new NeuralNet();
            this.net.load();
        }

        if (this.empTimer > 0) return;// cant move if i'm emp'd

        this.equipped = 0; // select first weapon with ammo
        while (this.ammos[this.equipped] == 0) this.equipped++;
        const range = square(wepns[this.equipped].range * 10);

        let totalFriends = 0; // in sector
        let totalEnemies = 0;
        const sumFriendRank = 0; // sum of ranks of all friends in this sector. Not using yet.
        const sumEnemyRank = 0;

        // Find the closest friend and enemy
        let target = 0; let friend = 0; let closeE = 100000000; let closeF = 100000000;
        for (const p in players[this.sy][this.sx]) {
            const player = players[this.sy][this.sx][p];
            if (this.id == player.id || player.disguise > 0) continue;
            if (player.color === this.color) {
                totalFriends++;
                const dist2 = squaredDist(player, this);
                if (dist2 < closeF) {
                    friend = player; closeF = dist2;
                }
            } else {
                totalEnemies++;
                const dist2 = squaredDist(player, this);
                if (dist2 < closeE) {
                    target = player; closeE = dist2;
                }
            }
        }

        // same as in botPlay
        if (totalEnemies == 0 && Math.random() < 0.005) this.refillAllAmmo();
        if (totalEnemies == 0 && Math.random() < botDespawnRate) this.die();

        // make input array (into neural net). Normalize the variables to prevent overflow
        const input = {};
        input[0] = this.rank / 8.0;
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

        // forward NN
        const out = this.net.passThrough(input);

        // Set controls to output array
        this.space = out[0];
        this.e = out[1];
        this.w = out[2];
        this.s = out[3];
        this.a = out[4];
        this.d = out[5];
    }
}
const botNames = fs.readFileSync(`./server_src/resources/botNames.txt`).toString().split(`\n`);

global.spawnBot = function (sx, sy, col, force) {
    if (!Config.getValue(`want-bots`, true)) return;

    if (playerCount + botCount + guestCount > playerLimit && !force) return;

    if (sx < 0 || sy < 0 || sx >= mapSz || sy >= mapSz) return;

    if (trainingMode && Math.random() < 0.5) {
        spawnNNBot(sx, sy, col);
        return;
    }

    const bot = new Bot();
    bot.angle = Math.random() * Math.PI * 2;
    bot.sx = sx;
    bot.sy = sy;
    const rand = 4 * Math.random();
    bot.experience = Math.sqrt(Math.pow(2, Math.pow(2, rand)) - 2) * 100 + 3 * rand;
    bot.updateRank();
    bot.ship = Math.min(bot.rank, 21);
    bot.x = bot.y = sectorWidth / 2;
    bot.color = col;
    bot.name = Config.getValue(`want_bot_names`, false) ? `BOT ${botNames[Math.floor(Math.random() * (botNames.length))]}` : `DRONE`;
    bot.thrust2 = bot.capacity2 = bot.maxHealth2 = bot.agility2 = Math.max(1, (Math.floor(rand * 2) * 0.25) + 0.7);
    bot.energy2 = Math.floor((bot.thrust2 - 1) * 5 / 2) / 5 + 1;
    bot.va = ships[bot.ship].agility * 0.08 * bot.agility2;
    bot.thrust = ships[bot.ship].thrust * bot.thrust2;
    bot.capacity = Math.round(ships[bot.ship].capacity * bot.capacity2);
    bot.maxHealth = bot.health = Math.round(ships[bot.ship].health * bot.maxHealth2);
    const keys = Object.keys(wepns);
    for (let i = 0; i < 10; i++) {
        do bot.weapons[i] = keys[Math.floor(Math.random() * keys.length)];
        while (wepns[bot.weapons[i]].level > bot.rank || !wepns[bot.weapons[i]].bot);
    }
    bot.refillAllAmmo();
    players[bot.sy][bot.sx][bot.id] = bot;
};

global.spawnBaseBot = function (sx, sy, x, y, col, force) {
    if (!Config.getValue(`want-bots`, true)) return;

    if (playerCount + botCount + guestCount > playerLimit && !force) return;

    if (sx < 0 || sy < 0 || sx >= mapSz || sy >= mapSz) return;

    if (trainingMode && Math.random() < 0.5) {
        spawnNNBot(sx, sy, col);
        return;
    }

    const bot = new Bot();
    bot.angle = Math.random() * Math.PI * 2;
    bot.sx = sx;
    bot.sy = sy;
    const rand = 4 * Math.random();
    bot.experience = Math.sqrt(Math.pow(2, Math.pow(2, rand)) - 2) * 100 + 3 * rand;
    bot.updateRank();
    bot.ship = Math.min(bot.rank, 21);
    bot.x = x;
    bot.y = y;
    bot.color = col;
    bot.name = Config.getValue(`want_bot_names`, false) ? `BOT ${botNames[Math.floor(Math.random() * (botNames.length))]}` : `DRONE`;
    bot.thrust2 = bot.capacity2 = bot.maxHealth2 = bot.agility2 = Math.max(1, (Math.floor(rand * 2) * 0.25) + 0.7);
    bot.energy2 = Math.floor((bot.thrust2 - 1) * 5 / 2) / 5 + 1;
    bot.va = ships[bot.ship].agility * 0.08 * bot.agility2;
    bot.thrust = ships[bot.ship].thrust * bot.thrust2;
    bot.capacity = Math.round(ships[bot.ship].capacity * bot.capacity2);
    bot.maxHealth = bot.health = Math.round(ships[bot.ship].health * bot.maxHealth2);
    const keys = Object.keys(wepns);
    for (let i = 0; i < 10; i++) {
        do bot.weapons[i] = keys[Math.floor(Math.random() * keys.length)];
        while (wepns[bot.weapons[i]].level > bot.rank || !wepns[bot.weapons[i]].bot);
    }
    bot.refillAllAmmo();
    players[bot.sy][bot.sx][bot.id] = bot;
};

global.spawnPlayerBot = function (sx, sy, x, y, col, force, ship) {
    if (!Config.getValue(`want-bots`, true)) return;

    if (playerCount + botCount + guestCount > playerLimit && !force) return;

    if (sx < 0 || sy < 0 || sx >= mapSz || sy >= mapSz) return;

    if (trainingMode && Math.random() < 0.5) {
        spawnNNBot(sx, sy, col);
        return;
    }

    const bot = new Bot();
    bot.angle = Math.random() * Math.PI * 2;
    bot.sx = sx;
    bot.sy = sy;
    const rand = 4 * Math.random();
    bot.experience = Math.sqrt(Math.pow(2, Math.pow(2, rand)) - 2) * 100 + 3 * rand;
    bot.updateRank();
    bot.ship = ship;
    bot.x = x;
    bot.y = y;
    bot.color = col;
    bot.name = Config.getValue(`want_bot_names`, false) ? `BOT ${botNames[Math.floor(Math.random() * (botNames.length))]}` : `DRONE`;
    bot.thrust2 = bot.capacity2 = bot.maxHealth2 = bot.agility2 = Math.max(1, (Math.floor(rand * 2) * 0.25) + 0.7);
    bot.energy2 = Math.floor((bot.thrust2 - 1) * 5 / 2) / 5 + 1;
    bot.va = ships[bot.ship].agility * 0.08 * bot.agility2;
    bot.thrust = ships[bot.ship].thrust * bot.thrust2;
    bot.capacity = Math.round(ships[bot.ship].capacity * bot.capacity2);
    bot.maxHealth = bot.health = Math.round(ships[bot.ship].health * bot.maxHealth2);
    const keys = Object.keys(wepns);
    for (let i = 0; i < 10; i++) {
        do bot.weapons[i] = keys[Math.floor(Math.random() * keys.length)];
        while (wepns[bot.weapons[i]].level > bot.rank || !wepns[bot.weapons[i]].bot);
    }
    bot.refillAllAmmo();
    players[bot.sy][bot.sx][bot.id] = bot;
};

global.spawnNNBot = function (sx, sy, col) {
    if (trainingMode) {
        sx = 2; sy = 4;
    }
    if (sx < 0 || sy < 0 || sx >= mapSz || sy >= mapSz) return;
    id = Math.random();
    const bot = new NeuralNetBot(id);
    bot.sx = sx;
    bot.sy = sy;
    const rand = 0.33 + 3.85 * Math.random();
    bot.experience = trainingMode ? 150 : (Math.floor(Math.pow(2, Math.pow(2, rand))) / 8 + 3 * rand);// TODO change /8 to /4
    bot.updateRank();
    bot.ship = bot.rank;
    bot.x = trainingMode ? sectorWidth * Math.random() : (sectorWidth / 2);
    bot.y = trainingMode ? sectorWidth * Math.random() : (sectorWidth / 2);
    bot.color = col;
    bot.net = 1;
    bot.name = `BOT ${botNames[Math.floor(Math.random() * (botNames.length))]}`;
    bot.angle = Math.random() * Math.PI * 2;
    bot.thrust2 = bot.capacity2 = bot.maxHealth2 = bot.agility2 = Math.max(1, (Math.floor(rand * 2) * 0.25) + 0.7);
    bot.energy2 = Math.floor((bot.thrust2 - 1) * 5 / 2) / 5 + 1;
    bot.va = ships[bot.ship].agility * 0.08 * bot.agility2;
    bot.thrust = ships[bot.ship].thrust * bot.thrust2;
    bot.capacity = Math.round(ships[bot.ship].capacity * bot.capacity2);
    bot.maxHealth = bot.health = Math.round(ships[bot.ship].health * bot.maxHealth2);
    for (let i = 0; i < 10; i++) {
        do bot.weapons[i] = Math.floor(Math.random() * wepns.length);
        while (wepns[bot.weapons[i]].level > bot.rank || !wepns[bot.weapons[i]].bot);
        if (trainingMode) bot.weapons[i] = 1;
    }
    bot.refillAllAmmo();
    players[bot.sy][bot.sx][id] = bot;
};
