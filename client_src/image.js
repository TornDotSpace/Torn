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

global.loadImage = function (name, src) {
    if (Img[name]) {
        console.error(`Loading image twice: ${name}`); return;
    }
    Img[name] = new Image();
    Img[name].addEventListener(`load`, () => {
        Img_prgs[0]++;
    });
    Img[name].src = src;
    Img_prgs[1]++;
};
global.loadImageEnd = function () {
    const loaded = () => {
        if (Img_prgs[0] === Img_prgs[1]) {
            EVERYTHING_LOADED = true;
            return true;
        } else {
            return false;
        }
    };

    if (!loaded()) {
        const interval = setInterval(() => {
            if (loaded()) clearInterval(interval);
        }, 100);
    }
};
global.loadShipImg = function (color, i) {
    if (color === `red`) {
        redShips[i] = new Image();
        redShips[i].src = `/img/red/r${i + 1}.png`;
    } else if (color === `blue`) {
        blueShips[i] = new Image();
        blueShips[i].src = `/img/blue/b${i + 1}.png`;
    } else {
        greenShips[i] = new Image();
        greenShips[i].src = `/img/green/g${i + 1}.png`;
    }
};
global.loadAllImages = function () {
    // misc
    loadImage(`grad`, `/img/grad.png`);
    loadImage(`fire`, `/img/fire.png`);
    loadImage(`shockwave`, `/img/shockwave.png`);
    loadImage(`booms`, `/img/booms.png`);

    // base stuff
    loadImage(`rss`, `/img/red/rss.png`);
    loadImage(`bss`, `/img/blue/bss.png`);
    loadImage(`gss`, `/img/green/gss.png`);
    loadImage(`mrss`, `/img/red/mrss.png`);
    loadImage(`mbss`, `/img/blue/mbss.png`);
    loadImage(`mgss`, `/img/green/mgss.png`);
    loadImage(`rt`, `/img/red/rt.png`);
    loadImage(`bt`, `/img/blue/bt.png`);
    loadImage(`gt`, `/img/green/gt.png`);
    loadImage(`rsentry`, `/img/red/rsentry.png`);
    loadImage(`bsentry`, `/img/blue/bsentry.png`);
    loadImage(`gsentry`, `/img/green/gsentry.png`);

    // asteroids
    loadImage(`iron`, `/img/space/iron.png`);
    loadImage(`copper`, `/img/space/copper.png`);
    loadImage(`platinum`, `/img/space/platinum.png`);
    loadImage(`silver`, `/img/space/silver.png`);
    loadImage(`astUnderlayBlue`, `/img/space/astUnderlayBlue.png`);
    loadImage(`astUnderlayRed`, `/img/space/astUnderlayRed.png`);
    loadImage(`astUnderlayGreen`, `/img/space/astUnderlayGreen.png`);

    // planets
    loadImage(`planetO`, `/img/space/planetOverlay.png`);
    loadImage(`planetU`, `/img/space/planetUnderlay.png`);
    loadImage(`planetUB`, `/img/space/planetUnderlayBlue.png`);
    loadImage(`planetUR`, `/img/space/planetUnderlayRed.png`);
    loadImage(`planetUG`, `/img/space/planetUnderlayGreen.png`);

    // weapons
    loadImage(`redbullet`, `/img/weapons/rb.png`);
    loadImage(`bluebullet`, `/img/weapons/bb.png`);
    loadImage(`greenbullet`, `/img/weapons/gb.png`);
    loadImage(`energyDisk`, `/img/weapons/energyDisk.png`);
    loadImage(`photonOrb`, `/img/weapons/photonOrb.png`);
    loadImage(`missile`, `/img/weapons/missile.png`);
    loadImage(`alienMissile`, `/img/weapons/alienMissile.png`);
    loadImage(`torpedo`, `/img/weapons/torpedo.png`);
    loadImage(`heavyMissile`, `/img/weapons/heavyMissile.png`);
    loadImage(`alienMissileSwarm`, `/img/weapons/alienMissileSwarm.png`);
    loadImage(`empMissile`, `/img/weapons/empMissile.png`);
    loadImage(`mine`, `/img/weapons/mine.png`);
    loadImage(`magneticMine`, `/img/weapons/magneticMine.png`);
    loadImage(`grenade`, `/img/weapons/grenade.png`);
    loadImage(`empMine`, `/img/weapons/empMine.png`);
    loadImage(`laserMine`, `/img/weapons/laserMine.png`);
    loadImage(`pulseMine`, `/img/weapons/pulseMine.png`);
    loadImage(`campfire`, `/img/weapons/campfire.png`);
    loadImage(`bigBullet`, `/img/weapons/bigBullet.png`);

    // space
    loadImage(`vort`, `/img/space/vort.png`);
    loadImage(`worm`, `/img/space/worm.png`);
    loadImage(`spc`, `/img/space/Background.png`);

    // baseGui
    loadImage(`q`, `/img/baseGui/q.png`);
    loadImage(`button`, `/img/baseGui/button.png`);
    loadImage(`arrow`, `/img/baseGui/arrow.png`);

    // packs
    loadImage(`pack`, `/img/packs/pack.png`);
    loadImage(`ammo`, `/img/packs/ammo.png`);
    loadImage(`bonus`, `/img/packs/bonus.png`);
    loadImage(`life`, `/img/packs/life.png`);

    // arrows
    loadImage(`yellowArrow`, `/img/arrows/yellowArrow.png`);
    loadImage(`orangeArrow`, `/img/arrows/orangeArrow.png`);
    loadImage(`greenArrow`, `/img/arrows/greenArrow.png`);
    loadImage(`redArrow`, `/img/arrows/redArrow.png`);
    loadImage(`blueArrow`, `/img/arrows/blueArrow.png`);
    loadImage(`whiteArrow`, `/img/arrows/whiteArrow.png`);
    loadImage(`blackArrow`, `/img/arrows/blackArrow.png`);

    // ships
    for (let i = 0; i < 23; i++) loadShipImg(`blue`, i);
    for (let i = 0; i < 23; i++) loadShipImg(`red`, i);
    for (let i = 0; i < 23; i++) loadShipImg(`green`, i);
    loadImageEnd();

    for (let i = 1; i < 6; i++) {
        planetImgs[i] = new Image();
        planetImgs[i].src = `/img/space/planets/pt${i}.jpg`;
    }
};
