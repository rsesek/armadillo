//
// Armadillo File Manager
// Copyright (c) 2010, Robert Sesek <http://www.bluestatic.org>
// 
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

package config

import (
  "json"
  "os"
)

type Configuration struct {
  JailRoot string
  Port int
  ProxyURLs []string
  Users map [string] string
}

func ReadFromFile(aPath string, config *Configuration) os.Error {
  fd, error := os.Open(aPath, os.O_RDONLY, 0)
  if error != nil {
    return error
  }
  decoder := json.NewDecoder(fd)
  return decoder.Decode(config)
}
