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

// Render the stats tab
import { translate } from "../localizer.ts";

global.rStats = function () {
    baseMenuCtx.font = `14px ShareTech`;
    baseMenuCtx.textAlign = `left`;
    const d = new Date();
    const t = d.getMilliseconds() * 2 * Math.PI / 50000 + d.getSeconds() * 2 * Math.PI / 50 + d.getMinutes() * 2 * 60 * Math.PI / 50;

    renderStatistics();

    renderTrailSelector();

    const rendX = 192;
    const rendY = 192;
    baseMenuCtx.save();
    baseMenuCtx.translate(rendX, rendY);
    baseMenuCtx.rotate(-3 * t);
    const img = colorSelect(pc, redShips, blueShips, greenShips)[ship];

    baseMenuCtx.drawImage(img, -img.width / 2, -img.height / 2);
    baseMenuCtx.restore();

    // techs
    baseMenuCtx.fillStyle = `yellow`;
    baseMenuCtx.textAlign = `left`;
    baseMenuCtx.font = `24px ShareTech`;
    write(baseMenuCtx, translate(`Upgrades`), 64, 256 + 64 + 16);
    baseMenuCtx.fillStyle = `white`;
    baseMenuCtx.font = `12px ShareTech`;
    baseMenuCtx.drawImage(Img.button, 64, 416 - 64);
    baseMenuCtx.drawImage(Img.button, 192, 416 - 64);
    baseMenuCtx.drawImage(Img.button, 64, 416);
    baseMenuCtx.drawImage(Img.button, 192, 416);
    baseMenuCtx.drawImage(Img.button, 320, 416 - 64);
    baseMenuCtx.drawImage(Img.button, 320, 416);
    baseMenuCtx.textAlign = `center`;
    write(baseMenuCtx, translate(`Thrust lvl `) + ((t2 - 1) * 8), 64 + 54, 416 - 64 + 14);
    write(baseMenuCtx, translate(`Radar lvl `) + ((va2 - 1) * 8), 192 + 54, 416 - 64 + 14);
    write(baseMenuCtx, translate(`Cargo lvl `) + ((c2 - 1) * 8), 64 + 54, 416 + 14);
    write(baseMenuCtx, translate(`Hull lvl `) + ((mh2 - 1) * 8), 192 + 54, 416 + 14);
    write(baseMenuCtx, translate(`Energy lvl `) + ((e2 - 1) * 8), 320 + 54, 416 - 64 + 14);
    write(baseMenuCtx, translate(`Agility lvl `) + ((ag2 - 1) * 8), 320 + 54, 416 + 14);

    renderUpgradeButtons();

    /* description for radar
  baseMenuCtx.textAlign = "left";
  if (seller==201 || seller==207){
    let txt = jsn.techs.radar[(va2-1)*8+(seller==201?1:-1)];
    if(typeof txt !== "undefined")
      write(baseMenuCtx, (seller==201?"Up":"Down")+"grade: " + txt, rx+512, ry+400);
    txt = jsn.techs.radar[(va2-1)*8];
    if(typeof txt !== "undefined")
      write(baseMenuCtx, "Current: " + txt, rx+512, ry+384);
  } */
};

