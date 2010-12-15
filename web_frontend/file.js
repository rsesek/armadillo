//
// Armadillo File Manager
// Copyright (c) 2010, Robert Sesek <http://www.bluestatic.org>
// 
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

goog.provide('armadillo.File');

goog.require('armadillo.Actor');
goog.require('goog.Disposable');
goog.require('goog.dom');
goog.require('goog.ui.AnimatedZippy');

/**
 * A file in a directory listing.
 * @param  {string}  File name.
 * @param  {string}  The path the file resides at.
 * @constructor
 */
armadillo.File = function(name, path) {
  goog.Disposable.call(this);
  this.name_ = name;
  this.path_ = path;
  this.highlight_ = '';
  this.isDirectory_ = app.isDirectory(name);
  this.actor_ = new armadillo.Actor(this);
  this.zippy_ = null;
};
goog.inherits(armadillo.File, goog.Disposable);

armadillo.File.Highlight = {
  NONE : '',
  SELECTED : 'file-selected',
  ACTIVE   : 'file-active'
};

/**
 * Disposer
 * @protected
 */
armadillo.File.prototype.disposeInternal = function() {
  armadillo.File.superClass_.disposeInternal.call(this);
  this.element_ = null;
  this.link_ = null;
  goog.events.unlistenByKey(this.linkListener_);
  goog.events.unlistenByKey(this.actorListener_);
  this.actor_.dispose();
  if (this.zippy_)
    this.zippy_.dispose();
};

/**
 * Returns the name of the file.
 * @returns string
 */
armadillo.File.prototype.getName = function() {
  return this.name_;
};

/**
 * Returns the path the file without the name. This is equivalent to calling
 * dirname on the absolute path.
 * @returns string
 */
armadillo.File.prototype.getParentPath = function() {
  return this.path_;
};

/**
 * Gets the fully qualified path of the file, from the root of the jail to the
 * name of the file.
 * @returns string
 */
armadillo.File.prototype.getFullPath = function() {
  return this.path_ + this.name_;
};

/**
 * Returns whether or not this is a directory.
 * @returns boolean
 */
armadillo.File.prototype.isDirectory = function() {
  return this.isDirectory_;
};

/**
 * Returns the extension of the file, or an empty string if theh file is a
 * directory or does not have an extension.
 * @returns string
 */
armadillo.File.prototype.getExtension = function() {
  if (this.isDirectory())
    return '';
  var index = this.getName().lastIndexOf('.');
  if (index == -1)
    return '';
  return this.getName().substring(index);
};

/**
 * Sets the highlight state.
 */
armadillo.File.prototype.setHighlight = function(h) {
/*
  // TODO: enable.
  goog.dom.classes.addRemove(this.element_, this.highlight_, h);
  this.highlight_ = h;
*/
};

/**
 * Constructs the Elements that make up the UI.
 * @returns  {Element}  An element ready for insertion into DOM.
 */
armadillo.File.prototype.draw = function() {
  // Create the element if it does not exist.  If it does, remove all children.
  if (!this.element_) {
    this.element_ = goog.dom.createElement('li');
    this.element_.representedObject = this;
    var handler = (this.isSpecial_() ? this.clickHandler_ : this.actorHandler_);
  }
  goog.dom.removeChildren(this.element_);

  // Set the name of the entry.
  this.title_ = goog.dom.createDom('div', null);
  if (this.isDirectory()) {
    this.link_ = goog.dom.createDom('a', null, this.name_);
    this.linkListener_ = goog.events.listen(this.link_,
        goog.events.EventType.CLICK, this.clickHandler_, false, this);
    goog.dom.appendChild(this.title_, this.link_);
  } else {
    goog.dom.setTextContent(this.title_, this.name_);
  }
  goog.dom.appendChild(this.element_, this.title_);
  this.actorListener_ = goog.events.listen(this.title_,
      goog.events.EventType.CLICK, handler, false, this);

  return this.element_;
};

/**
 * Deletes the given file in the backend by sending a request.  On return, it
 * will re-query the directory.
 */
armadillo.File.prototype.remove = function() {
  var file = this;
  var callback = function(data) {
    if (data['error']) {
      app.showError(data['message']);
      return;
    } else {
      app.clearError();
    }
    app.list(file.path_);
  };
  app.sendRequest('remove', {'path':this.path_ + this.name_}, callback);
};

/**
 * Moves a file from one absolute path to another. On success, it will navigate
 * to the new path.
 * @param  {string}  dest  The destination path.
 */
armadillo.File.prototype.move = function(dest) {
  var file = this;
  var callback = function(data) {
    if (data['error']) {
      app.showError(data['message']);
    } else {
      app.clearError();
      app.list(app.stripLastPathComponent(dest));
    }
  };
  app.sendRequest('move', {'source':this.getFullPath(), 'target':dest}, callback);
};

/**
 * Click handler for the link element; only for directories.
 * @param  {Event}  e
 */
armadillo.File.prototype.clickHandler_ = function(e) {
  if (this.isDirectory_) {
    app.navigate(this.name_);
  }
  e.stopPropagation();
};

/**
 * Click handler for the row, which brings up the Actor interface.
 * @param  {Event}  e
 */
armadillo.File.prototype.actorHandler_ = function(e) {
  e.stopPropagation();
  if (!this.actor_.isInDocument())
    this.actor_.render(this.element_);
  if (!this.zippy_) {
    this.zippy_ = new goog.ui.AnimatedZippy(this.title_,
        this.actor_.getElement(), false);
    this.zippy_.toggle();
  }
};

/**
 * Returns TRUE if this File is not a real file, but a special kind.
 * @returns boolean
 */
armadillo.File.prototype.isSpecial_ = function() {
  return this.name_ == '../';
};
