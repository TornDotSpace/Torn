
function printStartup() {
	console.log("************************************************************************************************************************");
	console.log(" ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄        ▄     ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄ ");
	console.log("▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░▌      ▐░▌   ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌");
	console.log(" ▀▀▀▀█░█▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌▐░▌░▌     ▐░▌   ▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀▀▀ ");
	console.log("     ▐░▌     ▐░▌       ▐░▌▐░▌       ▐░▌▐░▌▐░▌    ▐░▌   ▐░▌          ▐░▌       ▐░▌▐░▌       ▐░▌▐░▌          ▐░▌          ");
	console.log("     ▐░▌     ▐░▌       ▐░▌▐░█▄▄▄▄▄▄▄█░▌▐░▌ ▐░▌   ▐░▌   ▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄█░▌▐░▌          ▐░█▄▄▄▄▄▄▄▄▄ ");
	console.log("     ▐░▌     ▐░▌       ▐░▌▐░░░░░░░░░░░▌▐░▌  ▐░▌  ▐░▌   ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░▌          ▐░░░░░░░░░░░▌");
	console.log("     ▐░▌     ▐░▌       ▐░▌▐░█▀▀▀▀█░█▀▀ ▐░▌   ▐░▌ ▐░▌    ▀▀▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌▐░▌          ▐░█▀▀▀▀▀▀▀▀▀ ");
	console.log("     ▐░▌     ▐░▌       ▐░▌▐░▌     ▐░▌  ▐░▌    ▐░▌▐░▌             ▐░▌▐░▌          ▐░▌       ▐░▌▐░▌          ▐░▌          ");
	console.log("     ▐░▌     ▐░█▄▄▄▄▄▄▄█░▌▐░▌      ▐░▌ ▐░▌     ▐░▐░▌ ▄  ▄▄▄▄▄▄▄▄▄█░▌▐░▌          ▐░▌       ▐░▌▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄▄▄ ");
	console.log("     ▐░▌     ▐░░░░░░░░░░░▌▐░▌       ▐░▌▐░▌      ▐░░▌▐░▌▐░░░░░░░░░░░▌▐░▌          ▐░▌       ▐░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌");
	console.log("      ▀       ▀▀▀▀▀▀▀▀▀▀▀  ▀         ▀  ▀        ▀▀  ▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀            ▀         ▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀ ");
	console.log("                                                                                                                        ");
	console.log("************************************************************************************************************************");

	console.log("torn-client-git-" + BRANCH + "-" + COMMITHASH);
	console.log ("Implementing protocol version " + VERSION);

	// Print client modification warning
	console.error("***********************************************************************");
	console.error("WARNING: PASTING CODE INTO HERE CAN ALLOW FOR YOUR ACCOUNT TO BE STOLEN");
	console.error("ALWAYS AUDIT CODE YOU ARE INJECTING INTO THE DEVELOPER CONSOLE");
	console.error("ADDITIONALLY, PLEASE RESPECT OUR TOS https://torn.space/legal/tos.pdf AND NOTE OUR PRIVACY POLICY https://torn.space/legal/privacy_policy.pdf");
	console.error("***********************************************************************");
}

printStartup();

window.document.title = "Torn " + VERSION;

var isChrome = true || !(!window.chrome) && !(!window.chrome.webstore);//broken

var canvas = document.getElementById('ctx');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var ctx = canvas.getContext("2d", { alpha: false });

import React from "react";
import ReactDOM from "react-dom";
import ReactRoot from "./react.js";
const io = require('socket.io-client');

const { Howl, Howler } = require('howler'); // audio
const msgpack = require('socket.io-msgpack-parser');

ReactDOM.render(
	<ReactRoot data={{
		toggleMusic: toggleMusic,
		toggleAudio: toggleAudio
	}} />,
	// Not rendering to body so canvas will not be affected
	document.getElementById("a")
);
ReactRoot.turnOnDisplay("LoginOverlay");

var sins = [];

for (var i = 0; i < 1571; i++)//500pi
	sins[i] = Math.sin(i / 1000.);



require("./localizer.js");
loadLang();

//Normal, on server: torn.space:443
//dev: localhost:7300
var socket = io(GAMESERVER_URL,
	{
		autoConnect: false,
		parser: msgpack
 	});
// Just to make socket accessible in react.js
ReactRoot.socket = socket;

global.connect = function () {
	if (socket.connected) {
		return;
	}

	socket.open();
}

var teamColors = ["red","blue","green"];
var sectorWidth = 14336;
var mx = 0, my = 0, mb = 0;
var tick = 0, baseTick = 0;
var scrx = 0, scry = 0;
var mapSz = 7;
var quests = 0, quest = 0;
var login = false, lore = false, afk = false;
var px = 0, py = 0, pc = 0, pangle = 0, isLocked = false, pvx = 0, pvy = 0;
var phealth = 0;
var energy = 0;
var mapZoom = 1;
var bxo = 0, byo = 0, bx = 0, by = 0;
var bp = 0, rp = 0, bg = 0, rg = 0, bb = 0, rb = 0, bs = 0, rs = 0;
var iron = 0, silver = 0, platinum = 0, aluminium = 0;
var kills = 0, baseKills = 0, money = 0, experience = 0, rank = 0;
var sx = 0, sy = 0;
var docked = false, actuallyBuying = true;
var tab = 0, confirmer = -1, shipView = 0, volTransparency = 0, gVol = .5;
global.typing = false;
global.stopTyping = () => { typing = false }

var baseMap2D = {}
for(var i = 0; i < mapSz; i++){
	baseMap2D[i] = {};
	for(var j = 0; j < mapSz; j++){
		baseMap2D[i][j] = 0;
	}
}

var chatLength = 20, chatScroll = 0, globalChat = 0, preChatArr = {}, chati = 0;
var lorePage = 0, homepageTimer = 0, loreTimer = 0;
var messages = {};
for (var i = 0; i < chatLength; i++)
	messages[i] = "";
preProcessChat();
var raidTimer = -1, raidRed = 0, raidBlue = 0, raidGreen = 0, points = 0;
var shift = false, shield = false, autopilot = false;
var seller = 0, sectorMap = 0, worth = 0, ship = 0;
var empTimer = -1, dmgTimer = -1, gyroTimer = 0, afkTimer = 45000;
var t2 = 1, mh2 = 1, c2 = 1, va2 = 1, e2 = 1, ag2 = 1;
var dead = false, lives = 50, sLag = 0, nLag = 0, clientLag = -40, fps = 0, ops = 0, frames = 0, uframes = 0, ups = 0, dev = false;
var credentialState = 0, textIn = 0, savedNote = 0;
var key = '~`';
var myName = "GUEST", currAlert = '', disguise = 0;
var soundAllowed = false;
var currLoading = "";
var secret2PlanetName = "";
var meanNLag = 0, nLagCt = 0;

var booms = {};
var boomParticles = {};
var trails = {};
var myTrail = 0;
var notes = {};
var bullets = {};
var planets = 0, hmap = 0, lb = 0, youi = 0;
var keys = [], lagArr = 0;

var w = window.innerWidth;
var h = window.innerHeight; // Canvas width and height
var rx = w / 2 - 128 * 3, ry = h / 4 - 128;
var basesInfo = undefined, playersInfo = { }, minesInfo = { }, orbsInfo = { }, missilesInfo = { }, vortsInfo = { }, beamsInfo = { }, blastsInfo = { }, astsInfo = { }, packsInfo = { };

var clientmutes = { };
// for initial loading screen
var EVERYTHING_LOADED = false;

var guest = false;

var stars = [];
for (var i = 0; i < 30; i++) stars[i] = { x: Math.random() * w, y: Math.random() * h };

var myId = undefined;

/*var dots = [];
for (var i = 0; i < 2; i++) {
	var a = Math.random() * 6.28318;
	var rnd = Math.random() * 128;
	a += sinLow((a % (2 * Math.PI / 5) + rnd / 32) * 5 / 2) / (1 + (128 / rnd));
	var xx = cosLow(a) * rnd;
	var yy = sinLow(a) * rnd;
	var zz = sinLow(Math.random() * 100) * 16 / (1 + rnd * rnd / 1024);
	dots[i] = { x: Math.floor(xx), y: Math.floor(yy), z: Math.floor(zz) };
}*/

var killStreak = 0, killStreakTimer = -1;
var badWeapon = 0;
var mouseDown = false;
var xxa = sx;
var yya = sy;
xxa *= 256 / mapSz * (2 * mapSz - 1) / (2 * mapSz);
yya *= 256 / mapSz * (2 * mapSz - 1) / (2 * mapSz);
var planetTimerSec = 0;
var flash = 0;
var hyperdriveTimer = 0;
var didW = false, didSteer = false, currTut = 0;

var sectorPoints = {};
/*for (var i = 0; i < mapSz + 1; i++) {
	sectorPoints[i] = {};
	for (var j = 0; j < mapSz + 1; j++) {
		var theta = -2*Math.PI*i/mapSz;
		var upwards = square((mapSz+7-j)/(mapSz+7));
		var radius = cerp(0,1,upwards)*128;
		var xx = Math.sin(theta) * radius;
		var yy = Math.cos(theta) * radius;
		var zz = upwards*256;
		sectorPoints[i][j] = { x: xx, y: yy, z: zz };
	}
}*/
for (var i = 0; i < mapSz + 1; i++) { // Old Map
	sectorPoints[i] = {};
	for (var j = 0; j < mapSz + 1; j++) {
		var xx = (i - mapSz / 2) * 192 / mapSz;
		var yy = (j - mapSz / 2) * 192 / mapSz;
		sectorPoints[i][j] = { x: xx, y: yy, z: 0 };
	}
}

var wepns = jsn.weapons, ships = jsn.ships;
for (var j = 0; j < wepns.length - 1; j++)//this nifty loop sorts weapons by ship
	if (wepns[weaponWithOrder(j)].type === wepns[weaponWithOrder(j + 1)].type && wepns[weaponWithOrder(j)].level > wepns[weaponWithOrder(j + 1)].level) {
		var woj = weaponWithOrder(j), woj1 = weaponWithOrder(j + 1);
		wepns[woj].order = j + 1;
		wepns[woj1].order = j;
		j = 0;
	}
wepns[-2] = { name: "" };
wepns[-1] = { name: mEng[0] };

var scroll = 0, weaponTimer = 0, charge = 0;
var equipped = 0, ammos = {};
var musicAudio = 0;

var Aud = {};
var Aud_prgs = [0, 0];

function loadAudio(name, _src) {
	if (Aud[name]) { console.error("Loading audio twice: " + name) }
	Aud[name] = new Howl({
		src: _src,
		autoplay: false,
		loop: false,
		preload: true,
		onload: function () {
			currLoading = "Loaded audio "+name;
			console.log(currLoading);
			++Aud_prgs[0];
		},
		pool: 15
	});
	Aud_prgs[1]++;
}
function loadAllAudio() {
	loadAudio("minigun", '/aud/minigun.mp3');
	loadAudio("boom", '/aud/boom.mp3');
	loadAudio("hyperspace", '/aud/hyperspace.mp3');
	loadAudio("bigboom", '/aud/bigboom.wav');
	loadAudio("shot", '/aud/shot.mp3');
	loadAudio("beam", '/aud/beam.wav');
	loadAudio("missile", '/aud/whoosh.mp3');
	loadAudio("sector", '/aud/sector.wav');
	loadAudio("money", '/aud/money.wav');
	loadAudio("button2", '/aud/button2.wav');
	loadAudio("noammo", '/aud/noammo.wav');
}

var muted = false, musicMuted = false;

// Passed to React Root
function toggleAudio() {
	muted ^= true;
	Howler.mute(muted);
	return muted;
}

// Passed to React Root
function toggleMusic() {
	musicMuted ^= true;
	if (musicMuted && login) Aud["music1"].pause();
	else if (musicAudio != 0) Aud["music1"].play();
	return musicMuted;
}

// Use this function to play any sound from the Aud object
function playAudio(name, vol) {
	if (muted) return;
	var audio = Aud[name];
	if (!audio) { console.error("Unknown sound " + name); }
	var id = audio.play();

	audio.volume(gVol * vol, id);

	if (name == "bigboom") audio.volume(gVol * vol * 2, id);
	if (name == "noammo") audio.volume(gVol * vol * 5, id);

	if (name === "music1") {
		audio.volume(gVol * vol / 2, id);
		musicAudio = id;
	}
}

var redShips = [];
var blueShips = [];
var greenShips = [];
var planetImgs = [];
var Img = {};
var Img_prgs = [0 /* Count of loaded images */, 0 /* Count of all images */]
var Img_loaded = false;
loadAllImages();
loadAllAudio();

function loadImage(name, src) {
	if (Img[name]) { console.error("Loading image twice: " + name); return; }
	Img[name] = new Image();
	Img[name].addEventListener("load", function(){
		Img_prgs[0]++
	});
	Img[name].src = src;
	Img_prgs[1]++;
}
function loadImageEnd() {
	let loaded = () => {
		if (Img_prgs[0] === Img_prgs[1]) {
			Img_loaded = true;
			EVERYTHING_LOADED = true
			return true
		} else
			return false
	}

	if (!loaded()) {
		let interval = setInterval(() => {
			if (loaded()) clearInterval(interval)
		}, 100)
	}
}
function loadShipImg(color, i) {
	if (color === "red") {
		redShips[i] = new Image();
		redShips[i].src = '/img/red/r' + (i + 1) + '.png';
	} else if (color === "blue") {
		blueShips[i] = new Image();
		blueShips[i].src = '/img/blue/b' + (i + 1) + '.png';
	} else {
		greenShips[i] = new Image();
		greenShips[i].src = '/img/green/g' + (i + 1) + '.png';
	}
}
function loadAllImages() {

	//misc
	loadImage("grad", '/img/grad.png');
	loadImage("fire", '/img/fire.png');
	loadImage("shockwave", "/img/shockwave.png");
	loadImage("booms", '/img/booms.png');

	// base stuff
	loadImage("rss", '/img/red/rss.png');
	loadImage("bss", '/img/blue/bss.png');
	loadImage("gss", '/img/green/gss.png');
	loadImage("mrss", '/img/red/mrss.png');
	loadImage("mbss", '/img/blue/mbss.png');
	loadImage("mgss", '/img/green/mgss.png');
	loadImage("rt", '/img/red/rt.png');
	loadImage("bt", '/img/blue/bt.png');
	loadImage("gt", '/img/green/gt.png');

	// asteroids
	loadImage("iron", '/img/space/iron.png');
	loadImage("aluminium", '/img/space/aluminium.png');
	loadImage("platinum", '/img/space/platinum.png');
	loadImage("silver", '/img/space/silver.png');
	loadImage("astUnderlayBlue", '/img/space/astUnderlayBlue.png');
	loadImage("astUnderlayRed", '/img/space/astUnderlayRed.png');
	loadImage("astUnderlayGreen", '/img/space/astUnderlayGreen.png');

	//planets
	loadImage("planetO", '/img/space/planetOverlay.png');
	loadImage("planetU", '/img/space/planetUnderlay.png');
	loadImage("planetUB", '/img/space/planetUnderlayBlue.png');
	loadImage("planetUR", '/img/space/planetUnderlayRed.png');
	loadImage("planetUG", '/img/space/planetUnderlayGreen.png');
	
	//HUD
	loadImage("grid", '/img/hud/grid.png');
	loadImage("spin", '/img/hud/spin.png');
	loadImage("bar1", '/img/hud/bar1.png');
	loadImage("bar2", '/img/hud/bar2.png');

	//weapons
	loadImage("redbullet", "/img/weapons/rb.png");
	loadImage("bluebullet", '/img/weapons/bb.png');
	loadImage("greenbullet", '/img/weapons/gb.png');
	loadImage("energyDisk", '/img/weapons/energyDisk.png');
	loadImage("photonOrb", '/img/weapons/photonOrb.png');
	loadImage("missile", '/img/weapons/missile.png');
	loadImage("torpedo", '/img/weapons/torpedo.png');
	loadImage("heavyMissile", '/img/weapons/heavyMissile.png');
	loadImage("empMissile", '/img/weapons/empMissile.png');
	loadImage("mine", '/img/weapons/mine.png');
	loadImage("grenade", '/img/weapons/grenade.png');
	loadImage("empMine", '/img/weapons/empMine.png');
	loadImage("laserMine", '/img/weapons/laserMine.png');
	loadImage("bigBullet", '/img/weapons/bigBullet.png');

	//space
	loadImage("vort", '/img/space/vort.png');
	loadImage("worm", '/img/space/worm.png');
	loadImage("spc", '/img/space/NewBackground.png');

	//baseGui
	loadImage("q", '/img/baseGui/q.png');
	loadImage("button", '/img/baseGui/button.png');
	loadImage("arrow", '/img/baseGui/arrow.png');

	//packs
	loadImage("pack", '/img/packs/pack.png');
	loadImage("ammo", '/img/packs/ammo.png');
	loadImage("bonus", '/img/packs/bonus.png');
	loadImage("life", '/img/packs/life.png');

	//arrows
	loadImage("yellowArrow", '/img/arrows/yellowArrow.png');
	loadImage("orangeArrow", '/img/arrows/orangeArrow.png');
	loadImage("greenArrow", '/img/arrows/greenArrow.png');
	loadImage("redArrow", '/img/arrows/redArrow.png');
	loadImage("blueArrow", '/img/arrows/blueArrow.png');
	loadImage("whiteArrow", '/img/arrows/whiteArrow.png');
	loadImage("blackArrow", '/img/arrows/blackArrow.png');

	//ships
	for(var i = 0; i < 21; i++) loadShipImg("blue", i);
	for(var i = 0; i < 21; i++) loadShipImg("red", i);
	for(var i = 0; i < 21; i++) loadShipImg("green", i);
	loadImageEnd();

	for (var i = 1; i < 6; i++) {
		planetImgs[i] = new Image();
		planetImgs[i].src = '/img/space/planets/pt' + i + '.jpg';	
	}
}

var achs = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
var bigNotes = [-1, -1, -1, -1];

function roll(v) {
	/*for (var i in dots) {
		var dot = dots[i];
		var dist = Math.sqrt(dot.y * dot.y + dot.z * dot.z);
		var ang = Math.atan2(dot.z, dot.y) + v / 28;
		var cos = Math.cos(ang) * dist;
		var sin = Math.sin(ang) * dist;
		dot.y = cos;
		dot.z = sin;
	}*/
	for (var i = 0; i < mapSz+1; i++) {
		for (var j = 0; j < mapSz+1; j++) {
			var dot = sectorPoints[i][j];
			var dist = Math.sqrt(dot.y * dot.y + dot.z * dot.z);
			var ang = Math.atan2(dot.z, dot.y) + v / 28;
			var cos = Math.cos(ang) * dist;
			var sin = Math.sin(ang) * dist;
			dot.y = cos;
			dot.z = sin;
		}
	}
}
function spin(v) {
	/*for (var i in dots) {
		var dot = dots[i];
		var dist = Math.sqrt(dot.x * dot.x + dot.z * dot.z);
		var ang = Math.atan2(dot.z, dot.x) + v / 28;
		var cos = Math.cos(ang) * dist;
		var sin = Math.sin(ang) * dist;
		dot.x = cos;
		dot.z = sin;
	}*/
	for (var i = 0; i < mapSz+1; i++) {
		for (var j = 0; j < mapSz+1; j++) {
			var dot = sectorPoints[i][j];
			var dist = Math.sqrt(dot.x * dot.x + dot.z * dot.z);
			var ang = Math.atan2(dot.z, dot.x) + v / 28;
			var cos = Math.cos(ang) * dist;
			var sin = Math.sin(ang) * dist;
			dot.x = cos;
			dot.z = sin;
		}
	}
}
function rotate(v) {
	/*for (var i in dots) {
		var dot = dots[i];
		var dist = Math.sqrt(dot.x * dot.x + dot.y * dot.y);
		var ang = Math.atan2(dot.y, dot.x) + v / 28;
		var cos = Math.cos(ang) * dist;
		var sin = Math.sin(ang) * dist;
		dot.x = cos;
		dot.y = sin;
	}*/
	for (var i = 0; i < mapSz+1; i++) {
		for (var j = 0; j < mapSz+1; j++) {
			var dot = sectorPoints[i][j];
			var dist = Math.sqrt(dot.x * dot.x + dot.y * dot.y);
			var ang = Math.atan2(dot.y, dot.x) + v / 28;
			var cos = Math.cos(ang) * dist;
			var sin = Math.sin(ang) * dist;
			dot.x = cos;
			dot.y = sin;
		}
	}
}
function center3D(xxp,yyp,zzp) {
	/*for (var i in dots) {
		dots[i].x-=xxp;
		dots[i].y-=yyp;
		dots[i].z-=zzp;
	}*/
	for (var i = 0; i < mapSz+1; i++) {
		for (var j = 0; j < mapSz+1; j++) {
			sectorPoints[i][j].x-=xxp;
			sectorPoints[i][j].y-=yyp;
			sectorPoints[i][j].z-=zzp;
		}
	}
}


