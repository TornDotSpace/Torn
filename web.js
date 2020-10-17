const fs = require('fs');
const http = require('http');
const express = require('express');
const app = express();
const cors = require('cors');

console.log('\n\nWeb Server started');
app.use(cors());
app.use('/', express.static(__dirname + '/client'));
const httpServer = http.Server(app);
httpServer.listen(parseInt(process.argv[2]));// normal is 8443, dev 7301
console.log('Express started');
