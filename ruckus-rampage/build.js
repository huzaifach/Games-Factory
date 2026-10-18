#!/usr/bin/env node
/* RUCKUS RAMPAGE — build: concatenate src/*.js + inline Phaser from global-libs
   into one self-contained dist/ruckus-rampage.html. Zero external requests. */
var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname);
var SRC = path.join(ROOT, 'src');
var DIST = path.join(ROOT, 'dist');
var PHASER = '/home/hatch/workspace/global-libs/phaser/phaser-3.60.0.min.js';

var ORDER = ['core.js', 'audio.js', 'input.js', 'logic.js', 'fighter.js',
  'weapons.js', 'world.js', 'fx.js', 'ui.js', 'match.js', 'main.js'];

function fail(msg) { console.error('BUILD FAIL: ' + msg); process.exit(1); }

if (!fs.existsSync(PHASER)) fail('Phaser not found at ' + PHASER + ' (global-libs single-copy rule)');
var phaserSrc = fs.readFileSync(PHASER, 'utf8');
console.log('Phaser 3.60.0 inlined from global-libs: ' + (phaserSrc.length / 1024).toFixed(0) + ' KB');

var gameSrc = '';
ORDER.forEach(function (f) {
  var p = path.join(SRC, f);
  if (!fs.existsSync(p)) fail('missing src file: ' + f);
  var code = fs.readFileSync(p, 'utf8');
  /* syntax check via Function constructor is unsafe for 'return'; use vm compile */
  gameSrc += '\n/* ===== ' + f + ' ===== */\n' + code;
});
console.log('Game code: ' + (gameSrc.length / 1024).toFixed(0) + ' KB across ' + ORDER.length + ' files');

/* light, safe minification: strip comments + collapse blank lines (strings untouched) */
function stripComments(src) {
  var out = '', i = 0, n = src.length;
  var inS = null; /* ' " ` */
  while (i < n) {
    var c = src[i], nx = src[i + 1];
    if (inS) {
      out += c;
      if (c === '\\') { out += nx; i += 2; continue; }
      if (c === inS) inS = null;
      i++; continue;
    }
    if (c === '"' || c === "'" || c === '`') { inS = c; out += c; i++; continue; }
    if (c === '/' && nx === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && nx === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    out += c; i++;
  }
  return out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
}
var gameMin = stripComments(gameSrc);
console.log('Game code minified: ' + (gameMin.length / 1024).toFixed(0) + ' KB');

var html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">\n' +
  '<meta name="theme-color" content="#0d0a24">\n<title>Ruckus Rampage</title>\n<style>\n' +
  'html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#0d0a24;}\n' +
  '#game{position:fixed;inset:0;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;}\n' +
  '#game canvas{display:block;}\n</style>\n</head>\n<body>\n<div id="game"></div>\n' +
  '<script>\n/* Phaser 3.60.0 — single global copy, inlined at build time (never re-downloaded) */\n' +
  phaserSrc + '\n</script>\n<script>\n"use strict";\n' + gameMin + '\n</script>\n</body>\n</html>\n';

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
var out = path.join(DIST, 'ruckus-rampage.html');
fs.writeFileSync(out, html);
var kb = fs.statSync(out).size / 1024;
console.log('WROTE ' + out + ' — ' + kb.toFixed(0) + ' KB total');
if (kb > 1536) fail('OVER 1.5MB BUDGET: ' + kb.toFixed(0) + ' KB');
/* zero-external-request audit: allow only known-inert Phaser-internal strings
   (console banner, config default, SVG/XHTML namespace identifiers — none fetch) */
var SAFE_URLS = ['https://phaser.io', 'http://www.w3.org/2000/svg', 'http://www.w3.org/1999/xhtml'];
var ext = (html.match(/https?:\/\/[^\s"'<>)]+/g) || []).filter(function (u) {
  return SAFE_URLS.every(function (s) { return u.indexOf(s) !== 0; });
});
if (ext.length) fail('external URLs found in artifact: ' + ext.slice(0, 5).join(', '));
console.log('OK: zero external requests. Build clean.');
