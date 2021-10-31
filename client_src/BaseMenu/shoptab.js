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
import {
    write,
    colorSelect,
    expToLife,
    weaponWithOrder,
    numToLS,
    ammoCodeToString,
    metalToQuantity,
    metalToName,
    metalToColor,
    techPrice,
    techPriceForDowngrade,
    techEnergy
} from '../utils/helper';

import socket from '../modules/socket';

const lifeShopYVal = 405;
const renderOreShopX = 160;
const renderOreShopY = 128;
const renderTechShopX = 352;
const renderTechShopY = 80;

global.rBuyShipWindow = function () {
    baseMenuCtx.fillStyle = baseMenuCtx.strokeStyle = `black`;
    baseMenuCtx.globalAlpha = 0.25;
    roundRect(baseMenuCtx, 16, 256 - 16, 256, 256, 16, true, false);
    baseMenuCtx.globalAlpha = 1;

    const d = new Date();
    const t = d.getMilliseconds() * 2 * Math.PI / 50000 + d.getSeconds() * 2 * Math.PI / 50 + d.getMinutes() * 2 * 60 * Math.PI / 50;
    const rendX = 128 + 16;
    const rendY = 128 * 3 - 16;
    let img = colorSelect(pc, redShips, blueShips, greenShips)[shipView];
    baseMenuCtx.save();
    baseMenuCtx.translate(rendX, rendY);
    baseMenuCtx.rotate(-3 * t);
    if (shipView > rank) img = Img.q;
    baseMenuCtx.drawImage(colorSelect(pc, Img.astUnderlayRed, Img.astUnderlayBlue, Img.astUnderlayGreen), -img.width / 2, -img.height / 2, img.width, img.height);
    baseMenuCtx.drawImage(img, -img.width / 2, -img.height / 2);
    baseMenuCtx.restore();

    baseMenuCtx.textAlign = `center`;
    baseMenuCtx.fillStyle = `yellow`;
    baseMenuCtx.font = `20px ShareTech`;
    write(baseMenuCtx, translate(`Upgrade Ship`), 128 + 16, 256 + 16);
    baseMenuCtx.font = `14px ShareTech`;
    write(baseMenuCtx, `${translate(`Rank`)} ${shipView}`, 128 + 16, 256 + 56);
    write(baseMenuCtx, colorSelect(pc, ships[shipView].nameA, ships[shipView].nameH, ships[shipView].nameC), 128 + 16, 256 + 40);
    baseMenuCtx.fillStyle = `yellow`;
    if (shipView > rank) baseMenuCtx.fillStyle = `red`;
    else if (ships[shipView].price > money + worth) baseMenuCtx.fillStyle = `orange`;
    else if (seller == 100) baseMenuCtx.fillStyle = `lime`;
    if (shipView != ship) write(baseMenuCtx, `$${ships[shipView].price - worth} ${translate(`[BUY]`)}`, rendX, rendY + 96);

    baseMenuCtx.textAlign = `left`;

    if (shipView <= rank) {
        const shipStatsRx = 288; const shipStatsRy = 421;
        const statArrColon = [`Thrust  : `, `Agility : `, `Health  : `, `Cargo   : `];
        const statArr = [`thrust`, `agility`, `health`, `capacity`];
        const maxStatArr = [maxShipThrust, maxShipAgility, maxShipHealth, maxShipCapacity];
        baseMenuCtx.lineWidth = 1;
        baseMenuCtx.strokeStyle = `black`;
        for (let i = 0; i < 4; i++) {
            baseMenuCtx.fillStyle = `white`;
            write(baseMenuCtx, translate(statArrColon[i]), shipStatsRx, shipStatsRy + i * 16);
            baseMenuCtx.fillStyle = `#555`;
            baseMenuCtx.fillRect(shipStatsRx + 60, shipStatsRy + i * 16 - 10, 80, 12);
            baseMenuCtx.fillStyle = compareColor(shipView, ship, statArr[i]);
            baseMenuCtx.fillRect(shipStatsRx + 60, shipStatsRy + i * 16 - 10, 80 * Math.min(ships[shipView][statArr[i]], maxStatArr[i]) / maxStatArr[i], 12);
            baseMenuCtx.strokeRect(shipStatsRx + 60, shipStatsRy + i * 16 - 10, 80 * Math.min(ships[ship][statArr[i]], maxStatArr[i]) / maxStatArr[i], 12);
            if (i == 2) {
                baseMenuCtx.fillStyle = `black`;
                write(baseMenuCtx, numToLS(ships[shipView].health), shipStatsRx + 70, shipStatsRy + i * 16 + 1);
            }
        }
        baseMenuCtx.fillStyle = `white`;
        write(baseMenuCtx, translate(`Weapons : `) + numToLS(ships[shipView].weapons), shipStatsRx, shipStatsRy + 4 * 16);
    }

    baseMenuCtx.fillStyle = `white`;
    if (shipView <= rank) { wrapText(baseMenuCtx, translate(`Description: `) + ships[shipView].desc, 512 - 64, 256 + 10 * 16 + 5, 64 * 6 - 64, 16); }

    if (shipView < ships.length) baseMenuCtx.drawImage(Img.arrow, rendX + 128 - 48, rendY - 16);
    if (shipView > 0) {
        baseMenuCtx.save();
        baseMenuCtx.translate(rendX - 128 + 32, rendY);
        baseMenuCtx.rotate(Math.PI);
        baseMenuCtx.drawImage(Img.arrow, -16, -16);
        baseMenuCtx.restore();
    }
};

