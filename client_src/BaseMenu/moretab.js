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
import { write } from '../utils/helper';

// Render "More" page.
global.renderMore = function () {
    baseMenuCtx.textAlign = `center`;
    baseMenuCtx.font = `26px ShareTech`;
    const data = [`Wiki`, `Store`, `Leaderboard`, `Github`, `Discord`, `Credits`];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
            baseMenuCtx.fillStyle = (seller == 500 + i + j * 3) ? `lime` : `yellow`;
            const rendX = 128 + i * 256;
            const rendY = 40 + j * (512 - 40) * 2 / 3 + (512 - 40) / 6;
            write(baseMenuCtx, translate(data[i + j * 3]), rendX, rendY);
        }
    }
    baseMenuCtx.textAlign = `left`;
    baseMenuCtx.font = `14px ShareTech`;
};

global.moreOnHover = function () {
    const x = mx - baseMenuX;
    const y = my - baseMenuY; // mouse coordinates

    if (y > 40 && y < 512 && x > 0 && x < 768) {
        const ticX = Math.floor(x / 256);
        const ticY = Math.floor((y - 40) / ((512 - 40) / 2));
        seller = 500 + ticX + ticY * 3;
    } else {
        seller = 0;
    }
};

global.moreOnClick = function (buttonID) {
    // more page
    const linkArr = [`https://tornspace.wikia.com/wiki/Torn.space_Wiki`, `/store`, `/leaderboard`, `https://github.com/TornDotSpace/Torn`, `https://discord.gg/tGrYXwP`, `/credits`];
    for (let i = 0; i < 6; i++) {
        if (buttonID == 500 + i) window.open(linkArr[i], `_blank`);
    }
};
