package paths

import (
  "container/vector"
  "os"
  "path"
)

const kJailRoot = "/Users/rsesek/Downloads"

func canonicalizePath(raw_path string) string {
  raw_path = path.Join(kJailRoot, raw_path)
  return path.Clean(raw_path)
}

func checkInJail(path string) bool {
  return true
}

func List(the_path string) (files vector.StringVector, err os.Error) {
  full_path := canonicalizePath(the_path)
  if !checkInJail(full_path) {
    return nil, os.NewError("path outside of jail")
  }
  
  fd, file_error := os.Open(full_path, os.O_RDONLY, 0)
  if file_error != nil {
    return nil, file_error
  }
  
  fileinfos, read_err := fd.Readdir(-1)
  if read_err != nil {
    return nil, read_err
  }
  
  for _, info := range fileinfos {
    files.Push(info.Name)
  }
  return files, nil
}
