SHELL := /bin/bash

.PHONY: build simulate simulate-multi clean

build:
	@NODE_OPTIONS= node scripts/run-build.js

simulate:
	@NODE_OPTIONS= node scripts/run-simulate.js

simulate-multi:
	@NODE_OPTIONS= node scripts/run-simulate-multiple.js

clean:
	rm -rf dist coverage

