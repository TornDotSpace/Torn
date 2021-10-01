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

import { pasteChat } from '../chat';
import { getSplash, jsn, translate } from '../localizer';

import {
    getSectorName,
    getQuestDescription,
    write,
    square,
    cube,
    sinLow,
    cosLow,
    colorSelect,
    rankToExp,
    lagMath,
    addBigNote,
    bgPos,
    getTimeAngle,
    brighten,
    numToLS,
    ammoCodeToString,
    metalToColor,
    metalToQuantity
} from '../utils/helper';

global.LIVEBASE = 0;
global.DEADBASE = 1;
global.TURRET = 2;
global.SENTRY = 3;

global.render = function () {
    if (dead) {
        ctx.globalAlpha = 0.02;
        ctx.fillStyle = `black`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        rDead();
        return;
    }
    if (docked) {
        frames++;
        autopilot = false;
        updateNotes();
        rInBase();
    }
    if (docked || (playersInfo == 0 && !(disguise > 0))) return;
    if (ops > 0 || clientLag >= 35) {
        rLagStats(clientLag, 0);
        clientLag = 34;
        setTimeout(render, 5);
        return;
    }
    if (hyperdriveTimer > 0) {
        scrx = scry = 0;
        dmgTimer = (10000 - square(100 - hyperdriveTimer)) / 1000;
    }
    frames++;
    ops++;
    let d = new Date();
    const lagTimer = d.getTime();
    ctx.font = `14px ShareTech`;

    let time0 = -performance.now();
    canvas.width = canvas.width;
    renderBG();// Fast, surprisingly.
    const r = Math.floor(Math.random() * 25);
    let undoing = false;
    if (dmgTimer > 0) {
        rDmg(r);
        undoing = true;
    }
    if ((iron + platinum + copper + silver) / (ships[ship].capacity * c2) > 0.995) currAlert = translate(`Cargo Bay Full!`);

    let time1 = -performance.now();
    time0 -= time1;
    if (fps >= 30 && clientLag <= 25) rStars(); // Laggy as shit. Everything up to this is fast.

    let time2 = -performance.now();
    time1 -= time2;
    rPlanets();
    rBases();

    let time3 = -performance.now();
    time2 -= time3;
    rAsteroids();
    rPacks();

    let time4 = -performance.now();
    time3 -= time4;
    rTrails();// Gets to .2-.25 in heavy drifting
    rPlayers();// fast
    if (disguise > 0) rSelfCloaked();

    let time5 = -performance.now();
    time4 -= time5;
    rBullets();// fast
    rBeams();// Fast
    rBlasts();
    rMissiles();// Fast
    rOrbs();// Fast
    rMines();// Fast
    rVorts();// Fast
    rBooms();// Fast

    let time6 = -performance.now();
    time5 -= time6;
    rSectorEdge();
    rEdgePointer();// Fast
    rNotes();// Fast
    rKillStreak();
    if (afk) rAfk();
    if (quest != 0) rCurrQuest();
    rRaid();
    rWeapons();// fast
    rEMP();

    let time7 = -performance.now();
    time6 -= time7;
    pasteChat();// slow

    let time8 = -performance.now();
    time7 -= time8;
    paste3DMap(8, 8);// Probably fast cause of subcanvasing

    let time9 = -performance.now();
    time8 -= time9;
    rRadar();// Tolerable lag
    rCargo();

    let timeA = -performance.now();
    time9 -= timeA;
    pasteLeaderboard();
    rExpBar();// Maybe a little slow
    // Everything past here is fast
    rVolumeBar();
    rEnergyBar();
    if (flash > 0) rFlash();
    rTut();
    if (undoing && hyperdriveTimer <= 0) undoDmg(r);
    if (isLocked) currAlert = translate(`Locked on by missile!`);
    rAlert();
    currAlert = bigAlert = ``;
    rBigNotes();

    d = new Date();
    const cTime = d.getTime();
    clientLag = cTime - lagTimer;
    timeA += performance.now();
    const arr = [time0, time1, time2, time3, time4, time5, time6, time7, time8, time9, timeA];
    lagMath(arr);
    rLagStats(clientLag, arr);
    rBasicText();
    ops--;
};

global.wrapText = function (context, text, x, y, maxWidth, lineHeight) {
    if (typeof text === `undefined`) {
        console.log(`Undefined text`);
        return;
    }
    const words = text.split(` `);
    let line = ``;

    for (let n = 0; n < words.length; n++) {
        const testLine = `${line + words[n]} `;
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            write(context, line, x, y);
            line = `${words[n]} `;
            y += lineHeight;
        } else line = testLine;
    }
    write(context, line, x, y);
};

global.rWeapons = function () { // Weapon selector on right side of game
    if (equipped === 0) return;
    if (equipped[1] == -2) return;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = `black`;
    ctx.strokeStyle = `cyan`;
    roundRect(ctx, w - 208, h - 432 + 8 * 16, 210, 12 * 16, { bl: 32, tl: 32 }, true, false);
    ctx.restore();

    ctx.font = `14px ShareTech`;
    ctx.fillStyle = `yellow`;
    ctx.textAlign = `right`;
    ctx.globalAlpha = Math.max(weaponTimer--, 0) / 100 * 0.7 + 0.3;

    write(ctx, translate(`Weapon`), w - 80, h - 432 + (-1 + 10) * 16);
    write(ctx, translate(`Ammo`), w - 16, h - 432 + (-1 + 10) * 16);
    for (let i = 0; i < 10; i++) {
        const local_weapon = wepns[equipped[i]];

        if (local_weapon === undefined) {
            continue;
        }

        ctx.fillStyle = scroll == i ? `lime` : `yellow`;
        if (i >= ships[ship].weapons) ctx.fillStyle = `orange`;
        if (ship < local_weapon.level) ctx.fillStyle = `red`;
        write(ctx, `${local_weapon.name}: ${(i + 1) % 10}`, w - 80, h - 432 + (i + 10) * 16);
        if (equipped[i] > -1) write(ctx, ammoCodeToString(ammos[i]), w - 16, h - 432 + (i + 10) * 16);
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = `yellow`;
    badWeapon = (badWeapon < 1) ? 0 : (badWeapon - 1);
    ctx.font = `${16 + badWeapon}px ShareTech`;
    write(ctx, translate(`Scroll to Change Weapons`), w - 16, h - 96);
    ctx.font = `14px ShareTech`;
    ctx.textAlign = `left`;
};
global.rCurrQuest = function () {
    ctx.fillStyle = `cyan`;
    ctx.textAlign = `center`;
    const desc = getQuestDescription(quest);
    write(ctx, desc, w / 2, h - 56);
    ctx.textAlign = `left`;
};
global.rEMP = function () {
    ctx.font = `24px ShareTech`;
    ctx.textAlign = `center`;
    ctx.fillStyle = `orange`;
    if (empTimer > 0) {
        write(ctx, translate(`EMP in Effect for `) + Math.round(empTimer / 25) + translate(` Seconds`) + translate(`!`), w / 2, 256 - 32);
        currAlert = translate(`Power Lost due to EMP!`);
    }
    if (gyroTimer > 0) {
        write(ctx, translate(`Gyrodynamite in Effect for `) + Math.round(gyroTimer / 25) + translate(` Seconds`) + translate(`!`), w / 2, 256 + 32);
        currAlert = translate(`Stabilization Lost due to Gyrodynamite!`);
    }
    ctx.font = `14px ShareTech`;
    ctx.textAlign = `left`;
};
global.rStars = function () {
    const mirrors = 3;
    const wm = w / mirrors;
    const hm = h / mirrors;
    for (const i in stars) {
        const s = stars[i];
        ctx.strokeStyle = ctx.fillStyle = `rgb(${128 + 32 * (i % 4)},${128 + 32 * (i / 4 % 4)},${128 + 32 * (i / 16 % 4)})`;
        let parallax = (100 - i) / 100.0;
        parallax = parallax * parallax;
        parallax = parallax * parallax;
        const starSz = 3 - i / 15; // distant stars are size 1, near stars are 3x3
        ctx.lineWidth = starSz;
        const x = (500000 + s.x - (px - scrx + sx * sectorWidth) * (parallax + 0.1) * 0.25) % wm;
        const y = (500000 + s.y - (py - scry + sy * sectorWidth) * (parallax + 0.1) * 0.25) % hm;
        for (let j = 0; j < mirrors; j++) {
            for (let k = 0; k < mirrors; k++) {
                ctx.fillRect(x + j * wm - 2, y + k * hm - 2, starSz, starSz);
            }
        }

        if (hyperdriveTimer > 0) {
            ctx.beginPath();
            for (let j = 0; j < mirrors; j++) {
                for (let k = 0; k < mirrors; k++) {
                    ctx.moveTo(x + j * wm, y + k * hm);
                    ctx.lineTo(x + j * wm - starSz * pvx / 10, y + k * hm - starSz * pvy / 10);
                }
            }
            ctx.stroke();
        }
    }
};
global.rSectorEdge = function () {
    ctx.textAlign = `center`;
    ctx.font = `14px ShareTech`;
    ctx.strokeStyle = ctx.fillStyle = `yellow`;
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 15]);
    for (let i = (w / 2 - px) % sectorWidth; i < w; i += sectorWidth) {
        ctx.beginPath();
        ctx.moveTo(i + scrx, 0);
        ctx.lineTo(i + scrx, h);
        ctx.stroke();
        ctx.save();
        ctx.translate(i, h / 2);
        ctx.rotate(Math.PI / 2);
        ctx.fillText(translate(`Edge of Sector`), 0, 0);
        ctx.restore();
    }
    for (let i = (h / 2 - py) % sectorWidth; i < h; i += sectorWidth) {
        ctx.beginPath();
        ctx.moveTo(0, i + scry);
        ctx.lineTo(w, i + scry);
        ctx.stroke();
        write(ctx, translate(`Edge of Sector`), w / 2, i);
    }
    ctx.font = `14px ShareTech`;
    ctx.textAlign = `left`;
    ctx.setLineDash([]);
};
// misc rendering
global.rLoadingBar = function () {
    ctx.fillStyle = `black`;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = `white`;
    ctx.fillRect(w / 2 - 128, h / 2 - 32, 256, 64);
    ctx.fillStyle = `black`;
    ctx.fillRect(w / 2 - 128 + 8, h / 2 - 32 + 8, 256 - 16, 64 - 16);
    ctx.fillStyle = `white`;
    ctx.fillRect(w / 2 - 128 + 16, h / 2 - 32 + 16, (256 - 32) * ((Aud_prgs[0] + Img_prgs[0]) / (Aud_prgs[1] + Img_prgs[1])), 64 - 32);
    ctx.textAlign = `center`;
    ctx.font = `30px ShareTech`;
    ctx.fillText(getSplash(), w / 2, h / 2 - 96);
    ctx.font = `15px ShareTech`;
    if (Img_prgs[0] == Img_prgs[1]) ctx.fillText(`All images loaded.`, w / 2, h / 2 + 64);
    if (Aud_prgs[0] == Aud_prgs[1]) ctx.fillText(`All sounds loaded`, w / 2, h / 2 + 80);
    ctx.fillText(currLoading, w / 2, h / 2 + 96);
};

