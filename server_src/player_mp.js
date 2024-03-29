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

const Player = require(`./player.js`);
const Package = require(`./universe/package.js`);

class PlayerMP extends Player {
    constructor (socket) {
        super();

        this.elo = 1200;
        socket.player = this;
        this.socket = socket;
        this.guild = ``;

        this.ip = 0;
        this.chatTimer = 100;
        this.muteCap = 750;
        this.globalChat = 0;
        this.lastmsg = ``;

        this.reply = `no one`; // last person to pm / who pmed me
        this.lastLogin = new Date();

        this.permissionLevels = [-1];
        this.kickMsg = ``;
        this.afkTimer = afkTimerConst; // used to check AFK status
    }

    tick () {
        if (this.guild in guildPlayers) guildPlayers[this.guild][this.id] = { sx: this.sx, sy: this.sy, x: this.x, y: this.y };
        super.tick();
    }

    kick (msg) {
        this.kickMsg = msg;
        this.emit(`kick`, { msg: msg });
        this.socket.disconnect();
    }

    swap (msg) { // msg looks like "/swap 2 5". Swaps two weapons.
        if (!this.docked) {
            this.emit(`chat`, { msg: `${chatColor(`red`)}You must be docked to use that command!` });
            return;
        }
        const spl = msg.split(` `);
        if (spl.length != 3) { // not enough arguments
            this.emit(`chat`, { msg: `${chatColor(`red`)}Invalid Syntax!` });
            return;
        }
        let slot1 = parseFloat(spl[1]); let slot2 = parseFloat(spl[2]);
        if (slot1 == 0) slot1 = 10;
        if (slot2 == 0) slot2 = 10;
        if (slot1 > 10 || slot2 > 10 || slot1 < 1 || slot2 < 1 || !slot1 || !slot2 || !Number.isInteger(slot1) || !Number.isInteger(slot2)) {
            this.emit(`chat`, { msg: `${chatColor(`red`)}Invalid Syntax!` });
            return;
        }
        if (this.weapons[slot1 - 1] == -2 || this.weapons[slot2 - 1] == -2) {
            this.emit(`chat`, { msg: `${chatColor(`red`)}You haven't unlocked that slot yet!` });
            return;
        }

        slot1--; slot2--;// done later for NaN checking above: "!slot1"

        let temp = this.weapons[slot1];
        this.weapons[slot1] = this.weapons[slot2];
        this.weapons[slot2] = temp;
        temp = this.ammos[slot1];
        this.ammos[slot1] = this.ammos[slot2];
        this.ammos[slot2] = temp;

        if (this.equipped == slot1) this.equipped = slot2;
        else if (this.equipped == slot2) this.equipped = slot1;

        sendWeapons(this);
        this.emit(`equip`, { scroll: this.equipped });
        this.emit(`chat`, { msg: `${chatColor(`lime`)}Weapons swapped!` });
    }

    r (msg) { // pm reply
        if (this.reply.includes(` `)) this.reply = this.reply.split(` `)[1];
        this.pm(`/pm ${this.reply} ${msg.substring(3)}`);
    }

    pm (msg) { // msg looks like "/pm luunch hey there pal". If a moderator, you use "2swap" not "[O] 2swap".
        if (msg.split(` `).length < 3) { // gotta have pm, name, then message
            this.emit(`chat`, { msg: `Invalid Syntax!` });
            return;
        }

        const name = msg.split(` `)[1];
        const raw = msg.substring(name.length + 5);

        this.emit(`chat`, { msg: `${chatColor(`lime`)}Sending private message to ${name}...` });

        for (const sock in sockets) {
            const player = sockets[sock].player;

            if (player == undefined) {
                continue;
            }

            if (player.name === name) {
                console.log(`[PM] ${this.name} ->`, player.name, `: ${raw}`);
                player.emit(`chat`, { msg: `${chatColor(`violet`)}[PM] [${this.name}]: ${raw}`, gc: player.globalChat });
                this.emit(`chat`, { msg: `${chatColor(`lime`)}Message sent!` });
                this.reply = player.name;
                player.reply = this.name;
                return;
            }
        }

        this.emit(`chat`, { msg: `${chatColor(`red`)}Player not found!` });
    }

