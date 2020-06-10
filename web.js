let fs = require('fs');
let http = require('http');
let express = require('express');
let app = express();
let cors = require('cors')

console.log('\n\nWeb Server started');
app.use(cors());
app.use('/',express.static(__dirname + '/client'));
let httpServer = http.Server(app);
httpServer.listen(parseInt(process.argv[2]));//normal is 8443, dev 7301
console.log("Express started");