function compareColor (shipView, ship, stat) {
    if (shipView == ship) return `white`;
    let gradient = `blue`;
    const owned = ships[ship][stat];
    const view = ships[shipView][stat];
    const compare = Math.min(1, view / (owned * 2));
    const r = Math.floor((1 - compare) * 255);
    const g = Math.floor(255 * compare);
    const b = Math.floor(64 * compare);
    return `rgb(${r}, ${g}, ${b})`;
}

global.rOreShop = function () {
    baseMenuCtx.textAlign = `left`;
    baseMenuCtx.fillStyle = `yellow`;
    baseMenuCtx.font = `24px ShareTech`;
    write(baseMenuCtx, translate(`Sell Ores`), 128, 96);

    const trailMult = (myTrail % 16 == 2) ? 1.05 : 1;
    baseMenuCtx.font = `14px ShareTech`;
    const metalNameArray = [`Iron:     `, `Silver:   `, `Copper:   `, `Platinum: `];
    let astImg = Img.silver;
    for (let i = 0; i < 4; i++) {
        const hover = seller == 5 + i;
        baseMenuCtx.fillStyle = (hover && metalToQuantity(i) > 0) ? `lime` : metalToColor(i);
        write(baseMenuCtx, `${metalToQuantity(i) > 0 && hover ? `${translate(`SELL`)}      ` : translate(metalNameArray[i])}$${numToLS(metalToQuantity(i) * trailMult)}`, renderOreShopX, renderOreShopY + i * 16);
        if (hover) astImg = Img[metalToName(i)];
    }

    baseMenuCtx.fillStyle = seller == 610 ? `lime` : `yellow`;
    write(baseMenuCtx, `${translate(`Sell All: `)}$${numToLS(trailMult * (copper + platinum + silver + iron))}`, renderOreShopX, renderOreShopY + 4 * 16); // Sell all

    const d = new Date();
    const stime = Math.floor((d.getMilliseconds() / 1000 + d.getSeconds()) / 60 * 1024) % 64;
    const spx = (stime % 8) * 128;
    const Secret = Math.floor((stime / 8) % 4) * 128;
    baseMenuCtx.save();
    baseMenuCtx.translate(renderOreShopX - 64, renderOreShopY + 32);
    baseMenuCtx.drawImage(astImg, spx, Secret, 128, 128, -64, -64, 128, 128);
    baseMenuCtx.restore();
};
global.rBuyLifeShop = function () {
    baseMenuCtx.fillStyle = `yellow`;
    baseMenuCtx.textAlign = `right`;
    write(baseMenuCtx, `${translate(`Lives Remaining: `) + lives} ($${expToLife()}) `, 768 - 16 - baseMenuCtx.measureText(translate(`[BUY]`)).width, lifeShopYVal);
    baseMenuCtx.fillStyle = (lives >= 20 || money < expToLife()) ? `red` : ((seller == 611) ? `lime` : `yellow`);
    write(baseMenuCtx, translate(`[BUY]`), 768 - 16, lifeShopYVal);
    baseMenuCtx.textAlign = `left`;
};
global.rWeaponsInShop = function () {
    baseMenuCtx.fillStyle = `yellow`;
    baseMenuCtx.font = `24px ShareTech`;
    write(baseMenuCtx, translate(`Weapons`), 256 + 32, 256 - 16);
    baseMenuCtx.textAlign = `left`;
    baseMenuCtx.font = `14px ShareTech`;
    baseMenuCtx.fillStyle = seller == 601 ? `lime` : `yellow`;
    write(baseMenuCtx, translate(`[View All]`), 512 - 64, 256 - 16);
    baseMenuCtx.fillStyle = `yellow`;
    for (let i = 0; i < 10; i++) {
        const hover = (seller - 10 == i);
        baseMenuCtx.fillStyle = hover ? `lime` : `yellow`;
        if (ships[shipView].weapons <= i) baseMenuCtx.fillStyle = `orange`;
        if (typeof wepns[equipped[i]] !== `undefined` && shipView < wepns[equipped[i]].level) baseMenuCtx.fillStyle = `red`;

        let wepTag = ``;
        if (equipped[i] == -1) wepTag = translate(`BUY`);
        else if (equipped[i] > -1) wepTag = translate(`SELL`);

        write(baseMenuCtx, `${(` ${i + 1}`).slice(-2)}: ${hover ? wepTag : wepns[equipped[i]]?.name}`, 256 + 32, 256 + i * 16);
    }
};

