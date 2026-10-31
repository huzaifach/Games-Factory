/* FILM 4 — THE PAPER GARDEN
   Fantasy / Surreal, animated in code. 2.5D isometric world. Runtime 11 min 00 sec.
   Every fold, flower and line below is placed and written by hand. */
window.FILM = {
  title: "The Paper Garden",
  view: "iso",
  endLine: "To unfold a beloved thing is not to lose it. It is to find out what it was carrying.",
  characters: {
    wren:     { name:"WREN, THE FOLDER", body:"#a03d5c", skin:"#c89878", hair:"#2a1608", legs:"#38304a", pitch:1.28, rate:1.0 },
    fox:      { name:"THE FOX, MADE OF A MAP", body:"#c96a2c", skin:"#e0a05e", hair:"#8a3b12", legs:"#5e3418", pitch:1.1, rate:1.04 },
    tam:      { name:"ELDER TAM", body:"#4e5d43", skin:"#b0835a", hair:"#d9d2c2", legs:"#333a2e", pitch:0.75, rate:0.88 },
    mother:   { name:"MOTHER — A REMEMBERED VOICE", body:"#33506e", skin:"#caa27e", hair:"#241611", pitch:1.0, rate:0.92 },
    narrator: { name:"", body:"#222222", skin:"#999999", hair:"#111111", pitch:0.84, rate:0.9 }
  },
  sets: {
    garden: { floor:[64,64,"#b9c39a"], props:[
      {t:"cyl", p:[0,0.05,0], a:[4.4,1.7,0.7,"#d8cfb2",20]},
      {t:"cyl", p:[0,0.5,0], a:[4.3,4.3,0.25,"#e6dfc8",20]},
      {t:"tree", p:[-2.8,0.6,-2.2], a:["#eef0e2","#cbbfa4",1.2]},
      {t:"tree", p:[2.6,0.6,-2.6], a:["#dfe8d2","#cbbfa4",0.95]},
      {t:"tree", p:[-3.4,0.6,2], a:["#f2e3ec","#cbbfa4",0.85]},
      {t:"sphere", p:[1.6,0.85,1.8], a:[0.42,"#d94f6a"]},
      {t:"sphere", p:[-1.2,0.85,2.6], a:[0.36,"#e8a34d"]},
      {t:"sphere", p:[3.4,0.85,0.6], a:[0.3,"#7fb2c9"]},
      {t:"cone", p:[0.2,0.95,-3.4], a:[0.5,0.9,"#d94f6a"]},
      {t:"arch", p:[0,0.6,4], a:["#efe9d8",0.95]},
      {t:"lamp", p:[-4.2,0.6,0.4], a:["#ffe9a8"]}
    ]},
    river: { floor:[64,64,"#a8b394"], props:[
      {t:"plane", p:[0,0.06,0], a:[30,7,"#2c3e50"]},
      {t:"plane", p:[0,0.09,0], a:[30,4.6,"#3d5a74"]},
      {t:"cyl", p:[-4,0.35,-5.4], a:[3,1.1,0.7,"#d8cfb2",16]},
      {t:"cyl", p:[4.5,0.35,5.2], a:[2.6,1,0.7,"#d8cfb2",16]},
      {t:"tree", p:[-4.6,0.7,-5.8], a:["#eef0e2","#cbbfa4",1]},
      {t:"tree", p:[5,0.7,4.6], a:["#dfe8d2","#cbbfa4",0.8]},
      {t:"box", p:[-1.5,0.5,-3.2], a:[1.6,0.3,0.7,"#b09a72"]},
      {t:"box", p:[1.8,0.5,3.4], a:[1.6,0.3,0.7,"#b09a72"]},
      {t:"crystal", name:"inkStone", p:[0,0.5,-4.6], a:["#2c3e50",0.8]}
    ]},
    house: { floor:[34,34,"#d8cfb2"], props:[
      {t:"box", p:[0,2.7,-4.8], a:[14,5.4,0.3,"#efe9d8"]},
      {t:"box", p:[-4.6,2.7,0], a:[0.3,5.4,9.6,"#e6dfc8"]},
      {t:"table", p:[0,0,-1.4], a:["#b09a72"]},
      {t:"box", p:[0,0.82,-1.4], a:[1.1,0.06,0.8,"#ffffff"]},
      {t:"chair", p:[-1.4,0,-0.4], a:["#cbbfa4"], ry:1.2},
      {t:"chair", p:[1.4,0,-2.2], a:["#cbbfa4"], ry:-2.2},
      {t:"lamp", p:[-3.8,0,-3.6], a:["#ffe9a8"]},
      {t:"windowGlow", p:[2.6,3,-4.6], a:[2,2.2,"#bcd6e8"]},
      {t:"box", name:"paperHouse", p:[3.4,0.55,1.2], a:[1.3,1.1,1.1,"#f6f1de"]},
      {t:"cone", name:"paperRoof", p:[3.4,1.5,1.2], a:[1.05,0.7,"#d94f6a"]}
    ]},
    hill: { floor:[64,64,"#aeb894"], props:[
      {t:"cyl", p:[0,0.4,0], a:[3.6,1.5,1.6,"#d8cfb2",20]},
      {t:"cyl", p:[0,1.35,0], a:[3.5,3.5,0.25,"#e6dfc8",20]},
      {t:"tree", p:[-2.2,1.5,-1.6], a:["#eef0e2","#cbbfa4",1.3]},
      {t:"arch", p:[0,1.5,2.8], a:["#efe9d8",1.1]},
      {t:"sphere", name:"cloudOne", p:[-3.4,5.6,-3], a:[1.15,"#f4f4ee"]},
      {t:"sphere", name:"cloudTwo", p:[-2,5.9,-3.2], a:[0.85,"#f4f4ee"]},
      {t:"sphere", name:"cloudThree", p:[3.8,6.2,-2], a:[1,"#e9e9e2"]},
      {t:"lamp", p:[2.8,1.5,1.8], a:["#ffe9a8"]}
    ]},
    vault: { floor:[36,36,"#bfc9a8"], props:[
      {t:"box", p:[0,2.8,-5], a:[15,5.6,0.3,"#d3dec0"]},
      {t:"box", p:[-4.8,2.8,0], a:[0.3,5.6,10,"#ccd8ba"]},
      {t:"box", p:[4.8,2.8,0], a:[0.3,5.6,10,"#ccd8ba"]},
      {t:"cyl", p:[-2.8,0.9,-2.6], a:[0.9,0.9,1.8,"#e6dfc8",14]},
      {t:"cyl", p:[0,0.9,-3], a:[0.9,0.9,1.8,"#dfe8d2",14]},
      {t:"cyl", p:[2.8,0.9,-2.6], a:[0.9,0.9,1.8,"#f2e3ec",14]},
      {t:"crystal", name:"seedHeart", p:[0,1.6,0.6], a:["#d94f6a",1.1]},
      {t:"lamp", p:[-4,0,-0.6], a:["#ffe9a8"]},
      {t:"lamp", p:[4,0,-0.6], a:["#ffe9a8"]}
    ]}
  },
  scenes: [
    { dur:44, set:"garden", title:"The Paper Garden", kicker:"A fantasy, folded entirely in code", sub:"In a garden where everything is paper, rain is the only true magic.",
      bg:"#26331f", amb:0.62, key:0.95, mood:[98,146.8],
      cam:[[12,12,12],[10.5,11,10.5]], look:[[0,1,0],[0,1.1,0.4]],
      chars:{ wren:{from:[1.4,0.62,1.4], to:[1.4,0.62,1.4], ry0:-0.8} },
      lines:[ {at:16, who:"narrator", text:"Beyond the last road of the ordinary world there is a garden folded from paper — trees, birds, one small fox, and a girl who can fold anything except the thing she wants most."} ],
      sfx:[{at:9,t:"paper"},{at:27,t:"sparkle"}] },
    { dur:44, set:"garden", caption:"Wren, the Folder, at her morning rounds: watering the paper roses with thimbles of ink.",
      bg:"#2a3822", amb:0.64, key:0.98, mood:[110,164.8],
      cam:[[11,11,11],[9.5,10,9.5]], look:[[0,1,0.6],[0.8,1,1]],
      chars:{ wren:{from:[-2.2,0.62,2.2], to:[1.4,0.62,1.6], ry0:1.2, armR:-0.8} },
      lines:[
        {at:5, who:"wren", text:"Drink, little roses. Not too much — you are paper, not fish. One thimble each, and a kind word. Mother always said kind words are half the watering."},
        {at:23, who:"wren", text:"There. The garden is awake. The garden is — wait. Why are the edges curling? Paper curls when the air goes thirsty."}
      ], sfx:[{at:15,t:"paper"},{at:33,t:"splash"}] },
    { dur:44, set:"river", caption:"The River of Ink, which feeds the garden, has run low — and this morning, for the first time in living memory, it has stopped altogether.",
      bg:"#22303a", amb:0.56, key:0.85, mood:[87.3,130.8],
      cam:[[12,11.5,12],[10.5,10.5,10.5]], look:[[0,0.6,-1],[0,0.6,-2]],
      chars:{ wren:{from:[-3.4,0.72,-4.4], to:[-1.6,0.72,-3.6], ry0:1} },
      lines:[
        {at:6, who:"wren", text:"Dry. The riverbed is dry, and written all over with sentences nobody finished. A river of ink should never run out of things to say."},
        {at:23, who:"narrator", text:"Upstream, the spring was sealed — not by malice, but by a grief so large it had nowhere else to sit. But Wren did not know that yet. She knew only the fox."}
      ], sfx:[{at:17,t:"paper"}] },
    { dur:44, set:"river", caption:"The Fox, made of a map of a country that no longer exists, knows every road except the way home.",
      bg:"#22303a", amb:0.58, key:0.88, mood:[98,146.8],
      cam:[[11,11,11],[9.5,10,9.5]], look:[[-0.6,0.8,-3],[-0.2,0.9,-3.4]],
      chars:{ wren:{from:[-1.6,0.72,-3.6], to:[-1,0.72,-3.8], ry0:1.2}, fox:{from:[2.4,0.72,-4.6], to:[0.6,0.72,-4], ry0:-1.8} },
      lines:[
        {at:4, who:"fox", text:"You are following the river the wrong way, Folder. Rivers are read from the spring, like letters. You are starting at the signature."},
        {at:19, who:"wren", text:"And you are a map with legs. Do you even know where the spring is, or only how to look folded and mysterious about it?"},
        {at:30, who:"fox", text:"I know it is behind the Hill of Unfinished Clouds, where Elder Tam keeps the seeds. I know because I am the map they drew to get there. Nobody has unfolded me in years. It itches, being knowledge nobody uses."}
      ], sfx:[{at:36,t:"paper"}] },
    { dur:44, set:"house", caption:"Before the journey: Wren's house, and on the shelf, her masterpiece — the paper house she folded the year her mother left for the far side of the rain.",
      bg:"#2c2618", amb:0.58, key:0.85, mood:[82.4,123.5],
      cam:[[7,5.5,10],[5.8,4.8,8.4]], look:[[1.8,1,0.4],[2.8,1,1]],
      chars:{ wren:{from:[0.8,0,0.8], to:[2.2,0,0.9], ry0:0.9} },
      lines:[
        {at:6, who:"wren", text:"One thousand folds. A house with her room, and her window, and her chair by the window — so that if she ever comes back as anything small, a bird, a rumour, a rain — she will have somewhere to land."},
        {at:26, who:"mother", text:"A remembered voice: Fold what the world needs, Wren. Not what you are afraid to lose. The world will know the difference, even when you do not."},
        {at:38, who:"wren", text:"I am not taking the house, journey or no journey. Some things do not travel. Some things are the reason you come back."}
      ], sfx:[{at:19,t:"paper"}] },
    { dur:44, set:"garden", caption:"Elder Tam, who folded the first tree of the garden when the world was still deciding to exist.",
      bg:"#2a3822", amb:0.62, key:0.95, mood:[98,146.8],
      cam:[[11.5,11.5,11.5],[10,10.5,10]], look:[[0,1.1,0.6],[0.2,1.1,0.8]],
      chars:{ tam:{from:[-1.8,0.62,1.8], to:[-0.8,0.62,1.2], ry0:1.2}, wren:{from:[2.2,0.62,2.2], to:[1.1,0.62,1.4], ry0:-2} },
      lines:[
        {at:5, who:"tam", text:"The spring is sealed by the Seed Heart, child — the first seed, which I folded from the last page of the first book. It has closed itself. Seeds do that when they are frightened."},
        {at:23, who:"wren", text:"What frightens a seed, Elder?"},
        {at:28, who:"tam", text:"Being opened. Everything a seed is, it is because it has not opened yet. To open is to bet the whole self on a season you cannot see. You know something of that, Folder. So do I. So did she."}
      ], sfx:[{at:35,t:"sparkle"}] },
    { dur:44, set:"hill", caption:"The Hill of Unfinished Clouds, where the rain of next year waits, half-folded, for permission.",
      bg:"#27333a", amb:0.55, key:0.85, mood:[87.3,110],
      cam:[[12.5,12,12.5],[11,11,11]], look:[[0,2.2,-1],[0,2.6,-1.8]],
      chars:{ wren:{from:[-1.6,1.48,1.6], to:[-0.6,1.48,0.6], ry0:0.8}, fox:{from:[1.8,1.48,2], to:[0.9,1.48,0.9], ry0:-1.6} },
      anim:function(dyn,t){ if(dyn.cloudOne){ dyn.cloudOne.position.x = -3.4 + Math.sin(t*0.4)*0.3; } if(dyn.cloudThree){ dyn.cloudThree.position.x = 3.8 + Math.sin(t*0.33+1)*0.35; } },
      lines:[
        {at:6, who:"fox", text:"Look at them. Clouds that were never finished. The gardeners of the old days folded rain by the season — a year's weather, stacked like laundry. Then the folders grew afraid of storms, and stopped."},
        {at:25, who:"wren", text:"Afraid of a storm, in a garden. So they chose a drought instead. Grown-ups always think the quiet disaster is the safe one."}
      ], sfx:[{at:18,t:"wind"},{at:32,t:"paper"}] },
    { dur:44, set:"vault", caption:"The Seed Vault. And in it, the Seed Heart — closed tight as a fist, tight as a held breath, tight as a certain small house on a certain shelf.",
      bg:"#26301f", amb:0.55, key:0.85, mood:[98,196],
      cam:[[7.5,5.5,10.5],[6.2,4.8,8.8]], look:[[0,1.5,-1],[0,1.6,-0.2]],
      chars:{ wren:{from:[-1.8,0,1.6], to:[-0.7,0,0.8], ry0:2.6, armR:-1}, fox:{from:[2,0,1.8], to:[1.1,0,1], ry0:-2.4}, tam:{from:[3,0,-0.6], to:[2.2,0,0], ry0:-2.8} },
      lines:[
        {at:6, who:"tam", text:"It will open for one thing only: a fold given away. Not made — given. The greatest fold its maker owns, unfolded by her own hands, so its paper can become cloud."},
        {at:25, who:"wren", text:"No. Ask anything else. Ask my hands, my years, my name. Not the house. You know whose house it is."},
        {at:36, who:"tam", text:"I do, child. That is why it must be the house. A seed knows a true price the way a scale knows weight. It cannot be fooled, and it cannot be hurried. Neither can you."}
      ], sfx:[{at:19,t:"heart"}] },
    { dur:44, set:"house", caption:"She goes home the long way, through a garden that is curling at the edges like a letter held too near a flame.",
      bg:"#2c2618", amb:0.54, key:0.8, mood:[73.4,110],
      cam:[[7,5.5,10],[5.8,4.8,8.4]], look:[[2,1,0.8],[3,1,1.1]],
      chars:{ wren:{from:[0.4,0,0.6], to:[2.4,0,1], ry0:1} },
      lines:[
        {at:6, who:"wren", text:"One thousand folds. Her room. Her window. Her chair by the window. If I unfold it — there is nowhere left for her to land. She will be nowhere. She will be — rained on the whole world and nowhere at all."},
        {at:25, who:"mother", text:"A remembered voice, very close: Fold what the world needs, Wren. Not what you are afraid to lose."},
        {at:35, who:"wren", text:"…That is a cruel thing to have said to a daughter, Mother. It is also — I have checked from every side — true."}
      ], sfx:[{at:17,t:"paper"},{at:31,t:"heart"}] },
    { dur:44, set:"river", caption:"The fox finds her at the dry river, holding the paper house the way you hold a bird with a broken wing.",
      bg:"#22303a", amb:0.55, key:0.85, mood:[87.3,130.8],
      cam:[[11,11,11],[9.5,10,9.5]], look:[[-0.4,0.8,-3.4],[-0.2,0.9,-3.6]],
      chars:{ wren:{from:[-0.8,0.72,-3.4], to:[-0.8,0.72,-3.4], ry0:0.4, armL:-0.7, armR:-0.7}, fox:{from:[2.2,0.72,-4.4], to:[0.8,0.72,-3.9], ry0:-1.9} },
      lines:[
        {at:5, who:"fox", text:"I am a map of a country that no longer exists, Folder. Do you know what I learned, being that? A country is not its paper. Neither is a person. Neither is a mother."},
        {at:22, who:"fox", text:"Unfold me one day, when I am done — I insist on it. Let me be weather. Let me be everywhere at once and rained on a thousand gardens. It sounds — from down here, folded — like the finest thing left."},
        {at:37, who:"wren", text:"You are the bravest geography I know, fox."}
      ], sfx:[{at:30,t:"wind"}] },
    { dur:44, set:"vault", caption:"The unfolding. She does it slowly, fold by fold, saying the room aloud as each one opens — so the house is not destroyed. It is read.",
      bg:"#2a3822", amb:0.6, key:0.92, mood:[110,164.8,220],
      cam:[[7.5,5.5,10.5],[6,4.7,8.6]], look:[[0,1.4,0],[0,1.5,0.4]],
      chars:{ wren:{from:[-0.7,0,0.8], to:[-0.5,0,0.6], ry0:2.8, armL:-0.8, armR:-0.8}, tam:{from:[2.2,0,0], to:[1.8,0,0.3], ry0:-2.6}, fox:{from:[-2.4,0,1.2], to:[-1.8,0,0.9], ry0:2.2} },
      lines:[
        {at:5, who:"wren", text:"Her room. Her window. Her chair by the window. The roof she would have laughed at — I never could fold a straight roof. The door I made too small, because some part of me wanted her to have to stay."},
        {at:24, who:"wren", text:"There. The last fold. It is not a house any more. It is a page. And the page says — it always said — go on. Go on. Go on."}
      ], sfx:[{at:14,t:"paper"},{at:27,t:"paper"},{at:36,t:"sparkle"}] },
    { dur:44, set:"hill", caption:"The page rises. On the Hill of Unfinished Clouds, a year's folded weather remembers what it is for.",
      bg:"#2b3a42", amb:0.62, key:0.95, mood:[110,164.8],
      cam:[[12.5,12,12.5],[11,11,11]], look:[[0,2.6,-1.6],[0,3,-2]],
      chars:{ wren:{from:[-0.6,1.48,0.6], to:[-0.4,1.48,0.4], ry0:3.14, armL:-1.3, armR:-1.3}, fox:{from:[1.2,1.48,1.2], to:[0.9,1.48,0.8], ry0:2.8}, tam:{from:[-2.4,1.48,1.8], to:[-1.7,1.48,1.1], ry0:2.4} },
      anim:function(dyn,t){ if(dyn.cloudOne){ dyn.cloudOne.position.x = -3.4 + Math.sin(t*0.5)*0.5; dyn.cloudOne.position.y = 5.6 + Math.sin(t*0.7)*0.2; } if(dyn.cloudTwo){ dyn.cloudTwo.position.x = -2 + Math.sin(t*0.45+1)*0.5; } if(dyn.cloudThree){ dyn.cloudThree.position.x = 3.8 + Math.sin(t*0.4+2)*0.5; } },
      lines:[
        {at:7, who:"tam", text:"The Seed Heart is opening. Hear that? That is the sound a held breath makes when it finally trusts the air."},
        {at:22, who:"wren", text:"Rain. Real rain — not ink, not story. Weather. My mother is weather now. She is about to be everywhere at once, and rained on a thousand gardens."}
      ], sfx:[{at:15,t:"thunder"},{at:28,t:"wave"},{at:37,t:"sparkle"}] },
    { dur:44, set:"garden", caption:"The rain comes home to the Paper Garden — gentle, because the garden is paper, and the sky, for once, is considerate.",
      bg:"#2c3d2a", amb:0.66, key:0.98, mood:[110,196],
      cam:[[12,12,12],[10.5,11,10.5]], look:[[0,1,0.4],[0,1.1,0.6]],
      chars:{ wren:{from:[0.8,0.62,1.2], to:[0.6,0.62,1], ry0:3.14, armL:-0.5, armR:-0.5}, fox:{from:[2.2,0.62,1.8], to:[1.5,0.62,1.3], ry0:-2.4} },
      lines:[
        {at:6, who:"fox", text:"I am getting wet, Folder, and I am a MAP. My rivers are running off my back. My capital city is sliding towards my tail. I have never been happier, or less accurate."},
        {at:23, who:"wren", text:"The roses are drinking. The trees are uncurling. And the rain on my face is — hers. All of it is hers, and none of it is a house, and I am not sorry. Listen to me: I am not sorry."}
      ], sfx:[{at:13,t:"splash"},{at:26,t:"wave"},{at:36,t:"chime"}] },
    { dur:44, set:"river", caption:"By evening the River of Ink runs full and dark and talkative — and every sentence in it, at last, is finished.",
      bg:"#27383f", amb:0.6, key:0.9, mood:[98,164.8],
      cam:[[12,11.5,12],[10.5,10.5,10.5]], look:[[0,0.6,-1],[0,0.6,-1.6]],
      chars:{ wren:{from:[-3.2,0.72,-4.6], to:[-2,0.72,-4], ry0:1.2}, tam:{from:[3.4,0.72,3.8], to:[2.2,0.72,3.2], ry0:-2.2} },
      lines:[
        {at:6, who:"tam", text:"You did the hardest fold of all, child: the fold that opens. The garden will teach it now, every spring, in your name and hers both."},
        {at:22, who:"wren", text:"Tomorrow I will fold a new house, Elder. Smaller. With a door that opens both ways — and a sign for travellers: nobody lives here. Everybody is welcome. There is a difference, and the world knows it."}
      ], sfx:[{at:16,t:"wave"},{at:31,t:"paper"}] },
    { dur:44, set:"garden", caption:"And on the first dry morning after the rain, Wren finds, by the gate, a single new fold she does not remember making.",
      bg:"#2e3d24", amb:0.66, key:1, mood:[110,164.8,220],
      cam:[[11.5,11.5,11.5],[10,10.5,10]], look:[[0,1,2.6],[0,1.1,3.2]],
      chars:{ wren:{from:[0.8,0.62,1.6], to:[0.3,0.62,2.6], ry0:0.4, armR:-0.9}, fox:{from:[2,0.62,2.6], to:[1.2,0.62,3], ry0:-2.2} },
      lines:[
        {at:6, who:"fox", text:"A boat. She folded you a boat, Folder. Out of rain, by the look of the creases. Even the weather remembers her hands."},
        {at:20, who:"wren", text:"Then I will sail it down the river of finished sentences, and see what country is at the end of the ink. — Coming, fox? You are the map, after all."},
        {at:33, who:"narrator", text:"And the garden, which is paper, and the river, which is ink, and the girl, who is neither and both, went on — the way all true stories do: by opening."}
      ], sfx:[{at:26,t:"sparkle"},{at:38,t:"chime"}] }
  ]
};
