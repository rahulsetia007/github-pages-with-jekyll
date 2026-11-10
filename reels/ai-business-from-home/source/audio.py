import json, numpy as np, soundfile as sf
from scipy.signal import lfilter, butter, sosfilt, resample_poly
D = json.load(open('segs.json')); S = {s['key']: s for s in D['segs']}
ORDER = [s['key'] for s in D['segs']]
sr = 48000
END = D['segs'][-1]['start'] + D['segs'][-1]['dur'] + 0.3
N = int(END * sr); t = np.arange(N) / sr
rng = np.random.default_rng(3)
def hp(x, f): return sosfilt(butter(2, f, 'highpass', fs=sr, output='sos'), x)
def lp(x, f): return sosfilt(butter(2, f, 'lowpass', fs=sr, output='sos'), x)
def place(buf, sig, at, g=1.0):
    i = int(at * sr)
    if i < 0: sig = sig[-i:]; i = 0
    if i >= N: return
    n = min(len(sig), N - i); buf[i:i + n] += sig[:n] * g
def midi(m): return 440 * 2 ** ((m - 69) / 12)
# --- music: minimal techy groove, 120 bpm ---
BPM = 120; beat = 60 / BPM; bar = 4 * beat
music = np.zeros(N); side = np.ones(N)
kl = int(.3 * sr); kt = np.arange(kl) / sr
kick = np.sin(2 * np.pi * (48 * kt + 90 * (1 - np.exp(-kt * 30)) / 30)) * np.exp(-kt * 10)
hat = hp(rng.standard_normal(int(.04 * sr)), 8000) * np.exp(-np.arange(int(.04 * sr)) / sr * 110)
snap = hp(rng.standard_normal(int(.12 * sr)), 1500) * np.exp(-np.arange(int(.12 * sr)) / sr * 35)
for b in range(int(END / beat) + 1):
    bt = b * beat
    place(music, kick, bt, .85)
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
music = music + (pad * .5 + bl * .55 + arp) * side
music /= np.max(np.abs(music))
# --- sfx ---
sfx = np.zeros(N)
starts = [S[k]['words'][0]['s'] - 0.12 for k in ORDER[1:]]
for c, b in enumerate(starts):
    l = int(.45 * sr); et = np.arange(l) / sr
    x = rng.standard_normal(l); out = np.zeros(l); C = 9
    for j in range(C):
        a0 = j * l // C; a1 = (j + 1) * l // C; f = 500 * 2 ** (j / C * 2.5)
        out[a0:a1] = sosfilt(butter(2, [f * .7, f * 1.5], 'bandpass', fs=sr, output='sos'), x)[a0:a1]
    place(sfx, out * np.sin(np.pi * et / .45) ** 2, b - .3, .35)
    hl = int(.3 * sr); ht = np.arange(hl) / sr
    place(sfx, np.sin(2 * np.pi * (55 * ht + 30 * (1 - np.exp(-ht * 30)) / 30)) * np.exp(-ht * 10), b, .18)
# soft pops: checklist rows, the 10 sent messages
def tick(at,f=1500,g=.25):
    l = int(.06 * sr); et = np.arange(l) / sr
    place(sfx, np.sin(2 * np.pi * f * et) * np.exp(-et * 60), at, g)
for i in range(5): tick(S['loop']['words'][2]['s'] + i * .2)
for i in range(10): tick(S['s5']['words'][17]['s'] + i * .105, 1800, .18)
tick(S['s5']['words'][22]['s'] + .2, 2200, .35)
# opening hit
hl = int(.9 * sr); ht = np.arange(hl) / sr
place(sfx, np.sin(2 * np.pi * (44 * ht + 80 * (1 - np.exp(-ht * 25)) / 25)) * np.exp(-ht * 6), 0, .3)
# --- voice ---
v, vsr = sf.read('voice.wav'); v = resample_poly(v, 2, 1) if vsr == 24000 else v
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]
voice = hp(voice, 90)
voice = voice / np.max(np.abs(voice))
voice = np.tanh(voice * 2.2) / np.tanh(2.2)            # gentle compression, lifts quiet syllables
venv = lfilter([1 - np.exp(-1 / (sr * .06))], [1, -np.exp(-1 / (sr * .06))], np.abs(voice))
duck = np.clip(1 - venv * 4, .35, 1)
fade = np.clip((END - t) / 0.25, 0, 1)
V = voice * 1.0; M = music * .12 * duck * fade; X = sfx * .4
def db(x): return round(20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9), 1)
print('voice dB', db(V), ' music dB', db(M), ' sfx dB', db(X))
mix = V + M + X
mix = mix / np.max(np.abs(mix)) * .93
sf.write('mix.wav', np.stack([mix, mix], 1).astype(np.float32), sr)

print('ok', round(END, 2))
