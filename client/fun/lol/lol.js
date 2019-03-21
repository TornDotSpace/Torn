var canvas = document.getElementById('ctx');
var chatbox = document.getElementById('chat');
var ctx = canvas.getContext("2d");

var w = window.innerWidth;
var h = window.innerHeight;

var letters = {};
letters.a=[[0,1,1,1,0],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1]];
letters.l=[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,0]];
letters.e=[[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,1,1,1,1]];
letters.x=[[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1]];

var mapSz = 4;
var alpha = 0, beta = 0, alphaList = new Array(5), betaList = new Array(5);
var mx = w/2, my = h/2;
var camx = 0, camy = -16, camz = 0;
var frames = 0, fps = 0;
var d = new Date();
var bootTime = d.getTime();
var cube = {};

var sins = [];//Pretrig
for(var i = 0; i < 1571; i++)//500pi
	sins[i] = Math.sin(i / 1000.);

//intervals
setInterval(function(){
	w = window.innerWidth;
	h = window.innerHeight;
	if(canvas.width != w || canvas.height != h){
		canvas.width = w;
		canvas.height = h;
	}
	tick();
	render();
},16);
setInterval(function(){
	fps = frames;
	frames = 0;
},1000);


function tick(){
	for(var i = 4; i > 0; i--){
		alphaList[i] = alphaList[i-1];
		betaList[i] = betaList[i-1];
	}
	var newAngles = decay(alpha, beta, 10)
	alpha = newAngles.alpha;
	beta  = newAngles.beta;
	alphaList[0] = alpha;
	betaList[0] = beta;
	camx = Math.sin(alpha) * Math.cos(beta) * 32;
	camy = Math.cos(alpha) * Math.cos(beta) * -32;
	camz = Math.sin(beta) * -32;
}


