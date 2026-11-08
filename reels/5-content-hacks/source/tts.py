import json, re, numpy as np, soundfile as sf, librosa
from kokoro_onnx import Kokoro
T='/tmp/claude-0/-home-user-github-pages-with-jekyll/8afdf731-8cd3-5f79-ae7e-b8b20547c730/scratchpad/tts/'
k=Kokoro(T+'kokoro-v1.0.onnx',T+'voices-v1.0.bin')
V='am_michael'; SP=1.06
lines=[
 ("hook","Five content hacks that save you eight hours a week."),
 ("h1","One. Batch. Film four videos in one sitting."),
 ("h2","Two. Repurpose one video into a reel, a carousel and a newsletter."),
 ("h3","Three. Use templates. Stop designing from scratch."),
 ("h4","Four. Schedule the whole week at once."),
 ("h5","Five. Keep an idea bank. Never start from a blank page."),
 ("cta","Save this, and follow for more."),
]
def say(text):
    ph=k.tokenizer.phonemize(text,'en-us')
    a,sr=k.create(ph,voice=V,speed=SP,lang='en-us',is_phonemes=True)
    return np.asarray(a,np.float32),sr
def trim(a,th=0.012,pre=200,post=600):
    i=np.where(np.abs(a)>th)[0]; return a[max(0,i[0]-pre):i[-1]+post] if len(i) else a
sr=24000; HOP=120  # 5ms
def mf(x): return librosa.feature.mfcc(y=x,sr=sr,n_mfcc=20,hop_length=HOP,n_fft=1024)
out=[];segs=[];t=0.0
for key,text in lines:
    A,_=say(text); A=trim(A)
    words=text.split()
    # per-word synth, concatenated
    parts=[];bounds=[];pos=0
    for w in words:
        clean=re.sub(r"[^\w']","",w)
        b,_=say(clean); b=trim(b,pre=0,post=0)
        parts.append(b); bounds.append((pos,pos+len(b))); pos+=len(b)
    B=np.concatenate(parts)
    D,wp=librosa.sequence.dtw(X=mf(B),Y=mf(A),metric='cosine')
    wp=wp[::-1]; mapB2A={}
    for bi,ai in wp: mapB2A.setdefault(bi,ai)
    def m(sample):
        f=min(sample//HOP,max(mapB2A)); 
        while f not in mapB2A: f-=1
        return mapB2A[f]*HOP/sr
    wt=[]
    for w,(s0,s1) in zip(words,bounds):
        wt.append({"w":w,"s":round(t+m(s0),3),"e":round(t+m(s1-1),3)})
    d=len(A)/sr
    segs.append({"key":key,"text":text,"start":round(t,3),"dur":round(d,3),"words":wt})
    out.append(A); g=0.42 if key!='cta' else 0; out.append(np.zeros(int(g*sr),np.float32)); t+=d+g
y=np.concatenate(out); y=y/np.max(np.abs(y))*0.89
sf.write('voice.wav',y,sr)
json.dump({"total":round(t,3),"segs":segs},open('segs.json','w'),indent=1)
print('total',round(t,2))
for s in segs: print(s['key'],' '.join(f"{w['w']}@{w['s']:.2f}" for w in s['words']))
