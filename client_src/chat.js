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
const chatRooms = [translate("Global Chat"), translate("Team Chat"), translate("Guild Chat")];
const messages = [{}, {}, {}];
const serverMessages = {};

// Chat circumfix codes. Code assumes they are length 2.
const colorCircumfix = "~`";
const weaponCircumfix = "`~";
const translateCircumfix = "`t";

const chatcanvas = document.createElement("canvas");
chatcanvas.width = 650;
chatcanvas.height = 350;
const chatctx = chatcanvas.getContext("2d", { alpha: true });

const chatLength = 40;
const serverChatLength = 5;
let chatScroll = 0;
global.whichChatMenu = 0;
let preChatArr = {};
let chati = 0;

socket.on("chat", (data) => {
    // Optimization: Don't do expensive string manipulation if nobody is in the mute list
    if (clientmutes.size == 0 || !data.msg.includes(":")) {
        onReceiveChat(data);
        return;
    }

    const header = data.msg.split(":")[0];
    let chatName = header.split("`")[2]; // normal chat
    if (header.includes("\[PM\] ")) chatName = header.split("\[PM\]")[1]; // pms
    chatName = chatName.replace(/[^0-9a-zA-Z]/g, "");

    if (chatName !== undefined) {
        chatName = chatName.trim();
        // If they're muted, don't chat!
        for (const mut in clientmutes) {
            if (mut.localeCompare(chatName, undefined, { sensitivity: "accent" }) == 0) return;
        }
    }

    onReceiveChat(data);
});

socket.on("mute", (data) => {
    clientmutes[data.player] = 1;
});
socket.on("unmute", (data) => {
    delete clientmutes[data.player];
});

global.rChat = function () {
    chatcanvas.width = chatcanvas.width;
    chatctx.font = "14px ShareTech";
    chatctx.save();
    chatctx.globalAlpha = 0.5;
    chatctx.fillStyle = "black";
    chatctx.strokeStyle = "#222222";
    roundRect(chatctx, -34, chatcanvas.height - 168, 562, 224, 32, true, true);
    chatctx.fillStyle = "white";
    roundRect(chatctx, 0, chatcanvas.height - 64 - 154 * (chatScroll / chatLength), 6, 24, 2, true, false);

    chatctx.globalAlpha = 1;
    chatctx.textAlign = "left";

    for (let i = 0; i < 3; i++) {
        chatctx.fillStyle = ((seller != 800 + i) ? "violet" : "yellow");
        chatctx.fillText((i == whichChatMenu ? ">" : " ") + chatRooms[i], 532, chatcanvas.height - 48 + 16 * i);
    }
    chatctx.restore();

    chatctx.save();

    // Draw all the messages in the current chatroom
    for (let ri = chati - chatScroll; ri >= Math.max(0, chati - chatScroll - 7); ri--) {
        chatctx.fillStyle = "yellow";
        const fromTop = (ri + chatScroll - Object.keys(preChatArr).length);
        chatctx.globalAlpha = square((fromTop + 20) / 20);
        let curx = 0;
        const splitStr = preChatArr[ri].split(colorCircumfix);
        for (let j = 0; j < splitStr.length; j++) {
            if (j % 2 == 0) {
                chatctx.fillText(splitStr[j], 16 + curx, chatcanvas.height - 24 + 16 * fromTop);
                curx += chatctx.measureText(splitStr[j]).width;
            } else {
                chatctx.fillStyle = brighten(splitStr[j]);
            }
        }
    }

    // Repeat for the server messages
    for (let i = 0; i < serverChatLength; i++) {
        chatctx.globalAlpha = 1 - i / serverChatLength;
        chatctx.fillStyle = "yellow";
        let curx = 0;
        const splitStr = serverMessages[i].split(colorCircumfix);
        for (let j = 0; j < splitStr.length; j++) {
            if (j % 2 == 0) {
                chatctx.fillText(splitStr[j], 12 + curx, chatcanvas.height - 184 - 16 * i);
                curx += chatctx.measureText(splitStr[j]).width;
            } else {
                chatctx.fillStyle = brighten(splitStr[j]);
            }
        }
    }

    chatctx.restore();
};
global.pasteChat = function () {
    ctx.drawImage(chatcanvas, 0, h - chatcanvas.height);
};
function onReceiveChat (data) {
    while (data.msg.includes(weaponCircumfix)) {
        const find1 = getPosition(data.msg, translateCircumfix, 1);
        const find2 = getPosition(data.msg, translateCircumfix, 2);

        if (find1 == -1 || find2 == -1) return;

        const num = parseFloat(data.msg.substring(find1 + 2, find2));
        data.msg = data.msg.replace(weaponCircumfix + num + weaponCircumfix, wepns[num].name);
    }

    while (data.msg.includes(translateCircumfix)) {
        const find1 = getPosition(data.msg, translateCircumfix, 1);
        const find2 = getPosition(data.msg, translateCircumfix, 2);

        if (find1 == -1 || find2 == -1) return;

        const str = data.msg.substring(find1 + 2, find2);
        data.msg = data.msg.replace(translateCircumfix + str + translateCircumfix, translate(str));
    }

    if (typeof data.gc === "undefined") {
        for (let i = chatLength; i > 0; i--) {
            serverMessages[i] = serverMessages[i - 1];
        }
        serverMessages[0] = data.msg;
    } else {
        for (let i = serverChatLength; i > 0; i--) {
            messages[data.gc][i] = messages[data.gc][i - 1];
        }
        messages[data.gc][0] = data.msg;
    }

    chatScroll = 0;
    preProcessChat();
    rChat();
}

global.preProcessChat = function () { // This is slow and buggy. We should rewrite it.
    const chatList = messages[whichChatMenu];
    preChatArr = {};
    chati = 0;
    const regex = new RegExp(`${colorCircumfix}.*?${colorCircumfix}`, "g");
    for (let m = chatLength - 1; m >= 0; m--) {
        let line = "";
        const words = chatList[m].split(" ");
        for (let n = 0; n < words.length; n++) {
            const testLine = `${line + words[n]} `;
            const metrics = ctx.measureText(testLine.replace(regex, ""));
            const testWidth = metrics.width;
            if (testWidth > 512 && n > 0) {
                preChatArr[chati++] = line;
                line = `                  ${words[n]} `;
            } else {
                line = testLine;
            }
        }
        preChatArr[chati++] = line;
    }
    chati--;
};
function clearChat () {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < chatLength; j++) {
            messages[i][j] = "";
        }
    }
    for (let j = 0; j < serverChatLength; j++) {
        serverMessages[j] = "";
        serverMessagesFade = 1;
    }
}

// On startup, clear the chat
clearChat();
preProcessChat();

global.chatMenuButtonClick = function (buttonID) {
    socket.emit("toggleGlobal", { gc: buttonID - 800 });
    preProcessChat();
    rChat();
};
