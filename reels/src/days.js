// Scene definitions for Days 6 to 12. Each day: { dur, cues: [[t, sound]], draw(ctx, t) }.
// window.DATA is filled by render.mjs from the files in /inputs.

// ------------------------------------------------------------ text flow
// Lays text out word by word so single words/phrases can be styled.
// style(startChar, word) -> { color, bg, glow } ; maxChars limits typing.
function flowText(ctx, text, x, y, maxW, o = {}) {
  const { size = 42, font = 'Inter', weight = '', lh = size * 1.35, color = C.white, maxChars = Infinity, style = null, cursor = false, t = 0 } = o;
  ctx.save();
  ctx.font = `${weight} ${size}px ${font}`.trim();
  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  const sp = ctx.measureText(' ').width;
  let cx = x, cy = y, idx = 0, lastX = x, lastY = y;
  const words = text.split(' ');
  for (const w of words) {
    const ww = ctx.measureText(w).width;
    if (cx > x && cx + ww > x + maxW) { cx = x; cy += lh; }
    if (idx >= maxChars) break;
    const visible = w.slice(0, Math.max(0, maxChars - idx));
    const st = style ? style(idx, w) || {} : {};
    const vw = ctx.measureText(visible).width;
    if (st.bg) { ctx.fillStyle = st.bg; ctx.fillRect(cx - 6, cy - 4, vw + 12, size * 1.18); }
    if (st.glow) { ctx.shadowColor = st.glow; ctx.shadowBlur = 28; }
    ctx.fillStyle = st.color || color;
    ctx.fillText(visible, cx, cy);
    ctx.shadowBlur = 0;
    lastX = cx + vw; lastY = cy;
    cx += ww + sp; idx += w.length + 1;
  }
  if (cursor && Math.floor(t * 4) % 2 === 0) { ctx.fillStyle = C.neon; ctx.fillRect(lastX + 6, lastY, size * 0.5, size * 1.1); }
  ctx.restore();
  return cy - y + lh;
}
function measureFlow(ctx, text, maxW, size, font = 'Inter', weight = '') {
  ctx.font = `${weight} ${size}px ${font}`.trim();
  return wrap(ctx, text, maxW).length * size * 1.35;
}


// ================================================================= LIST REEL (Days 6 & 9)
function listReel(c) {
  const n = c.items.length;
  const S = buildListSchedule(c.items, c.best, c.listStart, 11.0);
  const cues = [[0, 'hit'], [1.5, 'whoosh'], [3.0, 'whoosh'], [c.listStart, 'whoosh'], [11.0, 'hit2'], [12.4, 'rewind']];
  S.times.forEach((tt, i) => cues.push([tt, (i + 1) % 5 === 0 ? 'pop' : 'tick']));
  S.enl.forEach(e => cues.push([e.t0, 'pop2']));
  (c.extraCues || []).forEach(q => cues.push(q));
  let L = null;
  return {
    dur: 14, cues,
    draw(ctx, t) {
      if (!L) L = listLayout(ctx, c.items, 40, SAFE.r - SAFE.l - 12);
      background(ctx, t);
      let shown = 0;
      S.times.forEach((tt, i) => { if (t >= tt) shown = i + Math.min(1, (t - tt) / 0.12); });

      // ---- 0 to 3s: hook lines
      if (t < 3.2) {
        const out = prog(t, 3.0, 3.2);
        ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(0, -out * 120);
        c.intro(ctx, t, L);
        const k = eOut(prog(t, 1.5, 1.8));
        headline(ctx, c.hook1, lerp(c.hook1Y || 470, 365, k), { scale: slam(t, 0) * lerp(1, 0.58, k), size: c.hook1Size || 150 });
        if (t >= 1.5) headline(ctx, c.hook2, 650, { scale: slam(t, 1.5), color: C.green, size: 120 });
        if (t >= 1.7) pill(ctx, `00/${n}`, CX, 880, { scale: pop(t, 1.7) });
        ctx.restore();
        flash(ctx, t, 0); flash(ctx, t, 1.5, C.green, 0.12, 0.2);
      }

      // ---- prompt screenshot
      if (t >= 3.0 && t < c.listStart + 0.2) {
        const a = 1 - prog(t, c.listStart, c.listStart + 0.2);
        const z = eOut(prog(t, 3.0, 3.45));
        headline(ctx, 'THE PROMPT', 380, { size: 100, scale: pop(t, 3.05), alpha: a });
        promptCard(ctx, c.prompt, CX, 900 + (1 - z) * 200, { scale: lerp(0.5, 1.04, z) + (t - 3) * 0.02, alpha: a, lightK: prog(t, 3.45, c.listStart - 0.15), size: 40 });
      }

      // ---- list counting up
      if (t >= c.listStart) {
        const endK = prog(t, 11, 11.3);
        let sh = shown;
        if (t >= 12.4) sh = lerp(n, 1, eInOut(prog(t, 12.4, 13.4)));
        const count = Math.max(1, Math.ceil(sh - 1e-6));
        const tin = prog(t, c.listStart, c.listStart + 0.25);
        headline(ctx, c.listTitle, 320, { size: 74, alpha: tin * (1 - endK) });
        pill(ctx, `${String(count).padStart(2, '0')}/${n}`, CX, 425, { scale: pop(t, c.listStart), alpha: 1 - endK * 0.5 });
        drawList(ctx, L, Math.max(sh, 0.0001), { top: 490, bottom: 1480, alpha: lerp(1, 0.28, endK) * tin, flyIn: c.flyIn });
        // enlarge the best rows
        for (const e of S.enl) {
          if (t >= e.t0 && t < e.t1) {
            const a = 1 - prog(t, e.t1 - 0.08, e.t1);
            ctx.save(); ctx.globalAlpha = 0.7 * a; ctx.fillStyle = '#000'; ctx.fillRect(0, 470, W, 1040); ctx.restore();
            const s = pop(t, e.t0, 0.2);
            ctx.save(); ctx.globalAlpha = a; ctx.translate(CX, 960); ctx.scale(s, s);
            card(ctx, -440, -230, 880, 460, { glow: hexA(C.neon, 0.5), stroke: C.neon });
            ctx.restore();
            accent(ctx, `#${String(e.i + 1).padStart(2, '0')}`, CX - 330, 790, { scale: s, alpha: a, size: 50 });
            headline(ctx, c.items[e.i], 975, { scale: s, alpha: a, size: 104, maxLines: 3, maxW: 800 });
          }
        }
      }

      // ---- end card
      if (t >= 11) c.outro(ctx, t);
    },
  };
}

