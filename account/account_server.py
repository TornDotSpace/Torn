import utils
import db
import endpoint
import rpc
import asyncio
import websockets
from aiohttp import web
def __init__():
    print("Torn Account Server: Init")
    print("*** Creating WebSocket RPC server ***")
    login_server = websockets.serve(rpc.handle_recv, "localhost", 8765)
    print("*** Creating HTTP endpoint ***")
    api_endpoint = endpoint.TornLoginEndpoint().get_app()
    print("*** Initialization Done ***")

    asyncio.get_event_loop().run_until_complete(login_server)
    asyncio.get_event_loop().run_until_complete(web.run_app(api_endpoint))
    asyncio.get_event_loop().run_forever()
__init__()