#!/bin/bash
echo Building client 
npm install && npm run dev
echo Starting shard-1 on port 7300
node app.js 7300&
echo Starting web express on port 7301
node web.js 7301&
echo Done. Browse to http://localhost:7301 to acces the Torn dev server!
echo Press any key to kill all instances
read -n1 -r -p "Press any key to continue..." key
killall node

