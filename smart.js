var EE = require('events').EventEmitter;
var util = require('util');
var axon = require('axon');
var forwarded = require('forwarded-for');
var debug = require('diagnostics')('smart');
var HttpProxy = require('http-proxy');

module.exports = Smart;

util.inherits(Smart, EE);

function Smart(options) {
  if (!(this instanceof Smart)) return new Smart(options);
  EE.call(this);

  this.port = options.port || 4000;
  this.destinations = options.destinations || [];
  // Proxy counter
  this.count = 0;

  //
  // Axon socket server to recieve messages from Distributor
  //
  this.axon = axon.socket('rep')
    .on('error', function (err) { debug('Connection with server closed') })
    .on('message', this._onMessage.bind(this))
    .bind(4000);

  this._proxy = new HttpProxy({ secure: false, prependPath: false })
    .on('error', this._handleProxyError.bind(this))
    .on('start', this.emit.bind(this, 'start'))
    .on('end', this.emit.bind(this, 'end'));
}

//
// Simple round robin load balancing over a set of servers
//
Smart.prototype.proxy = function (req, res) {
  var address = forwarded(req, req.headers);

  var dests = this.destinations;
  var len = dests.length;
  var target = dests[this.count++ % len];

  debug('[proxy request] from %s to %s  | %s %s', address.ip, target, req.method, req.url);

  this._proxy.web(req, res, {
    target: target
  });

};

// Add a server to the set
Smart.prototype.add = function (host, fn) {
  var idx = this.destinations.indexOf(host);
  if (!~idx) this.destinations.push(host);
  else debug('%s was already found in destinations array', host);
  return setImmediate(fn.bind(null, true));
};

// Remove a server from the set
Smart.prototype.remove = function(host, fn) {
  var idx = this.destinations.indexOf(host);
  if (!~idx) {
    debug('%s not found in destinations %j', host, this.destinations);
    return setImmediate(fn.bind(null, false));
  }
  this.destinations.splice(idx, 1);
  return setImmediate(fn.bind(null, true));
};

Smart.prototype._onMessage = function (action, msg, fn) {
  switch(action) {
    case 'add':
      debug('add action called with %s', msg);
      this.add(msg, fn);
      break;
    case 'remove':
      debug('remove action called with %s', msg);
      this.remove(msg, fn);
      break;
    default:
      debug('Default: Action %s, msg %s', action, msg);
      fn(false);
  }
};

Smart.prototype._handleProxyError = function (err, req, res) {
  var address = forwarded(req, req,headers),
      json;

  debug('[proxy error] %s | %s %s %s', address.ip, req.method, req.url, err.message);

  if (!res.headersSent) {
    res.writeHead(500, { 'content-type': 'application/json' });
  }

  json = { error: 'proxy_error', reason: err.message };
  res.end(JSON.stringify(json));
};