// ================================================================= DAY 6
function day06(D) {
  return listReel({
    items: D.hooks, best: D.hooksBest, prompt: D.hooksPrompt, listStart: 5.0,
    hook1: 'I stopped writing hooks', hook2: 'This prompt writes 30', listTitle: '30 HOOKS. 1 PROMPT.',
    intro(ctx, t, L) {
      // the hook list is already scrolling fast behind the hook
      const total = L.total;
      drawList(ctx, L, L.rows.length, { top: 250, bottom: 1500, alpha: 0.22, scrollY: (t * 700) % Math.max(1, total - 900) });
    },
    outro(ctx, t) {
      headline(ctx, 'SAVE THIS', 560, { scale: slam(t, 11), size: 190 });
      bookmark(ctx, CX, 820, pop(t, 11.25) * 1.15);
      accent(ctx, 'for your next blank day', CX, 1010, { scale: pop(t, 11.6), size: 60 });
      flash(ctx, t, 11);
    },
  });
}

// ================================================================= DAY 9
function shopSign(ctx, cx, cy, s, t, lit) {
  // lit: 0 dim .. 1 fully lit green
  ctx.save();
  ctx.translate(cx, cy); ctx.scale(s, s);
  // awning stripes
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? '#101a11' : hexA(C.brush, 0.25 + 0.6 * lit);
    ctx.beginPath(); ctx.moveTo(-380 + i * 95, -230); ctx.lineTo(-380 + (i + 1) * 95, -230); ctx.lineTo(-380 + (i + 1) * 95 + 4, -150); ctx.lineTo(-380 + i * 95 - 4, -150); ctx.fill();
  }
  card(ctx, -360, -140, 720, 300, { fill: '#070c07', stroke: lit > 0.05 ? hexA(C.green, 0.3 + 0.7 * lit) : '#2a332a', lw: 6, glow: lit > 0.05 ? hexA(C.neon, 0.6 * lit) : null, glowBlur: 70 });
  ctx.font = '170px Anton'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (lit > 0.05) { ctx.shadowColor = C.neon; ctx.shadowBlur = 50 * lit; }
  ctx.lineWidth = 6; ctx.strokeStyle = lit > 0.05 ? hexA(C.neon, 0.25 + 0.75 * lit) : '#3a453a';
  ctx.strokeText('OPEN', 0, 14);
  if (lit > 0.5) { ctx.fillStyle = hexA(C.neon, (lit - 0.5) * 1.6); ctx.fillText('OPEN', 0, 14); }
  ctx.restore();
}
function day09(D) {
  const signLevel = t => {
    if (t >= 0.35 && t < 0.5) return 0; // the single flicker
    if (t >= 11.2) return eOut(prog(t, 11.2, 11.6));
    return 0.12;
  };
  return listReel({
    items: D.promos, best: D.promosBest, prompt: D.promosPrompt, listStart: 4.5, flyIn: true,
    hook1: 'Slow week?', hook1Size: 190, hook2: 'Steal these 30 promo ideas', listTitle: '30 PROMO IDEAS',
    extraCues: [[0.35, 'buzz'], [11.2, 'reveal']],
    intro(ctx, t) {
      const k = eOut(prog(t, 1.5, 1.8));
      shopSign(ctx, CX, lerp(1040, 1230, k), lerp(1, 0.7, k), t, signLevel(t));
    },
    outro(ctx, t) {
      const lv = signLevel(t);
      ctx.save(); ctx.globalAlpha = prog(t, 11, 11.2);
      shopSign(ctx, CX, 1060, 1.05 + 0.02 * Math.sin(t * 3), t, lv);
      ctx.restore();
      headline(ctx, 'SAVE THIS FOR SLOW WEEKS', 520, { scale: slam(t, 11), size: 140, maxLines: 2 });
      flash(ctx, t, 11.2, C.neon, 0.25, 0.3);
    },
  });
}

