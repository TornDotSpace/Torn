const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('../config/discordconfig.json');

client.on("ready", () => {
  client.channels.cache.get('766664211581239326').send("Bot has started.");
  setActivity();
});

myPlayerCount = 0; // cache the number to not excessively do discord calls

global.setDiscordActivity = function(){
  if(myPlayerCount===playerCount) return;
  client.user.setActivity("torn.space with " + playerCount + " players");
  myPlayerCount=playerCount;
}

global.detectSpam = function(user, msg) {
  client.channels.cache.get('766664211581239326').send(user + ': ' + msg);
};

global.autoMuteNote = function(msg) {
  client.channels.cache.get('766664211581239326').send(msg);
};

client.on("message", async message => {
  if(message.author.bot) return;
  if(!message.content.startsWith('/')) return;
  const args = message.content.trim().split(/ +/g);

  // Limited to mods and admins.
  if(!message.member.roles.cache.some(r=>["Torn Moderator"].includes(r.name)))
    return message.reply("Sorry, you don't have permissions to use this!");

  if(args[0] === "/modmute") {
    returnmsg = modmute(message.content.trim());
    client.channels.cache.get('766664211581239326').send(returnmsg);
  } else if(args[0] === "/ipmute") {
    returnmsg = ipmute(message.content.trim());
    client.channels.cache.get('766664211581239326').send(returnmsg);
  } else if(args[0] === "/mute") {
    client.channels.cache.get('766664211581239326').send("You must either use /modmute or /ipmute!");
  } else if(args[0] === "/broadcast") {
    chatAll('~`#f66~`       BROADCAST: ~`lime~`' + msg.substring(11));
    client.channels.cache.get('766664211581239326').send("Message broadcasted.");
  } else if(args[0] === "/reboot") {
  	if(!message.member.roles.cache.some(r=>["Developer"].includes(r.name)))
      return message.reply("Sorry, you don't have permissions to use this!");
    initReboot();
  } else if(args[0] === "/help") {
    client.channels.cache.get('766664211581239326').send("Command list: modmute, mute, ipmute, help, broadcast, reboot");
  } else {
    client.channels.cache.get('766664211581239326').send("Unknown command.");
  }
});

client.login(config.token);