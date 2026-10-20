'use strict';
/* ============ apps ============ */
(function () {
const { $, $$, el } = W;
const HOME = 'C:/Users/User';

/* ---------- Explorer ---------- */
W.reg('explorer', { name: 'File Explorer', icon: 'folder', w: 860, h: 540, minW: 520, open(win, args) {
  let path = args.path || HOME + '/Documents', hist = [path], hi = 0, sel = null, clip = null;
  const addr = el('input', { class: 'inp addr' }), list = el('div', { class: 'files' }), status = el('div', { class: 'status' });
  const go = (p, push = true) => { if (!W.fs.isDir(p)) return; path = p; if (push) { hist = hist.slice(0, hi + 1); hist.push(p); hi = hist.length - 1; } sel = null; draw(); };
  const quick = [['Desktop', 'desktop', HOME + '/Desktop'], ['Documents', 'note', HOME + '/Documents'], ['Downloads', 'download', HOME + '/Downloads'], ['Pictures', 'photo', HOME + '/Pictures'], ['Music', 'music', HOME + '/Music'], ['This PC', 'desktop', 'C:'], ['Recycle Bin', 'trash', 'C:/$Recycle.Bin']];
  const side = el('div', { class: 'side' }, quick.map(([n, ic, p]) => el('button', { class: 'sl', html: W.i(ic, 16) + '<span>' + n + '</span>', onclick: () => go(p) })));
  const btn = (ic, t, fn) => el('button', { class: 'ibtn', html: W.i(ic, 17), title: t, onclick: fn });
  function rename(p) { const f = $$('.fitem', list).find(x => x.dataset.p === p); const old = W.fs.name(p); W.dialog.prompt('Rename', '', old).then(v => { if (v && v !== old && !W.fs.rename(p, v)) W.dialog.alert('Rename failed', 'That name is invalid or already exists.'); }); }
  const del = p => { W.fs.trash(p); sel = null; };
  const paste = () => { if (!clip) return; clip.paths.forEach(s => clip.cut ? W.fs.move(s, path) : W.fs.copy(s, path)); if (clip.cut) clip = null; };
  function itemMenu(e, f) {
    const bin = path.startsWith('C:/$Recycle.Bin');
    W.menu([{ label: 'Open', icon: 'folder', onclick: () => open(f) }, bin && { label: 'Restore', icon: 'refresh', onclick: () => W.fs.restore(f.path) }, { sep: 1 },
      !bin && { label: 'Cut', icon: 'cut', onclick: () => { clip = { paths: [f.path], cut: true }; } }, !bin && { label: 'Copy', icon: 'copy', onclick: () => { clip = { paths: [f.path] }; } },
      !bin && { label: 'Rename', icon: 'edit', onclick: () => rename(f.path) }, { label: bin ? 'Delete permanently' : 'Delete', icon: 'trash', onclick: () => del(f.path) }], e.clientX, e.clientY);
  }
  const open = f => (f.node.t === 'd' ? go(f.path) : W.openFile(f.path));
  function draw() {
    addr.value = W.fs.pretty(path); win.setTitle(W.fs.name(path) || 'This PC'); list.innerHTML = '';
    const items = W.fs.list(path).sort((a, b) => (b.node.t === 'd') - (a.node.t === 'd') || a.name.localeCompare(b.name));
    items.forEach(f => {
      const it = el('div', { class: 'fitem' + (sel === f.path ? ' sel' : ''), draggable: 'true', 'data-p': f.path, html: (f.node.t === 'd' ? W.ai('folder', 46) : W.fileIcon(f.name, 46)) + '<span></span>' }); $('span', it).textContent = f.name;
      it.addEventListener('click', e => { e.stopPropagation(); sel = f.path; $$('.fitem', list).forEach(x => x.classList.toggle('sel', x === it)); });
      it.addEventListener('dblclick', () => open(f)); it.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); sel = f.path; draw(); itemMenu(e, f); });
      it.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', f.path));
      if (f.node.t === 'd') { it.addEventListener('dragover', e => { e.preventDefault(); it.classList.add('drop'); }); it.addEventListener('dragleave', () => it.classList.remove('drop')); it.addEventListener('drop', e => { e.preventDefault(); const s = e.dataTransfer.getData('text/plain'); if (s) W.fs.move(s, f.path); }); }
      list.append(it);
    });
    if (!items.length) list.append(el('div', { class: 'empty' }, 'This folder is empty.'));
    status.textContent = items.length + ' item' + (items.length === 1 ? '' : 's') + (sel ? '  |  1 selected' : '');
  }
  list.addEventListener('click', () => { sel = null; $$('.fitem.sel', list).forEach(x => x.classList.remove('sel')); });
  list.addEventListener('contextmenu', e => { e.preventDefault(); const bin = path.startsWith('C:/$Recycle.Bin'); W.menu(bin ? [{ label: 'Empty Recycle Bin', icon: 'trash', onclick: () => W.fs.emptyTrash() }] : [{ label: 'New folder', icon: 'folder', onclick: () => W.newItem(path, true) }, { label: 'New text document', icon: 'note', onclick: () => W.newItem(path, false) }, { sep: 1 }, { label: 'Paste', icon: 'paste', disabled: !clip, onclick: paste }, { label: 'Refresh', icon: 'refresh', onclick: draw }], e.clientX, e.clientY); });
  addr.addEventListener('keydown', e => { if (e.key === 'Enter') { const p = addr.value.replace(/\\/g, '/').replace(/\/$/, ''); W.fs.isDir(p) ? go(p) : (addr.value = W.fs.pretty(path)); } });
  const bar = el('div', { class: 'toolbar' }, btn('back', 'Back', () => { if (hi > 0) { hi--; go(hist[hi], false); } }), btn('fwd', 'Forward', () => { if (hi < hist.length - 1) { hi++; go(hist[hi], false); } }),
    btn('up', 'Up', () => { const d = W.fs.dirname(path); if (d) go(d); }), btn('refresh', 'Refresh', draw), addr,
    btn('folder', 'New folder', () => W.newItem(path, true)), btn('copy', 'Copy', () => { if (sel) clip = { paths: [sel] }; }), btn('paste', 'Paste', paste),
    btn('edit', 'Rename', () => sel && rename(sel)), btn('trash', 'Delete', () => sel && del(sel)));
  win.body.append(el('div', { class: 'exp' }, bar, el('div', { class: 'expmain' }, side, list), status));
  const off = W.bus.on('fs', draw); win.closers.push(() => { off(); });
  win.onargs = a => a.path && go(a.path);
  win.body.tabIndex = 0; win.body.addEventListener('keydown', e => { if (e.key === 'Delete' && sel) del(sel); if (e.key === 'F2' && sel) rename(sel); if (e.key === 'Enter' && sel) { const n = W.fs.get(sel); n && (n.t === 'd' ? go(sel) : W.openFile(sel)); } });
  draw();
} });

