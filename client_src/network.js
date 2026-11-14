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

import { RootState } from './react/ReactRoot';
import { ChatState } from './react/components/ChatInput';

import { jsn, translate } from './localizer';
import {
    square,
    sinLow,
    cosLow,
    lerp,
    addBigNote
} from './utils/helper';

import socket from './modules/socket';
import { playAudio } from './modules/audio';

console.log(`:TornNetworkRepository: Setting API_URL to ${TORN_API_URL}`);
console.log(`:TornNetworkRepository: Setting GAMESERVER_URL to ${TORN_GAMESERVER_URL}`);

socket.on(`connect_error`, (error) => {
    loginInProgress = false;
    if (!login) {
        alert(`Failed to connect to the Torn servers. This probably either means they are down or your firewall is blocking the request. ${error}`);
        socket.close();
        return;
    }

    alert(`There's been an issue and your connection to Torn has been interrupted. You should be able to reload and get back right into the game. ${error}`);
    socket.close();
});

// packet handling
socket.on(`posUp`, (data) => {
    px = data.x;
    py = data.y;
    phealth = data.health;
    isLocked = data.isLocked;
    charge = data.charge;
    scrx = -cosLow(data.angle) * data.speed;
    scry = -sinLow(data.angle) * data.speed;
    pangle = data.angle;
    shield = data.shield;
    disguise = data.disguise;
    myTrail = data.trail;
    if (docked) playAudio(`sector`, 1);
    empTimer--;
    gyroTimer--;
    killStreakTimer--;
    docked = false;
    packsInfo = data.packs;
    playersInfo = data.players;
    basesInfo = data.bases;
    planets = data.planets;
    astsInfo = data.asteroids;
    beamsInfo = data.beams;
    blastsInfo = data.blasts;
    missilesInfo = data.missiles;
    orbsInfo = data.orbs;
    minesInfo = data.mines;
    vortsInfo = data.vorts;
    if (sx != data.sx || sy != data.sy) {
        sx = data.sx;
        sy = data.sy;
        playAudio(`sector`, 1);
        r3DMap();

        if (quest != undefined && quest != 0 && quest.type === `Secret2` && sx == quest.sx && sy == quest.sy) {
            for (const id in planets) {
                const aPlanet = planets[id];
                if (aPlanet !== undefined && aPlanet.sx === quest.sx && aPlanet.sy == quest.sy) secret2PlanetName = planets[id].name;
            }
        }
    }
    clearBullets(data);
});

socket.on(`update`, (data) => {
    ++uframes;
    ++tick;
    isLocked = data.isLocked;
    charge = data.charge;

    const delta = data.state;
    if (!delta) return;
    if (delta.players !== undefined) {
        for (let index = 0; index < delta.players.length; ++index) {
            player_update(delta.players[index]);
        }
    }
    if (delta.vorts !== undefined) {
        for (let index = 0; index < delta.vorts.length; ++index) {
            vort_update(delta.vorts[index]);
        }
    }

    if (delta.mines !== undefined) {
        for (let index = 0; index < delta.mines.length; ++index) {
            mine_update(delta.mines[index]);
        }
    }
    if (delta.beams !== undefined) {
        for (let index = 0; index < delta.beams.length; ++index) {
            beam_update(delta.beams[index]);
        }
    }
    if (delta.blasts !== undefined) {
        for (let index = 0; index < delta.blasts.length; ++index) {
            blast_update(delta.blasts[index]);
        }
    }
    if (delta.asteroids !== undefined) {
        for (let index = 0; index < delta.asteroids.length; ++index) {
            asteroid_update(delta.asteroids[index]);
        }
    }
    if (delta.missiles !== undefined) {
        for (let index = 0; index < delta.missiles.length; ++index) {
            missile_update(delta.missiles[index]);
        }
    }
    if (delta.packs !== undefined) {
        for (let index = 0; index < delta.packs.length; ++index) {
            pack_update(delta.packs[index]);
        }
    }
    if (delta.orbs !== undefined) {
        for (let index = 0; index < delta.orbs.length; ++index) {
            orb_update(delta.orbs[index]);
        }
    }
    if (delta.base !== undefined) {
        for (let index = 0; index < delta.base.length; ++index) {
            base_update(delta.base[index]);
        }
    }

    updateBooms();
    updateNotes();
    updateBullets();
    updateTrails(); // TO-DO
    empTimer--;
    gyroTimer--;
    killStreakTimer--;
});

