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

const io = require("socket.io-client");
const msgpack = require("socket.io-msgpack-parser");
import {jsn, translate} from "./localizer.ts";

global.API_URL = TORN_API_URL + "/api";
global.GAMESERVER_URL = TORN_GAMESERVER_URL;
console.log(":TornNetworkRepository: Setting API_URL to " + API_URL);
console.log(":TornNetworkRepository: Setting GAMESERVER_URL to " + GAMESERVER_URL);

global.send_api = async function(endpoint, data) {
  return await fetch(API_URL + endpoint, {
    method: "post",
    body: data,
    headers: {"Content-Type": "x-www-form-urlencoded"},
  });
};

global.socket = io(GAMESERVER_URL,
    {
      autoConnect: false,
      parser: msgpack,
    });

global.connect = function() {
  if (socket.connected)
  {return;}
  socket.open();
};

// socket error handling
socket.on("connect_error", function(error) {
  loginInProgress = false;
  if (!login) {
    alert("Failed to connect to the Torn servers. This probably either means they are down or your firewall is blocking the request. " + error);
    socket.close();
    return;
  }

  alert("There's been an issue and your connection to Torn has been interrupted. You should be able to reload and get back right into the game. " + error);
  socket.close();
});

// packet handling
socket.on("posUp", function(data) {
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
  if (docked) playAudio("sector", 1);
  empTimer--;
  gyroTimer--;
  killStreakTimer--;
  docked = false;
  packsInfo = data.packs;
  playersInfo = data.players;
  basesInfo = data.bases;
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
    playAudio("sector", 1);
    r3DMap();
  }
  clearBullets();
});

socket.on("update", function(data) {
  ++uframes;
  ++tick;
  isLocked = data.isLocked;
  charge = data.charge;

  const delta = data.state;

  for (let index = 0; index < delta.players.length; ++index) {
    player_update(delta.players[index]);
  }

  for (let index = 0; index < delta.vorts.length; ++index) {
    vort_update(delta.vorts[index]);
  }

  for (let index = 0; index < delta.mines.length; ++index) {
    mine_update(delta.mines[index]);
  }

  for (let index = 0; index < delta.beams.length; ++index) {
    beam_update(delta.beams[index]);
  }

  for (let index = 0; index < delta.blasts.length; ++index) {
    blast_update(delta.blasts[index]);
  }

  for (let index = 0; index < delta.asteroids.length; ++index) {
    asteroid_update(delta.asteroids[index]);
  }

  for (let index = 0; index < delta.missiles.length; ++index) {
    missile_update(delta.missiles[index]);
  }

  for (let index = 0; index < delta.packs.length; ++index) {
    pack_update(delta.packs[index]);
  }

  for (let index = 0; index < delta.orbs.length; ++index) {
    orb_update(delta.orbs[index]);
  }

  if (delta.base !== undefined) {
    base_update(delta.base);
  }

  updateBooms();
  updateNotes();
  updateBullets();
  updateTrails();
  empTimer--;
  gyroTimer--;
  killStreakTimer--;
});

socket.on("player_create", function(data) {
  playersInfo[data.id] = data;
});

function player_update(data) {
  const id = data.id;
  const delta = data.delta;
  // We just changed sectors or are just loading in
  if (playersInfo[id] === undefined) return;

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
  }
}

socket.on("player_delete", function(data) {
  delete playersInfo[data];
});

socket.on("vort_create", function(data) {
  vortsInfo[data.id] = data.pack;
});

socket.on("mine_delete", function(data) {
  delete minesInfo[data];
});

socket.on("pack_create", function(data) {
  packsInfo[data.id] = data.pack;
});

socket.on("vort_delete", function(data) {
  delete vortsInfo[data];
});

socket.on("mine_create", function(data) {
  minesInfo[data.id] = data.pack;
});

socket.on("pack_delete", function(data) {
  delete packsInfo[data];
});

socket.on("beam_create", function(data) {
  beamsInfo[data.id] = data.pack;
});

socket.on("beam_delete", function(data) {
  delete beamsInfo[data];
});

socket.on("blast_create", function(data) {
  blastsInfo[data.id] = data.pack;
});

socket.on("blast_delete", function(data) {
  delete blastsInfo[data];
});

socket.on("base_create", function(data) {
  basesInfo = data;
});

