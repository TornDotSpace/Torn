const Player = require("./player.js");
const Package = require("./universe/package.js");

class PlayerMP extends Player {
  constructor(socket) {
    super(socket.id);

    socket.player = this;
    this.socket = socket;
    this.guild = "";

    this.ip = 0;
    this.chatTimer = 100;
    this.muteCap = 750;
    this.globalChat = 0;
    this.lastmsg = "";

    this.reply = "nobody"; // last person to pm / who pmed me
    this.lastLogin = new Date();

    this.permissionLevels = [-1];
    this.kickMsg = "";
    this.afkTimer = afkTimerConst; // used to check AFK status
  }

  tick() {
    if (this.guild in guildPlayers) guildPlayers[this.guild][this.id] = {sx: this.sx, sy: this.sy, x: this.x, y: this.y};
    super.tick();
  }

  kick(msg) {
    this.kickMsg = msg;
    this.emit("kick", {msg: msg});
    this.socket.disconnect();
    delete players[this.sy][this.sx][this.id];
  }

  swap(msg) { // msg looks like "/swap 2 5". Swaps two weapons.
    if (!this.docked) {
      this.emit("chat", {msg: "You must be docked to use that command!"});
      return;
    }
    const spl = msg.split(" ");
    if (spl.length != 3) { // not enough arguments
      this.emit("chat", {msg: "Invalid Syntax!"});
      return;
    }
    let slot1 = parseFloat(spl[1]); let slot2 = parseFloat(spl[2]);
    if (slot1 == 0) slot1 = 10;
    if (slot2 == 0) slot2 = 10;
    if (slot1 > 10 || slot2 > 10 || slot1 < 1 || slot2 < 1 || !slot1 || !slot2 || !Number.isInteger(slot1) || !Number.isInteger(slot2)) {
      this.emit("chat", {msg: "Invalid Syntax!"});
      return;
    }
    if (this.weapons[slot1] == -2 || this.weapons[slot2] == -2) {
      this.emit("chat", {msg: "You haven't unlocked that slot yet!"});
      return;
    }

    slot1--; slot2--;// done later for NaN checking above: "!slot1"

    let temp = this.weapons[slot1];
    this.weapons[slot1] = this.weapons[slot2];
    this.weapons[slot2] = temp;
    temp = this.ammos[slot1];
    this.ammos[slot1] = this.ammos[slot2];
    this.ammos[slot2] = temp;

    if (this.equipped == slot1) this.equipped = slot2;
    else if (this.equipped == slot2) this.equipped = slot1;

    sendWeapons(this);
    this.emit("equip", {scroll: this.equipped});
    this.emit("chat", {msg: "Weapons swapped!"});
  }

  r(msg) { // pm reply
    if (this.reply.includes(" ")) this.reply = this.reply.split(" ")[1];
    this.pm("/pm " + this.reply + " " + msg.substring(3));
  }
  pm(msg) { // msg looks like "/pm luunch hey there pal". If a moderator, you use "2swap" not "[O] 2swap".
    if (msg.split(" ").length < 3) { // gotta have pm, name, then message
      this.emit("chat", {msg: "Invalid Syntax!"});
      return;
    }
    const name = msg.split(" ")[1];
    const raw = msg.substring(name.length + 5);
    this.emit("chat", {msg: "Sending private message to " + name + "..."});
    for (let i = 0; i < mapSz; i++) {
      for (let j = 0; j < mapSz; j++) {
        for (const p in players[j][i]) {
          const player = players[j][i][p];
          if ((player.name.includes(" ") ? player.name.split(" ")[1] : player.name) === name) {
            player.emit("chat", {msg: "~`orange~`[PM] [" + this.name + "]: " + raw});
            this.emit("chat", {msg: "Message sent!"});
            this.reply = player.name;
            player.reply = this.name;
            return;
          }
        }
      }
    } for (const p in dockers) {
      const player = dockers[p];
      if ((player.name.includes(" ") ? player.name.split(" ")[1] : player.name) === name) {
        player.emit("chat", {msg: "~`orange~`[PM] [" + this.name + "]: " + raw});
        this.emit("chat", {msg: "Message sent!"});
        this.reply = player.name;
        player.reply = this.name;
        return;
      }
    } for (const p in deads) {
      const player = deads[p];
      if ((player.name.includes(" ") ? player.name.split(" ")[1] : player.name) === name) {
        player.emit("chat", {msg: "~`orange~`[PM] [" + this.name + "]: " + raw});
        this.emit("chat", {msg: "Message sent!"});
        this.reply = player.name;
        player.reply = this.name;
        return;
      }
    }
    this.emit("chat", {msg: "Player not found!"});
  }

