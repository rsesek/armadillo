//
// Armadillo File Manager
// Copyright (c) 2011, Robert Sesek <http://www.bluestatic.org>
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

$.extend({
  /**
   * Defines a namespace.
   * @param {string} ns
   */
  namespace: function(ns) {
    var parent = window;
    this.each(ns.split('.'), function (i, space) {
      parent[space] = parent[space] || {};
      parent = parent[space];
    });
  },

  /**
   * Shortcut for creating a DOM element.
   * @param {string} elm
   */
  createDom: function(elm) {
    return this(document.createElement(elm));
  }
});
