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
// input
document.onkeydown = function(event) {
  // Grab enter on homepage
  if (!login && !lore && event.keyCode == 13) {
    document.getElementById("loginButton").click();
    return;
  }
  if (!login || tab == -1) return;
  if (event.keyCode === 16) {
    if (keys[0] != true) socket.emit("key", {inputId: "shift", state: true});
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
    if (bigNotes[0] == -1)/* to prevent spam*/
    {
      addBigNote([256, "Autopilot "+(autopilot?"E":"Dise")+"ngaged!", "Press P to toggle.", ""]);
    }
    return;
  }
  if (event.keyCode == 13) {
    ReactRoot.focusChat();
    typing = true;
  } else if (autopilot) {
    return;
  } else if (event.keyCode == 78 && docked && tab == 8) { // n
    confirmer = -1;
    tab = 0;
  } else if (event.keyCode == 89 && docked && tab == 8) { // y
    socket.emit("sellW", {slot: confirmer});
    confirmer = -1;
    tab = 0;
  } else if (event.keyCode == 66 && docked && tab == 7 && seller != 0 && actuallyBuying) { // b
    socket.emit("buyW", {slot: scroll, weapon: seller - 20});
    tab = 0;
  } else if (event.keyCode > 48 && event.keyCode < 58 && equipped[event.keyCode - 49] != -2) {
    socket.emit("equip", {scroll: event.keyCode - 49});
  } else if (event.keyCode == 48 && equipped[event.keyCode - 49] != -2) {
    socket.emit("equip", {scroll: 9});
  } else if (event.keyCode === 83 || event.keyCode === 40) {// s
    if (keys[1] != true) socket.emit("key", {inputId: "s", state: true});
    keys[1] = true;
  } else if (event.keyCode === 192) {// `
    dev = !dev;
  } else if (event.keyCode === 77) {// m
    useOldMap = !useOldMap;
    r3DMap();
  } else if (event.keyCode === 69) {// e
    if (keys[2] != true) socket.emit("key", {inputId: "e", state: true});
    keys[2] = true;
  } else if (event.keyCode === 87 || event.keyCode === 38) {// w
    if (keys[3] != true) socket.emit("key", {inputId: "w", state: true});
    keys[3] = true;
    didW = true;
  } else if (event.keyCode === 65 || event.keyCode === 37) {// a
    if (keys[4] != true) socket.emit("key", {inputId: "a", state: true});
    keys[4] = true;
    didSteer = true;
  } else if (event.keyCode === 68 || event.keyCode === 39) {// d
    if (keys[5] != true) socket.emit("key", {inputId: "d", state: true});
    keys[5] = true;
    didSteer = true;
  } else if (event.keyCode === 32) {// space
    if (keys[6] != true) socket.emit("key", {inputId: " ", state: true});
    keys[6] = true;
    if (equipped[scroll] < 0) badWeapon = 20;
  } else if (event.keyCode === 81) {// q
    if (keys[7] != true) socket.emit("key", {inputId: "q", state: true});
    keys[7] = true;
  } else if (event.keyCode === 88 || event.keyCode === 27) {// x
    if (dead) return;
    if (quest == 0) qsx = qsy = qdsx = qdsy = -1;
    if (keys[8] != true) socket.emit("key", {inputId: "x", state: true});
    keys[8] = true;
    ReactRoot.turnOffRegister("");
    socket.emit("equip", {scroll: scroll});
  } else if (ship > 15 && (event.keyCode === 86 || event.keyCode === 67)) {// c/v
    if (dead) return;
    if (keys[9] != true) socket.emit("key", {inputId: "c", state: true});
    keys[9] = true;
  }
};
document.onkeyup = function(event) {
  if (!login || tab == -1 || autopilot) {
    return;
  }
  if (event.keyCode === 83 || event.keyCode === 40) {// s
    keys[1] = false;
    socket.emit("key", {inputId: "s", state: false});
  } else if (event.keyCode === 69) {// e
    keys[2] = false;
  } else if (event.keyCode === 87 || event.keyCode === 38) {// w
    keys[3] = false;
    socket.emit("key", {inputId: "w", state: false});
  } else if (event.keyCode === 65 || event.keyCode === 37) {// a
    keys[4] = false;
    socket.emit("key", {inputId: "a", state: false});
  } else if (event.keyCode === 68 || event.keyCode === 39) {// d
    keys[5] = false;
    socket.emit("key", {inputId: "d", state: false});
  } else if (event.keyCode === 32) {// space
    keys[6] = false;
    socket.emit("key", {inputId: " ", state: false});
  } else if (event.keyCode === 81) {// q
    keys[7] = false;
  } else if (event.keyCode === 88 || event.keyCode === 27) {// x
    keys[8] = false;
  } else if (ship > 15 && (event.keyCode === 86 || event.keyCode === 67)) {// c/v
    if (keys[9] == true) socket.emit("key", {inputId: "c", state: false});
    keys[9] = false;
  } else if (event.keyCode === 16) {
    keys[0] = false;
    socket.emit("key", {inputId: "shift", state: false});
  }
};
document.addEventListener("mousemove", function(evt) {
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
  }

  // Cargo
  else if (mx > 224 && mx < 240 && my < 216 && my > 8) {
    seller = 900;
  }

  // Global Chat Button
  else if (mx < 640 && mx > 512 && my > h - 64) {
    seller = 800 + Math.floor((my-h+61)/18);
    if (seller > 802 || seller < 800) seller = 0;
  }

  // Shop
  else if (docked && tab == 0) {
    if (mx > rx + 256 + 48 && mx < rx + 256 + 48 + ctx.measureText(translate("[Sell All]")).width && my > ry + 64 && my < ry + 80) seller = 610;
    else if (mx > rx + 256 - 32 && mx < rx + 264 && my < ry + 84 + 4 * 32 - 16 && my > ry + 84) {
      seller = 5 + Math.floor((my - 84 - ry) / 32);
      if (Math.floor((my - 84 - ry) / 16) % 2 == 1) seller = 0;
    } else if (my > ry + 246 && my < ry + 240 + 160 && mx > rx + 256 + 32 && mx < rx + 256 + 78) seller = Math.floor((my - ry - 246) / 16 + 10);
    else if (my > ry + 256 - 30 && my < ry + 256 - 16 && mx > rx + 512 - 64 && mx < rx + 512 - 64 + ctx.measureText(translate("[View All]")).width) seller = 601;
    else if (mx > rx + 768 - 16 - ctx.measureText(translate("[BUY]")).width && mx < rx + 768 - 16 && my > ry + 512 - 32 && my < ry + 512 - 16) seller = 611;
    else if (my > ry + 256 - 16 && my < ry + 512 - 16 && mx > rx + 16 && mx < rx + 256 + 16) {
      if (my > ry + 256 + 128 + 32) seller = 100;
      else seller = 0;
    } else seller = 0;
  }

  // Quests
  else if (docked && tab == 1 && mx > 16 + rx && mx < rx + 128 * 6 - 16 && my > ry + 40 + 32 && my < ry + 512 - 48 && quest == 0) {
    seller = Math.floor((my - ry - 40 - 32) / 80) + 300;
    if (mx > rx + 128 * 3) seller += 5;
    if (preSeller != seller) {
      const questi = quests[seller-300];
      qsx = questi.sx;
      qsy = questi.sy;
      qdsx = questi.dsx;
      qdsy = questi.dsy;
      r3DMap();
    }
  }

  // Stats
  else if (docked && tab == 2) {
    if (my > ry + 416 - 64 + 16 && my < ry + 416 - 64 + 30 && mx > rx + 64 && mx < rx + 64 + 112) seller = 200;
    else if (my > ry + 416 - 64 + 16 && my < ry + 416 - 64 + 30 && mx > rx + 192 && mx < rx + 192 + 112) seller = 201;
    else if (my > ry + 416 + 16 && my < ry + 416 + 30 && mx > rx + 64 && mx < rx + 64 + 112) seller = 202;
    else if (my > ry + 416 + 16 && my < ry + 416 + 30 && mx > rx + 192 && mx < rx + 192 + 112) seller = 203;
    else if (my > ry + 416 - 64 + 16 && my < ry + 416 - 64 + 30 && mx > rx + 320 && mx < rx + 320 + 112) seller = 204;
    else if (my > ry + 416 + 16 && my < ry + 416 + 30 && mx > rx + 320 && mx < rx + 320 + 112) seller = 205;

    else if (my > ry + 416 - 64 + 32 && my < ry + 416 - 64 + 46 && mx > rx + 64 && mx < rx + 64 + 112) seller = 206;
    else if (my > ry + 416 - 64 + 32 && my < ry + 416 - 64 + 46 && mx > rx + 192 && mx < rx + 192 + 112) seller = 207;
    else if (my > ry + 416 + 32 && my < ry + 416 + 46 && mx > rx + 64 && mx < rx + 64 + 112) seller = 208;
    else if (my > ry + 416 + 32 && my < ry + 416 + 46 && mx > rx + 192 && mx < rx + 192 + 112) seller = 209;
    else if (my > ry + 416 - 64 + 32 && my < ry + 416 - 64 + 46 && mx > rx + 320 && mx < rx + 320 + 112) seller = 210;
    else if (my > ry + 416 + 32 && my < ry + 416 + 46 && mx > rx + 320 && mx < rx + 320 + 112) seller = 211;

    else if (my > ry + 44 + 64 - 24 && my < ry + 44 + 64 + 8 * 21 && mx > rx + 512 && mx < rx + 768) {
      seller = 700 + Math.floor((my - ry - 44 - 64 + 24) / 32);
      if ((seller == 701 && !achs[12]) || (seller == 702 && !achs[24]) || (seller == 703 && !achs[36]) || (seller == 704 && !achs[47]) || (seller == 705 && true)) seller = 0;
    } else seller = 0;
  }

  // Buy weapon
  else if (docked && tab == 7) {
    if (my > ry + 40 + 52 && my < ry + 76 + 16 * (Math.ceil(wepnCount / 3) + 1) && mx > rx + 16 && mx < rx + 16 + 8 * 6) seller = weaponWithOrder(Math.floor((my - ry - 40 - 52) / 16 )) + 20;
    else if (my > ry + 40 + 52 && my < ry + 76 + 16 * (Math.ceil(wepnCount / 3) + 1) && mx > rx + 16 + 240 && mx < rx + 16 + 240 + 8 * 6) seller = weaponWithOrder(Math.floor((my - ry - 40 - 52) / 16 + Math.ceil(wepnCount / 3) )) + 20;
    else if (my > ry + 40 + 52 && my < ry + 76 + 16 * (Math.ceil(wepnCount / 3) + 1) && mx > rx + 16 + 240 * 2 && mx < rx + 16 + 240 * 2 + 8 * 6) seller = weaponWithOrder(Math.floor((my - ry - 40 - 52) / 16 + Math.ceil(wepnCount / 3) * 2)) + 20;

    else seller = 0;
  }

  // More
  else if (docked && tab == 4 && my > ry + 40 && my < ry + 512 && mx > rx && mx < rx + 768) {
    const ticX = Math.floor((mx - rx) / 256);
    const ticY = Math.floor((my - ry - 40) / ((512 - 40) / 2));
    seller = 500 + ticX + ticY * 3;
  } else seller = 0;
  if (seller != 0 && seller != preSeller) playAudio("button2", .2);
  if (preSeller!=seller && (Math.abs(preSeller-801)<=1 || Math.abs(seller-801)<=1)) rChat();
  if (quest == 0 && (seller < 300 || seller >= 400)) {
    qsx = -1;
    qsy = -1;
    qdsx = -1;
    qdsy = -1;
    r3DMap();
  }
}, false);

