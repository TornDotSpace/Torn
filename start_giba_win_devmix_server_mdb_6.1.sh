#!/usr/bin/env sh
echo Starting mongod from WSL to Windows with journaling NOT disabled on port 27017&
mkdir db
winpty mongod --port 27017 --dbpath ./db --bind_ip localhost&
echo Building client
echo Starting Account Server

# You may want to throw the following command on a separate tab if you have weird errors like me, then launch that on a virtual python ENV environment
winpty python ./account/account_server.py&
echo Calling npm...
#npm install gpu.js --save

npm ci

npm run devmix&

# NONE of the options below seem to do the trick, so I've been forced to edit webpack.dev.js
#npm config set liveReload=false
#npm config set hot=false
#npm webpack serve --port=false --live-reload=false
#( npm run dev:serve --no-live-reload ---no-hot )&
#(npm run webpack serve --config ./deploy/webpack.devnorefresh.js)&

cp client/index.html.template client/index.html

echo "Starting shard-1 on port 7300 - to kill this process after a reboot, you will need to call netstat -ano | find \"7300\" , then you'll have to call taskkill /F /PID <insert_process_pid_here>"
node --use_strict app.js 7300 devmix&
echo "updating leaderboard, will be called periodically -> winpty python ./tools/update_leaderboard_sched.py&"
winpty python ./tools/update_leaderboard_sched.py&
echo Done. Browse to http://localhost:7301 to access the Torn dev server!
echo Press any key to kill all instances
read -r -p "Press any key to continue..." key
pkill -P $$
