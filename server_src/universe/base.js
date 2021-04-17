const Bullet = require("../battle/bullet.js");
const Missile = require("../battle/missile.js");
const Blast = require("../battle/blast.js");
const Orb = require("../battle/orb.js");
const Beam = require("../battle/beam.js");

const fs = require("fs");

// Base types
global.LIVEBASE = 0;
global.DEADBASE = 1;
global.TURRET = 2;
global.SENTRY = 3;

module.exports = class Base {
    constructor (i, type, sx, syy, col, x, y) {
        this.type = "Base",
        this.kills = 0,
        this.experience = 0,
        this.money = 0,
        this.id = i, // unique identifier
        this.color = col,
        this.owner = 0,
        this.name = "",
        this.baseType = type, // Constants above
        this.angle = 0, // angle of the turret

        this.x = x,
        this.y = y,
        this.sx = sx,
        this.sy = syy,

        this.shots = 0,
        this.reload = 0, // timer for shooting
        this.health = (type == SENTRY ? 0.2 : 1) * baseHealth,
        this.maxHealth = (type == SENTRY ? 0.2 : 1) * baseHealth,
        this.empTimer = -1,
        this.speed = 0; // vs unused but there for bullets,
    }

    tick () {
    // spawn a bot if we need more bots
        if (!this.baseType == SENTRY) {
            const botSpawn = Math.random();
            const healthPercent = Math.max(this.health / this.maxHealth, 0.1);
            if (botSpawn * healthPercent < botFrequency) {
                spawnBot(this.sx, this.sy, this.color, healthPercent < 0.9);
            }
        }

        if (this.baseType == DEADBASE && (tick % (25 * 60 * 10) == 0 || (raidTimer < 15000 && tick % (25 * 150) == 0))) this.baseType = LIVEBASE; // revive. TODO: add a timer

        this.move(); // aim and fire

        this.empTimer--;
        this.reload--;

        if (this.health < this.maxHealth) this.health += baseRegenSpeed;
        if (tick % 50 == 0 && (this.baseType == SENTRY || this.baseType == TURRET)) this.tryGiveToOwner();
    }

    tryGiveToOwner () { // if a base's owner stands over it, they get the stuff it's earned from killing people
        let player = 0; // find owner
        for (const i in players[this.sy][this.sx]) {
            if (players[this.sy][this.sx][i].name === this.owner) {
                player = players[this.sy][this.sx][i];
                break;
            }
        }
        if (player == 0) return;// if we couldn't find them (they aren't in the sector)

        if (squaredDist(player, this) > 40000) return;

        player.kills += this.kills;// reward them with my earnings
        player.spoils("experience", this.experience);
        if (this.money > 0) player.spoils("money", this.money);

        this.experience = this.money = this.kills = 0; // and delete my earnings
    }

    move () { // aim and fire
        if (this.baseType == DEADBASE) return;

        if (this.empTimer > 0) return; // can't do anything if emp'd

        if (this.baseType == SENTRY) this.fireMini();
        else this.fire();
    }

    fire () {
        let c = 0; // nearest player
        let cDist2 = 1000000000; // min dist to player
        for (const i in players[this.sy][this.sx]) {
            const player = players[this.sy][this.sx][i];
            if (player.color == this.color || player.disguise > 0) continue; // don't shoot at friendlies
            const dist2 = squaredDist(player, this);
            if (dist2 < cDist2) {
                c = player; cDist2 = dist2;
            } // update nearest player
        }

        if (c == 0) return;

        const shouldMuon = this.reload < 0 && Math.random() < 0.015;
        const newAngle = calculateInterceptionAngle(c.x, c.y, c.vx, c.vy, this.x, this.y, shouldMuon ? 10000 : wepns[3].speed);
        this.angle = (this.angle + newAngle * 2) / 3;

        if (this.reload < 0) {
            if (cDist2 < square(wepns[3].range * 10) && shouldMuon) {
                this.shootMuon(); return;
            }
            if (cDist2 < square(wepns[8].range * 10)) this.shootLaser();// range:60
            else if (cDist2 < square(wepns[37].range * 10)) this.shootOrb();// range:125
            else if (cDist2 < square(175 * 10)) this.shootMissile();// range:175
            else if (cDist2 < 10 + square(wepns[3].range * 10)) this.shootRifle();// range:750 plus some extra distance rifle can travel. Basically this makes the turret slightly smarter.
        }
    }

    fireMini () {
        let c = 0; // nearest player
        let cDist2 = 1000000000; // min dist to player
        for (const i in players[this.sy][this.sx]) {
            const player = players[this.sy][this.sx][i];
            if (player.color == this.color || player.disguise > 0) continue; // don't shoot at friendlies
            const dist2 = squaredDist(player, this);
            if (dist2 < cDist2) {
                c = player; cDist2 = dist2;
            } // update nearest player
        }

        if (c == 0) return;

        const newAngle = calculateInterceptionAngle(c.x, c.y, c.vx, c.vy, this.x, this.y, wepns[5].speed);
        this.angle = (this.angle + newAngle * 2) / 3;

        if (this.reload < 0) {
            if (cDist2 < 5 + square(wepns[5].range * 10)) this.shootMachineGun();// range:??? + the small extra range machine gun bullets are still capable of hitting a target. Basically this allows the turret not to be attacked with the same weapon by players without the turret reacting.
        }
    }

    shootOrb () {
        this.reload = wepns[37].charge / 2;
        const r = Math.random();
        const orb = new Orb(this, r, 37);
        orbs[this.sy][this.sx][r] = orb;
        sendAllSector("sound", { file: "beam", x: this.x, y: this.y }, this.sx, this.sy);
    }

    shootMuon () {
        this.reload = wepns[34].charge / 2;
        const r = Math.random();
        const blast = new Blast(this, r, 34);
        blasts[this.sy][this.sx][r] = blast;
        sendAllSector("sound", { file: "beam", x: this.x, y: this.y }, this.sx, this.sy);
    }

    shootRifle () {
        this.reload = wepns[3].charge / 2;
        const r = Math.random();
        const bullet = new Bullet(this, r, 3, this.angle, 0);
        bullets[this.sy][this.sx][r] = bullet;
        sendAllSector("sound", { file: "shot", x: this.x, y: this.y }, this.sx, this.sy);
    }

    shootMachineGun () {
        this.shots++;
        this.reload = wepns[5].charge / 2;
        const r = Math.random();
        const bullet = new Bullet(this, r, 5, this.angle, 0);
        bullets[this.sy][this.sx][r] = bullet;
        sendAllSector("sound", { file: "shot", x: this.x, y: this.y }, this.sx, this.sy);
        if (this.shots > 5000) { this.die(0); }
    }

    shootMissile () { // this is a torpedo
        this.reload = wepns[14].charge / 2;
        const r = Math.random();
        const bAngle = this.angle;
        const missile = new Missile(this, r, 14, bAngle);
        missiles[this.sy][this.sx][r] = missile;
        sendAllSector("sound", { file: "missile", x: this.x, y: this.y }, this.sx, this.sy);
    }

    shootLaser () { // TODO merge this into Beam object, along with player.shootBeam()
        let nearP = 0;
        for (const i in players[this.sy][this.sx]) {
            const p = players[this.sy][this.sx][i];
            if (p.color == this.color || p.sx != this.sx || p.sy != this.sy) continue;
            if (nearP == 0) {
                nearP = p;
                continue;
            }
            const dx = p.x - this.x; const dy = p.y - this.y;
            if (dx * dx + dy * dy < squaredDist(nearP, this)) nearP = p;
        }
        if (nearP == 0) return;
        const r = Math.random();
        const beam = new Beam(this, r, 8, nearP, this);
        beams[this.sy][this.sx][r] = beam;
        sendAllSector("sound", { file: "beam", x: this.x, y: this.y }, this.sx, this.sy);
        this.reload = wepns[8].charge / 2;
    }

    die (b) {
        if (this.baseType == DEADBASE) return;

        deleteTurret(this);

        this.health = this.maxHealth;
        sendAllSector("sound", { file: "bigboom", x: this.x, y: this.y, dx: 0, dy: 0 }, this.sx, this.sy);

        if (this.baseType != LIVEBASE) {
            bases[this.sy][this.sx] = 0;
            this.die = function () { };
        } else {
            const numBotsToSpawn = 2 + 4 * Math.random() * Math.random();
            for (let i = 0; i < numBotsToSpawn; i++) spawnBot(this.sx, this.sy, this.color, true);
        }

        if (b === 0) {
            return;
        }

        // If I was killed by an asteroid...
        if (b.type == "Asteroid") {
            this.sendDeathMsg("an asteroid");
            return;
        }

        // Or a player...
        if (typeof b.owner !== "undefined" && b.owner.type === "Player") {
            this.sendDeathMsg(`${b.owner.nameWithColor()}'s \`~${b.wepnID}\`~`);
            b.owner.baseKilled();
            let multiplier = this.isMini ? 1 : 2 * Math.abs(this.sy - mapSz / 2 - 0.5);
            let numInRange = 0;
            for (const i in players[this.sy][this.sx]) { // Count all players in range
                const p = players[this.sy][this.sx][i];
                if (squaredDist(p, this) < square(baseClaimRange) && p.color === b.owner.color) numInRange++;
            }
            multiplier /= numInRange;
            for (const i in players[this.sy][this.sx]) { // Reward appropriately
                const p = players[this.sy][this.sx][i];
                if (squaredDist(p, this) < square(baseClaimRange) && p.color === b.owner.color) {
                    p.spoils("experience", baseKillExp * multiplier); // reward them
                    p.spoils("money", baseKillMoney * multiplier);
                }
            }

            if (raidTimer < 15000 && !this.isMini) { // during a raid
                b.owner.points++; // give a point to the killer

                for (const i in players[this.sy][this.sx]) { // as well as all other players in that sector
                    const p = players[this.sy][this.sx][i];
                    if (p.color !== this.color) p.points += 2;
                }
            }
        }
    }

    save () {
        saveTurret(this);
    }

    sendDeathMsg (killedBy) {
        const baseName = "base";
        if (this.baseType == SENTRY) {
            baseName = "Sentry";
        } else if (this.baseType == TURRET) {
            baseName = "Turret";
        }
        chatAll(`The ${baseName} at sector ${this.nameWithColor()} was destroyed by ${killedBy}.`);
    }

    getSectorName () {
        return `${String.fromCharCode(97 + this.sx).toUpperCase()}${this.sy + 1}`;
    }

    EMP (t) {
        this.empTimer = t;
    }

    onKill () {
        this.kills++;
    }

    dmg (d, origin) {
        this.health -= d;
        if (this.health < 0) this.die(origin);

        if (d > 0) note(`-${Math.floor(d)}`, this.x, this.y - 64, this.sx, this.sy); // e.g. "-8" pops up on screen to mark 8 hp was lost (for all players)
        if (d == 0) note("No dmg", this.x, this.y - 64, this.sx, this.sy); // e.g. "No dmg" pops up on screen to mark the attack didn't do damage (for all players)
        if (d < 0) note(`+${Math.floor(Math.abs(d))}`, this.x, this.y - 64, this.sx, this.sy); // e.g. "+8" pops up on screen to mark 8 hp were healed (for all players)

        // note("-" + d, this.x, this.y - 64, this.sx, this.sy);
        return this.health < 0;
    }

    spoils (type, amt) {
        if (type === "experience") this.experience += amt;
        if (type === "money") this.money += amt;
    }

    nameWithColor () { // returns something like "~`green~`B6~`yellow~`"
        return `~\`${this.color}~\`${this.getSectorName()}~\`yellow~\``;
    }
};