// ================================================================= DAY 7
function phone(ctx, cx, cy, s, t, alpha = 1) {
  const w = 340, h = 600;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.globalAlpha = alpha;
  card(ctx, -w / 2, -h / 2, w, h, { r: 48, fill: '#081008', stroke: C.green, lw: 6, glow: hexA(C.neon, 0.35 + 0.25 * Math.sin(t * 4)), glowBlur: 80 });
  ctx.save(); rr(ctx, -w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 36); ctx.clip();
  const g = ctx.createRadialGradient(0, Math.sin(t * 2) * 120, 10, 0, 0, 380);
  g.addColorStop(0, hexA(C.green, 0.55)); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
  // waveform
  for (let i = 0; i < 12; i++) {
    const bh = 30 + 60 * Math.abs(Math.sin(t * 5 + i * 0.9));
    ctx.fillStyle = hexA(C.neon, 0.8); ctx.fillRect(-132 + i * 23, 150 - bh / 2, 12, bh);
  }
  ctx.restore();
  // play triangle
  ctx.beginPath(); ctx.moveTo(-34, -90); ctx.lineTo(50, -40); ctx.lineTo(-34, 10); ctx.closePath();
  ctx.fillStyle = C.white; ctx.fill();
  // progress bar
  ctx.fillStyle = '#1d2b1e'; ctx.fillRect(-130, 240, 260, 10);
  ctx.fillStyle = C.neon; ctx.fillRect(-130, 240, 260 * ((t * 0.35) % 1), 10);
  ctx.restore();
}
function postCard(ctx, post, cx, cy, s, alpha = 1) {
  if (s <= 0 || alpha <= 0) return;
  const w = 880, pad = 44, size = 38;
  const bodyH = measureFlow(ctx, post.body, w - pad * 2, size);
  const h = 130 + bodyH + 40;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.globalAlpha = alpha;
  card(ctx, -w / 2, -h / 2, w, h, { glow: hexA(C.green, 0.5), fill: '#0b130c' });
  pill(ctx, post.label, -w / 2 + pad + measureLabel(ctx, post.label) / 2, -h / 2 + 62, { size: 36 });
  flowText(ctx, post.body, -w / 2 + pad, -h / 2 + 125, w - pad * 2, { size, color: C.white });
  ctx.restore();
}
function measureLabel(ctx, txt) { ctx.font = '36px JBMB'; return ctx.measureText(txt).width + 64; }

function day07(D) {
  const posts = D.posts; // [{label, body}]
  const burst = i => 3.0 + i * 1.4;
  const cues = [[0, 'hit'], [1.5, 'whoosh'], [1.6, 'thud'], [10, 'hit2'], [12.1, 'rewind']];
  posts.forEach((p, i) => cues.push([burst(i), 'whoosh'], [burst(i) + 0.05, 'pop']));
  const ring = (i, t) => {
    const a = -Math.PI / 2 + i * (2 * Math.PI / 5) + Math.max(0, t - 10) * 0.9;
    return [CX + Math.cos(a) * 330, 960 + Math.sin(a) * 390];
  };
  return {
    dur: 13, cues,
    draw(ctx, t) {
      background(ctx, t);
      const [sx, sy] = shake(t, 1.6, 0.35, 26);
      const phoneScale = t < 3 ? lerp(0.9, 0.95, prog(t, 0, 3)) : lerp(0.95, 0.68, eOut(prog(t, 3, 3.4)));
      const phoneY = t < 3 ? 1040 : lerp(1040, 960, eOut(prog(t, 3, 3.4)));
      // ring cards behind the phone first
      const back = (t >= 12.1) ? eInOut(prog(t, 12.1, 12.6)) : 0;
      phone(ctx, CX + sx, phoneY + sy, phoneScale * (1 + 0.06 * Math.sin(t * 3)), t);
      if (t < 3.2) {
        const out = prog(t, 3.0, 3.2);
        const k = eOut(prog(t, 1.5, 1.8));
        ctx.save(); ctx.globalAlpha = 1 - out;
        headline(ctx, 'I posted 5 times today', lerp(450, 350, k), { scale: slam(t, 0) * lerp(1, 0.55, k), size: 140 });
        if (t >= 1.5) headline(ctx, 'I made 1 video', 560, { scale: slam(t, 1.5), color: C.green, size: 130 });
        ctx.restore();
        flash(ctx, t, 0);
      }
      // cards
      posts.forEach((p, i) => {
        const t0 = burst(i);
        if (t < t0) return;
        const grow = eBack(prog(t, t0, t0 + 0.28));
        const shrink = eInOut(prog(t, t0 + 1.1, t0 + 1.4));
        const [rx, ry] = ring(i, t);
        let x = lerp(CX, CX, grow), y = lerp(960, 860, grow), s = lerp(0.05, 1, grow);
        x = lerp(x, rx, shrink); y = lerp(y, ry, shrink); s = lerp(s, 0.25, shrink);
        if (back > 0) { x = lerp(x, CX, back); y = lerp(y, 960, back); s = lerp(s, 0.02, back); }
        postCard(ctx, p, x, y, s, 1 - back * 0.8);
        if (shrink < 0.05 && t < t0 + 1.4) pill(ctx, `${i + 1}/5`, CX, 330, { scale: pop(t, t0) });
      });
      if (t >= 10) {
        headline(ctx, '1 prompt. 5 posts.', 340, { scale: slam(t, 10), size: 120, color: C.white });
        accent(ctx, 'Send this to a creator friend', CX, 1455, { scale: pop(t, 10.4), size: 52 });
        flash(ctx, t, 10, C.green, 0.15, 0.2);
      }
    },
  };
}

