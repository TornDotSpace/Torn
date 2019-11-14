# Torn.Space, a somewhat popular online space MMO

## How to start a server locally:
1. Clone this repo, and install node.js with npm.
2. Open a terminal in the top level folder- the one that contains "app.js". Type npm install in that folder. This will install all the required node.js packages.
3. In the same folder, add a subfolder titled "server". Inside of that subfolder, make three more subfolders titled: "players", "neuralnets", and "turrets". These store information about players' accounts, active turrets, and trained bots that should be saved on the disk.
4. Navigate back to the top level folder with "app.js" and type in your terminal "npm run build". This will minify and obfuscate the client code from "index.js" and "react.js" in the src folder into "client/client.js". You should run this each time you update the client, including ANY of the json files!
5. Change the ports as you see fit, and be sure to add the IP that you want to run the server on (probably just "localhost") to the client.
6. Run the server! In the top level folder, typing "node app.js 8443" runs the server on port 443.

## Happy spacewarring!
