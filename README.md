# Armadillo File Manager

Armadillo is a web-based file manager. It allows you to list, move, rename,
delete, and download files through your browser. It's the ideal solution for a
home media center, allowing you to manage your files from your couch.

## Installation

Installation requires the [Go runtime](http://golang.org/doc/install) because
there is no binary distribution yet.

After installing Go, clone this repository and type `make`:

    $ git clone https://github.com/rsesek/armadillo
    $ make

    # Or to minify the JavaScript:

    $ make release

If you have Java installed, you can use the
[Closure Compiler](https://developers.google.com/closure/compiler/) to minify
and compile the frontend JavaScript code by typing `make release`.

After building, you will have a binary named `armadillo`.

## Configuration

Armadillo can either be configured using command line parameters, or via a JSON
configuration file in `~/.armadillo`. The two important directives are
"JailRoot" and "Port":

    {
      # No operations will be performed outside of this directory. Everything in
      # this directory and below will be served by Armadillo.
      "JailRoot": "/path/to/root",

      # The port on which to run Armadillo.
      "Port": 8084
    }

You can specify these values on the command line. See `armadillo -help` for
more details.

## Security

Armadillo does not fork itself into a daemon process; it runs under the user
who started t. This is because it needs read and write permission to the file
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
