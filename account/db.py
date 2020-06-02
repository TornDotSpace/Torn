from pymongo import MongoClient
import utils
import bcrypt

MONGO_CONNECTION_STR = "mongodb://localhost:27017/torn"
# Connect to DB
client = MongoClient(MONGO_CONNECTION_STR)
db = client.torn
players = db.players

async def authenticate_player(username: str, password: str) -> bool:
    player = await players.find_one({"_id": username})

    # Player doesn't exist
    if (player == None):
        return False

    passwd = player['password']

    if (bcrypt.checkpw(Hash.hontza_hash(password), passwd)):
        # Legacy account - bcrypt the password
        hash = Hash.bcrypt_hash(password)
        players.update_one({"_id" : username}, { "$set": { "password" : hash}})
        return True
    elif bcrypt.checkpw(password, passwd):
        return True
    else:
        return False
