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

# Import libraries.
import json as JSON

import pymongo
from pymongo import MongoClient

from math import floor

from pathlib import Path
from os import path

# Environment variables.
MONGO_URI = "mongodb://localhost:27017/torn"
OUTPUT = "../client/leaderboard/players.json"


def __init__():
    updateLB(MONGO_URI, OUTPUT)
    pass


def updateLB(uri, output):
    print("Updating leaderboard...")

    # Connect to the database.
    client = MongoClient(uri)

    # Get all players.
    players = client.torn.players
    playerData = []

    i = 1
    for player in players.find().sort("experience", pymongo.DESCENDING):
        if i > 2000:
            break

        tag = player["tag"]
        if "O" in tag:
            continue

        pMoney = player["money"]

        if pMoney > 10000000:
            money = f"{int(pMoney // 1000000.5)}M"
        else:
            money = f"{int(pMoney // 1000.5)}K"

        newPlayer = {
            "name": player["_id"],
            "team": player["color"],
            "spot": i,
            "xp": floor(player["experience"]),
            "kills": player["kills"],
            "elo": floor(player["elo"]),
            "money": money,
            "rank": player["rank"],
            "tech": int(
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
            / 100,
        }

        playerData.append(newPlayer)
        i += 1

    # Determine the file path.
    filePath = str(Path(Path(__file__).parent, output).resolve())
    print(f"Using '{filePath}' as output...")

    with open(filePath, "w") as lb:
        lb.write(JSON.dumps(playerData))

    print("Updated leaderboard succesfully!")


__init__()
