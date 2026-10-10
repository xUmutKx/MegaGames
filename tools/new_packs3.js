// --- PACK new3 BEGIN ---
// Merge with: Object.assign(ENGINES,PACK_NEW3_ENGINES);MINIS.push(...PACK_NEW3_MINIS);
// Stress toys (st3_), flash-card quizzes (fc2_), pseudo-3D sims (s4_). Uses page helpers: p14_kit, p2_drag, st_bg, fc_* helpers.

// ---- STRESS: tear the paper along a wavy dotted line ----
function st3_tear(g){
  const K=p14_kit(),x0=30,x1=()=>W()-30;
  let tears=0,done=false,ph=0,prog=x0,act=false;
  const gy=x=>H()/2-20+70*Math.sin(x/46+ph);
  function reset(){ph=rand(0,6.28);prog=x0;act=false}
  reset();
  const stopD=p2_drag({move:(x,y)=>{
    if(!act||done)return;
    if(Math.abs(y-gy(x))>34){act=false;beep(180,120,.1,"sawtooth",.05);return}
    if(x>prog-6&&x<prog+40)prog=Math.max(prog,Math.min(x,x1()));
  },up:()=>{act=false}});
  return{
    update(dt){K.step(dt);
      if(!done&&prog>=x1()-4){tears++;K.burst(W()/2,gy(W()/2),"#f4ecd8",18,200);beep(600,300,.2,"sawtooth",.08);
        if(tears>=g.goal){done=true;completeMini()}else reset()}
      hud("Tears "+tears+"/"+g.goal)},
    pointer(x,y){if(done||act)return;if(x<x0+70&&Math.abs(y-gy(x0))<60){act=true;prog=x0}},
    stop(){stopD()},
    draw(){K.begin();st_bg("#2b2418","#14100a");rect(18,110,W()-36,H()-250,"#f6efdc",14);
      for(let x=x0;x<=x1();x+=12)circle(x,gy(x),1.6,"#a89672");
      for(let x=x0;x<prog;x+=3){const x2=Math.min(x+3,prog);line(x,gy(x),x2,gy(x2),"#7a6446",3)}
      circle(prog,gy(prog),5,act?"#ff5570":"#c9b48a");
      text("Tear along the dots",W()/2,100,16,"#e8dcc0","center");
      K.end()}
  };
}

// ---- STRESS: breathing ring, hold to inhale, release inside the band ----
function st3_breath(g){
  const K=p14_kit();
  let lvl=0,held=false,breaths=0,done=false;
  const stopD=p2_drag({up:()=>{
    if(!held||done)return;held=false;
    if(lvl>=.7){breaths++;K.burst(W()/2,H()*.42,"#9fe8ff",14,120);beep(520,760,.12,"sine",.1);
      if(breaths>=g.goal){done=true;completeMini()}}
    else beep(200,140,.1,"sine",.05);
  }});
  return{
    update(dt){K.step(dt);
      lvl=held?Math.min(1,lvl+dt/4):Math.max(0,lvl-dt/4);
      hud("Breaths "+breaths+"/"+g.goal)},
    pointer(){if(!done)held=true},
    stop(){stopD()},
    draw(){K.begin();st_bg("#0d1b2a","#050a12");
      const cx=W()/2,cy=H()*.42,R=40+lvl*110;
      strokeCircle(cx,cy,40+.7*110,"rgba(255,255,255,.35)",2);
      circle(cx,cy,R,"rgba(120,220,255,.5)");strokeCircle(cx,cy,R,"#9fe8ff",3);
      text(held?(lvl>=.7?"Release now":"Breathe in..."):(lvl>.05?"Breathe out...":"Hold to breathe in"),cx,cy+R+40,18,"#dff4ff","center");
      text("Release inside the ring",cx,cy-R-22,14,"#8fb4cc","center");
      K.end()}
  };
}

