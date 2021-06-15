const canvas = document.getElementById(`ctx`);
const w = canvas.width = window.innerWidth;
const h = canvas.height = window.innerHeight;
const ctx = canvas.getContext(`2d`);

const displayLoners = confirm(`Press OK to display isolated nodes, cancel to not show these nodes.`);

let rendered = false;
let tick = 0;
let ox = 0; let oy = 0; let zoom = 1; let tryzoom = 1;

const accs = {};// JSON.parse(accsjson);//read json
const ips = {};// JSON.parse(ipsjson);
const logs = JSON.parse(data).data.split(` `);
init();
setInterval(render, 100);
setInterval(move, 50);

function init () {
    for (var i = 0; i < logs.length; i += 2) {
        if (logs[i].includes(`:`)) {
            const split = logs[i].split(`:`);
            logs[i] = split[0] + split[1] + split[2] + split[3];
        }
    }
    for (var i = 0; i < logs.length; i += 2) {
        ips[logs[i]] = { num: 0 };
    }
    for (var i = 1; i < logs.length; i += 2) {
        accs[logs[i]] = { addrs: {} };
    }
    for (var i = 1; i < logs.length; i += 2) {
        accs[logs[i]].addrs[logs[i - 1]] = 0;
    }
    for (var name in ips) {
        const ip = ips[name];
        ip.x = Math.random();
        ip.y = Math.random();
        ip.vx = ip.vy = 0;
    }
    for (var name in accs) {
        const acc = accs[name];
        acc.x = Math.random();
        acc.y = Math.random();
        acc.vx = acc.vy = 0;
    }
}

function render () {
    zoom = (tryzoom + zoom) / 2;
    ctx.fillStyle = `Black`;
    ctx.fillRect(0, 0, w, h);
    renderAccsAndEdges();
    renderIPs();
    if (!rendered) {
        const del = {};
        for (var name in ips) {
            if (ips[name].num < 2 && !displayLoners) del[name] = 0;
        }
        for (var i in del) {
            for (const a in accs) delete accs[a].addrs[i];
            delete ips[i];
        }
        for (var name in accs) {
            const acc = accs[name];
            let tally = true;
            for (var i in acc.addrs) tally = false;
            if (tally) delete accs[name];
        }
        rendered = true;
    }
}
function move () {
    tick++;
    for (var name in ips) {
        var ip = ips[name];
        for (var ipname in ips) { // collide ips and ips
            if (ipname === name) continue;
            const ip2 = ips[ipname];
            var dx = ip2.x - ip.x;
            var dy = ip2.y - ip.y;
            var angle = Math.atan2(dy, dx);
            var dist = Math.min(10, 1 / Math.hypot(dy, dx));
            ip2.vx += dist * Math.cos(angle);
            ip2.vy += dist * Math.sin(angle);
        }
        for (var accname in accs) { // collide ips and accs
            var acc = accs[accname];
            var dx = acc.x - ip.x;
            var dy = acc.y - ip.y;
            var angle = Math.atan2(dy, dx);
            var dist = Math.min(10, 1 / Math.hypot(dy, dx));
            var nx = dist * Math.cos(angle); var ny = dist * Math.sin(angle);
            acc.vx += nx;
            acc.vy += ny;
            ip.vx -= nx;
            ip.vy -= ny;
        }
    }
    for (var name in accs) {
        var acc = accs[name];
        if (tick / 20 % 2 < 1) {
            for (var accname in accs) {
                if (accname === name) continue;
                const acc2 = accs[accname];
                var dx = acc2.x - acc.x;
                var dy = acc2.y - acc.y;
                var angle = Math.atan2(dy, dx);
                var dist = Math.min(10, 1 / Math.hypot(dy, dx));
                acc2.vx += dist * Math.cos(angle);
                acc2.vy += dist * Math.sin(angle);
            }
        }
        if (tick / 20 % 2 < 1) {
            for (var ipname in acc.addrs) { // pull connections
                var ip = ips[ipname];
                if (typeof ip === `undefined`) continue;
                var dx = ip.x - acc.x;
                var dy = ip.y - acc.y;
                var angle = Math.atan2(dy, dx);
                var dist = Math.min(30, (dy * dy + dx * dx) / 100);
                var nx = dist * Math.cos(angle); var ny = dist * Math.sin(angle);
                acc.vx += nx;
                acc.vy += ny;
                ip.vx -= nx;
                ip.vy -= ny;
            }
        }
    }

    const decay = 0.85 / (1 + tick / 5000);

    // tick positions
    for (var name in ips) {
        var ip = ips[name];
        ip.vx *= decay;
        ip.vy *= decay;
        ip.x += ip.vx / 20;
        ip.y += ip.vy / 20;
    }
    for (var name in accs) {
        var acc = accs[name];
        acc.vx *= decay;
        acc.vy *= decay;
        acc.x += acc.vx / 20;
        acc.y += acc.vy / 20;
    }
}
function renderAccsAndEdges () {
    ctx.strokeStyle = `grey`;
    ctx.fillStyle = `Orange`;
    ctx.font = `16px Ariel`;
    for (const name in accs) {
        const acc = accs[name];
        const sx = (acc.x - ox) / zoom + w / 2; const sy = (acc.y - oy) / zoom + h / 2;
        for (const ipname in acc.addrs) {
            const ip = ips[ipname];
            if (!rendered) ip.num++;
            const isx = (ip.x - ox) / zoom + w / 2; const isy = (ip.y - oy) / zoom + h / 2;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(isx, isy);
            ctx.stroke();
            ctx.closePath();
        }
        ctx.fillRect(sx, sy, 3, 3);
        ctx.fillText(name, sx, sy);
    }
}

function renderIPs () {
    ctx.fillStyle = `lime`;
    for (const name in ips) {
        const ip = ips[name];
        const sx = (ip.x - ox) / zoom + w / 2; const sy = (ip.y - oy) / zoom + h / 2;
        ctx.fillRect(sx, sy, 3, 3);
    // ctx.fillText(name, sx, sy);
    }
}

window.addEventListener(`wheel`, (event) => tryzoom *= Math.pow(2, Math.sign(event.deltaY)));
window.addEventListener(`keydown`, key, false);

function key (e) {
    const c = e.keyCode;
    console.log(c);
    if (c == 37) ox -= zoom * 100;
    if (c == 38) oy -= zoom * 100;
    if (c == 39) ox += zoom * 100;
    if (c == 40) oy += zoom * 100;
}