global.updateNotes = function () {
    for (const i in notes) {
        const note = notes[i];
        if (note.time++ > 38) {
            delete notes[i];
        }
    }
};
global.updateTrails = function () {
    /* trails:
    0 -> default
    1 -> blood
    2 -> money
    3 -> panda
    4 -> random
    5 -> rainbow
    16+0 -> default star
    16+1 -> blood star
    etc...
  */

    for (const i in trails) {
        const selfo = trails[i];
        if (selfo.time++ >= 5) {
            delete trails[i];
            continue;
        }
        selfo.x += selfo.dx;
        selfo.y += selfo.dy;
    }
    const d = new Date();
    let t = d.getTime() / 100;
    for (const i in playersInfo) {
        const selfo = playersInfo[i];

        const trail = selfo.trail;
        const mod = trail % 16;
        const cos = cosLow(selfo.angle);
        const sin = sinLow(selfo.angle);
        if (Math.abs(selfo.speed) > 1 && Math.abs(selfo.driftAngle - selfo.angle) > 0.05) {
            let particleCount = square(ships[selfo.ship].width / 96) * 0.66;
            particleCount *= Math.min(Math.abs(selfo.driftAngle - selfo.angle) * 8, 16);
            if (trail > 15) particleCount /= 6;
            else if (mod != 0) particleCount *= 2.5;
            for (let j = 0; j < particleCount; j++) {
                const rando = Math.random() * selfo.speed;
                let col = (((96 + Math.floor(Math.random() * 64)) << 16) + ((96 + Math.floor(Math.random() * 128)) << 8) + 255 - Math.floor(Math.random() * 64)).toString(16);
                if (mod == 1) col = (((192 + Math.floor(Math.random() * 64)) << 16) + (Math.floor(Math.random() * 64) << 8) + Math.floor(Math.random() * 92)).toString(16);
                else if (mod == 2) {
                    if (Math.random() < 0.5) col = (((255 - Math.floor(Math.random()) * 64) << 16) + ((183 + Math.floor(Math.random() * 64)) << 8)).toString(16);
                    else col = (((Math.floor(Math.random() * 64)) << 16) + ((192 + Math.floor(Math.random() * 64)) << 8) + Math.floor(Math.random() * 64)).toString(16);
                } else if (mod == 3) {
                    const r = Math.random() < 0.5 ? 255 : 1;
                    col = ((r << 16) + (r << 8) + r).toString(16);
                } else if (mod == 4) {
                    t = Math.random() * Math.PI * 60;
                    col = ((Math.floor(Math.cos(t) * 128 + 128) << 16) + (Math.floor(Math.cos(t + Math.PI * 2 / 3) * 128 + 128) << 8) + Math.floor(Math.cos(t + Math.PI * 4 / 3) * 128 + 128)).toString(16);
                } else if (mod == 5) col = ((Math.floor(Math.cos(t) * 128 + 128) << 16) + (Math.floor(Math.cos(t + Math.PI * 2 / 3) * 128 + 128) << 8) + Math.floor(Math.cos(t + Math.PI * 4 / 3) * 128 + 128)).toString(16);
                while (col.length < 6) col = `0${col}`;
                trails[Math.random()] = {
                    vip: trail > 15,
                    dx: cos * selfo.speed / 2,
                    dy: sin * selfo.speed / 2,
                    x: selfo.x + (cube(Math.random() * 4 - 2) * 4 * ships[selfo.ship].width / 128) + cosLow(selfo.driftAngle) * (rando - selfo.speed),
                    y: selfo.y + (cube(Math.random() * 4 - 2) * 4 * ships[selfo.ship].width / 128) + sinLow(selfo.driftAngle) * (rando - selfo.speed),
                    time: -1,
                    color: col
                };
            }
        }
        if (selfo.health / selfo.maxHealth < 0.4) {
            for (let j = 0; j < 10; j++) {
                const r = Math.random();
                trails[Math.random()] = { vip: false, dx: cos * selfo.speed / 2, dy: sin * selfo.speed / 2, x: selfo.x + (cube(Math.random() * 4 - 2) * 4 * ships[selfo.ship].width / 128) + cos * r * selfo.speed, y: selfo.y + (cube(Math.random() * 4 - 2) * 4 * ships[selfo.ship].width / 128) + sin * r * selfo.speed, time: -1, color: ((Math.round(112 + 32 * r) << 16) + (Math.round(112 + 32 * r) << 8) + Math.round(112 + 32 * r)).toString(16) };
            }
        }
    }
};
global.updateBooms = function () {
    for (const i in booms) {
        const b = booms[i];
        b.time += 14;
        if (b.time > 400) {
            delete booms[i];
        }
    }
    for (const i in boomParticles) {
        const selfo = boomParticles[i];
        if (selfo.time++ >= 14) {
            delete boomParticles[i];
            continue;
        }
        selfo.x += cosLow(selfo.angle) * 25 + selfo.dx;
        selfo.y += sinLow(selfo.angle) * 25 + selfo.dy;
    }
};
global.rLore = function () {
    ctx.fillStyle = brighten(pc);
    ctx.font = `22px ShareTech`;
    wrapText(ctx, jsn.lore[colorSelect(pc, 0, 1, 2)], 48, h / 2 - 22 * 5 - 10000 / (loreTimer + 1), w - 96, 40);
    ctx.textAlign = `center`;
    ctx.fillStyle = `yellow`;
    const t = (new Date()).getTime() / 6000;
    ctx.font = `${(32 + 6 * Math.sin(24 * t)) * (loreTimer / (loreTimer + 50))}px ShareTech`;
    write(ctx, translate(`Click to play!`), w / 2, h - 48);
};
global.rEnergyBar = function () {
    if (equipped === 0) return;
    let weaponUsed = wepns[equipped[scroll]];
    let Charge = weaponUsed.charge;
    if (Charge < 12 && charge < 12) return;
    if (Charge < 12 && charge >= 12) Charge = 150;
    const div = charge / Charge / ((equipped[scroll] == 25 || equipped[scroll] == 17 || equipped[scroll] == 12) ? (e2 + 1) / 1.8 : 1);
    if (div > 1) return;
    ctx.fillStyle = `lime`;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(0, 0, (w / 2) * div, 4);
    ctx.fillRect(0, h - 4, (w / 2) * div, 4);
    ctx.fillRect(w - (w / 2) * div, 0, (w / 2) * div, 4);
    ctx.fillRect(w - (w / 2) * div, h - 4, (w / 2) * div, 4);
    ctx.fillRect(0, 0, 4, (h / 2) * div);
    ctx.fillRect(w - 4, 0, 4, (h / 2) * div);
    ctx.fillRect(0, h - (h / 2) * div, 4, (h / 2) * div);
    ctx.fillRect(w - 4, h - (h / 2) * div, 4, (h / 2) * div);
    ctx.globalAlpha = 1;
};

