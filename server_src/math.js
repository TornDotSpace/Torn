global.pdist = function (x, sx, sy) { // used in blast collision algorithm
	var i1 = ((sx * sx * sx + sy * sy) % 5 + 1) / 2.23; // Geometric mean of 5 and 1
	var i2 = ((sx * sx + sy) % 5 + 1) / 2.23;
	return (Math.cbrt(Math.abs(Math.tan(x))) % i2) * 3500 * i2 + 800 * i1 + 600;
}

global.squaredDist = function (a, b) { // distance between two points squared. i.e. c^2
	return Math.pow(a.y - b.y, 2) + Math.pow(a.x - b.x, 2);
}

global.square = function (x) {
	return Math.pow(x, 2);
}

global.pdist = function (x, sx, sy) { // used in blast collision algorithm
	var i1 = ((sx * sx * sx + sy * sy) % 5 + 1) / 2.23; // Geometric mean of 5 and 1
	var i2 = ((sx * sx + sy) % 5 + 1) / 2.23;
	return (Math.cbrt(Math.abs(Math.tan(x))) % i2) * 3500 * i2 + 800 * i1 + 600;
}

global.findBisector = function (a1, a2) { // finds the angle bisector of a1 and a2
	a1 = a1 * 180 / Math.PI;
	a2 = a2 * 180 / Math.PI;
	a1 = mod(a1, 360);
	a2 = mod(a2, 360);
	var small = Math.min(a1, a2);
	var big = Math.max(a1, a2);
	var angle = (big - small) / 2 + small;
	if (big - small > 180) angle += 180;
	return angle * Math.PI / 180;
}

global.atan = function (y, x) { // arctangent, but fast
	var a = Math.min(Math.abs(x), Math.abs(y)) / Math.max(Math.abs(x), Math.abs(y));
	var s = a * a;
	var r = ((-0.0464964749 * s + 0.15931422) * s - 0.327622764) * s * a + a;
	if (Math.abs(y) > Math.abs(x)) r = 1.57079637 - r;
	if (x < 0) r = 3.14159274 - r;
	if (y < 0) r = -r;
	return r;
}

global.calculateInterceptionAngle = function (ax, ay, vx, vy, bx, by) { // for finding where to shoot at a moving object
	var s = wepns[3].Speed;
	var ox = ax - bx;
	var oy = ay - by;

	var h1 = vx * vx + vy * vy - s * s;
	var h2 = ox * vx + oy * vy;
	var t;
	if (h1 == 0) { // problem collapses into a simple linear equation 
		t = -(ox * ox + oy * oy) / (2 * h2);
	} else { // solve the quadratic equation
		var minusPHalf = -h2 / h1;

		var discriminant = minusPHalf * minusPHalf - (ox * ox + oy * oy) / h1; // term in brackets is h3
		if (discriminant < 0) return Math.atan2(by - ay, bx - ax); //complex solution

		var root = Math.sqrt(discriminant);

		var t1 = minusPHalf + root;
		var t2 = minusPHalf - root;

		var tMin = Math.min(t1, t2);
		var tMax = Math.max(t1, t2);

		t = tMin > 0 ? tMin : tMax; // get the smaller of the two times, unless it's negative
		if (t < 0) return Math.atan2(by - ay, bx - ax); // solution in the past
	}

	// calculate the point of interception using the found intercept time
	var ix = ax + t * vx, iy = ay + t * vy;
	return Math.atan2(by - iy, bx - ix) + Math.PI;
}

global.angleBetween = function (a, b) { // delimited to [-pi,pi]
	return Math.atan2(a.y - b.y, a.x - b.x);
}
global.squaredDist = function (a, b) { // distance between two points squared. i.e. c^2
	return square(a.y - b.y) + square(a.x - b.x);
}
global.hypot2 = function (a, b, c, d) {
	return square(a - b) + square(c - d);
}

function mod(n, m) { // used in findBisector
	var remain = n % m;
	return Math.floor(remain >= 0 ? remain : remain + m);
}

