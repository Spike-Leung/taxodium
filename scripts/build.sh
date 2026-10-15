#!/bin/bash

# Enable command printing (debug mode)
set -x

pnpm install

# build feed
node ./scripts/feed.js

# update shuffle data
node ./scripts/generate-shuffle-data.js

# copy rss.xml to index.xml, use for https://www.v2ex.com/xna
cp -f publish/rss.xml publish/index.xml

set +x
