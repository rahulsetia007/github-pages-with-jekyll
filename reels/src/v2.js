// v2 "bold creator" style: one idea per screen, huge clean captions,
// green only as a highlight, a generic chat phone instead of terminal lists.

const F = '"Montserrat"';
const Y = { hook: 400, stageTop: 600, stageBot: 1240, cap: 1360 };

function mfont(size, w = 900) { return `${w} ${size}px ${F}`; }

// Big hook: white Montserrat Black, chosen words sit on a green block.
function bigHook(ctx, text, cy, o = {}) {
  const { scale = 1, alpha = 1, hi = [], size = 104, maxW = 880 } = o;
  if (scale <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.font = mfont(size);
  const words = text.toUpperCase().split(' ');
  // greedy line build
  const lines = []; let cur = [];
  for (const w of words) {
    const test = [...cur, w].join(' ');
    if (cur.length && ctx.measureText(test).width > maxW) { lines.push(cur); cur = [w]; } else cur.push(w);
  }
  lines.push(cur);
  const lh = size * 1.12;
  ctx.translate(CX, cy); ctx.scale(scale, scale); ctx.globalAlpha = alpha;
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const sp = ctx.measureText(' ').width;
  lines.forEach((ln, li) => {
    const lw = ctx.measureText(ln.join(' ')).width;
    let x = -lw / 2; const y = (li - (lines.length - 1) / 2) * lh;
    ln.forEach(w => {
      const ww = ctx.measureText(w).width;
      const isHi = hi.some(h => w.replace(/[^A-Z0-9']/g, '') === h.toUpperCase());
      if (isHi) {
        ctx.fillStyle = C.green;
        rr(ctx, x - 14, y - size * 0.56, ww + 28, size * 1.08, 14); ctx.fill();
        ctx.fillStyle = '#04140A';
      } else ctx.fillStyle = C.white;
      ctx.fillText(w, x, y + size * 0.04);
      x += ww + sp;
    });
  });
  ctx.restore();
}

// Word-by-word captions for the voiceover. lines: [{t0, t1, text}]
function captions(ctx, lines, t, o = {}) {
  const { cy = Y.cap, size = 80, per = 3 } = o;
  const L = lines.find(l => t >= l.t0 && t < l.t1 + 0.25);
  if (!L) return;
  const words = L.text.split(' ');
  const wt = (L.t1 - L.t0) / words.length;
  const idx = Math.min(words.length - 1, Math.floor((t - L.t0) / wt));
  const c0 = Math.floor(idx / per) * per;
  const chunk = words.slice(c0, c0 + per);
  ctx.save();
  ctx.font = mfont(size);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const sp = ctx.measureText(' ').width * 1.6;
  const tw = chunk.reduce((a, w) => a + ctx.measureText(w.toUpperCase()).width, 0) + sp * (chunk.length - 1);
  const s = Math.min(1, 880 / tw);
  ctx.translate(CX, cy); ctx.scale(s, s);
  // soft dark band so captions stay readable over busy visuals
  const band = ctx.createLinearGradient(0, -size * 1.4, 0, size * 1.4);
  band.addColorStop(0, 'rgba(5,8,5,0)'); band.addColorStop(0.3, 'rgba(5,8,5,0.85)'); band.addColorStop(0.7, 'rgba(5,8,5,0.85)'); band.addColorStop(1, 'rgba(5,8,5,0)');
  ctx.fillStyle = band; ctx.fillRect(-W, -size * 1.4, W * 2, size * 2.8);
  let x = -tw / 2;
  chunk.forEach((w, k) => {
    const i = c0 + k, W2 = w.toUpperCase(), ww = ctx.measureText(W2).width;
    const wt0 = L.t0 + i * wt;
    if (t >= wt0 - 0.02) {
      const ps = lerp(1.1, 1, eOut(prog(t, wt0, wt0 + 0.12)));
      ctx.save(); ctx.translate(x + ww / 2, 0); ctx.scale(ps, ps);
      ctx.lineJoin = 'round'; ctx.lineWidth = 16; ctx.strokeStyle = '#000';
      ctx.strokeText(W2, -ww / 2, 0);
      ctx.fillStyle = i === idx ? C.neon : C.white;
      ctx.fillText(W2, -ww / 2, 0);
      ctx.restore();
    }
    x += ww + sp;
  });
  ctx.restore();
}

// Clean background: black with one soft green glow, no grid.
function bg2(ctx, t, glow = C.green, k = 0.2) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  const gx = CX + Math.sin(t * 0.7) * 90, gy = 930 + Math.cos(t * 0.5) * 80;
  const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 760);
  g.addColorStop(0, hexA(glow, k)); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// Whole-frame punch zoom on beats: returns scale.
function punch(t, beats, amt = 0.05, dur = 0.25) {
  let s = 1;
  for (const b of beats) if (t >= b && t < b + dur) s += amt * (1 - eOut(prog(t, b, b + dur)));
  return s;
}

// Generic chat phone (original UI). msgs: [{who:'me'|'ai', text, t0, cps, list?}]
function chatPhone(ctx, cx, top, s, t, msgs, o = {}) {
  const { w = 820, h = 900, scrollTo = null } = o;
  ctx.save(); ctx.translate(cx, top); ctx.scale(s, s);
  ctx.shadowColor = hexA(C.green, 0.35); ctx.shadowBlur = 80;
  rr(ctx, -w / 2, 0, w, h, 64); ctx.fillStyle = '#0E120E'; ctx.fill();
  ctx.shadowBlur = 0; ctx.lineWidth = 6; ctx.strokeStyle = '#263226'; ctx.stroke();
  // header
  ctx.font = mfont(32, 700); ctx.fillStyle = C.white; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.beginPath(); ctx.arc(-w / 2 + 64, 70, 16, 0, 7); ctx.fillStyle = C.green; ctx.fill();
  ctx.fillStyle = C.white; ctx.fillText('AI chat', -w / 2 + 96, 72);
  ctx.fillStyle = '#1C241C'; ctx.fillRect(-w / 2, 124, w, 3);
  // messages
  ctx.save(); rr(ctx, -w / 2 + 6, 128, w - 12, h - 134, [0, 0, 58, 58]); ctx.clip();
  let y = 160; const pad = 30, bw = w - 150;
  const layout = [];
  for (const m of msgs) {
    if (t < m.t0) break;
    const n = m.cps ? Math.floor((t - m.t0) * m.cps) : Infinity;
    ctx.font = m.font || mfont(36, 600);
    const lines = wrap(ctx, m.text, bw - pad * 2);
    let shown = []; let left = n;
    for (const l of lines) { if (left <= 0) break; shown.push(l.slice(0, left)); left -= l.length + 1; }
    const lh = m.lh || 50;
    const bh = shown.length * lh + pad * 1.6;
    layout.push({ m, shown, y, bh, lh });
    y += bh + 28;
  }
  const off = Math.max(0, y - (h - 40));
  for (const L of layout) {
    const { m, shown, bh, lh } = L; const yy = L.y - off;
    const pin = eOut(prog(t, m.t0, m.t0 + 0.2));
    const bwid = Math.min(bw, Math.max(...shown.map(l => ctx.measureText(l).width), 60) + pad * 2);
    const x = m.who === 'me' ? w / 2 - 30 - bwid : -w / 2 + 30;
    ctx.save(); ctx.globalAlpha = pin; ctx.translate(0, (1 - pin) * 40);
    rr(ctx, x, yy, bwid, bh, 30);
    ctx.fillStyle = m.who === 'me' ? C.green : '#1A221A'; ctx.fill();
    ctx.font = m.font || mfont(36, 600);
    ctx.fillStyle = m.who === 'me' ? '#04140A' : C.white; ctx.textBaseline = 'top';
    shown.forEach((l, i) => ctx.fillText(l, x + pad, yy + pad * 0.8 + i * lh));
    ctx.restore();
  }
  ctx.restore();
  ctx.restore();
}

// ============================================================ DAY 6 v2
function day06v2(D) {
  const VO = [
    { t0: 0.05, t1: 1.5, text: 'I stopped writing hooks.' },
    { t0: 1.7, t1: 3.4, text: 'This one prompt writes thirty.' },
    { t0: 4.0, t1: 7.2, text: "Paste it in, add your niche, and you're done." },
    { t0: 11.1, t1: 13.4, text: 'Save this for your next blank day.' },
  ];
  const best = D.hooksBest.map(i => ({ n: i, text: D.hooks[i - 1] }));
  const bestT = i => 7.6 + i * 1.15;
  const listText = D.hooks.slice(0, 30).map((h, i) => `${i + 1}. ${h}`).join('\n');
  const cues = [[0, 'hit'], [1.7, 'whoosh'], [2.0, 'pop'], [3.4, 'pop2'], [11.0, 'hit2'], [13.5, 'whoosh']];
  best.forEach((b, i) => cues.push([bestT(i), 'whoosh'], [bestT(i) + 0.05, 'pop2']));
  for (let k = 0; k < 30; k++) cues.push([3.6 + k * 0.12, 'key']);
  const beats = [0, 1.7, 3.4, ...best.map((b, i) => bestT(i)), 11.0];
  return {
    dur: 14, cues, music: true,
    draw(ctx, t) {
      bg2(ctx, t);
      const z = punch(t, beats);
      ctx.save(); ctx.translate(CX, 960); ctx.scale(z, z); ctx.translate(-CX, -960);

      if (t < 1.7) {
        // a stack of old hooks being crossed out, already moving at frame 1
        const k = Math.floor(t / 0.22);
        for (let j = 2; j >= 0; j--) {
          const idx = (k + j) % 12;
          const yy = 820 + j * 46, s = 1 - j * 0.06;
          ctx.save(); ctx.translate(CX, yy); ctx.scale(s, s); ctx.rotate((rnd(idx) - 0.5) * 0.08);
          rr(ctx, -400, -150, 800, 300, 36); ctx.fillStyle = j ? '#141A14' : '#1C241C'; ctx.fill();
          ctx.font = mfont(52, 800); ctx.fillStyle = j ? '#5A665A' : C.white; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          const lines = wrap(ctx, D.hooks[idx + 12], 700);
          lines.forEach((l, li) => ctx.fillText(l, 0, (li - (lines.length - 1) / 2) * 62));
          if (!j) { // red strike
            const sk = prog(t % 0.22, 0.04, 0.16);
            ctx.strokeStyle = C.red; ctx.lineWidth = 12; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(-340, 0); ctx.lineTo(-340 + 680 * sk, -10); ctx.stroke();
          }
          ctx.restore();
        }
        bigHook(ctx, 'I stopped writing hooks', Y.hook, { scale: slam(t, 0, 1.12), hi: ['hooks'] });
      } else if (t < 7.6) {
        const enter = eOut(prog(t, 1.7, 2.1));
        const ps = lerp(0.98, 1.02, eInOut(prog(t, 3.4, 7.4)));
        chatPhone(ctx, CX, lerp(1500, 590, enter), ps, t, [
          { who: 'me', text: D.hooksPrompt, t0: 2.0, font: mfont(38, 600), lh: 52 },
          { who: 'ai', text: listText, t0: 3.5, cps: 70, font: mfont(40, 700), lh: 56 },
        ]);
        bigHook(ctx, 'This prompt writes 30', Y.hook, { scale: slam(t, 1.7, 1.12), hi: ['30'] });
        // counter badge
        if (t >= 3.5) {
          const c = Math.min(30, Math.floor((t - 3.5) * 70 / 33) + 1);
          ctx.save(); ctx.translate(880, 610); ctx.rotate(0.08); const s = pop(t, 3.5);
          ctx.scale(s, s);
          ctx.beginPath(); ctx.arc(0, 0, 92, 0, 7); ctx.fillStyle = C.green; ctx.fill();
          ctx.font = mfont(76); ctx.fillStyle = '#04140A'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(String(c), 0, 6); ctx.restore();
        }
      } else if (t < 11.0) {
        const i = Math.min(best.length - 1, Math.floor((t - 7.6) / 1.15)), b = best[i], t0 = bestT(i);
        bigHook(ctx, 'My top 3', 400, { size: 96, hi: ['3'], scale: slam(t, 7.6, 1.1) });
        const s = pop(t, t0, 0.22);
        ctx.save(); ctx.translate(CX, 860); ctx.scale(s, s); ctx.rotate((i - 1) * 0.025);
        rr(ctx, -440, -330, 880, 660, 48); ctx.fillStyle = '#F5F5F5'; ctx.fill();
        ctx.font = mfont(64, 900); ctx.fillStyle = C.brush; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(`#${b.n}`, -380, -270);
        ctx.font = mfont(84, 900); ctx.fillStyle = '#0A0F0A';
        wrap(ctx, b.text.toUpperCase(), 760).forEach((l, li) => ctx.fillText(l, -380, -150 + li * 100));
        ctx.restore();
        ctx.font = mfont(40, 700); ctx.fillStyle = C.grey; ctx.textAlign = 'center';
        ctx.fillText(`${i + 1} / 3`, CX, 1260);
      } else {
        bigHook(ctx, 'Save this', 560, { scale: slam(t, 11.0, 1.2), size: 150, hi: ['save'] });
        const s = pop(t, 11.25);
        ctx.save(); ctx.translate(CX, 860); ctx.scale(s * 1.3, s * 1.3);
        ctx.beginPath(); ctx.moveTo(-50, -70); ctx.lineTo(50, -70); ctx.lineTo(50, 75); ctx.lineTo(0, 35); ctx.lineTo(-50, 75); ctx.closePath();
        ctx.fillStyle = C.white; ctx.fill(); ctx.restore();
        ctx.font = mfont(50, 700); ctx.fillStyle = C.white; ctx.textAlign = 'center';
        ctx.fillText('Prompt is in the caption 👇'.replace(' 👇', ''), CX, 1080);
      }
      ctx.restore();
      captions(ctx, VO, t);
    },
  };
}
DAYS[6] = day06v2;
