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

import { chatMenuButtonClick, rChat, chatScroll, chatLength } from "./chat.ts";
// input
document.onkeydown = function (event) {
    // Grab enter on homepage
    if (!login && !lore && event.keyCode == 13) {
        document.getElementById(`loginButton`).click();
        return;
    }
    if (!login || tab == -1) return;
    if (event.keyCode === 16) {
        if (keys[0] != true) socket.emit(`key`, { inputId: `shift`, state: true });
        keys[0] = true;
        return;
    }
    if (typing) {
        if (event.keyCode == 13) {
            ReactRoot.unfocusChat();
            typing = false;
        }
        return;
    }
    if (login && !typing && event.keyCode === 80 && !docked) {
        autopilot ^= true;
        if (bigNotes[0] == -1) {
            // To prevent spam.
            addBigNote([256, `Autopilot ${autopilot ? `E` : `Dise`}ngaged!`, `Press P to toggle.`, ``]);
        }
        return;
    }
    if (event.keyCode == 13) {
        ReactRoot.focusChat();
        typing = true;
    } else if (autopilot) {
        // eslint-disable no-empty
    } else if (event.keyCode == 78 && docked && tab == 8) { // n
        confirmer = -1;
        tab = 0;
    } else if (event.keyCode == 89 && docked && tab == 8) { // y
        socket.emit(`sellW`, { slot: confirmer });
        confirmer = -1;
        tab = 0;
    } else if (event.keyCode == 66 && docked && tab == 7 && seller != 0 && actuallyBuying) { // b
        socket.emit(`buyW`, { slot: scroll, weapon: seller - 20 });
        tab = 0;
    } else if (event.keyCode > 48 && event.keyCode < 58 && equipped[event.keyCode - 49] != -2) {
        socket.emit(`equip`, { scroll: event.keyCode - 49 });
    } else if (event.keyCode == 48 && equipped[event.keyCode - 49] != -2) {
        socket.emit(`equip`, { scroll: 9 });
    } else if (event.keyCode === 83 || event.keyCode === 40) { // s
        if (keys[1] != true) socket.emit(`key`, { inputId: `s`, state: true });
        keys[1] = true;
    } else if (event.keyCode === 192) { // `
        dev = !dev;
    } else if (event.keyCode === 77) { // m
        useOldMap = !useOldMap;
        r3DMap();
    } else if (event.keyCode === 69) { // e
        if (keys[2] != true) socket.emit(`key`, { inputId: `e`, state: true });
        keys[2] = true;
    } else if (event.keyCode === 87 || event.keyCode === 38) { // w
        if (keys[3] != true) socket.emit(`key`, { inputId: `w`, state: true });
        keys[3] = true;
        didW = true;
    } else if (event.keyCode === 65 || event.keyCode === 37) { // a
        if (keys[4] != true) socket.emit(`key`, { inputId: `a`, state: true });
        keys[4] = true;
        didSteer = true;
    } else if (event.keyCode === 68 || event.keyCode === 39) { // d
        if (keys[5] != true) socket.emit(`key`, { inputId: `d`, state: true });
        keys[5] = true;
        didSteer = true;
    } else if (event.keyCode === 32) { // space
        if (keys[6] != true) socket.emit(`key`, { inputId: ` `, state: true });
        keys[6] = true;
        if (equipped[scroll] < 0) badWeapon = 20;
    } else if (event.keyCode === 81) { // q
        if (keys[7] != true) socket.emit(`key`, { inputId: `q`, state: true });
        keys[7] = true;
    } else if (event.keyCode === 88 || event.keyCode === 27) { // x
        if (dead) return;
        if (keys[8] != true) socket.emit(`key`, { inputId: `x`, state: true });
        keys[8] = true;
        ReactRoot.turnOffRegister(``);
        socket.emit(`equip`, { scroll: scroll });
    } else if (ship > 15 && (event.keyCode === 86 || event.keyCode === 67)) { // c/v
        if (dead) return;
        if (keys[9] != true) socket.emit(`key`, { inputId: `c`, state: true });
        keys[9] = true;
    }
};

document.onkeyup = function (event) {
    if (!login || tab == -1 || autopilot) {
        return;
    }
    if (event.keyCode === 83 || event.keyCode === 40) { // s
        keys[1] = false;
        socket.emit(`key`, { inputId: `s`, state: false });
    } else if (event.keyCode === 69) { // e
        keys[2] = false;
    } else if (event.keyCode === 87 || event.keyCode === 38) { // w
        keys[3] = false;
        socket.emit(`key`, { inputId: `w`, state: false });
    } else if (event.keyCode === 65 || event.keyCode === 37) { // a
        keys[4] = false;
        socket.emit(`key`, { inputId: `a`, state: false });
    } else if (event.keyCode === 68 || event.keyCode === 39) { // d
        keys[5] = false;
        socket.emit(`key`, { inputId: `d`, state: false });
    } else if (event.keyCode === 32) { // space
        keys[6] = false;
        socket.emit(`key`, { inputId: ` `, state: false });
    } else if (event.keyCode === 81) { // q
        keys[7] = false;
    } else if (event.keyCode === 88 || event.keyCode === 27) { // x
        keys[8] = false;
    } else if (ship > 15 && (event.keyCode === 86 || event.keyCode === 67)) { // c/v
        if (keys[9] == true) socket.emit(`key`, { inputId: `c`, state: false });
        keys[9] = false;
    } else if (event.keyCode === 16) {
        keys[0] = false;
        socket.emit(`key`, { inputId: `shift`, state: false });
    }
};

