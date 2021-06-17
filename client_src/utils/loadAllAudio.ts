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

import { loadAudio } from '../modules/audio';

/**
 * Load all audio files.
 */
const loadAllAudio = () => {
    loadAudio(`minigun`, `/aud/minigun.mp3`);
    loadAudio(`boom`, `/aud/boom.mp3`);
    loadAudio(`hyperspace`, `/aud/hyperspace.mp3`);
    loadAudio(`bigboom`, `/aud/bigboom.wav`);
    loadAudio(`shot`, `/aud/shot.mp3`);
    loadAudio(`beam`, `/aud/beam.wav`);
    loadAudio(`assimilation`, `/aud/spacenoise2.wav`);
    loadAudio(`missile`, `/aud/whoosh.mp3`);
    loadAudio(`sector`, `/aud/sector.wav`);
    loadAudio(`money`, `/aud/money.wav`);
    loadAudio(`button2`, `/aud/button2.wav`);
    loadAudio(`noammo`, `/aud/noammo.wav`);
};

export default loadAllAudio;
