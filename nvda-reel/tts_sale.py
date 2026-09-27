from kokoro_onnx import Kokoro;import soundfile as sf,numpy as np,json
k=Kokoro("kokoro-v1.0.onnx","voices-v1.0.bin")
S=["This is what happens inside your brain when you see minus fifty percent.",
"First, your reward center lights up. Dopamine floods in. The same chemical behind gambling.",
"Then the scarcity alarm goes off. Only today! Only three left! Your brain hears: act now.",
"And your logic department? It gets switched off.",
"You didn't save fifty dollars. You spent fifty.",
"Stores don't sell products. They sell that feeling."]
out=[];t=0;tm=[]
for s in S:
  a,sr=k.create(s,voice="am_michael",speed=1.15,lang="en-us");tm.append([round(t,2),round(t+len(a)/sr,2),s]);out+=[a,np.zeros(int(sr*.3))];t+=len(a)/sr+.3
sf.write("/home/user/Dande/nvda-reel/vo_sale.wav",np.concatenate(out),sr);json.dump(tm,open("/home/user/Dande/nvda-reel/sale_lines.json","w"));print(json.dumps(tm,indent=0),t)
