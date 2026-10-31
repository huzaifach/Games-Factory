/* Code-only short film engine. Everything on screen and in sound is built
   from code in this file and in each film's data file.
   No video files. No image files. No audio files.
   No random generation: every position, line and cue is written in the data. */
(function(){
"use strict";
var F = window.FILM;
var stage = document.getElementById('stage');
var subtitleEl = document.getElementById('subtitle');
var captionEl = document.getElementById('caption');
var titleEl = document.getElementById('titleCard');
var endEl = document.getElementById('endCard');
var fadeEl = document.getElementById('fade');
var seekEl = document.getElementById('seek');
var timeEl = document.getElementById('time');
var playBtn = document.getElementById('playBtn');
var centerPlay = document.getElementById('centerPlay');
document.getElementById('filmTitle').textContent = F.title;
document.getElementById('endTitle').textContent = F.title;
document.getElementById('endLine').textContent = F.endLine || '';
document.title = F.title + ' — a code-only short film';

/* ---------- timing ---------- */
var starts = [], total = 0;
F.scenes.forEach(function(s){ starts.push(total); total += s.dur; });
seekEl.max = total;
function sceneAt(t){
  for (var i = F.scenes.length - 1; i >= 0; i--){ if (t >= starts[i]) return i; }
  return 0;
}
function fmt(s){ s = Math.max(0, Math.floor(s)); var m = Math.floor(s/60), r = s%60; return (m<10?'0':'')+m+':'+(r<10?'0':'')+r; }
var smooth = function(x){ return x*x*(3-2*x); };
var lerp = function(a,b,k){ return a+(b-a)*k; };
function lerp3(a,b,k){ return [lerp(a[0],b[0],k), lerp(a[1],b[1],k), lerp(a[2],b[2],k)]; }
function hexLerp(a,b,k){
  var ca = parseInt(a.slice(1),16), cb = parseInt(b.slice(1),16);
  var r = Math.round(lerp(ca>>16 & 255, cb>>16 & 255, k));
  var g = Math.round(lerp(ca>>8 & 255, cb>>8 & 255, k));
  var bl = Math.round(lerp(ca & 255, cb & 255, k));
  return 'rgb('+(r)+','+(g)+','+(bl)+')';
}

/* ---------- three setup ---------- */
var renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);
var scene3 = new THREE.Scene();
scene3.background = new THREE.Color(F.scenes[0].bg || '#000000');
scene3.fog = new THREE.Fog(new THREE.Color(F.scenes[0].bg || '#000000'), 26, 60);
var camera;
if (F.view === 'iso'){
  camera = new THREE.OrthographicCamera(-10, 10, 8, -8, 0.1, 200);
} else {
  camera = new THREE.PerspectiveCamera(46, 16/9, 0.1, 200);
}
var amb = new THREE.AmbientLight(0xffffff, 0.5); scene3.add(amb);
var key = new THREE.DirectionalLight(0xffffff, 0.9);
key.position.set(6, 12, 4); key.castShadow = true;
key.shadow.mapSize.set(1024,1024);
key.shadow.camera.left=-16; key.shadow.camera.right=16; key.shadow.camera.top=16; key.shadow.camera.bottom=-16;
scene3.add(key);
var fill = new THREE.PointLight(0xffffff, 0, 30); scene3.add(fill);
function resize(){
  var w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  if (F.view === 'iso'){
    var a = w/h, view = 11;
    camera.left = -view*a; camera.right = view*a; camera.top = view; camera.bottom = -view;
  } else { camera.aspect = w/h; }
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

/* ---------- coded world building helpers ---------- */
function mat(c, rough, emis){
  var m = new THREE.MeshStandardMaterial({ color:new THREE.Color(c), roughness:(rough==null?0.85:rough), metalness:0.05 });
  if (emis){ m.emissive = new THREE.Color(emis); m.emissiveIntensity = 0.9; }
  return m;
}
function put(parent, mesh, p, ry){
  mesh.position.set(p[0], p[1], p[2]);
  if (ry) mesh.rotation.y = ry;
  mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
}
var H = {
  box:function(parent,p,s,c,ry,emis){ var m=new THREE.Mesh(new THREE.BoxGeometry(s[0],s[1],s[2]), mat(c,0.85,emis)); return put(parent,m,p,ry); },
  cyl:function(parent,p,rt,rb,h,c,seg,emis){ var m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||14), mat(c,0.8,emis)); return put(parent,m,p); },
  sphere:function(parent,p,r,c,emis){ var m=new THREE.Mesh(new THREE.SphereGeometry(r,18,14), mat(c,0.7,emis)); return put(parent,m,p); },
  cone:function(parent,p,r,h,c,emis){ var m=new THREE.Mesh(new THREE.ConeGeometry(r,h,14), mat(c,0.85,emis)); return put(parent,m,p); },
  plane:function(parent,p,w,d,c,rx){ var m=new THREE.Mesh(new THREE.PlaneGeometry(w,d), mat(c,0.95)); m.rotation.x = (rx==null?-Math.PI/2:rx); m.position.set(p[0],p[1],p[2]); m.receiveShadow=true; parent.add(m); return m; },
  door:function(parent,p,c,ry){ var g=new THREE.Group(); H.box(g,[0,1.5,0],[1.1,3,0.14],c); H.sphere(g,[0.42,1.5,0.12],0.055,'#c9a44f','#c9a44f'); g.position.set(p[0],p[1],p[2]); if(ry)g.rotation.y=ry; parent.add(g); return g; },
  windowGlow:function(parent,p,w,h,c,ry){ var m=H.box(parent,p,[w,h,0.08],'#101418',ry,c); return m; },
  table:function(parent,p,c){ var g=new THREE.Group(); H.box(g,[0,0.72,0],[1.8,0.08,0.95],c); [[-0.8,-0.4],[0.8,-0.4],[-0.8,0.4],[0.8,0.4]].forEach(function(o){ H.box(g,[o[0],0.36,o[1]],[0.08,0.72,0.08],c); }); g.position.set(p[0],p[1],p[2]); parent.add(g); return g; },
  chair:function(parent,p,c,ry){ var g=new THREE.Group(); H.box(g,[0,0.46,0],[0.5,0.06,0.5],c); H.box(g,[0,0.85,-0.23],[0.5,0.85,0.06],c); [[-0.2,-0.2],[0.2,-0.2],[-0.2,0.2],[0.2,0.2]].forEach(function(o){ H.box(g,[o[0],0.23,o[1]],[0.05,0.46,0.05],c); }); g.position.set(p[0],p[1],p[2]); if(ry)g.rotation.y=ry; parent.add(g); return g; },
  lamp:function(parent,p,c){ var g=new THREE.Group(); H.cyl(g,[0,0.75,0],0.035,0.05,1.5,'#2b2b30'); H.sphere(g,[0,1.62,0],0.17,c,c); var glow=new THREE.PointLight(new THREE.Color(c),0.7,7); glow.position.set(0,1.62,0); g.add(glow); g.position.set(p[0],p[1],p[2]); parent.add(g); return g; },
  tree:function(parent,p,leaf,trunk,s){ s=s||1; var g=new THREE.Group(); H.cyl(g,[0,0.9*s,0],0.09*s,0.14*s,1.8*s,trunk||'#4a3421'); H.sphere(g,[0,2.3*s,0],1.05*s,leaf); H.sphere(g,[0.55*s,1.9*s,0.2*s],0.7*s,leaf); H.sphere(g,[-0.5*s,2*s,-0.25*s],0.62*s,leaf); g.position.set(p[0],p[1],p[2]); parent.add(g); return g; },
  crystal:function(parent,p,c,s){ s=s||1; var m=new THREE.Mesh(new THREE.OctahedronGeometry(0.55*s), mat(c,0.25,c)); m.position.set(p[0],p[1],p[2]); m.castShadow=true; parent.add(m); return m; },
  clock:function(parent,p,c,ry){ var g=new THREE.Group(); H.cyl(g,[0,0,0],0.55,0.55,0.08,'#ddd6c4'); var rim=new THREE.Mesh(new THREE.TorusGeometry(0.55,0.05,10,28), mat(c||'#3a2e1c',0.6)); g.add(rim); var h1=H.box(g,[0.09,0.14,0.06],[0.05,0.34,0.02],'#221a10'); h1.rotation.z=-0.7; var h2=H.box(g,[-0.06,0.2,0.06],[0.04,0.46,0.02],'#221a10'); h2.rotation.z=0.5; g.position.set(p[0],p[1],p[2]); if(ry)g.rotation.y=ry; g.rotation.x=0; parent.add(g); return g; },
  screen:function(parent,p,c,ry){ var g=new THREE.Group(); H.box(g,[0,0,0],[1.5,0.95,0.07],'#0a0d10'); H.box(g,[0,0,0.05],[1.34,0.8,0.02],'#0e2a30',0,c); H.box(g,[0,-0.62,0],[0.14,0.3,0.14],'#22242a'); g.position.set(p[0],p[1],p[2]); if(ry)g.rotation.y=ry; parent.add(g); return g; },
  arch:function(parent,p,c,s){ s=s||1; var g=new THREE.Group(); H.box(g,[-1.1*s,1.4*s,0],[0.35*s,2.8*s,0.35*s],c); H.box(g,[1.1*s,1.4*s,0],[0.35*s,2.8*s,0.35*s],c); H.box(g,[0,2.95*s,0],[2.6*s,0.35*s,0.4*s],c); g.position.set(p[0],p[1],p[2]); parent.add(g); return g; }
};
/* named animated props registry (doors that open, clocks, screens...) */
var dyn = {};
function buildSet(def){
  var g = new THREE.Group();
  if (def.floor) H.plane(g, [0,0,0], def.floor[0], def.floor[1], def.floor[2]);
  (def.props||[]).forEach(function(p){
    var fn = H[p.t]; if (!fn) return;
    var args = [g, p.p].concat(p.a||[]);
    var obj = fn.apply(null, args);
    if (p.name) dyn[p.name] = obj;
    if (p.ry && obj && p.t!=='door' && p.t!=='chair' && p.t!=='screen' && p.t!=='clock') obj.rotation.y = p.ry;
  });
  return g;
}
var setGroups = {};
Object.keys(F.sets).forEach(function(id){ setGroups[id] = buildSet(F.sets[id]); setGroups[id].visible = false; scene3.add(setGroups[id]); });

