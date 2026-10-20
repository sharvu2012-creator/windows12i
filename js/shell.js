'use strict';
/* ============ shell: windows, menus, taskbar, start, panels ============ */
(function () {
const { $, $$, el } = W;
const TB = 70;

/* ---- app registry ---- */
W.apps = {};
W.reg = (id, d) => { W.apps[id] = Object.assign({ id }, d); };
W.availableApps = () => Object.values(W.apps).filter(a => !a.hidden);
W.launch = (id, args) => {
  const a = W.apps[id]; if (!a) return null;
  W.closePanels();
  if (a.single) { const ex = wm.wins.find(w => w.app === id); if (ex) { ex.focus(); if (args && ex.onargs) ex.onargs(args); return ex; } }
  const w = wm.create({ app: id, title: a.name, icon: a.icon, w: a.w, h: a.h, minW: a.minW, minH: a.minH });
  a.open(w, args || {}); wm.setActive(w); return w;
};

/* ---- window manager ---- */
const wm = W.wm = { wins: [], z: 100, active: null };
const work = () => ({ w: innerWidth, h: innerHeight - TB });
const zoneRect = z => {
  const k = work(), g = 6;
  if (z === 'max') return { x: 0, y: 0, w: k.w, h: k.h };
  const L = { left: [0, 0, .5, 1], right: [.5, 0, .5, 1], tl: [0, 0, .5, .5], tr: [.5, 0, .5, .5], bl: [0, .5, .5, .5], br: [.5, .5, .5, .5] }[z];
  return { x: L[0] * k.w + g, y: L[1] * k.h + g, w: L[2] * k.w - 2 * g, h: L[3] * k.h - 2 * g };
};
wm.create = function (o) {
  const k = work(), n = wm.wins.length % 6;
  const ww = Math.min(o.w || 800, k.w - 20), hh = Math.min(o.h || 520, k.h - 20);
  const w = { id: W.uid(), app: o.app, title: o.title || '', icon: o.icon, minimized: false, snap: null, rest: null, closers: [], minW: o.minW || 320, minH: o.minH || 220 };
  const e = w.el = el('div', { class: 'win glass' });
  Object.assign(e.style, { width: ww + 'px', height: hh + 'px', left: Math.max(8, (k.w - ww) / 2 + (n - 2) * 26) + 'px', top: Math.max(8, (k.h - hh) / 2 + (n - 2) * 22 - 8) + 'px' });
  w.ttl = el('span', { class: 'ttl' }, w.title);
  const bMax = el('button', { class: 'tbtn', html: W.i('max', 13), title: 'Maximize', onclick: () => w.toggleMax() });
  const tb = el('div', { class: 'tb' }, el('span', { class: 'tico', html: W.ai(w.icon, 16) }), w.ttl, el('div', { class: 'grow' }),
    el('button', { class: 'tbtn', html: W.i('min', 13), title: 'Minimize', onclick: () => w.minimize() }), bMax,
    el('button', { class: 'tbtn x', html: W.i('close', 13), title: 'Close', onclick: () => w.close() }));
  w.body = el('div', { class: 'wbody' });
  e.append(tb, w.body);
  w.rect = () => ({ x: e.offsetLeft, y: e.offsetTop, w: e.offsetWidth, h: e.offsetHeight });
  w.setRect = (r, anim) => { if (anim) { e.classList.add('anim'); setTimeout(() => e.classList.remove('anim'), 230); } Object.assign(e.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' }); };
  w.snapTo = z => { if (!w.rest) w.rest = w.rect(); w.snap = z; e.classList.toggle('max', z === 'max'); w.setRect(zoneRect(z), true); bMax.innerHTML = W.i(z === 'max' ? 'restore' : 'max', 13); };
  w.unsnap = () => { if (!w.snap) return; w.snap = null; e.classList.remove('max'); if (w.rest) w.setRect(w.rest, true); w.rest = null; bMax.innerHTML = W.i('max', 13); };
  w.toggleMax = () => (w.snap === 'max' ? w.unsnap() : w.snapTo('max'));
  w.setTitle = t => { w.title = t; w.ttl.textContent = t; W.bus.emit('wm'); };
  w.focus = () => { if (w.minimized) { w.minimized = false; e.classList.remove('min'); } wm.setActive(w); };
  w.minimize = () => { w.minimized = true; e.classList.add('min'); if (wm.active === w) wm.focusTop(); W.bus.emit('wm'); };
  w.close = async () => {
    for (const f of w.closers) if ((await f()) === false) return;
    e.classList.add('closing'); setTimeout(() => e.remove(), 140);
    wm.wins = wm.wins.filter(x => x !== w); if (wm.active === w) wm.focusTop(); W.bus.emit('wm');
  };
  /* drag + edge snap */
  tb.addEventListener('pointerdown', ev => {
    if (ev.button !== 0 || ev.target.closest('.tbtn')) return;
    w.focus(); tb.setPointerCapture(ev.pointerId);
    const sx = ev.clientX, sy = ev.clientY; let started = false, ox, oy, pend = null;
    const mv = m => {
      if (!started) {
        if (Math.hypot(m.clientX - sx, m.clientY - sy) < 4) return; started = true;
        if (w.snap) { const c = w.rect(), rx = (sx - c.x) / c.w; w.unsnap(); const r = w.rect(); e.style.left = (sx - rx * r.w) + 'px'; e.style.top = '0px'; }
        const r = w.rect(); ox = sx - r.x; oy = sy - r.y;
      }
      e.style.left = (m.clientX - ox) + 'px'; e.style.top = W.clamp(m.clientY - oy, 0, innerHeight - TB - 30) + 'px';
      const k = work(); let z = null;
      if (m.clientY <= 3) z = 'max'; else if (m.clientX <= 3) z = m.clientY < 90 ? 'tl' : m.clientY > k.h - 90 ? 'bl' : 'left'; else if (m.clientX >= innerWidth - 4) z = m.clientY < 90 ? 'tr' : m.clientY > k.h - 90 ? 'br' : 'right';
      pend = z; const fx = $('#snapfx');
      if (z) { const r = zoneRect(z); Object.assign(fx.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' }); fx.classList.remove('hidden'); } else fx.classList.add('hidden');
    };
    const up = () => { tb.removeEventListener('pointermove', mv); tb.removeEventListener('pointerup', up); $('#snapfx').classList.add('hidden'); if (pend) w.snapTo(pend); };
    tb.addEventListener('pointermove', mv); tb.addEventListener('pointerup', up);
  });
  tb.addEventListener('dblclick', ev => { if (!ev.target.closest('.tbtn')) w.toggleMax(); });
  /* resize handles */
  ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].forEach(d => {
    const h = el('div', { class: 'rz ' + d });
    h.addEventListener('pointerdown', ev => {
      if (w.snap === 'max') return; ev.preventDefault(); ev.stopPropagation(); w.focus(); h.setPointerCapture(ev.pointerId);
      const r0 = w.rect(), sx = ev.clientX, sy = ev.clientY; if (w.snap) { w.snap = null; w.rest = null; }
      const mv = m => {
        let { x, y, w: a, h: b } = r0; const dx = m.clientX - sx, dy = m.clientY - sy;
        if (d.includes('e')) a = Math.max(w.minW, r0.w + dx); if (d.includes('s')) b = Math.max(w.minH, r0.h + dy);
        if (d.includes('w')) { a = Math.max(w.minW, r0.w - dx); x = r0.x + r0.w - a; } if (d.includes('n')) { b = Math.max(w.minH, r0.h - dy); y = Math.max(0, r0.y + r0.h - b); }
        Object.assign(e.style, { left: x + 'px', top: y + 'px', width: a + 'px', height: b + 'px' });
      };
      const up = () => { h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); };
      h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up);
    });
    e.append(h);
  });
  e.addEventListener('pointerdown', () => { if (wm.active !== w) wm.setActive(w); });
  wm.wins.push(w); $('#wins').append(e); return w;
};
wm.setActive = w => {
  wm.z++; w.el.style.zIndex = wm.z; wm.active = w;
  wm.wins.forEach(x => x.el.classList.toggle('focus', x === w)); W.bus.emit('wm');
};
wm.focusTop = () => {
  const v = wm.wins.filter(w => !w.minimized).sort((a, b) => (+b.el.style.zIndex || 0) - (+a.el.style.zIndex || 0))[0];
  if (v) wm.setActive(v); else { wm.active = null; wm.wins.forEach(x => x.el.classList.remove('focus')); W.bus.emit('wm'); }
};
addEventListener('resize', () => wm.wins.forEach(w => { if (w.snap) w.setRect(zoneRect(w.snap)); }));

/* ---- context menu ---- */
W.menus = [];
W.closeMenus = () => { W.menus.forEach(m => m.remove()); W.menus = []; };
W.menu = function (items, x, y, level = 0) {
  if (level === 0) W.closeMenus();
  while (W.menus.length > level) W.menus.pop().remove();
  const m = el('div', { class: 'menu glass' });
  items.filter(Boolean).forEach(it => {
    if (it.sep) return m.append(el('div', { class: 'msep' }));
    const row = el('div', { class: 'mi' + (it.disabled ? ' dis' : '') },
      el('span', { class: 'mic', html: it.icon ? W.i(it.icon, 15) : it.check ? W.i('check', 14) : '' }), el('span', { class: 'ml' }, it.label),
      it.sub ? el('span', { class: 'marr', html: W.i('fwd', 12) }) : null);
    if (it.sub) row.addEventListener('mouseenter', () => { const r = row.getBoundingClientRect(); W.menu(it.sub, r.right - 4, r.top - 6, level + 1); });
    else { row.addEventListener('mouseenter', () => { while (W.menus.length > level + 1) W.menus.pop().remove(); }); row.addEventListener('click', () => { if (it.disabled) return; W.closeMenus(); it.onclick && it.onclick(); }); }
    m.append(row);
  });
  $('#app').append(m); W.menus.push(m);
  const r = m.getBoundingClientRect();
  m.style.left = Math.max(4, Math.min(x, innerWidth - r.width - 6)) + 'px'; m.style.top = Math.max(4, Math.min(y, innerHeight - r.height - 6)) + 'px';
};
document.addEventListener('pointerdown', e => { if (W.menus.length && !e.target.closest('.menu')) W.closeMenus(); }, true);
document.addEventListener('contextmenu', e => { if (!e.target.closest('input,textarea,[contenteditable]')) e.preventDefault(); });

/* ---- dialogs + toasts ---- */
W.modal = build => new Promise(res => {
  const ov = el('div', { class: 'modal' }), d = el('div', { class: 'dlg glass' });
  const close = v => { ov.remove(); res(v); }; build(d, close); ov.append(d); $('#modals').append(ov);
  const i = $('input', d); if (i) { i.focus(); i.select(); }
});
W.dialog = {
  prompt: (title, msg, val = '') => W.modal((d, c) => {
    const i = el('input', { class: 'inp', value: val });
    i.addEventListener('keydown', e => { if (e.key === 'Enter') c(i.value); if (e.key === 'Escape') c(null); });
    d.append(el('h3', {}, title), msg ? el('p', {}, msg) : null, i, el('div', { class: 'dbtn' }, el('button', { class: 'btn', onclick: () => c(null) }, 'Cancel'), el('button', { class: 'btn pri', onclick: () => c(i.value) }, 'OK')));
  }),
  confirm: (title, msg, ok = 'OK') => W.modal((d, c) => d.append(el('h3', {}, title), el('p', {}, msg), el('div', { class: 'dbtn' }, el('button', { class: 'btn', onclick: () => c(false) }, 'Cancel'), el('button', { class: 'btn pri', onclick: () => c(true) }, ok)))),
  alert: (title, msg) => W.modal((d, c) => d.append(el('h3', {}, title), el('p', {}, msg), el('div', { class: 'dbtn' }, el('button', { class: 'btn pri', onclick: () => c(true) }, 'OK'))))
};
W.notify = n => {
  if (W.cfg.get('dnd')) return;
  const t = el('div', { class: 'toast glass' }, el('span', { html: W.ai(n.icon || 'info', 28) }), el('div', {}, el('b', {}, n.title), el('div', { class: 'sub' }, n.body || '')));
  $('#toasts').append(t); setTimeout(() => t.classList.add('show'), 20); setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 4500);
};

/* ---- config -> DOM ---- */
function applyCfg(k) {
  const c = W.cfg, app = $('#app');
  if (!k || k === 'theme') app.dataset.theme = c.get('theme');
  if (!k || k === 'accent') app.style.setProperty('--ac', c.get('accent'));
  if (!k || k === 'wall') app.style.setProperty('--wall', W.wallCss());
  if (!k || k === 'fx') app.classList.toggle('nofx', !c.get('fx'));
  if (!k || k === 'align') $('#taskbar') && $('#taskbar').classList.toggle('left', c.get('align') === 'left');
  if (!k || k === 'brightness') $('#dim').style.opacity = (100 - c.get('brightness')) / 100 * .75;
  if (!k || k === 'night' || k === 'nightStr') $('#nl').style.opacity = c.get('night') ? c.get('nightStr') / 100 * .55 : 0;
  if (!k || k === 'textScale') app.style.setProperty('--ts', c.get('textScale') / 100);
}
W.bus.on('cfg', k => { applyCfg(k); if (['pinned', 'taskPinned', 'showSearch', 'showWidgets', 'showTaskview', 'installed'].includes(k)) renderTaskbar(); if (k === 'name') W.bus.emit('wm'); });
W.bus.on('fs', p => { if (p === 'C:/Users/User/Desktop') renderIcons(); });

/* ---- desktop icons ---- */
function renderIcons() {
  const box = $('#icons'); box.innerHTML = '';
  const items = [
    { n: 'This PC', ic: 'desktop', open: () => W.launch('explorer', { path: 'C:' }) },
    { n: 'Recycle Bin', ic: 'trash', open: () => W.launch('explorer', { path: 'C:/$Recycle.Bin' }) },
    { n: 'Documents', ic: 'folder', open: () => W.launch('explorer', { path: 'C:/Users/User/Documents' }) }
  ];
  W.fs.list('C:/Users/User/Desktop').sort((a, b) => a.name.localeCompare(b.name)).forEach(f => items.push({ n: f.name, ic: f.node.t === 'd' ? 'folder' : null, f, open: () => W.openFile(f.path) }));
  items.forEach(it => {
    const d = el('div', { class: 'dicon', html: (it.ic ? W.ai(it.ic, 44) : W.fileIcon(it.n, 44)) + '<span></span>' }); $('span', d).textContent = it.n;
    d.addEventListener('click', e => { e.stopPropagation(); $$('.dicon.sel').forEach(x => x.classList.remove('sel')); d.classList.add('sel'); });
    d.addEventListener('dblclick', it.open);
    d.addEventListener('contextmenu', e => { e.stopPropagation(); W.menu([{ label: 'Open', icon: 'folder', onclick: it.open }, it.f && { label: 'Rename', icon: 'edit', onclick: async () => { const v = await W.dialog.prompt('Rename', '', it.n); if (v) W.fs.rename(it.f.path, v); } }, it.f && { label: 'Delete', icon: 'trash', onclick: () => W.fs.trash(it.f.path) }], e.clientX, e.clientY); });
    box.append(d);
  });
}
function newFile(dir, folder) {
  const name = W.fs.uniq(dir, folder ? 'New folder' : 'New text document.txt'); const p = W.fs.join(dir, name);
  folder ? W.fs.mkdir(p) : W.fs.write(p, ''); return p;
}
W.newItem = newFile;
function desktopMenu(e) {
  const D = 'C:/Users/User/Desktop';
  W.menu([
    { label: 'View', icon: 'grid', sub: [{ label: 'Show desktop icons', check: W.cfg.get('showIcons'), onclick: () => { W.cfg.set('showIcons', !W.cfg.get('showIcons')); $('#icons').classList.toggle('hidden', !W.cfg.get('showIcons')); } }] },
    { label: 'Refresh', icon: 'refresh', onclick: renderIcons }, { sep: 1 },
    { label: 'New', icon: 'plus', sub: [{ label: 'Folder', icon: 'folder', onclick: () => newFile(D, true) }, { label: 'Text document', icon: 'note', onclick: () => newFile(D, false) }] }, { sep: 1 },
    { label: 'Display settings', icon: 'desktop', onclick: () => W.launch('settings', { page: 'system' }) },
    { label: 'Personalize', icon: 'palette', onclick: () => W.launch('settings', { page: 'personalize' }) },
    { label: 'Open in Terminal', icon: 'terminal', onclick: () => W.launch('terminal') }
  ], e.clientX, e.clientY);
}

/* ---- panels ---- */
const PANELS = {};
W.closePanels = except => { Object.entries(PANELS).forEach(([k, p]) => { if (k !== except) p.el.classList.remove('open'); }); };
W.togglePanel = name => {
  const p = PANELS[name], was = p.el.classList.contains('open'); W.closePanels(name);
  if (!was) { p.build && p.build(); p.el.classList.add('open'); p.focus && p.focus(); } else p.el.classList.remove('open');
};
function panel(name, cls, build, focus) { const e = el('section', { class: 'panel glass ' + cls }); $('#panels').append(e); PANELS[name] = { el: e, build: () => build(e), focus }; }
document.addEventListener('pointerdown', e => { if (!e.target.closest('.panel') && !e.target.closest('#taskbar') && !e.target.closest('.menu')) W.closePanels(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { W.closePanels(); W.closeMenus(); } });
let metaAlone = false;
addEventListener('keydown', e => { metaAlone = e.key === 'Meta'; });
addEventListener('keyup', e => { if (e.key === 'Meta' && metaAlone && !$('#desk').classList.contains('hidden')) W.togglePanel('start'); });

function startPanel(p) {
  p.innerHTML = '';
  const q = el('input', { class: 'sq', placeholder: 'Search apps, files and settings', autocomplete: 'off' });
  const body = el('div', { class: 'sbody' });
  const apps = () => W.availableApps().filter(a => !a.optional || W.cfg.get('installed').includes(a.id));
  const appCell = a => { const c = el('button', { class: 'acell', html: W.ai(a.icon, 34) + '<span></span>', onclick: () => W.launch(a.id) }); $('span', c).textContent = a.name; c.addEventListener('contextmenu', e => { e.preventDefault(); const pin = W.cfg.get('taskPinned').includes(a.id); W.menu([{ label: 'Open', icon: 'play', onclick: () => W.launch(a.id) }, { label: pin ? 'Unpin from taskbar' : 'Pin to taskbar', icon: 'pin', onclick: () => W.cfg.set('taskPinned', pin ? W.cfg.get('taskPinned').filter(x => x !== a.id) : [...W.cfg.get('taskPinned'), a.id]) }], e.clientX, e.clientY); }); return c; };
  function home() {
    body.innerHTML = '';
    const pinned = W.cfg.get('pinned').map(id => W.apps[id]).filter(Boolean);
    body.append(el('div', { class: 'sh' }, 'Pinned'), el('div', { class: 'agrid' }, pinned.map(appCell)));
    const rec = W.store.get('recent', []).filter(r => W.fs.exists(r.p)).slice(0, 6);
    body.append(el('div', { class: 'sh' }, 'Recommended'));
    const g = el('div', { class: 'rgrid' });
    (rec.length ? rec : [{ p: 'C:/Users/User/Documents/Welcome.txt' }]).forEach(r => { const b = el('button', { class: 'rcell', html: W.fileIcon(r.p, 26) + '<span></span>', onclick: () => { W.closePanels(); W.openFile(r.p); } }); $('span', b).textContent = W.fs.name(r.p); g.append(b); });
    body.append(g);
  }
  function results() {
    const s = W.search(q.value); body.innerHTML = ''; let first = null;
    if (s.calc !== null) body.append(el('div', { class: 'calcres' }, q.value + ' = ', el('b', {}, String(s.calc))));
    if (s.apps.length) { body.append(el('div', { class: 'sh' }, 'Apps')); s.apps.forEach(a => { const b = el('button', { class: 'rrow', html: W.ai(a.icon, 26) + '<span></span>', onclick: () => W.launch(a.id) }); $('span', b).textContent = a.name; body.append(b); first = first || (() => W.launch(a.id)); }); }
    if (s.files.length) { body.append(el('div', { class: 'sh' }, 'Files')); s.files.forEach(f => { const b = el('button', { class: 'rrow', html: (f.dir ? W.ai('folder', 26) : W.fileIcon(f.name, 26)) + '<span></span>', onclick: () => { W.closePanels(); W.openFile(f.path); } }); $('span', b).textContent = f.name + '  —  ' + f.path.replace('C:/Users/User/', ''); body.append(b); first = first || (() => W.openFile(f.path)); }); }
    const web = el('button', { class: 'rrow', html: W.ai('globe', 26) + '<span></span>', onclick: () => W.launch('browser', { q: q.value }) }); $('span', web).textContent = 'Search the web for "' + q.value + '"'; body.append(el('div', { class: 'sh' }, 'Web'), web);
    q._first = first || (() => W.launch('browser', { q: q.value }));
  }
  q.addEventListener('input', () => (q.value.trim() ? results() : home()));
  q.addEventListener('keydown', e => { if (e.key === 'Enter' && q.value.trim() && q._first) q._first(); });
  const foot = el('div', { class: 'sfoot' }, el('button', { class: 'user', onclick: () => W.launch('settings', { page: 'accounts' }) }, el('span', { class: 'avatar', style: { background: W.cfg.get('avatar') } }, W.cfg.get('name')[0]), W.cfg.get('name')),
    el('button', { class: 'pbtn', html: W.i('power', 18), title: 'Power', onclick: e => { const r = e.currentTarget.getBoundingClientRect(); W.menu([{ label: 'Lock', icon: 'lock', onclick: W.lock }, { label: 'Restart', icon: 'restart', onclick: () => W.power('restart') }, { label: 'Shut down', icon: 'power', onclick: () => W.power('off') }], r.left - 100, r.top - 130); } }));
  home(); p.append(q, body, foot); p._q = q;
}

function quickPanel(p) {
  p.innerHTML = '';
  const tog = (key, icon, label, extra) => { const b = el('button', { class: 'qt' + (W.cfg.get(key) ? ' on' : ''), html: W.i(icon, 20) + '<span>' + label + '</span>', onclick: () => { W.cfg.set(key, !W.cfg.get(key)); b.classList.toggle('on', W.cfg.get(key)); extra && extra(); } }); return b; };
  const theme = el('button', { class: 'qt' + (W.cfg.get('theme') === 'dark' ? ' on' : ''), html: W.i('moon', 20) + '<span>Dark mode</span>', onclick: () => { const d = W.cfg.get('theme') === 'dark'; W.cfg.set('theme', d ? 'light' : 'dark'); theme.classList.toggle('on', !d); } });
  const sl = (icon, key) => el('label', { class: 'qs' }, el('span', { html: W.i(icon, 18) }), el('input', { type: 'range', min: key === 'brightness' ? 20 : 0, max: 100, value: W.cfg.get(key), oninput: e => W.cfg.set(key, +e.target.value) }));
  p.append(el('div', { class: 'qgrid' }, tog('wifi', 'wifi', 'Wi-Fi'), tog('bt', 'bluetooth', 'Bluetooth'), tog('airplane', 'plane', 'Airplane'), theme, tog('night', 'sun', 'Night light'), tog('dnd', 'bell', 'Focus'), tog('saver', 'battery', 'Saver'), tog('fx', 'grid', 'Effects')), sl('sun', 'brightness'), sl('volume', 'volume'),
    el('div', { class: 'qfoot' }, el('span', { id: 'battTxt', html: W.i('battery', 16) + ' 100%' }), el('button', { class: 'pbtn', html: W.i('gear', 16), onclick: () => W.launch('settings') })));
  if (navigator.getBattery) navigator.getBattery().then(b => { const t = $('#battTxt'); if (t) t.innerHTML = W.i('battery', 16) + ' ' + Math.round(b.level * 100) + '%' + (b.charging ? ' ⚡' : ''); }).catch(() => { });
}

let cal = new Date();
function calPanel(p) {
  p.innerHTML = '';
  const draw = () => {
    p.innerHTML = ''; const y = cal.getFullYear(), m = cal.getMonth(), td = new Date();
    p.append(el('div', { class: 'ctime' }, W.time(td, true)), el('div', { class: 'cdate' }, W.longDate(td)),
      el('div', { class: 'chead' }, el('b', {}, cal.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })), el('div', {}, el('button', { class: 'pbtn', html: W.i('up', 14), onclick: () => { cal = new Date(y, m - 1, 1); draw(); } }), el('button', { class: 'pbtn', html: W.i('down', 14), onclick: () => { cal = new Date(y, m + 1, 1); draw(); } }))));
    const g = el('div', { class: 'cgrid' }, 'SMTWTFS'.split('').map(c => el('span', { class: 'dh' }, c)));
    for (let i = 0; i < new Date(y, m, 1).getDay(); i++) g.append(el('span'));
    for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) g.append(el('span', { class: 'dd' + (d === td.getDate() && m === td.getMonth() && y === td.getFullYear() ? ' today' : '') }, d));
    p.append(g);
  };
  cal = new Date(); draw();
}

