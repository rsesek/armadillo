# Armadillo File Manager

Armadillo is a web-based file manager. It allows you to list, move, rename,
delete, and download files through your browser. It's the ideal solution for a
home media center, allowing you to manage your files from your couch.

## Installation

Installation requires the [Go runtime](http://golang.org/doc/install) because
there is no binary distribution yet. To install, use the go command:

    $ go get https://github.com/rsesek/armadillo

After building, you will have a binary named `armadillo` in your $GOBIN.

## Configuration

Armadillo can either be configured using command line parameters or via a JSON
configuration file in `~/.armadillo`. The two important directives are
"JailRoot" and "Port":

    {
      # No operations will be performed outside of this directory. Everything in
      # this directory and below will be served by Armadillo.
      "JailRoot": "/path/to/root",

      # The port on which to run Armadillo.
      "Port": 8084
    }

You can also specify these values on the command line. See `armadillo -help` for
more details.

## Security

Armadillo does not fork itself into a daemon process; it runs under the user
who started it. This is because it needs read and write permission to the file
system.

**NOTE: Armadillo provides no form of authorization or authentication. It is
recommended to either only run it on your local network, or to place it behind
a reverse web proxy like [nginx](http://nginx.org) or
[Apache](http://httpd.apache.org) to provide security.** Configuring those
servers is beyond the scope of this document.

## Running

On Mac OS X, the recommended way to start Armadillo on launch is to use
launchd. Create a file called
`~/Library/LaunchAgents/org.bluestatic.armadillo.plist` with this content:

    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
            <key>Label</key>
            <string>org.bluestatic.armadillo</string>
            <key>ProgramArguments</key>
            <array>
                    <string>/Users/your_name/Projects/armadillo/armadillo</string>
                    <string>-config=/path/to/config.json</string>
            </array>
            <key>KeepAlive</key>
            <false/>
            <key>RunAtLoad</key>
            <true/>
    </dict>
    </plist>

Then type:

    launchctl load ~/Library/LaunchAgents/org.bluestatic.armadillo.plist

And armadillo will start serving with the configuration file you specified in
the plist. The next time you log in, armadillo will run automatically.

## Contributing

Contributions to armadillo are welcome. There is a Makefile used for local
development builds. There are four targets of interest to contributors:

* `backend`: This target merely runs the go build command in the local directory.
* `frontend`: Generates the frontend "binary" armadillo.js by referencing and
  loading all the other frontend files. This is used for debugging and iterative
  development.
* `all`: The default target, which executes `backend` and `frontend`.
* `release`: Like `all`, but rather than generating a frontend binary for
  debugging, this runs the frontend code through the
  [Closure Compiler](https://developers.google.com/closure/compiler/) to minify
  and optimize it.

All other targets are reserved for the project maintainer.

Patches can be distributed via pull requests, if your history and commit
messages are clean.  Please also follow existing code style conventions.
