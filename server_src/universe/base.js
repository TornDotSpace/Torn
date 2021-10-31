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

const Bullet = require(`../battle/bullet.js`);
const Missile = require(`../battle/missile.js`);
const Blast = require(`../battle/blast.js`);
const Orb = require(`../battle/orb.js`);
const Beam = require(`../battle/beam.js`);

const fs = require(`fs`);

// Base types
global.LIVEBASE = 0;
global.DEADBASE = 1;
global.TURRET = 2;
global.SENTRY = 3;

class Base {
    constructor (i, type, sx, sy, col, x, y) {
        console.log(`Base constructed with type ${type}`);
        this.type = `Base`;
        this.kills = 0;
        this.experience = 0;
        this.money = 0;
        this.id = i; // unique identifier
        this.trueColor = col; // The team this base originally is
        this.color = col; // The team this base is now
        this.assimilatedCol = col; // The team that is attempting to overtake the base
        this.owner = 0;
        this.name = ``;
        this.isMini = (type == SENTRY);
        this.baseType = type; // Constants above
        this.angle = 0; // angle of the turret

        this.x = x;
        this.y = y;
        this.sx = sx;
        this.sy = sy;
        this.deathTimer = 0;

        this.shots = 0;
        this.reload = 0; // timer for shooting
        this.health = (type == SENTRY ? 0.15 : 1) * baseHealth;
        this.maxHealth = (type == SENTRY ? 0.15 : 1) * baseHealth;
        this.empTimer = -1;
        this.speed = 0; // vs unused but there for bullets,
        this.assimilatedTimer = 0;
    }

    tick () {
    // spawn a bot if we need more bots
        if (this.baseType !== SENTRY) {
            const botSpawn = Math.random();
            const healthPercent = Math.max(this.health / this.maxHealth, 0.1);
            if (botSpawn * healthPercent < botFrequency) {
                spawnBaseBot(this.sx, this.sy, this.x, this.y, this.assimilatedCol, healthPercent < 0.9);
            }
        }

        this.deathTimer--;
        if (this.baseType == DEADBASE && this.deathTimer <= 0) this.baseType = LIVEBASE; // revive.

        this.move(); // aim and fire

        this.empTimer--;
        this.reload--;

        if (this.assimilatedTimer <= 0) {
            if (this.assimilatedCol !== this.trueColor) this.unassimilate();
        } else this.assimilatedTimer--;

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
        player.spoils(`experience`, this.experience);
        if (this.money > 0) player.spoils(`money`, this.money);

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
            if (player.color == this.assimilatedCol || player.disguise > 0) continue; // don't shoot at friendlies
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
            if (Math.random() < 0.01) this.shootEMPMissile();
            if (cDist2 < square(wepns[8].range * 10)) this.shootLaser(c);// range:60
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
            if (player.color == this.assimilatedCol || player.disguise > 0) continue; // don't shoot at friendlies
            const dist2 = squaredDist(player, this);
            if (dist2 < cDist2) {
                c = player; cDist2 = dist2;
            } // update nearest player
        }

        if (c == 0) return;

        const newAngle = calculateInterceptionAngle(c.x, c.y, c.vx, c.vy, this.x, this.y, wepns[5].speed);
        this.angle = (this.angle + newAngle * 2) / 3;

