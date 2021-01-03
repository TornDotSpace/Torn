#!/usr/bin/python3
import utils
import db
import endpoint
import asyncio
import aiohttp_cors

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
    rpc_server = endpoint.TornRPCEndpoint(cache)
    print("*** Creating External API endpoint ***")
    api_endpoint = endpoint.TornLoginEndpoint(cache)

    app = web.Application()
    app.add_routes(
        [
            web.post("/api/login/", api_endpoint.handle_login),
            web.post("/api/forgot/", api_endpoint.handle_forgot),
            web.post("/api/reset/", api_endpoint.handle_reset),
            web.post("/rpc/login/", rpc_server.handle_login),
            web.post("/rpc/register/", rpc_server.handle_register),
            web.post("/rpc/reset/", rpc_server.handle_reset),
            web.post("/rpc/crash/", rpc_server.handle_crash),
        ]
    )

    # Configure default CORS settings.
    cors = aiohttp_cors.setup(
        app,
        defaults={
            "*": aiohttp_cors.ResourceOptions(
                allow_credentials=True,
                expose_headers="*",
                allow_headers="*",
            )
        },
    )

    for route in list(app.router.routes()):
        cors.add(route)
    print("*** Initialization Done ***")
    asyncio.get_event_loop().create_task(do_expire_task(cache))
    asyncio.get_event_loop().run_until_complete(web.run_app(app))
    asyncio.get_event_loop().run_forever()


__init__()