//rendering
function render() {
	frames++;
		
	var d = new Date();
	var startTimer = d.getTime();
		
	ctx.fillStyle = "black";
	ctx.fillRect(0,0,w,h);
	rLand(startTimer - bootTime);
		
	var d = new Date();
	var endTimer = d.getTime();
	var t = endTimer - startTimer - 40;
		
	telegrama();
	write(t,16,16,"white");
}
function rLand(t){
	for(var x = -mapSz / 2; x <= mapSz / 2 - 1; x++)
		for(var y = -mapSz / 2; y <= mapSz / 2; y++)
			for(var z = -mapSz / 2; z <= mapSz / 2; z++){
				var coords = transform({x:x,y:y,z:z},t)
				if(!coords.skip)
					project(coords.x, coords.y, coords.z, rgbToHex(posToColor(x),posToColor(y),posToColor(z)));
			}
	project(0,0,0,'white');
}
function transform(cube,t){
	var timer = t/4000;
	var w = 1-timer%1;
	var pd = Math.floor(timer) % 24;
	var transformed;
	
	if(Math.floor(pd / 3) == 0){
		var trans = scale(makeLetter(cube),.5);
		transformed = trancerp(cube,trans,pd,w);
	}else if(Math.floor(pd / 3) == 1){
		var trans = wtf(cube,t);
		transformed = trancerp(cube,trans,pd,w);
	}else if(Math.floor(pd / 3) == 2){
		var trans = wtf2(cube,t);
		transformed = trancerp(cube,trans,pd,w);
	}else if(Math.floor(pd / 3) == 3){
		var trans = wtf(spinCrazy(cube,t),t);
		transformed = trancerp(cube,trans,pd,w);
	}else if(Math.floor(pd / 3) == 4){
		var trans = wtf(wtf2(cube,t),t);
		transformed = trancerp(cube,trans,pd,w);
	}else if(Math.floor(pd / 3) == 5){
		var trans = wtf2(wtf(cube,t),t);
		transformed = trancerp(cube,trans,pd,w);
	}else if(Math.floor(pd / 3) == 6){
		var trans = twistInner(cube,t);
		transformed = trancerp(cube,trans,pd,w);
	}else if(Math.floor(pd / 3) == 7){
		var trans = twistOuter(cube,t);
		transformed = trancerp(cube,trans,pd,w);
	}else if(Math.floor(pd / 3) == 8){
		var trans = woah(cube,t);
		transformed = trancerp(cube,trans,pd,w);
	}

	return spinCrazy(transformed,t);
}
function spinCrazy(cube,t){
	var x = cube.x, y = cube.y, z = cube.z;
	var s = t/1000;
	var x1 = Math.cos(s+Math.atan2(y,x))*Math.hypot(x,y);
	var y1 = Math.sin(s+Math.atan2(y,x))*Math.hypot(x,y);
	var z1 = z;
	var x2 = Math.cos(s+Math.atan2(x1,z1))*Math.hypot(z1,x1);
	var y2 = y1;
	var z2 = Math.sin(s+Math.atan2(x1,z1))*Math.hypot(z1,x1);
	var x3 = x2;
	var y3 = Math.sin(s+Math.atan2(z2,y2))*Math.hypot(z2,y2);
	var z3 = Math.cos(s+Math.atan2(z2,y2))*Math.hypot(z2,y2);
	return {x:x3,y:y3,z:z3,skip:cube.skip};
}
function twistInner(cube,t){
	var x = cube.x, y = cube.y, z = cube.z;
	var hypot = Math.sqrt(x*x+y*y+z*z);
	var s = (t/hypot)/100;
	var x1 = Math.cos(s+Math.atan2(y,x))*Math.hypot(x,y);
	var y1 = Math.sin(s+Math.atan2(y,x))*Math.hypot(x,y);
	var z1 = z;
	var x2 = Math.cos(s+Math.atan2(x1,z1))*Math.hypot(z1,x1);
	var y2 = y1;
	var z2 = Math.sin(s+Math.atan2(x1,z1))*Math.hypot(z1,x1);
	var x3 = x2;
	var y3 = Math.sin(s+Math.atan2(z2,y2))*Math.hypot(z2,y2);
	var z3 = Math.cos(s+Math.atan2(z2,y2))*Math.hypot(z2,y2);
	return {x:x3,y:y3,z:z3};
}
function twistOuter(cube,t){
	var x = cube.x, y = cube.y, z = cube.z;
	var hypot = Math.sqrt(x*x+y*y+z*z);
	var s = t*hypot/1000;
	var x1 = Math.cos(s+Math.atan2(y,x))*Math.hypot(x,y);
	var y1 = Math.sin(s+Math.atan2(y,x))*Math.hypot(x,y);
	var z1 = z;
	var x2 = Math.cos(s+Math.atan2(x1,z1))*Math.hypot(z1,x1);
	var y2 = y1;
	var z2 = Math.sin(s+Math.atan2(x1,z1))*Math.hypot(z1,x1);
	var x3 = x2;
	var y3 = Math.sin(s+Math.atan2(z2,y2))*Math.hypot(z2,y2);
	var z3 = Math.cos(s+Math.atan2(z2,y2))*Math.hypot(z2,y2);
	return {x:x3,y:y3,z:z3};
}
function wtf(cube, t){
	var x = cube.x, y = cube.y, z = cube.z;
	var s = t/1000;
	var x1 = Math.cos(s*(Math.PI-2)+Math.atan2(y,x))*Math.hypot(x,y);
	var y1 = Math.sin(s*(Math.PI-2)+Math.atan2(y,x))*Math.hypot(x,y);
	var z1 = z;
	var x2 = Math.cos(s+Math.atan2(z1,x1))*Math.hypot(z1,y1);
	var y2 = y1;
	var z2 = Math.sin(s+Math.atan2(z1,x1))*Math.hypot(z1,y1);
	var x3 = x2;
	var y3 = Math.sin(s*(Math.E-2)+Math.atan2(y2,z2))*Math.hypot(z2,y2);
	var z3 = Math.cos(s*(Math.E-2)+Math.atan2(y2,z2))*Math.hypot(z2,y2);
	return {x:x3,y:y3,z:z3};
}
function wtf2(cube,t){
	var x = cube.x, y = cube.y, z = cube.z;
	var s = t/1000;
	var x1 = Math.cos(s*(Math.PI-2)+Math.atan2(y,x))*Math.hypot(z,y);
	var y1 = Math.sin(s*(Math.PI-2)+Math.atan2(y,x))*Math.hypot(z,y);
	var z1 = z;
	var x2 = Math.cos(s+Math.atan2(z1,x1))*Math.hypot(z1,y1);
	var y2 = y1;
	var z2 = Math.sin(s+Math.atan2(z1,x1))*Math.hypot(z1,y1);
	var x3 = x2;
	var y3 = Math.sin(s*(Math.E-2)+Math.atan2(y2,z2))*Math.hypot(z2,y2);
	var z3 = Math.cos(s*(Math.E-2)+Math.atan2(y2,z2))*Math.hypot(z2,y2);
	return {x:x3,y:y3,z:z3};
}
function rubiks(cube,t){
	var x = cube.x, y = cube.y, z = cube.z;
	var s = t/1000;
	var sint = Math.floor(s);
	var layer = Math.floor(Math.exp(Math.floor(s))) % (mapSz + 1) - mapSz / 2;
	var axis = sint % 3;
	var xn = x, yn = y, zn = z;
	var angle = (s % 1) * Math.PI / 2;
	switch(axis){
		default:
			if(x == layer){
				yn = Math.sin(angle+Math.atan2(y,z))*Math.hypot(z,y);
				zn = Math.cos(angle+Math.atan2(y,z))*Math.hypot(z,y);
			}
			break;
		case 1:
			if(y == layer){
				xn = Math.cos(angle+Math.atan2(z,x))*Math.hypot(z,x);
				zn = Math.sin(angle+Math.atan2(z,x))*Math.hypot(z,x);
			}
			break;
		case 2:
			if(z == layer){
				xn = Math.cos(angle+Math.atan2(y,x))*Math.hypot(x,y);
				yn = Math.sin(angle+Math.atan2(y,x))*Math.hypot(x,y);
			}
			break;
	}
	return {x:xn,y:yn,z:zn};
}
function woah(cube,t){
	var x = cube.x, y = cube.y, z = cube.z;
	var s = t/1000;
	var xn = 5*Math.sin(y*z + s);
	var yn = 5*Math.sin(x*z + s);
	var zn = 5*Math.sin(y*x + s);
	return {x:xn,y:yn,z:zn};
}
function cerp3d(a,b,w){
	return {x:cerp(a.x,b.x,w),y:cerp(a.y,b.y,w),z:cerp(a.z,b.z,w),skip:(a.skip||b.skip)};
}
function project(ax, ay, az, col) {
	/*This function was written independently, but I did use some of the mathematics described in
	this wikipedia page to develop it. https://en.wikipedia.org/wiki/3D_projection */
	
	var rAlpha = alpha;//avg(alphaList);
	var rBeta = beta+Math.PI / 2;//avg(betaList) + Math.PI / 2;
	
	var r = 1;
	var sa = sine(rAlpha), ca = cosine(rAlpha);
	var sb = sine(rBeta), cb = cosine(rBeta);
	var sx = sb, cx = cb; //Pre-trig euler angles
	var sz = sa, cz = ca;
	var sy = 0, cy = 1; // Operating under pretense that gamma is 0
		
	var ex = 0, ey = 0, ez = r; // eye, relative to camera
		
	var ox = ax-camx, oy = ay-camy, oz = az-camz; // Translate relative to camera
		
	var par1 = sz*oy+cz*ox; // Preprocess some useful numbers for speed
	var par2 = cy*oz+sy*par1;
	var par3 = cz*oy-sz*ox;
	var dx = cy*par1-sy*oz; // spin in 3d to match camera's "perspective"
	var dy = sx*par2+cx*par3;
	var dz = cx*par2-sx*par3;
	if(dz > 0)
		return;
		
	var bx = ez*dx/dz-ex; // translate that to 2d
	var by = ez*dy/dz-ey;
	
	var xf = w/2+bx*1000; // final point center coordinates on screen
	var yf = h/2+by*1000;
	
	drawPointAt(xf, yf, 3, col);
}
function drawPointAt(x, y, size, col){
	ctx.save();
	ctx.fillStyle = col;
	ctx.fillRect(x-size/2,y-size/2,size,size);
	ctx.restore();
}
function trancerp(cube,trans,pd,w){
	if(pd % 3 == 0)
		return cerp3d(cube,trans,w);
	else if(pd % 3 == 1)
		return cerp3d(trans,trans,w);
	else if(pd % 3 == 2)
		return cerp3d(trans,cube,w);
}
function makeLetter(cube){
	var arr;
	var ncube = {x:cube.x + 2, y:cube.y + 2, z:cube.z + 2};
	if(ncube.x == 0)
		arr = letters.a;
	else if(ncube.x == 1)
		arr = letters.l;
	else if(ncube.x == 2)
		arr = letters.e;
	else if(ncube.x == 3)
		arr = letters.x;
	else
		return {x:0,y:0,z:0,render:false};
	var fit = arr[ncube.y][ncube.z] == 1;
	var ny = fit?cube.y:0;
	var nz = fit?cube.z:0;
	return {x:-cube.z-cube.x*6-3,y:0,z:-cube.y,skip:!fit};
}
function scale(cube, scale){
	cube.x *= scale;
	cube.y *= scale;
	cube.z *= scale;
	return cube;
}

