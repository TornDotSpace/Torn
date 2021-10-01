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

import React from 'react';
import ReactDOM from 'react-dom';

import { ReactRoot, RootState } from './react/ReactRoot';
import { ChatState } from './react/components/ChatInput';

import { jsn, translate } from './localizer';
import { square, coherentNoise, weaponWithOrder } from './utils/helper';

import loadAllAudio from './utils/loadAllAudio';
import loadAllImages from './utils/loadAllImages';

import * as audioUtil from './modules/audio';

`use strict`;

const printStartup = () => {
    console.log(`******************************************************************************************************`);
    console.log(` ▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄  ▄▄      ▄     ▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄ `);
    console.log(`▐░░░░░░░░░▌▐░░░░░░░░░▌▐░░░░░░░░░▌▐░░▌    ▐░▌   ▐░░░░░░░░░▌▐░░░░░░░░░▌▐░░░░░░░░░▌▐░░░░░░░░░▌▐░░░░░░░░░▌`);
    console.log(` ▀▀▀█░█▀▀▀ ▐░█▀▀▀▀▀█░▌▐░█▀▀▀▀▀█░▌▐░▌░▌   ▐░▌   ▐░█▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀█░▌▐░█▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀ `);
    console.log(`    ▐░▌    ▐░▌     ▐░▌▐░▌     ▐░▌▐░▌▐░▌  ▐░▌   ▐░▌        ▐░▌     ▐░▌▐░▌     ▐░▌▐░▌        ▐░▌        `);
    console.log(`    ▐░▌    ▐░▌     ▐░▌▐░█▄▄▄▄▄█░▌▐░▌ ▐░▌ ▐░▌   ▐░█▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄█░▌▐░█▄▄▄▄▄█░▌▐░▌        ▐░█▄▄▄▄▄▄▄ `);
    console.log(`    ▐░▌    ▐░▌     ▐░▌▐░░░░░░░░░▌▐░▌  ▐░▌▐░▌   ▐░░░░░░░░░▌▐░░░░░░░░░▌▐░░░░░░░░░▌▐░▌        ▐░░░░░░░░░▌`);
    console.log(`    ▐░▌    ▐░▌     ▐░▌▐░█▀▀█░█▀▀ ▐░▌   ▐░▐░▌    ▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀█░▌▐░▌        ▐░█▀▀▀▀▀▀▀ `);
    console.log(`    ▐░▌    ▐░▌     ▐░▌▐░▌   ▐░▌  ▐░▌    ▐░░▌           ▐░▌▐░▌        ▐░▌     ▐░▌▐░▌        ▐░▌        `);
    console.log(`    ▐░▌    ▐░█▄▄▄▄▄█░▌▐░▌    ▐░▌ ▐░▌     ▐░▌ ▄  ▄▄▄▄▄▄▄█░▌▐░▌        ▐░▌     ▐░▌▐░█▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄ `);
    console.log(`    ▐░▌    ▐░░░░░░░░░▌▐░▌     ▐░▌▐░▌     ▐░▌▐░▌▐░░░░░░░░░▌▐░▌        ▐░▌     ▐░▌▐░░░░░░░░░▌▐░░░░░░░░░▌`);
    console.log(`     ▀      ▀▀▀▀▀▀▀▀▀  ▀       ▀  ▀       ▀  ▀  ▀▀▀▀▀▀▀▀▀  ▀          ▀       ▀  ▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀ `);
    console.log(`                                                                                                      `);
    console.log(`******************************************************************************************************`);

    console.log(`This software is free software, licensed under the terms of the AGPL v3. For more information, please see LICENSE.txt`);
    console.log(`Source available at https://github.com/TornDotSpace/Torn`);

    console.log(`torn-client-git-${BRANCH}-${COMMITHASH}`);
    console.log(`Implementing protocol version ${VERSION}`);

    // Print client modification warning
    console.error(`***********************************************************************`);
    console.error(`WARNING: PASTING CODE INTO HERE CAN ALLOW FOR YOUR ACCOUNT TO BE STOLEN`);
    console.error(`ALWAYS AUDIT CODE YOU ARE INJECTING INTO THE DEVELOPER CONSOLE`);
    console.error(`ADDITIONALLY, PLEASE RESPECT OUR TOS https://torn.space/legal/tos.pdf AND NOTE OUR PRIVACY POLICY https://torn.space/legal/privacy_policy.pdf`);
    console.error(`***********************************************************************`);
};

printStartup();

