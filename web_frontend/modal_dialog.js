//
// Armadillo File Manager
// Copyright (c) 2010, Robert Sesek <http://www.bluestatic.org>
// 
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

goog.provide('armadillo.ModalDialog');

goog.require('goog.events.EventHandler');
goog.require('goog.ui.Container');
goog.require('goog.ui.Control');

/**
 * A modal dialog that does not use iframe masks, but instead installs a global
 * event listener to prevent events.
 * @param  {goog.ui.DomHelper}  opt_domHelper
 * @constructor
 */
armadillo.ModalDialog = function(opt_domHelper) {
  goog.ui.Container.call(this, null, null, opt_domHelper);

  /**
   * Master EventHandler
   */
  this.eh_ = new goog.events.EventHandler();
};
goog.inherits(armadillo.ModalDialog, goog.ui.Container);

/**
 * Disposer
 * @private
 */
armadillo.ModalDialog.prototype.disposeInternal = function() {
  armadillo.ModalDialog.superClass_.disposeInternal.call(this);
  this.eh_.dispose();
  this.eh_ = null;
};

/**
 * @inheritsDoc
 */
armadillo.ModalDialog.prototype.createDom = function() {
  this.decorateInternal(this.dom_.createElement('div'));
};

/**
 * @inheritsDoc
 */
armadillo.ModalDialog.prototype.decorateInternal = function(element) {
  this.element_ = element;

  var close = new goog.ui.Control('Close Modal Dialog');
  var dialog = this;
  close.handleMouseDown = function(e) {
    e.stopPropagation();
    dialog.dispose();
  };
  this.addChild(close, true);
};

/**
 * @inheritsDoc
 */
armadillo.ModalDialog.prototype.enterDocument = function() {
  armadillo.ModalDialog.superClass_.enterDocument.call(this);
  // Create an event sink that captures all browser event types.
  var types = new Array();
  for (type in goog.events.EventType) {
    types.push(goog.events.EventType[type]);
  }
  this.eventSinkKey_ = this.eh_.listen(this.dom_.getWindow(),
       types, this.eventSink_, true, this);
};

/**
 * @inheritsDoc
 */
armadillo.ModalDialog.prototype.exitDocument = function() {
  goog.events.unlistenByKey(this.eventSinkKey_);
  this.eventSinkKey_ = null;
};

/**
 * Every event that gets dispatched to the Window will first be evaluated by
 * this memeber. If the event's target is not a child of the dialog, the event
 * is cancelled.
 * @param  {Event}  event
 */
armadillo.ModalDialog.prototype.eventSink_ = function(event) {
  var target = event.target;
  while (target) {
    if (target == this.element_) {
      return;
    }
    target = target.parentNode;
  }
  event.stopPropagation();
};
