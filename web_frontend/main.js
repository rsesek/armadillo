goog.provide('armadillo');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.net.XhrIo');
goog.require('goog.Uri.QueryData');

armadillo = function() {
  this.list('/');
  this.listeners_ = new Array();
}

/**
 * Starts a new XHR service request from the backend.
 * @param  {string}  action  Action to perform.
 * @param  {Object}  extra_data  Extra data to add.
 * @param  {Function}  callback  XHR callback.
 */
armadillo.prototype.sendRequest_ = function(action, extra_data, callback) {
  var data = new goog.Uri.QueryData();
  data.set('action', 'list');
  data.extend(extra_data);
  goog.net.XhrIo.send('/service', callback, 'POST', data);
};

/**
 * Updates the directory listing for a given path.
 * @param  {string}  path  Path to list; relative to jail.
 */
armadillo.prototype.list = function(path) {
  var callback = function(e) {
    var data = e.target.getResponseJson();
    if (data['status']) {
      return;  // Error.
    }
    // Unlisten all current listeners.
    goog.array.forEach(app.listeners_, function(e) {
      goog.events.unlistenByKey(e);
    });

    // Update the listing.
    goog.dom.setTextContent(goog.dom.getElement('pwd'), path);
    var list = goog.dom.getElement('ls');
    goog.dom.removeChildren(list);

    // Add items for each entry.
    goog.array.forEach(data, function(file) {
      var elm = goog.dom.createElement('li');
      goog.dom.setTextContent(elm, file);
      goog.dom.appendChild(list, elm);
      app.listeners_.push(goog.events.listen(elm,
          goog.events.EventType.CLICK, app.clickHandler_, false, app));
    });
  }
  this.sendRequest_('list', {'path':path}, callback);
};

/**
 * Click handler for elements.
 * @param  {Event}  e
 */
armadillo.prototype.clickHandler_ = function(e) {
  if (this.isDirectory_(goog.dom.getTextContent(e.target))) {
    alert('this is a dir');
  }
};

/**
 * Checks whether a path is a directory.
 * @param  {string}  path
 * @returns boolean
 */
armadillo.prototype.isDirectory_ = function(path) {
  return path[path.length - 1] == '/';
};
