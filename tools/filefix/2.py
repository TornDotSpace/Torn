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
# Torn "FileFix" 2
# Date: 06/13/2021
# Purpose: Update DB scheme as per
# https://github.com/TornDotSpace/Torn/commit/2be752d8dbe8421ca7fc47e3d2efec8fffae550a
#####################################

MONGO_CONNECTION_STR = "mongodb://localhost:27017/torn"
from pymongo import MongoClient


def filefix():
    print("*** RUNNING TORN FILEFIX 2 ***")
    client = MongoClient(MONGO_CONNECTION_STR)
    db = client.torn
    players = db.players

    for player in players.find():
        print(f"Processing: {player['_id']}")

        # Don't run again
        if "tag" in player:
            continue

        # Find first space in player name.. should locate the tag seperator.
        # then strip the [], ex: [A] johnnyapol becomes A, johnnyapol
        name = player["name"]
        split = name.find(" ")

        if split == -1:
            tag = ""
        else:
            tag = name[:split][1:-1]

        # Remove name field and set the tag
        players.update_one(
            {"_id": player["_id"]}, {"$set": {"tag": tag}, "$unset": {"name": ""}}
        )

        print(f"Set tag {tag} for {name}")


filefix()
