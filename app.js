var http = require('http');
var minimist = require('minimist');
var g = require('godot');

var argv = minimist(process.argv.slice(2));

var port = argv.p || argv.port || 8080;
var gPort = argv.g || argv.godot || 6000;

var started = false;

var godot = g.createClient({ type: 'tcp', reconnect: {} });
godot.on('error', function (err) {
  console.error(err);
});
godot.connect(gPort);
godot.on('connect', function () {
  if (started) return;
  started = true;

  godot.produce({
    service: 'app/init',
    state: 'ok',
    metric: 1,
    description: 'Event sent to indicate a server just went back up',
    meta: {
      server: 'http://127.0.0.1:' + port
    }
  })
});

http.createServer(function(req, res) {
  if (req.url === '/') {
    res.setHeader('content-type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }
}).listen(+port);

var up = setInterval(function () {
  godot.produce({
    service: 'app/uptime',
    description: 'Uptime of server',
    state: 'ok',
    metric: process.uptime(),
    meta: {
      server: 'http://127.0.0.1:' + port
    }
  })
}, 1000);
