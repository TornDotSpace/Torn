######################################
# Torn "FileFix" 1
# Date: 06/06/2020
# Purpose: Bcrypt all existing hashes
#####################################
from pymongo import MongoClient
import bcrypt

MONGO_CONNECTION_STR = "mongodb://localhost:27017/torn"

def bcrypt_hash(password):
    password = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return str(bcrypt.hashpw(password, salt), encoding='utf-8')

def filefix():
    print("*** RUNNING TORN FILEFIX 1 ***")
    client = MongoClient(MONGO_CONNECTION_STR)
    db = client.torn
    players = db.players

    for player in players.find():
        print(f"Processing: {player['_id']}")
        old_password = str(player['password'])
        hash = bcrypt_hash(old_password)
        players.update_one({"_id" : player['_id']}, { "$set": { "password" : hash}})
    print("*** END ***")

filefix()