/* ---------- Notepad ---------- */
W.reg('notepad', { name: 'Notepad', icon: 'note', w: 640, h: 440, single: false, open(win, args) {
  let path = null, dirty = false;
  const ta = el('textarea', { class: 'np', spellcheck: 'false', placeholder: 'Start typing…' }), st = el('div', { class: 'status' });
  const upd = () => { win.setTitle((dirty ? '● ' : '') + (path ? W.fs.name(path) : 'Untitled') + ' - Notepad'); const l = ta.value.slice(0, ta.selectionStart).split('\n'); st.textContent = `Ln ${l.length}, Col ${l[l.length - 1].length + 1}   |   ${ta.value.length} characters   |   UTF-8`; };
  const load = p => { const c = W.fs.read(p); if (c === null) return; path = p; ta.value = typeof c === 'string' && c.startsWith('data:') ? '(binary file)' : c; dirty = false; upd(); };
  const save = async as => {
    if (!path || as) { const v = await W.dialog.prompt('Save as', 'File name (saved in Documents):', path ? W.fs.name(path) : 'Untitled.txt'); if (!v) return false; path = HOME + '/Documents/' + v; }
    W.fs.write(path, ta.value); dirty = false; upd(); W.notify({ title: 'Saved', body: W.fs.name(path), icon: 'note' }); return true;
  };
  ta.addEventListener('input', () => { dirty = true; upd(); }); ['keyup', 'click'].forEach(ev => ta.addEventListener(ev, upd));
  ta.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); } if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '  '); } });
  const b = (t, fn) => el('button', { class: 'tbn', onclick: fn }, t);
  win.body.append(el('div', { class: 'np-wrap' }, el('div', { class: 'toolbar' }, b('New', () => { path = null; ta.value = ''; dirty = false; upd(); }), b('Save', () => save()), b('Save as', () => save(true)), b('Insert date', () => { document.execCommand('insertText', false, new Date().toLocaleString()); })), ta, st));
  win.closers.push(async () => (dirty ? (await W.dialog.confirm('Unsaved changes', 'Close without saving?', 'Close')) : true));
  win.onargs = a => a.path && load(a.path); if (args.path) load(args.path); else upd(); setTimeout(() => ta.focus(), 50);
} });

