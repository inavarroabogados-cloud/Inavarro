#!/usr/bin/env python3
"""Original score and cues. Standard-library synthesis, ffmpeg MP3 encoding; no samples."""
import array, hashlib, json, math, random, subprocess, tempfile, wave
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'web/esto-es-legal/audio'; OUT.mkdir(parents=True,exist_ok=True)
RATE=44100

def notes(sequence,step=.14,tail=.16,volume=.32):
    length=len(sequence)*step+tail
    out=[0.0]*int(length*RATE)
    for index,midi in enumerate(sequence):
        hz=440*2**((midi-69)/12); dur=step+tail*.75; start=int(index*step*RATE)
        for n in range(min(int(dur*RATE),len(out)-start)):
            t=n/RATE; env=min(1,t/.012)*math.exp(-t/(dur*.38))
            out[start+n]+=volume*env*(math.sin(2*math.pi*hz*t)+.22*math.sin(4*math.pi*hz*t))
    return out

def music():
    # Original 8-bar hook: five syllables, "¿Es-to-es-le-gal?", 126 BPM.
    beat=60/126; duration=32*beat; out=[0.0]*round(duration*RATE)
    rng=random.Random(1266738)
    def tone(start,dur,midi,amp,kind='pluck'):
        hz=440*2**((midi-69)/12); at=round(start*RATE)
        for n in range(min(round(dur*RATE),len(out)-at)):
            t=n/RATE; attack=min(1,t/.006); release=min(1,(dur-t)/.025)
            phase=2*math.pi*hz*t
            if kind=='bass': v=math.sin(phase)+.18*math.sin(2*phase); env=math.exp(-t*5)
            else: v=math.sin(phase)+.3*math.sin(2*phase)+.10*math.sin(3*phase);env=math.exp(-t*8)
            out[at+n]+=amp*v*attack*release*env
    # Am–F–C–G, with a response in the second four bars.
    roots=[45,41,48,43,45,41,48,43]
    hook=[(0,76),(.5,76),(1,79),(1.75,81),(2.5,76)]
    for bar,root in enumerate(roots):
        base=bar*4*beat
        for off in [0,1.5,2,3.5]:tone(base+off*beat,.28,root,.23,'bass')
        for off in [.5,1.5,2.5,3.5]:
            for note in [root+24,root+31]:tone(base+off*beat,.15,note,.055)
        if bar in [0,2,4,6]:
            for off,note in hook:tone(base+off*beat,.28,note+(12 if bar==6 else 0),.21)
        else:
            for off,note in [(0,74),(.75,72),(1.5,71),(2.5,69),(3.25,71 if bar==7 else 72)]:tone(base+off*beat,.25,note,.18)
        for eighth in range(8):
            at=round((base+eighth*.5*beat)*RATE)
            for n in range(min(round(.045*RATE),len(out)-at)):
                t=n/RATE; out[at+n]+=.035*rng.uniform(-1,1)*math.exp(-t*100)
        for b in range(4):
            at=round((base+b*beat)*RATE)
            for n in range(min(round(.19*RATE),len(out)-at)):
                t=n/RATE
                out[at+n]+=.34*math.sin(2*math.pi*(48*t+65*.025*(1-math.exp(-t/.025))))*math.exp(-t*23)
                if b in [1,3]:out[at+n]+=.09*rng.uniform(-1,1)*math.exp(-t*42)
    # Gentle saturation; short fades keep the loop boundary click-free.
    out=[.7*math.tanh(v*1.4) for v in out]
    for i in range(round(.008*RATE)):
        gain=i/(.008*RATE);out[i]*=gain;out[-1-i]*=gain
    return out

signals={'music':music(),'test':notes([69,76,81],.27,.38,.45),'correct':notes([72,76,79],.12,.16),'wrong':notes([62,58],.18,.19),'hint':notes([76,81],.15,.20),'victory':notes([72,76,79,84,88],.13,.30)}
metadata={}
for name,signal in signals.items():
    peak=max(map(abs,signal),default=0); scale=min(1,.88/peak) if peak else 1
    pcm=array.array('h',(int(max(-1,min(1,v*scale))*32767) for v in signal))
    if __import__('sys').byteorder!='little': pcm.byteswap()
    file=OUT/(name+'.wav')
    with wave.open(str(file),'wb') as w: w.setnchannels(1);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(pcm.tobytes())
    rms=math.sqrt(sum((v*scale)**2 for v in signal)/len(signal))
    metadata[name]={'wav':file.name,'seconds':round(len(signal)/RATE,3),'peak':round(peak*scale,5),'rms':round(rms,5),'sha256':hashlib.sha256(file.read_bytes()).hexdigest()}
    if name=='music':
        mp3=OUT/'music.mp3'
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(file),'-codec:a','libmp3lame','-b:a','64k','-ar','22050','-map_metadata','-1',str(mp3)],check=True)
        metadata[name]['mp3']=mp3.name
        metadata[name]['mp3Sha256']=hashlib.sha256(mp3.read_bytes()).hexdigest()
# iOS may ignore HTMLMediaElement.volume. Pre-encoded levels avoid requiring Web Audio gain.
for name,signal in signals.items():
    for suffix,gain in [('low',.3),('medium',.6)]:
        peak=max(map(abs,signal),default=0);scale=(min(1,.88/peak) if peak else 1)*gain
        pcm=array.array('h',(int(max(-1,min(1,v*scale))*32767) for v in signal))
        if __import__('sys').byteorder!='little':pcm.byteswap()
        file=OUT/f'{name}-{suffix}.wav'
        with wave.open(str(file),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(pcm.tobytes())
        if name=='music':subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(file),'-codec:a','libmp3lame','-b:a','64k','-ar','22050','-map_metadata','-1',str(OUT/f'music-{suffix}.mp3')],check=True)
(OUT/'manifest.json').write_text(json.dumps({'version':2,'origin':'Original procedural composition for ¿ESTO ES LEGAL?; no third-party samples.','sampleRate':RATE,'assets':metadata},ensure_ascii=False,indent=2)+'\n')
print('Audio original generado y medido: música MP3/WAV y cinco señales WAV.')
