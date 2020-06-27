from secrets import token_urlsafe
import bcrypt
from datetime import datetime
from numpy import int32
from discord_webhook import DiscordWebhook

class Hash:
    '''
    Legacy torn hash
    '''
    @staticmethod
    def hontza_hash(password: str) -> str:
        hash = int32(0)

        for i in range(0, len(password)):
            ch = password[i:i+1]
            hash = ((hash << int32(5)) - hash) + int32(ord(ch))

        return str(hash).encode('utf-8')
    '''
    Secure Torn hash
    '''
    @staticmethod
    def bcrypt_hash(password: str) -> str:
        salt = bcrypt.gensalt()
        return str(bcrypt.hashpw(password, salt), encoding='utf-8')

def generate_playcookie() -> str:
    # Playcookies are 32-byte strings
    return token_urlsafe(32)

class TimedCacheEntry:
    def __init__(self, expr):
        self.expiration = expr

    def has_expired(self):
        return datetime.now() > self.expiration

class TimedCache:
    def __init__(self):
        self.entries = { }
    
    def add(self, key: str, entry : TimedCacheEntry):
        if (entry.has_expired()): return
        self.entries[key] = entry

    def get(self, key : str):
        if key not in self.entries:
            return None
        return self.entries[key]

    def remove(self, key : str):
        if key in self.entries:
            del self.entries[key]
    
    def expire(self):
        # Remove all keys which expired
        for key in list(filter(lambda x : self.entries[x].has_expired(), self.entries)):
            del self.entries[key]

def send_webhook(data):
    for x in [data[i:i+1985] for i in range(0, len(data), 1985)]:
        webhook = DiscordWebhook(url='https://discordapp.com/api/webhooks/699745801924247582/BJKcA2Dpa5I_ghWJ979BQFqMkVRTFdzihcF_nkJv9UyEJb0TsBVMn4UiXD36UZK-Ch8U', content=f'```bash\n{x}```')
        response = webhook.execute()