// ================================================================= DAY 8
function reviewCard(ctx, D, cx, top, o = {}) {
  const { scale = 1, alpha = 1, glow = C.red, glowA = 0.6, hl = 0 } = o;
  const w = 900, pad = 44, size = 42;
  const textH = measureFlow(ctx, D.review, w - pad * 2, size);
  const h = 250 + textH + 30;
  ctx.save();
  ctx.translate(cx, top); ctx.scale(scale, scale); ctx.globalAlpha = alpha;
  card(ctx, -w / 2, 0, w, h, { fill: '#0d120d', stroke: hexA(glow, 0.9), glow: hexA(glow, glowA), glowBlur: 70 });
  // blurred avatar + name (made-up customer, still blurred per the rules)
  ctx.save(); ctx.filter = 'blur(10px)';
  ctx.fillStyle = '#7d8a7e'; ctx.beginPath(); ctx.arc(-w / 2 + pad + 40, 70, 40, 0, 7); ctx.fill();
  ctx.fillStyle = '#5d6a5e'; rr(ctx, -w / 2 + pad + 100, 50, 230, 36, 12); ctx.fill();
  ctx.restore();
  pill(ctx, 'Example', w / 2 - pad - 100, 70, { size: 30 });
  ctx.font = '600 36px Inter'; ctx.fillStyle = C.white; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText('Maple Street Café', -w / 2 + pad, 150);
  // stars
  for (let i = 0; i < 5; i++) star(ctx, -w / 2 + pad + 26 + i * 64, 210, 26, i === 0);
  // text with sentence highlights
  const sentences = D.review.match(/[^.!?]+[.!?]+/g) || [D.review];
  let acc = 0; const ranges = sentences.map(s => { const r = [acc, acc + s.trim().length]; acc += s.trim().length + 1; return r; });
  flowText(ctx, D.review, -w / 2 + pad, 255, w - pad * 2, {
    size,
    style: (i) => {
      const si = ranges.findIndex(r => i >= r[0] && i < r[1]);
      return si >= 0 && hl > si ? { bg: hexA(C.red, 0.35), color: '#FFD9D9' } : null;
    },
  });
  ctx.restore();
  return h * scale;
}
function star(ctx, x, y, r, filled) {
  ctx.save(); ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); }
  ctx.closePath();
  if (filled) { ctx.fillStyle = '#FFC531'; ctx.fill(); } else { ctx.strokeStyle = '#4b544b'; ctx.lineWidth = 3; ctx.stroke(); }
  ctx.restore();
}
function day08(D) {
  const reply = D.reply;
  const typeStart = 3.3, typeEnd = 8.8, cps = reply.length / (typeEnd - typeStart);
  const phrases = D.replyPhrases.map(p => { const i = reply.toLowerCase().indexOf(p.toLowerCase()); return [i, i + p.length]; }).filter(r => r[0] >= 0);
  const cues = [[0, 'hit'], [0, 'buzz'], [1.5, 'whoosh'], [1.75, 'pop'], [2.25, 'pop'], [2.75, 'pop'], [3.0, 'whoosh'], [11, 'hit2'], [11.2, 'reveal']];
  for (let tt = typeStart; tt < typeEnd; tt += 0.075) cues.push([tt, 'key']);
  phrases.forEach((_, i) => cues.push([9.0 + i * 0.6, 'pop2']));
  return {
    dur: 14, cues,
    draw(ctx, t) {
      const green = prog(t, 11.2, 11.8);
      background(ctx, t, green > 0 ? C.green : C.red, 0.18);
      const [sx, sy] = shake(t, 0, 0.45, 30);
      const up = eInOut(prog(t, 3.0, 3.4));
      const endDim = prog(t, 11, 11.3);
      const glowCol = green > 0.5 ? C.green : C.red;
      const hl = t < 1.75 ? 0 : t < 2.25 ? 1 : t < 2.75 ? 2 : 3;
      const rh = reviewCard(ctx, D, CX + sx, lerp(720, 270, up) + sy, { scale: lerp(1, 0.92, up), alpha: lerp(1, 0.25, endDim), glow: glowCol, glowA: 0.6 + 0.2 * Math.sin(t * 6), hl: up > 0 ? 3 : hl });
      if (t < 3.2) {
        const out = prog(t, 3.0, 3.2);
        const sw = prog(t, 1.45, 1.52);
        headline(ctx, 'This review costs customers', 470 - out * 100, { scale: slam(t, 0), alpha: (1 - sw) * (1 - out), size: 130 });
        if (t >= 1.5) headline(ctx, 'Watch the reply', 470 - out * 100, { scale: slam(t, 1.5), alpha: 1 - out, size: 150, color: C.green });
        flash(ctx, t, 0, C.red, 0.2, 0.3);
      }
      if (t >= 3.0) {
        const sl = eOut(prog(t, 3.0, 3.35));
        const top = 270 + rh + 30 + (1 - sl) * 600;
        const w = 900, pad = 44;
        const chars = Math.floor((t - typeStart) * cps);
        const bodyH = measureFlow(ctx, reply, w - pad * 2, 42);
        ctx.save(); ctx.globalAlpha = sl * lerp(1, 0.25, endDim);
        card(ctx, CX - w / 2, top, w, bodyH + 130, { glow: hexA(C.green, 0.5), fill: '#0b130c' });
        ctx.font = '600 32px Inter'; ctx.fillStyle = C.neon; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('Reply from the owner', CX - w / 2 + pad, top + 50);
        flowText(ctx, reply, CX - w / 2 + pad, top + 95, w - pad * 2, {
          size: 42, maxChars: Math.max(0, chars), cursor: t < typeEnd + 0.3, t,
          style: (i) => {
            const pi = phrases.findIndex(r => i >= r[0] && i < r[1]);
            return pi >= 0 && t >= 9.0 + pi * 0.6 ? { color: C.neon, glow: C.neon, bg: hexA(C.green, 0.22) } : null;
          },
        });
        ctx.restore();
      }
      if (t >= 11) {
        headline(ctx, 'Reply in seconds', 700, { scale: slam(t, 11), size: 170 });
        accent(ctx, 'Send this to a business owner', CX, 920, { scale: pop(t, 11.4), size: 54 });
        flash(ctx, t, 11.2, C.green, 0.25, 0.25);
      }
    },
  };
}

