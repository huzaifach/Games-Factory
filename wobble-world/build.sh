#!/bin/bash
# WOBBLE WORLD — build.sh : concatenate src/ into a single self-contained dist/index.html
# Zero external requests. Target < 1.5 MB.
set -e
cd "$(dirname "$0")"
mkdir -p dist

FILES="00-util.js 01-audio.js 02-physics.js 03-creatures.js 04-toys.js 05-dioramas.js 06-mixer.js 07-ui.js 08-game.js 09-boot.js"

{
  echo '<!DOCTYPE html>'
  echo '<html lang="en">'
  echo '<head>'
  echo '<meta charset="utf-8">'
  echo '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">'
  echo '<meta name="theme-color" content="#ffe3ef">'
  echo '<title>Wobble World</title>'
  echo '<style>'
  cat src/style.css
  echo '</style>'
  echo '</head>'
  echo '<body>'
  echo '<canvas id="game"></canvas>'
  echo '<div id="overlay"></div>'
  echo '<script>'
  for f in $FILES; do
    echo "/* ===== $f ===== */"
    cat "src/$f"
  done
  echo '</script>'
  echo '</body>'
  echo '</html>'
} > dist/index.html

SIZE=$(wc -c < dist/index.html)
echo "Built dist/index.html ($SIZE bytes)"
if [ "$SIZE" -gt 1572864 ]; then
  echo "ERROR: over 1.5MB budget!"
  exit 1
fi
# zero-external-request check
if grep -Eo 'https?://[^"'"'"' )]+' dist/index.html | grep -v 'www.w3.org' | head -5 | grep -q .; then
  echo "ERROR: external URLs found:"
  grep -Eo 'https?://[^"'"'"' )]+' dist/index.html | grep -v 'www.w3.org' | head -5
  exit 1
fi
echo "OK: no external requests."
# banned-words check (user-visible text must never say prototype/demo)
if grep -io 'prototype\|demo' dist/index.html | head -5 | grep -q .; then
  echo "ERROR: banned word found:"
  grep -ion 'prototype\|demo' dist/index.html | head -5
  exit 1
fi
echo "OK: no banned words."
