#!/bin/bash

# Development build for a Windows machine.
# Note: You will have to manually kill the Node.js process between builds!

echo Building client...
npm ci && npm run dev:serve &

echo Starting Account Server...
py ./account/account_server.py &

echo
echo
echo
echo
echo
echo
echo

echo Starting gameserver on port 7300...
node app.js 7300 dev &

echo Done. Go to http://localhost:7301 to access the dev server!

copy client/index.html.template client/index.html


echo Press any key to kill all instances...
read -n1 -r -p "Press any key to continue..." key

taskkill /F /IM node.exe
taskkill /F /IM python.exe
