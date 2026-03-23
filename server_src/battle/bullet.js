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
            // TO-DO NEW
            apply9SectorCall(sendAllSector, `newBullet`, { sx: this.sx, sy: this.sy, x: this.x, y: this.y, vx: this.vx, vy: this.vy, id: this.id, angle: this.angle, wepnID: this.wepnID, color: this.color, tick: this.time }, this.sx, this.sy);
            // TO-DO OLD
            // sendAllSector(`newBullet`, { x: this.x, y: this.y, vx: this.vx, vy: this.vy, id: this.id, angle: this.angle, wepnID: this.wepnID, color: this.color }, this.sx, this.sy);
            // this.x -= this.vx; //These were here before Alex's refactor. Not sure if they should exist.
            // this.y -= this.vy;
        }
        this.move();
        this.dist += wepns[this.wepnID].speed / 10;
        if (this.wepnID == 28 && this.time > 25 * 3) { // gravity bomb has 3 seconds to explode
            for (const id in bases[this.sy][this.sx]) {
                const base = bases[this.sy][this.sx][id];
                if (squaredDist(base, this) < square(5000)) return; // don't spawn too close to a base, just keep moving if too close to base and explode when 500 units away
                this.dieAndMakeVortex(); // collapse into black hole
            }
        } else if (this.dist > wepns[this.wepnID].range) this.die(); // out of range
    }

    move () {
        this.x += this.vx;
        this.y += this.vy; // move on tick
        if (this.x > sectorWidth || this.x < 0 || this.y > sectorWidth || this.y < 0) {
            // Crossing through sectors
            let idied = false;

            /* TO-DO WIP
          const old_sx = this.sx;
          const old_sy = this.sy;
          const SXtoEast = (this.x > sectorWidth);
          const SXtoWest = (this.x < 0);
          const SYtoNorth = (this.y < 0);
          const SYtoSouth = (this.y > sectorWidth);
          if (SXtoEast) { // check each edge of the 4 they could cross.
              this.x = 1;
              this.sx = (this.sx + 1 + mapSz) % mapSz;
          } else if (SYtoSouth) {
              if (this.sy == mapSz - 1) {
                  idied = true;
              } else {
                  this.y = 1;
                  this.sy++;
              }
          } else if (SXtoWest) {
              this.x = (sectorWidth - 1);
              this.sx = (this.sx - 1 + mapSz) % mapSz;
          } else if (SYtoNorth) {
              if (this.sy == 0) {
                  idied = true;
              } else {
                  this.y = (sectorWidth - 1);
                  this.sy--;
              }
          }
          */

            if (idied) this.die();
            else {
                // TO-DO OLD
                this.die(); // TO-DO SWITCH SO IT FIRES BEYOND THE SECTORS
                /* TO-DO WIP
              let startX = -1;
              let endX = 1;
              let startY = -1;
              let endY = 1;
              let UstartX = -1;
              let UendX = 1;
              let UstartY = -1;
              let UendY = 1;
              let CstartX = -1;
              let CendX = 1;
              let CstartY = -1;
              let CendY = 1;
              // We send an update message to our neighbours
              if (SYtoNorth) {
                  startY = 1;
                  endY = 1;
                  UstartY = 0;
                  UendY = -1;
                  CstartY = -1;
                  CendY = -1;
              } else if (SYtoSouth) {
                  startY = -1;
                  endY = -1;
                  UstartY = 1;
                  UendY = 0;
                  CstartY = 1;
                  CendY = 1;
              } else if (SXtoWest) {
                  startX = 1;
                  endX = 1;
                  UstartX = 0;
                  UendX = 1;
                  CstartX = -1;
                  CendX = -1;
              } else if (SXtoEast) {
                  startX = -1;
                  endX = -1;
                  UstartX = -1;
                  UendX = 0;
                  CstartX = 1;
                  CendX = 1;
              }
              // First, we delete the ones on the back sectors
              apply9SectorCall(sendAllSector, `delBullet`, { id: this.id }, old_sx, old_sy, undefined, undefined, undefined, startX, startY, endX, endY);
              // Then we update those on the sides
              const delta = {sx: this.sx, sy: this.sy, x: this.x, y: this.y};
              apply9SectorCall(sendAllSector, `bullet_update`, {delta: delta, id: this.id}, this.sx, this.sy, undefined, undefined, undefined, UstartX, UstartY, UendX, UendY);
              // Then we create entries for the front sectors
              apply9SectorCall(sendAllSector, `newBullet`, { sx: this.sx, sy: this.sy, x: this.x, y: this.y, vx: this.vx, vy: this.vy, id: this.id, angle: this.angle, wepnID: this.wepnID, color: this.color, tick: this.time }, this.sx, this.sy, undefined, undefined, undefined, CstartX, CstartY, CendX, CendY);
              */
            }
        }
        for (const id in bases[this.sy][this.sx]) {
            const b = bases[this.sy][this.sx][id];
            if (b != 0 && b.baseType != DEADBASE && b.color != this.color && squaredDist(b, this) < square(16 + 32)) {
                b.dmg(this.dmg, this);
                this.die();
            }
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
        // TO-DO NEW
        apply9SectorCall(sendAllSector, `delBullet`, { id: this.id }, this.sx, this.sy);
        // TO-DO OLD
        // sendAllSector(`delBullet`, { id: this.id }, this.sx, this.sy);
        const reverse = this.wepnID == 2 ? -1 : 1; // for reverse gun, particles should shoot the other way
        // TO-DO NEW
        apply9SectorCall(sendAllSector, `sound`, { file: `boom`, sx: this.sx, sy: this.sy, x: this.x, y: this.y, dx: reverse * this.vx, dy: reverse * this.vy }, this.sx, this.sy);
        // TO-DO OLD
        // sendAllSector(`sound`, { file: `boom`, sx: this.sx, sy: this.sy, x: this.x, y: this.y, dx: reverse * this.vx, dy: reverse * this.vy }, this.sx, this.sy);
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
