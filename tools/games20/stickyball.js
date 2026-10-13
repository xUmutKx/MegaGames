/* ============ RELAX: STICKY DROP ============ */
const StickyDrop={
 a:false,
 BW:24,
 R:12,
 COL:["#ff7eb6","#7ee0ff","#ffe27a","#9dff8f","#c39bff"],
 init(){this.a=true;this.reset();hudTitle("STICKY DROP","Tap to drop a sticky ball onto the pile")},
 reset(){
  this.cols=Math.floor(W()/this.BW)+1;
  this.colH=new Array(this.cols).fill(0);
  this.stuck=[];this.fall=[];this.full=0;
 },
 pointer(px){
  const q=cv2d.getBoundingClientRect(),x=px-q.left;
  if(this.full>0||this.fall.length>=8)return;
  this.fall.push({x:Math.min(W()-6,Math.max(6,x)),y:-this.R,vy:0,c:this.COL[Math.floor(Math.random()*this.COL.length)]});
 },
 update(dt){
  const R=this.R,floor=H()-30,last=this.cols-1;
  for(const b of this.fall){
   b.vy+=900*dt;b.y+=b.vy*dt;
   const i=Math.min(last,Math.max(0,Math.floor(b.x/this.BW)));
   const lo=Math.max(0,i-1),hi=Math.min(last,i+1);
   let base=0;
   for(let k=lo;k<=hi;k++)base=Math.max(base,this.colH[k]);
   const rest=floor-base-R;
   if(b.y>=rest){
    // the ball sticks where it lands and lifts the columns under it
    b.y=rest;b.done=true;
    this.stuck.push({x:b.x,y:rest,c:b.c});
    for(let k=lo;k<=hi;k++)this.colH[k]=Math.max(this.colH[k],base+(k===i?R*1.7:R*.9));
    beep(300,200,.06,"sine",.04);
  }}
  this.fall=this.fall.filter(b=>!b.done);
  // pile reached the top: let it fall away and start again
  if(Math.max(...this.colH)>H()-200)this.full+=dt;
  if(this.full>1.6)this.reset();
 },
 draw(){
  const c=ctx2d,w=W(),h=H(),R=this.R;
  c.fillStyle="#1d1b33";c.fillRect(0,0,w,h);
  c.fillStyle="#2f2b52";c.fillRect(0,H()-30,w,30);
  for(const b of this.stuck.concat(this.fall))this.ball(c,b.x,b.y,R,b.c);
  if(this.full>0)text("PILE FULL",w/2,h*.3,22,"#ffe27a","center",900);
 },
 ball(c,x,y,R,col){
  const g=c.createRadialGradient(x-R*.35,y-R*.35,R*.1,x,y,R);
  g.addColorStop(0,"#ffffff");g.addColorStop(.35,col);g.addColorStop(1,"rgba(0,0,0,.35)");
  c.fillStyle=g;c.beginPath();c.arc(x,y,R,0,6.283);c.fill();
 },
 destroy(){this.a=false}
};
