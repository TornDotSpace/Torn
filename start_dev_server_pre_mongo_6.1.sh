#!/usr/bin/env sh
echo Starting mongod with journaling disabled on port 27017&
mkdir db
mongod --port 27017 --dbpath ./db --nojournal --bind_ip localhost&
echo Building client
echo Starting Account Server
python3 ./account/account_server.py&
npm ci
npm run dev:serve&
cp client/index.html.template client/index.html

echo Starting shard-1 on port 
node --use_strict app.js 7300 dev&
echo Done. Browse to http://localhost:7301 to access the Torn dev server!
echo Press any key to kill all instances
read -r -p "Press any key to continue..." key
pkill -P $$
