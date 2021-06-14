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

import { translate } from "../localizer.ts";

const lifeShopYVal = 405;

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
        baseMenuCtx.fillStyle = `white`;
        write(baseMenuCtx, translate(`Thrust  : `), shipStatsRx, shipStatsRy + 0 * 16);
        write(baseMenuCtx, translate(`Agility : `), shipStatsRx, shipStatsRy + 1 * 16);
        write(baseMenuCtx, translate(`Health  : `), shipStatsRx, shipStatsRy + 2 * 16);
        write(baseMenuCtx, translate(`Cargo   : `) + (shipView == 17 ? `Infinite` : ``), shipStatsRx, shipStatsRy + 3 * 16);
        write(baseMenuCtx, translate(`Weapons : `) + numToLS(ships[shipView].weapons), shipStatsRx, shipStatsRy + 4 * 16);
        baseMenuCtx.fillStyle = `#555`;
        baseMenuCtx.fillRect(shipStatsRx + 60, shipStatsRy + 0 * 16 - 10, 80, 12);
        baseMenuCtx.fillRect(shipStatsRx + 60, shipStatsRy + 1 * 16 - 10, 80, 12);
        baseMenuCtx.fillRect(shipStatsRx + 60, shipStatsRy + 2 * 16 - 10, 80, 12); if (shipView != 17) { baseMenuCtx.fillRect(shipStatsRx + 60, shipStatsRy + 3 * 16 - 10, 80, 12); } // 17 has infinite cargo

        baseMenuCtx.fillStyle = compareColor (shipView, ship, `thrust`);
        baseMenuCtx.fillRect(shipStatsRx + 60, shipStatsRy + 0 * 16 - 10, 80 * ships[shipView].thrust / maxShipThrust, 12);
        baseMenuCtx.fillStyle = compareColor (shipView, ship, `agility`);
        baseMenuCtx.fillRect(shipStatsRx + 60, shipStatsRy + 1 * 16 - 10, 80 * ships[shipView].agility / maxShipAgility, 12);
        baseMenuCtx.fillStyle = compareColor (shipView, ship, `health`);
        baseMenuCtx.fillRect(shipStatsRx + 60, shipStatsRy + 2 * 16 - 10, 80 * ships[shipView].health / maxShipHealth, 12);
        if (shipView != 17) {
            baseMenuCtx.fillStyle = compareColor (shipView, ship, `capacity`);
            baseMenuCtx.fillRect(shipStatsRx + 60, shipStatsRy + 3 * 16 - 10, 80 * ships[shipView].capacity / maxShipCapacity, 12); } // 17 has infinite cargo
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

function compareColor (shipView, ship, stat) {  // If there's a way to make it better, please correct this
    if (shipView == ship) return `white`;
    let better = `#089B00`;
    let equal = `#C8C761`;
    let worse = `#9B0000`;
    switch (stat) {
        case `thrust`:
            if (ships[shipView].thrust == ships[ship].thrust) return equal;
            else return (ships[shipView].thrust < ships[ship].thrust) ? worse : better;
        break;
        case `agility`:
            if (ships[shipView].agility == ships[ship].agility) return equal;
            else return (ships[shipView].agility < ships[ship].agility) ? worse : better;
        break;
        case `health`:
            if (ships[shipView].health == ships[ship].health) return equal;
            else return (ships[shipView].health < ships[ship].health) ? worse : better;
        break;
        case `capacity`:
            if (ships[shipView].capacity == ships[ship].capacity) return equal;
            else return (ships[shipView].capacity < ships[ship].capacity) ? worse : better;
        break;
    }
}

