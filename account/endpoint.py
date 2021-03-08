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

from aiohttp import web

import asyncio
import db
from utils import (
    Hash,
    TimedCacheEntry,
    generate_playcookie,
    send_webhook,
    COOKIE_BYTE_SIZE,
)
from datetime import datetime, timedelta
import aiosmtplib
from email.message import EmailMessage
import os


class PlayerCookie(TimedCacheEntry):
    def __init__(self, expir: datetime, username: str):
        super().__init__(expir)
        self.username = username

    def get_username(self) -> str:
        return self.username


class TornLoginEndpoint:
    async def generate_safe_cookie(self, username, ttl=5):
        cookie = generate_playcookie()

        while self.cache.get(cookie) != None:
            await asyncio.sleep(1)
            cookie = generate_playcookie()

        expire = datetime.now() + timedelta(minutes=ttl)
        self.cache.add(cookie, PlayerCookie(expire, username))

        return cookie

    async def handle_login(self, request):
        user_data = str(await request.content.read(), encoding="utf-8")

        username = user_data[: user_data.find("%")].lower()
        password = user_data[user_data.find("%") + 1 :]

        return (
            web.Response(text=await self.generate_safe_cookie(username))
            if await db.authenticate_player(username, password)
            else web.Response(status=403)
        )

    async def handle_forgot(self, request):
        user_data = str(await request.content.read(), encoding="utf-8")
        username = user_data[: user_data.find("%")].lower()
        email = user_data[user_data.find("%") + 1 :]

        if not await db.check_email_match(username, email):
            return web.Response(status=403)

        print("Sending forgot response...")
        # Generate a 60 minute token for password resets
        token = await self.generate_safe_cookie(username, ttl=60)

        message = EmailMessage()
        message["From"] = "torndotspace@gmail.com"
        message["To"] = email
        message["Subject"] = "[torn.space] Password reset request"
        message.set_content(
            f"Hello {username}!\nWe have received a request to reset your account's password. Go to https://torn.space/reset.html?cookie={token} to reset your password. Note: This link will only be available for one hour.\nThank you for using the Torn.Space Account Recovery System"
        )

        asyncio.create_task(
            aiosmtplib.send(
                message,
                hostname="smtp.gmail.com",
                port=465,
                username="torndotspace",
                password=os.environ["TORN_EMAIL_PASSWORD"],
                use_tls=True,
            )
        )
        return web.Response(status=200)

    async def handle_reset(self, request):
        user_data = str(await request.content.read(), encoding="utf-8")
        cookie = user_data[:COOKIE_BYTE_SIZE]

        # see if cookie is valid
        username = self.cache.get(cookie)

        if username == None:
            return web.Response(status=403)

        new_password = user_data[COOKIE_BYTE_SIZE:]

        # Send back HTTP 400: Bad request if password is invalid
        if len(new_password) < 6 or len(new_password) > 128:
            return web.Response(status=400)

        # consume cookie
        self.cache.remove(cookie)
        await db.change_password(username.get_username(), new_password)
        return web.Response()

    def __init__(self, cache):
        self.cache = cache


class TornRPCEndpoint:
    def __init__(self, cache):
        self.cache = cache

    async def handle_login(self, request):
        playcookie = str(await request.content.read(), encoding="utf-8")
        username = self.cache.get(playcookie)

        if username == None:
            return web.Response(status=403)

        self.cache.remove(playcookie)
        return web.Response(text=f"{username.get_username()}")

    async def handle_register(self, request):
        register_packet = str(await request.content.read(), encoding="utf-8")
        split = register_packet.find("%")
        register_username = register_packet[0:split]
        register_password = register_packet[split + 1 :]

        if not (await db.create_account(register_username, register_password)):
            return web.Response(status=403)
        return web.Response()

    async def handle_reset(self, request):
        password_packet = str(await request.content.read(), encoding="utf-8")
        split = password_packet.find("%")
        player_username = password_packet[0:split]
        player_password = password_packet[split + 1 :]

        await db.change_password(player_username, player_password)
        return web.Response()

    async def handle_crash(self, request):
        send_webhook(str(await request.content.read(), encoding="utf-8"))
        return web.Response()
