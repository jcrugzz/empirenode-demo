var http = require('http');
var minimist = require('minimist');
var Smart = require('./smart');
var g = require('godot');

var argv = minimist(process.argv.slice(2));

var port = argv.p || argv.port || 3000;
var axon = argv.a || argv.axon || 4000;

// Smart client making educated proxy decisions
var client = new Smart({ port: axon });
client.on('start', function (req, res, target) {
  req.target = target;
});

client.on('end', function (req) {
  console.log('Request finished to %s', req.target);
});

http.createServer(function (req, res) {
  client.proxy(req, res);
}).listen(port);