    changePass (pass) { // /password
        if (!this.docked) {
            this.emit(`chat`, { msg: `${chatColor(`red`)}This command is only available when docked at a base.` });
            return;
        }
        if (pass.length > 128 || pass.length < 6) {
            this.emit(`chat`, { msg: `${chatColor(`red`)}Password must be 6-128 characters.` });
            return;
        }

        if (pass == this.name) {
            this.emit(`chat`, { msg: `${chatColor(`red`)}Password cannot be the same as your username!` });
            return;
        }

        this.tentativePassword = pass;
        this.emit(`chat`, { msg: `${chatColor(`lime`)}Type "/confirm your_new_password" to complete the change.` });
    }

    async confirmPass (pass) { // /confirm
        if (!this.docked) {
            this.emit(`chat`, { msg: `${chatColor(`red`)}This command is only available when docked at a base.` });
            return;
        }
        if (pass !== this.tentativePassword) {
            this.emit(`chat`, { msg: `${chatColor(`red`)}Passwords do not match! Start over from /password.` });
            this.tentativePassword = undefined;
            return;
        }
        const response = await send_rpc(`/reset/`, `${this.name}%${pass}`);

        if (!response.ok) {
            this.emit(`chat`, { msg: `ERROR` });
            return;
        }

        this.tentativePassword = undefined;
        this.emit(`chat`, { msg: `${chatColor(`lime`)}Password changed successfully.` });
    }

    testAfk () {
        if (this.afkTimer-- < 0) {
            this.emit(`AFK`);
            this.kick(`AFK!`);
            this.testAfk = () => false;
            return true;
        }
        return false;
    }

    emit (a, b) {
        this.socket.emit(a, b);
    }

