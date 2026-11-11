// Tiny deterministic timeline helpers. Each day page defines DURATION, CUES and render(t).
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = x => 1 - Math.pow(1 - x, 3);
const easeIn = x => x * x * x;
const easeInOut = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const backOut = x => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
// Slam: starts big and snaps to size. Returns scale.
const slam = (t, at, dur = .22) => t < at ? 0 : 1 + 0.35 * (1 - easeOut(prog(t, at, at + dur)));
const show = (el, on) => { el.style.display = on ? '' : 'none'; };
const $ = s => document.querySelector(s);
// Small deterministic shake.
const shake = (t, at, dur = .3, amp = 14) => { const p = prog(t, at, at + dur); if (p <= 0 || p >= 1) return 0; return Math.sin(p * 40) * amp * (1 - p); };
