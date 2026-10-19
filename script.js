(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get(k, d) { try { const v = localStorage.getItem('w12_' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('w12_' + k, JSON.stringify(v)); } catch {} }
};

/* ---------- Boot / lock / unlock ---------- */
const boot = $('#boot'), lock = $('#lock'), desktop = $('#desktop');
function startBoot() {
  boot.classList.remove('hidden'); lock.classList.add('hidden'); desktop.classList.add('hidden');
  setTimeout(() => { boot.classList.add('hidden'); lock.classList.remove('hidden'); }, 2200);
}
function unlock() {
  if (lock.classList.contains('hidden')) return;
  lock.classList.add('hidden'); desktop.classList.remove('hidden');
}
lock.addEventListener('click', unlock);
document.addEventListener('keydown', () => unlock());

/* ---------- Clock ---------- */
const pad = n => String(n).padStart(2, '0');
function tick() {
  const d = new Date();
  const t = `${d.getHours() % 12 || 12}:${pad(d.getMinutes())}`;
  $('#lockTime').textContent = t;
  $('#lockDate').textContent = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  $('#tbTime').textContent = t + (d.getHours() >= 12 ? ' PM' : ' AM');
  $('#tbDate').textContent = d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
}
setInterval(tick, 1000); tick();

/* ---------- Theme / wallpaper / accent ---------- */
const WALLS = ['0', '1', '2', '3'];
const ACCENTS = ['#4f8cff', '#9b5cff', '#ff5c8a', '#18c48f', '#ff9f43', '#00c2ff'];
function applyTheme(t) { document.body.dataset.theme = t; store.set('theme', t); }
function applyWall(w) { document.body.dataset.wall = w; store.set('wall', w); }
function applyAccent(c) { document.documentElement.style.setProperty('--accent', c); store.set('accent', c); }
applyTheme(store.get('theme', 'dark')); applyWall(store.get('wall', '0')); applyAccent(store.get('accent', ACCENTS[0]));
const toggleTheme = () => applyTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark');
const nextWall = () => applyWall(WALLS[(WALLS.indexOf(document.body.dataset.wall) + 1) % WALLS.length]);

/* ---------- Window manager ---------- */
const winLayer = $('#windows'), tbApps = $('#tbApps');
const open = new Map(); // id -> {el, btn, app}
let z = 10, cascade = 0;

function focusWin(id) {
  open.forEach((w, k) => { w.el.classList.toggle('focus', k === id); w.btn.classList.toggle('active', k === id && !w.el.classList.contains('min')); });
  const w = open.get(id); if (w) w.el.style.zIndex = ++z;
}
function launch(appId) {
  const app = APPS.find(a => a.id === appId); if (!app) return;
  closePanels();
  if (open.has(appId)) {
    const w = open.get(appId); w.el.classList.remove('min'); focusWin(appId); return;
  }
  const el = document.createElement('div');
  el.className = 'win';
  const W = Math.min(app.w, innerWidth - 20), H = Math.min(app.h, innerHeight - 100);
  el.style.cssText = `width:${W}px;height:${H}px;left:${Math.max(10, 90 + cascade * 28)}px;top:${Math.max(10, 40 + cascade * 28)}px`;
  cascade = (cascade + 1) % 8;
  el.innerHTML = `<div class="titlebar"><span>${app.icon}</span><span class="t">${app.name}</span><button class="mn" title="Minimize">—</button><button class="mx" title="Maximize">▢</button><button class="x" title="Close">✕</button></div><div class="body"></div>`;
  winLayer.appendChild(el);
  app.render($('.body', el), el);
  const btn = document.createElement('button');
  btn.className = 'tb-btn run'; btn.title = app.name; btn.textContent = app.icon;
  btn.onclick = () => {
    const w = open.get(appId);
    if (w.el.classList.contains('min')) { w.el.classList.remove('min'); focusWin(appId); }
    else if (w.el.classList.contains('focus')) { w.el.classList.add('min'); w.btn.classList.remove('active'); }
    else focusWin(appId);
  };
  tbApps.appendChild(btn);
  open.set(appId, { el, btn, app });
  el.addEventListener('mousedown', () => focusWin(appId));
  $('.mn', el).onclick = () => { el.classList.add('min'); btn.classList.remove('active'); };
  $('.mx', el).onclick = () => el.classList.toggle('max');
  $('.x', el).onclick = () => { el.remove(); btn.remove(); open.delete(appId); if (app.onClose) app.onClose(); };
  const tb = $('.titlebar', el);
  tb.addEventListener('dblclick', e => { if (e.target === tb || e.target.classList.contains('t')) el.classList.toggle('max'); });
  drag(el, tb);
  focusWin(appId);
}
function drag(el, handle) {
  handle.addEventListener('pointerdown', e => {
    if (e.target.tagName === 'BUTTON' || el.classList.contains('max')) return;
    const sx = e.clientX - el.offsetLeft, sy = e.clientY - el.offsetTop;
    handle.setPointerCapture(e.pointerId);
    const mv = ev => {
      el.style.left = Math.min(Math.max(ev.clientX - sx, -el.offsetWidth + 80), innerWidth - 80) + 'px';
      el.style.top = Math.min(Math.max(ev.clientY - sy, 0), innerHeight - 100) + 'px';
    };
    const up = () => { handle.removeEventListener('pointermove', mv); handle.removeEventListener('pointerup', up); };
    handle.addEventListener('pointermove', mv); handle.addEventListener('pointerup', up);
  });
}

/* ---------- Apps ---------- */
const APPS = [
  { id: 'files', name: 'Files', icon: '📁', w: 720, h: 460, render(b) {
      const dirs = {
        Home: ['📁 Documents', '📁 Downloads', '📁 Pictures', '📁 Music', '🖼️ wallpaper.png', '📄 todo.txt'],
        Documents: ['📄 resume.docx', '📊 budget.xlsx', '📄 notes.txt', '📕 manual.pdf'],
        Downloads: ['📦 setup.zip', '🖼️ photo.jpg', '🎵 song.mp3'],
        Pictures: ['🖼️ holiday.jpg', '🖼️ cat.png', '🖼️ screenshot.png'],
        Music: ['🎵 focus.mp3', '🎵 chill.mp3']
      };
      b.innerHTML = '<div class="files"><aside></aside><main></main></div>';
      const side = $('aside', b), main = $('main', b);
      const show = k => {
        $$('div', side).forEach(d => d.classList.toggle('on', d.textContent === k));
        main.innerHTML = dirs[k].map(f => { const [i, ...n] = f.split(' '); return `<div><span>${i}</span>${n.join(' ')}</div>`; }).join('');
      };
      Object.keys(dirs).forEach(k => { const d = document.createElement('div'); d.textContent = k; d.onclick = () => show(k); side.appendChild(d); });
      show('Home');
  } },
  { id: 'browser', name: 'Nova Browser', icon: '🌐', w: 820, h: 520, render(b) {
      b.innerHTML = `<div class="browser"><form><input placeholder="Search or enter address"><button>Go</button></form><div class="home"><div><h1>Nova</h1><p style="color:var(--muted)">Search opens in a new tab (most sites block embedding).</p></div></div></div>`;
      $('form', b).onsubmit = e => {
        e.preventDefault();
        const v = $('input', b).value.trim(); if (!v) return;
        const url = /^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(v) ? 'https://' + v : /^https?:\/\//.test(v) ? v : 'https://duckduckgo.com/?q=' + encodeURIComponent(v);
        window.open(url, '_blank', 'noopener');
      };
  } },
  { id: 'copilot', name: 'Aura AI', icon: '✨', w: 440, h: 560, render(b) {
      b.innerHTML = `<div class="chat"><div class="msgs"><div class="msg a">Hi! I'm Aura, the built-in assistant of this Windows 12 concept. Try: "dark mode", "next wallpaper", "open calculator", "time", or "joke".</div></div><form><input placeholder="Ask Aura anything..."><button>Send</button></form></div>`;
      const msgs = $('.msgs', b);
      const say = (t, c) => { const m = document.createElement('div'); m.className = 'msg ' + c; m.textContent = t; msgs.appendChild(m); msgs.scrollTop = msgs.scrollHeight; };
      const jokes = ['Why do programmers prefer dark mode? Because light attracts bugs.', 'There are 10 kinds of people: those who understand binary and those who don\'t.', 'I would tell you a UDP joke, but you might not get it.'];
      $('form', b).onsubmit = e => {
        e.preventDefault();
        const inp = $('input', b), q = inp.value.trim(); if (!q) return; inp.value = ''; say(q, 'u');
        const l = q.toLowerCase(); let r;
        if (/dark|light|theme/.test(l)) { toggleTheme(); r = 'Theme switched.'; }
        else if (/wallpaper|background/.test(l)) { nextWall(); r = 'New wallpaper applied.'; }
        else if (/open (.+)/.test(l)) { const n = l.match(/open (.+)/)[1]; const a = APPS.find(x => x.id.startsWith(n.trim()) || x.name.toLowerCase().includes(n.trim())); if (a) { launch(a.id); r = 'Opening ' + a.name + '.'; } else r = "I couldn't find that app."; }
        else if (/time|clock/.test(l)) r = 'It is ' + new Date().toLocaleTimeString() + '.';
        else if (/date|day/.test(l)) r = 'Today is ' + new Date().toDateString() + '.';
        else if (/joke/.test(l)) r = jokes[Math.floor(Math.random() * jokes.length)];
        else if (/hello|hi\b|hey/.test(l)) r = 'Hello! How can I help?';
        else r = 'I\'m an offline demo, so I only know a few tricks. Try "open terminal" or "dark mode".';
        setTimeout(() => say(r, 'a'), 350);
      };
  } },
  { id: 'notepad', name: 'Notes', icon: '📝', w: 520, h: 400, render(b) {
      b.innerHTML = '<textarea class="notepad" placeholder="Start typing... (auto-saved)"></textarea>';
      const t = $('textarea', b); t.value = store.get('notes', ''); t.oninput = () => store.set('notes', t.value);
  } },
  { id: 'calc', name: 'Calculator', icon: '🧮', w: 320, h: 440, render(b) {
      b.innerHTML = '<div class="calc"><div class="scr">0</div></div>';
      const c = $('.calc', b), scr = $('.scr', b);
      let expr = '';
      const keys = ['C', '⌫', '%', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '(', ')', '='];
      keys.forEach(k => {
        const bt = document.createElement('button'); bt.textContent = k;
        if ('/*-+='.includes(k)) bt.className = 'op';
        if (k === '=') bt.style.gridColumn = 'span 4';
        bt.onclick = () => {
          if (k === 'C') expr = '';
          else if (k === '⌫') expr = expr.slice(0, -1);
          else if (k === '=') { try { if (/^[\d+\-*/().% ]+$/.test(expr)) { const v = Function('"use strict";return (' + expr.replace(/%/g, '/100') + ')')(); expr = String(+(+v).toFixed(10)); } } catch { expr = 'Error'; } }
          else { if (expr === 'Error') expr = ''; expr += k; }
          scr.textContent = expr || '0';
        };
        c.appendChild(bt);
      });
  } },
  { id: 'terminal', name: 'Terminal', icon: '⌨️', w: 600, h: 380, render(b) {
      b.innerHTML = '<div class="term"><pre>Windows 12 Terminal [Concept build]\nType "help" for commands.\n</pre><div class="in"><span>PS&gt;</span><input spellcheck="false" autocomplete="off"></div></div>';
      const term = $('.term', b), pre = $('pre', term), inp = $('input', term);
      term.onclick = () => inp.focus(); setTimeout(() => inp.focus(), 50);
      const hist = []; let hi = 0;
      const cmds = {
        help: () => 'help, clear, date, whoami, echo <text>, neofetch, theme, wall, open <app>, apps',
        date: () => new Date().toString(), whoami: () => 'sharvil\\windows12',
        clear: () => { pre.textContent = ''; return ''; },
        apps: () => APPS.map(a => a.id).join(', '),
        theme: () => { toggleTheme(); return 'ok'; }, wall: () => { nextWall(); return 'ok'; },
        neofetch: () => '   ◯◯◯    OS: Windows 12 (concept)\n  ◯◯◯◯◯   Host: Your Browser\n   ◯◯◯    Shell: PowerFake 1.0\n          NPU: Imaginary 80 TOPS',
        open: a => APPS.some(x => x.id === a) ? (launch(a), 'opening ' + a) : 'unknown app: ' + a,
        echo: (...a) => a.join(' ')
      };
      inp.onkeydown = e => {
        if (e.key === 'ArrowUp') { hi = Math.max(0, hi - 1); inp.value = hist[hi] || ''; }
        if (e.key !== 'Enter') return;
        const line = inp.value.trim(); inp.value = ''; if (!line) return;
        hist.push(line); hi = hist.length;
        pre.textContent += 'PS> ' + line + '\n';
        const [c, ...a] = line.split(/\s+/);
        const out = cmds[c] ? cmds[c](...a) : `'${c}' is not recognized.`;
        if (out) pre.textContent += out + '\n';
        term.scrollTop = term.scrollHeight;
      };
  } },
  { id: 'paint', name: 'Sketch', icon: '🎨', w: 640, h: 460, render(b) {
      b.innerHTML = '<div class="paint"><div class="bar2"><input type="color" value="#4f8cff"><input type="range" min="1" max="30" value="4"><button class="clr">Clear</button></div><canvas></canvas></div>';
      const cv = $('canvas', b), ctx = cv.getContext('2d'), col = $('input[type=color]', b), sz = $('input[type=range]', b);
      const fit = () => { const r = cv.getBoundingClientRect(); if (!r.width) return; const img = cv.width ? ctx.getImageData(0, 0, cv.width, cv.height) : null; cv.width = r.width; cv.height = r.height; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); if (img) ctx.putImageData(img, 0, 0); ctx.lineCap = 'round'; };
      setTimeout(fit, 30); new ResizeObserver(fit).observe(cv);
      let down = false;
      const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      cv.onpointerdown = e => { down = true; cv.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.moveTo(...pos(e)); };
      cv.onpointermove = e => { if (!down) return; ctx.strokeStyle = col.value; ctx.lineWidth = sz.value; ctx.lineTo(...pos(e)); ctx.stroke(); };
      cv.onpointerup = () => down = false;
      $('.clr', b).onclick = () => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); };
  } },
  { id: 'settings', name: 'Settings', icon: '⚙️', w: 560, h: 480, render(b) {
      b.innerHTML = `<div class="settings">
        <div><h3>Theme</h3><div class="seg"><button data-th="dark">Dark</button><button data-th="light">Light</button></div></div>
        <div><h3>Wallpaper</h3><div class="swatches" id="ws"></div></div>
        <div><h3>Accent color</h3><div class="swatches" id="as"></div></div></div>`;
      const wallCss = ['linear-gradient(135deg,#6a5cff,#00c6ff)', 'linear-gradient(135deg,#ffb347,#ff5e62)', 'linear-gradient(135deg,#2af598,#009efd)', 'linear-gradient(135deg,#0a0b10,#3a3f5c)'];
      const refresh = () => {
        $$('[data-th]', b).forEach(x => x.classList.toggle('on', x.dataset.th === document.body.dataset.theme));
        $$('.sw', b).forEach((x, i) => x.classList.toggle('on', String(i) === document.body.dataset.wall));
        $$('.dot', b).forEach(x => x.classList.toggle('on', x.dataset.c === getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()));
      };
      $$('[data-th]', b).forEach(x => x.onclick = () => { applyTheme(x.dataset.th); refresh(); });
      wallCss.forEach((c, i) => { const d = document.createElement('div'); d.className = 'sw'; d.style.background = c; d.onclick = () => { applyWall(String(i)); refresh(); }; $('#ws', b).appendChild(d); });
      ACCENTS.forEach(c => { const d = document.createElement('div'); d.className = 'dot'; d.dataset.c = c; d.style.background = c; d.onclick = () => { applyAccent(c); refresh(); }; $('#as', b).appendChild(d); });
      refresh();
  } },
  { id: 'about', name: 'About', icon: 'ℹ️', w: 380, h: 330, render(b) {
      b.innerHTML = '<div class="about"><span class="orb"></span><h2>Windows 12 Concept</h2><p style="color:var(--muted);margin-top:8px">A fan-made, imaginary desktop that runs in your browser. Not affiliated with or endorsed by Microsoft.</p><p style="margin-top:14px;font-size:13px">Built with plain HTML, CSS &amp; JS.</p></div>';
  } }
];

