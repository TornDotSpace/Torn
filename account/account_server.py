#!/usr/bin/python3
import utils
import db
import endpoint
import asyncio
import websockets

from aiohttp import web

async def do_expire_task(cache):
    while True:
        # Run every 5 minutes
        await asyncio.sleep(60 * 5)
        cache.expire()

def __init__():
    print("Torn Account Server: Init")
    cache = utils.TimedCache()

    print("*** Creating Internal RPC endpoint ***")
    login_server = endpoint.TornRPCEndpoint(cache)
    print("*** Creating External API endpoint ***")
    api_endpoint = endpoint.TornLoginEndpoint(cache)

    app = web.Application()
    app.add_routes([web.post("/api/login/", api_endpoint.handle_recv),
                    web.post("/rpc/login/", login_server.handle_login),
                    web.post("/rpc/register/", login_server.handle_register),
                    web.post("/rpc/reset/", login_server.handle_reset)
    ])
    print("*** Initialization Done ***")
    asyncio.get_event_loop().create_task(do_expire_task(cache))
    asyncio.get_event_loop().run_until_complete(web.run_app(app))
    asyncio.get_event_loop().run_forever()
__init__()