  changePass(pass) { // /password
    if (!this.docked) {
      this.emit("chat", {msg: "~`red~`This command is only available when docked at a base."});
      return;
    }
    if (pass.length > 128 || pass.length < 6) {
      this.emit("chat", {msg: "~`red~`Password must be 6-128 characters."});
      return;
    }
    this.tentativePassword = pass;
    this.emit("chat", {msg: "~`red~`Type \"/confirm your_new_password\" to complete the change."});
  }

  async confirmPass(pass) { // /confirm
    if (!this.docked) {
      this.emit("chat", {msg: "~`red~`This command is only available when docked at a base."});
      return;
    }
    if (pass !== this.tentativePassword) {
      this.emit("chat", {msg: "~`red~`Passwords do not match! Start over from /password."});
      this.tentativePassword = undefined;
      return;
    }
    const response = await send_rpc("/reset/", this._id + "%" + pass);

    if (!response.ok) {
      this.emit("chat", {msg: "ERROR"});
      return;
    }

    this.tentativePassword = undefined;
    this.emit("chat", {msg: "~`lime~`Password changed successfully."});
  }

  testAfk() {
    if (this.afkTimer-- < 0) {
      this.emit("AFK");
      this.kick("AFK!");
      this.testAfk = function() {
        return false;
      };
      return true;
    }
    return false;
  }

  emit(a, b) {
    this.socket.emit(a, b);
  }
  async die(b) { // b: bullet object or other object which killed us
    delete players[this.sy][this.sx][this.id];

    this.empTimer = -1;
    this.killStreak = 0;
    this.leaveBaseShield = 25;
    this.refillAllAmmo();

    sendAllSector("sound", {file: "bigboom", x: this.x, y: this.y, dx: Math.cos(this.angle) * this.speed, dy: Math.sin(this.angle) * this.speed}, this.sx, this.sy);

    // clear quest
    this.quest = 0;
    this.emit("quest", {quest: 0, complete: false});// reset quest and update client

    if (typeof b.owner !== "undefined" && b.owner.type === "Player") {
      const customMessageArr = eng.weapons[b.wepnID].killmessages;
      const useCustomKillMessage = Math.random() < .5 && typeof customMessageArr !== "undefined" && customMessageArr.length > 0;

      if (useCustomKillMessage) chatAll(customMessageArr[Math.floor(Math.random()*customMessageArr.length)].replace("P1", b.owner.nameWithColor()).replace("P2", this.nameWithColor()));
      else chatAll(this.nameWithColor() + " was destroyed by " + b.owner.nameWithColor() + "'s `~" + b.wepnID + "`~!");

      if (b.owner.w && b.owner.e && (b.owner.a || b.owner.d) && !b.owner.driftAchs[9]) { // driftkill
        b.owner.driftAchs[9] = true;
        b.owner.sendAchievementsDrift(true);
      }
    }
    // send msg
    else if (b.type === "Vortex") chatAll(this.nameWithColor() + " crashed into a black hole!");
    else if (b.type === "Planet" || b.type === "Asteroid") chatAll(this.nameWithColor() + " crashed into an asteroid!");
    else if (b.owner !== undefined && b.owner.type === "Base") chatAll(this.nameWithColor() + " was destroyed by base " + b.owner.nameWithColor() + "!");

    if (b.type !== "Vortex") {
      // drop a package
      const r = Math.random();
      if (this.hasPackage && !this.isBot) packs[this.sy][this.sx][r] = new Package(this, r, 0); // an actual package (courier)
      else if (Math.random() < .012 && !this.guest) packs[this.sy][this.sx][r] = new Package(this, r, 2);// life
      else if (Math.random() < .1 && !this.guest) packs[this.sy][this.sx][r] = new Package(this, r, 3);// ammo
      else if (!this.guest) packs[this.sy][this.sx][r] = new Package(this, r, 1);// coin
    }

    const diff = playerKillExpFraction * this.experience;
    const moneyEarned = Math.max(0, playerKillMoneyFraction*this.money);
    // give the killer stuff
    if (b.owner != 0 && (typeof b.owner !== "undefined") && (b.owner.type === "Player" || b.owner.type === "Base")) {
      b.owner.onKill(this);

      // Award (or punish for teamkills)
      // const diff = playerKillExpFraction * this.experience;
      const other_ip = b.owner["ip"];
      if (!this.guest && !(other_ip !== undefined && other_ip == this.ip)) { // Only award them if their IP differs and they didn't kill a guest
    	if (this.color !== b.owner.color) b.owner.spoils("experience", 10 + Math.min(this.experience*2, diff)); // Self-feeding protection
    	else b.owner.spoils("experience", -5 * Math.min(diff, b.owner.experience*playerKillExpFraction)); // Punishment equals -5 times what the reward would have been, unless it's large in proportant to the punished person's exp
        b.owner.spoils("money", moneyEarned + (b.owner.type === "Player" ? b.owner.killStreak*playerKillMoney : playerKillMoney));
      }
      if (this.color === b.owner.color && b.owner.type === "Player") b.owner.save(); // prevents people from logging out to get rid of their punishment

      if (this.points > 0) { // raid points
        b.owner.points++;
        this.points--;
      }
    }
    // this.owner.spoils('experience', -diff); //For some reason it doen't work
    this.money -= moneyEarned;
    this.experience -= diff;
    if (this.experience < 0) this.experience=0; // Ensuring we don't have negative xp people, as rare as that case may be
    this.updateRank(); // Ensuring we don't have overleveled players that remain in the wrong level until they kill something.

    this.hasPackage = false; // Maintained for onKill above

    this.health = this.maxHealth;
    this.dead = true;

    await handlePlayerDeath(this);

    this.x = this.y = sectorWidth / 2;
    const whereToRespawn = Math.floor(Math.random()*basesPerTeam)*2;
    this.sx = baseMap[this.color][whereToRespawn];
    this.sy = baseMap[this.color][whereToRespawn+1];

    this.lives--;
    this.save();
    if (this.lives <= 0) {
      this.kick("Goodbye captain: no more lives remaining!");
      return;
    }

    this.sendStatus();
    this.sendAchievementsMisc(true);

    // put this player in the dead list
    deads[this.id] = this;

    sendWeapons(this);
  }

