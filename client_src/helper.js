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

import { translate } from "./localizer.ts";

global.getSectorName = (inx, iny) => `${String.fromCharCode(97 + inx).toUpperCase()}${iny + 1}`;

global.getQuestDescription = function (q) {
    if (q.type === `Mining`) return translate(`Bring # units of # to sector #.`, [numToLS(q.amt), q.metal, getSectorName(q.sx, q.sy)]);
    if (q.type === `Base`) {
        if (rank > 6) return translate(`Eliminate enemy base in sector #.`, [getSectorName(q.sx, q.sy)]);
        else return translate(`Quest Locked!`);
    }
    if (q.type === `Delivery`) return translate(`Obtain package from planet # and deliver it to planet #.`, [getSectorName(q.sx, q.sy), getSectorName(q.dsx, q.dsy)]);
    if (q.type === `Secret`) {
        if (rank > 14) return translate(`Proceed to sector # for further instructions.`, [getSectorName(q.sx, q.sy)]);
        else return translate(`Quest Locked!`);
    }
    if (q.type === `Secret2`) return translate(`Eliminate all enemy players and turrets in # and visit planet #.`, [getSectorName(q.sx, q.sy), secret2PlanetName]);
    if (q.type === `Secret3`) return translate(`Deliver package to a permanent black hole sector.`);
    console.log(q);
    return `QUEST_DESCRIPTION_ERROR`;
};

global.getRainbowColor = function (seed) {
    const t = new Date().getTime() / (35 * 16);
    const r = Math.floor(16 * Math.sqrt(Math.sin(t) * 128 + 128));
    const g = Math.floor(16 * Math.sqrt(Math.sin(t + Math.PI * 2 / 3) * 128 + 128));
    const b = Math.floor(16 * Math.sqrt(Math.sin(t + Math.PI * 4 / 3) * 128 + 128));
    return `rgba(${r}, ${g}, ${b}, 1)`;
};

global.write = function (context, str, x, y) {
    context.fillText(str, x, y);
};

global.getMousePos = function (canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
};

global.cube = (x) => x * x * x;

global.sins = [];
for (let i = 0; i < 1571; i++) {
    // 500pi
    global.sins[i] = Math.sin(i / 1000.0);
}

global.sinLow = function (x) {
    x += Math.PI * 200;
    x %= Math.PI * 2;
    const modpi = x % Math.PI;
    return (x > Math.PI ? -1 : 1) * sins[Math.floor(((modpi < Math.PI / 2) ? (modpi) : (Math.PI - modpi)) * 1000)];
};
global.cosLow = (x) => sinLow(x + Math.PI / 2);

global.colorSelect = function (col, red, blue, green) { // should be RGB, not RBG. Same error on the server side. TODO
    if (col === `red`) return red;
    if (col === `blue`) return blue;
    return green;
};
global.square = (x) => x * x;
global.r2x = function (x) {
    const ranks = [0, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 4000, 8000, 14000, 20000, 40000, 70000, 100000, 140000, 200000, 300000, 500000, 800000, 1000000, 1500000, 2000000, 3000000, 5000000, 8000000, 12000000, 16000000, 32000000, 64000000, 100000000, 200000000, 400000000, 1000000000];
    return x < 0 ? 0 : ranks[x];
};
global.CoherentNoise = function (x) {
    const intX = Math.floor(x);
    const w = x - intX;
    const n0 = Math.sin(square(intX) * 1000);
    const n1 = Math.sin(square(intX + 1) * 1000);
    return n0 + (n1 - n0) * (w * w / 2 - w * w * w / 3) * 6;
};
global.lerp = (a, b, w) => a * (1 - w) + b * w;

global.expToLife = () => Math.floor(guest ? 0 : 800000 * Math.atan(experience / 600000.0)) + 500;
global.abbrevInt = function (x) {
    if (x < 10000) return `${Math.round(x)}`;
    if (x < 10000000) return Math.round(x / 1000) + translate(`K`);
    if (x < 10000000000) return Math.round(x / 1000000) + translate(`M`);
};
global.lagMath = function (arr) {
    if (lagArr === 0) {
        lagArr = arr;
        return;
    }
    for (let i = 0; i < arr.length; i++) {
        lagArr[i] = (lagArr[i] + arr[i] / 20) / 1.05;
    }
};
global.addBigNote = function (note) {
    // set i to the least empty index of bigNotes
    let i = 0;
    for (i; i < 4; i++) if (bigNotes[i] === -1) break;

    // and use that index for queue
    bigNotes[i] = note;
};
global.bgPos = (x, px, scrx, i, tileSize) => ((scrx - px) / ((sectorWidth / tileSize) >> i)) % tileSize + tileSize * x;
global.weaponWithOrder = function (x) {
    for (const i in wepns) if (wepns[i].order === x) return parseInt(i);
};
global.getTimeAngle = () => tick / 10;
global.brighten = function (x) {
    if (x === `red`) return `pink`;
    if (x === `green`) return `lime`;
    if (x === `blue`) return `cyan`;
    return x;
};

global.numToLS = function (x) {
    if (!Number.isFinite(x)) return `NaN`;
    if (x < 0) return `-${numToLS(-x)}`;
    if (x === 0) return `0`;
    const intx = Math.floor(x);
    const decimal = x - intx;
    let str = (`${parseFloat(decimal.toFixed(4))}`).substring(1);
    x = intx;
    while (x != 0) {
        let nextBit = `${x % 1000}`;
        if (x < 1000) str = nextBit + str;
        else {
            while (nextBit.length < 3) nextBit = `0${nextBit}`;
            str = `,${nextBit}${str}`;
        }
        x = Math.floor(x / 1000);
    }
    return str;
};

global.techPrice = (x) => // money required to upgrade Tech
    techEnergy(nextTechLevel(x)) - techEnergy(x);
global.techPriceForDowngrade = function (x) { // money required to upgrade Tech
    if (myName.startsWith(`[V] `)) return techEnergy(lastTechLevel(x)) - techEnergy(x);
    return Math.max(techEnergy(lastTechLevel(x)) - techEnergy(x), -300000000);
};
global.techEnergy = (x) => // Net price of some tech level
    Math.round(Math.pow(1024, x) / 1000) * 500;
global.nextTechLevel = (x) => Math.floor(x * 8.0 + 1) / 8.0;
global.lastTechLevel = (x) => Math.floor(x * 8.0 - 0.001) / 8.0;
global.getPosition = (string, subString, index) => string.split(subString, index).join(subString).length;
global.ammoCodeToString = function (code) { // used in weapon shop rendering
    if (code >= 0) return `${code}`;
    if (code === -1) return translate(`Inf.`);
    if (code === -2) return translate(`Only One`);
    else return ``;
};
