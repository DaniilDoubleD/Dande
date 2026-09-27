import numpy as np,soundfile as sf
SR=44100;D=24.0;n=int(SR*D);t=np.arange(n)/SR;out=np.zeros(n)
bpm=124;beat=60/bpm;bar=beat*4
nf=lambda m:440*2**((m-69)/12)
prog=[45,41,38,40] # A, F, D, E roots (bass)
chords=[[57,60,64],[53,57,60],[50,53,57],[52,56,59]] # Am F Dm E
def env(x,a,d):return np.minimum(1,x/a)*np.exp(-x/d)
intens=np.clip((t-1)/19,0,1)  # build 0->1 until ~20s
# bass pulse 8ths
for k in range(int(D/(beat/2))):
    st=k*beat/2;ci=int(st/bar)%4;i0=int(st*SR);L=int(beat/2*SR);seg=np.arange(min(L,n-i0))/SR
    if i0>=n:break
    f=nf(prog[ci]);w=2*(seg*f%1)-1;w=np.tanh(w*2)*0.6
    out[i0:i0+len(seg)]+=0.22*w*env(seg,.005,.12)
# pad (detuned saws, filtered by smoothing), swells
pad=np.zeros(n)
for ci_bar in range(int(D/bar)+1):
    st=ci_bar*bar;i0=int(st*SR);L=int(bar*SR);seg=np.arange(min(L,max(0,n-i0)))/SR
    if len(seg)==0:break
    for m in chords[ci_bar%4]:
        for det in(-.1,.1):
            f=nf(m+12)*2**(det/12);pad[i0:i0+len(seg)]+=(2*(seg*f%1)-1)*0.03
pad=np.convolve(pad,np.ones(40)/40,'same');out+=pad*(0.5+0.8*intens)
# arp 16ths appears after 6s
for k in range(int(D/(beat/4))):
    st=k*beat/4
    if st<6:continue
    ci=int(st/bar)%4;m=chords[ci][k%3]+24;i0=int(st*SR);seg=np.arange(min(int(beat/4*SR),n-i0))/SR
    if i0>=n:break
    out[i0:i0+len(seg)]+=0.07*np.sin(2*np.pi*nf(m)*seg)*env(seg,.002,.07)*min(1,(st-6)/4)
# kick quarters from 3s, hats 8ths from 9s
for k in range(int(D/beat)):
    st=k*beat
    if st<3 or st>19.3:continue
    i0=int(st*SR);seg=np.arange(min(int(.4*SR),n-i0))/SR
    out[i0:i0+len(seg)]+=0.55*np.sin(2*np.pi*(45+120*np.exp(-seg*25))*seg)*np.exp(-seg*7)
rng=np.random.default_rng(1)
for k in range(int(D/(beat/2))):
    st=k*beat/2+beat/4
    if st<9 or st>19.3:continue
    i0=int(st*SR);seg=np.arange(min(int(.06*SR),n-i0))/SR
    out[i0:i0+len(seg)]+=0.05*rng.uniform(-1,1,len(seg))*np.exp(-seg*60)
# snare roll build 17-19.3
st=17.0;step=beat/2
while st<19.3:
    i0=int(st*SR);seg=np.arange(min(int(.1*SR),n-i0))/SR
    out[i0:i0+len(seg)]+=0.12*(0.3+(st-17)/2.3)*rng.uniform(-1,1,len(seg))*np.exp(-seg*30)
    st+=step;step=max(beat/8,step*0.9)
# riser noise 13->19.3
r=(t>13)&(t<19.4);nz=rng.uniform(-1,1,n);nz=np.convolve(nz,np.ones(6)/6,'same')
out+=r*nz*0.12*np.clip((t-13)/6.3,0,1)**2
# impact at 19.4 + sustained drone to end
i0=int(19.4*SR);seg=np.arange(n-i0)/SR
out[i0:]+=0.8*np.sin(2*np.pi*(38+60*np.exp(-seg*6))*seg)*np.exp(-seg*1.2)
out[i0:]+=0.25*rng.uniform(-1,1,n-i0)*np.exp(-seg*4)
drone=sum(np.sin(2*np.pi*nf(m)*seg) for m in(45,52,57,60))*0.05*np.minimum(1,seg/.3)
out[i0:]+=drone
out*=np.minimum(1,t/.5)*np.minimum(1,(D-t)/2.0)
out=out/np.max(np.abs(out))*0.9
sf.write('music_tense.wav',out,SR)