  save() {
    if (this.guest) return;
    savePlayerData(this);
  }

  sellOre(oretype) {
    // pay them appropriately
    if (oretype == "iron" || oretype == "all") {
      this.spoils("money", this.iron);
      this.iron = 0;
    } if (oretype == "silver" || oretype == "all") {
      this.spoils("money", this.silver);
      this.silver = 0;
    } if (oretype == "platinum" || oretype == "all") {
      this.spoils("money", this.platinum);
      this.platinum = 0;
    } if (oretype == "copper" || oretype == "all") {
      this.spoils("money", this.copper);
      this.copper = 0;
    }
    this.save();
  }

  dock() {
    if (typeof this.aluminium === "undefined") this.aluminium = 0;
    if (typeof this.copper === "undefined") this.copper = 0;
    this.copper += this.aluminium;
    this.aluminium = 0;

    if (this.docked) { // undock if already docked. This toggles the player's dock status
      this.getAllPlanets(); // tell client what's out in the sector
      this.docked = false;
      players[this.sy][this.sx][this.id] = this;
      delete dockers[this.id];
      this.leaveBaseShield = 25;
      this.health = this.maxHealth;
      return;
    }

    this.checkTrailAchs();

    let base = 0;
    const b = bases[this.sy][this.sx];
    if (b.isBase && b.color == this.color && squaredDist(this, b) < square(512)) base = b; // try to find a base on our team that's in range and isn't just a turret
    if (base == 0) return;

    this.refillAllAmmo();
    this.x = this.y = sectorWidth / 2;
    this.save();
    this.docked = true;

    dockers[this.id] = this;
    delete players[this.sy][this.sx][this.id];

    this.sendStatus();
  }

  spoils(type, amt) { // gives you something. Called wenever you earn money / exp / w/e
    if (typeof amt === "undefined") return;
    if (type === "experience") {
      this.experience += amt;
      this.updateRank();
    } else if (type === "money") this.money += amt * ((amt > 0 && this.trail % 16 == 2) ? 1.05 : 1);
    else if (type === "life" && this.lives < 20) this.lives += amt;
    this.experience = Math.max(this.experience, 0);
    this.emit("spoils", {type: type, amt: amt});
  }

