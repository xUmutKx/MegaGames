/* ============ RELAX: POTTERY WHEEL ============ */
const PotteryWheel={
 a:false,
 ROWS:30,
 init(){this.a=true;this.reset();hudTitle("POTTERY WHEEL","Tap next to the clay wall to shape it")},
 reset(){this.R=new Array(this.ROWS).fill(40);this.spin=0;this.boost=0;this.t=0},
 geom(){
  const w=W(),h=H();
  return {cx:w/2,top:h*.18,bot:h*.86,step:(h*.68)/this.ROWS};
 },
 pointer(px,py){
  const q=cv2d.getBoundingClientRect(),x=px-q.left,y=py-q.top;
  const g=this.geom(),i=Math.round((g.bot-y)/g.step),dist=Math.abs(x-g.cx);
  this.boost=Math.min(6,this.boost+1.5);
  if(i<0||i>=this.ROWS)return;
  if(Math.abs(dist-this.R[i])>30)return;
  // the wall moves toward the finger, a little less on the rows beside it
  for(let k=Math.max(0,i-2);k<=Math.min(this.ROWS-1,i+2);k++){
   const f=k===i?.35:.12;
   this.R[k]=Math.min(110,Math.max(8,this.R[k]+(dist-this.R[k])*f));
  }
  beep(300,220,.08,"triangle",.05);
 },
 update(dt){
  this.t+=dt;
  this.spin+=(2+this.boost)*dt;
  this.boost*=Math.exp(-dt*1.5);
 },
 draw(){
  const c=ctx2d,w=W(),h=H(),g=this.geom();
  c.fillStyle="#2b1d14";c.fillRect(0,0,w,h);
  // wheel head under the clay
  c.fillStyle="#5a3b25";
  c.beginPath();c.ellipse(g.cx,g.bot+6,Math.min(w*.42,160),18,0,0,6.283);c.fill();
  // clay profile: up the right side, down the left side
  c.beginPath();
  for(let i=0;i<this.ROWS;i++){
   const y=g.bot-i*g.step,x=g.cx+this.R[i];
   if(i===0)c.moveTo(x,y);else c.lineTo(x,y);
  }
  for(let i=this.ROWS-1;i>=0;i--)c.lineTo(g.cx-this.R[i],g.bot-i*g.step);
  c.closePath();
  c.fillStyle="#c77b4a";c.fill();
  // turning marks that show the wheel is moving
  c.fillStyle="rgba(255,220,180,.28)";
  for(let i=0;i<this.ROWS;i++){
   const y=g.bot-i*g.step,sx=g.cx+Math.cos(this.spin+i*.7)*this.R[i]*.8;
   c.fillRect(sx-6,y-1,12,2);
  }
 },
 destroy(){this.a=false}
};