// Render the base menu for selling weapons
global.renderConfirm = function () {
    baseMenuCtx.fillStyle = `cyan`;
    baseMenuCtx.textAlign = `center`;
    baseMenuCtx.font = `16px ShareTech`;
    write(baseMenuCtx, translate(`Are you sure you would like to sell your # for $#?`, [wepns[equipped[confirmer]]?.name, wepns[equipped[confirmer]]?.price * 0.75]), 128 * 3, 128);
    baseMenuCtx.font = `15px ShareTech`;
    write(baseMenuCtx, translate(`Press Y to confirm or N to return.`), 128 * 3, 192);
    baseMenuCtx.font = `14px ShareTech`;
    baseMenuCtx.textAlign = `left`;
};

// Render the shop tab
global.renderShop = function () {
    rMoneyInBaseTopRight();

    rOreShop();

    rBuyLifeShop();

    rWeaponsInShop();

    rBuyShipWindow();

    renderUpgradeButtons();
};

const renderUpgradeButtons = () => {
    baseMenuCtx.fillStyle = `yellow`;
    baseMenuCtx.textAlign = `left`;
    baseMenuCtx.font = `24px ShareTech`;
    write(baseMenuCtx, translate(`Upgrades`), renderTechShopX, renderTechShopY - 8);

    // upgrade titles
    baseMenuCtx.font = `12px ShareTech`;
    baseMenuCtx.textAlign = `center`;

    const currTechArr = [[t2, va2, c2], [mh2, e2, ag2]];
    const titlesArr = [[`Thrust lvl `, `Radar lvl `, `Cargo lvl `], [`Hull lvl `, `Energy lvl `, `Agility lvl `]];

    for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 3; x++) {
            // rectange background
            baseMenuCtx.fillStyle = `black`;
            baseMenuCtx.globalAlpha = 0.25;
            roundRect(baseMenuCtx, renderTechShopX + 4 + x * 128, renderTechShopY + 4 + y * 64, 128 - 8, 64 - 8, 16, true, false);
            baseMenuCtx.globalAlpha = 1;

            const textX = renderTechShopX + 64 + 128 * x;
            const textY = renderTechShopY + 20 + 64 * y;

            // titles
            baseMenuCtx.fillStyle = `white`;
            write(baseMenuCtx, translate(titlesArr[y][x]) + ((currTechArr[y][x] - 1) * 8), textX, textY);

            // upgrades
            baseMenuCtx.fillStyle = (seller == 200 + y * 3 + x) ? `lime` : `white`;
            write(baseMenuCtx, `[+] $${numToLS(techPrice(currTechArr[y][x]))}`, textX, textY + 14);

            // downgrades
            baseMenuCtx.fillStyle = (seller == 206 + y * 3 + x) ? `red` : `white`;
            if (currTechArr[y][x] > 1) write(baseMenuCtx, `[-] $${numToLS(-techPriceForDowngrade(currTechArr[y][x], tag === `V` || tag === `B`))}`, textX, textY + 28);
        }
    }
};

