import numpy as np,soundfile as sf
SR=44100;D=16.5;n=int(SR*D);t=np.arange(n)/SR;out=np.zeros(n)
bpm=128;b=60/bpm;nf=lambda m:440*2**((m-69)/12)
def add(st,dur,f,amp,kind='bell'):
    i0=int(st*SR);L=min(int(dur*SR),n-i0)
    if L<=0:return
    s=np.arange(L)/SR
    if kind=='bell':w=(np.sin(2*np.pi*f*s)+.5*np.sin(2*np.pi*f*2.01*s)+.25*np.sin(2*np.pi*f*3.99*s))*np.exp(-s*4)
    elif kind=='bass':w=np.sin(2*np.pi*f*s)*np.exp(-s*6)
    else:w=np.sin(2*np.pi*f*s)*np.minimum(1,s/.05)*np.exp(-s*1.2)
    out[i0:i0+L]+=amp*w
chords=[[60,64,67],[57,60,64],[53,57,60],[55,59,62]] # C Am F G
mel=[72,76,79,76, 74,72,69,72, 69,72,77,76, 74,71,74,79]
bars=int(D/(b*4))+1
for bar in range(bars):
    c=chords[bar%4];st=bar*4*b
    for k in range(4):add(st+k*b,b,nf(c[0]-24),.35,'bass')
    for m in c:add(st,4*b,nf(m),.05,'pad')
    if st>1.5:
        for k in range(4):add(st+k*b,b,nf(mel[(bar%4)*4+k]),.18,'bell')
    for k in range(8):add(st+k*b/2+b/4,b/2,nf(c[k%3]+12),.06,'bell')
rng=np.random.default_rng(2)
for k in range(int(D/(b/2))):  # sleigh-bell shaker
    st=k*b/2;i0=int(st*SR);L=min(int(.08*SR),n-i0)
    if L>0:out[i0:i0+L]+=.05*rng.uniform(-1,1,L)*np.exp(-np.arange(L)/SR*40)*(0.3 if st<2 else 1)
# whoosh at 3.4 (year flip) and chime at 13
for tt in (3.4,13.0):
    for m in (84,88,91,96):add(tt+(m-84)*.01,1.5,nf(m),.12,'bell')
out*=np.minimum(1,t/.3)*np.minimum(1,(D-t)/1.5);out/=np.abs(out).max()/0.9
sf.write('src/audio/music_ny.wav',out,SR)
