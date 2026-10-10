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

global.pdist = function (x, sx, sy) { // used in blast collision algorithm
    const i1 = ((sx * sx * sx + sy * sy) % 5 + 1) / 2.23; // Geometric mean of 5 and 1
    const i2 = ((sx * sx + sy) % 5 + 1) / 2.23;
    return (Math.cbrt(Math.abs(Math.tan(x))) % i2) * 3500 * i2 + 800 * i1 + 600;
};

global.squaredDist = (a, b) => // distance between two points squared. i.e. c^2
    Math.pow(a.y - b.y, 2) + Math.pow(a.x - b.x, 2);

global.square = (x) => Math.pow(x, 2);

global.secs = (x) => 25 * x;

global.chatWeapon = (w) => weaponCircumfix + w + weaponCircumfix;
global.chatColor = (c) => colorCircumfix + c + colorCircumfix;
global.chatTranslate = (t) => translateCircumfix + t + translateCircumfix;

global.colorSelect = function (col, red, blue, green, yellow = undefined) {
    if (col === `red`) return red;
    if (col === `blue`) return blue;
    if (col === `green` || yellow === undefined) return green;
    return yellow;
};

global.updateElo = function (winner, loser) {
    probabilityThatHappened = eloProbability(winner.elo, loser.elo);
    probabilityThatDidntHappen = eloProbability(loser.elo, winner.elo);
    winner.elo += eloVolatility * (1 - probabilityThatHappened); // note- do not substitute the function calls into these two lines because of codependence.
    loser.elo += eloVolatility * (0 - probabilityThatDidntHappen); // leave as 4 lines.
};
global.eloProbability = function (rating1, rating2) {
    return 1.0 / (1.0 + Math.pow(10.0, (rating1 - rating2) / 400.0));
};

global.findBisector = function (a1, a2) { // finds the angle bisector of a1 and a2
    a1 = a1 * 180 / Math.PI;
    a2 = a2 * 180 / Math.PI;
    a1 = mod(a1, 360);
    a2 = mod(a2, 360);
    const small = Math.min(a1, a2);
    const big = Math.max(a1, a2);
    let angle = (big - small) / 2 + small;
    if (big - small > 180) angle += 180;
    return angle * Math.PI / 180;
};

global.atan = function (y, x) { // arctangent, but fast
    const a = Math.min(Math.abs(x), Math.abs(y)) / Math.max(Math.abs(x), Math.abs(y));
    const s = a * a;
    let r = ((-0.0464964749 * s + 0.15931422) * s - 0.327622764) * s * a + a;
    if (Math.abs(y) > Math.abs(x)) r = 1.57079637 - r;
    if (x < 0) r = 3.14159274 - r;
    if (y < 0) r = -r;
    return r;
};

global.obtainSXDrift = function (asx, bsx, gsx = sectorWidth, numSec = mapSz) { // obtainSXDrift(player, other)
    if (Object.is(asx, null) || Object.is(asx, undefined) || Object.is(bsx, null) || Object.is(bsx, undefined)) {
        console.warn(`asx is ${asx} , bsx is ${bsx} , gsx is ${gsx} and numSec = ${numSec}`);
        return 0;
    }

    let sectorDiffX = bsx - asx; // 0 - 6 = -6 // 6 - 0 = 6
    // console.log(`TO-DO sector X Difference 1 is = `, sectorDiffX);
    let sectorDiffXab = Math.abs(sectorDiffX); // Sectors on X loop // -6 -> 6 // 6 -> 6
    let sectorDiffXa = Math.min(sectorDiffXab, (numSec - sectorDiffXab)); // Math.min(sectorDiffXab, (numSec - sectorDiffXab));  // min(6, 7 - 6) = 1 // min(6, 7 - 6) = 1
    if (((sectorDiffXa + asx) % numSec) == bsx) { // (1 + 6) % 7 = 0 === 0 // (1 + 0) % 7 = 1 !== 6
        sectorDiffX = sectorDiffXa;
    } else {
        sectorDiffX = -sectorDiffXa; // 1 -> -1
    }
    // console.log(`TO-DO sector X Difference 2...  sectorDiffXab = `, sectorDiffXab, ` sectorDiffXa = `, sectorDiffXa, `, sectorDiffX = `, sectorDiffX);
    sectorDiffX = sectorDiffX * gsx;
    return sectorDiffX;
};

global.obtainSYDrift = function (asy, bsy, gsy = sectorWidth, numSec = mapSz) {
    if (Object.is(asy, null) || Object.is(asy, undefined) || Object.is(bsy, null) || Object.is(bsy, undefined)) {
        console.warn(`asy is ${asy} , bsy is ${bsy} , gsy is ${gsy} and numSec = ${numSec}`);
        return 0;
    }
    let sectorDiffY = bsy - asy; // Sectors on Y do not loop
    // console.log("TO-DO sector Y Difference is = ", sectorDiffY, " and we return ", sectorDiffY * gsy)
    sectorDiffY = sectorDiffY * gsy;
    return sectorDiffY;
};