global.rOreShop = function () {
    const mult1 = (myTrail % 16 == 2) ? 1.05 : 1;

    const allIronPrice = iron * mult1; const allSilverPrice = silver * mult1; const allPlatinumPrice = platinum * mult1; const allCopperPrice = copper * mult1;

    baseMenuCtx.font = `14px ShareTech`;
    baseMenuCtx.textAlign = `left`;

    baseMenuCtx.fillStyle = (seller == 5 && allIronPrice > 0) ? `lime` : `#d44`;
    write(baseMenuCtx, `${iron > 0 ? translate(`[SELL] Iron:     `) : translate(`       Iron:     `)}$${numToLS(allIronPrice)}`, 256 - 32*2, 3 * 32);
    baseMenuCtx.fillStyle = (seller == 6 && allSilverPrice > 0) ? `lime` : `#eef`;
    write(baseMenuCtx, `${silver > 0 ? translate(`[SELL] Silver:   `) : translate(`       Silver:   `)}$${numToLS(allSilverPrice)}`, 256 - 32*2, 4 * 32);
    baseMenuCtx.fillStyle = (seller == 7 && allPlatinumPrice > 0) ? `lime` : `#90f`;
    write(baseMenuCtx, `${platinum > 0 ? translate(`[SELL] Platinum: `) : translate(`       Platinum: `)}$${numToLS(allPlatinumPrice)}`, 256 - 32*2, 5 * 32);
    baseMenuCtx.fillStyle = (seller == 8 && allCopperPrice > 0) ? `lime` : `#960`;
    write(baseMenuCtx, `${copper > 0 ? translate(`[SELL] Copper:   `) : translate(`       Copper:   `)}$${numToLS(allCopperPrice)}`, 256 - 32*2, 6 * 32);

    baseMenuCtx.fillStyle = seller == 610 ? `lime` : `yellow`;

    write(baseMenuCtx, `${translate(`[Sell All]`)} => $${numToLS(allCopperPrice + allPlatinumPrice + allSilverPrice + allIronPrice)}`, 256 + 48, 76); // Sell all

    // Render asteroid animation
    let astImg = Img.silver;
    if (seller == 5 && allIronPrice > 0) astImg = Img.iron;
    if (seller == 7 && allPlatinumPrice > 0) astImg = Img.platinum;
    if (seller == 8 && allCopperPrice > 0) astImg = Img.copper;
    const d = new Date();
    const stime = Math.floor((d.getMilliseconds() / 1000 + d.getSeconds()) / 60 * 1024) % 64;
    const spx = (stime % 8) * 128;
    const Secret = Math.floor((stime / 8) % 4) * 128;
    baseMenuCtx.save();
    baseMenuCtx.translate(128 - 16, (256 - 32 - 40) / 2 + 40);
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
    baseMenuCtx.textAlign = `center`;
    write(baseMenuCtx, translate(`Ores`), 256, 64 + 8);
    baseMenuCtx.textAlign = `left`;
    baseMenuCtx.font = `14px ShareTech`;
    baseMenuCtx.fillStyle = seller == 601 ? `lime` : `yellow`;
    write(baseMenuCtx, translate(`[View All]`), 512 - 64, 256 - 16);
    baseMenuCtx.fillStyle = `yellow`;
    for (let i = 0; i < 10; i++) {
        baseMenuCtx.fillStyle = (seller - 10 == i) ? `lime` : `yellow`;
        if (ships[shipView].weapons <= i) baseMenuCtx.fillStyle = `orange`;
        if (shipView < wepns[equipped[i]].level) baseMenuCtx.fillStyle = `red`;
        let tag = `       `;
        if (equipped[i] == -1) tag = `${translate(`[BUY]`)}  `;
        else if (equipped[i] > -1) tag = `${translate(`[SELL]`)} `;
        write(baseMenuCtx, `${tag + (` ${i + 1}`).slice(-2)}: ${wepns[equipped[i]].name}`, 256 + 32, 256 + i * 16);
    }
};

// Render the base menu for selling weapons
global.rConfirm = function () {
    baseMenuCtx.fillStyle = `cyan`;
    baseMenuCtx.textAlign = `center`;
    baseMenuCtx.font = `16px ShareTech`;
    write(baseMenuCtx, translate(`Are you sure you would like to sell your # for $#?`, [wepns[equipped[confirmer]].name, wepns[equipped[confirmer]].price * 0.75]), 128 * 3, 128);
    baseMenuCtx.font = `15px ShareTech`;
    write(baseMenuCtx, translate(`Press Y to confirm or N to return.`), 128 * 3, 192);
    baseMenuCtx.font = `14px ShareTech`;
    baseMenuCtx.textAlign = `left`;
};

// Render the shop tab
global.rShop = function () {
    rMoneyInBaseTopRight();

    rOreShop();

    rBuyLifeShop();

    rWeaponsInShop();

    rBuyShipWindow();
};

global.rMoneyInBaseTopRight = function () {
    baseMenuCtx.font = `14px ShareTech`;
    baseMenuCtx.textAlign = `right`;
    baseMenuCtx.fillStyle = `yellow`;

    write(baseMenuCtx, translate(`Money: #`, [numToLS(Math.floor(money))]), 128 * 6 - 16, 64);
};

global.rWeaponStore = function () {
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
        if (type === `Mine`) starCol = `blue`;
        if (type === `Misc`) starCol = `purple`;
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

global.shopOnHover = function () {
    const x = mx - baseMenuX;
    const y = my - baseMenuY; // mouse coordinates

    if (x > 256 + 48 && x < 256 + 48 + ctx.measureText(translate(`[Sell All]`)).width && y > 64 && y < 80) seller = 610;
    else if (x > 256 - 32 && x < 264 && y < 84 + 4 * 32 - 16 && y > 84) {
        seller = 5 + Math.floor((y - 84) / 32);
        if (Math.floor((y - 84) / 16) % 2 == 1) seller = 0;
    } else if (y > 246 && y < 240 + 160 && x > 256 + 32 && x < 256 + 78) seller = Math.floor((y - 246) / 16 + 10);
    else if (y > 256 - 30 && y < 256 - 16 && x > 512 - 64 && x < 512 - 64 + ctx.measureText(translate(`[View All]`)).width) seller = 601;
    else if (x > 768 - 16 - ctx.measureText(translate(`[BUY]`)).width && x < 768 - 16 && y > lifeShopYVal - 16 && y < lifeShopYVal + 8) seller = 611;
    else if (y > 256 - 16 && y < 512 - 16 && x > 16 && x < 256 + 16) {
        if (y > 256 + 128 + 32) seller = 100;
        else seller = 0;
    } else seller = 0;
};

global.weaponStoreOnHover = function () {
    const x = mx - baseMenuX;
    const y = my - baseMenuY; // mouse coordinates

    const rows = Math.floor(wepnCount / 3);
    for (let i = 0; i < 3; i++) {
        if (y > 76 && y < 76 + 16 * (rows + 1) && x > 16 + 240 * i && x < 64 + 240 * i) {
            seller = weaponWithOrder(Math.floor((y - 92) / 16 + rows * i)) + 20;
            return;
        }
    }

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
    const y = my - baseMenuY; // mouse coordinates

    if (y > 246 && y < 240 + 160 && x > 256 + 32 && x < 256 + 78) {
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
};