// Render the react overlay to the DOM.
ReactDOM.render(<ReactRoot />, document.querySelector(`#root`));

global.loginInProgress = false;

window.document.title = `torn.space`;

global.canvas = document.querySelector(`#ctx`);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
global.ctx = canvas.getContext(`2d`, { alpha: false });

global.expToRank = [0];
global.guiColor = `#333333`;
global.guiOpacity = 0.5;
global.teamColors = [`red`, `blue`, `green`];
global.sectorWidth = 14336;
global.mx = 0; global.my = 0; global.mb = 0;
global.tick = 0;
global.scrx = 0; global.scry = 0;
global.mapSz = -1;
global.quests = 0; global.quest = 0;
global.login = false; global.lore = false;
global.tag = ``;
global.px = 0; global.py = 0; global.pc = `black`; global.pangle = 0; global.isLocked = false; global.pvx = 0; global.pvy = 0;
global.phealth = 0;
global.mapZoom = 1;
global.myxx1 = 0; global.myxx2 = 0; global.myxx3 = 0; global.myxx4 = 0;
global.myyy1 = 0; global.myyy2 = 0; global.myyy3 = 0; global.myyy4 = 0;
global.pscx = 0; global.pscy = 0; global.psga = 0;
global.bxo = 0; global.byo = 0; global.bx = 0; global.by = 0;
global.iron = 0; global.silver = 0; global.platinum = 0; global.copper = 0;
global.kills = 0; global.baseKills = 0; global.money = 0; global.experience = 0; global.rank = 0;
global.sx = 0; global.sy = 0;
global.docked = false; global.actuallyBuying = true;
global.tab = 0; global.confirmer = -1; global.shipView = 0; global.volTransparency = 0; global.gVol = 0.5;
global.typing = false;
global.stopTyping = () => {
    typing = false;
};
global.centered = false;
global.afk = false;

global.colorCircumfix = `\`c`;
global.weaponCircumfix = `\`w`;
global.translateCircumfix = `\`t`;

global.baseMap2D = {};
global.planetMap2D = {};
global.myGuild = {};

global.homepageTimer = 0; global.loreTimer = 0;
global.raidTimer = -1; global.raidRed = 0; global.raidBlue = 0; global.raidGreen = 0; global.points = 0;
global.shield = false; global.autopilot = false;
global.seller = 0; global.worth = 0; global.ship = 0;
global.empTimer = -1; global.dmgTimer = -1; global.gyroTimer = 0;
global.t2 = 1; global.mh2 = 1; global.c2 = 1; global.va2 = 1; global.e2 = 1; global.ag2 = 1;
global.dead = false; global.lives = 50; global.sLag = 0; global.nLag = 0; global.clientLag = -40; global.fps = 0; global.ops = 0; global.frames = 0; global.uframes = 0; global.ups = 0; global.dev = false;
global.credentialState = 0;
global.savedNote = 0;
global.myName = `GUEST`; global.currAlert = ``; global.bigAlert = ``; global.disguise = 0;
global.soundAllowed = false;
global.currLoading = ``;
global.secret2PlanetName = ``;
global.meanNLag = 0; global.nLagCt = 0;

global.booms = {};
global.boomParticles = {};
global.trails = {};
global.myTrail = 0;
global.notes = {};
global.bullets = {};
global.planets = 0; global.hmap = 0; global.lb = 0; global.youi = 0;
global.keys = []; global.lagArr = 0;

global.w = window.innerWidth;
global.h = window.innerHeight; // Canvas width and height

global.basesInfo = undefined;
global.playersInfo = { };
global.minesInfo = { };
global.orbsInfo = { };
global.missilesInfo = { };
global.vortsInfo = { };
global.beamsInfo = { };
global.blastsInfo = { };
global.astsInfo = { };
global.packsInfo = { };

global.clientmutes = { };
// for initial loading screen
global.EVERYTHING_LOADED = false;

global.guest = false;

global.stars = [];
for (let i = 0; i < 30; i++) stars[i] = { x: Math.random() * w, y: Math.random() * h };

global.myId = undefined;

global.killStreak = 0; global.killStreakTimer = -1;
global.badWeapon = 0;
global.mouseDown = false;
global.flash = 0;
global.hyperdriveTimer = 0;
global.didW = false; global.didSteer = false; global.currTut = 0;

global.sectorPoints = 0;

require(`./localizer.ts`);
require(`./network.js`);
require(`./graphics/render.js`);
require(`./graphics/ArrowGraphics.js`);
require(`./graphics/minimap.js`);
require(`./graphics/leaderboard.js`);
require(`./BaseMenu/BaseMenu.js`);
require(`./input.js`);
require(`./chat.ts`);

