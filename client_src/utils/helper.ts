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

import { translate } from '../localizer';

declare const sectorWidth: number;
declare const expToRank: number[];

declare const bigNotes: any[];
declare const wepns: any;

declare const iron: string;
declare const silver: string;
declare const platinum: string;
declare const copper: string;

declare let rank: number;
declare let guest: number;
declare let experience: number;
declare let myName: string;

declare let lagArr: any;
declare let secret2PlanetName: any;

// Calculate sins.
const sins = [];
for (let i = 0; i < 1571; i++) sins[i] = Math.sin(i / 1e3);

/**
 * Get the sector name from given coordinates.
 * @param x The sector's row.
 * @param y The sector's column.
 * @returns A string representation of the sector name.
 */
const getSectorName = (x: number, y: number) => `${String.fromCharCode(97 + x).toUpperCase()}${y + 1}`;

/**
 * Get the description of a quest.
 * @param q The quest to parse.
 * @returns A string representation of the quest description.
 */
const getQuestDescription = (q: any) => {
    if (q.type === `Mining`) return translate(`Bring # units of # to sector #.`, [numToLS(q.amt), q.metal, getSectorName(q.sx, q.sy)]);
    else if (q.type === `Base`) {
        if (rank > 6) return translate(`Eliminate enemy base in sector #.`, [getSectorName(q.sx, q.sy)]);
        else return translate(`Quest Locked!`);
    } else if (q.type === `Delivery`) return translate(`Obtain package from planet # and deliver it to planet #.`, [getSectorName(q.sx, q.sy), getSectorName(q.dsx, q.dsy)]);
    else if (q.type === `Secret`) {
        if (rank > 14) return translate(`Proceed to sector # for further instructions.`, [getSectorName(q.sx, q.sy)]);
        else return translate(`Quest Locked!`);
    } else if (q.type === `Secret2`) return translate(`Eliminate all enemy players and turrets in # and visit planet #.`, [getSectorName(q.sx, q.sy), secret2PlanetName]);
    else if (q.type === `Secret3`) return translate(`Deliver package to a permanent black hole sector.`);
    else return `QUEST_DESCRIPTION_ERROR`;
};

/**
 * Get the current clocked shade of the RGB spectrum.
 * @returns RGBA color string.
 */
const getRainbowColor = () => {
    const t = new Date().getTime() / (35 * 16);
    const r = Math.floor(16 * Math.sqrt(Math.sin(t) * 128 + 128));
    const g = Math.floor(16 * Math.sqrt(Math.sin(t + Math.PI * 2 / 3) * 128 + 128));
    const b = Math.floor(16 * Math.sqrt(Math.sin(t + Math.PI * 4 / 3) * 128 + 128));
    return `rgba(${r}, ${g}, ${b}, 1)`;
};

/**
 * Get the corresponding color of a given metal code
 * @returns RGB color string.
 */
const metalToColor = (i: number) => {
    const colorArray = [`#d44`, `#eef`, `#90f`, `#960`];
    return colorArray[i];
};

/**
 * Get the corresponding name of a given metal code
 * @returns Uncapitalized english metal name.
 */
const metalToName = (i: number) => {
    const nameArray = [`iron`, `silver`, `platinum`, `copper`];
    return nameArray[i];
};

/**
 * Get the corresponding quantity owned of a given metal code
 * @returns Number.
 */
const metalToQuantity = (i: number) => {
    const nameArray = [iron, silver, platinum, copper];
    return nameArray[i];
};

/**
 * Write some content to be rendered by the canvas.
 * @param context The rendering context of the canvas to write to.
 * @param str The string to write.
 * @param x The x-coordinate of the text location.
 * @param y The y-coordinate of the text location.
 */
const write = (context: CanvasRenderingContext2D, str: string, x: number, y: number) => {
    context.fillText(str, x, y);
};

/**
 * Get the current mouse position relative to the canvas.
 * @param canvas The reference element being used.
 * @param e The mouse event emitted.
 * @returns An object representation of the relative mouse coordinates.
 */
const getMousePos = (canvas: HTMLCanvasElement, e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
};

/**
 * Square a number.
 * @param x The number to be squared.
 * @returns A numerical representation of the product.
 */
const square = (x: number) => x ** 2;

/**
 * Cube a number.
 * @param x The number to be cubed.
 * @returns A numerical representation of the product.
 */
const cube = (x: number) => x ** 3;

/**
 * Calculate the lowest sin based on a given number.
 * @param x A given number.
 * @returns A numerical representation of the sin.
 */
const sinLow = (x: number) => {
    x += Math.PI * 200;
    x %= Math.PI * 2;

    const modPI = x % Math.PI;
    return (x > Math.PI ? -1 : 1) * sins[Math.floor(((modPI < Math.PI / 2) ? (modPI) : (Math.PI - modPI)) * 1000)];
};

/**
 * Calculated the lowest cosin based on a given number.
 * @param x A given number.
 * @returns A numerican representation of the cosin.
 */
const cosLow = (x: number) => sinLow((Math.PI / 2) + x);

// TODO: Elaborate on parameters in JSDoc comment.
// TODO: Refactor all calls into RGB from RBG.

/**
 * Get the value of a certain division of a color.
 * @param col The division of the color to select from
 * @param red The value of red in the RGB string.
 * @param blue The value of blue in the RGB string.
 * @param green The value of green in the RGB string.
 * @returns A numerical representation of that value.
 */
const colorSelect = (col: string, red: number, blue: number, green: number) => {
    if (col === `red`) return red;
    else if (col === `blue`) return blue;
    else return green;
};

/**
 * Get the experience required to level up to the next rank.
 * @param rank The rank
 * @returns The experience needed to level up to the next rank.
 */