function renderStatistics () {
    const ore = iron + silver + platinum + copper;
    let upgradeCosts = 0;
    upgradeCosts += techEnergy(t2) + techEnergy(va2) + techEnergy(ag2) + techEnergy(c2) + techEnergy(mh2) + techEnergy(e2) * 8;
    let achievements = 0;

    for (const i in achs) if (achs[i]) achievements++;

    baseMenuCtx.fillStyle = `yellow`;
    baseMenuCtx.font = `32px ShareTech`;
    baseMenuCtx.textAlign = `center`;
    write(baseMenuCtx, myName, 192, 96);
    baseMenuCtx.font = `14px ShareTech`;
    const activeGens = 0;

    const eMult = e2;
    /* if (ship >= wepns[20].level) {
    for (let i = 0; i < ships[ship].weapons; i++) {
      if (equipped[i] == 20) activeGens++;
    }
  }
  for (let i = 0; i < activeGens; i++) eMult *= 1.06; */

    const stats = [
        translate(`Thrust  : `), translate(`Cargo   : `), translate(`Health  : `), translate(`Energy  : `),
        translate(`Players Killed: #`, [numToLS(kills)]), translate(`Bases Destroyed: #`, [numToLS(baseKills)]),
        translate(`Ship Value: $#`, [numToLS(Number((worth + upgradeCosts).toPrecision(3)))]), translate(`Net Worth: $#`, [numToLS(Number((money + ore + worth + upgradeCosts).toPrecision(3)))]),
        translate(`Experience: #`, [numToLS(Math.round(experience))]), translate(`Rank: #`, [rank]), translate(`Achievements: #`, [achievements])
    ];

    stats[0] += numToLS(Number((ships[ship].thrust * t2).toPrecision(3)));
    stats[1] += numToLS(Number((ships[ship].capacity * c2).toPrecision(3)));
    stats[2] += numToLS(Number((ships[ship].health * mh2).toPrecision(3)));
    stats[3] += numToLS(Number((eMult).toPrecision(3)));

    for (let i = 0; i < stats.length; i++) write(baseMenuCtx, stats[i], 512 - 64, 44 + 32 + i * 16);
}

function renderTrailSelector () {
    baseMenuCtx.fillStyle = seller == 700 ? `yellow` : `red`;
    write(baseMenuCtx, translate(`[Default Trail]`), 512 + 128, 44 + 64 - 1 * 16);
    if (achs[12]) {
        baseMenuCtx.fillStyle = seller == 701 ? `yellow` : `red`;
        write(baseMenuCtx, translate(`[Blood Trail]`), 512 + 128, 44 + 64 + 1 * 16);
    } if (achs[24]) {
        baseMenuCtx.fillStyle = seller == 702 ? `yellow` : `gold`;
        write(baseMenuCtx, translate(`[Money Trail]`), 512 + 128, 44 + 64 + 3 * 16);
    } if (achs[36]) {
        baseMenuCtx.fillStyle = seller == 703 ? `yellow` : `lightgray`;
        write(baseMenuCtx, translate(`[Panda Trail]`), 512 + 128, 44 + 64 + 5 * 16);
    } if (achs[47]) {
        baseMenuCtx.fillStyle = seller == 704 ? `yellow` : `cyan`;
        write(baseMenuCtx, translate(`[Random Trail]`), 512 + 128, 44 + 64 + 7 * 16);
    }
    /* if (false) {
        baseMenuCtx.fillStyle = seller == 705 ? "yellow" : "cyan";
        write(baseMenuCtx, translate("[Rainbow Trail]"), 512 + 128, 44 + 64 + 9 * 16);
    } */
}

