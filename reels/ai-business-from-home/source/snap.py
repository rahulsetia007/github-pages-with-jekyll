import json,soundfile as sf,numpy as np
y,sr=sf.read('voice.wav');h=int(.01*sr)
e=np.array([np.sqrt(np.mean(y[i:i+h]**2)) for i in range(0,len(y)-h,h)])
sil=[];st=None
for i,s in enumerate(e<0.01):
    if s and st is None: st=i
    if not s and st is not None:
        if i-st>=6: sil.append((st/100,i/100))
        st=None
D=json.load(open('segs.json'))
fixed=0
for sg in D['segs']:
    W=sg['words']
    for w in W:
        for a,b in sil:
            if a-0.03<=w['s']<b and w['e']>b: w['s']=round(b,3); fixed+=1
    for i in range(len(W)-1):  # end = next start (or pause start)
        nx=W[i+1]['s']; pe=[a for a,b in sil if W[i]['s']<a<nx]
        W[i]['e']=round(min(pe) if pe else nx,3)
json.dump(D,open('segs.json','w'),indent=1)
print('fixed',fixed)
for s in D['segs']: print(s['key'],' '.join(f"{w['w']}@{w['s']:.2f}" for w in s['words']))
