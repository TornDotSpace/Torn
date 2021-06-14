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

declare const global: any;
declare const loadLang: any;

const eng = `english.json`;
const esp = `translations/spanish.json`;
const tki = `translations/tokipona.json`;
const chn = `translations/chinese.json`;

let languagejson = null;
let mEng = require(`../client/translations/translate.json`);

export let jsn = require(`../client/weapons.json`);

let languageNumber = 0;

let splash = ``;

export const getSplash = () => splash;

const load = (lang) => {
    const request = new XMLHttpRequest();
    request.open(`GET`, lang, false);

    let data = ``;
    request.onload = function (e) {
        if (request.readyState === 4) {
            data = request.responseText;
        }
    };

    request.send(null);
    return JSON.parse(data);
};

global.loadLang = (name) => {
    let assigned = null;

    // re-think value assigned to var "assigned"
    if (location.href.includes(`eng`) || name === `eng`) {
        assigned = languagejson = eng;
        languageNumber = 0;
    } else if (location.href.includes(`esp`) || name === `esp`) {
        assigned = languagejson = esp;
        languageNumber = 1;
    } else if (location.href.includes(`tki`) || name === `tki`) {
        assigned = languagejson = tki;
        languageNumber = 2;
    } else if (location.href.includes(`chn`) || name === `chn`) {
        assigned = languagejson = chn;
        languageNumber = 3;
    }

    if (!assigned) {
        let lang = document.cookie.replace(/(?:(?:^|.*;\s*)lang\s*\=\s*([^;]*).*$)|^.*$/, `$1`);

        if (lang === `esp`) {
            languagejson = esp;
            languageNumber = 1;
        } else if (lang === `eng`) {
            languagejson = eng;
        } else if (lang === `tki`) {
            languagejson = tki;
            languageNumber = 2;
        } else if (lang === `chn`) {
            languagejson = chn;
            languageNumber = 3;
        }
    }

    if (!languagejson) languagejson = eng;

    languagejson = load(languagejson);

    jsn.achNames = languagejson.achNames;
    jsn.splashes = languagejson.splashes;

    jsn.lore = languagejson.lore;
    console.log(`Translating weapons...`);
    for (let i = 0; i < Object.keys(jsn.weapons).length; i++) {
        if (!(i in jsn.weapons)) continue;
        jsn.weapons[i].name = languagejson.weapons[i].name;
        jsn.weapons[i].desc = languagejson.weapons[i].desc;
    }
    console.log(`Translating ships...`);
    for (let i = 0; i < Object.keys(jsn.ships).length; i++) {
        jsn.ships[i].nameA = languagejson.ships[i].nameA;
        jsn.ships[i].nameH = languagejson.ships[i].nameH;
        jsn.ships[i].nameC = languagejson.ships[i].nameC;
        jsn.ships[i].desc = languagejson.ships[i].desc;
    }

    splash = jsn.splashes[Math.floor(Math.random() * jsn.splashes.length)];
    if (!splash.endsWith(`!`) && !splash.endsWith(`?`)) splash += `...`;
};

loadLang(null);

export const translate = (english, arr = undefined) => { // arr = undefined???
    if (typeof mEng[english] === `undefined`) return english;

    let translated = (languageNumber == 0) ? english : mEng[english][languageNumber - 1];
    if (arr !== undefined) while (arr.length > 0) translated = translated.replace(`#`, arr.shift());

    return translated;
};