        if (this.reload < 0) {
            if (cDist2 < 5 * 10 + square(wepns[5].range * 10)) this.shootMachineGun(); // range:??? + the small extra range machine gun bullets are still capable of hitting a target. Basically this allows the turret not to be attacked with the same weapon by players without the turret reacting.
        }
    }

    shootEMPMissile () {
        this.reload = wepns[12].charge / 2;
        const r = Math.random();
        const missile = new Missile(this, r, 12, this.angle);
        missiles[this.sy][this.sx][r] = missile;
        sendAllSector(`sound`, { file: `missile`, x: this.x, y: this.y }, this.sx, this.sy);
    }

    shootOrb () {
        this.reload = wepns[37].charge / 2;
        const r = Math.random();
        const orb = new Orb(this, r, 37);
        orbs[this.sy][this.sx][r] = orb;
        sendAllSector(`sound`, { file: `beam`, x: this.x, y: this.y }, this.sx, this.sy);
    }

    shootMuon () {
        this.reload = wepns[34].charge / 2;
        const r = Math.random();
        const blast = new Blast(this, r, 34);
        blasts[this.sy][this.sx][r] = blast;
        sendAllSector(`sound`, { file: `beam`, x: this.x, y: this.y }, this.sx, this.sy);
    }

    shootRifle () {
        this.reload = wepns[3].charge / 2;
        const r = Math.random();
        const bullet = new Bullet(this, r, 3, this.angle, 0);
        bullets[this.sy][this.sx][r] = bullet;
        sendAllSector(`sound`, { file: `shot`, x: this.x, y: this.y }, this.sx, this.sy);
    }

    shootMachineGun () {
        this.shots++;
        this.reload = wepns[5].charge / 2;
        const r = Math.random();
        const bullet = new Bullet(this, r, 5, this.angle, 0);
        bullets[this.sy][this.sx][r] = bullet;
        sendAllSector(`sound`, { file: `shot`, x: this.x, y: this.y }, this.sx, this.sy);
        if (this.shots > 5000) { this.die(0); }
    }

    shootMissile () { // this is a torpedo
        this.reload = wepns[14].charge / 2;
        const r = Math.random();
        const bAngle = this.angle;
        const missile = new Missile(this, r, 14, bAngle);
        missiles[this.sy][this.sx][r] = missile;
        sendAllSector(`sound`, { file: `missile`, x: this.x, y: this.y }, this.sx, this.sy);
    }

    shootLaser (nearP) { // TODO merge this into Beam object, along with player.shootBeam()
        if (nearP == 0) return;
        const r = Math.random();
        const beam = new Beam(this, r, 8, nearP, this); // Laser
        beams[this.sy][this.sx][r] = beam;
        sendAllSector(`sound`, { file: `beam`, x: this.x, y: this.y }, this.sx, this.sy);
        this.reload = wepns[8].charge / 2;
    }

    die (b) {
        if (this.baseType == DEADBASE) return;

        deleteTurret(this);

        this.health = this.maxHealth;
        sendAllSector(`sound`, { file: `bigboom`, x: this.x, y: this.y, dx: 0, dy: 0 }, this.sx, this.sy);

        if (this.baseType != LIVEBASE) {
            bases[this.sy][this.sx] = 0;
            this.die = function () { };
        } else {
            const numBotsToSpawn = 2 + 4 * Math.random() * Math.random();
            for (let i = 0; i < numBotsToSpawn; i++) spawnBaseBot(this.sx, this.sy, this.x, this.y, this.assimilatedCol, true);
            this.baseType = DEADBASE;
            this.deathTimer = raidTimer < 15000 ? 75 * 60 : (25 * 125);
        }

        if (b === 0) {
            return;
        }

        // If I was killed by an asteroid...
        if (b.type == `Asteroid`) {
            this.sendDeathMsg(`an asteroid`);
            return;
        }

        // Or a player...
        if (typeof b.owner !== `undefined` && b.owner.type === `Player`) {
            this.sendDeathMsg(`${b.owner.nameWithColor()}'s ${chatWeapon(b.wepnID)}`);
            b.owner.baseKilled();
            let multiplier = this.isMini ? 1 : 2;
            let numInRange = 0;
            for (const i in players[this.sy][this.sx]) { // Count all players in range
                const p = players[this.sy][this.sx][i];
                if (squaredDist(p, this) < square(baseClaimRange) && p.color === b.owner.color) numInRange++;
            }
            multiplier /= numInRange;
            for (const i in players[this.sy][this.sx]) { // Reward appropriately
                const p = players[this.sy][this.sx][i];
                if (squaredDist(p, this) < square(baseClaimRange) && p.color === b.owner.color) {
                    p.spoils(`experience`, baseKillExp * multiplier); // reward them
                    p.spoils(`money`, baseKillMoney * multiplier);
                    p.killStreak++; // Bases count for kill streaks
                    p.killStreakTimer = 1000; // 40s
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
        this.unassimilate(); // the turret returns to normal
    }

    save () {
        saveTurret(this);
    }

    sendDeathMsg (killedBy) {
        let baseName = `base`;
        if (this.baseType == SENTRY) {
            baseName = `Sentry`;
        } else if (this.baseType == TURRET) {
            baseName = `Turret`;
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
        if (d == 0) note(`No dmg`, this.x, this.y - 64, this.sx, this.sy); // e.g. "No dmg" pops up on screen to mark the attack didn't do damage (for all players)
        if (d < 0) note(`+${Math.floor(Math.abs(d))}`, this.x, this.y - 64, this.sx, this.sy); // e.g. "+8" pops up on screen to mark 8 hp were healed (for all players)

        // note("-" + d, this.x, this.y - 64, this.sx, this.sy);
        return this.health < 0;
    }

    spoils (type, amt) {
        if (type === `experience`) this.experience += amt;
        if (type === `money`) this.money += amt;
    }

    nameWithColor () { // returns something like "~`green~`B6~`yellow~`"
        return `${chatColor(this.color)}${this.getSectorName()}${chatColor(`yellow`)}`;
    }

    assimilate (time, assimilator) { // A weapon of cyborg origin
        this.dmg(this.health * 0.02, assimilator);
        this.EMP(time / 3); // The crew is fighting hard to fend off the invaders! Some systems stop working and the base will take some damage
        this.assimilatedCol = assimilator.color; // But resistance is futile
        this.assimilatedTimer += time; // At least until the remaining crew manage to vent the invaders.
        if (this.assimilatedTimer >= 4600) { // If the base gets overwhelmed, it temporarily changes teams. 4600 is high enough this happening would be very rare
            this.assimilatedCol = assimilator.color;
            this.color = assimilator.color;
            note(`WE ARE THE CYBORG. RESISTANCE IS FUTILE`, this.x, this.y - 64, this.sx, this.sy);
            this.EMP(10);
        }
    }

    unassimilate () { // A cure for the cyborg assimilation
        this.EMP((this.assimilatedTimer >= 4600 ? 140 : 60));
        this.assimilatedTimer = 0;
        this.assimilatedCol = this.trueColor;
        this.color = this.trueColor;
    }
}

module.exports = Base;
