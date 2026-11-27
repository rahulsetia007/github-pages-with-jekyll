# Voice + original music bed (ducked) + SFX. Writes mix.wav. Final loudness set to -14 LUFS at mux.
import json, numpy as np, soundfile as sf
from scipy.signal import lfilter, butter, sosfilt, resample_poly
D = json.load(open('segs.json')); S = {s['key']: s for s in D['segs']}; ORDER = [s['key'] for s in D['segs']]
sr = 48000; END = D['segs'][-1]['start'] + D['segs'][-1]['dur'] + 0.9
N = int(END * sr); t = np.arange(N) / sr; rng = np.random.default_rng(6)
def hp(x, f): return sosfilt(butter(2, f, 'highpass', fs=sr, output='sos'), x)
def lp(x, f): return sosfilt(butter(2, f, 'lowpass', fs=sr, output='sos'), x)
def place(buf, sig, at, g=1.0):
    i = int(at * sr)
    if i < 0: sig = sig[-i:]; i = 0
    if i >= N: return
    n = min(len(sig), N - i); buf[i:i + n] += sig[:n] * g
def midi(m): return 440 * 2 ** ((m - 69) / 12)
# music: minimal techy groove, 120 bpm
BPM = 120; beat = 60 / BPM; bar = 4 * beat; music = np.zeros(N); side = np.ones(N)
kl = int(.3 * sr); kt = np.arange(kl) / sr
kick = np.sin(2 * np.pi * (48 * kt + 90 * (1 - np.exp(-kt * 30)) / 30)) * np.exp(-kt * 10)
hat = hp(rng.standard_normal(int(.04 * sr)), 8000) * np.exp(-np.arange(int(.04 * sr)) / sr * 110)
snap = hp(rng.standard_normal(int(.12 * sr)), 1500) * np.exp(-np.arange(int(.12 * sr)) / sr * 35)
for b in range(int(END / beat) + 1):
    bt = b * beat; place(music, kick, bt, .85)
    i = int(bt * sr); n = min(int(.25 * sr), N - i)
    if n > 0: side[i:i + n] = np.minimum(side[i:i + n], 1 - .6 * np.exp(-np.arange(n) / sr * 12))
    if b % 2 == 1: place(music, snap, bt, .25)
    for q in (.5, .75): place(music, hat, bt + beat * q, .12 if q == .5 else .06)
