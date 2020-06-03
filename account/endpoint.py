from aiohttp import web

import asyncio
import db
from utils import Hash, TimedCacheEntry, generate_playcookie
from datetime import datetime

class PlayerCookie(TimedCacheEntry):
    def __init__(self, expir : datetime, username : str):
        super().__init__(expir)
        self.username = username
    
    def get_username(self) -> str:
        return self.username

class TornLoginEndpoint:
    async def handle_recv(self, request):
        user_data = str(await request.content.read(), encoding='utf-8')

        username = user_data[:user_data.find('%')]
        password = user_data[user_data.find('%') + 1:]

        valid_auth = db.authenticate_player(username, password)

        if not valid_auth:
            return web.Response(status=403)
        
        # Generate playcookie + store it
        cookie = generate_playcookie()
        self.cache.add(cookie, PlayerCookie(None, username))
    
        return web.Response(text=cookie)

    def __init__(self, cache):
        self.cache = cache

class TornRPCEndpoint:
    def __init__(self, cache):
        self.cache = cache
    
    async def handle_login(self, request):
        playcookie = str(await request.content.read(), encoding='utf-8')
        print(playcookie)
        username = self.cache.get(playcookie)

        if (username == None):
            return web.Response(status=403)

        self.cache.remove(playcookie)
        return web.Response(text=f"{username}")

    async def handle_register(self, request):
        register_packet = str(await request.content.read(), encoding='utf-8')
        split = register_packet.find('%')
        register_username = register_packet[0:split]
        register_password = register_packet[split+1]

        if (db.user_exists(register_username)):
            return web.Response(status=403)
        return web.Response(text=f"{Hash.bcrypt_hash(register_password)}")

    async def handle_reset(self, request):
        password_packet = str(await request.content.read(), encoding='utf-8')
        split = password_packet.find('%')
        player_username = password_packet[0:split]
        player_password = password_packet[split+1:]

        db.change_password(player_username, player_password)
        return web.Response()