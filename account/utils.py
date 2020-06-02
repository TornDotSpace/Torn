from secrets import token_urlsafe
import bcrypt
import datetime

class Hash:
    '''
    Legacy torn hash
    '''
    @staticmethod
    def hontza_hash(password: str) -> str:
        hash = 0 

        for i in range(0, len(password)):
            ch = password[i:i+1]
            hash = ((hash << 5) - hash) + ord(ch)
        return str(hash)
    '''
    Secure Torn hash
    '''
    @staticmethod
    def bcrypt_hash(password):
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password, salt)

def generate_playcookie() -> str:
    # Playcookies are 32-byte strings
    return token_urlsafe(32)

class TimedCacheEntry:
    def __init__(self, expr):
        self.expiration = expr

    def has_expired(self):
        return datetime.now() <= self.expiration

class TimedCache:
    def __init__(self):
        self.entries = { }
    
    def add(self, key: str, entry : TimedCacheEntry):
        if (entry.has_expired): return
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