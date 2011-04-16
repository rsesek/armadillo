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
  var path *string = paths.Verify(inPath)
  if path == nil {
    return nil, os.NewError("Path is invalid or outside of jail")
  }
  // Make sure that the file exists.
  fileInfo, err := os.Stat(*path)
  if err != nil {
    return nil, err
  }
  return path, nil
}
