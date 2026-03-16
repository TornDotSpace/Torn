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

import {
    write,
    sinLow,
    cosLow,
    colorSelect
} from '../utils/helper';

// pointer rendering
global.rEdgePointer = function () {
    let angle = 0;
    if (px < py) {
        if (sectorWidth - px > py) angle = 2;
        else angle = 1;
    } else {
        if (sectorWidth - px > py) angle = 3;
        else angle = 0;
    }
    let text = ``;
    if (angle == 0) text = sectorWidth - px;
    else if (angle == 3) text = py;
    else if (angle == 2) text = px;
    else if (angle == 1) text = sectorWidth - py;
    rPointerArrow(Img.yellowHollowArrow, angle * Math.PI / 2, text, `yellow`);
};
global.rBasePointer = function (nearB, extraX = 0, extraY = 0) {
    const text = Math.hypot(nearB.x - px + extraX, nearB.y - py + extraY);
    const angle = Math.atan2(nearB.y - py + extraY, nearB.x - px + extraX);
    let colorBase = `lightgray`;
    if (typeof nearB.color !== `undefined`) colorBase = colorSelect(nearB.color, `red`, `cyan`, `lime`, `lightgray`);
    rPointerArrow(Img.whiteArrow, angle, text, colorBase, 1.0, true);
};
global.rTeamPointers = function (pointers, extraX = undefined, extraY = undefined) {
    const lenW = pointers.length;
    if (extraX === undefined) (extraX = []).length = lenW; extraX.fill(0);
    if (extraY === undefined) (extraY = []).length = lenW; extraY.fill(0);
    for (let i = 0; i < lenW; i++) {
        if (pointers[i] === 0) continue;
        const text = Math.hypot(pointers[i].x - px + extraX[i], pointers[i].y - py + extraY[i]);
        const angle = Math.atan2(pointers[i].y - py + extraY[i], pointers[i].x - px + extraX[i]);
        rPointerArrow(colorSelect(teamColors[i], Img.redArrow, Img.blueArrow, Img.greenArrow, Img.yellowArrow), angle, text, colorSelect(teamColors[i], `red`, `cyan`, `lime`, `yellow`));
    }
};
global.rAstPointer = function (nearE, extraX = 0, extraY = 0) {
    const text = Math.hypot(nearE.x - px + extraX, nearE.y - py + extraY);
    const angle = Math.atan2(nearE.y - py + extraY, nearE.x - px + extraX);
    rPointerArrow(Img.orangeArrow, angle, text, `orange`);
};
global.rBlackHoleWarning = function (x, y, extraX = 0, extraY = 0, defaultImg = Img.blackArrow) {
    const dx = x - px + extraX;
    const dy = y - py + extraY;
    const angle = Math.atan2(dy, dx);
    rPointerArrow(defaultImg, angle, Math.hypot(dx, dy), `white`, 3.0);
};
global.rPointerArrow = function (img, angle, dist, textColor, factorChange = 1.0, tooBig = false) {
    if (tooBig == true || (textColor !== `lightgray` && textColor !== `orange`)) {
        if (dist < 100 || (tooBig == false && dist > (va2 * 3840 - 1280) * factorChange)) return;
    }
    dist = Math.floor(dist / 10);
    ctx.fillStyle = textColor;
    const pw = ships[ship].width;
    const rendX = w / 2 + pw * 1 * cosLow(angle) + scrx;
    const rendY = h / 2 + pw * 1 * sinLow(angle) + scry;
    const rendXt = w / 2 + pw * 1.3 * cosLow(angle) + scrx;
    const rendYt = h / 2 + pw * 1.3 * sinLow(angle) + scry;
    const hw = img.width / 2;
    ctx.save();
    ctx.translate(rendX, rendY);
    ctx.rotate(angle);
    ctx.drawImage(img, -hw, -hw);
    ctx.restore();
    ctx.textAlign = `center`;
    write(ctx, dist, rendXt, rendYt + 6);
    ctx.textAlign = `left`;
};
