from aiohttp import web

import asyncio
import websockets
from pymongo import MongoClient
import db
from utils import Hash, TimedCacheEntry
from datetime import datetime

class PlayerCookie(TimedCacheEntry):
    def __init__(self, expir : datetime, username : str):
        super().__init__(expir)
        self.username = username
    
    def get_username(self) -> str:
        return self.username

class TornLoginEndpoint:
    async def handle_recv(self, request):
        user_data = (await request.content.read()).decode('utf-8')

        username = user_data[:user_data.find('&')]
        password = user_data[user_data.find('&') + 1:]

        valid_auth = await db.authenticate_player(username, password)

        if not valid_auth:
            return web.Response(status=403, text="Forbidden")
        
        # Generate playcookie + store it
        cookie = utils.generate_playcookie()
        self.cache.add(cookie, PlayerCookie(None, username))
    
        return web.Response(text=f"Hello {username}!\nYour password is {password}\nYour play cookie is {cookie}")

    def __init__(self, cache):
        self.cache = cache

class TornRPCEndpoint:
    def __init__(self, cache):
        self.cache = cache
    
    async def handle_login(self, request):
        pass

    async def handle_register(self, request):
        pass

    async def handle_reset(self, request):
        pass
    
    '''
    async def handle_login(self, websocket, playcookie):
        username = self.cache.get(playcookie)

        if (username == None):
            username = "0"
        else:
            self.cache.remove(playcookie)

        await websocket.send(f"{playcookie}%{username}")

    async def handle_password_reset(self, websocket, password_packet):
        split = password_packet.find('%')
        player_username = password_packet[0:split]
        player_password = password_packet[split+1:]

        await db.change_password(player_username, player_password)
        await websocket.send(f"{player_username}%1")

    async def handle_register(self,websocket, register_packet):
        split = register_packet.find('%')
        register_username = register_packet[0:split]
        register_password = register_packet[split+1:]

        await websocket.send(f"{register_username}%{Hash.bcrypt_hash(register_password)}")

    async def handle_recv(self, websocket, path):
        login_packet = await websocket.recv()

        # Read in request (0 = login, 1 = password change, 2 = register)
        request = login_packet[0:1]

        if (request == '0'):
            await self.handle_login(websocket, login_packet[1:])
        elif (request == '1'):
            await self.handle_password_reset(websocket, login_packet[1:])
        else:
            await self.handle_register(websocket, login_packet[1:])
    '''