let Player = require('./player.js');
let Package = require("./universe/package.js");

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
        this.afkTimer = 10 * 60 * 30; // check for afk
    }

    kick(msg) {
		this.kickMsg = msg;
		this.emit("kick", { msg: msg });
		this.socket.disconnect();

		// HACK: Block crash on "double-death"
		this.die = function() { };
    }
    
    swap(msg) { // msg looks like "/swap 2 5". Swaps two weapons.
    if (!this.docked) {
        this.emit("chat", { msg: "You must be docked to use that command!" });
        return;
    }
    let spl = msg.split(" ");
    if (spl.length != 3) { // not enough arguments
        this.emit("chat", { msg: "Invalid Syntax!" });
        return;
    }
    let slot1 = parseFloat(spl[1]), slot2 = parseFloat(spl[2]);
    if (slot1 == 0) slot1 = 10;
    if (slot2 == 0) slot2 = 10;
    if (slot1 > 10 || slot2 > 10 || slot1 < 1 || slot2 < 1 || !slot1 || !slot2 || !Number.isInteger(slot1) || !Number.isInteger(slot2)) {
        this.emit("chat", { msg: "Invalid Syntax!" });
        return;
    }
    if (this.weapons[slot1] == -2 || this.weapons[slot2] == -2) {
        this.emit("chat", { msg: "You haven't unlocked that slot yet!" });
        return;
    }

    slot1--; slot2--;//done later for NaN checking above: "!slot1"

    let temp = this.weapons[slot1];
    this.weapons[slot1] = this.weapons[slot2];
    this.weapons[slot2] = temp;
    temp = this.ammos[slot1];
    this.ammos[slot1] = this.ammos[slot2];
    this.ammos[slot2] = temp;

    if(this.equipped == slot1) this.equipped = slot2;
    else if(this.equipped == slot2) this.equipped = slot1;

    sendWeapons(this);
    this.emit('equip', { scroll: this.equipped });
    this.emit("chat", { msg: "Weapons swapped!" });
}

r(msg) { // pm reply
    if (this.reply.includes(" ")) this.reply = this.reply.split(" ")[1];
    this.pm("/pm " + this.reply + " " + msg.substring(3));
}
pm(msg) { // msg looks like "/pm luunch hey there pal". If a moderator, you use "2swap" not "[O] 2swap".
    if (msg.split(" ").length < 3) { // gotta have pm, name, then message
        this.emit("chat", { msg: "Invalid Syntax!" });
        return;
    }
    let name = msg.split(" ")[1];
    let raw = msg.substring(name.length + 5);
    this.emit("chat", { msg: "Sending private message to " + name + "..." });
    for (let i = 0; i < mapSz; i++) for (let j = 0; j < mapSz; j++)
        for (let p in players[j][i]) {
            let player = players[j][i][p];
            if ((player.name.includes(" ") ? player.name.split(" ")[1] : player.name) === name) {
                player.emit("chat", { msg: "~`orange~`[PM] [" + this.name + "]: " + raw });
                this.emit("chat", { msg: "Message sent!" });
                this.reply = player.name;
                player.reply = this.name;
                return;
            }
        } for (let p in dockers) {
            let player = dockers[p];
            if ((player.name.includes(" ") ? player.name.split(" ")[1] : player.name) === name) {
                player.emit("chat", { msg: "~`orange~`[PM] [" + this.name + "]: " + raw });
                this.emit("chat", { msg: "Message sent!" });
                this.reply = player.name;
                player.reply = this.name;
                return;
            }
        } for (let p in deads) {
            let player = deads[p];
            if ((player.name.includes(" ") ? player.name.split(" ")[1] : player.name) === name) {
                player.emit("chat", { msg: "~`orange~`[PM] [" + this.name + "]: " + raw });
                this.emit("chat", { msg: "Message sent!" });
                this.reply = player.name;
                player.reply = this.name;
                return;
            }
        }
    this.emit("chat", { msg: "Player not found!" });
}

changePass(pass) { // /password
    if (!this.docked) {
        this.emit("chat", { msg: "~`red~`This command is only available when docked at a base." });
        return;
    }
    if (pass.length > 128 || pass.length < 6) {
        this.emit("chat", { msg: "~`red~`Password must be 6-128 characters." });
        return;
    }
    this.tentativePassword = pass;
    this.emit("chat", { msg: "~`red~`Type \"/confirm your_new_password\" to complete the change." });
}