function forceRefresh() {
	window.location.reload(true);
}
function getSectorName(inx, iny) {
	return String.fromCharCode(97 + inx).toUpperCase() + '' + (iny + 1);
}


function render() {

	if (dead) {
		ctx.globalAlpha = .02;
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.globalAlpha = 1;
		rDead();
		return;
	}
	if (docked) {
		autopilot = false;
		updateNotes();
		rInBase();
	}
	if (docked || (playersInfo == 0 && !(disguise > 0))) return;
	if (ops > 0 || clientLag >= 35) {
		rTexts(clientLag);
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
	var d = new Date();
	var lagTimer = d.getTime();
	ctx.font = '14px ShareTech';

	var time0 = -performance.now();
	canvas.width = canvas.width;
	renderBG();//Fast, surprisingly.
	var r = Math.floor(Math.random() * 25);
	var undoing = false;
	if (dmgTimer > 0) {
		rDmg(r);
		undoing = true;
	}
	if ((iron + platinum + aluminium + silver) / (ships[ship].capacity * c2) > .995) currAlert = mEng[1];

	var time1 = -performance.now();
	time0 -= time1;
	rStars(); // Laggy as shit. Everything up to this is fast.

	var time2 = -performance.now();
	time1 -= time2;
	rPlanets();
	rBases();

	var time3 = -performance.now();
	time2 -= time3;
	rAsteroids();
	rPacks();

	var time4 = -performance.now();
	time3 -= time4;
	rTrails();//Gets to .2-.25 in heavy drifting
	rPlayers();//fast
	if (disguise > 0) rSelfCloaked();

	var time5 = -performance.now();
	time4 -= time5;
	rBullets();//fast
	rBeams();//Fast
	rBlasts();
	rMissiles();//Fast
	rOrbs();//Fast
	rMines();//Fast
	rVorts();//Fast
	rBooms();//Fast

	var time6 = -performance.now();
	time5 -= time6;
	rSectorEdge();
	rEdgePointer();//Fast
	rNotes();//Fast
	rKillStreak();
	rBlackHoleWarning();
	if (self.quests != 0) rCurrQuest();
	rRaid();
	rWeapons();//fast
	rEMP();

	var time7 = -performance.now();
	time6 -= time7;
	rChat();//slow

	var time8 = -performance.now();
	time7 -= time8;
	r3DMap(120,120);//Performance unknown

	var time9 = -performance.now();
	time8 -= time9;
	rRadar();//Tolerable lag

	var timeA = -performance.now();
	time9 -= timeA;
	if (lb != 0) rLB();
	rExpBar();//Maybe a little slow
	//Everything past here is fast
	rVolumeBar();
	rEnergyBar();
	if (flash > 0) rFlash();
	rTut();
	if (undoing && hyperdriveTimer <= 0) undoDmg(r);
	if (afk) rAfk();
	if (isLocked) currAlert = mEng[132];
	if (currAlert !== '') rAlert();
	currAlert = '';
	rBigNotes();

	d = new Date();
	var cTime = d.getTime();
	clientLag = cTime - lagTimer;
	timeA += performance.now();
	var arr = [time0, time1, time2, time3, time4, time5, time6, time7, time8, time9, timeA];
	lagMath(arr);
	rTexts(clientLag);
	ops--;
}


//shop rendering
function rWeapons() {
	if (equipped === 0) return;
	if (equipped[1] == -2) return;
	ctx.save();
	ctx.globalAlpha = .5;
	ctx.fillStyle = 'black';
	ctx.strokeStyle = 'cyan';
	roundRect(w - 208, h - 432 + 8 * 16, 210, 12 * 16, { bl: 32, tl: 32 }, true, false);
	ctx.restore();

	ctx.font = "14px ShareTech";
	ctx.fillStyle = 'yellow';
	ctx.textAlign = 'right';
	ctx.globalAlpha = Math.max(weaponTimer--, 0) / 100 * .7 + .3;

	write(mEng[152], w - 80, h - 432 + (-1 + 10) * 16);
	write(mEng[151], w - 16, h - 432 + (-1 + 10) * 16);
	for (var i = 0; i < 10; i++) {
		ctx.fillStyle = scroll == i ? 'lime' : 'yellow';
		if (i >= ships[ship].weapons) ctx.fillStyle = "orange";
		if (ship < wepns[equipped[i]].Level) ctx.fillStyle = "red";
		if (typeof wepns[equipped[i]] !== "undefined") write(wepns[equipped[i]].name + ": " + ((i + 1) % 10), w - 80, h - 432 + (i + 10) * 16);
		if (equipped[i] > -1) write(ammoCodeToString(ammos[i]), w - 16, h - 432 + (i + 10) * 16);
	}

	ctx.globalAlpha = 1;
	ctx.fillStyle = 'yellow';
	badWeapon = (badWeapon < 1) ? 0 : (badWeapon - 1);
	ctx.font = (16 + badWeapon) + "px ShareTech";
	write(mEng[2], w - 16, h - 96);
	ctx.font = "14px ShareTech";
	ctx.textAlign = 'left';
}
function ammoCodeToString(code) {
	if (code >= 0) return code + "";
	if (code == -1) return mEng[153];
	if (code == -2) return mEng[154];
	else return "";
}
function r3DMap(xp, yp) {
	ctx.globalAlpha = 0.4;
	ctx.strokeStyle = 'white';
	ctx.fillStyle = 'black';
	ctx.lineWidth = 1;
	ctx.fillRect(xp - 104, yp - 104, 208, 208); // Draw map
	ctx.strokeRect(xp - 104, yp - 104, 208, 208); // Draw map
	ctx.fillStyle = 'white';
	ctx.globalAlpha = 1;
	/*for (var i in dots) {
		var dot = dots[i];
		var xx = xp + dot.x / mapZoom;
		var yy = yp + dot.y / mapZoom;
		ctx.fillRect(xx, yy, 1, 1);
	}*/
	if (hmap == 0 || typeof hmap[sx] === "undefined") return;

	//if ((hmt > 3 && pc === 'blue') || (hmt < -3 && pc === 'red')) currAlert = mEng[104]; // GREENTODO

	var c3dx, c3dy, c3dz;
	
	ctx.strokeStyle = 'gray';
	ctx.lineWidth = .5;

	var avgX = 0;
	var avgY = 0;
	var avgZ = 0;
	var avgi = 0;

	for (var i = 0; i < mapSz; i++) {
		for (var j = 0; j < mapSz; j++) {

			var dot1 = sectorPoints[i][j];
			var dot4 = sectorPoints[i+1][j+1];

			var cz = (dot1.z+dot4.z)/2;

			ctx.globalAlpha=.7//Math.min(1,48*square(square(square(-cz/800+.5))));

			//render lines
			var dot2 = sectorPoints[i][j+1];
			var dot3 = sectorPoints[i+1][j];
			var xx1 = dot1.x / mapZoom;
			var yy1 = dot1.y / mapZoom;
			var zz1 = dot1.z / mapZoom;
			var xx2 = dot2.x / mapZoom;
			var yy2 = dot2.y / mapZoom;
			var zz2 = dot2.z / mapZoom;
			var xx3 = dot3.x / mapZoom;
			var yy3 = dot3.y / mapZoom;
			var zz3 = dot3.z / mapZoom;
			var xx4 = dot4.x / mapZoom;
			var yy4 = dot4.y / mapZoom;
			var zz4 = dot4.z / mapZoom;
			ctx.beginPath();
			ctx.moveTo(xp+xx3, yp+yy3);
			ctx.lineTo(xp+xx1, yp+yy1);
			ctx.lineTo(xp+xx2, yp+yy2);
			ctx.lineTo(xp+xx4, yp+yy4);
			ctx.lineTo(xp+xx3, yp+yy3);
			ctx.closePath();

			var cx = (xx1+xx4)/2;
			var cy = (yy1+yy4)/2;

			avgX+=cx;
			avgY+=cy;
			avgZ+=cz;
			avgi++;

			if((i == sx && j == sy) || (i == quest.sx && j == quest.sy) || (i == quest.dsx && j == quest.dsy)){

				//Render wormhole
				/*
					if (va2 < 1.9) return;
					ctx.fillStyle = 'white';
					ctx.beginPath();
					ctx.arc(20 + 182 * bx, 20 + 182 * by, 4, 0, 2 * Math.PI, false);
					ctx.fill();

					ctx.fillStyle = 'black';
					ctx.beginPath();
					ctx.arc(20 + 182 * bx, 20 + 182 * by, 3, 0, 2 * Math.PI, false);
					ctx.fill();

					ctx.fillStyle = 'white';
					ctx.beginPath();
					ctx.arc(20 + 182 * bxo, 20 + 182 * byo, 4, 0, 2 * Math.PI, false);
					ctx.fill();
				*/

				//Highlight the player's sector
				ctx.lineWidth = 3;
				ctx.strokeStyle = ctx.fillStyle = (i == sx && j == sy) ? brighten(pc) : "yellow";
				ctx.stroke();
				ctx.lineWidth = .35;
				ctx.strokeStyle = 'gray';

				if (i == sx && j == sy) {
					var xxp1 = lerp(xx1,xx4,(px/sectorWidth+py/sectorWidth)/2)-cx; // these are just clever ways of using linear interpolation in a skew vector space
					var yyp1 = lerp(yy1,yy4,(px/sectorWidth+py/sectorWidth)/2)-cy; // the same can be done for the wormhole when i get to it
					//var zzp1 = lerp(zz1,zz4,(px/sectorWidth+py/sectorWidth)/2)-cz;
					var xxp2 = lerp(xx3,xx2,(-px/sectorWidth+1+py/sectorWidth)/2)-cx;
					var yyp2 = lerp(yy3,yy2,(-px/sectorWidth+1+py/sectorWidth)/2)-cy;
					//var zzp2 = lerp(zz3,zz2,(-px/sectorWidth+1+py/sectorWidth)/2)-cz;
					c3dx = cx+xxp1+xxp2;
					c3dy = cy+yyp1+yyp2;
					//c3dz = cz+zzp1+zzp2;
					ctx.fillRect(xp+c3dx-2, yp+c3dy-2, 4, 4);
				}
			}
			else ctx.stroke();

			if(baseMap2D[i][j]!==0){
				var img = colorSelect(baseMap2D[i][j], Img.mrss, Img.mbss, Img.mgss);
				ctx.drawImage(img, xp+cx-7, yp+cy-7, 15, 15);
			}

			//render heatmap
			var eachmt = hmap[i][j];
			ctx.fillStyle = "rgb("+(Math.floor(eachmt>>16)%0x100)+", "+(Math.floor(eachmt>>8)%0x100)+", "+(eachmt%0x100)+")";
			var alp = eachmt-Math.floor(eachmt);
			ctx.globalAlpha *= Math.sqrt(Math.min(1, alp))/2;
			ctx.fill();
		}
	}
	//center3D((avgX/avgi+c3dx)/2,(avgY/avgi+c3dy)/2,avgZ/avgi);
	ctx.globalAlpha = 1;
}
function rBuyShipWindow(){
	ctx.fillStyle = 'white';
	roundRect(rx + 16, ry + 256 - 16, 256, 256, 8, false, true);

	let d = new Date();
	var t = d.getMilliseconds() * 2 * Math.PI / 50000 + d.getSeconds() * 2 * Math.PI / 50 + d.getMinutes() * 2 * 60 * Math.PI / 50;
	var rendX = rx + 128 + 16;
	var rendY = ry + 128 * 3 - 16;
	var img = colorSelect(pc,redShips,blueShips,greenShips)[shipView];
	ctx.save();
	ctx.translate(rendX, rendY);
	ctx.rotate(-3 * t);
	if (shipView > rank) img = Img.q;
	ctx.drawImage(colorSelect(pc, Img.astUnderlayRed, Img.astUnderlayBlue, Img.astUnderlayGreen), -img.width/2, -img.height/2, img.width, img.height);
	ctx.drawImage(img, -img.width / 2, -img.height / 2);
	ctx.restore();

	ctx.textAlign = "center";
	ctx.fillStyle = 'yellow';
	ctx.font = '20px ShareTech';
	write(mEng[24], rx + 128 + 16, ry + 256 + 16);
	ctx.font = '14px ShareTech';
	write(mEng[25] + " " + shipView, rx + 128 + 16, ry + 256 + 56);
	write(pc === "red" ? ships[shipView].nameA : ships[shipView].nameH, rx + 128 + 16, ry + 256 + 40);
	if (shipView > rank) ctx.fillStyle = "red";
	ctx.fillStyle = 'yellow';
	if (ships[shipView].price > money + worth || shipView > rank) ctx.fillStyle = "red";
	else if (seller == 100) ctx.fillStyle = "lime";
	if (shipView != ship) write("$" + (ships[shipView].price - worth) + " " + mEng[14], rendX, rendY + 96);

	ctx.textAlign = "left";
	ctx.fillStyle = "yellow";
	write(mEng[27] + (shipView > rank ? mEng[26] : ships[shipView].thrust), rx + 256 + 32, ry + 256 + 11 * 16);
	write(mEng[28] + (shipView > rank ? mEng[26] : ships[shipView].agility), rx + 256 + 32, ry + 256 + 12 * 16);
	write(mEng[29] + (shipView > rank ? mEng[26] : ships[shipView].health), rx + 256 + 32, ry + 256 + 13 * 16);
	write(mEng[30] + (shipView > rank ? mEng[26] : ships[shipView].weapons), rx + 256 + 32, ry + 256 + 14 * 16);
	write(mEng[31] + (shipView > rank ? mEng[26] : ships[shipView].capacity), rx + 256 + 32, ry + 256 + 15 * 16);

	if (shipView < ships.length) ctx.drawImage(Img.arrow, rendX + 128 - 48, rendY - 16);
	if (shipView > 0) {
		ctx.save();
		ctx.translate(rendX - 128 + 32, rendY);
		ctx.rotate(Math.PI);
		ctx.drawImage(Img.arrow, - 16, - 16);
		ctx.restore();
	}
}
function rOreShop(){
	var info = {};
	var mult1 = (myTrail % 16 == 2)?1.05:1;
	var mult1point5 = (myTrail % 16 == 2)?1.575:1.5;
	var mult2 = (myTrail % 16 == 2)?2.1:2;
	var allIronPrice = iron * (pc === "red" ? mult1 : mult2);
	var allSilverPrice = silver * mult1point5;
	var allPlatinumPrice = platinum * (pc === "blue" ? mult1 : mult2);
	var allAluminiumPrice = aluminium * mult1point5;
	info[4] = (iron > 0 ? mEng[133] : mEng[137]) + iron + " => $" + allIronPrice + " ($" + (pc === "red" ? mult1 : mult2) + " " + mEng[155] + ")";
	info[5] = (silver > 0 ? mEng[134] : mEng[138]) + silver + " => $" + allSilverPrice + " ($"+mult1point5+" " + mEng[155] + ")";
	info[6] = (platinum > 0 ? mEng[135] : mEng[139]) + platinum + " => $" + allPlatinumPrice + " ($" + (pc === "blue" ? mult1 : mult2) + " " + mEng[155] + ")";
	info[7] = (aluminium > 0 ? mEng[136] : mEng[140]) + aluminium + " => $" + allAluminiumPrice + " ($"+mult1point5+" " + mEng[155] + ")";

	ctx.strokeStyle = 'white';
	ctx.lineWidth = 1;
	ctx.font = '14px ShareTech';
	ctx.textAlign = "left";

	for (var i = 4; i < 8; i++) {
		ctx.fillStyle = ((i + 1 == seller) ? 'lime' : 'yellow');
		write(info[i], rx + 256 - 32, ry - 32 + i * 32);
	}

	ctx.fillStyle = seller == 610 ? 'lime' : 'yellow';
	write(mEng[12] + " => $" + (allAluminiumPrice + allPlatinumPrice + allSilverPrice + allIronPrice), rx + 256 + 48, ry + 76); // Sell all

	let d = new Date();
	var stime = Math.floor((d.getMilliseconds() / 1000 + d.getSeconds()) / 60 * 1024) % 64;
	var spx = (stime % 8) * 128;
	var Secret = Math.floor((stime / 8) % 4) * 128;
	ctx.save();
	ctx.translate(rx + 128 - 16, ry + (256 - 32 - 40) / 2 + 40);
	ctx.drawImage(Img.silver, spx, Secret, 128, 128, -64, -64, 128, 128);
	ctx.restore();
}
function rBuyLifeShop(){
	ctx.fillStyle = 'yellow';
	ctx.textAlign = 'right';
	write(mEng[13] + lives + " ($" + expToLife() + ") ", rx + 768 - 16 - ctx.measureText(mEng[14]).width, ry + 512 - 16);
	ctx.fillStyle = (lives >= 20 || money < expToLife()) ? 'red' : ((seller == 611) ? 'lime' : 'yellow');
	write(mEng[14], rx + 768 - 16, ry + 512 - 16);
	ctx.textAlign = 'left';
}
function rWeaponsInShop(){
	ctx.fillStyle = 'yellow';
	ctx.font = "24px ShareTech";
	write(mEng[15], rx + 256 + 32, ry + 256 - 16);
	ctx.textAlign = 'center';
	write(mEng[16], rx + 256, ry + 64 + 8);
	ctx.textAlign = 'left';
	ctx.font = "14px ShareTech";
	ctx.fillStyle = seller == 601 ? "lime" : "yellow";
	write(mEng[18], rx + 512 - 64, ry + 256 - 16);
	ctx.fillStyle = 'yellow';
	for (var i = 0; i < 10; i++) {
		ctx.fillStyle = (seller - 10 == i) ? 'lime' : 'yellow';
		if (ships[shipView].weapons <= i) ctx.fillStyle = "orange";
		if (shipView < wepns[equipped[i]].level) ctx.fillStyle = "red";
		var tag = '	      ';
		if (equipped[i] == -1) tag = mEng[14] + (i != 9 ? '  ' : ' ');
		else if (equipped[i] > -1) tag = mEng[19] + (i != 9 ? ' ' : '');
		write(tag + (i + 1) + ": " + wepns[equipped[i]].name, rx + 256 + 32, ry + 256 + i * 16);
	}
}
function rShop() {

	rOreShop();

	rBuyLifeShop();

	rWeaponsInShop();

	rBuyShipWindow();

}
function rConfirm() {
	ctx.fillStyle = 'cyan';
	ctx.textAlign = 'center';
	ctx.font = '16px ShareTech';
	write(mEng[32] + wepns[equipped[confirmer]].name + mEng[33] + (wepns[equipped[confirmer]].price * .75) + mEng[34], rx + 128 * 3, ry + 128);
	ctx.font = '15px ShareTech';
	write(mEng[35], rx + 128 * 3, ry + 192);
	ctx.font = '14px ShareTech';
	ctx.textAlign = 'left';
}
function rQuests() {
	ctx.font = '14px ShareTech';
	ctx.textAlign = 'left';
	var mult = (myTrail % 16 == 2)?1.05:1;
	if (quest != 0) {
		ctx.fillStyle = 'cyan';
		ctx.textAlign = 'center';
		ctx.font = '30px ShareTech';
		write(mEng[36], rx + 128 * 3, ry + 128);
		ctx.font = '14px ShareTech';
		var desc = "";
		if (quest.type === 'Mining') desc = mEng[37] + quest.amt + mEng[38] + quest.metal + mEng[39] + getSectorName(quest.sx, quest.sy) + mEng[40];
		if (quest.type === 'Base') desc = mEng[41] + getSectorName(quest.sx, quest.sy) + mEng[40];
		if (quest.type === 'Delivery') desc = mEng[42] + getSectorName(quest.sx, quest.sy) + mEng[43] + getSectorName(quest.dsx, quest.dsy) + mEng[40];
		if (quest.type === 'Secret') desc = mEng[156] + getSectorName(quest.sx, quest.sy) + mEng[157];//mEng[44];
		if (quest.type === 'Secret2') desc = mEng[158] + getSectorName(quest.sx, quest.sy) + mEng[159] + secret2PlanetName + mEng[40];
		if (quest.type === 'Secret3') desc = mEng[160];
		write(desc, rx + 128 * 3, ry + 192);
		ctx.textAlign = 'left';
	} else
		for (var i in quests) {
			var xv = i < 5 ? 0 : 128 * 3;
			var questi = quests[i];
			var desc = "";
			ctx.fillStyle = i == seller - 300 ? 'lime' : 'yellow';
			if (questi.type == 'Mining') desc = mEng[37] + questi.amt + mEng[38] + questi.metal + mEng[39] + getSectorName(questi.sx, questi.sy) + mEng[40];
			if (questi.type == 'Base')
				if (rank > 6) desc = mEng[41] + getSectorName(questi.sx, questi.sy) + mEng[40];
				else desc = mEng[46];
			if (questi.type == 'Secret')
				if (rank > 14) desc = mEng[156] + getSectorName(questi.sx, questi.sy) + mEng[157];//mEng[44];
				else desc = mEng[46];
			if (questi.type == 'Delivery') desc = mEng[42] + getSectorName(questi.sx, questi.sy) + mEng[43] + getSectorName(questi.dsx, questi.dsy) + mEng[40];
			write(questi.type, xv + rx + 16, ry + 72 + i % 5 * 80);
			write(mEng[47] + mult*questi.exp + mEng[48] + Math.floor(questi.exp / ((questi.type === 'Mining' || questi.type === 'Delivery') ? 1500 : 4000)) + mEng[49], xv + rx + 16 + 16, ry + 72 + i % 5 * 80 + 16);
			wrapText(mEng[50] + desc, xv + rx + 16 + 16, ry + 72 + i % 5 * 80 + 32, 128 * 3 - 48, 16);
		}
}
function techPrice(x){ // money required to upgrade Tech
	return techEnergy(nextTechLevel(x))-techEnergy(x);
}
function techPriceForDowngrade(x){ // money required to upgrade Tech
	return Math.max(techEnergy(lastTechLevel(x))-techEnergy(x), -300000000);
}
function techEnergy(x){ // Net price of some tech level
	return Math.round(Math.pow(1024, x) / 1000) * 500;
}
function nextTechLevel(x){
	return Math.floor(x*8.+1)/8.;
}
function lastTechLevel(x){
	return Math.floor(x*8.-.001)/8.;
}
function rStats() {
	ctx.font = '14px ShareTech';
	ctx.textAlign = 'left';
	let d = new Date();
	var t = d.getMilliseconds() * 2 * Math.PI / 50000 + d.getSeconds() * 2 * Math.PI / 50 + d.getMinutes() * 2 * 60 * Math.PI / 50;

	var ore = iron + silver + platinum + aluminium;
	var upgradeCosts = 0;
	upgradeCosts += techEnergy(t2) + techEnergy(va2) + techEnergy(ag2) + techEnergy(c2) + techEnergy(mh2) + techEnergy(e2)*8;
	var achievements = 0;
	for (var i in achs) if (achs[i]) achievements++;
	ctx.fillStyle = "yellow";
	write(mEng[161], rx + 16, ry + 512 - 16);
	ctx.font = "32px ShareTech";
	ctx.textAlign = "center";
	write(myName, rx + 192, ry + 96);
	ctx.font = "14px ShareTech";
	var activeGens = 0;
	if (ship >= wepns[20].level)
		for (var i = 0; i < ships[ship].weapons; i++)
			if (equipped[i] == 20) activeGens++;
	var eMult = e2;
	for (var i = 0; i < activeGens; i++) eMult *= 1.06;


	var stats = [mEng[20] + Number((ships[ship].thrust * t2).toPrecision(3)), mEng[22] + Number((ships[ship].capacity * c2).toPrecision(3)), mEng[23] + Number((ships[ship].health * mh2).toPrecision(3)), mEng[164] + Number((eMult).toPrecision(3)), (kills - baseKills) + mEng[51], baseKills + mEng[52], mEng[55] + Number((worth + upgradeCosts).toPrecision(3)), mEng[56] + Number((money + ore + worth + upgradeCosts).toPrecision(3)), Math.round(experience) + mEng[57], mEng[58] + rank, achievements + mEng[59]];

	for (var i = 0; i < stats.length; i++) write(stats[i], rx + 512 - 64, ry + 44 + 32 + i * 16);


	ctx.fillStyle = seller == 700 ? "yellow" : "red";
	write(mEng[165], rx + 512 + 128, ry + 44 + 64 - 1 * 16);
	if (achs[12]) {
		ctx.fillStyle = seller == 701 ? "yellow" : "red";
		write(mEng[166], rx + 512 + 128, ry + 44 + 64 + 1 * 16);
	} if (achs[24]) {
		ctx.fillStyle = seller == 702 ? "yellow" : "gold";
		write(mEng[167], rx + 512 + 128, ry + 44 + 64 + 3 * 16);
	} if (achs[36]) {
		ctx.fillStyle = seller == 703 ? "yellow" : "lightgray";
		write(mEng[168], rx + 512 + 128, ry + 44 + 64 + 5 * 16);
	} if (achs[47]) {
		ctx.fillStyle = seller == 704 ? "yellow" : "cyan";
		write(mEng[169], rx + 512 + 128, ry + 44 + 64 + 7 * 16);
	} if (false) {
		ctx.fillStyle = seller == 705 ? "yellow" : "cyan";
		write(mEng[170], rx + 512 + 128, ry + 44 + 64 + 9 * 16);
	}

	var rendX = rx + 192;
	var rendY = ry + 192;
	ctx.save();
	ctx.translate(rendX, rendY);
	ctx.rotate(-3 * t);
	var img = (pc==="red"?redShips:(pc==="blue"?blueShips:greenShips))[ship];

	ctx.drawImage(img, -img.width / 2, -img.height / 2);
	ctx.restore();

	//Upgrades
	ctx.fillStyle = "yellow";
	ctx.textAlign = "left";
	ctx.font = "24px ShareTech";
	write(mEng[17], rx + 64, ry + 256 + 64 + 16);
	ctx.fillStyle = "white";
	ctx.font = "12px ShareTech";
	ctx.drawImage(Img.button, rx + 64, ry + 416 - 64);
	ctx.drawImage(Img.button, rx + 192, ry + 416 - 64);
	ctx.drawImage(Img.button, rx + 64, ry + 416);
	ctx.drawImage(Img.button, rx + 192, ry + 416);
	ctx.drawImage(Img.button, rx + 320, ry + 416 - 64);
	ctx.drawImage(Img.button, rx + 320, ry + 416);
	ctx.textAlign = 'center';
	write("Thrust lvl " + ((t2-1)*8), rx + 64 + 54, ry + 416 - 64 + 14);
	write("Radar lvl " + ((va2-1)*8), rx + 192 + 54, ry + 416 - 64 + 14);
	write("Cargo lvl " + ((c2-1)*8), rx + 64 + 54, ry + 416 + 14);
	write("Hull lvl " + ((mh2-1)*8), rx + 192 + 54, ry + 416 + 14);
	write("Energy lvl " + ((e2-1)*8), rx + 320 + 54, ry + 416 - 64 + 14);
	write("Agility lvl " + ((ag2-1)*8), rx + 320 + 54, ry + 416 + 14);
	
	//upgrades
	ctx.fillStyle = (seller == 200) ? "lime" : "white";
	write("[+] $" + techPrice(t2), rx + 64 + 54, ry + 416 - 64 + 28);
	ctx.fillStyle = (seller == 201) ? "lime" : "white";
	write("[+] $" + techPrice(va2), rx + 192 + 54, ry + 416 - 64 + 28);
	ctx.fillStyle = (seller == 202) ? "lime" : "white";
	write("[+] $" + techPrice(c2), rx + 64 + 54, ry + 416 + 28);
	ctx.fillStyle = (seller == 203) ? "lime" : "white";
	write("[+] $" + techPrice(mh2), rx + 192 + 54, ry + 416 + 28);
	ctx.fillStyle = (seller == 204) ? "lime" : "white";
	write("[+] $" + techPrice(e2)*8, rx + 320 + 54, ry + 416 - 64 + 28);
	ctx.fillStyle = (seller == 205) ? "lime" : "white";
	write("[+] $" + techPrice(ag2), rx + 320 + 54, ry + 416 + 28);

	//downgrades
	ctx.fillStyle = (seller == 206) ? "lime" : "white";
	if(t2 >1) write("[-] $" + -techPriceForDowngrade(t2), rx + 64 + 54, ry + 416 - 64 + 42);
	ctx.fillStyle = (seller == 207) ? "lime" : "white";
	if(va2>1) write("[-] $" + -techPriceForDowngrade(va2), rx + 192 + 54, ry + 416 - 64 + 42);
	ctx.fillStyle = (seller == 208) ? "lime" : "white";
	if(c2 >1) write("[-] $" + -techPriceForDowngrade(c2), rx + 64 + 54, ry + 416 + 42);
	ctx.fillStyle = (seller == 209) ? "lime" : "white";
	if(mh2>1) write("[-] $" + -techPriceForDowngrade(mh2), rx + 192 + 54, ry + 416 + 42);
	ctx.fillStyle = (seller == 210) ? "lime" : "white";
	if(e2 >1) write("[-] $" + -techPriceForDowngrade(e2)*8, rx + 320 + 54, ry + 416 - 64 + 42);
	ctx.fillStyle = (seller == 211) ? "lime" : "white";
	if(ag2>1) write("[-] $" + -techPriceForDowngrade(ag2), rx + 320 + 54, ry + 416 + 42);
}
function rAchievements() {
	ctx.save();
	ctx.fillStyle = "yellow";
	ctx.font = "14px ShareTech";
	ctx.textAlign = "center";
	for (var i = 0; i < achs.length; i++) {
		if (i < 13) ctx.fillStyle = achs[i] ? "red" : "pink";
		else if (i < 25) ctx.fillStyle = achs[i] ? "gold" : "lime";
		else if (i < 37) ctx.fillStyle = achs[i] ? "lightgray" : "white";
		else ctx.fillStyle = achs[i] ? "cyan" : "yellow";
		if (achs[i]) {
			ctx.font = "11px ShareTech";
			write(jsn.achNames[i].split(":")[1], rx + 768 * (1 + (i % 5) * 2) / 10, ry + 20 + 40 * Math.floor(i / 5) + 60);
		}
		ctx.font = "15px ShareTech";
		write(achs[i] ? jsn.achNames[i].split(":")[0] : mEng[172], rx + 768 * (1 + (i % 5) * 2) / 10, ry + 8 + 40 * Math.floor(i / 5) + 60);
	}
	ctx.restore();
}
function rHelp() {
	ctx.textAlign = "center";
	ctx.font = "26px ShareTech";
	var data = [mEng[62], mEng[63], mEng[64], mEng[65], mEng[66], mEng[67], mEng[68]];
	for (var i = 0; i < 3; i++)
		for (var j = 0; j < 2; j++) {
			ctx.fillStyle = (seller == 500 + i + j * 4) ? "lime" : "yellow";
			var rendX = rx + 128 + i * 256, rendY = ry + 40 + j * (512 - 40) * 2 / 3 + (512 - 40) / 6;
			write(data[i + j * 4], rendX, rendY);
		}
	ctx.fillStyle = (seller == 503) ? "lime" : "yellow";
	var rendX = rx + 384, rendY = ry + 40 + (512 - 40) / 3 + (512 - 40) / 6;
	write(data[3], rendX, rendY);
	ctx.textAlign = "left";
	ctx.font = "14px ShareTech";
}
function rWeaponStore() {
	ctx.font = '14px ShareTech';
	ctx.textAlign = "right";
	ctx.fillStyle = 'yellow';

	write(mEng[5] + Math.floor(money), rx + 128 * 6 - 16, ry + 64);
	ctx.textAlign = "center";
	ctx.font = '24px ShareTech';
	write(mEng[15], rx + 128 * 3, ry + 68);
	ctx.textAlign = "left";
	ctx.font = '14px ShareTech';
	//R to return to shop
	for (var i = 0; i < wepns.length; i++) {
		var wx = rx + 4 + 240 * Math.floor(wepns[i].order / Math.ceil(wepns.length / 3));
		var wy = ry + 40 + 32 + (wepns[i].order % Math.ceil(wepns.length / 3) + 2) * 16;
		var buyable = wepns[i].price > money ? "orange" : "yellow";
		if (ship < wepns[i].level) buyable = "red";

		var starCol = "white";
		if (wepns[i].type === "Gun") starCol = "red";
		if (wepns[i].type === "Missile") starCol = "orange";
		if (wepns[i].type === "Orb") starCol = "tan";
		if (wepns[i].type === "Beam") starCol = "lime";
		if (wepns[i].type === "Blast") starCol = "green";
		if (wepns[i].type === "Mine") starCol = "blue";
		if (wepns[i].type === "Misc") starCol = "purple";
		ctx.fillStyle = starCol;

		write("*", wx, wy);
		ctx.fillStyle = seller - 20 == i ? 'lime' : buyable;
		write(mEng[69] + ('$' + wepns[i].price + '         ').substring(0, 9) + wepns[i].name, wx + 11, wy);
		if (seller - 20 == i) rWeaponStats(i);
	}
}
function rWeaponStats(i) {
	ctx.font = '14px ShareTech';
	write(wepns[i].name, rx + 32, ry + 364 + 16 * 1);
	wrapText(wepns[i].desc, rx + 32, ry + 364 + 16 * 2, 128 * 6 - 64, 16);

	write("Type   : " + wepns[i].type, rx + 32, ry + 364 + 16 * 5);
	write(mEng[71] + (wepns[i].range == -1 ? mEng[206] : (wepns[i].range + " Meters")), rx + 32, ry + 364 + 16 * 6);
	write(mEng[72] + (wepns[i].damage == -1 ? mEng[206] : wepns[i].damage), rx + 32, ry + 364 + 16 * 7);
	write(mEng[73] + (wepns[i].speed == -1 ? mEng[206] : wepns[i].speed), rx + 32, ry + 364 + 16 * 8);
	write(mEng[74] + (wepns[i].charge == -1 ? mEng[206] : ((wepns[i].charge / 25) + mEng[75])), rx + 256 + 32, ry + 364 + 16 * 6);
	write(mEng[173] + ammoCodeToString(wepns[i].ammo), rx + 256 + 32, ry + 364 + 16 * 7);
	write(mEng[174] + wepns[i].level, rx + 256 + 32, ry + 364 + 16 * 8);

	if (actuallyBuying) {
		ctx.fillStyle = wepns[i].price > money ? "orange" : "limeq";
		var buyText = wepns[i].price > money ? mEng[76] : mEng[77];
		ctx.font = '24px ShareTech';
		write(buyText, rx + 512 + 16, ry + 256 + 100 + 16 * 7);
	}
	ctx.font = '14px ShareTech';
}
function rBaseGui() {

	ctx.lineWidth = 2;
	ctx.textAlign = "right";
	ctx.fillStyle = 'yellow';
	var info = {};
	info[0] = mEng[3] + getSectorName(sx, sy);
	info[1] = mEng[5] + Math.floor(money);
	for (var i = 0; i < 2; i++) write(info[i], w - (guest ? 16 : 278), 16 + i * 16);

	ctx.font = '14px ShareTech';
	ctx.lineWidth = 2;
	baseTick++;
	//roll(sinLow((baseTick % 3142) / 100.) / 16);
	//spin(cosLow((baseTick % 3142) / Math.PI / 50) / 16);
	var tabs = {};
	tabs[0] = mEng[142];
	tabs[1] = mEng[143];
	tabs[2] = mEng[144];
	tabs[3] = mEng[145];
	tabs[4] = mEng[146];

	infoBox(rx, ry + 44, 768, 512 - 44, "black", "white");

	ctx.textAlign = "center";
	for (var i = 0; i < 5; i++) // Fill Tabs In
		infoBox(rx + i * 768/5 + 8, ry + 4, 768/5-8, 32, (tab == i) ? 'darkgray' : 'black', "white");
	ctx.fillStyle = 'white';
	for (var i = 0; i < 5; i++) // Write tab names
		write(tabs[i], rx + (i * 768/5 + 768/10), ry + 23);

	ctx.fillStyle = 'yellow';
	ctx.textAlign = "right";
	ctx.font = "18px ShareTech";
	write(mEng[78], rx + 768 - 16, ry + 512 + 24);
	ctx.font = "14px ShareTech";
	ctx.textAlign = "left";
	//ctx.drawImage(Img.baseOutline, rx - 4, ry - 4);
	r3DMap(120,120);
}
function wrapText(text, x, y, maxWidth, lineHeight) {
	var words = text.split(' ');
	var line = '';

	for (var n = 0; n < words.length; n++) {
		var testLine = line + words[n] + ' ';
		var metrics = ctx.measureText(testLine);
		var testWidth = metrics.width;
		if (testWidth > maxWidth && n > 0) {
			write(line, x, y);
			line = words[n] + ' ';
			y += lineHeight;
		}
		else line = testLine;
	}
	write(line, x, y);
}

function clearBullets() {
	for (var i in bullets) delete bullets[i];
	for (var i in data.pack) bullets[data.pack[i].id] = data.pack[i];
}

// socket error handling
socket.on('connect_error', function (error) {
	if (!login) {
		alert("Failed to connect to the Torn servers. This probably either means they are down or your firewall is blocking the request. " + error);
		socket.close();
		return;
	}

	alert("There's been an issue and your connection to Torn has been interrupted. You should be able to reload and get back right into the game. " + error);
	socket.close();
});

//packet handling
socket.on('posUp', function (data) {
	if (sx != data.sx || sy != data.sy) playAudio("sector", 1);
	planetTimerSec = data.planetTimer / 25;
	energy = data.energy;
	sx = data.sx;
	sy = data.sy;
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
	afkTimer--;
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
	clearBullets();
});

socket.on('update', function(data) {
	++uframes;
	++tick;
	energy = data.energy;
	isLocked = data.isLocked;
	charge = data.charge;

	var delta = data.state;

	for (var index = 0; index < delta.players.length; ++index) {
		player_update(delta.players[index]);
	}

	for (var index = 0; index < delta.vorts.length; ++index) {
		vort_update(delta.vorts[index]);
	}

	for (var index = 0; index < delta.mines.length; ++index) {
		mine_update(delta.mines[index]);
	}

	for (var index = 0; index < delta.beams.length; ++index) {
		beam_update(delta.beams[index]);
	}

	for (var index = 0; index < delta.blasts.length; ++index) {
		blast_update(delta.blasts[index]);
	}

	for (var index = 0; index < delta.asteroids.length; ++index) {
		asteroid_update(delta.asteroids[index]);
	}

	for (var index = 0; index < delta.missiles.length; ++index) {
		missile_update(delta.missiles[index]);
	}

	for (var index = 0; index < delta.packs.length; ++index) {
		pack_update(delta.packs[index]);
	}

	for (var index = 0; index < delta.orbs.length; ++index) {
		orb_update(delta.orbs[index]);
	}

	if (delta.base !== undefined) {
		base_update(delta.base);
	}

	planetTimerSec = data.planetTimer / 25;

	updateBooms();
	updateNotes();
	updateBullets();
	updateTrails();
	empTimer--;
	gyroTimer--;
	afkTimer--;
	killStreakTimer--;
});

socket.on('player_create', function(data) {
	playersInfo[data.id] = data;
});

function player_update(data) {
	var id = data.id;
	var delta = data.delta;
	// We just changed sectors or are just loading in
	if (playersInfo[id] === undefined) return;

	for (var d in delta) {
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

socket.on('player_delete', function(data) {
	delete playersInfo[data];
});

socket.on('vort_create', function(data) {
	vortsInfo[data.id] = data.pack;
});

function vort_update(data) {
	var id = data.id;
	if (vortsInfo[id] === undefined) return;
	var delta = data.delta;

	for (var d in delta) {
		vortsInfo[id][d] = delta[d];
	}
}

socket.on('vort_delete', function (data) {
	delete vortsInfo[data];
});

socket.on('mine_create', function (data) {
	minesInfo[data.id] = data.pack;
});

function mine_update(data) {
	var id = data.id;
	if (minesInfo[id] === undefined) return;

	var delta = data.delta;

	for (var d in delta) {
		minesInfo[id][d] = delta[d];
	}
}

socket.on('mine_delete', function (data) {
	delete minesInfo[data];
});

socket.on('pack_create', function (data) {
	packsInfo[data.id] = data.pack;
});

function pack_update(data) {
	var id = data.id;
	if (packsInfo[id] === undefined) return;

	var delta = data.delta;

	for (var d in delta) {
		packsInfo[id][d] = delta[d];
	}
}

socket.on('pack_delete', function (data) {
	delete packsInfo[data];
});

socket.on('beam_create', function (data) {
	beamsInfo[data.id] = data.pack;
});

function beam_update(data) {
	var id = data.id;
	if (beamsInfo[id] === undefined) return;

	var delta = data.delta;

	for (var d in delta) {
		beamsInfo[id][d] = delta[d];
	}
}

socket.on('beam_delete', function (data) {
	delete beamsInfo[data];
});

socket.on('blast_create', function (data) {
	blastsInfo[data.id] = data.pack;
});

function blast_update(delta) {
	var id = delta.id;
	if (blastsInfo[id] === undefined) return;

	var delta = data.delta;

	for (var d in delta) {
		blastsInfo[id][d] = delta[d];
	}
}

socket.on('blast_delete', function (data) {
	delete blastsInfo[data];
});

socket.on('base_create', function (data) {
	basesInfo = data;
});

function base_update(data) {
	if (data === undefined || data.delta === undefined) return;
	var delta = data.delta;

	if (basesInfo === 0) return;

	for (var d in delta) {
		basesInfo[d] = delta[d];
	}
}

socket.on('base_delete', function (data) {
	basesInfo = undefined;
});

socket.on('asteroid_create', function (data) {
	astsInfo[data.id] = data;
});

socket.on('pong', (latency) => {
	nLag = latency;
});

function asteroid_update (data) {
	var id = data.id;

	if (astsInfo[id] === undefined) return;
	var delta = data.delta;

	for (var d in delta) {
		astsInfo[id][d] = delta[d];
	}
}

socket.on('asteroid_delete', function (data) {
	delete astsInfo[data];
});

socket.on('orb_create', function (data) {
	orbsInfo[data.id] = data.pack;
});

function orb_update (data) {
	var id = data.id;
	if (orbsInfo[id] === undefined) return;
	var delta = data.delta;

	for (var d in delta) {
		orbsInfo[id][d] = delta[d];
	}
}

socket.on('orb_delete', function (data) {
	delete orbsInfo[data];
});

socket.on('missile_create', function (data) {
	missilesInfo[data.id] = data.pack;
});

function missile_update (data) {
	var id = data.id;
	if (missilesInfo[id] === undefined) return;

	var delta = data.delta;

	for (var d in delta) {
		missilesInfo[id][d] = delta[d];
	}
}

socket.on('missile_delete', function (data) {
	delete missilesInfo[data];
});

function rInBase() {
	tick++;
	canvas.width = canvas.width;
	renderBG();
	rStars();
	rChat();
	rBaseGui();
	if (tab != -1) ReactRoot.turnOffRegister("LoginOverlay");
	switch (tab) {
		case 0:
			rShop();
			break;
		case 1:
			rQuests();
			break;
		case 2:
			rStats();
			break;
		case 3:
			rAchievements();
			break;
		case 4:
			rHelp();
			break;
		case 7:
			rWeaponStore();
			break;
		case 8:
			rConfirm();
			break;
		default:
			break;
	}
	if (savedNote-- > 0 && !guest)
		rSavedNote();
	if (tab == -1) rCreds();
	if (afk) rAfk();
	if (self.quests != 0) rCurrQuest();
	if (lb != 0) rLB();
	rRaid();
	updateBullets();
	rTut();
	rVolumeBar();
	rBigNotes();
}
socket.on('chat', function (data) {

	// Optimization: Don't do expensive string manipulation if nobody is in the mute list
	if (clientmutes.size == 0 || !data.msg.includes(":")) {
		_chat(data);
		return;
	}

	var header = data.msg.split(":")[0];
	var chatName = header.split("`")[2]; // normal chat
	if(header.includes("\[PM\] ")) chatName = header.split("\[PM\]")[1]; // pms
	chatName = chatName.replace(/[^0-9a-zA-Z]/g, '');

	if (chatName !== undefined) {
		chatName = chatName.trim();
		// If they're muted, don't chat!
		for (var mut in clientmutes) {
			if (mut.localeCompare(chatName, undefined, { sensitivity: 'accent'}) == 0) return;
		}
	}
	
	_chat(data);
});
// Extracting so we can use it locally
function _chat(data) {

	if (data.msg.includes("`~")) {
		var find1 = getPosition(data.msg, "`~", 1);
		var find2 = getPosition(data.msg, "`~", 2);

		if (find1 == -1 || find2 == -1) return;

		var num = parseFloat(data.msg.substring(find1 + 2, find2));
		data.msg = data.msg.replace("`~" + num + "`~", wepns[num].name);
	}

	for (var i = chatLength; i > 0; i--) messages[i] = messages[i - 1];

	messages[0] = data.msg;
	chatScroll = 0;
	preProcessChat();
};

socket.on('mute', function (data) {
	clientmutes[data.player] = 1;
});
socket.on('unmute', function (data) {
	delete clientmutes[data.player];
});
function getPosition(string, subString, index) {
	return string.split(subString, index).join(subString).length;
}

socket.on('newBullet', function (data) {
	bullets[data.id] = data;
	bullets[data.id].tick = 0;
});
socket.on('delBullet', function (data) {
	delete bullets[data.id];
});

socket.on('AFK', function (data) {
	if (data.t == 0) {
		afk = true;
		rAfk();
	} else if (data.t == 25 * 90) afkTimer = 25 * 90;
});
socket.on('invalidCredentials', function (data) {
	credentialState = 1;
});

socket.on('outdated', function() {
	credentialState = 20;
});
socket.on('loginSuccess', function (data) {
	// Cleanup bullets from homepage
	for (var i in bullets) delete bullets[i];
	playAudio("music1", .5);
	credentialState = 0;
	ReactRoot.turnOffDisplay("LoginOverlay");
	ReactRoot.init({ value: "" });
	autopilot = false;
	login = true;
	myId = data.id;
});
socket.on('invalidReg', function (data) {
	credentialState = data.reason;
});
socket.on('registered', function (data) {
	credentialState = 0;
	ReactRoot.turnOffRegister("LoginOverlay");
	guest = false;
	textIn = 0;
	autopilot = false;
	tab = 0
});
socket.on('lored', function (data) {
	// Cleanup bullets from homepage
	for (var i in bullets) delete bullets[i];
	credentialState = 0;
	pc = data.pc;
	ReactRoot.turnOffDisplay("LoginOverlay");
	lore = true;
});
socket.on('guested', function (data) {
	credentialState = 0;
	ReactRoot.turnOffDisplay("LoginOverlay");
	login = true;
	guest = true;
	autopilot = false;
	myId = data.id;
	tab = 0;
});

socket.on('you', function (data) {
	killStreak = data.killStreak;
	killStreakTimer = data.killStreakTimer
	myName = data.name;
	pc = data.color;
	money = data.money;
	kills = data.kills;
	baseKills = data.baseKills;
	iron = data.iron;
	aluminium = data.aluminium;
	platinum = data.platinum;
	silver = data.silver;
	ship = data.ship;
	experience = data.experience;
	rank = data.rank;
	myTrail = data.trail;
	t2 = Math.round(1000 * data.t2) / 1000;
	va2 = Math.round(1000 * data.va2) / 1000;
	ag2 = Math.round(1000 * data.ag2) / 1000;
	c2 = Math.round(1000 * data.c2) / 1000;
	mh2 = Math.round(1000 * data.mh2) / 1000;
	e2 = Math.round(1000 * data.e2) / 1000;
	if (data.points >= 0 && data.points < 1000) // prevents undefined on base
		points = data.points;
});
socket.on('weapons', function (data) {
	var diff = false;
	for (var i in equipped)
		if (equipped[i] != data.weapons[i])
			diff = true;
	equipped = data.weapons;
	worth = data.worth;
	ammos = data.ammos;
	if (docked && diff)
		playAudio("money", 1);
});
socket.on('sound', function (data) {
	if (data.file.includes("boom")) {
		if (data.file === "bigboom") flash = 1;
		booms[Math.random()] = { x: data.x, y: data.y, time: 0, shockwave: data.file === "bigboom" };
		for (var i = 0; i < 5; i++) boomParticles[Math.random()] = { x: data.x, y: data.y, angle: Math.random() * 6.28, time: -1, dx: data.dx / 1.5, dy: data.dy / 1.5 };
	}
	var dx = (px - data.x) / 1000;
	var dy = (py - data.y) / 1000;
	var dist = Math.hypot(Math.abs(dx) + 10, Math.abs(dy) + 10);
	var vol = .6 / dist;
	if (data.file === "hyperspace") {
		hyperdriveTimer = 200;
		vol = 2;
	}
	playAudio(data.file, vol);
});
socket.on('equip', function (data) {
	scroll = data.scroll;
	weaponTimer = 100;
});
socket.on('note', function (data) {
	notes[Math.random()] = { msg: data.msg, x: data.x - 16 + (data.local ? -px : Math.random() * 32), y: data.y - 16 + (data.local ? -py : Math.random() * 32), time: 0, strong: false, local: data.local };
});
socket.on('strong', function (data) {
	notes[Math.random()] = { msg: data.msg, x: data.x + (data.local ? -px : 0), y: data.y - 128 + (data.local ? -py : 0), time: 0, strong: true, local: data.local };
});
socket.on('spoils', function (data) {
	data.amt = Math.round(data.amt);
	if (data.amt == 0) return;
	var msg = "", x = 0, y = 0;
	if (data.type === "experience") {
		msg = mEng[175] + data.amt + mEng[176];
		x = w / 2 + 256;//next to exp bar
		y = h - 32;
	} else if (data.type === "money") {
		msg = "$" + data.amt;
		x = w - 512;
		y = 64;
	} else if (data.type === "ore") {
		msg = mEng[175] + data.amt + mEng[177];
		x = w - 512;
		y = 96;
	} else if (data.type === "life") {
		msg = mEng[175] + data.amt + (data.amt > 1 ? mEng[178] : mEng[179]);
		x = w - 512;
		y = 128;
	}
	notes[Math.random()] = { spoils: true, msg: msg, x: x, y: y, time: 0, strong: true, local: data.local };
});
socket.on('online', function (data) {
	bb = data.bb;
	rb = data.rb;
	bp = data.bp;
	rp = data.rp;
	bg = data.bg;
	rg = data.rg;
	sLag = data.lag;
});
socket.on('emp', function (data) {
	empTimer = data.t;
});
socket.on('gyro', function (data) {
	gyroTimer = data.t;
});
socket.on('dmg', function (data) {
	dmgTimer = 15;
});
socket.on('refresh', function (data) {
	forceRefresh();
});
socket.on('quests', function (data) {
	quests = data.quests;
});
socket.on('rank', function (data) {
	addBigNote([256,"Rank Up!","",""]);
});
socket.on('quest', function (data) {
	if(data.complete) addBigNote([256,"Quest Complete!","",""]);
	quest = data.quest;
});
socket.on('achievementsKill', function (data) {
	for (var a in data.achs){
		a = Number(a);
		if (achs[a] != data.achs[a]){
			achs[a] = data.achs[a];
			if(data.note && !guest) addBigNote([256,"Achievement Get!",jsn.achNames[a].split(":")[0],jsn.achNames[a].split(":")[1]]);
		}
	}
});
socket.on('achievementsCash', function (data) {
	for (var a in data.achs){
		a = Number(a);
		if (achs[a + 13] != data.achs[a]){
			achs[a + 13] = data.achs[a];
			if(data.note && !guest) addBigNote([256,"Achievement Get!",jsn.achNames[a+13].split(":")[0],jsn.achNames[a+13].split(":")[1]]);
		}
	}
});
socket.on('achievementsDrift', function (data) {
	for (var a in data.achs){
		a = Number(a);
		if (achs[a + 25] != data.achs[a]){
			achs[a + 25] = data.achs[a];
			if(data.note && !guest) addBigNote([256,"Achievement Get!",jsn.achNames[a+25].split(":")[0],jsn.achNames[a+25].split(":")[1]]);
		}
	}
});
socket.on('achievementsMisc', function (data) {
	for (var a in data.achs){
		a = Number(a);
		if (achs[a + 37] != data.achs[a]){
			achs[a + 37] = data.achs[a];
			if(data.note && !guest) addBigNote([256,"Achievement Get!",jsn.achNames[a+37].split(":")[0],jsn.achNames[a+37].split(":")[1]]);
		}
	}
});
socket.on('status', function (data) {
	shipView = ship;
	if (!docked && data.docked) savedNote = 40;
	if (docked != data.docked) textIn = 0;
	if(data.docked && !docked && guest && rank>0) {ReactRoot.turnOnRegister(""); tab = -1; keys[8] = false;}
	docked = data.docked;
	dead = data.state;
	lives = data.lives;
});
socket.on('planets', function (data) {
	planets = data.pack;
	if (quest != 0 && quest.type === "Secret2" && sx == quest.sx && sy == quest.sy)
		secret2PlanetName = planets.name;
});
socket.on('baseMap', function(data) {
	var baseMap = data.baseMap;
	for (var teamColor in baseMap){
		var thisMap = baseMap[teamColor];
		for (var i = 0; i < thisMap.length; i += 2)
			baseMap2D[thisMap[i]][thisMap[i+1]] = teamColor;
	}
});
socket.on('heatmap', function (data) {
	hmap = data.hmap;
	lb = data.lb;
	raidRed = data.raidRed;
	raidBlue = data.raidBlue;
	raidGreen = data.raidGreen;
	youi = parseInt(data.youi);
	if (data.youi > 15)
		lb[16] = { id: data.youi, name: myName, exp: experience, color: pc, rank: rank };
});
socket.on('worm', function (data) {
	bx = data.bx;
	by = data.by;
	bxo = data.bxo;
	byo = data.byo;
});
socket.on('raid', function (data) {
	raidTimer = data.raidTimer;
});
socket.on('kick', function (data) {
	alert(data.msg);
	socket.disconnect();
});


setInterval(function () {
	fps = frames;
	ups = uframes;
	uframes = frames = 0;
	let d = new Date();
	var time = d.getTime();
}, 1000);

setInterval(function () {
	raidTimer--;
	hyperdriveTimer--;
	w = window.innerWidth;
	h = window.innerHeight;
	if (canvas.width != w || canvas.height != h) {
		canvas.width = w;
		canvas.height = h;
	}
	rx = w / 2 - 128 * 3, ry = h / 4 - 128;
}, 40);

window.requestAnimationFrame(loop);

function loop() {
	render();
	textIn++;
	if (!login) {
		if (!EVERYTHING_LOADED) {
			ReactRoot.turnOffDisplay("LoginOverlay");
			rLoadingBar();
			setTimeout(render, 5);
			window.requestAnimationFrame(loop);
			return;
		} else ReactRoot.turnOnDisplay("LoginOverlay");

		if(homepageTimer++ == 0) loadAudio("music1", '/aud/music1.mp3');

		canvas.width = canvas.width;
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, w, h);

		//desmos this stuff or you wont have a clue whats going on vvv
		var softsign = Math.exp(homepageTimer/15);
		var scale = 1.885*(softsign/(1+softsign)-.47);
		if(homepageTimer>100)scale = 1;

		ctx.translate(w / 2, h / 2);
		ctx.scale(scale,scale);
		ctx.translate(-w / 2, -h / 2);

		let d = new Date();
		var t = d.getTime() / 6000;
		var loreZoom = 100*(Math.hypot(loreTimer,256)-256);
		px = (32 + Math.sin(t * 4)) * 3200;
		py = (32 + Math.cos(t * 5)) * 3200;

		scrx = (-w / 3 * Math.cos(4 * t));
		scry = ( h / 3 * Math.sin(5 * t));
		if(loreTimer>0) scry += loreZoom;

		renderBG(true);

		//Main hydra
		var vx = 4000 * Math.sin(5 * t), vy = 3200 * Math.cos(4 * t);
		var spd = Math.hypot(vx,vy) / 100.;
		var rnd = Math.random();
		var angleNow = -Math.atan2(5 * Math.sin(5 * t), 4 * Math.cos(4 * t));
		if (rnd < .05) {
			if(soundAllowed) playAudio("minigun", .1);
			bullets[rnd] = { x: px, y: py, vx: 12800 / 6000 * 20 * Math.cos(4 * t) + 40 * Math.cos(angleNow), vy: -16000 / 6000 * 20 * Math.sin(5 * t) + 40 * Math.sin(angleNow), id: rnd, angle: angleNow, wepnID: 0, color: 'red' };
		}

		var img = redShips[14];
		var pw = ships[14].width;
		var rendX = w / 2 + scrx;
		var rendY = h / 2 + scry;
		ctx.save();
		ctx.translate(rendX, rendY);
		ctx.drawImage(Img.astUnderlayRed, -pw, -pw, pw * 2, pw * 2);
		ctx.rotate(angleNow + Math.PI / 2);
		var fireWidth = 32 * 1.2 * Math.sqrt(pw / 64), fireHeight = spd * 1.4 * pw / 64 + Math.random() * pw / 25;
		if (spd > 0) ctx.drawImage(Img.fire, 0, Math.floor(Math.random() * 8) * 64, 64, 64, -fireWidth / 2, 0, fireWidth, fireHeight);
		ctx.restore();
		ctx.save();
		ctx.translate(rendX, rendY);
		ctx.rotate(angleNow + Math.PI / 2);
		ctx.drawImage(img, -pw / 2, -pw / 2);
		ctx.restore();





		//Extra ships
		for (var j = 0; j < 4; j++) {
			var pxn = (32 + Math.sin(t * 4 + .2)) * 3200 + CoherentNoise(t * 4 + j * 3 * Math.E) * 192;
			var pyn = (32 + Math.cos(t * 5 + .2)) * 3200 + CoherentNoise(t * 4 + j * 3 * Math.E + 61.23) * 192;
			for (var i in bullets) {
				var b = bullets[i];
				if (square(b.x - pxn) + square(b.y - pyn) < 64 * 32) {
					delete bullets[i];
					booms[Math.random()] = { x: b.x, y: b.y, time: 0, shockwave: false };
					//for (var i = 0; i < 5; i++) boomParticles[Math.random()] = { x: b.x, y: b.y, angle: Math.random() * 6.28, time: -1, dx: b.vx / 1.5, dy: b.vy / 1.5 };
					if(soundAllowed) playAudio("boom", .35);
				}
			}


			img = (j%2==0?blueShips:greenShips)[j * 2];
			pw = img.width;
			rendX = pxn - px + w / 2 + scrx;
			rendY = pyn - py + h / 2 + scry;
			ctx.save();
			ctx.translate(rendX, rendY);
			ctx.drawImage((j%2==0?Img.astUnderlayBlue:Img.astUnderlayGreen), -pw, -pw, pw * 2, pw * 2);
			angleNow = -Math.atan2(5 * Math.sin(5 * t), 4 * Math.cos(4 * t));
			ctx.rotate(angleNow + Math.PI / 2);
			fireWidth = 32 * 1.2 * Math.sqrt(pw / 64), fireHeight = spd * 1.4 * pw / 64 + Math.random() * pw / 25;
			if (spd > 0) ctx.drawImage(Img.fire, 0, Math.floor(Math.random() * 8) * 64, 64, 64, -fireWidth / 2, 0, fireWidth, fireHeight);
			ctx.restore();
			ctx.save();
			ctx.translate(rendX, rendY);
			ctx.rotate(angleNow + Math.PI / 2);
			ctx.drawImage(img, -pw / 2, -pw / 2);
			ctx.restore();
		}
		for (var i in bullets) if (Math.random() < .01) delete bullets[i];
		rBullets();
		rBooms();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		if(homepageTimer < 10){
			ctx.globalAlpha = 1 - homepageTimer/10;
			ctx.fillStyle = "black";
			ctx.fillRect(0,0,w,h);
			ctx.globalAlpha = 1;
		}
		ctx.drawImage(Img.grad, 0, 0, w, h);
		rCreds();
		if (lore) {
			ReactRoot.turnOffDisplay("LoginOverlay");
			rLore();
			loreTimer++;
			window.requestAnimationFrame(loop);
			return;
		}
	}
	else ReactRoot.activate();


	window.requestAnimationFrame(loop);
}


//input
document.onkeydown = function (event) {
	// Grab enter on homepage
	if (!login && !lore && event.keyCode == 13) {
		document.getElementById("loginButton").click();
		return;
	}
	if (!login || tab == -1) return;
	if (event.keyCode === 16) {
		if (keys[0] != true) socket.emit('key', { inputId: 'shift', state: true });
		keys[0] = true;
		afkTimer = 45000;
		shift = true;
		return;
	}
	if (typing) {
		if (event.keyCode == 13) {
			ReactRoot.unfocusChat();
			typing = false;
		}
	}
	else if (autopilot) return;
	else {
		if (event.keyCode == 13) {
			ReactRoot.focusChat();
			typing = true;
		}
		else if (event.keyCode == 78 && docked && tab == 8) { // n
			confirmer = -1;
			tab = 0;
		}
		else if (event.keyCode == 89 && docked && tab == 8) { // y
			socket.emit('sellW', { slot: confirmer });
			confirmer = -1;
			textIn = 0;
			tab = 0;
		}
		else if (event.keyCode == 66 && docked && tab == 7 && seller != 0 && actuallyBuying) { // b
			socket.emit('buyW', { slot: scroll, weapon: seller - 20 });
			textIn = 0;
			tab = 0;
		}
		else if (event.keyCode > 48 && event.keyCode < 58 && equipped[event.keyCode - 49] != -2)
			socket.emit('equip', { scroll: event.keyCode - 49 });
		else if (event.keyCode == 48 && equipped[event.keyCode - 49] != -2)
			socket.emit('equip', { scroll: 9 });
		else if (event.keyCode === 83 || event.keyCode === 40) {//s
			if (keys[1] != true) socket.emit('key', { inputId: 's', state: true });
			keys[1] = true;
			afkTimer = 45000;
		}
		else if (event.keyCode === 192)//`
			dev = !dev;
		else if (event.keyCode === 69) {//e
			if (keys[2] != true) socket.emit('key', { inputId: 'e', state: true });
			keys[2] = true;
			afkTimer = 45000;
		}
		else if (event.keyCode === 87 || event.keyCode === 38) {//w
			if (keys[3] != true) socket.emit('key', { inputId: 'w', state: true });
			keys[3] = true;
			didW = true;
			afkTimer = 45000;
		}
		else if (event.keyCode === 65 || event.keyCode === 37) {//a
			if (keys[4] != true) socket.emit('key', { inputId: 'a', state: true });
			keys[4] = true;
			didSteer = true;
			afkTimer = 45000;
		}
		else if (event.keyCode === 68 || event.keyCode === 39) {//d
			if (keys[5] != true) socket.emit('key', { inputId: 'd', state: true });
			keys[5] = true;
			didSteer = true;
			afkTimer = 45000;
		}
		else if (event.keyCode === 32) {//space
			if (keys[6] != true) socket.emit('key', { inputId: ' ', state: true });
			keys[6] = true;
			if (equipped[scroll] < 0) badWeapon = 20;
			afkTimer = 45000;
		}
		else if (event.keyCode === 81) {//q
			if (keys[7] != true) socket.emit('key', { inputId: 'q', state: true });
			keys[7] = true;
			afkTimer = 45000;
		}
		else if (event.keyCode === 88 || event.keyCode === 27) {//x
			if (dead) return;
			if (keys[8] != true) socket.emit('key', { inputId: 'x', state: true });
			keys[8] = true;
			if (textIn > 300) textIn = 0;
			ReactRoot.turnOffRegister("");
			afkTimer = 45000;
			socket.emit('equip', { scroll: scroll });
		}
		else if (ship > 15 && (event.keyCode === 86 || event.keyCode === 67)) {//c/v
			if (dead) return;
			if (keys[9] != true) socket.emit('key', { inputId: 'c', state: true });
			keys[9] = true;
			afkTimer = 45000;
		}
	}
}
document.onkeyup = function (event) {
	if (login && !typing && event.keyCode === 80 && !docked) {
		autopilot ^= true;
		if(bigNotes[0] == -1)/*to prevent spam*/
			addBigNote([256,"Autopilot "+(autopilot?"E":"Dise")+"ngaged!", "Press P to toggle.", ""]);
		return;
	} else if (autopilot)
		return;
	if (!login || tab == -1)
		return;
	var resetAfk = true;
	if (event.keyCode === 83 || event.keyCode === 40) {//s
		keys[1] = false;
		socket.emit('key', { inputId: 's', state: false });
	} else if (event.keyCode === 69)//e
		keys[2] = false;
	else if (event.keyCode === 87 || event.keyCode === 38) {//w
		keys[3] = false;
		socket.emit('key', { inputId: 'w', state: false });
	} else if (event.keyCode === 65 || event.keyCode === 37) {//a
		keys[4] = false;
		socket.emit('key', { inputId: 'a', state: false });
	} else if (event.keyCode === 68 || event.keyCode === 39) {//d
		keys[5] = false;
		socket.emit('key', { inputId: 'd', state: false });
	} else if (event.keyCode === 32) {//space
		keys[6] = false;
		socket.emit('key', { inputId: ' ', state: false });
	} else if (event.keyCode === 81)//q
		keys[7] = false;
	else if (event.keyCode === 88 || event.keyCode === 27)//x
		keys[8] = false;
	else if (ship > 15 && (event.keyCode === 86 || event.keyCode === 67)) {//c/v
		if (keys[9] == true) socket.emit('key', { inputId: 'c', state: false });
		keys[9] = false;
	}
	else if (event.keyCode === 16) {
		keys[0] = false;
		shift = false;
		socket.emit('key', { inputId: 'shift', state: false });
	} else
		resetAfk = false;
	if (resetAfk)
		afkTimer = 45000;
}
document.addEventListener('mousemove', function (evt) {
	var omx = mx;
	var omy = my;
	var mousePos = getMousePos(canvas, evt);
	mx = mousePos.x;
	my = mousePos.y;
	if (mb == 1 && mx > w - 32 - 20 - 128 && mx < w - 32 - 20 && my > h - 52) gVol = (mx + 20 + 32 + 128 - w) / 128;
	if (mx > w - 32 - 20 - 128 && my > h - 52) volTransparency = 1;
	var preSeller = seller;
	
	//Map movement
	if (mb == 1 && mx > 8 && mx < 216 && my < 216 && my > 8) {
		var mxn = mx - omx;
		var myn = my - omy;
		roll(myn / 4);
		spin(mxn / 4);
	}

	//Shop
	else if(docked && tab == 0){
			 if (mx > rx + 256 + 48 && mx < rx + 256 + 48 + ctx.measureText(mEng[12]).width && my > ry + 64 && my < ry + 80) seller = 610;
		else if (mx > rx + 256 - 32 && mx < rx + 264 && my < ry + 84 + 4 * 32 - 16 && my > ry + 84) {
			seller = 5 + Math.floor((my - 84 - ry) / 32);
			if (Math.floor((my - 84 - ry) / 16) % 2 == 1) seller = 0;
		}
		else if (my > ry + 246 && my < ry + 240 + 160 && mx > rx + 256 + 32 && mx < rx + 256 + 78) seller = Math.floor((my - ry - 246) / 16 + 10);
		else if (my > ry + 256 - 30 && my < ry + 256 - 16 && mx > rx + 512 - 64 && mx < rx + 512 - 64 + ctx.measureText(mEng[18]).width) seller = 601;
		else if (mx > rx + 768 - 16 - ctx.measureText(mEng[14]).width && mx < rx + 768 - 16 && my > ry + 512 - 32 && my < ry + 512 - 16) seller = 611;
		else if (my > ry + 256 - 16 && my < ry + 512 - 16 && mx > rx + 16 && mx < rx + 256 + 16) {
			if (my > ry + 256 + 128 + 32) seller = 100;
			else seller = 0;
		}

		else seller = 0;
	}

	//Quests
	else if (docked && tab == 1 && mx > 16 + rx && mx < rx + 128 * 6 - 16 && my > ry + 40 + 32 && my < ry + 512 - 48 && quest == 0) {
		seller = Math.floor((my - ry - 40 - 32) / 80) + 300;
		if (mx > rx + 128 * 3) seller += 5;
	}

	//Stats
	else if (docked && tab == 2){
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
		}

		else seller = 0;
	}

	//Buy weapon
	else if (docked && tab == 7){
			 if (my > ry + 40 + 52 && my < ry + 76 + 16 * (Math.ceil(wepns.length / 3) + 1) && mx > rx + 16 && mx < rx + 16 + 8 * 6) seller = weaponWithOrder(Math.floor((my - ry - 40 - 52) / 16)) + 20;
		else if (my > ry + 40 + 52 && my < ry + 76 + 16 * (Math.ceil(wepns.length / 3) + 1) && mx > rx + 16 + 240 && mx < rx + 16 + 240 + 8 * 6) seller = weaponWithOrder(Math.floor((my - ry - 40 - 52) / 16 + Math.ceil(wepns.length / 3))) + 20;
		else if (my > ry + 40 + 52 && my < ry + 76 + 16 * (Math.ceil(wepns.length / 3) + 1) && mx > rx + 16 + 240 * 2 && mx < rx + 16 + 240 * 2 + 8 * 6) seller = weaponWithOrder(Math.floor((my - ry - 40 - 52) / 16 + Math.ceil(wepns.length / 3) * 2)) + 20;

		else seller = 0;
	}

	//More
	else if (docked && tab == 4 && my > ry + 40 && my < ry + 512 && mx > rx && mx < rx + 768) {
		var ticX = Math.floor((mx - rx) / 256);
		var ticY = Math.floor((my - ry - 40) / ((512 - 40) / 3));
		if (ticY == 1) seller = 503;
		else seller = 500 + ticX + ticY * 2;
	}

	//Global Chat Button
	else if (mx < 512 + 32 && mx > 512 - 64 && my > h - 32) seller = 800;

	else seller = 0;
	if (seller != 0 && seller != preSeller) playAudio("button2", .2);
}, false);

document.addEventListener('mousedown', function (evt) {
	soundAllowed = true;
	mb = 1;
	if (lore && !login) {
		socket.emit('guest', VERSION);
		return;
	}
	if (mx > w - 32 - 20 - 128 && mx < w - 32 - 20 && my > h - 52) gVol = (mx + 20 + 32 + 128 - w) / 128;
	var mousePos = getMousePos(canvas, evt);
	mx = mousePos.x;
	my = mousePos.y;
	if (mx < 400 && mx > 9 && my > h - 32 && my < h - 8) {
		typing = true;
		ReactRoot.focusChat();
	} else typing = false;
	var i = seller;
	if (i == 0 && !mouseDown) {
		mouseDown = true;
		if ((mx < w - 32 - 20 - 128 - 16 || my < h - 92) && (mx > 512 + 32 || my < h - 216)) {//not in vol section or chat section
			socket.emit('key', { inputId: ' ', state: true });
			afkTimer = 45000;
		}
		if (equipped[scroll] < 0) badWeapon = 20;
	}
	/*if(i == 350)
		socket.emit('cancelquest', {});*/
	if (i == 500) window.open('https://tornspace.wikia.com/wiki/Torn.space_Wiki', '_blank');
	if (i == 501) window.open('/store', '_blank');
	if (i == 502) window.open('/leaderboard', '_blank');
	if (i == 503) window.open('https://padlet.com/mchontz10/k2n7p1pnaxct', '_blank');
	if (i == 504) window.open('https://www.youtube.com/channel/UCKsbC4GfoPOcyifiwW1GA4w', '_blank');
	if (i == 505) window.open('https://discord.gg/wFsdUcY', '_blank');
	if (i == 506) window.open('/credits', '_blank');
	if (i == 601) {
		textIn = 0;
		tab = 7;
		actuallyBuying = false;
	}
	if (i == 610) socket.emit('sell', { item: 'all' });
	if (i == 611) socket.emit('buyLife', {});
	if (i >= 300 && i < 310 && quest == 0) socket.emit('quest', { quest: i - 300 });
	if (docked && tab == 2 && i > 199 && i < 206) socket.emit('upgrade', { item: i - 200 });
	if (docked && tab == 2 && i > 205 && i < 212) socket.emit('downgrade', { item: i - 206 });
	if (docked && mx > rx && mx < rx + 128 * 6 && my > ry && my < ry + 40) {
		textIn = 0;
		tab = Math.floor((mx - rx) / (768/5));
	} if (i >= 700 && i < 705)
		socket.emit('trail', { trail: i - 700 });
	if (i == 800) {
		globalChat = (globalChat + 1) % 2;
		socket.emit("toggleGlobal", {});
		preProcessChat();
	}
	if (docked && mx > rx + 256 - 32 && mx < rx + 264 && my < ry + 84 + 4 * 32 - 16 && my > ry + 84) {
		var item = '';
		if (i == 5) item = 'iron';
		else if (i == 6) item = 'silver';
		else if (i == 7) item = 'platinum';
		else if (i == 8) item = 'aluminium';
		socket.emit('sell', { item: item });
	} else if (docked && tab == 0 && my > ry + 246 && my < ry + 240 + 160 && mx > rx + 256 + 32 && mx < rx + 256 + 78) {
		if (equipped[i - 10] == -1) {
			textIn = 0;
			tab = 7;
			actuallyBuying = true;
			scroll = i - 10;
		}
		else if (equipped[i - 10] > -1) {
			textIn = 0;
			tab = 8;
			confirmer = i - 10;
		}
	} else if (docked && tab == 0 && my > ry + 256 - 16 && my < ry + 512 - 16 && mx > rx + 16 && mx < rx + 256 + 16) {
		if (my > ry + 256 + 128 + 32) socket.emit('buyShip', { ship: shipView });
		else if (mx > rx + 16 + 128 && shipView < ships.length - 1) shipView++;
		else if (mx < rx + 16 + 128 && shipView > 0) shipView--;
	}
	if (i != 0 && i != 600) ReactRoot.turnOffRegister("");
}, false);
document.addEventListener('mouseup', function (evt) {
	mb = 0;
	if (mouseDown) {
		socket.emit('key', { inputId: ' ', state: false });
		afkTimer = 45000;
		mouseDown = false;
	}
}, false);
document.addEventListener('mousewheel', function (evt) {
	var d = Math.sign(evt.wheelDelta);
	if (mx < 256 && my < 450) {
		mapZoom*=d>0?.97:1.03;
		mapZoom = 1;//Math.min(mapZoom,1); uncomment to allow zooming
		return;
	}
	if (mx < 512 + 32 && my > h - 216) {
		chatScroll = Math.max(0, Math.min(chatLength - 10, chatScroll + d));
		return;
	}
	if ((equipped[scroll] > 0 && (docked || scroll - d < 0 || scroll - d >= equipped.length || equipped[scroll - d] < -1)) || equipped[scroll - d] == -2)
		return;
	socket.emit('equip', { scroll: scroll - d });
}, false);
$(document).keydown(function (event) {
	if (event.ctrlKey == true && (event.which == '61' || event.which == '107' || event.which == '173' || event.which == '109' || event.which == '187' || event.which == '189')) event.preventDefault();
});
$(window).bind('mousewheel DOMMouseScroll', function (event) {
	if (event.ctrlKey == true) event.preventDefault();
}, { passive: false });



//random
function write(str, x, y) {
	if (str === undefined) return;
	if (str.length > textIn) ctx.fillText(str.substring(0, textIn), x, y);
	else ctx.fillText(str, x, y);
}

function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top
	};
}
function cube(x) {
	return x * x * x;
}
function sinLow(x) {
	x += Math.PI * 200;
	x %= Math.PI * 2;
	var modpi = x % Math.PI;
	return (x > Math.PI ? -1 : 1) * sins[Math.floor(((modpi < Math.PI / 2) ? (modpi) : (Math.PI - modpi)) * 1000)];
}
function cosLow(x) {
	return sinLow(x + Math.PI / 2);
}
function colorSelect(col, red, blue, green){
	if(col === "red")  return red;
	if(col === "blue") return blue;
	return green;
}
function pdist(x, sx, sy) {
	var i1 = ((sx * sx * sx + sy * sy) % 5 + 1) / 2.23; // Geometric mean of 5 and 1
	var i2 = ((sx * sx + sy) % 5 + 1) / 2.23;
	return (Math.cbrt(Math.abs(Math.tan(x))) % i2) * 3500 * i2 + 800 * i1 + 600;
}
function maxPD(sx, sy) {
	var i1 = ((sx * sx * sx + sy * sy) % 5 + 1) / 2.23; // Geometric mean of 5 and 1
	var i2 = ((sx * sx + sy) % 5 + 1) / 2.23;
	return i2 * 3500 * i2 + 800 * i1 + 600;
}
function minPD(sx, sy) {
	var i1 = ((sx * sx * sx + sy * sy) % 5 + 1) / 2.23; // Geometric mean of 5 and 1
	var i2 = ((sx * sx + sy) % 5 + 1) / 2.23;
	return 800 * i1 + 600;
}
function square(x) {
	return x * x;
}