global.rMoneyInBaseTopRight = function () {
    baseMenuCtx.font = `14px ShareTech`;
    baseMenuCtx.textAlign = `right`;
    baseMenuCtx.fillStyle = `yellow`;

    write(baseMenuCtx, translate(`Money: #`, [numToLS(Math.floor(money))]), 128 * 6 - 16, 64);
};

global.renderWeaponStore = function () {
    rMoneyInBaseTopRight();
    baseMenuCtx.fillStyle = `yellow`;
    baseMenuCtx.textAlign = `center`;
    baseMenuCtx.font = `24px ShareTech`;
    write(baseMenuCtx, translate(`Weapons`), 128 * 3, 68);
    baseMenuCtx.textAlign = `left`;
    baseMenuCtx.font = `14px ShareTech`;
    // R to return to shop
    for (const i in wepns) {
        const weapon = wepns[i];
        const wx = 4 + 240 * Math.floor(weapon.order / Math.floor(wepnCount / 3));
        const wy = 40 + 32 + (weapon.order % Math.floor(wepnCount / 3) + 2) * 16;
        let buyable = weapon.price > money ? `orange` : `yellow`;
        if (ship < weapon.level) buyable = `red`;

        let starCol = `white`;
        const type = weapon.type;
        if (type === `Gun`) starCol = `red`;
        if (type === `Missile`) starCol = `orange`;
        if (type === `Orb`) starCol = `tan`;
        if (type === `Beam`) starCol = `lime`;
        if (type === `Blast`) starCol = `green`;
        if (type === `Mine`) starCol = `cyan`;
        if (type === `Misc`) starCol = `violet`;
        baseMenuCtx.fillStyle = starCol;

        write(baseMenuCtx, `*`, wx, wy);
        baseMenuCtx.fillStyle = seller - 20 == i ? `lime` : buyable;
        write(baseMenuCtx, translate(`[INFO] `) + (`$${weapon.price}         `).substring(0, 9) + weapon.name, wx + 11, wy);
        if (seller - 20 == i) { rWeaponStats(i, buyable, starCol); }
    }
};
global.rWeaponStats = function (i, buyable, starCol) {
    baseMenuCtx.font = `14px ShareTech`;

    baseMenuCtx.fillStyle = buyable;
    write(baseMenuCtx, wepns[i].name, 32, 364 + 16 * 1);
    write(baseMenuCtx, translate(`Ship   : `) + wepns[i].level, 32, 364 + 16 * 8);

    baseMenuCtx.fillStyle = starCol;
    write(baseMenuCtx, `Type   : ${wepns[i].type}`, 32, 364 + 16 * 2);

    baseMenuCtx.fillStyle = `lime`;
    wrapText(baseMenuCtx, wepns[i].desc, 256 - 32, 364 + 16 * 1, 100 * 6 - 64, 16);

    write(baseMenuCtx, translate(`Range  : `) + (wepns[i].range == -1 ? translate(`N/A`) : (`${wepns[i].range} Meters`)), 32, 364 + 16 * 3);
    write(baseMenuCtx, translate(`Damage : `) + (wepns[i].damage == -1 ? translate(`N/A`) : wepns[i].damage), 32, 364 + 16 * 4);
    write(baseMenuCtx, translate(`Speed  : `) + (wepns[i].speed == -1 ? translate(`N/A`) : wepns[i].speed), 32, 364 + 16 * 5);
    write(baseMenuCtx, translate(`Charge : `) + (wepns[i].charge == -1 ? translate(`N/A`) : (wepns[i].charge / 25) + translate(` Seconds`)), 32, 364 + 16 * 6);
    write(baseMenuCtx, translate(`Ammo   : `) + ammoCodeToString(wepns[i].ammo), 32, 364 + 16 * 7);

    if (actuallyBuying) {
        baseMenuCtx.fillStyle = wepns[i].price > money ? `orange` : `lime`;
        const buyText = wepns[i].price > money ? translate(`Not Enough Money`) : translate(`Press B to Buy`);
        baseMenuCtx.font = `24px ShareTech`;
        write(baseMenuCtx, buyText, 256 - 16 * 2, 364 + 16 * 7);
    }
    baseMenuCtx.font = `14px ShareTech`;
};

