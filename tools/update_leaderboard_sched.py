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

######################################
# Date: 2026/03/31
# Purpose: Call update_leaderboard regularly
#####################################
import sys
import asyncio
import update_leaderboard

defaultTime = 60
if len(sys.argv) > 1 and sys.argv[1] > 5:
    defaultTime = sys.argv[1]


def __init__(seconds=60):
    while True:
        update_leaderboard.__init__()
        asyncio.run(asyncio.sleep(seconds))


__init__(defaultTime)
