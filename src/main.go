
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
