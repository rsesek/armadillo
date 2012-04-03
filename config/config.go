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
	// The path to which all file operations are restricted.
	JailRoot string

	// The port on which the server back end runs.
	Port int

	// An array of URLs that the /proxy service will for which the back-end will
	// forward GET requests and return the result.
	ProxyURLs []string

	// Whether to include dotfiles (files that begin with a '.'). Users will still
	// be able to access directories that begin with a '.', but they will not be
	// included in the list.
	IncludeDotfiles bool
}

func ReadFromFile(aPath string, config *Configuration) os.Error {
	fd, error := os.Open(aPath)
	if error != nil {
		return error
	}
	defer fd.Close()

	decoder := json.NewDecoder(fd)
	return decoder.Decode(config)
}