/* ---- taskbar ---- */
function renderTaskbar() {
  const tb = $('#taskbar'); tb.innerHTML = '';
  const btn = (html, title, fn, cls) => el('button', { class: 'tbb ' + (cls || ''), html, title, onclick: fn });
  const mid = el('div', { class: 'tmid' });
  mid.append(btn(W.logo(26), 'Start', () => W.togglePanel('start'), 'start'));
  if (W.cfg.get('showSearch')) mid.append(el('button', { class: 'tsearch', html: W.i('search', 15) + '<span>Search</span>', onclick: () => W.togglePanel('start') }));
  if (W.cfg.get('showTaskview')) mid.append(btn(W.i('taskview', 20), 'Task view', () => { W.closePanels(); const v = wm.wins.filter(w => !w.minimized); if (v.length) { v.forEach(w => w.minimize()); } else wm.wins.forEach(w => w.focus()); }, ''));
  const ids = [...W.cfg.get('taskPinned')]; wm.wins.forEach(w => { if (!ids.includes(w.app)) ids.push(w.app); });
  ids.map(id => W.apps[id]).filter(Boolean).forEach(a => {
    const ws = wm.wins.filter(w => w.app === a.id);
    const b = btn(W.ai(a.icon, 26), a.name, () => {
      W.closePanels();
      if (!ws.length) return W.launch(a.id);
      if (ws.length === 1) { const w = ws[0]; return w.minimized || wm.active !== w ? w.focus() : w.minimize(); }
      W.menu(ws.map(w => ({ label: w.title, icon: a.icon, onclick: () => w.focus() })), b.getBoundingClientRect().left, b.getBoundingClientRect().top - 40 * ws.length - 12);
    }, 'app' + (ws.length ? ' run' : '') + (ws.some(w => w === wm.active) ? ' act' : ''));
    b.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); const pin = W.cfg.get('taskPinned').includes(a.id); W.menu([{ label: a.name, icon: a.icon, onclick: () => W.launch(a.id) }, { label: pin ? 'Unpin from taskbar' : 'Pin to taskbar', icon: 'pin', onclick: () => W.cfg.set('taskPinned', pin ? W.cfg.get('taskPinned').filter(x => x !== a.id) : [...W.cfg.get('taskPinned'), a.id]) }, ws.length && { label: 'Close window' + (ws.length > 1 ? 's' : ''), icon: 'close', onclick: () => ws.forEach(w => w.close()) }], e.clientX, e.clientY - 100); });
    mid.append(b);
  });
  const clock = el('button', { class: 'clock', onclick: () => W.togglePanel('cal') }, el('span', { id: 'ck1' }), el('small', { id: 'ck2' }));
  tb.append(el('button', { class: 'wchip', html: W.i('cloud', 18) + '<span>Weather</span>', onclick: () => W.launch('settings', { page: 'system' }) }), mid,
    el('div', { class: 'tray' }, el('button', { class: 'tbb tr', html: W.i('wifi', 16) + W.i('volume', 16) + W.i('battery', 16), onclick: () => W.togglePanel('quick') }), clock, el('button', { class: 'showd', title: 'Show desktop', onclick: () => { W.closePanels(); wm.wins.forEach(w => w.minimize()); } })));
  applyCfg('align'); tick();
}
function tick() { const a = $('#ck1'); if (!a) return; const d = new Date(); a.textContent = W.time(d); $('#ck2').textContent = W.date(d); }
setInterval(() => { tick(); const t = $('#panels .ctime'); if (t) t.textContent = W.time(new Date(), true); const l = $('#lock .ltime'); if (l) { l.textContent = W.time(new Date(), false); } }, 1000);
W.bus.on('wm', renderTaskbar);

