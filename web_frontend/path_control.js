//
// Armadillo File Manager
// Copyright (c) 2010, Robert Sesek <http://www.bluestatic.org>
// 
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

goog.provide('armadillo.PathControl');

goog.require('goog.array');
goog.require('goog.ui.Component');
goog.require('goog.ui.FilteredMenu');
goog.require('goog.ui.LabelInput');
goog.require('goog.ui.MenuButton');
goog.require('goog.ui.MenuItem');

/**
 * Creates a new path editing control for a given path.
 * @param  {string}  path  The path to create an editor for
 * @param  {bool} editLastComponent  Whether the last component should be shown as an edit box
 * @param  {DomHelper}  opt_domHelper  Optional DOM helper
 * @constructor
 */
armadillo.PathControl = function(path, editLastComponent, opt_domHelper) {
  goog.ui.Component.call(this, opt_domHelper);

  /**
   * Full path of the control.
   * @type  {string}
   */
  this.path_ = path;

  /**
   * Whether or not the last component is editable.
   * @type  {bool}
   */
  this.editableLastComponent_ = editLastComponent;

  /**
   * List of path components
   * @type  {Array}
   */
  this.components_ = new Array();
};
goog.inherits(armadillo.PathControl, goog.ui.Component);

/**
 * Disposer
 * @protected
 */
armadillo.PathControl.prototype.disposeInternal = function() {
  armadillo.PathControl.superClass_.disposeInternal.call(this);
  this.components_ = null;
};

/**
 * Creates a new path control object.
 */
armadillo.PathControl.prototype.createDom = function() {
  this.decorateInternal(this.dom_.createElement('div'));
};

/**
 * @inheritDoc
 */
armadillo.PathControl.prototype.canDecorate = function() {
  return true;
};

/**
 * Decorates the given element into a path control.
 * @param  {Element}  element
 */
armadillo.PathControl.prototype.decorateInternal = function(element) {
  this.element_ = element;
  var components = this.path_.split('/');

  if (components.length == 2) {
    // If this is an item that lives at the root, generate a special node for
    // moving between items at the top level.
    components[0] = '/';
  } else {
    // Otherwise, just remove it as the first node will list all items at the
    // root.
    goog.array.removeAt(components, 0);
  }

  // If the last component is emtpy, do not use it because it means a directory
  // is being moved.
  if (components[components.length - 1] == '') {
    goog.array.removeAt(components, components.length - 1);
  }

  var path = '';
  goog.array.forEach(components, function (part, i) {
    if (i != components.length - 1) {
      this.addChild(this.createComponentNode_(path, part), true);
    } else {
      var input = new goog.ui.LabelInput(part, this.dom_);
      this.addChild(input, true);
      input.setEnabled(this.editableLastComponent_);
      input.setValue(part);
    }
    path += part + '/';
  }, this);
};

/**
 * Creates a node for a single path component.
 * @param  {string}  path  The path up to this point.
 * @param  {string}  name  The current component after |path|.
 */
armadillo.PathControl.prototype.createComponentNode_ = function(path, name) {
  var menu = new goog.ui.FilteredMenu();
  menu.setFilterLabel(name);
  menu.setAllowMultiple(false);
  menu.setOpenFollowsHighlight(true);
  this.fetchMenuContents_(path, name, menu);

  var button = new goog.ui.MenuButton(name, menu, null, this.dom_);
  button.setFocusablePopupMenu(true);
  button.setScrollOnOverflow(true);
  button.setVisible(true);
  return button;
};

/**
 * Queries the back-end for all the items at a given path and attaches them to
 * the given menu.
 * @param  {string}  path  The path to get a list of items in
 * @param  {string}  name  The name to select
 * @param  {goog.ui.Menu}  The menu to attach items to
 */
armadillo.PathControl.prototype.fetchMenuContents_ = function(path, name, menu) {
  var callback = function(e) {
    var data = e.target.getResponseJson();
    if (data['error']) {
      app.showError(data['message']);
      return;
    }
    if (path == '') {
      // If this is the root path element, make sure the root is accessible for
      // moving items.
      goog.array.insertAt(data, '/', 0);
    }
    goog.array.forEach(data, function (caption) {
      // It only makes sense to be able to move into directories.
      if (!app.isDirectory(caption)) {
        return;
      }
      var item = new goog.ui.MenuItem(caption);
      menu.addItem(item);
      if (caption == name) {
        menu.setHighlighted(item);
      }
    });
  };
  app.sendRequest('list', {'path':path}, callback);
};
