/* ============ RELAX: BALL PIT ============ */
const BallPit={
 a:false,
 COL:["#ff6b9a","#ffd166","#6ee7f9","#a78bfa","#86efac","#fb923c"],
 init(){this.a=true;this.reset();hudTitle("BALL PIT","Tap to drop a ball and stir the pit")},
 reset(){
  this.b=[];this.t=0;
  for(let i=0;i<28;i++)this.add(rand(20,W()-20),rand(-400,-40));
 },
 add(x,y){
  this.b.push({x,y,vx:rand(-30,30),vy:0,r:rand(14,22),c:this.COL[this.b.length%this.COL.length]});
 },
 pointer(px,py){
  const q=cv2d.getBoundingClientRect(),x=px-q.left,y=py-q.top;
  // the tap stirs nearby balls and drops one more in
  for(const p of this.b){
   const dx=p.x-x,dy=p.y-y,d=Math.hypot(dx,dy)+.01;
   if(d<110){const f=260*(1-d/110);p.vx+=dx/d*f;p.vy+=dy/d*f}
  }
  if(this.b.length<70)this.add(Math.max(20,Math.min(W()-20,x)),y);
  beep(300+rand(0,200),420,.08,"sine",.03);
 },
 update(dt){
  this.t+=dt;
  const b=this.b,n=b.length,w=W(),g=H()-16;
  for(const p of b){
   p.vy+=900*dt;
   p.vx*=1-Math.min(1,dt*.8);
   p.x+=p.vx*dt;p.y+=p.vy*dt;
   if(p.x<p.r){p.x=p.r;p.vx=Math.abs(p.vx)*.5}
   if(p.x>w-p.r){p.x=w-p.r;p.vx=-Math.abs(p.vx)*.5}
   if(p.y>g-p.r){p.y=g-p.r;p.vy=-Math.abs(p.vy)*.35;p.vx*=.9}
  }
  // ball against ball, two passes so the pile settles
  for(let pass=0;pass<2;pass++)
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
   const a=b[i],c=b[j],dx=c.x-a.x,dy=c.y-a.y,d=Math.hypot(dx,dy),m=a.r+c.r;
   if(d>=m||d===0)continue;
   const o=(m-d)/2,ux=dx/d,uy=dy/d;
   a.x-=ux*o;a.y-=uy*o;c.x+=ux*o;c.y+=uy*o;
   const rv=(c.vx-a.vx)*ux+(c.vy-a.vy)*uy;
   if(rv<0){const J=.75*rv;a.vx+=J*ux;a.vy+=J*uy;c.vx-=J*ux;c.vy-=J*uy}
  }
 },
 draw(){
  const c=ctx2d,w=W(),h=H();
  const bg=c.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,"#2a1d4a");bg.addColorStop(1,"#120c26");
  c.fillStyle=bg;c.fillRect(0,0,w,h);
  for(const p of this.b){
   const g=c.createRadialGradient(p.x-p.r*.35,p.y-p.r*.35,p.r*.1,p.x,p.y,p.r);
   g.addColorStop(0,"#ffffff");g.addColorStop(.35,p.c);g.addColorStop(1,"rgba(0,0,0,.35)");
   c.fillStyle=g;c.beginPath();c.arc(p.x,p.y,p.r,0,6.283);c.fill();
  }
 },
 destroy(){this.a=false}
};
