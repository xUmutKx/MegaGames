/* ============ RELAX: ZEN RIPPLE ============ */
const ZenRipple={
 a:false,
 MAX:300,
 init(){this.a=true;this.reset();hudTitle("ZEN RIPPLE","Tap the water to make ripples")},
 reset(){this.rings=[];this.t=0;this.auto=rand(.5,1.5)},
 spawn(x,y,k){
  this.rings.push({x,y,r:0,k});
  if(this.rings.length>40)this.rings.shift();
 },
 pointer(px,py){
  const q=cv2d.getBoundingClientRect(),x=px-q.left,y=py-q.top;
  this.spawn(x,y,1);
  beep(520+rand(0,200),900,.25,"sine",.03);
 },
 update(dt){
  this.t+=dt;
  // a quiet ripple now and then, as if a drop fell by itself
  this.auto-=dt;
  if(this.auto<=0){this.auto=rand(1.5,3);this.spawn(rand(0,W()),rand(0,H()),.6)}
  for(const g of this.rings)g.r+=dt*95;
  this.rings=this.rings.filter(g=>g.r<this.MAX);
 },
 draw(){
  const c=ctx2d,w=W(),h=H();
  const bg=c.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,"#0d3b4f");bg.addColorStop(1,"#06202c");
  c.fillStyle=bg;c.fillRect(0,0,w,h);
  c.strokeStyle="#bff4ff";c.lineWidth=2;
  for(const g of this.rings){
   const a=g.k*(1-g.r/this.MAX);
   if(a<=0)continue;
   c.globalAlpha=a;
   c.beginPath();c.arc(g.x,g.y,g.r,0,6.283);c.stroke();
   c.globalAlpha=a*.5;
   c.beginPath();c.arc(g.x,g.y,g.r*.7,0,6.283);c.stroke();
  }
  c.globalAlpha=1;
 },
 destroy(){this.a=false}
};
