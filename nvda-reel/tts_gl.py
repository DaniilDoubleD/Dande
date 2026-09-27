from kokoro_onnx import Kokoro;import soundfile as sf,numpy as np,json
k=Kokoro("kokoro-v1.0.onnx","voices-v1.0.bin")
S=["August thirty-first, 1939. A German radio station on the Polish border.",
"Men in Polish uniforms storm in, and broadcast against Germany.",
"But they were SS. Code word: grandmother is dead.",
"Next morning, Germany invaded Poland. World War Two began."]
out=[];t=0;tm=[]
for s in S:
  a,sr=k.create(s,voice="am_michael",speed=1.25,lang="en-us");tm.append([round(t,2),round(t+len(a)/sr,2)]);out+=[a,np.zeros(int(sr*.2))];t+=len(a)/sr+.2
sf.write("/home/user/Dande/nvda-reel/vo_gl.wav",np.concatenate(out),sr);print(tm,t)
