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

global.muted = false; global.musicMuted = false;

// Passed to React Root
global.toggleAudio = function() {
  muted ^= true;
  Howler.mute(muted);
  return muted;
};

// Passed to React Root
global.toggleMusic = function() {
  musicMuted ^= true;
  if (musicMuted && login) Aud["music1"].pause();
  else if (musicAudio != 0) Aud["music1"].play();
  return musicMuted;
};

// Use this function to play any sound from the Aud object
global.playAudio = function(name, vol) {
  if (muted || !soundAllowed) return;
  const audio = Aud[name];
  if (!audio) {
    console.error("Unknown sound " + name);
  }
  const id = audio.play();

  audio.volume(gVol * vol, id);

  if (name == "bigboom") audio.volume(gVol * vol * 2, id);
  if (name == "noammo") audio.volume(gVol * vol * 5, id);

  if (name === "music1") {
    audio.volume(gVol * vol / 2, id);
    musicAudio = id;
  }
};

global.Aud = {};
global.Aud_prgs = [0, 0];

global.loadAudio = function(name, _src) {
  if (Aud[name]) {
    console.error("Loading audio twice: " + name);
  }
  Aud[name] = new Howl({
    src: _src,
    autoplay: false,
    loop: false,
    preload: true,
    onload: function() {
      currLoading = "Loaded audio "+name;
      ++Aud_prgs[0];
    },
    pool: 15,
  });
  Aud_prgs[1]++;
};
global.loadAllAudio = function() {
  loadAudio("minigun", "/aud/minigun.mp3");
  loadAudio("boom", "/aud/boom.mp3");
  loadAudio("hyperspace", "/aud/hyperspace.mp3");
  loadAudio("bigboom", "/aud/bigboom.wav");
  loadAudio("shot", "/aud/shot.mp3");
  loadAudio("beam", "/aud/beam.wav");
  loadAudio("missile", "/aud/whoosh.mp3");
  loadAudio("sector", "/aud/sector.wav");
  loadAudio("money", "/aud/money.wav");
  loadAudio("button2", "/aud/button2.wav");
  loadAudio("noammo", "/aud/noammo.wav");
};
