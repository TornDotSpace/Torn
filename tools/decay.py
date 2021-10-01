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

######################################
# Date: 06/26/2021
# Purpose: Decay all players. To be run weekly.
#####################################

MONGO_CONNECTION_STR = "mongodb://localhost:27017/torn"
from pymongo import MongoClient
from datetime import datetime

print("*** RUNNING WEEKLY DECAY ***")
client = MongoClient(MONGO_CONNECTION_STR)
db = client.torn
players = db.players
import time

ms = time.time() * 1000

decayed = 0
total = 0
for player in players.find():
    total += 1
    print(f"Processing: {player['_id']}")

    # if their timestamp is not in unix milliseconds, convert it
    if type(player["lastLogin"]) == datetime:
        player["lastLogin"] = int(round(player["lastLogin"].timestamp() * 1000))

    # Don't run for paid players
    if player["tag"] == "V" or player["tag"] == "B":
        continue

    # If they played in the last week, don't decay them
    if ms - player["lastLogin"] < 604800000:
        continue

    experience = player["experience"] * 0.99
    money = player["money"] * 0.99

    # Remove name field and set the tag
    players.update_one(
        {"_id": player["_id"]},
        {"$set": {"experience": experience}, "$set": {"money": money}},
    )

    print(f"    Decayed {player['_id']}")
    decayed += 1
print(f"decayed {decayed}/{total}")
