from kokoro_onnx import Kokoro;import soundfile as sf,numpy as np,json
k=Kokoro("kokoro-v1.0.onnx","voices-v1.0.bin")
S=["August, 1939. Europe is holding its breath.",
"Hitler wants Poland. But he needs a reason. Germany has to look like the victim, not the attacker.",
"So the S S comes up with a plan. Its code name: Operation Konserve. Canned goods.",
"Here, in the border town of Gleiwitz, stands a German radio station.",
"The idea is simple. S S men will dress in Polish uniforms, and attack their own station.",
"They will fire a few shots at the walls, and broadcast a message in Polish. Poland is attacking Germany.",
"On the evening of August thirty-first, they do exactly that.",
"The message goes on air. Almost no one hears it. But that doesn't matter.",
"The signal to begin was a simple phrase. Grandmother is dead.",
"At dawn on September first, the German army crosses the border. The Second World War has begun."]
out=[];t=0.6;tm=[];out.append(np.zeros(int(24000*.6)))
for s in S:
  a,sr=k.create(s,voice="am_michael",speed=0.95,lang="en-us");tm.append([round(t,2),round(t+len(a)/sr,2)]);out+=[a,np.zeros(int(sr*.8))];t+=len(a)/sr+.8
sf.write("/home/user/Dande/nvda-reel/vo_gl2.wav",np.concatenate(out),sr);print(json.dumps(tm),round(t,2))
