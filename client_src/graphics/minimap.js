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
import {
    getSectorName,
    write,
    square,
    sinLow,
    cosLow,
    colorSelect,
    coherentNoise,
    lerp,
    brighten
} from '../utils/helper';

const minimapcanvas = document.createElement(`canvas`);
minimapcanvas.width = minimapcanvas.height = 208;
const minictx = minimapcanvas.getContext(`2d`, { alpha: true });

global.useOldMap = true;

global.dots = [];
const armCount = 5;
dots[0] = { x: 0, y: 0, z: 0 };
for (let i = 1; i < 800; i++) {
    const leaf = Math.floor(Math.random() * armCount);
    const dist = ((Math.random() - 0.4) * (Math.random() - 0.6) + 0.3) * 200;
    const angleMiss = (Math.random() - 0.5) * dist * 0.06 / armCount;
    const a = leaf * Math.PI * 2 / armCount + angleMiss + dist / 70;
    const zz = 400 / dist * (Math.random() - 0.5);
    const xx = dist * cosLow(a) * 2;
    const yy = dist * sinLow(a) * 2;
    dots[i] = { x: xx, y: yy, z: zz };
}

const quasar = [];
/* for (let i = 0; i < 30; i++) {
  let dist = Math.random()*.8;
  let a = Math.random()*Math.PI*2;
  let xx = dist*cosLow(a);
  let yy = dist*sinLow(a);
  quasar[i] = { x: xx, y: yy, z: Math.min(1/(dist-.4), 20)};
} */

