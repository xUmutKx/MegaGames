/* ============ RELAX: BUBBLE WRAP ============ */
const BubbleWrap={
 a:false,
 S:46,
 init(){this.a=true;this.reset();hudTitle("BUBBLE WRAP","Tap a bubble to pop it")},
 reset(){this.pops=0;this.wait=0;this.fill()},
 fill(){
  const w=W(),h=H(),S=this.S;
  this.cols=Math.max(3,Math.floor((w-16)/S));
  this.rows=Math.max(3,Math.floor((h-120)/S));
  this.ox=(w-this.cols*S)/2+S/2;this.oy=(h-this.rows*S)/2+S/2;
  this.b=[];
  for(let r=0;r<this.rows;r++)for(let c=0;c<this.cols;c++)this.b.push({x:this.ox+c*S,y:this.oy+r*S,up:true,k:0});
 },
 pointer(px,py){
  const q=cv2d.getBoundingClientRect(),x=px-q.left,y=py-q.top;
  let best=null,bd=this.S*.5;
  for(const b of this.b){
   if(!b.up)continue;
   const d=Math.hypot(b.x-x,b.y-y);
   if(d<bd){bd=d;best=b}
  }
  if(!best)return;
  best.up=false;this.pops++;
  beep(700+rand(0,300),400,.05,"triangle",.05);
 },
 update(dt){
  for(const b of this.b)if(!b.up)b.k=Math.min(1,b.k+dt*6);
  // refill the sheet a moment after it is fully popped
  if(this.b.every(b=>!b.up)){this.wait+=dt;if(this.wait>1.2){this.wait=0;this.fill()}}
  else this.wait=0;
 },
 draw(){
  const c=ctx2d,w=W(),h=H(),R=this.S*.42;
  c.fillStyle="#e9f4ff";c.fillRect(0,0,w,h);
  for(const b of this.b){
   if(b.up){
    const g=c.createRadialGradient(b.x-6,b.y-6,2,b.x,b.y,R);
    g.addColorStop(0,"#ffffff");g.addColorStop(1,"#9fd3ff");
    c.fillStyle=g;c.beginPath();c.arc(b.x,b.y,R,0,6.283);c.fill();
   }else{
    c.fillStyle="rgba(120,170,220,"+(0.28-b.k*.1)+")";
    c.beginPath();c.arc(b.x,b.y,R*(1+b.k*.15),0,6.283);c.fill();
   }
  }
  text("POPPED "+this.pops,w/2,h-40,16,"#345","center",800);
  if(this.wait>0)text("More wrap coming...",w/2,h-18,12,"#567","center",700);
 },
 destroy(){this.a=false}
};
