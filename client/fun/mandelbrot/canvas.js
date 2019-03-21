cnv = document.getElementById("canvas1");
ctx = cnv.getContext("2d");

// read the width and height of the canvas
width = cnv.width;
height = cnv.height;

var scale = 1;
var pixels = new Array(width / scale * height / scale);

window.onload = function() {
	cnv.addEventListener("mousedown", onClick, false);
	cnv.addEventListener("keydown", onKeyDown, false);
};

function setPixel(imageData, x, y, r, g, b, a) {
	pixels[x + y * width] = 0xffffff;
    index = (x + y * imageData.width) * 4;
    imageData.data[index+0] = r;
    imageData.data[index+1] = g;
    imageData.data[index+2] = b;
    imageData.data[index+3] = a;
}

imageData = ctx.createImageData(width, height);

var playerX = 0;
var playerY = 0;
var zoom = 2;
var ox = 1.254070584690168;
var oy = 0.34096873442779835;
var depth = 256;

render();

function render() {
	for (var x = 0; x < width; x++) {
		var nPart = (x - width / 2) / (width / (8 / zoom)) - ox;
		for (var y = 0; y < height; y++) {
			var iPart = (y - height / 2) / (height / (8 / zoom)) - oy;
			var editI = iPart;
			var editN = nPart;
			var diverged = false;
			var divergeCount = 0;
			
			while (!diverged) {
				var newN = editN * editN - editI * editI;
				var newI = editI * editN * 2;
				editI = newI + iPart;
				editN = newN + nPart;
				divergeCount++;
				if (editI * editI + editN * editN > 4)
					diverged = true;
				if (divergeCount > depth)
					break;
			}
			
			divergeCount--; // for the sake of prettiness and color accuracy
			var r = !diverged? 0 : 128 * Math.sin(divergeCount / 10 * Math.PI + Math.PI * 2 / 3) + 128;
			var g = !diverged? 0 : 128 * Math.sin(divergeCount / 10 * Math.PI + Math.PI * 4 / 3) + 128;
			var b = !diverged? 0 : 128 * Math.sin(divergeCount / 10 * Math.PI + Math.PI * 0 / 3) + 128;
			setPixel(imageData, x, y, r, g, b, 255);
		}
	}
	ctx.putImageData(imageData, 0, 0); // at coords 0,0
}

ctx.putImageData(imageData, 0, 0);

function onClick(event) {
    var rect = cnv.getBoundingClientRect();
    playerX = event.clientX - rect.left;
    playerY = event.clientY - rect.top;
	zoom *= (event.button === 0)? (9 / 5) : (5 / 9);
	//depth = Math.log(zoom) * 5 + 32;
	render();
}

function onKeyDown(event) {
	if (event.keyCode == 37)
		ox += .75 / zoom;
	if (event.keyCode == 38)
		oy += .75 / zoom;
	if (event.keyCode == 39)
		ox -= .75 / zoom;
	if (event.keyCode == 40)
		oy -= .75 / zoom;
	if (event.keyCode == 90)
		setInterval(function(){zoom *= 1.1; render();}, 50)
	console.log(ox + " , " + oy);
	render();
}