//
// Armadillo File Manager
// Copyright (c) 2010, Robert Sesek <http://www.bluestatic.org>
// 
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

goog.provide('armadillo.TVRenamer');

goog.require('goog.Disposable');
goog.require('goog.net.XhrIo');

/**
 * Creates a helper to rename a file in a pretty format for TV episodes.
 * @extends  {goog.Disposable}
 * @constructor
 */
armadillo.TVRenamer = function(file) {
  goog.base(this);

  /**
   * The file object
   * @type  {armadillo.File}
   */
  this.file_ = file;
}
goog.inherits(armadillo.TVRenamer, goog.Disposable);

/**
 * @inheritDoc
 */
armadillo.TVRenamer.prototype.disposeInternal = function() {
  goog.base(this);
  this.file_ = null;
};

/**
 * Performs the information lookup and renames the file if the lookup is
 * successful.
 */
armadillo.TVRenamer.prototype.run = function() {
  console.log('running for ' + this.file_.getName());
  console.log(this.parseName_(this.file_.getName()));
  // goog.net.XhrIo.send();
};

/**
 * Callback for when the network data is received.
 * @private
 */
armadillo.TVRenamer.prototype.lookupHandler_ = function() {
};

/**
 * Parses the TV episode data out of the name.
 * @param  {string!}  name  The current file name.
 * @returns  {Tuple|null}  Returns a tuple (show,season,episode) on success,
                           NULL on failure
 * @private
 */
armadillo.TVRenamer.prototype.parseName_ = function(name) {
  var pattern = /^(\d+_)?(.+) S?(\d+)(x|E)(\d+)/;
  var matches = name.match(pattern);
  if (!matches || matches.length < 5)
    return null;
  return [matches[2], parseInt(matches[3]), parseInt(matches[5])];
};

/**
 * Builds the query URL.
 * @param  {string!}  show  Show name
 * @param  {number!}  season  Season number
 * @param  {number!}  episode  Episode number
 * @returns  {string}
 * @private
 */
armadillo.TVRenamer.prototype.buildURL_ = function(show, season, episode) {
  return "http://services.tvrage.com/tools/quickinfo.php?show=" + show +
      "&ep=" + season + "x" + episode;
};
