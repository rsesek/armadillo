package server

import (
  "fmt"
  "http"
  "io"
  "os"
  "path"
)

const kFrontEndFiles = "/Users/rsesek/Projects/armadillo/out/fe"

func testHandler(connection *http.Conn, request *http.Request) {
  fmt.Print("Got a request");
  io.WriteString(connection, "Hello world")
}

func indexHandler(connection *http.Conn, request *http.Request) {
  fd, err := os.Open(path.Join(kFrontEndFiles, "index.html"), os.O_RDONLY, 0)
  if err != nil {
    fmt.Print("Error opening file ", err.String(), "\n")
    return
  }
  io.Copy(connection, fd)
}

func RunFrontEnd() {
  mux := http.NewServeMux()
  mux.HandleFunc("/", indexHandler)
  mux.Handle("/fe/", http.FileServer(kFrontEndFiles, "/fe/"))
  mux.HandleFunc("/test", testHandler)

  error := http.ListenAndServe(":8084", mux)
  fmt.Printf("error %v", error)
}
