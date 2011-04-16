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
  parseEpisodeName(fileName)

  return safePath, nil
}

type episodeInfo struct {
  showName string
  season int
  episode int
}

// Parses the last path component into a the component structure.
func parseEpisodeName(name string) episodeInfo {
  regex := regexp.MustCompile("^([0-9]+_)?(.+)( |\\.)(S|s)?([0-9]+)[xeXE]([0-9]+)")
  matches := regex.FindAllString(name, 0)
  fmt.Printf("matches = %s\n", matches)
  return episodeInfo{ "", 0, 0 }
}
