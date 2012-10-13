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

func canonicalizePath(raw string) string {
	return path.Clean(path.Join(gConfig.JailRoot, raw))
}

func checkInJail(p string) bool {
	if len(p) < len(gConfig.JailRoot) {
		return false
	}
	if p[0:len(gConfig.JailRoot)] != gConfig.JailRoot {
		return false
	}
	if strings.Index(p, "../") != -1 {
		return false
	}
	return true
}

func IsValidPath(p string) (bool, string) {
	p = canonicalizePath(p)
	_, err := os.Lstat(p)
	return err == nil && checkInJail(p), p
}

func ListPath(p string) (files []string, err error) {
	p = canonicalizePath(p)
	if !checkInJail(p) {
		return nil, errors.New("Path outside of jail")
	}

	f, err := os.Open(p)
	if err != nil {
		return
	}
	defer f.Close()

	fileinfos, err := f.Readdir(-1)
	if err != nil {
		return
	}

	files = make([]string, 0)
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

func RemovePath(p string) error {
	p = canonicalizePath(p)
	if !checkInJail(p) {
		return errors.New("Path outside of jail")
	}
	return os.RemoveAll(p)
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