/* ---------- coded characters ---------- */
function buildCharacter(def){
  var g = new THREE.Group();
  var body = new THREE.Group(); g.add(body);
  var coat = H.cyl(body,[0,0.95,0],0.21,0.3,1.05,def.body);
  H.cyl(body,[0,1.52,0],0.2,0.22,0.18,def.body);
  var head = H.sphere(body,[0,1.86,0],0.21,def.skin);
  if (def.hair) { var hair = H.sphere(body,[0,1.95,-0.03],0.215,def.hair); hair.scale.set(1,0.82,1); }
  var armL = new THREE.Group(); armL.position.set(-0.3,1.48,0); body.add(armL);
  H.cyl(armL,[0,-0.3,0],0.055,0.05,0.62,def.body);
  var armR = new THREE.Group(); armR.position.set(0.3,1.48,0); body.add(armR);
  H.cyl(armR,[0,-0.3,0],0.055,0.05,0.62,def.body);
  var legL = new THREE.Group(); legL.position.set(-0.12,0.48,0); body.add(legL);
  H.cyl(legL,[0,-0.24,0],0.065,0.055,0.48,def.legs||'#23232a');
  var legR = new THREE.Group(); legR.position.set(0.12,0.48,0); body.add(legR);
  H.cyl(legR,[0,-0.24,0],0.065,0.055,0.48,def.legs||'#23232a');
  g.userData = { body:body, armL:armL, armR:armR, legL:legL, legR:legR, head:head };
  g.visible = false; scene3.add(g);
  return g;
}
var charObjs = {};
Object.keys(F.characters).forEach(function(id){ charObjs[id] = buildCharacter(F.characters[id]); });

