#!/usr/bin/env sh
echo Starting mongod from WSL to Windows with journaling NOT disabled on port 27017&
mkdir db
winpty mongod --port 27017 --dbpath ./db --bind_ip localhost&
echo Building client
echo Starting Account Server

#winpty python -m aiohttp.web -H localhost -P 8080 ./account/account_server.py&
# You may want to throw the following command on a separate tab if you have weird errors like me, then launch that on a virtual python ENV environment 
winpty python ./account/account_server.py&
echo Calling npm...
npm ci
npm run dev:serve&
cp client/index.html.template client/index.html

echo Starting shard-1 on port 
node --use_strict app.js 7300 dev&
echo Done. Browse to http://localhost:7301 to access the Torn dev server!
echo Press any key to kill all instances
read -r -p "Press any key to continue..." key
pkill -P $$
