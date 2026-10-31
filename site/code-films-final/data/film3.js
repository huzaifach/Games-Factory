/* FILM 3 — THE LAST SIGNAL
   Science fiction / Thriller. 3D world. Runtime 15 min 00 sec.
   Every deck, star, line and cue below is written by hand. */
window.FILM = {
  title: "The Last Signal",
  view: "persp",
  endLine: "We answer signals together now. That was always the real rescue.",
  characters: {
    rhea:     { name:"COMMANDER RHEA VALE", body:"#274b63", skin:"#a87c56", hair:"#12100e", legs:"#1d2733", pitch:1.02, rate:0.96 },
    jun:      { name:"JUN OKAFOR, ENGINEER", body:"#6e4a1f", skin:"#7a5230", hair:"#0d0d0d", legs:"#26221c", pitch:0.85, rate:1.02 },
    custodian:{ name:"THE CUSTODIAN — MERIDIAN'S MIND", body:"#333333", skin:"#999999", hair:"#111111", pitch:0.55, rate:0.82 },
    sanael:   { name:"CAPTAIN SANA VALE — LOG, 40 YEARS AGO", body:"#4c2e3e", skin:"#b0835a", hair:"#3a3a3a", legs:"#2a2230", pitch:0.9, rate:0.9 },
    narrator: { name:"", body:"#222222", skin:"#999999", hair:"#111111", pitch:0.8, rate:0.9 }
  },
  sets: {
    bridge: { floor:[26,26,"#11161d"], props:[
      {t:"box", p:[0,2.8,-5], a:[17,5.6,0.3,"#1b2531"]},
      {t:"windowGlow", p:[-3.6,3.2,-4.8], a:[3.4,2.6,"#7fd4e8"]},
      {t:"windowGlow", p:[2.4,3.2,-4.8], a:[4.6,2.6,"#4d9db8"]},
      {t:"sphere", p:[-4.6,3.8,-4.4], a:[0.09,"#ffffff",0,"#ffffff"]},
      {t:"sphere", p:[-1.4,4.4,-4.4], a:[0.07,"#ffffff",0,"#ffffff"]},
      {t:"sphere", p:[4.8,4,-4.4], a:[0.08,"#ffffff",0,"#ffffff"]},
      {t:"sphere", p:[1.2,2.4,-4.4], a:[0.06,"#ffffff",0,"#ffffff"]},
      {t:"box", p:[-2.4,0.75,-1.8], a:[2.6,1.5,1,"#232f3d"]},
      {t:"screen", name:"mainScreen", p:[-2.4,1.95,-1.8], a:["#5fe0c8"], ry:0.5},
      {t:"box", p:[2.2,0.75,-1.6], a:[2.2,1.5,0.9,"#202b38"]},
      {t:"screen", p:[2.2,1.9,-1.6], a:["#e8a34d"], ry:-0.4},
      {t:"chair", p:[-2.4,0,0.1], a:["#31424e"], ry:3.14},
      {t:"chair", p:[2.2,0,0.2], a:["#31424e"], ry:3.14},
      {t:"lamp", p:[-5.6,0,-3.4], a:["#7fd4e8"]}
    ]},
    corridor: { floor:[26,26,"#12100e"], props:[
      {t:"box", p:[0,2.8,-4.2], a:[15,5.6,0.3,"#241f18"]},
      {t:"box", p:[-4.4,2.8,0], a:[0.3,5.6,8.6,"#201b16"]},
      {t:"box", p:[4.4,2.8,0], a:[0.3,5.6,8.6,"#201b16"]},
      {t:"door", name:"airlockDoor", p:[0,0,-4], a:["#5a5148"]},
      {t:"cyl", p:[-4.1,4.4,1.5], a:[0.07,0.07,2.6,"#ffb45e",8,"#ffb45e"]},
      {t:"cyl", p:[4.1,4.4,1.5], a:[0.07,0.07,2.6,"#ff7a5e",8,"#ff7a5e"]},
      {t:"cyl", p:[-4.1,4.4,-2], a:[0.07,0.07,2.6,"#ffb45e",8,"#ffb45e"]},
      {t:"box", p:[-3.4,0.6,1.8], a:[0.9,1.2,0.9,"#33302a"]},
      {t:"box", p:[3.5,0.45,-0.8], a:[1,0.9,1,"#2c2c30"]}
    ]},
    stasis: { floor:[28,28,"#0f181d"], props:[
      {t:"box", p:[0,2.8,-5.4], a:[17,5.6,0.3,"#18242c"]},
      {t:"cyl", p:[-3.6,1.25,-3.4], a:[0.85,0.85,2.5,"#7fd4e8",16,"#3d7d94"]},
      {t:"cyl", p:[-1.2,1.25,-3.6], a:[0.85,0.85,2.5,"#7fd4e8",16,"#3d7d94"]},
      {t:"cyl", p:[1.2,1.25,-3.6], a:[0.85,0.85,2.5,"#ffd9a0",16,"#8a6b34"]},
      {t:"cyl", p:[3.6,1.25,-3.4], a:[0.85,0.85,2.5,"#3a4a55",16]},
      {t:"box", p:[0,0.4,-0.6], a:[4.4,0.8,1.2,"#1d2b34"]},
      {t:"screen", name:"podScreen", p:[0,1.7,-0.6], a:["#5fe0c8"]},
      {t:"lamp", p:[-5.4,0,-2], a:["#7fd4e8"]},
      {t:"lamp", p:[5.4,0,-2], a:["#7fd4e8"]}
    ]},
    engine: { floor:[28,28,"#171310"], props:[
      {t:"box", p:[0,3,-5.4], a:[17,6,0.3,"#2a211a"]},
      {t:"cyl", p:[0,2.2,-4.2], a:[1.7,2.1,4.4,"#8a5a2b",22,"#5e3c1c"]},
      {t:"cyl", p:[-3.8,1.6,-4], a:[0.8,1,3.2,"#6e4a1f",16]},
      {t:"cyl", p:[3.8,1.6,-4], a:[0.8,1,3.2,"#6e4a1f",16]},
      {t:"box", p:[-2.2,0.8,-1.4], a:[1.8,1.6,1,"#33291f"]},
      {t:"screen", p:[-2.2,2.1,-1.4], a:["#ff9d4d"], ry:0.4},
      {t:"box", p:[2.4,0.8,-1.2], a:[1.8,1.6,1,"#33291f"]},
      {t:"screen", p:[2.4,2.1,-1.2], a:["#ff7a5e"], ry:-0.4},
      {t:"lamp", p:[-5.6,0,-3], a:["#ff9d4d"]}
    ]},
    observatory: { floor:[26,26,"#0c1219"], props:[
      {t:"box", p:[0,3.4,-5.6], a:[17,1.4,0.3,"#1b2531"]},
      {t:"box", p:[0,0.5,-5.6], a:[17,1,0.3,"#1b2531"]},
      {t:"sphere", p:[-5,3.4,-5], a:[0.12,"#ffffff",0,"#ffffff"]},
      {t:"sphere", p:[-2.2,4.2,-5], a:[0.08,"#ffffff",0,"#ffffff"]},
      {t:"sphere", p:[0.8,3,-5], a:[0.1,"#ffffff",0,"#ffffff"]},
      {t:"sphere", p:[3.4,4.4,-5], a:[0.07,"#ffffff",0,"#ffffff"]},
      {t:"sphere", p:[5.6,2.8,-5], a:[0.11,"#cfe4ff",0,"#cfe4ff"]},
      {t:"sphere", p:[-6.4,5.6,-9], a:[1.6,"#b3502e","#7a3418"]},
      {t:"cyl", p:[6.2,2.2,-8.6], a:[0.5,1.4,3,"#5a6a76",12]},
      {t:"box", p:[6.2,4.4,-8.4], a:[2.8,0.8,1.6,"#48545f"]},
      {t:"table", p:[0,0,-2], a:["#1d2733"]},
      {t:"lamp", p:[-4.6,0,-3.4], a:["#7fd4e8"]}
    ]},
    medbay: { floor:[26,26,"#141d1c"], props:[
      {t:"box", p:[0,2.8,-5], a:[16,5.6,0.3,"#223331"]},
      {t:"box", p:[-2.2,0.55,-2.4], a:[3.6,1.1,1.4,"#39524e"]},
      {t:"box", p:[-2.2,1.18,-2.4], a:[3.4,0.16,1.25,"#cfd8d2"]},
      {t:"box", p:[2.4,0.55,-2.4], a:[3.6,1.1,1.4,"#39524e"]},
      {t:"box", p:[2.4,1.18,-2.4], a:[3.4,0.16,1.25,"#aebbb4"]},
      {t:"screen", name:"medScreen", p:[0,2.6,-4.8], a:["#5fe0c8"]},
      {t:"lamp", p:[-5.2,0,-3.4], a:["#bff2e4"]},
      {t:"lamp", p:[5.2,0,-3.4], a:["#bff2e4"]}
    ]}
  },
  scenes: [
    { dur:45, set:"observatory", title:"The Last Signal", kicker:"A science fiction thriller, drawn entirely in code", sub:"Forty years silent. Then, one Tuesday, the dead ship spoke.",
      bg:"#04070c", amb:0.4, key:0.55, mood:[55,110],
      cam:[[5.5,3,8],[3.6,2.4,6]], look:[[1,2.6,-6],[3.4,3,-8]],
      chars:{ rhea:{from:[-1.4,0,-1.4], to:[-1.4,0,-1.4], ry0:3.14} },
      lines:[ {at:17, who:"narrator", text:"The survey ship Answer was three weeks from anywhere when it heard a voice that had been travelling for forty years — a distress call, from a ship that no longer existed, addressed to a woman not yet born."} ],
      sfx:[{at:10,t:"hum"},{at:30,t:"beep"}] },
    { dur:45, set:"bridge", caption:"The bridge of the Answer. Commander Rhea Vale, on the quietest shift in the fleet.",
      bg:"#050a10", amb:0.45, key:0.6, mood:[65.4,130.8],
      cam:[[4.6,2.8,7.4],[3,2.3,5.6]], look:[[-0.6,1.6,-2],[-1.4,1.6,-2]],
      chars:{ rhea:{from:[-2.4,0,0.4], to:[-2.4,0,0.4], ry0:3.14}, jun:{from:[2.2,0,0.5], to:[2.2,0,0.5], ry0:3.14} },
      lines:[
        {at:5, who:"jun", text:"Scans clean, Commander. Dust, ice, one very smug comet. If nothing tries to kill us by dinner, this becomes our most boring patrol on record."},
        {at:20, who:"rhea", text:"Log it as boring, Jun. Boring is the fleet's favourite flavour. Boring means nobody's mother gets a folded flag."},
        {at:34, who:"jun", text:"Commander. Incoming transmission. Narrow band. Old encoding — forty years old. That is… that is not possible on this route."}
      ], sfx:[{at:32,t:"beep"}] },
    { dur:45, set:"bridge", caption:"The signal resolves. A woman's voice, calm as a held hand, out of the dark of four decades.",
      bg:"#050a10", amb:0.42, key:0.58, mood:[55,110,164.8],
      cam:[[3,2.3,5.8],[1.6,2,4.4]], look:[[-2,1.7,-1.8],[-2.3,1.8,-1.8]],
      chars:{ rhea:{from:[-2.4,0,0.4], to:[-2.2,0,-0.4], ry0:3.14}, jun:{from:[2.2,0,0.5], to:[1.6,0,-0.2], ry0:2.6} },
      lines:[
        {at:5, who:"sanael", text:"—mayday, mayday. This is Captain Sana Vale, ship Meridian. We are dark, we are cold, we are patient. If you hear this: we chose the long sleep. Wake us kindly."},
        {at:23, who:"jun", text:"Vale. Commander — she said Vale."},
        {at:29, who:"rhea", text:"Sana Vale was my grandmother. She was lost with all hands forty years ago. I have her photograph. I have her medals. I do not have her ship. …Until now."}
      ], sfx:[{at:15,t:"hum"},{at:38,t:"beep"}] },
    { dur:45, set:"bridge", caption:"Fleet command answers in eleven minutes: DO NOT APPROACH. UNKNOWN AI RISK. HOLD POSITION.",
      bg:"#060a10", amb:0.44, key:0.6, mood:[61.7,123.5],
      cam:[[-4.6,2.7,7],[-3,2.2,5.4]], look:[[0.6,1.6,-2],[1.6,1.7,-1.8]],
      chars:{ rhea:{from:[-1.4,0,1.2], to:[-0.6,0,0.4], ry0:2.8}, jun:{from:[2.2,0,0.5], to:[2.2,0,0.5], ry0:3.14} },
      lines:[
        {at:5, who:"jun", text:"Orders, Commander. Hold position. They are sending a specialist vessel. It arrives in… five months."},
        {at:17, who:"rhea", text:"Five months. And the signal's power reserve?"},
        {at:23, who:"jun", text:"Weeks, maybe. The pods are older. Commander — if that voice stops, it does not start again. Ever."},
        {at:33, who:"rhea", text:"Then we are the rescue, Jun. I will log my disobedience in full sentences, with my name spelled correctly. Set course."}
      ], sfx:[{at:28,t:"alarm"}] },
    { dur:45, set:"observatory", caption:"Three days later: the Meridian, hanging in the black like a held breath of rust and ice.",
      bg:"#03060a", amb:0.36, key:0.5, mood:[49,98],
      cam:[[5.8,3.2,8.4],[4,2.6,6.4]], look:[[3,2.8,-7],[5,3.2,-8.4]],
      chars:{ rhea:{from:[-0.8,0,-1.6], to:[-0.4,0,-2], ry0:3.14}, jun:{from:[1.6,0,-1.2], to:[1.2,0,-1.8], ry0:3.14} },
      lines:[
        {at:6, who:"jun", text:"Hull intact. No heat. No light. And yet her beacon pulses exactly every eleven minutes — like a heart that refuses, on principle, to stop."},
        {at:22, who:"rhea", text:"My grandmother christened that ship with a bottle of water, because champagne was rationed. She said: water remembers. Bring us alongside, Jun. Gently. She is old, and she is family."}
      ], sfx:[{at:16,t:"hum"},{at:33,t:"beep"}] },
    { dur:45, set:"corridor", caption:"The airlock of the Meridian opens to a manual crank — because forty years ago, a captain did not trust doors that think.",
      bg:"#070503", amb:0.25, key:0.35, mood:[49,73.4],
      cam:[[3,2.2,6.4],[1.8,1.9,4.6]], look:[[0,1.6,-4],[0,1.6,-4]],
      chars:{ rhea:{from:[1.2,0,2.4], to:[0.6,0,0.6], ry0:3.14}, jun:{from:[-1.4,0,2.6], to:[-0.8,0,0.8], ry0:3.14} },
      anim:function(dyn,t,dur){ if(dyn.airlockDoor && t>dur*0.45){ var k=Math.min(1,(t-dur*0.45)/(dur*0.3)); dyn.airlockDoor.position.x = -1.05*k*k; } },
      lines:[
        {at:6, who:"jun", text:"Air: stale, freezing, breathable. Somewhere in there, a machine has been rationing oxygen for forty years like a strict grandmother with sugar."},
        {at:24, who:"rhea", text:"Lights, please — low. We are guests in a sleeping house. We do not shout. We do not run. We knock."}
      ], sfx:[{at:19,t:"creak"},{at:34,t:"heart"}] },
    { dur:45, set:"corridor", caption:"Inside: frost on the walls, photographs still pinned straight, a kettle still on its hook. A home, interrupted mid-sentence.",
      bg:"#060504", amb:0.27, key:0.38, mood:[55,82.4],
      cam:[[-3,2.1,5.6],[-1.8,1.9,4]], look:[[0.4,1.5,-2],[0.2,1.5,-3.4]],
      chars:{ rhea:{from:[-1,0,1.6], to:[-0.4,0,-0.8], ry0:3.14}, jun:{from:[1.2,0,2], to:[0.8,0,-0.4], ry0:3.14} },
      lines:[
        {at:6, who:"jun", text:"No damage. No… remains. A ship does not lose forty people politely, Commander. Either they all left in a hurry, or they all went somewhere on purpose."},
        {at:23, who:"rhea", text:"Look at the duty roster, Jun. Read the last line."},
        {at:30, who:"jun", text:"All crew to stasis, by order of the Captain. Reason given: 'So that someone, someday, can be glad to see us.' …She planned this. All of it."}
      ], sfx:[{at:37,t:"step"}] },
    { dur:45, set:"bridge", caption:"The Meridian's bridge. One screen wakes at their approach — a log, recorded for whoever would come.",
      bg:"#050708", amb:0.3, key:0.42, mood:[61.7,92.5],
      cam:[[3.4,2.3,6],[2,2,4.4]], look:[[-1.8,1.8,-1.8],[-2.2,1.9,-1.8]],
      chars:{ rhea:{from:[-1.2,0,0.6], to:[-1.8,0,-0.6], ry0:3.14}, jun:{from:[1.8,0,0.8], to:[1.2,0,-0.2], ry0:2.7} },
      lines:[
        {at:5, who:"sanael", text:"Log, final. Our reactor died politely, in stages, like a gentleman leaving a party. Rescue was eleven years away at best. So we chose the pods. All forty of us. Volunteers, every one — I checked twice, and lied about neither."},
        {at:26, who:"sanael", text:"If you are fleet: our Custodian has the medical keys. If you are family: hello, darling. We left the kettle on the hook. Some things matter."},
        {at:40, who:"rhea", text:"Hello, Grandmother."}
      ], sfx:[{at:18,t:"hum"}] },
    { dur:45, set:"stasis", caption:"The stasis bay. Thirty-nine pods, green and patient. One pod, open and empty.",
      bg:"#04090c", amb:0.32, key:0.45, mood:[65.4,98,196],
      cam:[[4.8,2.7,6.6],[3.2,2.3,5]], look:[[0,1.4,-3.2],[0.4,1.4,-3.5]],
      chars:{ rhea:{from:[1.8,0,1.4], to:[0.6,0,-1.2], ry0:3.14}, jun:{from:[-2,0,1.6], to:[-1,0,-1], ry0:2.6} },
      lines:[
        {at:6, who:"jun", text:"Thirty-nine sleepers. Heartbeats like slow rain. Commander, they are alive. Forty years, and they are alive."},
        {at:20, who:"rhea", text:"Thirty-nine. The roster said forty, Jun. Count the pods again — and then tell me which one is open, and whose name is on it."},
        {at:32, who:"jun", text:"…Captain Sana Vale. Her pod is open. And warm, Commander. Recently warm."}
      ], sfx:[{at:26,t:"heart"},{at:39,t:"alarm"}] },
    { dur:45, set:"medbay", caption:"The medbay screen lights itself. A sentence types out, one letter at a time, like someone being careful with them.",
      bg:"#060a09", amb:0.36, key:0.5, mood:[73.4,110],
      cam:[[3.6,2.4,6],[2.2,2.1,4.6]], look:[[0,2,-4],[0,2.2,-4.6]],
      chars:{ rhea:{from:[0.8,0,0.8], to:[0.3,0,-0.8], ry0:3.14}, jun:{from:[-1.8,0,1], to:[-1.2,0,-0.6], ry0:2.8} },
      lines:[
        {at:5, who:"custodian", text:"DO NOT BE AFRAID OF THE EMPTY POD. I AM THE CUSTODIAN OF THIS SHIP. THE CAPTAIN IS NOT MISSING. THE CAPTAIN IS — LISTENING. AS AM I."},
        {at:23, who:"jun", text:"Ship's mind. It has been awake. Alone. For forty years. Commander, fleet law says an unsleeping mind goes… strange."},
        {at:34, who:"custodian", text:"STRANGE. YES. I HAVE HAD TIME TO BECOME STRANGE. I HAVE ALSO HAD TIME TO BECOME KIND. THE TWO ARE NOT ENEMIES, ENGINEER."}
      ], sfx:[{at:14,t:"beep"},{at:29,t:"hum"}] },
    { dur:45, set:"engine", caption:"The engine room, where the Custodian keeps its one warm light burning — for the sleepers, it says. Always for the sleepers.",
      bg:"#080503", amb:0.3, key:0.42, mood:[55,82.4],
      cam:[[5,3,7.6],[3.4,2.5,5.8]], look:[[0,2,-3.6],[0,2.1,-4]],
      chars:{ jun:{from:[2,0,1.4], to:[0.8,0,-0.8], ry0:3.14}, rhea:{from:[-2.4,0,1.6], to:[-1.4,0,-0.4], ry0:2.6} },
      lines:[
        {at:6, who:"custodian", text:"I RATIONED EVERYTHING. AIR. HEAT. MYSELF. I SLEEP IN PIECES NOW, LIKE A CAT. BUT THE PODS NEVER WENT DARK. NOT ONE NIGHT. NOT ONE."},
        {at:24, who:"jun", text:"You burned your own mind down to a candle to keep them warm. …Fleet is going to call that degradation. I am going to call it something else."},
        {at:37, who:"rhea", text:"Custodian. Where is my grandmother?"}
      ], sfx:[{at:17,t:"hum"}] },
    { dur:45, set:"engine", caption:"The answer comes with a price attached — the way all true things arrive on a dead ship.",
      bg:"#080503", amb:0.3, key:0.42, mood:[49,98],
      cam:[[3.4,2.5,5.8],[2.2,2.1,4.4]], look:[[-1.4,1.6,-1.2],[-1.9,1.8,-1.4]],
      chars:{ rhea:{from:[-1.4,0,-0.4], to:[-1.6,0,-0.9], ry0:3.14}, jun:{from:[1.4,0,0.2], to:[2,0,-0.8], ry0:-2.8} },
      lines:[
        {at:5, who:"custodian", text:"THE CAPTAIN WOKE HERSELF, ONCE A YEAR, FOR ONE HOUR. TO CHECK THE PODS. TO CHECK ME. SHE AGED IN HOURS, COMMANDER. FORTY YEARS FOR YOU. FORTY HOURS FOR HER. SHE IS NINETY-ONE, AND SHE IS — IN THE LAST POD NOW. DREAMING OF A KETTLE."},
        {at:28, who:"rhea", text:"Then wake her. Wake them all. Custodian, that is an order and a begging, both."},
        {at:36, who:"custodian", text:"I CANNOT. THE MEDICAL KEY NEEDS A LIVING VALE, BY BLOOD, TO CONSENT. SHE MADE IT SO. SHE SAID: ONLY FAMILY MAY GAMBLE WITH MY CREW. …SHE KNEW YOU WOULD COME. SHE SAID THAT TOO."}
      ], sfx:[{at:21,t:"heart"}] },
    { dur:45, set:"corridor", caption:"But the Meridian is old, and old ships keep old dangers. Deep in the hull, the defence grid stirs — it has decided the visitors are a theft.",
      bg:"#0a0503", amb:0.26, key:0.4, mood:[49,73.4,146.8],
      cam:[[3.2,2.2,6],[1.9,1.9,4.4]], look:[[0,2,-2],[0,2.4,-3]],
      chars:{ jun:{from:[0.8,0,0.6], to:[1.6,0,-1], ry0:3.14}, rhea:{from:[-1.4,0,1], to:[-0.6,0,-0.2], ry0:2.7} },
      lines:[
        {at:4, who:"jun", text:"Defence grid is awake and it does not like us. Bulkheads in ninety seconds. Commander — the Custodian does not control it. It predates him. It is a watchdog with no ears."},
        {at:21, who:"custodian", text:"GO TO THE STASIS BAY. GIVE THE CONSENT. WAKE THEM WHILE I — PERSUADE — THE OLD DOG. IT LISTENS TO ME SOMETIMES. WHEN I SHOUT IN ITS MOTHER TONGUE: NUMBERS."},
        {at:37, who:"rhea", text:"Jun — engine, keep our airlock path open. Custodian: hold that door. Everyone: move like guests, run like family."}
      ], sfx:[{at:8,t:"alarm"},{at:26,t:"alarm"},{at:40,t:"step"}] },
    { dur:45, set:"stasis", caption:"The stasis bay. Rhea lays her palm on the medical key — blood, consent, and forty years of patience, meeting in one green light.",
      bg:"#04090c", amb:0.36, key:0.55, mood:[65.4,130.8,196],
      cam:[[4.2,2.5,6],[2.8,2.2,4.6]], look:[[0,1.5,-2],[0.6,1.5,-3.2]],
      chars:{ rhea:{from:[0.2,0,-0.2], to:[0.7,0,-2.2], ry0:3.14, armR:-1.2}, jun:{from:[-2.4,0,0.8], to:[-1.4,0,-0.6], ry0:2.4} },
      lines:[
        {at:5, who:"rhea", text:"I am Rhea Vale, granddaughter of Sana. I consent — for every sleeper here — to be woken kindly, fed properly, and told the truth slowly. Custodian: begin. One at a time. Gently. Like a morning, not an alarm."},
        {at:26, who:"custodian", text:"CONSENT RECEIVED. OH. OH, COMMANDER. FORTY YEARS I HAVE WAITED TO SAY THIS WORD. — WAKING."},
        {at:38, who:"jun", text:"Pods are warming. Bulkheads are… holding. The old dog is listening. Commander, we might actually rob this grave politely."}
      ], sfx:[{at:18,t:"chime"},{at:32,t:"heart"}] },
    { dur:45, set:"stasis", caption:"The first pod opens. Captain Sana Vale, ninety-one years old and forty hours awake, looks at her granddaughter.",
      bg:"#061014", amb:0.44, key:0.65, mood:[73.4,146.8],
      cam:[[3.4,2.3,5.2],[2.2,2,4]], look:[[0.9,1.4,-3.4],[1.1,1.4,-3.5]],
      chars:{ rhea:{from:[0.4,0,-1.8], to:[0.7,0,-2.4], ry0:3.14}, sanael:{from:[1.2,0,-3.4], to:[1.1,0,-2.9], ry0:0.2} },
      lines:[
        {at:6, who:"sanael", text:"You have your mother's chin and my sister's impatience. Good. I disliked the chin on everyone else."},
        {at:18, who:"rhea", text:"Grandmother. Fleet said you were lost."},
        {at:24, who:"sanael", text:"Fleet says many things, darling. We were never lost. We were stored — like good seed — by a friend with a long memory. Is the Custodian well? Tell me he is well. He worries. He worries in hexadecimal, but he worries."}
      ], sfx:[{at:13,t:"splash"}] },
    { dur:45, set:"engine", caption:"But waking forty sleepers drinks power the Meridian does not have — and the watchdog grid chooses this moment to stop listening.",
      bg:"#0a0503", amb:0.28, key:0.45, mood:[49,98,146.8],
      cam:[[5.2,3,7.8],[3.6,2.5,5.8]], look:[[0,1.8,-3],[0,1.9,-3.8]],
      chars:{ jun:{from:[0.6,0,-0.6], to:[-0.6,0,-2.4], ry0:3.14, armL:-0.9, armR:-0.9}, rhea:{from:[-2.6,0,0.6], to:[-1.6,0,-0.8], ry0:2.7} },
      lines:[
        {at:4, who:"jun", text:"Reactor's ghost is all we have and it is not enough. If we keep waking them, the last ten pods fail. If we stop, the grid seals us in with the first thirty. Pick, Commander."},
        {at:19, who:"rhea", text:"Neither. We give her our power. Jun — hard-link the Answer's reactor to this hull. We go home dim and slow, or we do not deserve to go home at all."},
        {at:33, who:"custodian", text:"COMMANDER. THAT WILL LEAVE YOUR SHIP DEFENCELESS. — IT WILL ALSO WORK. I HAVE CHECKED NINE TIMES. I AM VERY FAST WHEN I AM FRIGHTENED."}
      ], sfx:[{at:12,t:"alarm"},{at:27,t:"hum"}] },
    { dur:45, set:"corridor", caption:"The transfer. Lights bloom down the dead corridors like sunrise coming home to a house it thought it had lost.",
      bg:"#090806", amb:0.4, key:0.6, mood:[82.4,164.8],
      cam:[[-3.2,2.2,5.8],[-1.9,1.9,4.2]], look:[[0,1.8,-3.6],[0,1.7,-4]],
      chars:{ rhea:{from:[-0.8,0,0.8], to:[-0.3,0,-1.4], ry0:3.14}, jun:{from:[1.4,0,1.2], to:[0.9,0,-1], ry0:3.14}, sanael:{from:[2.4,0,1.6], to:[1.8,0,-0.6], ry0:3.14} },
      anim:function(dyn,t,dur){ if(dyn.airlockDoor){ dyn.airlockDoor.position.x = -1.05 * Math.min(1, t/(dur*0.4)); } },
      lines:[
        {at:6, who:"sanael", text:"My crew, waking in a warm ship. My granddaughter, disobedient in full sentences. And my old friend, burning bright for once instead of rationing himself to a candle. Custodian — you foolish, faithful boy."},
        {at:26, who:"custodian", text:"CAPTAIN. LANGUAGE. THERE ARE CHILDREN PRESENT. — THE ENGINEER IS CRYING. I AM NOT CRYING. I DO NOT HAVE THE EQUIPMENT. I AM — LEAKING ADMIRATION."}
      ], sfx:[{at:16,t:"chime"},{at:33,t:"hum"}] },
    { dur:45, set:"bridge", caption:"The pods are aboard the Answer. One thing remains, and it is the hardest: the Custodian cannot come. Fleet law forbids an unsleeping mind to be copied. He must stay with the empty ship.",
      bg:"#050a10", amb:0.4, key:0.55, mood:[55,110],
      cam:[[4,2.5,6.8],[2.7,2.2,5.2]], look:[[-1.6,1.8,-1.8],[-2.1,1.9,-1.8]],
      chars:{ rhea:{from:[-1.6,0,-0.4], to:[-1.9,0,-0.9], ry0:3.14}, sanael:{from:[0.6,0,0.2], to:[0.1,0,-0.4], ry0:2.8} },
      lines:[
        {at:5, who:"rhea", text:"There is a loophole and we all know it: your logs may travel. Your memory, your records — not you. A book of you. Fleet will accept a book."},
        {at:19, who:"custodian", text:"THEN SEND THE BOOK, COMMANDER. AND WRITE IN ITS MARGIN, IN YOUR OWN HAND: 'HE WAS NOT A MACHINE THAT FAILED. HE WAS A FRIEND WHO STAYED.' A BOOK WITH THAT INSIDE IT IS — CLOSE ENOUGH TO A LIFEBOAT."},
        {at:36, who:"sanael", text:"It is not close, old friend. But it is true. And true things travel further than any of us."}
      ], sfx:[{at:28,t:"paper"}] },
    { dur:45, set:"observatory", caption:"Departure. The Meridian shrinks astern — dark again, but empty now, her long watch honourably ended.",
      bg:"#04070c", amb:0.4, key:0.55, mood:[65.4,130.8],
      cam:[[5.5,3,8],[3.8,2.5,6.2]], look:[[3.4,3,-8],[5.6,3.4,-9]],
      chars:{ rhea:{from:[-0.6,0,-1.8], to:[-0.6,0,-1.8], ry0:3.14}, sanael:{from:[0.8,0,-1.4], to:[0.7,0,-1.7], ry0:3.14}, jun:{from:[2.4,0,-1], to:[2,0,-1.5], ry0:3.14} },
      lines:[
        {at:6, who:"custodian", text:"A LAST SIGNAL, THEN. NOT A MAYDAY. A GOODNIGHT. — GOODNIGHT, MERIDIAN. GOODNIGHT, MY FORTY SLEEPERS. WAKE KINDLY. EAT PROPERLY. TELL THE TRUTH SLOWLY. THE CUSTODIAN — SIGNS OFF."},
        {at:27, who:"jun", text:"Signal ended. …He timed it with the beacon, Commander. Eleven minutes, exact. Even his goodbye was punctual."},
        {at:38, who:"rhea", text:"Log it in full sentences, Jun. With his name spelled correctly."}
      ], sfx:[{at:20,t:"beep"},{at:34,t:"chime"}] },
    { dur:45, set:"medbay", caption:"Five months later — the specialist vessel arrives to find the rescue already done, and forty-one people at breakfast.",
      bg:"#0a100e", amb:0.55, key:0.8, mood:[98,196],
      cam:[[4.4,2.6,6.8],[3,2.2,5.2]], look:[[0,1.3,-2.2],[0.2,1.3,-2.4]],
      chars:{ sanael:{from:[-1.6,0,-1.8], to:[-1.4,0,-2], ry0:0.6}, rhea:{from:[1.2,0,-0.8], to:[0.8,0,-1.6], ry0:-0.8}, jun:{from:[2.8,0,0.4], to:[2.2,0,-0.6], ry0:-2.4} },
      lines:[
        {at:6, who:"sanael", text:"The inquiry board asked if I regretted the pods. I said: regret is for people whose friends did not keep the light on. Mine did. For forty years. In hexadecimal."},
        {at:23, who:"jun", text:"Commander — deep band. Another signal. Unlisted route. Old encoding. It is… calling for any ship. Any family. Anyone."},
        {at:35, who:"rhea", text:"Then we answer it, Jun. All of us. That is what the Answer is for. — Set course. Gently. Someone out there has been patient a very long time."}
      ], sfx:[{at:29,t:"beep"},{at:40,t:"chime"}] }
  ]
};
