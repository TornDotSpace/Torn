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

const Beam = require(`./beam.js`);

class Mine {
    constructor (ownr, i, weaponID) {
        this.type = `Mine`;
        this.id = i; // unique identifier
        this.time = 0; // time since spawned
        this.color = ownr.color; // what team owns me
        this.dmg = wepns[weaponID].damage;
        this.range = wepns[weaponID].range;

        this.x = ownr.x;
        this.y = ownr.y;
        this.vx = Math.cos(ownr.angle) * wepns[weaponID].speed; // grenades are the only mines that move on its own
        this.vy = Math.sin(ownr.angle) * wepns[weaponID].speed;
        this.sx = ownr.sx;
        this.sy = ownr.sy;

        this.owner = ownr;
        this.wepnID = weaponID;
    }

    tick () {
        // All mines check for collision on placement; magnetic mine checks constantly as it heatseeks.
        if ((this.time === 0 && [15, 16, 17, 32].includes(this.wepnID)) || this.wepnID === 48) this.collideWithMines();

        if (this.wepnID != 44) {
            this.collideWithGuns();
            this.collideWithMissiles();
            this.collideWithBases();
        }
        if ((this.wepnID == 33 || this.wepnID == 32) && this.time++ > 25) this.die(); // grenade and impulse mine blow up after 1 second
        if (this.time++ > mineLifetime) this.die(); // all mines die after 3 minutes

        this.move(); // not only grenade, anything EM'ed
        if (this.wepnID == 43 && this.time % 8 == 0) this.doPulse(); // pulse
        if (this.wepnID == 44 && this.time % 25 == 0) this.doHeal(); // campfire
    }

    move () {
        if (this.wepnID == 48) { // Magnetic Mine
            let magvx = 0;
            let magvy = 0;
            for (const i in players[this.sy][this.sx]) {
                const p = players[this.sy][this.sx][i];
                if (p.color !== this.color) { // only enemies
                    // compute distance and angle to players
                    const distance = squaredDist(this, p); // distance squared between me and them
                    if (distance > square(10 * this.range)) continue;// wepns[48].range
                    const a = angleBetween(p, this);
                    const vel = 4.5 / Math.log(distance);
                    magvx += Math.cos(a) * vel;
                    magvy += Math.sin(a) * vel;
                }
            }
            this.vx += magvx;
            this.vy += magvy;
        }
        this.x += this.vx;
        this.y += this.vy;

        if (this.wepnID == 44) { // Campfire
            const old_sx = this.sx;
            const old_sy = this.sy;
            if (this.x > sectorWidth) { // check each edge of the 4 they could cross.
                this.x = 1;
                this.sx = (this.sx + 1 + mapSz) % mapSz;
            } else if (this.y > sectorWidth) {
                if (this.sy == mapSz - 1) {
                    this.die();
                } else {
                    this.y = 1;
                    this.sy++;
                }
            } else if (this.x < 0) {
                this.x = (sectorWidth - 1);
                this.sx = (this.sx - 1 + mapSz) % mapSz;
            } else if (this.y < 0) {
                if (this.sy == 0) {
                    this.die();
                } else {
                    this.y = (sectorWidth - 1);
                    this.sy--;
                }
            }

            if (old_sx !== this.sx || old_sy !== this.sy) {
                delete mines[old_sy][old_sx][this.id];
                mines[this.sy][this.sx][this.id] = this;
            }
        } else if (this.x > sectorWidth || this.x < 0 || this.y > sectorWidth || this.y < 0) this.die(); // out of sector. Better make them die than store all mines outside the sector borders, unable to do anything
    }

    doPulse () {
        if (this.time > 25 * 40) this.die(); // pulse has a shorter lifespan
        let playerFound = false;
        for (const i in players[this.sy][this.sx]) {
            const p = players[this.sy][this.sx][i];
            if (p.color !== this.color && squaredDist(p, this) < square(this.range * 10)) {
                const mult = 400 / Math.max(10, 0.001 + Math.hypot(p.x - this.x, p.y - this.y)); // not sure what's going on here but it works
                p.vx = mult * (Math.cbrt(p.x - this.x));
                p.vy = mult * (Math.cbrt(p.y - this.y)); // push the player
                p.updatePolars();// we edited rectangulars
                p.angle = p.driftAngle; // turn them away from the mine
                p.dmg(this.dmg, this);
                playerFound = true;
            }
        }

        for (const i in missiles[this.sy][this.sx]) {
            const m = missiles[this.sy][this.sx][i];
            const d2 = squaredDist(this, m);
            if (d2 > square(10 * this.range)) continue;
            const ang = angleBetween(this, m);
            const vel = -100000000 / Math.max(d2, 2000000);
            m.emvx += Math.cos(ang) * vel;
            m.emvy += Math.sin(ang) * vel;
        }

        if (playerFound) {
            sendAllSector(`sound`, { file: `bigboom`, x: this.x, y: this.y, dx: 0, dy: 0 }, this.sx, this.sy);
            this.time += 25 * 3;
        }
    }

