/* Shared behaviour for every page: boot screen, nav/footer, reveal, tilt, counters, data loading, 3D scene runner. */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var CS = window.CS = { reduce: reduce, coarse: coarse, $: $, $$: $$, esc: esc, scenes: {} };

  var GANGS = CS.GANGS = {
    celestial: { key: 'celestial', name: 'Celestial Syndicate', short: 'Celestial', file: 'celestial.json', page: 'index.html' },
    asuka: { key: 'asuka', name: 'ASUKA', short: 'ASUKA', file: 'asuka.json', page: 'asuka.html' },
    zm: { key: 'zm', name: 'ZM', short: 'ZM', file: 'zm.json', page: 'zm.html' },
    toman: { key: 'toman', name: 'TOMAN', short: 'TOMAN', file: 'toman.json', page: 'toman.html' }
  };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  CS.fmtDate = function (iso) { var p = String(iso || '').split('-'); return p.length === 3 ? p[2] + ' ' + MONTHS[+p[1] - 1] + ' ' + p[0] : '—'; };

  /* ---------- data ---------- */
  CS.load = function (keys) {
    return Promise.all(keys.map(function (k) {
      return fetch(GANGS[k].file, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(GANGS[k].file + ' (HTTP ' + r.status + ')'); return r.json(); });
    })).then(function (arr) { var o = {}; keys.forEach(function (k, i) { o[k] = arr[i]; }); return o; });
  };
  CS.slug = function (n) { return String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'member'; };
  CS.ids = function (members) {
    var seen = {};
    return (members || []).map(function (m) {
      var base = m.id ? CS.slug(m.id) : CS.slug(m.name), id = base, n = 2;
      while (seen[id]) id = base + '-' + (n++);
      seen[id] = 1; return id;
    });
  };
  CS.mlink = function (gang, id) { return 'member.html?g=' + encodeURIComponent(gang) + '&m=' + encodeURIComponent(id); };
  CS.json = function (url) { return fetch(url, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(url + ' (HTTP ' + r.status + ')'); return r.json(); }); };
  CS.countdown = function (el, iso, onZero) {
    var t = new Date(iso).getTime();
    function tick() {
      var d = Math.max(0, t - Date.now()), s = Math.floor(d / 1000);
      var v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
      el.innerHTML = ['Days', 'Hours', 'Min', 'Sec'].map(function (l, i) { return '<div><b>' + String(v[i]).padStart(2, '0') + '</b><span>' + l + '</span></div>'; }).join('');
      if (d === 0) { clearInterval(h); if (onZero) onZero(); }
    }
    tick(); var h = setInterval(tick, 1000);
  };
  CS.THEMES = {
    celestial: { '--a1': '#7fd6ff', '--a2': '#a468ff', '--a3': '#ff5fa8', '--on-a': '#04050d' },
    asuka: { '--bg': '#0a0305', '--fg': '#ffeef0', '--mute': '#c99aa2', '--a1': '#ff2b3a', '--a2': '#ff8a2b', '--a3': '#ffb347', '--on-a': '#0a0305', '--card': 'rgba(26,6,10,.74)', '--line': 'rgba(255,60,75,.3)', '--nav-bg': 'rgba(10,3,5,.82)', '--r': '0', '--f-display': '"Russo One","Arial Black",sans-serif', '--f-body': '"Chakra Petch","Segoe UI",sans-serif', '--f-mono': '"Chakra Petch",ui-monospace,monospace', fonts: 'Russo+One&family=Chakra+Petch:wght@400;500;600;700' },
    zm: { '--bg': '#12040f', '--fg': '#ffeaf6', '--mute': '#d9a8c8', '--a1': '#ff4fa3', '--a2': '#c64bff', '--a3': '#ffc2e2', '--on-a': '#1a0314', '--card': 'rgba(42,8,36,.56)', '--line': 'rgba(255,120,200,.26)', '--nav-bg': 'rgba(18,4,15,.72)', '--r': '26px', '--f-display': 'Fraunces,Georgia,serif', '--f-body': 'Outfit,"Segoe UI",sans-serif', '--f-mono': 'Outfit,sans-serif', fonts: 'Fraunces:wght@400;600;800&family=Outfit:wght@300;400;500;600' },
    toman: { '--bg': '#070605', '--fg': '#f6ecd8', '--mute': '#bba98a', '--a1': '#f0c05a', '--a2': '#e3202a', '--a3': '#ffe2a0', '--on-a': '#120d05', '--card': 'rgba(18,13,8,.72)', '--line': 'rgba(240,192,90,.3)', '--nav-bg': 'rgba(7,6,5,.82)', '--r': '2px', '--f-display': '"Noto Serif JP","Hiragino Mincho ProN",serif', '--f-body': '"Noto Sans JP","Hiragino Sans",sans-serif', '--f-mono': '"Noto Sans JP",sans-serif', fonts: 'Noto+Serif+JP:wght@500;700;900&family=Noto+Sans+JP:wght@400;500;700' }
  };
  CS.applyTheme = function (key) {
    var t = CS.THEMES[key]; if (!t) return;
    var r = document.documentElement.style;
    Object.keys(t).forEach(function (k) { if (k.charAt(0) === '-') r.setProperty(k, t[k]); });
    if (t.fonts) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=' + t.fonts + '&display=swap'; document.head.appendChild(l); }
  };
  CS.tier = function (m) { return m && m.tier === 'lead' ? 'lead' : (m && m.tier === 'high' ? 'high' : ''); };
  CS.roster = function (el, members, emptyTitle, emptyText, gang) {
    if (!el) return;
    if (!members || !members.length) {
      el.innerHTML = '<div class="empty"><b>' + esc(emptyTitle || 'Roster is being assembled') + '</b>' + esc(emptyText || 'Members will appear here soon.') + '</div>';
      return;
    }
    var ids = CS.ids(members);
    el.innerHTML = members.map(function (m, i) {
      return '<a class="mem rv" data-tilt href="' + (gang ? esc(CS.mlink(gang, ids[i])) : '#') + '"><span class="idx">' + String(i + 1).padStart(2, '0') + '</span><span class="nm">' + esc(m.name) + '</span><span class="badge ' + CS.tier(m) + '">' + esc(m.rank) + '</span></a>';
    }).join('');
    CS.reveal(el); CS.tilt(el);
  };

  /* ---------- chrome ---------- */
  CS.chrome = function (active) {
    var items = [['index.html', 'Hub', 'hub'], ['asuka.html', 'ASUKA', 'asuka'], ['zm.html', 'ZM', 'zm'], ['toman.html', 'TOMAN', 'toman'], ['events.html', 'Events', 'events'], ['rules.html', 'Rules', 'rules'], ['gallery.html', 'Gallery', 'gallery'], ['leaderboard.html', 'Leaderboard', 'leaderboard'], ['apply.html', 'Apply', 'apply']];
    function lk(it, cls) { var on = it[2] === active; return '<a href="' + it[0] + '" class="' + (cls || '') + (on ? ' on' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' + it[1] + '</a>'; }
    var gangOn = ['asuka', 'zm', 'toman'].indexOf(active) > -1, expOn = ['events', 'rules', 'gallery', 'cosmos'].indexOf(active) > -1;
    function ddm(label, on, inner) { return '<div class="dd"><button type="button" class="ddb' + (on ? ' on' : '') + '" aria-haspopup="true" aria-expanded="false">' + label + ' &#9662;</button><div class="ddm">' + inner + '</div></div>'; }
    var links = lk(items[0]) + ddm('Gangs', gangOn, lk(items[1]) + lk(items[2]) + lk(items[3])) + ddm('Explore', expOn, lk(items[4]) + lk(items[5]) + lk(items[6]) + lk(['cosmos.html', 'Cosmos', 'cosmos'])) + lk(items[7]) + lk(items[8], 'nav-cta');
    var nav = document.createElement('header');
    nav.className = 'nav'; nav.id = 'nav';
    nav.innerHTML = '<div class="wrap nav-in"><a class="brand" href="index.html">Celestial &#10022; Syndicate</a><button type="button" class="burger" aria-label="Menu" aria-expanded="false" aria-controls="mainlinks"><i></i></button><nav class="links" id="mainlinks" aria-label="Main">' + links + '</nav></div>';
    document.body.insertBefore(nav, document.body.firstChild);
    var f = document.createElement('footer');
    f.innerHTML = '<div class="wrap"><div class="fl">' + items.concat([['cosmos.html', 'Cosmos']]).map(function (it) { return '<a href="' + it[0] + '">' + it[1] + '</a>'; }).join('') + '</div>Celestial Syndicate &middot; Allied with ASUKA &middot; ZM &middot; TOMAN &middot; &copy; ' + new Date().getFullYear() + '</div>';
    document.body.appendChild(f);
    addEventListener('scroll', function () { nav.classList.toggle('scrolled', scrollY > 40); }, { passive: true });
    var dds = $$('.dd', nav), bg = $('.burger', nav);
    dds.forEach(function (d) {
      var b = $('.ddb', d);
      b.addEventListener('click', function (e) { e.stopPropagation(); var o = !d.classList.contains('open'); dds.forEach(function (x) { x.classList.remove('open'); $('.ddb', x).setAttribute('aria-expanded', 'false'); }); d.classList.toggle('open', o); b.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    });
    document.addEventListener('click', function () { dds.forEach(function (x) { x.classList.remove('open'); $('.ddb', x).setAttribute('aria-expanded', 'false'); }); });
    function setNav(o) { nav.classList.toggle('open', o); document.body.classList.toggle('navopen', o); bg.setAttribute('aria-expanded', o ? 'true' : 'false'); }
    bg.addEventListener('click', function (e) { e.stopPropagation(); setNav(!nav.classList.contains('open')); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });
    addEventListener('resize', function () { if (innerWidth > 900) setNav(false); });
    $$('.links a', nav).forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
  };

  /* ---------- boot screen ---------- */
  CS.boot = function (cfg) {
    var root = document.documentElement;
    if (root.classList.contains('no-boot')) return;
    var b = document.createElement('div');
    b.id = 'boot'; b.setAttribute('role', 'status'); b.setAttribute('aria-live', 'polite');
    b.innerHTML = '<div class="boot-art" aria-hidden="true">' + (cfg.art || '') + '</div><div class="boot-logo">' + (cfg.title || 'Celestial Syndicate') + '</div><div class="boot-bar"><span id="bfill"></span></div><div class="boot-meta"><span id="bmsg"></span><span id="bpct">0%</span></div>';
    document.body.appendChild(b);
    var msgs = cfg.msgs || [[0, 'Loading']];
    var DUR = reduce ? 400 : (cfg.dur || 2400), t0 = performance.now(), done = false;
    function tick(now) {
      var p = Math.min(1, (now - t0) / DUR), e = 1 - Math.pow(1 - p, 2.2), pct = Math.round(e * 100);
      $('#bfill').style.width = pct + '%'; $('#bpct').textContent = pct + '%';
      for (var i = msgs.length - 1; i >= 0; i--) { if (pct >= msgs[i][0]) { $('#bmsg').textContent = msgs[i][1]; break; } }
      if (p < 1) requestAnimationFrame(tick);
      else if (!done) {
        done = true;
        try { sessionStorage.setItem('cs_boot', '1'); } catch (e) { }
        setTimeout(function () { b.classList.add('done'); setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 900); }, 300);
      }
    }
    requestAnimationFrame(tick);
  };

  /* ---------- reveal, tilt, counters, cursor ---------- */
  var io = null;
  CS.reveal = function (root) {
    var els = $$('.rv', root || document).filter(function (e) { return !e.classList.contains('in'); });
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    if (!io) io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { var d = (+e.target.dataset.d || 0); setTimeout(function () { e.target.classList.add('in'); }, d); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (e, i) { if (!e.dataset.d) e.dataset.d = (i % 6) * 70; io.observe(e); });
    setTimeout(function () { els.forEach(function (e) { e.classList.add('in'); }); }, 4000);
  };
  CS.tilt = function (root) {
    if (coarse || reduce) return;
    $$('[data-tilt]', root || document).forEach(function (el) {
      if (el.__tilt) return; el.__tilt = 1;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = 'perspective(900px) rotateY(' + (x * 12) + 'deg) rotateX(' + (-y * 12) + 'deg) translateY(-4px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  };
  CS.counters = function (root) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, target = +el.dataset.count, start = performance.now();
        cio.unobserve(el);
        if (reduce || !target) { el.textContent = target; return; }
        (function step(now) { var p = Math.min((now - start) / 1400, 1); el.textContent = Math.floor(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); else el.textContent = target; })(start);
      });
    }, { threshold: 0.5 });
    $$('[data-count]', root || document).forEach(function (el) { if (el.__c) return; el.__c = 1; cio.observe(el); });
  };
  CS.cursor = function () {
    if (coarse) return;
    var c = document.createElement('div'); c.className = 'cur'; document.body.appendChild(c);
    var mx = 0, my = 0, cx = 0, cy = 0;
    addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function a() { cx += (mx - cx) * .22; cy += (my - cy) * .22; c.style.transform = 'translate(' + cx + 'px,' + cy + 'px)'; requestAnimationFrame(a); })();
    document.addEventListener('mouseover', function (e) { c.classList.toggle('hov', !!e.target.closest('a,button,[data-tilt],.pill,select,input,textarea')); });
  };

  /* ---------- 3D scene runner ---------- */
  CS.scene = function (build) {
    if (typeof THREE === 'undefined') { document.documentElement.classList.add('webgl-off'); return null; }
    var renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: !coarse, alpha: true, powerPreference: 'high-performance' }); }
    catch (e) { document.documentElement.classList.add('webgl-off'); return null; }
    var canvas = renderer.domElement; canvas.id = 'fx'; canvas.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(canvas, document.body.firstChild);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 4000);
    var S = { mouse: { x: 0, y: 0, tx: 0, ty: 0 }, scroll: 0, mobile: innerWidth < 700, boost: 0, clicks: 0, w: 1, h: 1 };
    function resize() {
      S.w = innerWidth; S.h = innerHeight; S.mobile = S.w < 700;
      renderer.setSize(S.w, S.h, false); camera.aspect = S.w / S.h; camera.updateProjectionMatrix();
      if (S.onResize) S.onResize();
    }
    addEventListener('resize', resize);
    addEventListener('pointermove', function (e) { S.mouse.tx = (e.clientX / innerWidth) * 2 - 1; S.mouse.ty = -((e.clientY / innerHeight) * 2 - 1); }, { passive: true });
    addEventListener('pointerdown', function (e) { if (e.target.closest('a,button,input,select,textarea,label')) return; S.clicks++; S.boost = 1; if (S.onClick) S.onClick(); }, { passive: true });
    addEventListener('scroll', function () { S.scroll = Math.min(scrollY / Math.max(innerHeight, 1), 3); }, { passive: true });
    S.scroll = Math.min(scrollY / Math.max(innerHeight, 1), 3);
    resize();
    var update = build(THREE, scene, camera, S) || function () { };
    var clock = new THREE.Clock(), t = 0;
    function frame() {
      var dt = Math.min(clock.getDelta(), 0.05);
      t += dt;
      var m = S.mouse; m.x += (m.tx - m.x) * 0.05; m.y += (m.ty - m.y) * 0.05;
      S.boost *= 0.96;
      update(t, dt);
      renderer.render(scene, camera);
    }
    if (reduce) {
      for (var i = 0; i < 40; i++) frame();
      addEventListener('resize', frame); addEventListener('scroll', frame, { passive: true });
    } else {
      (function loop() { requestAnimationFrame(loop); if (!document.hidden) frame(); })();
    }
    return S;
  };

  /* ---------- page init ---------- */
  CS.fx = function () {
    var sp = document.createElement('div'); sp.className = 'sp'; document.body.appendChild(sp);
    var tp = document.createElement('button'); tp.type = 'button'; tp.className = 'top'; tp.setAttribute('aria-label', 'Back to top'); tp.innerHTML = '&#8593;'; document.body.appendChild(tp);
    tp.addEventListener('click', function () { scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
    var tk = false;
    function sc() { if (tk) return; tk = true; requestAnimationFrame(function () { tk = false; var h = document.documentElement.scrollHeight - innerHeight; sp.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')'; tp.classList.toggle('show', scrollY > 600); }); }
    addEventListener('scroll', sc, { passive: true }); sc();
    if (!reduce) {
      var m = document.createElement('div'); m.className = 'met'; m.setAttribute('aria-hidden', 'true'); document.body.insertBefore(m, document.body.firstChild);
      (function shoot() {
        if (!document.hidden) {
          var i = document.createElement('i'), a = 18 + Math.random() * 22, d = 380 + Math.random() * 320, r = a * Math.PI / 180;
          i.style.cssText = 'left:' + (Math.random() * 90 - 5) + '%;top:' + (Math.random() * 45) + '%;--ang:' + a + 'deg;--dx:' + (Math.cos(r) * d) + 'px;--dy:' + (Math.sin(r) * d) + 'px;--dur:' + (0.9 + Math.random() * 0.8) + 's';
          m.appendChild(i); setTimeout(function () { if (i.parentNode) i.parentNode.removeChild(i); }, 2000);
        }
        setTimeout(shoot, (coarse ? 5000 : 2800) + Math.random() * 4500);
      })();
    }
    document.addEventListener('pointerdown', function (e) {
      var b = e.target.closest('.btn'); if (!b || reduce) return;
      var r = b.getBoundingClientRect(), z = Math.max(r.width, r.height) * 2, s = document.createElement('span');
      s.className = 'rp'; s.style.cssText = 'width:' + z + 'px;height:' + z + 'px;left:' + (e.clientX - r.left - z / 2) + 'px;top:' + (e.clientY - r.top - z / 2) + 'px';
      b.appendChild(s); setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 650);
    });
    if (!coarse) document.addEventListener('pointermove', function (e) {
      var t = e.target.closest && e.target.closest('.panel,.ev,.ps,.mem');
      if (t) { var r = t.getBoundingClientRect(); t.style.setProperty('--mx', (e.clientX - r.left) + 'px'); t.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
      var b = e.target.closest && e.target.closest('.btn');
      if (b && !reduce) { var q = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((e.clientX - q.left - q.width / 2) * 0.12) + 'px,' + ((e.clientY - q.top - q.height / 2) * 0.2) + 'px)'; }
    }, { passive: true });
    if (!coarse) document.addEventListener('pointerout', function (e) { var b = e.target.closest && e.target.closest('.btn'); if (b) b.style.transform = ''; });
    /* text scramble on section kickers */
    var G = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    function scr(el) { var t = el.textContent, n = 0, h = setInterval(function () { el.textContent = t.split('').map(function (c, i) { return c === ' ' || i < n ? c : G[Math.floor(Math.random() * G.length)]; }).join(''); n += 1 / 1.4; if (n >= t.length) { el.textContent = t; clearInterval(h); } }, 32); }
    if (!reduce && 'IntersectionObserver' in window) {
      var so = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { so.unobserve(e.target); scr(e.target); } }); }, { threshold: 0.6 });
      $$('.kick, .eyebrow').forEach(function (k) { if (k.children.length === 0 && k.textContent.length < 40) so.observe(k); });
    }
  };
  CS.init = function (cfg) {
    cfg = cfg || {};
    CS.chrome(cfg.active);
    if (cfg.boot) CS.boot(cfg.boot);
    CS.reveal(); CS.tilt(); CS.counters(); CS.cursor(); CS.fx();
    $$('[data-scroll]').forEach(function (b) { b.addEventListener('click', function () { var t = document.getElementById(b.dataset.scroll); if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }); });
  };
})();