document.addEventListener("mousedown", function(evt) {
  soundAllowed = true;
  mb = 1;
  if (lore && !login) {
    socket.emit("guest", VERSION);
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
    if ((mx < w - 32 - 20 - 128 - 16 || my < h - 92) && (mx > 512 + 32 || my < h - 216) && !(mx < 256 && my < 450)) {// not in vol section or chat section or map
      socket.emit("key", {inputId: " ", state: true});
    }
    if (equipped[scroll] < 0) badWeapon = 20;
  }
  /* if(i == 350)
    socket.emit('cancelquest', {});*/

  // more page
  if (i == 500) window.open("https://tornspace.wikia.com/wiki/Torn.space_Wiki", "_blank");
  if (i == 501) window.open("/store", "_blank");
  if (i == 502) window.open("/leaderboard", "_blank");
  // row 2
  if (i == 503) window.open("https://github.com/TornDotSpace/Torn", "_blank");
  if (i == 504) window.open("https://discord.gg/tGrYXwP", "_blank");
  if (i == 505) window.open("/credits", "_blank");

  if (i == 601) {
    tab = 7;
    actuallyBuying = false;
  }
  if (i == 610) socket.emit("sell", {item: "all"});
  if (i == 611) socket.emit("buyLife", {});
  if (i >= 300 && i < 310 && quest == 0) socket.emit("quest", {quest: i - 300});
  if (docked && tab == 2 && i > 199 && i < 206) socket.emit("upgrade", {item: i - 200});
  if (docked && tab == 2 && i > 205 && i < 212) socket.emit("downgrade", {item: i - 206});
  if (docked && mx > rx && mx < rx + 128 * 6 && my > ry && my < ry + 40) tab = Math.floor((mx - rx) / (768/5));
  if (i >= 700 && i < 705) socket.emit("trail", {trail: i - 700});
  if (i == 900) socket.emit("jettison", {});
  if (i >= 800 && i < 803) {
    globalChat = i-800;
    socket.emit("toggleGlobal", {gc: globalChat});
    preProcessChat();
    rChat();
  }
  if (docked && mx > rx + 256 - 32 && mx < rx + 264 && my < ry + 84 + 4 * 32 - 16 && my > ry + 84) {
    let item = "";
    if (i == 5) item = "iron";
    else if (i == 6) item = "silver";
    else if (i == 7) item = "platinum";
    else if (i == 8) item = "copper";
    socket.emit("sell", {item: item});
  } else if (docked && tab == 0 && my > ry + 246 && my < ry + 240 + 160 && mx > rx + 256 + 32 && mx < rx + 256 + 78) {
    if (equipped[i - 10] == -1) {
      tab = 7;
      actuallyBuying = true;
      scroll = i - 10;
    } else if (equipped[i - 10] > -1) {
      tab = 8;
      confirmer = i - 10;
    }
  } else if (docked && tab == 0 && my > ry + 256 - 16 && my < ry + 512 - 16 && mx > rx + 16 && mx < rx + 256 + 16) {
    if (my > ry + 256 + 128 + 32) socket.emit("buyShip", {ship: shipView});
    else if (mx > rx + 16 + 128 && shipView < ships.length - 1) shipView++;
    else if (mx < rx + 16 + 128 && shipView > 0) shipView--;
  }
  if (i != 0 && i != 600) ReactRoot.turnOffRegister("");
}, false);
document.addEventListener("mouseup", function(evt) {
  mb = 0;
  if (mouseDown) {
    socket.emit("key", {inputId: " ", state: false});
    mouseDown = false;
  }
}, false);

canvas.addEventListener("wheel", function() {
  if (typeof event=="undefined") return;
  const d = -Math.sign(event.deltaY);
  if (mx < 256 && my < 450) {
    mapZoom*=d>0?.93:1.08;
    mapZoom = Math.max(Math.min(mapZoom, 1), .1);
    r3DMap();
    return;
  }
  if (mx < 512 + 32 && my > h - 216) {
    chatScroll = Math.max(0, Math.min(chatLength - 10, chatScroll + d));
    rChat();
    return;
  }
  if ((equipped[scroll] > 0 && (docked || scroll - d < 0 || scroll - d >= equipped.length || equipped[scroll - d] < -1)) || equipped[scroll - d] == -2) {
    return;
  }
  socket.emit("equip", {scroll: (scroll - d)});
});