/* ---------- Terminal ---------- */
W.reg('terminal', { name: 'Terminal', icon: 'terminal', w: 680, h: 420, open(win) {
  let cwd = HOME; const hist = []; let hi = 0;
  const out = el('div', { class: 'tout' }), inp = el('input', { class: 'tin', spellcheck: 'false', autocomplete: 'off' }), pr = el('span', { class: 'tpr' });
  const P = p => p.replace(/\//g, '\\'); const setPr = () => { pr.textContent = 'PS ' + P(cwd) + '> '; };
  const print = (t, c) => { const d = el('div', { class: c || '' }); d.textContent = t; out.append(d); out.scrollTop = out.scrollHeight; };
  const res = p => { if (!p) return cwd; p = p.replace(/\\/g, '/'); let b = /^[A-Za-z]:/.test(p) ? [] : cwd.split('/'); p.split('/').filter(Boolean).forEach(s => { if (s === '..') b.pop(); else if (s !== '.') b.push(s); }); return b.join('/') || 'C:'; };
  const cmds = {
    help: () => 'Commands: help ls cd pwd cat mkdir touch rm cp mv echo clear date whoami neofetch tree open <app|file> apps theme <dark|light> calc <expr> history',
    ls: a => W.fs.list(res(a[0])).sort((x, y) => (y.node.t === 'd') - (x.node.t === 'd')).map(f => (f.node.t === 'd' ? '<DIR>  ' : '       ') + f.name).join('\n') || '(empty)',
    cd: a => { const p = res(a[0] || HOME); if (W.fs.isDir(p)) { cwd = p; setPr(); return ''; } return 'cd: path not found: ' + a[0]; },
    pwd: () => P(cwd), cat: a => { const c = W.fs.read(res(a[0])); return c === null ? 'cat: file not found' : c; },
    mkdir: a => (W.fs.mkdir(res(a[0])) ? '' : 'mkdir: failed'), touch: a => (W.fs.exists(res(a[0])) || W.fs.write(res(a[0]), '') ? '' : 'touch: failed'),
    rm: a => (W.fs.trash(res(a[0])) ? '' : 'rm: not found'), cp: a => (W.fs.copy(res(a[0]), res(a[1])) ? '' : 'cp: failed'), mv: a => (W.fs.move(res(a[0]), res(a[1])) ? '' : 'mv: failed'),
    echo: a => a.join(' '), clear: () => { out.innerHTML = ''; return ''; }, date: () => new Date().toString(), whoami: () => 'user\\' + W.cfg.get('pcname').toLowerCase(),
    history: () => hist.map((h, i) => (i + 1) + '  ' + h).join('\n'), apps: () => W.availableApps().map(a => a.id).join(', '),
    theme: a => { if (!['dark', 'light'].includes(a[0])) return 'usage: theme dark|light'; W.cfg.set('theme', a[0]); return ''; },
    calc: a => { try { return String(W.calc(a.join(' '))); } catch (e) { return 'calc: invalid expression'; } },
    open: a => { if (W.apps[a[0]]) { W.launch(a[0]); return ''; } const p = res(a[0]); if (W.fs.exists(p)) { W.openFile(p); return ''; } return 'open: not found'; },
    tree: a => { const walk = (p, pre) => W.fs.list(p).map(f => pre + f.name + (f.node.t === 'd' ? '\n' + walk(f.path, pre + '  ') : '')).join('\n'); return walk(res(a[0]), ''); },
    neofetch: () => `   .-""-.        ${W.cfg.get('name')}@${W.cfg.get('pcname')}\n  / .--. \\       ---------------\n / /    \\ \\      OS: Windows 12 (concept)\n | |    | |      Host: Your Browser\n | |.-""-.|      Shell: PowerFake 1.0\n ///\`.::::.\`\\     Theme: ${W.cfg.get('theme')}\n||| ::/  \\:: ;    NPU: Imaginary 80 TOPS\n||; ::\\__/:: ;\n \\\\\\ '::::' /\n  \`=':-..-'\``
  };
  function run(line) {
    print(pr.textContent + line, 'cmd'); if (!line.trim()) return; hist.push(line); hi = hist.length;
    const m = line.match(/^(.*?)\s*(>>?)\s*(\S+)$/); let body = line, redir = null; if (m) { body = m[1]; redir = [m[2], m[3]]; }
    const [c, ...a] = body.trim().split(/\s+/); const f = cmds[c.toLowerCase()] || (c === 'dir' ? cmds.ls : c === 'cls' ? cmds.clear : c === 'type' ? cmds.cat : c === 'del' ? cmds.rm : null);
    let r = f ? f(a) : `'${c}' is not recognized as a command. Type help.`;
    if (redir && f) { const p = res(redir[1]); const old = redir[0] === '>>' ? (W.fs.read(p) || '') : ''; W.fs.write(p, old + r + '\n'); r = ''; }
    if (r) print(r, f ? '' : 'err');
  }
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { run(inp.value); inp.value = ''; }
    else if (e.key === 'ArrowUp') { hi = Math.max(0, hi - 1); inp.value = hist[hi] || ''; e.preventDefault(); } else if (e.key === 'ArrowDown') { hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ''; }
    else if (e.key === 'Tab') { e.preventDefault(); const w = inp.value.split(/\s+/), last = w.pop(); const pool = w.length ? W.fs.list(cwd).map(f => f.name) : Object.keys(cmds); const hit = pool.find(x => x.toLowerCase().startsWith(last.toLowerCase())); if (hit) inp.value = [...w, hit].join(' '); }
  });
  const box = el('div', { class: 'term', onclick: () => inp.focus() }, out, el('div', { class: 'trow' }, pr, inp)); win.body.append(box);
  print('Windows 12 Terminal [concept build]\nType "help" for commands.\n'); setPr(); setTimeout(() => inp.focus(), 60);
} });

