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
const tabCount = 4;
const tabWidth = baseMenuCanvas.width / tabCount;

require(`./shoptab.js`);
require(`./moretab.js`);
require(`./queststab.js`);
require(`./achievementstab.js`);

global.baseMenuX = w / 2 - 128 * 3; global.baseMenuY = h / 4 - 128; // Where do we render the base menu subcanvas?

global.rBaseGui = function () {
    baseMenuCtx.lineWidth = 2;
    baseMenuCtx.textAlign = `right`;
    baseMenuCtx.fillStyle = `yellow`;

    baseMenuCtx.font = `14px ShareTech`;
    baseMenuCtx.lineWidth = 2;

    const tabs = [`Shop`, `Quests`, `Achievements`, `More`];

    baseMenuCtx.globalAlpha = guiOpacity;
    baseMenuCtx.fillStyle = guiColor;
    roundRect(baseMenuCtx, 0, 44, baseMenuCanvas.width, baseMenuCanvas.height - 44, 32, true, false);

    baseMenuCtx.textAlign = `center`;
    const x = mx - baseMenuX;
    const y = my - baseMenuY;
    for (let i = 0; i < 5; i++) { // Fill Tabs In
        const highlightTab = tab == i || (x > 0 && x < baseMenuCanvas.width && y > 0 && y < 40 && Math.floor(x / tabWidth) == i);
        baseMenuCtx.fillStyle = highlightTab ? `#666666` : guiColor;
        roundRect(baseMenuCtx, i * tabWidth + 8, 4, tabWidth - 8, 32, 16, true, false);
    }

    baseMenuCtx.globalAlpha = 1;

    baseMenuCtx.fillStyle = `white`;
    for (let i = 0; i < tabCount; i++) { // Write tab names
        write(baseMenuCtx, translate(tabs[i]), ((i + 0.5) * tabWidth), 23);
    }

    baseMenuCtx.fillStyle = `yellow`;
    baseMenuCtx.textAlign = `right`;
    baseMenuCtx.font = `18px ShareTech`;
    write(baseMenuCtx, translate(`PRESS X TO EXIT BASE`), baseMenuCanvas.width - 16, baseMenuCanvas.height - 16);
    baseMenuCtx.font = `14px ShareTech`;
    baseMenuCtx.textAlign = `left`;
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
        case -1:
            rCreds();
            break;
        case 0:
            renderShop();
            break;
        case 1:
            renderQuests();
            break;
        case 2:
            renderAchievementsTab();
            break;
        case 3:
            renderMore();
            break;
        case 7:
            renderWeaponStore();
            break;
        case 8:
            renderConfirm();
            break;
        default:
            break;
    }
    if (savedNote-- > 0 && !guest) {
        rSavedNote();
    }
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
    if (tab === 0) shopOnClick(buttonID);
    else if (tab === 1) questsOnClick(buttonID);
    else if (tab === 2) achievementsOnClick(buttonID);
    else if (tab === 3) moreOnClick(buttonID);

    const x = mx - baseMenuX;
    const y = my - baseMenuY; // mouse coordinates

    if (x > 0 && x < 128 * 6 && y > 0 && y < 40) tab = Math.floor(x / tabWidth);
};
