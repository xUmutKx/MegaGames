/* ============ RELAX: INK IN WATER ============ */
const InkWater={
 a:false,
 COL:["#ff4f8b","#ffb400","#3ddbd9","#7b61ff","#34e26b","#ff7a45"],
 MAX:900,
 init(){this.a=true;this.reset();hudTitle("INK IN WATER","Tap to drop ink and watch it swirl")},
 reset(){this.p=[];this.t=0;this.k=0},
 pointer(px,py){
  const q=cv2d.getBoundingClientRect(),x=px-q.left,y=py-q.top;
  const col=this.COL[this.k++%this.COL.length];
  for(let i=0;i<60;i++){
   const a=Math.random()*6.283,s=rand(4,40);
   this.p.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:rand(4,8),c:col});
  }
  if(this.p.length>this.MAX)this.p.splice(0,this.p.length-this.MAX);
  beep(360,240,.25,"sine",.03);
 },
 update(dt){
  this.t+=dt;
  const t=this.t;
  for(const p of this.p){
   // a slow swirl field: the ink folds and stretches as it drifts
   const fx=Math.sin(p.y*.012+t*.7)*18,fy=Math.cos(p.x*.012-t*.6)*18;
   p.vx+=(fx-p.vx)*dt*1.5;
   p.vy+=(fy-p.vy)*dt*1.5;
   p.x+=p.vx*dt;p.y+=p.vy*dt;
   p.r=Math.min(18,p.r+dt*1.2);
  }
 },
 draw(){
  const c=ctx2d,w=W(),h=H();
  const bg=c.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,"#eaf6ff");bg.addColorStop(1,"#bfe0f2");
  c.fillStyle=bg;c.fillRect(0,0,w,h);
  c.globalAlpha=.16;
  for(const p of this.p){
   c.fillStyle=p.c;c.beginPath();c.arc(p.x,p.y,p.r,0,6.283);c.fill();
  }
  c.globalAlpha=1;
 },
 destroy(){this.a=false}
};
