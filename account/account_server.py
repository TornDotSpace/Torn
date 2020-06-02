#!/usr/bin/python3
import utils
import db
import endpoint
import asyncio
import websockets

from aiohttp import web
def __init__():
    print("Torn Account Server: Init")
    cache = utils.TimedCache()

    print("*** Creating WebSocket RPC server ***")
    login_server = websockets.serve(endpoint.TornRPCEndpoint(cache).handle_recv, "localhost", 8765)
    print("*** Creating HTTP endpoint ***")
    api_endpoint = endpoint.TornLoginEndpoint(cache).get_app()
    print("*** Initialization Done ***")

    asyncio.get_event_loop().run_until_complete(login_server)
    asyncio.get_event_loop().run_until_complete(web.run_app(api_endpoint))
    asyncio.get_event_loop().run_forever()
__init__()