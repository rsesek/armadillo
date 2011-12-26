//
// Armadillo File Manager
// Copyright (c) 2010-2011, Robert Sesek <http://www.bluestatic.org>
// 
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

goog.provide('armadillo.PathControl');

goog.require('goog.array');

/**
 * Creates a new path editing control for a given path.
 * @param  {string}  path  The path to create an editor for
 * @param  {bool} editLastComponent  Whether the last component should be shown as an edit box
 * @param  {DomHelper}  opt_domHelper  Optional DOM helper
 * @constructor
 */
armadillo.PathControl = function(path, editLastComponent, opt_domHelper) {
  /**
   * Full path of the control.
   * @type  {string}
   */
  this.path_ = null;

  /**
   * The name of the file at the |path_|.
   * @type  {string}
   */
  this.name_ = null;
  this.setPath(path);

  /**
   * Whether or not the last component is editable.
   * @type  {bool}
   */
  this.editableLastComponent_ = editLastComponent;

  /**
   * Control UI for the name component of the path.
   * @type  {goog.ui.Control}
   */
  this.nameControl_ = null;
};

/**
 * Sets the path.
 * @param  {string}  path
 */
armadillo.PathControl.prototype.setPath = function(path) {
  this.path_ = app.stripLastPathComponent(path);
  this.name_ = path.substr(this.path_.length);
};

/**
 * Gets the new path.
 * @returns  {string}
 */
armadillo.PathControl.prototype.getPath = function() {
  return app.joinPath(this.path_, this.name_);
};

/**
 * Gets the name control.
 * @returns  {goog.ui.Control}
 */
armadillo.PathControl.prototype.getNameControl = function() {
  return this.nameControl_;
};

/**
 * Creates a new path control object.
 */
armadillo.PathControl.prototype.createDom = function() {
  this.decorateInternal($.createDom('div'));
  return this.element_;
};

/**
 * Decorates the given element into a path control.
 * @param  {Element}  element
 */
armadillo.PathControl.prototype.decorateInternal = function(element) {
  this.element_ = element;
  var components = this.path_.split('/');

  // If this is an item that lives at the root, generate a special node for
  // moving between items at the top level.
  components[0] = '/';

  // If the last component is emtpy, do not use it because it means a directory
  // is being moved.
  if (components[components.length - 1] == '') {
    goog.array.removeAt(components, components.length - 1);
  }

  var path = '';
  $.each(components, function (i, part) {
    this.element_.append(this.createComponentNode_(path, part), true);
    path = app.joinPath(path, part);
  }.bind(this));

  if (this.editableLastComponent_) {
    this.nameControl_ = $.createDom('input');
    this.nameControl_.attr({
      'type' : 'text',
      'name' : 'pathName',
      'value' : this.name_
    });

    this.nameControl_.bind('change keydown', this.nameChanged_.bind(this));
  } else {
    this.nameControl_ = $.createDom('span').text(this.name_);
  }

  this.element_.append(this.nameControl_);
};

/**
 * @inheritDoc
 */
armadillo.PathControl.prototype.enterDocument = function() {
  armadillo.PathControl.superClass_.enterDocument.call(this);
  this.nameControl_.getElement().focus();
};

/**
 * Creates a node for a single path component.
 * @param  {string}  path  The path up to this point.
 * @param  {string}  name  The current component after |path|.
 */
armadillo.PathControl.prototype.createComponentNode_ = function(path, name) {
  var menu = $.createDom('select');
  this.fetchMenuContents_(path, name, menu);

  var option = $.createDom('option');
  option.text(name).attr('selected', 'selected');

  menu.append(option);
  menu.change(this.componentChanged_.bind(this));

  return menu;
};

/**
 * Queries the back-end for all the items at a given path and attaches them to
 * the given menu.
 * @param  {string}  path  The path to get a list of items in
 * @param  {string}  name  The name to select
 * @param  {goog.ui.Menu}  The menu to attach items to
 */
armadillo.PathControl.prototype.fetchMenuContents_ = function(path, name, menu) {
  var callback = function(data, status, xhr) {
    if (data['error']) {
      app.showError(data['message']);
      return;
    }
    if (path == '') {
      // If this is the root path element, make sure the root is accessible for
      // moving items.
      goog.array.insertAt(data, '/', 0);
    }
    menu.empty();
    $.each(data, function (i, caption) {
      // It only makes sense to be able to move into directories.
      if (!app.isDirectory(caption)) {
        return;
      }
      var item = $.createDom('option');
      item.val(app.joinPath(path, name, caption)).text(caption);
      menu.append(item);
      if (caption == name) {
        item.attr('selected', 'selected');
      }
    });
  };
  app.sendRequest('list', {'path' : app.joinPath(path, name)}, callback);
};

/**
 * Handler for changing a component of the control.
 * @param  {Event}  e
 */
armadillo.PathControl.prototype.componentChanged_ = function(e) {
  this.path_ = $(e.target).val();
  this.element_.empty();
  this.decorateInternal(this.element_);
};

/**
 * Handler for changing the editable name component.
 * @param  {Event} e
 */
armadillo.PathControl.prototype.nameChanged_ = function(e) {
  console.log(e);
  // TODO: assert(this.editableLastComponent_)
  this.name_ = e.target.value;
  e.stopPropagation();
  return true;
};
