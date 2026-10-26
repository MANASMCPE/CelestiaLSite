window.Celestial = (function(){
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

  function glowTexture(hex){
    const c=document.createElement('canvas');c.width=c.height=256;
    const ctx=c.getContext('2d');
    const g=ctx.createRadialGradient(128,128,0,128,128,128);
    g.addColorStop(0,hex+'ff');g.addColorStop(.25,hex+'aa');g.addColorStop(.6,hex+'33');g.addColorStop(1,hex+'00');
    ctx.fillStyle=g;ctx.fillRect(0,0,256,256);
    return new THREE.CanvasTexture(c);
  }

  function createScene(opts={}){
    if(typeof THREE==='undefined')return null;
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,3000);
    camera.position.set(0,0,opts.cameraZ||100);
    const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
    renderer.setSize(innerWidth,innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.domElement.id='scene3d';
    document.body.appendChild(renderer.domElement);
    const mouse={x:0,y:0,tx:0,ty:0};
    addEventListener('mousemove',e=>{mouse.tx=(e.clientX/innerWidth)*2-1;mouse.ty=-(e.clientY/innerHeight)*2+1});
    addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
    const clock=new THREE.Clock();
    function loop(fn){
      const t=clock.getElapsedTime();
      mouse.x+=(mouse.tx-mouse.x)*.05;mouse.y+=(mouse.ty-mouse.y)*.05;
      fn(t,mouse);renderer.render(scene,camera);
      requestAnimationFrame(()=>loop(fn));
    }
    return {scene,camera,renderer,loop,mouse};
  }

  function starField(scene,options={}){
    const count=options.count||4000;
    const colors=options.colors||[new THREE.Color(0xa78bfa),new THREE.Color(0x22d3ee),new THREE.Color(0xfcd34d)];
    const spread=options.spread||400;
    const geo=new THREE.BufferGeometry();
    const pos=new Float32Array(count*3);
    const col=new Float32Array(count*3);
    for(let i=0;i<count;i++){
      const r=Math.random()*spread;
      const theta=Math.random()*Math.PI*2;
      const phi=Math.acos(2*Math.random()-1);
      pos[i*3]=r*Math.sin(phi)*Math.cos(theta);
      pos[i*3+1]=r*Math.sin(phi)*Math.sin(theta)*.5;
      pos[i*3+2]=r*Math.cos(phi);
      const c=colors[Math.floor(Math.random()*colors.length)].clone();
      c.offsetHSL((Math.random()-.5)*.05,0,(Math.random()-.5)*.3);
      col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;
    }
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    const mat=new THREE.PointsMaterial({size:options.size||.6,vertexColors:true,transparent:true,opacity:options.opacity||.9,blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true});
    const pts=new THREE.Points(geo,mat);scene.add(pts);return pts;
  }

  function glowSphere(scene,color,radius,position){
    const tex=glowTexture(color);
    const mat=new THREE.SpriteMaterial({map:tex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
    const s=new THREE.Sprite(mat);
    s.scale.set(radius*2,radius*2,1);s.position.set(...position);
    scene.add(s);return s;
  }

  function crystal(scene,color,size=15){
    const group=new THREE.Group();
    const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(size,1),new THREE.MeshBasicMaterial({color,wireframe:true,transparent:true,opacity:.35}));
    group.add(mesh);
    const inner=new THREE.Mesh(new THREE.IcosahedronGeometry(size*.5,0),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.15}));
    group.add(inner);
    scene.add(group);return {group,mesh,inner};
  }

  function rings(scene,color,count=3,radiusBase=40){
    const group=new THREE.Group();
    for(let i=0;i<count;i++){
      const geo=new THREE.RingGeometry(radiusBase+i*12,radiusBase+i*12+.3,128);
      const mat=new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.3-i*.08,blending:THREE.AdditiveBlending,depthWrite:false});
      const ring=new THREE.Mesh(geo,mat);
      ring.rotation.x=Math.PI/2+(Math.random()-.5)*.4;
      ring.rotation.y=Math.random()*Math.PI;
      group.add(ring);
    }
    scene.add(group);return group;
  }

  function createBlackHole(scene, opts={}){
    const size=opts.size||20;
    const pos=opts.position||[0,0,-30];
    const group=new THREE.Group();
    group.position.set(pos[0],pos[1],pos[2]);

    const horizon=new THREE.Mesh(
      new THREE.SphereGeometry(size,64,64),
      new THREE.MeshBasicMaterial({color:0x000000})
    );
    group.add(horizon);

    const photonMat=new THREE.MeshBasicMaterial({
      color:0xffffff,side:THREE.DoubleSide,transparent:true,
      opacity:0.95,blending:THREE.AdditiveBlending,depthWrite:false
    });
    const photonRing=new THREE.Mesh(
      new THREE.TorusGeometry(size*1.08,size*0.045,16,128),
      photonMat
    );
    group.add(photonRing);

    const haloColors=[0xa78bfa,0x22d3ee,0xfcd34d];
    const halos=[];
    haloColors.forEach((color,i)=>{
      const halo=new THREE.Mesh(
        new THREE.TorusGeometry(size*(1.2+i*0.22),size*0.028,12,96),
        new THREE.MeshBasicMaterial({
          color,side:THREE.DoubleSide,transparent:true,
          opacity:0.5-i*0.12,blending:THREE.AdditiveBlending,depthWrite:false
        })
      );
      group.add(halo);
      halos.push(halo);
    });

    const diskCount=4000;
    const diskGeo=new THREE.BufferGeometry();
    const dPos=new Float32Array(diskCount*3);
    const dCol=new Float32Array(diskCount*3);
    const innerR=size*1.25;
    const outerR=size*4.5;
    for(let i=0;i<diskCount;i++){
      const r=innerR+Math.pow(Math.random(),0.7)*(outerR-innerR);
      const angle=Math.random()*Math.PI*2;
      const flatten=1-(r-innerR)/(outerR-innerR);
      const y=(Math.random()-0.5)*size*0.18*flatten;
      dPos[i*3]=Math.cos(angle)*r;
      dPos[i*3+1]=y;
      dPos[i*3+2]=Math.sin(angle)*r;
      const t=(r-innerR)/(outerR-innerR);
      const color=new THREE.Color();
      if(t<0.25)color.setHSL(0.6,1,0.9);
      else if(t<0.55)color.setHSL(0.52,1,0.75);
      else if(t<0.8)color.setHSL(0.12,1,0.65);
      else color.setHSL(0.02,1,0.55);
      dCol[i*3]=color.r;dCol[i*3+1]=color.g;dCol[i*3+2]=color.b;
    }
    diskGeo.setAttribute('position',new THREE.BufferAttribute(dPos,3));
    diskGeo.setAttribute('color',new THREE.BufferAttribute(dCol,3));
    const diskMat=new THREE.PointsMaterial({
      size:0.85,vertexColors:true,transparent:true,opacity:0.92,
      blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true
    });
    const disk=new THREE.Points(diskGeo,diskMat);
    group.add(disk);

    const innerCount=1500;
    const iGeo=new THREE.BufferGeometry();
    const iPos=new Float32Array(innerCount*3);
    const iCol=new Float32Array(innerCount*3);
    for(let i=0;i<innerCount;i++){
      const r=size*1.13+Math.random()*size*0.4;
      const angle=Math.random()*Math.PI*2;
      const y=(Math.random()-0.5)*size*0.08;
      iPos[i*3]=Math.cos(angle)*r;
      iPos[i*3+1]=y;
      iPos[i*3+2]=Math.sin(angle)*r;
      const color=new THREE.Color().setHSL(0.58,1,0.92);
      iCol[i*3]=color.r;iCol[i*3+1]=color.g;iCol[i*3+2]=color.b;
    }
    iGeo.setAttribute('position',new THREE.BufferAttribute(iPos,3));
    iGeo.setAttribute('color',new THREE.BufferAttribute(iCol,3));
    const iMat=new THREE.PointsMaterial({
      size:1.35,vertexColors:true,transparent:true,opacity:1,
      blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true
    });
    const innerDisk=new THREE.Points(iGeo,iMat);
    group.add(innerDisk);

    const glowSprite=new THREE.Sprite(new THREE.SpriteMaterial({
      map:glowTexture('#a78bfa'),transparent:true,opacity:0.55,
      blending:THREE.AdditiveBlending,depthWrite:false
    }));
    glowSprite.scale.set(size*7,size*7,1);
    glowSprite.position.z=-3;
    group.add(glowSprite);

    const sparkCount=350;
    const spGeo=new THREE.BufferGeometry();
    const spPos=new Float32Array(sparkCount*3);
    for(let i=0;i<sparkCount;i++){
      const r=size*(1.4+Math.random()*5);
      const theta=Math.random()*Math.PI*2;
      const phi=Math.acos(2*Math.random()-1);
      spPos[i*3]=r*Math.sin(phi)*Math.cos(theta);
      spPos[i*3+1]=r*Math.sin(phi)*Math.sin(theta)*0.7;
      spPos[i*3+2]=r*Math.cos(phi);
    }
    spGeo.setAttribute('position',new THREE.BufferAttribute(spPos,3));
    const spMat=new THREE.PointsMaterial({
      size:1.5,color:0xffffff,transparent:true,opacity:0.85,
      blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true
    });
    const sparkles=new THREE.Points(spGeo,spMat);
    group.add(sparkles);

    group.rotation.x=-0.42;
    scene.add(group);

    return {
      group,horizon,photonRing,halos,disk,innerDisk,glowSprite,sparkles,photonMat,
      update:(t,mouse)=>{
        disk.rotation.y=t*0.4;
        innerDisk.rotation.y=t*0.7;
        sparkles.rotation.y=t*0.12;
        sparkles.rotation.x=Math.sin(t*0.3)*0.15;
        photonMat.opacity=0.82+Math.sin(t*3)*0.15;
        halos.forEach((h,i)=>{h.rotation.z=t*(0.18+i*0.1)*(i%2===0?1:-1)});
        group.position.y=pos[1]+Math.sin(t*0.55)*3.5;
        if(mouse){
          group.rotation.y=mouse.x*0.15;
          group.rotation.x=-0.42+mouse.y*0.1;
        }
      }
    };
  }

  return {escapeHtml,glowTexture,createScene,starField,glowSphere,crystal,rings,createBlackHole};
})();

