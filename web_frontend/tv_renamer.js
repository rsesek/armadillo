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
  goog.base(this, 'disposeInternal');
  this.file_ = null;
};

/**
 * Performs the information lookup and renames the file if the lookup is
 * successful.
 */
armadillo.TVRenamer.prototype.run = function() {
  console.log('running for ' + this.file_.getName());
  var data = this.parseName_(this.file_.getName());
  if (!data) {
    app.showError('Could not parse episode information for ' + this.file_.getName());
    return;
  }
  var url = this.buildURL_(data[0], data[1], data[2]);
  console.log('url = ' + url);
  goog.net.XhrIo.send('/proxy?url=' + encodeURIComponent(url),
      goog.bind(this.lookupHandler_, this));
};

/**
 * Callback for when the network data is received.
 * @param  {Event}  e
 * @private
 */
armadillo.TVRenamer.prototype.lookupHandler_ = function(e) {
  var response = e.target.getResponseText();
  var tags = {};
  goog.array.forEach(response.split('\n'), function (line) {
    if (line.length > 0) {
      var parts = line.split('@', 2);
      tags[parts[0]] = parts[1];
    }
  });

  if (tags['Show Name'] && tags['Episode Info']) {
    var episode = tags['Episode Info'].split('^');
    // Strip off leading zeros from the season number.
    while (episode[0].charAt(0) == '0') {
      episode[0] = episode[0].substr(1);
    }
    var name = tags['Show Name'] + ' - ' + episode[0] + ' - ' + episode[1];
    this.rename_(name);
  }
};

/**
 * Parses the TV episode data out of the name.
 * @param  {string!}  name  The current file name.
 * @returns  {Tuple|null}  Returns a tuple (show,season,episode) on success,
                           NULL on failure
 * @private
 */
armadillo.TVRenamer.prototype.parseName_ = function(name) {
  var pattern = /^(\d+_)?(.+)( |\.)S?(\d+)(x|E)(\d+)/i;
  var matches = name.match(pattern);
  console.log(matches);
  if (!matches || matches.length < 5)
    return null;
  // If the separator between the show title and episode is a period, then
  // it's likely of the form "some.show.name.s03e06.720p.blah.mkv", so strip the
  // periods in the title.
  if (matches[3] == '.')
    matches[2] = matches[2].replace('.', ' ');
  return [matches[2], parseInt(matches[4], 10), parseInt(matches[6], 10)];
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
  return "http://services.tvrage.com/tools/quickinfo.php?show=" +
      encodeURIComponent(show) + "&ep=" + season + "x" + episode;
};

/**
 * Performs the actual rename of the current file to the |newName|.
 * @param  {string!}  newName
 * @private
 */
armadillo.TVRenamer.prototype.rename_ = function(newName) {
  var path = app.joinPath(this.file_.getParentPath(),
      newName + this.file_.getExtension());
  this.file_.move(path);
};
