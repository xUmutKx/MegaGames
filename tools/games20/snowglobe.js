/* ============ RELAX: SNOW GLOBE ============ */
const SnowGlobe={
 a:false,
 init(){this.a=true;this.reset();hudTitle("SNOW GLOBE","Tap to shake the snow")},
 reset(){
  const w=W(),h=H();
  this.cx=w/2;this.cy=h*.46;this.R=Math.min(w*.4,h*.3);
  this.t=0;this.shake=0;this.f=[];
  for(let i=0;i<140;i++)this.f.push(this.flake());
  // start with the snow already settled on the floor of the globe
  for(const f of this.f){f.y=this.cy+this.R*.6+Math.random()*this.R*.2;f.rest=true}
 },
 flake(){
  const a=Math.random()*6.283,d=Math.sqrt(Math.random())*this.R*.85;
  return {x:this.cx+Math.cos(a)*d,y:this.cy-this.R*rand(0,.8),vx:0,vy:0,r:rand(1.5,3.5),ph:Math.random()*6.283,rest:false};
 },
 pointer(){
  this.shake=1;
  for(const f of this.f){
   f.rest=false;
   f.vx=rand(-260,260);f.vy=rand(-380,-120);
  }
  beep(220,140,.3,"triangle",.04);
 },
 update(dt){
  this.t+=dt;
  this.shake=Math.max(0,this.shake-dt);
  const bottom=this.cy+this.R*.85;
  for(const f of this.f){
   if(f.rest)continue;
   f.vy+=260*dt;
   f.vx+=Math.sin(this.t+f.ph)*8*dt;   // flutter as it falls
   f.vx*=Math.exp(-dt*1.5);
   f.x+=f.vx*dt;f.y+=f.vy*dt;
   // stay inside the glass
   const dx=f.x-this.cx,dy=f.y-this.cy,d=Math.hypot(dx,dy),lim=this.R*.88;
   if(d>lim){f.x=this.cx+dx/d*lim;f.y=this.cy+dy/d*lim;f.vx*=-.3;f.vy*=-.3}
   if(f.y>bottom){f.y=bottom;f.vy=0;f.vx*=.2;f.rest=true}
  }
 },
 draw(){
  const c=ctx2d,w=W(),h=H(),cx=this.cx,cy=this.cy,R=this.R;
  const bg=c.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,"#1c2440");bg.addColorStop(1,"#0d1224");
  c.fillStyle=bg;c.fillRect(0,0,w,h);
  // wooden base
  c.fillStyle="#6b4a2e";
  c.fillRect(cx-R*.7,cy+R*.92,R*1.4,R*.2);
  c.save();
  c.beginPath();c.arc(cx,cy,R,0,6.283);c.clip();
  c.fillStyle="#1e3c66";c.fillRect(cx-R,cy-R,R*2,R*2);
  // a small house on the snow
  c.fillStyle="#8b3a3a";c.fillRect(cx-R*.3,cy+R*.5,R*.28,R*.3);
  c.fillStyle="#c9d6e6";c.beginPath();
  c.moveTo(cx-R*.36,cy+R*.5);c.lineTo(cx-R*.16,cy+R*.3);c.lineTo(cx+R*.04,cy+R*.5);c.closePath();c.fill();
  c.fillStyle="#fff";
  for(const f of this.f){c.beginPath();c.arc(f.x,f.y,f.r,0,6.283);c.fill()}
  c.restore();
  c.strokeStyle="rgba(200,230,255,.6)";c.lineWidth=4;
  c.beginPath();c.arc(cx,cy,R,0,6.283);c.stroke();
  c.fillStyle="rgba(255,255,255,.25)";
  c.beginPath();c.ellipse(cx-R*.45,cy-R*.4,R*.14,R*.28,-.5,0,6.283);c.fill();
 },
 destroy(){this.a=false}
};
