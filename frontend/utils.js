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

// Not all browsers (notably Safari) support ES5 Function.bind(). This is a
// rough approximation from:
// <https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind>.
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1);
    var fToBind = this;
    var fNOP = function () {};
    var fBound = function () {
      return fToBind.apply(this instanceof fNOP ? this : oThis || window,
                           aArgs.concat(Array.prototype.slice.call(arguments)));
    };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();
    return fBound;
  };
}