/* ---------- Calculator ---------- */
W.reg('calc', { name: 'Calculator', icon: 'calc', w: 340, h: 500, minW: 300, minH: 440, open(win) {
  let ex = '', hist = []; const scr = el('div', { class: 'cscr' }), sub = el('div', { class: 'csub' });
  const show = () => { scr.textContent = ex || '0'; };
  const press = k => {
    if (k === 'C') { ex = ''; sub.textContent = ''; } else if (k === '⌫') ex = ex.slice(0, -1);
    else if (k === '=') { if (!ex) return; try { const r = W.calc(ex); sub.textContent = ex + ' ='; ex = String(r); } catch (e) { sub.textContent = ex; ex = 'Error'; } }
    else { if (ex === 'Error') ex = ''; ex += k; } show();
  };
  const keys = ['C', '(', ')', '⌫', 'sin(', 'cos(', '√(', '^', '7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', '0', '.', '%', '+'];
  const grid = el('div', { class: 'ckeys' }, keys.map(k => el('button', { class: 'ck' + ('÷×-+^'.includes(k) ? ' op' : ''), onclick: () => press(k) }, k.replace('(', k.length > 1 ? '' : '(')))); grid.append(el('button', { class: 'ck eq', onclick: () => press('=') }, '='));
  win.body.append(el('div', { class: 'calc', tabIndex: 0, onkeydown: e => { if (/^[0-9+\-*/().%^]$/.test(e.key)) press(e.key === '*' ? '×' : e.key === '/' ? '÷' : e.key); else if (e.key === 'Enter') press('='); else if (e.key === 'Backspace') press('⌫'); else if (e.key === 'Escape') press('C'); } }, sub, scr, grid)); show();
} });