/* ---------- Desktop icons ---------- */
const iconsEl = $('#icons');
['files', 'browser', 'copilot', 'notepad', 'terminal', 'settings'].forEach(id => {
  const a = APPS.find(x => x.id === id), d = document.createElement('div');
  d.className = 'icon'; d.innerHTML = `<span class="gl">${a.icon}</span>${a.name}`;
  d.onclick = e => { e.stopPropagation(); $$('.icon').forEach(i => i.classList.remove('sel')); d.classList.add('sel'); };
  d.ondblclick = () => launch(id);
  iconsEl.appendChild(d);
});

/* ---------- Start menu ---------- */
const startEl = $('#start'), widgetsEl = $('#widgets'), quickEl = $('#quick'), ctx = $('#ctx');
function renderPinned(filter = '') {
  const list = APPS.filter(a => a.name.toLowerCase().includes(filter.toLowerCase()));
  $('#pinned').innerHTML = list.map(a => `<div class="app" data-id="${a.id}"><span class="gl">${a.icon}</span>${a.name}</div>`).join('') || '<p style="color:var(--muted);padding:8px">No results</p>';
  $$('#pinned .app').forEach(el => el.onclick = () => launch(el.dataset.id));
}
$('#recommended').innerHTML = [['📄', 'Project plan', 'notepad'], ['🖼️', 'Wallpaper pack', 'settings'], ['🎵', 'Focus playlist', 'files'], ['💬', 'Ask Aura', 'copilot']]
  .map(([i, n, id]) => `<div data-id="${id}"><span style="font-size:22px">${i}</span>${n}</div>`).join('');