    async die (b) { // b: bullet object or other object which killed us
        // Prevent multiple deaths in a single event
        // The second case shouldn't be necessary but this bug is hard to reproduce so it is there as a sanity check
        if (this.dead || players[this.sy][this.sx][this.id] === undefined) {
            return;
        }
        this.dead = true;
        delete players[this.sy][this.sx][this.id];

        this.empTimer = -1;
        this.killStreak = 0;
        this.leaveBaseShield = 25;
        this.refillAllAmmo();

        sendAllSector(`sound`, { file: `bigboom`, x: this.x, y: this.y, dx: Math.cos(this.angle) * this.speed, dy: Math.sin(this.angle) * this.speed }, this.sx, this.sy);

        // clear quest
        this.quest = 0;
        this.emit(`quest`, { quest: 0, complete: false });// reset quest and update client

        if (b.type === `Asteroid`) {
            if (b.owner === 0)
                chatAll(`${this.nameWithColor()} crashed into an asteroid!`);
            else {
                b.owner.onKill(this);
                chatAll(`${this.nameWithColor()} crashed into ${b.owner.nameWithColor()}'s asteroid!`);
            }
        } else if (typeof b.owner !== `undefined` && b.owner.type === `Player`) {
            const weapon = eng.weapons[b.wepnID];
            const customMessageArr = (weapon !== undefined ? weapon.killmessages : undefined);

            const useCustomKillMessage = Math.random() < 0.5 && typeof customMessageArr !== `undefined` && customMessageArr.length > 0;

            if (useCustomKillMessage) chatAll(customMessageArr[Math.floor(Math.random() * customMessageArr.length)].replace(`P1`, b.owner.nameWithColor()).replace(`P2`, this.nameWithColor()));
            else chatAll(`${this.nameWithColor()} was destroyed by ${b.owner.nameWithColor()}'s ${chatWeapon(b.wepnID)}!`);
        } else if (b.type === `Vortex`) chatAll(`${this.nameWithColor()} crashed into a black hole!`); // send messages
        else if (b.owner !== undefined && b.owner.type === `Base`) chatAll(`${this.nameWithColor()} was destroyed by base ${b.owner.nameWithColor()}!`);

        if (b.type !== `Vortex`) {
            // drop a package
            const r = Math.random();
            if (this.hasPackage && !this.isBot) packs[this.sy][this.sx][r] = new Package(this, r, 0); // an actual package (courier)
            else if (Math.random() < 0.012 && !this.guest) packs[this.sy][this.sx][r] = new Package(this, r, 2);// life
            else if (Math.random() < 0.1 && !this.guest) packs[this.sy][this.sx][r] = new Package(this, r, 3);// ammo
            else if (!this.guest) packs[this.sy][this.sx][r] = new Package(this, r, 1);// coin
        }

        const diff = playerKillExpFraction * this.experience;
        const moneyEarned = Math.max(0, playerKillMoneyFraction * this.money);
        // give the killer stuff
        if (b.owner != 0 && (typeof b.owner !== `undefined`) && (b.owner.type === `Player` || b.owner.type === `Base`)) {
            b.owner.onKill(this);

            // Award (or punish for teamkills)
            // const diff = playerKillExpFraction * this.experience;
            const other_ip = b.owner.ip;
            if (!this.guest && !(other_ip !== undefined && other_ip == this.ip)) {
                // Only award them if their IP differs and they didn't kill a guest
                if (this.color !== b.owner.color) b.owner.spoils(`experience`, 10 + Math.min(this.experience * 2, diff)); // Self-feeding protection
                else b.owner.spoils(`experience`, -5 * Math.min(diff, b.owner.experience * playerKillExpFraction)); // Punishment equals -5 times what the reward would have been, unless it's large in proportant to the punished person's exp
                b.owner.spoils(`money`, moneyEarned + (b.owner.type === `Player` ? b.owner.killStreak * playerKillMoney : playerKillMoney));
            }

            if (this.color === b.owner.color && b.owner.type === `Player`) b.owner.save(); // prevents people from logging out to get rid of their punishment

            if (this.points > 0) { // raid points
                b.owner.points++;
                this.points--;
            }
        }

        // this.owner.spoils('experience', -diff); //For some reason it doen't work
        this.money -= moneyEarned;
        this.experience -= diff;
        if (this.experience < 0) this.experience = 0; // Ensuring we don't have negative xp people, as rare as that case may be
        this.updateRank(); // Ensuring we don't have overleveled players that remain in the wrong level until they kill something.

        this.hasPackage = false; // Maintained for onKill above

        this.health = this.maxHealth;

        await handlePlayerDeath(this, this.elo);

        this.x = this.y = sectorWidth / 2;
        const whereToRespawn = Math.floor(Math.random() * basesPerTeam) * 2;
        this.sx = baseMap[this.color][whereToRespawn];
        this.sy = baseMap[this.color][whereToRespawn + 1];

        this.lives--;
        this.save();
        if (this.lives <= 0) {
            this.kick(`Goodbye captain: no more lives remaining!`);
            return;
        }

        this.sendStatus();

        // put this player in the dead list
        deads[this.id] = this;

        sendWeapons(this);
    }

    save () {
        if (this.guest) return;
        savePlayerData(this);
    }

    sellOre (oretype) {
    // pay them appropriately
        if (oretype == `iron` || oretype == `all`) {
            this.spoils(`money`, this.iron);
            this.iron = 0;
        } if (oretype == `silver` || oretype == `all`) {
            this.spoils(`money`, this.silver);
            this.silver = 0;
        } if (oretype == `platinum` || oretype == `all`) {
            this.spoils(`money`, this.platinum);
            this.platinum = 0;
        } if (oretype == `copper` || oretype == `all`) {
            this.spoils(`money`, this.copper);
            this.copper = 0;
        }
        this.save();
    }

