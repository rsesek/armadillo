//
// Armadillo File Manager
// Copyright (c) 2011, Robert Sesek <http://www.bluestatic.org>
// 
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

package tv_rename

import (
  "fmt"
  "os"
  "path"
  "regexp"
  "strconv"
  "strings"
  "./paths"
)

// Takes a full file path and renames the last path component as if it were a
// TV episode. This performs the actual rename as well.
func RenameEpisode(inPath string) (*string, os.Error) {
  // Make sure a path was given.
  if len(inPath) < 1 {
    return nil, os.NewError("Invalid path")
  }
  // Check that it's inside the jail.
  var safePath *string = paths.Verify(inPath)
  if safePath == nil {
    return nil, os.NewError("Path is invalid or outside of jail")
  }
  // Make sure that the file exists.
  _, err := os.Stat(*safePath)
  if err != nil {
    return nil, err
  }

  // Parse the filename into its components.
  _, fileName := path.Split(*safePath)
  info := parseEpisodeName(fileName)
  if info == nil {
    return nil, os.NewError("Could not parse file name")
  }
  fmt.Print("info = ", *info)

  return safePath, nil
}

type episodeInfo struct {
  showName string
  season int
  episode int
}

// Parses the last path component into a the component structure.
func parseEpisodeName(name string) *episodeInfo {
  regex := regexp.MustCompile("(.+)( |\\.)[sS]?([0-9]+)[xeXE]([0-9]+)")
  matches := regex.FindAllStringSubmatch(name, -1)
  if len(matches) < 1 || len(matches[0]) < 4 {
    return nil
  }

  // Convert the season and episode numbers to integers.
  season, err := strconv.Atoi(matches[0][3])
  if err != nil {
    return nil
  }
  episode, err := strconv.Atoi(matches[0][4])
  if err != nil {
    return nil
  }

  // If the separator between the show title and episode is a period, then
  // it's likely of the form "some.show.name.s03e06.720p.blah.mkv", so strip the
  // periods in the title.
  var showName string = matches[0][1]
  if matches[0][2] == "." {
    showName = strings.Replace(matches[0][1], ".", " ", -1)
  }

  return &episodeInfo {
    showName,
    season,
    episode,
  }
}
