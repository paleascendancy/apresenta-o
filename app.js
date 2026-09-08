const sections=[...document.querySelectorAll('main section')],dots=document.getElementById('dots');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let current=0,paused=reduced.matches;
document.body.classList.add('cinema');
sections.forEach((s,i)=>{s.tabIndex=-1;const b=document.createElement('button');b.setAttribute('aria-label',i===0?'Capa':'Capítulo '+i);b.onclick=()=>go(i);dots.append(b)});
function go(i,focus=true){
 current=Math.max(0,Math.min(sections.length-1,i));
 sections.forEach((s,n)=>{s.hidden=n!==current;s.classList.toggle('active',n===current)});
 const s=sections[current];s.scrollTop=0;
 document.getElementById('counter').textContent=String(current).padStart(2,'0')+' / 09';
 [...dots.children].forEach((b,n)=>b.setAttribute('aria-current',String(n===current)));
 document.getElementById('prev').disabled=current===0;
 document.getElementById('next').disabled=current===sections.length-1;
 if(location.hash!=='#'+s.id)history.replaceState(null,'','#'+s.id);
 if(focus)s.focus({preventScroll:true});
}
document.getElementById('prev').onclick=()=>go(current-1);
document.getElementById('next').onclick=()=>go(current+1);
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const i=sections.findIndex(s=>'#'+s.id===a.getAttribute('href'));if(i>=0){e.preventDefault();go(i)}}));
addEventListener('hashchange',()=>{const i=sections.findIndex(s=>'#'+s.id===location.hash);if(i>=0)go(i)});
document.addEventListener('keydown',e=>{
 if(/INPUT|TEXTAREA|SELECT|BUTTON|SUMMARY|A/.test(e.target.tagName))return;
 if(['ArrowRight','PageDown'].includes(e.key)){e.preventDefault();go(current+1)}
 if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();go(current-1)}
 if(e.key==='Home'){e.preventDefault();go(0)}if(e.key==='End'){e.preventDefault();go(9)}
});
let wheelSum=0,wheelLast=0,lockedUntil=0;
document.querySelector('main').addEventListener('wheel',e=>{
 const s=sections[current],down=e.deltaY>0;
 if((down&&s.scrollTop+s.clientHeight<s.scrollHeight-3)||(!down&&s.scrollTop>3))return;
 e.preventDefault();const now=performance.now();if(now<lockedUntil)return;
 if(now-wheelLast>160)wheelSum=0;wheelLast=now;wheelSum+=e.deltaY;
 if(Math.abs(wheelSum)>65){go(current+(wheelSum>0?1:-1));wheelSum=0;lockedUntil=now+1000}
},{passive:false});
let touch=null;
document.querySelector('main').addEventListener('touchstart',e=>{if(e.touches.length===1)touch=[e.touches[0].clientX,e.touches[0].clientY]},{passive:true});
document.querySelector('main').addEventListener('touchend',e=>{if(!touch)return;const dx=e.changedTouches[0].clientX-touch[0],dy=e.changedTouches[0].clientY-touch[1];if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.5)go(current+(dx<0?1:-1));touch=null},{passive:true});
document.querySelectorAll('.techniques details').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)document.querySelectorAll('.techniques details').forEach(x=>{if(x!==d)x.open=false})}));
document.getElementById('full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{document.getElementById('full').textContent='Tela cheia indisponível'}};
document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-answer]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');document.getElementById('feedback').textContent=b.dataset.answer==='b'?'Isso: a mensagem B usa urgência. “Última chance” pressiona a decisão sem acrescentar uma característica do produto.':'A mensagem A informa uma característica verificável. É a B que usa urgência para tentar acelerar a escolha.'});
go(Math.max(0,sections.findIndex(s=>'#'+s.id===location.hash)),false);

