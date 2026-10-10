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

        this.wepnID = weaponID;
        this.time = 0; // Time since weapon spawn.
    }

    tick () {
        this.time++;

        if (this.time > 11) delete blasts[this.sy][this.sx][this.id];
        else if (this.time === 1) {
            const fullplayers = get9SectorDict(players, this.sx, this.sy);
            // for (const i in players[this.sy][this.sx]) {
            for (const i in fullplayers) {
                // const player = players[this.sy][this.sx][i];
                const player = fullplayers[i];
                const extraX = obtainSXDrift(player.sx, this.sx);
                const extraY = obtainSYDrift(player.sy, this.sy);
                if ((this.bx - player.x + extraX) * Math.cos(this.angle) + (this.by - player.y + extraY) * Math.sin(this.angle) > 0) continue;

                const pDist = Math.hypot(player.x - this.bx - extraX, player.y - this.by - extraY);

                // Calculate beam hitbox.
                const fx = player.x - extraX - Math.cos(this.angle) * pDist;
                const fy = player.y - extraY - Math.sin(this.angle) * pDist;

                // If player hitbox collides with beam hitbox, then have an effect on the player.
                if (Math.hypot(fx - this.bx, fy - this.by) < ships[player.ship].width * 2 / 3) this.hit(player);
            }
            const fullmissiles = get9SectorDict(missiles, this.sx, this.sy);
            // for (const i in missiles[this.sy][this.sx]) {
            for (const i in fullmissiles) {
                const missile = fullmissiles[i];
                const extraX = obtainSXDrift(missile.sx, this.sx);
                const extraY = obtainSYDrift(missile.sy, this.sy);
                if ((this.bx - missile.x + extraX) * Math.cos(this.angle) + (this.by - missile.y + extraY) * Math.sin(this.angle) > 0) continue;

                const pDist = Math.hypot(missile.x - this.bx - extraX, missile.y - this.by - extraY);

                const fx = missile.x - extraX - Math.cos(this.angle) * pDist;
                const fy = missile.y - extraY - Math.sin(this.angle) * pDist;
                if (Math.hypot(fx - this.bx, fy - this.by) < 64 * 2 / 3) missile.die(); // hits the missile.
            }
            const fullmines = get9SectorDict(mines, this.sx, this.sy);
            for (const i in fullmines) {
                const m = fullmines[i];
                const extraX = obtainSXDrift(m.sx, this.sx);
                const extraY = obtainSYDrift(m.sy, this.sy);
                if ((this.bx - m.x + extraX) * Math.cos(this.angle) + (this.by - m.y + extraY) * Math.sin(this.angle) > 0) continue;

                const pDist = Math.hypot(m.x - this.bx - extraX, m.y - this.by - extraY);

                const fx = m.x - extraX - Math.cos(this.angle) * pDist;
                const fy = m.y - extraY - Math.sin(this.angle) * pDist;
                if (Math.hypot(fx - this.bx, fy - this.by) < 64 * 2 / 3 && ((m.wepnID != 50) || (m.wepnID == 50 && m.color == !this.owner.color))) m.die(); // hits the mine.
            }

            if (this.wepnID !== 25) {
                const fullasts = get9SectorDict(asts, this.sx, this.sy);
                for (const i in fullasts) {
                    const ast = fullasts[i];
                    const extraX = obtainSXDrift(ast.sx, this.sx);
                    const extraY = obtainSYDrift(ast.sy, this.sy);
                    if ((this.bx - ast.x + extraX) * Math.cos(this.angle) + (this.by - ast.y + extraY) * Math.sin(this.angle) > 0) continue;

                    const pDist = Math.hypot(ast.x - this.bx - extraX, ast.y - this.by - extraY);

                    const fx = ast.x - extraX - Math.cos(this.angle) * pDist;
                    const fy = ast.y - extraY - Math.sin(this.angle) * pDist;
                    if (Math.hypot(fx - this.bx, fy - this.by) < 64 * 2 / 3) ast.dmg(this.dmg, this); // hits the asteroid.
                }
            }
            const fullbases = get9SectorDict(bases, this.sx, this.sy);
            for (const id in fullbases) {
                const base = fullbases[id];
                if (base === undefined || base === 0 || base.baseType === DEADBASE || base.color === this.owner.color) continue;
                const extraX = obtainSXDrift(base.sx, this.sx);
                const extraY = obtainSYDrift(base.sy, this.sy);
                if ((this.bx - base.x + extraX) * Math.cos(this.angle) + (this.by - base.y + extraY) * Math.sin(this.angle) > 0) continue;

                const pDist = Math.hypot(base.x - this.bx - extraX, base.y - this.by - extraY);

                const fx = base.x - extraX - Math.cos(this.angle) * pDist;
                const fy = base.y - extraY - Math.sin(this.angle) * pDist;

                if (Math.hypot(fx - this.bx, fy - this.by) < 128 * 2 / 3) this.hit(base);
            }
        }
    }

    hit (b) {
        if (this.wepnID === 25 && this.owner.color !== b.color) b.EMP(126 * 2); // emp blast
        else if ((this.wepnID === 34 || this.wepnID === 47) && this.owner.color !== b.color) b.dmg(this.dmg, this); // muon and lepton
        else if (this.wepnID === 41) b.brainwashedBy = this.owner.id; // brainwashing laser
    }
}

module.exports = Blast;
