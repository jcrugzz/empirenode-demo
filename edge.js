var http = require('http');
var url = require('url');
var minimist = require('minimist');
var Smart = require('./smart');
var g = require('godot');

var argv = minimist(process.argv.slice(2));

var port = argv.p || argv.port || 3000;
var axon = argv.a || argv.axon || 4000;
var destinations = ['http://127.0.0.1:8080', 'http://127.0.0.1:8081'];

// Smart client making educated proxy decisions
var client = new Smart({ destinations: destinations, port: axon });
client.on('start', function (req, res, target) {
  req.target = url.format(target);
});

client.on('end', function (req) {
  console.log('Request finished to %s', req.target);
});

http.createServer(function (req, res) {
  client.proxy(req, res);
}).listen(+port);


