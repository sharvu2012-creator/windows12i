'use strict';
/* ============ Windows 12 Concept : core ============ */
const W = window.W = {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
function el(tag, props, ...kids) {
  const e = document.createElement(tag);
  if (props) for (const k in props) {
    const v = props[k]; if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
    else if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'selected') e[k] = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}
Object.assign(W, { $, $$, el });
W.esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
W.pad = n => String(n).padStart(2, '0');
W.uid = () => Math.random().toString(36).slice(2, 9);
W.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
W.sleep = ms => new Promise(r => setTimeout(r, ms));

W.store = {
  get(k, d) { try { const v = localStorage.getItem('w12.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('w12.' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem('w12.' + k); } catch (e) { } }
};
W.bus = (() => {
  const m = {};
  return {
    on(e, f) { (m[e] = m[e] || []).push(f); return () => { m[e] = (m[e] || []).filter(x => x !== f); }; },
    emit(e, ...a) { (m[e] || []).slice().forEach(f => { try { f(...a); } catch (err) { console.error(err); } }); }
  };
})();

/* ---------------- icons ---------------- */
const G = {
  folder: '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2.2h7.5A2.5 2.5 0 0 1 21 9.7v7.8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/>',
  file: '<path d="M6.5 3h7.2L18 7.3V19a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M13.5 3v4.5H18"/>',
  note: '<path d="M6.5 3h11A1.5 1.5 0 0 1 19 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15A1.5 1.5 0 0 1 6.5 3z"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
  code: '<path d="M9 7l-5 5 5 5M15 7l5 5-5 5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 2.7 3 15.3 0 18M12 3c-3 2.7-3 15.3 0 18"/>',
  gear: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.4"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
  terminal: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M7 9.5l3 2.5-3 2.5M12.5 15h4.5"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01"/>',
  palette: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-.9 1.6-1.9-.4-1 .2-2 1.4-2h1.6a3.4 3.4 0 0 0 3.4-3.4C20 8 16.5 3.5 12 3.5z"/><path d="M7.8 11h.01M10 7.8h.01M14 7.8h.01"/>',
  photo: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M3.5 17l5-4.5 4 3.5 3-2.5 5 4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 1.8"/>',
  cloud: '<path d="M7.5 18.5a4.2 4.2 0 0 1-.4-8.4 5.4 5.4 0 0 1 10.3 1.2 3.7 3.7 0 0 1-.4 7.2z"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M8.5 3v4M15.5 3v4"/>',
  bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  chart: '<path d="M4 4v16h16"/><path d="M7.5 15l3.5-4 3 2.5 4.5-6"/>',
  sparkle: '<path d="M11 3.5l1.8 5.2 5.2 1.8-5.2 1.8L11 17.5l-1.8-5.2L4 10.5l5.2-1.8z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  music: '<path d="M9 17.5V6l10-2v11.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>',
  game: '<rect x="2.5" y="7.5" width="19" height="10" rx="5"/><path d="M7 10.8v3.4M5.3 12.5h3.4M15.5 11.5h.01M18 13.5h.01"/>',
  camera: '<path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
  bomb: '<circle cx="11" cy="14" r="6"/><path d="M15 9.5l2-2M17.5 5.5l1 1M19 4l1 .5M20.5 7.5h.01"/>',
  snake: '<path d="M5 18h8a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h9"/><path d="M18 6h.01"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.8"/><rect x="13" y="4" width="7" height="7" rx="1.8"/><rect x="4" y="13" width="7" height="7" rx="1.8"/><rect x="13" y="13" width="7" height="7" rx="1.8"/>',
  sticky: '<path d="M5 4h14v10l-5 6H5z"/><path d="M14 20v-5h5M8.5 9h7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8h.01"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>',
  wifi: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0"/><path d="M12 19.5h.01"/>',
  bluetooth: '<path d="M7 7.5l10 9-5 4.5v-18l5 4.5-10 9"/>',
  volume: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  battery: '<rect x="3" y="7.5" width="16" height="9" rx="2.5"/><path d="M21.5 11v2M6 10.5v3M9 10.5v3M12 10.5v3"/>',
  power: '<path d="M12 3v8.5"/><path d="M6.8 6.5a8 8 0 1 0 10.4 0"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  restart: '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v4.5h-4.5"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>',
  plane: '<path d="M3 11.5l18-7.5-7.5 18-2.5-7.5z"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/>',
  desktop: '<rect x="3" y="4.5" width="18" height="12" rx="2.5"/><path d="M9 20h6M12 16.5V20"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  min: '<path d="M6 12h12"/>',
  max: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  restore: '<path d="M8.5 8.5V6.5h9v9h-2"/><rect x="5.5" y="8.5" width="9" height="9" rx="1.5"/>',
  back: '<path d="M15 5l-7 7 7 7"/>', fwd: '<path d="M9 5l7 7-7 7"/>', up: '<path d="M5 15l7-7 7 7"/>', down: '<path d="M5 9l7 7 7-7"/>',
  refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4h-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  home: '<path d="M4 11l8-6.5 8 6.5v8.5a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z"/>',
  download: '<path d="M12 4v11M7.5 11l4.5 4.5 4.5-4.5M5 19.5h14"/>',
  more: '<path d="M5 12h.01M12 12h.01M19 12h.01" stroke-width="3"/>',
  taskview: '<rect x="3" y="5" width="18" height="12" rx="2.5"/><path d="M7 20.5h10"/>',
  list: '<path d="M8 6.5h12M8 12h12M8 17.5h12M4 6.5h.01M4 12h.01M4 17.5h.01"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6A1.5 1.5 0 0 0 14 4.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',
  cut: '<circle cx="6.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/><path d="M8 15.5L18 4M16 15.5L6 4"/>',
  paste: '<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 5V4h6v1"/>',
  edit: '<path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19z"/>',
  save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
  undo: '<path d="M8.5 6.5L4 11l4.5 4.5"/><path d="M4.5 11H15a4.5 4.5 0 0 1 0 9h-3"/>',
  redo: '<path d="M15.5 6.5L20 11l-4.5 4.5"/><path d="M19.5 11H9a4.5 4.5 0 0 0 0 9h3"/>',
  brush: '<path d="M18.5 3.5l2 2-9 9-3 .5.5-3z"/><path d="M8 15c-2 0-3 1.5-3 3.5 0 .8-.5 1.5-1.5 2 3 .5 6-.5 6-3.5"/>',
  eraser: '<path d="M4.5 15.5l9.5-9.5 6 6-6.5 6.5H8z"/><path d="M10.5 9.5l6 6"/>',
  bucket: '<path d="M5 12l7-7 7 7-6 6a2 2 0 0 1-3 0z"/><path d="M4 12h15"/>',
  line: '<path d="M5 19L19 5"/>', rect: '<rect x="4.5" y="6.5" width="15" height="11" rx="1.2"/>', ellipse: '<ellipse cx="12" cy="12" rx="8" ry="6"/>',
  play: '<path d="M8 5.5v13l11-6.5z"/>', pause: '<path d="M8.5 5v14M15.5 5v14"/>', stop: '<rect x="6" y="6" width="12" height="12" rx="1.5"/>',
  next: '<path d="M6 5.5v13l9-6.5zM18 5.5v13"/>', prev: '<path d="M18 5.5v13l-9-6.5zM6 5.5v13"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z"/>',
  access: '<circle cx="12" cy="5" r="1.8"/><path d="M5 9l7 1.5L19 9M12 10.5V15l-3 5.5M12 15l3 5.5"/>',
  storage: '<ellipse cx="12" cy="6.5" rx="7.5" ry="3"/><path d="M4.5 6.5v11c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-11M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"/>',
  pin: '<path d="M9 4h6l-1 6 3 3H7l3-3zM12 13v7"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  rotate: '<path d="M19 8a8 8 0 1 0 1 5"/><path d="M19.5 3.5V8H15"/>',
  zoomin: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5M10.5 8v5M8 10.5h5"/>',
  sort: '<path d="M7 5v14M4 16l3 3 3-3M17 19V5M14 8l3-3 3 3"/>',
  keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M7 14h10"/>',
  mic: '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/>',
  send: '<path d="M3 11.5l18-7.5-7.5 18-2.5-7.5z"/>',
  flag: '<path d="M6 21V4M6 4h11l-2 4 2 4H6"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  update: '<path d="M12 4v10M8 10.5l4 4 4-4M5 19.5h14"/>',
  bt: '<path d="M7 7.5l10 9-5 4.5v-18l5 4.5-10 9"/>',
  dots: '<path d="M6 12h.01M12 12h.01M18 12h.01" stroke-width="3"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2.5v3.5M15 2.5v3.5M9 18v3.5M15 18v3.5M2.5 9h3.5M2.5 15h3.5M18 9h3.5M18 15h3.5"/>'
};
const TILES = {
  file: ['#9db0d3', '#5b6f98'], note: ['#5ec8ff', '#2072e8'], code: ['#ffc94a', '#e8801a'], globe: ['#34d8ff', '#2b66ff'], gear: ['#7f8ea6', '#46526a'],
  terminal: ['#3a4152', '#0f1218'], calc: ['#46506a', '#1d2230'], palette: ['#ff8a5c', '#c53bb8'], photo: ['#36d6a3', '#1c86dc'], clock: ['#ffa650', '#e3581e'],
  cloud: ['#62bcff', '#2b6fe6'], calendar: ['#ff6677', '#d3213f'], bag: ['#5a96ff', '#7e3cff'], chart: ['#35cf92', '#0e8a6c'], sparkle: ['#b05bff', '#4a6cff'],
  music: ['#ff62ae', '#a43cff'], game: ['#8a7cff', '#4b3bd9'], camera: ['#59657c', '#222a3a'], bomb: ['#8392b1', '#3e4b68'], snake: ['#47d96f', '#0c8f3d'],
  grid: ['#f7b64e', '#e2742a'], sticky: ['#ffd84a', '#f0a010'], trash: ['#a2b3cc', '#5f7290'], desktop: ['#5cabff', '#2b62d8'], info: ['#6ea0ff', '#3b58d8'],
  home: ['#5cabff', '#2b62d8'], download: ['#38c9a0', '#1485b0'], user: ['#8a7cff', '#5b3be0'], music2: ['#ff62ae', '#a43cff'], storage: ['#7f8ea6', '#46526a'], shield: ['#4cc58a', '#168a62']
};
W.i = (n, s = 18) => `<svg class="i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${G[n] || ''}</svg>`;
W.ai = (n, s = 32) => {
  if (n === 'folder') return `<svg class="ai" width="${s}" height="${s}" viewBox="0 0 40 40"><path d="M4 10a3 3 0 0 1 3-3h8l3.5 3.5H33a3 3 0 0 1 3 3V30a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#e69a14"/><path d="M4 16a3 3 0 0 1 3-3h26a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="url(#g-folder)"/><path d="M4 16a3 3 0 0 1 3-3h26a3 3 0 0 1 3 3v2H4z" fill="#fff" opacity=".18"/></svg>`;
  const k = TILES[n] ? n : 'file';
  return `<svg class="ai" width="${s}" height="${s}" viewBox="0 0 40 40"><rect x="1" y="1" width="38" height="38" rx="10" fill="url(#g-${k})"/><path d="M11 1h18a10 10 0 0 1 10 10v8H1v-8A10 10 0 0 1 11 1z" fill="#fff" opacity=".12"/><g transform="translate(6.5 6.5) scale(1.125)" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${G[n] || G.file}</g></svg>`;
};
let _lg = 0;
W.logo = (s = 24) => { const k = 'lg' + (++_lg); return `<svg class="logo" width="${s}" height="${s}" viewBox="0 0 32 32"><defs><linearGradient id="${k}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#63d6ff"/><stop offset="1" stop-color="#7a5cff"/></linearGradient><linearGradient id="${k}b" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff80dc"/><stop offset="1" stop-color="#7a5cff"/></linearGradient></defs><g transform="translate(16 16)"><ellipse rx="5.2" ry="9" cy="-7.5" fill="url(#${k}a)"/><ellipse rx="5.2" ry="9" cy="-7.5" transform="rotate(90)" fill="url(#${k}b)" opacity=".92"/><ellipse rx="5.2" ry="9" cy="-7.5" transform="rotate(180)" fill="url(#${k}a)" opacity=".88"/><ellipse rx="5.2" ry="9" cy="-7.5" transform="rotate(270)" fill="url(#${k}b)" opacity=".85"/></g></svg>`; };
(function injectDefs() {
  const d = $('#defs'); if (!d) return;
  d.innerHTML = '<defs>' + Object.entries(TILES).concat([['folder', ['#ffd56a', '#f4aa1c']]]).map(([k, [a, b]]) => `<linearGradient id="g-${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`).join('') + '</defs>';
})();
W.fileIcon = (name, s = 32) => {
  const e = W.fs.ext(name);
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(e)) return W.ai('photo', s);
  if (['txt', 'md', 'log', 'csv', 'rtf'].includes(e)) return W.ai('note', s);
  if (['js', 'json', 'css', 'html', 'htm', 'py', 'ts', 'xml', 'sh', 'bat', 'yml', 'c', 'cpp', 'java'].includes(e)) return W.ai('code', s);
  if (['mp3', 'wav', 'ogg'].includes(e)) return W.ai('music', s);
  return W.ai('file', s);
};

/* ---------------- wallpapers ---------------- */
const svgWrap = inner => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;
function bloom(a, b, c1, c2, c3, glow) {
  let p = '';
  for (let k = 0; k < 8; k++) p += `<ellipse cx="0" cy="-230" rx="105" ry="300" transform="rotate(${k * 45})" fill="url(#pg)" opacity=".55"/>`;
  for (let k = 0; k < 8; k++) p += `<ellipse cx="0" cy="-150" rx="60" ry="190" transform="rotate(${k * 45 + 22.5})" fill="url(#pg)" opacity=".4"/>`;
  return svgWrap(`<defs><radialGradient id="bg" cx="50%" cy="52%" r="75%"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".55" stop-color="${c2}"/><stop offset="1" stop-color="${c3}" stop-opacity="0"/></linearGradient><filter id="bl"><feGaussianBlur stdDeviation="3"/></filter><radialGradient id="gl"><stop offset="0" stop-color="${glow}" stop-opacity=".95"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient></defs><rect width="1920" height="1080" fill="url(#bg)"/><g transform="translate(960 560) scale(1.08)" filter="url(#bl)">${p}</g><circle cx="960" cy="560" r="170" fill="url(#gl)" opacity=".55"/>`);
}
const WALLS = [
  { name: 'Bloom', dark: true, svg: () => bloom('#1b3a95', '#050818', '#58d2ff', '#6a5cff', '#c04dff', '#9fe0ff') },
  { name: 'Bloom Light', dark: false, svg: () => bloom('#e9f3ff', '#a9c7ff', '#4cc2ff', '#7a8cff', '#ff8be0', '#ffffff') },
  { name: 'Aurora', dark: true, svg: () => svgWrap(`<defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="90"/></filter></defs><rect width="1920" height="1080" fill="#050a1c"/><g filter="url(#b)"><ellipse cx="500" cy="420" rx="520" ry="230" fill="#00e5a8" opacity=".6"/><ellipse cx="1300" cy="320" rx="560" ry="200" fill="#6a5cff" opacity=".7"/><ellipse cx="1500" cy="760" rx="420" ry="220" fill="#ff5ec8" opacity=".5"/><ellipse cx="600" cy="880" rx="480" ry="200" fill="#1aa0ff" opacity=".55"/></g>`) },
  { name: 'Dunes', dark: true, svg: () => svgWrap(`<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1446"/><stop offset=".55" stop-color="#8a3f9e"/><stop offset="1" stop-color="#ff9a6b"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#s)"/><circle cx="1400" cy="570" r="130" fill="#ffd9a8" opacity=".92"/><path d="M0 760C300 660 520 700 800 770S1400 830 1920 700V1080H0Z" fill="#5b2a7a" opacity=".88"/><path d="M0 860C350 770 650 830 960 880S1500 940 1920 820V1080H0Z" fill="#3a1a5c"/><path d="M0 960C400 900 800 960 1100 990S1600 1010 1920 940V1080H0Z" fill="#1d0e38"/>`) },
  { name: 'Glass', dark: false, svg: () => svgWrap(`<defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dfeaff"/><stop offset="1" stop-color="#f8e8ff"/></linearGradient><linearGradient id="r1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6aa8ff"/><stop offset="1" stop-color="#b78cff"/></linearGradient><linearGradient id="r2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff9ad0"/><stop offset="1" stop-color="#ffc58a"/></linearGradient><filter id="f"><feGaussianBlur stdDeviation="14"/></filter></defs><rect width="1920" height="1080" fill="url(#b)"/><g filter="url(#f)" opacity=".8"><path d="M-100 700C300 300 700 900 1100 500S1700 300 2050 600" fill="none" stroke="url(#r1)" stroke-width="150" stroke-linecap="round"/><path d="M-100 950C400 600 800 1100 1200 800S1700 650 2050 900" fill="none" stroke="url(#r2)" stroke-width="110" stroke-linecap="round"/></g>`) },
  { name: 'Ocean', dark: true, svg: () => svgWrap(`<defs><linearGradient id="o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#021f33"/><stop offset=".6" stop-color="#06788a"/><stop offset="1" stop-color="#16c9b6"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#o)"/><path d="M0 600C300 540 600 680 960 610S1600 540 1920 620V1080H0Z" fill="#fff" opacity=".07"/><path d="M0 700C320 640 640 780 1000 710S1620 650 1920 730V1080H0Z" fill="#fff" opacity=".08"/><path d="M0 820C340 760 700 880 1040 820S1640 770 1920 840V1080H0Z" fill="#fff" opacity=".1"/><circle cx="1500" cy="260" r="90" fill="#bff6ff" opacity=".5"/>`) },
  { name: 'Noir', dark: true, svg: () => svgWrap(`<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a5cff"/><stop offset="1" stop-color="#00e0ff"/></linearGradient><filter id="f"><feGaussianBlur stdDeviation="24"/></filter></defs><rect width="1920" height="1080" fill="#07080d"/><circle cx="960" cy="1260" r="620" fill="none" stroke="url(#g)" stroke-width="46" filter="url(#f)" opacity=".85"/><circle cx="960" cy="1260" r="620" fill="none" stroke="url(#g)" stroke-width="3" opacity=".9"/><circle cx="960" cy="1260" r="540" fill="none" stroke="url(#g)" stroke-width="1.5" opacity=".4"/>`) }
];
W.WALLS = WALLS;
const wallCache = {};
W.wallUrl = i => { const k = WALLS[i] ? i : 0; return wallCache[k] || (wallCache[k] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(WALLS[k].svg())); };
W.wallCss = () => { const w = W.cfg.get('wall'); if (typeof w === 'number') return `url("${W.wallUrl(w)}")`; const src = W.fs.imgSrc(w); return src ? `url("${src}")` : `url("${W.wallUrl(0)}")`; };

/* ---------------- config ---------------- */
const DEF = {
  theme: 'dark', accent: '#4c8dff', wall: 0, fx: true, align: 'center', showSearch: true, showWidgets: true, showTaskview: true,
  name: 'User', avatar: '#7a5cff', h24: false, seconds: false, textScale: 100, reduceMotion: false, hc: false, brightness: 100, volume: 60,
  night: false, nightStr: 40, wifi: true, bt: true, airplane: false, saver: false, dnd: false, startRec: true, city: null, pcname: 'W12-DESKTOP',
  installed: [], pinned: ['explorer', 'browser', 'store', 'aura', 'notepad', 'terminal', 'settings', 'photos', 'paint', 'calc', 'clock', 'weather', 'calendar', 'taskman'],
  taskPinned: ['explorer', 'browser', 'store', 'aura', 'settings'], iconSize: 'm', showIcons: true, sort: 'name'
};
W.cfg = {
  d: Object.assign({}, DEF, W.store.get('cfg', {})),
  get(k) { return this.d[k]; },
  set(k, v) { this.d[k] = v; W.store.set('cfg', this.d); W.bus.emit('cfg', k, v); }
};

/* ---------------- time helpers ---------------- */
W.time = (d = new Date(), sec) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: (sec === undefined ? W.cfg.get('seconds') : sec) ? '2-digit' : undefined, hour12: !W.cfg.get('h24') });
W.date = (d = new Date()) => d.toLocaleDateString();
W.longDate = (d = new Date()) => d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

/* ---------------- calculator engine (safe parser) ---------------- */
W.calc = function (src, deg) {
  const s = String(src).toLowerCase().replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '').replace(/π/g, 'pi').replace(/√/g, 'sqrt').replace(/\*\*/g, '^');
  let i = 0;
  const fn = { sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, log: Math.log10, ln: Math.log, sqrt: Math.sqrt, abs: Math.abs, exp: Math.exp, floor: Math.floor, ceil: Math.ceil, round: Math.round };
  const fact = n => { if (n < 0 || n !== Math.floor(n) || n > 170) throw new Error('domain'); let r = 1; for (let k = 2; k <= n; k++) r *= k; return r; };
  const peek = () => s[i];
  function expr() { let v = term(); while (peek() === '+' || peek() === '-') { const o = s[i++]; const r = term(); v = o === '+' ? v + r : v - r; } return v; }
  function term() { let v = unary(); while (peek() === '*' || peek() === '/') { const o = s[i++]; const r = unary(); v = o === '*' ? v * r : v / r; } return v; }
  function unary() { if (peek() === '-') { i++; return -unary(); } if (peek() === '+') { i++; return unary(); } return pow(); }
  function pow() { const b = post(); if (peek() === '^') { i++; return Math.pow(b, unary()); } return b; }
  function post() { let v = atom(); for (; ;) { if (peek() === '%') { i++; v /= 100; } else if (peek() === '!') { i++; v = fact(v); } else break; } return v; }
  function atom() {
    if (peek() === '(') { i++; const v = expr(); if (peek() !== ')') throw new Error('paren'); i++; return v; }
    const rest = s.slice(i);
    let m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/.exec(rest);
    if (m) { i += m[0].length; return parseFloat(m[0]); }
    m = /^[a-z]+/.exec(rest);
    if (m) {
      const n = m[0]; i += n.length;
      if (n === 'pi') return Math.PI; if (n === 'e') return Math.E;
      if (fn[n]) {
        if (peek() !== '(') throw new Error('fn'); i++; let a = expr(); if (peek() !== ')') throw new Error('paren'); i++;
        if (deg && ['sin', 'cos', 'tan'].includes(n)) a = a * Math.PI / 180;
        let r = fn[n](a); if (deg && ['asin', 'acos', 'atan'].includes(n)) r = r * 180 / Math.PI; return r;
      }
    }
    throw new Error('syntax');
  }
  const v = expr(); if (i !== s.length) throw new Error('syntax');
  if (!isFinite(v)) throw new Error('math');
  return +v.toPrecision(12);
};

