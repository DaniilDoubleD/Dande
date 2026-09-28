from kokoro_onnx import Kokoro;import soundfile as sf,numpy as np,json
k=Kokoro("kokoro-v1.0.onnx","voices-v1.0.bin")
S=["World War Two ended in 1945.","But for some Japanese soldiers, it went on for decades.",
"They hid in the jungles of Pacific islands, not knowing that Japan had surrendered long ago. Or refusing to believe it.",
"Planes dropped leaflets over the forests: The war is over.","But the soldiers were sure it was an enemy trick. They had been taught that surrender was worse than death.",
"On the island of Guam, Sergeant Shoichi Yokoi lived for twenty-eight years in a hole he dug himself.","He caught fish, wove clothes from tree bark, and was afraid to come out. He was found only in 1972.",
"On the Philippine island of Lubang, Lieutenant Hiroo Onoda and three comrades kept fighting a guerrilla war.","Year after year, his companions were killed or surrendered. Onoda was the last one left.",
"He refused to lay down his arms, until in 1974, his former commander flew into the jungle and personally cancelled the order.",
"And a few months later, on the island of Morotai, they found Private Teruo Nakamura.","He was the last soldier to walk out of the jungle, almost thirty years after the war had ended."]
out=[np.zeros(int(24000*.5))];t=.5;tm=[]
for s in S:
  a,sr=k.create(s,voice="am_liam",speed=0.97,lang="en-us");tm.append([round(t,2),round(t+len(a)/sr,2)]);out+=[a,np.zeros(int(sr*.55))];t+=len(a)/sr+.55
sf.write("/home/user/Dande/mc-studio/src/audio/vo.wav",np.concatenate(out),sr);print(json.dumps(tm),round(t,2))