/* ---------- Browser ---------- */
W.reg('browser', { name: 'Nova Browser', icon: 'globe', w: 900, h: 580, minW: 420, single: false, open(win, args) {
  const addr = el('input', { class: 'inp addr', placeholder: 'Search Wikipedia or enter a web address' }), view = el('div', { class: 'bview' });
  const hist = []; let hi = -1;
  const toUrl = v => { v = v.trim(); if (/^https?:\/\//i.test(v)) return v; if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v)) return 'https://' + v; return 'https://en.wikipedia.org/w/index.php?search=' + encodeURIComponent(v); };
  const home = () => {
    view.innerHTML = ''; addr.value = '';
    const q = el('input', { class: 'inp big', placeholder: 'Search Wikipedia or type a URL' }); q.addEventListener('keydown', e => { if (e.key === 'Enter' && q.value.trim()) nav(q.value); });
    const links = [['Wikipedia', 'https://en.wikipedia.org'], ['OpenStreetMap', 'https://www.openstreetmap.org'], ['MDN Web Docs', 'https://developer.mozilla.org'], ['Hacker News', 'https://news.ycombinator.com']];
    view.append(el('div', { class: 'newtab' }, el('h1', {}, 'Nova'), q, el('div', { class: 'tiles' }, links.map(([n, u]) => el('button', { class: 'tile', onclick: () => nav(u) }, el('span', { html: W.ai('globe', 30) }), n)))));
    win.setTitle('New tab - Nova');
  };
  function nav(v, push = true) {
    const u = toUrl(v); if (push) { hist.splice(hi + 1); hist.push(u); hi = hist.length - 1; }
    addr.value = u; view.innerHTML = '';
    view.append(el('div', { class: 'bnote' }, 'Some sites refuse to load inside other pages. ', el('a', { href: u, target: '_blank', rel: 'noopener' }, 'Open in a real tab')), el('iframe', { src: u, class: 'bframe', referrerpolicy: 'no-referrer', sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups' }));
    win.setTitle(u.replace(/^https?:\/\//, '').split('/')[0] + ' - Nova');
  }
  const b = (ic, t, fn) => el('button', { class: 'ibtn', html: W.i(ic, 17), title: t, onclick: fn });
  addr.addEventListener('keydown', e => { if (e.key === 'Enter' && addr.value.trim()) nav(addr.value); });
  win.body.append(el('div', { class: 'browser' }, el('div', { class: 'toolbar' }, b('back', 'Back', () => { if (hi > 0) { hi--; nav(hist[hi], false); } else { hi = -1; home(); } }), b('fwd', 'Forward', () => { if (hi < hist.length - 1) { hi++; nav(hist[hi], false); } }), b('refresh', 'Reload', () => hist[hi] && nav(hist[hi], false)), b('home', 'Home', home), addr), view));
  win.onargs = a => a.q && nav(a.q); args.q ? nav(args.q) : home();
} });

/* ---------- Settings ---------- */
W.reg('settings', { name: 'Settings', icon: 'gear', w: 900, h: 600, minW: 560, single: true, open(win, args) {
  const pages = { system: ['System', 'desktop'], personalize: ['Personalization', 'palette'], accounts: ['Accounts', 'user'], time: ['Time & language', 'clock'], access: ['Accessibility', 'access'], update: ['Windows Update', 'update'], about: ['About', 'info'] };
  const main = el('div', { class: 'smain' }), nav = el('div', { class: 'snav' });
  const row = (t, sub, ctl) => el('div', { class: 'srow' }, el('div', {}, el('b', {}, t), sub ? el('div', { class: 'sub' }, sub) : null), ctl);
  const sw = key => { const s = el('button', { class: 'tgl' + (W.cfg.get(key) ? ' on' : ''), onclick: () => { W.cfg.set(key, !W.cfg.get(key)); s.classList.toggle('on', W.cfg.get(key)); } }, el('i')); return s; };
  const range = (key, min, max) => el('input', { type: 'range', min, max, value: W.cfg.get(key), oninput: e => W.cfg.set(key, +e.target.value) });
  const seg = (key, opts) => { const g = el('div', { class: 'seg' }); opts.forEach(([v, l]) => { const b = el('button', { class: W.cfg.get(key) === v ? 'on' : '', onclick: () => { W.cfg.set(key, v); $$('button', g).forEach(x => x.classList.remove('on')); b.classList.add('on'); } }, l); g.append(b); }); return g; };
  const P = {
    system: () => [el('h2', {}, 'System'), row('Brightness', 'Dims the whole screen', range('brightness', 20, 100)), row('Night light', 'Warmer colors for the evening', sw('night')), row('Night light strength', '', range('nightStr', 10, 100)), row('Volume', '', range('volume', 0, 100)), row('Do not disturb', 'Hide notification pop-ups', sw('dnd')), row('Battery saver', '', sw('saver'))],
    personalize: () => {
      const walls = el('div', { class: 'wgrid' }, W.WALLS.map((w, i) => el('button', { class: 'wth' + (W.cfg.get('wall') === i ? ' on' : ''), style: { backgroundImage: `url("${W.wallUrl(i)}")` }, title: w.name, onclick: () => { W.cfg.set('wall', i); if (w.dark !== (W.cfg.get('theme') === 'dark')) W.cfg.set('theme', w.dark ? 'dark' : 'light'); show('personalize'); } })));
      const acc = el('div', { class: 'accs' }, ['#4c8dff', '#7a5cff', '#ff5c8a', '#18c48f', '#ff9f43', '#00c2ff', '#e5484d'].map(c => el('button', { class: 'acc' + (W.cfg.get('accent') === c ? ' on' : ''), style: { background: c }, onclick: () => { W.cfg.set('accent', c); show('personalize'); } })));
      return [el('h2', {}, 'Personalization'), row('Color mode', '', seg('theme', [['light', 'Light'], ['dark', 'Dark']])), el('div', { class: 'srow col' }, el('b', {}, 'Background'), walls), row('Accent color', '', acc), row('Transparency effects', 'Frosted glass on windows and menus', sw('fx')), row('Taskbar alignment', '', seg('align', [['center', 'Center'], ['left', 'Left']])), row('Show search on taskbar', '', sw('showSearch')), row('Show task view', '', sw('showTaskview'))];
    },
    accounts: () => { const n = el('input', { class: 'inp', value: W.cfg.get('name'), onchange: e => { W.cfg.set('name', e.target.value.trim() || 'User'); } }); const av = el('div', { class: 'accs' }, ['#7a5cff', '#e5484d', '#18c48f', '#ff9f43', '#4c8dff'].map(c => el('button', { class: 'acc', style: { background: c }, onclick: () => W.cfg.set('avatar', c) }))); return [el('h2', {}, 'Accounts'), row('Display name', 'Shown on the lock screen and Start', n), row('Avatar color', '', av)]; },
    time: () => [el('h2', {}, 'Time & language'), row('24-hour clock', '', sw('h24')), row('Show seconds in the taskbar clock', '', sw('seconds')), row('Time zone', Intl.DateTimeFormat().resolvedOptions().timeZone)],
    access: () => [el('h2', {}, 'Accessibility'), row('Text size', 'Scales text inside apps', range('textScale', 90, 150)), row('Reduce motion', 'Turns off animations', sw('reduceMotion'))],
    update: () => { const b = el('button', { class: 'btn pri', onclick: async () => { b.disabled = true; b.textContent = 'Checking…'; await W.sleep(1600); b.disabled = false; b.textContent = 'Check for updates'; st.textContent = "You're up to date. Last checked: " + new Date().toLocaleTimeString(); } }, 'Check for updates'); const st = el('div', { class: 'sub' }, "You're up to date."); return [el('h2', {}, 'Windows Update'), row('Updates', st, b), row('Concept build 12.0', 'Installed today')]; },
    about: () => { const used = W.fs.size(W.fs.root()); return [el('h2', {}, 'About'), el('div', { class: 'aboutlogo', html: W.logo(64) }), row('Device name', '', el('input', { class: 'inp', value: W.cfg.get('pcname'), onchange: e => W.cfg.set('pcname', e.target.value.trim() || 'W12-DESKTOP') })), row('Edition', 'Windows 12 Concept'), row('Browser', navigator.userAgent.split(') ')[0].split('(')[1] || 'Unknown'), row('Virtual disk used', W.fs.fmtSize(used) + ' in this browser'), row('Reset everything', 'Deletes files and settings saved in this browser', el('button', { class: 'btn', onclick: async () => { if (await W.dialog.confirm('Reset this PC?', 'All files and settings will be erased.', 'Reset')) { localStorage.clear(); location.reload(); } } }, 'Reset')), el('p', { class: 'sub' }, 'Fan-made concept. Not affiliated with or endorsed by Microsoft.')]; }
  };
  function show(k) { $$('button', nav).forEach(b => b.classList.toggle('on', b.dataset.k === k)); main.innerHTML = ''; main.append(...P[k]()); }
  Object.entries(pages).forEach(([k, [n, ic]]) => nav.append(el('button', { class: 'snb', 'data-k': k, html: W.i(ic, 17) + '<span>' + n + '</span>', onclick: () => show(k) })));
  win.body.append(el('div', { class: 'settings' }, nav, main)); win.onargs = a => a.page && show(a.page); show(args.page || 'personalize');
} });

/* ---------- Aura (assistant) ---------- */
W.reg('aura', { name: 'Aura', icon: 'sparkle', w: 440, h: 580, minW: 340, single: true, open(win) {
  const msgs = el('div', { class: 'msgs' }), inp = el('input', { class: 'inp', placeholder: 'Ask Aura to do something…' });
  const say = (t, c) => { const m = el('div', { class: 'msg ' + c }); m.textContent = t; msgs.append(m); msgs.scrollTop = msgs.scrollHeight; };
  const jokes = ['Why do programmers prefer dark mode? Because light attracts bugs.', 'There are 10 kinds of people: those who understand binary and those who don\'t.', 'A SQL query walks into a bar, sees two tables and asks: "Can I join you?"'];
  function reply(q) {
    const l = q.toLowerCase().trim(); let m;
    if (/^(hi|hello|hey)\b/.test(l)) return 'Hello! I can open apps, change settings, do math, set timers and take notes.';
    if ((m = l.match(/^(?:open|launch|start)\s+(.+)/))) { const a = W.availableApps().find(x => x.id === m[1] || x.name.toLowerCase().includes(m[1])); if (a) { W.launch(a.id); return 'Opening ' + a.name + '.'; } return "I couldn't find an app called \"" + m[1] + '".'; }
    if (/dark( mode)?/.test(l) && !/light/.test(l)) { W.cfg.set('theme', 'dark'); return 'Dark mode is on.'; }
    if (/light( mode)?/.test(l)) { W.cfg.set('theme', 'light'); return 'Light mode is on.'; }
    if (/wallpaper|background/.test(l)) { W.cfg.set('wall', (W.cfg.get('wall') + 1) % W.WALLS.length); return 'Wallpaper changed.'; }
    if ((m = l.match(/brightness\D*(\d+)/))) { W.cfg.set('brightness', W.clamp(+m[1], 20, 100)); return 'Brightness set.'; }
    if (/night light/.test(l)) { const on = !/off/.test(l); W.cfg.set('night', on); return 'Night light ' + (on ? 'on' : 'off') + '.'; }
    if ((m = l.match(/(?:accent|color)\s+(red|blue|green|pink|purple|orange|cyan)/))) { W.cfg.set('accent', { red: '#e5484d', blue: '#4c8dff', green: '#18c48f', pink: '#ff5c8a', purple: '#7a5cff', orange: '#ff9f43', cyan: '#00c2ff' }[m[1]]); return 'Accent color updated.'; }
    if ((m = l.match(/(?:timer|remind me).*?(\d+)\s*(second|sec|minute|min|hour)/))) { const n = +m[1], ms = n * (/^h/.test(m[2]) ? 3600000 : /^m/.test(m[2]) ? 60000 : 1000); setTimeout(() => W.notify({ title: 'Timer done', body: n + ' ' + m[2] + ' elapsed', icon: 'clock' }), ms); return 'Timer set for ' + n + ' ' + m[2] + '.'; }
    if ((m = q.match(/^(?:note|remember)[: ]+(.+)/i))) { const p = HOME + '/Documents/' + W.fs.uniq(HOME + '/Documents', 'Aura note.txt'); W.fs.write(p, m[1] + '\n'); return 'Saved to Documents as ' + W.fs.name(p) + '.'; }
    if ((m = q.match(/^(?:create|make) (?:a )?folder (.+)/i))) { W.fs.mkdir(HOME + '/Desktop/' + m[1]); return 'Folder "' + m[1] + '" created on the desktop.'; }
    if ((m = l.match(/^search (?:for )?(.+)/))) { W.launch('browser', { q: m[1] }); return 'Searching for ' + m[1] + '.'; }
    if (/time/.test(l)) return 'It is ' + new Date().toLocaleTimeString() + '.';
    if (/date|today|day/.test(l)) return 'Today is ' + W.longDate() + '.';
    if (/joke/.test(l)) return jokes[Math.floor(Math.random() * jokes.length)];
    if (/lock/.test(l)) { setTimeout(W.lock, 500); return 'Locking…'; }
    if (/close all/.test(l)) { W.wm.wins.slice().forEach(w => w.close()); return 'Closed all windows.'; }
    if (/who are you|your name/.test(l)) return "I'm Aura, the built-in assistant of this Windows 12 concept. I run offline in your browser.";
    try { if (/\d/.test(l)) return '= ' + W.calc(l.replace(/^(what is|calculate|calc|=)\s*/, '').replace(/\?$/, '')); } catch (e) { }
    return 'I can: open apps, switch dark/light, change wallpaper, set brightness, set a timer, save a note, create a folder, search the web, or calculate. Try "open settings".';
  }
  const send = () => { const q = inp.value.trim(); if (!q) return; inp.value = ''; say(q, 'u'); setTimeout(() => say(reply(q), 'a'), 300); };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  const chips = el('div', { class: 'chips' }, ['Open settings', 'Dark mode', 'Timer for 1 minute', 'Tell me a joke', '24*7+3'].map(t => el('button', { class: 'chip', onclick: () => { inp.value = t; send(); } }, t)));
  win.body.append(el('div', { class: 'chat' }, msgs, chips, el('div', { class: 'crow' }, inp, el('button', { class: 'btn pri', onclick: send, html: W.i('send', 16) }))));
  say("Hi! I'm Aura. Ask me to open an app, change a setting, set a timer, or do some math.", 'a'); setTimeout(() => inp.focus(), 60);
} });
})();
