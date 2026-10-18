#!/usr/bin/env node
'use strict';
/* SKYLINE STACK — single-file build.
 * Inlines styles.css + logic.js + audio.js + game.js into dist/skyline-stack.html.
 * Audits: zero external requests. Budget: < 1MB.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(DIST, 'skyline-stack.html');
const BUDGET = 1024 * 1024; // 1MB

function read(f) { return fs.readFileSync(path.join(SRC, f), 'utf8'); }

let html = read('index.html');
const css = read('styles.css');
const logic = read('logic.js');
const audio = read('audio.js');
const game = read('game.js');

html = html.replace('/*__STYLES__*/', () => css);
html = html.replace('/*__LOGIC__*/', () => logic);
html = html.replace('/*__AUDIO__*/', () => audio);
html = html.replace('/*__GAME__*/', () => game);

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
fs.writeFileSync(OUT, html);

// ---- audit: zero external requests ----
const checks = [
  [/https?:\/\//g, 'absolute http(s) URL'],
  [/<script[^>]+src\s*=/gi, 'remote <script src>'],
  [/<link[^>]+href\s*=\s*["']https?:/gi, 'remote <link href>'],
  [/url\(\s*["']?https?:/gi, 'remote url()'],
  [/@import/gi, '@import'],
];
let failed = false;
for (const [re, label] of checks) {
  const m = html.match(re);
  if (m) { console.error(`AUDIT FAIL: ${label} x${m.length}`); m.slice(0, 3).forEach((s) => console.error('   ' + s.slice(0, 120))); failed = true; }
}
// placeholders must be gone
for (const ph of ['__STYLES__', '__LOGIC__', '__AUDIO__', '__GAME__']) {
  if (html.includes(ph)) { console.error(`AUDIT FAIL: placeholder ${ph} not replaced`); failed = true; }
}
// sanity: key systems present
for (const needle of ['SkylineLogic', 'SkylineAudio', '__skyline', 'SAVED!', 'windmeter']) {
  if (!html.includes(needle)) { console.error(`AUDIT FAIL: missing expected token "${needle}"`); failed = true; }
}

const size = fs.statSync(OUT).size;
console.log(`wrote ${OUT}`);
console.log(`size: ${(size / 1024).toFixed(1)} KB (budget ${(BUDGET / 1024).toFixed(0)} KB)`);
if (size > BUDGET) { console.error('AUDIT FAIL: over 1MB budget'); failed = true; }

if (failed) { console.error('BUILD FAILED'); process.exit(1); }
console.log('BUILD OK — zero external requests, within budget');
