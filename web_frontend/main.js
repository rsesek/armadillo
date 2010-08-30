goog.provide('armadillo');

goog.require('goog.net.XhrIo');
goog.require('goog.Uri.QueryData');

armadillo.Main = function() {
  var callback = function(response) {
    console.log('response = ' + response);
  }
  armadillo.Request('list', {}, callback);
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