// Rede neural estilizada, não um modelo anatômico: duas nuvens com conexões 3D.
const canvas=document.getElementById('scene'),ctx=canvas.getContext('2d');
const motion=document.getElementById('motion');
function motionLabel(){motion.textContent=paused?'Ativar movimento':'Pausar movimento';motion.setAttribute('aria-pressed',String(paused))}
motionLabel();motion.onclick=()=>{paused=!paused;motionLabel();dirty=true};
reduced.addEventListener('change',e=>{paused=e.matches;motionLabel();dirty=true});
let w=innerWidth,h=innerHeight,t=0,last=0,dirty=true,drawnScene=-1,pointerX=0,pointerY=0;
const camera={x:.73,y:.44,scale:.31,angle:-.45};
const shots=[
 [.73,.42,.31,-.45],[.22,.55,.27,.8],[.80,.38,.25,1.5],
 [.78,.65,.34,2.3],[.20,.49,.29,3.0],[.70,.72,.27,3.8],
 [.20,.55,.33,4.5],[.82,.40,.26,5.3],[.48,.38,.35,6.0],[.76,.49,.30,6.7]
];
const nodes=[],edges=[];
for(let side of [-1,1])for(let i=0;i<190;i++){
 const v=(i+.5)/190,phi=Math.acos(1-2*v),theta=i*2.399963;
 const fold=1+.085*Math.sin(theta*5)*Math.sin(phi*8);
 nodes.push({x:side*.43+Math.sin(phi)*Math.cos(theta)*.43*fold,y:Math.cos(phi)*.69*fold,z:Math.sin(phi)*Math.sin(theta)*.79*fold,side});
}
for(let i=0;i<nodes.length;i++){
 const a=nodes[i],nearest=[];
 for(let j=i+1;j<nodes.length;j++){const b=nodes[j],d=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);if(d<.27)nearest.push([j,d])}
 nearest.sort((a,b)=>a[1]-b[1]);nearest.slice(0,4).forEach(([j])=>edges.push([i,j]));
}
function resize(){w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio||1,1.5);canvas.width=w*d;canvas.height=h*d;if(ctx)ctx.setTransform(d,0,0,d,0,0);dirty=true}
addEventListener('resize',resize);resize();
addEventListener('pointermove',e=>{pointerX=(e.clientX/w-.5)*.15;pointerY=(e.clientY/h-.5)*.1});
function render(now){
 requestAnimationFrame(render);if(!ctx||document.hidden||now-last<33)return;
 const dt=Math.min((now-last)/1000,.05);last=now;
 if(paused&&!dirty&&drawnScene===current)return;
 if(!paused)t+=dt;dirty=false;drawnScene=current;
 const shot=shots[current],mix=paused?1:1-Math.exp(-dt*3.6);
 ['x','y','scale','angle'].forEach((key,i)=>camera[key]+=(shot[i]-camera[key])*mix);
 ctx.clearRect(0,0,w,h);
 const cx=camera.x*w,cy=camera.y*h,scale=Math.min(w,h)*camera.scale*1.6;
 const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,scale*1.5);
 glow.addColorStop(0,'rgba(61,105,143,.17)');glow.addColorStop(1,'rgba(8,9,12,0)');
 ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
 const angle=camera.angle+(paused?0:Math.sin(t*.16)*.12+pointerX),tilt=-.15+(paused?0:pointerY);
 const projected=nodes.map(n=>{
 const x=n.x*Math.cos(angle)-n.z*Math.sin(angle),z=n.x*Math.sin(angle)+n.z*Math.cos(angle);
 const y=n.y*Math.cos(tilt)-z*Math.sin(tilt),depth=n.y*Math.sin(tilt)+z*Math.cos(tilt),k=3/(3+depth);
 return{x:cx+x*scale*k,y:cy+y*scale*k,z:depth,k};
 });
 ctx.lineWidth=.65;
 edges.forEach(([i,j])=>{const a=projected[i],b=projected[j],alpha=.08+(1-(a.z+b.z+2)/4)*.15;ctx.strokeStyle='rgba(170,206,229,'+alpha+')';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()});
 projected.forEach((p,i)=>{const intensity=.35+.25*(1-p.z);ctx.fillStyle='rgba(202,225,240,'+intensity+')';ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.6,1.15*p.k),0,Math.PI*2);ctx.fill()});
 // Pulsos lentos que percorrem conexões, sem flashes.
 for(let k=0;k<14;k++){
 const pair=edges[(k*43+current*17)%edges.length],a=projected[pair[0]],b=projected[pair[1]],u=(t*.22+k*.071)%1;
 const x=a.x+(b.x-a.x)*u,y=a.y+(b.y-a.y)*u;
 ctx.fillStyle='rgba(255,114,103,.8)';ctx.shadowColor='#ff645f';ctx.shadowBlur=9;ctx.beginPath();ctx.arc(x,y,1.9,0,Math.PI*2);ctx.fill();
 }ctx.shadowBlur=0;
}
requestAnimationFrame(render);
