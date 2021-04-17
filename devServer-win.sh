#!/bin/bash

# Development build for a Windows machine.
# Note: You will have to manually kill the Node.js process between builds!

echo Building client...
npm i && npm run dev &

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

echo Starting webfront on port 7301...
node web.js 7301 &

echo Done. Go to http://localhost:7301 to access the dev server!

read -n1 -r -p "Press any key to kill all instances..." key
^C
