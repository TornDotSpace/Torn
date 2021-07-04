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
class Orb {
    constructor (ownr, i, wepnID) { // currently the only orbs are energy disk and photon orb
        this.type = `Orb`;
        this.id = i; // unique identifier
        this.color = ownr.color; // owned by which team
        this.dmg = wepns[wepnID].damage;

        this.owner = ownr;
        this.x = ownr.x;
        this.y = ownr.y; // spawn where its owner is
        this.sx = ownr.sx;
        this.sy = ownr.sy;
        this.vx = wepns[wepnID].speed * Math.cos(ownr.angle) * 2;
        this.vy = wepns[wepnID].speed * Math.sin(ownr.angle) * 2;

        this.locked = 0; // the id of the player I'm locked on to
        this.timer = 0; // how long this orb has existed
        this.lockedTimer = 0; // timer of how long it's been locked onto a player
        this.wepnID = wepnID;
    }

    tick () {
        if (this.timer++ > 3 * wepns[this.wepnID].range / wepns[this.wepnID].speed) this.die();
        this.move();

        // Crossing through sectors
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
            this.locked = 0;
            delete orbs[old_sy][old_sx][this.id];
            orbs[this.sy][this.sx][this.id] = this;
        }

        // Find next target
        let closest = -1;
        if (tick % 5 == 0 && this.locked == 0) {
            // search players
            for (const i in players[this.sy][this.sx]) {
                const player = players[this.sy][this.sx][i];
                if (player.disguise > 0 && this.wepnID != 42) continue;
                const dist = squaredDist(player, this);
                if ((player.color != this.color && dist < square(wepns[this.wepnID].range * 10)) && (this.locked == 0 || dist < closest)) {
                    this.locked = player.id;
                    closest = dist;
                }
            }
            if (this.locked != 0) return;

            // check base
            if (bases[this.sy][this.sx] != 0 && bases[this.sy][this.sx].color !== this.color && bases[this.sy][this.sx].baseType != DEADBASE && squaredDist(bases[this.sy][this.sx], this) < square(wepns[this.wepnID].range * 10)) {
                this.locked = bases[this.sy][this.sx].id;
                return;
            }

            // search asteroids
            for (const i in asts[this.sy][this.sx]) {
                const ast = asts[this.sy][this.sx][i];
                const dist = squaredDist(ast, this);
                if (dist < square(wepns[this.wepnID].range * 10) && (this.locked == 0 || dist < closest)) {
                    this.locked = ast.id;
                    closest = dist;
                }
            }
        }
    }

    move () {
        if (this.locked != 0) {
            if (this.lockedTimer++ > secs(2.5)) this.die(); // after 2.5 seconds of being locked on -> delete this

            const baseHere = bases[this.sy][this.sx];
            let target = players[this.sy][this.sx][this.locked];
            if (typeof target === `undefined` && bases[this.sy][this.sx].color != this.color) target = bases[this.sy][this.sx];
            if (target == 0) target = asts[this.sy][this.sx][this.locked];
            if (typeof target === `undefined`) this.locked = 0;
            else { // if we are locked onto something
                if (target.type === `Player`) target.isLocked = true; // tell the player they're locked on so they will get an alert message
                const dist = Math.hypot(target.x - this.x, target.y - this.y);
                if (dist < 64 && (target.baseType != DEADBASE) !== false) { // if it's a base we can't attack when it's dead. !== false works in case of non-bases
                    target.dmg(this.dmg, this);
                    this.die();
                    return;
                }
                this.vx += wepns[this.wepnID].speed * (target.x - this.x) / dist; // accelerate towards target
                this.vy += wepns[this.wepnID].speed * (target.y - this.y) / dist;
                this.vx *= 0.9; // air resistance
                this.vy *= 0.9;
            }
        }
        if (this.locked == 0) this.lockedTimer = 0;
        this.x += this.vx;
        this.y += this.vy; // move
    //    if (this.x > sectorWidth || this.x < 0 || this.y > sectorWidth || this.y < 0) this.die(); // if out of bounds
    }

    die () {
        sendAllSector(`sound`, { file: `boom`, x: this.x, y: this.y, dx: this.vx, dy: this.vy }, this.sx, this.sy);
        delete orbs[this.sy][this.sx][this.id];
    }
}

module.exports = Orb;