function r2x(x) {
	var ranks = [0, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 4000, 8000, 14000, 20000, 40000, 70000, 100000, 140000, 200000, 300000, 500000, 800000, 1000000, 1500000, 2000000, 3000000, 5000000, 8000000, 12000000, 16000000, 32000000, 64000000, 100000000];
	return x < 0 ? 0 : ranks[x];
}
function CoherentNoise(x) {
	var intX = Math.floor(x);
	var w = x - intX;
	var n0 = Math.sin(square(intX) * 1000);
	var n1 = Math.sin(square(intX + 1) * 1000);
	return n0 + (n1 - n0) * (w * w / 2 - w * w * w / 3) * 6;
}
function lerp(a, b, w) {
	return a * (1 - w) + b * w;
}
function cerp(a, b, w) {
	var fancyweight = 3*w*w-2*w*w*w;
	return lerp(a,b,fancyweight);
}
function expToLife() {
	return Math.floor(guest ? 0 : 200000 * (1 / (1 + Math.exp(-experience / 15000.)) + Math.atan(experience / 150000.) - .5)) + 500;
}
function abbrevInt(x) {
	if (x < 10000) return "" + Math.round(x);
	if (x < 10000000) return Math.round(x / 1000) + mEng[180];
	if (x < 10000000000) return Math.round(x / 1000000) + mEng[181];
}
function lagMath(arr) {
	if (lagArr == 0) {
		lagArr = arr;
		return;
	}
	for (var i = 0; i < arr.length; i++)
		lagArr[i] = (lagArr[i] + arr[i] / 20) / 1.05;
}
function addBigNote(note) {
	//set i to the least empty index of bigNotes
	var i = 0;
	for (i; i<4; i++) if(bigNotes[i] == -1) break;

	//and use that index for queue
	bigNotes[i] = note;
}
function bgPos(x, px, scrx, i, tileSize) {
	return ((scrx - px) / ((sectorWidth / tileSize) >> i)) % tileSize + tileSize * x;
}
function weaponWithOrder(x) {
	for (var i = 0; i < wepns.length; i++) if (wepns[i].order == x) return i;
}
function getTimeAngle() {
	return tick / 10;
}
function brighten(x) {
	if(x === "red") return "pink";
	if(x === "green") return "lime";
	if(x === "blue") return "cyan";
	return x;
}



