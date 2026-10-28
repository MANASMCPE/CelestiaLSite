/* Five Three.js scenes: hub black hole, ASUKA blade core, ZM bloom, TOMAN torii night, and a light star field for utility pages. */
(function () {
  'use strict';
  var CS = window.CS;
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function glowTex(THREE, hex) {
    var c = document.createElement('canvas'); c.width = c.height = 256;
    var x = c.getContext('2d'), g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, hex + 'ff'); g.addColorStop(0.25, hex + '99'); g.addColorStop(0.6, hex + '28'); g.addColorStop(1, hex + '00');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }
  function glow(THREE, hex, size, pos, op) {
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(THREE, hex), transparent: true, opacity: op == null ? 1 : op, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.set(size, size, 1); s.position.set(pos[0], pos[1], pos[2]); return s;
  }
  var dotTex = null;
  function dot(THREE) {
    if (dotTex) return dotTex;
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return (dotTex = new THREE.CanvasTexture(c));
  }
  function stars(THREE, count, colors, rmin, rmax, size) {
    var g = new THREE.BufferGeometry(), p = new Float32Array(count * 3), c = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      var r = rnd(rmin, rmax), th = Math.random() * 6.2832, ph = Math.acos(2 * Math.random() - 1);
      p[i * 3] = r * Math.sin(ph) * Math.cos(th); p[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th); p[i * 3 + 2] = r * Math.cos(ph);
      var col = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]); col.multiplyScalar(rnd(0.5, 1));
      c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b;
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({ map: dot(THREE), alphaTest: 0.01, size: size || 1.4, vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
  }

  /* =====================================================================
     HUB: black hole with a shader-driven, Keplerian accretion disk
     ===================================================================== */
  CS.scenes.hub = function (THREE, scene, camera, S) {
    var R = 7;
    var starsP = stars(THREE, S.mobile ? 1800 : 3600, [0xa8d8ff, 0xc8b4ff, 0xffd0e4, 0xffffff], 300, 900, 2.2);
    scene.add(starsP);
    var bh = new THREE.Group(); scene.add(bh);
    var disk = new THREE.Group(); disk.rotation.x = 0.36; bh.add(disk);

    var vs = [
      'attribute float aR; attribute float aA; attribute float aS; attribute float aY;',
      'uniform float uTime; uniform float uPix; uniform float uLens; uniform float uR;',
      'varying vec3 vCol; varying float vA;',
      'void main(){',
      '  float t = (aR - 1.3) / 3.3;',
      '  float w = 1.9 / pow(aR, 1.5);',
      '  float a = aA + uTime * w;',
      '  vec3 p;',
      '  if (uLens < 0.5) { p = vec3(cos(a) * aR, aY * (1.0 - t) * 0.5, sin(a) * aR); }',
      '  else { float r = 1.1 + t * 0.95; p = vec3(cos(a) * r, sin(a) * r, aY * 0.2); }',
      '  p *= uR;',
      '  float dop = clamp(0.5 + 0.5 * cos(a), 0.12, 1.0);',
      '  vec3 c1 = vec3(0.88, 0.97, 1.0); vec3 c2 = vec3(0.55, 0.42, 1.0); vec3 c3 = vec3(1.0, 0.32, 0.55);',
      '  vec3 col = t < 0.45 ? mix(c1, c2, t / 0.45) : mix(c2, c3, (t - 0.45) / 0.55);',
      '  vCol = col * (1.35 - t * 0.7) * (0.35 + dop * 1.1);',
      '  vA = 0.9 - t * 0.35;',
      '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
      '  gl_Position = projectionMatrix * mv;',
      '  gl_PointSize = aS * uPix * (260.0 / -mv.z);',
      '}'
    ].join('\n');
    var fs = 'varying vec3 vCol; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vCol, a * vA); }';
    function makeDisk(n, lens) {
      var g = new THREE.BufferGeometry(), aR = new Float32Array(n), aA = new Float32Array(n), aS = new Float32Array(n), aY = new Float32Array(n), pos = new Float32Array(n * 3);
      for (var i = 0; i < n; i++) {
        aR[i] = 1.3 + Math.pow(Math.random(), 0.8) * 3.3; aA[i] = Math.random() * 6.2832; aS[i] = rnd(0.6, 2.2); aY[i] = rnd(-1, 1);
      }
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('aR', new THREE.BufferAttribute(aR, 1)); g.setAttribute('aA', new THREE.BufferAttribute(aA, 1));
      g.setAttribute('aS', new THREE.BufferAttribute(aS, 1)); g.setAttribute('aY', new THREE.BufferAttribute(aY, 1));
      var m = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uPix: { value: renderPix }, uLens: { value: lens }, uR: { value: R } },
        vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      });
      var pts = new THREE.Points(g, m); pts.frustumCulled = false; return pts;
    }
    var renderPix = Math.min(window.devicePixelRatio || 1, CS.coarse ? 1.5 : 2);
    var n = S.mobile ? 9000 : 24000;
    var dk = makeDisk(n, 0), lens = makeDisk(Math.round(n * 0.4), 1);
    disk.add(dk); bh.add(lens);

    var horizon = new THREE.Mesh(new THREE.SphereGeometry(R, 56, 56), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    bh.add(horizon);
    var ring = new THREE.Mesh(new THREE.TorusGeometry(R * 1.055, R * 0.03, 16, 200), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
    bh.add(ring);
    var halo = glow(THREE, '#8fb8ff', R * 16, [0, 0, -6], 0.55); bh.add(halo);
    var halo2 = glow(THREE, '#ff5fa8', R * 22, [0, 0, -10], 0.22); bh.add(halo2);

    var waves = [];
    for (var i = 0; i < 3; i++) {
      var w = new THREE.Mesh(new THREE.RingGeometry(1, 1.03, 128), new THREE.MeshBasicMaterial({ color: 0x7fd6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      w.userData.t = -1; bh.add(w); waves.push(w);
    }
    var wi = 0;
    S.onClick = function () { var w = waves[wi++ % 3]; w.userData.t = 0; };

    function place() {
      var sc = S.mobile ? 0.62 : Math.min(1.05, S.w / 1200 + 0.3);
      bh.scale.setScalar(sc); bh.userData.baseY = S.mobile ? 13 : 13;
    }
    S.onResize = place; place();

    return function (t) {
      var intro = Math.min(1, t / 3.2), e = 1 - Math.pow(1 - intro, 3);
      camera.position.set(S.mouse.x * 7, S.mouse.y * 4 + 2, 118 - 46 * e);
      camera.lookAt(0, 0, 0);
      bh.position.y = bh.userData.baseY + S.scroll * 34 + Math.sin(t * 0.5) * 0.8;
      var fade = Math.max(0, 1 - S.scroll * 0.55);
      dk.material.uniforms.uTime.value = t; lens.material.uniforms.uTime.value = t;
      disk.rotation.x = 0.36 + S.mouse.y * 0.12; disk.rotation.z = S.mouse.x * 0.08;
      ring.material.opacity = (0.8 + Math.sin(t * 3) * 0.15) * fade;
      halo.material.opacity = 0.55 * fade * (1 + S.boost * 0.5); halo2.material.opacity = 0.22 * fade;
      starsP.rotation.y = t * 0.012 + S.mouse.x * 0.05; starsP.rotation.x = S.mouse.y * 0.04;
      waves.forEach(function (w) {
        if (w.userData.t < 0) return;
        w.userData.t += 0.018; var k = w.userData.t;
        w.scale.setScalar(R * (1.2 + k * 9)); w.material.opacity = Math.max(0, 0.8 * (1 - k));
        if (k >= 1) w.userData.t = -1;
      });
    };
  };

  /* =====================================================================
     ASUKA: red blade core, orbiting shards, HUD grid
     ===================================================================== */
  CS.scenes.asuka = function (THREE, scene, camera, S) {
    scene.fog = new THREE.FogExp2(0x0a0305, 0.011);
    scene.add(new THREE.AmbientLight(0x401018, 1.2));
    var l1 = new THREE.PointLight(0xff2b3a, 2.4, 260); l1.position.set(0, 14, 34); scene.add(l1);
    var l2 = new THREE.PointLight(0xff8a2b, 1.6, 220); l2.position.set(-36, -8, 20); scene.add(l2);
    var l3 = new THREE.PointLight(0xffffff, 0.7, 200); l3.position.set(30, 20, 10); scene.add(l3);

    var core = new THREE.Group(); scene.add(core);
    var wire = new THREE.Mesh(new THREE.IcosahedronGeometry(11, 1), new THREE.MeshBasicMaterial({ color: 0xff2b3a, wireframe: true, transparent: true, opacity: 0.55 }));
    var solid = new THREE.Mesh(new THREE.OctahedronGeometry(6, 0), new THREE.MeshStandardMaterial({ color: 0x2a0509, emissive: 0xff1f33, emissiveIntensity: 0.9, flatShading: true, metalness: 0.6, roughness: 0.3 }));
    var shell = new THREE.Mesh(new THREE.OctahedronGeometry(8.2, 0), new THREE.MeshBasicMaterial({ color: 0xff8a2b, wireframe: true, transparent: true, opacity: 0.5 }));
    core.add(wire); core.add(solid); core.add(shell);
    core.add(glow(THREE, '#ff2b3a', 60, [0, 0, -4], 0.55));

    var rings = [];
    var defs = [[52, 22, 0.32, 0.25], [36, 30, -0.45, 0.4], [26, 20, 0.6, -0.6], [64, 18, -0.25, 0.15]];
    var bladeGeo = new THREE.ConeGeometry(0.55, 7, 4, 1);
    defs.forEach(function (d, ri) {
      var r = d[0], n = S.mobile ? Math.round(d[1] * 0.6) : d[1];
      var mesh = new THREE.InstancedMesh(bladeGeo, new THREE.MeshStandardMaterial({ color: ri % 2 ? 0xff6a1f : 0xff2b3a, emissive: ri % 2 ? 0x8a2a00 : 0x8a0014, emissiveIntensity: 0.9, flatShading: true, metalness: 0.7, roughness: 0.25 }), n);
      var dummy = new THREE.Object3D(), up = new THREE.Vector3(0, 1, 0);
      for (var i = 0; i < n; i++) {
        var a = (i / n) * 6.2832, tan = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a));
        dummy.position.set(Math.cos(a) * r, rnd(-2, 2), Math.sin(a) * r);
        dummy.quaternion.setFromUnitVectors(up, tan);
        dummy.scale.set(1, rnd(0.7, 1.5), 1);
        dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.rotation.x = d[2]; mesh.rotation.z = d[3] * 0.6; mesh.userData.speed = (ri % 2 ? -1 : 1) * (0.12 + 0.05 * (4 - ri));
      scene.add(mesh); rings.push(mesh);
    });

    var grid = new THREE.GridHelper(520, 52, 0xff2b3a, 0x4a0f18); grid.position.y = -26; grid.material.transparent = true; grid.material.opacity = 0.55; scene.add(grid);
    var grid2 = new THREE.GridHelper(520, 52, 0xff2b3a, 0x4a0f18); grid2.position.y = 60; grid2.material.transparent = true; grid2.material.opacity = 0.18; scene.add(grid2);

    var NS = S.mobile ? 260 : 620, sp = new Float32Array(NS * 3), sv = new Float32Array(NS);
    for (var i = 0; i < NS; i++) { sp[i * 3] = rnd(-120, 120); sp[i * 3 + 1] = rnd(-26, 60); sp[i * 3 + 2] = rnd(-120, 40); sv[i] = rnd(4, 14); }
    var sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    var sparks = new THREE.Points(sg, new THREE.PointsMaterial({ map: dot(THREE), alphaTest: 0.01, color: 0xff9a3a, size: 1.4, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(sparks);

    function place() { var ox = S.mobile ? 0 : 26; core.position.set(ox, S.mobile ? 14 : 4, 0); core.scale.setScalar(S.mobile ? 0.8 : 1); rings.forEach(function (r) { r.position.set(ox, core.position.y, 0); r.scale.setScalar(S.mobile ? 0.7 : 1); }); }
    S.onResize = place; place();

    return function (t, dt) {
      var spin = 1 + S.boost * 5;
      core.rotation.y += dt * 0.35 * spin; core.rotation.x = Math.sin(t * 0.4) * 0.25;
      wire.rotation.z += dt * 0.2; shell.rotation.y -= dt * 0.6 * spin; solid.rotation.x += dt * 0.5;
      solid.material.emissiveIntensity = 0.7 + Math.sin(t * 3) * 0.25 + S.boost * 1.5;
      l1.intensity = 2.4 + Math.sin(t * 2.2) * 0.6 + S.boost * 4;
      rings.forEach(function (r) { r.rotation.y += dt * r.userData.speed * spin; });
      var p = sg.attributes.position.array;
      for (var i = 0; i < NS; i++) { p[i * 3 + 1] += sv[i] * dt; if (p[i * 3 + 1] > 62) p[i * 3 + 1] = -26; }
      sg.attributes.position.needsUpdate = true;
      grid.position.z = (t * 6) % 10;
      camera.position.set(S.mouse.x * 10, 6 + S.mouse.y * 5 - S.scroll * 6, 86 - Math.min(S.scroll, 2) * 10);
      camera.lookAt(core.position.x * 0.3, core.position.y - S.scroll * 8, 0);
    };
  };

  /* =====================================================================
     ZM: bioluminescent bloom, phyllotaxis petals, spore drift, parasite vines
     ===================================================================== */
  CS.scenes.zm = function (THREE, scene, camera, S) {
    var N = S.mobile ? 5200 : 12000, RM = 30;
    var g = new THREE.BufferGeometry(), aR = new Float32Array(N), aT = new Float32Array(N), aS = new Float32Array(N), pos = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) { aR[i] = RM * Math.sqrt((i + 0.5) / N); aT[i] = i * 2.399963; aS[i] = rnd(0.6, 1.8); }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aR', new THREE.BufferAttribute(aR, 1)); g.setAttribute('aT', new THREE.BufferAttribute(aT, 1)); g.setAttribute('aS', new THREE.BufferAttribute(aS, 1));
    var pix = Math.min(window.devicePixelRatio || 1, CS.coarse ? 1.5 : 2);
    var mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPix: { value: pix }, uBloom: { value: 0 } },
      vertexShader: [
        'attribute float aR; attribute float aT; attribute float aS; uniform float uTime; uniform float uPix; uniform float uBloom; varying vec3 vCol; varying float vA;',
        'void main(){',
        '  float k = aR / 30.0;',
        '  float breathe = 1.0 + 0.07 * sin(uTime * 1.1 - aR * 0.18) + uBloom * 0.25;',
        '  float rr = aR * (1.0 + 0.22 * sin(5.0 * aT + uTime * 0.35) * k) * breathe;',
        '  float h = pow(k, 1.7) * 24.0 * breathe - 9.0 + sin(aT * 3.0 + uTime) * 0.4 * k;',
        '  vec3 p = vec3(cos(aT) * rr, h, sin(aT) * rr);',
        '  vec3 cA = vec3(1.0, 0.95, 0.98); vec3 cB = vec3(1.0, 0.45, 0.78); vec3 cC = vec3(0.75, 0.15, 0.62);',
        '  vCol = k < 0.35 ? mix(cA, cB, k / 0.35) : mix(cB, cC, (k - 0.35) / 0.65);',
        '  vCol *= 0.75 + 0.5 * sin(aT * 7.0 + uTime * 1.5) * 0.3 + 0.35;',
        '  vA = 0.95 - k * 0.3;',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;',
        '  gl_PointSize = aS * (0.8 + k * 1.2) * uPix * (210.0 / -mv.z);',
        '}'
      ].join('\n'),
      fragmentShader: 'varying vec3 vCol; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vCol, smoothstep(0.5, 0.0, d) * vA); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    var bloom = new THREE.Points(g, mat); bloom.frustumCulled = false;
    var grp = new THREE.Group(); grp.add(bloom); scene.add(grp);
    grp.add(glow(THREE, '#ff3d8b', 70, [0, -2, 0], 0.5));

    var vines = [];
    for (var v = 0; v < 6; v++) {
      var pts = [], a0 = (v / 6) * 6.2832;
      for (var j = 0; j <= 28; j++) {
        var u = j / 28, ang = a0 + u * 5.5, rad = 6 + u * 34 + Math.sin(u * 9 + v) * 3;
        pts.push(new THREE.Vector3(Math.cos(ang) * rad, -10 + u * 38 + Math.sin(u * 7 + v * 2) * 3, Math.sin(ang) * rad));
      }
      var tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.16, 6, false), new THREE.MeshBasicMaterial({ color: v % 2 ? 0xff7ac0 : 0xe01e8c, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
      grp.add(tube); vines.push(tube);
    }

    var NS = S.mobile ? 350 : 900, sp = new Float32Array(NS * 3), sv = new Float32Array(NS), sph = new Float32Array(NS);
    for (var i2 = 0; i2 < NS; i2++) { sp[i2 * 3] = rnd(-70, 70); sp[i2 * 3 + 1] = rnd(-30, 50); sp[i2 * 3 + 2] = rnd(-70, 40); sv[i2] = rnd(1.5, 5); sph[i2] = rnd(0, 6.28); }
    var sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    var spores = new THREE.Points(sg, new THREE.PointsMaterial({ map: dot(THREE), alphaTest: 0.01, color: 0xffb3d9, size: 1.5, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(spores);
    var starsP = stars(THREE, 1200, [0xffc2e0, 0xd8a8ff, 0xffffff], 300, 800, 1.6); scene.add(starsP);

    S.onClick = function () { };
    function place() { grp.position.set(S.mobile ? 0 : 24, S.mobile ? 6 : -2, 0); grp.scale.setScalar(S.mobile ? 0.62 : 0.92); }
    S.onResize = place; place();

    return function (t, dt) {
      mat.uniforms.uTime.value = t; mat.uniforms.uBloom.value = S.boost;
      grp.rotation.y += dt * 0.12; grp.rotation.x = 0.82 + S.mouse.y * 0.18 - S.scroll * 0.12; grp.rotation.z = S.mouse.x * 0.1;
      vines.forEach(function (vn, i) { vn.rotation.y = t * (0.05 + i * 0.01); vn.material.opacity = 0.3 + Math.sin(t * 1.3 + i) * 0.12 + S.boost * 0.3; });
      var p = sg.attributes.position.array;
      for (var i = 0; i < NS; i++) {
        p[i * 3 + 1] += sv[i] * dt; p[i * 3] += Math.sin(t * 0.6 + sph[i]) * dt * 2;
        if (p[i * 3 + 1] > 52) p[i * 3 + 1] = -30;
      }
      sg.attributes.position.needsUpdate = true;
      starsP.rotation.y = t * 0.01;
      camera.position.set(S.mouse.x * 8, 14 + S.mouse.y * 4, 78 - Math.min(S.scroll, 2) * 8); camera.lookAt(0, 2 - S.scroll * 6, 0);
    };
  };

  /* =====================================================================
     TOMAN: torii gate under a night moon, drifting sakura, gold embers
     ===================================================================== */
  CS.scenes.toman = function (THREE, scene, camera, S) {
    scene.fog = new THREE.Fog(0x070605, 50, 300);
    scene.add(new THREE.AmbientLight(0x3a2a20, 1.1));
    var gold = new THREE.PointLight(0xffc766, 2.2, 140); gold.position.set(0, 8, 18); scene.add(gold);
    var rim = new THREE.PointLight(0xe3202a, 1.4, 160); rim.position.set(-30, 12, -10); scene.add(rim);
    var moon = new THREE.Mesh(new THREE.SphereGeometry(24, 48, 48), new THREE.MeshBasicMaterial({ color: 0xfff0c8 })); moon.position.set(32, 30, -170); scene.add(moon);
    scene.add(glow(THREE, '#ffe3a0', 190, [32, 30, -172], 0.6));
    scene.add(stars(THREE, 1500, [0xfff2d0, 0xffffff, 0xffd9a0], 350, 900, 1.6));

    var red = new THREE.MeshStandardMaterial({ color: 0xc4161c, roughness: 0.55, metalness: 0.1, emissive: 0x3a0306, emissiveIntensity: 0.8 });
    var blk = new THREE.MeshStandardMaterial({ color: 0x0c0a0a, roughness: 0.7 });
    var torii = new THREE.Group(); torii.position.set(0, -4, -22); scene.add(torii);
    [-12, 12].forEach(function (x) {
      var p = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 32, 20), red); p.position.set(x, 0, 0); torii.add(p);
      var base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 1.6, 20), blk); base.position.set(x, -16.5, 0); torii.add(base);
    });
    var nuki = new THREE.Mesh(new THREE.BoxGeometry(27, 1.5, 1.8), red); nuki.position.y = 9; torii.add(nuki);
    var shim = new THREE.Mesh(new THREE.BoxGeometry(31, 1.5, 2.8), red); shim.position.y = 15.2; torii.add(shim);
    var kas = new THREE.Mesh(new THREE.BoxGeometry(34, 2, 3.6), blk); kas.position.y = 17.4; torii.add(kas);
    [-1, 1].forEach(function (s) { var tip = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 3.6), blk); tip.position.set(s * 18.2, 18.2, 0); tip.rotation.z = s * -0.28; torii.add(tip); });
    var plaque = new THREE.Mesh(new THREE.BoxGeometry(3.6, 5, 0.6), new THREE.MeshStandardMaterial({ color: 0x120d0a, emissive: 0xd4a537, emissiveIntensity: 0.5 })); plaque.position.set(0, 12.2, 0.2); torii.add(plaque);

    var water = new THREE.Mesh(new THREE.CircleGeometry(260, 64), new THREE.MeshStandardMaterial({ color: 0x0a0807, roughness: 0.2, metalness: 0.7 })); water.rotation.x = -Math.PI / 2; water.position.y = -20.5; scene.add(water);
    var ripples = [];
    for (var i = 0; i < 5; i++) {
      var rp = new THREE.Mesh(new THREE.RingGeometry(1, 1.06, 96), new THREE.MeshBasicMaterial({ color: 0xffc766, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      rp.rotation.x = -Math.PI / 2; rp.position.set(0, -20.3, -10); rp.userData.t = i / 5; scene.add(rp); ripples.push(rp);
    }

    var pc = document.createElement('canvas'); pc.width = pc.height = 64; var px = pc.getContext('2d');
    var pg = px.createRadialGradient(32, 32, 2, 32, 32, 30); pg.addColorStop(0, '#fff0f4'); pg.addColorStop(0.6, '#ffb3c8'); pg.addColorStop(1, 'rgba(255,150,180,0)');
    px.fillStyle = pg; px.beginPath(); px.ellipse(32, 32, 22, 12, 0.6, 0, 6.2832); px.fill();
    var NP = S.mobile ? 220 : 520, pp = new Float32Array(NP * 3), pv = new Float32Array(NP * 3);
    for (var k = 0; k < NP; k++) { pp[k * 3] = rnd(-90, 90); pp[k * 3 + 1] = rnd(-20, 50); pp[k * 3 + 2] = rnd(-90, 40); pv[k * 3] = rnd(-2, 2); pv[k * 3 + 1] = rnd(-5, -2); pv[k * 3 + 2] = rnd(-1, 1); }
    var pgeo = new THREE.BufferGeometry(); pgeo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    scene.add(new THREE.Points(pgeo, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(pc), size: 2.6, transparent: true, depthWrite: false, opacity: 0.95 })));

    var NE = S.mobile ? 140 : 320, ep = new Float32Array(NE * 3), ev = new Float32Array(NE);
    for (var m = 0; m < NE; m++) { ep[m * 3] = rnd(-50, 50); ep[m * 3 + 1] = rnd(-20, 40); ep[m * 3 + 2] = rnd(-50, 20); ev[m] = rnd(2, 7); }
    var egeo = new THREE.BufferGeometry(); egeo.setAttribute('position', new THREE.BufferAttribute(ep, 3));
    scene.add(new THREE.Points(egeo, new THREE.PointsMaterial({ map: dot(THREE), alphaTest: 0.01, color: 0xffc766, size: 1.2, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })));

    S.onClick = function () { var r = ripples[S.clicks % 5]; r.userData.t = 0; };
    function place() { torii.scale.setScalar(S.mobile ? 0.62 : 0.95); torii.position.set(S.mobile ? 0 : 20, S.mobile ? 2 : -4, -22); }
    S.onResize = place; place();

    return function (t, dt) {
      var p = pgeo.attributes.position.array;
      for (var i = 0; i < NP; i++) {
        p[i * 3] += (pv[i * 3] + Math.sin(t * 0.8 + i) * 2.2) * dt; p[i * 3 + 1] += pv[i * 3 + 1] * dt; p[i * 3 + 2] += pv[i * 3 + 2] * dt;
        if (p[i * 3 + 1] < -20) { p[i * 3 + 1] = 50; p[i * 3] = rnd(-90, 90); }
      }
      pgeo.attributes.position.needsUpdate = true;
      var e = egeo.attributes.position.array;
      for (var j = 0; j < NE; j++) { e[j * 3 + 1] += ev[j] * dt; e[j * 3] += Math.sin(t + j) * dt; if (e[j * 3 + 1] > 42) e[j * 3 + 1] = -20; }
      egeo.attributes.position.needsUpdate = true;
      ripples.forEach(function (r) { r.userData.t += dt * 0.12; if (r.userData.t > 1) r.userData.t = 0; var k = r.userData.t; r.scale.setScalar(4 + k * 70); r.material.opacity = (1 - k) * 0.5; });
      gold.intensity = 2.2 + Math.sin(t * 2.6) * 0.3 + S.boost * 3;
      moon.position.y = 30 + S.scroll * 12;
      camera.position.set(S.mouse.x * 9, 2 + S.mouse.y * 4 - S.scroll * 4, 62 - Math.min(S.scroll, 2) * 8); camera.lookAt(0, 4 - S.scroll * 4, -22);
    };
  };

  /* =====================================================================
     STARS: calm field for leaderboard, apply, admin
     ===================================================================== */
  CS.scenes.stars = function (THREE, scene, camera, S) {
    var cols = [0xa8d8ff, 0xc8b4ff, 0xffd0e4, 0xffffff];
    var a = stars(THREE, S.mobile ? 1400 : 3000, cols, 330, 800, 2.4); scene.add(a);
    var b = stars(THREE, S.mobile ? 500 : 1100, cols, 140, 320, 1.6); scene.add(b);
    scene.add(glow(THREE, '#7b6bff', 260, [0, 0, -220], 0.35));
    return function (t) {
      a.rotation.y = t * 0.02 + S.mouse.x * 0.06; a.rotation.x = S.mouse.y * 0.05; b.rotation.y = -t * 0.035;
      camera.position.set(S.mouse.x * 6, S.mouse.y * 4, 80 - S.scroll * 10); camera.lookAt(0, 0, 0);
    };
  };
})();
