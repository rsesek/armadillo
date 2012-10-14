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
	"fmt"
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

func ListPath(op string) (files []string, err error) {
	p := canonicalizePath(op)
	if !checkInJail(p) {
		return nil, fmt.Errorf("Path outside of jail: %q", op)
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

func RemovePath(op string) error {
	p := canonicalizePath(op)
	if !checkInJail(p) {
		return fmt.Errorf("Path outside of jail: %q", op)
	}
	return os.RemoveAll(p)
}

func MovePath(oSource string, oTarget string) error {
	source := canonicalizePath(oSource)
	target := canonicalizePath(oTarget)
	if !checkInJail(source) {
		return fmt.Errorf("Source outside of jail: %q", oSource)
	}
	if !checkInJail(target) {
		return fmt.Errorf("Target outside of jail: %q", oTarget)
	}
	return os.Rename(source, target)
}

func MakeDir(oTarget string) error {
	target := canonicalizePath(oTarget)
	if !checkInJail(target) {
		return fmt.Errorf("Path outside of jail: %q", oTarget)
	}
	return os.Mkdir(target, 0755)
}