socket.on("base_delete", function(data) {
  basesInfo = undefined;
});

socket.on("asteroid_create", function(data) {
  astsInfo[data.id] = data;
});

socket.on("pong", (latency) => {
  nLag = latency;
});

socket.on("asteroid_delete", function(data) {
  delete astsInfo[data];
});

socket.on("orb_create", function(data) {
  orbsInfo[data.id] = data.pack;
});

socket.on("orb_delete", function(data) {
  delete orbsInfo[data];
});

socket.on("missile_create", function(data) {
  missilesInfo[data.id] = data.pack;
});

socket.on("missile_delete", function(data) {
  delete missilesInfo[data];
});


function clearBullets() {
  bullets = { };
}

function vort_update(data) {
  const id = data.id;
  if (vortsInfo[id] === undefined) return;
  const delta = data.delta;

  for (const d in delta) {
    vortsInfo[id][d] = delta[d];
  }
}

function mine_update(data) {
  const id = data.id;
  if (minesInfo[id] === undefined) return;

  const delta = data.delta;

  for (const d in delta) {
    minesInfo[id][d] = delta[d];
  }
}

function pack_update(data) {
  const id = data.id;
  if (packsInfo[id] === undefined) return;

  const delta = data.delta;

  for (const d in delta) {
    packsInfo[id][d] = delta[d];
  }
}

function beam_update(data) {
  const id = data.id;
  if (beamsInfo[id] === undefined) return;

  const delta = data.delta;

  for (const d in delta) {
    beamsInfo[id][d] = delta[d];
  }
}

function blast_update(data) {
  const id = data.id;
  if (blastsInfo[id] === undefined) return;

  const delta = data.delta;

  for (const d in delta) {
    blastsInfo[id][d] = delta[d];
  }
}

function base_update(data) {
  if (data === undefined || data.delta === undefined) return;
  const delta = data.delta;

  if (basesInfo === 0) return;

  for (const d in delta) {
    basesInfo[d] = delta[d];
  }
}

function asteroid_update(data) {
  const id = data.id;

  if (astsInfo[id] === undefined) return;
  const delta = data.delta;

  for (const d in delta) {
    astsInfo[id][d] = delta[d];
  }
}

function orb_update(data) {
  const id = data.id;
  if (orbsInfo[id] === undefined) return;
  const delta = data.delta;

  for (const d in delta) {
    orbsInfo[id][d] = delta[d];
  }
}

function missile_update(data) {
  const id = data.id;
  if (missilesInfo[id] === undefined) return;

  const delta = data.delta;

  for (const d in delta) {
    missilesInfo[id][d] = delta[d];
  }
}

socket.on("newBullet", function(data) {
  bullets[data.id] = data;
  bullets[data.id].tick = 0;
});
socket.on("delBullet", function(data) {
  delete bullets[data.id];
});

socket.on("invalidCredentials", function(data) {
  credentialState = 1;
});

socket.on("outdated", function() {
  credentialState = 20;
});

socket.on("badcookie", function(data) {
  credentialState = 30;
});
socket.on("loginSuccess", function(data) {
  // Cleanup bullets from homepage
  for (const i in bullets) delete bullets[i];
  playAudio("music1", .5);
  credentialState = 0;
  ReactRoot.turnOffDisplay("LoginOverlay");
  ReactRoot.init({value: ""});
  autopilot = false;
  login = true;
  myId = data.id;
});
socket.on("invalidReg", function(data) {
  credentialState = data.reason;
});
socket.on("registered", function(data) {
  credentialState = 0;
  ReactRoot.turnOffRegister("LoginOverlay");
  guest = false;
  autopilot = false;
  tab = 0;
});
socket.on("lored", function(data) {
  // Cleanup bullets from homepage
  for (const i in bullets) delete bullets[i];
  credentialState = 0;
  pc = data.pc;
  ReactRoot.turnOffDisplay("LoginOverlay");
  lore = true;
});
socket.on("guested", function(data) {
  credentialState = 0;
  ReactRoot.turnOffDisplay("LoginOverlay");
  login = true;
  guest = true;
  autopilot = false;
  myId = data.id;
  tab = 0;
});

