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

global.pdist = function(x, sx, sy) { // used in blast collision algorithm
  const i1 = ((sx * sx * sx + sy * sy) % 5 + 1) / 2.23; // Geometric mean of 5 and 1
  const i2 = ((sx * sx + sy) % 5 + 1) / 2.23;
  return (Math.cbrt(Math.abs(Math.tan(x))) % i2) * 3500 * i2 + 800 * i1 + 600;
};

global.squaredDist = function(a, b) { // distance between two points squared. i.e. c^2
  return Math.pow(a.y - b.y, 2) + Math.pow(a.x - b.x, 2);
};

global.square = function(x) {
  return Math.pow(x, 2);
};

global.secs = function(x) {
  return 25 * x;
};

global.colorSelect = function(col, red, blue, green) {
  if (col === "red") return red;
  if (col === "blue") return blue;
  return green;
};

global.findBisector = function(a1, a2) { // finds the angle bisector of a1 and a2
  a1 = a1 * 180 / Math.PI;
  a2 = a2 * 180 / Math.PI;
  a1 = mod(a1, 360);
  a2 = mod(a2, 360);
  const small = Math.min(a1, a2);
  const big = Math.max(a1, a2);
  let angle = (big - small) / 2 + small;
  if (big - small > 180) angle += 180;
  return angle * Math.PI / 180;
};

global.atan = function(y, x) { // arctangent, but fast
  const a = Math.min(Math.abs(x), Math.abs(y)) / Math.max(Math.abs(x), Math.abs(y));
  const s = a * a;
  let r = ((-0.0464964749 * s + 0.15931422) * s - 0.327622764) * s * a + a;
  if (Math.abs(y) > Math.abs(x)) r = 1.57079637 - r;
  if (x < 0) r = 3.14159274 - r;
  if (y < 0) r = -r;
  return r;
};

global.calculateInterceptionAngle = function(ax, ay, vx, vy, bx, by, s) { // for finding where to shoot at a moving object
  const ox = ax - bx;
  const oy = ay - by;

  const h1 = vx * vx + vy * vy - s * s;
  const h2 = ox * vx + oy * vy;
  let t;
  if (h1 == 0) { // problem collapses into a simple linear equation
    t = -(ox * ox + oy * oy) / (2 * h2);
  } else { // solve the quadratic equation
    const minusPHalf = -h2 / h1;

    const discriminant = minusPHalf * minusPHalf - (ox * ox + oy * oy) / h1; // term in brackets is h3
    if (discriminant < 0) return Math.atan2(by - ay, bx - ax); // complex solution

    const root = Math.sqrt(discriminant);

    const t1 = minusPHalf + root;
    const t2 = minusPHalf - root;

    const tMin = Math.min(t1, t2);
    const tMax = Math.max(t1, t2);

    t = tMin > 0 ? tMin : tMax; // get the smaller of the two times, unless it's negative
    if (t < 0) return Math.atan2(by - ay, bx - ax); // solution in the past
  }

  // calculate the point of interception using the found intercept time
  const ix = ax + t * vx; const iy = ay + t * vy;
  return Math.atan2(by - iy, bx - ix) + Math.PI;
};

global.angleBetween = function(a, b) { // delimited to [-pi,pi]
  return Math.atan2(a.y - b.y, a.x - b.x);
};
global.squaredDist = function(a, b) { // distance between two points squared. i.e. c^2
  return square(a.y - b.y) + square(a.x - b.x);
};
global.hypot2 = function(a, b, c, d) {
  return square(a - b) + square(c - d);
};
global.expToLife = function(exp, guest) {
  return Math.floor(guest ? 0 : 800000 * Math.atan(exp / 600000.)) + 500;
};
global.mod = function(n, m) { // used in findBisector
  const remain = n % m;
  return Math.floor(remain >= 0 ? remain : remain + m);
};

global.techPriceForDowngrade = function(x, isVip) { // money required to upgrade Tech
  if (isVip) return techEnergy(lastTechLevel(x))-techEnergy(x);
  return Math.max(techEnergy(lastTechLevel(x))-techEnergy(x), -300000000);
};

global.techPrice = function(x) { // money required to upgrade Tech
  return techEnergy(nextTechLevel(x))-techEnergy(x);
};

global.techEnergy = function(x) { // Net price of some tech level
  return Math.round(Math.pow(1024, x) / 1000) * 500;
};

global.nextTechLevel = function(x) {
  return Math.floor(x*8.+1)/8.;
};

global.lastTechLevel = function(x) {
  return Math.floor(x*8.-.001)/8.;
};