// ---- STRESS: tap gears to turn them; neighbours that both turn mesh ----
function st3_gears(g){
  const K=p14_kit(),cols=3,rows=4,cs=Math.min(W()/3.4,110),cx0=W()/2-(cols-1)*cs/2,cy0=170;
  const G=[];
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)G.push({r,c,x:cx0+c*cs,y:cy0+r*cs,on:false,a:rand(0,6.28),d:((r+c)%2?1:-1)});
  let done=false,pairs=0;
  const near=(a,b)=>Math.abs(a.r-b.r)+Math.abs(a.c-b.c)===1;
  function count(){let n=0;for(let i=0;i<G.length;i++)for(let j=i+1;j<G.length;j++)if(G[i].on&&G[j].on&&near(G[i],G[j]))n++;return n}
  function drawGear(q){
    ctx2d.save();ctx2d.translate(q.x,q.y);ctx2d.rotate(q.a);
    const R=cs*.36,col=q.on?"#3aa6c9":"#4a5560";
    circle(0,0,R,col);
    for(let k=0;k<8;k++){const a=k*Math.PI/4;circle(Math.cos(a)*R,Math.sin(a)*R,5,col)}
    for(let k=0;k<3;k++){const a=k*Math.PI*2/3;line(0,0,Math.cos(a)*R*.8,Math.sin(a)*R*.8,"rgba(0,0,0,.35)",5)}
    circle(0,0,R*.18,"#e8f2f8");
    ctx2d.restore();
  }
  return{
    update(dt){K.step(dt);
      for(const q of G)if(q.on)q.a+=q.d*dt*2.2;
      pairs=count();
      if(!done&&pairs>=g.goal){done=true;completeMini()}
      hud("Meshed "+pairs+"/"+g.goal)},
    pointer(x,y){if(done)return;
      for(const q of G)if(Math.hypot(x-q.x,y-q.y)<cs*.42){q.on=!q.on;beep(q.on?420:300,q.on?520:240,.06,"triangle",.07);K.burst(q.x,q.y,"#7fe3ff",6,90);return}},
    stop(){},
    draw(){K.begin();st_bg("#141c24","#080c10");
      for(let i=0;i<G.length;i++)for(let j=i+1;j<G.length;j++)if(G[i].on&&G[j].on&&near(G[i],G[j]))line(G[i].x,G[i].y,G[j].x,G[j].y,"rgba(127,227,255,.5)",6);
      for(const q of G)drawGear(q);
      text("Tap gears. Neighbours that both turn mesh.",W()/2,100,14,"#c7d6e4","center");
      K.end()}
  };
}

// ---- FLASH CARDS: flash a number, then pick its English word ----
function fc2_numword(g){
  const c=g.cfg,S=fc_base(g,c),TM=1.5,NW=["ZERO","ONE","TWO","THREE","FOUR","FIVE","SIX","SEVEN","EIGHT","NINE","TEN","ELEVEN","TWELVE","THIRTEEN","FOURTEEN","FIFTEEN","SIXTEEN","SEVENTEEN","EIGHTEEN","NINETEEN","TWENTY"];
  let n=0,opts=[],st="show",tm=TM;
  function q(){n=randi(1,20);const o=[n];while(o.length<4){const k=randi(1,20);if(o.indexOf(k)<0)o.push(k)}opts=shuffle(o);st="show";tm=TM}
  q();
  return{
    update(dt){S.hud();if(S.over)return;if(st==="show"){tm-=dt;if(tm<=0)st="pick"}},
    pointer(x,y){if(S.over||st!=="pick")return;const i=fc_padHit(x,y,4);if(i<0)return;
      if(opts[i]===n){S.gain();beep(660,880,.08,"sine",.1)}
      else{beep(160,110,.2,"sawtooth",.07);if(!S.miss("Wrong word"))return}
      if(!S.over)q()},
    stop(){},
    draw(){fc_bg(c);
      if(st==="show"){text("Remember",W()/2,H()*.3,22,"#aab8ff","center");
        text(String(n),W()/2,H()*.5,150,"#fff","center");fc_timer(tm/TM,H()*.62)}
      else{text("Which word?",W()/2,H()*.3,24,"#fff","center");
        for(let i=0;i<4;i++)fc_box(W()/2-150+(i%2)*160,H()-300+Math.floor(i/2)*78,140,64,"rgba(255,255,255,.16)",NW[opts[i]],22,"#fff")}
      S.banner()}
  };
}

