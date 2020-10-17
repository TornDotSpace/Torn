const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('../config/discordconfig.json');

client.on('ready', () => {
  console.log('Discord bot has started');
  client.user.setActivity('torn.space');
});

global.detectSpam = function(user, msg) {
  client.channels.cache.get('766664211581239326').send(user + ': ' + msg);
};

global.autoMuteNote = function(msg) {
  client.channels.cache.get('766664211581239326').send(msg);
};

client.on('message', async (message) => {
  if (message.author.bot) return;

  const args = message.content.trim().split(/ +/g);

  if (args.length != 3) return;

  if (args[0] == '/mute') {
    // Limited to mods and admins.
    if (!message.member.roles.cache.some((r)=>['Torn Moderator'].includes(r.name))) {
      return message.reply('Sorry, you don\'t have permissions to use this!');
    }

    const minutes = Number(args[2]);
    const name = args[1].toLowerCase();
    muteTable[name] = (Date.now() + (minutes * 60 * 1000));
    client.channels.cache.get('766664211581239326').send(name+' muted for '+minutes+' minutes');
    chatAll('~`violet~`' + name + '~`yellow~` has been muted for ' + minutes + ' minutes!');
  }
});

client.login(config.token);