    dock () {
        if (typeof this.aluminium === `undefined`) this.aluminium = 0;
        if (typeof this.copper === `undefined`) this.copper = 0;
        this.copper += this.aluminium;
        this.aluminium = 0;

        if (this.docked) { // undock if already docked. This toggles the player's dock status
            this.getAllPlanets(); // tell client what's out in the sector
            this.docked = false;
            players[this.sy][this.sx][this.id] = this;
            delete dockers[this.id];
            this.leaveBaseShield = 25;
            this.health = this.maxHealth;
            return;
        }

        let base = 0;
        const b = bases[this.sy][this.sx];
        if ((b.baseType == LIVEBASE || b.baseType == DEADBASE) && b.color == this.color && squaredDist(this, b) < square(512)) base = b; // try to find a base on our team that's in range and isn't just a turret
        if (base == 0) return;

        this.refillAllAmmo();
        this.x = this.y = sectorWidth / 2;
        this.save();
        this.docked = true;

        dockers[this.id] = this;
        delete players[this.sy][this.sx][this.id];

        this.sendStatus();
    }

    spoils (type, amt) { // gives you something. Called wenever you earn money / exp / w/e
        if (typeof amt === `undefined`) return;
        if (type === `experience`) {
            this.experience += amt;
            this.updateRank();
        } else if (type === `money`) {
            this.money += amt * ((amt > 0 && this.trail % 16 == 2) ? 1.05 : 1);
            this.checkMoneyAchievements(true);
        } else if (type === `life` && this.lives < 20) this.lives += amt;
        this.experience = Math.max(this.experience, 0);
        this.emit(`spoils`, { type: type, amt: amt });
    }

    onMined (a) {
    // bitmask of what types of ores this player has mined
        if ((this.oresMined & (1 << a)) == 0) this.oresMined += 1 << a;

        // achievementy stuff
        this.checkMoneyAchievements(true);
    }

    sendStatus () {
        this.emit(`status`, { docked: this.docked, state: this.dead, lives: this.lives });
    }

    checkKillAchievements (note, trailKill, friendKill) {
        this.killAchievements[0] = this.kills >= 1;
        this.killAchievements[1] = this.kills >= 10;
        this.killAchievements[2] = this.kills >= 100;
        this.killAchievements[3] = this.kills >= 1000;
        this.killAchievements[4] |= trailKill;
        this.killAchievements[5] = this.baseKills >= 1;
        this.killAchievements[6] = this.baseKills >= 100;
        this.killAchievements[7] |= friendKill;
        this.killAchievements[8] = this.questsDone == 15;

        let rAll = true;
        for (let i = 0; i < killAchievementsAmount - 1; i++) if (!this.killAchievements[i]) rAll = false;
        this.killAchievements[killAchievementsAmount - 1] = rAll;

        this.emit(`achievementsKill`, { note: note, achs: this.killAchievements });
    }

    checkMoneyAchievements (note) {
        this.moneyAchievements[0] = this.oresMined == 15;
        this.moneyAchievements[1] = this.money >= 100000;
        this.moneyAchievements[2] = this.money >= 1000000;
        this.moneyAchievements[3] = this.money >= 10000000;

        let rAll = true;
        for (let i = 0; i < moneyAchievementsAmount - 1; i++) if (!this.moneyAchievements[i]) rAll = false;
        this.moneyAchievements[moneyAchievementsAmount - 1] = rAll;

        this.emit(`achievementsCash`, { note: note, achs: this.moneyAchievements });
    }

    checkDriftAchievements (note, lucky) {
        this.driftAchievements[0] = this.agility2 >= 2.5; // lvl 12 = 12*.25+1 = 2.5
        this.driftAchievements[1] |= lucky;
        this.driftAchievements[2] = this.elo > 2200;
        this.driftAchievements[3] = this.driftTimer >= 25 * 60 * 60; // 1hr

        let rAll = true;
        for (let i = 0; i < driftAchievementsAmount - 1; i++) if (!this.driftAchievements[i]) rAll = false;
        this.driftAchievements[driftAchievementsAmount - 1] = rAll;

        this.emit(`achievementsDrift`, { note: note, achs: this.driftAchievements });
    }

