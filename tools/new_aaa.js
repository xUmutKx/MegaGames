/* ============ AAA: HORDE SURVIVORS ============ */
const Horde={
 a:false,
 UP:[
  {id:"bolt",n:"Arcane Bolt",d:"More bolts, faster fire",ic:"✨",w:true},
  {id:"blade",n:"Spinning Blades",d:"Blades orbit around you",ic:"🗡️",w:true},
  {id:"nova",n:"Shock Nova",d:"A pulse that hurts and knocks back",ic:"💥",w:true},
  {id:"chain",n:"Chain Lightning",d:"Zaps several enemies at once",ic:"⚡",w:true},
  {id:"spd",n:"Swift Boots",d:"+12% move speed",ic:"👟"},
  {id:"mag",n:"Magnet",d:"Gems fly to you from farther away",ic:"🧲"},
  {id:"hp",n:"Vitality",d:"+25 max HP and a heal",ic:"❤️"},
  {id:"dmg",n:"Power",d:"+15% damage",ic:"🔥"}],
 init(){this.a=true;this.hi=0;try{this.hi=+localStorage.getItem("hordeHi")||0}catch(e){}this._glow={};this._bind();this.reset();hudTitle("HORDE SURVIVORS","Survive")},
 _bind(){if(this._lis)return;const me=this;
  this._lis={move:e=>{if(me.drag){me.drag.cx=e.clientX;me.drag.cy=e.clientY}},up:()=>{me.drag=null}};
  cv2d.addEventListener("pointermove",this._lis.move);cv2d.addEventListener("pointerup",this._lis.up);cv2d.addEventListener("pointercancel",this._lis.up)},
 reset(){this.p={x:0,y:0,hp:100,max:100,spd:150,mag:80,dmg:1,inv:0,face:0};
  this.t=0;this.t2=0;this.kills=0;this.xp=0;this.lv=1;this.need=6;this.state="play";this.drag=null;this.cards=null;
  this.en=[];this.sh=[];this.eb=[];this.gem=[];this.fx=[];this.pops=[];this.rings=[];this.bolts=[];
  this.w={bolt:1,blade:0,nova:0,chain:0};this.cd={bolt:.3,nova:2,chain:1.5};this.bladeA=0;
  this.spawnT=1;this.nextBoss=60;this.bossN=0;this.banner=null;this.shake=0;this.flash=0;this.newHi=false},
 glow(c){let g=this._glow[c];if(g)return g;g=document.createElement("canvas");g.width=g.height=48;const x=g.getContext("2d");const r=x.createRadialGradient(24,24,0,24,24,24);r.addColorStop(0,c);r.addColorStop(.4,c);r.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=r;x.fillRect(0,0,48,48);return this._glow[c]=g},
 sfx(k){try{if(k==="hit")beep(260,140,.04,"square",.02);else if(k==="kill")beep(200,70,.08,"sawtooth",.035);else if(k==="gem")beep(700,1200,.05,"sine",.04);else if(k==="hurt")beep(180,60,.25,"sawtooth",.1);else if(k==="lvl")beep(400,1000,.3,"triangle",.12);else if(k==="nova")beep(120,40,.4,"sawtooth",.1);else if(k==="zap")beep(1200,300,.08,"square",.04);else if(k==="boss")beep(80,40,.8,"sawtooth",.15)}catch(e){}},
 spark(x,y,c,n,spd){for(let k=0;k<n&&this.fx.length<400;k++){const a=rand(0,6.283),v=rand(spd*.3,spd);this.fx.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(.25,.55),max:.55,r:rand(1.5,3.5),c})}},
 pop(x,y,t,c){if(this.pops.length<40)this.pops.push({x,y,t,c,life:.7})},
 pointer(px,py){
  if(this.state==="over"){if(this.t2>.8)this.reset();return}
  if(this.cards){const L=this.cardRects();for(let i=0;i<L.length;i++){const r=L[i];if(px>=r.x&&px<=r.x+r.w&&py>=r.y&&py<=r.y+r.h){this.pick(i);return}}return}
  this.drag={x:px,y:py,cx:px,cy:py}},
 cardRects(){const w=Math.min(W()-36,380),h=88,x=(W()-w)/2,y0=H()/2-150;return[0,1,2].map(i=>({x,y:y0+i*(h+12),w,h}))},
 pick(i){const c=this.cards&&this.cards[i];if(!c)return;const p=this.p;
  if(c.w)this.w[c.id]++;
  else if(c.id==="spd")p.spd*=1.12;else if(c.id==="mag")p.mag+=35;else if(c.id==="hp"){p.max+=25;p.hp=Math.min(p.max,p.hp+40)}else if(c.id==="dmg")p.dmg*=1.15;
  this.cards=null;this.sfx("gem");this.p.inv=Math.max(this.p.inv,.8)},
 levelUp(){this.lv++;this.xp-=this.need;this.need=Math.floor(this.need*1.35+3);this.sfx("lvl");this.flash=.35;
  const pool=this.UP.filter(u=>!u.w||this.w[u.id]<6);const out=[];
  while(out.length<3&&pool.length){out.push(pool.splice(randi(0,pool.length-1),1)[0])}
  this.cards=out},
 spawn(){const p=this.p,R=Math.max(W(),H())*.62,a=rand(0,6.283),x=p.x+Math.cos(a)*R,y=p.y+Math.sin(a)*R;
  const sc=1+this.t/110;let ty=0;const r=Math.random();
  if(this.t>25&&r<.25)ty=1;if(this.t>50&&r<.14)ty=2;if(this.t>80&&r>.9)ty=3;
  const D=[{hp:10,spd:55,r:11,dm:8,c:"#6bff6b",g:1},{hp:6,spd:110,r:9,dm:6,c:"#ffd15c",g:1},{hp:70,spd:38,r:18,dm:14,c:"#a375ff",g:4},{hp:20,spd:48,r:12,dm:7,c:"#ff914d",g:2}][ty];
  this.en.push({x,y,ty,hp:D.hp*sc,max:D.hp*sc,spd:D.spd*(1+Math.min(.5,this.t/400)),r:D.r,dm:D.dm,c:D.c,g:D.g,hf:0,hc:0,cd:rand(1,2.5),vx:0,vy:0})},
 spawnBoss(){const p=this.p,a=rand(0,6.283),R=Math.max(W(),H())*.62;this.bossN++;const hp=700*(1+this.bossN*.7);
  this.en.push({x:p.x+Math.cos(a)*R,y:p.y+Math.sin(a)*R,ty:9,hp,max:hp,spd:52,r:34,dm:20,c:"#ff4fd8",g:30,hf:0,hc:0,cd:2,vx:0,vy:0,boss:true});
  this.banner={txt:"A TITAN APPROACHES",t:2.2};this.sfx("boss")},
 hit(e,d){e.hp-=d*this.p.dmg;e.hf=.07;if(Math.random()<.35)this.pop(e.x,e.y-e.r,Math.ceil(d*this.p.dmg),"#fff");if(e.hp<=0&&!e.dead)this.kill(e);else this.sfx("hit")},
 kill(e){e.dead=true;this.kills++;this.spark(e.x,e.y,e.c,e.boss?40:10,e.boss?320:170);this.sfx("kill");this.shake=Math.max(this.shake,e.boss?16:2);
  this.gem.push({x:e.x,y:e.y,v:e.g,big:e.g>=4});
  if(e.boss){this.flash=.5;this.banner={txt:"TITAN DOWN",t:1.8};this.p.hp=Math.min(this.p.max,this.p.hp+30)}},
 nearest(x,y,max,skip){let b=null,bd=max*max;for(const e of this.en){if(e.dead||(skip&&skip.has(e)))continue;const d=(e.x-x)*(e.x-x)+(e.y-y)*(e.y-y);if(d<bd){bd=d;b=e}}return b},
 hurt(d){const p=this.p;if(p.inv>0)return;p.hp-=d;p.inv=.45;this.shake=10;this.flash=.4;this.sfx("hurt");this.spark(p.x,p.y,"#ff4f6a",12,200);
  if(p.hp<=0){this.state="over";this.t2=0;this.spark(p.x,p.y,"#55e6ff",50,320);const sc=Math.floor(this.t)+this.kills*2;this.score=sc;if(sc>this.hi){this.hi=sc;this.newHi=true;try{localStorage.setItem("hordeHi",String(sc))}catch(e){}}progress.coins+=Math.floor(sc/10);saveProg()}},
 update(dt){
  for(const f of this.fx){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=1-2*dt;f.vy*=1-2*dt;f.life-=dt}this.fx=this.fx.filter(f=>f.life>0);
  for(const q of this.pops){q.y-=30*dt;q.life-=dt}this.pops=this.pops.filter(q=>q.life>0);
  for(const r of this.rings){r.life-=dt;r.r+=(r.r1-r.r)*Math.min(1,dt*10)}this.rings=this.rings.filter(r=>r.life>0);
  for(const b of this.bolts)b.life-=dt;this.bolts=this.bolts.filter(b=>b.life>0);
  this.shake=Math.max(0,this.shake-dt*30);this.flash=Math.max(0,this.flash-dt*1.6);
  if(this.banner){this.banner.t-=dt;if(this.banner.t<=0)this.banner=null}
  if(this.state==="over"){this.t2+=dt;if((pressed("a")||pressed("b")||key(" "))&&this.t2>.8)this.reset();return}
  if(this.cards)return;
  const p=this.p;this.t+=dt;p.inv=Math.max(0,p.inv-dt);
  let mx=AX(),my=AY();
  if(this.drag){const dx=this.drag.cx-this.drag.x,dy=this.drag.cy-this.drag.y,m=Math.hypot(dx,dy);if(m>10){const k=clamp(m/55,0,1);mx=dx/m*k;my=dy/m*k}}
  p.x+=mx*p.spd*dt;p.y+=my*p.spd*dt;if(mx||my)p.face=Math.atan2(my,mx);
  // spawning
  this.spawnT-=dt;if(this.spawnT<=0){this.spawnT=Math.max(.1,.75-this.t*.0042);const n=1+Math.floor(this.t/40);for(let i=0;i<n&&this.en.length<230;i++)this.spawn()}
  if(this.t>=this.nextBoss){this.nextBoss+=90;this.spawnBoss()}
  // weapons
  const W_=this.w;
  if(W_.bolt>0){this.cd.bolt-=dt;if(this.cd.bolt<=0){this.cd.bolt=Math.max(.22,.75-W_.bolt*.08);const n=1+Math.floor((W_.bolt+1)/2);const used=new Set();
    for(let i=0;i<n;i++){const t=this.nearest(p.x,p.y,420,used);if(!t)break;used.add(t);const a=Math.atan2(t.y-p.y,t.x-p.x);this.sh.push({x:p.x,y:p.y,vx:Math.cos(a)*420,vy:Math.sin(a)*420,d:9+W_.bolt*2,life:1.1,pi:W_.bolt>=4?2:1})}}}
  if(W_.blade>0){this.bladeA+=dt*3.4;const n=1+W_.blade,R=58+W_.blade*7;
    for(let i=0;i<n;i++){const a=this.bladeA+i/n*6.283,bx=p.x+Math.cos(a)*R,by=p.y+Math.sin(a)*R;
     for(const e of this.en){if(e.dead)continue;if(e.hc>0)continue;if(Math.hypot(e.x-bx,e.y-by)<e.r+9){e.hc=.3;this.hit(e,8+W_.blade*2);this.spark(bx,by,"#ffd15c",3,100)}}}}
  if(W_.nova>0){this.cd.nova-=dt;if(this.cd.nova<=0){this.cd.nova=Math.max(1.8,4.8-W_.nova*.5);const r1=100+W_.nova*22;this.rings.push({x:p.x,y:p.y,r:8,r1,life:.45,max:.45,c:"#55e6ff"});this.sfx("nova");
    for(const e of this.en){if(e.dead)continue;const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<r1+e.r){this.hit(e,14+W_.nova*4);if(!e.boss){e.x+=(e.x-p.x)/(d||1)*46;e.y+=(e.y-p.y)/(d||1)*46}}}}}
  if(W_.chain>0){this.cd.chain-=dt;if(this.cd.chain<=0){this.cd.chain=Math.max(.9,2.4-W_.chain*.22);const used=new Set();let fx=p.x,fy=p.y;const pts=[{x:fx,y:fy}];
    for(let i=0;i<2+W_.chain;i++){const t=this.nearest(fx,fy,280,used);if(!t)break;used.add(t);this.hit(t,16+W_.chain*4);fx=t.x;fy=t.y;pts.push({x:fx,y:fy})}
    if(pts.length>1){this.bolts.push({pts,life:.14});this.sfx("zap")}}}
  // player shots
  for(const s of this.sh){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
   for(const e of this.en){if(e.dead||s.life<=0)continue;if(Math.hypot(e.x-s.x,e.y-s.y)<e.r+5){this.hit(e,s.d);s.pi--;this.spark(s.x,s.y,"#ffd15c",3,100);if(s.pi<=0){s.life=0}break}}}
  this.sh=this.sh.filter(s=>s.life>0);
  // enemies
  for(const e of this.en){if(e.dead)continue;e.hf=Math.max(0,e.hf-dt);e.hc=Math.max(0,e.hc-dt);
   const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;
   if(e.ty===3){if(d>230){e.x+=dx/d*e.spd*dt;e.y+=dy/d*e.spd*dt}else if(d<170){e.x-=dx/d*e.spd*dt;e.y-=dy/d*e.spd*dt}
    e.cd-=dt;if(e.cd<=0&&d<420){e.cd=2.3;this.eb.push({x:e.x,y:e.y,vx:dx/d*170,vy:dy/d*170,life:3})}}
   else{e.x+=dx/d*e.spd*dt;e.y+=dy/d*e.spd*dt}
   if(d<e.r+11)this.hurt(e.dm)}
  // far enemies get recycled to keep the horde on screen
  for(const e of this.en){if(!e.boss&&!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)>Math.max(W(),H())*1.1){const a=rand(0,6.283),R=Math.max(W(),H())*.6;e.x=p.x+Math.cos(a)*R;e.y=p.y+Math.sin(a)*R}}
  this.en=this.en.filter(e=>!e.dead);
  for(const b of this.eb){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(Math.hypot(b.x-p.x,b.y-p.y)<14){b.life=0;this.hurt(7)}}this.eb=this.eb.filter(b=>b.life>0);
  // gems
  for(const g of this.gem){const dx=p.x-g.x,dy=p.y-g.y,d=Math.hypot(dx,dy);if(d<p.mag||g.pull){g.pull=true;const k=Math.min(1,380*dt/(d||1));g.x+=dx*k;g.y+=dy*k}
   if(d<16){g.got=true;this.xp+=g.v;this.sfx("gem")}}
  this.gem=this.gem.filter(g=>!g.got);if(this.gem.length>400)this.gem.splice(0,this.gem.length-400);
  while(this.xp>=this.need&&!this.cards)this.levelUp();
  hudTitle("HORDE SURVIVORS","Lv "+this.lv+" • "+Math.floor(this.t/60)+":"+String(Math.floor(this.t%60)).padStart(2,"0")+" • Kills "+this.kills)},
 draw(){
  const w_=W(),h_=H(),p=this.p,t=performance.now()/1000;
  ctx2d.save();if(this.shake>.3)ctx2d.translate((Math.random()-.5)*this.shake,(Math.random()-.5)*this.shake);
  const bg=ctx2d.createLinearGradient(0,0,0,h_);bg.addColorStop(0,"#0b1020");bg.addColorStop(1,"#05070f");ctx2d.fillStyle=bg;ctx2d.fillRect(-20,-20,w_+40,h_+40);
  const cx=p.x-w_/2,cy=p.y-h_/2,S=64;ctx2d.strokeStyle="rgba(85,230,255,.07)";ctx2d.lineWidth=1;ctx2d.beginPath();
  for(let x=-(cx%S);x<w_;x+=S){ctx2d.moveTo(x,0);ctx2d.lineTo(x,h_)}for(let y=-(cy%S);y<h_;y+=S){ctx2d.moveTo(0,y);ctx2d.lineTo(w_,y)}ctx2d.stroke();
  const X=x=>x-cx,Y=y=>y-cy;
  for(const g of this.gem){const gx=X(g.x),gy=Y(g.y);if(gx<-20||gx>w_+20||gy<-20||gy>h_+20)continue;ctx2d.save();ctx2d.globalCompositeOperation="lighter";ctx2d.globalAlpha=.6;ctx2d.drawImage(this.glow(g.big?"#55b4ff":"#6bff6b"),gx-12,gy-12,24,24);ctx2d.restore();ctx2d.globalAlpha=1;circle(gx,gy,g.big?5:3.2,g.big?"#9ad8ff":"#b6ffb6")}
  for(const r of this.rings){ctx2d.globalAlpha=clamp(r.life/r.max,0,1);strokeCircle(X(r.x),Y(r.y),r.r,r.c,4);ctx2d.globalAlpha=1}
  for(const e of this.en){const ex=X(e.x),ey=Y(e.y);if(ex<-60||ex>w_+60||ey<-60||ey>h_+60)continue;
   ctx2d.save();ctx2d.globalCompositeOperation="lighter";ctx2d.globalAlpha=.3+(e.hf>0?.4:0);ctx2d.drawImage(this.glow(e.c),ex-e.r*2,ey-e.r*2,e.r*4,e.r*4);ctx2d.restore();ctx2d.globalAlpha=1;
   const g=ctx2d.createRadialGradient(ex-e.r*.3,ey-e.r*.3,1,ex,ey,e.r+2);g.addColorStop(0,"#fff");g.addColorStop(.4,e.hf>0?"#fff":e.c);g.addColorStop(1,"rgba(8,4,12,.85)");
   ctx2d.fillStyle=g;ctx2d.beginPath();
   if(e.ty===1){ctx2d.moveTo(ex,ey-e.r*1.2);ctx2d.lineTo(ex+e.r,ey+e.r*.8);ctx2d.lineTo(ex-e.r,ey+e.r*.8)}
   else if(e.ty===2||e.boss){for(let k=0;k<6;k++){const a=k/6*6.283+t*.3;ctx2d.lineTo(ex+Math.cos(a)*e.r*1.08,ey+Math.sin(a)*e.r*1.08)}}
   else ctx2d.arc(ex,ey,e.r,0,6.283);
   ctx2d.closePath();ctx2d.fill();
   if(e.ty===0||e.ty===3){circle(ex-e.r*.35,ey-e.r*.15,2,"#111");circle(ex+e.r*.35,ey-e.r*.15,2,"#111")}
   if(e.hp<e.max){rect(ex-e.r,ey-e.r-8,e.r*2,3,"rgba(0,0,0,.5)",0);rect(ex-e.r,ey-e.r-8,e.r*2*clamp(e.hp/e.max,0,1),3,e.c,0)}}
  for(const b of this.eb){circle(X(b.x),Y(b.y),5,"#ff914d");strokeCircle(X(b.x),Y(b.y),8,"rgba(255,145,77,.5)",2)}
  ctx2d.save();ctx2d.globalCompositeOperation="lighter";
  for(const s of this.sh){ctx2d.globalAlpha=.7;ctx2d.drawImage(this.glow("#ffd15c"),X(s.x)-9,Y(s.y)-9,18,18)}
  for(const f of this.fx){ctx2d.globalAlpha=clamp(f.life/f.max,0,1);circle(X(f.x),Y(f.y),f.r,f.c)}
  for(const b of this.bolts){ctx2d.globalAlpha=clamp(b.life/.14,0,1);ctx2d.strokeStyle="#9fe8ff";ctx2d.lineWidth=3;ctx2d.beginPath();b.pts.forEach((q,i)=>{const jx=i?rand(-5,5):0,jy=i?rand(-5,5):0;i?ctx2d.lineTo(X(q.x)+jx,Y(q.y)+jy):ctx2d.moveTo(X(q.x),Y(q.y))});ctx2d.stroke()}
  ctx2d.restore();ctx2d.globalAlpha=1;
  // blades
  if(this.w.blade>0&&this.state==="play"){const n=1+this.w.blade,R=58+this.w.blade*7;for(let i=0;i<n;i++){const a=this.bladeA+i/n*6.283;const bx=X(p.x)+Math.cos(a)*R,by=Y(p.y)+Math.sin(a)*R;
   ctx2d.save();ctx2d.translate(bx,by);ctx2d.rotate(a+1.57);ctx2d.fillStyle="#ffe9a8";ctx2d.beginPath();ctx2d.moveTo(0,-11);ctx2d.lineTo(5,6);ctx2d.lineTo(-5,6);ctx2d.closePath();ctx2d.fill();ctx2d.restore()}}
  // player
  if(this.state==="play"&&!(p.inv>0&&Math.floor(t*20)%2===0)){const px=X(p.x),py=Y(p.y);
   ctx2d.save();ctx2d.globalCompositeOperation="lighter";ctx2d.globalAlpha=.5;ctx2d.drawImage(this.glow("#55e6ff"),px-30,py-30,60,60);ctx2d.restore();ctx2d.globalAlpha=1;
   const g=ctx2d.createRadialGradient(px-4,py-5,1,px,py,14);g.addColorStop(0,"#fff");g.addColorStop(.5,"#55e6ff");g.addColorStop(1,"#0d6a8a");ctx2d.fillStyle=g;ctx2d.beginPath();ctx2d.arc(px,py,13,0,6.283);ctx2d.fill();
   ctx2d.save();ctx2d.translate(px,py);ctx2d.rotate(p.face);ctx2d.fillStyle="#fff";ctx2d.beginPath();ctx2d.moveTo(19,0);ctx2d.lineTo(11,-5);ctx2d.lineTo(11,5);ctx2d.closePath();ctx2d.fill();ctx2d.restore()}
  for(const q of this.pops){ctx2d.globalAlpha=clamp(q.life*2,0,1);text(String(q.t),X(q.x),Y(q.y),12,q.c,"center",800)}ctx2d.globalAlpha=1;
  ctx2d.restore();
  // HUD
  const hf=clamp(p.hp/p.max,0,1);rect(12,78,140,10,"rgba(255,255,255,.12)",5);rect(12,78,140*hf,10,hf>.5?"#6bff6b":hf>.25?"#ffb366":"#ff4f6a",5);
  rect(12,92,140,6,"rgba(255,255,255,.1)",3);rect(12,92,140*clamp(this.xp/this.need,0,1),6,"#55b4ff",3);
  text("LV "+this.lv,160,98,12,"#9ad8ff","left",800);
  text(Math.floor(this.t/60)+":"+String(Math.floor(this.t%60)).padStart(2,"0"),w_-12,88,16,"#fff","right",900);text("☠ "+this.kills,w_-12,106,12,"#ffb3b3","right",800);
  if(this.banner){ctx2d.globalAlpha=clamp(Math.min(this.banner.t,1),0,1);text(this.banner.txt,w_/2,h_*.3,24,"#ff4fd8","center",900);ctx2d.globalAlpha=1}
  if(this.flash>0){ctx2d.fillStyle="rgba(255,255,255,"+(this.flash*.25)+")";ctx2d.fillRect(0,0,w_,h_)}
  if(this.t<6&&this.state==="play")text("Drag to move — you shoot automatically",w_/2,h_-90,14,"rgba(255,255,255,"+clamp(2-this.t/3,0,.8)+")","center",700);
  if(this.cards){ctx2d.fillStyle="rgba(3,5,14,.82)";ctx2d.fillRect(0,0,w_,h_);text("LEVEL UP!",w_/2,h_/2-176,28,"#ffd15c","center",900);
   const L=this.cardRects();this.cards.forEach((c,i)=>{const r=L[i];rect(r.x,r.y,r.w,r.h,"rgba(30,36,64,.95)",16);ctx2d.strokeStyle=c.w?"rgba(255,209,92,.7)":"rgba(85,230,255,.5)";ctx2d.lineWidth=2;ctx2d.beginPath();ctx2d.roundRect?ctx2d.roundRect(r.x,r.y,r.w,r.h,16):ctx2d.rect(r.x,r.y,r.w,r.h);ctx2d.stroke();
    text(c.ic,r.x+34,r.y+55,34,"#fff","center");text(c.n+(c.w?"  Lv "+(this.w[c.id]+1):""),r.x+66,r.y+36,17,"#fff","left",800);text(c.d,r.x+66,r.y+62,13,"#b8c2e0","left",600)})}
  if(this.state==="over"){const a=clamp(this.t2*1.5,0,.75);ctx2d.fillStyle="rgba(3,4,12,"+a+")";ctx2d.fillRect(0,0,w_,h_);
   if(this.t2>.4){text("YOU FELL",w_/2,h_*.32,32,"#ff4f6a","center",900);text("Survived "+Math.floor(this.t/60)+":"+String(Math.floor(this.t%60)).padStart(2,"0")+" • "+this.kills+" kills",w_/2,h_*.32+40,16,"#fff","center",700);
    text("Score "+this.score,w_/2,h_*.32+68,20,"#ffd15c","center",900);text(this.newHi?"NEW BEST!":"Best "+this.hi,w_/2,h_*.32+96,15,this.newHi?"#ffd15c":"#aab","center",800);
    if(this.t2>.8)text("TAP TO TRY AGAIN",w_/2,h_*.32+136,16,"#55e6ff","center",900)}}},
 destroy(){this.a=false;if(this._lis){cv2d.removeEventListener("pointermove",this._lis.move);cv2d.removeEventListener("pointerup",this._lis.up);cv2d.removeEventListener("pointercancel",this._lis.up);this._lis=null}}
};