async confirmPass(pass) { // /confirm
    if (!this.docked) {
        this.emit("chat", { msg: "~`red~`This command is only available when docked at a base." });
        return;
    }
    if (pass !== this.tentativePassword) {
        this.emit("chat", { msg: "~`red~`Passwords do not match! Start over from /password." });
        this.tentativePassword = undefined;
        return;
    }
    let response = await send_rpc("/reset/", this._id + "%" + pass);

    if (!response.ok) {
        this.emit("chat", { msg : "ERROR"});
        return;
    }

    this.tentativePassword = undefined;
    this.emit("chat", { msg: "~`lime~`Password changed successfully." });
}

testAfk() {
    if (this.afkTimer-- < 0) {
        this.emit("AFK");
        this.kick("AFK!");
        this.testAfk = function() { return false; };
        return true;
    }
    return false;
}

emit(a, b) {
    this.socket.emit(a, b);
}
async die (b) { // b: bullet object or other object which killed us
    delete players[this.sy][this.sx][this.id];

    this.empTimer = -1;
    this.killStreak = 0;
    let diff = .02 * this.experience;
    this.leaveBaseShield = 25;
    this.refillAllAmmo();

    sendAllSector('sound', { file: "bigboom", x: this.x, y: this.y, dx: Math.cos(this.angle) * this.speed, dy: Math.sin(this.angle) * this.speed }, this.sx, this.sy);

    //clear quest
    this.quest = 0;
    this.emit('quest', { quest: 0, complete: false});//reset quest and update client

    if (typeof b.owner !== "undefined" && b.owner.type === "Player") {
        let customMessageArr = eng.weapons[b.wepnID].killmessages;
        let useCustomKillMessage = Math.random() < .5 && typeof customMessageArr !== "undefined" && customMessageArr.length > 0;

        if(useCustomKillMessage) chatAll(customMessageArr[Math.floor(Math.random()*customMessageArr.length)].replace("P1", b.owner.nameWithColor()).replace("P2", this.nameWithColor()));
        else chatAll(this.nameWithColor() + " was destroyed by " + b.owner.nameWithColor() + "'s `~" + b.wepnID + "`~!");

        if (b.owner.w && b.owner.e && (b.owner.a || b.owner.d) && !b.owner.driftAchs[9]) { // driftkill
            b.owner.driftAchs[9] = true;
            b.owner.sendAchievementsDrift(true);
        }
    }
    //send msg
    else if (b.type === "Vortex") chatAll(this.nameWithColor() + " crashed into a black hole!");
    else if (b.type === "Planet" || b.type === "Asteroid") chatAll(this.nameWithColor() + " crashed into an asteroid!");
    else if (b.owner !== undefined && b.owner.type === "Base") chatAll(this.nameWithColor() + " was destroyed by base " + b.owner.nameWithColor() + "!");

    if (b.type !== "Vortex"){
        //drop a package
        let r = Math.random();
        if (this.hasPackage && !this.isBot) packs[this.sy][this.sx][r] = new Package(this, r, 0); // an actual package (courier)
        else if (Math.random() < .012 && !this.guest) packs[this.sy][this.sx][r] = new Package(this, r, 2);//life
        else if (Math.random() < .1 && !this.guest) packs[this.sy][this.sx][r] = new Package(this, r, 3);//ammo
        else if (!this.guest) packs[this.sy][this.sx][r] = new Package(this, r, 1);//coin
    }

        //give the killer stuff
    if ((b.owner != 0) && (typeof b.owner !== "undefined") && (b.owner.type === "Player" || b.owner.type === "Base")) {
        b.owner.onKill(this);
        b.owner.spoils("experience", !this.guest ? (10 + diff * (this.color === b.owner.color ? -5 : 1)) : 0);
        // Prevent farming and disincentivize targetting guests
        b.owner.spoils("money", b.owner.type === "Player" ? (this.guest ? 0 : b.owner.killStreak*playerKillMoney) : playerKillMoney);

        if (this.points > 0) { // raid points
            b.owner.points++;
            this.points--;
        }
    }

    this.hasPackage = false; // Maintained for onKill above

    this.health = this.maxHealth;
    this.dead = true;

    await handlePlayerDeath(this);

    this.x = this.y = sectorWidth / 2;
    let whereToRespawn = Math.floor(Math.random()*basesPerTeam)*2
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

    //put this player in the dead list
    deads[this.id] = this;

    sendWeapons(this);
}

save() {
    if (this.guest) return;
    savePlayerData(this);
}

};

module.exports = PlayerMP;