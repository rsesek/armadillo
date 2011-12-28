//
// Armadillo File Manager
// Copyright (c) 2010-2011, Robert Sesek <http://www.bluestatic.org>
// 
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

$.namespace('armadillo.Actor');

/**
 * The Actor is a popup that displays the various actions that can be performed
 * on a given File.
 * @param  {armadillo.File}  file  The file to act on.
 * @constructor
 */
armadillo.Actor = function(file) {
  /**
   * The file object on which this acts.
   * @type  {armadillo.File}
   */
  this.file_ = file;

  /**
   * The root DOM element for the actor.
   * @type  {Element}
   */
  this.element_ = null;

  /**
   * Controls for the current action.
   * @type  {Element}
   */
  this.controlContainer_ = null;
}

/**
 * Gets the root of the Actor.
 * @return  {Element}
 */
armadillo.Actor.prototype.getElement = function() {
  return this.element_;
};

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
 * @returns  {Element}
 */
armadillo.Actor.prototype.createTile_ = function(option) {
  var value = armadillo.Actor.options_[option];

  // Create the title element.
  var title = $.createDom('span').addClass('title');
  title.text(armadillo.Actor.optionStrings_[value]);

  var tile = $.createDom('div').addClass('tile');
  tile.append(title);

  // Cannot open non-directory files.
  if (value == armadillo.Actor.options_.OPEN && !this.file_.isDirectory()) {
    return null;
  }

  tile.click(this.tileClickHandler_.bind(this, value));
  return tile;
};

/**
 * Click handler for individual tiles.
 * @param {int} option The Actor.option used
 * @param  {Event}  e
 */
armadillo.Actor.prototype.tileClickHandler_ = function(option, e) {
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
  this.controlContainer_.append(editor.createDom());

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
  var content = $('<div>Are you sure you want to delete:<br/><strong>' +
      this.file_.getName() + '</strong></div>');
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
