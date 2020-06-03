from pymongo import MongoClient
from utils import Hash
import bcrypt

MONGO_CONNECTION_STR = "mongodb://localhost:27017/torn"
# Connect to DB
client = MongoClient(MONGO_CONNECTION_STR)
db = client.torn
players = db.players

def authenticate_player(username: str, password: str) -> bool:
    player = players.find_one({"_id": username})

    # Player doesn't exist
    if (player == None):
        return False

    passwd = player['password']

    if (isinstance(passwd, int)):
        passwd = str(passwd)
    

    password = password.encode('utf-8')
    passwd = passwd.encode('utf-8')

    if (bcrypt.checkpw(Hash.hontza_hash(password), passwd)):
        # Legacy account - bcrypt the password
        hash = Hash.bcrypt_hash(password)
        players.update_one({"_id" : username}, { "$set": { "password" : hash}})
        return True
    elif bcrypt.checkpw(password, passwd):
        return True
    else:
        return False

def change_password(username : str, new_password : str) -> bool:
    hash = Hash.bcrypt_hash(new_password)
    players.update_one({"_id" : username}, { "$set": { "password" : hash}})

def user_exists(username : str) -> bool:
    return players.find_one({"_id":username}) != None