global.wepns = jsn.weapons;
global.ships = jsn.ships;

// Used in the ship store to make the bar graphs
global.maxShipThrust = -1000;
global.maxShipHealth = -1000;
global.maxShipCapacity = -1000;
global.maxShipAgility = -1000;
for (const i in ships) {
    const ship = ships[i];
    if (ship.thrust > maxShipThrust) maxShipThrust = ship.thrust;
    if (ship.capacity > maxShipCapacity && i != 17) maxShipCapacity = ship.capacity;
    if (ship.agility > maxShipAgility) maxShipAgility = ship.agility;
    if (ship.health > maxShipHealth) maxShipHealth = ship.health;
}

for (const j in wepns) {
    if (!wepns[j].enabled) { delete wepns[j]; }
}
const weaponTypeOrder = { Gun: 0, Mine: 1, Missile: 2, Beam: 3, Orb: 4, Blast: 5, Misc: 6 };
global.o = 0;
for (const j in wepns) {
    wepns[j].order = o;
    o++;
}
global.wepnCount = Object.keys(wepns).length;
for (let j = 0; j < wepnCount - 1; j++) { // this nifty loop sorts weapons by ship
    const woj = weaponWithOrder(j);
    const woj1 = weaponWithOrder(j + 1);
    const typeJ = weaponTypeOrder[wepns[woj].type];
    const typeJ1 = weaponTypeOrder[wepns[woj1].type];
    if (typeJ > typeJ1 || (wepns[woj].level > wepns[woj1].level && typeJ == typeJ1)) {
        wepns[woj].order = j + 1;
        wepns[woj1].order = j;
        j = 0;
    }
}

wepns[-2] = { name: `` };
wepns[-1] = { name: translate(`Empty`) };
wepnCount += 2;

global.scroll = 0; global.weaponTimer = 0; global.charge = 0;
global.equipped = 0; global.ammos = {};

global.redShips = [];
global.blueShips = [];
global.greenShips = [];
global.planetImgs = [];
global.Img = {};
global.Img_prgs = [0 /* Count of loaded images */, 0];

loadAllImages();
loadAllAudio();

global.achs = [false, false, false, false, false,
    false, false, false, false, false,
    false, false, false, false, false,
    false, false, false, false, false,
    false, false, false, false, false];
global.bigNotes = [-1, -1, -1, -1];

const forceRefresh = () => {
    window.location.reload();
};

setInterval(() => {
    fps = frames;
    ups = uframes;
    uframes = frames = 0;
}, 1000);

setInterval(() => {
    raidTimer--;
    hyperdriveTimer--;
    w = window.innerWidth;
    h = window.innerHeight;
    if (canvas.width != w || canvas.height != h) {
        canvas.width = w;
        canvas.height = h;
    }
    baseMenuX = w / 2 - 128 * 3;
    baseMenuY = h / 4 - 128;
}, 40);

