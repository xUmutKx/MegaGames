/* ============ RELAX: WIND CHIMES ============ */
const WindChimes={
 a:false,
 F:[523,587,659,784,880,988,1047],
 init(){this.a=true;this.reset();hudTitle("WIND CHIMES","Tap a side to blow a gust across the chimes")},
 reset(){
  const w=W(),h=H(),n=this.F.length;
  this.t=0;this.gust=0;this.barY=h*.2;
  this.ch=this.F.map((f,i)=>({
   x:w*.16+i*(w*.68/(n-1)),
   L:h*.2-i*h*.012,   // lower notes hang on longer tubes
   th:0,w:0,cd:0,f
  }));
 },
 pointer(px){
  const q=cv2d.getBoundingClientRect(),x=px-q.left;
  const dir=x<W()/2?-1:1;
  this.gust=Math.max(-5,Math.min(5,this.gust+dir*3.5));
 },
 update(dt){
  this.t+=dt;
  this.gust*=Math.exp(-dt*1.2);
  // a gentle breeze all the time, plus whatever the player blew
  const wind=1.4*Math.sin(this.t*.45)+.5*Math.sin(this.t*1.3)+this.gust;
  for(const c of this.ch){
   const prev=c.th;
   c.w+=(-6*c.th-.9*c.w+wind*1.2)*dt;
   c.th+=c.w*dt;
   if(c.th>1){c.th=1;c.w=0}
   if(c.th<-1){c.th=-1;c.w=0}
   c.cd=Math.max(0,c.cd-dt);
   // ring when the tube swings through its middle
   if(prev*c.th<0&&Math.abs(c.w)>.5&&c.cd<=0){
    c.cd=.6;
    beep(c.f,c.f*.99,1.1,"sine",.035);
   }
  }
 },
 draw(){
  const c=ctx2d,w=W(),h=H();
  const sky=c.createLinearGradient(0,0,0,h);
  sky.addColorStop(0,"#c9e7ff");sky.addColorStop(1,"#f1f8ff");
  c.fillStyle=sky;c.fillRect(0,0,w,h);
  c.fillStyle="#7a5a3a";
  c.fillRect(w*.12,this.barY-4,w*.76,8);
  for(const t of this.ch){
   c.save();c.translate(t.x,this.barY);c.rotate(t.th);
   c.strokeStyle="#777";c.lineWidth=1.5;
   c.beginPath();c.moveTo(0,0);c.lineTo(0,t.L*.25);c.stroke();
   const g=c.createLinearGradient(-6,0,6,0);
   g.addColorStop(0,"#e8dcc0");g.addColorStop(.5,"#fff8e6");g.addColorStop(1,"#c8b48a");
   c.fillStyle=g;
   c.fillRect(-6,t.L*.25,12,t.L*.75);
   c.restore();
  }
 },
 destroy(){this.a=false}
};
