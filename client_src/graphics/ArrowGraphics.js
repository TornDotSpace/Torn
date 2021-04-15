// pointer rendering
global.rEdgePointer = function() {
  let angle = 0;
  if (px < py) {
    if (sectorWidth - px > py) angle = 2;
    else angle = 1;
  } else {
    if (sectorWidth - px > py) angle = 3;
    else angle = 0;
  }
  let text = "";
  if (angle == 0) text = sectorWidth - px;
  else if (angle == 3) text = py;
  else if (angle == 2) text = px;
  else if (angle == 1) text = sectorWidth - py;
  rPointerArrow(Img.yellowArrow, angle*Math.PI/2, text, "yellow");
};
global.rBasePointer = function(nearB) {
  const text = Math.hypot(nearB.x - px, nearB.y - py);
  const angle = Math.atan2(nearB.y - py, nearB.x - px);
  rPointerArrow(Img.whiteArrow, angle, text, "lightgray");
};
global.rTeamPointers = function(pointers) {
  for (let i = 0; i < 3; i++) {
    if (pointers[i]===0) continue;
    const text = Math.hypot(pointers[i].x - px, pointers[i].y - py);
    const angle = Math.atan2(pointers[i].y - py, pointers[i].x - px);
    rPointerArrow(colorSelect(teamColors[i], Img.redArrow, Img.blueArrow, Img.greenArrow), angle, text, colorSelect(teamColors[i], "red", "cyan", "lime"));
  }
};
global.rAstPointer = function(nearE) {
  const text = Math.hypot(nearE.x - px, nearE.y - py);
  const angle = Math.atan2(nearE.y - py, nearE.x - px);
  rPointerArrow(Img.orangeArrow, angle, text, "orange");
};
global.rBlackHoleWarning = function(x, y) {
  const dx = x - px;
  const dy = y - py;
  const angle = Math.atan2(dy, dx);
  rPointerArrow(Img.blackArrow, angle, Math.hypot(dx, dy), "white");
};
global.rPointerArrow = function(img, angle, dist, textColor) {
  if (textColor !== "lightgray" && textColor !== "orange") {
    if (dist < 100 || dist > va2*3840 - 1280) return;
  }
  dist = Math.floor(dist / 10);
  ctx.fillStyle = textColor;
  const pw = ships[ship].width;
  const rendX = w / 2 + pw * 1 * cosLow(angle) + scrx;
  const rendY = h / 2 + pw * 1 * sinLow(angle) + scry;
  const rendXt = w / 2 + pw * 1.3 * cosLow(angle) + scrx;
  const rendYt = h / 2 + pw * 1.3 * sinLow(angle) + scry;
  const hw = img.width / 2;
  ctx.save();
  ctx.translate(rendX, rendY);
  ctx.rotate(angle);
  ctx.drawImage(img, -hw, -hw);
  ctx.restore();
  ctx.textAlign = "center";
  write(dist, rendXt, rendYt + 6);
  ctx.textAlign = "left";
};
