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
goog.require('armadillo.Version');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.fx.dom.FadeInAndShow');
goog.require('goog.fx.dom.FadeOutAndHide');
goog.require('goog.net.XhrIo');
goog.require('goog.string.format');
goog.require('goog.Uri.QueryData');

armadillo.App = function() {
  var start_path = '/';
  if (window.location.hash) {
    start_path = window.location.hash.substr(1);
  }
  this.list(start_path);
  goog.events.listen(window, goog.events.EventType.HASHCHANGE,
      this.hashChanged_, false, this);

  this.clearError(false);

  var version = goog.string.format('Armadillo %d.%d (%d)',
      armadillo.Version.MAJOR, armadillo.Version.MINOR,
      armadillo.Version.BUILD);
  goog.dom.setTextContent(goog.dom.getElement('footer'), version)
}

/**
 * Starts a new XHR service request from the backend.
 * @param  {string}  action  Action to perform.
 * @param  {Object}  extra_data  Extra data to add.
 * @param  {Function}  callback  XHR callback.
 */
armadillo.App.prototype.sendRequest = function(action, extra_data, callback) {
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
      app.showError(data['message']);
      return;  // Error.
    } else {
      app.clearError(true);
    }

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
      var fileObject = new armadillo.File(file, path);
      goog.dom.appendChild(list, fileObject.draw());
    });
  }
  this.sendRequest('list', {'path':path}, callback);
};

/**
 * Navigates to a subpath.  Can only handle directories.
 * @param  {string}  target  Relative path to |currentPath_|.
 */
armadillo.App.prototype.navigate = function(target) {
  if (target == '../') {
    this.list(this.stripLastPathComponent(this.currentPath_));
  } else {
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
armadillo.App.prototype.isDirectory = function(path) {
  return path[path.length - 1] == '/';
};

/**
 * Gets the current path of the directory being displayed, absolute to root.
 * @returns string
 */
armadillo.App.prototype.getCurrentPath = function() {
  return this.currentPath_;
};

/**
 * Strips the last path component from a path.
 * @param  {string}  path
 * @returns string
 */
armadillo.App.prototype.stripLastPathComponent = function(path) {
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
 * Joins all the arguments together as a path.
 * @param  {string...}  varargs  Components to join
 */
armadillo.App.prototype.joinPath = function() {
  var path = '';
  var sep = '/';
  var last = arguments.length - 1;
  goog.array.forEach(arguments, function (c, i) {
    if (c == sep && i != 0)
      return;
    path += c;
    if (c[c.length - 1] != sep && i != last)
      path += sep;
  });
  return path;
};

/**
 * Clears the error message.
 * @param   {bool?}  animate  Whether or not to animate out.
 */
armadillo.App.prototype.clearError = function(animate) {
  var elm = goog.dom.getElement('error');
  var anim = new goog.fx.dom.FadeOutAndHide(elm, 500);
  if (!goog.dom.getTextContent(elm) || !animate) {
    anim.hide();
    return;
  }
  goog.events.listenOnce(anim, goog.fx.Animation.EventType.END, function() {
    goog.dom.setTextContent(elm, '');
  });
  anim.play();
};

/**
 * Shows an error message.
 * @param  {string}  message
 */
armadillo.App.prototype.showError = function(message) {
  var elm = goog.dom.getElement('error');
  goog.dom.setTextContent(elm, message);
  var anim = new goog.fx.dom.FadeInAndShow(elm, 1000);
  anim.play();
};
