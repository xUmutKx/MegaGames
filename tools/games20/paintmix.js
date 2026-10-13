/* ============ RELAX: PAINT MIXING ============ */
const PaintMix={
 a:false,
 PAINT:[[255,70,110],[255,190,40],[60,200,255],[120,90,255],[80,220,120]],
 init(){this.a=true;this.reset();hudTitle("PAINT MIXING","Tap to drop paint, drops blend where they meet")},
 reset(){this.d=[];this.k=0;this.t=0},
 pointer(px,py){
  const q=cv2d.getBoundingClientRect(),x=px-q.left,y=py-q.top;
  const base=this.PAINT[this.k++%this.PAINT.length];
  // a drop landing in wet paint takes on the colours it touches
  const near=this.d.filter(d=>d.r>10&&Math.hypot(d.x-x,d.y-y)<d.r+20);
  const cs=near.map(d=>d.c).concat([base]);
  const col=[0,1,2].map(i=>cs.reduce((s,c)=>s+c[i],0)/cs.length);
  this.d.push({x,y,r:0,max:rand(60,95),a:0,c:col});
  if(this.d.length>24)this.d.shift();
  beep(440+rand(0,200),520,.1,"sine",.03);
 },
 update(dt){
  this.t+=dt;
  for(const d of this.d){
   d.r+=(d.max-d.r)*Math.min(1,dt*2.2);
   d.a=Math.min(.85,d.a+dt*1.5);
  }
 },
 draw(){
  const c=ctx2d,w=W(),h=H();
  c.fillStyle="#f7f4ef";c.fillRect(0,0,w,h);
  c.globalCompositeOperation="multiply";
  for(const d of this.d){
   const [r,g,b]=d.c.map(Math.round);
   const gr=c.createRadialGradient(d.x,d.y,d.r*.2,d.x,d.y,d.r);
   gr.addColorStop(0,`rgba(${r},${g},${b},${d.a})`);
   gr.addColorStop(1,`rgba(${r},${g},${b},0)`);
   c.fillStyle=gr;c.beginPath();c.arc(d.x,d.y,d.r,0,6.283);c.fill();
  }
  c.globalCompositeOperation="source-over";
 },
 destroy(){this.a=false}
};
