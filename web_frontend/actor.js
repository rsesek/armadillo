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
goog.require('goog.events');
goog.require('goog.positioning.ClientPosition');
goog.require('goog.positioning.Corner');
goog.require('goog.ui.Dialog');
goog.require('goog.ui.Popup');

/**
 * The Actor is a popup that displays the various actions that can be performed
 * on a given File.
 * @param  {armadillo.File}  file  The file to act on.
 * @constructor
 */
armadillo.Actor = function(file) {
  goog.Disposable.call(this);
  this.file_ = file;
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
 * The different options that the Actor can perform.
 */
armadillo.Actor.options_ = {
  OPEN : 'open',
  MOVE : 'move',
  RENAME : 'rename',
  DELETE : 'delete'
};

/**
 * String values for the options.
 */
armadillo.Actor.optionStrings_ = {
  'open' : 'Open',
  'move' : 'Move',
  'rename' : 'Rename',
  'delete' : 'Delete'  
};

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

  // Unlisten the tiles.
  var tiles = goog.dom.getElementsByClassName('tile', this.element_);
  goog.array.forEach(tiles, function (tile) {
    goog.events.unlistenByKey(tile.actorListener);
  });

  // Remove the actor display element.
  goog.dom.removeNode(this.element_);
  this.element_ = null;

  // Kill the popup.
  this.popup_.dispose();
  this.popup_ = null;

  // Remove the actor from the list.
  goog.array.remove(armadillo.Actor.actors_, this);

  this.file_ = null;
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
  this.popup_.setHideOnEscape(true);
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
  for (var option in armadillo.Actor.options_) {
    var tile = goog.dom.createDom('div', 'tile');
    var value = armadillo.Actor.options_[option];
    // Cannot open non-directory files.
    if (value == armadillo.Actor.options_.OPEN && !this.file_.isDirectory()) {
      continue;
    }
    var title = goog.dom.createDom('span', 'title',
        armadillo.Actor.optionStrings_[value]);
    goog.dom.appendChild(tile, title);
    goog.dom.appendChild(root, tile);
    tile.actorOption = value;
    tile.actorListener = goog.events.listen(tile, goog.events.EventType.CLICK,
        this.tileClickHandler_, false, this);
  }
  return root;
};

/**
 * Click handler for individual tiles.
 * @param  {Event}  e
 */
armadillo.Actor.prototype.tileClickHandler_ = function(e) {
  var option = e.target.actorOption;
  if (option == armadillo.Actor.options_.OPEN) {
    // TODO: assert that this.file_.isDirectory().
    app.navigate(this.file_.getName());
    this.hide();
  } else if (option == armadillo.Actor.options_.MOVE) {
    this.performMove_();
  } else if (option == armadillo.Actor.options_.DELETE) {
    this.performDelete_();
  }
};

/**
 * Subroutine to handle bringing up the move confirmation UI.
 * @private
 */
armadillo.Actor.prototype.performMove_ = function() {
  var dialog = this.createActionDialog_();
  dialog.setTitle('Move File');

  var container = dialog.getContentElement();
  goog.dom.appendChild(container,
      goog.dom.createDom('p', null,
          'Enter a new, absolute path for this file.'));
  var field = goog.dom.createElement('input');
  field.type = 'text';
  field.value = this.file_.getFullPath();
  goog.dom.appendChild(container, field)
  // TODO: Suck less.
  goog.dom.appendChild(container,
      goog.dom.createDom('p', 'smallfont',
          '(Please pardon this interface. Armadillo is a work-in-progress.)'));

  dialog.setVisible(true);
  field.focus();
};

/**
 * Subroutine to handle bringing up the delete confirmation UI.
 * @private
 */
armadillo.Actor.prototype.performDelete_ = function() {
  var confirm = this.createActionDialog_();
  confirm.setTitle('Confirm Delete');

  var container = confirm.getContentElement();
  var content = goog.dom.createDom('span', null,
      'Are you sure you want to delete:',
      goog.dom.createElement('br'),
      goog.dom.createDom('strong', null, this.file_.getName()));
  goog.dom.appendChild(container, content);

  var closeCallback = function(e) {
    if (e.key != goog.ui.Dialog.DefaultButtonKeys.CANCEL) {
      this.file_.delete();
    }
  };
  // Will be removed when the event source closes.
  goog.events.listen(confirm, goog.ui.Dialog.SELECT_EVENT,
      closeCallback, false, this);

  confirm.setVisible(true);
};

/**
 * Creates a new instance of a Dialog that has some basic properties set that
 * are common to performing actions.
 * @private
 */
armadillo.Actor.prototype.createActionDialog_ = function() {
  var confirm = new goog.ui.Dialog();
  confirm.setDisposeOnHide(true);
  confirm.setEscapeToCancel(true);
  confirm.setModal(true);
  confirm.setDraggable(false);
  confirm.setHasTitleCloseButton(false);
  return confirm;
};
