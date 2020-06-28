#!/bin/bash
echo Starting mongod with journaling disabled on port 27017&
mkdir db
mongod --port 27017 --dbpath ./db --nojournal --bind_ip localhost&
echo Building client
npm install && npm run dev&
echo Starting Account Server
./account/account_server.py&
npm install
npm audit fix
npm run dev
echo
echo
echo
echo
echo
echo
echo
echo Starting shard-1 on port 
node --use_strict app.js 7300 dev&
echo Starting web express on port 7301
node web.js 7301&
echo Done. Browse to http://localhost:7301 to access the Torn dev server!
echo Press any key to kill all instances
read -n1 -r -p "Press any key to continue..." key
killall node
killall mongod
killall account_server.py
