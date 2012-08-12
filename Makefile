# Armadillo File Manager
# Copyright (c) 2012, Robert Sesek <http://www.bluestatic.org>
#
# This program is free software: you can redistribute it and/or modify it under
# the terms of the GNU General Public License as published by the Free Software
# Foundation, either version 3 of the License, or any later version.

VERSION_MAJOR=0
VERSION_MINOR=8
VERSION_NAMESPACE=armadillo.Version
VERSION_FILE=frontend/version.js.proto
VERSION_SOURCE=$(basename $(VERSION_FILE))

FRONTEND_SOURCES=frontend/jquery-1.7.1.js \
	frontend/utils.js \
	$(VERSION_SOURCE) \
	frontend/tv_renamer.js \
	frontend/path_control.js \
	frontend/actor.js \
	frontend/file.js \
	frontend/main.js
FRONTEND_BIN=frontend/armadillo.js

# Default target, used to produce the backend and uncompiled frontend.
all: backend frontend

# Creates the compiled frontend code.
release: backend compiled

# Performs a release build and stamps the actual version file.
dist: stamp release

# Compiles the backend server.
backend:
	go build -v .

# Compiles the frontend code for development.
frontend: version $(FRONTEND_BIN)

$(FRONTEND_BIN): $(FRONTEND_SOURCES)
	echo $(foreach f,$^,"document.write('<script src="fe/$(notdir $f)"></script>');\n") > $(FRONTEND_BIN)

# Compiles the frontend code for release.
compiled: SOURCES_FLAGS=$(foreach f,$(FRONTEND_SOURCES),--js=$f)
compiled:
	java -jar closure-compiler.jar \
		$(SOURCES_FLAGS) \
		--js_output_file=$(FRONTEND_BIN) \
		--compilation_level=SIMPLE_OPTIMIZATIONS

.PHONY: $(VERSION_FILE)

# Builds the version file template.
version:
	if [[ -f $(VERSION_FILE) ]]; then $(MAKE) $(VERSION_FILE); fi
$(VERSION_FILE):
	which gitcrement
	@echo "// This file is automatically generated." > $(VERSION_FILE)
	@echo >> $(VERSION_FILE)
	@echo "$$.namespace('$(VERSION_NAMESPACE)');" >> $(VERSION_FILE)
	@echo >> $(VERSION_FILE)
	echo "$(VERSION_NAMESPACE).MAJOR = $(VERSION_MAJOR);" >> $(VERSION_FILE)
	echo "$(VERSION_NAMESPACE).MINOR = $(VERSION_MINOR);" >> $(VERSION_FILE)
	echo "$(VERSION_NAMESPACE).BUILD = $(shell gitcrement next);" >> $(VERSION_FILE)
	echo "$(VERSION_NAMESPACE).STAMP = $(shell date +%s);" >> $(VERSION_FILE)

# Copies the version template to the source and commits it.
stamp: $(VERSION_FILE)
	cp $(VERSION_FILE) $(VERSION_SOURCE)
	git commit $(VERSION_SOURCE) \
		--author='Armadillo Build Script <armadillo@bluestatic.org>' \
		-m 'Stamp version.js @ $(shell gitcrement current)'
