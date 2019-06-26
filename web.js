var fs = require('fs');
var http = require('http');
var express = require('express');
var app = express();
console.log('Web Server started');
console.log('Enabling express...');
app.use('/',express.static(__dirname + '/client'));
var httpServer = http.Server(app);
httpServer.listen(parseInt(process.argv[2]));//normal is 8443, dev 7301
console.log("Express started");

