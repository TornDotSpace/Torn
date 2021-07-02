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

import { jsn, translate } from '../localizer';
import { pasteChat } from '../chat';
import { write } from '../utils/helper';

import { RootState } from '../react/ReactRoot';

global.baseMenuCanvas = document.createElement(`canvas`);
baseMenuCanvas.width = 768;
baseMenuCanvas.height = 512;
global.baseMenuCtx = baseMenuCanvas.getContext(`2d`, { alpha: true });

require(`./shoptab.js`);
require(`./statstab.js`);
require(`./moretab.js`);
require(`./queststab.js`);

global.baseMenuX = w / 2 - 128 * 3; global.baseMenuY = h / 4 - 128; // Where do we render the base menu subcanvas?

// Render the Achievements tab
global.rAchievements = function () {
    baseMenuCtx.save();
    baseMenuCtx.fillStyle = `yellow`;
    baseMenuCtx.font = `14px ShareTech`;
    baseMenuCtx.textAlign = `center`;
    for (let i = 0; i < achs.length; i++) {
        if (i < 13) baseMenuCtx.fillStyle = achs[i] ? `red` : `pink`;
        else if (i < 25) baseMenuCtx.fillStyle = achs[i] ? `gold` : `lime`;
        else if (i < 37) baseMenuCtx.fillStyle = achs[i] ? `lightgray` : `white`;
        else baseMenuCtx.fillStyle = achs[i] ? `cyan` : `yellow`;
        if (achs[i]) {
            baseMenuCtx.font = `11px ShareTech`;
            write(baseMenuCtx, jsn.achNames[i].split(`:`)[1], baseMenuCanvas.width * (1 + (i % 5) * 2) / 10, 20 + 40 * Math.floor(i / 5) + 60);
        }
        baseMenuCtx.font = `15px ShareTech`;
        write(baseMenuCtx, achs[i] ? jsn.achNames[i].split(`:`)[0] : translate(`???`), baseMenuCanvas.width * (1 + (i % 5) * 2) / 10, 8 + 40 * Math.floor(i / 5) + 60);
    }
    baseMenuCtx.restore();
};

global.rBaseGui = function () {
    baseMenuCtx.lineWidth = 2;
    baseMenuCtx.textAlign = `right`;
    baseMenuCtx.fillStyle = `yellow`;

    baseMenuCtx.font = `14px ShareTech`;
    baseMenuCtx.lineWidth = 2;

    const tabs = [`Shop`, `Quests`, `Stats`, `Achievements`, `More`];

    baseMenuCtx.globalAlpha = guiOpacity;
    baseMenuCtx.fillStyle = guiColor;
    roundRect(baseMenuCtx, 0, 44, baseMenuCanvas.width, baseMenuCanvas.height - 44, 32, true, false);

    baseMenuCtx.textAlign = `center`;
    const x = mx - baseMenuX;
    const y = my - baseMenuY;
    for (let i = 0; i < 5; i++) { // Fill Tabs In
        const highlightTab = tab == i || (x > 0 && x < baseMenuCanvas.width && y > 0 && y < 40 && Math.floor(x / (baseMenuCanvas.width / 5)) == i);
        baseMenuCtx.fillStyle = highlightTab ? `#666666` : guiColor;
        roundRect(baseMenuCtx, i * baseMenuCanvas.width / 5 + 8, 4, baseMenuCanvas.width / 5 - 8, 32, 16, true, false);
    }

    baseMenuCtx.globalAlpha = 1;

    baseMenuCtx.fillStyle = `white`;
    for (let i = 0; i < 5; i++) { // Write tab names
        write(baseMenuCtx, translate(tabs[i]), (i * baseMenuCanvas.width / 5 + baseMenuCanvas.width / 10), 23);
    }

    baseMenuCtx.fillStyle = `yellow`;
    baseMenuCtx.textAlign = `right`;
    baseMenuCtx.font = `18px ShareTech`;
    write(baseMenuCtx, translate(`PRESS X TO EXIT BASE`), baseMenuCanvas.width - 16, baseMenuCanvas.height - 16);
    baseMenuCtx.font = `14px ShareTech`;
    baseMenuCtx.textAlign = `left`;
    // baseMenuCtx.drawImage(Img.baseOutline, -4, -4);
    paste3DMap(8, 8);
    rCargo();
};

const mergeBaseCanvas = () => {
    ctx.drawImage(baseMenuCanvas, baseMenuX, baseMenuY);
};

global.rInBase = function () {
    tick++;
    canvas.width = canvas.width;
    baseMenuCanvas.width = baseMenuCanvas.width;
    renderBG();
    rStars();
    pasteChat();
    rBaseGui();
    if (tab != -1) RootState.turnOffRegister();
    switch (tab) {
        case 0:
            rShop();
            break;
        case 1:
            rQuests();
            break;
        case 2:
            rStats();
            break;
        case 3:
            rAchievements();
            break;
        case 4:
            rMore();
            break;
        case 7:
            rWeaponStore();
            break;
        case 8:
            rConfirm();
            break;
        default:
            break;
    }
    if (savedNote-- > 0 && !guest) {
        rSavedNote();
    }
    if (tab == -1) rCreds();
    if (quest != 0) rCurrQuest();
    if (lb != 0) pasteLeaderboard();
    rRaid();
    updateBullets();
    rTut();
    rVolumeBar();
    rBigNotes();

    mergeBaseCanvas();
};

global.baseMenuOnClick = function (buttonID) {
    if (tab == 0) {
        shopOnClick(buttonID);
    }
    if (tab == 1) {
        questsOnClick(buttonID);
    }
    if (tab == 2) {
        statsOnClick(buttonID);
    }
    if (tab == 4) {
        moreOnClick(buttonID);
    }

    const x = mx - baseMenuX;
    const y = my - baseMenuY; // mouse coordinates

    if (x > 0 && x < 128 * 6 && y > 0 && y < 40) tab = Math.floor(x / (baseMenuCanvas.width / 5));
};
