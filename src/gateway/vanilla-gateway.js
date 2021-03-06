var Utils = require('../utils');
var CreateGateway = require('../create-gateway');

var VanillaGateway = CreateGateway({

  get: function() {
    var request = new XMLHttpRequest();
    this._configureCallbacks(request);
    request.open('GET', this.url, true);
    this._setHeaders(request);
    request.send();
  },

  post: function() {
    this._performRequest('POST');
  },

  put: function() {
    this._performRequest('PUT');
  },

  patch: function() {
    this._performRequest('PATCH');
  },

  delete: function() {
    this._performRequest('DELETE');
  },

  _performRequest: function(method) {
    var emulateHTTP = this.shouldEmulateHTTP(method);
    var requestMethod = method;
    var request = new XMLHttpRequest();
    this._configureCallbacks(request);

    if (emulateHTTP) {
      this.body = this.body || {};
      if (typeof this.body === 'object') this.body._method = method;
      requestMethod = 'POST';
    }

    request.open(requestMethod, this.url, true);
    if (emulateHTTP) request.setRequestHeader('X-HTTP-Method-Override', method);
    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    this._setHeaders(request);

    var args = [];
    if (this.body !== undefined) {
      args.push(Utils.params(this.body));
    }

    request.send.apply(request, args);
  },

  _configureCallbacks: function(request) {
    request.onload = function() {
      var data = null;
      var status = request.status;

      try {
        if (status >= 200 && status < 400) {
          if (this._isContentTypeJSON(request)) {
            data = JSON.parse(request.responseText);

          } else {
            data = request.responseText;
          }

          var responseHeaders = request.getAllResponseHeaders();
          var extra = {responseHeaders: Utils.parseResponseHeaders(responseHeaders)};
          this.successCallback(data, extra);

        } else {
          this.failCallback({status: status, args: [request]});
        }
      } catch(e) {
        this.failCallback({status: status, args: [request]});

      } finally {
        this.completeCallback(data, request);
      }

    }.bind(this);

    request.onerror = function() {
      this.failCallback({status: 400, args: [arguments]});
      this.completeCallback.apply(this, arguments);
    }.bind(this);

    if (this.opts.configure) {
      this.opts.configure(request);
    }
  },

  _setHeaders: function(request) {
    var headers = Utils.extend({}, this.opts.headers);
    Object.keys(headers).forEach(function(headerName) {
      request.setRequestHeader(headerName, headers[headerName]);
    });
  },

  _isContentTypeJSON: function(request) {
    return /application\/json/.test(request.getResponseHeader('Content-Type'));
  }

});

module.exports = VanillaGateway;
