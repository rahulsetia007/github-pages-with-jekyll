"""Synthesises the shared sound kit and mixes a day's cue list into a WAV.

The same synthesised sounds are used in every video so the account sounds
consistent. No voice track: the voiceover is added later.

usage: python3 sfx.py cues.json duration out.wav
"""
import json
import sys
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def env(n, attack=0.002, decay=0.2):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-t / decay)


def lowpass(x, cutoff):
    """One-pole low-pass; cutoff may be a scalar or per-sample array."""
    cutoff = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.zeros_like(x)
    prev = 0.0
    for i in range(len(x)):
        prev = (1 - a[i]) * x[i] + a[i] * prev
        y[i] = prev
    return y


def sweep(f0, f1, dur):
    n = int(dur * SR)
    f = np.geomspace(f0, f1, n)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def noise(dur):
    return rng.uniform(-1, 1, int(dur * SR))


def hit():  # deep impact for 0:00
    d = 0.7
    body = sweep(140, 40, d) * env(int(d * SR), 0.001, 0.22)
    click = lowpass(noise(d), 3000) * env(int(d * SR), 0.0005, 0.03) * 1.5
    return np.tanh((body * 1.2 + click) * 1.4) * 0.9


def hit2():  # end-card hit, a little brighter
    d = 0.6
    body = sweep(220, 55, d) * env(int(d * SR), 0.001, 0.18)
    sh = lowpass(noise(d), 6000) * env(int(d * SR), 0.001, 0.08) * 0.6
    return np.tanh((body + sh) * 1.3) * 0.8


def whoosh(dur=0.42):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    shape = np.sin(np.pi * t) ** 2
    cut = 400 + 5000 * np.sin(np.pi * t)
    return lowpass(noise(dur), cut) * shape * 1.6


def pop():  # list/text pop
    d = 0.09
    return sweep(1100, 650, d) * env(int(d * SR), 0.001, 0.03) * 0.6


def pop2():  # bigger pop for enlarges/reveals of a single item
    d = 0.16
    return (sweep(700, 1400, d) * 0.6 + sweep(350, 700, d) * 0.4) * env(int(d * SR), 0.001, 0.06) * 0.7


def tick():
    d = 0.03
    return np.sin(2 * np.pi * 2400 * np.arange(int(d * SR)) / SR) * env(int(d * SR), 0.0005, 0.006) * 0.35


def key():  # typing click
    d = 0.025
    return lowpass(noise(d), 4000) * env(int(d * SR), 0.0003, 0.005) * (0.5 + 0.3 * rng.random())


def riser(dur=0.45):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    return lowpass(noise(dur), 300 + 7000 * t ** 2) * t ** 2 * 1.2 + sweep(200, 900, dur) * t ** 3 * 0.25


def reveal():
    return np.concatenate([hit2() * 0.8, np.zeros(10)]) + np.pad(pop2() * 0.6, (0, int(0.6 * SR) + 10 - len(pop2())))


def rewind(dur=0.9):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    tone = np.sin(2 * np.pi * np.cumsum(np.geomspace(1500, 300, n) * (1 + 0.3 * np.sin(2 * np.pi * 18 * t))) / SR)
    return (tone * 0.25 + lowpass(noise(dur), 2500) * 0.4) * np.sin(np.pi * t)


def scratch():
    d = 0.35
    n = int(d * SR)
    t = np.linspace(0, 1, n)
    return lowpass(noise(d), 1500 + 1200 * np.sin(2 * np.pi * 9 * t)) * np.sin(np.pi * t) * 1.5


def buzz():  # neon flicker / angry buzz
    d = 0.25
    t = np.arange(int(d * SR)) / SR
    s = np.sign(np.sin(2 * np.pi * 110 * t)) * 0.3
    return lowpass(s, 1800) * env(len(t), 0.002, 0.12)


def thud():
    d = 0.3
    return sweep(90, 45, d) * env(int(d * SR), 0.001, 0.08) * 0.9


