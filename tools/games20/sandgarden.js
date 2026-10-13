/* ============ RELAX: SAND GARDEN ============ */
const SandGarden={
 a:false,
 init(){this.a=true;this.reset();hudTitle("SAND GARDEN","Tap to place a stone in the sand")},
 reset(){this.stones=[];this.t=0},
 pointer(px,py){
  const q=cv2d.getBoundingClientRect(),x=px-q.left,y=py-q.top;
  if(this.stones.length>=14)this.stones.shift();
  this.stones.push({x,y,r:rand(22,34),s:0});
  beep(180,240,.12,"sine",.04);
 },
 update(dt){
  this.t+=dt;
  for(const s of this.stones)s.s=Math.min(1,s.s+dt*3);
 },
 draw(){
  const c=ctx2d,w=W(),h=H();
  c.fillStyle="#efe3c4";c.fillRect(0,0,w,h);
  c.strokeStyle="rgba(120,95,60,.45)";c.lineWidth=1.6;
  // every rake line bends around the stones, like sand pushed aside
  for(let y0=20;y0<h;y0+=18){
   c.beginPath();
   for(let x=0;x<=w;x+=8){
    let px=x,py=y0;
    for(const s of this.stones){
     const dx=px-s.x,dy=py-s.y,d=Math.hypot(dx,dy),R=s.r*2.2;
     if(d<R&&d>0){const k=(R-d)*.9*s.s/d;px+=dx*k;py+=dy*k}
    }
    if(x===0)c.moveTo(px,py);else c.lineTo(px,py);
   }
   c.stroke();
  }
  for(const s of this.stones){
   const g=c.createRadialGradient(s.x-s.r*.3,s.y-s.r*.3,s.r*.1,s.x,s.y,s.r);
   g.addColorStop(0,"#d9dce2");g.addColorStop(1,"#6f727a");
   c.fillStyle=g;c.globalAlpha=s.s;
   c.beginPath();c.arc(s.x,s.y,s.r*(.6+.4*s.s),0,6.283);c.fill();
  }
  c.globalAlpha=1;
 },
 destroy(){this.a=false}
};
