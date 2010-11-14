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
goog.require('armadillo.TVRenamer
');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventHandler');
goog.require('goog.style');
goog.require('goog.ui.Container');
goog.require('goog.ui.Dialog');

/**
 * The Actor is a popup that displays the various actions that can be performed
 * on a given File.
 * @param  {armadillo.File}  file  The file to act on.
 * @param  {goog.dom.DomHelper}  opt_domHelper
 * @constructor
 */
armadillo.Actor = function(file, opt_domHelper) {
  goog.ui.Container.call(this, null, null, opt_domHelper);

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
}
goog.inherits(armadillo.Actor, goog.ui.Container);

/**
 * The different options that the Actor can perform.
 */
armadillo.Actor.options_ = {
  OPEN : 'open',
  MOVE : 'move',
  RENAME : 'rename',
  DELETE : 'delete',
  TV_RENAME : 'tv-rename'
};

/**
 * String values for the options.
 */
armadillo.Actor.optionStrings_ = {
  'open' : 'Open',
  'move' : 'Move',
  'rename' : 'Rename',
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
  if (option == armadillo.Actor.options_.OPEN) {
    // TODO: assert that this.file_.isDirectory().
    app.navigate(this.file_.getName());
  } else if (option == armadillo.Actor.options_.MOVE ||
             option == armadillo.Actor.options_.RENAME) {
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
  this.actionObject_ = this.createActionDialog_();
  this.actionObject_.setTitle('Move File');

  var editor = new armadillo.PathControl(this.file_.getFullPath(), true);
  this.actionObject_.addChild(editor, true);

  var closeCallback = function(e) {
    if (e.key != goog.ui.Dialog.DefaultButtonKeys.CANCEL) {
      var newPath = editor.getPath();
      this.file_.move(newPath);
    }
  };
  // Will be removed when the event source closes.
  this.eh_.listen(this.actionObject_, goog.ui.Dialog.SELECT_EVENT,
      closeCallback, false, this);

  this.actionObject_.setVisible(true);
  var position = goog.style.getPosition(this.actionObject_.getElement());
  goog.style.setPosition(this.actionObject_.getElement(), position.x, '10%');
};

/**
 * Subroutine to handle bringing up the delete confirmation UI.
 * @private
 */
armadillo.Actor.prototype.performDelete_ = function() {
  this.actionObject_ = this.createActionDialog_();
  this.actionObject_.setTitle('Confirm Delete');

  var container = this.actionObject_.getContentElement();
  var content = goog.dom.createDom('span', null,
      'Are you sure you want to delete:',
      goog.dom.createElement('br'),
      goog.dom.createDom('strong', null, this.file_.getName()));
  goog.dom.appendChild(container, content);

  var closeCallback = function(e) {
    if (e.key != goog.ui.Dialog.DefaultButtonKeys.CANCEL) {
      this.file_.remove();
    }
  };
  // Will be removed when the event source closes.
  this.eh_.listen(this.actionObject_, goog.ui.Dialog.SELECT_EVENT,
      closeCallback, false, this);

  this.actionObject_.setVisible(true);
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