socket.on("you", function(data) {
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
  if (typeof data.t2 !== "undefined") t2 = Math.round(1000 * data.t2) / 1000;
  if (typeof data.va2 !== "undefined") va2 = Math.round(1000 * data.va2) / 1000;
  if (typeof data.ag2 !== "undefined") ag2 = Math.round(1000 * data.ag2) / 1000;
  if (typeof data.c2 !== "undefined") c2 = Math.round(1000 * data.c2) / 1000;
  if (typeof data.mh2 !== "undefined") mh2 = Math.round(1000 * data.mh2) / 1000;
  if (typeof data.e2 !== "undefined") e2 = Math.round(1000 * data.e2) / 1000;
  if (data.points >= 0 && data.points < 1000) // prevents undefined on base
  {
    points = data.points;
  }
});
socket.on("weapons", function(data) {
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
    playAudio("money", 1);
  }
});
socket.on("sound", function(data) {
  if (data.file.includes("boom")) {
    if (data.file === "bigboom") flash = 1;
    booms[Math.random()] = {x: data.x, y: data.y, time: 0, shockwave: data.file === "bigboom"};
    for (let i = 0; i < 5; i++) boomParticles[Math.random()] = {x: data.x, y: data.y, angle: Math.random() * 6.28, time: -1, dx: data.dx / 1.5, dy: data.dy / 1.5};
  }
  const dx = (px - data.x) / 1000;
  const dy = (py - data.y) / 1000;
  const dist = Math.hypot(Math.abs(dx) + 10, Math.abs(dy) + 10);
  let vol = .6 / dist;
  if (data.file === "hyperspace") {
    hyperdriveTimer = 200;
    vol = 2;
  }
  playAudio(data.file, vol);
});
socket.on("equip", function(data) {
  scroll = data.scroll;
  weaponTimer = 100;
});
socket.on("note", function(data) {
  notes[Math.random()] = {msg: data.msg, x: data.x - 16 + (data.local ? -px : Math.random() * 32), y: data.y - 16 + (data.local ? -py : Math.random() * 32), time: 0, strong: false, local: data.local};
});
socket.on("strong", function(data) {
  notes[Math.random()] = {msg: data.msg, x: data.x + (data.local ? -px : 0), y: data.y - 128 + (data.local ? -py : 0), time: 0, strong: true, local: data.local};
});
socket.on("spoils", function(data) {
  data.amt = Math.round(data.amt);
  if (data.amt == 0) return;
  let msg = ""; let x = 0; let y = 0;
  if (data.type === "experience") {
    msg = translate("+") + data.amt + translate(" EXP!");
    x = w / 2 + 256;// next to exp bar
    y = h - 32;
  } else if (data.type === "money") {
    msg = "$" + data.amt;
    x = w - 512;
    y = 64;
  } else if (data.type === "ore") {
    msg = translate("+") + data.amt + translate(" Ore!");
    x = w - 512;
    y = 96;
  } else if (data.type === "life") {
    msg = translate("+") + data.amt + (data.amt > 1 ? translate(" lives!") : translate(" life!"));
    x = w - 512;
    y = 128;
  }
  notes[Math.random()] = {spoils: true, msg: msg, x: x, y: y, time: 0, strong: true, local: data.local};
});
socket.on("online", function(data) {
  sLag = data.lag;
});
socket.on("emp", function(data) {
  empTimer = data.t;
});
socket.on("gyro", function(data) {
  gyroTimer = data.t;
});
socket.on("dmg", function(data) {
  dmgTimer = 15;
});
socket.on("refresh", function(data) {
  forceRefresh();
});
socket.on("quests", function(data) {
  quests = data.quests;
});
socket.on("rank", function(data) {
  addBigNote([256, "Rank Up!", "", ""]);
});
socket.on("quest", function(data) {
  quest = data.quest;
  console.log("Received quest status update");
  if (data.complete) addBigNote([256, "Quest Complete!", "", ""]);
});
socket.on("achievementsKill", function(data) {
  for (let a in data.achs) {
    a = Number(a);
    if (achs[a] != data.achs[a]) {
      achs[a] = data.achs[a];
      if (data.note && !guest) addBigNote([256, "Achievement Get!", jsn.achNames[a].split(":")[0], jsn.achNames[a].split(":")[1]]);
    }
  }
});
socket.on("achievementsCash", function(data) {
  for (let a in data.achs) {
    a = Number(a);
    if (achs[a + 13] != data.achs[a]) {
      achs[a + 13] = data.achs[a];
      if (data.note && !guest) addBigNote([256, "Achievement Get!", jsn.achNames[a+13].split(":")[0], jsn.achNames[a+13].split(":")[1]]);
    }
  }
});
socket.on("achievementsDrift", function(data) {
  for (let a in data.achs) {
    a = Number(a);
    if (achs[a + 25] != data.achs[a]) {
      achs[a + 25] = data.achs[a];
      if (data.note && !guest) addBigNote([256, "Achievement Get!", jsn.achNames[a+25].split(":")[0], jsn.achNames[a+25].split(":")[1]]);
    }
  }
});
socket.on("achievementsMisc", function(data) {
  for (let a in data.achs) {
    a = Number(a);
    if (achs[a + 37] != data.achs[a]) {
      achs[a + 37] = data.achs[a];
      if (data.note && !guest) addBigNote([256, "Achievement Get!", jsn.achNames[a+37].split(":")[0], jsn.achNames[a+37].split(":")[1]]);
    }
  }
});
socket.on("status", function(data) {
  shipView = ship;
  if (!docked && data.docked) savedNote = 40;
  if (data.docked && !docked && guest && rank>0) {
    ReactRoot.turnOnRegister(""); tab = -1; keys[8] = false;
  }
  docked = data.docked;
  dead = data.state;
  lives = data.lives;
});
socket.on("planets", function(data) {
  planets = data.pack;
  if (quest != 0 && quest.type === "Secret2" && sx == quest.sx && sy == quest.sy) {
    secret2PlanetName = planets.name;
  }
});
socket.on("planetMap", function(data) {
  planetMap2D[data.sx][data.sy] = data;
  console.log(planetMap2D);
});
socket.on("baseMap", function(data) {
  mapSz = data.mapSz;
  console.log("Got basemap of size " + mapSz);
  const baseMap = data.baseMap;
  for (let i = 0; i < mapSz; i++) {
    baseMap2D[i] = {};
    for (let j = 0; j < mapSz; j++) {
      baseMap2D[i][j] = 0;
    }
  }
  for (let i = 0; i < mapSz; i++) {
    planetMap2D[i] = {};
    for (let j = 0; j < mapSz; j++) {
      planetMap2D[i][j] = 0;
    }
  }
  for (const teamColor in baseMap) {
    const thisMap = baseMap[teamColor];
    for (let i = 0; i < thisMap.length; i += 2) {
      baseMap2D[thisMap[i]][thisMap[i+1]] = teamColor;
    }
  }

  console.log("Loading minimap");
  sectorPoints = {};
  for (let i = 0; i < mapSz + 1; i++) {
    sectorPoints[i] = {};
    for (let j = 0; j < mapSz + 1; j++) {
      const theta = -2*Math.PI*i/mapSz;
      const upwards = -(j-mapSz/2+.5)*1.4/mapSz;
      const radius = square(lerp(-1, 1, j/mapSz))*72+48;
      const xx = Math.sin(theta) * radius;
      const yy = Math.cos(theta) * radius;
      const zz = upwards*256;
      sectorPoints[i][j] = {x: xx/2, y: yy/2, z: zz/2};
    }
  }
});

socket.on("heatmap", function(data) {
  hmap = data.hmap;
  lb = data.lb;
  raidRed = data.raidRed;
  raidBlue = data.raidBlue;
  raidGreen = data.raidGreen;
  youi = parseInt(data.youi);
  constructMyGuild(data.myGuild);
  if (data.youi > 15) {
    lb[16] = {id: data.youi, name: myName, exp: experience, color: pc, rank: rank};
  }
  r3DMap();
});
function constructMyGuild(data) {
  myGuild = {};
  for (let i = 0; i < mapSz; i++) {
    myGuild[i] = {};
    for (let j = 0; j < mapSz; j++) myGuild[i][j] = {};
  }
  for (const m in data) {
    const member = data[m];
    myGuild[member.sy][member.sx][m] = {x: member.x, y: member.y};
  }
}

socket.on("worm", function(data) {
  bx = data.bx;
  by = data.by;
  bxo = data.bxo;
  byo = data.byo;
});
socket.on("raid", function(data) {
  raidTimer = data.raidTimer;
});
socket.on("kick", function(data) {
  alert(data.msg);
  socket.disconnect();
});

socket.on("AFK", function() {
  afk = true;
});
