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

import { Howl } from 'howler';

declare const login: any;
declare const gVol: any;

declare let currLoading: string;
declare let Aud_prgs: number[];

let musicMuted = false;
let muted = false;

let musicAudio = 0;
(<any>global).Aud_prgs = [0, 0];

const Aud: Map<string, Howl> = new Map();

/**
 * Toggle whether SFX can be heard or not.
 * @returns Current SFX mute state.
 */
const toggleSFX = () => {
    muted = !muted;
    if (!muted)
        for (const entry of Aud)
            if (entry[0] !== `music1`) entry[1].stop();

    return muted;
};

/**
 * Toggle whether music can be heard or not.
 * @returns Current music mute state.
 */
const toggleMusic = () => {
    const music = Aud.get(`music1`);
    musicMuted = !musicMuted;

    if (musicMuted && login) music.pause();
    else if (musicAudio !== 0) music.play();

    return musicMuted;
};

/**
 * Play an audio file.
 * @param name The name of the file to play.
 * @param vol The volume at which to play the file.
 */
const playAudio = (name: string, vol: any) => {
    if (muted) return;

    const audio = Aud.get(name);
    if (!audio) return console.error(`Unknown sound: ${name}.`);

    const id = audio.play();
    audio.volume(gVol * vol, id);

    if (name === `bigboom`) audio.volume(gVol * vol * 2, id);
    if (name === `noammo`) audio.volume(gVol * vol * 5, id);

    if (name === `music1`) {
        audio.volume(gVol * vol / 2, id);
        musicAudio = id;
    }
};

/**
 * Load an audio file.
 * @param name The name of the audio file to load.
 * @param src The absolute path to the audio file.
 */
const loadAudio = (name: string, src: string) => {
    const audExists = Aud.get(name);
    if (audExists) return console.error(`Audio already exists: ${name}`);

    Aud.set(name, new Howl({
        src,
        autoplay: false,
        loop: false,
        preload: true,
        pool: 15,

        onload: () => {
            currLoading = `Loaded audio ${name}`;
            Aud_prgs[0]++;
        }
    }));

    Aud_prgs[1]++;
};

export {
    toggleSFX,
    toggleMusic,

    playAudio,
    loadAudio
};