  onMined(a) {
    // bitmask of what types of ores this player has mined
    if ((this.oresMined & (1 << a)) == 0) this.oresMined += 1 << a;

    // achievementy stuff
    if (this.oresMined == 15 && !this.moneyAchs[1]) this.moneyAchs[1] = true;
    else if (!this.moneyAchs[0]) this.moneyAchs[0] = true;
    else if (!this.moneyAchs[2] && 4000 <= this.iron + this.silver + this.copper + this.platinum) this.moneyAchs[2] = true;
    else if (!this.moneyAchs[3] && 15000 <= this.iron + this.silver + this.copper + this.platinum) this.moneyAchs[3] = true;
    else return;
    this.sendAchievementsCash(true);
  }
  sendAchievementsKill(note) {
    this.emit("achievementsKill", {note: note, achs: this.killsAchs});
  }
  sendAchievementsCash(note) {
    this.emit("achievementsCash", {note: note, achs: this.moneyAchs});
  }
  sendAchievementsDrift(note) {
    this.emit("achievementsDrift", {note: note, achs: this.driftAchs});
  }
  sendAchievementsMisc(note) {
    this.randmAchs[9] = !this.planetsClaimed.includes("0") && !this.planetsClaimed.includes("1"); // I had no clue where to put this. couldn't go in onPlanetCollision, trust me.
    this.emit("achievementsMisc", {note: note, achs: this.randmAchs});
  }
  sendStatus() {
    this.emit("status", {docked: this.docked, state: this.dead, lives: this.lives});
  }
  checkMoneyAchievements() {
    if (this.money >= 10000 && !this.moneyAchs[4]) this.moneyAchs[4] = true;
    else if (this.money >= 100000 && !this.moneyAchs[5]) this.moneyAchs[5] = true;
    else if (this.money >= 1000000 && !this.moneyAchs[6]) this.moneyAchs[6] = true;
    else if (this.money >= 10000000 && !this.moneyAchs[7]) this.moneyAchs[7] = true;
    else return;
    this.sendAchievementsCash(true);
  }
  checkDriftAchs() {
    if (this.driftTimer >= 25 && !this.driftAchs[0]) this.driftAchs[0] = true; // drift 1sex
    else if (this.driftTimer >= 25 * 60 && !this.driftAchs[1]) this.driftAchs[1] = true; // 1min
    else if (this.driftTimer >= 25 * 60 * 10 && !this.driftAchs[2]) this.driftAchs[2] = true; // 10mins
    else if (this.driftTimer >= 25 * 60 * 60 && !this.driftAchs[3]) this.driftAchs[3] = true; // 1hr
    else if (this.driftTimer >= 25 * 60 * 60 * 10 && !this.driftAchs[4]) this.driftAchs[4] = true; // 10hrs
    else return;
    this.sendAchievementsDrift(true);
  }
  checkTrailAchs() {
    // Check if they have all achievements of a type. If so, give them the corresponding trail achievement of that type

    let rAll = true;
    for (let i = 0; i < 10; i++) if (!this.randmAchs[i]) rAll = false;
    if (!this.randmAchs[10] && rAll) {
      this.randmAchs[10] = true;
      this.sendAchievementsMisc(false);
    }

    rAll = true;
    for (let i = 0; i < 12; i++) if (!this.killsAchs[i]) rAll = false;
    if (!this.killsAchs[12] && rAll) {
      this.killsAchs[12] = true;
      this.sendAchievementsKill(false);
    }

    rAll = true;
    for (let i = 0; i < 11; i++) if (!this.driftAchs[i]) rAll = false;
    if (!this.driftAchs[11] && rAll) {
      this.driftAchs[11] = true;
      this.sendAchievementsDrift(false);
    }

    rAll = true;
    for (let i = 0; i < 11; i++) if (!this.moneyAchs[i]) rAll = false;
    if (!this.moneyAchs[11] && rAll) {
      this.moneyAchs[11] = true;
      this.sendAchievementsCash(false);
    }
  }

  noteLocal(msg, x, y) {
    this.emit("note", {msg: msg, x: x, y: y, local: true});
  }
  strongLocal(msg, x, y) {
    this.emit("strong", {msg: msg, x: x, y: y, local: true});
  }