/* ---------- coded sound (Web Audio, no files) ---------- */
var AC = null, master = null, ambNodes = [], muted = false;
function audioInit(){
  if (AC) return;
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(AC.destination);
  } catch(e){ AC = null; }
}
function tone(freq, t0, dur, type, vol, slideTo){
  if (!AC) return;
  var o = AC.createOscillator(), g = AC.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20,slideTo), t0+dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0+0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
  o.connect(g); g.connect(master); o.start(t0); o.stop(t0+dur+0.05);
}
/* fixed pattern buffer stands in for noise: a written repeating waveform */
function patternBuffer(){
  var len = AC.sampleRate * 1, buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
  var pat = [0.9,0.4,-0.3,-0.8,-0.5,0.2,0.7,0.1,-0.6,-0.9,-0.2,0.5,0.8,0.3,-0.4,-0.7];
  for (var i=0;i<len;i++){ var v = pat[i%16] * (0.6 + 0.4*Math.sin(i*0.011)); d[i] = v * 0.5; }
  return buf;
}
var sharedBuf = null;
function noiseHit(t0, dur, vol, freq){
  if (!AC) return;
  if (!sharedBuf) sharedBuf = patternBuffer();
  var src = AC.createBufferSource(); src.buffer = sharedBuf; src.loop = true;
  var f = AC.createBiquadFilter(); f.type='bandpass'; f.frequency.value = freq||800; f.Q.value = 0.8;
  var g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0+0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
  src.connect(f); f.connect(g); g.connect(master); src.start(t0); src.stop(t0+dur+0.05);
}
function sfx(type){
  if (!AC || muted) return;
  var t = AC.currentTime + 0.02;
  if (type==='knock'){ noiseHit(t,0.09,0.5,300); noiseHit(t+0.22,0.09,0.5,300); noiseHit(t+0.44,0.12,0.6,260); }
  else if (type==='creak'){ tone(140,t,0.7,'sawtooth',0.05,70); tone(96,t+0.1,0.6,'triangle',0.04,60); }
  else if (type==='chime'){ tone(880,t,0.9,'sine',0.14); tone(1318,t+0.08,1.1,'sine',0.1); tone(1760,t+0.16,1.3,'sine',0.06); }
  else if (type==='bell'){ tone(660,t,1.4,'sine',0.16); tone(990,t,1.2,'sine',0.07); }
  else if (type==='alarm'){ for(var i=0;i<4;i++){ tone(720,t+i*0.32,0.2,'square',0.06); tone(520,t+i*0.32+0.14,0.14,'square',0.05);} }
  else if (type==='beep'){ tone(1180,t,0.12,'square',0.07); tone(1180,t+0.25,0.12,'square',0.07); }
  else if (type==='thunder'){ noiseHit(t,1.6,0.55,140); noiseHit(t+0.15,1.1,0.3,220); }
  else if (type==='heart'){ tone(58,t,0.16,'sine',0.5,40); tone(52,t+0.28,0.14,'sine',0.4,38); }
  else if (type==='step'){ noiseHit(t,0.07,0.18,500); }
  else if (type==='splash'){ noiseHit(t,0.5,0.25,900); tone(300,t,0.4,'sine',0.05,90); }
  else if (type==='wind'){ noiseHit(t,2.4,0.12,500); noiseHit(t+0.7,1.8,0.08,700); }
  else if (type==='paper'){ noiseHit(t,0.3,0.2,1800); noiseHit(t+0.15,0.25,0.15,1400); }
  else if (type==='doorbell'){ tone(784,t,0.5,'sine',0.15); tone(587,t+0.35,0.7,'sine',0.15); }
  else if (type==='tick'){ tone(1500,t,0.03,'square',0.05); tone(1500,t+0.5,0.03,'square',0.05); }
  else if (type==='hum'){ tone(110,t,1.8,'sawtooth',0.035); tone(220,t,1.8,'sine',0.02); }
  else if (type==='wave'){ noiseHit(t,2.8,0.13,420); }
  else if (type==='sparkle'){ [1568,1864,2093,2637].forEach(function(fr,i){ tone(fr,t+i*0.09,0.5,'sine',0.07); }); }
}
function setAmbient(mood){
  if (!AC) return;
  ambNodes.forEach(function(n){ try{ n.g.gain.linearRampToValueAtTime(0.0001, AC.currentTime+1.2); var o=n.o; setTimeout(function(){ try{o.stop();}catch(e){} },1400); }catch(e){} });
  ambNodes = [];
  if (!mood || muted) return;
  mood.forEach(function(freq){
    var o = AC.createOscillator(), g = AC.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.value = 0.0001; g.gain.linearRampToValueAtTime(0.028, AC.currentTime+2);
    o.connect(g); g.connect(master); o.start();
    ambNodes.push({o:o,g:g});
  });
}

