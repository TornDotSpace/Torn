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

const Vortex = require(`../universe/vortex.js`);

class Bullet {
    constructor (ownr, i, wepnID, angl, info) {
        this.type = `Bullet`;
        this.id = i; // unique identifier
        this.time = 0; // time since spawn
        this.color = ownr.color; // whose team
        this.dist = 0; // TRACKS distance. Doesn't control it.
        this.dmg = wepns[wepnID].damage;

        this.x = ownr.x + (wepnID == 6 ? Math.sin(angl) * 16 * info : 0); // spawn where my owner was
        this.y = ownr.y - (wepnID == 6 ? Math.cos(angl) * 16 * info : 0); // if minigun, move left or right based on which bullet I am
        this.sx = ownr.sx;
        this.sy = ownr.sy;
        this.vx = Math.cos(angl) * wepns[wepnID].speed;
        this.vy = Math.sin(angl) * wepns[wepnID].speed;
        this.owner = ownr;
        this.angle = angl; // has to be a parameter since not all bullets shoot straight
        this.info = info; // used to differentiate left and right minigun bullets
        this.wepnID = wepnID;
    }

    tick () {
        if (this.time++ == 0) { // if this was just spawned
            sendAllSector(`newBullet`, { x: this.x, y: this.y, vx: this.vx, vy: this.vy, id: this.id, angle: this.angle, wepnID: this.wepnID, color: this.color }, this.sx, this.sy);
            // this.x -= this.vx; //These were here before Alex's refactor. Not sure if they should exist.
            // this.y -= this.vy;
        }
        this.move();
        this.dist += wepns[this.wepnID].speed / 10;
        if (this.wepnID == 28 && this.time > 25 * 3) { // gravity bomb has 3 seconds to explode
            const base = bases[this.sy][this.sx];
            if (squaredDist(base, this) < square(5000)) return; // don't spawn too close to a base, just keep moving if too close to base and explode when 500 units away
            this.dieAndMakeVortex(); // collapse into black hole
        } else if (this.dist > wepns[this.wepnID].range) this.die(); // out of range
    }

    move () {
        this.x += this.vx;
        this.y += this.vy; // move on tick
        if (this.x > sectorWidth || this.x < 0 || this.y > sectorWidth || this.y < 0) this.die();

        const b = bases[this.sy][this.sx];
        if (b != 0 && b.baseType != DEADBASE && b.color != this.color && squaredDist(b, this) < square(16 + 32)) {
            b.dmg(this.dmg, this);
            this.die();
        }

        for (const i in players[this.sy][this.sx]) {
            const p = players[this.sy][this.sx][i];
            if (p.color !== this.color && squaredDist(p, this) < square(bulletWidth + ships[p.ship].width)) { // on collision with enemy
                // if a grav bomb hits a player, just die
                if (this.wepnID === 28) return;

                p.dmg(this.dmg, this); // damage the enemy
                this.die();// despawn this bullet
                break;
            }
        }
        if (this.time % 2 == 0 || wepns[this.wepnID].speed > 75) { // Only check for collisions once every 2 ticks, unless this weapon is really fast (in which case the bullet would skip over it)
            for (const i in asts[this.sy][this.sx]) {
                const a = asts[this.sy][this.sx][i];
                if (squaredDist(a, this) < square(bulletWidth + 64)) { // if we collide
                    a.dmg(this.dmg * (this.wepnID == 0 ? 2 : 1), this); // hurt the asteroid. ternary: Stock Gun does double damage.
                    a.vx += this.vx / 256; // push the asteroid
                    a.vy += this.vy / 256;
                    a.owner = this.owner;
                    this.die(); // delete this bullet
                    break;
                }
            }
        }
    }

    die () {
        sendAllSector(`delBullet`, { id: this.id }, this.sx, this.sy);
        const reverse = this.wepnID == 2 ? -1 : 1; // for reverse gun, particles should shoot the other way
        sendAllSector(`sound`, { file: `boom`, x: this.x, y: this.y, dx: reverse * this.vx, dy: reverse * this.vy }, this.sx, this.sy);
        delete bullets[this.sy][this.sx][this.id];
    }

    dieAndMakeVortex () {
        const r = Math.random();
        const vort = new Vortex(r, this.x, this.y, this.sx, this.sy, 3000, this.owner, false); // 3000 is the size of a grav bomb vortex
        vorts[this.sy][this.sx][r] = vort;
        this.die();
    }
}

module.exports = Bullet;
