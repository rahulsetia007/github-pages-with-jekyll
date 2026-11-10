// Shared drawing helpers for the @tech_blogcorner Reels.
// Every frame is a pure function of time t (seconds), so renders are repeatable.

const W = 1080, H = 1920;
// Safe zones from the master brief: no text in top 250px, bottom 420px, right 120px.
const SAFE = { l: 64, r: 960, t: 250, b: 1500 };
const CX = (SAFE.l + SAFE.r) / 2; // horizontal centre of the safe area
const C = {
  bg: '#050805', green: '#22C55E', brush: '#1E9447', neon: '#7CFF5A',
  white: '#F5F5F5', red: '#FF4D4D', grey: '#8A938A', card: '#0C150D', line: '#1B2A1C',
};

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const eOut = x => 1 - Math.pow(1 - x, 3);
const eInOut = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eBack = x => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
// deterministic pseudo-random
const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// Scale for a "slam" entrance that starts at t0: big -> settles at 1 with a slight overshoot.
function slam(t, t0, from = 1.18, dur = 0.22) {
  if (t < t0) return 0;
  const k = prog(t, t0, t0 + dur);
  return lerp(from, 1, eBack(k));
}
// Scale for a "pop" entrance (0 -> 1 with overshoot).
function pop(t, t0, dur = 0.25) {
  if (t < t0) return 0;
  return eBack(prog(t, t0, t0 + dur));
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function wrap(ctx, text, maxW) {
  const out = [];
  for (const para of String(text).split('\n')) {
    const words = para.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { out.push(line); line = w; }
      else line = test;
    }
    out.push(line);
  }
  return out;
}

// Background: near-black with a slowly drifting green grid and a soft glow,
// so even "still" moments have motion.
function background(ctx, t, glow = C.green, glowAlpha = 0.18) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.strokeStyle = 'rgba(34,197,94,0.07)';
  ctx.lineWidth = 2;
  const step = 90, off = (t * 40) % step;
  for (let x = -step + off * 0.5; x < W + step; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = -step + off; y < H + step; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  const gx = CX + Math.sin(t * 0.8) * 120, gy = 900 + Math.cos(t * 0.6) * 160;
  const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 900);
  g.addColorStop(0, hexA(glow, glowAlpha));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // vignette
  const v = ctx.createRadialGradient(W / 2, H / 2, 500, W / 2, H / 2, 1250);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// Fit an Anton headline into maxW using at most maxLines lines.
function fitHeadline(ctx, text, maxW, maxSize, maxLines = 2, minSize = 60) {
  for (let s = maxSize; s >= minSize; s -= 4) {
    ctx.font = `${s}px Anton`;
    const lines = wrap(ctx, text, maxW);
    if (lines.length <= maxLines && lines.every(l => ctx.measureText(l).width <= maxW)) return { size: s, lines };
  }
  ctx.font = `${minSize}px Anton`;
  return { size: minSize, lines: wrap(ctx, text, maxW) };
}

// Big uppercase Anton headline, white with a grey drop shadow, centred on (cx, cy).
function headline(ctx, text, cy, o = {}) {
  const { scale = 1, alpha = 1, color = C.white, maxW = SAFE.r - SAFE.l - 20, size = 150, maxLines = 2, cx = CX, rot = 0 } = o;
  if (scale <= 0 || alpha <= 0) return;
  const f = fitHeadline(ctx, text.toUpperCase(), maxW, size, maxLines);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  ctx.font = `${f.size}px Anton`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lh = f.size * 1.05;
  const y0 = -((f.lines.length - 1) * lh) / 2;
  f.lines.forEach((l, i) => {
    ctx.fillStyle = 'rgba(70,70,70,0.95)';
    ctx.fillText(l, 7, y0 + i * lh + 8);
    ctx.fillStyle = color;
    ctx.fillText(l, 0, y0 + i * lh);
  });
  ctx.restore();
  return f.lines.length * lh;
}

// Small hand-written accent (Caveat Brush substitute: Permanent Marker), neon green.
function accent(ctx, text, cx, cy, o = {}) {
  const { size = 56, alpha = 1, scale = 1, color = C.neon, rot = -0.03 } = o;
  if (scale <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  ctx.font = `${size}px Marker`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = hexA(C.neon, 0.6); ctx.shadowBlur = 24;
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

// Rounded counter pill, e.g. "07/30".
function pill(ctx, text, cx, cy, o = {}) {
  const { scale = 1, alpha = 1, size = 44 } = o;
  if (scale <= 0) return;
  ctx.save();
  ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.globalAlpha = alpha;
  ctx.font = `${size}px JBMB`;
  const w = ctx.measureText(text).width + 64, h = size + 34;
  rr(ctx, -w / 2, -h / 2, w, h, h / 2);
  ctx.fillStyle = 'rgba(34,197,94,0.14)'; ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = C.green; ctx.stroke();
  ctx.fillStyle = C.neon; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 3);
  ctx.restore();
}

// Generic card with a green border.
function card(ctx, x, y, w, h, o = {}) {
  const { r = 28, fill = C.card, stroke = C.green, lw = 4, glow = null, glowBlur = 50 } = o;
  ctx.save();
  if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = glowBlur; }
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = fill; ctx.fill();
  ctx.shadowBlur = 0;
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
  ctx.restore();
}

