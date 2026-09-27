import math,wave,struct,random
SR=44100;D=15.0;n=int(SR*D);buf=[0.0]*n
def note(m):return 440*2**((m-69)/12)
chords=[[57,60,64,69],[53,57,60,65],[48,55,60,64],[55,59,62,67]]  # Am F C G
bl=60/100*4  # 100 bpm bar
for i in range(n):
    t=i/SR;ci=int(t/bl)%4;ph=(t%bl)/bl;s=0
    for m in chords[ci]:
        f=note(m);s+=0.05*(math.sin(2*math.pi*f*t)+0.3*math.sin(2*math.pi*f*2*t))
    s*=min(1,ph*8)*(1-0.3*ph)
    bt=t%0.6
    s+=0.35*math.sin(2*math.pi*(50+90*math.exp(-bt*30))*bt)*math.exp(-bt*9)  # kick
    ht=(t+0.3)%0.6;s+=0.03*(random.random()*2-1)*math.exp(-ht*40)  # hat
    ar=chords[ci][int(t/0.15)%4]+12;at=t%0.15;s+=0.06*math.sin(2*math.pi*note(ar)*t)*math.exp(-at*12)
    s*=min(1,t/1.0)*min(1,(D-t)/1.5);buf[i]=s
w=wave.open('music.wav','w');w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR)
w.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,x*0.8))*32767)) for x in buf));w.close()