const rankToExp = (rank: number) => {
    return rank < 0 ? 0 : expToRank[rank];
};

// TODO: Add JSDoc comment.
const coherentNoise = (x: number) => {
    const intX = Math.floor(x);
    const w = x - intX;

    const n0 = Math.sin(square(intX) * 1000);
    const n1 = Math.sin(square(intX + 1) * 1000);

    return n0 + (n1 - n0) * (w * w / 2 - w * w * w / 3) * 6;
};

// TODO: Add JSDoc comment.
const lerp = (a: number, b: number, w: number) => a * (1 - w) + b * w;

/**
 * Get the amount of money required to buy a life.
 * @returns A numerical representation of the amount.
 */
const expToLife = () => Math.floor(guest ? 0 : 800000 * Math.atan(experience / 600000.0)) + 500;

/**
 * Get the abbreviated form of a number.
 * @param num The number to abbreviate.
 * @returns A string representation of the abbreviation.
 */
const abbrevInt = (num: number) => {
    if (num < 1e4) return `${Math.round(num)}`;
    if (num < 1e7) return Math.round(num / 1e3) + translate(`K`);
    if (num < 1e10) return Math.round(num / 1e6) + translate(`M`);
};

// TODO: Add JSDoc comment.
const lagMath = (arr: any) => {
    if (lagArr == 0) {
        lagArr = arr;
        return;
    }

    for (let i = 0; i < arr.length; i++) lagArr[i] = (lagArr[i] + arr[i] / 20) / 1.05;
};

/**
 * Add a note.
 * @param note The note to add.
 */
const addBigNote = (note: number) => {
    let i = 0;

    for (i; i < 4; i++) if (bigNotes[i] == -1) break;
    bigNotes[i] = note;
};

// TODO: Add JSDoc comment.
const bgPos = (x: number, px: number, scrx: any, i: number, tileSize: any) => ((scrx - px) / ((sectorWidth / tileSize) >> i)) % tileSize + tileSize * x;

/**
 * Get the ID of a matching weapon order.
 * @param x The order of a weapon.
 * @returns The ID of the matching weapon order.
 */
const weaponWithOrder = (x: any) => {
    for (const i in wepns) if (wepns[i].order == x) return parseInt(i);
};

/**
 * Get the time angle.
 * @returns Numerical representation of the time angle.
 */
const getTimeAngle = () => tick / 10;

/**
 * Get the corresponding color of a team.
 * @param x The team to get the color of.
 * @returns A string representation of the color.
 */
const brighten = (x: string) => {
    if (x === `red`) return `pink`;
    else if (x === `green`) return `lime`;
    else if (x === `blue`) return `cyan`;
    else return x;
};

// TODO: Add JSDoc comment.
const numToLS = (x: number) => {
    if (!Number.isFinite(x)) return `NaN`;
    if (x > 1000000000000000) return `lots`;

    if (x < 0) return `-${numToLS(-x)}`;
    if (x == 0) return `0`;

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

/**
 * Get the monetary amount required to upgrade tech.
 * @param tech The tech level to calculate with.
 * @returns A numerical representation of the amount.
 */
const techPrice = (tech: number) => techEnergy(nextTechLevel(tech)) - techEnergy(tech);

/**
 * Get the monetary amount required to downgrade tech.
 * @param tech The tech level to calculate with.
 * @param paid Whether the user has paid for VIP or a higher rank.
 * @returns A numerical representation of the amount.
 */
const techPriceForDowngrade = (tech: number, paid: boolean) => {
    return paid
        ? techEnergy(lastTechLevel(tech)) - techEnergy(tech)
        : Math.max(techEnergy(lastTechLevel(tech)) - techEnergy(tech), -300000000);
};

/**
 * Get the net worth of some tech level.
 * @param tech The tech level to calculate with.
 * @returns A numerical representation of the amount.
 */
const techEnergy = (tech: number) => Math.round(Math.pow(1024, tech) / 1000) * 500;

/**
 * Get the next tech level.
 * @param tech The tech level to calculate with.
 * @returns A numerical representation of the amount.
 */
const nextTechLevel = (tech: number) => Math.floor(tech * 8 + 1) / 8;

/**
 * Get the previous tech level.
 * @param tech The tech level to calculate with.
 * @returns A numerical representation of the amount.
 */
const lastTechLevel = (tech: number) => Math.floor(tech * 8 - 0.001) / 8;

/**
 * Split a string based on a substring.
 * @param string The string to split.
 * @param subString The substring to split with.
 * @param limit The number of maximum splits.
 * @returns A numerical representation of the length of the new string.
 */
const getPosition = (string: string, subString: string, limit: number) => string.split(subString, limit).join(subString).length;

/**
 * Get the definition of an ammo code.
 * @param code The ammo code.
 * @returns A string representation of the ammo code definition.
 */
const ammoCodeToString = (code: number) => {
    if (code >= 0) return `${code}`;
    else if (code == -1) return translate(`Inf.`);
    else if (code == -2) return translate(`Only One`);
    else return ``;
};

export {
    getSectorName,
    getQuestDescription,
    getRainbowColor,
    write,
    getMousePos,
    square,
    cube,
    sinLow,
    cosLow,
    colorSelect,
    rankToExp,
    coherentNoise,
    lerp,
    expToLife,
    abbrevInt,
    lagMath,
    addBigNote,
    bgPos,
    weaponWithOrder,
    getTimeAngle,
    brighten,
    numToLS,
    techPrice,
    techPriceForDowngrade,
    techEnergy,
    getPosition,
    ammoCodeToString,
    metalToColor,
    metalToQuantity,
    metalToName
};
