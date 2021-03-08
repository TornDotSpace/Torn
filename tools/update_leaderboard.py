#!/usr/bin/python3
"""
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
"""

import pymongo
from pymongo import MongoClient
from math import floor
import datetime
from decimal import Decimal

MONGO_CONNECTION_STR = "mongodb://localhost:27017/torn"
PATH = "../client/leaderboard/index.html"


def __init__():
    updateLB(MONGO_CONNECTION_STR, PATH)
    pass


def updateLB(conn_str, path):

    # Connect to DB
    client = MongoClient(conn_str)
    db = client.torn
    players = db.players

    # Teams

    teamdata = {
        "red": {
            "dispcol": "pink",
            "players": 0.001,
            "money": 0,
            "kills": 0,
            "tech": 0,
            "experience": 0,
            "rank": 0,
            "spot": 0,
        },
        "blue": {
            "dispcol": "cyan",
            "players": 0.001,
            "money": 0,
            "kills": 0,
            "tech": 0,
            "experience": 0,
            "rank": 0,
            "spot": 0,
        },
        "green": {
            "dispcol": "lime",
            "players": 0.001,
            "money": 0,
            "kills": 0,
            "tech": 0,
            "experience": 0,
            "rank": 0,
            "spot": 0,
        },
    }  # players

    # Players
    playerFile = "<tr><th>#</th><th>Name</th><th>Exp</th><th>Rank</th><th>Kills</th><th>Money</th><th>Tech</th></tr>"
    # Grab needed data
    i = 0
    for player in players.find().sort("experience", pymongo.DESCENDING):
        name = player["name"]
        if "O" in name:
            continue
        i = i + 1
        if i > 2000:
            break
        kills = player["kills"]
        rank = player["rank"]
        tech = (
            int(
                (
                    (
                        player["thrust2"]
                        + player["radar2"]
                        + player["capacity2"]
                        + player["agility2"]
                        + player["maxHealth2"]
                        + player["energy2"]
                    )
                    / 6
                    - 1
                )
                * 8
                * 100
            )
            / 100
        )
        xp = int(player["experience"])
        money = player["money"]
        color = (
            "pink"
            if (player["color"] == "red")
            else ("lime" if (player["color"] == "green") else "cyan")
        )

        teamdata[player["color"]]["players"] = int(
            teamdata[player["color"]]["players"] + 1
        )
        teamdata[player["color"]]["experience"] += player["experience"]
        teamdata[player["color"]]["money"] += money
        teamdata[player["color"]]["kills"] += kills
        teamdata[player["color"]]["tech"] += tech
        teamdata[player["color"]]["rank"] += rank
        teamdata[player["color"]]["spot"] += i

        moneyStr = (
            f"{int(money //1000000+.5)}M"
            if money > 10000000
            else f"{int(money//1000+.5)}K"
        )
        out = f'<tr style="color:{color}"><td>{i}.</td><td>{name}</td><td>{xp}</td><td>{rank}</td><td>{kills}</td><td>{moneyStr}\
                </td><td>{tech}</td></tr>'

        playerFile = f"{playerFile}{out}"  # append to file

    teamFile = '<tr style="color:#0099ff;"><td>-Average Place-</td><td>-Total Players-</td><td>-Average Experience-\
    </td><td>-Average Rank-</td><td>-Average Kills-</td><td>-Average Money-</td><td>-Average Tech-</td></tr>'
    for key in teamdata:
        teamFile = f'{teamFile}<tr style="color:{teamdata[key]["dispcol"]}"><td>{key}: {int(teamdata[key]["spot"]/teamdata[key]["players"])}\
            </td><td>{teamdata[key]["players"]}</td><td>{int(teamdata[key]["experience"]/teamdata[key]["players"])}\
                </td><td>{(int(teamdata[key]["rank"]/teamdata[key]["players"]))}</td><td>{int(teamdata[key]["kills"]/teamdata[key]["players"])}\
                    </td><td>{int(teamdata[key]["money"]/teamdata[key]["players"])}</td><td>{(int(teamdata[key]["tech"]/teamdata[key]["players"]))}</td></tr>'

    newFile = f'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\
            <meta charset="utf-8"/><html xmlns="http://www.w3.org/1999/xhtml" dir="ltr" lang="en"><head><title>Leaderboard</title>\
                <link rel="stylesheet" href="../page.css" /></head><body><br><br><h1><div style="padding: 20px"><center><font color="#0099ff">\
                Leaderboard</font></center></div></h1><font color="#0099ff"><center><nobr><table>{teamFile}<tr><td>---</td></tr>{playerFile}\
                </table></nobr><br/>Last updated: {datetime.datetime.now()}</center></font></body></html>'
    # Write out
    lb = open(path, "w")
    lb.write(newFile)
    lb.close()

    print("Updated leaderboard successfully!")
    exit(0)


__init__()
