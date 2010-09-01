//
// Armadillo File Manager
// Copyright (c) 2010, Robert Sesek <http://www.bluestatic.org>
// 
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

package server

import (
  "fmt"
  "http"
  "io"
  "json"
  "os"
  "path"
  "./paths"
)

var dir, file = path.Split(path.Clean(os.Getenv("_")))
var kFrontEndFiles string = path.Join(dir, "fe")

func indexHandler(connection *http.Conn, request *http.Request) {
  fd, err := os.Open(path.Join(kFrontEndFiles, "index.html"), os.O_RDONLY, 0)
  if err != nil {
    fmt.Print("Error opening file ", err.String(), "\n")
    return
  }
  io.Copy(connection, fd)
}

func serviceHandler(connection *http.Conn, request *http.Request) {
  if request.Method != "POST" {
    io.WriteString(connection, "Error: Not a POST request")
    return
  }
  
  switch request.FormValue("action") {
    case "list":
      files, err := paths.List(request.FormValue("path"))
      if err != nil {
        errorResponse(connection, err.String())
      } else {
        okResponse(connection, files)        
      }
    default:
      errorResponse(connection, "Unhandled action")
  }  
}

func errorResponse(connection *http.Conn, message string) {
  response := map[string] string {
    "error": "-1",
    "message": message,
  }
  json_data, err := json.Marshal(response)

  connection.SetHeader("Content-Type", "text/json")
  if err != nil {
    io.WriteString(connection, "{\"error\":\"-9\",\"message\":\"Internal encoding error\"}")
  } else {
    connection.Write(json_data)
  }
}

func okResponse(connection *http.Conn, data interface{}) {
  connection.SetHeader("Content-Type", "text/json")
  json_data, err := json.Marshal(data)
  if err != nil {
    errorResponse(connection, "Internal encoding error")
  } else {
    connection.Write(json_data)
  }
}

func RunFrontEnd() {
  mux := http.NewServeMux()
  mux.HandleFunc("/", indexHandler)
  mux.Handle("/fe/", http.FileServer(kFrontEndFiles, "/fe/"))
  mux.HandleFunc("/service", serviceHandler)

  error := http.ListenAndServe(":8084", mux)
  fmt.Printf("error %v", error)
}
