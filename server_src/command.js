class Command {
  constructor(usage, permissions, invoke, visible=true) {
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
const MODPLUS = [MODERATOR, ADMIN, OWNER];
const ADMINPLUS = [ADMIN, OWNER];

const PERM_TABLE = [GUEST, PLAYER, YOUTUBER, VIP, MVP, MODERATOR, ADMIN, OWNER];
const HELP_TABLE = {};

global.cmds = {};

// GUEST COMMANDS
// All players including guests have access to these
cmds['/help'] = new Command('/help - Displays commands & usages', EVERYONE, function(plyr, msg) {
  for (const p in plyr.permissionLevels) {
    const lvl = plyr.permissionLevels[p];
	    for (let x = 0; x < HELP_TABLE[lvl].length; ++x) {
	        const cmd = HELP_TABLE[lvl][x];
	        plyr.socket.emit('chat', {msg: cmd.usage});
	    }
  }
});

cmds['/me'] = new Command('/me <msg>', EVERYONE, function(player, msg) {
  playerChat('~~`' + player.color + '~`' + player.name + '~`yellow~` ' + msg.substring(4), player.globalChat, player.color, player.guild);
});

cmds['/myguild'] = new Command('/myguild - Tells you what guild you\'re in', EVERYONE, function(player, msg) {
  if (player.guild === '') player.socket.emit('chat', {msg: '~`orange~`You aren\'t in a guild!'});
  else player.socket.emit('chat', {msg: '~`orange~`Your guild is: ' + player.guild});
});

cmds['/guildlist'] = new Command('/guildlist - Tells you a list of all guilds', EVERYONE, function(player, msg) {
  for (const g in guildList) {
    player.socket.emit('chat', {msg: '~`orange~`' + g});
  }
});

cmds['/playerstats'] = new Command('/playerstats - See how many players are online', EVERYONE, function(player, msg) {
  player.socket.emit('chat', {msg: '~`orange~`' + guestCount + ' guests, ' + playerCount + ' players, ' + botCount + ' bots.'});
});

// PLAYER COMMANDS
// These commands are restricted to players that have registered their accounts
// This restriction is done for either technical reasons or anti-spam protection
cmds['/password'] = new Command('/password <newPassword>', REGISTERED, function(player, msg) {
  player.changePass(msg.substring(10));
});

cmds['/confirm'] = new Command('/confirm <newPassword>', REGISTERED, async function(player, msg) {
  await player.confirmPass(msg.substring(9));
}, false);

cmds['/changeteam'] = new Command('/changeteam', REGISTERED, function(player, msg) {
  if (!player.docked) {
    player.socket.emit('chat', {msg: '~`red~`This command is only available when docked at a base.'}); return;
  }
  const split = msg.split(' ');
  if (split.length > 2) {
    player.socket.emit('chat', {msg: 'Bad syntax! The message should look like \'/changeteam\''}); return;
  }
  if (split.length == 1) {
    player.socket.emit('chat', {msg: 'Are you sure? This costs 10% of your experience and money. You must have 10,000 exp. Type "/changeteam <color>" to continue. Make sure you aren\'t near any players or bases on your current team.'});
  }
  if (split.length == 2) {
    if (player.experience <= 10000) {
      player.socket.emit('chat', {msg: 'You don\'t have enough experience!'});
      return;
    }
    if (split[1] !== 'green' && split[1] !== 'blue' && split[1] !== 'red') {
      player.socket.emit('chat', {msg: 'Invalid team to switch to!'});
      return;
    }
    if (split[1] === player.color) {
      player.socket.emit('chat', {msg: 'That\'s your current team!'});
      return;
    }
    teamDict={"red":0, "blue":1, "green":2};
    old_sx=player.sx;
    player.sx = (player.sx + 3*(teamDict[split[1]]-teamDict[player.color])) % mapSz;
    player.color = split[1];
    player.money *= .9;
    player.experience *= .9;
    delete players[player.sy][old_sx][player.id];
    players[player.sy][player.sx][player.id] = player;
    player.save();
  }
});

cmds['/nameturret'] = new Command('/nameturret <name>', REGISTERED, function(player, msg) {
  let num = 0;
  const base = bases[player.sy][player.sx];
  if (base != 0 && base.owner == player.name) {
    base.name = msg.substring(12); num++;
  }
  player.socket.emit('chat', {msg: num + ' turret(s) renamed.'});
});

cmds['/joinguild'] = new Command('/joinguild <guildName>', REGISTERED, function(player, msg) {
  if (msg.length < 12) {
    player.socket.emit('chat', {msg: 'You must specify a guild name.'});
    return;
  }
  const guildName = msg.substring(11);
  if (typeof guildList[guildName] === 'undefined') {
    player.socket.emit('chat', {msg: guildName + ' is not a real guild!'});
    return;
  }
  if (guildList[guildName].public !== 'public') {
    player.socket.emit('chat', {msg: 'That guild is private- you must be invited!'});
    return;
  }
  player.guild = guildName;
  player.socket.emit('chat', {msg: 'Joined guild ' + guildName + '!'});
});

cmds['/leaveguild'] = new Command('/leaveguild - Leave your current guild', REGISTERED, function(player, msg) {
  player.socket.emit('chat', {msg: 'Left guild ' + player.guild + '!'});
  player.guild = '';
});

cmds['/pm'] = new Command('/pm <player> <msg>', REGISTERED, function(player, msg) {
  player.pm(msg);
});

cmds['/r'] = new Command('/r <msg>', REGISTERED, function(player, msg) {
  player.r(msg);
});

cmds['/swap'] = new Command('/swap', REGISTERED, function(player, msg) {
  player.swap(msg);
});

cmds['/mute'] = new Command('/mute <player> - You will no longer hear the player\'s chat messages.', EVERYONE, function(ply, msg) {
  if (msg.split(' ').length != 2) {
    ply.socket.emit('chat', {msg: 'Bad syntax! The message should look like \'/mute playernamewithouttag\''}); return;
  } // split looks like {"/mute", "name"}
  const name = msg.split(' ')[1];
  const player = getPlayerFromName(name);
  if (player == -1) {
	    ply.socket.emit('chat', {msg: 'Player \''+name+'\' not found.'});
	    return;
  }
  ply.socket.emit('mute', {player: name});
  ply.socket.emit('chat', {msg: 'Muted '+name+'.'});
});

cmds['/unmute'] = new Command('/unmute <player> - You will begin hearing the player\'s chat messages again.', EVERYONE, function(ply, msg) {
  if (msg.split(' ').length != 2) {
    ply.socket.emit('chat', {msg: 'Bad syntax! The message should look like \'/mute playernamewithouttag\''}); return;
  } // split looks like {"/unmute", "name"}
  const name = msg.split(' ')[1];
  const player = getPlayerFromName(name);
  if (player == -1) {
	    ply.socket.emit('chat', {msg: 'Player \''+name+'\' not found.'});
	    return;
  }
  ply.socket.emit('unmute', {player: name});
  ply.socket.emit('chat', {msg: 'Unmuted '+name+'.'});
});

const valid_email_regex = new RegExp('^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$');
cmds['/email'] = new Command('/email <you@domain.tld> - Sets your email for password resets', REGISTERED, function(player, msg) {
  const email = msg.substring(7);
  if (!valid_email_regex.test(email)) {
    player.socket.emit('chat', {msg: 'Invalid Email!'});
    return;
  }

  savePlayerEmail(player, email);
  player.socket.emit('chat', {msg: 'Registered Email Successfully!'});
});

cmds['/green'] = new Command('/green Join green team', ADMINPLUS, function(player, msg) {
  player.color = 'green';
});

// MODERATION COMMANDS
// These commands are accessible to moderators in the game
cmds['/broadcast'] = new Command('/broadcast <msg> - Send a message to the whole server', MODPLUS, function(player, msg) {
  chatAll('~`#f66~`       BROADCAST: ~`lime~`' + msg.substring(11));
});

cmds['/modmute'] = new Command('/modmute <player> <minutesToMute> - Mutes the specified player server-wide.', MODPLUS, function(ply, msg) {
  //Extracted so that it can be used both by commands in game and the discord bot. In netutils.js.
  const returnmsg = modmute(ply,msg);
  ply.socket.emit('chat',{msg:returnmsg});
});

cmds['/ipmute'] = new Command('/ipmute <player> <minutesToMute> - Mutes the specified IP server-wide.', MODPLUS, function(ply, msg) {
  //Extracted so that it can be used both by commands in game and the discord bot. In netutils.js.
  const returnmsg = ipmute(ply,msg);
  ply.socket.emit('chat',{msg:returnmsg});
});


// ADMINSTRATOR COMMANDS
// These commands are accessible to adminstrators in the game
cmds['/reboot'] = new Command('/reboot - Schedules a restart of the shard', ADMINPLUS, initReboot);

cmds['/tp'] = new Command('/tp <player> - Teleport to the player.', ADMINPLUS, function(ply, msg) {
  if (msg.split(' ').length != 2) {
    ply.socket.emit('chat', {msg: 'Bad syntax! The message should look like \'/tp playernamewithouttag\''}); return;
  }
  const name = msg.split(' ')[1];
  const player = getPlayerFromName(name);
  if (player == -1) {
    ply.socket.emit('chat', {msg: 'Player \''+name+'\' not found.'});
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

  ply.socket.emit('chat', {msg: 'Player found, attempting to teleport. May fail if they are docked or dead.'});
});

cmds['/settag'] = new Command('/settag <player> <tag> - Sets a player\'s tag. tag should not contain brackets.', ADMINPLUS, function(ply, msg) {
  if (msg.split(' ').length != 3) {
    ply.socket.emit('chat', {msg: 'Bad syntax! The message should look like \'/settag playernamewithouttag tag\''}); return;
  }
  const name = msg.split(' ')[1];
  const newTag = msg.split(' ')[2];
  const player = getPlayerFromName(name);
  if (player == -1) {
    ply.socket.emit('chat', {msg: 'Player \''+name+'\' not found.'});
    return;
  }

  player.name = '['+newTag+'] '+name;
  player.save();
  ply.socket.emit('chat', {msg: '~`violet~`Tag set.'});
});

cmds['/deltag'] = new Command('/deltag <player> <tag> - Removes a player\'s tag.', ADMINPLUS, function(ply, msg) {
  if (msg.split(' ').length != 2) {
    ply.socket.emit('chat', {msg: 'Bad syntax! The message should look like \'/settag playernamewithouttag\''}); return;
  }
  const name = msg.split(' ')[1];
  const player = getPlayerFromName(name);
  if (player == -1) {
    ply.socket.emit('chat', {msg: 'Player \''+name+'\' not found.'});
    return;
  }

  player.name = name;
  player.save();
  ply.socket.emit('chat', {msg: '~`violet~`Tag removed.'});
});

cmds['/smite'] = new Command('/smite <player> - Smites the specified player', ADMINPLUS, function(ply, msg) {
  if (msg.split(' ').length != 2) return;
  const name = msg.split(' ')[1];

  const player = getPlayerFromName(name);
  if (player == -1) {
	    ply.socket.emit('chat', {msg: 'Player \''+name+'\' not found.'});
	    return;
  }
  player.die(0);
  chatAll('~`violet~`' + player.name + '~`yellow~` has been Smitten!');
});

cmds['/kick'] = new Command('/kick <player> - Kicks the specified player', ADMINPLUS, function(ply, msg) {
  if (msg.split(' ').length != 2) return;
  const name = msg.split(' ')[1];

  const player = getPlayerFromName(name);
  if (player == -1) {
	    ply.socket.emit('chat', {msg: 'Player \''+name+'\' not found.'});
	    return;
  }
  player.kick();
  chatAll('~`violet~`' + name + '~`yellow~` has been kicked!');
});

cmds['/saveturrets'] = new Command('/saveTurrets - Runs a manual save on the server turrets', ADMINPLUS, saveTurrets);

if (Config.getValue('debug', false)) {
  cmds['/eval'] = new Command('/eval .... - Evaluates arbitrary JS on the server', ADMINPLUS, function(player, msg) {
    try {
      player.socket.emit('chat', {msg: eval(msg.substring(5))});
    } catch (e) {
      player.socket.emit('chat', {msg: 'An error occurred: ' + e});
    }
  });

  cmds['/max'] = new Command('/max - Maxes out a player\'s stats for testing purposes', ADMINPLUS, function(player, msg) {
    player.rank = 20;
    player.money = Number.MAX_SAFE_INTEGER;
    player.experience = Number.MAX_SAFE_INTEGER;

    player.socket.emit('chat', {msg: 'Max Mode Activated'});
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
