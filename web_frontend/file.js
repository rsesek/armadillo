//
// Armadillo File Manager
// Copyright (c) 2010, Robert Sesek <http://www.bluestatic.org>
// 
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

goog.provide('armadillo.File');

goog.require('goog.Disposable');
goog.require('goog.dom');

/**
 * A file in a directory listing.
 * @param  {string}  File name.
 * @constructor
 */
armadillo.File = function(name) {
  goog.Disposable.call(this);
  this.name_ = name;
  this.isDirectory_ = app.isDirectory(name);
};
goog.inherits(armadillo.File, goog.Disposable);

/**
 * Disposer
 * @protected
 */
goog.Disposable.prototype.disposeInternal = function() {
  armadillo.File.superClass_.disposeInternal.call(this);
  this.element_ = null;
  goog.events.unlistenByKey(this.clickListener_);
};

/**
 * Constructs the Elements that make up the UI.
 * @returns  {Element}  An element ready for insertion into DOM.
 */
armadillo.File.prototype.draw = function() {
  if (!this.element_) {
    this.element_ = goog.dom.createElement('li');
    this.element_.representedObject = this;
    this.clickListener_ = goog.events.listen(this.element_,
        goog.events.EventType.CLICK, this.clickHandler_, false, this);
  }
  goog.dom.removeChildren(this.element_);
  goog.dom.setTextContent(this.element_, this.name_);
  return this.element_;
};

/**
 * Click handler for the ist element.
 * @param  {Event}  e
 */
armadillo.File.prototype.clickHandler_ = function(e) {
  if (this.isDirectory_) {
    app.navigate(this.name_);
  }
};
