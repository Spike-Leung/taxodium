#!/bin/bash

# Enable command printing (debug mode)
set -x

# 判断 publish/index.html 是否有变化
if ! git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF -- publish/index.html; then
  echo "index.html changed, regenerating RSS feed"
  pnpm install
  node feed.js
  cp -f publish/rss.xml publish/index.xml
else
  echo "index.html unchanged, skip RSS feed generation"
fi

# 判断 publish/ 目录是否有变化
if ! git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF -- publish; then
  echo "publish directory changed, running pagefind"
  npx -y pagefind --site publish --force-language zh-CN
else
  echo "publish directory unchanged, skip pagefind"
fi

set +x
