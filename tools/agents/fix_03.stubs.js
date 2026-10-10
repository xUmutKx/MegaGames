// Harness stubs: verbatim copies of mega.html fc_ helpers used by fix_03.js
function fc_R(a,b){return a+Math.random()*(b-a)}
function fc_P(a){return a[Math.floor(Math.random()*a.length)]}
function fc_in(px,py,x,y,w,h){return px>=x&&px<=x+w&&py>=y&&py<=y+h}
function fc_bg(c){const b=c.bg||["#1a2040","#0a0d1a"],gr=ctx2d.createLinearGradient(0,0,0,H());gr.addColorStop(0,b[0]);gr.addColorStop(1,b[1]);ctx2d.fillStyle=gr;ctx2d.fillRect(0,0,W(),H())}
function fc_box(x,y,w,h,col,label,size,tc){rect(x,y,w,h,col,14);if(label)text(label,x+w/2,y+h/2+(size||20)*.36,size||20,tc||"#0b0f1a","center")}
function fc_emo(e,cx,cy,s){text(e,cx,cy+s*.36,s,"#fff","center")}
function fc_timer(f,y){rect(W()/2-120,y,240,10,"rgba(255,255,255,.12)",5);rect(W()/2-120,y,240*Math.max(0,Math.min(1,f)),10,C.cyan,5)}
function fc_grid(cols,rows,y0){const cw=Math.min(78,(W()-40)/cols);return{x0:(W()-cw*cols)/2,y0:y0,cw:cw,cols:cols,rows:rows}}
function fc_hitg(L,x,y){const c=Math.floor((x-L.x0)/L.cw),r=Math.floor((y-L.y0)/L.cw);if(c<0||r<0||c>=L.cols||r>=L.rows)return -1;return r*L.cols+c}
function fc_cellXY(L,i){return{x:L.x0+(i%L.cols)*L.cw+L.cw/2,y:L.y0+Math.floor(i/L.cols)*L.cw+L.cw/2}}
function fc_pad(opts){for(let i=0;i<opts.length;i++)fc_box(W()/2-150+(i%2)*160,H()-300+Math.floor(i/2)*78,140,64,"rgba(255,255,255,.16)",String(opts[i]),26,"#fff")}
function fc_padHit(x,y,n){for(let i=0;i<n;i++)if(fc_in(x,y,W()/2-150+(i%2)*160,H()-300+Math.floor(i/2)*78,140,64))return i;return -1}
function fc_base(g,c){
  const S={t:0,over:false,score:0,lives:c.lives||3,goal:g.goal};
  S.hud=()=>hud("Score "+S.score+"/"+S.goal+" • "+"❤️".repeat(Math.max(0,S.lives)));
  S.win=()=>{if(!S.over){S.over=true;setTimeout(completeMini,350)}};
  S.lose=m=>{if(!S.over){S.over=true;setTimeout(()=>miniFail(g,m),350)}};
  S.gain=()=>{S.score++;if(S.score>=S.goal)S.win()};
  S.miss=m=>{S.lives--;if(S.lives<=0)S.lose(m);return S.lives>0};
  S.banner=()=>{if(!S.over)return;const w=Math.min(W()-40,340);rect((W()-w)/2,H()/2-60,w,110,"rgba(8,10,20,.85)",18);text(S.score>=S.goal?"Cleared!":"Game over",W()/2,H()/2+10,28,"#fff","center")};
  return S;
}

// ===== 1) MEMORY PAIRS: flip two, match the pair =====
