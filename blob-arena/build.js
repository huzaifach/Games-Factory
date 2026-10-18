/* BLOB ARENA — build script.
   Concatenates src/*.js into a single self-contained dist/index.html.
   Zero external requests. Usage: node build.js
*/
'use strict';
var fs = require('fs');
var path = require('path');

var ROOT = __dirname;
var SRC = path.join(ROOT, 'src');
var DIST = path.join(ROOT, 'dist');

var CSS = [
  'html,body{margin:0;padding:0;height:100%;overflow:hidden;background:#04121f;',
  ' overscroll-behavior:none;}',
  '#game{position:fixed;inset:0;display:block;touch-action:none;',
  ' -webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;}'
].join('');

var ORDER = ['core.js', 'audio.js', 'sim.js', 'render.js', 'ui.js', 'input.js', 'main.js'];

var js = ORDER.map(function (f) {
  return fs.readFileSync(path.join(SRC, f), 'utf8');
}).join('\n;\n');

/* forbidden-word + external-reference guards */
var banned = ['prototype', 'demo'];
var lower = js.toLowerCase();
banned.forEach(function (w) {
  if (lower.indexOf(w) !== -1)
    throw new Error('BANNED WORD found in source: ' + w);
});
['http://', 'https://', '//fonts', 'src=', 'href='].forEach(function (s) {
  if (js.indexOf(s) !== -1)
    throw new Error('External reference found in JS: ' + s);
});

var tpl = fs.readFileSync(path.join(SRC, 'template.html'), 'utf8');
var html = tpl.replace('/*__CSS__*/', CSS).replace('/*__JS__*/', js);

['http://', 'https://'].forEach(function (s) {
  if (html.indexOf(s) !== -1)
    throw new Error('External reference found in final HTML: ' + s);
});

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
var out = path.join(DIST, 'index.html');
fs.writeFileSync(out, html);
var bytes = fs.statSync(out).size;
console.log('Built ' + out + ' — ' + bytes + ' bytes (' + (bytes / 1024).toFixed(1) + ' KB)');
if (bytes > 1024 * 1024) {
  console.error('FAIL: bundle exceeds 1 MB budget');
  process.exit(1);
}
console.log('OK: under 1 MB, zero external references, no banned words.');
