//
// Armadillo File Manager
// Copyright (c) 2010-2012, Robert Sesek <http://www.bluestatic.org>
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

package server

import (
	"encoding/json"
	"fmt"
	"github.com/rsesek/armadillo/config"
	"io"
	"net/http"
	"os"
	"path"
	"runtime"
	"strings"
)

var (
	kFrontEndFiles string
	gConfig        *config.Configuration
)

func init() {
	_, thisFile, _, ok := runtime.Caller(0)
	if !ok {
		panic("unable to get file information from runtime.Caller so the frontend files cannot be found")
	}
	// thisFile = /armadillo/server/server.go, so compute /armadillo/frontend/
	kFrontEndFiles = path.Join(path.Dir(path.Dir(thisFile)), "frontend")
}

func indexHandler(response http.ResponseWriter, request *http.Request) {
	fd, err := os.Open(path.Join(kFrontEndFiles, "index.html"))
	if err != nil {
		fmt.Print("Error opening file ", err.Error(), "\n")
		return
	}
	defer fd.Close()

	response.Header().Set("Content-Type", "text/html")
	io.Copy(response, fd)
}

func serviceHandler(response http.ResponseWriter, request *http.Request) {
	if request.Method != "POST" {
		io.WriteString(response, "Error: Not a POST request")
		return
	}

	switch request.FormValue("action") {
	case "list":
		files, err := ListPath(request.FormValue("path"))
		if err != nil {
			errorResponse(response, err.Error())
		} else {
			okResponse(response, files)
		}
	case "remove":
		err := RemovePath(request.FormValue("path"))
		if err != nil {
			errorResponse(response, err.Error())
		} else {
			data := map[string]int{
				"error": 0,
			}
			okResponse(response, data)
		}
	case "move":
		source := request.FormValue("source")
		target := request.FormValue("target")
		err := MovePath(source, target)
		if err != nil {
			errorResponse(response, err.Error())
		} else {
			data := map[string]interface{}{
				"path":  target,
				"error": 0,
			}
			okResponse(response, data)
		}
	case "mkdir":
		path := request.FormValue("path")
		err := MakeDir(path)
		if err != nil {
			errorResponse(response, err.Error())
		} else {
			data := map[string]interface{}{
				"path":  path,
				"error": 0,
			}
			okResponse(response, data)
		}
	case "tv_rename":
		newPath, err := RenameTVEpisode(request.FormValue("path"))
		if err != nil {
			errorResponse(response, err.Error())
		} else {
			data := map[string]interface{}{
				"path":  *newPath,
				"error": 0,
			}
			okResponse(response, data)
		}
	default:
		fmt.Printf("Invalid action: '%s'\n", request.FormValue("action"))
		errorResponse(response, "Unhandled action")
	}
}

func downloadHandler(response http.ResponseWriter, request *http.Request) {
	valid, fullPath := IsValidPath(request.FormValue("path"))
	if valid {
		info, _ := os.Lstat(fullPath) // Error is already checked by |valid|.
		if info.IsDir() {
			http.Error(response, "Path is a directory", http.StatusBadRequest)
		} else {
			http.ServeFile(response, request, fullPath)
		}
	} else {
		http.NotFound(response, request)
	}
}

func errorResponse(response http.ResponseWriter, message string) {
	message = strings.Replace(message, gConfig.JailRoot, "/", -1)
	data := map[string]interface{}{
		"error":   -1,
		"message": message,
	}
	json_data, err := json.Marshal(data)

	response.Header().Set("Content-Type", "text/json")
	if err != nil {
		io.WriteString(response, "{\"error\":\"-9\",\"message\":\"Internal encoding error\"}")
	} else {
		response.Write(json_data)
	}
}

func okResponse(response http.ResponseWriter, data interface{}) {
	response.Header().Set("Content-Type", "text/json")
	json_data, err := json.Marshal(data)
	if err != nil {
		errorResponse(response, "Internal encoding error")
	} else {
		response.Write(json_data)
	}
}

func RunBackEnd(c *config.Configuration) {
	gConfig = c

	mux := http.NewServeMux()
	mux.HandleFunc("/", indexHandler)
	mux.Handle("/fe/", http.StripPrefix("/fe/", http.FileServer(http.Dir(kFrontEndFiles))))
	mux.HandleFunc("/service", serviceHandler)
	mux.HandleFunc("/download", downloadHandler)

	error := http.ListenAndServe(fmt.Sprintf(":%d", gConfig.Port), mux)
	fmt.Printf("error %v", error)
}
