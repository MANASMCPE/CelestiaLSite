/* ═══════════════════════════════════════════
   CELESTIAL SYNDICATE — WOW FACTOR PACK
═══════════════════════════════════════════ */
(function(){
  'use strict';

  const CONFIG = {
    nextWarOffset: 3 * 24 * 60 * 60 * 1000,
    introEnabled: true,
    introDelay: 1800
  };

  const CSS = `
    .intro-cinematic{position:fixed;inset:0;z-index:9997;background:var(--bg,#04050d);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:24px;transition:opacity .9s ease,visibility .9s ease;pointer-events:none}
    .intro-cinematic.leaving{opacity:0;visibility:hidden}
    .intro-particles{position:absolute;inset:0;width:100%;height:100%;z-index:0}
    .intro-logo{position:relative;z-index:1;font-family:'Orbitron',sans-serif;font-weight:900;font-size:clamp(1.4rem,5.5vw,3.2rem);letter-spacing:.18em;background:linear-gradient(90deg,var(--accent,#a78bfa),var(--accent-2,#22d3ee),var(--accent-3,#fcd34d));background-size:200% auto;-webkit-background-clip:text;background-clip:text;color:transparent;opacity:0;text-align:center;animation:introLogoIn .9s cubic-bezier(.2,.8,.2,1) 1.1s forwards,shimmer 2.5s linear 2s infinite}
    @keyframes introLogoIn{from{opacity:0;transform:translateY(30px) scale(.85);filter:blur(8px)}to{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}}
    .intro-tagline{position:relative;z-index:1;font-family:'Orbitron',sans-serif;font-size:clamp(.6rem,1.8vw,.9rem);letter-spacing:.5em;color:var(--muted,#98a0c4);opacity:0;animation:introTagIn .8s ease 1.8s forwards}
    @keyframes introTagIn{to{opacity:.85}}
    .war-room-section{padding:80px 0 40px;position:relative;z-index:2;animation:wowSectionIn .9s cubic-bezier(.2,.8,.2,1) both}
    .war-room-card{max-width:740px;margin:0 auto;padding:44px 30px;background:linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.015));border:1px solid var(--border);border-radius:24px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);text-align:center;position:relative;overflow:hidden}
    .war-room-card::before{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 0%,rgba(225,29,42,.12),transparent 60%)}
    .war-room-card::after{content:'';position:absolute;top:-2px;left:50%;transform:translateX(-50%);width:60%;height:2px;background:linear-gradient(90deg,transparent,var(--accent),transparent)}
    .war-room-label{font-family:'Orbitron',sans-serif;font-size:.85rem;letter-spacing:.35em;text-transform:uppercase;color:var(--accent-2);margin-bottom:28px;font-weight:700;position:relative;display:inline-block}
    .war-room-label::before,.war-room-label::after{content:'';position:absolute;top:50%;width:32px;height:1px;background:var(--accent);transform:translateY(-50%)}
    .war-room-label::before{right:100%;margin-right:14px}
    .war-room-label::after{left:100%;margin-left:14px}
    .war-room-timer{display:flex;justify-content:center;align-items:flex-start;gap:10px;flex-wrap:wrap;position:relative}
    .war-unit{display:flex;flex-direction:column;align-items:center}
    .war-num{font-family:'Orbitron',sans-serif;font-size:clamp(1.9rem,5.5vw,3rem);font-weight:900;color:#fff;line-height:1;padding:14px 18px;min-width:78px;text-align:center;background:linear-gradient(160deg,rgba(255,255,255,.08),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.12);border-radius:14px;text-shadow:0 0 20px var(--accent);transition:transform .2s,box-shadow .2s}
    .war-num:hover{transform:scale(1.05);box-shadow:0 0 30px -6px var(--accent)}
    .war-lbl{font-size:.7rem;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);margin-top:12px;font-weight:700}
    .war-colon{font-family:'Orbitron',sans-serif;font-size:clamp(1.6rem,4.5vw,2.6rem);font-weight:900;color:var(--accent);opacity:.5;padding-top:14px;line-height:1}
    .radar-section{padding:100px 0;position:relative;z-index:2;animation:wowSectionIn .9s cubic-bezier(.2,.8,.2,1) both}
    .radar-container{max-width:700px;margin:0 auto;padding:40px 30px;background:linear-gradient(160deg,rgba(255,255,255,.05),rgba(255,255,255,.01));border:1px solid var(--border);border-radius:24px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);text-align:center}
    .radar-legend{display:flex;justify-content:center;flex-wrap:wrap;gap:22px;margin-top:28px}
    .radar-legend-item{display:inline-flex;align-items:center;gap:9px;font-size:.82rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);font-weight:700}
    .legend-dot{width:12px;height:12px;border-radius:50%;display:inline-block}
    .konami-overlay{position:fixed;inset:0;z-index:10002;background:rgba(0,0,0,.88);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;animation:fadeIn .4s ease forwards}
    @keyframes fadeIn{to{opacity:1}}
    .konami-content{max-width:520px;width:100%;padding:50px 40px;background:linear-gradient(160deg,rgba(167,139,250,.15),rgba(34,211,238,.08));border:1px solid rgba(167,139,250,.4);border-radius:24px;text-align:center;transform:scale(.9);animation:popIn .5s cubic-bezier(.2,.8,.2,1) .1s forwards;box-shadow:0 40px 100px -30px var(--accent)}
    @keyframes popIn{to{transform:scale(1)}}
    .konami-icon{font-size:4rem;color:var(--accent-3);margin-bottom:16px;text-shadow:0 0 40px var(--accent-3);animation:spin 4s linear infinite;display:inline-block}
    @keyframes spin{to{transform:rotate(360deg)}}
    .konami-content h2{font-family:'Orbitron',sans-serif;font-size:1.9rem;margin-bottom:14px;letter-spacing:.04em;background:linear-gradient(135deg,var(--accent),var(--accent-2));-webkit-background-clip:text;background-clip:text;color:transparent}
    .konami-content>p{color:var(--muted);margin-bottom:24px;font-size:1rem}
    .konami-secret{padding:22px;background:rgba(0,0,0,.4);border:1px dashed var(--accent);border-radius:14px;text-align:left;margin-bottom:26px}
    .secret-label{font-family:'Orbitron',sans-serif;font-size:.7rem;letter-spacing:.32em;color:var(--accent-3);margin-bottom:12px;font-weight:700}
    .konami-secret p{font-size:.92rem;color:var(--text);font-style:italic;line-height:1.7}
    .konami-content>button{padding:13px 36px;background:linear-gradient(135deg,var(--accent),var(--accent-2));border:none;border-radius:12px;color:#fff;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:.16em;text-transform:uppercase;font-size:.9rem;cursor:pointer;transition:transform .2s}
    .konami-content>button:hover{transform:translateY(-2px)}
    .trail-canvas{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9996}
    .type-cursor{display:inline-block;color:var(--accent);margin-left:2px;animation:blink .7s step-end infinite;font-weight:400}
    @keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}
    @keyframes wowSectionIn{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
    @keyframes shimmer{to{background-position:200% center}}
  `;

  function injectStyles(){
    if(document.getElementById('celestial-wow-styles'))return;
    const s=document.createElement('style');
    s.id='celestial-wow-styles';
    s.textContent=CSS;
    document.head.appendChild(s);
  }

  function introCinematic(){
    if(!CONFIG.introEnabled)return;
    if(document.getElementById('celestial-intro'))return;
    const overlay=document.createElement('div');
    overlay.id='celestial-intro';
    overlay.className='intro-cinematic';
    overlay.innerHTML=`<canvas class="intro-particles"></canvas><div class="intro-logo">CELESTIAL ✦ SYNDICATE</div><div class="intro-tagline">BEYOND THE STARS</div>`;
    document.body.appendChild(overlay);
    const canvas=overlay.querySelector('.intro-particles');
    const ctx=canvas.getContext('2d');
    function resize(){canvas.width=innerWidth;canvas.height=innerHeight}
    resize();
    addEventListener('resize',resize);
    const cx=canvas.width/2,cy=canvas.height/2;
    const particles=[];
    for(let i=0;i<350;i++){
      const angle=Math.random()*Math.PI*2;
      const dist=200+Math.random()*500;
      particles.push({startX:cx+Math.cos(angle)*dist,startY:cy+Math.sin(angle)*dist,size:Math.random()*2.2+.4,hue:250+Math.random()*80,delay:Math.random()*.15});
    }
    const startTime=performance.now();
    const DURATION=2000;
    function animate(now){
      const elapsed=(now-startTime)/DURATION;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      particles.forEach(p=>{
        const localT=Math.max(0,Math.min(1,(elapsed-p.delay)/(1-p.delay)));
        const ease=1-Math.pow(1-localT,3);
        const x=p.startX+(cx-p.startX)*ease;
        const y=p.startY+(cy-p.startY)*ease;
        const alpha=Math.max(0,1-Math.max(0,elapsed-.65)*2.5);
        if(alpha<=0)return;
        ctx.beginPath();
        ctx.arc(x,y,p.size*(1-ease*.4),0,Math.PI*2);
        ctx.fillStyle=`hsla(${p.hue},100%,75%,${alpha})`;
        ctx.fill();
      });
      if(elapsed<1.6)requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
    setTimeout(()=>{overlay.classList.add('leaving');setTimeout(()=>overlay.remove(),900)},DURATION+700);
  }

  function mountWarRoom(){
    const alliancesSection=document.getElementById('alliances');
    if(!alliancesSection)return;
    const targetDate=new Date(Date.now()+CONFIG.nextWarOffset);
    const section=document.createElement('section');
    section.className='war-room-section';
    section.innerHTML=`<div class="container"><div class="war-room-card"><div class="war-room-label">⚔️ Next War In</div><div class="war-room-timer" id="warTimer"></div></div></div>`;
    alliancesSection.parentNode.insertBefore(section,alliancesSection);
    const timer=section.querySelector('#warTimer');
    function update(){
      let diff=targetDate-new Date();
      if(diff<0)diff=0;
      const d=Math.floor(diff/86400000);
      const h=Math.floor((diff%86400000)/3600000);
      const m=Math.floor((diff%3600000)/60000);
      const s=Math.floor((diff%60000)/1000);
      timer.innerHTML=`<div class="war-unit"><div class="war-num">${String(d).padStart(2,'0')}</div><div class="war-lbl">Days</div></div><div class="war-colon">:</div><div class="war-unit"><div class="war-num">${String(h).padStart(2,'0')}</div><div class="war-lbl">Hours</div></div><div class="war-colon">:</div><div class="war-unit"><div class="war-num">${String(m).padStart(2,'0')}</div><div class="war-lbl">Minutes</div></div><div class="war-colon">:</div><div class="war-unit"><div class="war-num">${String(s).padStart(2,'0')}</div><div class="war-lbl">Seconds</div></div>`;
    }
    update();
    setInterval(update,1000);
  }

  function mountRivalryRadar(){
    const alliancesSection=document.getElementById('alliances');
    if(!alliancesSection)return;
    const section=document.createElement('section');
    section.className='radar-section';
    section.innerHTML=`<div class="container"><div class="sec-head"><div class="sec-kicker">Battle Metrics</div><h2>GANG RIVALRY</h2><div class="sec-line"></div></div><div class="radar-container" id="radarContainer"></div></div>`;
    alliancesSection.parentNode.insertBefore(section,alliancesSection);
    drawRadar(section.querySelector('#radarContainer'));
  }

  function drawRadar(container){
    const data=[
      {gang:'Celestial',color:'#a78bfa',values:[95,90,88,92]},
      {gang:'ASUKA',color:'#e11d2a',values:[88,95,82,96]},
      {gang:'ZM',color:'#ff3d8b',values:[92,85,95,80]},
      {gang:'TOMAN',color:'#fbbf24',values:[85,98,90,88]}
    ];
    const axes=['Wins','Loyalty','Activity','Aggression'];
    const canvas=document.createElement('canvas');
    canvas.width=600;canvas.height=560;
    canvas.style.width='100%';canvas.style.height='auto';canvas.style.maxWidth='600px';
    container.appendChild(canvas);
    const ctx=canvas.getContext('2d');
    const cx=300,cy=260,radius=200,sides=axes.length;
    for(let ring=1;ring<=4;ring++){
      ctx.beginPath();
      for(let i=0;i<=sides;i++){
        const angle=(Math.PI*2/sides)*i-Math.PI/2;
        const r=radius*(ring/4);
        const x=cx+Math.cos(angle)*r,y=cy+Math.sin(angle)*r;
        if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=1;ctx.stroke();
    }
    for(let i=0;i<sides;i++){
      const angle=(Math.PI*2/sides)*i-Math.PI/2;
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(angle)*radius,cy+Math.sin(angle)*radius);
      ctx.strokeStyle='rgba(255,255,255,.12)';ctx.stroke();
      const lx=cx+Math.cos(angle)*(radius+36);
      const ly=cy+Math.sin(angle)*(radius+36);
      ctx.fillStyle='#e8eaf7';ctx.font='bold 15px Rajdhani, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(axes[i],lx,ly);
    }
    data.forEach(g=>{
      ctx.beginPath();
      g.values.forEach((v,i)=>{
        const angle=(Math.PI*2/sides)*i-Math.PI/2;
        const r=radius*(v/100);
        const x=cx+Math.cos(angle)*r,y=cy+Math.sin(angle)*r;
        if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      });
      ctx.closePath();
      ctx.fillStyle=g.color+'28';ctx.strokeStyle=g.color;ctx.lineWidth=2.5;ctx.fill();ctx.stroke();
    });
    const legend=document.createElement('div');
    legend.className='radar-legend';
    legend.innerHTML=data.map(g=>`<div class="radar-legend-item"><span class="legend-dot" style="background:${g.color};box-shadow:0 0 12px ${g.color}"></span>${g.gang}</div>`).join('');
    container.appendChild(legend);
  }

  function konami(){
    const seq=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let idx=0;
    document.addEventListener('keydown',e=>{
      const key=e.key.length===1?e.key.toLowerCase():e.key;
      if(key===seq[idx]){idx++;if(idx===seq.length){idx=0;showKonami()}}else{idx=0}
    });
  }

  function showKonami(){
    if(document.getElementById('konami-overlay'))return;
    const ov=document.createElement('div');
    ov.id='konami-overlay';
    ov.className='konami-overlay';
    ov.innerHTML=`<div class="konami-content"><div class="konami-icon">✦</div><h2>You Found The Void</h2><p>Only the truly worthy dig this deep. Welcome to the inner circle.</p><div class="konami-secret"><div class="secret-label">CLASSIFIED INTEL</div><p>Celestial Syndicate was forged in the space between stars — not by conquest, but by choice. Every member hand-picked. Every alliance earned.</p><p style="margin-top:14px;color:var(--accent-2)">"We are not the light in the darkness. We are the darkness in the light."</p></div><button onclick="document.getElementById('konami-overlay').remove()">Close</button></div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click',e=>{if(e.target===ov)ov.remove()});
  }

  function mouseTrail(){
    if(matchMedia('(pointer:coarse)').matches)return;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const canvas=document.createElement('canvas');
    canvas.className='trail-canvas';
    document.body.appendChild(canvas);
    const ctx=canvas.getContext('2d');
    function resize(){canvas.width=innerWidth;canvas.height=innerHeight}
    resize();
    addEventListener('resize',resize);
    const particles=[];
    let lastX=-100,lastY=-100;
    document.addEventListener('mousemove',e=>{
      const dx=e.clientX-lastX,dy=e.clientY-lastY;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<3)return;
      const count=Math.min(Math.floor(dist/10)+1,5);
      for(let i=0;i<count;i++){
        const t=i/count;
        particles.push({x:lastX+dx*t,y:lastY+dy*t,vx:(Math.random()-.5)*1.2,vy:(Math.random()-.5)*1.2,life:1,size:Math.random()*2.5+1,hue:260+Math.random()*60});
      }
      if(particles.length>150)particles.splice(0,particles.length-150);
      lastX=e.clientX;lastY=e.clientY;
    },{passive:true});
    function animate(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      for(let i=particles.length-1;i>=0;i--){
        const p=particles[i];
        p.x+=p.vx;p.y+=p.vy;p.life-=.03;
        if(p.life<=0){particles.splice(i,1);continue}
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);
        ctx.fillStyle=`hsla(${p.hue},100%,75%,${p.life*.85})`;
        ctx.fill();
      }
      requestAnimationFrame(animate);
    }
    animate();
  }

  function typewriterTagline(){
    const tagline=document.querySelector('.gang-tagline');
    if(!tagline)return;
    const text=tagline.textContent.trim();
    if(!text)return;
    tagline.textContent='';
    let i=0;
    const cursor=document.createElement('span');
    cursor.className='type-cursor';
    cursor.textContent='|';
    tagline.appendChild(cursor);
    function type(){
      if(i<text.length){
        tagline.insertBefore(document.createTextNode(text[i]),cursor);
        i++;
        setTimeout(type,22);
      }else{
        setTimeout(()=>cursor.remove(),2200);
      }
    }
    setTimeout(type,400);
  }

  function init(){
    injectStyles();
    mouseTrail();
    konami();
    typewriterTagline();
    mountWarRoom();
    mountRivalryRadar();
    const params=new URLSearchParams(location.search);
    const force=params.get('intro');
    if(force==='0')return;
    const shouldShow=force==='1'||!sessionStorage.getItem('celestial_intro_seen');
    if(!shouldShow)return;
    sessionStorage.setItem('celestial_intro_seen','1');
    if(document.readyState==='complete'){
      setTimeout(introCinematic,CONFIG.introDelay);
    }else{
      addEventListener('load',()=>setTimeout(introCinematic,CONFIG.introDelay),{once:true});
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  }else{
    init();
  }
})();