function renderUpgradeButtons () {
    // upgrades
    baseMenuCtx.fillStyle = (seller == 200) ? `lime` : `white`;
    write(baseMenuCtx, `[+] $${numToLS(techPrice(t2))}`, 64 + 54, 416 - 64 + 28);
    baseMenuCtx.fillStyle = (seller == 201) ? `lime` : `white`;
    write(baseMenuCtx, `[+] $${numToLS(techPrice(va2))}`, 192 + 54, 416 - 64 + 28);
    baseMenuCtx.fillStyle = (seller == 202) ? `lime` : `white`;
    write(baseMenuCtx, `[+] $${numToLS(techPrice(c2))}`, 64 + 54, 416 + 28);
    baseMenuCtx.fillStyle = (seller == 203) ? `lime` : `white`;
    write(baseMenuCtx, `[+] $${numToLS(techPrice(mh2))}`, 192 + 54, 416 + 28);
    baseMenuCtx.fillStyle = (seller == 204) ? `lime` : `white`;
    write(baseMenuCtx, `[+] $${numToLS(techPrice(e2) * 8)}`, 320 + 54, 416 - 64 + 28);
    baseMenuCtx.fillStyle = (seller == 205) ? `lime` : `white`;
    write(baseMenuCtx, `[+] $${numToLS(techPrice(ag2))}`, 320 + 54, 416 + 28);

    // downgrades
    baseMenuCtx.fillStyle = (seller == 206) ? `red` : `white`;
    if (t2 > 1) write(baseMenuCtx, `[-] $${numToLS(-techPriceForDowngrade(t2))}`, 64 + 54, 416 - 64 + 42);
    baseMenuCtx.fillStyle = (seller == 207) ? `red` : `white`;
    if (va2 > 1) write(baseMenuCtx, `[-] $${numToLS(-techPriceForDowngrade(va2))}`, 192 + 54, 416 - 64 + 42);
    baseMenuCtx.fillStyle = (seller == 208) ? `red` : `white`;
    if (c2 > 1) write(baseMenuCtx, `[-] $${numToLS(-techPriceForDowngrade(c2))}`, 64 + 54, 416 + 42);
    baseMenuCtx.fillStyle = (seller == 209) ? `red` : `white`;
    if (mh2 > 1) write(baseMenuCtx, `[-] $${numToLS(-techPriceForDowngrade(mh2))}`, 192 + 54, 416 + 42);
    baseMenuCtx.fillStyle = (seller == 210) ? `red` : `white`;
    if (e2 > 1) write(baseMenuCtx, `[-] $${numToLS(-techPriceForDowngrade(e2) * 8)}`, 320 + 54, 416 - 64 + 42);
    baseMenuCtx.fillStyle = (seller == 211) ? `red` : `white`;
    if (ag2 > 1) write(baseMenuCtx, `[-] $${numToLS(-techPriceForDowngrade(ag2))}`, 320 + 54, 416 + 42);
}

global.statsOnHover = function () {
    const x = mx - baseMenuX;
    const y = my - baseMenuY; // mouse coordinates

    if (y > 416 - 64 + 16 && y < 416 - 64 + 30 && x > 64 && x < 64 + 112) seller = 200;
    else if (y > 416 - 64 + 16 && y < 416 - 64 + 30 && x > 192 && x < 192 + 112) seller = 201;
    else if (y > 416 + 16 && y < 416 + 30 && x > 64 && x < 64 + 112) seller = 202;
    else if (y > 416 + 16 && y < 416 + 30 && x > 192 && x < 192 + 112) seller = 203;
    else if (y > 416 - 64 + 16 && y < 416 - 64 + 30 && x > 320 && x < 320 + 112) seller = 204;
    else if (y > 416 + 16 && y < 416 + 30 && x > 320 && x < 320 + 112) seller = 205;

    else if (y > 416 - 64 + 32 && y < 416 - 64 + 46 && x > 64 && x < 64 + 112) seller = 206;
    else if (y > 416 - 64 + 32 && y < 416 - 64 + 46 && x > 192 && x < 192 + 112) seller = 207;
    else if (y > 416 + 32 && y < 416 + 46 && x > 64 && x < 64 + 112) seller = 208;
    else if (y > 416 + 32 && y < 416 + 46 && x > 192 && x < 192 + 112) seller = 209;
    else if (y > 416 - 64 + 32 && y < 416 - 64 + 46 && x > 320 && x < 320 + 112) seller = 210;
    else if (y > 416 + 32 && y < 416 + 46 && x > 320 && x < 320 + 112) seller = 211;

    else if (y > 44 + 64 - 24 && y < 44 + 64 + 8 * 21 && x > 512 && x < 768) {
        seller = 700 + Math.floor((y - 44 - 64 + 24) / 32);
        if ((seller == 701 && !achs[12]) || (seller == 702 && !achs[24]) || (seller == 703 && !achs[36]) || (seller == 704 && !achs[47]) || (seller == 705 && true)) seller = 0;
    } else seller = 0;
};

global.statsOnClick = function (buttonID) {
    // Upgrades and Downgrades
    if (buttonID > 199 && buttonID < 206) socket.emit(`upgrade`, { item: buttonID - 200 });
    if (buttonID > 205 && buttonID < 212) socket.emit(`downgrade`, { item: buttonID - 206 });

    // Trails
    if (buttonID >= 700 && buttonID < 705) socket.emit(`trail`, { trail: buttonID - 700 });
};
