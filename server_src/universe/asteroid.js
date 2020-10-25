function isOutOfBounds(obj) { // TODO this works but I'm not even using it anywhere. it would simplify some code if used.
  return obj.x < 0 || obj.y < 0 || obj.x >= sectorWidth || obj.y >= sectorWidth;
}

const astCount = new Array(mapSz);

for (let i = 0; i < mapSz; i++) {
  astCount[i] = new Array(mapSz);

  for (let j = 0; j < mapSz; j++) {
    astCount[i][j] = 0;
  }
}

class Asteroid {
  constructor(i, h, sx, sy, x, y, vx, vy, metal) {
    this.type = 'Asteroid',
    this.id = i, // unique identifier
    this.x = x,
    this.y = y,
    this.angle = 0,
    this.health = h,
    this.maxHealth = h,
    this.sx = sx,
    this.sy = sy,
    this.vx = vx,
    this.vy = vy,
    this.metal = metal,
    this.va = (Math.random() - .5) / 10;
    if(this.vx==0 && this.vy==0){
      this.vx=3*(Math.random()-.5);
      this.vy=3*(Math.random()-.5);
    }
  }

  tick() {
    const asteroidsHere = astCount[this.sy][this.sx];
    this.health-=asteroidsHere/200; // decay asteroids so they don't get too bunched up in any one area
    if (this.health < -50) this.die(0);
    this.move();
    if (Math.abs(this.vx) + Math.abs(this.vy) > 1.5) { // if we're moving sufficiently fast, check for collisions with players.
      for (const i in players[this.sy][this.sx]) {
        const p = players[this.sy][this.sx][i];
        if (squaredDist(p, this) < square(32 + ships[p.ship].width) / 10) { // on collision,
          p.dmg(5 * Math.hypot(p.vx - this.vx, p.vy - this.vy), this); // damage proportional to impact velocity
          sendAllSector('sound', {file: 'boom', x: this.x, y: this.y, dx: 0, dy: 0}, this.sx, this.sy);

          // bounce the player off. Same formula as used for mine impulse.
          const mult = 200 / Math.max(1, .001 + Math.hypot(p.x - this.x, p.y - this.y));
          p.vx = mult * (Math.cbrt(p.x - this.x));
          p.vy = mult * (Math.cbrt(p.y - this.y));

          p.updatePolars(); // we just modified their rectangular info.
          p.angle = p.driftAngle; // make them look in the direction they're moving.
        }
      }

      const b = bases[this.sy][this.sx];
      if (b != 0 && b.turretLive && squaredDist(this, b) < 3686.4) { // collision with base
        b.dmg(10 * Math.hypot(this.vx, this.vy), this);
        sendAllSector('sound', {file: 'boom', x: this.x, y: this.y, dx: 0, dy: 0}, this.sx, this.sy);
        this.die(b);
      }
    }
  }
  move() {
    this.angle += this.va;
    if (Math.abs(this.vx) + Math.abs(this.vy) < .5) return;
    this.vx *= .997;
    this.vy *= .997;
    //ASTEROID GRAVITY, ACTIVATE AT YOUR OWN LAGGY RISK
    /*if(Math.random()<.2){
      let gvx = 0;
      let gvy = 0;
      for (const i in asts[this.sy][this.sx]) {
        const ast = asts[this.sy][this.sx][i];
        if (ast.id !== this.id){ //Not going to count itself's gravity.
          const dist = squaredDist(ast, this);
          const ang = angleBetween(this, ast); // angle from the horizontal
          //const density = this.metal+1; // Density of the metal.
          const vel =  (this.health) / (100* Math.log(dist)); // compute how fast to move by
          gvx += Math.cos(ang) * vel; // actually accelerate them. Reason I'm not using vx is to allow electromag to have a lasting effect (otherwise they don't have electromagnet inertia)
          gvy += Math.sin(ang) * vel;
        }
      }
      this.x += + gvx;
      this.y += + gvy;
    }*/
    //OUT OF BOUNDS BEHAVIOUR ¿DIE OR CROSS?
    this.x+=this.vx;
    this.y+=this.vy;

    const old_sx=this.sx;
    const old_sy=this.sy;
    if (this.x > sectorWidth) {// check each edge of the 4 they could cross.
      this.x = 1;
      this.sx = (this.sx+1+mapSz)%mapSz;
    } else if (this.y > sectorWidth) {
      if (this.sy >= mapSz-1) {
        this.die(0);
      } else {
        this.y = 1;
        this.sy++;
      }
    } else if (this.x < 0) {
      this.x = (sectorWidth - 1);
      this.sx = (this.sx-1+mapSz)%mapSz;
    } else if (this.y < 0) {
      if (this.sy == 0) {
        this.die(0);
      } else {
        this.y = (sectorWidth - 1);
        this.sy--;
      }
    }

    if (old_sx !== this.sx || old_sy !== this.sy) {
      delete asts[old_sy][old_sx][this.id];
      asts[this.sy][this.sx][this.id] = this;
      astCount[old_sy][old_sx]--; 
      astCount[this.sy][this.sx]++; // Keep accurate count when asteroid changes sector
    }
  }
  die(b) {
    // Bugfix for ion beam destroying multiple times
    this.die = function() { };

    // Prevent flooding of sectors with asteroids by only re-spawning if we've fallen below the sector min (8)
    if (--astCount[this.sy][this.sx] < minSectorAsteroidCount) {
      createAsteroid(Math.floor(Math.random()*mapSz), Math.floor(Math.random()*mapSz));
    }

    delete asts[this.sy][this.sx][this.id];
    if (b == 0) return;

    if (b.owner.type == 'Player') {
      switch (this.metal) {
        case 0:
          b.owner.iron += this.maxHealth;
          if (b.owner.platinum + b.owner.iron + b.owner.copper + b.owner.silver > b.owner.capacity) { // TODO represent player.ores as an array to make this much less stupid
            b.owner.iron = b.owner.capacity - (b.owner.platinum + b.owner.copper + b.owner.silver);
            if (b.owner.strongLocal !== undefined) b.owner.strongLocal('Cargo Bay Full', b.owner.x, b.owner.y + 256);
          }
          break;
        case 1:
          b.owner.silver += this.maxHealth;
          if (b.owner.platinum + b.owner.iron + b.owner.copper + b.owner.silver > b.owner.capacity) {
            b.owner.silver = b.owner.capacity - (b.owner.platinum + b.owner.copper + b.owner.iron);
            if (b.owner.strongLocal !== undefined) b.owner.strongLocal('Cargo Bay Full', b.owner.x, b.owner.y + 256);
          }
          break;
        case 2:
          b.owner.copper += this.maxHealth;
          if (b.owner.platinum + b.owner.iron + b.owner.copper + b.owner.silver > b.owner.capacity) {
            b.owner.copper = b.owner.capacity - (b.owner.platinum + b.owner.iron + b.owner.silver);
            if (b.owner.strongLocal !== undefined) b.owner.strongLocal('Cargo Bay Full', b.owner.x, b.owner.y + 256);
          }
          break;
        default:
          b.owner.platinum += this.maxHealth;
          if (b.owner.platinum + b.owner.iron + b.owner.copper + b.owner.silver > b.owner.capacity) {
            b.owner.platinum = b.owner.capacity - (b.owner.iron + b.owner.copper + b.owner.silver);
            if (b.owner.strongLocal !== undefined) b.owner.strongLocal('Cargo Bay Full', b.owner.x, b.owner.y + 256);
          }
          break;
      }
      b.owner.onMined(this.metal);
      b.owner.spoils('ore', this.maxHealth);// just sends the message
      b.owner.noteLocal('+' + this.maxHealth + ' ore', b.owner.x, b.owner.y - 64);
    }
    let expGained = 1;
    if (b.owner.type === 'Player') expGained = b.owner.rank < 10?2-b.owner.rank/5:0;
    if (b.owner.type === 'Player' || b.owner.type === 'Base') b.owner.spoils('experience', expGained);
    sendAllSector('sound', {file: 'bigboom', x: this.x, y: this.y, dx: 0, dy: 0}, this.sx, this.sy);
  }
  dmg(d, origin) {
    this.health -= d;
    if (this.health < 0) this.die(origin);
    note('-' + Math.floor(d), this.x, this.y - 64, this.sx, this.sy);
    return this.health < 0;
  }
  EMP(d) {
    // this page intentionally left blank
  }
}

module.exports = Asteroid;

global.spawnAsteroid = function(sx, sy, x, y, vx, vy, health, metal) {
  const randId = Math.random();
  const ast = new Asteroid(randId, health, sx, sy, x, y, vx, vy, metal);
  asts[sy][sx][randId] = ast;
  astCount[sy][sx]++;
};

global.createAsteroid = function(sx, sy) {
  const vert = (sy + 1) / (mapSz + 1);
  const hor = (sx + 1) / (mapSz + 1);
  const metal = (Math.random() < hor ? 1 : 0) + (Math.random() < vert ? 2 : 0);
  spawnAsteroid(sx, sy, Math.floor(Math.random() * sectorWidth), Math.floor(Math.random() * sectorWidth), 0, 0, Math.ceil(Math.random() * 1200 + 200), metal);
};
