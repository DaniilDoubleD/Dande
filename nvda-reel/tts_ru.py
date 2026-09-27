from piper import PiperVoice;import wave,io,numpy as np,soundfile as sf
from piper import SynthesisConfig
v=PiperVoice.load("ru-irinia-medium.onnx")
S=["Как вы думаете, какая главная финансовая ловушка нашего поколения?",
"Мне кажется, мы выглядим намного богаче, чем являемся на самом деле.",
"Мы легко летаем на выходные в Европу, и у нас последний Айфон.",
"Но стоит заболеть зубу, или случиться непредвиденной трате, и мы просто не можем себе этого позволить."]
sr=v.config.sample_rate;out=[];t=0
for i,s in enumerate(S):
  a=np.concatenate([c.audio_float_array for c in v.synthesize(s,syn_config=SynthesisConfig(length_scale=0.92))])
  print(i,round(t,2),round(len(a)/sr,2));out+=[a,np.zeros(int(sr*.25))];t+=len(a)/sr+.25
sf.write("/home/user/Dande/nvda-reel/vo_ru.wav",np.concatenate(out),sr);print('total',round(t,2))
