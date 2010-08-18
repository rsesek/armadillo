package server

import (
  "fmt"
  "http"
  "io"
)

const kFrontEndFiles = "/Users/rsesek/Projects/armadillo/out/fe/"

func testHandler(connection *http.Conn, request *http.Request) {
  fmt.Print("Got a request");
  io.WriteString(connection, "Hello world")
}

func RunFrontEnd() {
  mux := http.NewServeMux()
  mux.Handle("/fe", http.FileServer(kFrontEndFiles, ""))
  mux.HandleFunc("/test", testHandler)
  // mux.Handle()
  error := http.ListenAndServe(":8084", mux)
  fmt.Printf("error %v", error)
}
