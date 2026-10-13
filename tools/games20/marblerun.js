/* ============ RELAX: MARBLE RUN ============ */
const MarbleRun={
 a:false,
 R:12,
 COL:["#ff6b8b","#ffd166","#6ee7f9","#a78bfa","#86efac"],
 RAMPS:[[0,.22,.72,.30],[.28,.44,1,.52],[0,.66,.7,.74],[.3,.88,1,.96]],
 init(){this.a=true;this.reset();hudTitle("MARBLE RUN","Tap anywhere along the top to drop a marble")},
 reset(){this.m=[];this.t=0;this.k=0},
 layout(){
  const w=W(),h=H();
  return this.RAMPS.map(([a,b,c,d])=>({x1:a*w,y1:b*h,x2:c*w,y2:d*h}));
 },
 pointer(px,py){
  const q=cv2d.getBoundingClientRect(),w=W();
  const x=Math.max(w*.05,Math.min(w*.95,px-q.left));
  this.m.push({x,y:H()*.02,vx:0,vy:0,c:this.COL[this.k++%this.COL.length]});
  if(this.m.length>40)this.m.shift();
  beep(600,800,.06,"sine",.03);
 },
 update(dt){
  this.t+=dt;
  const S=this.layout(),R=this.R,sub=4,h=dt/sub,H0=H();
  for(const m of this.m){
   for(let s=0;s<sub;s++){
    m.vy+=900*h;m.x+=m.vx*h;m.y+=m.vy*h;
    for(const r of S){
     // closest point on the ramp, then push the marble out and bounce it off
     const dx=r.x2-r.x1,dy=r.y2-r.y1,L2=dx*dx+dy*dy;
     const u=Math.max(0,Math.min(1,((m.x-r.x1)*dx+(m.y-r.y1)*dy)/L2));
     const px=r.x1+dx*u,py=r.y1+dy*u;
     const ox=m.x-px,oy=m.y-py,d=Math.hypot(ox,oy);
     if(d<R&&d>0){
      const nx=ox/d,ny=oy/d;
      m.x=px+nx*R;m.y=py+ny*R;
      const vn=m.vx*nx+m.vy*ny;
      if(vn<0){m.vx-=1.3*vn*nx;m.vy-=1.3*vn*ny}
      m.vx*=.995;
     }
    }
   }
  }
  this.m=this.m.filter(m=>m.y<H0+40);
 },
 draw(){
  const c=ctx2d,w=W(),h=H();
  c.fillStyle="#241c2e";c.fillRect(0,0,w,h);
  c.strokeStyle="#f0c674";c.lineWidth=10;c.lineCap="round";
  for(const r of this.layout()){c.beginPath();c.moveTo(r.x1,r.y1);c.lineTo(r.x2,r.y2);c.stroke()}
  for(const m of this.m){
   const g=c.createRadialGradient(m.x-4,m.y-4,2,m.x,m.y,this.R);
   g.addColorStop(0,"#ffffff");g.addColorStop(.4,m.c);g.addColorStop(1,"rgba(0,0,0,.4)");
   c.fillStyle=g;c.beginPath();c.arc(m.x,m.y,this.R,0,6.283);c.fill();
  }
 },
 destroy(){this.a=false}
};
