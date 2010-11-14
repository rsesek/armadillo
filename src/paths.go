//
// Armadillo File Manager
// Copyright (c) 2010, Robert Sesek <http://www.bluestatic.org>
// 
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

package paths

import (
  "container/vector"
  "os"
  "path"
  "strings"
  "./config"
)

var gConfig *config.Configuration

func SetConfig(aConfig *config.Configuration) {
  gConfig = aConfig
}

func canonicalizePath(raw_path string) string {
  raw_path = path.Join(gConfig.JailRoot, raw_path)
  return path.Clean(raw_path)
}

func checkInJail(the_path string) bool {
  if len(the_path) < len(gConfig.JailRoot) {
    return false
  }
  if the_path[0:len(gConfig.JailRoot)] != gConfig.JailRoot {
    return false
  }
  if strings.Index(the_path, "../") != -1 {
    return false
  }
  return true
}

func List(the_path string) (files vector.StringVector, err os.Error) {
  full_path := canonicalizePath(the_path)
  if !checkInJail(full_path) {
    return nil, os.NewError("Path outside of jail")
  }
  
  fd, file_error := os.Open(full_path, os.O_RDONLY, 0)
  if file_error != nil {
    return nil, file_error
  }
  
  fileinfos, read_err := fd.Readdir(-1)
  if read_err != nil {
    return nil, read_err
  }
  
  for _, info := range fileinfos {
    name := info.Name
    if info.IsDirectory() {
      name += "/"
    }
    if !gConfig.IncludeDotfiles && name[0] == '.' {
      continue
    }
    files.Push(name)
  }
  return files, nil
}

func Remove(the_path string) os.Error {
  full_path := canonicalizePath(the_path)
  if !checkInJail(full_path) {
    return os.NewError("Path outside of jail")
  }
  return os.RemoveAll(full_path)
}

func Move(source string, target string) os.Error {
  source = canonicalizePath(source)
  target = canonicalizePath(target)
  if !checkInJail(source) {
    return os.NewError("Source outside of jail")
  }
  if !checkInJail(target) {
    return os.NewError("Target outside of jail")
  }
  return os.Rename(source, target)
}