socket.on(`player_create`, (data) => {
    playersInfo[data.id] = data;
});

function player_update (data) {
    const id = data.id;
    const delta = data.delta;
    // We just changed sectors or are just loading in
    if (playersInfo[id] === undefined || delta === undefined) return;

    for (const d in delta) {
        playersInfo[id][d] = delta[d];
    }

    if (id == myId) {
        pvx = -px;
        pvy = -py;
        px = playersInfo[id].x;
        py = playersInfo[id].y;
        pvx += px;
        pvy += py;
        pangle = playersInfo[id].angle;
        phealth = playersInfo[id].health;
        scrx = -cosLow(pangle) * playersInfo[id].speed;
        scry = -sinLow(pangle) * playersInfo[id].speed;
        disguise = delta.disguise;
        if (delta.sx !== undefined) {
            playersInfo[id].sx = sx = delta.sx;
        } else playersInfo[id].sx = sx;

        if (delta.sy !== undefined) {
            playersInfo[id].sy = sy = delta.sy;
        } else playersInfo[id].sy = sy;
    }
}

socket.on(`player_delete`, (data) => {
    delete playersInfo[data];
});

socket.on(`vort_create`, (data) => {
    vortsInfo[data.id] = data.pack;
});

socket.on(`mine_delete`, (data) => {
    delete minesInfo[data];
});

socket.on(`pack_create`, (data) => {
    packsInfo[data.id] = data.pack;
});

socket.on(`vort_delete`, (data) => {
    delete vortsInfo[data];
});

socket.on(`mine_create`, (data) => {
    minesInfo[data.id] = data.pack;
});

socket.on(`pack_delete`, (data) => {
    delete packsInfo[data];
});

socket.on(`beam_create`, (data) => {
    beamsInfo[data.id] = data.pack;
});

socket.on(`beam_delete`, (data) => {
    delete beamsInfo[data];
});

socket.on(`blast_create`, (data) => {
    blastsInfo[data.id] = data.pack;
});

socket.on(`blast_delete`, (data) => {
    delete blastsInfo[data];
});

socket.on(`base_create`, (data) => {
    basesInfo[data.id] = data;
});

socket.on(`base_delete`, (data) => {
    delete basesInfo[data];
});

socket.on(`asteroid_create`, (data) => {
    astsInfo[data.id] = data;
});

socket.on(`torn-ping`, (tstamp) => {
    nLag = 2 * (Date.now() - tstamp); // round-trip time
});

socket.on(`asteroid_delete`, (data) => {
    delete astsInfo[data];
});

socket.on(`orb_create`, (data) => {
    orbsInfo[data.id] = data.pack;
});

socket.on(`orb_delete`, (data) => {
    delete orbsInfo[data];
});

socket.on(`missile_create`, (data) => {
    missilesInfo[data.id] = data.pack;
});

socket.on(`missile_delete`, (data) => {
    delete missilesInfo[data];
});

global.get9SectorDict = function (dictionar, mysx, mysy, origX = globalOriginSX, origY = globalOriginSY, endX = globalEndSX, endY = globalEndSY, wedebug = false) {
    let combinedDict = {};
    for (let asx = origX; asx <= endX; asx++) { // Sectors on X loop
        // const newX = myx - (asx * sectorWidth);
        let sxReal = (mysx + asx) % mapSz;
        while (sxReal < 0) {
            sxReal = (sxReal + mapSz) % mapSz;
        }
        for (let asy = origY; asy <= endY; asy++) { // Sectors on Y do not loop
            const syReal = (mysy + asy);
            if (syReal < mapSz && syReal >= 0) {
                // const newY = myy - (asy * sectorWidth);
                if (wedebug) console.log(`STEP COORD (${syReal}, ${sxReal} -> ${dictionar[syReal][sxReal]} combinedDict before this: ${combinedDict} and its keys are ${Object.keys(combinedDict)}`);
                combinedDict = Object.assign({}, combinedDict, dictionar[syReal][sxReal]);
            }
        }
    }
    return combinedDict;
};