// ---- FLASH CARDS: a country flashes, pick its capital ----
function fc2_capital(g){
  const c=g.cfg,S=fc_base(g,c),D=[["France","Paris"],["Japan","Tokyo"],["Egypt","Cairo"],["Peru","Lima"],["Kenya","Nairobi"],["Norway","Oslo"],["Canada","Ottawa"],["Turkey","Ankara"],["Chile","Santiago"],["Iceland","Reykjavik"],["Australia","Canberra"],["Brazil","Brasilia"]];
  let cur,opts=[];
  function q(){cur=pick(D);const o=[cur[1]];while(o.length<4){const k=pick(D)[1];if(o.indexOf(k)<0)o.push(k)}opts=shuffle(o)}
  q();
  return{
    update(){S.hud()},
    pointer(x,y){if(S.over)return;const i=fc_padHit(x,y,4);if(i<0)return;
      if(opts[i]===cur[1]){S.gain();beep(660,880,.08,"sine",.1)}
      else{beep(160,110,.2,"sawtooth",.07);if(!S.miss("Wrong capital"))return}
      if(!S.over)q()},
    stop(){},
    draw(){fc_bg(c);
      text("Capital of",W()/2,H()*.3,20,"#aab8ff","center");
      text(cur[0],W()/2,H()*.3+50,40,"#fff","center");
      for(let i=0;i<4;i++)fc_box(W()/2-150+(i%2)*160,H()-300+Math.floor(i/2)*78,140,64,"rgba(255,255,255,.16)",opts[i],19,"#fff");
      S.banner()}
  };
}

// ---- FLASH CARDS: memorize a word, then rebuild it from shuffled letters ----
function fc2_scramble(g){
  const c=g.cfg,S=fc_base(g,c),TM=1.8,WD=["PLANET","BRIDGE","CANDLE","FOREST","ORANGE","RABBIT","SUNSET","TURTLE","WINDOW","JACKET","PENCIL","GARDEN"],
    tileX=(i,len,step)=>(W()-step*len)/2+step/2+i*step,TY=()=>H()-230;
  let w,tiles,pos=0,st="show",tm=TM;
  function q(){w=pick(WD);do{tiles=shuffle(w.split("").map((ch,i)=>({ch,used:false})))}while(tiles.map(t=>t.ch).join("")===w);pos=0;st="show";tm=TM}
  q();
  const stepOf=()=>Math.min(54,(W()-40)/w.length);
  return{
    update(dt){S.hud();if(S.over)return;if(st==="show"){tm-=dt;if(tm<=0)st="type"}},
    pointer(x,y){if(S.over||st!=="type")return;const step=stepOf();
      for(let i=0;i<tiles.length;i++){const t=tiles[i];
        if(t.used||Math.abs(x-tileX(i,tiles.length,step))>step/2-3||Math.abs(y-TY())>26)continue;
        if(t.ch===w[pos]){t.used=true;pos++;beep(600+pos*30,700+pos*30,.05,"sine",.08);
          if(pos===w.length){S.gain();if(!S.over)q()}}
        else{beep(160,110,.2,"sawtooth",.07);S.miss("Wrong letter");if(!S.over){tiles.forEach(t=>t.used=false);pos=0}}
        return}},
    stop(){},
    draw(){fc_bg(c);
      if(st==="show"){text("Remember",W()/2,H()*.3,22,"#aab8ff","center");text(w,W()/2,H()*.45,44,"#fff","center");fc_timer(tm/TM,H()*.55)}
      else{const step=stepOf();text("Rebuild the word",W()/2,H()*.3,22,"#aab8ff","center");
        text(w.slice(0,pos).split("").join(" ")||"_",W()/2,H()*.45,34,"#fff","center");
        for(let i=0;i<tiles.length;i++){const t=tiles[i],x=tileX(i,tiles.length,step);
          fc_box(x-step/2+3,TY()-26,step-6,52,t.used?"rgba(255,255,255,.08)":C.cyan,t.used?"":t.ch,24,"#0b0f1a")}}
      S.banner()}
  };
}

