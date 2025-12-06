#!/bin/bash

# Enable command printing (debug mode)
set -x

pnpm install

# build feed
node ./scripts/feed.js

# copy rss.xml to index.xml, use for https://www.v2ex.com/xna
cp -f publish/rss.xml publish/index.xml

# pagefind index, for search
npx -y pagefind --site publish --force-language zh-CN

set +x
