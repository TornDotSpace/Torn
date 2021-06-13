module.exports = class Vortex {
    constructor (i, x, y, sxx, syy, size, ownr, isWorm) {
        this.isWorm = isWorm, // am i a wormhole or black hole
        this.sxo = Math.floor(Math.random() * mapSz), // output node location for wormhole
        this.syo = Math.floor(Math.random() * mapSz),
        this.xo = Math.random() * sectorWidth,
        this.yo = Math.random() * sectorWidth,

        this.type = `Vortex`,
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

    tick () {
        this.move();

        if (this.owner != 0) { // if I'm a gravity bomb
            this.size -= 6; // shrink with time
            if (this.size < 0) this.die();
        } else this.size = 2500;
    }

    move () {
        if (this.isWorm) {
            this.moveWormhole();
        }

        for (const i in players[this.sy][this.sx]) {
            const p = players[this.sy][this.sx][i];

            // compute distance and angle to players
            const dist = Math.pow(squaredDist(this, p), 0.25);
            const a = angleBetween(p, this);
            // then move them.
            let guestMult = (p.guest || p.isNNBot) ? -1 : 1; // guests are pushed away, since they aren't allowed to leave their sector.
            if (p.ship == 21 && !this.isWorm) guestMult = 0.45 * (-1 + (35 / dist)); // R21 ship gets pushed from a BH if too far, BUT IT'S STILL PULLED WITH FORCE IF TOO CLOSE. Reason this isn't an increment is because someone could get a GUEST at level 21, buy the ship, and then the old *=0.5 would actually be more OP than the old code.
            p.x -= guestMult * 0.40 * this.size / dist * Math.cos(a);
            p.y -= guestMult * 0.40 * this.size / dist * Math.sin(a);

            if (dist < 15 && !this.isWorm) { // collision with black hole
                if (this.owner != 0) { // if I'm a gravity bomb
                    this.size += p.ship; // Eating the ship will make the gravity bomb BH grow. The bigger the ship, the more it will grow.
                }
                if (p.e) {
                    p.driftAchs[8] = true; // drift into a black hole
                    p.sendAchievementsDrift(true);
                }

                p.randmAchs[4] = true; // fall into a black hole
                p.sendAchievementsMisc(true);
                p.die(this);
            } else if (dist < 15 && this.isWorm && !p.guest) { // collision with wormhole
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
        if (Math.random() < 0.2) { // limited for lag
            for (const i in asts[this.sy][this.sx]) {
                const dist = Math.pow(squaredDist(this, i), 0.25);
                const a = asts[this.sy][this.sx][i];
                const d2 = squaredDist(this, a);
                const ang = angleBetween(this, a);
                const vel = 0.005 * this.size / Math.log(d2);
                a.vx += Math.cos(ang) * vel;
                a.vy += Math.sin(ang) * vel;
                if (d2 < 100) {
                    if (!this.isWorm) { // collision with black hole
                        a.die(this);
                        if (this.owner != 0) { // if I'm a gravity bomb
                            this.size += 10; // Eating asteroids will make the gravity bomb BH grow.
                        }
                    } else { // collision with wormhole
                        delete asts[a.sy][a.sx][a.id];
                        a.sx = this.sxo;
                        a.sy = this.syo;
                        a.y = this.yo;
                        a.x = this.xo; // teleport them to the output node
                        asts[a.sy][a.sx][a.id] = a;
                    }
                }
            }
        }
    }

    moveWormhole () {
        const t = tick / 40000;

        // the doubles in here are just random numbers for chaotic motion. Don't mind them.

        // input node
        this.vx += Math.sin(7.197 * t) * 0.75;
        this.vy -= Math.sin(5.019 * t) * 0.75;
        this.vx *= 0.99;
        this.vy *= 0.99;
        const bx = (this.x + this.sx * sectorWidth + this.vx + mapSz * sectorWidth) % (mapSz * sectorWidth);
        const by = (this.y + this.sy * sectorWidth + this.vy + mapSz * sectorWidth) % (mapSz * sectorWidth);

        const oldSx = this.sx;
        const oldSy = this.sy;

        this.sx = Math.floor(bx / sectorWidth);
        this.sy = Math.floor(by / sectorWidth);

        if (oldSx != this.sx || oldSy != this.sy) {
            vorts[this.sy][this.sx][this.id] = vorts[oldSy][oldSx][this.id];
            delete vorts[oldSy][oldSx][this.id];
        }

        this.x = bx % sectorWidth;
        this.y = by % sectorWidth;

        // output node
        const bxo = -Math.sin(9.180 * t) / 2 + 0.5;
        const byo = Math.sin(10.3847 * t) / 2 + 0.5;
        this.sxo = Math.floor(bxo * mapSz);
        this.syo = Math.floor(byo * mapSz);
        this.xo = ((bxo * mapSz) % 1) * sectorWidth;
        this.yo = ((byo * mapSz) % 1) * sectorWidth;

        // every 2 seconds, tell the players where I am (for radar only, I think)
        if (tick % 25 == 0) sendAll(`worm`, { bx: bx / (mapSz * sectorWidth), by: by / (mapSz * sectorWidth), bxo: bxo, byo: byo });
    }

    die () {
        sendAllSector(`sound`, { file: `bigboom`, x: this.x, y: this.y, dx: 0, dy: 0 }, this.sx, this.sy);
        delete vorts[this.sy][this.sx][this.id];
    }

    onKill () {
    } // do we need these functions here? :thonk: I think we might be calling em

    spoils (type, amt) {
    }
};