// ---- 3D SIM: slalom skiing down a perspective slope ----
function s4_ski(g){
  const K=p14_kit(),hy=140,by=()=>H()-170;
  let gates=[],sp=1.1,px=0,pass=0,lives=3,over=false,done=false,nt=.6;
  const yOf=t=>by()-(by()-hy)*t;
  const xOf=(lat,t)=>W()/2+lat*(30+130*(1-t));
  return{
    update(dt){K.step(dt);if(over||done)return;
      px=clamp(px+AX()*dt*1.3,-1,1);
      nt-=dt;if(nt<=0){gates.push({t:1,gx:rand(-.75,.75),used:false});nt=rand(.9,1.5)}
      sp=1.1+pass*.04;
      for(const q of gates){q.t-=dt*sp;
        if(!q.used&&q.t<=0){q.used=true;
          if(Math.abs(px-q.gx)<.3){pass++;K.burst(xOf(px,0),by(),"#ff5570",10,150);beep(700,900,.08,"sine",.08);
            if(pass>=g.goal){done=true;completeMini();return}}
          else{lives--;K.shake=.6;beep(160,110,.25,"sawtooth",.07);if(lives<=0){over=true;miniFail(g,"Crashed into a gate");return}}}}
      gates=gates.filter(q=>q.t>-.1);
      hud("Gates "+pass+"/"+g.goal+" • "+"❤️".repeat(lives))},
    stop(){},
    draw(){K.begin();rect(0,0,W(),hy,"#9fd8ff");rect(0,hy,W(),H()-hy,"#f2f8ff");
      polygon([[W()/2-30,hy],[W()/2+30,hy],[W()/2+170,by()+30],[W()/2-170,by()+30]],"#dbeaf7");
      for(const q of gates){if(q.t<=0)continue;const t=q.t,y=yOf(t),xl=xOf(q.gx-.22,t),xr=xOf(q.gx+.22,t),h=60*(1-.6*t);
        line(xl,y,xl,y-h,"#ff5570",2+4*(1-t));line(xr,y,xr,y-h,"#4da3ff",2+4*(1-t));line(xl,y-h,xr,y-h,"#ffffff",2)}
      text("⛷️",xOf(px,0),by(),34,"#fff","center");
      K.end()}
  };
}

