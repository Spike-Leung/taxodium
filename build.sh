#!/bin/bash

# Enable command printing (debug mode)
set -x

pnpm install

# build feed
if git log -1 --pretty=%B | grep -q "\[feed\]"; then
  node feed.js
fi

# copy rss.xml to index.xml, use for https://www.v2ex.com/xna
cp -f publish/rss.xml publish/index.xml

# pagefind index, for search
npx -y pagefind --site publish --force-language zh-CN

set +x
