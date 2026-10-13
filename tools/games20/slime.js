/* ============ RELAX: SLIME STRETCH ============ */
const SlimeStretch={
 a:false,
 N:20,
 init(){this.a=true;this.reset();hudTitle("SLIME STRETCH","Tap to poke the slime and watch it wobble")},
 reset(){
  const w=W(),h=H();
  this.cx=w/2;this.cy=h/2;this.R=Math.min(w,h)*.18;this.t=0;
  this.n=[];
  for(let i=0;i<this.N;i++)this.n.push({d:0,v:0,a:i/this.N*6.283});
 },
 pointer(px,py){
  const q=cv2d.getBoundingClientRect(),x=px-q.left,y=py-q.top;
  const ta=Math.atan2(y-this.cy,x-this.cx);
  // nodes facing the tap get pushed out, the rest follow through the springs
  for(const n of this.n){
   let df=n.a-ta;df=Math.atan2(Math.sin(df),Math.cos(df));
   const b=Math.max(0,Math.cos(df));
   n.v+=b*b*b*b*300;
  }
  beep(260,190,.15,"sine",.05);
 },
 update(dt){
  this.t+=dt;
  const R=this.R;
  for(const n of this.n){
   n.v+=(-60*n.d-4*n.v)*dt;
   n.d+=n.v*dt;
   n.d=Math.max(-R*.5,Math.min(R*1.2,n.d));
  }
  // neighbours pull on each other so the blob reads as one body
  const N=this.N,old=this.n.map(n=>n.d);
  for(let i=0;i<N;i++){
   const p=old[(i+N-1)%N],q=old[(i+1)%N];
   this.n[i].d+=((p+q)/2-old[i])*Math.min(1,dt*8);
  }
 },
 draw(){
  const c=ctx2d,w=W(),h=H(),R=this.R;
  c.fillStyle="#2a1442";c.fillRect(0,0,w,h);
  const P=this.n.map(n=>{
   const r=R+n.d+Math.sin(this.t*2+n.a*3)*2;
   return [this.cx+Math.cos(n.a)*r,this.cy+Math.sin(n.a)*r];
  });
  const N=P.length;
  c.beginPath();
  for(let i=0;i<=N;i++){
   const p=P[i%N],q=P[(i+1)%N];
   const mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2;
   if(i===0)c.moveTo(mx,my);else c.quadraticCurveTo(p[0],p[1],mx,my);
  }
  c.closePath();
  const g=c.createRadialGradient(this.cx-R*.3,this.cy-R*.3,4,this.cx,this.cy,R*1.6);
  g.addColorStop(0,"#b8ff9e");g.addColorStop(1,"#2fbf71");
  c.fillStyle=g;c.shadowColor="#7dffb0";c.shadowBlur=18;c.fill();c.shadowBlur=0;
  c.fillStyle="rgba(255,255,255,.35)";
  c.beginPath();c.arc(this.cx-R*.35,this.cy-R*.35,R*.22,0,6.283);c.fill();
 },
 destroy(){this.a=false}
};
