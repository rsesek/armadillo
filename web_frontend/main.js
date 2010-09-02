//
// Armadillo File Manager
// Copyright (c) 2010, Robert Sesek <http://www.bluestatic.org>
// 
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

goog.provide('armadillo');
goog.provide('armadillo.App');

goog.require('armadillo.File');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.fx.dom.FadeInAndShow');
goog.require('goog.net.XhrIo');
goog.require('goog.Uri.QueryData');

armadillo.App = function() {
  var start_path = '/';
  if (window.location.hash) {
    start_path = window.location.hash.substr(1);
  }
  this.list(start_path);
  this.listeners_ = new Array();
  this.errorEffect_ =
      new goog.fx.dom.FadeInAndShow(goog.dom.getElement('error'), 2.0);
  this.errorEffect_.hide();
  goog.events.listen(window, goog.events.EventType.HASHCHANGE,
      this.hashChanged_, false, this);
}

/**
 * Starts a new XHR service request from the backend.
 * @param  {string}  action  Action to perform.
 * @param  {Object}  extra_data  Extra data to add.
 * @param  {Function}  callback  XHR callback.
 */
armadillo.App.prototype.sendRequest_ = function(action, extra_data, callback) {
  var data = new goog.Uri.QueryData();
  data.set('action', action);
  data.extend(extra_data);
  goog.net.XhrIo.send('/service', callback, 'POST', data);
};

/**
 * Updates the directory listing for a given path.
 * @param  {string}  path  Path to list; relative to jail.
 */
armadillo.App.prototype.list = function(path) {
  var callback = function(e) {
    var data = e.target.getResponseJson();
    if (data['error']) {
      app.showError_(data['message']);
      return;  // Error.
    } else {
      app.clearError_();
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
      var fileObject = new armadillo.File(file);
      goog.dom.appendChild(list, fileObject.draw());
    });
  }
  this.sendRequest_('list', {'path':path}, callback);
};

/**
 * Click handler for elements.
 * @param  {Event}  e
 */
armadillo.App.prototype.clickHandler_ = function(e) {
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
armadillo.App.prototype.hashChanged_ = function(e) {
  if (window.location.hash.length)
    this.list(window.location.hash.substr(1));
};

/**
 * Checks whether a path is a directory.
 * @param  {string}  path
 * @returns boolean
 */
armadillo.App.prototype.isDirectory_ = function(path) {
  return path[path.length - 1] == '/';
};

/**
 * Strips the last path component from a path.
 * @param  {string}  path
 * @returns string
 */
armadillo.App.prototype.stripLastPathComponent_ = function(path) {
  for (var i = path.length - 1; i >= 0; --i) {
    if (path[i] == '/') {
      if (i != path.length - 1) {
        return path.substring(0, i + 1);
      }
    }
  }
  return '/';
};

/**
 * Clears the error message.
 */
armadillo.App.prototype.clearError_ = function() {
  this.errorEffect_.hide();
  goog.dom.setTextContent(this.errorEffect_.element, '');
};

/**
 * Shows an error message.
 * @param  {string}  message
 */
armadillo.App.prototype.showError_ = function(message) {
  goog.dom.setTextContent(this.errorEffect_.element, message);
  this.errorEffect_.show();
};
