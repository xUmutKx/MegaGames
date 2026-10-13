/* ============ RELAX: SOAP BUBBLES ============ */
const SoapBubbles={
 a:false,
 init(){this.a=true;this.reset();hudTitle("SOAP BUBBLES","Tap empty space to blow a bubble, tap one to pop it")},
 reset(){
  this.b=[];this.sp=[];this.t=0;
  for(let i=0;i<5;i++)this.blow(rand(0,W()),rand(0,H()));
 },
 blow(x,y){
  this.b.push({x,y,r:rand(16,38),vx:rand(-12,12),vy:rand(-30,-14),ph:Math.random()*6.283,h:Math.random()*360});
  if(this.b.length>40)this.b.shift();
 },
 pointer(px,py){
  const q=cv2d.getBoundingClientRect(),x=px-q.left,y=py-q.top;
  const hit=this.b.findIndex(b=>Math.hypot(b.x-x,b.y-y)<b.r);
  if(hit>=0){
   const b=this.b[hit];
   this.b.splice(hit,1);
   this.burst(b.x,b.y,b.h);
   beep(900,1300,.08,"sine",.04);
  }else this.blow(x,y);
 },
 burst(x,y,h){
  for(let i=0;i<12;i++){
   const a=i/12*6.283;
   this.sp.push({x,y,vx:Math.cos(a)*90,vy:Math.sin(a)*90,l:1,h});
  }
 },
 update(dt){
  this.t+=dt;
  for(const b of this.b){
   b.y+=(b.vy+Math.sin(this.t*2+b.ph)*12)*dt;
   b.x+=b.vx*dt;
  }
  // bubbles that float off the top are replaced by new ones from the bottom
  const gone=this.b.filter(b=>b.y<-b.r).length;
  this.b=this.b.filter(b=>b.y>=-b.r);
  for(let i=0;i<gone;i++)this.blow(rand(0,W()),H()+rand(10,40));
  for(const s of this.sp){s.x+=s.vx*dt;s.y+=s.vy*dt;s.vx*=.96;s.vy*=.96;s.l-=dt*1.6}
  this.sp=this.sp.filter(s=>s.l>0);
 },
 draw(){
  const c=ctx2d,w=W(),h=H();
  const bg=c.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,"#0f2740");bg.addColorStop(1,"#2a4d7a");
  c.fillStyle=bg;c.fillRect(0,0,w,h);
  for(const b of this.b){
   const hue=(b.h+this.t*40)%360;
   c.fillStyle=`hsla(${(hue+120)%360},95%,70%,.12)`;
   c.strokeStyle=`hsla(${hue},95%,75%,.9)`;
   c.lineWidth=2.5;
   c.beginPath();c.arc(b.x,b.y,b.r,0,6.283);c.fill();c.stroke();
   c.fillStyle="rgba(255,255,255,.6)";
   c.beginPath();c.arc(b.x-b.r*.35,b.y-b.r*.35,b.r*.18,0,6.283);c.fill();
  }
  for(const s of this.sp){
   c.fillStyle=`hsla(${s.h},90%,75%,${s.l})`;
   c.beginPath();c.arc(s.x,s.y,3,0,6.283);c.fill();
  }
 },
 destroy(){this.a=false}
};
