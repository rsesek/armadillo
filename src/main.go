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
  var port *int = flag.Int("port", 8080, "Port to run the server on")
  flag.Parse()
  fmt.Printf("Starting Armadillo on port %d with root:\n  %v\n", *port, paths.JailRoot)
  server.RunFrontEnd(*port)
}