/* ===== Global UI ===== */
(function(){
  addEventListener('load',()=>{const p=document.getElementById('preloader');if(p)setTimeout(()=>p.classList.add('done'),700)});

  /* Scroll progress bar */
  const progressBar=document.createElement('div');
  progressBar.className='scroll-progress';
  document.body.appendChild(progressBar);

  /* Scroll to top */
  const scrollTopBtn=document.createElement('button');
  scrollTopBtn.className='scroll-top';
  scrollTopBtn.innerHTML='↑';
  scrollTopBtn.setAttribute('aria-label','Scroll to top');
  scrollTopBtn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  document.body.appendChild(scrollTopBtn);

  function updateScrollUI(){
    const scrollTop=scrollY;
    const docHeight=document.documentElement.scrollHeight-innerHeight;
    const pct=docHeight>0?(scrollTop/docHeight)*100:0;
    progressBar.style.width=pct+'%';
    scrollTopBtn.classList.toggle('show',scrollTop>500);

    const nav=document.querySelector('.nav');
    if(nav)nav.classList.toggle('scrolled',scrollTop>40);
  }
  addEventListener('scroll',updateScrollUI,{passive:true});
  updateScrollUI();

  /* Custom cursor */
  if(!matchMedia('(pointer:coarse)').matches){
    const cur=document.createElement('div');cur.className='cursor';document.body.appendChild(cur);
    let mx=0,my=0,cx=0,cy=0;
    addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY});
    (function a(){cx+=(mx-cx)*.2;cy+=(my-cy)*.2;cur.style.left=cx+'px';cur.style.top=cy+'px';requestAnimationFrame(a)})();
    document.addEventListener('mouseover',e=>{cur.classList.toggle('hover',!!e.target.closest('a,button,.hoverable'))});
  }

  /* Hamburger toggle */
  const navToggle=document.querySelector('.nav-toggle');
  const navLinks=document.querySelector('.nav-links');
  if(navToggle && navLinks){
    navToggle.addEventListener('click',()=>{
      navToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
      navToggle.classList.remove('open');
      navLinks.classList.remove('open');
    }));
  }

  /* Reveal on scroll */
  const io=new IntersectionObserver(es=>es.forEach((e,i)=>{if(e.isIntersecting){setTimeout(()=>e.target.classList.add('in'),(i%6)*80);io.unobserve(e.target)}}),{threshold:.1});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  /* Tilt */
  document.querySelectorAll('[data-tilt]').forEach(el=>{
    el.addEventListener('mousemove',e=>{
      const r=el.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-.5;
      const y=(e.clientY-r.top)/r.height-.5;
      el.style.transform=`perspective(1000px) rotateY(${x*14}deg) rotateX(${-y*14}deg) translateY(-4px)`;
    });
    el.addEventListener('mouseleave',()=>{el.style.transform=''});
  });

  /* Magnetic */
  document.querySelectorAll('[data-magnetic]').forEach(el=>{
    el.addEventListener('mousemove',e=>{
      const r=el.getBoundingClientRect();
      el.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.2}px,${(e.clientY-r.top-r.height/2)*.2}px)`;
    });
    el.addEventListener('mouseleave',()=>{el.style.transform=''});
  });

  document.querySelectorAll('.year').forEach(el=>el.textContent=new Date().getFullYear());

  /* Counters */
  const cio=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting)return;
    const target=+e.target.dataset.count;
    const start=performance.now();
    (function step(now){
      const p=Math.min((now-start)/1400,1);
      e.target.textContent=Math.floor(target*(1-Math.pow(1-p,3)));
      if(p<1)requestAnimationFrame(step);else e.target.textContent=target;
    })(start);
    cio.unobserve(e.target);
  }),{threshold:.5});
  document.querySelectorAll('[data-count]').forEach(el=>cio.observe(el));

  /* Page fade out on internal navigation */
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href]');
    if(!a)return;
    const href=a.getAttribute('href');
    if(!href||href.startsWith('#')||href.startsWith('http')||href.startsWith('mailto:')||href.startsWith('tel:')||a.target==='_blank'||a.hasAttribute('download'))return;
    e.preventDefault();
    document.body.style.transition='opacity .25s ease';
    document.body.style.opacity='0';
    setTimeout(()=>{window.location.href=href},260);
  });

  /* Re-show body on back navigation */
  addEventListener('pageshow',e=>{if(e.persisted){document.body.style.opacity='1';document.body.style.transition=''}});
})();