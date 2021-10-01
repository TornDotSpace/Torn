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

class Planet {
    constructor (i, name) {
        this.type = `Planet`;
        this.name = name;
        this.color = `yellow`;
        this.owner = 0; // string name of the player who owns it.
        this.id = i; // unique identifier
        this.x = sectorWidth / 2; // this is updated by the createPlanet function to a random location
        this.y = sectorWidth / 2;
        this.cooldown = 0; // to prevent chat "planet claimed" spam
        this.sx = 0;
        this.sy = 0;
    }

    tick () {
        this.cooldown--;
        if (tick % 12 == 6 && this.owner != 0) {
            for (const i in players[this.sy][this.sx]) {
                const p = players[this.sy][this.sx][i];
                if (this.owner === p.name) p.money = p.money + 1 + Math.floor(Math.random() * 5); // give money to owner
            }
        }
    }
}

module.exports = Planet;
