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
  this.isDirectory_ = app.isDirectory_(name);
};
goog.inherits(armadillo.File, goog.Disposable);

/**
 * Disposer
 * @protected
 */
goog.Disposable.prototype.disposeInternal = function() {
  armadillo.File.superClass_.disposeInternal.call(this);
  this.element_ = null;
};

/**
 * Constructs the Elements that make up the UI.
 * @returns  {Element}  An element ready for insertion into DOM.
 */
armadillo.File.prototype.draw = function() {
  if (!this.element_) {
    this.element_ = goog.dom.createElement('li');
    this.element_.representedObject = this;
  }
  goog.dom.removeChildren(this.element_);
  goog.dom.setTextContent(this.element_, this.name_);
  app.listeners_.push(goog.events.listen(this.element_,
      goog.events.EventType.CLICK, app.clickHandler_, false, app));
  return this.element_;
};
