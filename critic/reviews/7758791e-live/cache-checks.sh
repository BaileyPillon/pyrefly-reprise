#!/bin/bash
# docs/handoff/r43-delivery.md section 5, checks 1 to 4, against the live site (headers only)
SITE=https://echoesofspira.com
echo "date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "### 1. every content-hashed file gets the year-long rule"
HTML=$(curl -s "$SITE/")
BUNDLE=$(echo "$HTML" | grep -o 'assets/index-[A-Za-z0-9_-]*\.js'  | head -1)
CSS=$(echo "$HTML"    | grep -o 'assets/index-[A-Za-z0-9_-]*\.css' | head -1)
WORKERS=$(curl -s "$SITE/$BUNDLE" | grep -o 'assets/worker-[A-Za-z0-9_-]*\.js' | sort -u)
echo "BUNDLE=$BUNDLE"
echo "CSS=$CSS"
echo "WORKERS=$(echo $WORKERS)"
for f in $BUNDLE $CSS $WORKERS; do echo "== $f"; curl -sI "$SITE/$f" | grep -i -E '^(HTTP|cache-control|content-type)'; done
echo "### 2. everything else keeps the host's default (revalidated)"
for p in / /art/title/keyart.webp /art/backdrops/road-to-the-farplane.webp /art/manifest.json /audio/manifest.json /artifact-manifest.json; do
  echo "== $p"; curl -sI "$SITE$p" | grep -i -E '^(HTTP|cache-control|etag)'; done
echo "### 3. the query string does not change the rule, and _headers itself is not served"
echo -n "bundle ?v=1: "; curl -sI "$SITE/$BUNDLE?v=1" | grep -i '^cache-control'
echo -n "/_headers: "; curl -s -o /dev/null -w '%{http_code}\n' "$SITE/_headers"
echo "### 4. a conditional request for the page"
ETAG=$(curl -sI "$SITE/" | grep -i '^etag' | cut -d' ' -f2 | tr -d '\r')
echo "page ETag: '${ETAG}'"
if [ -n "$ETAG" ]; then curl -s -o /dev/null -w '%{http_code}\n' -H "If-None-Match: $ETAG" "$SITE/"; else echo "no ETag on the page: a conditional request cannot be sent"; fi
