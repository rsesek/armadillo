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
  "./config"
  "./paths"
  "./server"
)

func main() {
  var configPath *string = flag.String("config", "~/.armadillo", "Path to the configuration file")
  flag.StringVar(&paths.JailRoot, "jail", "/", "Restrict file operations to this directory root")
  var port *int = flag.Int("port", 8080, "Port to run the server on")
  flag.Parse()

  var configuration = new(config.Configuration)
  fmt.Printf("Reading configuration from %v\n", *configPath)
  if len(*configPath) > 0 {
    error := config.ReadFromFile(*configPath, configuration)
    if error != nil {
      fmt.Printf("Error while reading configuration: %v\n", error)
    }
  }

  configuration.JailRoot = paths.JailRoot
  configuration.Port = *port

  fmt.Printf("Starting Armadillo on port %d with root:\n  %v\n", *port, paths.JailRoot)
  server.RunFrontEnd(configuration)
}
