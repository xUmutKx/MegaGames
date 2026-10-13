/* ============ RELAX: BALLOON FLOAT ============ */
const BalloonFloat={
 a:false,
 COL:["#ff6b8b","#ffd166","#6ee7b7","#7aa2ff","#c084fc","#ff9f5a"],
 init(){this.a=true;this.reset();hudTitle("BALLOON FLOAT","Tap to release a balloon, tap one to lift it")},
 reset(){
  this.b=[];this.t=0;this.spawnT=0;
  for(let i=0;i<6;i++)this.add(rand(20,W()-20),rand(H()*.2,H()));
 },
 add(x,y){
  const v=rand(40,70);
  this.b.push({x,y,r:rand(22,30),v,base:v,ph:Math.random()*6.283,c:this.COL[Math.floor(Math.random()*this.COL.length)]});
  if(this.b.length>30)this.b.shift();
 },
 pointer(px,py){
  const q=cv2d.getBoundingClientRect(),x=px-q.left,y=py-q.top;
  const hit=this.b.find(b=>Math.hypot(b.x-x,b.y-y)<b.r*1.2);
  if(hit){hit.v+=60;beep(700,900,.05,"sine",.03)}
  else{this.add(x,H()+30);beep(500,650,.06,"sine",.03)}
 },
 update(dt){
  this.t+=dt;
  for(const b of this.b){
   b.v+=(b.base-b.v)*Math.min(1,dt*1.5);
   b.y-=b.v*dt;
   b.x+=Math.sin(this.t*1.3+b.ph)*18*dt;
  }
  this.b=this.b.filter(b=>b.y>-60);
  this.spawnT-=dt;
  if(this.spawnT<=0){this.spawnT=rand(1.2,2.2);this.add(rand(20,W()-20),H()+40)}
 },
 draw(){
  const c=ctx2d,w=W(),h=H();
  const bg=c.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,"#9bd8ff");bg.addColorStop(1,"#e8f7ff");
  c.fillStyle=bg;c.fillRect(0,0,w,h);
  for(const b of this.b){
   c.strokeStyle="rgba(60,70,90,.45)";c.lineWidth=1.2;
   c.beginPath();
   c.moveTo(b.x,b.y+b.r*1.2);
   c.quadraticCurveTo(b.x+6*Math.sin(this.t*2+b.ph),b.y+b.r*2.6,b.x,b.y+b.r*3.2);
   c.stroke();
   c.fillStyle=b.c;
   c.beginPath();c.ellipse(b.x,b.y,b.r*.9,b.r,0,0,6.283);c.fill();
   c.fillStyle="rgba(255,255,255,.4)";
   c.beginPath();c.ellipse(b.x-b.r*.3,b.y-b.r*.4,b.r*.22,b.r*.35,0,0,6.283);c.fill();
  }
 },
 destroy(){this.a=false}
};
