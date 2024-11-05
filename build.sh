#!/bin/bash

# only build when `publish` change
git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF publish

# index.xml is for https://www.v2ex.com/xna
cp -f publish/rss.xml publish/index.xml
