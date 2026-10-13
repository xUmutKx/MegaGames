/* ============ RELAX: FIDGET SPINNER ============ */
const FidgetSpin={
 a:false,
 init(){this.a=true;this.reset();hudTitle("FIDGET SPINNER","Tap left to spin back, right to spin on")},
 reset(){this.ang=0;this.w=0;this.turns=0},
 pointer(px){
  const q=cv2d.getBoundingClientRect(),x=px-q.left;
  // a tap on the left turns it counter-clockwise, on the right clockwise
  const dir=x<W()/2?-1:1;
  this.w=Math.max(-40,Math.min(40,this.w+dir*rand(7,10)));
  beep(400,600,.04,"triangle",.03);
 },
 update(dt){
  this.ang+=this.w*dt;
  this.w*=Math.exp(-dt*.7);
  if(Math.abs(this.w)<.02)this.w=0;
  this.turns=Math.floor(Math.abs(this.ang)/6.283);
 },
 draw(){
  const c=ctx2d,w=W(),h=H(),cx=w/2,cy=h/2,R=Math.min(w,h)*.3;
  c.fillStyle="#1b2233";c.fillRect(0,0,w,h);
  c.save();c.translate(cx,cy);c.rotate(this.ang);
  // three lobes, each with a hole, drawn by rotating the frame
  for(let i=0;i<3;i++){
   if(i)c.rotate(2.094);
   const g=c.createLinearGradient(-R*.2,-R*.2,R*.2,R*.2);
   g.addColorStop(0,"#b9ecff");g.addColorStop(1,"#4aa8e0");
   c.fillStyle=g;
   c.beginPath();c.arc(R*.62,0,R*.42,0,6.283);c.fill();
   c.fillStyle="#1b2233";
   c.beginPath();c.arc(R*.62,0,R*.14,0,6.283);c.fill();
  }
  c.restore();
  // centre bearing
  const g=c.createRadialGradient(cx-4,cy-4,2,cx,cy,R*.2);
  g.addColorStop(0,"#fff3b0");g.addColorStop(1,"#d89b2b");
  c.fillStyle=g;c.beginPath();c.arc(cx,cy,R*.2,0,6.283);c.fill();
  text(this.turns+" TURNS",cx,h-60,18,"#cfe9ff","center",800);
 },
 destroy(){this.a=false}
};
