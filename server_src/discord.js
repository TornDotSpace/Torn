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

const Discord = require(`discord.js`);
const client = new Discord.Client();
const config = require(`../config/discordconfig.json`);

client.on(`ready`, () => {
    client.channels.cache.get(`766664211581239326`).send(`Bot has started.`);
    setDiscordActivity();
});

myPlayerCount = 0; // cache the number to not excessively do discord calls

global.setDiscordActivity = function () {
    if (myPlayerCount === playerCount) return;
    client.user.setActivity(`torn.space with ${playerCount} players`);
    myPlayerCount = playerCount;
};

global.detectSpam = function (user, msg) {
    client.channels.cache.get(`766664211581239326`).send(`${user}: ${msg}`);
};

global.autoMuteNote = function (msg) {
    client.channels.cache.get(`766664211581239326`).send(msg);
};

client.on(`message`, async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(`/`)) return;
    const args = message.content.trim().split(/ +/g);

    // Limited to mods and admins.
    if (!message.member.roles.cache.some((r) => [`Torn Moderator`].includes(r.name))) { return message.reply(`Sorry, you don't have permissions to use this!`); }

    if (args[0] === `/modmute`) {
        returnmsg = modmute(message.content.trim());
        client.channels.cache.get(`766664211581239326`).send(`${returnmsg} Please say your reason for muting in chat now.`);
    } else if (args[0] === `/ipmute`) {
        returnmsg = ipmute(message.content.trim());
        client.channels.cache.get(`766664211581239326`).send(`${returnmsg} Please say your reason for muting in chat now. REMINDER: ONLY USE IP-MUTE WHEN SOMEONE EVADES NORMAL MUTE. IP MUTE SHOULD NOT BE YOUR FIRST RESPONSE.`);
    } else if (args[0] === `/mute`) {
        client.channels.cache.get(`766664211581239326`).send(`You must either use /modmute or /ipmute!`);
    } else if (args[0] === `/broadcast`) {
        if (args.length == 0) return;
        chatAll(`${chatColor(`red`)}       BROADCAST: ${chatColor(`lime`)}${message.content.trim().substring(11)}`);
        client.channels.cache.get(`766664211581239326`).send(`Message broadcasted.`);
    } else if (args[0] === `/reboot`) {
        if (!message.member.roles.cache.some((r) => [`Developer`].includes(r.name))) { return message.reply(`Sorry, you don't have permissions to use this!`); }
        initReboot();
    } else if (args[0] === `/help`) {
        client.channels.cache.get(`766664211581239326`).send(`Command list: modmute, mute, ipmute, help, broadcast, reboot`);
    } else {
        client.channels.cache.get(`766664211581239326`).send(`Unknown command.`);
    }
});

client.on(`error`, (error) => console.err(error));

try {
    client.login(config.token);
} catch (err) {
    console.error(err);
}
