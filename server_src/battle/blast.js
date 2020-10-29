module.exports = class Blast {
  constructor(ownr, i, weaponID) {
    this.type = 'Blast',
    this.id = i, // unique identifier
    this.dmg = wepns[weaponID].damage,
    this.sx = ownr.sx,
    this.sy = ownr.sy,
    this.owner = ownr,
    this.angle = ownr.angle,
    this.bx = ownr.x,
    this.by = ownr.y,
    this.wepnID = weaponID,
    this.time = 0; // since spawn
  }
  tick() {
    this.time++;
    if (this.time > 11) delete blasts[this.sy][this.sx][this.id];
    if (this.time == 1) {
      for (const i in players[this.sy][this.sx]) {
        const player = players[this.sy][this.sx][i];
        if ((this.bx - player.x) * Math.cos(this.angle) + (this.by - player.y) * Math.sin(this.angle) > 0) continue;
        const pDist = Math.hypot(player.x - this.bx, player.y - this.by);
        const fx = player.x - Math.cos(this.angle) * pDist; // all this ugly math is just to check collision of a player with a ray
        const fy = player.y - Math.sin(this.angle) * pDist;
        if (Math.hypot(fx - this.bx, fy - this.by) < ships[player.ship].width * 2 / 3) this.hit(player);
      }
      if (this.wepnID != 25) {
        for (const i in asts[this.sy][this.sx]) {
          const ast = asts[this.sy][this.sx][i];
          if ((this.bx-ast.x) * Math.cos(this.angle) + (this.by-ast.y) * Math.sin(this.angle) > 0) continue;
          const pDist = Math.hypot(ast.x - this.bx, ast.y - this.by);
          const fx = ast.x - Math.cos(this.angle) * pDist;
          const fy = ast.y - Math.sin(this.angle) * pDist;
          if (Math.hypot(fx-this.bx, fy-this.by) < 64*2/3) ast.dmg(this.dmg, this); // hits the asteroid.
        }
      }

      const base = bases[this.sy][this.sx];
      if (base.color == this.owner.color || !base.turretLive) return;
      if ((this.bx - base.x) * Math.cos(this.angle) + (this.by - base.y) * Math.sin(this.angle) > 0) return;
      const pDist = Math.hypot(base.x - this.bx, base.y - this.by);
      const fx = base.x - Math.cos(this.angle) * pDist;
      const fy = base.y - Math.sin(this.angle) * pDist;
      if (Math.hypot(fx - this.bx, fy - this.by) < 128 * 2 / 3) this.hit(base);
    }
  }
  hit(b) {
    if (this.wepnID == 25 && this.owner.color !== b.color) b.EMP(126); // emp blast
    else if ((this.wepnID == 34 || this.wepnID == 47)&& this.owner.color !== b.color) b.dmg(this.dmg, this); // muon and lepton
    else if (this.wepnID == 41) b.brainwashedBy = this.owner.id; // brainwashing laser
  }
};
