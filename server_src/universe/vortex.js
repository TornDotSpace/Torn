module.exports = class Vortex {
  constructor(i, x, y, sxx, syy, size, ownr, isWorm) {
    this.isWorm = isWorm, // am i a wormhole or black hole
    this.sxo = Math.floor(Math.random() * mapSz), // output node location for wormhole
    this.syo = Math.floor(Math.random() * mapSz),
    this.xo = Math.random() * sectorWidth,
    this.yo = Math.random() * sectorWidth,

    this.type = 'Vortex',
    this.wepnID = 28,
    this.owner = ownr,
    this.id = i, // unique identifier

    this.vx = 0,
    this.vy = 0,
    this.x = x, // input node or black hole location
    this.y = y,
    this.sx = sxx,
    this.sy = syy,

    this.size = size;
  }
  tick() {
    this.move();

    if (this.owner != 0) { // if I'm a gravity bomb
      this.size -= 6; // shrink with time
      if (this.size < 0) this.die();
    } else this.size = 2500;
  }

  move() {
    if (this.isWorm) {
      const t = tick / 40000;

      // the doubles in here are just random numbers for chaotic motion. Don't mind them.

      // input node
      const bx = Math.sin(7.197 * t) / 2 + .5;
      const by = -Math.sin(5.019 * t) / 2 + .5;

      const oldSx = this.sx;
      const oldSy = this.sy;

      this.sx = Math.floor(bx * mapSz);
      this.sy = Math.floor(by * mapSz);

      if (oldSx != this.sx || oldSy != this.sy) {
        vorts[this.sy][this.sx][this.id] = vorts[oldSy][oldSx][this.id];
        delete vorts[oldSy][oldSx][this.id];
      }

      this.x = ((bx * mapSz) % 1) * sectorWidth;
      this.y = ((by * mapSz) % 1) * sectorWidth;

      // output node
      const bxo = -Math.sin(9.180 * t) / 2 + .5;
      const byo = Math.sin(10.3847 * t) / 2 + .5;
      this.sxo = Math.floor(bxo * mapSz);
      this.syo = Math.floor(byo * mapSz);
      this.xo = ((bxo * mapSz) % 1) * sectorWidth;
      this.yo = ((byo * mapSz) % 1) * sectorWidth;

      // every 2 seconds, tell the players where I am (for radar only, I think)
      if (tick % 50 == 0) sendAll('worm', {bx: bx, by: by, bxo: bxo, byo: byo});
    }


    for (const i in players[this.sy][this.sx]) {
      const p = players[this.sy][this.sx][i];

      // compute distance and angle to players
      const dist = Math.pow(squaredDist(this, p), 0.25);
      const a = angleBetween(p, this);
      // then move them.
      let guestMult = (p.guest || p.isNNBot) ? -1 : 1; // guests are pushed away, since they aren't allowed to leave their sector.
      if (p.ship == 21 && !this.isWorm) guestMult=0.5*(-1+(50/dist)); //R21 ship gets pushed from a BH if too far, BUT IT'S STILL PULLED WITH FORCE IF TOO CLOSE. Reason this isn't an increment is because someone could get a GUEST at level 21, buy the ship, and then the old *=0.5 would actually be more OP than the old code.
      p.x -= guestMult * .40 * this.size / dist * Math.cos(a);
      p.y -= guestMult * .40 * this.size / dist * Math.sin(a);

      if (dist < 15 && !this.isWorm) { // collision with black hole
        p.die(this); // i think it's important that this happens before we give them the achievements

        if (p.e) {
          p.driftAchs[8] = true; // drift into a black hole
          p.sendAchievementsDrift(true);
        }

        p.randmAchs[4] = true; // fall into a black hole
        p.sendAchievementsMisc(true);
      } else if (dist < 15 && this.isWorm) { // collision with wormhole
        p.randmAchs[3] = true; // fall into a wormhole
        p.sendAchievementsMisc(true);

        delete players[p.sy][p.sx][p.id];
        p.sx = this.sxo;
        p.sy = this.syo;
        p.y = this.yo;
        p.x = this.xo; // teleport them to the output node

        p.onChangeSectors();

        players[p.sy][p.sx][p.id] = p;
      }
    }
  }
  die(b) {
    sendAllSector('sound', {file: 'bigboom', x: this.x, y: this.y, dx: 0, dy: 0}, this.sx, this.sy);
    delete vorts[this.sy][this.sx][this.id];
  }
  onKill() {
  } // do we need these functions here? :thonk: I think we might be calling em
  spoils(type, amt) {
  }
};
