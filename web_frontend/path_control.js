//
// Armadillo File Manager
// Copyright (c) 2010, Robert Sesek <http://www.bluestatic.org>
// 
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

goog.provide('armadillo.PathControl');
goog.provide('armadillo.PathControl.NameControlRenderer_');

goog.require('goog.array');
goog.require('goog.ui.Control');
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
  goog.ui.Control.call(this, opt_domHelper);

  this.setHandleMouseEvents(false);
  this.setSupportedState(goog.ui.Component.State.FOCUSED, false);

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

  /**
   * Event Handler
   * @type  {goog.events.EventHandler}
   */
  this.eh_ = new goog.events.EventHandler();
};
goog.inherits(armadillo.PathControl, goog.ui.Control);

/**
 * Disposer
 * @protected
 */
armadillo.PathControl.prototype.disposeInternal = function() {
  armadillo.PathControl.superClass_.disposeInternal.call(this);
  this.nameControl_ = null;

  this.eh_.dispose();
  this.eh_ = null;
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

  // If this is an item that lives at the root, generate a special node for
  // moving between items at the top level.
  components[0] = '/';

  // If the last component is emtpy, do not use it because it means a directory
  // is being moved.
  if (components[components.length - 1] == '') {
    goog.array.removeAt(components, components.length - 1);
  }

  var path = '';
  goog.array.forEach(components, function (part, i) {
    this.addChild(this.createComponentNode_(path, part), true);
    path = app.joinPath(path, part);
  }, this);

  if (this.editableLastComponent_) {
    var attrs = {
      'type' : 'text',
      'name' : 'pathName',
      'value' : this.name_
    };
    this.nameControl_ = new goog.ui.Control(this.dom_.createDom('input', attrs),
        new armadillo.PathControl.NameControlRenderer_());
    this.nameControl_.setAllowTextSelection(true);
    this.nameControl_.setHandleMouseEvents(false);
    this.addChild(this.nameControl_, true);

    this.eh_.listen(this.nameControl_.getElement(), goog.events.EventType.CHANGE,
        this.nameChanged_, false, this);
    this.eh_.listen(this.nameControl_.getElement(), goog.events.EventType.KEYDOWN,
        this.nameChanged_, false, this);
  } else {
    this.nameControl_ = new goog.ui.Control(this.name_);
    this.addChild(this.nameControl_, true);
  }
  goog.dom.classes.add(this.nameControl_.getElement(), 'goog-inline-block');
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
  var menu = new goog.ui.FilteredMenu();
  menu.setFilterLabel(name);
  menu.setAllowMultiple(false);
  menu.setOpenFollowsHighlight(true);
  goog.events.listen(menu, goog.ui.Component.EventType.ACTION,
      this.componentChanged_, false, this);
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
      item.setValue(app.joinPath(path, name, caption));
      menu.addItem(item);
      if (caption == name) {
        menu.setHighlighted(item);
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
  this.path_ = e.target.getValue();
  this.removeChildren(true);
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

/**
 * Renderer for the Name Control of the Path Control
 * @constructor_
 */
armadillo.PathControl.NameControlRenderer_ = function() {
  goog.ui.ControlRenderer.call(this);
};
goog.inherits(armadillo.PathControl.NameControlRenderer_, goog.ui.ControlRenderer);

armadillo.PathControl.NameControlRenderer_.prototype.createDom = function(control) {
  var content = control.getContent();
  if (content instanceof HTMLElement) {
    return content;
  }
  return armadillo.PathControl.NameControlRenderer_.superClass_.createDom.call(this, control);
};
