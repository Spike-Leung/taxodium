#!/bin/bash

# Enable command printing (debug mode)
set -x

# Only build when `publish` change
echo "Checking for changes in the 'publish' directory..."
git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF publish

# index.xml is for https://www.v2ex.com/xna
echo "Copying rss.xml to index.xml..."
cp -f publish/rss.xml publish/index.xml

# Disable debug mode
set +x