document.addEventListener(`mousemove`, (evt) => {
    const omx = mx;
    const omy = my;
    const mousePos = getMousePos(canvas, evt);
    mx = mousePos.x;
    my = mousePos.y;
    if (mb == 1 && mx > w - 32 - 20 - 128 && mx < w - 32 - 20 && my > h - 52) gVol = (mx + 20 + 32 + 128 - w) / 128;
    if (mx > w - 32 - 20 - 128 && my > h - 52) volTransparency = 1;
    const preSeller = seller;

    // Map movement
    if (mb == 1 && mx > 8 && mx < 216 && my < 216 && my > 8) {
        const mxn = mx - omx;
        const myn = my - omy;
        roll(myn / 4);
        spin(mxn / 4);
        r3DMap();
    } else if (mx > 224 && mx < 240 && my < 216 && my > 8) {
        // Cargo
        seller = 900;
    } else if (mx < 640 && mx > 512 && my > h - 64) {
        // Global Chat Button
        seller = 800 + Math.floor((my - h + 61) / 18);
        if (seller > 802 || seller < 800) seller = 0;
        else if (preSeller != seller) rChat();
    } else if (docked && tab == 0) shopOnHover(); // Shop
    else if (docked && tab == 1) questsOnHover(preSeller); // Quests
    else if (docked && tab == 2) statsOnHover(); // Stats
    else if (docked && tab == 7) weaponStoreOnHover(); // Buy Weapon
    else if (docked && tab == 4) moreOnHover(); // More
    else seller = 0;

    if (seller != 0 && seller != preSeller) playAudio(`button2`, 0.2);
}, false);

document.addEventListener(`mousedown`, (evt) => {
    soundAllowed = true;
    mb = 1;
    if (lore && !login) {
        socket.emit(`guest`, VERSION);
        return;
    }
    if (mx > w - 32 - 20 - 128 && mx < w - 32 - 20 && my > h - 52) gVol = (mx + 20 + 32 + 128 - w) / 128;
    const mousePos = getMousePos(canvas, evt);
    mx = mousePos.x;
    my = mousePos.y;
    if (mx < 400 && mx > 9 && my > h - 32 && my < h - 8) {
        typing = true;
        ReactRoot.focusChat();
    } else typing = false;
    const i = seller;
    if (i == 0 && !mouseDown) {
        mouseDown = true;
        if ((mx < w - 32 - 20 - 128 - 16 || my < h - 92) && (mx > 512 + 32 || my < h - 216) && !(mx < 256 && my < 450)) { // not in vol section or chat section or map
            socket.emit(`key`, { inputId: ` `, state: true });
        }
        if (equipped[scroll] < 0) badWeapon = 20;
    }
    /* if(i == 350)
    socket.emit('cancelquest', {}); */

    if (i == 601) {
        tab = 7;
        actuallyBuying = false;
    }
    if (docked) {
        baseMenuOnClick(i);
    }
    if (i == 900) socket.emit(`jettison`, {});
    if (i >= 800 && i < 803) {
        chatMenuButtonClick(i);
    }
    if (i != 0 && i != 600) ReactRoot.turnOffRegister(``);
}, false);

document.addEventListener(`mouseup`, (evt) => {
    mb = 0;
    if (mouseDown) {
        socket.emit(`key`, { inputId: ` `, state: false });
        mouseDown = false;
    }
}, false);

canvas.addEventListener(`wheel`, () => {
    if (typeof event == `undefined`) return;
    const d = -Math.sign(event.deltaY);

    // 3d Map Zooming
    if (mx < 256 && my < 450) {
        mapZoom *= d > 0 ? 0.93 : 1.08;
        mapZoom = Math.max(Math.min(mapZoom, 1), 0.1);
        r3DMap();
        return;
    }

    // Scrolling up the chat menu
    if (mx < 512 + 32 && my > h - 216) {
        // FIXME: See below
        // eslint-disable-next-line no-import-assign
        chatScroll = Math.max(0, Math.min(chatLength - 10, chatScroll + d));
        rChat();
        return;
    }

    // Weapon scrolling
    if ((equipped[scroll] > 0 && (docked || scroll - d < 0 || scroll - d >= equipped.length || equipped[scroll - d] < -1)) || equipped[scroll - d] == -2) {
        return;
    }
    socket.emit(`equip`, { scroll: (scroll - d) });
});
