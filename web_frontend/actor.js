//
// Armadillo File Manager
// Copyright (c) 2010, Robert Sesek <http://www.bluestatic.org>
// 
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

goog.provide('armadillo.Actor');
goog.provide('armadillo.Actor.TileControlRenderer_');

goog.require('armadillo.PathControl');
goog.require('armadillo.TVRenamer');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventHandler');
goog.require('goog.style');
goog.require('goog.ui.Button');
goog.require('goog.ui.Container');

/**
 * The Actor is a popup that displays the various actions that can be performed
 * on a given File.
 * @param  {armadillo.File}  file  The file to act on.
 * @param  {goog.dom.DomHelper}  opt_domHelper
 * @constructor
 */
armadillo.Actor = function(file, opt_domHelper) {
  goog.ui.Container.call(this, null, null, opt_domHelper);

  this.setFocusable(false);
  this.setFocusableChildrenAllowed(true);

  /**
   * The file object on which this acts.
   * @type  {armadillo.File}
   */
  this.file_ = file;

  /**
   * Registrar for all the Actor's events.
   * @type  {goog.events.EventHandler}
   */
  this.eh_ = new goog.events.EventHandler();

  /**
   * The UI element used for a specific action.
   * @type  {goog.Disposable}
   */
  this.actionObject_ = null;

  /**
   * Controls for the current action.
   * @type  {goog.ui.Control}
   */
  this.controlContainer_ = null;
}
goog.inherits(armadillo.Actor, goog.ui.Container);

/**
 * The different options that the Actor can perform.
 */
armadillo.Actor.options_ = {
  OPEN : 'open',
  MOVE : 'move',
  DELETE : 'delete',
  TV_RENAME : 'tv-rename'
};

/**
 * String values for the options.
 */
armadillo.Actor.optionStrings_ = {
  'open' : 'Open',
  'move' : 'Move',
  'delete' : 'Delete',
  'tv-rename' : 'Rename TV Episode'
};

/**
 * Disposer
 * @protected
 */
armadillo.Actor.prototype.disposeInternal = function() {
  armadillo.Actor.superClass_.disposeInternal.call(this);

  this.eh_.dispose();

  if (this.controlContainer_)
    this.controlContainer_.dispose();
  this.controlContainer_ = null;

  // Remove the actor display element.
  goog.dom.removeNode(this.element_);
  this.element_ = null;

  if (this.actionObject_) {
    this.actionObject_.dispose();
    this.actionObject_ = null;
  }

  this.file_ = null;
};

armadillo.Actor.prototype.createDom = function() {
  this.setElementInternal(this.dom_.createDom('div'));
  this.decorate(this.getElement());
};

/**
 * Decorates the given element into a path control.
 * @param  {Element}  element
 */
armadillo.Actor.prototype.decorateInternal = function(element) {
  this.element_ = element;
  goog.dom.classes.add(this.element_, 'actor');
  this.dom_.removeChildren(this.element_);
  for (var option in armadillo.Actor.options_) {
    var tile = this.createTile_(option);
    if (tile) {
      this.addChild(tile, true);
    }
  }
  this.controlContainer_ = new goog.ui.Control();
  this.controlContainer_.setSupportedState(goog.ui.Component.State.FOCUSED, false);
  this.addChild(this.controlContainer_, true);
};

/**
 * Creates the DOM Element that is inserted into the popup.
 * @param  {armadillo.Actor.options_}  Key of the option to create
 * @returns  {goog.ui.Control}
 */
armadillo.Actor.prototype.createTile_ = function(option) {
  var value = armadillo.Actor.options_[option];

  // Create the title element.
  var title = this.dom_.createDom('span', 'title',
      armadillo.Actor.optionStrings_[value]);

  var tile = new goog.ui.Control(title, new armadillo.Actor.TileControlRenderer_());
  tile.actorOption = value;

  // Cannot open non-directory files.
  if (value == armadillo.Actor.options_.OPEN && !this.file_.isDirectory()) {
    return null;
  }

  this.eh_.listen(tile, goog.ui.Component.EventType.ACTION,
      this.tileClickHandler_, false, this);
  return tile;
};