global.roll = function (v) {
    for (const i in dots) {
        const dot = dots[i];
        const dist = Math.sqrt(dot.y * dot.y + dot.z * dot.z);
        const ang = Math.atan2(dot.z, dot.y) + v / 28;
        const cos = Math.cos(ang) * dist;
        const sin = Math.sin(ang) * dist;
        dot.y = cos;
        dot.z = sin;
    }
    for (const i in quasar) {
        const dot = quasar[i];
        const dist = Math.sqrt(dot.y * dot.y + dot.z * dot.z);
        const ang = Math.atan2(dot.z, dot.y) + v / 28;
        const cos = Math.cos(ang) * dist;
        const sin = Math.sin(ang) * dist;
        dot.y = cos;
        dot.z = sin;
    }
    for (let i = 0; i < mapSz + 1; i++) {
        for (let j = 0; j < mapSz + 1; j++) {
            const dot = sectorPoints[i][j];
            const dist = Math.sqrt(dot.y * dot.y + dot.z * dot.z);
            const ang = Math.atan2(dot.z, dot.y) + v / 28;
            const cos = Math.cos(ang) * dist;
            const sin = Math.sin(ang) * dist;
            dot.y = cos;
            dot.z = sin;
        }
    }
};
global.spin = function (v) {
    for (const i in dots) {
        const dot = dots[i];
        const dist = Math.sqrt(dot.x * dot.x + dot.z * dot.z);
        const ang = Math.atan2(dot.z, dot.x) + v / 28;
        const cos = Math.cos(ang) * dist;
        const sin = Math.sin(ang) * dist;
        dot.x = cos;
        dot.z = sin;
    }
    for (const i in quasar) {
        const dot = quasar[i];
        const dist = Math.sqrt(dot.x * dot.x + dot.z * dot.z);
        const ang = Math.atan2(dot.z, dot.x) + v / 28;
        const cos = Math.cos(ang) * dist;
        const sin = Math.sin(ang) * dist;
        dot.x = cos;
        dot.z = sin;
    }
    for (let i = 0; i < mapSz + 1; i++) {
        for (let j = 0; j < mapSz + 1; j++) {
            const dot = sectorPoints[i][j];
            const dist = Math.sqrt(dot.x * dot.x + dot.z * dot.z);
            const ang = Math.atan2(dot.z, dot.x) + v / 28;
            const cos = Math.cos(ang) * dist;
            const sin = Math.sin(ang) * dist;
            dot.x = cos;
            dot.z = sin;
        }
    }
};
/* global.rotate = function(v) {        Upcoming feature. DO NOT REMOVE!
  for (const i in dots) {
    const dot = dots[i];
    const dist = Math.sqrt(dot.x * dot.x + dot.y * dot.y);
    const ang = Math.atan2(dot.y, dot.x) + v / 28;
    const cos = Math.cos(ang) * dist;
    const sin = Math.sin(ang) * dist;
    dot.x = cos;
    dot.y = sin;
  }
  for (const i in quasar) {
    const dot = quasar[i];
    const dist = Math.sqrt(dot.x * dot.x + dot.y * dot.y);
    const ang = Math.atan2(dot.y, dot.x) + v / 28;
    const cos = Math.cos(ang) * dist;
    const sin = Math.sin(ang) * dist;
    dot.x = cos;
    dot.y = sin;
  }
  for (let i = 0; i < mapSz+1; i++) {
    for (let j = 0; j < mapSz+1; j++) {
      const dot = sectorPoints[i][j];
      const dist = Math.sqrt(dot.x * dot.x + dot.y * dot.y);
      const ang = Math.atan2(dot.y, dot.x) + v / 28;
      const cos = Math.cos(ang) * dist;
      const sin = Math.sin(ang) * dist;
      dot.x = cos;
      dot.y = sin;
    }
  }
} */
global.center3D = function (xxp, yyp, zzp) {
    for (const i in dots) {
        dots[i].x -= xxp;
        dots[i].y -= yyp;
        dots[i].z -= zzp;
    }
    for (const i in quasar) {
        quasar[i].x -= xxp;
        quasar[i].y -= yyp;
        quasar[i].z -= zzp;
    }
    for (let i = 0; i < mapSz + 1; i++) {
        for (let j = 0; j < mapSz + 1; j++) {
            sectorPoints[i][j].x -= xxp;
            sectorPoints[i][j].y -= yyp;
            sectorPoints[i][j].z -= zzp;
        }
    }
};
global.r3DMap = function () {
    if (sectorPoints == 0 || guest) return;

    minimapcanvas.width = minimapcanvas.width;
    minictx.lineWidth = 2;

    minictx.globalAlpha = guiOpacity;
    minictx.fillStyle = guiColor;
    roundRect(minictx, 0, 0, minimapcanvas.width, minimapcanvas.height, 16, true, false);

    if (hmap == 0 || typeof hmap[sx] === `undefined`) return;

    // if ((hmt > 3 && pc === 'blue') || (hmt < -3 && pc === 'red')) currAlert = translate("Enemy Swarm In Sector"); // GREENTODO enemy swarm

    if (pscx == 0) {
        roll(40);
        spin(-(sx + 5) * 20);
    }

    let c3dx; let c3dy;

    minictx.strokeStyle = `gray`;
    minictx.lineWidth = 1;
    minictx.textAlign = `center`;

    let avgX = 0;
    let avgY = 0;
    let avgZ = 0;
    let avgi = 0;

    let qdsx = -1;
    let qdsy = -1;
    let qsx = -1;
    let qsy = -1;
    if (quest != 0) {
        qdsx = quest.dsx;
        qdsy = quest.dsy;
        qsx = quest.sx;
        qsy = quest.sy;
    } else if (seller >= 300 && seller <= 309) {
        const hoverquest = quests[seller - 300];
        qdsx = hoverquest.dsx;
        qdsy = hoverquest.dsy;
        qsx = hoverquest.sx;
        qsy = hoverquest.sy;
    }

    for (let i = 0; i < mapSz; i++) {
        for (let j = 0; j < mapSz; j++) {
            let dot1 = sectorPoints[i][j];
            let dot2 = sectorPoints[i][j + 1];
            let dot3 = sectorPoints[i + 1][j];
            let dot4 = sectorPoints[i + 1][j + 1];
            if (useOldMap) { // Override if the user is using the square map
                dot1 = { x: (i - mapSz / 2) * 192 / mapSz, y: (j - mapSz / 2) * 192 / mapSz, z: 0 };
                dot2 = { x: (i - mapSz / 2) * 192 / mapSz, y: (j + 1 - mapSz / 2) * 192 / mapSz, z: 0 };
                dot3 = { x: (i + 1 - mapSz / 2) * 192 / mapSz, y: (j - mapSz / 2) * 192 / mapSz, z: 0 };
                dot4 = { x: (i + 1 - mapSz / 2) * 192 / mapSz, y: (j + 1 - mapSz / 2) * 192 / mapSz, z: 0 };
            }

            const cz = (dot1.z + dot4.z) / 2;

            let ga = 0.75;
            if (!useOldMap) {
                // Sectors dynamically transparent
                ga = Math.min(1, 48 * square(square(square(-cz / 400 + 0.5))));
            }
            // if(ga<.1) continue; dunno why this doesnt work
            minictx.globalAlpha = ga;

            const appliedZoom = useOldMap ? 1 : mapZoom;

            // render lines
            const xx1 = dot1.x / appliedZoom;
            const yy1 = dot1.y / appliedZoom;
            const xx2 = dot2.x / appliedZoom;
            const yy2 = dot2.y / appliedZoom;
            const xx3 = dot3.x / appliedZoom;
            const yy3 = dot3.y / appliedZoom;
            const xx4 = dot4.x / appliedZoom;
            const yy4 = dot4.y / appliedZoom;
            minictx.beginPath();
            minictx.moveTo(104 + xx3, 104 + yy3);
            minictx.lineTo(104 + xx1, 104 + yy1);
            minictx.lineTo(104 + xx2, 104 + yy2);
            minictx.lineTo(104 + xx4, 104 + yy4);
            minictx.lineTo(104 + xx3, 104 + yy3);
            minictx.closePath();

            // render sector labels
            const fontsz = Math.hypot(xx3 - xx2, yy3 - yy2) / 3;
            if (ga > 0.3 && fontsz > 5 && baseMap2D[i][j] === 0 && !(useOldMap && i * j != 0)) {
                minictx.font = `${fontsz}px ShareTech`;
                minictx.fillStyle = `white`;
                write(minictx, getSectorName(i, j), (xx2 + xx3) / 2 + 104, (yy2 + yy3 + fontsz * 0.65) / 2 + 104);
            }

            const cx = (xx1 + xx4) / 2;
            const cy = (yy1 + yy4) / 2;

            avgX += cx;
            avgY += cy;
            avgZ += cz;
            avgi++;

            if ((i == sx && j == sy) || (i === qsx && j === qsy) || (i === qdsx && j === qdsy)) {
                // Highlight the player's sector
                minictx.lineWidth = 3;
                minictx.strokeStyle = minictx.fillStyle = (i == sx && j == sy) ? brighten(pc) : `yellow`;
                minictx.stroke();
                minictx.lineWidth = 0.35;
                minictx.strokeStyle = `gray`;

                if (i == sx && j == sy) {
                    myxx1 = xx1;
                    myxx2 = xx2;
                    myxx3 = xx3;
                    myxx4 = xx4;
                    myyy1 = yy1;
                    myyy2 = yy2;
                    myyy3 = yy3;
                    myyy4 = yy4;
                    pscx = cx;
                    pscy = cy;
                    psga = ga;
                }
            }
            // else minictx.stroke(); <-- Renders borders around the sectors

            if (baseMap2D[i][j] !== 0) {
                const img = colorSelect(baseMap2D[i][j], Img.mrss, Img.mbss, Img.mgss);
                minictx.drawImage(img, 104 + cx - 7, 104 + cy - 7, 15, 15);
            }

            if (planetMap2D[i][j] !== 0) {
                const planX = planetMap2D[i][j].x / sectorWidth;
                const planY = planetMap2D[i][j].y / sectorWidth;
                const xxp1 = lerp(xx1, xx4, (planX + planY) / 2) - cx;
                const yyp1 = lerp(yy1, yy4, (planX + planY) / 2) - cy;
                const xxp2 = lerp(xx3, xx2, (-planX + 1 + planY) / 2) - cx;
                const yyp2 = lerp(yy3, yy2, (-planX + 1 + planY) / 2) - cy;
                minictx.fillStyle = `white`;
                minictx.fillRect(104 + cx + xxp1 + xxp2 - 2, 104 + cy + yyp1 + yyp2 - 2, 4, 4);
            }

            for (const m in myGuild[j][i]) {
                const member = myGuild[j][i][m];
                const planX = member.x / sectorWidth;
                const planY = member.y / sectorWidth;
                const xxp1 = lerp(xx1, xx4, (planX + planY) / 2) - cx;
                const yyp1 = lerp(yy1, yy4, (planX + planY) / 2) - cy;
                const xxp2 = lerp(xx3, xx2, (-planX + 1 + planY) / 2) - cx;
                const yyp2 = lerp(yy3, yy2, (-planX + 1 + planY) / 2) - cy;
                minictx.fillStyle = brighten(pc);
                minictx.fillRect(104 + cx + xxp1 + xxp2 - 2, 104 + cy + yyp1 + yyp2 - 2, 4, 4);
            }

            if (va2 > 1.9) {
                if (Math.floor(bx * mapSz) == i && Math.floor(by * mapSz) == j) { // render wormhole
                    minictx.strokeStyle = `white`;
                    minictx.fillStyle = `black`;
                    minictx.beginPath();
                    const bxin = bx * mapSz - Math.floor(bx * mapSz); const byin = by * mapSz - Math.floor(by * mapSz);
                    const xxp1 = lerp(xx1, xx4, (bxin + byin) / 2) - cx;
                    const yyp1 = lerp(yy1, yy4, (bxin + byin) / 2) - cy;
                    const xxp2 = lerp(xx3, xx2, (-bxin + 1 + byin) / 2) - cx;
                    const yyp2 = lerp(yy3, yy2, (-bxin + 1 + byin) / 2) - cy;
                    c3dx = cx + xxp1 + xxp2;
                    c3dy = cy + yyp1 + yyp2;
                    minictx.arc(104 + c3dx, 104 + c3dy, 4, 0, 2 * Math.PI, false);
                    minictx.fill();
                    minictx.stroke();
                    minictx.closePath();
                }
                if (Math.floor(bxo * mapSz) == i && Math.floor(byo * mapSz) == j) { // render wormhole output
                    minictx.fillStyle = `white`;
                    minictx.beginPath();
                    const bxin = bxo * mapSz - Math.floor(bxo * mapSz); const byin = byo * mapSz - Math.floor(byo * mapSz);
                    const xxp1 = lerp(xx1, xx4, (bxin + byin) / 2) - cx;
                    const yyp1 = lerp(yy1, yy4, (bxin + byin) / 2) - cy;
                    const xxp2 = lerp(xx3, xx2, (-bxin + 1 + byin) / 2) - cx;
                    const yyp2 = lerp(yy3, yy2, (-bxin + 1 + byin) / 2) - cy;
                    c3dx = cx + xxp1 + xxp2;
                    c3dy = cy + yyp1 + yyp2;
                    minictx.arc(104 + c3dx, 104 + c3dy, 4, 0, 2 * Math.PI, false);
                    minictx.fill();
                    minictx.closePath();
                }
            }

            // render heatmap
            const eachmt = hmap[i][j];
            minictx.fillStyle = `rgb(${Math.floor(eachmt >> 16) % 0x100}, ${Math.floor(eachmt >> 8) % 0x100}, ${eachmt % 0x100})`;
            const alp = eachmt - Math.floor(eachmt);
            minictx.globalAlpha *= Math.sqrt(Math.min(1, alp)) / 2;
            minictx.fill();
            minictx.closePath();
        }
    }
    if (!centered) {
        center3D(avgX / avgi, avgY / avgi, avgZ / avgi);
        centered = true;
    }

    // render stars
    if (!useOldMap) {
        for (const i in dots) {
            const dot = dots[i];
            const xx = 104 + dot.x / mapZoom;
            const yy = 104 + dot.y / mapZoom;
            const sz = i / 500 + 0.5;
            minictx.fillStyle = `#${(((128 + Math.floor(Math.abs(coherentNoise(i)) * 128)) << 16) + (Math.floor(64 + Math.abs(coherentNoise(17 * i + 79)) * 128) << 8) + Math.floor(Math.abs(coherentNoise(7 * i + 107)) * 128)).toString(16)}`;
            minictx.globalAlpha = Math.min(1, 48 * square(square(square(-dot.z / 400 + 0.5))));
            minictx.fillRect(xx - sz / 2, yy - sz / 2, sz, sz);
        }
        minictx.globalAlpha = Math.min(1, 48 * square(square(square(-dots[0].z / 400 + 0.5))));
        minictx.fillStyle = `black`;
        minictx.strokeStyle = `white`;
        minictx.beginPath();
        minictx.arc(104 + dots[0].x / mapZoom, 104 + dots[0].y / mapZoom, 10, 0, Math.PI * 2, false);
        minictx.fill();
        minictx.stroke();
        minictx.closePath();
    }

    minictx.globalAlpha = 1;
};
global.paste3DMap = function (xp, yp) {
    if (sectorPoints == 0 || guest) return;
    /* let d = new Date();
  let t = d.getMilliseconds() + d.getSeconds() * 1000 + d.getMinutes() * 6000 + d.getHours() * 36000;
  t/=1000;
  ctx.globalAlpha=.8;
  let bhx = dots[0].x, bhy = dots[0].y, bhz = dots[0].z;
  render quasar jet
  for (let i in quasar) {
    let dot = quasar[i];
    let dt = t*Math.sqrt(square(dot.z-bhz)+square(dot.y-bhy)+square(dot.x-bhx))%100/10;
    let x1 = xp+104 + ((dot.x-bhx)*dt+bhx) / mapZoom;
    let y1 = yp+104 + ((dot.y-bhy)*dt+bhy) / mapZoom;
    let x2 = xp+104 + ((dot.x-bhx)*dt*2+bhx) / mapZoom;
    let y2 = yp+104 + ((dot.y-bhy)*dt*2+bhy) / mapZoom;
    let sz = i/500+.5
    ctx.strokeStyle = "#"+(((0 + Math.floor(Math.abs(coherentNoise(i)) * 128)) << 16) + (Math.floor(64+Math.abs(coherentNoise(17*i+79)) * 128) << 8) + Math.floor(128+Math.abs(coherentNoise(7*i+107)) * 128)).toString(16);
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.closePath();
    ctx.stroke();
  } */
    ctx.drawImage(minimapcanvas, xp, yp);
    const xxp1 = lerp(myxx1, myxx4, (px / sectorWidth + py / sectorWidth) / 2) - pscx; // these are just clever ways of using linear interpolation in a skew vector space
    const yyp1 = lerp(myyy1, myyy4, (px / sectorWidth + py / sectorWidth) / 2) - pscy;
    const xxp2 = lerp(myxx3, myxx2, (-px / sectorWidth + 1 + py / sectorWidth) / 2) - pscx;
    const yyp2 = lerp(myyy3, myyy2, (-px / sectorWidth + 1 + py / sectorWidth) / 2) - pscy;
    ctx.fillStyle = brighten(pc);
    ctx.globalAlpha = psga;
    ctx.fillRect(xp + 104 + pscx + xxp1 + xxp2 - 3, yp + 104 + pscy + yyp1 + yyp2 - 3, 6, 6);
    ctx.fillStyle = `yellow`;
    ctx.globalAlpha = 1;
    ctx.font = `12px ShareTech`;
    write(ctx, translate(`Press M to use the ${useOldMap ? `3D` : `flat`} map`), 8, 232); // outside of the minimap canvas, gotta use ctx
};
