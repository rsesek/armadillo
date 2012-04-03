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
	"errors"
	"os"
	"path"
	"strings"
)

func canonicalizePath(raw_path string) string {
	raw_path = path.Join(gConfig.JailRoot, raw_path)
	return path.Clean(raw_path)
}

func checkInJail(the_path string) bool {
	if len(the_path) < len(gConfig.JailRoot) {
		return false
	}
	if the_path[0:len(gConfig.JailRoot)] != gConfig.JailRoot {
		return false
	}
	if strings.Index(the_path, "../") != -1 {
		return false
	}
	return true
}

func IsValidPath(path string) (bool, string) {
	path = canonicalizePath(path)
	_, err := os.Lstat(path)
	return err == nil && checkInJail(path), path
}

func ListPath(the_path string) (files []string, err error) {
	full_path := canonicalizePath(the_path)
	if !checkInJail(full_path) {
		return nil, errors.New("Path outside of jail")
	}

	fd, file_error := os.Open(full_path)
	if file_error != nil {
		return nil, file_error
	}
	defer fd.Close()

	fileinfos, read_err := fd.Readdir(-1)
	if read_err != nil {
		return nil, read_err
	}

	for _, info := range fileinfos {
		name := info.Name()
		if info.IsDir() {
			name += "/"
		}
		if !gConfig.IncludeDotfiles && name[0] == '.' {
			continue
		}
		files = append(files, name)
	}
	return files, nil
}

func RemovePath(the_path string) error {
	full_path := canonicalizePath(the_path)
	if !checkInJail(full_path) {
		return errors.New("Path outside of jail")
	}
	return os.RemoveAll(full_path)
}

func MovePath(source string, target string) error {
	source = canonicalizePath(source)
	target = canonicalizePath(target)
	if !checkInJail(source) {
		return errors.New("Source outside of jail")
	}
	if !checkInJail(target) {
		return errors.New("Target outside of jail")
	}
	return os.Rename(source, target)
}

func MakeDir(target string) error {
	target = canonicalizePath(target)
	if !checkInJail(target) {
		return errors.New("Path outside of jail")
	}
	return os.Mkdir(target, 0755)
}