/**
 * Click handler for individual tiles.
 * @param  {Event}  e
 */
armadillo.Actor.prototype.tileClickHandler_ = function(e) {
  var option = e.target.actorOption;
  this.controlContainer_.removeChildren(true);
  this.controlContainer_.setVisible(true);
  if (option == armadillo.Actor.options_.OPEN) {
    // TODO: assert that this.file_.isDirectory().
    app.navigate(this.file_.getName());
  } else if (option == armadillo.Actor.options_.MOVE) {
    this.performMove_();
  } else if (option == armadillo.Actor.options_.DELETE) {
    this.performDelete_();
  } else if (option == armadillo.Actor.options_.TV_RENAME) {
    this.performTVRename_();
  }
};

/**
 * Subroutine to handle bringing up the move confirmation UI.
 * @private
 */
armadillo.Actor.prototype.performMove_ = function() {
  var editor = new armadillo.PathControl(this.file_.getFullPath(), true);
  this.controlContainer_.addChild(editor, true);

  var okCallback = function(e) {
    var newPath = editor.getPath();
    this.file_.move(newPath);
  };
  this.createOkCancel_(goog.bind(okCallback, this), null);
};

/**
 * Subroutine to handle bringing up the delete confirmation UI.
 * @private
 */
armadillo.Actor.prototype.performDelete_ = function() {
  var content = goog.dom.createDom('span', null,
      'Are you sure you want to delete:',
      goog.dom.createElement('br'),
      goog.dom.createDom('strong', null, this.file_.getName()));
  this.controlContainer_.addChild(new goog.ui.Control(content), true);

  var okCallback = function(e) {
    this.file_.remove();
  };
  this.createOkCancel_(goog.bind(okCallback, this), null);
};

/**
 * Subroutine that renames a file to it's title based on season and episode.
 * @private
 */
armadillo.Actor.prototype.performTVRename_ = function() {
  var renamer = new armadillo.TVRenamer(this.file_);
  renamer.run();
};

/**
 * Creates two buttons: one for OK one for Cancel and attahes them to the
 * |controlContainer_|.
 * @param  {function(Event)?}  okCallback
 * @param  {function(Event)?}  cancelCallback
 */
armadillo.Actor.prototype.createOkCancel_ = function(okCallback, cancelCallback) {
  var ok = new goog.ui.Button('OK');
  if (okCallback)
    this.eh_.listen(ok, goog.ui.Component.EventType.ACTION, okCallback);
  var cancel = new goog.ui.Button('Cancel');
  if (!cancelCallback)
    cancelCallback = goog.bind(this.defaultCancelCallback_, this);
  this.eh_.listen(cancel, goog.ui.Component.EventType.ACTION, cancelCallback);
  this.controlContainer_.addChild(ok, true);
  this.controlContainer_.addChild(cancel, true);
};

/**
 * The default cancel callback for the above createOkCancel_().
 * @param  {event}  e
 * @private
 */
armadillo.Actor.prototype.defaultCancelCallback_ = function(e) {
  this.controlContainer_.removeChildren(true);
};

/**
 * Tile Control Renderer
 * @constructor
 */
armadillo.Actor.TileControlRenderer_ = function() {
  goog.ui.ControlRenderer.call(this);
};
goog.inherits(armadillo.Actor.TileControlRenderer_, goog.ui.ControlRenderer);

/**
 * Returns the control's contents wrapped in a DIV, with the renderer's own
 * CSS class and additional state-specific classes applied to it.
 * @param {goog.ui.Control} control Control to render.
 * @return {Element} Root element for the control.
 */
armadillo.Actor.TileControlRenderer_.prototype.createDom = function(control) {
  // Create and return DIV wrapping contents.
  return control.getDomHelper().createDom('div', 'tile', control.getContent());
};
