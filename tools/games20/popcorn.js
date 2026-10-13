/* ============ RELAX: POPCORN POP ============ */
const PopcornPop={
 a:false,
 init(){this.a=true;this.reset();hudTitle("POPCORN POP","Tap near the kernels to warm them up")},
 reset(){
  const w=W(),h=H();
  this.k=[];this.puffs=[];this.wait=0;this.t=0;
  for(let i=0;i<40;i++)this.k.push({x:rand(w*.15,w*.85),y:h*.6+rand(0,h*.1),heat:0,p:false});
 },
 pointer(px,py){
  const q=cv2d.getBoundingClientRect(),x=px-q.left,y=py-q.top;
  for(const k of this.k){
   if(k.p)continue;
   const d=Math.hypot(k.x-x,k.y-y);
   if(d<70)k.heat+=.45*(1-d/70)+.2;
  }
  beep(1400,1800,.03,"square",.01);
 },
 update(dt){
  this.t+=dt;
  const w=W(),floor=H()*.8;
  for(const k of this.k){
   if(k.p)continue;
   k.heat=Math.max(0,k.heat-dt*.25);
   if(k.heat>=1){
    k.p=true;
    if(this.puffs.length<120)this.puffs.push({x:k.x,y:k.y,vx:rand(-120,120),vy:rand(-420,-260),r:rand(9,13)});
    beep(1200,1600,.04,"triangle",.02);
   }
  }
  for(const p of this.puffs){
   p.vy+=900*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.99;
   if(p.y>floor){p.y=floor;p.vy*=-.25;p.vx*=.6}
   p.x=Math.max(8,Math.min(w-8,p.x));
  }
  // once the whole batch has popped, start a fresh one
  if(this.k.every(k=>k.p)){this.wait+=dt;if(this.wait>2.5)this.reset()}
 },
 draw(){
  const c=ctx2d,w=W(),h=H(),floor=h*.8;
  c.fillStyle="#2a1b2e";c.fillRect(0,0,w,h);
  c.fillStyle="#8a8f9c";
  c.beginPath();c.ellipse(w/2,floor+14,w*.45,18,0,0,6.283);c.fill();
  for(const k of this.k){
   if(k.p)continue;
   c.fillStyle=k.heat>.4?"#ff8a3d":"#d9a441";
   c.beginPath();c.ellipse(k.x,k.y,6,4.5,0,0,6.283);c.fill();
  }
  c.fillStyle="#fff8ec";
  c.shadowColor="rgba(255,240,200,.6)";c.shadowBlur=8;
  for(const p of this.puffs){c.beginPath();c.arc(p.x,p.y,p.r,0,6.283);c.fill()}
  c.shadowBlur=0;
  if(this.wait>0)text("Fresh batch...",w/2,h*.12,18,"#ffe6b0","center",800);
 },
 destroy(){this.a=false}
};
