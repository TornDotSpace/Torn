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