/* ============ AAA: BASTION DEFENSE ============ */
const Bastion={
 a:false,
 COLS:7,ROWS:10,
 PATH:[[0,1],[5,1],[5,3],[1,3],[1,5],[5,5],[5,7],[1,7],[1,9],[6,9]],
 TW:{
  archer:{n:"Archer",ic:"🏹",cost:50,rng:2.6,dmg:9,rate:.45,c:"#ffd15c"},
  cannon:{n:"Cannon",ic:"💣",cost:90,rng:2.4,dmg:28,rate:1.5,c:"#ff914d",splash:.95},
  frost:{n:"Frost",ic:"❄️",cost:70,rng:2.2,dmg:3,rate:.9,c:"#8fe9ff",slow:.5},
  tesla:{n:"Tesla",ic:"⚡",cost:120,rng:2.4,dmg:16,rate:1.1,c:"#c58cff",chain:3}},
 init(){this.a=true;this.hi=0;try{this.hi=+localStorage.getItem("bastionHi")||0}catch(e){}this.reset();hudTitle("BASTION DEFENSE","Wave 1")},
 reset(){this.gold=160;this.lives=20;this.wave=0;this.towers=[];this.en=[];this.sh=[];this.fx=[];this.pops=[];this.q=[];this.sel="archer";this.pick=null;
  this.state="build";this.t=0;this.t2=0;this.auto=14;this.speed=1;this.score=0;this.newHi=false;this.banner=null;this.flash=0;this.shake=0;
  this.cells=new Set();for(let i=0;i<this.PATH.length-1;i++){let[a,b]=this.PATH[i],[c,d]=this.PATH[i+1];const sx=Math.sign(c-a),sy=Math.sign(d-b);let x=a,y=b;this.cells.add(x+","+y);while(x!==c||y!==d){x+=sx;y+=sy;this.cells.add(x+","+y)}}},
 lay(){const w=W(),h=H();const topH=84,botH=104;const cs=Math.floor(Math.min(w/this.COLS,(h-topH-botH)/this.ROWS));const gw=cs*this.COLS,gh=cs*this.ROWS;
  return{cs,ox:Math.floor((w-gw)/2),oy:topH+Math.max(0,Math.floor((h-topH-botH-gh)/2))}},
 cpos(c,r){const L=this.lay();return{x:L.ox+(c+.5)*L.cs,y:L.oy+(r+.5)*L.cs}},
 sfx(k){try{if(k==="place")beep(300,600,.1,"triangle",.08);else if(k==="shot")beep(800,500,.03,"square",.015);else if(k==="boom")beep(120,40,.25,"sawtooth",.08);else if(k==="kill")beep(350,150,.08,"sine",.05);else if(k==="leak")beep(180,60,.3,"sawtooth",.12);else if(k==="wave")beep(400,900,.2,"triangle",.1);else if(k==="zap")beep(1100,300,.08,"square",.03)}catch(e){}},
 pop(x,y,t,c){if(this.pops.length<30)this.pops.push({x,y,t,c,life:.8})},
 spark(x,y,c,n,spd){for(let k=0;k<n&&this.fx.length<250;k++){const a=rand(0,6.283),v=rand(spd*.3,spd);this.fx.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(.25,.5),max:.5,r:rand(1.5,3),c})}},
 tstat(t){const d=this.TW[t.type],m=1+(t.lv-1)*.45;return{dmg:d.dmg*m,rng:d.rng*(1+(t.lv-1)*.1),rate:d.rate/(1+(t.lv-1)*.12)}},
 upCost(t){return Math.floor(this.TW[t.type].cost*(.7+t.lv*.5))},
 startWave(){if(this.state!=="build")return;this.wave++;this.state="run";this.sfx("wave");const w=this.wave;this.banner={txt:"WAVE "+w,t:1.5};
  const n=6+w*2,hp=1+w*.13;this.q=[];
  for(let i=0;i<n;i++){let ty="grunt";const r=Math.random();if(w>=3&&r<.3)ty="fast";if(w>=5&&r<.2)ty="tank";this.q.push({t:i*.7,ty,hp})}
  if(w%5===0)this.q.push({t:n*.7+1,ty:"boss",hp:hp*1.0});
  this.auto=14},
 mk(ty,hs){const B={grunt:{hp:32,spd:.85,r:.26,rw:7,c:"#6bff6b"},fast:{hp:20,spd:1.6,r:.22,rw:6,c:"#ffd15c"},tank:{hp:150,spd:.55,r:.34,rw:16,c:"#a375ff"},boss:{hp:1100,spd:.45,r:.46,rw:90,c:"#ff4fd8"}}[ty];
  const p=this.cpos(this.PATH[0][0],this.PATH[0][1]);this.en.push({ty,x:p.x-this.lay().cs,y:p.y,seg:0,pg:0,hp:B.hp*hs,max:B.hp*hs,spd:B.spd,r:B.r,rw:B.rw,c:B.c,slow:0,hf:0})},
 pointer(px,py){
  if(this.state==="over"||this.state==="win"){if(this.t2>.8)this.reset();return}
  const w=W(),h=H(),L=this.lay();
  // speed toggle
  if(px>w-58&&py>66&&py<100){this.speed=this.speed===1?2:1;return}
  // bottom bar
  const by=h-100;
  if(py>by){
   if(this.pick){ // upgrade / sell panel
    if(px<w/2-4){const t=this.pick,c=this.upCost(t);if(t.lv<3&&this.gold>=c){this.gold-=c;t.lv++;this.sfx("place");this.spark(t.x,t.y,"#fff",12,150)}}
    else if(px>w/2+4&&px<w-60){const t=this.pick;this.gold+=Math.floor(this.TW[t.type].cost*.6*(1+(t.lv-1)*.6));this.towers=this.towers.filter(q=>q!==t);this.pick=null;this.sfx("kill")}
    else{this.pick=null}
    return}
   const keys=Object.keys(this.TW),bw=(w-24)/keys.length;
   if(py<by+62){const i=Math.floor((px-12)/bw);if(i>=0&&i<keys.length)this.sel=keys[i];return}
   if(this.state==="build"&&px>12&&px<w-12&&py>=by+66){this.startWave()}
   return}
  // grid
  const c=Math.floor((px-L.ox)/L.cs),r=Math.floor((py-L.oy)/L.cs);
  if(c<0||r<0||c>=this.COLS||r>=this.ROWS)return;
  const ex=this.towers.find(t=>t.c===c&&t.r===r);
  if(ex){this.pick=this.pick===ex?null:ex;return}
  this.pick=null;
  if(this.cells.has(c+","+r))return;
  const d=this.TW[this.sel];
  if(this.gold>=d.cost){const p=this.cpos(c,r);this.gold-=d.cost;this.towers.push({type:this.sel,c,r,x:p.x,y:p.y,lv:1,cd:0});this.sfx("place");this.spark(p.x,p.y,d.c,10,120)}
  else{this.pop(px,py-10,"Need "+d.cost+"g","#ff7b7b")}},
 dmgEn(e,d){e.hp-=d;e.hf=.08;if(e.hp<=0&&!e.dead){e.dead=true;this.gold+=e.rw;this.score+=e.rw;this.sfx("kill");this.spark(e.x,e.y,e.c,10,160);this.pop(e.x,e.y-10,"+"+e.rw,"#ffd15c")}},
 update(dt0){
  const dt=dt0*(this.state==="run"?this.speed:1),L=this.lay();
  for(const f of this.fx){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=1-2*dt;f.vy*=1-2*dt;f.life-=dt}this.fx=this.fx.filter(f=>f.life>0);
  for(const q of this.pops){q.y-=24*dt;q.life-=dt}this.pops=this.pops.filter(q=>q.life>0);
  this.shake=Math.max(0,this.shake-dt*30);this.flash=Math.max(0,this.flash-dt*1.6);
  if(this.banner){this.banner.t-=dt;if(this.banner.t<=0)this.banner=null}
  if(this.state==="over"||this.state==="win"){this.t2+=dt0;if((pressed("a")||pressed("b"))&&this.t2>.8)this.reset();return}
  this.t+=dt;
  if(this.state==="build"){this.auto-=dt0;if(this.auto<=0&&this.wave>0)this.startWave();if(pressed("a"))this.startWave()}
  if(this.state==="run"){
   for(const s of this.q)s.t-=dt;this.q=this.q.filter(s=>{if(s.t<=0){this.mk(s.ty,s.hp);return false}return true});
   const cs=L.cs;
   for(const e of this.en){if(e.dead)continue;e.hf=Math.max(0,e.hf-dt);e.slow=Math.max(0,e.slow-dt);
    let sp=e.spd*cs*(e.slow>0?.5:1)*dt;
    while(sp>0&&!e.dead){const tgt=this.PATH[e.seg+1];if(!tgt){e.dead=true;this.lives--;this.flash=.5;this.shake=10;this.sfx("leak");this.pop(e.x,e.y,"-1 ❤","#ff4f6a");break}
     const tp=this.cpos(tgt[0],tgt[1]);const dx=tp.x-e.x,dy=tp.y-e.y,d=Math.hypot(dx,dy);
     if(d<=sp){e.x=tp.x;e.y=tp.y;e.seg++;e.pg+=d;sp-=d}else{e.x+=dx/d*sp;e.y+=dy/d*sp;e.pg+=sp;sp=0}}}
   // towers
   for(const t of this.towers){const d=this.TW[t.type],s=this.tstat(t);t.cd-=dt;if(t.cd>0)continue;
    let best=null,bp=-1;for(const e of this.en){if(e.dead)continue;const dd=Math.hypot(e.x-t.x,e.y-t.y);if(dd<=s.rng*cs&&e.pg>bp){bp=e.pg;best=e}} // furthest along the path first
    if(!best)continue;t.cd=s.rate;
    if(t.type==="archer"){this.sh.push({x:t.x,y:t.y,tx:best,sp:520,d:s.dmg,c:d.c,r:3});this.sfx("shot")}
    else if(t.type==="cannon"){this.sh.push({x:t.x,y:t.y,tx:best,sp:300,d:s.dmg,c:d.c,r:6,splash:d.splash*cs});this.sfx("shot")}
    else if(t.type==="frost"){this.fx.push({x:t.x,y:t.y,vx:0,vy:0,life:.35,max:.35,r:s.rng*cs,ring:true,c:d.c});this.sfx("zap");
     for(const e of this.en){if(!e.dead&&Math.hypot(e.x-t.x,e.y-t.y)<=s.rng*cs){e.slow=1.6;this.dmgEn(e,s.dmg)}}}
    else if(t.type==="tesla"){let cur=best;const hit=new Set();this.sfx("zap");let fx=t.x,fy=t.y;
     for(let i=0;i<d.chain&&cur;i++){hit.add(cur);this.dmgEn(cur,s.dmg);this.fx.push({x:fx,y:fy,x2:cur.x,y2:cur.y,life:.12,max:.12,bolt:true,c:d.c});fx=cur.x;fy=cur.y;
      let nx=null,nd=cs*1.6;for(const e of this.en){if(e.dead||hit.has(e))continue;const dd=Math.hypot(e.x-fx,e.y-fy);if(dd<nd){nd=dd;nx=e}}cur=nx}}}
   for(const s of this.sh){const tg=s.tx;if(!tg||tg.dead){s.dead=true;continue}const dx=tg.x-s.x,dy=tg.y-s.y,d=Math.hypot(dx,dy);const st=s.sp*dt;
    if(d<=st+6){if(s.splash){this.sfx("boom");this.spark(tg.x,tg.y,"#ff914d",16,200);this.fx.push({x:tg.x,y:tg.y,vx:0,vy:0,life:.3,max:.3,r:s.splash,ring:true,c:"#ff914d"});for(const e of this.en){if(!e.dead&&Math.hypot(e.x-tg.x,e.y-tg.y)<=s.splash)this.dmgEn(e,s.d)}}else this.dmgEn(tg,s.d);s.dead=true}
    else{s.x+=dx/d*st;s.y+=dy/d*st}}
   this.sh=this.sh.filter(s=>!s.dead);this.en=this.en.filter(e=>!e.dead);
   if(this.lives<=0){this.state="over";this.t2=0;this.finish()}
   else if(!this.en.length&&!this.q.length){const b=20+this.wave*4;this.gold+=b;this.pop(W()/2,H()/2,"Wave clear +"+b+"g","#ffd15c");this.state="build";this.auto=12;if(this.wave>=25){this.state="win";this.t2=0;this.finish()}}}
  hudTitle("BASTION DEFENSE","Wave "+Math.max(1,this.wave)+" • ❤ "+this.lives+" • "+this.gold+"g")},
 finish(){this.score+=this.wave*50+this.lives*10;if(this.score>this.hi){this.hi=this.score;this.newHi=true;try{localStorage.setItem("bastionHi",String(this.hi))}catch(e){}}progress.coins+=Math.floor(this.score/12);saveProg()},
 draw(){
  const w=W(),h=H(),L=this.lay(),cs=L.cs,t=performance.now()/1000;
  ctx2d.save();if(this.shake>.3)ctx2d.translate((Math.random()-.5)*this.shake,(Math.random()-.5)*this.shake);
  const bg=ctx2d.createLinearGradient(0,0,0,h);bg.addColorStop(0,"#0c1a16");bg.addColorStop(1,"#060d0b");ctx2d.fillStyle=bg;ctx2d.fillRect(-20,-20,w+40,h+40);
  for(let r=0;r<this.ROWS;r++)for(let c=0;c<this.COLS;c++){const x=L.ox+c*cs,y=L.oy+r*cs,path=this.cells.has(c+","+r);
   rect(x+1,y+1,cs-2,cs-2,path?"#3a2d1e":((c+r)%2?"#143026":"#112a21"),5)}
  // range of selected tower
  const rt=this.pick||null;if(rt){const s=this.tstat(rt);ctx2d.fillStyle="rgba(255,255,255,.06)";ctx2d.beginPath();ctx2d.arc(rt.x,rt.y,s.rng*cs,0,6.283);ctx2d.fill();strokeCircle(rt.x,rt.y,s.rng*cs,"rgba(255,255,255,.4)",1.5)}
  // entrance / exit
  const sp=this.cpos(this.PATH[0][0],this.PATH[0][1]),ep=this.cpos(this.PATH[this.PATH.length-1][0],this.PATH[this.PATH.length-1][1]);
  text("▶",sp.x,sp.y+6,18,"#6bff6b","center",900);text("🏰",ep.x,ep.y+8,cs*.6,"#fff","center");
  for(const e of this.en){const g=ctx2d.createRadialGradient(e.x-3,e.y-3,1,e.x,e.y,e.r*cs+2);g.addColorStop(0,"#fff");g.addColorStop(.4,e.hf>0?"#fff":e.c);g.addColorStop(1,"rgba(8,4,12,.85)");
   ctx2d.fillStyle=g;ctx2d.beginPath();ctx2d.arc(e.x,e.y,e.r*cs,0,6.283);ctx2d.fill();if(e.slow>0)strokeCircle(e.x,e.y,e.r*cs+3,"rgba(143,233,255,.8)",2);
   if(e.ty==="boss")strokeCircle(e.x,e.y,e.r*cs+4+Math.sin(t*6)*2,"rgba(255,79,216,.6)",2.5);
   const bw=e.r*cs*2;rect(e.x-bw/2,e.y-e.r*cs-8,bw,3,"rgba(0,0,0,.5)",0);rect(e.x-bw/2,e.y-e.r*cs-8,bw*clamp(e.hp/e.max,0,1),3,"#6bff6b",0)}
  for(const tw of this.towers){const d=this.TW[tw.type];ctx2d.save();ctx2d.globalCompositeOperation="lighter";const gl=ctx2d.createRadialGradient(tw.x,tw.y,2,tw.x,tw.y,cs*.55);gl.addColorStop(0,d.c+"88");gl.addColorStop(1,"rgba(0,0,0,0)");ctx2d.fillStyle=gl;ctx2d.beginPath();ctx2d.arc(tw.x,tw.y,cs*.55,0,6.283);ctx2d.fill();ctx2d.restore();
   rect(tw.x-cs*.38,tw.y-cs*.38,cs*.76,cs*.76,"#1d2a3a",8);ctx2d.strokeStyle=d.c;ctx2d.lineWidth=2;ctx2d.strokeRect(tw.x-cs*.38,tw.y-cs*.38,cs*.76,cs*.76);
   text(d.ic,tw.x,tw.y+cs*.12,cs*.42,"#fff","center");for(let i=0;i<tw.lv;i++)circle(tw.x-cs*.2+i*cs*.2,tw.y+cs*.33,2.6,"#ffd15c");
   if(this.pick===tw)strokeCircle(tw.x,tw.y,cs*.5,"#fff",2)}
  for(const s of this.sh){ctx2d.save();ctx2d.globalCompositeOperation="lighter";circle(s.x,s.y,s.r+3,s.c+"66");ctx2d.restore();circle(s.x,s.y,s.r,s.c)}
  ctx2d.save();ctx2d.globalCompositeOperation="lighter";
  for(const f of this.fx){ctx2d.globalAlpha=clamp(f.life/f.max,0,1);if(f.ring)strokeCircle(f.x,f.y,f.r*(1-f.life/f.max*.6),f.c,3);else if(f.bolt){ctx2d.strokeStyle=f.c;ctx2d.lineWidth=3;ctx2d.beginPath();ctx2d.moveTo(f.x,f.y);ctx2d.lineTo((f.x+f.x2)/2+rand(-6,6),(f.y+f.y2)/2+rand(-6,6));ctx2d.lineTo(f.x2,f.y2);ctx2d.stroke()}else circle(f.x,f.y,f.r,f.c)}
  ctx2d.restore();ctx2d.globalAlpha=1;
  for(const q of this.pops){ctx2d.globalAlpha=clamp(q.life*2,0,1);text(q.t,q.x,q.y,13,q.c,"center",800)}ctx2d.globalAlpha=1;
  ctx2d.restore();
  // top HUD
  text("❤ "+this.lives,14,96,16,"#ff8a8a","left",900);text("💰 "+this.gold,92,96,16,"#ffd15c","left",900);text("WAVE "+Math.max(1,this.wave)+"/25",w/2+30,96,13,"#9ff","center",800);
  rect(w-58,70,48,28,"rgba(255,255,255,.12)",10);text(this.speed===1?"▶":"▶▶",w-34,90,14,"#fff","center",900);
  // bottom bar
  const by=h-100;rect(0,by-4,w,110,"rgba(5,10,16,.92)",0);
  if(this.pick){const tw=this.pick,c=this.upCost(tw),maxed=tw.lv>=3;
   rect(12,by+6,w/2-16,50,maxed?"rgba(120,120,120,.3)":(this.gold>=c?"rgba(107,255,107,.25)":"rgba(255,80,80,.2)"),14);text(maxed?"MAX LEVEL":"⬆ Upgrade  "+c+"g",12+(w/2-16)/2,by+37,15,"#fff","center",800);
   rect(w/2+4,by+6,w/2-64,50,"rgba(255,180,80,.22)",14);text("Sell +"+Math.floor(this.TW[tw.type].cost*.6*(1+(tw.lv-1)*.6))+"g",w/2+4+(w/2-64)/2,by+37,15,"#fff","center",800);
   text(this.TW[tw.type].n+" Lv "+tw.lv,w/2,by+80,12,"#aab","center",700)}
  else{const keys=Object.keys(this.TW),bw=(w-24)/keys.length;keys.forEach((k,i)=>{const d=this.TW[k],x=12+i*bw,on=this.sel===k;rect(x+3,by+4,bw-6,56,on?"rgba(255,255,255,.2)":"rgba(255,255,255,.07)",12);if(on){ctx2d.strokeStyle=d.c;ctx2d.lineWidth=2;ctx2d.beginPath();ctx2d.roundRect?ctx2d.roundRect(x+3,by+4,bw-6,56,12):ctx2d.rect(x+3,by+4,bw-6,56);ctx2d.stroke()}
    text(d.ic,x+bw/2,by+32,22,"#fff","center");text(d.cost+"g",x+bw/2,by+52,11,this.gold>=d.cost?"#ffd15c":"#ff7b7b","center",800)});
   if(this.state==="build"){rect(12,by+66,w-24,30,"rgba(107,255,107,.28)",12);text(this.wave===0?"▶ START WAVE 1":"▶ NEXT WAVE ("+Math.max(0,Math.ceil(this.auto))+"s)",w/2,by+87,14,"#d9ffd9","center",900)}
   else text("Wave in progress…",w/2,by+86,12,"#8aa","center",700)}
  if(this.banner){ctx2d.globalAlpha=clamp(Math.min(this.banner.t,1),0,1);text(this.banner.txt,w/2,h*.3,30,"#6bff6b","center",900);ctx2d.globalAlpha=1}
  if(this.flash>0){ctx2d.fillStyle="rgba(255,50,70,"+(this.flash*.3)+")";ctx2d.fillRect(0,0,w,h)}
  if(this.wave===0&&this.towers.length===0&&this.state==="build")text("Pick a tower, then tap a green tile",w/2,L.oy-8,13,"rgba(255,255,255,.75)","center",700);
  if(this.state==="over"||this.state==="win"){const a=clamp(this.t2*1.5,0,.78);ctx2d.fillStyle="rgba(3,6,10,"+a+")";ctx2d.fillRect(0,0,w,h);
   if(this.t2>.4){const win=this.state==="win";text(win?"BASTION HELD!":"BASTION FELL",w/2,h*.32,32,win?"#6bff6b":"#ff4f6a","center",900);text("Wave "+this.wave+" • Score "+this.score,w/2,h*.32+40,18,"#fff","center",800);
    text(this.newHi?"NEW BEST!":"Best "+this.hi,w/2,h*.32+68,15,this.newHi?"#ffd15c":"#aab","center",800);if(this.t2>.8)text("TAP TO PLAY AGAIN",w/2,h*.32+108,16,"#55e6ff","center",900)}}},
 destroy(){this.a=false}
};
