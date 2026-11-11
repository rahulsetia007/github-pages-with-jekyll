#!/usr/bin/env bash
# Builds the house sound kit (same sounds in every Reel). Output: reels/sfx/*.wav
set -e
cd "$(dirname "$0")/sfx"
A="-ar 48000 -ac 2"
# hit: sub boom + noise transient (lands at 0:00)
ffmpeg -y -loglevel error -f lavfi -i "aevalsrc='0.9*sin(2*PI*(48+70*exp(-18*t))*t)*exp(-5*t)+0.35*(random(0)*2-1)*exp(-40*t)':d=0.9:s=48000" -af "lowpass=f=4000" $A hit.wav
# pop: short pitched blip for text and list pops
ffmpeg -y -loglevel error -f lavfi -i "aevalsrc='0.5*sin(2*PI*(1400-900*t*6)*t)*exp(-28*t)':d=0.18:s=48000" $A pop.wav
# popbig: fuller pop for enlarged items
ffmpeg -y -loglevel error -f lavfi -i "aevalsrc='0.45*sin(2*PI*(700-300*t*4)*t)*exp(-14*t)+0.25*sin(2*PI*1400*t)*exp(-30*t)':d=0.35:s=48000" $A popbig.wav
# whoosh: swept noise for cut transitions
ffmpeg -y -loglevel error -f lavfi -i "aevalsrc='0.6*(random(0)*2-1)*pow(sin(PI*t/0.45),2)':d=0.45:s=48000" -af "bandpass=f=1800:w=1600,volume=1.6" $A whoosh.wav
# tick: dry click for highlights and tension
ffmpeg -y -loglevel error -f lavfi -i "aevalsrc='0.6*(random(0)*2-1)*exp(-260*t)+0.3*sin(2*PI*3200*t)*exp(-120*t)':d=0.05:s=48000" $A tick.wav
# reveal: boom + bright chord for the big reveal
ffmpeg -y -loglevel error -f lavfi -i "aevalsrc='0.6*sin(2*PI*(45+60*exp(-14*t))*t)*exp(-4*t)+0.12*(sin(2*PI*523*t)+sin(2*PI*659*t)+sin(2*PI*784*t))*exp(-3*t)':d=1.4:s=48000" $A reveal.wav
# type: single key click (repeat for typing)
ffmpeg -y -loglevel error -f lavfi -i "aevalsrc='0.35*(random(0)*2-1)*exp(-400*t)':d=0.03:s=48000" -af "highpass=f=1500" $A type.wav
ls
