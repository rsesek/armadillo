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
  // Set up the basic flags.
  var configPath *string = flag.String("config", "~/.armadillo", "Path to the configuration file")
  var jailRoot *string = flag.String("jail", "", "Restrict file operations to this directory root")
  var port *int = flag.Int("port", 0, "Port to run the server on")
  flag.Parse()

  // Load the configuration file, if it is present.
  var configuration = new(config.Configuration)
  fmt.Printf("Reading configuration from %v\n", *configPath)
  if len(*configPath) > 0 {
    error := config.ReadFromFile(*configPath, configuration)
    if error != nil {
      fmt.Printf("Error while reading configuration: %v\n", error)
    }
  }

  // Override configuration values with command line arguments.
  if *jailRoot != "" {
    configuration.JailRoot = *jailRoot
  }
  if *port != 0 {
    configuration.Port = *port
  }

  // Run the server.
  fmt.Printf("Starting Armadillo on port %d with root:\n  %v\n",
      configuration.Port, configuration.JailRoot)
  paths.SetConfig(configuration)
  server.RunBackEnd(configuration)
}