// A "prompt" card, drawn as an original terminal-style window (no product UI or logos).
// lightK: 0..1 how many lines are highlighted.
function promptCard(ctx, text, cx, cy, o = {}) {
  const { scale = 1, alpha = 1, lightK = 0, title = 'my prompt', size = 40 } = o;
  if (scale <= 0) return;
  const w = 880;
  ctx.save();
  ctx.font = `${size}px JBM`;
  const lines = wrap(ctx, text, w - 90);
  const lh = size * 1.45, h = 120 + lines.length * lh + 50;
  ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.globalAlpha = alpha;
  card(ctx, -w / 2, -h / 2, w, h, { glow: hexA(C.green, 0.45) });
  // title bar
  ['#3b4a3c', '#3b4a3c', '#3b4a3c'].forEach((c, i) => { ctx.beginPath(); ctx.arc(-w / 2 + 50 + i * 40, -h / 2 + 48, 11, 0, 7); ctx.fillStyle = c; ctx.fill(); });
  ctx.font = `30px JBM`; ctx.fillStyle = C.grey; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(title, -w / 2 + 180, -h / 2 + 48);
  ctx.strokeStyle = C.line; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2 + 92); ctx.lineTo(w / 2, -h / 2 + 92); ctx.stroke();
  ctx.font = `${size}px JBM`;
  const lit = lightK * lines.length;
  lines.forEach((l, i) => {
    const y = -h / 2 + 130 + i * lh + lh / 2 - 10;
    const k = clamp(lit - i);
    if (k > 0) {
      const lw = ctx.measureText(l).width * k;
      ctx.fillStyle = hexA(C.green, 0.28);
      ctx.fillRect(-w / 2 + 40, y - lh / 2 + 4, lw + 10, lh - 8);
    }
    ctx.fillStyle = k >= 1 ? C.neon : C.green;
    ctx.fillText((i === 0 ? '> ' : '  ') + l, -w / 2 + 30, y);
  });
  ctx.restore();
}

function bookmark(ctx, cx, cy, s = 1, color = C.neon) {
  if (s <= 0) return;
  ctx.save();
  ctx.translate(cx, cy); ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-50, -70); ctx.lineTo(50, -70); ctx.lineTo(50, 75); ctx.lineTo(0, 35); ctx.lineTo(-50, 75); ctx.closePath();
  ctx.shadowColor = hexA(C.neon, 0.7); ctx.shadowBlur = 30;
  ctx.fillStyle = color; ctx.fill();
  ctx.restore();
}

// Flash of white/green used under sound hits.
function flash(ctx, t, t0, color = C.neon, dur = 0.18, maxA = 0.35) {
  if (t < t0 || t > t0 + dur) return;
  if (t0 === 0) maxA = Math.min(maxA, 0.08);
  ctx.save();
  ctx.globalAlpha = maxA * (1 - prog(t, t0, t0 + dur));
  ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function shake(t, t0, dur = 0.3, amp = 18) {
  if (t < t0 || t > t0 + dur) return [0, 0];
  const k = 1 - prog(t, t0, t0 + dur);
  return [Math.sin(t * 90) * amp * k, Math.cos(t * 77) * amp * k * 0.6];
}

// Draw an image cover-fitted into a box.
function coverImage(ctx, img, x, y, w, h, zoom = 1) {
  const s = Math.max(w / img.width, h / img.height) * zoom;
  const iw = img.width * s, ih = img.height * s;
  ctx.save();
  rr(ctx, x, y, w, h, 0); ctx.clip();
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  ctx.restore();
}

// ---------------------------------------------------------------- list Reel
// A numbered terminal list that counts up, pausing to enlarge "best" rows.
function buildListSchedule(items, best, start, end, pause = 0.6) {
  const n = items.length, pauses = best.length * pause;
  const step = (end - start - pauses) / n;
  const times = []; const enl = [];
  let tt = start;
  for (let i = 0; i < n; i++) {
    times.push(tt);
    tt += step;
    if (best.includes(i + 1)) { enl.push({ i, t0: tt, t1: tt + pause }); tt += pause; }
  }
  return { times, enl, step };
}

function listLayout(ctx, items, size, maxW) {
  ctx.font = `${size}px JBM`;
  const lh = size * 1.32;
  let y = 0; const rows = [];
  items.forEach((it, i) => {
    const num = String(i + 1).padStart(2, '0') + ' ';
    const lines = wrap(ctx, it, maxW - ctx.measureText(num).width);
    rows.push({ num, lines, y, h: lines.length * lh + 14 });
    y += lines.length * lh + 14;
  });
  return { rows, total: y, lh };
}

// Draw rows [0..shown) with the newest at the bottom of the window.
// scrollTo: optional override (row index pinned to the top) used for the rewind.
function drawList(ctx, L, shown, o = {}) {
  const { top = 470, bottom = 1480, x = SAFE.l + 6, size = 40, alpha = 1, scrollY = null, flyIn = null } = o;
  ctx.save();
  ctx.beginPath(); ctx.rect(0, top, W, bottom - top); ctx.clip();
  const lastIdx = Math.max(0, Math.ceil(shown) - 1);
  const last = L.rows[lastIdx];
  let sy = scrollY != null ? scrollY : Math.max(0, last.y + last.h - (bottom - top));
  ctx.font = `${size}px JBM`; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.globalAlpha = alpha;
  L.rows.forEach((r, i) => {
    if (i >= Math.ceil(shown)) return;
    const y = top + r.y - sy;
    if (y > bottom || y + r.h < top) return;
    let dx = 0, a = 1;
    if (flyIn && i === Math.ceil(shown) - 1) { const k = clamp(shown - i); dx = (1 - eOut(k)) * 300; a = k; }
    ctx.globalAlpha = alpha * a;
    ctx.fillStyle = C.grey;
    ctx.fillText(r.num, x + dx, y);
    const nw = ctx.measureText(r.num).width;
    ctx.fillStyle = (i + 1) % 5 === 0 ? C.neon : C.green;
    r.lines.forEach((l, j) => ctx.fillText(l, x + nw + dx, y + j * L.lh));
  });
  ctx.restore();
}