// ---- 3D SIM: aim and fire a cannon at targets on the field ----
function s4_cannon(g){
  const K=p14_kit(),gx=60,ground=()=>H()-190;
  let ang=.7,pw=0,charging=false,ph=0,shots=8,hits=0,ball=null,tg=null,done=false,over=false;
  const spawnT=()=>{tg={x:rand(W()*.45,W()-40)}};
  spawnT();
  const stopD=p2_drag({up:()=>{if(!charging)return;charging=false;if(done||over||ball||shots<=0)return;
    const v=190+370*pw;ball={x:gx,y:ground()-20,vx:v*Math.cos(ang),vy:-v*Math.sin(ang)};shots--}});
  return{
    update(dt){K.step(dt);
      if(done||over)return;
      ang=clamp(ang-AY()*dt*1.1,.1,1.45);
      if(charging){ph+=dt*3.5;pw=(Math.sin(ph)+1)/2}
      if(ball){ball.vy+=420*dt;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
        if(ball.y>=ground()||ball.x>W()+30){
          if(Math.abs(ball.x-tg.x)<26){hits++;K.burst(tg.x,ground()-30,"#ff5570",16,180);beep(700,980,.1,"sine",.1);spawnT();
            if(hits>=g.goal){done=true;completeMini();return}}
          else{K.pop("miss",ball.x,ground()-40,"#ffb3c0");beep(160,110,.15,"sawtooth",.05)}
          ball=null}}
      if(!ball&&shots<=0){over=true;miniFail(g,"Out of shots")}
      hud("Hits "+hits+"/"+g.goal+" • Shots "+shots)},
    pointer(){if(!charging&&!ball&&!done&&!over&&shots>0){charging=true;ph=0;pw=0}},
    stop(){stopD()},
    draw(){K.begin();st_bg("#7fc8ff","#cfeeff");
      rect(0,ground(),W(),H()-ground(),"#2f5d34");
      rect(0,ground()-2,W(),3,"rgba(255,255,255,.25)");
      if(tg){circle(tg.x,ground()-30,16,"#ff5570");line(tg.x,ground()-14,tg.x,ground(),"#884",3)}
      ctx2d.save();ctx2d.translate(gx,ground()-20);ctx2d.rotate(-ang);rect(0,-8,40,16,"#333");ctx2d.restore();
      circle(gx,ground()-20,18,"#444");
      if(charging){const v=190+370*pw;let vx=v*Math.cos(ang),vy=-v*Math.sin(ang);
        for(let t=.08;t<1.2;t+=.08){const x=gx+vx*t,y=ground()-20+vy*t+210*t*t;if(y>ground())break;circle(x,y,2,"rgba(255,255,255,.5)")}
        rect(40,H()-150,W()-80,12,"rgba(255,255,255,.15)",6);rect(40,H()-150,(W()-80)*pw,12,pw>.6?"#55ff9a":"#ffd15c",6)}
      if(ball)circle(ball.x,ball.y,6,"#222");
      text("Hold to charge, release to fire",W()/2,100,14,"#16324a","center");
      K.end()}
  };
}

// ---- 3D SIM: drop a crate on the moving pad from a helicopter ----
function s4_heli(g){
  const K=p14_kit(),hy=150,by=()=>H()-190;
  const P=(x,z)=>{const d=(z+1)/2,s=.35+.65*d;return{x:W()/2+x*190*s,y:hy+(by()-hy)*d,s}};
  let hx=0,hz=0,pads=[],crate=null,hits=0,drops=5,done=false,over=false,pt=0;
  const spawnPad=()=>pads=[{x:rand(-.7,.7),z:rand(-.6,.6),ph:rand(0,6.28)}];
  spawnPad();
  return{
    update(dt){K.step(dt);pt+=dt;
      for(const p of pads){p.x+=Math.sin(pt*.6+p.ph)*dt*.12}
      if(over||done)return;
      hx=clamp(hx+AX()*dt*.9,-1,1);hz=clamp(hz+AY()*dt*.9,-1,1);
      if(crate){crate.t+=dt;
        if(crate.t>=1.2){let hit=false;
          for(const p of pads)if(Math.hypot(crate.x-p.x,crate.z-p.z)<.26){hit=true}
          crate=null;
          if(hit){hits++;K.burst(P(hx,hz).x,P(hx,hz).y,"#55ff9a",16,180);beep(700,980,.1,"sine",.1);spawnPad();
            if(hits>=g.goal){done=true;completeMini();return}}
          else{beep(160,110,.2,"sawtooth",.06);K.pop("miss",W()/2,H()*.5,"#ffb3c0");if(drops<=0){over=true;miniFail(g,"Out of crates");return}}}}
      hud("Drops "+hits+"/"+g.goal+" • Left "+drops)},
    pointer(){if(!crate&&drops>0&&!done&&!over){crate={x:hx,z:hz,t:0};drops--}},
    stop(){},
    draw(){K.begin();st_bg("#8fd3ff","#e8f6ff");
      rect(0,hy-1,W(),H()-hy,"#5a9e5a");
      for(let i=-4;i<=4;i++){const a=P(i/4,-1),b=P(i/4,1);line(a.x,a.y,b.x,b.y,"rgba(255,255,255,.15)",1)}
      for(const p of pads){const q=P(p.x,p.z);ctx2d.beginPath();ctx2d.ellipse(q.x,q.y,40*q.s,18*q.s,0,0,6.283);ctx2d.fillStyle="rgba(120,255,160,.7)";ctx2d.fill();
        text("H",q.x,q.y+5*q.s,14*q.s+6,"#0b3b1a","center")}
      const hp=P(hx,hz);ctx2d.beginPath();ctx2d.ellipse(hp.x,hp.y,22*hp.s,8*hp.s,0,0,6.283);ctx2d.fillStyle="rgba(0,0,0,.3)";ctx2d.fill();
      text("🚁",hp.x,hp.y-70*hp.s,40*hp.s+8,"#fff","center");
      if(crate){const cp=P(crate.x,crate.z),k=Math.min(1,crate.t/1.2),y=cp.y-(1-k)*70*cp.s;
        text("📦",cp.x,y,26*cp.s+6,"#fff","center")}
      text("Move with keys, tap to drop the crate on the pad",W()/2,104,13,"#16324a","center");
      K.end()}
  };
}

