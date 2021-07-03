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
import {
    getRainbowColor,
    write,
    colorSelect,
    numToLS
} from '../utils/helper';

import socket from '../modules/socket';

let achHover = -1;

// Render the Achievements
global.renderAchievementsTab = function () {
    baseMenuCtx.save();
    baseMenuCtx.fillStyle = `yellow`;
    baseMenuCtx.font = `14px ShareTech`;
    baseMenuCtx.textAlign = `center`;
    for (let i = 0; i < achs.length; i++) {
        if (i < 10) baseMenuCtx.fillStyle = achs[i] ? `red` : `pink`;
        else if (i < 15) baseMenuCtx.fillStyle = achs[i] ? `gold` : `lime`;
        else if (i < 20) baseMenuCtx.fillStyle = achs[i] ? `lightgray` : `white`;
        else baseMenuCtx.fillStyle = achs[i] ? `cyan` : `yellow`;
        if (i == achHover) {
            baseMenuCtx.fillStyle = getRainbowColor();
        }
        if (achs[i]) {
            baseMenuCtx.font = `11px ShareTech`;
            write(baseMenuCtx, jsn.achNames[i].split(`:`)[1], baseMenuCanvas.width * (1 + (i % 5) * 2) / 10, 20 + 80 * Math.floor(i / 5) + 70);
        }
        baseMenuCtx.font = `15px ShareTech`;
        write(baseMenuCtx, achs[i] ? jsn.achNames[i].split(`:`)[0] : translate(`???`), baseMenuCanvas.width * (1 + (i % 5) * 2) / 10, 8 + 80 * Math.floor(i / 5) + 70);
    }
    baseMenuCtx.restore();
};

global.achievementsOnHover = () => {
    const x = mx - baseMenuX;
    const y = my - baseMenuY; // mouse coordinates

    const achLengthArray = [0, 9, 14, 19, 24];
    seller = 0;
    for (let i = 0; i < 5; i++) {
        const ach = achLengthArray[i];
        const ax = baseMenuCanvas.width * (1 + (ach % 5) * 2) / 10;
        const ay = 20 + 80 * Math.floor(ach / 5) + 70;
        if (x > ax - 64 && x < ax + 64 && y > ay - 25 && y < ay + 10) {
            seller = 700 + i;
            achHover = ach;
            break;
        }
    }
    if (seller == 0 || (tag !== `B` && ((seller == 701 && !achs[9]) || (seller == 702 && !achs[14]) || (seller == 703 && !achs[19]) || (seller == 704 && !achs[24])))) {
        seller = 0;
        achHover = -1;
    }

    if (seller == 700 && `BOA`.includes(tag)) {
        seller = 705;
    }
};

global.achievementsOnClick = (buttonID) => {
    // Trails
    if (buttonID >= 700 && buttonID < 706) socket.emit(`trail`, { trail: buttonID - 700 });
};
