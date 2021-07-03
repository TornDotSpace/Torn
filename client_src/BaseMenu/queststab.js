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
import { getQuestDescription, write, numToLS } from '../utils/helper';

import socket from '../modules/socket';

// Render the quests tab.
global.renderQuests = function () {
    baseMenuCtx.font = `14px ShareTech`;
    baseMenuCtx.textAlign = `left`;
    const mult = (myTrail % 16 == 2) ? 1.05 : 1;
    if (quest != 0) {
        baseMenuCtx.fillStyle = `cyan`;
        baseMenuCtx.textAlign = `center`;
        baseMenuCtx.font = `30px ShareTech`;
        write(baseMenuCtx, translate(`Quest Accepted!`), 128 * 3, 128);
        baseMenuCtx.font = `14px ShareTech`;
        const desc = getQuestDescription(quest);
        write(baseMenuCtx, desc, 128 * 3, 192);
        baseMenuCtx.textAlign = `left`;
    } else {
        for (const i in quests) {
            const xv = i < 5 ? 0 : 128 * 3;
            const questi = quests[i];
            let desc = ``;
            baseMenuCtx.fillStyle = i == seller - 300 ? `cyan` : `tan`;
            desc = getQuestDescription(questi);
            write(baseMenuCtx, translate(questi.type), xv + 16, 72 + i % 5 * 80);
            baseMenuCtx.fillStyle = i == seller - 300 ? `green` : `gold`;
            write(baseMenuCtx, translate(`Reward: $# and # exp.`, [numToLS(mult * questi.exp), numToLS(Math.floor(questi.exp / ((questi.type === `Mining` || questi.type === `Delivery`) ? 1500 : 4000)))]), xv + 16 + 16, 72 + i % 5 * 80 + 16);
            baseMenuCtx.fillStyle = i == seller - 300 ? `lime` : `yellow`;
            wrapText(baseMenuCtx, translate(`Description: `) + desc, xv + 16 + 16, 72 + i % 5 * 80 + 32, 128 * 3 - 48, 16);
        }
    }
};

global.questsOnHover = function (preSeller) {
    const x = mx - baseMenuX;
    const y = my - baseMenuY; // mouse coordinates

    if (x > 16 && x < 128 * 6 - 16 && y > 40 + 32 && y < 512 - 48 && quest == 0) {
        seller = Math.floor((y - 40 - 32) / 80) + 300;
        if (x > 128 * 3) seller += 5;
        if (preSeller != seller) {
            r3DMap();
        }
    } else if (quest == 0 && (seller < 300 || seller >= 400)) {
        r3DMap();
    } else {
        seller = 0;
    }
};

global.questsOnClick = function (buttonID) {
    if (buttonID >= 300 && buttonID < 310 && quest == 0) socket.emit(`quest`, { quest: buttonID - 300 });
};
