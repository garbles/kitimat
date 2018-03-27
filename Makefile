#!/usr/bin/make -j 4 -f

TSC = $(PWD)/node_modules/.bin/tsc --p tsconfig.build.json

K = packages/kitimat/__build__
K_GRAPHQL = packages/kitimat-graphql/__build__
K_JEST = packages/kitimat-jest/__build__
K_OPTIONS = packages/kitimat-options/__build__
K_PROP_TYPES = packages/kitimat-prop-types/__build__
K_TYPE_GEN = packages/kitimat-type-gen/__build__
MODULES = node_modules packages/*/node_modules
DEPS = $(MODULES) package.json packages/*/package.json

.PHONY : build publish clean

build : $(K) $(K_GRAPHQL) $(K_JEST) $(K_OPTIONS) $(K_PROP_TYPES) $(K_TYPE_GEN)

clean :
	rm -rf $(MODULES) $(K) $(K_GRAPHQL)  $(K_OPTIONS) $(K_JEST) $(K_PROP_TYPES) $(K_TYPE_GEN)

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

$(K_GRAPHQL) : $(DEPS) $(K) $(wildcard packages/kitimat-graphql/src/*)
	rm -rf $(K_GRAPHQL); cd packages/kitimat-graphql; $(TSC)

$(K_JEST) : $(DEPS) $(K) $(K_OPTIONS) $(wildcard packages/kitimat-jest/src/*)
	rm -rf $(K_JEST); cd packages/kitimat-jest; $(TSC)

$(K_PROP_TYPES) : $(DEPS) $(K) $(wildcard packages/kitimat-prop-types/src/*)
	rm -rf $(K_PROP_TYPES); cd packages/kitimat-prop-types; $(TSC)

$(K_TYPE_GEN) : $(DEPS) $(K) $(wildcard packages/kitimat-type-gen/src/*)
	rm -rf $(K_TYPE_GEN); cd packages/kitimat-type-gen; $(TSC)