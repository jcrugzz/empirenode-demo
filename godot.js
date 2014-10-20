var g = require('godot');

var server = g.createServer({
  type: 'tcp',
  reactors: [
    function (socket) {
      return socket
        .pipe(g.where('service', 'good'))
    }
  ]
});

server.listen(6000);
