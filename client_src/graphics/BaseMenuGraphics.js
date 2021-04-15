global.rBuyShipWindow = function() {
  ctx.fillStyle = "white";
  roundRect(ctx, rx + 16, ry + 256 - 16, 256, 256, 8, false, true);

  const d = new Date();
  const t = d.getMilliseconds() * 2 * Math.PI / 50000 + d.getSeconds() * 2 * Math.PI / 50 + d.getMinutes() * 2 * 60 * Math.PI / 50;
  const rendX = rx + 128 + 16;
  const rendY = ry + 128 * 3 - 16;
  let img = colorSelect(pc, redShips, blueShips, greenShips)[shipView];
  ctx.save();
  ctx.translate(rendX, rendY);
  ctx.rotate(-3 * t);
  if (shipView > rank) img = Img.q;
  ctx.drawImage(colorSelect(pc, Img.astUnderlayRed, Img.astUnderlayBlue, Img.astUnderlayGreen), -img.width/2, -img.height/2, img.width, img.height);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();

  ctx.textAlign = "center";
  ctx.fillStyle = "yellow";
  ctx.font = "20px ShareTech";
  write(translate("Upgrade Ship"), rx + 128 + 16, ry + 256 + 16);
  ctx.font = "14px ShareTech";
  write(translate("Rank") + " " + shipView, rx + 128 + 16, ry + 256 + 56);
  write(colorSelect(pc, ships[shipView].nameA, ships[shipView].nameH, ships[shipView].nameC), rx + 128 + 16, ry + 256 + 40);
  if (shipView > rank) ctx.fillStyle = "red";
  ctx.fillStyle = "yellow";
  if (ships[shipView].price > money + worth || shipView > rank) ctx.fillStyle = "red";
  else if (seller == 100) ctx.fillStyle = "lime";
  if (shipView != ship) write("$" + (ships[shipView].price - worth) + " " + translate("[BUY]"), rendX, rendY + 96);

  ctx.textAlign = "left";

  if (shipView <= rank) {
    const shipStatsRx = rx+288; const shipStatsRy = ry+421;
    ctx.fillStyle = "white";
    write(translate("Thrust  : "), shipStatsRx, shipStatsRy + 0 * 16);
    write(translate("Agility : "), shipStatsRx, shipStatsRy + 1 * 16);
    write(translate("Health  : "), shipStatsRx, shipStatsRy + 2 * 16);
    write(translate("Cargo   : ") + (shipView==17?"Infinite":""), shipStatsRx, shipStatsRy + 3 * 16);
    write(translate("Weapons : ") + numToLS(ships[shipView].weapons), shipStatsRx, shipStatsRy + 4 * 16);
    ctx.fillStyle = "#555";
    ctx.fillRect(shipStatsRx+60, shipStatsRy + 0 * 16 - 10, 80, 12);
    ctx.fillRect(shipStatsRx+60, shipStatsRy + 1 * 16 - 10, 80, 12);
    ctx.fillRect(shipStatsRx+60, shipStatsRy + 2 * 16 - 10, 80, 12); if (shipView!=17)
    {ctx.fillRect(shipStatsRx+60, shipStatsRy + 3 * 16 - 10, 80, 12);} // 17 has infinite cargo
    ctx.fillStyle = "white";
    ctx.fillRect(shipStatsRx+60, shipStatsRy + 0 * 16 - 10, 80*ships[shipView].thrust /maxShipThrust, 12);
    ctx.fillRect(shipStatsRx+60, shipStatsRy + 1 * 16 - 10, 80*ships[shipView].agility /maxShipAgility, 12);
    ctx.fillRect(shipStatsRx+60, shipStatsRy + 2 * 16 - 10, 80*ships[shipView].health /maxShipHealth, 12); if (shipView!=17)
    {ctx.fillRect(shipStatsRx+60, shipStatsRy + 3 * 16 - 10, 80*ships[shipView].capacity/maxShipCapacity, 12);} // 17 has infinite cargo
  }

  ctx.fillStyle = "white";
  if (shipView<=rank)
  {wrapText(translate("Description: ") + ships[shipView].desc, rx + 512 - 64, ry + 256 + 10 * 16 + 5, 64 * 6 - 64, 16);}

  if (shipView < ships.length) ctx.drawImage(Img.arrow, rendX + 128 - 48, rendY - 16);
  if (shipView > 0) {
    ctx.save();
    ctx.translate(rendX - 128 + 32, rendY);
    ctx.rotate(Math.PI);
    ctx.drawImage(Img.arrow, - 16, - 16);
    ctx.restore();
  }
}
global.rOreShop = function() {
  const mult1 = (myTrail % 16 == 2)?1.05:1;

  const allIronPrice = iron * mult1; const allSilverPrice = silver * mult1; const allPlatinumPrice = platinum * mult1; const allCopperPrice = copper * mult1;

  ctx.font = "14px ShareTech";
  ctx.textAlign = "left";

  ctx.fillStyle = (5 == seller && allIronPrice>0) ? "lime" : "#d44";
  write((iron > 0 ? translate("[SELL] Iron:     ") : translate("       Iron:     ")) + "$" + numToLS(allIronPrice), rx + 256 - 32, ry + 3 * 32);
  ctx.fillStyle = (6 == seller && allSilverPrice>0) ? "lime" : "#eef";
  write((silver > 0 ? translate("[SELL] Silver:   ") : translate("       Silver:   ")) + "$" + numToLS(allSilverPrice), rx + 256 - 32, ry + 4 * 32);
  ctx.fillStyle = (7 == seller && allPlatinumPrice>0) ? "lime" : "#90f";
  write((platinum > 0 ? translate("[SELL] Platinum: ") : translate("       Platinum: ")) + "$" + numToLS(allPlatinumPrice), rx + 256 - 32, ry + 5 * 32);
  ctx.fillStyle = (8 == seller && allCopperPrice>0) ? "lime" : "#960";
  write((copper > 0 ? translate("[SELL] Copper:   ") : translate("       Copper:   ")) + "$" + numToLS(allCopperPrice), rx + 256 - 32, ry + 6 * 32);

  ctx.fillStyle = seller == 610 ? "lime" : "yellow";

  write(translate("[Sell All]") + " => $" + numToLS(allCopperPrice + allPlatinumPrice + allSilverPrice + allIronPrice), rx + 256 + 48, ry + 76); // Sell all

  // Render asteroid animation
  let astImg = Img.silver;
  if (5 == seller && allIronPrice>0) astImg = Img.iron;
  if (7 == seller && allPlatinumPrice>0) astImg = Img.platinum;
  if (8 == seller && allCopperPrice>0) astImg = Img.copper;
  const d = new Date();
  const stime = Math.floor((d.getMilliseconds() / 1000 + d.getSeconds()) / 60 * 1024) % 64;
  const spx = (stime % 8) * 128;
  const Secret = Math.floor((stime / 8) % 4) * 128;
  ctx.save();
  ctx.translate(rx + 128 - 16, ry + (256 - 32 - 40) / 2 + 40);
  ctx.drawImage(astImg, spx, Secret, 128, 128, -64, -64, 128, 128);
  ctx.restore();
}
global.rBuyLifeShop = function() {
  ctx.fillStyle = "yellow";
  ctx.textAlign = "right";
  write(translate("Lives Remaining: ") + lives + " ($" + expToLife() + ") ", rx + 768 - 16 - ctx.measureText(translate("[BUY]")).width, ry + 512 - 16);
  ctx.fillStyle = (lives >= 20 || money < expToLife()) ? "red" : ((seller == 611) ? "lime" : "yellow");
  write(translate("[BUY]"), rx + 768 - 16, ry + 512 - 16);
  ctx.textAlign = "left";
}
global.rWeaponsInShop = function() {
  ctx.fillStyle = "yellow";
  ctx.font = "24px ShareTech";
  write(translate("Weapons"), rx + 256 + 32, ry + 256 - 16);
  ctx.textAlign = "center";
  write(translate("Ores"), rx + 256, ry + 64 + 8);
  ctx.textAlign = "left";
  ctx.font = "14px ShareTech";
  ctx.fillStyle = seller == 601 ? "lime" : "yellow";
  write(translate("[View All]"), rx + 512 - 64, ry + 256 - 16);
  ctx.fillStyle = "yellow";
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = (seller - 10 == i) ? "lime" : "yellow";
    if (ships[shipView].weapons <= i) ctx.fillStyle = "orange";
    if (shipView < wepns[equipped[i]].level) ctx.fillStyle = "red";
    let tag = "       ";
    if (equipped[i] == -1) tag = translate("[BUY]") + "  ";
    else if (equipped[i] > -1) tag = translate("[SELL]") + " ";
    write(tag + (" " + (i + 1)).slice(-2) + ": " + wepns[equipped[i]].name, rx + 256 + 32, ry + 256 + i * 16);
  }
}
global.rShop = function() {
  rOreShop();

  rBuyLifeShop();

  rWeaponsInShop();

  rBuyShipWindow();
}
global.rConfirm = function() {
  ctx.fillStyle = "cyan";
  ctx.textAlign = "center";
  ctx.font = "16px ShareTech";
  write(translate("Are you sure you would like to sell your # for $#?", [wepns[equipped[confirmer]].name, wepns[equipped[confirmer]].price * .75]), rx + 128 * 3, ry + 128);
  ctx.font = "15px ShareTech";
  write(translate("Press Y to confirm or N to return."), rx + 128 * 3, ry + 192);
  ctx.font = "14px ShareTech";
  ctx.textAlign = "left";
}
global.rQuests = function() {
  ctx.font = "14px ShareTech";
  ctx.textAlign = "left";
  const mult = (myTrail % 16 == 2)?1.05:1;
  if (quest != 0) {
    ctx.fillStyle = "cyan";
    ctx.textAlign = "center";
    ctx.font = "30px ShareTech";
    write(translate("Quest Accepted!"), rx + 128 * 3, ry + 128);
    ctx.font = "14px ShareTech";
    let desc = "";
    if (quest.type === "Mining") desc = translate("Bring # units of # to sector #.", [numToLS(quest.amt), quest.metal, getSectorName(quest.sx, quest.sy)]);
    if (quest.type === "Base") desc = translate("Eliminate enemy base in sector #.", [getSectorName(quest.sx, quest.sy)]);
    if (quest.type === "Delivery") desc = translate("Obtain package from planet # and deliver it to planet #.", [getSectorName(quest.sx, quest.sy), getSectorName(quest.dsx, quest.dsy)]);
    if (quest.type === "Secret") desc = translate("Proceed to sector # for further instructions.", [getSectorName(quest.sx, quest.sy)]);// translate("Secret Mission.");
    if (quest.type === "Secret2") desc = translate("Eliminate all enemy players and turrets in # and visit planet #.", [getSectorName(quest.sx, quest.sy), secret2PlanetName]);
    if (quest.type === "Secret3") desc = translate("Deliver package to a permanent black hole sector.");
    write(desc, rx + 128 * 3, ry + 192);
    ctx.textAlign = "left";
  } else {
    for (const i in quests) {
      const xv = i < 5 ? 0 : 128 * 3;
      const questi = quests[i];
      let desc = "";
      ctx.fillStyle = i == seller - 300 ? "lime" : "yellow";
      if (questi.type == "Mining") desc = translate("Bring # units of # to sector #.", [numToLS(questi.amt), questi.metal, getSectorName(questi.sx, questi.sy)]);
      if (questi.type == "Base") {
        if (rank > 6) desc = translate("Eliminate enemy base in sector #.", [getSectorName(questi.sx, questi.sy)]);
        else desc = translate("Quest Locked!");
      }
      if (questi.type == "Secret") {
        if (rank > 14) desc = translate("Proceed to sector # for further instructions.", [getSectorName(questi.sx, questi.sy)]);// translate("Secret Mission.");
        else desc = translate("Quest Locked!");
      }
      if (questi.type == "Delivery") desc = translate("Obtain package from planet # and deliver it to planet #.", [getSectorName(questi.sx, questi.sy), getSectorName(questi.dsx, questi.dsy)]);
      write(translate(questi.type), xv + rx + 16, ry + 72 + i % 5 * 80);
      write(translate("Reward: $# and # exp.", [numToLS(mult*questi.exp), numToLS(Math.floor(questi.exp / ((questi.type === "Mining" || questi.type === "Delivery") ? 1500 : 4000)))]), xv + rx + 16 + 16, ry + 72 + i % 5 * 80 + 16);
      wrapText(translate("Description: ") + desc, xv + rx + 16 + 16, ry + 72 + i % 5 * 80 + 32, 128 * 3 - 48, 16);
    }
  }
}
global.rStats = function() {
  ctx.font = "14px ShareTech";
  ctx.textAlign = "left";
  const d = new Date();
  const t = d.getMilliseconds() * 2 * Math.PI / 50000 + d.getSeconds() * 2 * Math.PI / 50 + d.getMinutes() * 2 * 60 * Math.PI / 50;

  const ore = iron + silver + platinum + copper;
  let upgradeCosts = 0;
  upgradeCosts += techEnergy(t2) + techEnergy(va2) + techEnergy(ag2) + techEnergy(c2) + techEnergy(mh2) + techEnergy(e2)*8;
  let achievements = 0;

  for (const i in achs) if (achs[i]) achievements++;

  ctx.fillStyle = "yellow";
  ctx.font = "32px ShareTech";
  ctx.textAlign = "center";
  write(myName, rx + 192, ry + 96);
  ctx.font = "14px ShareTech";
  let activeGens = 0;

  if (ship >= wepns[20].level) {
    for (let i = 0; i < ships[ship].weapons; i++) {
      if (equipped[i] == 20) activeGens++;
    }
  }

  let eMult = e2;
  for (let i = 0; i < activeGens; i++) eMult *= 1.06;

  const stats = [translate("Thrust  : "), translate("Cargo   : "), translate("Health  : "), translate("Energy  : "),
    translate("Players Killed: #", [numToLS(kills)]), translate("Bases Destroyed: #", [numToLS(baseKills)]),
    translate("Ship Value: $#", [numToLS(Number((worth + upgradeCosts).toPrecision(3)))]), translate("Net Worth: $#", [numToLS(Number((money + ore + worth + upgradeCosts).toPrecision(3)))]),
    translate("Experience: #", [numToLS(Math.round(experience))]), translate("Rank: #", [rank]), translate("Achievements: #", [achievements])];

  stats[0] += numToLS(Number((ships[ship].thrust * t2).toPrecision(3)));
  stats[1] += numToLS(Number((ships[ship].capacity * c2).toPrecision(3)));
  stats[2] += numToLS(Number((ships[ship].health * mh2).toPrecision(3)));
  stats[3] += numToLS(Number((eMult).toPrecision(3)));

  for (let i = 0; i < stats.length; i++) write(stats[i], rx + 512 - 64, ry + 44 + 32 + i * 16);

  ctx.fillStyle = seller == 700 ? "yellow" : "red";
  write(translate("[Default Trail]"), rx + 512 + 128, ry + 44 + 64 - 1 * 16);
  if (achs[12]) {
    ctx.fillStyle = seller == 701 ? "yellow" : "red";
    write(translate("[Blood Trail]"), rx + 512 + 128, ry + 44 + 64 + 1 * 16);
  } if (achs[24]) {
    ctx.fillStyle = seller == 702 ? "yellow" : "gold";
    write(translate("[Money Trail]"), rx + 512 + 128, ry + 44 + 64 + 3 * 16);
  } if (achs[36]) {
    ctx.fillStyle = seller == 703 ? "yellow" : "lightgray";
    write(translate("[Panda Trail]"), rx + 512 + 128, ry + 44 + 64 + 5 * 16);
  } if (achs[47]) {
    ctx.fillStyle = seller == 704 ? "yellow" : "cyan";
    write(translate("[Random Trail]"), rx + 512 + 128, ry + 44 + 64 + 7 * 16);
  } if (false) {
    ctx.fillStyle = seller == 705 ? "yellow" : "cyan";
    write(translate("[Rainbow Trail]"), rx + 512 + 128, ry + 44 + 64 + 9 * 16);
  }

  const rendX = rx + 192;
  const rendY = ry + 192;
  ctx.save();
  ctx.translate(rendX, rendY);
  ctx.rotate(-3 * t);
  const img = colorSelect(pc, redShips, blueShips, greenShips)[ship];

  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();

  // techs
  ctx.fillStyle = "yellow";
  ctx.textAlign = "left";
  ctx.font = "24px ShareTech";
  write(translate("Upgrades"), rx + 64, ry + 256 + 64 + 16);
  ctx.fillStyle = "white";
  ctx.font = "12px ShareTech";
  ctx.drawImage(Img.button, rx + 64, ry + 416 - 64);
  ctx.drawImage(Img.button, rx + 192, ry + 416 - 64);
  ctx.drawImage(Img.button, rx + 64, ry + 416);
  ctx.drawImage(Img.button, rx + 192, ry + 416);
  ctx.drawImage(Img.button, rx + 320, ry + 416 - 64);
  ctx.drawImage(Img.button, rx + 320, ry + 416);
  ctx.textAlign = "center";
  write(translate("Thrust lvl ") + ((t2-1)*8), rx + 64 + 54, ry + 416 - 64 + 14);
  write(translate("Radar lvl ") + ((va2-1)*8), rx + 192 + 54, ry + 416 - 64 + 14);
  write(translate("Cargo lvl ") + ((c2-1)*8), rx + 64 + 54, ry + 416 + 14);
  write(translate("Hull lvl ") + ((mh2-1)*8), rx + 192 + 54, ry + 416 + 14);
  write(translate("Energy lvl ") + ((e2-1)*8), rx + 320 + 54, ry + 416 - 64 + 14);
  write(translate("Agility lvl ") + ((ag2-1)*8), rx + 320 + 54, ry + 416 + 14);

  // upgrades
  ctx.fillStyle = (seller == 200) ? "lime" : "white";
  write("[+] $" + numToLS(techPrice(t2)), rx + 64 + 54, ry + 416 - 64 + 28);
  ctx.fillStyle = (seller == 201) ? "lime" : "white";
  write("[+] $" + numToLS(techPrice(va2)), rx + 192 + 54, ry + 416 - 64 + 28);
  ctx.fillStyle = (seller == 202) ? "lime" : "white";
  write("[+] $" + numToLS(techPrice(c2)), rx + 64 + 54, ry + 416 + 28);
  ctx.fillStyle = (seller == 203) ? "lime" : "white";
  write("[+] $" + numToLS(techPrice(mh2)), rx + 192 + 54, ry + 416 + 28);
  ctx.fillStyle = (seller == 204) ? "lime" : "white";
  write("[+] $" + numToLS(techPrice(e2)*8), rx + 320 + 54, ry + 416 - 64 + 28);
  ctx.fillStyle = (seller == 205) ? "lime" : "white";
  write("[+] $" + numToLS(techPrice(ag2)), rx + 320 + 54, ry + 416 + 28);

  // downgrades
  ctx.fillStyle = (seller == 206) ? "red" : "white";
  if (t2 >1) write("[-] $" + numToLS(-techPriceForDowngrade(t2)), rx + 64 + 54, ry + 416 - 64 + 42);
  ctx.fillStyle = (seller == 207) ? "red" : "white";
  if (va2>1) write("[-] $" + numToLS(-techPriceForDowngrade(va2)), rx + 192 + 54, ry + 416 - 64 + 42);
  ctx.fillStyle = (seller == 208) ? "red" : "white";
  if (c2 >1) write("[-] $" + numToLS(-techPriceForDowngrade(c2)), rx + 64 + 54, ry + 416 + 42);
  ctx.fillStyle = (seller == 209) ? "red" : "white";
  if (mh2>1) write("[-] $" + numToLS(-techPriceForDowngrade(mh2)), rx + 192 + 54, ry + 416 + 42);
  ctx.fillStyle = (seller == 210) ? "red" : "white";
  if (e2 >1) write("[-] $" + numToLS(-techPriceForDowngrade(e2)*8), rx + 320 + 54, ry + 416 - 64 + 42);
  ctx.fillStyle = (seller == 211) ? "red" : "white";
  if (ag2>1) write("[-] $" + numToLS(-techPriceForDowngrade(ag2)), rx + 320 + 54, ry + 416 + 42);

  /* description for radar
  ctx.textAlign = "left";
  if (seller==201 || seller==207){
    let txt = jsn.techs.radar[(va2-1)*8+(seller==201?1:-1)];
    if(typeof txt !== "undefined")
      write((seller==201?"Up":"Down")+"grade: " + txt, rx+512, ry+400);
    txt = jsn.techs.radar[(va2-1)*8];
    if(typeof txt !== "undefined")
      write("Current: " + txt, rx+512, ry+384);
  }*/
}
global.rAchievements = function() {
  ctx.save();
  ctx.fillStyle = "yellow";
  ctx.font = "14px ShareTech";
  ctx.textAlign = "center";
  for (let i = 0; i < achs.length; i++) {
    if (i < 13) ctx.fillStyle = achs[i] ? "red" : "pink";
    else if (i < 25) ctx.fillStyle = achs[i] ? "gold" : "lime";
    else if (i < 37) ctx.fillStyle = achs[i] ? "lightgray" : "white";
    else ctx.fillStyle = achs[i] ? "cyan" : "yellow";
    if (achs[i]) {
      ctx.font = "11px ShareTech";
      write(jsn.achNames[i].split(":")[1], rx + 768 * (1 + (i % 5) * 2) / 10, ry + 20 + 40 * Math.floor(i / 5) + 60);
    }
    ctx.font = "15px ShareTech";
    write(achs[i] ? jsn.achNames[i].split(":")[0] : translate("???"), rx + 768 * (1 + (i % 5) * 2) / 10, ry + 8 + 40 * Math.floor(i / 5) + 60);
  }
  ctx.restore();
}
global.rMore = function() {
  ctx.textAlign = "center";
  ctx.font = "26px ShareTech";
  const data = [translate("Wiki"), translate("Store"), translate("Leaderboard"), translate("Github"), translate("Discord"), translate("Credits")];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      ctx.fillStyle = (seller == 500 + i+j*3) ? "lime" : "yellow";
      const rendX = rx + 128 + i * 256;
      const rendY = ry + 40 + j * (512 - 40) * 2 / 3 + (512 - 40) / 6;
      write(data[i + j * 3], rendX, rendY);
    }
  }
  ctx.textAlign = "left";
  ctx.font = "14px ShareTech";
}
global.rWeaponStore = function() {
  ctx.font = "14px ShareTech";
  ctx.textAlign = "right";
  ctx.fillStyle = "yellow";

  write(translate("Money: ") + numToLS(Math.floor(money)), rx + 128 * 6 - 16, ry + 64);
  ctx.textAlign = "center";
  ctx.font = "24px ShareTech";
  write(translate("Weapons"), rx + 128 * 3, ry + 68);
  ctx.textAlign = "left";
  ctx.font = "14px ShareTech";
  // R to return to shop
  for (const i in wepns) {
    const weapon = wepns[i];
    const wx = rx + 4 + 240 * Math.floor(weapon.order / Math.ceil(wepnCount / 3));
    const wy = ry + 40 + 32 + (weapon.order % Math.ceil(wepnCount / 3) + 2) * 16;
    let buyable = weapon.price > money ? "orange" : "yellow";
    if (ship < weapon.level) buyable = "red";

    let starCol = "white";
    const type = weapon.type;
    if (type === "Gun")   starCol = "red";
    if (type === "Missile") starCol = "orange";
    if (type === "Orb")   starCol = "tan";
    if (type === "Beam")  starCol = "lime";
    if (type === "Blast")   starCol = "green";
    if (type === "Mine")  starCol = "blue";
    if (type === "Misc")  starCol = "purple";
    ctx.fillStyle = starCol;

    write("*", wx, wy);
    ctx.fillStyle = seller - 20 == i ? "lime" : buyable;
    write(translate("[INFO] ") + ("$" + weapon.price + "         ").substring(0, 9) + weapon.name, wx + 11, wy);
    if (seller - 20 == i)
    {rWeaponStats(i);}
  }
}
global.rWeaponStats = function(i) {
  ctx.font = "14px ShareTech";
  write(wepns[i].name, rx + 32, ry + 364 + 16 * 1);
  wrapText(wepns[i].desc, rx + 32, ry + 364 + 16 * 2, 128 * 6 - 64, 16);

  write("Type   : " + wepns[i].type, rx + 32, ry + 364 + 16 * 5);
  write(translate("Range  : ") + (wepns[i].range == -1 ? translate("N/A") : (wepns[i].range + " Meters")), rx + 32, ry + 364 + 16 * 6);
  write(translate("Damage : ") + (wepns[i].damage == -1 ? translate("N/A") : wepns[i].damage), rx + 32, ry + 364 + 16 * 7);
  write(translate("Speed  : ") + (wepns[i].speed == -1 ? translate("N/A") : wepns[i].speed), rx + 32, ry + 364 + 16 * 8);
  write(translate("Charge : ") + (wepns[i].charge == -1 ? translate("N/A") : (wepns[i].charge / 25) + translate(" Seconds")), rx + 256 + 32, ry + 364 + 16 * 6);
  write(translate("Ammo   : ") + ammoCodeToString(wepns[i].ammo), rx + 256 + 32, ry + 364 + 16 * 7);
  write(translate("Ship   : ") + wepns[i].level, rx + 256 + 32, ry + 364 + 16 * 8);

  if (actuallyBuying) {
    ctx.fillStyle = wepns[i].price > money ? "orange" : "lime";
    const buyText = wepns[i].price > money ? translate("Not Enough Money") : translate("Press B to Buy");
    ctx.font = "24px ShareTech";
    write(buyText, rx + 512 + 16, ry + 256 + 100 + 16 * 7);
  }
  ctx.font = "14px ShareTech";
}
global.rBaseGui = function() {
  ctx.lineWidth = 2;
  ctx.textAlign = "right";
  ctx.fillStyle = "yellow";
  rTexts(-1);

  ctx.font = "14px ShareTech";
  ctx.lineWidth = 2;

  const tabs = {};
  tabs[0] = translate("Shop");
  tabs[1] = translate("Quests");
  tabs[2] = translate("Stats");
  tabs[3] = translate("Achievements");
  tabs[4] = translate("More");

  infoBox(rx, ry + 44, 768, 512 - 44, "black", "white");

  ctx.textAlign = "center";
  for (let i = 0; i < 5; i++) // Fill Tabs In
  {
    infoBox(rx + i * 768/5 + 8, ry + 4, 768/5-8, 32, (tab == i) ? "darkgray" : "black", "white");
  }
  ctx.fillStyle = "white";
  for (let i = 0; i < 5; i++) // Write tab names
  {
    write(tabs[i], rx + (i * 768/5 + 768/10), ry + 23);
  }

  ctx.fillStyle = "yellow";
  ctx.textAlign = "right";
  ctx.font = "18px ShareTech";
  write(translate("PRESS X TO EXIT BASE"), rx + 768 - 16, ry + 512 + 24);
  ctx.font = "14px ShareTech";
  ctx.textAlign = "left";
  // ctx.drawImage(Img.baseOutline, rx - 4, ry - 4);
  paste3DMap(8, 8);
  rCargo();
}
global.rInBase = function() {
  tick++;
  canvas.width = canvas.width;
  renderBG();
  rStars();
  pasteChat();
  rBaseGui();
  if (tab != -1) ReactRoot.turnOffRegister("LoginOverlay");
  switch (tab) {
    case 0:
      rShop();
      break;
    case 1:
      rQuests();
      break;
    case 2:
      rStats();
      break;
    case 3:
      rAchievements();
      break;
    case 4:
      rMore();
      break;
    case 7:
      rWeaponStore();
      break;
    case 8:
      rConfirm();
      break;
    default:
      break;
  }
  if (savedNote-- > 0 && !guest) {
    rSavedNote();
  }
  if (tab == -1) rCreds();
  if (self.quests != 0) rCurrQuest();
  if (lb != 0) rLB();
  rRaid();
  updateBullets();
  rTut();
  rVolumeBar();
  rBigNotes();
}