    doHeal () {
        if (this.time > 25 * 20) this.die(); // campfire has a shorter lifespan
        let playerFound = 0;

        // check there's 2 people
        for (const i in players[this.sy][this.sx]) {
            const p = players[this.sy][this.sx][i];
            if (p.color == this.color && squaredDist(p, this) < square(this.range * 10)) playerFound++;
        }
        if (playerFound < 2) return;

        // heal them
        for (const i in players[this.sy][this.sx]) {
            const p = players[this.sy][this.sx][i];
            if (p.color == this.color && squaredDist(p, this) < square(this.range * 10)) {
                p.health = Math.min(p.health - this.dmg, p.maxHealth); // heal them

                const r = Math.random(); // Laser Mine
                const beam = new Beam(this, r, this.wepnID, p, this); // m.owner is the owner, m is the origin location
                beams[this.sy][this.sx][r] = beam;
            }
        }
        sendAllSector(`sound`, { file: `beam`, x: this.x, y: this.y }, this.sx, this.sy);
    }

    collideWithGuns () { // Guns will make enemy mines explode and vice-versa, but it'll take a while to kill them.
        for (const i in bullets[this.sy][this.sx]) {
            const b = bullets[this.sy][this.sx][i];
            if (b.color !== this.color && squaredDist(b, this) < square(this.range)) {
                b.die(); // destroy the bullet
                if (this.time >= mineLifetime) { // Old mines die faster
                    this.die(); // the mine dies too
                    break;
                } else this.time += Math.round(b.dmg * 25);
            }
        }
    }

    collideWithMissiles () { // Missiles will make enemy mines explode and vice-versa
        for (const i in missiles[this.sy][this.sx]) {
            const missile = missiles[this.sy][this.sx][i];
            if (missile.color !== this.color && squaredDist(missile, this) < square(this.range)) {
                missile.die(); // destroy the missile
                if (this.time >= mineLifetime) { // Old mines die faster
                    this.die(); // the mine dies too
                    break;
                } else this.time += Math.round(mineLifetime / 3);
            }
        }
    }

    collideWithMines () { // When the mine is created, make sure it isn't placed on top of any other mines.
        for (const m in mines[this.sy][this.sx]) {
            const mine = mines[this.sy][this.sx][m];
            if (mine.id == this.id) continue; // ofc the mine is on top of itthis
            if (squaredDist(mine, this) < square(wepns[this.wepnID].range)) { // if that mine is in this mine's "attack range"
                mine.die(); // destroy both
                this.die();
                break;
            }
        }
    }

    collideWithBases () {
        const b = bases[this.sy][this.sx];
        if (b != 0 && b.baseType != DEADBASE && b.color !== this.color && squaredDist(b, this) < square(16 + 32)) {
            if (this.wepnID == 17) b.EMP(25);
            b.dmg(this.dmg, this);
            this.die();
        }
    }

    die () {
        this.die = function () { }; // Purpose unclear, please comment
        let power = 0; // how strongly this mine pushes people away on explosion
        if (this.wepnID == 15 || this.wepnID == 33) power = 400; // mine, grenade
        else if (this.wepnID == 32) power = 2000;
        if (power != 0) {
            for (const i in players[this.sy][this.sx]) {
                const p = players[this.sy][this.sx][i];
                if (squaredDist(p, this) < square(1024)) {
                    const mult = power / Math.max(10, 0.001 + Math.hypot(p.x - this.x, p.y - this.y)); // not sure what's going on here but it works
                    p.vx = mult * (Math.cbrt(p.x - this.x));
                    p.vy = mult * (Math.cbrt(p.y - this.y)); // push the player
                    p.updatePolars();// we edited rectangulars
                    p.angle = p.driftAngle; // turn them away from the mine
                }
            }
        }
        if (this.wepnID == 33) {
            // if i'm a grenade
            for (const i in players[this.sy][this.sx]) {
                const p = players[this.sy][this.sx][i];
                if (!p.guest && squaredDist(p, this) < square(this.range * 40)) p.dmg(this.dmg, this); // if i'm in range of a player on explosion, damage them
            }
        }
        for (const i in players[this.sy][this.sx]) {
            const p = players[this.sy][this.sx][i];
            if (squaredDist(p, this) < square(80)) {
                p.dmg(this.dmg / 10, this); // if i'm in range of a player on explosion, damage them
            }
        }
        sendAllSector(`sound`, { file: `boom`, x: this.x, y: this.y, dx: 0, dy: 0 }, this.sx, this.sy);
        delete mines[this.sy][this.sx][this.id];
    }
}

module.exports = Mine;
