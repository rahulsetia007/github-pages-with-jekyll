import json, numpy as np, soundfile as sf
sr=48000
S=json.load(open('segs.json'))['segs']; END=S[-1]['start']+S[-1]['dur']+1.3
N=int(END*sr); t=np.arange(N)/sr
rng=np.random.default_rng(7)
def lp(x,fc):  # one-pole lowpass
    a=np.exp(-2*np.pi*fc/sr); y=np.empty_like(x); acc=0.0
    from scipy.signal import lfilter
    return lfilter([1-a],[1,-a],x)
try:
    import scipy
except ImportError:
    import subprocess,sys; subprocess.run([sys.executable,'-m','pip','install','-q','scipy']); import scipy
from scipy.signal import lfilter, butter, sosfilt
def bp(x,lo,hi): return sosfilt(butter(2,[lo,hi],'bandpass',fs=sr,output='sos'),x)
def hp(x,f): return sosfilt(butter(2,f,'highpass',fs=sr,output='sos'),x)
BPM=112; beat=60/BPM
music=np.zeros(N); side=np.ones(N)
def place(buf,sig,at,g=1.0):
    i=int(at*sr); 
    if i>=N: return
    n=min(len(sig),N-i); 
    if i<0: sig=sig[-i:]; n=min(len(sig),N); i=0
    buf[i:i+n]+=sig[:n]*g
# kick
kl=int(.35*sr); kt=np.arange(kl)/sr
kick=np.sin(2*np.pi*(45*kt+ (120-45)*(1-np.exp(-kt*28))/28))*np.exp(-kt*9)
clap=hp(rng.standard_normal(int(.18*sr)),900)*np.exp(-np.arange(int(.18*sr))/sr*28)
hat=hp(rng.standard_normal(int(.05*sr)),7000)*np.exp(-np.arange(int(.05*sr))/sr*90)
nb=int(END/beat)+1
for b in range(nb):
    bt=b*beat
    place(music,kick,bt,0.9)
    i=int(bt*sr); n=min(int(.3*sr),N-i)
    if n>0: side[i:i+n]=np.minimum(side[i:i+n],1-0.65*np.exp(-np.arange(n)/sr*10))
    if b%2==1: place(music,clap,bt,0.32)
    place(music,hat,bt+beat/2,0.18); place(music,hat,bt+beat/4*3,0.07)
# chords Am F C G (2 beats? 4 beats each)
def midi(m): return 440*2**((m-69)/12)
prog=[[57,60,64,69],[53,57,60,65],[48,55,60,64],[55,59,62,67]]
bass=[45,41,48,43]
pad=np.zeros(N); bl=np.zeros(N)
bar=4*beat
for k in range(int(END/bar)+1):
    ch=prog[k%4]; a=k*bar; i0=int(a*sr); i1=min(N,int((a+bar)*sr))
    if i0>=N: break
    tt=t[i0:i1]-a
    env=np.minimum(1,tt/.08)*np.minimum(1,(bar-tt)/.1)
    sig=sum(np.sign(np.sin(2*np.pi*midi(m)*tt+ph))*0.0+ (2*((midi(m)*tt*(1+d))%1)-1) for m in ch for d,ph in [(0,0),(0.004,1)])
    pad[i0:i1]+=sig*env/8
    # bass 8ths
    for e in range(8):
        ea=e*beat/2; j0=i0+int(ea*sr); j1=min(i1,j0+int(beat/2*0.85*sr))
        if j0>=N: break
        et=np.arange(j1-j0)/sr
        bl[j0:j1]+=np.sin(2*np.pi*midi(bass[k%4])*et)*np.exp(-et*5)*0.9
pad=lp(lp(pad,1400),2200)
# arp pluck (16ths, sparse) for sparkle
arp=np.zeros(N)
for s16 in range(int(END/(beat/4))):
    if s16%3: continue
    k=int(s16*beat/4/bar); ch=prog[k%4]; m=ch[(s16//3)%4]+12
    a=s16*beat/4; l=int(.25*sr); et=np.arange(l)/sr
    place(arp,np.sin(2*np.pi*midi(m)*et)*np.exp(-et*14),a,0.18)
music=music+ (pad*0.55+bl*0.5+arp)*side
music=music/np.max(np.abs(music))
# --- SFX ---
sfx=np.zeros(N)
starts=[s['start']-0.18 for s in S[1:]]
for i,b in enumerate(starts):
    l=int(.55*sr); x=rng.standard_normal(l); et=np.arange(l)/sr
    env=np.sin(np.pi*np.clip(et/.55,0,1))**2
    # sweep via chunks of bandpass
    out=np.zeros(l); C=11
    for c in range(C):
        a0=c*l//C; a1=(c+1)*l//C; f=600*2**(c/C*3.2)
        out[a0:a1]=bp(x,f*.7,min(f*1.6,20000))[a0:a1]
    place(sfx,out*env,b-.3,0.55)
    # soft sub hit on landing
    hl=int(.4*sr); ht=np.arange(hl)/sr
    place(sfx,np.sin(2*np.pi*(55*ht+40*(1-np.exp(-ht*30))/30))*np.exp(-ht*8),b+.02,0.35)
# opening impact + shimmer at 0
hl=int(1.0*sr); ht=np.arange(hl)/sr
place(sfx,np.sin(2*np.pi*(42*ht+90*(1-np.exp(-ht*25))/25))*np.exp(-ht*4),0.0,0.7)
place(sfx,hp(rng.standard_normal(hl),5000)*np.exp(-ht*5),0.0,0.10)
# pops for hook pills and follow click
for k in range(7):
    pl=int(.08*sr); pt=np.arange(pl)/sr
    place(sfx,np.sin(2*np.pi*(900+k*90)*pt)*np.exp(-pt*45),0.05+k*0.07,0.22)
cta=S[-1]['start']-0.18
cl=int(.06*sr); ct=np.arange(cl)/sr
place(sfx,np.sin(2*np.pi*1800*ct)*np.exp(-ct*80)+hp(rng.standard_normal(cl),3000)*np.exp(-ct*90)*.4,cta+1.80,0.4)
# --- voice + ducking ---
v,vsr=sf.read('voice.wav'); 
from scipy.signal import resample_poly
v=resample_poly(v,2,1) if vsr==24000 else v
voice=np.zeros(N); voice[:min(N,len(v))]=v[:N]
venv=lfilter([1-np.exp(-1/(sr*.08))],[1,-np.exp(-1/(sr*.08))],np.abs(voice))
duck=np.clip(1-venv*3.0,0.45,1.0)
# gentle eq/comp on voice: highpass + presence
voice=hp(voice,90); voice=voice+0.25*bp(voice,2500,6000); voice=np.tanh(voice*1.6)/np.tanh(1.6)
mus_g=0.17*duck
fade=np.clip((END-t)/1.0,0,1)
mix=voice*0.95+music*mus_g*fade+sfx*0.55
mix=mix/np.max(np.abs(mix))*0.93
sf.write('mix.wav',mix.astype(np.float32),sr)
nomus=voice*0.95+sfx*0.55; nomus=nomus/np.max(np.abs(nomus))*0.93
sf.write('voice_sfx_nomusic.wav',nomus.astype(np.float32),sr)
print('ok',END)
