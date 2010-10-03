//
// Armadillo File Manager
// Copyright (c) 2010, Robert Sesek <http://www.bluestatic.org>
// 
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

goog.provide('armadillo.PathControl');

goog.require('goog.ui.Component');
goog.require('goog.ui.FilteredMenu');
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
  delete components[0];  // Don't create an empty item.

  var path = '';
  goog.array.forEach(components, function (part) {
    this.addChild(this.createComponentNode_('/' + path, part), true);
    path += '/' + part;
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
  this.fetchMenuContents_(path, name, menu);

  var button = new goog.ui.MenuButton(name, menu, null, this.dom_);
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
    goog.array.forEach(data, function (caption) {
      var item = new goog.ui.MenuItem(caption);
      menu.addItem(item);
      if (caption == name) {
        menu.setHighlighted(item);
      }
    });
  };
  app.sendRequest('list', {'path':path}, callback);
};

