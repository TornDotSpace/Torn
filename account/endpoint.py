from aiohttp import web

class TornLoginEndpoint:
    @staticmethod
    async def handle_recv(request):
        return web.Response(text="Hello!")
    
    def __init__(self):
        self.app = web.Application()
        self.app.add_routes([web.get("/api/login/", TornLoginEndpoint.handle_recv)])

    def get_app(self):
        return self.app