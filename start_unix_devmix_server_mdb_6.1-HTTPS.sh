#!/usr/bin/env sh
echo Starting mongod from WSL to Windows with journaling NOT disabled on port 27017&
mkdir db
mongod --ipv6 true --port 27017 --dbpath ./db --bind_ip localhost,2a0c:5a82:9205:2b01::7fb4&
echo Building client
echo Starting Account Server

# You may want to throw the following command on a separate tab if you have weird errors like me, then launch that on a virtual python ENV environment
python ./account/account_server.py&
echo Calling npm...
#npm install gpu.js --save

npm ci

npm run devmixhttps&

# NONE of the options below seem to do the trick, so I've been forced to edit webpack.dev.js
#npm config set liveReload=false
#npm config set hot=false
#npm webpack serve --port=false --live-reload=false
#( npm run dev:serve --no-live-reload ---no-hot )&
#(npm run webpack serve --config ./deploy/webpack.devnorefresh.js)&

cp client/index.html.template client/index.html

echo Starting shard-1 on port 
node --use_strict app.js 7300 dev&
echo "updating leaderboard, will be called periodically -> python ./tools/update_leaderboard_sched.py&"
python ./tools/update_leaderboard_sched.py&
echo Done. Browse to http://localhost:7301 to access the Torn dev server!
echo Press any key to kill all instances
read -r -p "Press any key to continue..." key
pkill -P $$
