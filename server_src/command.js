class Command {
    constructor(usage, permission, invoke, visible=true) {
        this.usage = usage;
        this.permission = permission;
        this.invoke = invoke;
        this.visible = visible;
    }
}

// Permissions constants
const GUEST = -1;
const PLAYER = 0;
const YOUTUBER = 3;
const VIP = 5;
const MVP = 7;
const MODERATOR = 10;
const ADMIN = 20;
const OWNER = 30;

const PERM_TABLE = [GUEST, PLAYER, YOUTUBER, VIP, MVP, MODERATOR, ADMIN, OWNER];
var HELP_TABLE = {};

global.cmds = {};

// GUEST COMMANDS 
// All players including guests have access to these
cmds["/help"] = new Command("/help - Displays commands & usages", GUEST, function (plyr, msg) {
    for (var x = 0; x < HELP_TABLE[plyr.permissionLevel].length; ++x) {
        var cmd = HELP_TABLE[plyr.permissionLevel][x];
        plyr.socket.emit("chat", { msg: cmd.usage });
    }
});

cmds["/me"] = new Command("/me <msg>", GUEST, function (player, msg) {
    chatAll("~~`" + player.color + "~`" + player.name + "~`yellow~` " + msg.substring(4));
});

// PLAYER COMMANDS
// These commands are restricted to players that have registered their accounts
// This restriction is done for either technical reasons or anti-spam protection
cmds["/password"] = new Command("/password <newPassword>", PLAYER, function (player, msg) {
    player.changePass(msg.substring(10));
});

cmds["/confirm"] = new Command("/confirm <newPassword>", PLAYER, function (player, msg) {
    player.confirmPass(msg.substring(9));
}, false);

cmds["/changeteam"] = new Command("/changeteam", PLAYER, function (player, msg) {
    player.socket.emit("chat", { msg: "Are you sure? This costs 10% of your experience and money. You must have 10,000 exp. Type /confirmteam to continue. Make sure you aren't near any players or bases on your current team." });
});

cmds["/confirmteam"] = new Command("/confirmteam", PLAYER, function (player, msg) {
    if (player.experience <= 10000) {
        player.socket.emit("chat", { msg: "You don't have enough experience!" });
        return;
    }
    player.socket.leave("team-" + player.color);
    player.color = (player.color === "red" ? "blue" : "red");
    player.socket.join("team-" + player.color);
    player.money *= .9;
    player.experience *= .9;
    player.save();
}, false);

cmds["/nameturret"] = new Command("/nameturret <name>", PLAYER, function (player, msg) {
	var num = 0;
    var base = bases[player.sy][player.sx];
    if(base != 0 && base.owner == player.name) { base.name = msg.substring(12); num++; }
    player.socket.emit("chat", { msg: num + " turrets renamed." });
});

cmds["/pm"] = new Command("/pm <player> <msg>", PLAYER, function (player, msg) {
    player.pm(msg);
});

cmds["/r"] = new Command("/r <msg>", PLAYER, function (player, msg) {
    player.r(msg);
});

cmds["/swap"] = new Command("/swap", PLAYER, function (player, msg) {
    player.swap(msg);
});

cmds["/email"] = new Command("/email <you@domain.tld> - Sets your email for password resets", ADMIN, function (player, msg) {
    debug("EMAIL!");
    player.setEmail(msg);
});

// MODERATION COMMANDS
// These commands are accessible to moderators in the game
cmds["/broadcast"] = new Command("/broadcast <msg> - Send a message to the whole server", MODERATOR, function (player, msg) {
    chatAll("~`#f66~`       BROADCAST: ~`lime~`" + msg.substring(11));
});

cmds["/mute"] = new Command("/mute <player> <minutesToMute> - Mutes the specified player.", MODERATOR, function (player, msg) {
    if (msg.split(" ").length != 3) return; // split looks like {"/mute", "name", "minutesToMute"}
    var name = msg.split(" ")[1];
    var minutes = parseFloat(msg.split(" ")[2]);
    if (typeof minutes !== "number") return;

    if (minutes < 0) return;

    muteTable[name] = (Date.now() + (minutes * 60 * 1000));
});


// ADMINSTRATOR COMMANDS
// These commands are accessible to adminstrators in the game
cmds["/reboot"] = new Command("/reboot - Schedules a restart of the shard", ADMIN, initReboot);

cmds["/smite"] = new Command("/smite <player> - Smites the specified player", ADMIN, function (ply, msg) {
    if (msg.split(" ").length != 2) return;
    var name = msg.split(" ")[1];
    for (var x = 0; x < mapSz; x++) for (var y = 0; y < mapSz; y++)
        for (var p in players[y][x]) { // only search players who are in game
            var player = players[y][x][p];
            if (player.name === name) {
                player.die(0);
                chatAll("~`violet~`" + player.name + "~`yellow~` has been Smitten!");
                return;
            }
        }
});

// TODO: need to be fixed
//cmds["/undecayplayers"] = new Command("/undecayPlayers - Reverts decay on all players", ADMIN, undecayPlayers);
cmds["/decayplayers"] = new Command("/decayPlayers - Decays all players tech", ADMIN, decayPlayers);

cmds["/saveturrets"] = new Command("/saveTurrets - Runs a manual save on the server turrets", ADMIN, saveTurrets);

cmds["/eval"] = new Command("/eval .... - Evaluates arbitrary JS on the server", ADMIN, function (player, msg) {
    try {
        send(player.id, "chat", { msg: eval(msg.substring(5)) });
    } catch (e) {
        send(player.id, "chat", { msg: "An error occurred: " + e });
    }
});

cmds["/max"] = new Command("/max - Maxes out a player's stats for testing purposes", ADMIN, function (player, msg) {
    player.rank = 20;
    player.money = Number.MAX_SAFE_INTEGER;
    player.experience = Number.MAX_SAFE_INTEGER;

    send(player.id, "chat", {msg: "Max Mode Activated"});
});

// Compute help menu
for (var x in PERM_TABLE) {
    HELP_TABLE[PERM_TABLE[x]] = []; // construct empty array
    for (var cmd in cmds) {
        if (cmds[cmd].permission <= PERM_TABLE[x] && cmds[cmd].visible) {
            HELP_TABLE[PERM_TABLE[x]].push(cmds[cmd]);
        }
    }
}
