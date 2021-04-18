#!/bin/bash

# Development build for a Unix machine (with Docker).

echo Building client...
npm i && npm run dev &

echo Starting Account Server...
python /opt/Torn/account/account_server.py &

echo
echo
echo
echo
echo
echo
echo

echo Starting gameserver on port 7300...
node /opt/Torn/app.js 7300 dev &

echo Starting webfront on port 7301...
node /opt/Torn/web.js 7301 &

echo Done. Go to http://localhost:7301 to access the dev server!

echo Press any key to kill all instances...
read -n1 -r -p "Press any key to continue..." key

# Kill all processes.
pkill -f node
pkill -f python
