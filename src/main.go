//
// Armadillo File Manager
// Copyright (c) 2010, Robert Sesek <http://www.bluestatic.org>
// 
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

package main

import (
  "flag"
  "fmt"
  "./paths"
  "./server"
)

func main() {
  flag.StringVar(&paths.JailRoot, "jail", "/", "Restrict file operations to this directory root")
  flag.Parse()
  fmt.Printf("Starting Armadillo with root:\n  %v\n", paths.JailRoot)
  server.RunFrontEnd()
}
