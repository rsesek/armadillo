//
// Armadillo File Manager
// Copyright (c) 2010-2011, Robert Sesek <http://www.bluestatic.org>
// 
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

$.namespace('armadillo.TVRenamer');

/**
 * Creates a helper to rename a file in a pretty format for TV episodes.
 * @extends  {goog.Disposable}
 * @constructor
 */
armadillo.TVRenamer = function(file) {
  /**
   * The file object
   * @type  {armadillo.File}
   */
  this.file_ = file;
}

/**
 * Performs the information lookup and renames the file if the lookup is
 * successful.
 */
armadillo.TVRenamer.prototype.run = function() {
  var file = this.file_;
  var callback = function(data, stauts, xhr) {
    if (data['error']) {
      app.showError(data['message']);
    } else {
      app.clearError();
      file.move(data['path']);
    }
  };
  app.sendRequest('tv_rename', {'path':this.file_.getFullPath()},
      callback);
};