//math
function sine(x){
	x+=Math.PI * 200;
	x%=Math.PI * 2;
	var modpi = x % Math.PI;
	return (x > Math.PI?-1:1)*sins[Math.floor(((modpi < Math.PI / 2)?(modpi):(Math.PI - modpi)) * 1000)];
}
function cosine(x){
	return sine(x + Math.PI / 2);
}
function lerp(a,b,w){
	return a*w+b*(1-w);
}
function cerp(a,b,w){
	return lerp(a,b,6*(w*w/2-w*w*w/3));
}
function avg(list){
	var sum = 0;
	for(var i = 0; i < 5; i++)
		sum+=list[i];
	return sum/5;
}
function decay(alpha,beta,strength){
	var metaAngle = Math.atan2(beta,alpha);
	var hypot = Math.atan(Math.hypot(alpha,beta)*strength)/strength;
	return {alpha:Math.cos(metaAngle)*hypot, beta:Math.sin(metaAngle)*hypot};
}
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
function posToColor(x){
	return Math.floor(((x/mapSz)+.5)*255);
}

//gfx
function telegrama(){
	ctx.font = "12px Telegrama";
}
function write(text, x, y, col, sz, align){
	ctx.save();
	if(col)
		ctx.fillStyle = col;
	if(sz)
		ctx.font = sz + "pt Telegrama";
	if(align)
		ctx.textAlign = align;
	ctx.fillText(text+"",x,y);
	ctx.restore();
}

//input
document.addEventListener('mousemove', function (evt) {
	getMousePos(canvas, evt, false);
}, false);
function getMousePos(canvas, evt, resetButton) {
	if(resetButton)
		button = evt.button;
	var rect = canvas.getBoundingClientRect();
	alpha+=(evt.clientX - rect.left - mx)/1000;
	beta-=(evt.clientY - rect.top - my)/1000;
	mx = evt.clientX - rect.left;
	my = evt.clientY - rect.top;
}
document.onkeydown = function (event) {
	if (event.keyCode === 83 || event.keyCode === 40)//s
		keyS = true;
	else if (event.keyCode === 87 || event.keyCode === 38)//w
		keyW = true;
	else if (event.keyCode === 65 || event.keyCode === 37)//a
		keyA = true;
	else if (event.keyCode === 68 || event.keyCode === 39)//d
		keyD = true;
}
document.onkeyup = function (event) {
	if (event.keyCode === 83 || event.keyCode === 40)//s
		keyS = false;
	else if (event.keyCode === 87 || event.keyCode === 38)//w
		keyW = false;
	else if (event.keyCode === 65 || event.keyCode === 37)//a
		keyA = false;
	else if (event.keyCode === 68 || event.keyCode === 39)//d
		keyD = false;
}