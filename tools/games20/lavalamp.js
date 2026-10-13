/* ============ RELAX: LAVA LAMP ============ */
const LavaLamp={
 a:false,
 COL:["#ff5e9c","#ffb347","#ffe066","#8f7bff","#5ee7c9"],
 init(){this.a=true;this.reset();hudTitle("LAVA LAMP","Tap a blob to heat it, tap empty glass to add one")},
 reset(){
  this.bl=[];this.t=0;
  for(let i=0;i<7;i++)this.add(rand(W()*.3,W()*.7),H()*rand(.5,.9));
 },
 add(x,y){
  this.bl.push({x,y,r:rand(26,40),vy:0,up:false,ph:Math.random()*6.283,c:this.COL[this.bl.length%this.COL.length]});
  if(this.bl.length>12)this.bl.shift();
 },
 pointer(px,py){
  const q=cv2d.getBoundingClientRect(),x=px-q.left,y=py-q.top;
  const hit=this.bl.find(b=>Math.hypot(b.x-x,b.y-y)<b.r+10);
  if(hit){hit.up=true;hit.vy-=60;beep(360,520,.12,"sine",.03)}
  else this.add(x,y);
 },
 update(dt){
  this.t+=dt;
  const w=W(),h=H();
  for(const b of this.bl){
   // warm blobs at the bottom rise, cooled ones sink back down
   if(b.y>h*.84)b.up=true;
   if(b.y<h*.16)b.up=false;
   const tgt=b.up?-60:50;
   b.vy+=(tgt-b.vy)*Math.min(1,dt*1.2);
   b.y+=b.vy*dt;
   b.x+=Math.sin(this.t*.9+b.ph)*14*dt;
   b.x=Math.max(b.r,Math.min(w-b.r,b.x));
  }
 },
 draw(){
  const c=ctx2d,w=W(),h=H();
  const bg=c.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,"#2b0f3a");bg.addColorStop(1,"#14061f");
  c.fillStyle=bg;c.fillRect(0,0,w,h);
  c.fillStyle="rgba(255,120,60,.22)";
  c.fillRect(0,h*.86,w,h*.14);
  for(const b of this.bl){
   const g=c.createRadialGradient(b.x-b.r*.3,b.y-b.r*.3,b.r*.2,b.x,b.y,b.r);
   g.addColorStop(0,"#ffffff");g.addColorStop(.35,b.c);g.addColorStop(1,"rgba(0,0,0,0)");
   c.fillStyle=g;c.shadowColor=b.c;c.shadowBlur=24;
   c.beginPath();c.arc(b.x,b.y,b.r,0,6.283);c.fill();
  }
  c.shadowBlur=0;
 },
 destroy(){this.a=false}
};