  baseKilled() {
    this.baseKills++;

    // achievementy stuff
    this.killsAchs[7] = this.baseKills >= 1;
    this.killsAchs[8] = this.baseKills >= 100;
    this.sendAchievementsKill(true);

    // base quest checking
    if (this.quest != 0 && this.quest.type == "Base") {
      if (this.sx == this.quest.sx && this.sy == this.quest.sy) {
        // reward player
        this.spoils("money", this.quest.exp);
        this.spoils("experience", Math.floor(this.quest.exp / 4000));

        this.quest = 0; // tell client it's done
        this.emit("quest", {quest: this.quest, complete: true});
        if ((this.questsDone & 4) == 0) this.questsDone += 4;

        if (!this.moneyAchs[9]) { // Questor
          this.moneyAchs[9] = true;
          this.sendAchievementsCash(true);
        }
      }
    }

    if (this.questsDone == 15 && !this.moneyAchs[10]) { // Adventurer
      this.moneyAchs[10] = true;
      this.sendAchievementsCash(true);
    }
  }

  checkQuestStatus(touchingPlanet) {
    if (this.quest == 0) return;// no point if the person hasn't got a quest rn.

    if (this.quest.type === "Mining" && this.sx == this.quest.sx && this.sy == this.quest.sy) {
      // check the player has sufficient metal according to quest
      if (this.quest.metal == "copper" && this.copper < this.quest.amt) return;
      if (this.quest.metal == "iron" && this.iron < this.quest.amt) return;
      if (this.quest.metal == "silver" && this.silver < this.quest.amt) return;
      if (this.quest.metal == "platinum" && this.platinum < this.quest.amt) return;

      // take the amount from them
      if (this.quest.metal == "copper") this.copper -= this.quest.amt;
      if (this.quest.metal == "iron") this.iron -= this.quest.amt;
      if (this.quest.metal == "silver") this.silver -= this.quest.amt;
      if (this.quest.metal == "platinum") this.platinum -= this.quest.amt;

      // reward them
      this.spoils("money", this.quest.exp);
      this.spoils("experience", Math.floor(this.quest.exp / 1500));

      this.quest = 0;
      this.emit("quest", {quest: this.quest, complete: true}); // tell client quest is over

      if (!this.moneyAchs[9]) { // Questor
        this.moneyAchs[9] = true;
        this.sendAchievementsCash(true);
      }

      if ((this.questsDone & 1) == 0) this.questsDone += 1;
    } else if (this.quest.type === "Delivery" && touchingPlanet) {
      // pickup
      if (this.sx == this.quest.sx && this.sy == this.quest.sy && !this.hasPackage) {
        this.hasPackage = true;
        this.strongLocal("Package obtained!", this.x, this.y - 192);
      }

      // dropoff
      if (this.hasPackage && this.sx == this.quest.dsx && this.sy == this.quest.dsy) {
        this.spoils("money", this.quest.exp);// reward
        this.spoils("experience", Math.floor(this.quest.exp / 1500));

        this.hasPackage = false;
        this.quest = 0;
        this.emit("quest", {quest: this.quest, complete: true}); // tell client it's over
        if ((this.questsDone & 2) == 0) this.questsDone += 2;

        if (!this.moneyAchs[9]) { // Questor
          this.moneyAchs[9] = true;
          this.sendAchievementsCash(true);
        }
      }
    }

    if (this.questsDone == 15 && !this.moneyAchs[10]) { // Adventurer
      this.moneyAchs[10] = true;
      this.sendAchievementsCash(true);
    }
  }

  getAllPlanets() {
    let packHere = 0;
    const planet = planets[this.sy][this.sx];
    packHere = {id: planet.id, name: planet.name, x: planet.x, y: planet.y, color: planet.color};
    this.emit("planets", {pack: packHere});
  }

  onKill(p) {
    super.onKill(p);

    // achievementy stuff
    this.killsAchs[0] = this.kills >= 1;
    this.killsAchs[1] = this.kills >= 10;
    this.killsAchs[2] = this.kills >= 100;
    this.killsAchs[3] = this.kills >= 1000;
    this.killsAchs[4] = this.kills >= 4000;
    this.killsAchs[5] = this.kills >= 10000;
    if (p.trail != 0) this.killsAchs[6] = true;
    if (p.hasPackage) this.killsAchs[10] = true;
    if (p.name === this.name) this.killsAchs[11] = true;
    else if (p.color === this.color) this.killsAchs[9] = true;
    this.sendAchievementsKill(true);
    if (p.color === this.color) this.save();
  }
};

module.exports = PlayerMP;
