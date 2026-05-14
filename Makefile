SHELL := /bin/bash

PORT ?= 5173
DOMAIN := monitor.thefrenchartist.dev
DIST := dist
PREVIEW_PID_FILE := .vite-preview.pid

.PHONY: up kill test build deploy clean

up:
	npm install
	npm run dev -- --host 0.0.0.0 --port $(PORT)

kill:
	@if [ -f $(PREVIEW_PID_FILE) ]; then \
		kill `cat $(PREVIEW_PID_FILE)` >/dev/null 2>&1 || true; \
		rm -f $(PREVIEW_PID_FILE); \
	fi
	@pkill -f "vite.*--host 0.0.0.0.*--port $(PORT)" >/dev/null 2>&1 || true

build:
	npm install
	npm run build

test: build
	@echo "Build succeeded"

deploy: build
	@mkdir -p $(DIST)
	@printf '%s\n' $(DOMAIN) > $(DIST)/CNAME
	@touch $(DIST)/.nojekyll
	npx gh-pages -d $(DIST) -m "Deploy monitor site"

clean:
	rm -rf $(DIST) node_modules package-lock.json
	$(MAKE) kill