const techShopOnHover = function (x, y) {
    for (let uy = 0; uy < 2; uy++) {
        for (let ux = 0; ux < 3; ux++) {
            if (y > renderTechShopY + 20 + 64 * uy && y < renderTechShopY + 37 + 64 * uy && x > renderTechShopX + 128 * ux && x < renderTechShopX + 128 + 128 * ux) { seller = 200 + uy * 3 + ux; return true; } // tech upgrades
            if (y > renderTechShopY + 37 + 64 * uy && y < renderTechShopY + 52 + 64 * uy && x > renderTechShopX + 128 * ux && x < renderTechShopX + 128 + 128 * ux) { seller = 206 + uy * 3 + ux; return true; } // tech downgrades
        }
    }
    return false;
};

const oreShopOnHover = function (x, y) {
    if (x > renderOreShopX && x < renderOreShopX + 64 && y > renderOreShopY - 14 + 4 * 16 && y < renderOreShopY - 14 + 5 * 16) seller = 610; // sell all
    else if (x > renderOreShopX && x < renderOreShopX + 64 && y > renderOreShopY - 12 && y < renderOreShopY - 14 + 4 * 16) seller = 5 + Math.floor((y + 12 - renderOreShopY) / 16); // sell ore
    else return false;
    return true;
};

const weaponShopOnHover = function (x, y) {
    if (y > 246 && y < 240 + 160 && x > 256 + 32 && x < 256 + 192) seller = Math.floor((y - 246) / 16 + 10); // buy or sell weapon
    else if (y > 256 - 30 && y < 256 - 16 && x > 512 - 64 && x < 512 - 64 + ctx.measureText(translate(`[View All]`)).width) seller = 601; // view all weapons
    else return false;
    return true;
};

global.weaponStoreOnHover = function () {
    const x = mx - baseMenuX;
    const y = my - baseMenuY; // mouse coords
    const rows = Math.floor(wepnCount / 3);
    for (let i = 0; i < 3; i++) {
        if (y > 76 && y < 76 + 16 * (rows + 1) && x > 16 + 240 * i && x < 64 + 240 * i) {
            seller = weaponWithOrder(Math.floor((y - 92) / 16 + rows * i)) + 20;
            return;
        }
    }
    seller = 0;
};

global.shopOnHover = function () {
    const x = mx - baseMenuX;
    const y = my - baseMenuY; // mouse coordinates

    if (x > 768 - 16 - ctx.measureText(translate(`[BUY]`)).width && x < 768 - 16 && y > lifeShopYVal - 16 && y < lifeShopYVal + 8) seller = 611; // buy life
    else if (y > 256 - 16 && y < 512 - 16 && x > 16 && x < 256 + 16) {
        if (y > 256 + 128 + 32) seller = 100;
        else seller = 0;
    } else if (!techShopOnHover(x, y) && !oreShopOnHover(x, y) && !weaponShopOnHover(x, y))
        seller = 0;
};

global.shopOnClick = function (buttonID) {
    // Ore Shop
    if (buttonID == 610) socket.emit(`sell`, { item: `all` });
    if (buttonID <= 8 && buttonID >= 5) {
        let item = ``;
        if (buttonID == 5) item = `iron`;
        else if (buttonID == 6) item = `silver`;
        else if (buttonID == 7) item = `platinum`;
        else if (buttonID == 8) item = `copper`;
        socket.emit(`sell`, { item: item });
        return;
    }

    if (buttonID == 611) socket.emit(`buyLife`, {});

    const x = mx - baseMenuX;
    const y = my - baseMenuY; // mouse coords

    if (y > 246 && y < 240 + 160 && x > 256 + 32 && x < 256 + 192) {
        if (equipped[buttonID - 10] == -1) {
            tab = 7;
            actuallyBuying = true;
            scroll = buttonID - 10;
        } else if (equipped[buttonID - 10] > -1) {
            tab = 8;
            confirmer = buttonID - 10;
        }
        return;
    }

    // Buy Ship
    if (y > 256 - 16 && y < 512 - 16 && x > 16 && x < 256 + 16) {
        if (y > 256 + 128 + 32) socket.emit(`buyShip`, { ship: shipView });
        else if (x > 16 + 128 && shipView < ships.length - 1) shipView++;
        else if (x < 16 + 128 && shipView > 0) shipView--;
    }

    // Upgrades and Downgrades
    if (buttonID > 199 && buttonID < 206) socket.emit(`upgrade`, { item: buttonID - 200 });
    if (buttonID > 205 && buttonID < 212) socket.emit(`downgrade`, { item: buttonID - 206 });
};
