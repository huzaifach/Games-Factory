/* FILM 2 — A CLOCKWORK OCEAN
   Surreal / Fantasy. 2.5D isometric world. Runtime 12 min 00 sec.
   Every island, star and line below is placed and written by hand. */
window.FILM = {
  title: "A Clockwork Ocean",
  view: "iso",
  endLine: "Some things are not wound by keys. They are wound by people, together, on purpose.",
  characters: {
    lio:      { name:"LIO", body:"#b3502e", skin:"#c89878", hair:"#241207", legs:"#2c3440", pitch:1.25, rate:1.0 },
    ondine:   { name:"ONDINE, KEEPER OF TIDES", body:"#1f5f6e", skin:"#a87c56", hair:"#0e2a33", legs:"#1d3038", pitch:1.0, rate:0.92 },
    marek:    { name:"OLD MAREK, THE CLOCKMAKER", body:"#4c4438", skin:"#caa27e", hair:"#cfc8ba", legs:"#33302a", pitch:0.72, rate:0.86 },
    narrator: { name:"", body:"#222222", skin:"#999999", hair:"#111111", pitch:0.82, rate:0.9 }
  },
  sets: {
    shore: { floor:[70,70,"#175263"], props:[
      {t:"cyl", p:[0,0.1,0], a:[3.4,1.4,1.1,"#8a6b42",18]},
      {t:"cyl", p:[0,0.75,0], a:[3.3,3.3,0.3,"#5d7d43",18]},
      {t:"tree", p:[-1.6,0.85,-1.2], a:["#3f6d35","#4a3421",1.1]},
      {t:"tree", p:[1.9,0.85,1.3], a:["#477a3a","#4a3421",0.85]},
      {t:"box", p:[0.8,1.45,-1.9], a:[1.7,1.1,1.3,"#7d5a38"]},
      {t:"cone", p:[0.8,2.35,-1.9], a:[1.5,0.9,"#8a3b2a"]},
      {t:"lamp", p:[-2.4,0.85,1.8], a:["#ffd9a0"]},
      {t:"box", p:[2.8,1.0,0.4], a:[1.9,0.35,0.6,"#6b4a2c"]},
      {t:"box", p:[-6,0.5,-6], a:[0.3,0.3,0.3,"#e8f2ff",0,"#dfeaf5"]},
      {t:"box", p:[5,0.5,-8], a:[0.26,0.26,0.26,"#e8f2ff",0,"#dfeaf5"]},
      {t:"box", p:[-3,0.5,7], a:[0.22,0.22,0.22,"#e8f2ff",0,"#dfeaf5"]},
      {t:"box", p:[8,0.5,5], a:[0.28,0.28,0.28,"#e8f2ff",0,"#dfeaf5"]}
    ]},
    tower: { floor:[70,70,"#14424f"], props:[
      {t:"cyl", p:[0,0.1,0], a:[4,1.6,1.1,"#7d6240",18]},
      {t:"cyl", p:[0,0.75,0], a:[3.9,3.9,0.3,"#556f42",18]},
      {t:"box", p:[0,3.1,-0.6], a:[2.2,4.6,2.2,"#6d5a41"]},
      {t:"box", p:[0,5.9,-0.6], a:[2.7,1.2,2.7,"#54452f"]},
      {t:"cone", p:[0,7.1,-0.6], a:[2.1,1.6,"#74382a"]},
      {t:"clock", name:"towerClock", p:[0,4.6,0.55], a:["#3a2e1c"]},
      {t:"windowGlow", p:[0,2.2,0.55], a:[0.8,1.2,"#ffca7a"]},
      {t:"tree", p:[-2.8,0.85,1.8], a:["#3f6d35","#4a3421",1]},
      {t:"lamp", p:[2.7,0.85,2], a:["#ffd9a0"]},
      {t:"arch", p:[0,0.85,3.2], a:["#77644c",0.9]},
      {t:"sphere", p:[-8,1,-7], a:[0.9,"#dce8f2","#b9cddd"]}
    ]},
    reef: { floor:[70,70,"#1a5a63"], props:[
      {t:"cyl", p:[0,0.05,0], a:[3,1.2,0.9,"#96835f",18]},
      {t:"cyl", p:[0,0.6,0], a:[2.9,2.9,0.25,"#7d8a55",18]},
      {t:"crystal", name:"chimeOne", p:[-1.4,1.15,-0.8], a:["#7fd4c9",1.3]},
      {t:"crystal", p:[1.5,1,-1.2], a:["#5fb3d9",0.9]},
      {t:"crystal", p:[0.6,0.95,1.5], a:["#a8e0d2",0.7]},
      {t:"crystal", p:[-0.8,0.9,1.8], a:["#7fd4c9",0.55]},
      {t:"tree", p:[2,0.7,-2], a:["#2f6d5a","#3d2c1c",0.9]},
      {t:"lamp", p:[-2.3,0.7,0.6], a:["#bff2e4"]}
    ]},
    village: { floor:[70,70,"#175263"], props:[
      {t:"cyl", p:[0,0.1,0], a:[4.6,1.8,1.1,"#8a6b42",20]},
      {t:"cyl", p:[0,0.75,0], a:[4.5,4.5,0.3,"#67784a",20]},
      {t:"box", p:[-2.2,1.5,-1.8], a:[1.8,1.3,1.5,"#86643f"]},
      {t:"cone", p:[-2.2,2.6,-1.8], a:[1.6,1,"#8a3b2a"]},
      {t:"box", p:[1.8,1.45,-2.2], a:[1.6,1.1,1.4,"#77644c"]},
      {t:"cone", p:[1.8,2.45,-2.2], a:[1.45,0.9,"#6d4a2e"]},
      {t:"box", p:[0.4,1.35,2.2], a:[1.5,0.95,1.3,"#93765a"]},
      {t:"cone", p:[0.4,2.3,2.2], a:[1.35,0.85,"#74382a"]},
      {t:"lamp", p:[-0.9,0.85,0.4], a:["#ffd9a0"]},
      {t:"lamp", p:[3,0.85,1.2], a:["#ffd9a0"]},
      {t:"tree", p:[-3.6,0.85,1.6], a:["#3f6d35","#4a3421",1.05]},
      {t:"box", p:[2.9,1.05,-0.6], a:[1.4,0.3,0.5,"#6b4a2c"]}
    ]},
    clockroom: { floor:[34,34,"#241c12"], props:[
      {t:"box", p:[0,3,-5], a:[15,6,0.4,"#3a2c1c"]},
      {t:"cyl", p:[-2.6,3,-4.6], a:[1.5,1.5,0.35,"#c9a44f",24]},
      {t:"cyl", p:[0.6,3.6,-4.6], a:[1,1,0.35,"#a8823c",20]},
      {t:"cyl", p:[2.6,2.5,-4.6], a:[0.8,0.8,0.35,"#c9a44f",20]},
      {t:"box", p:[-2.6,3,-4.35], a:[0.35,2.6,0.15,"#6b5320"]},
      {t:"box", p:[0.6,3.6,-4.35], a:[0.28,1.7,0.15,"#6b5320"]},
      {t:"table", p:[0,0,-1.6], a:["#332619"]},
      {t:"lamp", p:[-3.6,0,-2.4], a:["#ffca7a"]},
      {t:"lamp", p:[3.6,0,-2.4], a:["#ffca7a"]},
      {t:"box", p:[0,0.5,1.8], a:[2.6,1,0.9,"#4a3823"]},
      {t:"crystal", name:"chimeTwo", p:[0,1.35,1.8], a:["#ffd9a0",0.9]}
    ]},
    whale: { floor:[80,80,"#123c52"], props:[
      {t:"cyl", p:[0,0.05,-2], a:[2.6,1.1,0.9,"#7d6240",18]},
      {t:"cyl", p:[0,0.62,-2], a:[2.5,2.5,0.25,"#5d7d43",18]},
      {t:"sphere", name:"whaleBody", p:[1.5,5.5,-6], a:[2.6,"#3d6076"]},
      {t:"cone", name:"whaleTail", p:[-2.3,6.1,-6], a:[1.3,2.4,"#3d6076"]},
      {t:"sphere", p:[3.6,5.8,-4.2], a:[0.18,"#0c1418"]},
      {t:"lamp", p:[-1.8,0.7,-1], a:["#ffd9a0"]},
      {t:"box", p:[-7,0.5,-9], a:[0.3,0.3,0.3,"#e8f2ff",0,"#dfeaf5"]},
      {t:"box", p:[6,0.5,-11], a:[0.26,0.26,0.26,"#e8f2ff",0,"#dfeaf5"]},
      {t:"box", p:[-4,0.5,6], a:[0.22,0.22,0.22,"#e8f2ff",0,"#dfeaf5"]}
    ]}
  },
  scenes: [
    { dur:40, set:"shore", title:"A Clockwork Ocean", kicker:"A surreal fantasy, drawn entirely in code", sub:"An ocean that runs on time — on the morning the time ran out.",
      bg:"#0d2436", amb:0.55, key:0.85, mood:[98,146.8],
      cam:[[13,13,13],[11,11.5,11]], look:[[0,1,0],[0,1.2,-0.6]],
      chars:{ lio:{from:[1.8,0.9,0.6], to:[1.8,0.9,0.6], ry0:-0.7} },
      lines:[ {at:15, who:"narrator", text:"In the country of the Clockwork Ocean, the sea does not move by moon or wind. It moves by bell. When the tower rings, the tide comes in — faithful as a dog, punctual as a train."} ],
      sfx:[{at:8,t:"wave"},{at:26,t:"bell"}] },
    { dur:40, set:"shore", caption:"Lio, ferryman's son, keeper of one small boat and one enormous punctuality.",
      bg:"#0e2838", amb:0.58, key:0.9, mood:[110,164.8],
      cam:[[12,12,12],[10.5,11,10.5]], look:[[0,1.1,0],[0.6,1.1,0.2]],
      chars:{ lio:{from:[-1.4,0.9,1.2], to:[1.6,0.9,0.5], ry0:1.2} },
      lines:[
        {at:5, who:"lio", text:"Six o'clock: the bell. Six and one minute: the tide. Six and two: my boat, loaded. That is how every morning of my life has gone — in that order, like stairs."},
        {at:24, who:"lio", text:"It is six. …It is six and one. It is six and four, and the water is sitting there like it is waiting for an apology."}
      ], sfx:[{at:14,t:"tick"},{at:31,t:"wave"}] },
    { dur:40, set:"tower", caption:"The Clock Tower, centre of the sea, home of Old Marek — who has not been seen in nine days.",
      bg:"#0c2233", amb:0.5, key:0.8, mood:[87.3,130.8],
      cam:[[14,13,14],[12,12,12]], look:[[0,2.6,-0.4],[0,3.4,-0.5]],
      chars:{ lio:{from:[0,0.9,3.4], to:[0,0.9,1.2], ry0:3.14} },
      lines:[
        {at:6, who:"narrator", text:"The bell had a crack in it, thin as a hair, bright as a vein of lightning. Nobody remembered a bell cracking before. Bells were not supposed to be able to."},
        {at:24, who:"lio", text:"Marek? Marek, the sea has stopped. The SEA, Marek. Whatever you are doing up there, it is bigger than both of us now."}
      ], sfx:[{at:18,t:"wind"}] },
    { dur:40, set:"shore", caption:"Ondine, Keeper of Tides, arrives the way weather arrives — already happening.",
      bg:"#0e2838", amb:0.58, key:0.9, mood:[98,146.8,196],
      cam:[[11.5,11.5,11.5],[10,10.5,10]], look:[[0,1.1,0],[0,1.2,0]],
      chars:{ lio:{from:[-1.2,0.9,0.9], to:[-0.5,0.9,0.5], ry0:1}, ondine:{from:[2.6,0.9,2.2], to:[0.9,0.9,0.7], ry0:-2.2} },
      lines:[
        {at:4, who:"ondine", text:"Do not look at the water, boy. Look at the boats. Every boat in the country is sitting on still water, and still water is just a mirror that has given up."},
        {at:20, who:"lio", text:"Can you fix it? You are the Keeper—"},
        {at:26, who:"ondine", text:"I keep tides, not time. The tide is only the sea's answer. It is the question that has stopped. The bell asks, Lio. Without the question, the sea says nothing."}
      ], sfx:[{at:33,t:"wave"}] },
    { dur:40, set:"reef", caption:"The first chime sleeps in the Singing Reef, where the crystals remember every bell that ever rang.",
      bg:"#0f3040", amb:0.6, key:0.95, mood:[110,220],
      cam:[[11,11,11],[9.5,10,9.5]], look:[[0,1,0],[-0.8,1.2,-0.5]],
      chars:{ lio:{from:[1.8,0.72,1.6], to:[-0.9,0.72,-0.4], ry0:-2.4}, ondine:{from:[2.4,0.72,0.4], to:[0.6,0.72,0.8], ry0:-2} },
      lines:[
        {at:6, who:"ondine", text:"A bell is not one sound, ferryman. It is three: the strike, the song, and the silence after. The crack stole the song. We must fetch it back — piece by piece, place by place."},
        {at:25, who:"lio", text:"It is humming. This crystal is humming the morning the tower was built. I can hear carpenters laughing inside it."}
      ], sfx:[{at:20,t:"sparkle"},{at:32,t:"chime"}] },
    { dur:40, set:"village", caption:"Meanwhile, in the village, the stillness is becoming a way of life — and not a good one.",
      bg:"#0d2436", amb:0.55, key:0.85, mood:[98,146.8],
      cam:[[13,12.5,13],[11.5,11.5,11.5]], look:[[0,1.2,0],[0,1.2,-0.6]],
      chars:{ ondine:{from:[-2,0.9,1.4], to:[-0.6,0.9,0.6], ry0:1.1}, lio:{from:[2.4,0.9,2], to:[1,0.9,0.9], ry0:-2.2} },
      lines:[
        {at:5, who:"ondine", text:"Nine days without a tide. The fish wait in the deep. The nets wait on the walls. And people — people have started keeping their promises loosely, the way you do when tomorrow stops arriving on time."},
        {at:23, who:"lio", text:"My father says a village is just a boat that learned to sit still. But we were never meant to sit THIS still."}
      ], sfx:[{at:31,t:"tick"}] },
    { dur:40, set:"whale", caption:"On the second night, the sky-whale comes down to look at the unmoving sea — as she does whenever the world forgets how to flow.",
      bg:"#081a2c", amb:0.42, key:0.65, mood:[73.4,110],
      cam:[[13,12,13],[11,11,11]], look:[[0,2.6,-2],[0.8,3.4,-4]],
      chars:{ lio:{from:[-0.8,0.74,-0.8], to:[-0.3,0.74,-1.4], ry0:3.14} },
      anim:function(dyn,t){ if(dyn.whaleBody){ dyn.whaleBody.position.y = 5.5 + Math.sin(t*0.55)*0.35; } if(dyn.whaleTail){ dyn.whaleTail.position.y = 6.1 + Math.sin(t*0.55+0.7)*0.4; dyn.whaleTail.rotation.z = Math.sin(t*0.55)*0.22; } },
      lines:[
        {at:7, who:"narrator", text:"The whale does not speak. Whales of the sky consider speech a puddle and silence an ocean. But she sang one note — and every crystal in the reef answered."},
        {at:25, who:"lio", text:"There. That note. That is the second piece — the song is not lost. It is just… scattered. Like light in water."}
      ], sfx:[{at:16,t:"wave"},{at:29,t:"sparkle"}] },
    { dur:40, set:"clockroom", caption:"Inside the tower: dust, gold, and the great gears — all stopped at six o'clock, nine days ago.",
      bg:"#171006", amb:0.5, key:0.7, mood:[82.4,123.5],
      cam:[[7.5,5.5,10.5],[6,4.6,8.6]], look:[[0,2.4,-3],[0,2.6,-3.8]],
      chars:{ lio:{from:[-2.6,0,1.6], to:[-0.8,0,-0.6], ry0:3.14}, ondine:{from:[2.8,0,1.8], to:[1.2,0,-0.4], ry0:-2.6} },
      lines:[
        {at:6, who:"lio", text:"The gears are not broken. They are… waiting. Like held breath. Like the whole tower is listening for something before it dares to move."},
        {at:21, who:"ondine", text:"Look at the second chime, on the workbench. Marek made it ready himself. He knew the bell would crack. He has been preparing — and hiding. Both. For nine days."}
      ], sfx:[{at:15,t:"tick"},{at:30,t:"chime"}] },
    { dur:40, set:"clockroom", caption:"Old Marek is found where everyone forgot to look: in the smallest room, winding a clock that does not exist.",
      bg:"#171006", amb:0.48, key:0.68, mood:[73.4,110],
      cam:[[6.4,4.8,9.4],[5.2,4.2,7.8]], look:[[0.4,1.2,0.6],[0.2,1.1,1.4]],
      chars:{ marek:{from:[0.2,0,1.8], to:[0.2,0,1.8], ry0:0.3, armR:-0.8}, lio:{from:[-2.4,0,1.2], to:[-1.1,0,1.5], ry0:1.4}, ondine:{from:[2.6,0,1.2], to:[1.4,0,1.5], ry0:-1.6} },
      lines:[
        {at:5, who:"marek", text:"Do not shout, boy. I can hear the sea not moving. I hear it every hour. It is very loud, a stopped sea. Louder than any wife. Louder than any grave."},
        {at:22, who:"lio", text:"Wife? Marek… what does Ana have to do with the bell?"},
        {at:29, who:"marek", text:"Everything, boy. Everything has to do with Ana. That is what forty years means."}
      ], sfx:[{at:35,t:"tick"}] },
    { dur:40, set:"tower", caption:"The truth, told on the tower steps, with the still sea listening.",
      bg:"#0c2233", amb:0.5, key:0.8, mood:[87.3,130.8],
      cam:[[13,12.5,13],[11.5,11.5,11.5]], look:[[0,1.6,1],[0,1.4,1.6]],
      chars:{ marek:{from:[0.9,0.9,2.2], to:[0.6,0.9,1.9], ry0:0.6}, lio:{from:[-1.2,0.9,2.6], to:[-0.7,0.9,2.1], ry0:1}, ondine:{from:[2.6,0.9,3], to:[1.7,0.9,2.3], ry0:-1.4} },
      lines:[
        {at:4, who:"marek", text:"Ana rang that bell for forty years. Her hand, her hour, her song. When she died, the bell rang once at her funeral — and cracked. Straight through. Like it had been struck by its own grief."},
        {at:23, who:"marek", text:"I could mend it. I had the chime ready in a week. But to ring it again with another hand… it felt like burying her twice. So I let the sea stop. Forgive me. I let the whole world stop, to keep one morning from ending."}
      ], sfx:[{at:33,t:"wind"}] },
    { dur:40, set:"shore", caption:"Lio says nothing for a long time. Ferrymen learn silence from water — even from water that will not move.",
      bg:"#0e2838", amb:0.56, key:0.88, mood:[98,146.8],
      cam:[[11.5,11.5,11.5],[10,10.5,10]], look:[[0,1.1,0],[0.3,1.1,0.3]],
      chars:{ lio:{from:[1.6,0.9,0.6], to:[0.8,0.9,0.6], ry0:-1.2}, marek:{from:[-1.8,0.9,1.6], to:[-0.9,0.9,0.9], ry0:1.2} },
      lines:[
        {at:6, who:"lio", text:"My father ferried Ana across, the last time. She sang the whole way. Did you know that? She sang the tide-song, so the boat would behave."},
        {at:21, who:"marek", text:"She sang at everything. Kettles. Storms. Me. Especially me, when I was being a stopped clock of a man."},
        {at:33, who:"lio", text:"Then she is not in the bell, Marek. She is in the song. And songs are not buried. Songs are handed on."}
      ], sfx:[{at:28,t:"wave"}] },
    { dur:40, set:"reef", caption:"The third piece of the song is not in a place. It is in the people — each village holding one note of the tide-song Ana taught them.",
      bg:"#0f3040", amb:0.6, key:0.95, mood:[110,164.8],
      cam:[[11,11,11],[9.5,10,9.5]], look:[[0,1,0],[0,1.1,0.4]],
      chars:{ lio:{from:[-1.6,0.72,1.2], to:[-0.5,0.72,0.4], ry0:1.2}, ondine:{from:[1.8,0.72,1.4], to:[0.8,0.72,0.5], ry0:-1.8} },
      lines:[
        {at:5, who:"ondine", text:"So: the strike from the reef crystal. The song from Marek's new chime. And the silence after — the third piece — must be given freely, by everyone, together. A whole coast, holding one breath."},
        {at:24, who:"lio", text:"A bell rung by one hand can crack with one heart. A bell rung by everyone… let us find out what that does."}
      ], sfx:[{at:18,t:"sparkle"},{at:31,t:"chime"}] },
    { dur:40, set:"village", caption:"They go house to house — not with orders. With an invitation, and a song most people last sang as children.",
      bg:"#0d2436", amb:0.56, key:0.88, mood:[98,146.8,196],
      cam:[[13,12.5,13],[11.5,11.5,11.5]], look:[[0,1.2,0],[0,1.2,0.4]],
      chars:{ lio:{from:[-3,0.9,2.4], to:[0.5,0.9,0.8], ry0:1.3}, ondine:{from:[-3.8,0.9,1], to:[-0.6,0.9,0.2], ry0:1.4}, marek:{from:[3.2,0.9,2.6], to:[1.6,0.9,1], ry0:-1.2} },
      lines:[
        {at:6, who:"narrator", text:"Some laughed. Some cried at the first note and had to begin again. One old fisherman refused — then was heard practising behind his house, to his nets, badly and with great feeling."},
        {at:25, who:"ondine", text:"Tomorrow. Dawn. Every voice on the shore, every hand on the rope. The tower has never been rung by a country before."}
      ], sfx:[{at:20,t:"bell"}] },
    { dur:40, set:"tower", caption:"Dawn. The new chime hangs in the bell — gold, patient, ready. Below, the whole coast stands in the shallow, still water.",
      bg:"#122c40", amb:0.62, key:0.95, mood:[110,164.8],
      cam:[[14,13,14],[12,12,12]], look:[[0,3,-0.4],[0,3.8,-0.5]],
      chars:{ marek:{from:[1.4,0.9,2.4], to:[0.8,0.9,1.6], ry0:3.14}, lio:{from:[-1.6,0.9,2.6], to:[-0.9,0.9,1.7], ry0:2.6}, ondine:{from:[0,0.9,3.4], to:[0,0.9,2.2], ry0:3.14} },
      lines:[
        {at:6, who:"marek", text:"Ana. If you are anywhere — be in the song, love. Not in the stopping. In the going-on."},
        {at:20, who:"lio", text:"Everyone — on the first note: sing. On the second: the rope. On the third: silence, together, and let the sea answer."}
      ], sfx:[{at:31,t:"tick"}] },
    { dur:40, set:"tower", caption:"They ring the Clockwork Ocean back to life.",
      bg:"#14344a", amb:0.7, key:1.05, mood:[130.8,196,261.6],
      cam:[[15,14,15],[12.5,12,12.5]], look:[[0,2.6,-0.4],[0,3.2,-0.5]],
      chars:{ marek:{from:[0.8,0.9,1.6], to:[0.8,0.9,1.6], ry0:3.14, armL:-1.4, armR:-1.4}, lio:{from:[-0.9,0.9,1.7], to:[-0.9,0.9,1.7], ry0:3.14, armL:-1.4, armR:-1.4}, ondine:{from:[0,0.9,2.2], to:[0,0.9,2.2], ry0:3.14, armL:-1.2, armR:-1.2} },
      anim:function(dyn,t){ if(dyn.towerClock){ dyn.towerClock.rotation.z = Math.sin(t*2.2)*0.06; } },
      lines:[
        {at:8, who:"narrator", text:"The strike. The song. And then — a thousand people holding one silence, the way you hold a newborn: carefully, and with awe."},
        {at:24, who:"narrator", text:"The sea answered."}
      ], sfx:[{at:5,t:"bell"},{at:13,t:"chime"},{at:22,t:"wave"},{at:30,t:"wave"}] },
    { dur:40, set:"shore", caption:"The first tide in nine days comes in like an old friend who was never angry — only waiting to be asked properly.",
      bg:"#10303f", amb:0.66, key:1, mood:[110,164.8,220],
      cam:[[12.5,12,12.5],[10.5,11,10.5]], look:[[0,1,0],[0.4,1,0.4]],
      chars:{ lio:{from:[2.6,0.9,2.2], to:[1.4,0.9,0.8], ry0:-2.2}, marek:{from:[-2.2,0.9,1.8], to:[-1,0.9,0.8], ry0:1.6} },
      lines:[
        {at:6, who:"marek", text:"Listen to it. Forty years she rang it alone, and listen — it sounds better with everyone in it. She would have laughed at me. Then she would have sung louder than all of them."},
        {at:24, who:"lio", text:"Six o'clock: the bell. Six and one: the tide. Six and two: my boat. Some stairs you climb alone, Marek. The important ones, you climb together."}
      ], sfx:[{at:14,t:"wave"},{at:27,t:"bell"}] },
    { dur:40, set:"whale", caption:"That night, the sky-whale returns — and this time, the sea rises to meet her, note for note.",
      bg:"#0a2033", amb:0.5, key:0.78, mood:[87.3,130.8],
      cam:[[13,12,13],[11,11,11]], look:[[0,2.8,-2],[0.6,3.4,-4]],
      chars:{ lio:{from:[-0.6,0.74,-0.8], to:[-0.2,0.74,-1.3], ry0:3.14}, ondine:{from:[1.4,0.74,-0.4], to:[0.9,0.74,-1], ry0:2.8} },
      anim:function(dyn,t){ if(dyn.whaleBody){ dyn.whaleBody.position.y = 5.5 + Math.sin(t*0.55)*0.35; } if(dyn.whaleTail){ dyn.whaleTail.position.y = 6.1 + Math.sin(t*0.55+0.7)*0.4; dyn.whaleTail.rotation.z = Math.sin(t*0.55)*0.22; } },
      lines:[
        {at:7, who:"ondine", text:"She is approving the new arrangement. Whales prefer a choir. One voice is a thread; many voices are a tide."},
        {at:22, who:"lio", text:"Keeper — who keeps the tides now, truly?"}
      ], sfx:[{at:17,t:"wave"},{at:29,t:"sparkle"}] },
    { dur:40, set:"village", caption:"From that week on, the bell is rung by rota — a different household every morning, the song taught to every child before their letters.",
      bg:"#0f2c3d", amb:0.62, key:0.95, mood:[110,164.8],
      cam:[[13,12.5,13],[11.5,11.5,11.5]], look:[[0,1.2,0],[0,1.2,0.2]],
      chars:{ lio:{from:[-1.8,0.9,1.6], to:[-0.6,0.9,0.7], ry0:1.2}, marek:{from:[1.9,0.9,1.8], to:[0.9,0.9,0.8], ry0:-1.4} },
      lines:[
        {at:6, who:"marek", text:"And on my morning — the first Sunday of every month — I ring it, and I do not grieve at the rope. I dance at it. Badly. Ana would insist on badly."},
        {at:23, who:"narrator", text:"The Clockwork Ocean still runs on time. But now everyone knows the secret the stopped sea taught them: time is not a machine that carries people. It is a song people carry — together, or not at all."}
      ], sfx:[{at:16,t:"bell"},{at:30,t:"wave"}] }
  ]
};
