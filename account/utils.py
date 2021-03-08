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

from secrets import token_hex
import bcrypt
from datetime import datetime
from ctypes import c_int32
from discord_webhook import DiscordWebhook

from sys import argv

COOKIE_BYTE_SIZE = 32
REAL_COOKIE_SIZE = COOKIE_BYTE_SIZE // 2


class int32(c_int32):
    def __add__(self, other):
        return int32(self.value + other.value)

    def __sub__(self, other):
        return int32(self.value - other.value)

    def __lshift__(self, other):
        return int32(self.value << other.value)

    def __str__(self):
        return str(self.value)


class Hash:
    """
    Legacy torn hash
    """

    @staticmethod
    def hontza_hash(password: str) -> str:
        hash = int32(0)

        for i in range(0, len(password)):
            ch = password[i : i + 1]
            hash = ((hash << int32(5)) - hash) + int32(ord(ch))

        return str(hash).encode("utf-8")

    """
    Secure Torn hash
    """

    @staticmethod
    def bcrypt_hash(password: str) -> str:
        salt = bcrypt.gensalt()
        return str(bcrypt.hashpw(password, salt), encoding="utf-8")


def generate_playcookie() -> str:
    # Playcookies are 32-byte strings
    return token_hex(REAL_COOKIE_SIZE)


class TimedCacheEntry:
    def __init__(self, expr):
        self.expiration = expr

    def has_expired(self):
        return datetime.now() > self.expiration


class TimedCache:
    def __init__(self):
        self.entries = {}

    def add(self, key: str, entry: TimedCacheEntry):
        if entry.has_expired():
            return
        self.entries[key] = entry

    def get(self, key: str):
        if key not in self.entries:
            return None
        return self.entries[key]

    def remove(self, key: str):
        if key in self.entries:
            del self.entries[key]

    def expire(self):
        # Remove all keys which expired
        for key in list(filter(lambda x: self.entries[x].has_expired(), self.entries)):
            del self.entries[key]


def send_webhook(data):
    if len(argv) <= 1:
        return  # no webhook supplied
    for x in [data[i : i + 1985] for i in range(0, len(data), 1985)]:
        webhook = DiscordWebhook(
            url=argv[1],
            content=f"```bash\n{x}```",
        )
        webhook.execute()
