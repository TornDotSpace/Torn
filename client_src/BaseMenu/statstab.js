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
import { translate } from '../localizer';

global.rStats = function () {
    rMoneyInBaseTopRight();

    renderStatistics();

    renderTrailSelector();

    renderStatsShip();

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

const renderStatsShip = () => {
    const d = new Date();
    const t = d.getMilliseconds() * 2 * Math.PI / 50000 + d.getSeconds() * 2 * Math.PI / 50 + d.getMinutes() * 2 * 60 * Math.PI / 50;
    const rendX = 192;
    const rendY = 192;
    baseMenuCtx.save();
    baseMenuCtx.translate(rendX, rendY);
    baseMenuCtx.rotate(-3 * t);
    const img = colorSelect(pc, redShips, blueShips, greenShips)[ship];

    baseMenuCtx.drawImage(img, -img.width / 2, -img.height / 2);
    baseMenuCtx.restore();
};

const renderStatistics = () => {
    baseMenuCtx.font = `14px ShareTech`;
    baseMenuCtx.textAlign = `left`;

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
    if (tag === `V`) write(baseMenuCtx, `VIP`, 192, 112);
    if (tag === `B`) write(baseMenuCtx, `MVP`, 192, 112);

    let eMult = e2;
    let activeGens = 0;
    let activeNavShields = 0;

    /*
    if (ship >= wepns[20].level) { // Generators
        let maxSlots = 0;
        if (ship == 22) maxSlots = 10;
        else maxSlots = ships[ship].weapons;
        for (let i = 0; i < maxSlots; i++) {
          if (equipped[i] == 20) activeGens++;
        }
    }
    for (let i = 0; i < activeGens; i++) eMult *= 1.08;
    */

    if (ship >= wepns[49].level) { // Navigational shields
        for (let i = 0; i < 10; i++) {
            if (equipped[i] == 20) activeNavShields++;
        }
    }
    for (let i = 0; i < activeNavShields; i++) eMult /= 1.08;

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
};

const renderTrailSelector = () => {
    const colorArr = [`white`, `red`, `gold`, `lightgray`, `cyan`, getRainbowColor()];
    const trailNameArr = [`[Default Trail]`, `[Blood Trail]`, `[Money Trail]`, `[Panda Trail]`, `[Random Trail]`, `[Rainbow Trail]`];
    const conditionArr = [true, achs[12], achs[24], achs[36], achs[47], tag === `O` || tag === `A`];
    for (let i = 0; i < 6; i++) {
        if (tag === `B` || conditionArr[i]) {
            baseMenuCtx.fillStyle = seller == 700 + i ? `yellow` : colorArr[i];
            write(baseMenuCtx, translate(trailNameArr[i]), 640, 92 + 32 * i);
        }
    }
};

const renderUpgradeButtons = () => {
    baseMenuCtx.fillStyle = `yellow`;
    baseMenuCtx.textAlign = `left`;
    baseMenuCtx.font = `24px ShareTech`;
    write(baseMenuCtx, translate(`Upgrades`), 64, 256 + 64 + 16);

    baseMenuCtx.fillStyle = `black`;
    baseMenuCtx.globalAlpha = 0.25;
    for (let y = 352; y <= 416; y += 64) {
        for (let x = 64; x <= 320; x += 128) {
            roundRect(baseMenuCtx, x - 4, y - 4, 128 - 8, 64 - 8, 16, true, false);
        }
    }
    baseMenuCtx.globalAlpha = 1;

    // upgrade titles
    baseMenuCtx.fillStyle = `white`;
    baseMenuCtx.font = `12px ShareTech`;
    baseMenuCtx.textAlign = `center`;

    const currTechArr = [t2, va2, c2, mh2, e2, ag2];
    const titlesArr = [`Thrust lvl `, `Radar lvl `, `Cargo lvl `, `Hull lvl `, `Energy lvl `, `Agility lvl `];

    for (let i = 0; i < titlesArr.length; i++) {
        // titles
        baseMenuCtx.fillStyle = `white`;
        write(baseMenuCtx, translate(titlesArr[i]) + ((currTechArr[i] - 1) * 8), 118 + 128 * (i % 3), 366 + 64 * (i % 2));

        // upgrades
        baseMenuCtx.fillStyle = (seller == 200 + i) ? `lime` : `white`;
        write(baseMenuCtx, `[+] $${numToLS(techPrice(currTechArr[i]) * (i == 4 ? 8 : 1))}`, 118 + 128 * (i % 3), 380 + 64 * (i % 2));

        // downgrades
        baseMenuCtx.fillStyle = (seller == 206 + i) ? `red` : `white`;
        if (currTechArr[i] > 1) write(baseMenuCtx, `[-] $${numToLS(-techPriceForDowngrade(currTechArr[i]) * (i == 4 ? 8 : 1))}`, 118 + 128 * (i % 3), 394 + 64 * (i % 2));
    }
};

global.statsOnHover = () => {
    const x = mx - baseMenuX;
    const y = my - baseMenuY; // mouse coordinates

    for (let i = 0; i < 6; i++) {
        if (y > 368 + 64 * (i % 2) && y < 382 + 64 * (i % 2) && x > 64 + 128 * (i % 3) && x < 176 + 128 * (i % 3)) { seller = 200 + i; break; }
        if (y > 384 + 64 * (i % 2) && y < 398 + 64 * (i % 2) && x > 64 + 128 * (i % 3) && x < 176 + 128 * (i % 3)) { seller = 206 + i; break; }
        seller = 0;
    }

    if (y > 44 + 64 - 24 && y < 44 + 64 + 8 * 21 && x > 512 && x < 768) {
        seller = 700 + Math.floor((y - 44 - 64 + 24) / 32);
        if (tag !== `B` && ((seller == 701 && !achs[12]) || (seller == 702 && !achs[24]) || (seller == 703 && !achs[36]) || (seller == 704 && !achs[47]) || (seller == 705 && !(tag === `O` || tag === `A`)))) seller = 0;
    } else if (seller < 200 || seller > 211) seller = 0;
};

global.statsOnClick = (buttonID) => {
    // Upgrades and Downgrades
    if (buttonID > 199 && buttonID < 206) socket.emit(`upgrade`, { item: buttonID - 200 });
    if (buttonID > 205 && buttonID < 212) socket.emit(`downgrade`, { item: buttonID - 206 });

    // Trails
    if (buttonID >= 700 && buttonID < 706) socket.emit(`trail`, { trail: buttonID - 700 });
};
