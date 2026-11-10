// Renders the Day 6-12 Reels to /exports/day-XX.mp4.
// usage: node src/render.mjs [day ...]        (no args = all days)
//        node src/render.mjs --stills 8 0,2,5  (PNG stills for checking)
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IN = p => path.join(ROOT, 'inputs', p);
const read = p => fs.readFileSync(IN(p), 'utf8').trim();
const exists = p => fs.existsSync(IN(p));
const numbered = p => read(p).split('\n').map(l => l.replace(/^\s*\d+[.)]\s*/, '').trim()).filter(Boolean);
const ints = p => read(p).split(/\s+/).map(Number).filter(Boolean);
const piped = p => read(p).split('\n').filter(Boolean).map(l => { const [a, ...b] = l.split('|'); return { a: a.trim(), b: b.join('|').trim() }; });
const imgData = p => {
  if (!exists(p)) return null;
  const ext = path.extname(p).slice(1).replace('jpg', 'jpeg');
  return `data:image/${ext};base64,${fs.readFileSync(IN(p)).toString('base64')}`;
};
const firstImg = base => ['.jpg', '.jpeg', '.png', '.webp'].map(e => base + e).find(exists);

function loadData() {
  return {
    hooks: numbered('day-06-hooks.txt'),
    hooksPrompt: read('day-06-prompt.txt'),
    hooksBest: ints('day-06-best.txt'),
    posts: read('day-07-posts.txt').split(/^---$/m).map(s => s.trim()).filter(Boolean).map(s => {
      const [label, ...rest] = s.split('\n');
      return { label: label.trim(), body: rest.join('\n').trim() };
    }),
    review: read('day-08-review.txt'),
    reply: read('day-08-reply.txt'),
    replyPhrases: read('day-08-phrases.txt').split('\n').map(s => s.trim()).filter(Boolean),
    promos: numbered('day-09-promos.txt'),
    promosPrompt: read('day-09-prompt.txt'),
    promosBest: ints('day-09-best.txt'),
    prompts: piped('day-11-prompts.txt').map(r => ({ label: r.a, text: r.b })),
    headlines: piped('day-12-headlines.txt').map(r => ({ tag: r.a, text: r.b })),
    headBest: ints('day-12-best.txt'),
    img: {
      before: firstImg('day-10-before') && imgData(firstImg('day-10-before')),
      after: firstImg('day-10-after') && imgData(firstImg('day-10-after')),
      tool: firstImg('day-10-tool') && imgData(firstImg('day-10-tool')),
    },
  };
}

async function openPage() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(ROOT, 'src', 'index.html'));
  const data = loadData();
  await page.evaluate(async d => {
    for (const f of ['150px Anton', '40px JBM', '40px JBMB', '40px Marker', '40px Inter', '700 40px Inter', '900 40px Montserrat', '800 40px Montserrat', '700 40px Montserrat', '600 40px Montserrat']) await document.fonts.load(f);
    const load = src => src ? new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; }) : null;
    d.img = { before: await load(d.img.before), after: await load(d.img.after), tool: await load(d.img.tool) };
    window.DATA = d;
  }, data);
  return { browser, page, data };
}

const FPS = 30;

async function renderDay(page, day, data) {
  const { dur, cues, music } = await page.evaluate(id => window.setupDay(id), day);
  const dd = String(day).padStart(2, '0');
  const missing = day === 10 && !(data.img.before && data.img.after && data.img.tool);
  const name = missing ? `day-${dd}-PREVIEW` : `day-${dd}`;
  const tmp = path.join(ROOT, 'exports', `.${name}`);
  fs.mkdirSync(path.join(ROOT, 'exports'), { recursive: true });
  const cueFile = `${tmp}.cues.json`, wav = `${tmp}.wav`, vid = `${tmp}.video.mp4`;
  fs.writeFileSync(cueFile, JSON.stringify(cues));
  execFileSync('python3', [path.join(ROOT, 'src', 'sfx.py'), cueFile, String(dur), wav, music ? 'music' : 'nomusic']);

  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), vid], { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.round(dur * FPS);
  for (let f = 0; f < frames; f++) {
    const url = await page.evaluate(t => window.renderFrame(t), f / FPS);
    const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', c => (c ? rej(new Error('ffmpeg ' + c)) : res())));
  const out = path.join(ROOT, 'exports', `${name}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', vid, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
  for (const f of [cueFile, wav, vid]) fs.rmSync(f, { force: true });
  console.log(`day ${day}: ${out} (${dur}s, ${frames} frames)${missing ? ' — placeholder images, add your Day 10 photos and re-render' : ''}`);
}

async function stills(page, day, times, outDir) {
  await page.evaluate(id => window.setupDay(id), day);
  fs.mkdirSync(outDir, { recursive: true });
  for (const t of times) {
    const url = await page.evaluate(tt => window.renderFrame(tt, 0.85), t);
    fs.writeFileSync(path.join(outDir, `d${day}-${String(t).replace('.', '_')}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  }
}

const args = process.argv.slice(2);
const { browser, page, data } = await openPage();
page.on('pageerror', e => { console.error('page error:', e.message); process.exitCode = 1; });
try {
  if (args[0] === '--stills') {
    await stills(page, Number(args[1]), args[2].split(',').map(Number), args[3] || path.join(ROOT, 'exports', 'stills'));
  } else {
    const days = args.length ? args.map(Number) : [6, 7, 8, 9, 10, 11, 12];
    for (const d of days) await renderDay(page, d, data);
  }
} finally {
  await browser.close();
}