global.get9cSectorDict = function (dictionar, mysx, mysy, origX = globalOriginSX, origY = globalOriginSY, endX = globalEndSX, endY = globalEndSY, wedebug = false) {
    let auxDict = {};
    let combinedDict = {};
    for (let asx = origX; asx <= endX; asx++) { // Sectors on X loop
        let sxReal = (mysx + asx) % mapSz;
        while (sxReal < 0) {
            sxReal = (sxReal + mapSz) % mapSz;
        }
        auxDict[sxReal] = {};
        for (let asy = origY; asy <= endY; asy++) { // Sectors on Y do not loop
            const syReal = (mysy + asy);
            if (syReal < mapSz && syReal >= 0) {
                auxDict[sxReal][syReal] = 1;
            }
        }
    }
    for (i in dictionar) {
        const elem = dictionar[i];
        if (auxDict[elem.sx] !== undefined && auxDict[elem.sx][elem.sy] !== undefined && auxDict[elem.sx][elem.sy] === 1) combinedDict = Object.assign({}, combinedDict, elem);
    }
    return combinedDict;
};

function clearBullets (data, fullClear = true) {
    if (fullClear && globalOriginSX === 0 && globalOriginSY === 0 && globalEndSX === 0 && globalEndSY === 0) bullets = { };
    /*
    if (data === undefined || data === null || data.bullets === undefined) {
        if (fullClear) bullets = { };
        else bullets = get9cSectorDict(data.bullets, sx, sy);
    } else bullets = data.bullets;
    */
}

function vort_update (data) {
    const id = data.id;
    if (vortsInfo[id] === undefined) return;
    const delta = data.delta;

    for (const d in delta) {
        vortsInfo[id][d] = delta[d];
    }
}

function mine_update (data) {
    const id = data.id;
    if (minesInfo[id] === undefined) return;

    const delta = data.delta;

    for (const d in delta) {
        minesInfo[id][d] = delta[d];
    }
}

function pack_update (data) {
    const id = data.id;
    if (packsInfo[id] === undefined) return;

    const delta = data.delta;

    for (const d in delta) {
        packsInfo[id][d] = delta[d];
    }
}

function beam_update (data) {
    const id = data.id;
    if (beamsInfo[id] === undefined) return;

    const delta = data.delta;

    for (const d in delta) {
        beamsInfo[id][d] = delta[d];
    }
}

function blast_update (data) {
    const id = data.id;
    if (blastsInfo[id] === undefined) return;

    const delta = data.delta;

    for (const d in delta) {
        blastsInfo[id][d] = delta[d];
    }
}

function base_update (data) {
    if (basesInfo !== undefined && basesInfo !== 0 && data !== undefined) {
        const id = data.id;
        const delta = data.delta;

        if (id !== undefined && basesInfo[id] !== undefined && basesInfo[id] !== 0 && delta !== undefined) {
            for (const d in delta) {
                basesInfo[id][d] = delta[d];
            }
        }
    }
}

function base_minimap_update (data) { // Very rare event
    if (baseMap2D !== undefined && baseMap2D !== 0) {
        const minimapUpdate = data.miniMup;
        if (minimapUpdate !== undefined) {
            const starbaseList = minimapUpdate.starbaseList;
            if (starbaseList !== undefined) {
                for (let index = 0; index < starbaseList.length; ++index) {
                    const starbase = starbaseList[index];
                    if (starbase !== undefined && starbase !== 0) {
                        const aStarbasesx = starbase.sx;
                        const aStarbasesy = starbase.sy;
                        const aStarbasesC = starbase.color;
                        if (aStarbasesx !== undefined && aStarbasesy !== undefined && aStarbasesC !== undefined && baseMap2D[aStarbasesx] !== undefined && baseMap2D[aStarbasesx][aStarbasesy] !== undefined) {
                            baseMap2D[aStarbasesx][aStarbasesy] = aStarbasesC;
                        }
                    }
                }
            }
        }
    }
}

socket.on(`baseMapUpdate`, (data) => {
    base_minimap_update(data);
});

function asteroid_update (data) {
    const id = data.id;
    if (astsInfo[id] === undefined) return;
    const delta = data.delta;

    for (const d in delta) {
        astsInfo[id][d] = delta[d];
    }
}

function orb_update (data) {
    const id = data.id;
    if (orbsInfo[id] === undefined) return;
    const delta = data.delta;

    for (const d in delta) {
        orbsInfo[id][d] = delta[d];
    }
}

function missile_update (data) {
    const id = data.id;
    if (missilesInfo[id] === undefined) return;

    const delta = data.delta;

    for (const d in delta) {
        missilesInfo[id][d] = delta[d];
    }
}

socket.on(`newBullet`, (data) => {
    bullets[data.id] = data;
    if (bullets[data.id].tick === undefined) bullets[data.id].tick = 0;
});

