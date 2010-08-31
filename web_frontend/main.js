goog.provide('armadillo');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.net.XhrIo');
goog.require('goog.Uri.QueryData');

armadillo.Main = function() {
  armadillo.List('/');
};

/**
 * Starts a new XHR service request from the backend.
 * @param  {string}  action  Action to perform.
 * @param  {Object}  extra_data  Extra data to add.
 * @param  {Function}  callback  XHR callback.
 */
armadillo.Request = function(action, extra_data, callback) {
  var data = new goog.Uri.QueryData();
  data.set('action', 'list');
  data.extend(extra_data);
  goog.net.XhrIo.send('/service', callback, 'POST', data);
};

/**
 * Updates the directory listing for a given path.
 * @param  {string}  path  Path to list; relative to jail.
 */
armadillo.List = function(path) {
  var callback = function(e) {
    var data = e.target.getResponseJson();
    if (data['status']) {
      return;  // Error.
    }
    goog.dom.setTextContent(goog.dom.getElement('pwd'), path);
    var list = goog.dom.getElement('ls');
    goog.dom.removeChildren(list);
    goog.array.forEach(data, function(file) {
      var elm = goog.dom.createElement('li');
      goog.dom.setTextContent(elm, file);
      goog.dom.appendChild(list, elm);
    });
  }
  armadillo.Request('list', {'path':path}, callback);
};
