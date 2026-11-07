import json, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
T='/tmp/claude-0/-home-user-github-pages-with-jekyll/8afdf731-8cd3-5f79-ae7e-b8b20547c730/scratchpad/tts/'
k=Kokoro(T+'kokoro-v1.0.onnx',T+'voices-v1.0.bin')
lines=[
 ("hook","Seven free AI tools every student needs. Save this."),
 ("t1","One. NotebookLM. Upload your notes, and it turns them into a podcast and quizzes."),
 ("t2","Two. Perplexity. Research answers with real sources cited."),
 ("t3","Three. Gamma. Type a topic, get a full slide deck in seconds."),
 ("t4","Four. Napkin AI. Paste your text, get clean diagrams."),
 ("t5","Five. Otter. It records and transcribes your lectures."),
 ("t6","Six. QuillBot. Fixes your grammar and rewrites any sentence."),
 ("t7","Seven. Consensus. Answers backed by real research papers."),
 ("cta","Follow for more AI tools that actually help."),
]
sr=24000; out=[]; segs=[]; t=0.0
gap={'hook':0.15}
for key,text in lines:
    ph=k.tokenizer.phonemize(text,'en-us')
    ph=ph.replace('ˌeɪˈaɪ','ˈeɪ ˈaɪ')   # clear, fully stressed "A I"
    print(key,ph)
    a,sr=k.create(ph,voice=sys.argv[1] if len(sys.argv)>1 else 'af_heart',speed=1.12,lang='en-us',is_phonemes=True)
    a=np.asarray(a,dtype=np.float32)
    # trim silence
    idx=np.where(np.abs(a)>0.01)[0]; a=a[max(0,idx[0]-240):idx[-1]+1200]
    d=len(a)/sr
    segs.append({"key":key,"text":text,"start":round(t,3),"dur":round(d,3)})
    out.append(a); g=gap.get(key,0.22); out.append(np.zeros(int(g*sr),np.float32)); t+=d+g
y=np.concatenate(out); y=y/np.max(np.abs(y))*0.89
sf.write('voice.wav',y,sr)
json.dump({"total":round(t,3),"segs":segs},open('segs.json','w'),indent=1)
print(t); print(json.dumps(segs,indent=0))