socket.on(`delBullet`, (data) => {
    delete bullets[data.id];
});

function bullet_update (data) {
    if (bullets[data.id] === undefined) return;

    const delta = data.delta;

    for (const d in delta) {
        bullets[data.id][d] = delta[d];
    }
}

socket.on(`bullet_update`, (data) => {
    bullet_update(data);
});

socket.on(`invalidCredentials`, (data) => {
    credentialState = 1;
});

socket.on(`outdated`, () => {
    credentialState = 20;
});

socket.on(`badcookie`, (data) => {
    credentialState = 30;
});
socket.on(`loginSuccess`, (data) => {
    // Cleanup bullets from homepage
    for (const i in bullets) delete bullets[i];
    playAudio(`music1`, 0.5);
    credentialState = 0;
    RootState.turnOffDisplay();
    ChatState.init({ value: ``, activated: false });
    autopilot = false;
    login = true;
    myId = data.id;
});
socket.on(`invalidReg`, (data) => {
    credentialState = data.reason;
});
socket.on(`registered`, (data) => {
    credentialState = 0;
    RootState.turnOffRegister();
    guest = false;
    autopilot = false;
    tab = 0;
});
socket.on(`lored`, (data) => {
    // Cleanup bullets from homepage
    for (const i in bullets) delete bullets[i];
    credentialState = 0;
    pc = data.pc;
    RootState.turnOffDisplay();
    lore = true;
});
socket.on(`guested`, (data) => {
    credentialState = 0;
    RootState.turnOffDisplay();
    login = true;
    guest = true;
    autopilot = false;
    myId = data.id;
    tab = 0;
});