const PACK_NEW3_ENGINES={st3_tear:st3_tear,st3_breath:st3_breath,st3_gears:st3_gears,fc2_numword:fc2_numword,fc2_capital:fc2_capital,fc2_scramble:fc2_scramble,s4_ski:s4_ski,s4_cannon:s4_cannon,s4_heli:s4_heli};
const PACK_NEW3_MINIS=[
{id:"st3_tear",title:"Paper Tear",icon:"📜",cat:"STRESS",desc:"Tear the paper along the dotted line. Don't drift off it.",engine:"st3_tear",goal:3,cfg:{}},
{id:"st3_breath",title:"Slow Breath",icon:"🫁",cat:"STRESS",desc:"Hold to breathe in, release inside the ring. Keep a calm pace.",engine:"st3_breath",goal:5,cfg:{}},
{id:"st3_gears",title:"Gear Fidget",icon:"⚙️",cat:"STRESS",desc:"Tap gears to turn them. Neighbours that turn together mesh.",engine:"st3_gears",goal:8,cfg:{}},
{id:"fc2_numword",title:"Number Words",icon:"🔢",cat:"QUIZ",desc:"Memorize the number, then pick its English word.",engine:"fc2_numword",goal:10,cfg:{lives:3}},
{id:"fc2_capital",title:"Capital Flash",icon:"🏳️",cat:"QUIZ",desc:"A country flashes. Pick its capital.",engine:"fc2_capital",goal:10,cfg:{lives:3}},
{id:"fc2_scramble",title:"Letter Recall",icon:"🔠",cat:"QUIZ",desc:"Memorize the word, then rebuild it from shuffled letters.",engine:"fc2_scramble",goal:6,cfg:{lives:3}},
{id:"s4_ski",title:"Slalom Ski",icon:"⛷️",cat:"SIMULATION",desc:"Steer through the gates as they rush at you.",engine:"s4_ski",goal:12,cfg:{}},
{id:"s4_cannon",title:"Ballistic Cannon",icon:"💣",cat:"SIMULATION",desc:"Aim with up and down, hold to charge, release to fire.",engine:"s4_cannon",goal:3,cfg:{}},
{id:"s4_heli",title:"Crate Drop",icon:"🚁",cat:"SIMULATION",desc:"Fly over the pad and drop the crate where it will land.",engine:"s4_heli",goal:3,cfg:{}}
];
// --- PACK new3 END ---
