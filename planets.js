/* Procedural planets (no image files): Earth, Mars, Jupiter, Saturn, Venus, Uranus, Neptune, Moon.
   Textures are painted on a canvas from 3D value-noise sampled over the sphere, so they are seamless and pole-safe. */
(function () {
  'use strict';
  var CS = window.CS;
  function hash(x, y, z) { var h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); }
  function sm(t) { return t * t * (3 - 2 * t); }
  function vn(x, y, z) {
    var ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = sm(x - ix), fy = sm(y - iy), fz = sm(z - iz);
    function L(a, b, t) { return a + (b - a) * t; }
    return L(L(L(hash(ix, iy, iz), hash(ix + 1, iy, iz), fx), L(hash(ix, iy + 1, iz), hash(ix + 1, iy + 1, iz), fx), fy),
      L(L(hash(ix, iy, iz + 1), hash(ix + 1, iy, iz + 1), fx), L(hash(ix, iy + 1, iz + 1), hash(ix + 1, iy + 1, iz + 1), fx), fy), fz);
  }
  function fbm(x, y, z, o) { var s = 0, a = 0.5; for (var i = 0; i < (o || 4); i++) { s += a * vn(x, y, z); x *= 2.03; y *= 2.03; z *= 2.03; a *= 0.5; } return s; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function ramp(stops, t) {
    t = Math.max(0, Math.min(1, t));
    for (var i = 1; i < stops.length; i++) if (t <= stops[i][0]) { var a = stops[i - 1], b = stops[i]; return mix(a[1], b[1], (t - a[0]) / (b[0] - a[0] || 1)); }
    return stops[stops.length - 1][1];
  }
  var P = {
    earth: function (x, y, z, lat) {
      var n = fbm(x * 2.1 + 3, y * 2.1, z * 2.1), land = n > 0.52;
      var c;
      if (land) { var e = (n - 0.52) * 4; c = ramp([[0, [60, 120, 52]], [0.4, [96, 140, 60]], [0.7, [150, 128, 84]], [1, [220, 214, 200]]], e + Math.abs(lat) * 0.35 - 0.1); }
      else c = ramp([[0, [8, 30, 84]], [1, [28, 96, 170]]], n * 1.6);
      if (Math.abs(lat) > 0.86) c = mix(c, [240, 246, 255], Math.min(1, (Math.abs(lat) - 0.86) * 9));
      return c;
    },
    mars: function (x, y, z, lat) {
      var n = fbm(x * 2.6, y * 2.6, z * 2.6, 5), d = fbm(x * 5 + 9, y * 5, z * 5, 3);
      var c = ramp([[0, [120, 52, 30]], [0.5, [190, 98, 56]], [1, [226, 150, 98]]], n * 1.3);
      c = mix(c, [70, 34, 26], Math.max(0, d - 0.58) * 3.2);
      if (Math.abs(lat) > 0.9) c = mix(c, [246, 240, 236], Math.min(1, (Math.abs(lat) - 0.9) * 12));
      return c;
    },
    jupiter: function (x, y, z, lat, lon) {
      var w = fbm(x * 3, y * 9, z * 3, 4) * 0.12 + Math.sin(lat * 20 + fbm(x * 2, y * 2, z * 2) * 4) * 0.5 + 0.5;
      var c = ramp([[0, [128, 84, 60]], [0.3, [196, 150, 110]], [0.55, [236, 218, 190]], [0.8, [184, 124, 84]], [1, [236, 210, 176]]], w);
      var dx = Math.atan2(Math.sin(lon - 0.6), Math.cos(lon - 0.6)), dy = lat + 0.28, r = (dx * dx) / 0.05 + (dy * dy) / 0.008;
      if (r < 1) c = mix(c, [176, 62, 36], (1 - r) * 0.95);
      return c;
    },
    saturn: function (x, y, z, lat) {
      var w = Math.sin(lat * 15 + fbm(x * 2, y * 4, z * 2) * 2.5) * 0.5 + 0.5;
      return ramp([[0, [176, 142, 92]], [0.5, [226, 202, 150]], [1, [238, 222, 182]]], w);
    },
    venus: function (x, y, z) { var n = fbm(x * 2 + y * 0.5, y * 3, z * 2, 5); return ramp([[0, [176, 120, 54]], [0.5, [226, 184, 112]], [1, [246, 224, 170]]], n * 1.4); },
    uranus: function (x, y, z, lat) { return mix([112, 200, 214], [168, 232, 236], Math.sin(lat * 6 + fbm(x, y, z) * 1.5) * 0.5 + 0.5); },
    neptune: function (x, y, z, lat) {
      var c = mix([30, 64, 176], [70, 120, 224], fbm(x * 2, y * 5, z * 2) + Math.sin(lat * 10) * 0.12);
      var d = fbm(x * 3 + 5, y * 3, z * 3); if (d > 0.66) c = mix(c, [220, 236, 255], (d - 0.66) * 3);
      return c;
    },
    moon: function (x, y, z) {
      var n = fbm(x * 3, y * 3, z * 3, 5), cr = vn(x * 9, y * 9, z * 9), v = 120 + n * 90;
      if (cr > 0.72) v -= (cr - 0.72) * 180;
      return [v, v, v * 0.97];
    }
  };
  function paint(kind, w, h, THREE) {
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var cx = cv.getContext('2d'), img = cx.createImageData(w, h), f = P[kind];
    for (var j = 0; j < h; j++) {
      var lat = Math.PI / 2 - (j + 0.5) / h * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat);
      for (var i = 0; i < w; i++) {
        var lon = (i + 0.5) / w * Math.PI * 2, c = f(cl * Math.cos(lon), sl, cl * Math.sin(lon), lat / (Math.PI / 2), lon), k = (j * w + i) * 4;
        img.data[k] = c[0]; img.data[k + 1] = c[1]; img.data[k + 2] = c[2]; img.data[k + 3] = 255;
      }
    }
    cx.putImageData(img, 0, 0);
    var t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t;
  }
  function cloudTex(w, h, THREE) {
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var cx = cv.getContext('2d'), img = cx.createImageData(w, h);
    for (var j = 0; j < h; j++) {
      var lat = Math.PI / 2 - (j + 0.5) / h * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat);
      for (var i = 0; i < w; i++) {
        var lon = (i + 0.5) / w * Math.PI * 2, n = fbm(cl * Math.cos(lon) * 3.4 + 40, sl * 3.4, cl * Math.sin(lon) * 3.4, 5), a = Math.max(0, n - 0.5) * 3.2, k = (j * w + i) * 4;
        img.data[k] = img.data[k + 1] = img.data[k + 2] = 255; img.data[k + 3] = Math.min(255, a * 255);
      }
    }
    cx.putImageData(img, 0, 0); return new THREE.CanvasTexture(cv);
  }
  function ringTex(THREE) {
    var cv = document.createElement('canvas'); cv.width = 512; cv.height = 4; var cx = cv.getContext('2d'), g = cx.createLinearGradient(0, 0, 512, 0);
    var s = [[0, 'rgba(0,0,0,0)'], [0.08, 'rgba(180,160,120,.35)'], [0.18, 'rgba(226,206,160,.85)'], [0.34, 'rgba(206,184,140,.7)'], [0.38, 'rgba(0,0,0,.05)'], [0.43, 'rgba(0,0,0,.05)'], [0.46, 'rgba(236,216,172,.9)'], [0.7, 'rgba(210,190,150,.8)'], [0.85, 'rgba(180,160,120,.5)'], [1, 'rgba(0,0,0,0)']];
    s.forEach(function (a) { g.addColorStop(a[0], a[1]); }); cx.fillStyle = g; cx.fillRect(0, 0, 512, 4);
    return new THREE.CanvasTexture(cv);
  }
  var ATM = {
    vs: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fs: 'uniform vec3 uC; uniform float uP; varying vec3 vN; void main(){ float i = pow(max(0.0, 0.72 - dot(vN, vec3(0.0, 0.0, 1.0))), uP); gl_FragColor = vec4(uC, 1.0) * i; }'
  };
  /* CS.planet(THREE, kind, radius, {mobile}) -> Group (group.userData.spin = rad/s, .clouds, .update(dt)) */
  CS.planet = function (THREE, kind, r, opt) {
    opt = opt || {};
    var lo = opt.mobile, tw = lo ? 256 : 512, th = tw / 2, g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    var seg = lo ? 32 : 56;
    var mesh = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), new THREE.MeshLambertMaterial({ map: paint(kind, tw, th, THREE) }));
    body.add(mesh);
    var tilt = { earth: 0.41, mars: 0.44, jupiter: 0.05, saturn: 0.47, uranus: 1.7, neptune: 0.5, venus: 0.1, moon: 0.1 }[kind] || 0.2;
    body.rotation.z = tilt;
    var atm = { earth: [[0.3, 0.6, 1], 3.2, 1.12], venus: [[1, 0.8, 0.4], 3.6, 1.1], mars: [[1, 0.5, 0.3], 4.2, 1.07], uranus: [[0.5, 0.9, 1], 3.2, 1.1], neptune: [[0.3, 0.5, 1], 3, 1.1], jupiter: [[1, 0.8, 0.6], 4, 1.06], saturn: [[1, 0.9, 0.6], 4, 1.06] }[kind];
    if (atm) {
      var am = new THREE.Mesh(new THREE.SphereGeometry(r * atm[2], seg, seg), new THREE.ShaderMaterial({ vertexShader: ATM.vs, fragmentShader: ATM.fs, uniforms: { uC: { value: new THREE.Vector3(atm[0][0], atm[0][1], atm[0][2]) }, uP: { value: atm[1] } }, side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
      g.add(am);
    }
    var clouds = null;
    if (kind === 'earth') { clouds = new THREE.Mesh(new THREE.SphereGeometry(r * 1.012, seg, seg), new THREE.MeshLambertMaterial({ map: cloudTex(tw, th, THREE), transparent: true, opacity: 0.9, depthWrite: false })); body.add(clouds); }
    if (kind === 'saturn') {
      var ri = r * 1.35, ro = r * 2.4, rg = new THREE.RingGeometry(ri, ro, 96, 1), pos = rg.attributes.position, uv = rg.attributes.uv, v = new THREE.Vector3();
      for (var i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); uv.setXY(i, (v.length() - ri) / (ro - ri), 0.5); }
      var ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: ringTex(THREE), transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: 0.95 }));
      ring.rotation.x = Math.PI / 2; body.add(ring);
    }
    g.userData.spin = { earth: 0.25, mars: 0.24, jupiter: 0.6, saturn: 0.55, venus: -0.04, uranus: 0.3, neptune: 0.32, moon: 0.05 }[kind] || 0.2;
    g.userData.body = mesh; g.userData.clouds = clouds; g.userData.radius = r;
    g.userData.update = function (dt) { mesh.rotation.y += g.userData.spin * dt; if (clouds) clouds.rotation.y += g.userData.spin * 1.35 * dt; };
    return g;
  };
  CS.sunLight = function (THREE, scene, strength) {
    var d = new THREE.DirectionalLight(0xfff1dc, strength == null ? 1.7 : strength); d.position.set(-60, 40, 80); scene.add(d);
    scene.add(new THREE.AmbientLight(0x28304f, 1.1)); return d;
  };
})();