global.rVolumeBar = function () {
    if (volTransparency <= 0) return;
    ctx.save();

    ctx.globalAlpha = volTransparency;
    volTransparency -= 0.01;

    ctx.fillStyle = `#ffffff`;

    // Base volume bar.
    ctx.fillRect(w - 32 - 20 - 224, h - 10 - 24 - 6, 128, 6);

    // Left rounded corners.
    ctx.beginPath();
    ctx.arc(w - 32 - 20 - 224, h - 10 - 24 - 3, 3, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.closePath();

    // Right rounded corners.
    ctx.beginPath();
    ctx.arc(w - 32 - 20 - 224 + 128, h - 10 - 24 - 3, 3, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.closePath();

    // Slider button outline.
    ctx.beginPath();
    ctx.arc(w - 32 - 20 - 224 + 128 * gVol, h - 10 - 24 - 3, 6, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.closePath();

    // Slider button.
    ctx.fillStyle = `#000000`;
    ctx.beginPath();
    ctx.arc(w - 32 - 20 - 224 + 128 * gVol, h - 10 - 24 - 3, 4, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.closePath();

    ctx.restore();
};
global.rExpBar = function () {
    if (guest) return;

    ctx.lineWidth = 0.5;
    ctx.fillStyle = `black`;
    ctx.strokeStyle = `white`;
    ctx.globalAlpha = 0.4;

    // Background rectangle
    ctx.fillRect(w / 2 - 128, h - 28, 256, 16);
    ctx.strokeRect(w / 2 - 128, h - 28, 256, 16);

    // foreground rectangle
    let dec = 252 * (experience - rankToExp(rank - 1)) / (rankToExp(rank) - rankToExp(rank - 1));
    if (dec < 0) {
        dec = 0;
    }
    ctx.fillStyle = `white`;
    ctx.fillRect(w / 2 - 124, h - 24, dec, 8);

    // Write right and left xp requirements
    ctx.textAlign = `right`;
    write(ctx, `${Math.max(rankToExp(rank - 1), 0)}`, w / 2 - 140, h - 14);
    ctx.textAlign = `left`;
    write(ctx, `${rankToExp(rank)}`, w / 2 + 140, h - 14);

    // write current xp
    ctx.font = `11px ShareTech`;
    ctx.textAlign = (dec > 126) ? `right` : `left`;
    ctx.fillStyle = (dec > 126) ? `black` : `white`;
    write(ctx, `${Math.round(experience)}`, w / 2 - 128 + dec + (dec > 126 ? -8 : 8), h - 16);

    // revert canvas state
    ctx.font = `14px ShareTech`;
    ctx.textAlign = `left`;
    ctx.globalAlpha = 1;
};
global.rNotes = function () {
    ctx.textAlign = `center`;
    ctx.fillStyle = `pink`;
    for (const i in notes) {
        const note = notes[i];
        ctx.font = `${note.strong ? 40 : 20}px ShareTech`;
        ctx.globalAlpha = (39 - note.time) / 39;
        const x = note.spoils ? note.x : (note.x - px + w / 2 + scrx + (note.local ? px : 0));
        const y = note.spoils ? note.y : (note.y - py + h / 2 - note.time + scry + (note.local ? py : 0));
        write(ctx, note.msg, x, y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = `left`;
    ctx.font = `14px ShareTech`;
};
global.rBooms = function () {
    if (!login) {
        updateBooms();
    }
    for (const i in booms) {
        const b = booms[i];
        const pw = 128; const ph = 128;
        let rendX = b.x - px + w / 2 - pw / 2 + scrx; let rendY = b.y - py + h / 2 - ph / 2 + scry;

        if (b.time < 114) {
            const img = Img.booms;
            const sx = (b.time % 10) * 128;
            const sy = Math.floor(b.time / 10) * 128;

            ctx.save();
            ctx.drawImage(img, sx, sy, 128, 128, rendX, rendY, 128, 128);
            ctx.restore();
        }

        if (!b.shockwave) continue;

        rendX = b.x - px + w / 2 + scrx;
        rendY = b.y - py + h / 2 + scry;

        const ss = Math.sqrt(b.time) * 96;
        ctx.globalAlpha = 0.9 - b.time / 500.0;
        ctx.drawImage(Img.shockwave, rendX - ss / 2, rendY - ss / 2, ss, ss);
        ctx.globalAlpha = 1;
    }
    for (const i in boomParticles) {
        const selfo = boomParticles[i];
        ctx.beginPath();
        ctx.strokeStyle = `gray`;
        ctx.lineWidth = 6;
        ctx.globalAlpha = (15 - selfo.time) / 15;
        ctx.fillStyle = `white`;
        ctx.fillRect(selfo.x - 3 - px + w / 2, selfo.y - 3 - py + h / 2, 7, 7);
        ctx.globalAlpha = (15 - selfo.time) / 22;
        ctx.moveTo(selfo.x - px + w / 2, selfo.y - py + h / 2);
        ctx.lineTo(selfo.x - px + w / 2 - (cosLow(selfo.angle) * 25 + selfo.dx), selfo.y - py + h / 2 - (sinLow(selfo.angle) * 25 + selfo.dy));
        ctx.stroke();
        ctx.closePath();
        ctx.globalAlpha = 1;
    }
};
global.rTrails = function () {
    for (const i in trails) {
        const selfo = trails[i];
        ctx.globalAlpha = (7 - selfo.time) / 7;
        ctx.strokeStyle = ctx.fillStyle = `#${selfo.color}`;
        if (!selfo.vip) ctx.fillRect(selfo.x - 1 - px + w / 2 + scrx, selfo.y - 1 - py + scry + h / 2, 3, 3);
        else drawStar(selfo.x - px + w / 2 + scrx, selfo.y - py + scry + h / 2, 5, 3, 8);
    }
    ctx.globalAlpha = 1;
};
global.drawStar = function (ox, oy, spikes, outerRadius, innerRadius) {
    ctx.lineWidth = 1;
    let rot = Math.PI / 2 * 3;
    let x = ox;
    let y = oy;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(ox, oy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = ox + cosLow(rot) * outerRadius;
        y = oy + sinLow(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;
        x = ox + cosLow(rot) * innerRadius;
        y = oy + sinLow(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(ox, oy - outerRadius);
    ctx.closePath();
    ctx.fill();
};

global.rBasicText = function () {
    const info = {};
    ctx.font = `10px ShareTech`;
    ctx.textAlign = `right`;
    ctx.fillStyle = `white`;
    const lbShift = guest ? 8 : 266;
    if (!guest) {
        info[0] = translate(`Experience: #`, [numToLS(Math.round(experience))]);
        info[1] = translate(`Money: #`, [numToLS(Math.floor(money))]);
        info[2] = translate(`Kills: #`, [numToLS(kills)]);
        info[3] = translate(`Rank: #`, [rank]);
        info[4] = translate(`Sector: #`, [getSectorName(sx, sy)]);
        for (let i = 0; i < 4; i++)
            write(ctx, info[i], w - lbShift, 16 + i * 16);
    }
};

global.rLagStats = function (lag, arr) {
    ctx.font = `14px ShareTech`;
    ctx.textAlign = `right`;
    ctx.fillStyle = `yellow`;

    let lagWarn = {};
    const lbShift = guest ? 8 : 266;

    lagWarn[0] = lagWarn[1] = ``;
    if (lag > 50) {
        lagWarn[0] = translate(`You appear to be lagging due to an old system or browser.`);
        lagWarn[1] = translate(`We recommend playing on a newer system if available.`);
    } else if (nLag > 100) {
        lagWarn[0] = translate(`You appear to be lagging due to a slow connection.`);
        lagWarn[1] = ``;
    } else if (sLag > 50) {
        lagWarn[0] = translate(`Our servers are lagging due to heavy traffic at the moment.`);
        lagWarn[1] = translate(`We apologize for the inconvenience.`);
    }

    for (let i = 0; i < 2; i++) {
        write(ctx, lagWarn[i], w - lbShift, 16 * 5 * (guest ? 0.2 : 1) + i * 16);
    }

    if (!dev || arr === 0) {
        ctx.textAlign = `left`;
        return;
    }

    const lagNames = [`Background`, `Stars`, `Planets/Bases`, `Asteroids/packages`, `Players/trails`, `Weapons`, `Gui`, `Chat`, `Map`, `Radar`, `Gui2`];
    let info = {};
    meanNLag *= nLagCt;
    meanNLag += nLag;
    nLagCt++;
    meanNLag /= (nLagCt + 0.0);
    // We won't translate these things, really no point.
    info[2] = `Client Lag: ${Number((lag / 40.0).toPrecision(3))} ticks`;
    info[3] = `Server Lag: ${Number((sLag / 40.0).toPrecision(3))} ticks`;
    info[4] = `2-Way Latency: ${nLag} ms ` + `(Mean: ${Number(meanNLag).toPrecision(3)} ms` + `)`;
    info[5] = `FPS: ${fps}`;
    info[6] = `UPS: ${ups}`;

    const il = 7; // 1 + max index of info
    for (let i = 2; i < il + lagNames.length; i++) {
        write(ctx, i < il ? info[i] : (`${lagNames[i - il]}: ${parseFloat(Math.round(arr[i - il] * 100) / 100).toFixed(2)}`), w - lbShift, 16 * 5 * (guest ? 0.2 : 1) + i * 16);
    }
    ctx.textAlign = `left`;
};
global.renderBG = function (more) {
    ctx.fillStyle = `black`;
    ctx.fillRect(0, 0, w, h);
    ctx.font = `14px ShareTech`;
    const add = more ? 1 : 0;
    const img = Img.spc;
    for (let i = 0; i < ((hyperdriveTimer > 0) ? 3 : 1); i++) {
        ctx.globalAlpha = i == 0 ? 0.5 : ((10000 - square(100 - hyperdriveTimer)) / (i * 10000));
        for (let x = -add; x < 2 + Math.floor(w / 2048) + add; x++) {
            for (let y = -add; y < 2 + Math.floor(h / 2048) + add; y++) {
                ctx.drawImage(img, bgPos(x, px, scrx, i, 2048), bgPos(y, py, scry, i, 2048));
            }
        }
    }

    ctx.globalAlpha = 1;
};
global.rCargo = function () {
    if (guest) return;
    if (quest.type === `Mining`) {
        let metalWeHave = 0;
        for (let i = 0; i < 4; i++) {
            if (quest.metal === `iron`) {
                ctx.fillStyle = `#d44`;
                metalWeHave = iron;
            }
        }
        write(ctx, `${metalWeHave}/${quest.amt} ${quest.metal}`, 248, 16);
    }

    ctx.globalAlpha = guiOpacity;
    if (seller == 900) {
        ctx.globalAlpha = guiOpacity * 2;
        if (ctx.globalAlpha > 1)
            ctx.globalAlpha = 1;
        ctx.fillStyle = `white`;
        write(ctx, `JETTISON CARGO`, 248, 32);
    }

    let myCapacity = ships[ship].capacity * c2;
    if (ship == 17) myCapacity = iron + platinum + silver + copper; // because it has infinite cargo

    let runningY = 216;

    for (let i = 0; i < 4; i++) {
        let thisBarHeight = metalToQuantity(i) * 208 / myCapacity;
        runningY -= thisBarHeight;
        ctx.fillStyle = metalToColor(i);
        ctx.fillRect(224, runningY, 16, thisBarHeight);
    }

    ctx.fillStyle = guiColor;
    ctx.fillRect(224, 8, 16, runningY - 8);

    ctx.globalAlpha = 1;
};
global.rRadar = function () {
    if (va2 < 1.12) return;
    const radarZoom = 1;
    ctx.fillStyle = `white`;
    const d = new Date();
    const stime = d.getTime() / (35 * 16);

    // darken circle and make outline
    ctx.strokeStyle = `white`;
    ctx.fillStyle = `black`;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(112, 342, 96, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const r = va2 * 3840 - 1280;
    const r2z2 = square(r * radarZoom);
    const distFactor = 96 / r / radarZoom;
    ctx.globalAlpha = ctx.lineWidth = 0.5;
    if (px + r > sectorWidth) {
        const dx = sectorWidth - px;
        const dy = 0;
        const rx = dx * distFactor; const ry = dy * distFactor;
        const l = 96 * Math.sqrt(1 - square(rx / 96)) - 2;
        ctx.beginPath();
        ctx.moveTo(112 + rx, ry - l + 342);
        ctx.lineTo(112 + rx, ry + l + 342);
        ctx.closePath();
        ctx.stroke();
    }
    if (px - r < 0) {
        const dx = 0 - px;
        const dy = 0;
        const rx = dx * distFactor; const ry = dy * distFactor;
        const l = 96 * Math.sqrt(1 - square(rx / 96)) - 2;
        ctx.beginPath();
        ctx.moveTo(112 + rx, ry - l + 342);
        ctx.lineTo(112 + rx, ry + l + 342);
        ctx.closePath();
        ctx.stroke();
    }
    if (py + r > sectorWidth) {
        const dx = 0;
        const dy = sectorWidth - py;
        const rx = dx * distFactor; const ry = dy * distFactor;
        const l = 96 * Math.sqrt(1 - square(ry / 96)) - 2;
        ctx.beginPath();
        ctx.moveTo(112 + rx - l, ry + 342);
        ctx.lineTo(112 + rx + l, ry + 342);
        ctx.closePath();
        ctx.stroke();
    }
    if (py - r < 0) {
        const dx = 0;
        const dy = 0 - py;
        const rx = dx * distFactor; const ry = dy * distFactor;
        const l = 96 * Math.sqrt(1 - square(ry / 96)) - 2;
        ctx.beginPath();
        ctx.moveTo(112 + rx - l, ry + 342);
        ctx.lineTo(112 + rx + l, ry + 342);
        ctx.closePath();
        ctx.stroke();
    }
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    if (basesInfo !== undefined) {
        const dx = basesInfo.x - px;
        const dy = basesInfo.y - py;
        if (square(dx) + square(dy) < r2z2) {
            const pa = (Math.atan2(dy, dx) + 2 * Math.PI);
            const rx = dx * distFactor + 112; const ry = dy * distFactor + 342;
            ctx.beginPath();
            ctx.arc(rx, ry, (va2 > 1.24) ? 5 : 3, 0, 2 * Math.PI, false);
            ctx.fillStyle = `lightgray`;
            if (va2 > 1.36) ctx.fillStyle = brighten(basesInfo.color);
            ctx.fill();
            ctx.closePath();
        }
    }
    ctx.fillStyle = `white`;
    for (const p_pack in playersInfo) {
        const p = playersInfo[p_pack];
        const dx = p.x - px;
        const dy = p.y - py;
        if (square(dx) + square(dy) > r2z2) continue;
        const pa = (Math.atan2(dy, dx) + 2 * Math.PI);
        const rx = dx * distFactor + 112; const ry = dy * distFactor + 342;
        ctx.beginPath();
        ctx.arc(rx, ry, 3, 0, 2 * Math.PI, false);
        if (va2 > 1.36) ctx.fillStyle = brighten(p.color);
        ctx.fill();
        ctx.closePath();
    }
    if (va2 > 2.2) {
        ctx.fillStyle = `gold`;
        for (const p_pack in packsInfo) {
            const p = packsInfo[p_pack];
            const dx = p.x - px;
            const dy = p.y - py;
            if (square(dx) + square(dy) > r2z2) continue;
            const pa = (Math.atan2(dy, dx) + 2 * Math.PI);
            const rx = dx * distFactor + 112; const ry = dy * distFactor + 342;
            ctx.beginPath();
            ctx.arc(rx, ry, 2, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.closePath();
        }
    }
    if (tag === `B`) {
        ctx.fillStyle = brighten(planets.color);
        const dx = planets.x - px;
        const dy = planets.y - py;
        if (square(dx) + square(dy) < r2z2) {
            const pa = (Math.atan2(dy, dx) + 2 * Math.PI);
            const rx = dx * distFactor + 112; const ry = dy * distFactor + 342;
            ctx.beginPath();
            ctx.arc(rx, ry, 6, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.closePath();
        }
    }
    ctx.lineWidth = 2;
    for (let a in astsInfo) {
        a = astsInfo[a];

        const dx = a.x - px;
        const dy = a.y - py;
        if (square(dx) + square(dy) > r2z2) continue;
        const pa = (Math.atan2(dy, dx) + 2 * Math.PI);
        const rx = dx * distFactor + 112; const ry = dy * distFactor + 342;
        ctx.beginPath();
        ctx.arc(rx, ry, 3, 0, 2 * Math.PI, false);
        if (va2 > 1.24) ctx.strokeStyle = ctx.fillStyle = `orange`;
        if (va2 > 1.74) ctx.strokeStyle = ctx.fillStyle = metalToColor(a.metal);
        if (va2 > 1.62) ctx.stroke();
        else ctx.fill();
        ctx.closePath();
    }
    const radius = wepns[equipped[scroll]].range * 960 / r;
    if (va2 > 1.8 && radius / radarZoom > 3 && radius / radarZoom < 96) {
        ctx.beginPath();
        ctx.arc(112, 342, radius / radarZoom, 0, 2 * Math.PI, false);
        ctx.strokeStyle = brighten(pc);
        ctx.stroke();
        ctx.closePath();
    }
    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;
};
global.rAfk = function () {
    ctx.fillStyle = `yellow`;
    ctx.textAlign = `center`;
    ctx.font = `40px ShareTech`;
    write(ctx, translate(`Disconnected: AFK!`), rx + 128 * 3, ry + 512);
    ctx.textAlign = `left`;
    ctx.font = `14px ShareTech`;
};
global.rDead = function () {
    ctx.fillStyle = `yellow`;
    ctx.textAlign = `center`;
    ctx.font = `50px ShareTech`;
    const rx = w / 2;
    const ry = h / 4;
    write(ctx, translate(`You Died!`), rx, ry);
    ctx.font = `34px ShareTech`;
    write(ctx, translate(`Lives Remaining: `) + lives, rx, ry + 256);
    if (lives > 0) write(ctx, translate(`Press E to respawn.`), rx, ry + 384);
    ctx.textAlign = `left`;
    ctx.font = `14px ShareTech`;
};
global.rCreds = function () {
    ctx.fillStyle = `pink`;
    ctx.textAlign = `center`;
    ctx.font = `20px ShareTech`;
    let str = ``;
    if (credentialState == 1) str = translate(`Invalid user/pass combo!`);
    if (credentialState == 2) str = translate(`Username must be alphanumeric, with 4-16 characters!`);
    if (credentialState == 3) str = translate(`Password must be 6-128 characters long and not the same as your username!`);
    if (credentialState == 4) str = translate(`Username taken!`);
    if (credentialState == 5) str = `Username is profane!`;
    if (credentialState == 20) str = `Outdated client! Please clear your cache or try incongito mode!`;
    if (credentialState == 8) str = `You must be rank 1 to create an account!`;
    if (credentialState == 30) str = `Invalid playcookie`;
    write(ctx, str, w / 2, h - 64);
    ctx.textAlign = `left`;
    ctx.font = `14px ShareTech`;
};
global.rFlash = function () {
    ctx.globalAlpha = (0.3 * flash + 0.01) * 0.2;
    flash -= 0.2;
    ctx.fillStyle = `pink`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
};
global.rTut = function () {
    const ore = iron + silver + platinum + copper;
    let text = ``;
    let line2 = ``;
    ctx.save();
    ctx.textAlign = `center`;
    ctx.fillStyle = `yellow`;
    if (guest) {
        if (money != 8000 && currTut > 3) {
            text = translate(`Go to the Base and make an account!`); if (currTut < 5) {
                currTut = 5; addBigNote([256, text, ``, ``]);
            }
        } else if (!didW) {
            text = translate(`Press W to move forward!`); if (currTut < 1) {
                currTut = 1; addBigNote([256, text, ``, ``]);
            }
        } else if (!didSteer) {
            text = translate(`Press A and D to steer!`); if (currTut < 2) {
                currTut = 2; addBigNote([256, text, ``, ``]);
            }
        } else if (ship == 0 && ore == 0) {
            text = translate(`Follow the orange arrow!`);
            line2 = translate(`Shoot asteroids with spacebar!`);
            if (currTut < 3) {
                currTut = 3; addBigNote([256, text, line2, ``]);
            }
        } else if (ship == 0) {
            text = docked ? translate(`Sell your ore in the Base Shop!`) : translate(`Follow the white arrow and press X to Dock!`); if (currTut < 4) {
                currTut = 4; addBigNote([256, text, ``, ``]);
            }
        }
    }
    const date = new Date();
    const ms = date.getTime();
    ctx.font = `${5 * sinLow(ms / 180) + 25}px ShareTech`;
    write(ctx, text, w / 2, 40);
    write(ctx, line2, w / 2, 88);
    ctx.restore();
};
global.rDmg = function (r) {
    const scale = dmgTimer / 16.0;
    ctx.fillStyle = `red`;
    ctx.globalAlpha = scale * 0.75;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    ctx.translate(scale * (r % 5 - 2), scale * (r / 5 - 2));
};
global.undoDmg = function (r) {
    const scale = dmgTimer / 16.0;
    ctx.translate(-scale * (r % 5 - 2), -scale * (r / 5 - 2));
    dmgTimer--;
};
global.rAlert = function () {
    ctx.fillStyle = tick % 6 < 3 ? `orange` : `yellow`;
    if (lives < 5) currAlert = translate(`Low Lives`);
    if (lives == 2) bigAlert = translate(`TWO LIVES LEFT`);
    if (lives == 1) bigAlert = translate(`ONE LIFE LEFT`);
    if (currAlert !== ``) {
        ctx.font = `20px ShareTech`;
        ctx.textAlign = `right`;
        write(ctx, translate(`Alert: `) + currAlert, w - 16, h - 320);
    }
    if (bigAlert !== ``) {
        ctx.font = `30px ShareTech`;
        ctx.textAlign = `center`;
        write(ctx, translate(`Alert: `) + bigAlert, w / 2, h / 4);
    }
};
global.rSavedNote = function () {
    ctx.save();
    ctx.textAlign = `center`;
    ctx.fillStyle = `yellow`;
    ctx.strokeStyle = `black`;
    ctx.font = `64px ShareTech`;
    ctx.globalAlpha = Math.sqrt(savedNote / 41);
    ctx.fillText(translate(`Progress Saved!`), w / 2, h / 2);
    ctx.strokeText(translate(`Progress Saved!`), w / 2, h / 2);
    ctx.restore();
};
global.roundRect = function (context, x, y, width, height, radius, fill, stroke) {
    context.lineWidth = 2;
    if (typeof stroke == `undefined`) stroke = true;
    if (typeof radius === `undefined`) radius = 0;
    if (typeof radius === `number`) radius = { tl: radius, tr: radius, br: radius, bl: radius };
    else {
        const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
        for (const side in defaultRadius) radius[side] = radius[side] || defaultRadius[side];
    }
    context.beginPath();
    context.moveTo(x + radius.tl, y);
    context.lineTo(x + width - radius.tr, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    context.lineTo(x + width, y + height - radius.br);
    context.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    context.lineTo(x + radius.bl, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    context.lineTo(x, y + radius.tl);
    context.quadraticCurveTo(x, y, x + radius.tl, y);
    context.closePath();
    if (fill) context.fill();
    if (stroke) context.stroke();
};
global.infoBox = function (context, x, y, width, height, fill, stroke) {
    context.save();
    context.lineWidth = 1;
    context.globalAlpha = 0.5;

    if (fill) {
        context.fillStyle = fill;
        context.fillRect(x, y, width, height);
    }

    if (stroke) {
        context.strokeStyle = stroke;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + width, y);
        context.closePath();
        context.stroke();

        context.beginPath();
        context.moveTo(x, y + height);
        context.lineTo(x + width, y + height);
        context.closePath();
        context.stroke();
    }

    context.restore();
};
global.rRaid = function () {
    if (guest || rank < 6) return;
    ctx.save();
    ctx.fillStyle = `yellow`;
    ctx.textAlign = `center`;
    const secs = raidTimer / 25;
    const minutes = Math.floor(secs / 60); let seconds = `${Math.floor(secs) % 60}`;
    if (seconds.length == 1) seconds = `0${seconds}`;
    ctx.font = `16px ShareTech`;

    if (raidTimer >= 0 && raidTimer < 15000) {
        write(ctx, `${translate(`Raid In Progress: `) + minutes}:${seconds}`, w / 2, h - 120);
        write(ctx, translate(`Points: `) + points, w / 2, h - 80);

        ctx.font = `14px ShareTech`;
        write(ctx, `/   /`, w / 2, h - 100);

        ctx.fillStyle = `pink`;
        ctx.textAlign = `right`;
        write(ctx, raidRed, w / 2 - 24, h - 100);

        ctx.fillStyle = `lime`;
        ctx.textAlign = `center`;
        write(ctx, raidGreen, w / 2, h - 100);

        ctx.fillStyle = `cyan`;
        ctx.textAlign = `left`;
        write(ctx, raidBlue, w / 2 + 24, h - 100);
    } else if (docked && minutes > 5) write(ctx, `${translate(`Next raid in: `) + (minutes - 10)}:${seconds}`, w / 2, h - 120);
    ctx.restore();
};
global.rBigNotes = function () {
    if (bigNotes[0] === -1) return;
    bigNotes[0][0] -= bigNotes[0][2] === `` ? 2 : 1.25;
    if (bigNotes[0][0] < 0) {
        for (let i = 0; i < 3; i++) bigNotes[i] = bigNotes[i + 1]; // shift array down
        bigNotes[3] = -1;
        return;
    }

    const t = bigNotes[0][0];

    // darken background
    ctx.fillStyle = `black`;
    ctx.globalAlpha = 0.8 / (1 + Math.exp(square(128 - t) / 5000));
    ctx.fillRect(0, 0, w, h);

    // text
    ctx.textAlign = `center`;
    ctx.fillStyle = `cyan`;
    const x = w / 2 + (cube(t - 128) + 10 * (t - 128)) / 1500;

    ctx.globalAlpha = 0.7;
    ctx.font = `48px ShareTech`;
    write(ctx, bigNotes[0][1], x, h / 2 - 64);
    ctx.font = `36px ShareTech`;
    write(ctx, bigNotes[0][2], x, h / 2);
    ctx.font = `24px ShareTech`;
    write(ctx, bigNotes[0][3], x, h / 2 + 64);
    ctx.globalAlpha = 1;
    ctx.font = `15px ShareTech`;
};
global.rKillStreak = function () {
    if (killStreakTimer < 0 || killStreak < 1) return;

    let strTime = `${Math.round(killStreakTimer / 25)}`;
    while (strTime.length < 2) strTime = `0${strTime}`;
    strTime = `0:${strTime}`;
    const strMult = translate(`x`) + killStreak;

    ctx.save();
    ctx.globalAlpha = Math.min(1, 1 - (killStreakTimer - 730.0) / 15.0);
    const sizeMult = 1 + Math.max(0, Math.cbrt(killStreakTimer - 730.0)) / 2.0;
    ctx.textAlign = `center`;

    ctx.font = `${sizeMult * 30.0}px ShareTech`;
    write(ctx, strMult, w / 2, 64);

    ctx.font = `${sizeMult * 20.0}px ShareTech`;
    write(ctx, strTime, w / 2, 88);

    ctx.restore();
};

// object rendering
global.updateBullets = function () {
    for (const i in bullets) {
        const selfo = bullets[i];
        selfo.x += selfo.vx;
        selfo.y += selfo.vy;
        selfo.tick++;
    }
};
global.rBullets = function () {
    if (!login) updateBullets();
    for (const i in bullets) {
        const selfo = bullets[i];
        let img = Img.redbullet;
        const rendX = selfo.x - px + w / 2 + scrx;
        const rendY = selfo.y - py + h / 2 + scry;
        if (selfo.wepnID == 28) {
            ctx.save();
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = `white`;
            for (let c = 0; c < 10; c++) {
                const angle = Math.random() * Math.PI * 2;
                const uTick = Math.min(selfo.tick, 75);
                const hypot = 4 + square(Math.random() * uTick / 10);
                const hypotCenter = Math.random() * hypot;
                ctx.beginPath();
                ctx.arc(rendX + Math.cos(angle) * hypotCenter, rendY + Math.sin(angle) * hypotCenter, hypot, 0, 2 * Math.PI, false);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
            if (selfo.tick > 750) delete bullets[i];
            continue;
        }
        if (selfo.color == `blue`) img = Img.bluebullet;
        if (selfo.color == `green`) img = Img.greenbullet;
        if (selfo.wepnID == 1 || selfo.wepnID == 23) img = Img.bigBullet;
        const pw = img.width;
        const ph = img.height;
        ctx.save();
        ctx.translate(rendX, rendY);
        ctx.rotate(selfo.angle + Math.PI / 2);
        ctx.drawImage(img, -pw / 2, -ph / 2);
        ctx.restore();
    }
};
global.rMissiles = function () {
    for (const i in missilesInfo) {
        // for (let selfo in missilesInfo) {
        const selfo = missilesInfo[i];
        let img = Img.missile;
        if (selfo.wepnID == 10 && (selfo.color == `red` || selfo.color == `green`)) {
            img = Img.alienMissile;
        } else if (selfo.wepnID == 11 || (selfo.weaponID == 13 && selfo.color == `blue`)) {
            img = Img.heavyMissile;
        } else if (selfo.weaponID == 13) { // && (selfo.color == "red" || selfo.color == "green") FOR SOME REASON THE TEAM THINGY NEVER WORKS
            img = Img.alienMissileSwarm;
        } else if (selfo.wepnID == 12) {
            img = Img.empMissile;
        } else if (selfo.wepnID == 14) {
            img = Img.torpedo;
        }
        const pw = img.width;
        const ph = img.height;
        const rendX = selfo.x - px + w / 2 + scrx;
        const rendY = selfo.y - py + h / 2 + scry;
        ctx.save();
        ctx.translate(rendX, rendY);
        ctx.rotate(selfo.angle + Math.PI / 2);
        ctx.drawImage(img, -pw / 2, -ph / 2);
        ctx.restore();
    }
};
global.rOrbs = function () {
    for (const i in orbsInfo) {
        const selfo = orbsInfo[i];
        let img = Img.energyDisk;
        if (selfo.wepnID == 42) {
            img = Img.photonOrb;
        }
        const pw = img.width;
        const ph = img.height;
        const rendX = selfo.x - px + w / 2 + scrx;
        const rendY = selfo.y - py + h / 2 + scry;
        ctx.save();
        ctx.translate(rendX, rendY);
        ctx.rotate(getTimeAngle() + Math.PI / 2);
        ctx.drawImage(img, -pw / 2, -ph / 2);
        ctx.restore();
    }
};
global.rMines = function () {
    for (let selfo in minesInfo) {
        selfo = minesInfo[selfo];
        let img = Img.mine;
        const pw = img.width;
        const ph = img.height;
        const rendX = selfo.x - px + w / 2 + scrx;
        const rendY = selfo.y - py + h / 2 + scry;
        if (selfo.wepnID == 16) {
            img = Img.laserMine;
        } else if (selfo.wepnID == 17) {
            img = Img.empMine;
        } else if (selfo.wepnID == 33) {
            img = Img.grenade;
        } else if (selfo.wepnID == 43) {
            img = Img.pulseMine;
        } else if (selfo.wepnID == 44) {
            img = Img.campfire;
        } else if (selfo.wepnID == 48) {
            img = Img.magneticMine;
        } else if (selfo.wepnID == 32) {
            ctx.save();
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = `white`;
            for (let c = 0; c < 10; c++) {
                const angle = Math.random() * Math.PI * 2;
                const uTick = 25;
                const hypot = 4 + square(Math.random() * uTick / 10);
                const hypotCenter = Math.random() * hypot;
                ctx.beginPath();
                ctx.arc(rendX + Math.cos(angle) * hypotCenter, rendY + Math.sin(angle) * hypotCenter, hypot, 0, 2 * Math.PI, false);
                ctx.fill();
                ctx.closePath();
            }
            ctx.restore();
            continue;
        }
        ctx.save();
        ctx.translate(rendX, rendY);
        ctx.rotate(selfo.angle);
        ctx.drawImage(img, -pw / 2, -ph / 2);
        ctx.restore();
        ctx.fillStyle = brighten(selfo.color);
        ctx.beginPath();
        ctx.arc(rendX, rendY, 4, 0, 2 * Math.PI, false);
        ctx.fill();
    }
};
global.rBeams = function () {
    ctx.lineWidth = 6;
    for (const i in beamsInfo) {
        const selfo = beamsInfo[i];
        if (selfo.wepnID == 7) ctx.strokeStyle = `mediumpurple`;
        else if (selfo.wepnID == 9) ctx.strokeStyle = `lime`;
        else if (selfo.wepnID == 24) ctx.strokeStyle = `yellow`;
        else if (selfo.wepnID == 45) ctx.strokeStyle = `cyan`;
        else if (selfo.wepnID == 33 || selfo.wepnID == 26 || selfo.wepnID == 30) ctx.strokeStyle = `#d0c090`;
        else ctx.strokeStyle = `red`;
        const bx = selfo.bx - px + w / 2 + scrx;
        const by = selfo.by - py + h / 2 + scry;
        const ex = selfo.ex - px + w / 2 + scrx;
        const ey = selfo.ey - py + h / 2 + scry;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(ex, ey);
        ctx.globalAlpha = Math.random() * (12 - selfo.time) / 14;
        ctx.stroke();
        ctx.closePath();
    }
    ctx.globalAlpha = 1;
};
global.rBlasts = function () {
    ctx.lineWidth = 12;
    ctx.strokeStyle = `gold`;
    for (const i in blastsInfo) {
        const selfo = blastsInfo[i];
        if (selfo.wepnID == 25) {
            ctx.strokeStyle = `white`;
        }
        const bx = selfo.bx - px + w / 2 + scrx;
        const by = selfo.by - py + h / 2 + scry;
        const ex = selfo.bx + Math.cos(selfo.angle) * 10000 - px + w / 2 + scrx;
        const ey = selfo.by + Math.sin(selfo.angle) * 10000 - py + h / 2 + scry;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(ex, ey);
        ctx.globalAlpha = Math.random() * (12 - selfo.time) / 14;
        ctx.stroke();
        ctx.closePath();
    }
    ctx.globalAlpha = 1;
};
global.rAsteroids = function () {
    let nearA = 0;
    for (let selfo in astsInfo) {
        selfo = astsInfo[selfo];

        const img = (selfo.metal == 0 ? Img.iron : (selfo.metal == 3 ? Img.platinum : (selfo.metal == 1 ? Img.silver : Img.copper)));
        const rendX = selfo.x - px + w / 2 + scrx;
        const rendY = selfo.y - py + h / 2 + scry;
        const d = new Date();
        const healthDec = (0.5 + selfo.health / selfo.maxHealth) / 1.5;
        const stime = Math.floor((d.getMilliseconds() / 1000 + d.getSeconds()) / 60 * 1024) % 64;
        const sx = (stime % 8) * 128;
        const sy = Math.floor((stime / 8) % 4 + 4 * (Math.floor(selfo.metal) % 2)) * 128;
        ctx.save();
        ctx.translate(rendX, rendY);
        ctx.drawImage(Img.astUnderlayBlue, -128, -128);
        ctx.rotate(selfo.angle + Math.PI / 2);
        ctx.drawImage(img, sx, sy, 128, 128, -64 * healthDec, -64 * healthDec, 128 * healthDec, 128 * healthDec);
        ctx.restore();

        if (selfo.color != pc) { // update nearest enemy for pointer
            if (nearA == 0 || square(selfo.x - px) + square(selfo.y - py) < square(nearA.x - px) + square(nearA.y - py)) {
                nearA = selfo;
            }
        }
    }
    if (nearA !== 0) {
        rAstPointer(nearA);
    }
};
global.rPlanets = function () {
    if (planets == 0) return;
    const selfo = planets;
    const rendX = (selfo.x - px + scrx) / 4 + w / 2;
    const rendY = (selfo.y - py + scry) / 4 + h / 2;
    if (rendX < -150 || rendX > w + 150 || rendY < -150 || rendY > h + 220) return;

    const d = new Date();
    const stime = d.getTime() / 150000;

    const imgi = (sx + sy * mapSz) % 5 + 1;
    const img = planetImgs[imgi];

    if (typeof img === `undefined`) return;

    const ox = (sinLow(stime * 5) / 2 + 0.5) * (img.width - 256) + 128;// error on t05 width of undefined
    const oy = (cosLow(stime * 4) / 2 + 0.5) * (img.height - 256) + 128;

    ctx.save();
    const pattern = ctx.createPattern(img, `no-repeat`);
    ctx.fillStyle = pattern;
    ctx.translate(rendX, rendY);
    ctx.drawImage(selfo.color === `yellow` ? Img.planetU : colorSelect(selfo.color, Img.planetUR, Img.planetUB, Img.planetUG), -155, -155, 310, 310);
    ctx.translate(-ox, -oy);
    ctx.beginPath();
    ctx.arc(ox, oy, 128, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.translate(ox, oy);
    ctx.drawImage(Img.planetO, -128, -128);
    ctx.restore();
    ctx.textAlign = `center`;
    ctx.fillStyle = brighten(selfo.color);
    ctx.font = `30px ShareTech`;
    write(ctx, translate(`Planet `) + selfo.name, rendX, rendY - 196);
    ctx.textAlign = `left`;
    ctx.font = `14px ShareTech`;
};
global.rPacks = function () {
    for (let selfo in packsInfo) {
        selfo = packsInfo[selfo];
        const img = selfo.type == 0 ? Img.pack : (selfo.type == 1 ? Img.bonus : (selfo.type == 2 ? Img.life : Img.ammo));
        const rendX = selfo.x - px + w / 2 + scrx;
        const rendY = selfo.y - py + h / 2 + scry;
        const d = new Date();
        const stime = (d.getMilliseconds() / 1000 + d.getSeconds()) / 3;
        ctx.save();
        ctx.translate(rendX, rendY);
        ctx.scale(2, 2);
        ctx.rotate(stime * Math.PI);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
    }
};
global.rVorts = function () {
    const d = new Date();
    const angleT = d.getTime() / 1000;
    for (let selfo in vortsInfo) {
        ctx.save();
        selfo = vortsInfo[selfo];
        const img = selfo.isWorm ? Img.worm : Img.vort;
        const size = 24 * selfo.size / 64;
        const rendX = selfo.x - px + w / 2 + scrx;
        const rendY = selfo.y - py + h / 2 + scry;
        ctx.translate(rendX, rendY);
        ctx.rotate(angleT % (Math.PI * 2));
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
        ctx.globalAlpha = 0.3;
        ctx.rotate(-0.5 * angleT % (Math.PI * 2));
        ctx.drawImage(img, -size * 3 / 4, -size * 3 / 4, 1.5 * size, 1.5 * size);
        ctx.restore();
        if (selfo.isWorm) currAlert = translate(`Wormhole Nearby!`);
        else bigAlert = translate(`Black Hole Nearby!`);
        rBlackHoleWarning(selfo.x, selfo.y);
    }
};
global.rPlayers = function () {
    const pointers = [0, 0, 0];
    for (let selfo in playersInfo) {
        selfo = playersInfo[selfo];
        if (selfo.disguise > 0) continue;

        ctx.strokeStyle = `grey`;
        const img = colorSelect(selfo.color, redShips, blueShips, greenShips)[selfo.ship];

        const pw = img.width;
        const ph = img.height;
        if (pw == 0 || ph == 0) return;
        const rendX = selfo.x - px + w / 2 + scrx;
        const rendY = selfo.y - py + h / 2 + scry;

        ctx.save();
        ctx.translate(rendX, rendY);
        ctx.globalAlpha = 0.8;
        ctx.drawImage(colorSelect(selfo.color, Img.astUnderlayRed, Img.astUnderlayBlue, Img.astUnderlayGreen), -pw, -ph, pw * 2, ph * 2);
        ctx.globalAlpha = 1;
        ctx.rotate(selfo.angle + Math.PI / 2);
        const fireWidth = 32 * 1.2 * Math.sqrt(pw / 64); const fireHeight = selfo.speed * 1.4 * pw / 64 + Math.random() * pw / 25;
        if (selfo.speed > 0) ctx.drawImage(Img.fire, 0, tick % 8 * 64, 64, 64, -fireWidth / 2, 0, fireWidth, fireHeight);
        ctx.restore();
        ctx.save();
        ctx.translate(rendX, rendY);
        ctx.rotate(selfo.angle + Math.PI / 2);
        ctx.drawImage(img, -pw / 2, -ph / 2);
        ctx.restore();

        ctx.fillStyle = brighten(selfo.color);
        ctx.textAlign = `center`;
        write(ctx, selfo.name, rendX, rendY - ships[selfo.ship].width * 0.5);
        ctx.textAlign = `left`;

        if (selfo.name === myName) {
            if (selfo.health < selfo.maxHealth * 0.3) currAlert = translate(`Low Health!`);
        } else {
            for (let i = 0; i < 3; i++) {
                if (selfo.color === teamColors[i]) {
                    if (pointers[i] === 0) pointers[i] = selfo;
                    else if (square(selfo.x - px) + square(selfo.y - py) < square(pointers[i].x - px) + square(pointers[i].y - py)) pointers[i] = selfo;
                }
            }
        }

        if (selfo.hasPackage) rBackPack(selfo);
        ctx.lineWidth = 6;
        if (selfo.shield) {
            ctx.strokeStyle = `lightblue`;
            ctx.beginPath();
            ctx.arc(rendX, rendY, pw / 1.5 - 8, 0, 2 * Math.PI, false);
            ctx.stroke();
        }
        if (selfo.health / selfo.maxHealth >= 1) continue;
        ctx.lineWidth = 4;
        const r = Math.floor((1 - selfo.health / selfo.maxHealth) * 255);
        const g = Math.floor(255 * selfo.health / selfo.maxHealth);
        const b = Math.floor(64 * selfo.health / selfo.maxHealth);
        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.beginPath();
        ctx.arc(rendX, rendY, pw / 1.5, (2.5 - selfo.health / selfo.maxHealth * 0.99) * Math.PI, (0.501 + selfo.health / selfo.maxHealth) * Math.PI, false);
        ctx.stroke();
    }
    rTeamPointers(pointers);
};
global.rSelfCloaked = function () {
    ctx.strokeStyle = `grey`;
    const img = (pc === `red` ? redShips : (pc === `blue` ? blueShips : greenShips))[ship];

    const pw = img.width;
    const ph = img.height;
    const rendX = px - px + w / 2 + scrx;
    const rendY = py - py + h / 2 + scry;

    ctx.save();
    ctx.translate(rendX, rendY);
    ctx.rotate(pangle + Math.PI / 2);
    ctx.globalAlpha = 0.25;
    ctx.drawImage(img, -pw / 2, -ph / 2);
    ctx.restore();
    ctx.lineWidth = 6;
    if (shield) {
        ctx.strokeStyle = `lightblue`;
        ctx.beginPath();
        ctx.arc(rendX, rendY, pw / 1.5 - 8, 0, 2 * Math.PI, false);
        ctx.stroke();
    }
    const pmaxHealth = ships[ship].health * mh2;
    if (phealth < pmaxHealth * 0.3) {
        currAlert = translate(`Low Health!`);
    }

    if (phealth / pmaxHealth >= 1) { // draw hp bar
        return;
    }
    ctx.lineWidth = 4;
    const r = Math.floor((1 - phealth / pmaxHealth) * 255);
    const g = Math.floor(255 * phealth / pmaxHealth);
    const b = Math.floor(64 * phealth / pmaxHealth);
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.beginPath();
    ctx.arc(rendX, rendY, pw / 1.5, (2.5 - phealth / pmaxHealth * 0.99) * Math.PI, (0.501 + phealth / pmaxHealth) * Math.PI, false);
    ctx.stroke();
};
global.rBases = function () {
    if (basesInfo !== undefined) { // render bases
        const image = colorSelect(basesInfo.color, Img.rss, Img.bss, Img.gss);
        let pw = image.width;
        let ph = image.height;
        const rendX = basesInfo.x - px + w / 2 + scrx;
        const rendY = basesInfo.y - py + h / 2 + scry;
        if (basesInfo.color !== pc) currAlert = translate(`Enemy Base Nearby!`);

        if (basesInfo.baseType == DEADBASE || basesInfo.baseType == LIVEBASE) {
            ctx.save();
            ctx.translate(rendX, rendY);
            ctx.rotate(tick / 1000 + Math.PI / 2);
            ctx.drawImage(colorSelect(basesInfo.color, Img.astUnderlayRed, Img.astUnderlayBlue, Img.astUnderlayGreen), -512, -512, 1024, 1024);
            ctx.drawImage(image, -384, -384, 768, 768);
            ctx.restore();
            ctx.textAlign = `center`;
            ctx.fillStyle = `lime`;
            if (experience < 64 && basesInfo.color == pc && square(px - basesInfo.x) + square(py - basesInfo.y) < square(512)) {
                ctx.font = `${2.5 * sinLow(tick / 8) + 15}px ShareTech`;
                write(ctx, translate(`X TO DOCK WITH BASE`), rendX, rendY - 96);
                ctx.font = `14px ShareTech`;
            }
            ctx.textAlign = `left`;
        } else { // write name
            ctx.textAlign = `center`;
            ctx.fillStyle = `white`;
            ctx.font = `14px ShareTech`;
            write(ctx, basesInfo.name, rendX, rendY - 64);
        }

        if (basesInfo.baseType != DEADBASE) {
            let timage = 0;
            if (basesInfo.baseType == SENTRY) timage = colorSelect(basesInfo.color, Img.rsentry, Img.bsentry, Img.gsentry);
            else timage = colorSelect(basesInfo.color, Img.rt, Img.bt, Img.gt);
            pw = timage.width; // render turrets
            ph = timage.height;
            ctx.save();
            ctx.translate(rendX, rendY);
            ctx.rotate(basesInfo.angle + Math.PI / 2);
            ctx.drawImage(timage, -pw / 2, -ph / 2);
            ctx.restore();

            if (basesInfo.health / basesInfo.maxHealth < 1) {
                ctx.lineWidth = 4;
                const r = Math.floor((1 - basesInfo.health / basesInfo.maxHealth) * 255);
                const g = Math.floor(255 * basesInfo.health / basesInfo.maxHealth);
                const b = Math.floor(64 * basesInfo.health / basesInfo.maxHealth);
                ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.beginPath();
                ctx.arc(rendX, rendY, pw / 1.5, (2.5 - 0.99 * basesInfo.health / basesInfo.maxHealth) * Math.PI, (0.501 + basesInfo.health / basesInfo.maxHealth) * Math.PI, false);
                ctx.stroke();
            }
        }

        rBasePointer(basesInfo);
    }
};
global.rBackPack = function (selfo) {
    const img = Img.pack;
    const rendX = selfo.x - px + w / 2 + scrx;
    const rendY = selfo.y - py + h / 2 + scry;
    ctx.save();
    ctx.translate(rendX, rendY);
    ctx.drawImage(img, -16, -16, 32, 32);
    ctx.restore();
};