$$('#recommended div').forEach(el => el.onclick = () => launch(el.dataset.id));
renderPinned();
$('#startSearch').oninput = e => renderPinned(e.target.value);

function closePanels(except) {
  [startEl, widgetsEl, quickEl, ctx].forEach(p => { if (p !== except) p.classList.add('hidden'); });
}
function togglePanel(p) {
  const was = p.classList.contains('hidden'); closePanels(p); p.classList.toggle('hidden', !was);
  if (p === startEl && was) { $('#startSearch').value = ''; renderPinned(); setTimeout(() => $('#startSearch').focus(), 30); }
}
$('#btnStart').onclick = e => { e.stopPropagation(); togglePanel(startEl); };
$('#btnWidgets').onclick = e => { e.stopPropagation(); togglePanel(widgetsEl); };
$('#btnQuick').onclick = e => { e.stopPropagation(); togglePanel(quickEl); };
$('#tbClock').onclick = e => { e.stopPropagation(); togglePanel(widgetsEl); };
[startEl, widgetsEl, quickEl, ctx].forEach(p => p.addEventListener('click', e => e.stopPropagation()));
desktop.addEventListener('click', () => { closePanels(); $$('.icon').forEach(i => i.classList.remove('sel')); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePanels();
  if (e.key === 'Meta' || (e.ctrlKey && e.key === 'Escape')) togglePanel(startEl);
});
$('#btnLock').onclick = () => { closePanels(); desktop.classList.add('hidden'); lock.classList.remove('hidden'); };
$('#btnRestart').onclick = () => { open.forEach(w => { w.el.remove(); w.btn.remove(); }); open.clear(); closePanels(); startBoot(); };

