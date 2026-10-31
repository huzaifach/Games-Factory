/* FILM 5 — NINE MINUTES EARLY
   Psychological thriller in the shape of a sketch. 3D world. Runtime 10 min 00 sec.
   Fifteen scenes. The room resets. The man, at first, does not. */
window.FILM = {
  title: "Nine Minutes Early",
  view: "persp",
  endLine: "The way out was never the door. It was the other person in the room.",
  characters: {
    dev:    { name:"DEV", body:"#31506e", skin:"#a87c56", hair:"#14100c", legs:"#26262e", pitch:1.0, rate:1.02 },
    bell:   { name:"MS BELL, THE RECEPTIONIST", body:"#6e2438", skin:"#caa27e", hair:"#1c1410", legs:"#2e2230", pitch:1.12, rate:0.94 },
    yusuf:  { name:"YUSUF, THE OTHER CANDIDATE", body:"#4e5d43", skin:"#8a6242", hair:"#d9d2c2", legs:"#33302a", pitch:0.74, rate:0.88 },
    serra:  { name:"DR SERRA — BEHIND THE DOOR", body:"#333333", skin:"#999999", hair:"#111111", pitch:0.95, rate:0.9 },
    narrator:{ name:"", body:"#222222", skin:"#999999", hair:"#111111", pitch:0.8, rate:0.9 }
  },
  sets: {
    waiting: { floor:[26,26,"#3d3830"], props:[
      {t:"box", p:[0,2.7,-4.8], a:[16,5.4,0.3,"#5a5348"]},
      {t:"box", p:[-5.6,2.7,0], a:[0.3,5.4,9.6,"#524b41"]},
      {t:"box", p:[0,1.05,-4.55], a:[6.4,2.1,0.5,"#6b6154"]},
      {t:"screen", name:"ticketScreen", p:[0,2.9,-4.5], a:["#ffd9a0"]},
      {t:"clock", name:"roomClock", p:[3.9,3.4,-4.6], a:["#3a2e1c"]},
      {t:"chair", p:[-3.2,0,0.8], a:["#44586b"], ry:0.3},
      {t:"chair", p:[-1.9,0,0.9], a:["#44586b"], ry:0.15},
      {t:"chair", p:[2.4,0,0.8], a:["#5d5344"], ry:-0.3},
      {t:"chair", p:[3.7,0,0.9], a:["#5d5344"], ry:-0.15},
      {t:"table", p:[0.4,0,1.6], a:["#33291f"]},
      {t:"lamp", p:[-5,0,-3.6], a:["#ffd9a0"]},
      {t:"door", name:"officeDoor", p:[-4.2,0,-4.55], a:["#3c2c1c"]},
      {t:"plane", p:[0,0.012,0.6], a:[8,4.6,"#6e3b2a"]}
    ]},
    office: { floor:[24,24,"#38332c"], props:[
      {t:"box", p:[0,2.7,-4.6], a:[14,5.4,0.3,"#4c463e"]},
      {t:"table", p:[0,0,-1.2], a:["#2c2318"]},
      {t:"chair", p:[0,0,0.3], a:["#44586b"], ry:3.14},
      {t:"chair", p:[0,0,-2.6], a:["#6e2438"], ry:0},
      {t:"windowGlow", p:[3.6,3,-4.4], a:[2.2,2.4,"#cfd8de"]},
      {t:"lamp", p:[-3.8,0,-3.4], a:["#ffd9a0"]},
      {t:"clock", p:[-3.4,3.6,-4.4], a:["#3a2e1c"]},
      {t:"box", p:[2.2,0.8,-4.2], a:[1.6,1.6,0.6,"#5d5344"]}
    ]},
    street: { floor:[36,36,"#4a463e"], props:[
      {t:"box", p:[0,3.4,-6.4], a:[15,6.8,0.5,"#5f574c"]},
      {t:"windowGlow", p:[-3.6,3.8,-6.1], a:[2.4,2.4,"#ffd9a0"]},
      {t:"windowGlow", p:[3.2,3.8,-6.1], a:[2.4,2.4,"#bcd6e8"]},
      {t:"door", name:"streetDoor", p:[0,0,-6.1], a:["#3c2c1c"]},
      {t:"lamp", p:[-5.4,0,-2], a:["#ffe9a8"]},
      {t:"lamp", p:[5.4,0,-2], a:["#ffe9a8"]},
      {t:"tree", p:[-7,0,-3], a:["#4e6d43","#4a3421",1.2]},
      {t:"plane", p:[0,0.012,1], a:[14,3,"#5d574e"]}
    ]}
  },
  scenes: [
    { dur:40, set:"waiting", title:"Nine Minutes Early", kicker:"A psychological thriller, in the shape of a sketch", sub:"He was early for his interview. He has been early for nine years.",
      bg:"#12100d", amb:0.5, key:0.7, mood:[73.4,110],
      cam:[[4.4,2.6,7.2],[3,2.2,5.6]], look:[[0,1.6,-3],[0,1.8,-4]],
      chars:{ dev:{from:[2.6,0,2.4], to:[1.2,0,1.2], ry0:-2.4} },
      lines:[ {at:16, who:"narrator", text:"Dev arrived nine minutes early for the most important interview of his life. He had rehearsed everything: the handshake, the answers, the laugh at exactly the right length."} ],
      sfx:[{at:9,t:"tick"},{at:26,t:"doorbell"}] },
    { dur:40, set:"waiting", caption:"Loop one. The waiting room. Ms Bell, at the desk, without looking up.",
      bg:"#13110e", amb:0.52, key:0.72, mood:[73.4,110],
      cam:[[3.6,2.4,6.4],[2.4,2.1,5]], look:[[-0.6,1.5,-3.4],[-0.4,1.5,-4]],
      chars:{ dev:{from:[1.4,0,1.4], to:[0.4,0,-0.6], ry0:3.14}, bell:{from:[0,0,-3.9], to:[0,0,-3.9], ry0:0} },
      lines:[
        {at:4, who:"bell", text:"Name. — Dev. Interview for the position. Take a ticket, fill the form, sit, wait to be called. The form is in triplicate: one for us, one for you, one for your shadow."},
        {at:19, who:"dev", text:"My… shadow?"},
        {at:23, who:"bell", text:"Your shadow gets its own copy of everything, sir. Company policy. Shadows resign first if the paperwork is sloppy. Sit."}
      ], sfx:[{at:31,t:"paper"}] },
    { dur:40, set:"waiting", caption:"The form: Name. Age. Greatest achievement. Greatest fear. Reason for leaving your last position — and your last three dreams.",
      bg:"#13110e", amb:0.52, key:0.72, mood:[82.4,110],
      cam:[[-4.2,2.4,6.2],[-2.8,2.1,4.8]], look:[[-2.4,1,0.8],[-2.2,1,0.85]],
      chars:{ dev:{from:[-2.3,0,0.85], to:[-2.3,0,0.85], ry0:0.4, armL:-0.7, armR:-0.7}, bell:{from:[0,0,-3.9], to:[0,0,-3.9], ry0:0} },
      lines:[
        {at:5, who:"dev", text:"Reason for leaving last position. …'The position left me first.' No. Too honest. 'Seeking growth.' There. Growth. Everyone forgives growth."},
        {at:19, who:"dev", text:"Last three dreams. One: I am late. Two: I am early and it is worse. Three: a woman at a desk asks me to — wait. Wait. That is not a dream. That is Tuesday. That is THIS."},
        {at:33, who:"bell", text:"Pens down in ten seconds, please. The clock is listening."}
      ], sfx:[{at:28,t:"tick"}] },
    { dur:40, set:"waiting", caption:"The bell above the office door rings. Dev stands —",
      bg:"#14110d", amb:0.5, key:0.7, mood:[73.4,146.8],
      cam:[[3.8,2.4,6.6],[2.6,2.1,5.2]], look:[[-2,1.8,-4],[-3.2,1.8,-4.4]],
      chars:{ dev:{from:[-2.3,0,0.85], to:[-1.4,0,-0.8], ry0:3.14}, bell:{from:[0,0,-3.9], to:[0,0,-3.9], ry0:0}, yusuf:{from:[3,0,0.85], to:[3,0,0.85], ry0:-0.4} },
      lines:[
        {at:5, who:"bell", text:"Not you, sir. The gentleman will go first. His appointment was nine years ago. He has seniority."},
        {at:16, who:"dev", text:"Nine YEARS ago? He has been waiting nine years?"},
        {at:22, who:"yusuf", text:"It passes quickly, young man. If you do not count. Counting is the mistake. I counted the first year. Now I just — sit well. Sitting well is a skill. Sit well."}
      ], sfx:[{at:3,t:"bell"},{at:30,t:"tick"}] },
    { dur:40, set:"waiting", caption:"Loop two. The bell rings. The room resets. Dev will swear the clock reads nine minutes to the hour — again.",
      bg:"#12100d", amb:0.5, key:0.7, mood:[65.4,98],
      cam:[[4.4,2.6,7.2],[3,2.2,5.6]], look:[[0,1.6,-3],[0,1.8,-4]],
      fade:true,
      chars:{ dev:{from:[2.6,0,2.4], to:[1.2,0,1.2], ry0:-2.4}, bell:{from:[0,0,-3.9], to:[0,0,-3.9], ry0:0} },
      lines:[
        {at:5, who:"bell", text:"Name. — Dev. Interview for the position. Take a ticket, fill the form, sit, wait to be called."},
        {at:16, who:"dev", text:"You said that already. Word for word. The triplicate. The shadow. Ms Bell — we have DONE this."},
        {at:27, who:"bell", text:"Have we, sir? How odd. I would remember. My memory is excellent. It is my job to remember for people who — sit, please. The form."}
      ], sfx:[{at:3,t:"bell"},{at:33,t:"paper"}] },
    { dur:40, set:"waiting", caption:"This time, Dev watches everything. The clock. The door. The other candidate, Yusuf, who is not surprised by anything.",
      bg:"#12100d", amb:0.5, key:0.7, mood:[65.4,98],
      cam:[[-4.4,2.5,6.4],[-3,2.2,5]], look:[[2.4,1.2,0.6],[2.9,1.1,0.8]],
      chars:{ dev:{from:[-2.3,0,0.85], to:[-2.3,0,0.85], ry0:0.9}, yusuf:{from:[3,0,0.85], to:[3,0,0.85], ry0:-1.2}, bell:{from:[0,0,-3.9], to:[0,0,-3.9], ry0:0} },
      lines:[
        {at:5, who:"dev", text:"Yusuf. Be honest with me. How many times have we sat in this room?"},
        {at:13, who:"yusuf", text:"Counting is the mistake, I told you. But since you ask with your whole face: enough times that I stopped bringing sandwiches. The room feeds you, if you let it. Little biscuits of the same day."},
        {at:29, who:"dev", text:"And the interview? Has anyone — ever — gone through that door and come back?"},
        {at:36, who:"yusuf", text:"Come back? Young man. Nobody comes back. That is rather the point of the door."}
      ], sfx:[{at:21,t:"tick"}] },
    { dur:40, set:"office", caption:"Loop three begins inside the interview room — which is impossible, because Dev never entered it. Dr Serra's chair is empty. Her voice is not.",
      bg:"#100e0c", amb:0.44, key:0.62, mood:[55,82.4],
      cam:[[3.2,2.3,5.6],[2.1,2,4.2]], look:[[0,1.5,-2.2],[0,1.5,-2.6]],
      chars:{ dev:{from:[0,0,0.5], to:[0,0,-0.4], ry0:3.14} },
      lines:[
        {at:5, who:"serra", text:"Sit down, Dev. Tell me why you want this position."},
        {at:13, who:"dev", text:"I — where are you? If this is a test of composure, I would like it noted that I am composing extremely well for a man interviewing with furniture."},
        {at:25, who:"serra", text:"Noted. Your composure is excellent. It has been excellent for nine years. Now: answer badly, for once. Tell me why you want this position — badly, truly, and without the rehearsed laugh."}
      ], sfx:[{at:33,t:"heart"}] },
    { dur:40, set:"office", caption:"The truth, arriving badly, the way Dr Serra ordered.",
      bg:"#100e0c", amb:0.44, key:0.62, mood:[61.7,92.5],
      cam:[[2.6,2.1,4.8],[1.7,1.9,3.8]], look:[[0,1.4,-1.6],[0,1.4,-2]],
      chars:{ dev:{from:[0,0,-0.4], to:[0,0,-0.9], ry0:3.14, lean:0.08} },
      lines:[
        {at:4, who:"dev", text:"I do not want the position. I want — the day to be over. I have wanted the day to be over for nine years. I rehearse my whole life now. Handshakes. Laughs. Grief, at the right length. Somewhere underneath all the rehearsing there was a person, and I have not heard from him in a very long time."},
        {at:25, who:"serra", text:"There he is. — Dev. This is not an interview. It never was. This is the Meridian Clinic. You came to us after the accident, unable to let a single day finish. So your mind built a waiting room, and staffed it with your politeness, and set the clock to nine minutes early. Forever."}
      ], sfx:[{at:36,t:"chime"}] },
    { dur:40, set:"waiting", caption:"Loop four. Dev runs — the one thing nobody in the waiting room has ever done.",
      bg:"#131009", amb:0.5, key:0.72, mood:[73.4,110,146.8],
      cam:[[4.6,2.6,7.4],[3.2,2.2,5.8]], look:[[-1,1.6,-3.6],[-2.4,1.6,-4.2]],
      chars:{ dev:{from:[2.8,0,2.2], to:[-3.4,0,-3.2], ry0:3.14}, bell:{from:[0,0,-3.9], to:[0,0,-3.4], ry0:0.4}, yusuf:{from:[3,0,0.85], to:[3,0,0.85], ry0:-0.8} },
      lines:[
        {at:4, who:"bell", text:"Sir. Sir! Running voids the form. Running voids the triplicate. Sir, your shadow is not cleared for—"},
        {at:15, who:"dev", text:"Then void it! Void all of it! If my mind built this room, Ms Bell, then my mind can build an exit — a window, a door, a fire escape of pure—"},
        {at:28, who:"yusuf", text:"We have all run, young man. The room is very patient with running. It simply — receives you again. Like a tongue receives a word it has already said."}
      ], sfx:[{at:10,t:"step"},{at:22,t:"alarm"},{at:34,t:"bell"}] },
    { dur:40, set:"waiting", caption:"The room resets. But something is different this time: Yusuf's hands are shaking. In nine years, Yusuf's hands have never shaken.",
      bg:"#12100d", amb:0.5, key:0.7, mood:[65.4,98],
      cam:[[-4.2,2.4,6.2],[-2.9,2.1,4.9]], look:[[2.6,1.1,0.8],[3,1,0.85]],
      fade:true,
      chars:{ dev:{from:[-2.3,0,0.85], to:[-0.9,0,0.85], ry0:1.2}, yusuf:{from:[3,0,0.85], to:[3,0,0.85], ry0:-1.4, lean:0.14}, bell:{from:[0,0,-3.9], to:[0,0,-3.9], ry0:0} },
      lines:[
        {at:6, who:"yusuf", text:"Do not look at my hands. A man is allowed — no. No, it is fine. Look. Nine years I have sat well. And today my hands have started without my permission. I think — I think I am being called, young man. At last. And I am — ha — I am terrified. After all this practice at waiting, I am terrified of the door."},
        {at:27, who:"dev", text:"Yusuf. Listen to me. Whatever is behind that door — you do not have to be composed for it."}
      ], sfx:[{at:20,t:"heart"}] },
    { dur:40, set:"waiting", caption:"The bell rings. For Yusuf. Ms Bell stands — for the first time in any loop, Ms Bell stands.",
      bg:"#14110d", amb:0.52, key:0.74, mood:[82.4,123.5],
      cam:[[3.8,2.4,6.6],[2.6,2.1,5.2]], look:[[-1.4,1.7,-4],[-2.6,1.7,-4.4]],
      chars:{ yusuf:{from:[3,0,0.85], to:[1.2,0,-0.6], ry0:3.14}, dev:{from:[-0.9,0,0.85], to:[0.2,0,0.2], ry0:1.4}, bell:{from:[0,0,-3.4], to:[-0.8,0,-3.2], ry0:0.3} },
      lines:[
        {at:5, who:"bell", text:"Mr Yusuf. Your appointment. Nine years, four months, and one held breath. The doctor will see you now."},
        {at:16, who:"yusuf", text:"Dev. If I go through and do not come back — sit well, eh? And if my hands — tell them they did fine. They waited beautifully. They just — shook at the end, like hands do. Like people do."},
        {at:31, who:"dev", text:"I will tell them. Go on, old friend. Badly, truly, and without the rehearsed laugh."}
      ], sfx:[{at:3,t:"bell"},{at:24,t:"heart"}] },
    { dur:40, set:"waiting", caption:"The door opens for Yusuf. Light — real light, morning light — and a sound Dev has not heard in nine years: a day, beginning.",
      bg:"#16130e", amb:0.58, key:0.85, mood:[98,146.8],
      cam:[[3.4,2.3,6.2],[2.2,2,4.8]], look:[[-3,1.7,-4.4],[-3.8,1.7,-4.5]],
      chars:{ yusuf:{from:[0.6,0,-1.2], to:[-3.2,0,-3.9], ry0:3.14}, dev:{from:[0.6,0,0.4], to:[0.2,0,-0.6], ry0:2.8}, bell:{from:[-0.8,0,-3.2], to:[-1.6,0,-3.4], ry0:0.6} },
      anim:function(dyn,t,dur){ if(dyn.officeDoor){ var k = t<dur*0.3 ? t/(dur*0.3) : (t>dur*0.75 ? Math.max(0,1-(t-dur*0.75)/(dur*0.25)) : 1); dyn.officeDoor.position.x = -4.2 - 1.0*k*k; } },
      lines:[
        {at:8, who:"yusuf", text:"Oh. Oh — it is morning in there. It has been morning in there the whole time. Nine years of nine-minutes-early, and the day was — ha — the day was already —"},
        {at:25, who:"narrator", text:"He went through laughing and crying in the wrong order, unrehearsed, magnificent. The door closed behind him like a book that had been read to the end at last."}
      ], sfx:[{at:6,t:"creak"},{at:19,t:"chime"},{at:32,t:"bell"}] },
    { dur:40, set:"waiting", caption:"Ms Bell sits down again, slowly, and for the first time, she looks at Dev with something that is not procedure.",
      bg:"#13110e", amb:0.52, key:0.72, mood:[73.4,110],
      cam:[[-3.8,2.4,6],[-2.5,2.1,4.7]], look:[[-0.2,1.5,-3.6],[0,1.5,-3.8]],
      chars:{ dev:{from:[-1.2,0,0.6], to:[-0.4,0,-1.2], ry0:3.14}, bell:{from:[0,0,-3.9], to:[0,0,-3.9], ry0:0} },
      lines:[
        {at:5, who:"bell", text:"You want to know why he could go, and you cannot. It is not seniority, Dev. He stopped rehearsing his exit and started — fearing it, truly. A real feeling. The door only opens for real feelings. It is the one honest thing in this room, and I include myself."},
        {at:24, who:"dev", text:"And you, Ms Bell? Are you procedure — or are you a real feeling too?"},
        {at:31, who:"bell", text:"…I am the part of you that answers the telephone politely while the house is on fire. I have been very good at my job. I am very tired of my job."}
      ], sfx:[{at:36,t:"tick"}] },
    { dur:40, set:"waiting", caption:"So Dev does the least rehearsed thing available to a man in a waiting room. He sits down next to the empty chair — and grieves, out loud, in the wrong order.",
      bg:"#12100d", amb:0.5, key:0.72, mood:[65.4,98,130.8],
      cam:[[3.4,2.3,6.2],[2.2,2,4.8]], look:[[1.4,1.1,0.8],[2.4,1.05,0.85]],
      chars:{ dev:{from:[0.4,0,0.2], to:[1.7,0,0.8], ry0:-0.5, lean:0.16}, bell:{from:[0,0,-3.9], to:[0,0,-3.9], ry0:0} },
      lines:[
        {at:5, who:"dev", text:"The accident was on a Tuesday. I was nine minutes early for work, so I took the long road, the kind one, the one with the trees. I have been punishing the clock ever since — as if being on time would have — as if anything would have —"},
        {at:23, who:"dev", text:"I do not forgive the day. I do not forgive the road. But I am — finished waiting for it to apologise. Hear that, room? Finished. Badly, truly, and without the rehearsed laugh."},
        {at:36, who:"bell", text:"…Pens down, sir. The clock — the clock is not listening any more. It does not need to."}
      ], sfx:[{at:18,t:"heart"},{at:33,t:"chime"}] },
    { dur:40, set:"street", caption:"The bell rings once more. The door that opens is not the office door. It is the front door of the Meridian Clinic, and beyond it: an ordinary morning, nine years wide.",
      bg:"#1a1712", amb:0.66, key:0.95, mood:[110,164.8],
      cam:[[5.4,3.2,8.6],[3.8,2.6,6.4]], look:[[0,1.8,-5.6],[0,1.7,-6]],
      chars:{ dev:{from:[0,0,-5.2], to:[0,0,0.6], ry0:0.05}, bell:{from:[-2.2,0,-5.4], to:[-2,0,-4.6], ry0:0.6} },
      anim:function(dyn,t,dur){ if(dyn.streetDoor){ var k=Math.min(1,t/(dur*0.45)); dyn.streetDoor.position.x = -1.05*k*k; } },
      lines:[
        {at:6, who:"bell", text:"Your shadow's copy, sir. For the road. He resigned this morning, by the way. Said the paperwork was finally — honest."},
        {at:19, who:"dev", text:"Ms Bell. What time is it? Really. No rehearsal."},
        {at:25, who:"bell", text:"It is nine minutes past, Mr Dev. The day has started without your permission, as days do. Try to keep up. And — sit badly, sometimes. It suits the living."},
        {at:36, who:"narrator", text:"He stepped out nine minutes late, into the whole unfinished world — unrehearsed, magnificent, on time at last."}
      ], sfx:[{at:4,t:"creak"},{at:15,t:"bell"},{at:30,t:"chime"}] }
  ]
};
