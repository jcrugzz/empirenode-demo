var g = require('godot');
var debug = require('diagnostics')('godot');
var axon = require('axon');
var ax = axon.socket('req')
  .on('error', function (err) { console.error(err) })
  .connect(5000)

var server = g.createServer({
  type: 'tcp',
  reactors: [
    function (socket) {
      return socket
        .pipe(g.where('service', 'app/init'))
        .pipe(g.map(function (data, fn) {
          debug('recieved init message from app %s', data.meta.server);
          ax.send('healthy', data.meta.server);
          setImmediate(fn.bind(null, data));
        }))
    },
    function (socket) {
      return socket
        .pipe(g.where('service', 'app/uptime'))
        .pipe(g.console(function (d) { return JSON.stringify(d) }))
        .pipe(g.expire(7000))
        .pipe(g.map(function (data, fn) {
          debug('uptime expired, server %s down', data.meta.server);
          ax.send('unhealthy', data.meta.server);
          setImmediate(fn.bind(null, data));
        }))
    }
  ]
});

server.listen(6000);
