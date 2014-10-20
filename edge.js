var http = require('http');
var minimist = require('minimist');
var Smart = require('./smart');

var argv = minimist(process.argv.slice(2));

var port = argv.p || argv.port || 3000;
var axon = argv.a || argv.axon || 4000;

// Smart client making educated proxy decisions
var client = new Smart({ port: axon });

http.createServer(function (req, res) {
  client.proxy(req, res);
}).listen(3000);
