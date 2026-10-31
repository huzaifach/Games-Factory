/* FILM 1 — THE DOOR THAT BREATHES
   Horror / Psychological. 3D world. Runtime 15 min 25 sec.
   Every set, position, line and cue below is written by hand. */
window.FILM = {
  title: "The Door That Breathes",
  view: "persp",
  endLine: "A door kept by fear stays shut forever. A door kept by choice can finally rest.",
  characters: {
    mara:     { name:"MARA", body:"#5b2333", skin:"#c89878", hair:"#191008", legs:"#26222a", pitch:1.08, rate:0.95 },
    mother:   { name:"AMMA", body:"#274156", skin:"#b0835a", hair:"#232323", legs:"#1e2430", pitch:0.88, rate:0.92 },
    door:     { name:"THE DOOR", body:"#20202a", skin:"#777777", hair:"#101010", pitch:0.42, rate:0.74 },
    sana:     { name:"SANA — ON THE PHONE", body:"#33523a", skin:"#caa27e", hair:"#241611", pitch:1.22, rate:1.0 },
    narrator: { name:"", body:"#222222", skin:"#999999", hair:"#111111", pitch:0.8, rate:0.9 }
  },
  sets: {
    living: { floor:[26,26,"#3a2a1c"], props:[
      {t:"box", p:[0,2.6,-4.6], a:[16,5.2,0.3,"#4c4038"]},
      {t:"box", p:[-6.4,2.6,0], a:[0.3,5.2,9.4,"#453a32"]},
      {t:"plane", p:[0,0.012,0.4], a:[7.5,5,"#6d2f28"]},
      {t:"box", p:[-1.8,0.42,0.6], a:[3.2,0.85,1.25,"#31424e"]},
      {t:"box", p:[-1.8,1.0,0.15], a:[3.2,0.75,0.35,"#31424e"]},
      {t:"table", p:[0.6,0,0.7], a:["#241a12"]},
      {t:"chair", p:[2.2,0,1.6], a:["#5a4326"], ry:2.6},
      {t:"lamp", p:[-4.6,0,-2.8], a:["#ffb45e"]},
      {t:"door", name:"doorLiving", p:[4.9,0,-4.35], a:["#4a2c17"]},
      {t:"windowGlow", p:[-3.4,2.7,-4.4], a:[2.2,2.4,"#9db8d9"]},
      {t:"clock", p:[1.8,3.1,-4.4], a:["#3a2e1c"]},
      {t:"box", p:[-5.9,1.1,-4.3], a:[1.1,2.2,0.35,"#2e2119"]},
      {t:"box", p:[-5.9,2.05,-4.05], a:[0.9,0.12,0.5,"#7a4b2a"]},
      {t:"box", p:[-5.9,1.45,-4.05], a:[0.8,0.12,0.5,"#31424e"]},
      {t:"screen", p:[0.2,1.5,3.6], a:["#7fb2c9"], ry:3.14159}
    ]},
    hallway: { floor:[26,26,"#332619"], props:[
      {t:"box", p:[0,2.6,-4.6], a:[16,5.2,0.3,"#40342c"]},
      {t:"box", p:[-4.2,2.6,0], a:[0.3,5.2,9.4,"#3a2f27"]},
      {t:"box", p:[4.2,2.6,0], a:[0.3,5.2,9.4,"#3a2f27"]},
      {t:"box", p:[-1.15,1.5,-3.95], a:[1.05,3,0.35,"#5d3a26"]},
      {t:"box", p:[1.15,1.5,-3.95], a:[1.05,3,0.35,"#5d3a26"]},
      {t:"box", p:[-1.15,0.75,-4.15], a:[1.05,1.5,0.3,"#6e3b2a"]},
      {t:"box", p:[1.15,0.75,-4.15], a:[1.05,1.5,0.3,"#6e3b2a"]},
      {t:"box", p:[0,2.25,-4.15], a:[1.2,1.5,0.3,"#63382a"]},
      {t:"door", name:"doorHall", p:[0,0,-3.7], a:["#4a2c17"]},
      {t:"lamp", p:[-3.4,0,-2.6], a:["#ff9d4d"]},
      {t:"plane", p:[0,0.012,0.5], a:[2.2,7,"#5e2a24"]},
      {t:"box", p:[3.6,0.5,1.8], a:[0.7,1,0.7,"#2c2119"]}
    ]},
    kitchen: { floor:[26,26,"#3d332a"], props:[
      {t:"box", p:[0,2.6,-4.6], a:[16,5.2,0.3,"#575046"]},
      {t:"box", p:[-3.5,1.05,-4.35], a:[6.5,2.1,0.6,"#6b5b45"]},
      {t:"box", p:[-3.5,2.45,-4.35], a:[6.5,0.9,0.55,"#7d6a50"]},
      {t:"windowGlow", p:[2.8,2.9,-4.4], a:[2,1.9,"#aebfd2"]},
      {t:"table", p:[0.8,0,-0.6], a:["#3a2c1e"]},
      {t:"chair", p:[0.1,0,0.35], a:["#4e3a24"], ry:0.4},
      {t:"chair", p:[1.6,0,-1.5], a:["#4e3a24"], ry:3.4},
      {t:"lamp", p:[3.8,0,-3.4], a:["#ffd08a"]},
      {t:"cyl", p:[-1.4,1.18,-4.0], a:[0.14,0.14,0.25,"#8a8f96",12]},
      {t:"box", p:[3.9,0.75,0.8], a:[1.3,1.5,1.1,"#7c8894"]}
    ]},
    bedroom: { floor:[26,26,"#2f2833"], props:[
      {t:"box", p:[0,2.6,-4.6], a:[16,5.2,0.3,"#443c4c"]},
      {t:"box", p:[-1.6,0.32,-2.2], a:[3.4,0.65,1.9,"#5b2333"]},
      {t:"box", p:[-1.6,0.75,-3.05], a:[3.4,0.5,0.3,"#6d2f40"]},
      {t:"box", p:[-2.6,0.72,-2.4], a:[1,0.18,0.6,"#e6ddcb"]},
      {t:"box", p:[-0.6,0.72,-2.4], a:[1,0.18,0.6,"#cfc4ae"]},
      {t:"table", p:[1.8,0,-2.6], a:["#241c2c"]},
      {t:"lamp", p:[1.8,0.78,-2.6], a:["#ffbe78"]},
      {t:"windowGlow", p:[3.4,2.7,-4.4], a:[2,2.3,"#8fa9cc"]},
      {t:"door", name:"doorBed", p:[-5.2,0,-4.35], a:["#3c2417"]},
      {t:"plane", p:[0.4,0.012,0.8], a:[5,3.6,"#372b45"]}
    ]},
    childhood: { floor:[26,26,"#54402a"], props:[
      {t:"box", p:[0,2.6,-4.6], a:[16,5.2,0.3,"#77644c"]},
      {t:"plane", p:[0,0.012,0.4], a:[7.5,5,"#96603a"]},
      {t:"box", p:[-1.8,0.42,0.6], a:[3.2,0.85,1.25,"#5d6d57"]},
      {t:"table", p:[0.6,0,0.7], a:["#4a3420"]},
      {t:"lamp", p:[-4.6,0,-2.8], a:["#ffc978"]},
      {t:"door", name:"doorChild", p:[4.9,0,-4.35], a:["#6b4226"]},
      {t:"windowGlow", p:[-3.4,2.7,-4.4], a:[2.2,2.4,"#ffd9a0"]},
      {t:"clock", p:[1.8,3.1,-4.4], a:["#4a3420"]},
      {t:"chair", p:[2.2,0,1.6], a:["#6e5230"], ry:2.6}
    ]},
    behind: { floor:[30,30,"#0a0908"], props:[
      {t:"box", p:[0,3,-7], a:[20,6,0.4,"#17110d"]},
      {t:"box", p:[-2.2,1.5,-6.6], a:[2,3,0.4,"#5d3a26"]},
      {t:"box", p:[2.2,1.5,-6.6], a:[2,3,0.4,"#53332a"]},
      {t:"box", p:[0,0.75,-6.6], a:[2.4,1.5,0.4,"#63382a"]},
      {t:"box", p:[0,2.4,-6.6], a:[2.4,1.2,0.4,"#4e2e22"]},
      {t:"door", name:"doorBehind", p:[0,0,-6.1], a:["#5d3a1e"]},
      {t:"cyl", p:[-4,1.1,-4], a:[0.06,0.06,2.2,"#ffb45e",8,"#ffb45e"]},
      {t:"cyl", p:[4,1.1,-4], a:[0.06,0.06,2.2,"#ffb45e",8,"#ffb45e"]}
    ]},
    exterior: { floor:[40,40,"#14161c"], props:[
      {t:"box", p:[0,3.2,-6], a:[13,6.4,0.5,"#4a3d33"]},
      {t:"box", p:[0,6.9,-6], a:[14,1.1,1.6,"#33261c"]},
      {t:"door", name:"doorOut", p:[-1.5,0,-5.6], a:["#4a2c17"]},
      {t:"windowGlow", p:[2.6,3.4,-5.7], a:[2.2,2,"#ffca7a"]},
      {t:"windowGlow", p:[-4.4,3.4,-5.7], a:[1.6,2,"#91a9c9"]},
      {t:"lamp", p:[5.5,0,-2], a:["#ffd9a0"]},
      {t:"tree", p:[-6.5,0,-2.5], a:["#1d2b1e","#3a2a1a",1.4]},
      {t:"plane", p:[0,0.012,2], a:[16,3.4,"#23252c"]},
      {t:"sphere", p:[7.5,8.5,-14], a:[1.1,"#e8edf5","#cfd9ea"]}
    ]}
  },
  scenes: [
    { dur:40, set:"living", title:"The Door That Breathes", kicker:"A horror film, written entirely in code", sub:"No cameras were used. Every frame is drawn by code.",
      bg:"#07080c", amb:0.22, key:0.25, mood:[55,82.4],
      cam:[[7,3.4,9],[4.6,2.2,6.2]], look:[[0,1.4,-2],[4.4,1.5,-4]],
      chars:{ mara:{from:[-1.8,0,0.6], to:[-1.8,0,0.6], ry0:3.14} },
      lines:[ {at:16, who:"narrator", text:"Some houses keep their families safe. Hers kept a promise instead — and a promise, kept too long, becomes a lock."} ],
      sfx:[{at:30,t:"heart"}] },
    { dur:45, set:"living", caption:"Mara, thirty-one, has lived alone in her mother's house for one year — since the funeral.",
      bg:"#0a0c12", amb:0.4, key:0.5, mood:[65.4,98],
      cam:[[3.5,2.4,7.5],[1.2,1.9,5.6]], look:[[-1,1.2,0],[-1.6,1.1,0.2]],
      chars:{ mara:{from:[-1.8,0,0.6], to:[-1.8,0,0.6], ry0:3.14} },
      lines:[
        {at:5, who:"mother", text:"Voicemail, Amma: Eat properly, Mara. And lock the front door before dark. You know how I feel about that door."},
        {at:19, who:"mara", text:"I know, Amma. I lock it. Every night I lock it, and every morning it is… open. Just a little. Just enough."},
        {at:33, who:"mara", text:"Old houses settle. That is what the carpenter said. Houses settle, doors swell, hinges sigh. Normal things."}
      ], sfx:[{at:12,t:"tick"}] },
    { dur:45, set:"kitchen", caption:"That evening, making tea she will not drink.",
      bg:"#0b0d13", amb:0.42, key:0.5, mood:[73.4,110],
      cam:[[-4.5,2.6,5.5],[-2.6,2,4.2]], look:[[0,1.1,-2],[-0.6,1.1,-3]],
      chars:{ mara:{from:[-1.2,0,-2.8], to:[-0.4,0,-1.6], ry0:3.14} },
      lines:[
        {at:6, who:"mara", text:"One cup. I still fill the kettle for two. A whole year, and my hands have not learned what my heart has."},
        {at:22, who:"narrator", text:"Then — from the front of the house — three knocks. Slow. Polite. Exactly the way her mother used to knock on her bedroom door."}
      ], sfx:[{at:20,t:"knock"},{at:36,t:"heart"}] },
    { dur:40, set:"hallway", caption:"The hallway. The front door. Nobody there — nobody could be there.",
      bg:"#060709", amb:0.2, key:0.3, mood:[49,73.4],
      cam:[[2.8,1.9,5.8],[1.4,1.7,3.8]], look:[[0,1.5,-3.6],[0,1.5,-3.7]],
      chars:{ mara:{from:[1.6,0,2.2], to:[0.7,0,0.4], ry0:3.14} },
      anim:function(dyn,t){ if(dyn.doorHall){ var s = 1 + Math.sin(t*1.35)*0.016; dyn.doorHall.scale.set(s,1,1); } },
      lines:[
        {at:7, who:"mara", text:"Who is there? …Answer me. Please. Someone answer me."},
        {at:20, who:"mara", text:"It is breathing. Doors do not breathe. Wood does not — oh God. Oh God, it is breathing."}
      ], sfx:[{at:4,t:"creak"},{at:26,t:"heart"},{at:33,t:"heart"}] },
    { dur:45, set:"living", caption:"She calls Sana, her oldest friend, the way you call someone to prove the world is still normal.",
      bg:"#0a0c12", amb:0.4, key:0.5, mood:[65.4,98],
      cam:[[-4.6,2.4,6],[-3,2,4.4]], look:[[-1.4,1.1,0.4],[-1.7,1,0.5]],
      chars:{ mara:{from:[-0.6,0,1.8], to:[-1.7,0,0.7], ry0:2.6} },
      lines:[
        {at:4, who:"sana", text:"Mara? It is midnight. Is everything—"},
        {at:11, who:"mara", text:"The front door breathes, Sana. In… and out. And this morning there were wood shavings on the mat. Fresh ones. From the inside."},
        {at:26, who:"sana", text:"Then leave. Tonight. Come to my place, bring nothing, just—"},
        {at:35, who:"mara", text:"I tried on Tuesday. The key would not turn. The carpenter came Wednesday — for him, it turned like butter."}
      ], sfx:[{at:40,t:"knock"}] },
    { dur:45, set:"bedroom", caption:"She does not sleep. She listens to the house the way the house listens to her.",
      bg:"#07070d", amb:0.25, key:0.3, mood:[55,65.4],
      cam:[[4.4,2.6,4.6],[3,2.1,3.2]], look:[[-1.6,0.9,-2.2],[-1.6,0.9,-2.3]],
      chars:{ mara:{from:[-1.6,0.55,-2.2], to:[-1.6,0.55,-2.2], ry0:0.7, lean:0.12} },
      lines:[
        {at:8, who:"mara", text:"Amma used to say: the world is a wolf, beta, and a door is a mother's hand. Hold the hand. Never let go of the hand."},
        {at:24, who:"door", text:"…Mara…"},
        {at:31, who:"mara", text:"No. No no no. Houses do not say my name. Houses do not say my name in my mother's voice."}
      ], sfx:[{at:22,t:"creak"},{at:37,t:"heart"}] },
    { dur:40, set:"childhood", caption:"Memory. Mara is nine years old. There was a fire in the street that winter, three houses down.",
      bg:"#171006", amb:0.62, key:0.85, mood:[87.3,130.8],
      cam:[[4.8,2.8,7.6],[3.4,2.2,5.8]], look:[[0,1.3,-1],[1.6,1.3,-3]],
      chars:{ mother:{from:[3.4,0,-2.6], to:[4.2,0,-3.4], ry0:3.14}, mara:{from:[2.6,0,-1.6], to:[3.3,0,-2.4], ry0:3.14} },
      lines:[
        {at:5, who:"mother", text:"Look at me, Mara. The fire took the Ahmeds' house because their door was open to the street. Open to everything."},
        {at:19, who:"mara", text:"Amma, it was an accident. The stove—"},
        {at:26, who:"mother", text:"Accidents walk through open doors, beta. Sorrow walks through open doors. You will lock this door, and this door will keep you. That is its job. That is my job."}
      ], sfx:[{at:34,t:"bell"}] },
    { dur:45, set:"kitchen", caption:"Morning. Grey light. And on the inside of the front door: four long scratches in the varnish. From inside. Reaching down.",
      bg:"#0d1016", amb:0.5, key:0.55, mood:[73.4,110],
      cam:[[-3.8,2.2,4.6],[-2.2,1.8,3.4]], look:[[0.6,1.1,-1],[0.2,1,-1.4]],
      chars:{ mara:{from:[1.4,0,0.8], to:[0.2,0,-0.8], ry0:3.14} },
      lines:[
        {at:7, who:"mara", text:"Scratches. On the inside. As if something spent the whole night politely asking to be let… no. Not out. As if something was trying to get further in."},
        {at:25, who:"mara", text:"I am a rational woman. I mark exam papers. I pay bills. Rational women do not nail their own front doors shut. …Where are the nails?"},
        {at:38, who:"narrator", text:"She found the hammer. She did not find the courage. There is a difference, and the house knew it."}
      ], sfx:[{at:17,t:"paper"}] },
    { dur:45, set:"living", caption:"Mrs. Iqbal from next door comes for her weekly tea — and stops in the doorway, looking at the door.",
      bg:"#0b0d13", amb:0.45, key:0.55, mood:[65.4,98],
      cam:[[4.6,2.5,6.4],[3,2.1,4.8]], look:[[1,1.3,-2],[3,1.4,-3.6]],
      chars:{ mara:{from:[-1.4,0,0.5], to:[-0.8,0,0.2], ry0:1.2}, mother:{from:[5.2,0,-1.2], to:[4.4,0,-2.2], ry0:-1.8} },
      lines:[
        {at:5, who:"mother", text:"Mrs. Iqbal: Your mother stood at this door every evening, beta. Hand flat on the wood. Whispering. We all heard her, some nights."},
        {at:20, who:"mara", text:"Whispering what, Auntie?"},
        {at:26, who:"mother", text:"Mrs. Iqbal: The same thing, for thirty years. Keep her in. Keep the world out. Keep her in. Keep the world out. Like a prayer. Like a… sentence."},
        {at:40, who:"mara", text:"Auntie. What did you come to tell me, really?"}
      ], sfx:[{at:33,t:"tick"}] },
    { dur:40, set:"hallway", caption:"That night the door opens by itself. Two inches. No more. It is an invitation, and it is a warning, and it is both at once.",
      bg:"#050608", amb:0.16, key:0.24, mood:[49,61.7],
      cam:[[2.2,1.8,5.2],[1,1.6,3.4]], look:[[0,1.5,-3.7],[0,1.5,-3.7]],
      chars:{ mara:{from:[1.8,0,2.6], to:[1.1,0,1.2], ry0:3.14} },
      anim:function(dyn,t,dur){ if(dyn.doorHall){ var k=Math.min(1,t/dur); dyn.doorHall.position.x = -0.85*k*k; } },
      lines:[
        {at:9, who:"mara", text:"Cold. The cold is coming in under it, and it smells like… rain on hot stone. Like the street after the fire, when I was nine."},
        {at:26, who:"door", text:"…cold… out there… cold…"}
      ], sfx:[{at:5,t:"creak"},{at:18,t:"wind"},{at:32,t:"heart"}] },
    { dur:45, set:"bedroom", caption:"Enough. She packs a bag — clothes, papers, her mother's photograph. She will sleep in her car if she has to.",
      bg:"#08080e", amb:0.3, key:0.38, mood:[55,82.4],
      cam:[[-4.4,2.6,4.8],[-2.8,2.1,3.6]], look:[[0,0.9,-1],[-0.8,0.9,-1.8]],
      chars:{ mara:{from:[0.6,0,0.6], to:[-1.2,0,-1.4], ry0:3.14, armR:-0.9} },
      lines:[
        {at:6, who:"mara", text:"Passport. Charger. Amma's picture. If a house wants to keep me, it can keep my furniture. It cannot keep me."},
        {at:22, who:"sana", text:"On the phone: Yes! Finally. I am putting the kettle on. Drive slowly, text me at every— Mara? Mara, what is that sound?"},
        {at:35, who:"mara", text:"That… is every window in this house. Closing. One. By. One."}
      ], sfx:[{at:33,t:"creak"},{at:38,t:"creak"},{at:42,t:"heart"}] },
    { dur:45, set:"hallway", caption:"Bag in hand, she stands before the door and puts her key in the lock. The key turns. The door does not care.",
      bg:"#060709", amb:0.18, key:0.28, mood:[49,73.4],
      cam:[[2.6,2,5.4],[1.2,1.7,3.6]], look:[[0,1.5,-3.7],[0,1.4,-3.7]],
      chars:{ mara:{from:[0.9,0,1.6], to:[0.45,0,0.5], ry0:3.14, armR:-1.1} },
      lines:[
        {at:6, who:"mara", text:"Open. Open, damn you. I am not a child. I am not nine years old and the street is not on fire. OPEN."},
        {at:21, who:"door", text:"…keep her in… keep the world out…"},
        {at:30, who:"mara", text:"That is not your voice. That is hers. You are wearing her voice like a coat you stole."}
      ], sfx:[{at:14,t:"knock"},{at:36,t:"heart"}] },
    { dur:45, set:"living", caption:"The phone dies at ninety percent battery. The television turns itself on: static, and in the static, a shape like a woman standing at a door.",
      bg:"#090a10", amb:0.32, key:0.4, mood:[61.7,92.5],
      cam:[[-4.8,2.4,5.6],[-3.2,2,4.2]], look:[[0,1.3,2.4],[0.1,1.4,3.4]],
      chars:{ mara:{from:[-1.6,0,0.6], to:[-1.2,0,1.4], ry0:0.2} },
      lines:[
        {at:7, who:"mara", text:"No signal. No power cut — the street lights are on. It is only this house that has gone… held. Like a breath. Like a fist."},
        {at:24, who:"narrator", text:"Every exit sealed itself with the patience of thirty years of practice. The house was not attacking her. The house was protecting her. That was the horror of it."},
        {at:38, who:"mara", text:"Amma. What did you do? What did you ask this house to do?"}
      ], sfx:[{at:16,t:"hum"},{at:31,t:"heart"}] },
    { dur:45, set:"behind", caption:"She sleeps at last, from pure exhaustion — and dreams she is very small, standing on the other side of her own front door.",
      bg:"#030304", amb:0.14, key:0.2, mood:[41.2,61.7],
      cam:[[3.4,2.2,4.6],[1.6,1.8,2.6]], look:[[0,1.5,-6],[0,1.5,-6.1]],
      chars:{ mara:{from:[1.2,0,-1.5], to:[0.5,0,-3.6], ry0:3.14} },
      lines:[
        {at:8, who:"mara", text:"This is the inside of the door. The wood is warm. It is warm like… like a hand. Oh. Oh no. I understand the scratches now."},
        {at:24, who:"mother", text:"From far away, young and frightened: Keep her in. Keep the world out. Whatever it costs. Whatever it costs me."},
        {at:37, who:"mara", text:"It was never trying to get in. For thirty years, something in this wood has been trying to get OUT."}
      ], sfx:[{at:15,t:"heart"},{at:30,t:"creak"}] },
    { dur:45, set:"hallway", caption:"She wakes on the hallway floor at 3 a.m. The door is breathing faster now. Almost… panicked.",
      bg:"#050608", amb:0.16, key:0.26, mood:[49,73.4],
      cam:[[-2.6,1.7,5],[-1.2,1.6,3.4]], look:[[0,1.5,-3.7],[0,1.5,-3.7]],
      chars:{ mara:{from:[-0.8,0,1.8], to:[-0.3,0,0.6], ry0:3.14} },
      anim:function(dyn,t){ if(dyn.doorHall){ var s = 1 + Math.sin(t*2.3)*0.02; dyn.doorHall.scale.set(s,1,1); } },
      lines:[
        {at:6, who:"mara", text:"You are frightened. Thirty years of holding — and you are tired, aren't you? A promise is a heavy thing to be."},
        {at:22, who:"door", text:"…keep… her… in…"},
        {at:30, who:"mara", text:"Tonight we talk. You and I. No — not like this. Face to face. Hand to wood. The way she did it."}
      ], sfx:[{at:12,t:"heart"},{at:20,t:"heart"},{at:38,t:"creak"}] },
    { dur:45, set:"hallway", caption:"She lays her palm flat on the door, the way her mother did ten thousand evenings. The breathing slows under her hand.",
      bg:"#07080b", amb:0.24, key:0.36, mood:[55,82.4],
      cam:[[1.7,1.8,4.2],[0.8,1.7,3]], look:[[0,1.5,-3.7],[0,1.5,-3.7]],
      chars:{ mara:{from:[0.4,0,-0.6], to:[0.15,0,-1.8], ry0:3.14, armR:-1.35} },
      lines:[
        {at:5, who:"mara", text:"I know what you are. You are not a ghost. You are a vow. She stood here the night of the fire, shaking, and she poured thirty years of fear into you. And you kept it. Faithfully. Like a dog. Like a mother."},
        {at:27, who:"door", text:"…she… said… keep…"},
        {at:35, who:"mara", text:"She is gone, old friend. A year gone. Nobody told you. Nobody tells the door anything. You have been guarding an empty order."}
      ], sfx:[{at:18,t:"heart"}] },
    { dur:50, set:"childhood", caption:"The whole memory, at last, the way the door remembers it: that winter night, the fire, and a young mother alone with terror.",
      bg:"#180f06", amb:0.6, key:0.8, mood:[82.4,123.5],
      cam:[[5.2,3,8],[3.6,2.3,5.6]], look:[[2,1.4,-3],[3.8,1.4,-3.8]],
      chars:{ mother:{from:[3.2,0,-2.2], to:[4.4,0,-3.5], ry0:3.14, armR:-1.3}, mara:{from:[-1.6,0,0.6], to:[-1.2,0,0.4], ry0:1.4} },
      lines:[
        {at:5, who:"mother", text:"Hear me. Whatever is in wood and iron and threshold — hear me. My daughter. Keep her in. Keep the world out. Take my fear and make it a wall. Take my years, if you need years."},
        {at:26, who:"narrator", text:"The house took her at her word. It always takes us at our word. That is why we must be careful what we say to the dark, in the voice of love."},
        {at:40, who:"mother", text:"There. It is done. Sleep now, Mara. Nothing will ever reach you. I have made sure. I have made… sure."}
      ], sfx:[{at:18,t:"thunder"},{at:33,t:"bell"}] },
    { dur:45, set:"living", caption:"Dawn has not come, but something in the house has loosened. Mara sits with her mother's photograph and says the unsaid things.",
      bg:"#0b0d13", amb:0.42, key:0.5, mood:[65.4,98],
      cam:[[-4.2,2.3,5.8],[-2.7,1.9,4.4]], look:[[-1.5,1,0.4],[-1.7,1,0.5]],
      chars:{ mara:{from:[-1.7,0,0.6], to:[-1.7,0,0.6], ry0:2.8, armL:-0.7, armR:-0.7} },
      lines:[
        {at:6, who:"mara", text:"You were not a villain, Amma. You were a frightened woman with a burnt street and a small daughter, and you did the strongest thing you knew. I forgive the fear. I do."},
        {at:25, who:"mara", text:"But I cannot live inside your fear. It kept me safe the way a coffin keeps a body safe. Preserved. Untouched. Unlived."},
        {at:38, who:"mother", text:"A memory, gentle at last: Lock the door before dark, beta. …And open it in the morning. I always opened it in the morning. Didn't I?"}
      ], sfx:[{at:33,t:"paper"}] },
    { dur:50, set:"hallway", caption:"Mara stands at the door for the last time — not with a key, not with a hammer. With a new sentence.",
      bg:"#08090d", amb:0.3, key:0.42, mood:[55,82.4,110],
      cam:[[2,1.9,4.6],[0.9,1.7,3.1]], look:[[0,1.5,-3.7],[0,1.5,-3.7]],
      chars:{ mara:{from:[0.5,0,-0.4], to:[0.1,0,-1.9], ry0:3.14, armR:-1.35} },
      lines:[
        {at:5, who:"mara", text:"Hear me now, the way you heard her. The old order is finished. I release you from it — every night of it, every scratch of it. And I give you a new one, mine, freely chosen:"},
        {at:24, who:"mara", text:"I will lock you at night because I choose to. And I will open you every morning because I choose to. A door kept by choice. Not by fear. Rest now. Your watch is over."},
        {at:41, who:"door", text:"…rest… …thank… you…"}
      ], sfx:[{at:34,t:"creak"},{at:44,t:"chime"}] },
    { dur:45, set:"exterior", caption:"Morning. Real morning — birds, bread vans, the ordinary world, going about its business.",
      bg:"#131a26", amb:0.65, key:0.95, mood:[98,146.8],
      cam:[[6.5,3.4,8.5],[4,2.6,6]], look:[[-1.5,1.6,-5],[-1.4,1.5,-5.4]],
      chars:{ mara:{from:[-1.5,0,-4.6], to:[-1.2,0,0.8], ry0:0.1} },
      anim:function(dyn,t,dur){ if(dyn.doorOut){ var k=Math.min(1,t/(dur*0.5)); dyn.doorOut.position.x = -1.5 - 0.95*k*k; } },
      lines:[
        {at:8, who:"narrator", text:"The key turned like butter. Of course it did. It was never the lock. It was never even the door."},
        {at:22, who:"mara", text:"Cold air. Street air. Wolf air, Amma would say. …It smells like rain and bread and other people's lives. It smells wonderful."},
        {at:36, who:"mara", text:"I am going for a walk. A long one. And tonight — tonight I will come home and lock my door. Because I choose to."}
      ], sfx:[{at:5,t:"creak"},{at:15,t:"wind"},{at:30,t:"bell"}] },
    { dur:35, set:"living", caption:"Evening. The house, quiet. The door — just a door, doing a door's honest work.",
      bg:"#0c0e14", amb:0.48, key:0.6, mood:[73.4,110],
      cam:[[3.8,2.4,7],[2.4,2,5.2]], look:[[2,1.4,-3],[4.2,1.5,-4.2]],
      chars:{ mara:{from:[1.2,0,1.4], to:[3.6,0,-2.6], ry0:3.14, armR:-1.2} },
      lines:[
        {at:7, who:"mara", text:"Locked. By my hand, for my reasons. Sleep well, old friend."},
        {at:19, who:"narrator", text:"And if, some nights, the wood seems to sigh in its frame — well. Houses settle. Doors swell. Hinges sigh. Normal things. She smiles when it happens, now."}
      ], sfx:[{at:13,t:"tick"},{at:28,t:"chime"}] }
  ]
};
