var EE = require('events').EventEmitter;
var axon = require('axon');
var debug = require('diagnostics')('distributor');

function Distributor (opts) {
  if (!(this instanceof Distributor)) return new Distributor(opts);
  opts = opts || {};
  this.port = opts.port || 5000;

  // Client IPs to distribute messages to and get a reply
  this.ips = opts.ips || ['tcp://127.0.0.1:4000'];

  this.sockets = this.ips.map(this.createSocket, this);
  this.connectCount = 0;

  this.server = axon.socket('rep')
    .on('message', this._onMessage.bind(this));
};

//
// Simple remapping proxy to then make the request to all proxies
//
Distributor.prototype._onMessage = function (status, msg, fn) {
  switch(status) {
    case 'unhealthy':
      this.remove(msg, fn);
      break;
    case 'healthy':
      this.add(msg, fn);
      break;
    default:
      debug('We shouldnt get here')
      fn(false);
  }
};

Distributor.prototype.send = function (action, host, fn) {
  // counting object to pass as a reference;
  var count = { count: 0 };
  this.sockets.forEach(function (socket) {
    socket.send(action, host, this._onFinish.bind(this, count, fn));
  }, this);
};

Distributor.prototype._onFinish = function (o, fn, res) {
  // TODO: This should handle timeouts and things as well but that may require
  // a change in axon
  if (!res) debug('we should do a retry on the specific socket');
  return ++o.count == this.sockets.length
    ? fn(true)
    : function () {};
};

Distributor.prototype.add = function (host, fn) {
  this.send('add', host, fn);
};

Distributor.prototype.remove = function (host, fn) {
  this.send('remove', host, fn);
};

Distributor.prototype.createSocket = function (ip) {
  return axon.socket('req')
    .on('connect', this._onConnect.bind(this))
    .connect(ip);
};

Distributor.prototype._onConnect = function (sock) {
  if (++this.connectCount === this.ips.length) {
    this.clientsConnected = true;
  }
};

Distributor.prototype.listen = function (port, fn) {
  if (typeof port === 'function' && !fn) {
    fn = port;
    port = this.port;
  }
  this.server.bind(port || this.port, fn);

  return this;
};

if (require.main == module) {
  var distributor = new Distributor()
  distributor.listen(function () {

  });
}
