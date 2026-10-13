/* ============ AAA: GRAVITY FLIP ============ */
const Gravity={
 a:false,
 R:14,
 init(){this.a=true;this.hi=0;try{this.hi=+localStorage.getItem("gflipHi")||0}catch(e){}this.reset();hudTitle("GRAVITY FLIP","Tap to flip gravity")},
 reset(){this.p={y:null,side:1};this.state="ready";this.t=0;this.dead=0;this.dist=0;this.coins=0;this.score=0;this.newHi=false;
  this.spd=280;this.nextSpike=1.2;this.nextCoin=.6;this.obs=[];this.gold=[];this.shake=0},
 lanes(){const w=W(),h=H(),m=Math.max(96,h*.2);return{top:m,bot:h-m,w,h}},
 surf(L,side){return side===1?L.bot-this.R:L.top+this.R},
 px(){return W()*.25},
 sfx(k){try{if(k==="flip")beep(520,880,.08,"triangle",.06);else if(k==="coin")beep(980,1400,.05,"sine",.05);else if(k==="die")beep(300,60,.35,"sawtooth",.1)}catch(e){}},
 pointer(){
  if(this.state==="ready"){this.state="play";return}
  if(this.state==="play"){this.p.side*=-1;this.sfx("flip");return}
  if(this.state==="dead"&&this.dead>.7){this.reset();this.state="play"}},
 die(){
  this.state="dead";this.dead=0;this.shake=1;this.sfx("die");
  if(this.score>this.hi){this.hi=this.score;this.newHi=true;try{localStorage.setItem("gflipHi",String(this.hi))}catch(e){}}},
 update(dt){
  const L=this.lanes();
  if(this.p.y==null)this.p.y=this.surf(L,this.p.side);
  this.t+=dt;
  if(this.state==="ready")return;
  if(this.state==="dead"){this.dead+=dt;this.shake=Math.max(0,this.shake-dt*2);return}
  const tgt=this.surf(L,this.p.side);
  this.p.y+=(tgt-this.p.y)*Math.min(1,dt*16);
  this.spd=Math.min(620,280+this.dist*.02);
  const s=this.spd;
  this.dist+=s*dt;
  for(const o of this.obs)o.x-=s*dt;
  for(const k of this.gold)k.x-=s*dt;
  this.obs=this.obs.filter(o=>o.x>-40);
  this.gold=this.gold.filter(k=>!k.got&&k.x>-40);
  this.nextSpike-=dt;
  if(this.nextSpike<=0){this.obs.push({x:L.w+30,side:Math.random()<.5?1:-1,w:34,h:42});this.nextSpike=rand(.9,1.4)}
  this.nextCoin-=dt;
  if(this.nextCoin<=0){this.gold.push({x:L.w+30,side:Math.random()<.5?1:-1});this.nextCoin=rand(.5,1.1)}
  const px=this.px(),py=this.p.y,ps=this.p.side;
  for(const o of this.obs){
   if(o.side===ps&&o.x-17<px+12&&o.x+17>px-12&&Math.abs(py-this.surf(L,ps))<18){this.die();return}}
  for(const k of this.gold){
   if(!k.got&&k.side===ps&&Math.abs(k.x-px)<24){k.got=true;this.coins++;this.sfx("coin")}}
  this.score=Math.floor(this.dist/10)+this.coins*5},
 draw(){
  const L=this.lanes(),w=L.w,h=L.h,c=ctx2d;
  if(this.p.y==null)this.p.y=this.surf(L,this.p.side);
  c.save();
  if(this.shake>0)c.translate(rand(-6,6)*this.shake,rand(-6,6)*this.shake);
  const bg=c.createLinearGradient(0,0,0,h);bg.addColorStop(0,"#0b0720");bg.addColorStop(1,"#1d0b3a");
  c.fillStyle=bg;c.fillRect(-10,-10,w+20,h+20);
  c.strokeStyle="#55e6ff";c.lineWidth=3;c.shadowColor="#55e6ff";c.shadowBlur=14;
  c.beginPath();c.moveTo(0,L.top);c.lineTo(w,L.top);c.moveTo(0,L.bot);c.lineTo(w,L.bot);c.stroke();c.shadowBlur=0;
  c.fillStyle="#ff4fd8";
  for(const o of this.obs){
   const base=o.side===1?L.bot:L.top;
   c.beginPath();c.moveTo(o.x-17,base);c.lineTo(o.x,base-o.side*o.h);c.lineTo(o.x+17,base);c.closePath();c.fill()}
  c.shadowColor="#ffd15c";c.shadowBlur=12;c.fillStyle="#ffd15c";
  for(const k of this.gold){
   if(k.got)continue;
   const y=k.side===1?L.bot-this.R-14:L.top+this.R+14;
   c.beginPath();c.arc(k.x,y,7+Math.sin(this.t*6+k.x)*1,0,6.283);c.fill()}
  c.shadowBlur=0;
  c.shadowColor=this.state==="dead"?"#ff5577":"#55e6ff";c.shadowBlur=22;
  c.fillStyle=this.state==="dead"?"#ff5577":"#55e6ff";
  c.beginPath();c.arc(this.px(),this.p.y,12,0,6.283);c.fill();
  c.shadowBlur=0;
  c.restore();
  text(String(this.score),w/2,L.top-30,22,"#fff","center",900);
  text("BEST "+this.hi,w/2,L.top-10,12,"#aab","center",800);
  if(this.state==="ready")text("TAP TO FLIP GRAVITY",w/2,h/2,18,"#55e6ff","center",900);
  if(this.state==="dead"){
   text("CRASHED",w/2,h/2-18,30,"#ff5577","center",900);
   text(this.newHi?"NEW BEST!":"Score "+this.score,w/2,h/2+16,15,this.newHi?"#ffd15c":"#ccd","center",800);
   if(this.dead>.7)text("TAP TO RETRY",w/2,h/2+48,16,"#55e6ff","center",900)}},
 destroy(){this.a=false}
};

