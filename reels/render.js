// Usage: node reels/render.js day-06  ->  exports/day-06.mp4
// Renders reels/days/<id>.html frame by frame at 30 fps, mixes the house SFX at the page's CUES, encodes H.264 + AAC.
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const path = require('path'); const fs = require('fs');
const id = process.argv[2]; if (!id) throw new Error('day id required');
const root = path.resolve(__dirname, '..');
const FPS = 30;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.join(__dirname, 'days', id + '.html'));
  await p.evaluate(() => document.fonts.ready);
  const { DURATION, CUES } = await p.evaluate(() => ({ DURATION, CUES }));
  const frames = Math.round(DURATION * FPS);
  const tmpVid = path.join(root, 'exports', `.${id}-video.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), tmpVid], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < frames; i++) {
    await p.evaluate(t => render(t), i / FPS);
    const buf = await p.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) process.stdout.write(`frame ${i}/${frames}\n`);
  }
  // Optional stills for review
  for (const s of (await p.evaluate(() => typeof STILLS !== 'undefined' ? STILLS : []))) {
    await p.evaluate(t => render(t), s); await p.screenshot({ path: path.join(root, 'exports', `${id}-still-${String(s).replace('.', '_')}.png`) });
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();
  // Audio: silent bed (voice track left empty) + SFX cues
  const args = ['-y', '-loglevel', 'error', '-f', 'lavfi', '-t', String(DURATION), '-i', 'anullsrc=r=48000:cl=stereo'];
  const filt = [];
  CUES.forEach(([t, name, vol = 1], k) => {
    args.push('-i', path.join(__dirname, 'sfx', name + '.wav'));
    const ms = Math.round(t * 1000);
    filt.push(`[${k + 1}:a]volume=${vol},adelay=${ms}|${ms}[a${k}]`);
  });
  const mix = `[0:a]${CUES.map((_, k) => `[a${k}]`).join('')}amix=inputs=${CUES.length + 1}:normalize=0:duration=first,alimiter=limit=0.89[aout]`;
  const tmpAud = path.join(root, 'exports', `.${id}-audio.m4a`);
  execFileSync('ffmpeg', [...args, '-filter_complex', [...filt, mix].join(';'), '-map', '[aout]', '-c:a', 'aac', '-b:a', '192k', tmpAud]);
  const out = path.join(root, 'exports', id + '.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmpVid, '-i', tmpAud, '-c:v', 'copy', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', out]);
  fs.unlinkSync(tmpVid); fs.unlinkSync(tmpAud);
  console.log('wrote', out);
})();
