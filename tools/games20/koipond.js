/* ============ RELAX: KOI POND ============ */
const KoiPond={
 a:false,
 init(){this.a=true;this.reset();hudTitle("KOI POND","Tap the water to drop food for the fish")},
 reset(){
  const w=W(),h=H();
  this.food=[];this.ripples=[];this.t=0;this.eaten=0;
  this.pads=[];for(let i=0;i<6;i++)this.pads.push({x:rand(w*.1,w*.9),y:rand(h*.15,h*.9),r:rand(18,28)});
  this.fish=["#ff8a4c","#fff1e0","#ffb347","#ff5e62","#f5f5f5"].map(c=>({
   x:rand(w*.2,w*.8),y:rand(h*.25,h*.8),a:rand(0,6.283),sp:rand(40,70),ph:Math.random()*6.283,c
  }));
 },
 pointer(px,py){
  const q=cv2d.getBoundingClientRect(),x=px-q.left,y=py-q.top;
  this.food.push({x,y,t:0});
  this.ripples.push({x,y,r:0});
  if(this.food.length>12)this.food.shift();
  beep(700,500,.06,"sine",.03);
 },
 update(dt){
  this.t+=dt;
  const w=W(),h=H();
  for(const r of this.ripples)r.r+=dt*60;
  this.ripples=this.ripples.filter(r=>r.r<70);
  for(const d of this.food){d.t+=dt;d.y+=Math.sin(this.t*2+d.x)*2*dt}
  for(const f of this.fish){
   // swim toward the nearest food, otherwise wander lazily
   let best=null,bd=1e9;
   for(const d of this.food){const dd=Math.hypot(d.x-f.x,d.y-f.y);if(dd<bd){bd=dd;best=d}}
   if(best){
    let diff=Math.atan2(best.y-f.y,best.x-f.x)-f.a;
    diff=Math.atan2(Math.sin(diff),Math.cos(diff));
    const max=2.4*dt;
    f.a+=Math.max(-max,Math.min(max,diff));
   }else f.a+=Math.sin(this.t*.6+f.ph)*.25*dt;
   const sp=best?f.sp*1.2:f.sp;
   f.x+=Math.cos(f.a)*sp*dt;f.y+=Math.sin(f.a)*sp*dt;
   // stay inside the pond
   if(f.x<20||f.x>w-20){f.a=Math.PI-f.a;f.x=Math.max(20,Math.min(w-20,f.x))}
   if(f.y<h*.12||f.y>h*.92){f.a=-f.a;f.y=Math.max(h*.12,Math.min(h*.92,f.y))}
   for(const d of this.food)if(!d.gone&&Math.hypot(d.x-f.x,d.y-f.y)<18){d.gone=true;this.eaten++}
  }
  this.food=this.food.filter(d=>!d.gone&&d.t<12);
 },
 draw(){
  const c=ctx2d,w=W(),h=H();
  const bg=c.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,"#2f7a86");bg.addColorStop(1,"#1d5560");
  c.fillStyle=bg;c.fillRect(0,0,w,h);
  c.fillStyle="#4f9a5a";
  for(const p of this.pads){c.beginPath();c.arc(p.x,p.y,p.r,.3,6.0);c.lineTo(p.x,p.y);c.fill()}
  c.strokeStyle="rgba(255,255,255,.5)";c.lineWidth=2;
  for(const r of this.ripples){c.globalAlpha=1-r.r/70;c.beginPath();c.arc(r.x,r.y,r.r,0,6.283);c.stroke()}
  c.globalAlpha=1;
  c.fillStyle="#ffd27a";
  for(const d of this.food){c.beginPath();c.arc(d.x,d.y,4,0,6.283);c.fill()}
  for(const f of this.fish){
   c.save();c.translate(f.x,f.y);c.rotate(f.a);
   c.fillStyle=f.c;
   c.beginPath();c.ellipse(0,0,16,7,0,0,6.283);c.fill();
   c.beginPath();c.moveTo(-12,0);c.lineTo(-24,-8);c.lineTo(-24,8);c.closePath();c.fill();
   c.fillStyle="rgba(0,0,0,.25)";
   c.beginPath();c.arc(7,-2,1.6,0,6.283);c.fill();
   c.restore();
  }
 },
 destroy(){this.a=false}
};