prog = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; bass = [45, 41, 48, 43]
pad = np.zeros(N); bl = np.zeros(N); arp = np.zeros(N)
for k in range(int(END / bar) + 1):
    a = k * bar; i0 = int(a * sr); i1 = min(N, int((a + bar) * sr))
    if i0 >= N: break
    tt = t[i0:i1] - a; env = np.minimum(1, tt / .1) * np.minimum(1, (bar - tt) / .15)
    pad[i0:i1] += sum((2 * ((midi(m) * tt * (1 + d)) % 1) - 1) for m in prog[k % 4] for d in (0, .005)) * env / 6
    for e in range(8):
        j0 = i0 + int(e * beat / 2 * sr); j1 = min(i1, j0 + int(beat / 2 * .8 * sr))
        if j0 >= N: break
        et = np.arange(j1 - j0) / sr; bl[j0:j1] += np.sin(2 * np.pi * midi(bass[k % 4]) * et) * np.exp(-et * 6)
    for s16 in range(16):
        if s16 % 3: continue
        m = prog[k % 4][(s16 // 3) % 3] + 24; l = int(.18 * sr); et = np.arange(l) / sr
        place(arp, np.sign(np.sin(2 * np.pi * midi(m) * et)) * np.exp(-et * 22) * .5, a + s16 * beat / 4, .14)
pad = lp(pad, 1600); arp = lp(arp, 4500)
music = music + (pad * .5 + bl * .55 + arp) * side; music /= np.max(np.abs(music))
# sfx: whoosh + sub hit on each scene change, pops for list rows, tap for Follow
sfx = np.zeros(N)
_w=lambda k,p,n=0:[w['s'] for w in S[k]['words'] if w['w'].startswith(p)][n]
starts = [S[k]['start'] - .12 for k in ['k1', 'f1a', 'y1', 'r1', 'c1']]
for b in starts:
    l = int(.45 * sr); et = np.arange(l) / sr; x = rng.standard_normal(l); out = np.zeros(l); C = 9
    for j in range(C):
        a0 = j * l // C; a1 = (j + 1) * l // C; f = 500 * 2 ** (j / C * 2.5)
        out[a0:a1] = sosfilt(butter(2, [f * .7, f * 1.5], 'bandpass', fs=sr, output='sos'), x)[a0:a1]
    place(sfx, out * np.sin(np.pi * et / .45) ** 2, b - .25, .35)
    hl = int(.3 * sr); ht = np.arange(hl) / sr
    place(sfx, np.sin(2 * np.pi * (55 * ht + 30 * (1 - np.exp(-ht * 30)) / 30)) * np.exp(-ht * 10), b, .18)
def tick(at, f=1500, g=.25):
    l = int(.06 * sr); et = np.arange(l) / sr; place(sfx, np.sin(2 * np.pi * f * et) * np.exp(-et * 60), at, g)
def wt(seg, pre):
    return next((w['s'] for w in S[seg]['words'] if w['w'].startswith(pre)), None)
st0 = lambda k: S[k]['start'] - .18
# PAIN: swipe ticks while the feed scrolls
for k in range(6): tick(.2 + k * .7, 1400, .12)
hl2 = int(.5 * sr); ht2 = np.arange(hl2) / sr
thud = np.sin(2 * np.pi * (60 * ht2 + 60 * (1 - np.exp(-ht2 * 25)) / 25)) * np.exp(-ht2 * 8)
place(sfx, thud, wt('p2', 'stops'), .35)
# POKE: claim tags pop, cash ticks
for pre in ['quality', 'fast', 'best']:
    c = wt('k2', pre)
    if c: tick(c, 2200, .2)
pay = wt('k2', 'pay')
for k in range(6): tick(pay + k * .2, 3200, .12)
# the purple cow: brake whoosh + a soft synthesized moo
tp = wt('f0a', 'purple')
ml = int(1.1 * sr); mt = np.arange(ml) / sr
f = 150 - 40 * np.clip(mt / 1.1, 0, 1)
ph = 2 * np.pi * np.cumsum(f) / sr
moo = (np.sin(ph) + .5 * np.sin(2 * ph) + .25 * np.sin(3 * ph)) * np.sin(np.pi * np.clip(mt / 1.1, 0, 1)) ** 1.5
moo = sosfilt(butter(2, [200, 1200], 'bandpass', fs=sr, output='sos'), moo)
place(sfx, moo / np.max(np.abs(moo)), tp + .3, .5)
tick(wt('f0a', 'tell'), 2600, .25); tick(wt('f0b', 'Seth'), 2200, .22)
# steps
w0 = wt('f1a', 'Write')
for k in range(4): tick(w0 + k * .25, 1800 + k * 150, .15)
c0 = wt('f1b', 'Cross')
for k in range(4): tick(c0 + k * .12, 900, .18)
tick(wt('f2a', 'Ask'), 2400, .2); tick(wt('f2b', 'replies'), 900, .22); tick(wt('f2b', 'Replies'), 3000, .3)
f1 = wt('f3a', 'first')
for k in range(12): tick(f1 + k * .05, 3000 + (k % 3) * 300, .05)
s0 = wt('f3b', 'spread')
for k in range(6): tick(s0 + .1 + k * .12, 2000 + k * 150, .15)
# PAYOFF: feed brakes on your ad, saves and shares count
place(sfx, thud, wt('y1', 'purple') + .3, .3)
r0 = wt('y1', 'remember')
for k in range(8): tick(r0 + k * .15, 2400 + (k % 2) * 400, .1)
# RECAP
for pre in ['Cross', 'Find', 'Lead']:
    c = wt('r1', pre)
    if c: tick(c, 2600, .22); tick(c + .06, 3300, .16)
tick(S['c1']['start'] - .12 + 2.2, 2200, .35)
hl = int(.9 * sr); ht = np.arange(hl) / sr
place(sfx, np.sin(2 * np.pi * (44 * ht + 80 * (1 - np.exp(-ht * 25)) / 25)) * np.exp(-ht * 6), 0, .3)  # opening hit
# voice
v, vsr = sf.read('voice.wav'); v = resample_poly(v, 2, 1) if vsr == 24000 else v
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]; voice = hp(voice, 90); voice = voice / np.max(np.abs(voice))
voice = voice + 0.3 * sosfilt(butter(2, [2500, 5000], 'bandpass', fs=sr, output='sos'), voice)   # presence
voice = voice / np.max(np.abs(voice))
voice = np.tanh(voice * 2.4) / np.tanh(2.4)
venv = lfilter([1 - np.exp(-1 / (sr * .06))], [1, -np.exp(-1 / (sr * .06))], np.abs(voice))
duck = np.clip(1 - venv * 4, .35, 1); fade = np.clip((END - t) / 0.25, 0, 1)
mix = voice + music * .12 * duck * fade + sfx * .4
mix = mix / np.max(np.abs(mix)) * .93
sf.write('mix.wav', np.stack([mix, mix], 1).astype(np.float32), sr)
print('ok', round(END, 2))
