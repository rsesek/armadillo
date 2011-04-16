//
// Armadillo File Manager
// Copyright (c) 2011, Robert Sesek <http://www.bluestatic.org>
// 
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

package tv_rename

import (
  "bufio"
  "fmt"
  "http"
  "net"
  "os"
  "path"
  "regexp"
  "strconv"
  "strings"
  "./paths"
)

// Takes a full file path and renames the last path component as if it were a
// TV episode. This performs the actual rename as well.
func RenameEpisode(inPath string) (*string, os.Error) {
  // Make sure a path was given.
  if len(inPath) < 1 {
    return nil, os.NewError("Invalid path")
  }
  // Check that it's inside the jail.
  var safePath *string = paths.Verify(inPath)
  if safePath == nil {
    return nil, os.NewError("Path is invalid or outside of jail")
  }
  // Make sure that the file exists.
  _, err := os.Stat(*safePath)
  if err != nil {
    return nil, err
  }

  // Parse the filename into its components.
  dirName, fileName := path.Split(*safePath)
  info := parseEpisodeName(fileName)
  if info == nil {
    return nil, os.NewError("Could not parse file name")
  }

  // Create the URL and perform the lookup.
  queryURL := buildURL(info)
  response, err := performLookup(queryURL)
  if err != nil {
    return nil, err
  }

  // Parse the response into the fullEpisodeInfo struct.
  fullInfo := parseResponse(response)

  // Create the new path.
  newName := fmt.Sprintf("%s - %dx%02d - %s", fullInfo.episode.showName,
      fullInfo.episode.season, fullInfo.episode.episode, fullInfo.episodeName)
  newName = strings.Replace(newName, "/", "_", -1)
  newName += path.Ext(fileName)
  newPath := path.Join(dirName, newName)

  return &newPath, nil
}

type episodeInfo struct {
  showName string
  season int
  episode int
}

type fullEpisodeInfo struct {
  episode episodeInfo
  episodeName string
}

// Parses the last path component into a the component structure.
func parseEpisodeName(name string) *episodeInfo {
  regex := regexp.MustCompile("(.+)( |\\.)[sS]?([0-9]+)[xeXE]([0-9]+)")
  matches := regex.FindAllStringSubmatch(name, -1)
  if len(matches) < 1 || len(matches[0]) < 4 {
    return nil
  }

  // Convert the season and episode numbers to integers.
  season, episode := convertEpisode(matches[0][3], matches[0][4])
  if season == 0 && season == episode {
    return nil
  }

  // If the separator between the show title and episode is a period, then
  // it's likely of the form "some.show.name.s03e06.720p.blah.mkv", so strip the
  // periods in the title.
  var showName string = matches[0][1]
  if matches[0][2] == "." {
    showName = strings.Replace(matches[0][1], ".", " ", -1)
  }

  return &episodeInfo {
    showName,
    season,
    episode,
  }
}

// Builds the URL to which we send a HTTP request to get the episode name.
func buildURL(info *episodeInfo) string {
  return fmt.Sprintf("http://services.tvrage.com/tools/quickinfo.php?show=%s&ep=%dx%d",
      http.URLEscape(info.showName), info.season, info.episode)
}

// Converts a season and episode to integers. If the return values are both 0,
// an error occurred.
func convertEpisode(season string, episode string) (int, int) {
  seasonInt, err := strconv.Atoi(season)
  if err != nil {
    return 0, 0
  }
  episodeInt, err := strconv.Atoi(episode)
  if err != nil {
    return 0, 0
  }
  return seasonInt, episodeInt
}

// Performs the actual lookup and returns the HTTP response.
func performLookup(urlString string) (*http.Response, os.Error) {
  url, err := http.ParseURL(urlString)
  if err != nil {
    return nil, err
  }

  // Open a TCP connection.
  conn, err := net.Dial("tcp", "", url.Host + ":" + url.Scheme)
  if err != nil {
    return nil, err
  }

  // Perform the HTTP request.
  client := http.NewClientConn(conn, nil)
  var request http.Request
  request.URL = url
  request.Method = "GET"
  request.UserAgent = "Armadillo File Manager"
  err = client.Write(&request)
  if err != nil {
    return nil, err
  }
  return client.Read()
}

// Parses the HTTP response from performLookup().
func parseResponse(response *http.Response) *fullEpisodeInfo {
  var err os.Error
  var line string
  var info fullEpisodeInfo

  buf := bufio.NewReader(response.Body)
  for ; err != os.EOF; line, err = buf.ReadString('\n') {
    // An error ocurred while reading.
    if err != nil {
      return nil
    }
    var parts []string = strings.Split(line, "@", 2)
    if len(parts) != 2 {
      continue
    }
    switch parts[0] {
      case "Show Name":
        info.episode.showName = parts[1]
      case "Episode Info":
        // Split the line, which is of the form: |SxE^Name^AirDate|.
        parts = strings.Split(parts[1], "^", 3)
        info.episodeName = parts[1]
        // Split the episode string.
        episode := strings.Split(parts[0], "x", 2)
        info.episode.season, info.episode.episode = convertEpisode(episode[0], episode[1])
        if info.episode.season == 0 && info.episode.season == info.episode.episode {
          return nil
        }
    }
  }
  return &info
}
