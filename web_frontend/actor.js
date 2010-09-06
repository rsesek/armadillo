//
// Armadillo File Manager
// Copyright (c) 2010, Robert Sesek <http://www.bluestatic.org>
// 
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

goog.provide('armadillo.Actor');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.positioning.ClientPosition');
goog.require('goog.positioning.Corner');
goog.require('goog.ui.Popup');

/**
 * The Actor is a popup that displays the various actions that can be performed
 * on a given File.
 * @constructor
 */
armadillo.Actor = function() {
  goog.Disposable.call(this);
  this.element_ = this.createElement_();
  this.popup_ = new goog.ui.Popup(this.element_);
  armadillo.Actor.actors_.push(this);
}
goog.inherits(armadillo.Actor, goog.Disposable);

/**
 * An array of all the Actors that have been created.
 */
armadillo.Actor.actors_ = new Array();

/**
 * A global property that should be checked to see if an actor is present,
 * creating a modal session.
 */
armadillo.Actor.isModal = function() {
  var isVisible = false;
  goog.array.forEach(armadillo.Actor.actors_, function (e) {
    isVisible |= e.popup_.isVisible();
  });
  return isVisible;
};

/**
 * Disposer
 * @protected
 */
armadillo.Actor.prototype.disposeInternal = function() {
  armadillo.Actor.superClass_.disposeInternal.call(this);
  goog.dom.removeNode(this.element_);
  this.element_ = null;
  this.popup_.dispose();
  this.popup_ = null;
  goog.array.remove(armadillo.Actor.actors_, this);
};

/**
 * Shows the popup.
 * @param  {int}  x  The X position to show at
 * @param  {int}  y  The Y position to show at
 */
armadillo.Actor.prototype.show = function(x, y) {
  if (armadillo.Actor.isModal())
    return;
  var firstBodyElement = goog.dom.getFirstElementChild(document.body);
  goog.dom.insertSiblingBefore(this.element_, firstBodyElement);
  this.popup_.setPinnedCorner(goog.positioning.Corner.TOP_LEFT);
  this.popup_.setPosition(new goog.positioning.ClientPosition(x, y));
  this.popup_.setVisible(true);
};

/**
 * Hides the popup.
 */
armadillo.Actor.prototype.hide = function() {
  this.popup_.setVisible(false);
};

/**
 * Creates the DOM Element that is inserted into the popup.
 * @returns  Element
 */
armadillo.Actor.prototype.createElement_ = function() {
  var root = goog.dom.createDom('div', 'actor');
  goog.dom.setTextContent(root, 'foo bar');
  return root;
};
