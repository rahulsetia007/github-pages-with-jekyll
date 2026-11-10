# Voice settings reused from earlier @tech_blogcorner reels: Kokoro am_michael, speed 1.06, en-us, clear "A I".
import json, re, numpy as np, soundfile as sf, librosa
from kokoro_onnx import Kokoro
T='/tmp/claude-0/-home-user-github-pages-with-jekyll/9fe42880-e1fc-595c-b55b-c588642b64c0/scratchpad/tts/'
k=Kokoro(T+'kokoro-v1.0.onnx',T+'voices-v1.0.bin')
V='am_michael'; SP=1.06
lines=list(zip(['hook','loop','s1','s2','s3','s4','s5','cta'],open('vo.txt').read().strip().split('\n')))
def say(text):
    ph=k.tokenizer.phonemize(text,'en-us').replace('ˌeɪˈaɪ','ˈeɪ ˈaɪ')
    a,sr=k.create(ph,voice=V,speed=SP,lang='en-us',is_phonemes=True)
    return np.asarray(a,np.float32),sr
def trim(a,th=0.012,pre=200,post=600):
    i=np.where(np.abs(a)>th)[0]; return a[max(0,i[0]-pre):i[-1]+post] if len(i) else a
sr=24000; HOP=120
def mf(x): return librosa.feature.mfcc(y=x,sr=sr,n_mfcc=20,hop_length=HOP,n_fft=1024)
out=[];segs=[];t=0.0
for key,text in lines:
    A,_=say(text); A=trim(A)
    words=text.split(); parts=[];bounds=[];pos=0
    for w in words:
        b,_=say(re.sub(r"[^\w']","",w) or w); b=trim(b,pre=0,post=0)
        parts.append(b); bounds.append((pos,pos+len(b))); pos+=len(b)
    B=np.concatenate(parts)
    D,wp=librosa.sequence.dtw(X=mf(B),Y=mf(A),metric='cosine'); wp=wp[::-1]; mp={}
    for bi,ai in wp: mp.setdefault(bi,ai)
    def m(s):
        f=min(s//HOP,max(mp))
        while f not in mp: f-=1
        return mp[f]*HOP/sr
    wt=[{"w":w,"s":round(t+m(s0),3),"e":round(t+m(s1-1),3)} for w,(s0,s1) in zip(words,bounds)]
    d=len(A)/sr
    segs.append({"key":key,"text":text,"start":round(t,3),"dur":round(d,3),"words":wt})
    out.append(A); g=0.2 if key!='cta' else 0; out.append(np.zeros(int(g*sr),np.float32)); t+=d+g
y=np.concatenate(out); y=y/np.max(np.abs(y))*0.89
sf.write('voice.wav',y,sr)
json.dump({"total":round(t,3),"segs":segs},open('segs.json','w'),indent=1)
print('total',round(t,2))
