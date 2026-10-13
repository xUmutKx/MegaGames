/* ============ RELAX: KINETIC SAND ============ */
const KineticSand={
 a:false,
 G:520,
 init(){this.a=true;this.reset();hudTitle("KINETIC SAND","Tap to pull the sand up and shape it")},
 reset(){
  const w=W(),h=H();
  this.g=[];
  for(let i=0;i<300;i++)this.g.push({x:rand(w*.2,w*.8),y:rand(h*.3,h-40),vx:0,vy:0,c:Math.random()<.5?"#e8c27a":"#d9a95c"});
  this.pull=null;this.t=0;
 },
 pointer(px,py){
  const q=cv2d.getBoundingClientRect();
  this.pull={x:px-q.left,y:py-q.top,t:.8};
 },
 update(dt){
  this.t+=dt;
  const g=this.g,w=W(),floor=H()-24,P=this.pull;
  if(P){P.t-=dt;if(P.t<=0)this.pull=null}
  for(const p of g){
   p.vy+=this.G*dt;
   if(this.pull){
    // grains near the touch are lifted toward it
    const dx=this.pull.x-p.x,dy=this.pull.y-p.y,d=Math.hypot(dx,dy)+.01;
    if(d<260){const f=900*(1-d/260)*dt;p.vx+=dx/d*f;p.vy+=dy/d*f}
   }
   p.vx*=1-Math.min(1,dt*2);
   p.x+=p.vx*dt;p.y+=p.vy*dt;
   if(p.x<4){p.x=4;p.vx*=-.3}
   if(p.x>w-4){p.x=w-4;p.vx*=-.3}
   if(p.y>floor){p.y=floor;p.vy*=-.2;p.vx*=.8}
   if(p.y<4){p.y=4;p.vy=0}
  }
  // grains push each other apart so they pile up instead of overlapping
  const R=5;
  for(let i=0;i<g.length;i++)for(let j=i+1;j<g.length;j++){
   const a=g[i],b=g[j],dx=b.x-a.x,dy=b.y-a.y;
   if(Math.abs(dx)>R||Math.abs(dy)>R)continue;
   const d=Math.hypot(dx,dy)||.01;
   if(d<R){const o=(R-d)*.5,ux=dx/d*o,uy=dy/d*o;a.x-=ux;a.y-=uy;b.x+=ux;b.y+=uy}
  }
 },
 draw(){
  const c=ctx2d,w=W(),h=H();
  const bg=c.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,"#fbf1dc");bg.addColorStop(1,"#f0dfbc");
  c.fillStyle=bg;c.fillRect(0,0,w,h);
  for(const p of this.g){c.fillStyle=p.c;c.fillRect(p.x-1.5,p.y-1.5,3,3)}
  if(this.pull){
   c.strokeStyle="rgba(120,90,50,.35)";c.lineWidth=2;
   c.beginPath();c.arc(this.pull.x,this.pull.y,40*this.pull.t+20,0,6.283);c.stroke();
  }
 },
 destroy(){this.a=false}
};