//misc rendering
function rLoadingBar() {
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, w, h);
	ctx.fillStyle = "white";
	ctx.fillRect(w / 2 - 128, h / 2 - 32, 256, 64);
	ctx.fillStyle = 'black';
	ctx.fillRect(w / 2 - 128 + 8, h / 2 - 32 + 8, 256 - 16, 64 - 16);
	ctx.fillStyle = 'white';
	ctx.fillRect(w / 2 - 128 + 16, h / 2 - 32 + 16, (256 - 32) * ((Aud_prgs[0] + Img_prgs[0]) / (Aud_prgs[1] + Img_prgs[1])), 64 - 32);
	ctx.textAlign = "center";
	ctx.font = "30px ShareTech";
	ctx.fillText(splash, w / 2, h / 2 - 96);
	ctx.font = "15px ShareTech";
	if(Img_prgs[0] == Img_prgs[1]) ctx.fillText("All images loaded.", w / 2, h / 2 + 64);
	if(Aud_prgs[0] == Aud_prgs[1]) ctx.fillText("All sounds loaded", w / 2, h / 2 + 80);
	ctx.fillText(currLoading, w / 2, h / 2 + 96);
}

function updateNotes() {
	for (var i in notes) {
		var note = notes[i];
		if (note.time++ > 38)
			delete notes[i];
	}
}
function updateTrails() {

	/*trails:
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

	for (var i in trails) {
		var selfo = trails[i];
		if (selfo.time++ >= 5) {
			delete trails[i];
			continue;
		}
		selfo.x += selfo.dx;
		selfo.y += selfo.dy;
	}
	var d = new Date();
	var t = d.getTime() / 100;
	for (var i in playersInfo) {
		var selfo = playersInfo[i];

		var trail = selfo.trail;
		var mod = trail % 16;
		if (Math.abs(selfo.speed) > 1 && Math.abs(selfo.driftAngle - selfo.angle) > .05) {
			var particleCount = square(ships[selfo.ship].width / 96) * .66;
			particleCount *= Math.min(Math.abs(selfo.driftAngle - selfo.angle) * 8, 16)
			if (trail > 15) particleCount /= 6;
			else if (mod != 0) particleCount *= 2.5;
			var cos = cosLow(selfo.angle);
			var sin = sinLow(selfo.angle);
			for (var j = 0; j < particleCount; j++) {
				var rando = Math.random() * selfo.speed, rando2 = Math.random();
				var col = (((96 + Math.floor(Math.random() * 64)) << 16) + ((96 + Math.floor(Math.random() * 128)) << 8) + 255 - Math.floor(Math.random() * 64)).toString(16);
				if (mod == 1) col = (((192 + Math.floor(Math.random() * 64)) << 16) + (Math.floor(Math.random() * 64) << 8) + Math.floor(Math.random() * 92)).toString(16);
				else if (mod == 2) {
					if (Math.random() < .5) col = (((255 - Math.floor(Math.random()) * 64) << 16) + ((183 + Math.floor(Math.random() * 64)) << 8)).toString(16);
					else col = (((Math.floor(Math.random() * 64)) << 16) + ((192 + Math.floor(Math.random() * 64)) << 8) + Math.floor(Math.random() * 64)).toString(16);
				} else if (mod == 3) {
					var r = Math.random() < .5 ? 255 : 1;
					col = ((r << 16) + (r << 8) + r).toString(16);
				} else if (mod == 4) {
					t = Math.random() * Math.PI * 60;
					col = ((Math.floor(Math.cos(t) * 128 + 128) << 16) + (Math.floor(Math.cos(t + Math.PI * 2 / 3) * 128 + 128) << 8) + Math.floor(Math.cos(t + Math.PI * 4 / 3) * 128 + 128)).toString(16);
				} else if (mod == 5) col = ((Math.floor(Math.cos(t) * 128 + 128) << 16) + (Math.floor(Math.cos(t + Math.PI * 2 / 3) * 128 + 128) << 8) + Math.floor(Math.cos(t + Math.PI * 4 / 3) * 128 + 128)).toString(16);
				while (col.length < 6) col = "0" + col;
				trails[Math.random()] = { vip: trail > 15, dx: cos * selfo.speed / 2, dy: sin * selfo.speed / 2,
					x: selfo.x + (cube(Math.random() * 4 - 2) * 4 * ships[selfo.ship].width / 128) + cos * rando - cos * selfo.speed,
					y: selfo.y + (cube(Math.random() * 4 - 2) * 4 * ships[selfo.ship].width / 128) + sin * rando - sin * selfo.speed, time: -1, color: col };
			}
		}
		if (selfo.health / selfo.maxHealth < .4)
			for (var j = 0; j < 10; j++) {
				var r = Math.random();
				trails[Math.random()] = { vip: false, dx: cos * selfo.speed / 2, dy: sin * selfo.speed / 2, x: selfo.x + (cube(Math.random() * 4 - 2) * 4 * ships[selfo.ship].width / 128) + cos * r * selfo.speed, y: selfo.y + (cube(Math.random() * 4 - 2) * 4 * ships[selfo.ship].width / 128) + sin * r * selfo.speed, time: -1, color: ((Math.round(112 + 32 * r) << 16) + (Math.round(112 + 32 * r) << 8) + Math.round(112 + 32 * r)).toString(16) };
			}
	}
}
function updateBooms() {
	for (var i in booms) {
		var b = booms[i];
		b.time += 14;
		if (b.time > 400)
			delete booms[i];
	}
	for (var i in boomParticles) {
		var selfo = boomParticles[i];
		if (selfo.time++ >= 14) {
			delete boomParticles[i];
			continue;
		}
		selfo.x += cosLow(selfo.angle) * 25 + selfo.dx;
		selfo.y += sinLow(selfo.angle) * 25 + selfo.dy;
	}
}
function rLore() {
	textIn = 1000;
	ctx.fillStyle = brighten(pc);
	ctx.font = "22px ShareTech";
	wrapText(jsn.lore[colorSelect(pc,0,1,2)], 48, h/2-22*5-10000/(loreTimer+1), w - 96, 40);
	ctx.textAlign = 'center';
	ctx.fillStyle = 'yellow';
	var t = (new Date()).getTime() / 6000;
	ctx.font = ((32 + 6 * Math.sin(24 * t))*(loreTimer/(loreTimer+50))) + "px ShareTech";
	ctx.fillText(mEng[80], w/2, h - 48);
}
function rEnergyBar() {
	if (equipped === 0) return;
	var Charge = wepns[equipped[scroll]].charge;
	if (Charge < 12 && charge < 12) return;
	if (Charge < 12 && charge >= 12) Charge = 150;
	var div = charge/Charge;
	if(div>1) return;
	ctx.fillStyle = 'lime';
	ctx.globalAlpha = .5;
	ctx.fillRect(0, 0, (w/2) * div, 4);
	ctx.fillRect(0, h-4, (w/2) * div, 4);
	ctx.fillRect(w-(w/2) * div, 0, (w/2) * div, 4);
	ctx.fillRect(w-(w/2) * div, h-4, (w/2) * div, 4);
	ctx.fillRect(0, 0, 4, (h/2) * div);
	ctx.fillRect(w-4, 0, 4, (h/2) * div);
	ctx.fillRect(0, h-(h/2) * div, 4, (h/2) * div);
	ctx.fillRect(w-4, h-(h/2) * div, 4, (h/2) * div);
	ctx.globalAlpha = 1;
}

function rVolumeBar() {
	if (volTransparency <= 0) return;
	ctx.save();
	ctx.globalAlpha = volTransparency;
	volTransparency -= .01;
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(w - 32 - 20 - 128, h - 10 - 16 - 6, 128, 6);
	ctx.beginPath();
	ctx.arc(w - 32 - 20 - 128, h - 10 - 16 - 3, 3, 0, 2 * Math.PI, false);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(w - 32 - 20, h - 10 - 16 - 3, 3, 0, 2 * Math.PI, false);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(w - 32 - 20 - 128 + 128 * gVol, h - 10 - 16 - 3, 6, 0, 2 * Math.PI, false);
	ctx.fill();
	ctx.fillStyle = '#000000';
	ctx.beginPath();
	ctx.arc(w - 32 - 20 - 128 + 128 * gVol, h - 10 - 16 - 3, 4, 0, 2 * Math.PI, false);
	ctx.fill();
	ctx.restore();
}
function rExpBar() {
	if(guest) return;
	var dec = 256 * (experience - r2x(rank - 1)) / (r2x(rank) - r2x(rank - 1));
	if (dec < 0)
		dec = 0;
	ctx.drawImage(Img.bar1, w / 2 - 128, h - 28);
	ctx.fillStyle = '#000000';
	ctx.fillRect(w / 2 - 126 + dec, h - 22, 248 - dec, 10);
	ctx.drawImage(Img.bar2, w / 2 - 128, h - 28);
	ctx.fillStyle = "#ffffff";
	ctx.textAlign = "right";
	write("" + Math.max(r2x(rank - 1), 0), w / 2 - 140, h - 14);
	ctx.textAlign = "left";
	write("" + r2x(rank), w / 2 + 140, h - 14);
	ctx.font = "11px ShareTech";
	ctx.textAlign = (dec > 128) ? "right" : "left";
	ctx.fillStyle = (dec > 128) ? "black" : "white";
	write("" + Math.round(experience), w / 2 - 128 + dec + (dec > 128 ? -8 : 8), h - 14);
	ctx.font = "14px ShareTech";
	ctx.textAlign = "left";
}
function rNotes() {
	ctx.textAlign = "center";
	ctx.fillStyle = "pink";
	for (var i in notes) {
		var note = notes[i];
		ctx.font = (note.strong ? 40 : 20) + 'px ShareTech';
		ctx.globalAlpha = (39 - note.time) / 39;
		var x = note.spoils ? note.x : (note.x - px + w / 2 + scrx + (note.local ? px : 0));
		var y = note.spoils ? note.y : (note.y - py + h / 2 - note.time + scry + (note.local ? py : 0));
		write(note.msg, x, y);
	}
	ctx.globalAlpha = 1;
	ctx.textAlign = "left";
	ctx.font = '14px ShareTech';
}
function rBooms() {
	if (!login)
		updateBooms();
	for (var i in booms) {
		var b = booms[i];
		var pw = 128, ph = 128;
		var rendX = b.x - px + w / 2 - pw / 2 + scrx, rendY = b.y - py + h / 2 - ph / 2 + scry;

		if (b.time < 114) {
			var img = Img.booms;
			var sx = (b.time % 10) * 128;
			var sy = Math.floor(b.time / 10) * 128;

			ctx.save();
			ctx.drawImage(img, sx, sy, 128, 128, rendX, rendY, 128, 128);
			ctx.restore();
		}

		if (!b.shockwave)
			continue;
		rendX = b.x - px + w / 2 + scrx, rendY = b.y - py + h / 2 + scry;
		var ss = Math.sqrt(b.time) * 96;
		ctx.globalAlpha = .9 - b.time / 500.0;
		ctx.drawImage(Img.shockwave, rendX - ss / 2, rendY - ss / 2, ss, ss);
		ctx.globalAlpha = 1;
	}
	for (var i in boomParticles) {
		var selfo = boomParticles[i];
		ctx.beginPath();
		ctx.strokeStyle = "gray";
		ctx.lineWidth = 6;
		ctx.globalAlpha = (15 - selfo.time) / 15;
		ctx.fillStyle = "white";
		ctx.fillRect(selfo.x - 3 - px + w / 2, selfo.y - 3 - py + h / 2, 7, 7);
		ctx.globalAlpha = (15 - selfo.time) / 22;
		ctx.moveTo(selfo.x - px + w / 2, selfo.y - py + h / 2);
		ctx.lineTo(selfo.x - px + w / 2 - (cosLow(selfo.angle) * 25 + selfo.dx), selfo.y - py + h / 2 - (sinLow(selfo.angle) * 25 + selfo.dy));
		ctx.stroke();
		ctx.closePath();
		ctx.globalAlpha = 1;
	}
}
function rTrails() {
	for (var i in trails) {
		var selfo = trails[i];
		ctx.globalAlpha = (7 - selfo.time) / 7;
		ctx.strokeStyle = ctx.fillStyle = "#" + selfo.color;
		if (!selfo.vip) ctx.fillRect(selfo.x - 1 - px + w / 2 + scrx, selfo.y - 1 - py + scry + h / 2, 3, 3);
		else drawStar(selfo.x - px + w / 2 + scrx, selfo.y - py + scry + h / 2, 5, 3, 8);
	}
	ctx.globalAlpha = 1;
}
function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
	ctx.lineWidth = 1;
	var rot = Math.PI / 2 * 3;
	var x = cx;
	var y = cy;
	var step = Math.PI / spikes;
	ctx.beginPath();
	ctx.moveTo(cx, cy - outerRadius)
	for (i = 0; i < spikes; i++) {
		x = cx + cosLow(rot) * outerRadius;
		y = cy + sinLow(rot) * outerRadius;
		ctx.lineTo(x, y)
		rot += step
		x = cx + cosLow(rot) * innerRadius;
		y = cy + sinLow(rot) * innerRadius;
		ctx.lineTo(x, y)
		rot += step
	}
	ctx.lineTo(cx, cy - outerRadius);
	ctx.closePath();
	ctx.fill();
}
function rTexts(lag, arr) {
	var ore = iron + silver + platinum + aluminium;
	ctx.textAlign = 'right';
	ctx.fillStyle = 'yellow';
	var lagNames = [mEng[182], mEng[183], mEng[184], mEng[185], mEng[186], mEng[187], mEng[188], mEng[189], mEng[190], mEng[191], mEng[192]];
	var info = {};
	var lbShift = !guest ? 240 : 0;
	meanNLag *= nLagCt;
	meanNLag += nLag;
	nLagCt++;
	meanNLag /= (nLagCt + 0.0);

	info[0] = mEng[149] + Math.round(experience);
	info[1] = mEng[5] + Math.floor(money);
	info[2] = mEng[6] + kills;
	info[3] = mEng[147] + ore;
	info[4] = mEng[148] + rank;
	info[5] = '';
	info[6] = isChrome ? "" : mEng[81];
	info[7] = isChrome ? "" : mEng[82];
	info[8] = mEng[83] + Number((lag / 40.).toPrecision(3)) + mEng[193];
	info[9] = mEng[84] + Number((sLag / 40.).toPrecision(3)) + mEng[193];
	info[10] = mEng[85] + nLag + " ms " + mEng[194] + Number(meanNLag).toPrecision(3) + " ms" + ")";
	info[11] = mEng[86] + fps;
	info[12] = mEng[87] + ups;
	if (lag > 50) {
		info[5] = mEng[88];
		info[6] = mEng[89];
		info[7] = "";
	}
	else if (nLag > 100) {
		info[5] = mEng[90];
		info[6] = mEng[91];
		info[7] = mEng[92];
	}
	else if (sLag > 50) {
		info[5] = mEng[95];
		info[6] = mEng[92]
		info[7] = "";
	}
	for (var i = 0; i < (dev ? 15 + lagArr.length : 5); i++)
		write(i < 15 ? info[i] : (lagNames[i - 15] + mEng[195] + parseFloat(Math.round(lagArr[i - 15] * 100) / 100).toFixed(2)), w - lbShift - 32, 64 + i * 16);
	ctx.textAlign = 'left';
}
function rCurrQuest() {
	ctx.fillStyle = 'cyan';
	ctx.textAlign = 'center';
	var desc = "";
	if (quest.type == 'Mining') desc = mEng[37] + quest.amt + mEng[38] + quest.metal + mEng[39] + getSectorName(quest.sx, quest.sy) + mEng[40];
	if (quest.type == 'Base') desc = mEng[41] + getSectorName(quest.sx, quest.sy) + mEng[40];
	if (quest.type == 'Delivery') desc = mEng[42] + getSectorName(quest.sx, quest.sy) + mEng[43] + getSectorName(quest.dsx, quest.dsy) + mEng[40];
	if (quest.type == 'Secret') desc = mEng[156] + getSectorName(quest.sx, quest.sy) + mEng[157];
	if (quest.type == 'Secret2') desc = mEng[158] + getSectorName(quest.sx, quest.sy) + mEng[159] + secret2PlanetName + mEng[40];
	if (quest.type == 'Secret3') desc = mEng[160];
	write(desc, w / 2, h - 56);
	ctx.textAlign = 'left';
}
function rEMP() {
	if (empTimer > 0) {
		ctx.font = '24px ShareTech';
		ctx.textAlign = 'center';
		ctx.fillStyle = 'orange';
		write(mEng[96] + Math.round(empTimer / 25) + mEng[75] + mEng[97], w / 2, 256);
		ctx.font = '14px ShareTech';
		ctx.textAlign = 'left';
		currAlert = mEng[98];
	}
	if (gyroTimer > 0) {
		ctx.font = '24px ShareTech';
		ctx.textAlign = 'center';
		ctx.fillStyle = 'orange';
		write(mEng[99] + Math.round(gyroTimer / 25) + mEng[75] + mEng[97], w / 2, 256);
		ctx.font = '14px ShareTech';
		ctx.textAlign = 'left';
		currAlert = mEng[100];
	}
	if (!afk && afkTimer < 90 * 25) {
		ctx.font = '24px ShareTech';
		ctx.textAlign = 'center';
		ctx.fillStyle = 'orange';
		write(mEng[102] + Math.round(afkTimer / 25) + mEng[75] + mEng[97], w / 2, 256);
		ctx.font = '14px ShareTech';
		ctx.textAlign = 'left';
		currAlert = mEng[101];
	}
}
function rStars() {
	var mirrors = 3;
	var wm = w/mirrors;
	var hm = h/mirrors;
	for (var i in stars) {
		var s = stars[i];
		ctx.strokeStyle = ctx.fillStyle = "rgb("+(128+32*(i%4))+","+(128+32*(i/4%4))+","+(128+32*(i/16%4))+")";
		var parallax = (100 - i) / 100.0;
		parallax = parallax * parallax;
		parallax = parallax * parallax;
		var starSz = 3-i/15; // distant stars are size 1, near stars are 3x3
		ctx.lineWidth = starSz;
		var x = (500000 + s.x - (px - scrx + sx * sectorWidth) * (parallax + .1) * .25) % wm;
		var y = (500000 + s.y - (py - scry + sy * sectorWidth) * (parallax + .1) * .25) % hm;
		for(var j = 0; j < mirrors; j++) for(var k = 0; k < mirrors; k++)
			ctx.fillRect(x+j*wm-2,y+k*hm-2,starSz,starSz);
		
		if(hyperdriveTimer>0){
			ctx.beginPath();
			for(var j = 0; j < mirrors; j++) for(var k = 0; k < mirrors; k++){
				ctx.moveTo(x+j*wm, y+k*hm);
				ctx.lineTo(x+j*wm-starSz*pvx/10, y+k*hm-starSz*pvy/10);
			}
			ctx.stroke();
		}
	}
}
function rSectorEdge() {
	ctx.textAlign = 'center';
	ctx.font = '14px ShareTech';
	ctx.strokeStyle = ctx.fillStyle = 'yellow';
	ctx.lineWidth = 2;
	ctx.setLineDash([20, 15]);
	for (var i = (w / 2 - px) % sectorWidth; i < w; i += sectorWidth) {
		ctx.beginPath();
		ctx.moveTo(i + scrx, 0);
		ctx.lineTo(i + scrx, h);
		ctx.stroke();
		ctx.save();
		ctx.translate(i, h / 2);
		ctx.rotate(Math.PI / 2);
		ctx.fillText(mEng[103], 0, 0);
		ctx.restore();
	}
	for (var i = (h / 2 - py) % sectorWidth; i < h; i += sectorWidth) {
		ctx.beginPath();
		ctx.moveTo(0, i + scry);
		ctx.lineTo(w, i + scry);
		ctx.stroke();
		write(mEng[103], w / 2, i);
	}
	ctx.font = '14px ShareTech';
	ctx.textAlign = 'left';
	ctx.setLineDash([]);
}
function preProcessChat() {
	var chatList = messages;
	preChatArr = {};
	chati = 0;
	var regex = new RegExp(key + ".*?" + key, "g");
	for (var m = chatLength - 1; m >= 0; m--) {
		var line = '';
		var words = chatList[m].split(' ');
		for (var n = 0; n < words.length; n++) {
			var testLine = line + words[n] + " ";
			var metrics = ctx.measureText(testLine.replace(regex, ""));
			var testWidth = metrics.width;
			if (testWidth > 512 && n > 0) {
				preChatArr[chati++] = line;
				line = '                  ' + words[n] + ' ';
			}
			else {
				line = testLine;
			}
		}
		preChatArr[chati++] = line;
	}
	chati--;
}
function rChat() {
	ctx.font = "14px ShareTech";
	ctx.save();
	ctx.globalAlpha = .5;
	ctx.fillStyle = "black";
	ctx.strokeStyle = "#222222";
	roundRect(-34, h - 168, 562, 224, 32, true, true);
	ctx.fillStyle = 'white';
	roundRect(0, h - 64 - 154 * (chatScroll / chatLength), 6, 24, 2, true, false);

	ctx.globalAlpha = 1;
	ctx.textAlign = "right";
	ctx.fillStyle = (seller != 800 ? (globalChat != 1 ? "violet" : pc==="red"?'pink':(pc==="blue"?'cyan':"lime")) : "yellow");
	write(globalChat == 0 ? mEng[197] : mEng[199], 512, h - 16);
	ctx.restore();

	if (globalChat == 1) return;

	ctx.textAlign = "left";

	ctx.save();
	for (var ri = chati - chatScroll; ri >= Math.max(0, chati - chatScroll - 7); ri--) {
		ctx.fillStyle = "yellow";
		var fromTop = (ri + chatScroll - Object.keys(preChatArr).length);
		ctx.globalAlpha = square((fromTop + 20) / 20);
		var curx = 0;
		var splitStr = preChatArr[ri].split(key);
		for (var j = 0; j < splitStr.length; j++) {
			if (j % 2 == 0) {
				ctx.fillText(splitStr[j], 16 + curx, h - 24 + 16 * fromTop);
				curx += ctx.measureText(splitStr[j]).width;
			}
			else
				ctx.fillStyle = (splitStr[j] === "blue" ? "cyan" : (splitStr[j] === "red" ? "pink" : (splitStr[j] === "green" ? "lime" : splitStr[j])));
		}
	}
	ctx.restore();
}
function renderBG(more) {
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, w, h);
	ctx.font = '14px ShareTech';
	var diagDist = ((sx + sy) * sectorWidth + px + py) / sectorWidth - (mapSz - 1);
	var add = more?1:0;
	var img = Img.spc;
	for (var i = 0; i < ((hyperdriveTimer > 0) ? 3 : 1); i++) {
		ctx.globalAlpha = i == 0 ? .5 : ((10000 - square(100 - hyperdriveTimer)) / (i * 10000));
		for (var x = -add; x < 2 + Math.floor(w / 2048)+add; x++)
			for (var y = -add; y < 2 + Math.floor(h / 2048)+add; y++)
				ctx.drawImage(img, bgPos(x, px, scrx, i, 2048), bgPos(y, py, scry, i, 2048));
	}

	ctx.globalAlpha = 1;
}
function rLB() {
	if (guest) return;
	ctx.save();
	ctx.globalAlpha = .5;
	infoBox(w - 260, -2, 262, (lb.length + 4) * 16 + 2, "black", "white");
	ctx.fillStyle = pc;
	roundRect(w - 221, Math.min(youi, 16) * 16 + 52, myName.length * 8 + 7, 16, 7, true, false);
	ctx.restore();

	ctx.fillStyle = 'yellow';
	ctx.font = "24px ShareTech";
	ctx.textAlign = "center";
	write(mEng[105], w - 128, 28);
	ctx.font = "14px ShareTech";
	ctx.fillStyle = 'yellow';
	write(mEng[106], w - 208, 48);
	ctx.textAlign = "right";
	write(mEng[107], w - 48 - 16, 48);
	write(mEng[108], w - 16, 48);
	for (var i = 0; i < lb.length; i++) {
		var place = 1 + ((i != 16) ? i : parseInt(lb[i].id));
		ctx.textAlign = "left";
		ctx.fillStyle = brighten(lb[i].color);
		if(lb[i].name.includes(" ")){
			ctx.font = "10px ShareTech";
			write(lb[i].name.charAt(1), w - 224, (i + 4) * 16);
			ctx.font = "14px ShareTech";
			let d = new Date();
			var t = d.getTime() / (35 * 16);
			if(lb[i].name.includes("V")||lb[i].name.includes("B"))
				ctx.fillStyle = "rgba("+Math.floor(16*Math.sqrt(Math.sin(t)*128+128))+", "+Math.floor(16*Math.sqrt(Math.sin(t+Math.PI*2/3)*128+128))+", "+Math.floor(16*Math.sqrt(Math.sin(t+Math.PI*4/3)*128+128))+", 1)";
			write(lb[i].name.substring(4), w - 216, (i + 4) * 16);
		}
		else write(lb[i].name, w - 216, (i + 4) * 16);
		ctx.fillStyle = 'yellow';
		write(place + mEng[40], w - 248, (i + 4) * 16);
		ctx.textAlign = "right";
		write(abbrevInt(lb[i].exp), w - 48 - 16, (i + 4) * 16);
		write(lb[i].rank, w - 16, (i + 4) * 16);
	}
}
function rRadar() {
	if (va2 < 1.12) return;
	ctx.fillStyle = "white";
	ctx.globalAlpha = 0.5;
	ctx.drawImage(Img.grid, 16, 32 + 214);
	let d = new Date();
	var stime = d.getTime() / (35 * 16);
	ctx.globalAlpha = 0.5;
	ctx.save();
	ctx.translate(112, 342);
	ctx.rotate(stime % (2 * Math.PI) + Math.PI / 2);
	ctx.drawImage(Img.spin, -96, -96);
	ctx.restore();
	ctx.globalAlpha = ctx.lineWidth = 1;
	var r = va2*3840 - 1280;
	var r2 = square(r);
	var distFactor = 96/r/mapZoom;
	if (basesInfo !== undefined) {
		var dx = basesInfo.x - px;
		var dy = basesInfo.y - py;
		if (square(dx) + square(dy) < r2) {
			var pa = (Math.atan2(dy, dx) + 2 * Math.PI);
			var rx = dx * distFactor + 112, ry = dy * distFactor + 342;
			ctx.globalAlpha = ((pa - stime + 2000000000 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI);
			ctx.beginPath();
			ctx.arc(rx, ry, (va2 > 1.24) ? 5 : 3, 0, 2 * Math.PI, false);
			ctx.fillStyle = "lightgray";
			if (va2 > 1.36) ctx.fillStyle = brighten(basesInfo.color);
			ctx.fill();
		}
	}
	var t = d.getTime() * 500;
	for (var p_pack in playersInfo) {
		var p = playersInfo[p_pack];
		var dx = p.x - px;
		var dy = p.y - py;
		if (square(dx) + square(dy) > r2) continue;
		var pa = (Math.atan2(dy, dx) + 2 * Math.PI);
		var rx = dx * distFactor + 112, ry = dy * distFactor + 342;
		ctx.globalAlpha = ((pa - stime + 2000000000 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI);
		ctx.beginPath();
		ctx.arc(rx, ry, 3, 0, 2 * Math.PI, false);
		if (va2 > 1.36) ctx.fillStyle = brighten(p.color);
		ctx.fill();
	}
	if (va2 > 2.49)
		for (var p_pack in playersInfo) {
			var p = playersInfo[p_pack];
			var dx = p.x - px;
			var dy = p.y - py;
			if (square(dx) + square(dy) > r2) continue;
			var pa = (Math.atan2(dy, dx) + 2 * Math.PI);
			var rx = dx * distFactor + 112, ry = dy * distFactor + 342;
			ctx.globalAlpha = ((pa - stime + 2000000000 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI);
			ctx.beginPath();
			ctx.arc(rx, ry, 2, 0, 2 * Math.PI, false);
			ctx.fillStyle = "gold";
			ctx.fill();
		}
	ctx.lineWidth = 2;
	for (var a in astsInfo) {
		a = astsInfo[a];

		var dx = a.x - px;
		var dy = a.y - py;
		if (square(dx) + square(dy) > r2) continue;
		var pa = (Math.atan2(dy, dx) + 2 * Math.PI);
		var rx = dx * distFactor + 112, ry = dy * distFactor + 342;
		ctx.globalAlpha = ((pa - stime + 2000000000 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI);
		ctx.beginPath();
		ctx.arc(rx, ry, 3, 0, 2 * Math.PI, false);
		if (va2 > 1.36) ctx.strokeStyle = ctx.fillStyle = 'orange';
		if (va2 > 1.74) {
			if (a.metal == 0) ctx.strokeStyle = ctx.fillStyle = '#d44';
			else if (a.metal == 1) ctx.strokeStyle = ctx.fillStyle = '#eef';
			else if (a.metal == 2) ctx.strokeStyle = ctx.fillStyle = '#9a9';
			else if (a.metal == 3) ctx.strokeStyle = ctx.fillStyle = '#90f';
		}
		if (va2 > 1.62) ctx.stroke();
		else ctx.fill();
	}
	ctx.globalAlpha = .5;
	var radius = wepns[equipped[scroll]].range*960/r;
	if (va2>1.8 && radius/mapZoom > 3 && radius/mapZoom<96) {
		ctx.beginPath();
		ctx.arc(112, 342, radius/mapZoom, 0, 2 * Math.PI, false);
		ctx.strokeStyle = brighten(pc);
		ctx.stroke();
	}
	ctx.globalAlpha = 1;
	ctx.lineWidth = 3;
}
function rAfk() {
	ctx.fillStyle = 'yellow';
	ctx.textAlign = 'center';
	ctx.font = '40px ShareTech';
	write(mEng[109], rx + 128 * 3, ry + 512);
	ctx.textAlign = 'left';
	ctx.font = '14px ShareTech';
}
function rDead() {
	ctx.fillStyle = 'yellow';
	ctx.textAlign = 'center';
	ctx.font = '50px ShareTech';
	write(mEng[110], rx + 128 * 3, ry + 128);
	ctx.font = '34px ShareTech';
	write(mEng[13] + lives, rx + 128 * 3, ry + 384);
	if (lives > 0) write(mEng[111], rx + 128 * 3, ry + 512);
	ctx.textAlign = 'left';
	ctx.font = '14px ShareTech';
}
function rCreds() {
	ctx.fillStyle = 'pink';
	ctx.textAlign = 'center';
	ctx.font = '20px ShareTech';
	var str = "";
	if (credentialState == 1) str = mEng[112];
	if (credentialState == 2) str = mEng[113];
	if (credentialState == 3) str = mEng[114];
	if (credentialState == 4) str = mEng[115];
	if (credentialState == 5) str = "Username is profane!";
	if (credentialState == 20) str = "Outdated client! Please clear your cache or try incongito mode!";
	if (credentialState == 8) str = "You must be rank 1 to create an account!";
	write(str, w / 2, h - 64);
	ctx.textAlign = 'left';
	ctx.font = '14px ShareTech';
}
function rFlash() {
	ctx.globalAlpha = (.3 * flash + .01) * .2;
	flash -= .2;
	ctx.fillStyle = 'pink';
	ctx.fillRect(0, 0, w, h);
	ctx.globalAlpha = 1;
}
function rTut() {
	var ore = iron + silver + platinum + aluminium;
	var text = "";
	var line2 = "";
	ctx.save();
	ctx.textAlign = "center";
	ctx.fillStyle = 'yellow';
	if (guest) {
		if (money != 8000 && currTut > 3) { text = mEng[123]; if(currTut < 5) { currTut = 5; addBigNote([256,text,"",""]); } }
		else if (!didW) { text = mEng[117]; if(currTut < 1) { currTut = 1; addBigNote([256,text,"",""]); } }
		else if (!didSteer) { text = mEng[118]; if(currTut < 2) { currTut = 2; addBigNote([256,text,"",""]); } }
		else if (ship == 0 && ore == 0) {
			text = mEng[119];
			line2 = mEng[120];
			if(currTut < 3) { currTut = 3; addBigNote([256,text,line2,""]); }
		}
		else if (ship == 0) { text = docked ? mEng[122] : mEng[121]; if(currTut < 4) { currTut = 4; addBigNote([256,text,"",""]); } }
	}
	var date = new Date();
	var ms = date.getTime();
	ctx.font = (5 * sinLow(ms / 180) + 25) + "px ShareTech";
	write(text, w / 2, 40);
	write(line2, w / 2, 88);
	ctx.restore();
}
function rDmg(r) {
	var scale = dmgTimer / 16.;
	ctx.fillStyle = 'red';
	ctx.globalAlpha = scale * .75;
	ctx.fillRect(0, 0, w, h);
	ctx.globalAlpha = 1;
	ctx.translate(scale * (r % 5 - 2), scale * (r / 5 - 2));
}
function undoDmg(r) {
	var scale = dmgTimer / 16.;
	ctx.translate(-scale * (r % 5 - 2), -scale * (r / 5 - 2));
	dmgTimer--;
}
function rAlert() {
	ctx.save();
	ctx.font = '20px ShareTech';
	ctx.fillStyle = tick % 6 < 3 ? 'orange' : 'yellow';
	ctx.textAlign = 'right';
	if (self.lives < 3) currAlert = "Low Lives";
	if (self.lives == 1) currAlert = "ONE LIFE LEFT";
	write(mEng[125] + currAlert, w - 16, h - 320);
	ctx.restore();
}
function rSavedNote() {
	ctx.save();
	ctx.textAlign = "center";
	ctx.fillStyle = "yellow";
	ctx.strokeStyle = "black";
	ctx.font = "64px ShareTech";
	ctx.globalAlpha = Math.sqrt(savedNote / 41);
	ctx.fillText(mEng[126], w / 2, h / 2);
	ctx.strokeText(mEng[126], w / 2, h / 2);
	ctx.restore();
}
function roundRect(x, y, width, height, radius, fill, stroke) {
	ctx.lineWidth = 2;
	if (typeof stroke == 'undefined') stroke = true;
	if (typeof radius === 'undefined') radius = 0;
	if (typeof radius === 'number') radius = { tl: radius, tr: radius, br: radius, bl: radius };
	else {
		var defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
		for (var side in defaultRadius) radius[side] = radius[side] || defaultRadius[side];
	}
	ctx.beginPath();
	ctx.moveTo(x + radius.tl, y);
	ctx.lineTo(x + width - radius.tr, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
	ctx.lineTo(x + width, y + height - radius.br);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
	ctx.lineTo(x + radius.bl, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
	ctx.lineTo(x, y + radius.tl);
	ctx.quadraticCurveTo(x, y, x + radius.tl, y);
	ctx.closePath();
	if (fill) ctx.fill();
	if (stroke) ctx.stroke();
}
function infoBox(x, y, width, height, fill, stroke) {
	ctx.save();
	ctx.lineWidth = 1;
	ctx.globalAlpha = .5;

	if(fill){
		ctx.fillStyle = fill;
		ctx.fillRect(x, y, width, height);
	}

	if(stroke){
		ctx.strokeStyle = stroke;
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x + width, y);
		ctx.closePath();
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(x, y + height);
		ctx.lineTo(x + width, y + height);
		ctx.closePath();
		ctx.stroke();
	}

	ctx.restore();
}
function rRaid() {
	if(guest || rank < 6) return;
	ctx.save();
	ctx.fillStyle = 'yellow';
	ctx.textAlign = 'center';
	var secs = raidTimer / 25;
	var minutes = Math.floor(secs / 60), seconds = "" + (Math.floor(secs) % 60);
	if (seconds.length == 1) seconds = "0" + seconds;
	ctx.font = "16px ShareTech";

	if (raidTimer >= 0 && raidTimer < 15000) {
		write(mEng[200] + minutes + ":" + seconds, w / 2, h - 120);
		write(mEng[201] + points, w / 2, h - 80);

		ctx.font = "14px ShareTech";
		write("/   /", w / 2, h - 100);

		ctx.fillStyle = "pink";
		ctx.textAlign = 'right';
		write(raidRed, w / 2 - 24, h - 100);

		ctx.fillStyle = "lime";
		ctx.textAlign = "center";
		write(raidGreen, w / 2, h - 100);

		ctx.fillStyle = "cyan";
		ctx.textAlign = 'left';
		write(raidBlue, w / 2 + 24, h - 100);

	} else if (docked && minutes > 5) write(mEng[202] + (minutes - 10) + ":" + seconds, w / 2, h - 120);
	ctx.restore();
}
function rBigNotes() {
	if(bigNotes[0] === -1) return;
	bigNotes[0][0] -= bigNotes[0][2] === "" ? 2 : 1.25;
	if(bigNotes[0][0] < 0) {
		for(var i = 0; i < 3; i++) bigNotes[i] = bigNotes[i+1]; // shift array down
		bigNotes[3] = -1;
		return;
	}

	var t = bigNotes[0][0];

	//darken background
	ctx.fillStyle = "black";
	ctx.globalAlpha = .8/(1+Math.exp(square(128-t)/5000));
	ctx.fillRect(0,0,w,h);

	//text
	ctx.textAlign = "center";
	ctx.fillStyle = "cyan";
	var x = w/2+(cube(t-128)+10*(t-128))/1500;

	ctx.globalAlpha = .7;
	ctx.font = "48px ShareTech";
	write(bigNotes[0][1], x, h/2 - 64);
	ctx.font = "36px ShareTech";
	write(bigNotes[0][2], x, h/2);
	ctx.font = "24px ShareTech";
	write(bigNotes[0][3], x, h/2+64);
	ctx.globalAlpha = 1;
	ctx.font = "15px ShareTech";
}
function rKillStreak() {
	if (killStreakTimer < 0 || killStreak < 1) return;

	var strTime = "" + Math.round(killStreakTimer / 25);
	while (strTime.length < 2) strTime = "0" + strTime;
	strTime = "0:" + strTime;
	var strMult = mEng[163] + killStreak;

	ctx.save();
	ctx.globalAlpha = Math.min(1, 1 - (killStreakTimer - 730.) / 15.);
	var sizeMult = 1 + Math.max(0, Math.cbrt(killStreakTimer - 730.)) / 2.;
	ctx.textAlign = "center";

	ctx.font = (sizeMult * 30.) + "px ShareTech";
	write(strMult, w / 2, 64);

	ctx.font = (sizeMult * 20.) + "px ShareTech";
	write(strTime, w / 2, 88);

	ctx.restore();
}


//object rendering
function updateBullets() {
	for (var i in bullets) {
		var selfo = bullets[i];
		selfo.x += selfo.vx;
		selfo.y += selfo.vy;
		selfo.tick++;
	}
}
function rBullets() {
	if (!login) updateBullets();
	for (var i in bullets) {
		var selfo = bullets[i];
		var img = Img.redbullet;
		var rendX = selfo.x - px + w / 2 + scrx;
		var rendY = selfo.y - py + h / 2 + scry;
		if (selfo.wepnID == 28) {
			ctx.save();
			ctx.globalAlpha = .1;
			ctx.fillStyle = "white";
			for (var c = 0; c < 10; c++) {
				var angle = Math.random() * Math.PI * 2;
				var uTick = Math.min(selfo.tick, 75);
				var hypot = 4 + square(Math.random() * uTick / 10);
				var hypotCenter = Math.random() * hypot;
				ctx.beginPath();
				ctx.arc(rendX + Math.cos(angle) * hypotCenter, rendY + Math.sin(angle) * hypotCenter, hypot, 0, 2 * Math.PI, false);
				ctx.closePath();
				ctx.fill();
			}
			ctx.restore();
			if (selfo.tick > 750) delete bullets[i];
			continue;
		}
		if (selfo.color == 'blue') img = Img.bluebullet;
		if (selfo.color == 'green') img = Img.greenbullet;
		if (selfo.wepnID == 1 || selfo.wepnID == 23) img = Img.bigBullet;
		var pw = img.width;
		var ph = img.height;
		ctx.save();
		ctx.translate(rendX, rendY);
		ctx.rotate(selfo.angle + Math.PI / 2);
		ctx.drawImage(img, -pw / 2, -ph / 2);
		ctx.restore();
	}
}
function rMissiles() {
	for (var selfo in missilesInfo) {
		selfo = missilesInfo[selfo];
		var img = Img.missile;
		if (selfo.wepnID == 11 || selfo.weaponID == 13) img = Img.heavyMissile;
		if (selfo.wepnID == 12) img = Img.empMissile;
		if (selfo.wepnID == 14) img = Img.torpedo;
		var pw = img.width;
		var ph = img.height;
		var rendX = selfo.x - px + w / 2 + scrx;
		var rendY = selfo.y - py + h / 2 + scry;
		ctx.save();
		ctx.translate(rendX, rendY);
		ctx.rotate(selfo.angle + Math.PI / 2);
		ctx.drawImage(img, -pw / 2, -ph / 2);
		ctx.restore();
	}
}
function rOrbs() {
	for (var i in orbsInfo) {
		var selfo = orbsInfo[i];
		var img = Img.energyDisk;
		if (selfo.wepnID == 42)
			img = Img.photonOrb;
		var pw = img.width;
		var ph = img.height;
		var rendX = selfo.x - px + w / 2 + scrx;
		var rendY = selfo.y - py + h / 2 + scry;
		ctx.save();
		ctx.translate(rendX, rendY);
		ctx.rotate(getTimeAngle() + Math.PI / 2);
		ctx.drawImage(img, -pw / 2, -ph / 2);
		ctx.restore();
	}
}
function rMines() {
	for (var selfo in minesInfo) {
		selfo = minesInfo[selfo];
		var img = Img.mine;
		var pw = img.width;
		var ph = img.height;
		var rendX = selfo.x - px + w / 2 + scrx;
		var rendY = selfo.y - py + h / 2 + scry;
		if (selfo.wepnID == 16)
			img = Img.laserMine;
		else if (selfo.wepnID == 17)
			img = Img.empMine;
		else if (selfo.wepnID == 32) {
			ctx.save();
			ctx.globalAlpha = .1;
			ctx.fillStyle = "white";
			for (var c = 0; c < 10; c++) {
				var angle = Math.random() * Math.PI * 2;
				var uTick = 25;
				var hypot = 4 + square(Math.random() * uTick / 10);
				var hypotCenter = Math.random() * hypot;
				ctx.beginPath();
				ctx.arc(rendX + Math.cos(angle) * hypotCenter, rendY + Math.sin(angle) * hypotCenter, hypot, 0, 2 * Math.PI, false);
				ctx.closePath();
				ctx.fill();
			}
			ctx.restore();
			continue;
		} else if (selfo.wepnID == 33)
			img = Img.grenade;
		ctx.save();
		ctx.translate(rendX, rendY);
		ctx.rotate(selfo.angle);
		ctx.drawImage(img, -pw / 2, -ph / 2);
		ctx.restore();
		ctx.fillStyle = brighten(selfo.color);
		ctx.beginPath();
		ctx.arc(rendX, rendY, 4, 0, 2 * Math.PI, false)
		ctx.fill();
	}
}
function rBeams() {
	ctx.lineWidth = 6;
	for (var i in beamsInfo) {
		var selfo = beamsInfo[i];
		if (selfo.wepnID == 7) ctx.strokeStyle = 'mediumpurple';
		else if (selfo.wepnID == 9) ctx.strokeStyle = 'lime';
		else if (selfo.wepnID == 24) ctx.strokeStyle = 'yellow';
		else if (selfo.wepnID == 33 || selfo.wepnID == 26 || selfo.wepnID == 30) ctx.strokeStyle = '#d0c090';
		else ctx.strokeStyle = 'red';
		var bx = selfo.bx - px + w / 2 + scrx;
		var by = selfo.by - py + h / 2 + scry;
		var ex = selfo.ex - px + w / 2 + scrx;
		var ey = selfo.ey - py + h / 2 + scry;
		ctx.beginPath();
		ctx.moveTo(bx, by);
		ctx.lineTo(ex, ey);
		ctx.globalAlpha = Math.random() * (12 - selfo.time) / 14;
		ctx.stroke();
		ctx.closePath();
	}
	ctx.globalAlpha = 1;
}
function rBlasts() {
	ctx.lineWidth = 12;
	ctx.strokeStyle = 'white';
	for (var i in blastsInfo) {
		var selfo = blastsInfo[i];
		var bx = selfo.bx - px + w / 2 + scrx;
		var by = selfo.by - py + h / 2 + scry;
		var ex = selfo.bx + Math.cos(selfo.angle) * 10000 - px + w / 2 + scrx;
		var ey = selfo.by + Math.sin(selfo.angle) * 10000 - py + h / 2 + scry;
		ctx.beginPath();
		ctx.moveTo(bx, by);
		ctx.lineTo(ex, ey);
		ctx.globalAlpha = Math.random() * (12 - selfo.time) / 14;
		ctx.stroke();
		ctx.closePath();
	}
	ctx.globalAlpha = 1;
}
function rAsteroids() {
	var nearA = 0;
	for (var selfo in astsInfo) {
		selfo = astsInfo[selfo];

		var img = (selfo.metal == 0 ? Img.iron : (selfo.metal == 3 ? Img.platinum : (selfo.metal == 1 ? Img.silver : Img.aluminium)));
		var rendX = selfo.x - px + w / 2 + scrx;
		var rendY = selfo.y - py + h / 2 + scry;
		let d = new Date();
		var healthDec = (.5 + selfo.health / selfo.maxHealth) / 1.5;
		var stime = Math.floor((d.getMilliseconds() / 1000 + d.getSeconds()) / 60 * 1024) % 64;
		var sx = (stime % 8) * 128;
		var sy = Math.floor((stime / 8) % 4 + 4 * (Math.floor(selfo.metal) % 2)) * 128;
		ctx.save();
		ctx.translate(rendX, rendY);
		ctx.drawImage(Img.astUnderlayBlue, -128, -128);
		ctx.rotate(selfo.angle + Math.PI / 2);
		ctx.drawImage(img, sx, sy, 128, 128, -64 * healthDec, -64 * healthDec, 128 * healthDec, 128 * healthDec);
		ctx.restore();

		if (selfo.color != pc) { // update nearest enemy for pointer
			if (nearA == 0)
				nearA = selfo;
			else if ((selfo.x - px) * (selfo.x - px) + (selfo.y - py) * (selfo.y - py) < (nearA.x - px) * (nearA.x - px) + (nearA.y - py) * (nearA.y - py))
				nearA = selfo;
		}
	}
	rAstPointer(nearA);
}
function rPlanets() {
	if (planets == 0) return;
	var selfo = planets;
	var rendX = (selfo.x - px + scrx)/4 + w/2;
	var rendY = (selfo.y - py + scry)/4 + h/2;
	if(rendX < -150 || rendX > w+150 || rendY < -150 || rendY > h+220) return;

	let d = new Date();
	var t = d.getTime() * 500;
	var stime = d.getTime() / 150000;

	var imgi = (sx + sy * mapSz) % 5 + 1;
	var img = planetImgs[imgi];

	var ox = (sinLow(stime * 5) / 2 + .5) * (img.width - 256) + 128;//error on t05 width of undefined
	var oy = (cosLow(stime * 4) / 2 + .5) * (img.height - 256) + 128;
	
	ctx.save();
	var pattern = ctx.createPattern(img, "no-repeat");
	ctx.fillStyle = pattern;
	ctx.translate(rendX, rendY);
	ctx.drawImage(selfo.color==="yellow"?Img.planetU:colorSelect(selfo.color, Img.planetUR, Img.planetUB, Img.planetUG), -155, -155, 310, 310);
	ctx.translate(-ox, -oy);
	ctx.beginPath();
	ctx.arc(ox, oy, 128, 0, 2 * Math.PI);
	ctx.closePath();
	ctx.fill();
	ctx.translate(ox, oy);
	ctx.drawImage(Img.planetO, -128, -128);
	ctx.restore();
	ctx.textAlign = "center";
	ctx.fillStyle = brighten(selfo.color);
	ctx.font = "30px ShareTech";
	write(mEng[127] + selfo.name, rendX, rendY - 196);
	ctx.textAlign = "left";
	ctx.font = "14px ShareTech";
}
function rPacks() {
	for (var selfo in packsInfo) {
		selfo = packsInfo[selfo];
		var img = selfo.type == 0 ? Img.pack : (selfo.type == 1 ? Img.bonus : (selfo.type == 2 ? Img.life : Img.ammo));
		var rendX = selfo.x - px + w / 2 + scrx;
		var rendY = selfo.y - py + h / 2 + scry;
		let d = new Date();
		var stime = (d.getMilliseconds() / 1000 + d.getSeconds()) / 3;
		ctx.save();
		ctx.translate(rendX, rendY);
		ctx.scale(2,2);
		ctx.rotate(stime * Math.PI);
		ctx.drawImage(img, -img.width/2, -img.height/2);
		ctx.restore();
	}
}
function rVorts() {
	let d = new Date();
	var angleT = d.getTime() / 1000;
	for (var selfo in vortsInfo) {
		ctx.save();
		selfo = vortsInfo[selfo];
		var img = selfo.isWorm ? Img.worm : Img.vort;
		var size = 24 * selfo.size / 64;
		var rendX = selfo.x - px + w / 2 + scrx;
		var rendY = selfo.y - py + h / 2 + scry;
		ctx.translate(rendX, rendY);
		ctx.rotate(angleT % (Math.PI * 2));
		ctx.drawImage(img, -size / 2, -size / 2, size, size);
		ctx.globalAlpha = .3;
		ctx.rotate(-.5 * angleT % (Math.PI * 2));
		ctx.drawImage(img, -size * 3 / 4, -size * 3 / 4, 1.5 * size, 1.5 * size);
		ctx.restore();
		currAlert = selfo.isWorm ? mEng[128] : mEng[129];
	}
}
function rPlayers() {
	var pointers = [0,0,0];
	for (var selfo in playersInfo) {
		selfo = playersInfo[selfo];
		if(selfo.disguise > 0) continue;

		ctx.strokeStyle = "grey";
		var img = colorSelect(selfo.color, redShips, blueShips, greenShips)[selfo.ship];

		var pw = img.width;
		var ph = img.height;
		if (pw == 0 || ph == 0) return;
		var rendX = selfo.x - px + w / 2 + scrx;
		var rendY = selfo.y - py + h / 2 + scry;

		ctx.save();
		ctx.translate(rendX, rendY);
		ctx.globalAlpha = .8;
		ctx.drawImage(colorSelect(selfo.color, Img.astUnderlayRed, Img.astUnderlayBlue, Img.astUnderlayGreen), -pw, -ph, pw * 2, ph * 2);
		ctx.globalAlpha = 1;
		ctx.rotate(selfo.angle + Math.PI / 2);
		var fireWidth = 32 * 1.2 * Math.sqrt(pw / 64), fireHeight = selfo.speed * 1.4 * pw / 64 + Math.random() * pw / 25;
		if (selfo.speed > 0) ctx.drawImage(Img.fire, 0, tick % 8 * 64, 64, 64, -fireWidth / 2, 0, fireWidth, fireHeight);
		ctx.restore();
		ctx.save();
		ctx.translate(rendX, rendY);
		ctx.rotate(selfo.angle + Math.PI / 2);
		ctx.drawImage(img, -pw / 2, -ph / 2);
		ctx.restore();

		ctx.fillStyle = brighten(selfo.color);
		ctx.textAlign = "center";
		write(selfo.name, rendX, rendY - ships[selfo.ship].width * .5);
		ctx.textAlign = "left";

		if (selfo.name === myName){
			if(selfo.health < selfo.maxHealth * .3) currAlert = mEng[150];
		} else for(var i = 0; i<3; i++){
			if (selfo.color===teamColors[i]) {
				if (pointers[i]===0) pointers[i] = selfo;
				else if (square(selfo.x - px) + square(selfo.y - py) < square(pointers[i].x - px) + square(pointers[i].y - py)) pointers[i] = selfo;
			}
		}

		if (selfo.hasPackage) rBackPack(selfo);
		ctx.lineWidth = 6;
		if (selfo.shield) {
			ctx.strokeStyle = 'lightblue';
			ctx.beginPath();
			ctx.arc(rendX, rendY, pw / 1.5 - 8, 0, 2 * Math.PI, false);
			ctx.stroke();
		}
		if (selfo.health / selfo.maxHealth >= 1) continue;
		ctx.lineWidth = 4;
		var r = Math.floor((1 - selfo.health / selfo.maxHealth) * 255);
		var g = Math.floor(255 * selfo.health / selfo.maxHealth);
		var b = Math.floor(64 * selfo.health / selfo.maxHealth);
		ctx.strokeStyle = "rgb(" + r + ", " + g + ", " + b + ")";
		ctx.beginPath();
		ctx.arc(rendX, rendY, pw / 1.5, (2.5 - selfo.health / selfo.maxHealth * .99) * Math.PI, (.501 + selfo.health / selfo.maxHealth) * Math.PI, false);
		ctx.stroke();
	}
	rTeamPointers(pointers);
}
function rSelfCloaked() {
	ctx.strokeStyle = "grey";
	var img = (pc==="red"?redShips:(pc==="blue"?blueShips:greenShips))[ship];

	var pw = img.width;
	var ph = img.height;
	var rendX = px - px + w / 2 + scrx;
	var rendY = py - py + h / 2 + scry;

	ctx.save();
	ctx.translate(rendX, rendY);
	ctx.rotate(pangle + Math.PI / 2);
	ctx.globalAlpha = .25;
	ctx.drawImage(img, -pw / 2, -ph / 2);
	ctx.restore();
	ctx.lineWidth = 6;
	if (shield) {
		ctx.strokeStyle = 'lightblue';
		ctx.beginPath();
		ctx.arc(rendX, rendY, pw / 1.5 - 8, 0, 2 * Math.PI, false);
		ctx.stroke();
	}
	var pmaxHealth = ships[ship].health * mh2;
	if (phealth < pmaxHealth * .3)
		currAlert = mEng[150];

	if (phealth / pmaxHealth >= 1)//draw hp bar
		return;
	ctx.lineWidth = 4;
	var r = Math.floor((1 - phealth / pmaxHealth) * 255);
	var g = Math.floor(255 * phealth / pmaxHealth);
	var b = Math.floor(64 * phealth / pmaxHealth);
	ctx.strokeStyle = "rgb(" + r + ", " + g + ", " + b + ")";
	ctx.beginPath();
	ctx.arc(rendX, rendY, pw / 1.5, (2.5 - phealth / pmaxHealth * .99) * Math.PI, (.501 + phealth / pmaxHealth) * Math.PI, false);
	ctx.stroke();
}
function rBases() {
	if (basesInfo !== undefined) { // render bases

		var image = basesInfo.color == 'red' ? Img.rss : (basesInfo.color == 'blue' ? Img.bss : Img.gss);
		var pw = image.width;
		var ph = image.height;
		var rendX = basesInfo.x - px + w / 2 + scrx;
		var rendY = basesInfo.y - py + h / 2 + scry;
		if (basesInfo.color !== pc) currAlert = mEng[131];

		if (basesInfo.isBase) {
			ctx.save();
			ctx.translate(rendX, rendY);
			ctx.rotate(tick/1000 + Math.PI / 2);
			ctx.drawImage(colorSelect(basesInfo.color, Img.astUnderlayRed, Img.astUnderlayBlue, Img.astUnderlayGreen), -512, -512, 1024, 1024);
			ctx.drawImage(image, -384, -384, 768, 768);
			ctx.restore();
			ctx.textAlign = "center";
			ctx.fillStyle = 'lime';
			if (experience < 64 && basesInfo.color == pc && square(px - basesInfo.x) + square(py - basesInfo.y) < square(512)) {
				ctx.font = "" + (2.5 * sinLow(tick / 8) + 15) + "px ShareTech";
				write(mEng[130], rendX, rendY - 96);
				ctx.font = "14px ShareTech";
			}
			ctx.textAlign = "left";
		} else { // write name
			ctx.textAlign = "center";
			ctx.fillStyle = 'white';
			ctx.font = "14px ShareTech";
			write(basesInfo.name, rendX, rendY - 64);
		}

		if (basesInfo.turretLive) {
			var timage = basesInfo.color === 'red' ? Img.rt : (basesInfo.color === 'blue' ? Img.bt : Img.gt);
			pw = timage.width; // render turrets
			ph = timage.height;
			ctx.save();
			ctx.translate(rendX, rendY);
			ctx.rotate(basesInfo.angle + Math.PI / 2);
			ctx.drawImage(timage, -pw / 2, -ph / 2);
			ctx.restore();

			if (basesInfo.health / basesInfo.maxHealth < 1) {
				ctx.lineWidth = 4;
				var r = Math.floor((1 - basesInfo.health / basesInfo.maxHealth) * 255);
				var g = Math.floor(255 * basesInfo.health / basesInfo.maxHealth);
				var b = Math.floor(64 * basesInfo.health / basesInfo.maxHealth);
				ctx.strokeStyle = "rgb(" + r + ", " + g + ", " + b + ")";
				ctx.beginPath();
				ctx.arc(rendX, rendY, pw / 1.5, (2.5 - .99 * basesInfo.health / basesInfo.maxHealth) * Math.PI, (.501 + basesInfo.health / basesInfo.maxHealth) * Math.PI, false);
				ctx.stroke();
			}
		}

		rBasePointer(basesInfo);
	}
}
function rBackPack(selfo) {
	var img = Img.pack;
	var rendX = selfo.x - px + w / 2 + scrx;
	var rendY = selfo.y - py + h / 2 + scry;
	ctx.save();
	ctx.translate(rendX, rendY);
	ctx.drawImage(img, -16, -16, 32, 32);
	ctx.restore();
}


//pointer rendering
function rEdgePointer() {
	var angle = 0;
	if (px < py) {
		if (sectorWidth - px > py) angle = 2;
		else angle = 1;
	} else {
		if (sectorWidth - px > py) angle = 3;
		else angle = 0;
	}
	var text = '';
	if (angle == 0) text = sectorWidth - px;
	else if (angle == 3) text = py;
	else if (angle == 2) text = px;
	else if (angle == 1) text = sectorWidth - py;
	rPointerArrow(Img.yellowArrow,angle*Math.PI/2,text,'yellow');
}
function rBasePointer(nearB) {
	var text = Math.hypot(nearB.x - px, nearB.y - py);
	var angle = Math.atan2(nearB.y - py, nearB.x - px);
	rPointerArrow(Img.whiteArrow,angle,text,'lightgray');
}
function rTeamPointers(pointers) {
	for (var i = 0; i < 3; i++) {
		if(pointers[i]===0)continue;
		var text = Math.hypot(pointers[i].x - px, pointers[i].y - py);
		var angle = Math.atan2(pointers[i].y - py, pointers[i].x - px);
		rPointerArrow(colorSelect(teamColors[i],Img.redArrow, Img.blueArrow,Img.greenArrow),angle,text,colorSelect(teamColors[i],"red","cyan","lime"));
	}
}
function rAstPointer(nearE) {
	var text = Math.hypot(nearE.x - px, nearE.y - py);
	var angle = Math.atan2(nearE.y - py, nearE.x - px);
	rPointerArrow(Img.orangeArrow,angle,text,'orange');
}
function rBlackHoleWarning() {
	if (sx != Math.floor(mapSz / 2) || sy != Math.floor(mapSz / 2)) return;
	if (typeof redShips[ship] === "undefined" && typeof blueShips[ship] === "undefined") return;
	var pw = typeof redShips[ship] === "undefined" ? blueShips[ship].width : redShips[ship].width;
	var dx = sectorWidth / 2 - px;
	var dy = sectorWidth / 2 - py;
	var angle = Math.atan2(dy, dx);
	rPointerArrow(Img.blackArrow,angle,Math.hypot(dx,dy),'white');
}
function rPointerArrow(img, angle, dist, textColor){
	if(!(guest && textColor === 'lightgray'))
		if (dist < 100 || dist > va2*3840 - 1280) return;
	dist = Math.floor(dist / 10);
	ctx.fillStyle = textColor;
	var pw = ships[ship].width;
	var rendX = w / 2 + pw * 1 * cosLow(angle) + scrx;
	var rendY = h / 2 + pw * 1 * sinLow(angle) + scry;
	var rendXt = w / 2 + pw * 1.3 * cosLow(angle) + scrx;
	var rendYt = h / 2 + pw * 1.3 * sinLow(angle) + scry;
	var hw = img.width / 2;
	ctx.save();
	ctx.translate(rendX, rendY);
	ctx.rotate(angle);
	ctx.drawImage(img, -hw, -hw);
	ctx.restore();
	ctx.textAlign = "center";
	write(dist, rendXt, rendYt + 6);
	ctx.textAlign = "left";
}