    checkRandomAchievements (note, boing, thief) {
        this.randomAchievements[0] |= boing;
        this.randomAchievements[1] |= thief;
        this.randomAchievements[2] = !this.planetsClaimed.includes(`0`);
        this.randomAchievements[3] = !this.planetsClaimed.includes(`0`) && !this.planetsClaimed.includes(`1`);

        let rAll = true;
        for (let i = 0; i < randomAchievementsAmount - 1; i++) if (!this.randomAchievements[i]) rAll = false;
        this.randomAchievements[randomAchievementsAmount - 1] = rAll;

        this.emit(`achievementsMisc`, { note: note, achs: this.randomAchievements });
    }

    noteLocal (msg, x, y) {
        this.emit(`note`, { msg: msg, x: x, y: y, local: true });
    }

    strongLocal (msg, x, y) {
        this.emit(`strong`, { msg: msg, x: x, y: y, local: true });
    }

    baseKilled () {
        this.baseKills++;

        // base quest checking
        if (this.quest != 0 && this.quest.type == `Base`) {
            if (this.sx == this.quest.sx && this.sy == this.quest.sy) {
                // reward player
                this.spoils(`money`, this.quest.exp);
                this.spoils(`experience`, Math.floor(this.quest.exp / 4000));

                this.quest = 0; // tell client it's done
                this.emit(`quest`, { quest: this.quest, complete: true });
                if ((this.questsDone & 4) == 0) this.questsDone += 4;
            }
        }

        // they might have gotten an achievement
        this.checkKillAchievements(true, false, false);
    }

    checkQuestStatus (touchingPlanet) {
        if (this.quest == 0) return;// no point if the person hasn't got a quest rn.

        if (this.quest.type === `Mining` && this.sx == this.quest.sx && this.sy == this.quest.sy) {
            // check the player has sufficient metal according to quest
            if (this.quest.metal == `copper` && this.copper < this.quest.amt) return;
            if (this.quest.metal == `iron` && this.iron < this.quest.amt) return;
            if (this.quest.metal == `silver` && this.silver < this.quest.amt) return;
            if (this.quest.metal == `platinum` && this.platinum < this.quest.amt) return;

            // take the amount from them
            if (this.quest.metal == `copper`) this.copper -= this.quest.amt;
            if (this.quest.metal == `iron`) this.iron -= this.quest.amt;
            if (this.quest.metal == `silver`) this.silver -= this.quest.amt;
            if (this.quest.metal == `platinum`) this.platinum -= this.quest.amt;

            // reward them
            this.spoils(`money`, this.quest.exp);
            this.spoils(`experience`, Math.floor(this.quest.exp / 1500));

            this.quest = 0;
            this.emit(`quest`, { quest: this.quest, complete: true }); // tell client quest is over

            if ((this.questsDone & 1) == 0) this.questsDone += 1;
        } else if (this.quest.type === `Delivery` && touchingPlanet) {
            // pickup
            if (this.sx == this.quest.sx && this.sy == this.quest.sy && !this.hasPackage) {
                this.hasPackage = true;
                this.strongLocal(`Package obtained!`, this.x, this.y - 192);
            }

            // dropoff
            if (this.hasPackage && this.sx == this.quest.dsx && this.sy == this.quest.dsy) {
                this.spoils(`money`, this.quest.exp);// reward
                this.spoils(`experience`, Math.floor(this.quest.exp / 1500));

                this.hasPackage = false;
                this.quest = 0;
                this.emit(`quest`, { quest: this.quest, complete: true }); // tell client it's over
                if ((this.questsDone & 2) == 0) this.questsDone += 2;
            }
        }

        this.checkKillAchievements(true, false, false);
    }

    getAllPlanets () {
        let packHere = 0;
        const planet = planets[this.sy][this.sx];
        packHere = { id: planet.id, name: planet.name, x: planet.x, y: planet.y, color: planet.color };
        this.emit(`planets`, { pack: packHere });
    }

    onKill (p) {
        super.onKill(p);

        // achievementy stuff
        const suicide = p.name === this.name;
        this.checkKillAchievements(true, !suicide && p.trail != 0, !suicide && p.color === this.color);
        if (!p.isBot) updateElo(this, p);
        this.checkDriftAchievements(true, p.elo > 2200);
    }
}

module.exports = PlayerMP;
