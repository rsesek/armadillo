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
  this.isDirectory_ = app.isDirectory(name);
};
goog.inherits(armadillo.File, goog.Disposable);

/**
 * Disposer
 * @protected
 */
armadillo.File.prototype.disposeInternal = function() {
  armadillo.File.superClass_.disposeInternal.call(this);
  this.element_ = null;
  goog.events.unlistenByKey(this.clickListener_);
  goog.events.unlistenByKey(this.mouseOverListener_);
  goog.events.unlistenByKey(this.mouseOutListener_);
  this.button_ = null;
  goog.events.unlistenByKey(this.buttonListener_);
};

/**
 * Returns the name of the file.
 * @returns string
 */
armadillo.File.prototype.getName = function() {
  return this.name_;
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
    this.clickListener_ = goog.events.listen(this.element_,
        goog.events.EventType.CLICK, this.clickHandler_, false, this);
    if (!this.isSpecial_()) {
      this.mouseOverListener_ = goog.events.listen(this.element_,
          goog.events.EventType.MOUSEOVER, this.hoverHandler_, false, this);
      this.mouseOutListener_ = goog.events.listen(this.element_,
          goog.events.EventType.MOUSEOUT, this.hoverHandler_, false, this);
    }
  }
  goog.dom.removeChildren(this.element_);

  // Set the name of the entry.
  goog.dom.setTextContent(this.element_, this.name_);

  // Create the edit button.
  if (!this.isSpecial_()) {
    this.button_ = goog.dom.createElement('button');
    goog.dom.setTextContent(this.button_, 'Edit');
    goog.dom.appendChild(this.element_, this.button_);
    this.button_.style.display = 'none';
    this.buttonListener_ = goog.events.listen(this.button_,
        goog.events.EventType.CLICK, this.buttonClickHandler_, false, this);
  }

  return this.element_;
};

/**
 * Deletes the given file in the backend by sending a request.  On return, it
 * will re-query the directory.
 */
armadillo.File.prototype.delete = function() {
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
 * Click handler for the list element.
 * @param  {Event}  e
 */
armadillo.File.prototype.clickHandler_ = function(e) {
  if (armadillo.Actor.isModal()) {
    return;
  }
  if (this.isDirectory_) {
    app.navigate(this.name_);
  }
};

/**
 * Hover event handler for the list element.  This can handle both mouseover
 * and mouseout events.
 * @param  {Event} e
 */
armadillo.File.prototype.hoverHandler_ = function(e) {
  if (armadillo.Actor.isModal())
    return;
  var display = (e.type == goog.events.EventType.MOUSEOVER);
  this.button_.style.display = (display ? '' : 'none');
};

/**
 * Click handler for the button element.
 * @param  {Event}  e
 */
armadillo.File.prototype.buttonClickHandler_ = function(e) {
  if (armadillo.Actor.isModal())
    return;
  e.stopPropagation();
  var actor = new armadillo.Actor(this);
  actor.show(e.clientX, e.clientY);
};

/**
 * Returns TRUE if this File is not a real file, but a special kind.
 * @returns boolean
 */
armadillo.File.prototype.isSpecial_ = function() {
  return this.name_ == '../';
};