const loop = () => {
    render();
    if (!login) {
        if (!EVERYTHING_LOADED) {
            rLoadingBar();
            setTimeout(render, 5);
            window.requestAnimationFrame(loop);
            return;
        } else RootState.turnOnDisplay();

        if (++homepageTimer == 1) {
            audioUtil.loadAudio(`music1`, `/aud/music1.mp3`);
        }

        canvas.width = canvas.width;
        ctx.fillStyle = `black`;
        ctx.fillRect(0, 0, w, h);

        // desmos this stuff or you wont have a clue whats going on vvv
        const softsign = Math.exp(homepageTimer / 15);
        let scale = 1.885 * (softsign / (1 + softsign) - 0.47);
        if (homepageTimer > 100)scale = 1;

        ctx.translate(w / 2, h / 2);
        ctx.scale(scale, scale);
        ctx.translate(-w / 2, -h / 2);

        const d = new Date();
        const t = d.getTime() / 6000;
        const loreZoom = 100 * (Math.hypot(loreTimer, 256) - 256);
        px = (32 + Math.sin(t * 4)) * 3200;
        py = (32 + Math.cos(t * 5)) * 3200;

        scrx = (-w / 3 * Math.cos(4 * t));
        scry = (h / 3 * Math.sin(5 * t));
        if (loreTimer > 0) scry += loreZoom;

        renderBG(true);

        // Main hydra
        const vx = 4000 * Math.sin(5 * t); const vy = 3200 * Math.cos(4 * t);
        const spd = Math.hypot(vx, vy) / 100.0;
        const rnd = Math.random();
        let angleNow = -Math.atan2(5 * Math.sin(5 * t), 4 * Math.cos(4 * t));
        if (rnd < 0.05) {
            audioUtil.playAudio(`minigun`, 0.1);
            bullets[rnd] = { x: px, y: py, vx: 12800 / 6000 * 20 * Math.cos(4 * t) + 40 * Math.cos(angleNow), vy: -16000 / 6000 * 20 * Math.sin(5 * t) + 40 * Math.sin(angleNow), id: rnd, angle: angleNow, wepnID: 0, color: `red` };
        }

        let img = redShips[14];
        let pw = ships[14].width;
        let rendX = w / 2 + scrx;
        let rendY = h / 2 + scry;
        ctx.save();
        ctx.translate(rendX, rendY);
        ctx.drawImage(Img.astUnderlayRed, -pw, -pw, pw * 2, pw * 2);
        ctx.rotate(angleNow + Math.PI / 2);
        let fireWidth = 32 * 1.2 * Math.sqrt(pw / 64); let fireHeight = spd * 1.4 * pw / 64 + Math.random() * pw / 25;
        if (spd > 0) ctx.drawImage(Img.fire, 0, Math.floor(Math.random() * 8) * 64, 64, 64, -fireWidth / 2, 0, fireWidth, fireHeight);
        ctx.restore();
        ctx.save();
        ctx.translate(rendX, rendY);
        ctx.rotate(angleNow + Math.PI / 2);
        ctx.drawImage(img, -pw / 2, -pw / 2);
        ctx.restore();

        // Extra ships
        for (let j = 0; j < 4; j++) {
            const pxn = (32 + Math.sin(t * 4 + 0.2)) * 3200 + coherentNoise(t * 4 + j * 3 * Math.E) * 192;
            const pyn = (32 + Math.cos(t * 5 + 0.2)) * 3200 + coherentNoise(t * 4 + j * 3 * Math.E + 61.23) * 192;
            for (const i in bullets) {
                const b = bullets[i];
                if (square(b.x - pxn) + square(b.y - pyn) < 64 * 32) {
                    delete bullets[i];
                    booms[Math.random()] = { x: b.x, y: b.y, time: 0, shockwave: false };
                    // for (let i = 0; i < 5; i++) boomParticles[Math.random()] = { x: b.x, y: b.y, angle: Math.random() * 6.28, time: -1, dx: b.vx / 1.5, dy: b.vy / 1.5 };
                    audioUtil.playAudio(`boom`, 0.35);
                }
            }

            img = (j % 2 == 0 ? blueShips : greenShips)[j * 2];
            pw = img.width;
            rendX = pxn - px + w / 2 + scrx;
            rendY = pyn - py + h / 2 + scry;
            ctx.save();
            ctx.translate(rendX, rendY);
            ctx.drawImage((j % 2 == 0 ? Img.astUnderlayBlue : Img.astUnderlayGreen), -pw, -pw, pw * 2, pw * 2);
            angleNow = -Math.atan2(5 * Math.sin(5 * t), 4 * Math.cos(4 * t));
            ctx.rotate(angleNow + Math.PI / 2);

            fireWidth = 32 * 1.2 * Math.sqrt(pw / 64);
            fireHeight = spd * 1.4 * pw / 64 + Math.random() * pw / 25;

            if (spd > 0) ctx.drawImage(Img.fire, 0, Math.floor(Math.random() * 8) * 64, 64, 64, -fireWidth / 2, 0, fireWidth, fireHeight);
            ctx.restore();
            ctx.save();
            ctx.translate(rendX, rendY);
            ctx.rotate(angleNow + Math.PI / 2);
            ctx.drawImage(img, -pw / 2, -pw / 2);
            ctx.restore();
        }
        for (const i in bullets) if (Math.random() < 0.01) delete bullets[i];
        rBullets();
        rBooms();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        if (homepageTimer < 10) {
            ctx.globalAlpha = 1 - homepageTimer / 10;
            ctx.fillStyle = `black`;
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = 1;
        }
        ctx.drawImage(Img.grad, 0, 0, w, h);
        rCreds();
        if (lore) {
            RootState.turnOffDisplay();
            rLore();
            loreTimer++;
            window.requestAnimationFrame(loop);
            return;
        }
    } else ChatState.activate();

    window.requestAnimationFrame(loop);
};

window.requestAnimationFrame(loop);
