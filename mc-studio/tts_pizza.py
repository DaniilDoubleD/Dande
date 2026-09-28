from kokoro_onnx import Kokoro;import soundfile as sf,numpy as np,json
k=Kokoro("kokoro-v1.0.onnx","voices-v1.0.bin")
S=["May 2010. Jacksonville, Florida.",
"A programmer named Laszlo Hanyecz is hungry.",
"He posts on a bitcoin forum: I will pay ten thousand bitcoins for two pizzas.",
"Someone takes the deal. Two large pizzas arrive at his door.",
"Back then, those ten thousand bitcoins were worth about forty dollars.",
"But the price of bitcoin kept climbing.",
"In 2013, those pizzas were worth seven million dollars. In 2017, a hundred and ninety million. In 2021, almost seven hundred million.",
"Today, those two pizzas are worth over a billion dollars.",
"The most expensive dinner in history. And every May twenty-second, the crypto world celebrates Bitcoin Pizza Day."]
out=[np.zeros(int(24000*.4))];t=.4;tm=[]
for s in S:
  a,sr=k.create(s,voice="am_liam",speed=1.0,lang="en-us");tm.append([round(t,2),round(t+len(a)/sr,2)]);out+=[a,np.zeros(int(sr*.45))];t+=len(a)/sr+.45
sf.write("/home/user/Dande/mc-studio/src/audio/vo_pizza.wav",np.concatenate(out),sr);print(json.dumps(tm),round(t,2))
