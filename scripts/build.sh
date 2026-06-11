#!/bin/bash

# Enable command printing (debug mode)
set -x

pnpm install

# build feed
node ./scripts/feed.js

# copy rss.xml to index.xml, use for https://www.v2ex.com/xna
cp -f publish/rss.xml publish/index.xml

# install minify: https://github.com/tdewolff/minify/tree/master
go run github.com/tdewolff/minify/v2/cmd/minify@latest -r -i publish

set +x