socket.on(`you`, (data) => {
    killStreak = data.killStreak;
    killStreakTimer = data.killStreakTimer;
    myName = data.name;
    pc = data.color;
    money = data.money;
    kills = data.kills;
    baseKills = data.baseKills;
    iron = data.iron;
    copper = data.copper;
    platinum = data.platinum;
    silver = data.silver;
    ship = data.ship;
    experience = data.experience;
    rank = data.rank;
    myTrail = data.trail;
    tag = data.tag;
    if (typeof data.t2 !== `undefined`) t2 = Math.round(1000 * data.t2) / 1000;
    if (typeof data.va2 !== `undefined`) va2 = Math.round(1000 * data.va2) / 1000;
    if (typeof data.ag2 !== `undefined`) ag2 = Math.round(1000 * data.ag2) / 1000;
    if (typeof data.c2 !== `undefined`) c2 = Math.round(1000 * data.c2) / 1000;
    if (typeof data.mh2 !== `undefined`) mh2 = Math.round(1000 * data.mh2) / 1000;
    if (typeof data.e2 !== `undefined`) e2 = Math.round(1000 * data.e2) / 1000;
    if (data.points >= 0 && data.points < 1000) {
        // prevents undefined on base
        points = data.points;
    }
});
socket.on(`weapons`, (data) => {
    let diff = false;
    for (const i in equipped) {
        if (equipped[i] != data.weapons[i]) {
            diff = true;
        }
    }
    equipped = data.weapons;
    worth = data.worth;
    ammos = data.ammos;
    if (docked && diff) {
        playAudio(`money`, 1);
    }
});
socket.on(`sound`, (data) => {
    let extraX = 0;
    let extraY = 0;
    let currSX;
    let currSY;
    if (!(Object.is(data.sx, null) || Object.is(data.sx, undefined))) {
        extraX = obtainSXDrift(data.sx, sx);
        currSX = data.sx;
    } else currSX = sx;
    if (!(Object.is(data.sy, null) || Object.is(data.sy, undefined))) {
        extraY = obtainSYDrift(data.sy, sy);
        currSY = data.sy;
    } else currSY = sy;

    if (data.file.includes(`boom`)) {
        if (data.file === `bigboom`) flash = 1;
        booms[Math.random()] = { x: data.x, y: data.y, sx: currSX, sy: currSY, time: 0, shockwave: data.file === `bigboom` };
        for (let i = 0; i < 5; i++) boomParticles[Math.random()] = { x: data.x, y: data.y, sx: currSX, sy: currSY, angle: Math.random() * 6.28, time: -1, dx: data.dx / 1.5, dy: data.dy / 1.5 };
    }

    const dx = (px - data.x + extraX) / 500;
    const dy = (py - data.y + extraY) / 500;
    const dist = Math.hypot(Math.abs(dx) + 10, Math.abs(dy) + 10);
    let vol = 0.6;
    if (data.soundStrength !== undefined) vol = vol * data.soundStrength;
    vol = vol / dist;
    if (data.file === `hyperspace`) {
        hyperdriveTimer = 200;
        vol = 2;
    }
    if ((vol >= 1) || dist < sectorWidth) playAudio(data.file, vol);
});
socket.on(`equip`, (data) => {
    scroll = data.scroll;
    weaponTimer = 100;
});
socket.on(`note`, (data) => {
    let elSX = sx;
    let elSY = sy;
    if (data.sx !== undefined) elSX = data.sx;
    if (data.sy !== undefined) elSY = data.sy;
    notes[Math.random()] = { msg: data.msg, x: data.x - 16 + (data.local ? -px : Math.random() * 32), y: data.y - 16 + (data.local ? -py : Math.random() * 32), time: 0, strong: false, local: data.local, sx: elSX, sy: elSY };
});
socket.on(`strong`, (data) => {
    let elSX = sx;
    let elSY = sy;
    if (data.sx !== undefined) elSX = data.sx;
    if (data.sy !== undefined) elSY = data.sy;
    notes[Math.random()] = { msg: data.msg, x: data.x + (data.local ? -px : 0), y: data.y - 128 + (data.local ? -py : 0), time: 0, strong: true, local: data.local, sx: elSX, sy: elSY };
});
socket.on(`spoils`, (data) => {
    data.amt = Math.round(data.amt);
    if (data.amt == 0) return;
    let msg = ``; let x = 0; let y = 0;
    if (data.type === `experience`) {
        msg = translate(`+`) + data.amt + translate(` EXP!`);
        x = w / 2 + 256;// next to exp bar
        y = h - 32;
    } else if (data.type === `money`) {
        msg = `$${data.amt}`;
        x = w - 512;
        y = 64;
    } else if (data.type === `ore`) {
        msg = translate(`+`) + data.amt + translate(` Ore!`);
        x = w - 512;
        y = 96;
    } else if (data.type === `life`) {
        msg = translate(`+`) + data.amt + (data.amt > 1 ? translate(` lives!`) : translate(` life!`));
        x = w - 512;
        y = 128;
    }
    notes[Math.random()] = { spoils: true, msg: msg, x: x, y: y, time: 0, strong: true, local: data.local };
});
socket.on(`online`, (data) => {
    sLag = data.lag;
});
socket.on(`emp`, (data) => {
    empTimer = data.t;
});
socket.on(`gyro`, (data) => {
    gyroTimer = data.t;
});
socket.on(`dmg`, (data) => {
    dmgTimer = 15;
});
socket.on(`refresh`, (data) => {
    forceRefresh();
});
socket.on(`quests`, (data) => {
    quests = data.quests;
});
socket.on(`rank`, (data) => {
    addBigNote([256, `Rank Up!`, ``, ``]);
});
socket.on(`quest`, (data) => {
    quest = data.quest;
    console.log(`Received quest status update`);
    if (quest != undefined && quest != 0 && quest.type === `Secret2` && sx == quest.sx && sy == quest.sy) {
        for (const id in planets) {
            const aPlanet = planets[id];
            if (aPlanet !== undefined && aPlanet.sx === quest.sx && aPlanet.sy == quest.sy) secret2PlanetName = planets[id].name;
        }
    }
    if (data.complete) addBigNote([256, `Quest Complete!`, ``, ``]);
});
socket.on(`achievementsKill`, (data) => {
    for (let a in data.achs) {
        a = Number(a);
        if (achs[a] != data.achs[a]) {
            achs[a] = data.achs[a];
            if (data.note && !guest) addBigNote([256, `Achievement Get!`, jsn.achNames[a].split(`:`)[0], jsn.achNames[a].split(`:`)[1]]);
        }
    }
});
socket.on(`achievementsCash`, (data) => {
    for (let a in data.achs) {
        a = Number(a);
        if (achs[a + 10] != data.achs[a]) {
            achs[a + 10] = data.achs[a];
            if (data.note && !guest) addBigNote([256, `Achievement Get!`, jsn.achNames[a + 10].split(`:`)[0], jsn.achNames[a + 10].split(`:`)[1]]);
        }
    }
});
socket.on(`achievementsDrift`, (data) => {
    for (let a in data.achs) {
        a = Number(a);
        if (achs[a + 15] != data.achs[a]) {
            achs[a + 15] = data.achs[a];
            if (data.note && !guest) addBigNote([256, `Achievement Get!`, jsn.achNames[a + 15].split(`:`)[0], jsn.achNames[a + 15].split(`:`)[1]]);
        }
    }
});
socket.on(`achievementsMisc`, (data) => {
    for (let a in data.achs) {
        a = Number(a);
        if (achs[a + 20] != data.achs[a]) {
            achs[a + 20] = data.achs[a];
            if (data.note && !guest) addBigNote([256, `Achievement Get!`, jsn.achNames[a + 20].split(`:`)[0], jsn.achNames[a + 20].split(`:`)[1]]);
        }
    }
});
socket.on(`status`, (data) => {
    shipView = ship;
    if (!docked && data.docked) savedNote = 40;
    if (data.docked && !docked && guest && rank > 0) {
        RootState.turnOnRegister(); tab = -1; keys[8] = false;
    }
    docked = data.docked;
    dead = data.state;
    lives = data.lives;
});
socket.on(`planets`, (data) => {
    if (planets == 0 || planets == undefined || planets == null) planets = {};
    planets[data.id] = data.pack;
    if (quest != undefined && quest != 0 && quest.type === `Secret2` && sx == quest.sx && sy == quest.sy) {
        for (const id in planets) {
            const aPlanet = planets[id];
            if (aPlanet !== undefined && aPlanet.sx === quest.sx && aPlanet.sy == quest.sy) secret2PlanetName = planets[id].name;
        }
    }
});
socket.on(`planetMap`, (data) => {
    planetMap2D[data.sx][data.sy] = data;
});
socket.on(`baseMap`, (data) => {
    expToRank = data.expToRank;
    mapSz = data.mapSz;
    console.log(`Got basemap of size ${mapSz}`);
    const baseMap = data.baseMap;
    for (let i = 0; i < mapSz; i++) {
        baseMap2D[i] = {};
        planetMap2D[i] = {};
        for (let j = 0; j < mapSz; j++) {
            baseMap2D[i][j] = 0;
            planetMap2D[i][j] = 0;
        }
    }

    for (const teamColor in baseMap) {
        const thisMap = baseMap[teamColor];
        for (let i = 0; i < thisMap.length; i += 2) {
            baseMap2D[thisMap[i]][thisMap[i + 1]] = teamColor;
        }
    }

    base_minimap_update(data);

    console.log(`Loading minimap`);
    sectorPoints = {};
    for (let i = 0; i < mapSz + 1; i++) {
        sectorPoints[i] = {};
        for (let j = 0; j < mapSz + 1; j++) {
            const theta = -2 * Math.PI * i / mapSz;
            const upwards = -(j - mapSz / 2 + 0.5) * 1.4 / mapSz;
            const radius = square(lerp(-1, 1, j / mapSz)) * 72 + 48;
            const xx = Math.sin(theta) * radius;
            const yy = Math.cos(theta) * radius;
            const zz = upwards * 256;
            sectorPoints[i][j] = { x: xx / 2, y: yy / 2, z: zz / 2 };
        }
    }
});