// ================================================================= DAY 10
function imgOr(ctx, img, label, x, y, w, h, zoom = 1) {
  if (img) { coverImage(ctx, img, x, y, w, h, zoom); return; }
  ctx.save();
  ctx.fillStyle = '#0a110a'; ctx.fillRect(x, y, w, h);
  ctx.setLineDash([24, 18]); ctx.lineWidth = 6; ctx.strokeStyle = '#2f4a31';
  ctx.strokeRect(x + 40, y + 300, w - 160, h - 760 > 200 ? h - 760 : h - 80);
  ctx.restore();
  accent(ctx, label, x + w / 2 - 40, y + h / 2, { size: 54, color: '#4c7a4f', alpha: 0.9 });
}
function day10(D) {
  const I = D.img;
  const cues = [[0, 'hit'], [2.0, 'tick'], [2.25, 'tick'], [2.5, 'tick'], [2.75, 'tick'], [2.6, 'riser'], [3.0, 'reveal'], [4.0, 'pop'], [4.8, 'pop'], [5.6, 'pop'], [7.0, 'whoosh'], [9.0, 'whoosh'], [11.1, 'whoosh']];
  return {
    dur: 12, cues,
    draw(ctx, t) {
      background(ctx, t);
      const shadeTop = () => { const g = ctx.createLinearGradient(0, 200, 0, 900); g.addColorStop(0, 'rgba(0,0,0,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 900); };
      if (t < 3.4) {
        imgOr(ctx, I.before, 'your BEFORE photo', 0, 0, W, H, 1 + 0.04 * t);
        if (t >= 3.0) { // light sweep reveal
          const k = eInOut(prog(t, 3.0, 3.4)), bx = lerp(-300, W + 300, k);
          ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(bx + 200, 0); ctx.lineTo(bx - 200, H); ctx.lineTo(0, H); ctx.closePath(); ctx.clip();
          imgOr(ctx, I.after, 'your AFTER photo', 0, 0, W, H, 1.0); ctx.restore();
          const g = ctx.createLinearGradient(bx - 260, 0, bx + 260, 0);
          g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(230,255,220,0.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.save(); ctx.fillStyle = g; ctx.fillRect(bx - 260, 0, 520, H); ctx.restore();
        }
        if (t < 3.0) {
          shadeTop();
          headline(ctx, 'This was shot on a phone', 470, { scale: slam(t, 0), alpha: 1 - prog(t, 1.9, 2.0), size: 140 });
          if (t >= 2.0) headline(ctx, 'Wait for it...', 470, { scale: slam(t, 2.0), size: 160, color: C.neon });
        }
        flash(ctx, t, 0, C.white, 0.15, 0.25);
      } else if (t < 7.0) {
        imgOr(ctx, I.after, 'your AFTER photo', 0, 0, W, H, 1 + 0.12 * eOut(prog(t, 3.4, 7)));
        shadeTop();
        headline(ctx, 'Free AI edit', 380, { scale: pop(t, 3.45), size: 120 });
        ['background removed', 'clean backdrop', 'soft shadow'].forEach((lb, i) => {
          const s = pop(t, 4.0 + i * 0.8);
          if (s > 0) pill(ctx, lb, CX, 1050 + i * 130, { scale: s, size: 40 });
        });
        flash(ctx, t, 3.4, C.white, 0.2, 0.35);
      } else if (t < 9.0) {
        imgOr(ctx, I.after, '', 0, 0, W, H, 1.12);
        ctx.fillStyle = 'rgba(5,8,5,0.75)'; ctx.fillRect(0, 0, W, H);
        const k = eOut(prog(t, 7.0, 7.35));
        const x = lerp(W + 100, SAFE.l + 20, k), w = SAFE.r - SAFE.l - 40, h = 900;
        ctx.save(); rr(ctx, x, 470, w, h, 28); ctx.clip();
        imgOr(ctx, I.tool, 'your TOOL screenshot', x, 470, w, h, 1.15 + 0.08 * prog(t, 7, 9));
        ctx.restore();
        card(ctx, x, 470, w, h, { fill: 'rgba(0,0,0,0)', glow: null });
        accent(ctx, 'free tool', CX, 360, { scale: pop(t, 7.3), size: 80 });
      } else {
        // split screen BEFORE | AFTER with slider, ending on BEFORE so it loops
        let sx;
        if (t < 11.1) sx = CX + Math.sin((t - 9.0) * 3.0) * 330;
        else sx = lerp(CX + Math.sin(2.1 * 3.0) * 330, W, eInOut(prog(t, 11.1, 11.6)));
        imgOr(ctx, I.after, 'AFTER', 0, 0, W, H, 1.0);
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, sx, H); ctx.clip(); imgOr(ctx, I.before, 'BEFORE', 0, 0, W, H, 1.0); ctx.restore();
        ctx.fillStyle = C.neon; ctx.fillRect(sx - 4, 0, 8, H);
        ctx.beginPath(); ctx.arc(sx, 1250, 38, 0, 7); ctx.fill();
        const fade = 1 - prog(t, 11.1, 11.5);
        shadeTop();
        headline(ctx, 'Send this to someone who sells online', 470, { scale: slam(t, 9.0), size: 110, alpha: fade, maxLines: 3 });
        pill(ctx, 'BEFORE', 240, 1420, { size: 36, alpha: fade });
        pill(ctx, 'AFTER', 780, 1420, { size: 36, alpha: fade });
      }
    },
  };
}

// ================================================================= DAY 11
function day11(D) {
  const rows = D.prompts; // [{label, text}]
  const rowT = i => 1.0 + i * 1.5;
  const cues = [[0, 'hit'], [0, 'riser'], [12.0, 'hit2'], [13.9, 'rewind']];
  rows.forEach((r, i) => { cues.push([rowT(i), 'pop']); for (let k = 0; k < 9; k++) cues.push([rowT(i) + 0.15 + k * 0.09, 'key']); });
  return {
    dur: 15, cues,
    draw(ctx, t) {
      background(ctx, t);
      if (t < 1.15) {
        // all 7 labels slide past in one fast scroll
        const out = prog(t, 0.95, 1.15);
        ctx.save(); ctx.beginPath(); ctx.rect(0, 250, W, 1250); ctx.clip();
        ctx.globalAlpha = 0.55 * (1 - out);
        rows.forEach((r, i) => {
          const y = 1250 - (t * 2300) + i * 230;
          headline(ctx, `${String(i + 1).padStart(2, '0')} ${r.label}`, y, { size: 120, color: C.brush, maxLines: 1 });
        });
        ctx.restore();
        ctx.save(); ctx.globalAlpha = 1 - out;
        ctx.fillStyle = 'rgba(5,8,5,0.7)'; ctx.fillRect(0, 300, W, 360);
        headline(ctx, '7 prompts = 1 free marketing team', 480, { scale: slam(t, 0), size: 140 });
        ctx.restore();
        flash(ctx, t, 0);
      }
      if (t >= 1.0 && t < 12.2) {
        const i = Math.min(rows.length - 1, Math.floor((t - 1.0) / 1.5));
        const t0 = rowT(i), r = rows[i];
        const exit = i < rows.length - 1 ? eOut(prog(t, t0 + 1.36, t0 + 1.5)) : prog(t, 12.0, 12.2);
        ctx.save(); ctx.translate(-exit * 600, 0); ctx.globalAlpha = 1 - exit;
        pill(ctx, `${String(i + 1).padStart(2, '0')}/07`, CX, 330, { scale: 1 });
        headline(ctx, r.label, 560, { scale: slam(t, t0, 1.35, 0.2), size: 190, color: C.green, maxLines: 1 });
        const chars = Math.floor(prog(t, t0 + 0.15, t0 + 0.95) * r.text.length);
        const h = measureFlow(ctx, r.text, 820, 44, 'JBM');
        card(ctx, SAFE.l + 6, 740, 880, h + 80, { fill: '#091109' });
        flowText(ctx, r.text, SAFE.l + 36, 780, 820, {
          size: 44, font: 'JBM', color: C.green, maxChars: chars, cursor: true, t,
          style: (ci, w) => (w.startsWith('[') ? { color: C.neon, bg: hexA(C.green, 0.2) } : null),
        });
        ctx.restore();
      }
      if (t >= 12.0) {
        const sl = eInOut(prog(t, 13.9, 14.5));
        headline(ctx, "Save this. You'll use it weekly", 380, { scale: slam(t, 12.0), size: 110, alpha: 1 - sl });
        rows.forEach((r, i) => {
          const s = pop(t, 12.15 + i * 0.08, 0.22);
          if (s <= 0) return;
          const y = 600 + i * 118 - sl * 900;
          ctx.save(); ctx.globalAlpha = 1 - sl;
          ctx.translate(SAFE.l + 20, y); ctx.scale(s, s);
          ctx.font = '44px JBMB'; ctx.fillStyle = C.grey; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
          ctx.fillText(String(i + 1).padStart(2, '0'), 0, 4);
          ctx.font = '96px Anton'; ctx.fillStyle = i % 2 ? C.green : C.neon;
          ctx.fillText(r.label, 90, 0);
          ctx.restore();
        });
        flash(ctx, t, 12.0, C.green, 0.15, 0.2);
      }
    },
  };
}

// ================================================================= DAY 12
function cup(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = hexA(C.white, 0.8); ctx.lineWidth = 8; ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    for (let k = 0; k <= 20; k++) { const yy = -120 - k * 6; ctx.lineTo(i * 40 + Math.sin(k * 0.5 + t * 4 + i) * 10, yy); }
    ctx.globalAlpha = 0.6; ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = C.white; rr(ctx, -110, -90, 220, 190, [10, 10, 60, 60]); ctx.fill();
  ctx.lineWidth = 22; ctx.strokeStyle = C.white; ctx.beginPath(); ctx.arc(120, 0, 50, -1.3, 1.3); ctx.stroke();
  ctx.fillStyle = C.brush; ctx.fillRect(-110, -40, 220, 40);
  ctx.fillStyle = '#e9e9e9'; rr(ctx, -170, 100, 340, 22, 11); ctx.fill();
  ctx.restore();
}
function adCard(ctx, cx, top, text, o = {}) {
  const { w = 860, scale = 1, alpha = 1, tag = null, tagS = 1, t = 0, strike = 0, drop = 1, textSize = 60, imgH = 440 } = o;
  ctx.save(); ctx.translate(cx, top); ctx.scale(scale, scale); ctx.globalAlpha = alpha;
  const pad = 40;
  ctx.font = `700 ${textSize}px Inter`;
  const lines = wrap(ctx, text, w - pad * 2);
  const th = lines.length * textSize * 1.2;
  const h = imgH + 60 + th + 140;
  card(ctx, -w / 2, 0, w, h, { glow: hexA(C.green, 0.4), fill: '#0b130c' });
  ctx.save(); rr(ctx, -w / 2 + 4, 4, w - 8, imgH, [26, 26, 0, 0]); ctx.clip();
  const g = ctx.createLinearGradient(0, 0, 0, imgH); g.addColorStop(0, '#163a20'); g.addColorStop(1, '#0a1a0d');
  ctx.fillStyle = g; ctx.fillRect(-w / 2, 0, w, imgH);
  cup(ctx, 0, imgH * 0.62, imgH / 440, t);
  ctx.restore();
  pill(ctx, 'Example', -w / 2 + 120, 50, { size: 28 });
  // headline text
  const ty = imgH + 50;
  ctx.save(); ctx.globalAlpha = alpha * drop; ctx.translate(0, (1 - drop) * -40);
  ctx.font = `700 ${textSize}px Inter`; ctx.fillStyle = C.white; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, -w / 2 + pad, ty + i * textSize * 1.2));
  if (strike > 0) {
    const lw0 = Math.max(...lines.map(l => ctx.measureText(l).width));
    ctx.strokeStyle = C.green; ctx.lineWidth = 16; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-w / 2 + pad - 10, ty + textSize * 0.62); ctx.lineTo(-w / 2 + pad - 10 + (lw0 + 20) * strike, ty + textSize * 0.55); ctx.stroke();
  }
  ctx.restore();
  if (tag) { const small = w < 600; ctx.font = `${small ? 30 : 48}px Marker`; const tw = ctx.measureText(tag).width; accent(ctx, tag, small ? 0 : w / 2 - pad - tw / 2, small ? ty - 22 : ty + th + 65, { size: small ? 30 : 48, scale: tagS }); }
  // button
  ctx.fillStyle = C.green; rr(ctx, -w / 2 + pad, ty + th + 30, 260, 70, 35); ctx.fill();
  ctx.font = '700 32px Inter'; ctx.fillStyle = '#04140a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Order now', -w / 2 + pad + 130, ty + th + 66);
  ctx.restore();
}
function day12(D) {
  const H2 = D.headlines; // [{tag, text}]
  const ht = i => 3.0 + i * 0.7;
  const cues = [[0, 'hit'], [1.5, 'whoosh'], [2.0, 'scratch'], [10.0, 'hit2'], [12.0, 'whoosh'], [12.3, 'pop2']];
  H2.forEach((h, i) => cues.push([ht(i), 'pop']));
  const OLD = 'Best coffee in town.';
  return {
    dur: 14, cues,
    draw(ctx, t) {
      background(ctx, t);
      if (t < 3.0) {
        const sw = prog(t, 1.45, 1.52);
        headline(ctx, "Your ad isn't bad", 420, { scale: slam(t, 0), alpha: 1 - sw, size: 150 });
        if (t >= 1.5) headline(ctx, 'Your headline is', 420, { scale: slam(t, 1.5), size: 150, color: C.green });
        adCard(ctx, CX, 600 + Math.sin(t * 2) * 6, OLD, { t, strike: eOut(prog(t, 2.0, 2.4)) });
        flash(ctx, t, 0);
      } else if (t < 10.0) {
        const i = Math.min(H2.length - 1, Math.floor((t - 3.0) / 0.7));
        const t0 = ht(i);
        pill(ctx, `${String(i + 1).padStart(2, '0')}/10`, CX, 330);
        headline(ctx, '1 prompt. 10 angles.', 450, { size: 90, scale: pop(t, 3.0) });
        adCard(ctx, CX, 560, H2[i].text, { t, tag: H2[i].tag, tagS: pop(t, t0 + 0.05, 0.2), drop: eOut(prog(t, t0, t0 + 0.18)) });
      } else if (t < 12.0) {
        headline(ctx, 'Test these 2', 400, { scale: slam(t, 10.0), size: 160 });
        D.headBest.forEach((bi, k) => {
          const s = pop(t, 10.15 + k * 0.2);
          if (s <= 0) return;
          adCard(ctx, k === 0 ? 285 : 739, 600, H2[bi - 1].text, { w: 420, scale: s, t, tag: H2[bi - 1].tag, textSize: 40, imgH: 260 });
        });
        accent(ctx, 'vs', 512, 820, { scale: pop(t, 10.6), size: 80 });
      } else {
        headline(ctx, 'Comment ADS for the prompt', 400, { scale: slam(t, 12.0), size: 130 });
        adCard(ctx, CX, 600 + Math.sin(t * 2) * 6, OLD, { t, scale: pop(t, 12.25, 0.3) });
      }
    },
  };
}

// ================================================================= registry + frame render
const DAYS = { 6: day06, 7: day07, 8: day08, 9: day09, 10: day10, 11: day11, 12: day12 };
let current = null, cache0 = null;
window.setupDay = function (id) {
  current = DAYS[id](window.DATA);
  cache0 = null;
  return { dur: current.dur, cues: current.cues };
};
// Render frame at time t. The last 0.4s crossfades into frame 0 so the video loops.
window.renderFrame = function (t, quality = 0.93) {
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  ctx.save(); current.draw(ctx, t); ctx.restore();
  const xf = 0.4;
  if (t > current.dur - xf) {
    if (!cache0) {
      cache0 = document.createElement('canvas'); cache0.width = W; cache0.height = H;
      const c0 = cache0.getContext('2d'); c0.save(); current.draw(c0, 0.0); c0.restore();
    }
    ctx.save(); ctx.globalAlpha = eInOut(prog(t, current.dur - xf, current.dur - 1 / 30)); ctx.drawImage(cache0, 0, 0); ctx.restore();
  }
  return cv.toDataURL('image/jpeg', quality);
};