KIT = {f.__name__: f for f in [hit, hit2, whoosh, pop, pop2, tick, key, riser, reveal, rewind, scratch, buzz, thud]}
LEVEL = {'hit': 0.55, 'hit2': 0.45, 'whoosh': 0.35, 'pop': 0.4, 'pop2': 0.45, 'tick': 0.3, 'key': 0.25,
         'riser': 0.35, 'reveal': 0.5, 'rewind': 0.35, 'scratch': 0.4, 'buzz': 0.35, 'thud': 0.45}


# ------------------------------------------------------------- music bed
# Same feel as the Day 5 film's score: 75 BPM, Dm - Bb - F - C, soft pad,
# electric-piano stabs, round bass, kick on 1 and 3, light hats.
NOTE = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}


def hz(n):
    name, octv = n[:-1], int(n[-1])
    return 440 * 2 ** ((NOTE[name] + 12 * (octv + 1) - 69) / 12)


def tone(f, dur, kind):
    n = int(dur * SR)
    t = np.arange(n) / SR
    if kind == 'pad':
        x = sum(np.sin(2 * np.pi * f * d * t + d) for d in (0.996, 1.0, 1.004)) / 3
        x += 0.3 * np.sin(2 * np.pi * f * 2 * t)
        a = np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.5).clip(0)
        return x * a
    if kind == 'ep':
        x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / 0.15)
        return x * env(n, 0.003, 0.45)
    if kind == 'bass':
        x = np.tanh(1.6 * np.sin(2 * np.pi * f * t))
        return x * env(n, 0.005, 0.35)


def kick():
    d = 0.35
    return sweep(150, 45, d) * env(int(d * SR), 0.001, 0.12)


def hat():
    d = 0.06
    x = noise(d)
    x = x - lowpass(x, 6000)
    return x * env(int(d * SR), 0.0005, 0.015)


def music_bed(dur):
    bpm = 75
    beat = 60 / bpm
    prog = [['D2', 'F4', 'A4', 'D5'], ['A#1', 'F4', 'A#4', 'D5'], ['F2', 'A4', 'C5', 'F5'], ['C2', 'G4', 'C5', 'E5']]
    out = np.zeros(int(dur * SR) + SR * 4)

    def add(sig, t, g):
        i = int(t * SR)
        j = min(len(out), i + len(sig))
        out[i:j] += sig[: j - i] * g
    bar = 0
    t = 0.0
    while t < dur:
        c = prog[bar % 4]
        for n in c[1:]:
            add(tone(hz(n), beat * 4 + 0.4, 'pad'), t, 0.10)
        for b in (0, 1.5, 2.5):
            add(tone(hz(c[0]), beat * 0.9, 'bass'), t + b * beat, 0.32)
        for b in (1, 3):
            for n in c[2:]:
                add(tone(hz(n), beat, 'ep'), t + b * beat, 0.09)
        for b in (0, 2):
            add(kick(), t + b * beat, 0.45)
        for b in (0.5, 1.5, 2.5, 3.5):
            add(hat(), t + b * beat, 0.12)
        t += beat * 4
        bar += 1
    out = out[: int(dur * SR)]
    fade = int(0.8 * SR)
    out[-fade:] *= np.linspace(1, 0, fade)
    return out


def main():
    cues = json.load(open(sys.argv[1]))
    dur = float(sys.argv[2])
    out = sys.argv[3]
    mix = np.zeros(int(dur * SR) + SR)
    cache = {}
    for t, name in cues:
        snd = KIT[name]() if name in ('key',) else cache.setdefault(name, KIT[name]())
        start = int(t * SR)
        end = min(len(mix), start + len(snd))
        mix[start:end] += snd[: end - start] * LEVEL[name]
    mix = mix[: int(dur * SR)]
    peak = np.max(np.abs(mix)) or 1
    mix = mix / peak * 10 ** (-6 / 20)  # effects peak at -6 dBFS
    if len(sys.argv) > 4 and sys.argv[4] == 'music':
        m = music_bed(dur)
        rms = np.sqrt(np.mean(m ** 2)) or 1
        mix = mix * 0.8 + m / rms * 10 ** (-24 / 20)  # quiet bed so the voice sits on top
        mix = np.clip(mix, -0.98, 0.98)
    pcm = (np.stack([mix, mix], axis=1) * 32767).astype('<i2')
    with wave.open(out, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == '__main__':
    main()
