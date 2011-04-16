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
  "net"
  "os"
  "path"
  "strings"
  "./config"
  "./paths"
  "./tv_rename"
)

var dir, file = path.Split(path.Clean(os.Getenv("_")))
var kFrontEndFiles string = path.Join(dir, "fe")
var gConfig *config.Configuration = nil

func indexHandler(response http.ResponseWriter, request *http.Request) {
  fd, err := os.Open(path.Join(kFrontEndFiles, "index.html"), os.O_RDONLY, 0)
  if err != nil {
    fmt.Print("Error opening file ", err.String(), "\n")
    return
  }
  io.Copy(response, fd)
}

func serviceHandler(response http.ResponseWriter, request *http.Request) {
  if request.Method != "POST" {
    io.WriteString(response, "Error: Not a POST request")
    return
  }
  
  switch request.FormValue("action") {
    case "list":
      files, err := paths.List(request.FormValue("path"))
      if err != nil {
        errorResponse(response, err.String())
      } else {
        okResponse(response, files)        
      }
    case "remove":
      err := paths.Remove(request.FormValue("path"))
      if err != nil {
        errorResponse(response, err.String())
      } else {
        data := map[string] int {
          "error" : 0,
        }
        okResponse(response, data)
      }
    case "move":
      source := request.FormValue("source")
      target := request.FormValue("target")
      err := paths.Move(source, target)
      if err != nil {
        errorResponse(response, err.String())
      } else {
        data := map[string] interface{} {
          "path" : target,
          "error" : 0,
        }
        okResponse(response, data)
      }
    case "tv_rename":
      newPath, err := tv_rename.RenameEpisode(request.FormValue("path"))
      if err != nil {
        errorResponse(response, err.String())
      } else {
        data := map[string] interface{} {
          "path" : *newPath,
          "error" : 0,
        }
        okResponse(response, data)
      }
    default:
      fmt.Printf("Invalid action: '%s'\n", request.FormValue("action"))
      errorResponse(response, "Unhandled action")
  }  
}

func proxyHandler(response http.ResponseWriter, request *http.Request) {
  rawURL := request.FormValue("url")
  if len(rawURL) < 1 {
    return
  }

  var validURL bool = false
  for i := range gConfig.ProxyURLs {
    allowedURL := gConfig.ProxyURLs[i]
    validURL = validURL || strings.HasPrefix(rawURL, allowedURL)
  }

  if !validURL {
    errorResponse(response, "URL is not in proxy whitelist")
    return
  }

  url, err := http.ParseURL(rawURL)
  if err != nil {
    errorResponse(response, err.String())
    return
  }
  err = performProxy(url, response, request)
  if err != nil {
    errorResponse(response, err.String())
  }
}

func performProxy(url *http.URL, response http.ResponseWriter, origRequest *http.Request) os.Error {
  conn, err := net.Dial("tcp", "", url.Host + ":http")
  if err != nil {
    return err
  }
  client := http.NewClientConn(conn, nil)
  var request http.Request
  request.URL = url
  request.Method = "GET"
  request.UserAgent = origRequest.UserAgent
  err = client.Write(&request)
  if err != nil {
    return err
  }
  var proxyResponse *http.Response
  proxyResponse, err = client.Read()
  if err != nil && err != http.ErrPersistEOF {
    return err
  }
  _, err = io.Copy(response, proxyResponse.Body)
  return err
}

func errorResponse(response http.ResponseWriter, message string) {
  message = strings.Replace(message, gConfig.JailRoot, "/", -1)
  data := map[string] interface{} {
    "error"   : -1,
    "message" : message,
  }
  json_data, err := json.Marshal(data)

  response.SetHeader("Content-Type", "text/json")
  if err != nil {
    io.WriteString(response, "{\"error\":\"-9\",\"message\":\"Internal encoding error\"}")
  } else {
    response.Write(json_data)
  }
}

func okResponse(response http.ResponseWriter, data interface{}) {
  response.SetHeader("Content-Type", "text/json")
  json_data, err := json.Marshal(data)
  if err != nil {
    errorResponse(response, "Internal encoding error")
  } else {
    response.Write(json_data)
  }
}

func RunBackEnd(config *config.Configuration) {
  mux := http.NewServeMux()
  mux.HandleFunc("/", indexHandler)
  mux.Handle("/fe/", http.FileServer(kFrontEndFiles, "/fe/"))
  mux.HandleFunc("/service", serviceHandler)
  mux.HandleFunc("/proxy", proxyHandler)

  gConfig = config

  error := http.ListenAndServe(fmt.Sprintf(":%d", config.Port), mux)
  fmt.Printf("error %v", error)
}
