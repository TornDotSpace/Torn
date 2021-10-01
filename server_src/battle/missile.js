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

class Missile {
    constructor (ownr, i, wepnID, angl) {
        this.type = `Missile`;
        this.id = i; // unique identifier
        this.color = ownr.color; // whose side i'm on
        this.dmg = wepns[wepnID].damage;

        this.x = ownr.x;
        this.y = ownr.y;
        this.sx = ownr.sx;
        this.sy = ownr.sy;
        this.vx = Math.cos(angl) * wepns[wepnID].speed;
        this.vy = Math.sin(angl) * wepns[wepnID].speed;
        this.emvx = 0;
        this.emvy = 0;
        this.angle = angl;

        this.owner = ownr;
        this.locked = 0; // player I'm locked onto
        this.timer = 0; // since spawn
        this.lockedTimer = 0; // since locking on to my current target (or is it since first locking onto anyone?)
        this.distTravelled = 0; // distance I've travelled
        this.wepnID = wepnID;
        this.goalAngle = 0; // the angle I'm turning to match
    }

    tick () {
        this.move();
        this.timer++; // time needs to flow.
        if (this.distTravelled >= 10 * wepns[this.wepnID].range) this.die(); // out of range -> die
        if (this.wepnID == 14) { // If torpedo... yeah we need a reason to make torpedo needed at such a high level with so little damage, ammo and recharge.
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
                delete missiles[old_sy][old_sx][this.id];
                missiles[this.sy][this.sx][this.id] = this;
            }
        } else if (this.x > sectorWidth || this.x < 0 || this.y > sectorWidth || this.y < 0) this.die(); // out of sector

        if (this.timer == 20 && this.wepnID == 13) this.missileSwarmExplode();

        if (tick % 5 == 0 && this.locked == 0) {
            let closest = Number.MAX_SAFE_INTEGER;
            // search players
            for (const i in players[this.sy][this.sx]) {
                const player = players[this.sy][this.sx][i];
                if (player.disguise > 0) continue;
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
            if (this.lockedTimer++ > missileLockTimeout) this.die();

            let target = players[this.sy][this.sx][this.locked]; // try 2 find the target object
            if (typeof target === `undefined` && bases[this.sy][this.sx].color != this.color) target = bases[this.sy][this.sx];
            if (target == 0) target = asts[this.sy][this.sx][this.locked];
            if (typeof target === `undefined`) this.locked = 0;

            else { // if we found it, then...
                if (target.type === `Player`) target.isLocked = true;

                // on impact
                if (target.sx == this.sx && target.sy == this.sy && squaredDist(target, this) < 10000 * (this.wepnID == 38 ? 5 : 1) && (target.baseType != DEADBASE) != false /* we don't know it's a base. can't just say ==true. */) {
                    target.dmg(this.dmg, this);
                    this.die();
                    if (this.wepnID == 12 && (target.type === `Player` || target.type === `Base`)) target.EMP(54); // EMP Missile
                    return;
                }

                if (this.wepnID != 38) { // 38: proximity fuze
                    if (this.timer == 1 || tick % 4 == 0) this.goalAngle = angleBetween(target, this);
                    this.angle = findBisector(findBisector(this.goalAngle, this.angle), this.angle);// turn towards goal
                }
                this.vx = Math.cos(this.angle) * wepns[this.wepnID].speed; // update velocity
                this.vy = Math.sin(this.angle) * wepns[this.wepnID].speed;
            }
        }

        if (this.locked == 0) this.lockedTimer = 0;

        const accelMult = 1 - 25 / (this.timer + 25); // pick up speed w/ time
        const velx = this.vx * accelMult;
        const vely = this.vy * accelMult;

        if (Math.sqrt(Math.pow(velx, 2) + Math.pow(vely, 2)) + this.distTravelled > 10 * wepns[this.wepnID].range) {
            this.velx = 10 * Math.cos(this.angle) * (wepns[this.wepnID].range - this.distTravelled); // checking that we don't go too far.
            this.vely = 10 * Math.sin(this.angle) * (wepns[this.wepnID].range - this.distTravelled);
        }
        this.distTravelled += wepns[this.wepnID].speed * accelMult; // This missile will try to get all the distance done.
        this.x += velx + this.emvx;
        this.y += vely + this.emvy; // move on tick
        this.emvx *= 0.95;
    }

    missileSwarmExplode () {
        for (const i in players[this.sy][this.sx]) { // spawn 1 missile for each enemy ship in sector
            const player = players[this.sy][this.sx][i];
            const r = Math.random();
            const bAngle = this.angle + r * 2 - 1;
            const dist = squaredDist(player, this);
            if ((player.color != this.color && player.disguise <= 0) && (dist < square(wepns[this.wepnID].range * 10))) {
                const r = Math.random();
                const bAngle = this.angle + r * 2 - 1;
                const missile = new Missile(this.owner, r, 10, bAngle);
                missile.x = this.x;
                missile.y = this.y;
                missile.sx = this.sx; // this is crucial, otherwise rings of fire happen
                missile.sy = this.sy; // because owner is not necessarily in the same sector as parent missile
                missile.locked = player.id;
                missiles[this.sy][this.sx][r] = missile;
            }
        }
        if (bases[this.sy][this.sx] != 0 && bases[this.sy][this.sx].color !== this.color && bases[this.sy][this.sx].baseType != DEADBASE && squaredDist(bases[this.sy][this.sx], this) < square(wepns[this.wepnID].range * 10)) {
            const r = Math.random();
            const bAngle = this.angle + r * 2 - 1;
            let wepid = 10; // Normal Missile
            if (squaredDist(bases[this.sy][this.sx], this) < square(wepns[11].range * 10)) wepid = 11; // Heavy Missile
            const missile = new Missile(this.owner, r, wepid, bAngle);
            missile.x = this.x;
            missile.y = this.y;
            missile.sx = this.sx; // this is crucial, otherwise rings of fire happen
            missile.sy = this.sy; // because owner is not necessarily in the same sector as parent missile
            missile.locked = bases[this.sy][this.sx].id;
            missiles[this.sy][this.sx][r] = missile;
        }
        this.die(); // and then die
    }

    die () {
        sendAllSector(`sound`, { file: `boom`, x: this.x, y: this.y, dx: this.vx, dy: this.vy }, this.sx, this.sy);
        delete missiles[this.sy][this.sx][this.id];
    }
}

module.exports = Missile;
