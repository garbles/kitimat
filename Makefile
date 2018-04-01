#!/usr/bin/make -j 4 -f

TSC = $(PWD)/node_modules/.bin/tsc --p tsconfig.build.json

K = packages/kitimat/__build__
K_JEST = packages/kitimat-jest/__build__
K_OPTIONS = packages/kitimat-options/__build__
MODULES = node_modules packages/*/node_modules
DEPS = $(MODULES) package.json packages/*/package.json

.PHONY : build publish clean

build : $(K) $(K_JEST) $(K_OPTIONS)

clean :
	rm -rf $(MODULES) $(K) $(K_JEST) $(K_OPTIONS)

test :
	yarn test
	yarn test:integration

prepublish : clean build test

publish : prepublish
	yarn lerna publish

$(DEPS) :
	yarn install
	yarn lerna bootstrap

$(K) : $(DEPS) $(wildcard packages/kitimat/src/*)
	rm -rf $(K); cd packages/kitimat; $(TSC)

$(K_OPTIONS) : $(DEPS) $(wildcard packages/kitimat-options/src/*)
	rm -rf $(K_OPTIONS); cd packages/kitimat-options; $(TSC)

$(K_JEST) : $(DEPS) $(K) $(K_OPTIONS) $(wildcard packages/kitimat-jest/src/*)
	rm -rf $(K_JEST); cd packages/kitimat-jest; $(TSC)