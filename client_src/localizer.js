var eng = "english.json";
var esp = "spanish.json";
var pyc = "russian.json";
var deu = "german.json";
var frn = "french.json";

global.languagejson = null;

global.jsn = require("../client/weapons.json");

global.setLang = function (name) {
    document.cookie = ("lang=" + name);
    loadLang(name);
}
function load(lang) {
    var request = new XMLHttpRequest();
    request.open("GET", lang, false);

    var data = "";
    request.onload = function (e) {
        if (request.readyState === 4) {
            data = request.responseText;
        }
    }

    request.send(null);
    return JSON.parse(data);
}

global.loadLang = function (name) {
    var assigned = null;
    if (location.href.includes("eng") || name == "eng") assigned = languagejson = eng;
    if (location.href.includes("frn") || name === "frn") assigned = languagejson = frn;
    if (location.href.includes("esp") || name === "esp") assigned = languagejson = esp;
    if (location.href.includes("pyc") || name === "pyc") assigned = languagejson = pyc;
    if (location.href.includes("deu") || name === "deu") assigned = languagejson = deu;

    if (!assigned) {
        var lang = document.cookie.replace(/(?:(?:^|.*;\s*)lang\s*\=\s*([^;]*).*$)|^.*$/, "$1");

        //console.log(lang);
        if (lang == null) {
            languagejson = eng;
        }
        if (lang === "frn") {
            languagejson = frn;
        } else if (lang === "esp") {
            languagejson = esp;
        } else if (lang === "pyc") {
            languagejson = pyc;
        } else if (lang === "eng") {
            languagejson = eng;
        } else if (lang == "deu") {
            languagejson = deu;
        }
    }

    if (languagejson == null) {
        languagejson = eng;
    }

    languagejson = load(languagejson);

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
    global.splash = jsn.splashes[Math.floor(Math.random() * jsn.splashes.length)];
    if (!splash.endsWith("!") && !splash.endsWith("?")) splash += "...";
}