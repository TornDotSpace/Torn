const chatRooms = [translate("Global Chat"), translate("Team Chat"), translate("Guild Chat")];
var messages = [{}, {}, {}];

const colorCircumfix = "~`";

socket.on("chat", function(data) {
  // Optimization: Don't do expensive string manipulation if nobody is in the mute list
  if (clientmutes.size == 0 || !data.msg.includes(":")) {
    _chat(data);
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
      if (mut.localeCompare(chatName, undefined, {sensitivity: "accent"}) == 0) return;
    }
  }

  _chat(data);
});

socket.on("mute", function(data) {
  clientmutes[data.player] = 1;
});
socket.on("unmute", function(data) {
  delete clientmutes[data.player];
});

global.rChat = function() {
  chatcanvas.width = chatcanvas.width;
  chatctx.font = "14px ShareTech";
  chatctx.save();
  chatctx.globalAlpha = .5;
  chatctx.fillStyle = "black";
  chatctx.strokeStyle = "#222222";
  roundRect(chatctx, -34, chatcanvas.height - 168, 562, 224, 32, true, true);
  chatctx.fillStyle = "white";
  roundRect(chatctx, 0, chatcanvas.height - 64 - 154 * (chatScroll / chatLength), 6, 24, 2, true, false);

  chatctx.globalAlpha = 1;
  chatctx.textAlign = "left";

  for (let i = 0; i < 3; i++) {
    chatctx.fillStyle = ((seller != 800 + i) ? "violet" : "yellow");
    chatctx.fillText((i==globalChat?">":" ")+chatRooms[i], 532, chatcanvas.height - 48+16*i);
  }
  chatctx.restore();

  chatctx.save();
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
  chatctx.restore();
}
global.pasteChat = function() {
  ctx.drawImage(chatcanvas, 0, h-chatcanvas.height);
}
global._chat = function(data) {
  if (data.msg.includes("`~")) {
    const find1 = getPosition(data.msg, "`~", 1);
    const find2 = getPosition(data.msg, "`~", 2);

    if (find1 == -1 || find2 == -1) return;

    const num = parseFloat(data.msg.substring(find1 + 2, find2));
    data.msg = data.msg.replace("`~" + num + "`~", wepns[num].name);
  }

  for (let room = 0; room < 3; room++) {
    if (room == data.gc || typeof data.gc === "undefined") {
      for (let i = chatLength; i > 0; i--) {
        messages[room][i] = messages[room][i - 1];
      }
      messages[room][0] = data.msg;
    }
  }

  chatScroll = 0;
  preProcessChat();
  rChat();
};


global.preProcessChat = function() { // This is slow and buggy. We should rewrite it.
  const chatList = messages[globalChat];
  preChatArr = {};
  chati = 0;
  const regex = new RegExp(colorCircumfix + ".*?" + colorCircumfix, "g");
  for (let m = chatLength - 1; m >= 0; m--) {
    let line = "";
    const words = chatList[m].split(" ");
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine.replace(regex, ""));
      const testWidth = metrics.width;
      if (testWidth > 512 && n > 0) {
        preChatArr[chati++] = line;
        line = "                  " + words[n] + " ";
      } else {
        line = testLine;
      }
    }
    preChatArr[chati++] = line;
  }
  chati--;
}
global.clearChat = function() {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < chatLength; j++) {
      messages[i][j] = "";
    }
  }
}

// On startup, clear the chat
clearChat();
preProcessChat();