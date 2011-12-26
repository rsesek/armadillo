//
// Armadillo File Manager
// Copyright (c) 2010, Robert Sesek <http://www.bluestatic.org>
// 
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

goog.provide('armadillo.Actor');

goog.require('armadillo.PathControl');
goog.require('armadillo.TVRenamer');

/**
 * The Actor is a popup that displays the various actions that can be performed
 * on a given File.
 * @param  {armadillo.File}  file  The file to act on.
 * @param  {goog.dom.DomHelper}  opt_domHelper
 * @constructor
 */
armadillo.Actor = function(file, opt_domHelper) {
  /**
   * The file object on which this acts.
   * @type  {armadillo.File}
   */
  this.file_ = file;

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

/**
 * The different options that the Actor can perform.
 */
armadillo.Actor.options_ = {
  OPEN : 'open',
  MOVE : 'move',
  DELETE : 'delete',
  TV_RENAME : 'tv-rename',
  DOWNLOAD : 'download'
};

/**
 * String values for the options.
 */
armadillo.Actor.optionStrings_ = {
  'open' : 'Open',
  'move' : 'Move',
  'delete' : 'Delete',
  'tv-rename' : 'Rename TV Episode',
  'download' : 'Download'
};

armadillo.Actor.prototype.createDom = function() {
  this.decorateInternal($.createDom('div'));
  return this.element_;
};

/**
 * Decorates the given element into a path control.
 * @param  {Element}  element
 */
armadillo.Actor.prototype.decorateInternal = function(element) {
  this.element_ = element;
  this.element_.addClass('actor');
  this.element_.empty();
  for (var option in armadillo.Actor.options_) {
    var tile = this.createTile_(option);
    if (tile) {
      this.element_.append(tile);
    }
  }
  this.controlContainer_ = $.createDom('div');
  this.element_.append(this.controlContainer_);
};

/**
 * Creates the DOM Element that is inserted into the popup.
 * @param  {armadillo.Actor.options_}  Key of the option to create
 * @returns  {goog.ui.Control}
 */
armadillo.Actor.prototype.createTile_ = function(option) {
  var value = armadillo.Actor.options_[option];

  // Create the title element.
  var title = $.createDom('span').addClass('title');
  title.text(armadillo.Actor.optionStrings_[value]);

  var tile = $.createDom('div').addClass('tile');
  tile.actorOption = value;
  tile.append(title);

  // Cannot open non-directory files.
  if (value == armadillo.Actor.options_.OPEN && !this.file_.isDirectory()) {
    return null;
  }

  tile.click(this.tileClickHandler_.bind(this));
  return tile;
};

/**
 * Click handler for individual tiles.
 * @param  {Event}  e
 */
armadillo.Actor.prototype.tileClickHandler_ = function(e) {
  var option = e.target.actorOption;
  this.controlContainer_.empty();
  this.controlContainer_.show();
  if (option == armadillo.Actor.options_.OPEN) {
    // TODO: assert that this.file_.isDirectory().
    app.navigate(this.file_.getName());
  } else if (option == armadillo.Actor.options_.MOVE) {
    this.performMove_();
  } else if (option == armadillo.Actor.options_.DELETE) {
    this.performDelete_();
  } else if (option == armadillo.Actor.options_.TV_RENAME) {
    this.performTVRename_();
  } else if (option == armadillo.Actor.options_.DOWNLOAD) {
    this.performDownload_();
  }
};

/**
 * Subroutine to handle bringing up the move confirmation UI.
 * @private
 */
armadillo.Actor.prototype.performMove_ = function() {
  var editor = new armadillo.PathControl(this.file_.getFullPath(), true);
  this.controlContainer_.append(editor);

  var okCallback = function(e) {
    var newPath = editor.getPath();
    this.file_.move(newPath);
  };
  this.createOkCancel_(okCallback.bind(this), null);
};

/**
 * Subroutine to handle bringing up the delete confirmation UI.
 * @private
 */
armadillo.Actor.prototype.performDelete_ = function() {
  var content = $('<span>Are you sure you want to delete:<br/><strong>' +
      this.file_.getName() + '</strong></span>');
  this.controlContainer_.append(content);

  var okCallback = function(e) {
    this.file_.remove();
  };
  this.createOkCancel_(okCallback.bind(this), null);
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
 * Subroutine that streams a file.
 * @private
 */
armadillo.Actor.prototype.performDownload_ = function() {
  window.location = '/download?path=' + this.file_.getFullPath();
};

/**
 * Creates two buttons: one for OK one for Cancel and attahes them to the
 * |controlContainer_|.
 * @param  {function(Event)?}  okCallback
 * @param  {function(Event)?}  cancelCallback
 */
armadillo.Actor.prototype.createOkCancel_ = function(okCallback, cancelCallback) {
  var ok = $.createDom('button').text('OK');
  if (okCallback)
    ok.click(okCallback);
  var cancel = $.createDom('button').text('Cancel');
  if (!cancelCallback)
    cancelCallback = this.defaultCancelCallback_.bind(this);
  cancel.click(cancelCallback);
  this.controlContainer_.append(ok);
  this.controlContainer_.append(cancel);
};

/**
 * The default cancel callback for the above createOkCancel_().
 * @param  {event}  e
 * @private
 */
armadillo.Actor.prototype.defaultCancelCallback_ = function(e) {
  this.controlContainer_.empty();
};