global.calculateInterceptionAngle = function (ax, ay, vx, vy, bx, by, s) { // for finding where to shoot at a moving object
    const ox = ax - bx;
    const oy = ay - by;

    const h1 = vx * vx + vy * vy - s * s;
    const h2 = ox * vx + oy * vy;
    let t;
    if (h1 == 0) { // problem collapses into a simple linear equation
        t = -(ox * ox + oy * oy) / (2 * h2);
    } else { // solve the quadratic equation
        const minusPHalf = -h2 / h1;

        const discriminant = minusPHalf * minusPHalf - (ox * ox + oy * oy) / h1; // term in brackets is h3
        if (discriminant < 0) return Math.atan2(by - ay, bx - ax); // complex solution

        const root = Math.sqrt(discriminant);

        const t1 = minusPHalf + root;
        const t2 = minusPHalf - root;

        const tMin = Math.min(t1, t2);
        const tMax = Math.max(t1, t2);

        t = tMin > 0 ? tMin : tMax; // get the smaller of the two times, unless it's negative
        if (t < 0) return Math.atan2(by - ay, bx - ax); // solution in the past
    }

    // calculate the point of interception using the found intercept time
    const ix = ax + t * vx; const iy = ay + t * vy;
    return Math.atan2(by - iy, bx - ix) + Math.PI;
};

global.angleBetween = (a, b) => // delimited to [-pi,pi]
    Math.atan2(a.y - b.y, a.x - b.x);

global.angleGlobalBetween = function (a, b, gsy, gsx, numSec) { // considers different sectors. Delimited to [-pi,pi]
    /*
    let sectorDiffX = a.sx - b.sx;
    let sectorDiffXa = Math.abs(sectorDiffX); // Sectors on X loop
    sectorDiffXa = Math.min(sectorDiffXa, (numSec - sectorDiffXa));

    if (sectorDiffX > 0 && sectorDiffXa == sectorDiffX) {
        sectorDiffX = sectorDiffXa;
    } else {
        sectorDiffX = -sectorDiffXa;
    }
    sectorDiffX = sectorDiffX * gsx;

    let sectorDiffY = a.sy - b.sy; // Sectors on Y do not loop
    sectorDiffY = sectorDiffY * gsy;
    */

    const sectorDiffX = obtainSXDrift(b.sx, a.sx, gsx, numSec);
    const sectorDiffY = obtainSYDrift(b.sy, a.sy, gsy, numSec);

    return Math.atan2(a.y - b.y + sectorDiffY, a.x - b.x + sectorDiffX);
};

global.squaredDist = (a, b) => // distance between two points squared. i.e. c^2
    square(a.y - b.y) + square(a.x - b.x);

global.squaredGlobalDist = function (a, b, gsy, gsx, numSec) { // distance between two points squared, taking into account sector configuration. i.e. c^2
    /*
    let sectorDiffX = a.sx - b.sx;
    let sectorDiffXab = Math.abs(sectorDiffX); // Sectors on X loop
    let sectorDiffXa = Math.min(sectorDiffXab, (numSec - sectorDiffXab));

    sectorDiffXa = Math.min(sectorDiffXa, (numSec - sectorDiffXa));

    if (sectorDiffX > 0 && sectorDiffXa == sectorDiffX) {
        sectorDiffX = sectorDiffXa;
    } else {
        sectorDiffX = -sectorDiffXa;
    }
    sectorDiffX = sectorDiffX * gsx;

    let sectorDiffY = (a.sy - b.sy) * gsy; // Sectors on Y do not loop
    */

    const sectorDiffX = obtainSXDrift(b.sx, a.sx, gsx, numSec);
    const sectorDiffY = obtainSYDrift(b.sy, a.sy, gsy, numSec);

    return square(a.y - b.y + sectorDiffY) + square(a.x - b.x + sectorDiffX);
};

global.hypot2 = (a, b, c, d) => square(a - b) + square(c - d);
global.expToLife = (exp, guest) => Math.floor(guest ? 0 : 800000 * Math.atan(exp / 600000.0)) + 500;
global.mod = function (n, m) { // used in findBisector
    const remain = n % m;
    return Math.floor(remain >= 0 ? remain : remain + m);
};

global.techPriceForDowngrade = function (x, isVip) { // money required to upgrade Tech
    if (isVip) return techEnergy(lastTechLevel(x)) - techEnergy(x);
    return Math.max(techEnergy(lastTechLevel(x)) - techEnergy(x), -300000000);
};

global.techPrice = (x) => // money required to upgrade Tech
    techEnergy(nextTechLevel(x)) - techEnergy(x);

global.techEnergy = (x) => // Net price of some tech level
    Math.round(Math.pow(1024, x) / 1000) * 500;

global.nextTechLevel = (x) => Math.floor(x * 8.0 + 1) / 8.0;

global.lastTechLevel = (x) => Math.floor(x * 8.0 - 0.001) / 8.0;
