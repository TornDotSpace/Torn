var Player = require('./player.js');

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
    var spl = msg.split(" ");
    if (spl.length != 3) { // not enough arguments
        this.emit("chat", { msg: "Invalid Syntax!" });
        return;
    }
    var slot1 = parseFloat(spl[1]), slot2 = parseFloat(spl[2]);
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

    var temp = this.weapons[slot1];
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
    var name = msg.split(" ")[1];
    var raw = msg.substring(name.length + 5);
    this.emit("chat", { msg: "Sending private message to " + name + "..." });
    for (var i = 0; i < mapSz; i++) for (var j = 0; j < mapSz; j++)
        for (var p in players[j][i]) {
            var player = players[j][i][p];
            if ((player.name.includes(" ") ? player.name.split(" ")[1] : player.name) === name) {
                player.emit("chat", { msg: "~`orange~`[PM] [" + this.name + "]: " + raw });
                this.emit("chat", { msg: "Message sent!" });
                this.reply = player.name;
                player.reply = this.name;
                return;
            }
        } for (var p in dockers) {
            var player = dockers[p];
            if ((player.name.includes(" ") ? player.name.split(" ")[1] : player.name) === name) {
                player.emit("chat", { msg: "~`orange~`[PM] [" + this.name + "]: " + raw });
                this.emit("chat", { msg: "Message sent!" });
                this.reply = player.name;
                player.reply = this.name;
                return;
            }
        } for (var p in deads) {
            var player = deads[p];
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

confirmPass = async function (pass) { // /confirm
    if (!this.docked) {
        this.emit("chat", { msg: "~`red~`This command is only available when docked at a base." });
        return;
    }
    if (pass !== this.tentativePassword) {
        this.emit("chat", { msg: "~`red~`Passwords do not match! Start over from /password." });
        this.tentativePassword = undefined;
        return;
    }
    var response = await send_rpc("/reset/", this._id + "%" + pass);

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
};

module.exports = PlayerMP;