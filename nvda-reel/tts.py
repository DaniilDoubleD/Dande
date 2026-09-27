from kokoro_onnx import Kokoro;import soundfile as sf
k=Kokoro("kokoro-v1.0.onnx","voices-v1.0.bin")
S=["Stop scrolling. This is what NOT investing costs you.",
"A hundred bucks a month in the S and P 500, ten years ago...",
"Twelve grand in. Twenty-three grand today.",
"Kept it in cash? Inflation ate a quarter of it.",
"Start today."]
import numpy as np;out=[];t=0
for i,s in enumerate(S):
  a,sr=k.create(s,voice="am_michael",speed=1.2,lang="en-us");print(i,round(t,2),round(len(a)/sr,2));out+= [a,np.zeros(int(sr*.18))];t+=len(a)/sr+.18
sf.write("/home/user/Dande/nvda-reel/vo.wav",np.concatenate(out),sr);print("total",round(t,2))
