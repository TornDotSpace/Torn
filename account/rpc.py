#!/usr/bin/python3
import asyncio
import websockets
from pymongo import MongoClient
    
async def handle_login(websocket, login_packet):
    # Split
    split = login_packet.find('%')
    login_username = login_packet[0:split]
    login_password = login_packet[split+1:]

    print("Got username: " + login_username)
    player = players.find_one({"_id": login_username})

    # Player doesn't exist
    if (player == None):
        await websocket.send(login_username + "%0")
        return
    
    passwd = player['password']

    if (bcrypt.checkpw(hontza_hash(login_password), passwd)):
        # Legacy account
        hash = bcrypt_hash(login_password)
        players.update_one({"_id" : login_username}, { "$set": { "password" : hash}})
        await websocket.send(login_username + "%1")
    elif bcrypt.checkpw(login_password, passwd):
        await websocket.send(login_username + "%1")
    else:
        await websocket.send(login_username + "%0")

async def handle_password_reset(websocket, password_packet):
    split = password_packet.find('%')
    player_username = password_packet[0:split]
    player_password = password_packet[split+1:]

    players.update_one({"_id": player_username}, { "$set": { "password" : bcrypt_hash(player_password)}})
    await websocket.send(player_username + "%1")

async def handle_register(websocket, register_packet):
    split = register_packet.find('%')
    register_username = register_packet[0:split]
    register_password = register_packet[split+1:]

    await websocket.send(register_username + "%" + bcrypt_hash(register_password))

async def handle_recv(websocket, path):
    login_packet = await websocket.recv()

    # Read in request (0 = login, 1 = password change, 2 = register)
    request = login_packet[0:1]

    if (request == '0'):
        await handle_login(websocket, login_packet[1:])
    elif (request == '1'):
        await handle_password_reset(websocket, login_packet[1:])
    else:
        await handle_register(websocket, login_packet[1:])