socket.on(`heatmap`, (data) => {
    hmap = data.hmap;
    lb = data.lb;
    raidRed = data.raidRed;
    raidBlue = data.raidBlue;
    raidGreen = data.raidGreen;
    youi = parseInt(data.youi);
    constructMyGuild(data.myGuild);
    if (data.youi >= maxElementsOnLeaderboard) {
        lb[maxElementsOnLeaderboard] = { id: data.youi, name: myName, exp: experience, color: pc, rank: rank };
    }
    renderLeaderboard(youi, maxElementsOnLeaderboard);
    r3DMap();
});
function constructMyGuild (data) {
    myGuild = {};
    for (let i = 0; i < mapSz; i++) {
        myGuild[i] = {};
        for (let j = 0; j < mapSz; j++) myGuild[i][j] = {};
    }
    for (const m in data) {
        const member = data[m];
        myGuild[member.sy][member.sx][m] = { x: member.x, y: member.y };
    }
}

socket.on(`worm`, (data) => {
    bx = data.bx;
    by = data.by;
    bxo = data.bxo;
    byo = data.byo;
});
socket.on(`raid`, (data) => {
    raidTimer = data.raidTimer;
});
socket.on(`kick`, (data) => {
    alert(data.msg);
    socket.disconnect();
});

socket.on(`AFK`, () => {
    afk = true;
});