/* ---------- coded voice (device speech, subtitles always shown) ---------- */
var voiceOn = true;
function speak(line){
  if (!voiceOn || muted) return;
  if (!('speechSynthesis' in window)) return;
  try {
    var u = new SpeechSynthesisUtterance(line.text);
    var ch = F.characters[line.who] || {};
    u.pitch = ch.pitch == null ? 1 : ch.pitch;
    u.rate = ch.rate == null ? 0.94 : ch.rate;
    u.volume = 1;
    window.speechSynthesis.speak(u);
  } catch(e){}
}
function stopVoice(){ if ('speechSynthesis' in window){ try{ window.speechSynthesis.cancel(); }catch(e){} } }

/* ---------- playback ---------- */
var playing = false, filmTime = 0, lastTs = null, curScene = -1, firedLines = {}, firedSfx = {};
var camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
function applyScene(idx, localT, globalT){
  var s = F.scenes[idx], k = smooth(Math.min(1, Math.max(0, localT / s.dur)));
  Object.keys(setGroups).forEach(function(id){ setGroups[id].visible = (id === s.set); });
  if (s.anim) s.anim(dyn, localT, s.dur);
  var cp = lerp3(s.cam[0], s.cam[1], k), lp = lerp3(s.look[0], s.look[1], k);
  camPos.set(cp[0], cp[1], cp[2]); camLook.set(lp[0], lp[1], lp[2]);
  camera.position.copy(camPos); camera.lookAt(camLook);
  var bg = new THREE.Color(hexLerp(s.bg || '#000000', s.bg || '#000000', 0));
  scene3.background.copy(bg); scene3.fog.color.copy(bg);
  amb.intensity = s.amb == null ? 0.5 : s.amb;
  key.intensity = s.key == null ? 0.9 : s.key;
  if (s.keyColor) key.color.set(s.keyColor);
  if (s.fill){ fill.color.set(s.fill[0]); fill.intensity = s.fill[1]; fill.position.set(cp[0], cp[1]+1, cp[2]); }
  Object.keys(charObjs).forEach(function(id){
    var o = charObjs[id], a = (s.chars || {})[id];
    if (!a){ o.visible = false; return; }
    o.visible = true;
    var p = lerp3(a.from, a.to, k);
    var moving = Math.abs(a.to[0]-a.from[0]) + Math.abs(a.to[2]-a.from[2]) > 0.05;
    var bob = moving ? Math.abs(Math.sin(globalT*5.2)) * 0.055 : Math.sin(globalT*1.6) * 0.012;
    o.position.set(p[0], p[1] + bob, p[2]);
    var ry = lerp(a.ry0||0, a.ry1==null ? (a.ry0||0) : a.ry1, k);
    o.rotation.y = ry;
    var u = o.userData, swing = moving ? Math.sin(globalT*5.2) * 0.5 : Math.sin(globalT*1.6)*0.04;
    u.legL.rotation.x = swing; u.legR.rotation.x = -swing;
    u.armL.rotation.x = -swing * 0.7 + (a.armL||0); u.armR.rotation.x = swing * 0.7 + (a.armR||0);
    if (a.lean) u.body.rotation.x = a.lean;
    if (a.headTilt) u.head.rotation.z = a.headTilt;
  });
  /* title card */
  if (s.title){
    titleEl.querySelector('h1').textContent = s.title;
    titleEl.querySelector('.kicker').textContent = s.kicker || '';
    titleEl.querySelector('.sub').textContent = s.sub || '';
    titleEl.classList.add('show');
  } else titleEl.classList.remove('show');
  /* caption */
  if (s.caption && localT < 9){ captionEl.textContent = s.caption; captionEl.classList.add('show'); }
  else captionEl.classList.remove('show');
  /* dialogue */
  var activeLine = null;
  (s.lines||[]).forEach(function(line, li){
    var key2 = idx+':'+li;
    if (localT >= line.at && !firedLines[key2]){ firedLines[key2] = true; if (playing) speak(line); }
    var showDur = Math.max(3.4, line.text.length * 0.085);
    if (localT >= line.at && localT <= line.at + showDur) activeLine = line;
  });
  if (activeLine){
    var ch = F.characters[activeLine.who];
    subtitleEl.innerHTML = '';
    if (ch && ch.name){ var w = document.createElement('span'); w.className='who'; w.textContent = ch.name; subtitleEl.appendChild(w); }
    subtitleEl.appendChild(document.createTextNode(activeLine.text));
    subtitleEl.classList.add('show');
  } else subtitleEl.classList.remove('show');
  /* sfx */
  (s.sfx||[]).forEach(function(cue, ci){
    var key3 = idx+':s'+ci;
    if (localT >= cue.at && !firedSfx[key3]){ firedSfx[key3] = true; if (playing) sfx(cue.t); }
  });
}
function onSceneChange(idx){
  setAmbient(F.scenes[idx].mood);
  if (F.scenes[idx].fade){ fadeEl.style.opacity = 1; setTimeout(function(){ fadeEl.style.opacity = 0; }, 350); }
}
function frame(ts){
  requestAnimationFrame(frame);
  if (lastTs == null) lastTs = ts;
  var dt = Math.min(0.1, (ts - lastTs)/1000); lastTs = ts;
  if (playing){
    filmTime += dt;
    if (filmTime >= total){ filmTime = total; pause(); endEl.classList.add('show'); }
    var idx = sceneAt(filmTime);
    if (idx !== curScene){ curScene = idx; onSceneChange(idx); }
    applyScene(curScene, filmTime - starts[curScene], filmTime);
    seekEl.value = filmTime;
    timeEl.textContent = fmt(filmTime) + ' / ' + fmt(total);
  } else if (curScene >= 0){
    applyScene(curScene, filmTime - starts[curScene], filmTime);
  }
}
function play(){
  audioInit(); if (AC && AC.state === 'suspended') AC.resume();
  playing = true; playBtn.textContent = '❚❚'; centerPlay.classList.add('hidden');
  if (curScene < 0){ curScene = 0; onSceneChange(0); }
  setAmbient(F.scenes[curScene].mood);
}
function pause(){ playing = false; playBtn.textContent = '▶'; centerPlay.classList.remove('hidden'); stopVoice(); }
function seekTo(t){
  filmTime = Math.min(total-0.1, Math.max(0, t));
  firedLines = {}; firedSfx = {};
  var idx = sceneAt(filmTime); curScene = idx; onSceneChange(idx);
  stopVoice();
  applyScene(idx, filmTime - starts[idx], filmTime);
  seekEl.value = filmTime; timeEl.textContent = fmt(filmTime) + ' / ' + fmt(total);
  endEl.classList.remove('show');
}
playBtn.addEventListener('click', function(){ playing ? pause() : play(); });
centerPlay.addEventListener('click', function(){ play(); });
renderer.domElement.addEventListener('click', function(){ playing ? pause() : play(); });
document.getElementById('restartBtn').addEventListener('click', function(){ seekTo(0); play(); });
document.getElementById('replayBtn').addEventListener('click', function(){ endEl.classList.remove('show'); seekTo(0); play(); });
document.getElementById('muteBtn').addEventListener('click', function(){
  muted = !muted; this.textContent = muted ? '✕' : '♪';
  if (master) master.gain.value = muted ? 0 : 0.9;
  if (muted) stopVoice();
});
document.getElementById('voiceBtn').addEventListener('click', function(){
  voiceOn = !voiceOn; this.style.opacity = voiceOn ? 1 : 0.35; if (!voiceOn) stopVoice();
});
document.getElementById('fsBtn').addEventListener('click', function(){
  if (document.fullscreenElement) document.exitFullscreen();
  else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
});
seekEl.addEventListener('input', function(){ seekTo(parseFloat(this.value)); });
window.addEventListener('keydown', function(e){
  if (e.code === 'Space'){ e.preventDefault(); playing ? pause() : play(); }
  else if (e.code === 'ArrowRight') seekTo(filmTime + 10);
  else if (e.code === 'ArrowLeft') seekTo(filmTime - 10);
});
document.addEventListener('visibilitychange', function(){ if (document.hidden && playing) pause(); });

/* boot */
resize();
timeEl.textContent = '00:00 / ' + fmt(total);
curScene = 0; applyScene(0, 0, 0);
setTimeout(function(){ fadeEl.style.opacity = 0; }, 150);
requestAnimationFrame(frame);
})();