/* ---- boot / lock / power ---- */
function showOnly(id) { ['boot', 'lock', 'desk', 'off'].forEach(k => $('#' + k).classList.toggle('hidden', k !== id)); }
W.lock = () => {
  W.closePanels(); W.closeMenus(); const l = $('#lock'); l.innerHTML = '';
  l.append(el('div', { class: 'ltime' }, W.time(new Date(), false)), el('div', { class: 'ldate' }, W.longDate()), el('div', { class: 'lhint' }, 'Click or press any key to sign in'));
  showOnly('lock');
  const go = () => {
    l.onclick = null; document.removeEventListener('keydown', key);
    l.innerHTML = ''; l.append(el('div', { class: 'lcard' }, el('div', { class: 'avatar big', style: { background: W.cfg.get('avatar') } }, W.cfg.get('name')[0]), el('h2', {}, W.cfg.get('name')), el('button', { class: 'btn pri', id: 'signin', onclick: enter }, 'Sign in')));
    $('#signin').focus(); document.addEventListener('keydown', k2); setTimeout(() => { }, 0);
  };
  const key = () => go(), k2 = e => { if (e.key === 'Enter') enter(); };
  const enter = () => { document.removeEventListener('keydown', k2); showOnly('desk'); if (!W.store.get('welcomed', false)) { W.store.set('welcomed', true); setTimeout(() => W.notify({ title: 'Welcome to Windows 12', body: 'A fan-made concept running in your browser.', icon: 'sparkle' }), 600); } };
  l.onclick = go; document.addEventListener('keydown', key);
};
W.power = mode => {
  W.wm.wins.slice().forEach(w => w.el.remove()); wm.wins = []; wm.active = null; W.closePanels(); renderTaskbar();
  if (mode === 'restart') W.boot();
  else { showOnly('off'); $('#off').onclick = () => { $('#off').onclick = null; W.boot(); }; }
};
W.boot = () => { showOnly('boot'); setTimeout(W.lock, 1700); };

W.start = () => {
  $('#bootlogo').innerHTML = W.logo(90);
  panel('start', 'pstart', startPanel, () => setTimeout(() => { const q = $('.sq'); q && q.focus(); }, 30));
  panel('quick', 'pquick', quickPanel); panel('cal', 'pcal', calPanel);
  applyCfg(); renderTaskbar(); renderIcons();
  $('#desk').addEventListener('click', () => { $$('.dicon.sel').forEach(x => x.classList.remove('sel')); });
  $('#desk').addEventListener('contextmenu', e => { if (e.target.id === 'desk' || e.target.id === 'icons' || e.target.id === 'wins') desktopMenu(e); });
  $('#icons').classList.toggle('hidden', !W.cfg.get('showIcons'));
  W.boot();
};
})();
