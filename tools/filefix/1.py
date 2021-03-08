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
# Torn "FileFix" 1
# Date: 06/06/2020
# Purpose: Bcrypt all existing hashes
#####################################
from pymongo import MongoClient
import bcrypt

MONGO_CONNECTION_STR = "mongodb://localhost:27017/torn"


def bcrypt_hash(password):
    password = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return str(bcrypt.hashpw(password, salt), encoding="utf-8")


def filefix():
    print("*** RUNNING TORN FILEFIX 1 ***")
    client = MongoClient(MONGO_CONNECTION_STR)
    db = client.torn
    players = db.players

    for player in players.find():
        try:
            print(f"Processing: {player['_id']}")

            # Avoid being run accidentally
            if not isinstance(player["password"], int):
                continue

            old_password = str(player["password"])
            hash = bcrypt_hash(old_password)
            print(hash)
            players.update_one({"_id": player["_id"]}, {"$set": {"password": hash}})
        except:
            pass
    print("*** END ***")


filefix()
