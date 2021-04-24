/*
Copyright (C) 2021  torn.space (https://torn.space)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

class Command {
    constructor (usage, permissions, invoke, visible = true) {
        this.usage = usage;
        this.permissions = permissions;
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
const EVERYONE = [GUEST, PLAYER, YOUTUBER, VIP, MVP, MODERATOR, ADMIN, OWNER];
const REGISTERED = [PLAYER, YOUTUBER, VIP, MVP, MODERATOR, ADMIN, OWNER];
const VIPPLUS = [VIP, MVP, MODERATOR, ADMIN, OWNER];
const MVPPLUS = [MVP, MODERATOR, ADMIN, OWNER];
const MODPLUS = [MODERATOR, ADMIN, OWNER];
const ADMINPLUS = [ADMIN, OWNER];

const PERM_TABLE = [GUEST, PLAYER, YOUTUBER, VIP, MVP, MODERATOR, ADMIN, OWNER];
const HELP_TABLE = {};

global.cmds = {};

// GUEST COMMANDS
// All players including guests have access to these
cmds.help = new Command(`/help - Displays commands & usages`, EVERYONE, (plyr, msg) => {
    for (const p in plyr.permissionLevels) {
        const lvl = plyr.permissionLevels[p];
	    for (let x = 0; x < HELP_TABLE[lvl].length; ++x) {
	        const cmd = HELP_TABLE[lvl][x];
	        plyr.socket.emit(`chat`, { msg: cmd.usage });
	    }
    }
});

cmds.me = new Command(`/me <msg>`, EVERYONE, (player, msg) => {
    if (msg.split(` `).length == 1) return;
    console.log(`[ME]: ${msg}`);
    playerChat(`~~\`${player.color}~\`${player.name}~\`yellow~\` ${msg.substring(4)}`, player.globalChat, player.color, player.guild);
});

cmds.myguild = new Command(`/myguild - Tells you what guild you're in`, EVERYONE, (player, msg) => {
    if (player.guild === ``) player.socket.emit(`chat`, { msg: `~\`orange~\`You aren't in a guild!` });
    else player.socket.emit(`chat`, { msg: `~\`orange~\`Your guild is: ${player.guild}` });
});

cmds.guildlist = new Command(`/guildlist - Tells you a list of all guilds`, EVERYONE, (player, msg) => {
    for (const g in guildList) {
        player.socket.emit(`chat`, { msg: `~\`orange~\`${g}` });
    }
});

cmds.playerstats = new Command(`/playerstats - See how many players are online`, EVERYONE, (player, msg) => {
    let sumAsts = 0;
    for (const i in astCount) for (const j in astCount[i])sumAsts += astCount[i][j];
    player.socket.emit(`chat`, { msg: `~\`orange~\`${guestCount} guests, ${playerCount} players, ${botCount} bots, and ${sumAsts} asteroids.` });
});

// PLAYER COMMANDS
// These commands are restricted to players that have registered their accounts
// This restriction is done for either technical reasons or anti-spam protection
cmds.password = new Command(`/password <newPassword>`, REGISTERED, (player, msg) => {
    player.changePass(msg.substring(10));
});

cmds.confirm = new Command(`/confirm <newPassword>`, REGISTERED, async (player, msg) => {
    await player.confirmPass(msg.substring(9));
}, false);

cmds.changeteam = new Command(`/changeteam`, REGISTERED, (player, msg) => {
    if (!player.docked) {
        player.socket.emit(`chat`, { msg: `~\`red~\`This command is only available when docked at a base.` }); return;
    }
    const split = msg.split(` `);
    if (split.length > 2) {
        player.socket.emit(`chat`, { msg: `Bad syntax! The message should look like '/changeteam'` }); return;
    }
    if (split.length == 1) {
        player.socket.emit(`chat`, { msg: `Are you sure? This costs 10% of your experience and money. You must have 10,000 exp. Type "/changeteam <color>" to continue. Make sure you aren't near any players or bases on your current team.` });
    }
    if (split.length == 2) {
        if (player.experience <= 10000) {
            player.socket.emit(`chat`, { msg: `You don't have enough experience!` });
            return;
        }
        if (split[1] !== `green` && split[1] !== `blue` && split[1] !== `red`) {
            player.socket.emit(`chat`, { msg: `Invalid team to switch to!` });
            return;
        }
        if (split[1] === player.color) {
            player.socket.emit(`chat`, { msg: `That's your current team!` });
            return;
        }
        teamDict = { red: 0, blue: 1, green: 2 };
        old_sx = player.sx;
        player.sx = (player.sx + 3 * (teamDict[split[1]] - teamDict[player.color])) % mapSz;
        player.color = split[1];
        player.money *= 0.9;
        player.experience *= 0.9;
        delete players[player.sy][old_sx][player.id];
        players[player.sy][player.sx][player.id] = player;
        player.save();
    }
});

cmds.nameturret = new Command(`/nameturret <name>`, REGISTERED, (player, msg) => {
    let num = 0;
    const base = bases[player.sy][player.sx];
    if (base != 0 && base.owner == player.name) {
        base.name = msg.substring(12); num++;
    }
    player.socket.emit(`chat`, { msg: `${num} turret(s) renamed.` });
});

cmds.joinguild = new Command(`/joinguild <guildName> <optionalinvite> - Join a guild`, REGISTERED, (player, msg) => {
    const split = msg.split(` `);
    if (player.guild !== ``) {
        player.socket.emit(`chat`, { msg: `You are already in ${player.guild}! Use /leaveguild to leave it.` });
        return;
    }
    if (split.length != 2 && split.length != 3) {
        player.socket.emit(`chat`, { msg: `You must specify a guild name.` });
        return;
    }
    const guildName = split[1];
    const guildObj = guildList[guildName];
    if (typeof guildObj === `undefined`) {
        player.socket.emit(`chat`, { msg: `${guildName} is not a real guild!` });
        return;
    }
    if (guildObj.public !== `public`) {
        if (split.length != 3) {
            player.socket.emit(`chat`, { msg: `That guild is private- you must be invited by its owner, ${guildObj.owner}! Use /joinguild <guild> <invitenumber>!` });
            return;
        }
        if (split[2] !== guildObj.invite) {
            player.socket.emit(`chat`, { msg: `That invite key is either incorrect, expired, or already used!` });
            return;
        }
        guildList.invite = `AdminInviteKey`;
    }
    player.guild = guildName;
    player.socket.emit(`chat`, { msg: `Joined guild ${guildName}!` });
});

cmds.leaveguild = new Command(`/leaveguild - Leave your current guild`, REGISTERED, (player, msg) => {
    if (player.guild === ``) {
        player.socket.emit(`chat`, { msg: `You are not in a guild!` });
        return;
    }
    player.socket.emit(`chat`, { msg: `Left guild ${player.guild}!` });
    player.guild = ``;
});

cmds.pm = new Command(`/pm <player> <msg>`, REGISTERED, (player, msg) => {
    player.pm(msg);
});

cmds.r = new Command(`/r <msg>`, REGISTERED, (player, msg) => {
    if (msg.split(` `).length == 1) return;
    player.r(msg);
});

cmds.swap = new Command(`/swap`, REGISTERED, (player, msg) => {
    player.swap(msg);
});

cmds.mute = new Command(`/mute <player> - You will no longer hear the player's chat messages.`, EVERYONE, (ply, msg) => {
    const split = msg.split(` `);
    if (split.length != 2) {
        ply.socket.emit(`chat`, { msg: `Bad syntax! The message should look like '/mute playername'` }); return;
    } // split looks like {"/mute", "name"}
    const name = split[1];
    const player = getPlayerFromName(name);
    if (player == -1) {
	    ply.socket.emit(`chat`, { msg: `Player '${name}' not found.` });
	    return;
    }
    ply.socket.emit(`mute`, { player: name });
    ply.socket.emit(`chat`, { msg: `Muted ${name}.` });
});

cmds.unmute = new Command(`/unmute <player> - You will begin hearing the player's chat messages again.`, EVERYONE, (ply, msg) => {
    if (msg.split(` `).length != 2) {
        ply.socket.emit(`chat`, { msg: `Bad syntax! The message should look like '/mute playername'` }); return;
    } // split looks like {"/unmute", "name"}
    const name = msg.split(` `)[1];
    const player = getPlayerFromName(name);
    if (player == -1) {
	    ply.socket.emit(`chat`, { msg: `Player '${name}' not found.` });
	    return;
    }
    ply.socket.emit(`unmute`, { player: name });
    ply.socket.emit(`chat`, { msg: `Unmuted ${name}.` });
});

const valid_email_regex = new RegExp(`^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$`);

cmds.email = new Command(`/email <you@domain.tld> - Sets your email for password resets`, REGISTERED, (player, msg) => {
    const email = msg.substring(7);
    if (!valid_email_regex.test(email)) {
        player.socket.emit(`chat`, { msg: `Invalid Email!` });
        return;
    }

    savePlayerEmail(player, email);
    player.socket.emit(`chat`, { msg: `Registered Email Successfully!` });
});

cmds.createguild = new Command(`/createguild <guildname> - Creates a new guild`, VIPPLUS, (player, msg) => {
    const split = msg.split(` `);
    if (split.length != 2) {
        player.socket.emit(`chat`, { msg: `Bad syntax! The message should look like '/createguild mynewguildname'` });
        return;
    }
    const playersguild = findGuildFromOwner(player.name);
    if (playersguild !== -1) {
        player.socket.emit(`chat`, { msg: `You already own guild +${playersguild}!` });
        return;
    }
    const guildName = split[1];
    if (!guildName.match(/^[0-9a-z]+$/)) {
        player.socket.emit(`chat`, { msg: `Your guild name must only contain numbers and lowercase letters.` });
        return;
    }
    guildList[guildName] = { owner: player.name, public: `private`, invite: `AdminInviteKey` };
    player.socket.emit(`chat`, { msg: `Private guild ${guildName} created! Use /guildprivacy to toggle its privacy.` });
});

cmds.guildprivacy = new Command(`/guildprivacy - Toggle guild's privacy.`, VIPPLUS, (player, msg) => {
    const split = msg.split(` `);
    if (split.length != 1) {
        player.socket.emit(`chat`, { msg: `Bad syntax! The message should look like '/guildprivacy'` });
        return;
    }
    const playersguild = findGuildFromOwner(player.name);
    if (playersguild === -1) {
        player.socket.emit(`chat`, { msg: `You don't own a guild!` });
        return;
    }
    guildList[playersguild].public = guildList[playersguild].public === `public` ? `private` : `public`;
    player.socket.emit(`chat`, { msg: `Guild ${playersguild} is now ${guildList[playersguild].public}. Run this command again to change back.` });
});

cmds.guildinvite = new Command(`/guildinvite - Get guild invite code.`, VIPPLUS, (player, msg) => {
    const split = msg.split(` `);
    if (split.length != 1) {
        player.socket.emit(`chat`, { msg: `Bad syntax! The message should look like '/guildinvite'` });
        return;
    }
    const playersguild = findGuildFromOwner(player.name);
    if (playersguild === -1) {
        player.socket.emit(`chat`, { msg: `You don't own a guild!` });
        return;
    }
    guildList[playersguild].invite = `${Math.floor(Math.random() * 100000)}`;
    player.socket.emit(`chat`, { msg: `You can invite one user with invitation ${guildList[playersguild].invite}. Run this command again to invite another player.` });
});

findGuildFromOwner = function (owner) {
    for (const i in guildList) {
        const guildData = guildList[i];
        if (guildData.owner === owner) return i;
    }
    return -1;
};

// MODERATION COMMANDS
// These commands are accessible to moderators in the game
cmds.broadcast = new Command(`/broadcast <msg> - Send a message to the whole server`, MODPLUS, (player, msg) => {
    console.log(`ADMIN: BROADCAST INITIATED BY ${player}: ${msg}`);
    chatAll(`~\`#f66~\`       BROADCAST: ~\`lime~\`${msg.substring(11)}`);
});

cmds.modmute = new Command(`/modmute <player> <minutesToMute> - Mutes the specified player server-wide.`, MODPLUS, (ply, msg) => {
    // Extracted so that it can be used both by commands in game and the discord bot. In netutils.js.
    const returnmsg = modmute(msg);
});

cmds.ipmute = new Command(`/ipmute <player> <minutesToMute> - Mutes the specified IP server-wide.`, MODPLUS, (ply, msg) => {
    // Extracted so that it can be used both by commands in game and the discord bot. In netutils.js.
    const returnmsg = ipmute(msg);
});

// ADMINSTRATOR COMMANDS
// These commands are accessible to adminstrators in the game
cmds.reboot = new Command(`/reboot - Schedules a restart of the shard with 120 second countdown`, ADMINPLUS, initReboot);

cmds.fastreboot = new Command(`/fastreboot - Schedules a restart of the shard, with 10 second countdown instead of 120`, ADMINPLUS, initFastReboot);

cmds.tp = new Command(`/tp <player> - Teleport to the player.`, ADMINPLUS, (ply, msg) => {
    if (msg.split(` `).length != 2) {
        ply.socket.emit(`chat`, { msg: `Bad syntax! The message should look like '/tp playername'` }); return;
    }
    const name = msg.split(` `)[1];
    const player = getPlayerFromName(name);
    if (player == -1) {
        ply.socket.emit(`chat`, { msg: `Player '${name}' not found.` });
        return;
    }

    const old_sy = ply.sy; const old_sx = ply.sx;

    ply.x = player.x;
    ply.y = player.y;
    ply.sx = player.sx;
    ply.sy = player.sy;
    delete players[old_sy][old_sx][ply.id];
    players[ply.sy][ply.sx][ply.id] = ply;
    ply.onChangeSectors();

    ply.socket.emit(`chat`, { msg: `Player found, attempting to teleport. May fail if they are docked or dead.` });
});

cmds.settag = new Command(`/settag <player> <tag> - Sets a player's tag. tag should not contain brackets.`, ADMINPLUS, (ply, msg) => {
    if (msg.split(` `).length != 3) {
        ply.socket.emit(`chat`, { msg: `Bad syntax! The message should look like '/settag playername tag'` }); return;
    }
    const name = msg.split(` `)[1];
    const player = getPlayerFromName(name);
    if (player == -1) {
        ply.socket.emit(`chat`, { msg: `Player '${name}' not found.` });
        return;
    }

    player.tag = msg.split(` `)[2];
    player.save();
    ply.socket.emit(`chat`, { msg: `~\`violet~\`Tag set.` });
});

cmds.deltag = new Command(`/deltag <player> <tag> - Removes a player's tag.`, ADMINPLUS, (ply, msg) => {
    if (msg.split(` `).length != 2) {
        ply.socket.emit(`chat`, { msg: `Bad syntax! The message should look like '/settag playername'` }); return;
    }
    const name = msg.split(` `)[1];
    const player = getPlayerFromName(name);
    if (player == -1) {
        ply.socket.emit(`chat`, { msg: `Player '${name}' not found.` });
        return;
    }

    player.tag = ``;
    player.save();
    ply.socket.emit(`chat`, { msg: `~\`violet~\`Tag removed.` });
});

cmds.smite = new Command(`/smite <player> - Smites the specified player`, ADMINPLUS, (ply, msg) => {
    if (msg.split(` `).length != 2) return;
    const name = msg.split(` `)[1];

    const player = getPlayerFromName(name);
    if (player == -1) {
	    ply.socket.emit(`chat`, { msg: `Player '${name}' not found.` });
	    return;
    }
    player.die(0);
    chatAll(`~\`violet~\`${player.name}~\`yellow~\` has been Smitten!`);
});

cmds.kick = new Command(`/kick <player> - Kicks the specified player`, ADMINPLUS, (ply, msg) => {
    if (msg.split(` `).length != 2) return;
    const name = msg.split(` `)[1];

    const player = getPlayerFromName(name);
    if (player == -1) {
	    ply.socket.emit(`chat`, { msg: `Player '${name}' not found.` });
	    return;
    }
    player.kick();
    chatAll(`~\`violet~\`${name}~\`yellow~\` has been kicked!`);
});

cmds.saveturrets = new Command(`/saveTurrets - Runs a manual save on the server turrets`, ADMINPLUS, saveTurrets);

if (Config.getValue(`debug`, false)) {
    cmds.eval = new Command(`/eval .... - Evaluates arbitrary JS on the server`, ADMINPLUS, (player, msg) => {
        try {
            // eslint-disable-next-line no-eval
            player.socket.emit(`chat`, { msg: eval(msg.substring(5)) });
        } catch (e) {
            player.socket.emit(`chat`, { msg: `An error occurred: ${e}` });
        }
    });

    cmds.max = new Command(`/max - Maxes out a player's stats for testing purposes`, ADMINPLUS, (player, msg) => {
        player.rank = 20;
        player.money = Number.MAX_SAFE_INTEGER;
        player.experience = Number.MAX_SAFE_INTEGER;

        player.socket.emit(`chat`, { msg: `Max Mode Activated` });
    });
}

// Compute help menu
for (const x in PERM_TABLE) {
    HELP_TABLE[PERM_TABLE[x]] = []; // construct empty array
    for (const c in cmds) {
    	const cmd = cmds[c];
    	for (const p in cmd.permissions) {
            if (cmd.permissions[p] == PERM_TABLE[x] && cmd.visible) {
                HELP_TABLE[PERM_TABLE[x]].push(cmd);
            }
        }
    }
}
