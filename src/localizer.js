global.eng = require("../client/english.json");
global.esp = require("../client/spanish.json");
global.pyc = require("../client/russian.json");
global.deu = require("../client/german.json");
global.frn = require("../client/french.json");

global.jsn = require("../client/weapons.json");

global.languagejson = eng;

import ReactRoot from "./react.js";

global.setLang = function () {
    if (location.href.includes("frn")) languagejson = frn;
    if (location.href.includes("esp")) languagejson = esp;
    if (location.href.includes("pyc")) languagejson = pyc;
    if (location.href.includes("deu")) languagejson = deu;

    jsn.messages = languagejson.messages;

    jsn.achNames = languagejson.achNames;
    jsn.splashes = languagejson.splashes;

    jsn.lore = languagejson.lore;
    for (var i = 0; i < jsn.weapons.length; i++) {
        jsn.weapons[i].name = languagejson.weapons[i].name;
        jsn.weapons[i].desc = languagejson.weapons[i].desc;
    }
    for (var i = 0; i < jsn.ships.length; i++) {
        jsn.ships[i].nameA = languagejson.ships[i].nameA;
        jsn.ships[i].nameH = languagejson.ships[i].nameH;
        jsn.ships[i].desc = languagejson.ships[i].desc;
    }
    global.mEng = jsn.messages;
    global.achNames = jsn.achNames;
    global.splash = jsn.splashes[Math.floor(Math.random() * jsn.splashes.length)];
    if (!splash.endsWith("!") && !splash.endsWith("?")) splash += "...";
}

global.rLoadingBar = function () {
    var w = window.innerWidth;
    var h = window.innerHeight; // Canvas width and height

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "white";
    ctx.fillRect(w / 2 - 128, h / 2 - 32, 256, 64);
    ctx.fillStyle = 'black';
    ctx.fillRect(w / 2 - 128 + 8, h / 2 - 32 + 8, 256 - 16, 64 - 16);
    ctx.fillStyle = 'white';
    ctx.fillRect(w / 2 - 128 + 16, h / 2 - 32 + 16, (256 - 32) * ((Aud_prgs[0] + Img_prgs[0]) / (Aud_prgs[1] + Img_prgs[1])), 64 - 32);
    ctx.textAlign = "center";
    ctx.font = "30px Nasa";
    ctx.fillText(splash, w / 2, h / 2 - 96);
}

global.endsplash = function () {
    ReactRoot.turnOnDisplay("LoginOverlay");
}

global.resplash = function () {
    ReactRoot.turnOffDisplay("LoginOverlay");
    rLoadingBar();
    this.setTimeout(endsplash, 15);
    return;
}
