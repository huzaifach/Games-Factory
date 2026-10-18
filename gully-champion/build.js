/* GULLY CHAMPION — build script: inlines Phaser + all sources into ONE self-contained HTML. */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PHASER = '/home/hatch/workspace/global-libs/phaser/phaser-3.60.0.min.js';

const ORDER = [
  'src/config.js',
  'src/save.js',
  'src/logic.js',
  'src/util.js',
  'src/audio.js',
  'src/art.js',
  'src/ui.js',
  'src/scenes/boot.js',
  'src/scenes/menu.js',
  'src/scenes/match.js',
  'src/scenes/result.js',
  'src/main.js'
];

function safeJS(js) {
  // Never allow a literal </script> inside inlined JS.
  return js.replace(/<\/script/gi, '<\\/script');
}

function main() {
  const missing = ORDER.filter(f => !fs.existsSync(path.join(ROOT, f)));
  if (missing.length) { console.error('MISSING SOURCE FILES:', missing.join(', ')); process.exit(1); }
  if (!fs.existsSync(PHASER)) { console.error('PHASER NOT FOUND at', PHASER); process.exit(1); }

  const phaser = safeJS(fs.readFileSync(PHASER, 'utf8'));
  const game = ORDER.map(f => {
    const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
    return '\n/* ===== ' + f + ' ===== */\n' + code;
  }).join('\n;\n');
  const gameSafe = safeJS(game);

  const html = '<!DOCTYPE html>\n' +
    '<html lang="en">\n<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">\n' +
    '<meta name="theme-color" content="#0b0716">\n' +
    '<title>Gully Champion</title>\n' +
    '<style>\n' +
    'html,body{margin:0;padding:0;height:100%;background:#0b0716;overflow:hidden;overscroll-behavior:none;}\n' +
    'body{touch-action:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;}\n' +
    '#gc-root{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;}\n' +
    '#gc-root canvas{display:block;}\n' +
    '</style>\n</head>\n<body>\n' +
    '<div id="gc-root"></div>\n' +
    '<script>/* Phaser 3.60.0 (global single copy, inlined at build time) */\n' + phaser + '\n</script>\n' +
    '<script>/* Gully Champion — vertical slice */\n' + gameSafe + '\n</script>\n' +
    '</body>\n</html>\n';

  const outDir = path.join(ROOT, 'dist');
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, 'gully-champion.html');
  fs.writeFileSync(out, html);

  const bytes = fs.statSync(out).size;
  console.log('WROTE', out);
  console.log('SIZE', (bytes / 1048576).toFixed(2) + ' MB');
  // Real external resource references only (namespace strings / comments don't fetch).
  const ext = (html.match(/(src|href)\s*=\s*["']https?:\/\//gi) || []).length
    + (html.match(/url\(\s*["']?https?:\/\//gi) || []).length
    + (html.match(/fetch\(\s*["']https?:\/\//gi) || []).length
    + (html.match(/import\(\s*["']https?:\/\//gi) || []).length;
  console.log('EXTERNAL RESOURCE REFS:', ext);
  if (bytes > 2 * 1048576) { console.error('FAIL: over 2MB budget'); process.exit(1); }
  if (ext > 0) { console.error('FAIL: external URLs present'); process.exit(1); }
  console.log('BUILD OK');
}

main();
