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
import { write, abbrevInt, brighten } from '../utils/helper';

const leaderboardcanvas = document.createElement(`canvas`);
leaderboardcanvas.width = 260;
leaderboardcanvas.height = (21 + 4) * 16 + 2;
const lbctx = leaderboardcanvas.getContext(`2d`, { alpha: true });

global.renderLeaderboard = function () {
    if (guest) return;

    leaderboardcanvas.width = leaderboardcanvas.width;

    lbctx.fillStyle = guiColor;
    lbctx.globalAlpha = guiOpacity;
    roundRect(lbctx, 0, -8, leaderboardcanvas.width + 8, (lb.length + 4) * 16 + 2 + 8, 16, true, false);

    lbctx.fillStyle = pc;
    roundRect(lbctx, 39, Math.min(youi, 16) * 16 + 52, myName.length * 8 + 7, 16, 7, true, false);
    lbctx.globalAlpha = 1;

    lbctx.fillStyle = `yellow`;
    lbctx.font = `24px ShareTech`;
    lbctx.textAlign = `center`;
    write(lbctx, translate(`Leaderboard`), 128, 28);
    lbctx.font = `14px ShareTech`;
    write(lbctx, translate(`Name`), 52, 48);
    lbctx.textAlign = `right`;
    write(lbctx, translate(`Exp`), 196, 48);
    write(lbctx, translate(`Rank`), 244, 48);
    for (let i = 0; i < lb.length; i++) {
        const place = 1 + ((i != 20) ? i : parseInt(lb[i].id));
        lbctx.textAlign = `left`;
        lbctx.fillStyle = brighten(lb[i].color);
        if (lb[i].tag === `V` || lb[i].tag === `B`) {
            lbctx.drawImage(Img.vipstar, 26, i * 16 + 50);
        }
        write(lbctx, lb[i].name, 44, (i + 4) * 16);
        lbctx.fillStyle = `yellow`;
        write(lbctx, place + translate(`.`), 12, (i + 4) * 16);
        lbctx.textAlign = `right`;
        write(lbctx, abbrevInt(lb[i].exp), 196, (i + 4) * 16);
        write(lbctx, lb[i].rank, 244, (i + 4) * 16);
    }
};
global.pasteLeaderboard = function () {
    if (lb != 0)
        ctx.drawImage(leaderboardcanvas, w - 260, 0);
};
