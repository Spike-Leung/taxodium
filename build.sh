#!/bin/bash

# Enable command printing (debug mode)
set -x

# Only build when `publish` change
git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF publish

npm install

node feed.js

# index.xml is for https://www.v2ex.com/xna
cp -f publish/rss.xml publish/index.xml

# see: https://pagefind.app/docs/multilingual/#opting-out-of-multilingual-search
npx -y pagefind --site publish --force-language zh-CN

# Disable debug mode
set +x
