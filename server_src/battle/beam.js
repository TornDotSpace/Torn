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

class Beam {
    constructor (ownr, i, weaponID, enemy, orign) {
        this.type = `Beam`;
        this.id = i; // unique identifier
        this.dmg = wepns[weaponID].damage;
        this.sx = ownr.sx;
        this.sy = ownr.sy;
        this.origin = orign;
        this.owner = ownr;
        this.enemy = enemy; // person we're hitting
        this.wepnID = weaponID;
        this.time = 0; // since spawn
        if (enemy.sx !== undefined) this.esx = enemy.sx;
        else this.esx = this.sx;
        if (enemy.sy !== undefined) this.esy = enemy.sy;
        else this.esy = this.sy;
    }

    tick () {
        const thereisTarget = (this.enemy !== undefined && this.enemy !== null && this.enemy !== 0 && this.enemy.sx !== undefined);
        const thereIsOrigin = (this.origin !== undefined && this.origin !== null && this.origin !== 0 && this.origin.sx !== undefined);
        if (thereisTarget) {
            if (this.enemy.sx !== undefined && this.esx !== this.enemy.sx) this.esx = this.enemy.sx;
            if (this.enemy.sy !== undefined && this.esy !== this.enemy.sy) this.esy = this.enemy.sy;
            // if (thereIsOrigin) {
            //    if (this.origin.sx !== undefined && this.sx !== this.origin.sx) this.sx = this.origin.sx;
            //    if (this.origin.sy !== undefined && this.sy !== this.origin.sy) this.sy = this.origin.sy;
            // }
            if (this.time == 0 && this.wepnID != 44) { // don't do this for Campfire beams
                const divideBy = ((this.enemy.ship == 17) && (this.wepnID == 30 || this.wepnID == 26)) ? 2 : 1; // i think this is about mining lasers shooting elite quarrier?
                this.enemy.dmg(this.dmg / divideBy, this);

                if (this.enemy.type === `Asteroid`) this.enemy.hit = false; // Note that the asteroid is hit for elite quarrier branching
                else if (this.wepnID == 35) {
                    if (this.enemy.type === `Base`) this.enemy.reload = 15; // Jammer.
                    else this.enemy.charge = -70; // Jammer.
                }
            }
        }
        this.time++;
        if (this.time > 10 || !thereisTarget || !thereIsOrigin) {
            if (beams[this.sy][this.sx][this.id] !== undefined) delete beams[this.sy][this.sx][this.id];
            if (beams[this.esy][this.esx][this.id] !== undefined) delete beams[this.esy][this.esx][this.id];
            if (thereIsOrigin && beams[this.origin.sy][this.origin.sx][this.id] !== undefined) delete beams[this.origin.sy][this.origin.sx][this.id];
        }
    }
}

module.exports = Beam;