/* ---------- Quick settings ---------- */
$$('.tile').forEach(t => t.onclick = () => {
  if (t.dataset.t === 'theme') { toggleTheme(); return; }
  t.classList.toggle('on');
});
$('#brightness').oninput = e => { desktop.style.filter = `brightness(${e.target.value}%)`; };
if (navigator.getBattery) navigator.getBattery().then(b => { const u = () => $('#batt').textContent = Math.round(b.level * 100) + '%' + (b.charging ? ' ⚡' : ''); u(); b.onlevelchange = u; b.onchargingchange = u; });

/* ---------- Widgets ---------- */
(function cal() {
  const d = new Date(), y = d.getFullYear(), m = d.getMonth();
  const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
  let h = 'SMTWTFS'.split('').map(c => `<span class="h">${c}</span>`).join('');
  for (let i = 0; i < first; i++) h += '<span></span>';
  for (let i = 1; i <= days; i++) h += `<span class="${i === d.getDate() ? 'today' : ''}">${i}</span>`;
  $('#miniCal').innerHTML = h;
})();
setInterval(() => {
  ['cpu', 'ram', 'npu'].forEach(k => { $('#' + k + 'Bar').style.width = (10 + Math.random() * 60) + '%'; });
}, 2000);
const qn = $('#quickNote'); qn.value = store.get('quick', ''); qn.oninput = () => store.set('quick', qn.value);

/* ---------- Context menu ---------- */
desktop.addEventListener('contextmenu', e => {
  e.preventDefault(); closePanels();
  ctx.style.left = Math.min(e.clientX, innerWidth - 210) + 'px';
  ctx.style.top = Math.min(e.clientY, innerHeight - 220) + 'px';
  ctx.classList.remove('hidden');
});
ctx.addEventListener('click', e => {
  const a = e.target.dataset.a; if (!a) return;
  if (a === 'refresh') { desktop.style.opacity = .4; setTimeout(() => desktop.style.opacity = '', 150); }
  if (a === 'wallpaper') nextWall();
  if (a === 'theme') toggleTheme();
  if (a === 'settings') launch('settings');
  if (a === 'terminal') launch('terminal');
  ctx.classList.add('hidden');
});

startBoot();
})();
