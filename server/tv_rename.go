//
// Armadillo File Manager
// Copyright (c) 2011-2012, Robert Sesek <http://www.bluestatic.org>
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or any later version.
//

package server

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"path"
	"regexp"
	"strconv"
	"strings"
)

// Takes a full file path and renames the last path component as if it were a
// TV episode. This performs the actual rename as well.
func RenameTVEpisode(inPath string) (string, error) {
	// Parse the filename into its components.
	dirName, fileName := path.Split(inPath)
	info := parseEpisodeName(fileName)
	if info == nil {
		return "", errors.New("Could not parse file name")
	}

	// Create the URL and perform the lookup.
	queryURL := buildURL(info)
	response, err := performLookup(queryURL)
	if err != nil {
		return "", err
	}

	// Parse the response into the fullEpisodeInfo struct.
	fullInfo := parseResponse(response)
	if fullInfo == nil {
		return "", errors.New("Error parsing response from TV database service")
	}

	// Create the new path.
	newName := fmt.Sprintf("%s - %dx%02d - %s", fullInfo.episode.showName,
		fullInfo.episode.season, fullInfo.episode.episode, fullInfo.episodeName)
	newName = strings.Replace(newName, "/", "_", -1)
	newName += path.Ext(fileName)
	return path.Join(dirName, newName), nil
}

type episodeInfo struct {
	showName string
	season   int
	episode  int
}

type fullEpisodeInfo struct {
	episode     episodeInfo
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

	return &episodeInfo{
		showName,
		season,
		episode,
	}
}

// Builds the URL to which we send a HTTP request to get the episode name.
func buildURL(info *episodeInfo) string {
	return fmt.Sprintf("http://services.tvrage.com/tools/quickinfo.php?show=%s&ep=%dx%d",
		url.QueryEscape(info.showName), info.season, info.episode)
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
func performLookup(urlString string) (*http.Response, error) {
	url_, err := url.Parse(urlString)
	if err != nil {
		return nil, err
	}

	// Open a TCP connection.
	conn, err := net.Dial("tcp", url_.Host+":"+url_.Scheme)
	if err != nil {
		return nil, err
	}

	// Perform the HTTP request.
	client := httputil.NewClientConn(conn, nil)
	request, err := http.NewRequest("GET", urlString, nil)
	if err != nil {
		return nil, err
	}
	request.Header.Set("User-Agent", "Armadillo File Manager")
	err = client.Write(request)
	if err != nil {
		return nil, err
	}
	return client.Read(request)
}

// Parses the HTTP response from performLookup().
func parseResponse(response *http.Response) *fullEpisodeInfo {
	var err error
	var line string
	var info fullEpisodeInfo

	buf := bufio.NewReader(response.Body)
	for ; err != io.EOF; line, err = buf.ReadString('\n') {
		// An error ocurred while reading.
		if err != nil {
			return nil
		}
		var parts []string = strings.SplitN(line, "@", 2)
		if len(parts) != 2 {
			continue
		}
		switch parts[0] {
		case "Show Name":
			info.episode.showName = strings.TrimSpace(parts[1])
		case "Episode Info":
			// Split the line, which is of the form: |SxE^Name^AirDate|.
			parts = strings.SplitN(parts[1], "^", 3)
			info.episodeName = parts[1]
			// Split the episode string.
			episode := strings.SplitN(parts[0], "x", 2)
			info.episode.season, info.episode.episode = convertEpisode(episode[0], episode[1])
			if info.episode.season == 0 && info.episode.season == info.episode.episode {
				return nil
			}
		}
	}
	return &info
}
