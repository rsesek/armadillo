//
// Armadillo File Manager
// Copyright (c) 2010-2011, Robert Sesek <http://www.bluestatic.org>
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

goog.provide('armadillo');
goog.provide('armadillo.App');

goog.require('armadillo.File');
goog.require('armadillo.Version');
goog.require('goog.string.format');

armadillo.App = function() {
  var start_path = '/';
  if (window.location.hash) {
    start_path = window.location.hash.substr(1);
  }
  this.list(start_path);

  $(window).bind('hashchange', this.hashChanged_.bind(this));

  this.clearError(false);

  $('#mkdir').click(this.mkdirHandler_.bind(this));

  var version = goog.string.format('Armadillo %d.%d (%f)',
      armadillo.Version.MAJOR, armadillo.Version.MINOR,
      armadillo.Version.BUILD);
  $('#footer').text(version);
}

/**
 * Starts a new XHR service request from the backend.
 * @param  {string}  action  Action to perform.
 * @param  {Object}  data  Extra data to add.
 * @param  {Function}  callback  XHR callback.
 * @return {jqXHR} The jQuery XHR object.
 */
armadillo.App.prototype.sendRequest = function(action, data, callback) {
  data.action = action;
  return $.ajax({
      url: 'service',
      type: 'POST',
      data: data,
      success: callback
  });
};

/**
 * Updates the directory listing for a given path.
 * @param  {string}  path  Path to list; relative to jail.
 */
armadillo.App.prototype.list = function(path) {
  var callback = function(data, status, xhr) {
    if (data['error']) {
      app.showError(data['message']);
      return;  // Error.
    } else {
      app.clearError(true);
    }

    // Update the listing.
    $('#pwd').text(path);
    app.currentPath_ = path;
    window.location.hash = path;
    document.title = path + ' - Armadillo';

    var list = $('#ls');
    list.empty();

    // Add a previous directory entry.
    if (path != '/' && path != '')
      data.splice(0, 1, '../');

    // Add items for each entry.
    $.each(data, function(i, file) {
      var fileObject = new armadillo.File(file, path);
      list.append(fileObject.draw());
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
  $.each(arguments, function (i, c) {
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
  var elm = $('#error');
  if (!elm.text() || !animate) {
    elm.hide();
    return;
  }

  elm.fadeOut(500, function() {
    elm.text('');
  });
};

/**
 * Shows an error message.
 * @param  {string}  message
 */
armadillo.App.prototype.showError = function(message) {
  $('#error').text(message).fadeIn(1000);
};

/**
 * Creates a subdirectory in the current path.
 */
armadillo.App.prototype.mkdirHandler_ = function() {
  var name = prompt('Name the new subdirectory', '');
  if (name != null && name != '') {
    var path = this.joinPath(this.getCurrentPath(), name);
    this.sendRequest('mkdir', {'path':path}, function(data, status, xhr) {
      if (data['error']) {
        app.showError(data['message']);
      } else {
        app.clearError();
        app.list(app.getCurrentPath());
      }
    });
  }
};
