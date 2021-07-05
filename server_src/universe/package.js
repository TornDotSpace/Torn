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

class Package {
    constructor (ownr, i, type) {
        this.id = i; // unique identifier
        this.type = type; // ammo? coin? lives? actual courier package?
        this.x = ownr.x;
        this.y = ownr.y;
        this.sx = ownr.sx;
        this.sy = ownr.sy;
        this.time = 0; // since spawn
    }

    tick () {
        if (this.time++ > 25 * 60) { // 1 minute despawn
            sendAllSector(`sound`, { file: `boom`, x: this.x, y: this.y, dx: 0, dy: 0 }, this.sx, this.sy);
            delete packs[this.sy][this.sx][this.id];
        }
        for (const i in players[this.sy][this.sx]) { // loop for collision
            const p = players[this.sy][this.sx][i];
            if (squaredDist(p, this) < square(16 + ships[p.ship].width)) { // someone hit me
                this.onCollide(p);

                delete packs[this.sy][this.sx][this.id]; // despawn
                break; // stop looping thru players
            }
        }
    }

    onCollide (p) {
        if (this.type == 0) {
            p.checkRandomAchievements(true, false, true);

            const possible = [`money`, `ore`];
            const contents = possible[Math.floor(Math.random() * 2)]; // figure out what reward to give

            let amt = Math.floor(Math.random() * 2000) + 2000; // how much ore we're gonna give
            if (contents == `ore`) {
                const left = p.capacity - p.iron - p.copper - p.silver - p.platinum; // how much more cargo space they have
                if (amt > left) { // if they don't have enough cargo space for the ore we're about to give
                    amt = left; // give them as much as they can take
                    p.strongLocal(`Cargo Bay Full`, p.x, p.y + 256); // tell them they have no room left
                }
                amt /= 4; // give them some of each
                p.iron += amt;
                p.platinum += amt;
                p.copper += amt;
                p.silver += amt;
            } else if (contents == `money`) p.spoils(`money`, 20000);

            let title = `Package collected: `; // the message we're going to send them
            if (contents == `ore`) title += `${amt * 4} ore!`;
            if (contents == `money`) title += `20000 money!`;
            p.strongLocal(title, p.x, p.y - 192); // send it
        } else if (this.type == 1) p.spoils(`money`, 5000); // coin
        else if (this.type == 2) {
            if (p.lives < 20) p.spoils(`life`, 1); // floating life
            else p.spoils(`money`, Math.floor(800000 * 2 * Math.atan(p.experience / 600000.0)) + 500); // reward the player the price of two lifes
        } else if (this.type == 3) p.refillAllAmmo(); // ammo package
    }
}

module.exports = Package;
