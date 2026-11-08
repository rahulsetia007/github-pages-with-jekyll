import json, numpy as np, soundfile as sf, subprocess, os
from scipy.signal import butter, sosfilt
D = '/tmp/claude-0/-home-user-github-pages-with-jekyll/8afdf731-8cd3-5f79-ae7e-b8b20547c730/scratchpad/'
v, sr = sf.read(D + 'repo/voice.wav')
DUR = 7.0; FPS = 30; N = int(DUR * FPS)
v = v[:int(DUR * sr)]
# per-frame mouth openness from speech-band energy, plus a brightness cue for mouth shape
band = sosfilt(butter(4, [250, 3500], 'bandpass', fs=sr, output='sos'), v)
hi = sosfilt(butter(4, 2500, 'highpass', fs=sr, output='sos'), v)
hop = sr // FPS
e = np.array([np.sqrt(np.mean(band[i * hop:(i + 1) * hop] ** 2)) for i in range(N)])
h = np.array([np.sqrt(np.mean(hi[i * hop:(i + 1) * hop] ** 2)) for i in range(N)])
m = np.clip((e - 0.008) / (np.percentile(e, 92) - 0.008), 0, 1)
# smooth: fast attack, slower release, so the mouth doesn't jitter
sm = np.zeros(N)
for i in range(N):
    prev = sm[i - 1] if i else 0
    sm[i] = prev + (m[i] - prev) * (0.75 if m[i] > prev else 0.45)
shape = np.clip(1 - h / (e + 1e-6) * 1.5, 0, 1)
blinks = [1.3, 3.9, 6.2]
frames = []
for i in range(N):
    t = i / FPS
    b = max([max(0, 1 - abs(t - bt) / 0.07) for bt in blinks] + [0])
    pose = 'wave' if t < 1.6 else ('point' if t > 4.9 else 'idle')
    frames.append({'mouth': round(float(sm[i]), 3), 'shape': round(float(shape[i]), 3), 'blink': round(b, 3),
                   'brow': round(float(min(1, sm[i] * 1.2) * .5), 3), 'bob': round(float(np.sin(t * 2.2) * 3 + sm[i] * 2), 2),
                   'tilt': round(float(np.sin(t * 1.3) * 1.6 + (-3 if pose == 'point' else 0)), 2),
                   'lookX': -0.8 if pose == 'point' else round(float(np.sin(t * .7) * .25), 2), 'lookY': -0.5 if pose == 'point' else 0,
                   'pose': pose, 'wave': t * 9, 'smile': .8})
json.dump(frames, open(D + 'mascot/demo_frames.json', 'w'))
sf.write(D + 'mascot/demo_voice.wav', v, sr)
print(N, 'frames; mean mouth', round(float(sm.mean()), 2))
