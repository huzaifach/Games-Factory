#!/bin/bash
# DUSKLINE single-file build: inline Phaser + game sources into dist/duskline.html
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
PHASER="/home/hatch/workspace/global-libs/phaser/phaser-3.60.0.min.js"
OUT="$HERE/dist/duskline.html"
TMP="$HERE/dist/.build.tmp"

if [ ! -f "$PHASER" ]; then echo "MISSING PHASER: $PHASER"; exit 1; fi

# concatenate game sources in dependency order
cat "$HERE/src/data.js" \
    "$HERE/src/audio.js" \
    "$HERE/src/art.js" \
    "$HERE/src/ui.js" \
    "$HERE/src/core.js" \
    "$HERE/src/scenes_menu.js" \
    "$HERE/src/scenes_game.js" > "$TMP.game.js"

# assemble template
cp "$HERE/src/template.html" "$TMP"
# replace __PHASER__ with phaser source (python for safe multiline replace)
python3 - "$TMP" "$PHASER" "$TMP.game.js" "$OUT" <<'EOF'
import sys
tmp, phaser_path, game_path, out = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
html = open(tmp, encoding='utf-8').read()
phaser = open(phaser_path, encoding='utf-8').read()
game = open(game_path, encoding='utf-8').read()
assert '__PHASER__' in html and '__GAME__' in html
# guard: phaser must not contain the placeholder
html = html.replace('__PHASER__', phaser).replace('__GAME__', game)
open(out, 'w', encoding='utf-8').write(html)
print('wrote', out)
EOF

rm -f "$TMP" "$TMP.game.js"

SIZE=$(stat -c%s "$OUT")
echo "size: $SIZE bytes ($(python3 -c "print(round($SIZE/1048576,2))") MB)"

# zero-external-request verification
echo "--- external reference scan ---"
if grep -oE 'src="http[^"]*"|href="http[^"]*"|url\(http[^)]*\)|from .http|import\(.http|fetch\(.http|XMLHttpRequest|//[a-z0-9-]+\.[a-z]{2,}' "$OUT" | grep -v "phaser.io" | head -20; then
  echo "WARNING: possible external refs above (review)"
else
  echo "OK: no external URLs"
fi
# phaser presence check
grep -q "Phaser 3.60" "$OUT" && echo "OK: phaser inlined" || echo "CHECK phaser marker"