/* ---------------- virtual file system ---------------- */
W.fs = (function () {
  const now = () => Date.now();
  const D = c => ({ t: 'd', c: c || {}, m: now() });
  const F = (d, x) => Object.assign({ t: 'f', d, m: now() }, x || {});
  const WELCOME = `Welcome to Windows 12 (concept)!

This is a fan-made desktop that runs entirely in your browser.
Everything you create (files, notes, settings) is saved in this
browser's local storage, so it is still here next time.

Things to try
  - Right-click the desktop and create a folder or a text file
  - Drag a window to the screen edge to snap it
  - Hover the maximize button for snap layouts
  - Open Aura and ask it to change the theme, set a timer, or open apps
  - Open the Store and install games
  - Task View (taskbar) lets you add virtual desktops
  - Open Terminal and type "help"

Not affiliated with or endorsed by Microsoft.`;
  function seed() {
    const pics = {}; WALLS.forEach(w => { pics[w.name + '.svg'] = F(w.svg(), { img: true }); });
    return D({
      'C:': D({
        Users: D({ User: D({
          Desktop: D({}),
          Documents: D({
            'Welcome.txt': F(WELCOME),
            'Todo.txt': F('[ ] Deploy my Windows 12 site to Vercel\n[ ] Show it to friends\n[x] Look at the wallpapers\n'),
            Projects: D({ 'readme.md': F('# My Project\n\nA place for your ideas.\n') })
          }),
          Downloads: D({ 'setup-notes.txt': F('Downloads go here.\n') }),
          Pictures: D(pics), Music: D({}), Videos: D({})
        }) }),
        Windows: D({ System32: D({}) }), 'Program Files': D({}), '$Recycle.Bin': D({})
      })
    });
  }
  let root = W.store.get('fs', null);
  if (!root || root.t !== 'd') root = seed();
  let tm = 0, warned = false;
  const save = () => { clearTimeout(tm); tm = setTimeout(() => { if (!W.store.set('fs', root) && !warned) { warned = true; W.notify && W.notify({ title: 'Storage almost full', body: 'Some changes could not be saved in this browser.', icon: 'storage', app: 'System' }); } }, 400); };
  const parts = p => String(p).split('/').filter(Boolean);
  const fs = {
    root: () => root,
    join: (a, b) => a.replace(/\/+$/, '') + '/' + b,
    dirname: p => parts(p).slice(0, -1).join('/'),
    name: p => parts(p).slice(-1)[0] || '',
    ext: n => { const m = /\.([^.\/]+)$/.exec(n); return m ? m[1].toLowerCase() : ''; },
    get(p) { let n = root; for (const k of parts(p)) { if (!n || n.t !== 'd') return null; n = n.c[k]; } return n || null; },
    exists: p => !!fs.get(p),
    isDir: p => { const n = fs.get(p); return !!n && n.t === 'd'; },
    list(p) { const n = fs.get(p); if (!n || n.t !== 'd') return []; return Object.entries(n.c).map(([name, node]) => ({ name, node, path: fs.join(p, name) })); },
    read(p) { const n = fs.get(p); return n && n.t === 'f' ? n.d : null; },
    write(p, data, extra) {
      const dir = fs.get(fs.dirname(p)); if (!dir || dir.t !== 'd') return false;
      const nm = fs.name(p); const old = dir.c[nm];
      if (old && old.t === 'd') return false;
      dir.c[nm] = F(data, Object.assign({}, old && old.img ? { img: true } : {}, extra)); dir.m = now(); save(); W.bus.emit('fs', fs.dirname(p)); return true;
    },
    mkdir(p) { const dir = fs.get(fs.dirname(p)); const nm = fs.name(p); if (!dir || dir.t !== 'd' || dir.c[nm]) return false; dir.c[nm] = D(); save(); W.bus.emit('fs', fs.dirname(p)); return true; },
    remove(p) { const dir = fs.get(fs.dirname(p)); const nm = fs.name(p); if (!dir || !dir.c[nm]) return false; delete dir.c[nm]; save(); W.bus.emit('fs', fs.dirname(p)); return true; },
    uniq(dir, name) {
      const d = fs.get(dir); if (!d || !d.c[name]) return name;
      const e = fs.ext(name); const base = e ? name.slice(0, -(e.length + 1)) : name;
      for (let k = 2; k < 999; k++) { const n = e ? `${base} (${k}).${e}` : `${base} (${k})`; if (!d.c[n]) return n; }
      return name + W.uid();
    },
    trash(p) {
      const n = fs.get(p); if (!n) return false; if (p.startsWith('C:/$Recycle.Bin')) return fs.remove(p);
      const bin = 'C:/$Recycle.Bin'; const nm = fs.uniq(bin, fs.name(p)); const copy = JSON.parse(JSON.stringify(n)); copy.orig = p;
      fs.get(bin).c[nm] = copy; fs.remove(p); save(); W.bus.emit('fs', bin); return true;
    },
    restore(p) {
      const n = fs.get(p); if (!n || !n.orig) return false; let dst = fs.dirname(n.orig); if (!fs.isDir(dst)) dst = 'C:/Users/User/Documents';
      const nm = fs.uniq(dst, fs.name(n.orig)); const o = n.orig; delete n.orig; fs.get(dst).c[nm] = n; fs.remove(p); save(); W.bus.emit('fs', dst); return true;
    },
    emptyTrash() { const b = fs.get('C:/$Recycle.Bin'); b.c = {}; save(); W.bus.emit('fs', 'C:/$Recycle.Bin'); },
    rename(p, nn) { nn = nn.trim(); if (!nn || /[\\/:*?"<>|]/.test(nn)) return false; const dir = fs.get(fs.dirname(p)); const old = fs.name(p); if (!dir || !dir.c[old] || (dir.c[nn] && nn !== old)) return false; if (nn === old) return true; dir.c[nn] = dir.c[old]; delete dir.c[old]; save(); W.bus.emit('fs', fs.dirname(p)); return true; },
    move(src, dstDir) { if (dstDir === src || (dstDir + '/').startsWith(src + '/')) return null; const n = fs.get(src); if (!n || !fs.isDir(dstDir)) return null; if (fs.dirname(src) === dstDir) return src; const nm = fs.uniq(dstDir, fs.name(src)); fs.get(dstDir).c[nm] = n; const sd = fs.dirname(src); fs.get(sd).c && delete fs.get(sd).c[fs.name(src)]; save(); W.bus.emit('fs', sd); W.bus.emit('fs', dstDir); return fs.join(dstDir, nm); },
    copy(src, dstDir) { if ((dstDir + '/').startsWith(src + '/')) return null; const n = fs.get(src); if (!n || !fs.isDir(dstDir)) return null; const nm = fs.uniq(dstDir, fs.name(src)); const c = JSON.parse(JSON.stringify(n)); delete c.orig; c.m = now(); fs.get(dstDir).c[nm] = c; save(); W.bus.emit('fs', dstDir); return fs.join(dstDir, nm); },
    size(n) { if (!n) return 0; if (n.t === 'f') return (n.d || '').length; return Object.values(n.c).reduce((a, c) => a + fs.size(c), 0); },
    search(q, limit = 25) {
      q = q.toLowerCase(); const out = [];
      (function walk(n, path) { if (out.length >= limit || n.t !== 'd') return; for (const [name, c] of Object.entries(n.c)) { if (path.includes('$Recycle') || name === 'Windows' || name === 'Program Files') continue; const p = path ? path + '/' + name : name; if (name.toLowerCase().includes(q)) out.push({ name, path: p, dir: c.t === 'd' }); if (c.t === 'd') walk(c, p); } })(root, '');
      return out.slice(0, limit);
    },
    imgSrc(p) {
      const n = typeof p === 'string' ? fs.get(p) : null; if (!n || n.t !== 'f') return null;
      if (typeof n.d === 'string' && n.d.startsWith('data:')) return n.d;
      if (fs.ext(p) === 'svg') return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(n.d);
      return null;
    },
    pretty: p => p.replace(/\//g, '\\'),
    fmtSize(b) { if (b < 1024) return b + ' B'; if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'; return (b / 1048576).toFixed(1) + ' MB'; },
    typeName(name, isDir) { if (isDir) return 'File folder'; const e = fs.ext(name); return e ? e.toUpperCase() + ' File' : 'File'; },
    save, reset() { W.store.del('fs'); }
  };
  return fs;
})();

/* ---------------- opening files, recents ---------------- */
W.addRecent = r => {
  const list = W.store.get('recent', []).filter(x => !(x.t === r.t && (x.p || x.id) === (r.p || r.id)));
  list.unshift(r); W.store.set('recent', list.slice(0, 12));
};
W.openFile = path => {
  const n = W.fs.get(path); if (!n) return;
  if (n.t === 'd') return W.launch('explorer', { path });
  const e = W.fs.ext(path); W.addRecent({ t: 'file', p: path });
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(e)) return W.launch('photos', { path });
  if (['mp3', 'wav', 'ogg'].includes(e)) return W.launch('media');
  return W.launch('notepad', { path });
};

/* ---------------- search ---------------- */
W.search = q => {
  q = q.trim(); const ql = q.toLowerCase();
  const apps = W.availableApps().filter(a => a.name.toLowerCase().includes(ql) || a.id.includes(ql)).sort((a, b) => (b.name.toLowerCase().startsWith(ql) - a.name.toLowerCase().startsWith(ql)) || a.name.localeCompare(b.name));
  const files = W.fs.search(q, 8);
  let calc = null;
  if (/[\d)]/.test(q) && /[-+*/^%()]|sin|cos|tan|sqrt|log|ln/.test(q) && /^[\d\s+\-*/^%().a-z×÷π√!]+$/i.test(q)) { try { calc = W.calc(q); } catch (e) { } }
  return { apps, files, calc };
};
