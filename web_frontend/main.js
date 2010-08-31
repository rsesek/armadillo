goog.provide('armadillo');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.net.XhrIo');
goog.require('goog.Uri.QueryData');

armadillo = function() {
  var start_path = '/';
  if (window.location.hash) {
    start_path = window.location.hash.substr(1);
  }
  this.list(start_path);
  this.listeners_ = new Array();
  goog.events.listen(window, goog.events.EventType.HASHCHANGE,
      this.hashChanged_, false, this);
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
    if (data['error']) {
      return;  // Error.
    }
    // Unlisten all current listeners.
    goog.array.forEach(app.listeners_, function(e) {
      goog.events.unlistenByKey(e);
    });

    // Update the listing.
    goog.dom.setTextContent(goog.dom.getElement('pwd'), path);
    app.currentPath_ = path;
    window.location.hash = path;
    var list = goog.dom.getElement('ls');
    goog.dom.removeChildren(list);

    // Add a previous directory entry.
    if (path != '/' && path != '')
      goog.array.insertAt(data, '../', 0);

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
  var target = goog.dom.getTextContent(e.target);
  if (target == '../') {
    this.list(this.stripLastPathComponent_(this.currentPath_));
  } else if (this.isDirectory_(target)) {
    this.list(this.currentPath_ + target);
  }
};

/**
 * Event for when the hash changes.
 * @param  {Event}  e
 */
armadillo.prototype.hashChanged_ = function(e) {
  if (window.location.hash.length)
    this.list(window.location.hash.substr(1));
};

/**
 * Checks whether a path is a directory.
 * @param  {string}  path
 * @returns boolean
 */
armadillo.prototype.isDirectory_ = function(path) {
  return path[path.length - 1] == '/';
};

/**
 * Strips the last path component from a path.
 * @param  {string}  path
 * @returns string
 */
armadillo.prototype.stripLastPathComponent_ = function(path) {
  for (var i = path.length - 1; i >= 0; --i) {
    if (path[i] == '/') {
      if (i != path.length - 1) {
        return path.substring(0, i + 1);
      }
    }
  }
  return '/';
};
