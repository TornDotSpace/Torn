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

class Blast {
    constructor (owner, id, weaponID) {
        this.type = `Blast`;
        this.id = id; // Unique identifier.

        this.dmg = wepns[weaponID].damage;

        this.sx = owner.sx;
        this.sy = owner.sy;

        this.owner = owner;

        this.angle = owner.angle;

        this.bx = owner.x;
        this.by = owner.y;

        this.weaponID = weaponID;
        this.time = 0; // Time since weapon spawn.
    }

    tick () {
        this.time++;

        if (this.time > 11) delete blasts[this.sy][this.sx][this.id];
        else if (this.time === 1) {
            for (const i in players[this.sy][this.sx]) {
                const player = players[this.sy][this.sx][i];
                if ((this.bx - player.x) * Math.cos(this.angle) + (this.by - player.y) * Math.sin(this.angle) > 0) continue;

                const pDist = Math.hypot(player.x - this.bx, player.y - this.by);

                // Calculate beam hitbox.
                const fx = player.x - Math.cos(this.angle) * pDist;
                const fy = player.y - Math.sin(this.angle) * pDist;

                // If player hitbox collides with beam hitbox, then have an effect on the player.
                if (Math.hypot(fx - this.bx, fy - this.by) < ships[player.ship].width * 2 / 3) this.hit(player);
            }

            for (const i in missiles[this.sy][this.sx]) {
                const missile = missiles[this.sy][this.sx][i];
                if ((this.bx - missile.x) * Math.cos(this.angle) + (this.by - missile.y) * Math.sin(this.angle) > 0) continue;

                const pDist = Math.hypot(missile.x - this.bx, missile.y - this.by);

                const fx = missile.x - Math.cos(this.angle) * pDist;
                const fy = missile.y - Math.sin(this.angle) * pDist;
                if (Math.hypot(fx - this.bx, fy - this.by) < 64 * 2 / 3) missile.die(); // hits the missile.
            }

            for (const i in mines[this.sy][this.sx]) {
                const m = mines[this.sy][this.sx][i];
                if ((this.bx - m.x) * Math.cos(this.angle) + (this.by - m.y) * Math.sin(this.angle) > 0) continue;

                const pDist = Math.hypot(m.x - this.bx, m.y - this.by);

                const fx = m.x - Math.cos(this.angle) * pDist;
                const fy = m.y - Math.sin(this.angle) * pDist;
                if (Math.hypot(fx - this.bx, fy - this.by) < 64 * 2 / 3) m.die(); // hits the mine.
            }

            if (this.weaponID !== 25) {
                for (const i in asts[this.sy][this.sx]) {
                    const ast = asts[this.sy][this.sx][i];
                    if ((this.bx - ast.x) * Math.cos(this.angle) + (this.by - ast.y) * Math.sin(this.angle) > 0) continue;

                    const pDist = Math.hypot(ast.x - this.bx, ast.y - this.by);

                    const fx = ast.x - Math.cos(this.angle) * pDist;
                    const fy = ast.y - Math.sin(this.angle) * pDist;
                    if (Math.hypot(fx - this.bx, fy - this.by) < 64 * 2 / 3) ast.dmg(this.dmg, this); // hits the asteroid.
                }
            }

            const base = bases[this.sy][this.sx];

            if (base.color === this.owner.color || base.baseType === DEADBASE) return;
            if ((this.bx - base.x) * Math.cos(this.angle) + (this.by - base.y) * Math.sin(this.angle) > 0) return;

            const pDist = Math.hypot(base.x - this.bx, base.y - this.by);

            const fx = base.x - Math.cos(this.angle) * pDist;
            const fy = base.y - Math.sin(this.angle) * pDist;

            if (Math.hypot(fx - this.bx, fy - this.by) < 128 * 2 / 3) this.hit(base);
        }
    }

    hit (b) {
        if (this.weaponID === 25 && this.owner.color !== b.color) b.EMP(126); // emp blast
        else if ((this.weaponID === 34 || this.weaponID === 47) && this.owner.color !== b.color) b.dmg(this.dmg, this); // muon and lepton
        else if (this.weaponID === 41) b.brainwashedBy = this.owner.id; // brainwashing laser
    }
}

module.exports = Blast;
