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

func indexHandler(rw http.ResponseWriter, request *http.Request) {
	fd, err := os.Open(path.Join(kFrontEndFiles, "index.html"))
	if err != nil {
		fmt.Print("Error opening file ", err.Error(), "\n")
		return
	}
	defer fd.Close()

	rw.Header().Set("Content-Type", "text/html")
	io.Copy(rw, fd)
}

func listService(rw http.ResponseWriter, req *http.Request) {
	if !requestIsPOST(rw, req) {
		return
	}

	files, err := ListPath(req.FormValue("path"))
	if err != nil {
		httpError(rw, err.Error(), http.StatusNotFound)
	} else {
		okResponse(rw, files)
	}
}

func removeService(rw http.ResponseWriter, req *http.Request) {
	if !requestIsPOST(rw, req) {
		return
	}

	err := RemovePath(req.FormValue("path"))
	if err != nil {
		httpError(rw, err.Error(), http.StatusNotFound)
	} else {
		data := map[string]int{
			"error": 0,
		}
		okResponse(rw, data)
	}
}

func moveService(rw http.ResponseWriter, req *http.Request) {
	if !requestIsPOST(rw, req) {
		return
	}

	source := req.FormValue("source")
	target := req.FormValue("target")
	err := MovePath(source, target)
	if err != nil {
		httpError(rw, err.Error(), http.StatusNotFound)
	} else {
		data := map[string]interface{}{
			"path":  target,
			"error": 0,
		}
		okResponse(rw, data)
	}
}

func mkdirService(rw http.ResponseWriter, req *http.Request) {
	if !requestIsPOST(rw, req) {
		return
	}

	path := req.FormValue("path")
	err := MakeDir(path)
	if err != nil {
		httpError(rw, err.Error(), http.StatusUnauthorized)
	} else {
		data := map[string]interface{}{
			"path":  path,
			"error": 0,
		}
		okResponse(rw, data)
	}
}

func tvRenameService(rw http.ResponseWriter, req *http.Request) {
	if !requestIsPOST(rw, req) {
		return
	}

	newPath, err := RenameTVEpisode(req.FormValue("path"))
	if err != nil {
		httpError(rw, err.Error(), http.StatusBadRequest)
	} else {
		data := map[string]interface{}{
			"path":  newPath,
			"error": 0,
		}
		okResponse(rw, data)
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

func httpError(rw http.ResponseWriter, message string, code int) {
	message = strings.Replace(message, gConfig.JailRoot, "/", -1)
	rw.WriteHeader(code)
	rw.Header().Set("Content-Type", "text/plain")
	fmt.Fprint(rw, message)
}

func okResponse(rw http.ResponseWriter, data interface{}) {
	rw.Header().Set("Content-Type", "application/json")
	jsonData, err := json.Marshal(data)
	if err != nil {
		httpError(rw, "Internal error: " + err.Error(), 500)
	} else {
		rw.Write(jsonData)
	}
}

func requestIsPOST(rw http.ResponseWriter, req *http.Request) bool {
	if req.Method != "POST" {
		httpError(rw, "Service requests must be sent via POST", http.StatusMethodNotAllowed)
		return false
	}
	return true
}

func RunBackEnd(c *config.Configuration) {
	gConfig = c

	mux := http.NewServeMux()
	mux.HandleFunc("/", indexHandler)
	mux.Handle("/fe/", http.StripPrefix("/fe/", http.FileServer(http.Dir(kFrontEndFiles))))
	mux.HandleFunc("/service/list", listService)
	mux.HandleFunc("/service/move", moveService)
	mux.HandleFunc("/service/remove", removeService)
	mux.HandleFunc("/service/mkdir", mkdirService)
	mux.HandleFunc("/service/tv_rename", tvRenameService)
	mux.HandleFunc("/download", downloadHandler)

	error := http.ListenAndServe(fmt.Sprintf(":%d", gConfig.Port), mux)
	fmt.Printf("error %v", error)
}
