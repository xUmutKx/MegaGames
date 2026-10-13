/* ============ RELAX: RAIN WINDOW ============ */
const RainWindow={
 a:false,
 init(){this.a=true;this.reset();hudTitle("RAIN WINDOW","Tap the fogged glass to wipe it clear")},
 reset(){
  this.t=0;this.wipes=[];this.d=[];
  for(let i=0;i<90;i++)this.d.push(this.drop(true));
 },
 drop(any){
  return {x:rand(0,W()),y:any?rand(0,H()):rand(-40,-5),v:rand(120,260),len:rand(8,22)};
 },
 pointer(px,py){
  const q=cv2d.getBoundingClientRect(),x=px-q.left,y=py-q.top;
  this.wipes.push({x,y,r:0,l:1});
  if(this.wipes.length>10)this.wipes.shift();
 },
 update(dt){
  this.t+=dt;
  const h=H(),w=W();
  for(let i=0;i<this.d.length;i++){
   const d=this.d[i];
   d.y+=d.v*dt;d.x+=dt*30;
   if(d.y>h)this.d[i]=this.drop(false);
   else if(d.x>w)d.x-=w;
  }
  // a wipe grows, then the fog slowly comes back over it
  for(const p of this.wipes){p.r=Math.min(64,p.r+dt*300);p.l-=dt/6}
  this.wipes=this.wipes.filter(p=>p.l>0);
 },
 draw(){
  const c=ctx2d,w=W(),h=H();
  const glass=()=>{
   const g=c.createLinearGradient(0,0,0,h);
   g.addColorStop(0,"#5d7689");g.addColorStop(1,"#2f4150");
   c.fillStyle=g;c.fillRect(0,0,w,h);
  };
  const streaks=()=>{
   c.strokeStyle="rgba(210,235,255,.55)";c.lineWidth=2;
   c.beginPath();
   for(const d of this.d){c.moveTo(d.x,d.y);c.lineTo(d.x,d.y-d.len)}
   c.stroke();
  };
  glass();
  streaks();
  c.fillStyle="rgba(200,210,220,.55)";
  c.fillRect(0,0,w,h);
  // wiped spots show the clear glass and the rain behind it again
  for(const p of this.wipes){
   c.save();
   c.beginPath();c.arc(p.x,p.y,p.r,0,6.283);c.clip();
   glass();streaks();
   c.restore();
  }
 },
 destroy(){this.a=false}
};
