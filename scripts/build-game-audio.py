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
    melody=[72,76,79,76,74,77,81,77,71,74,79,74,72,76,79,84,76,79,84,79,77,81,84,81,74,79,83,79,76,79,72,67]
    step=.285; out=notes(melody,step,tail=0,volume=.25); rng=random.Random(48321)
    for beat in range(16):
        start=int(beat*step*2*RATE); bass=130.8128*[1,4/3,1.5,1][(beat//2)%4]
        for n in range(min(int(.42*RATE),len(out)-start)):
            t=n/RATE; out[start+n]+=.16*math.sin(2*math.pi*bass*t)*min(1,t/.012)*math.exp(-t*10)
        for n in range(min(int(.035*RATE),len(out)-start)):
            t=n/RATE; out[start+n]+=.035*rng.uniform(-1,1)*math.exp(-t*90)
    # Seam-safe ends; the score itself is already composed to return to the tonic.
    for i in range(int(.012*RATE)):
        out[i]*=i/(.012*RATE); out[-1-i]*=i/(.012*RATE)
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
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(file),'-codec:a','libmp3lame','-b:a','96k','-map_metadata','-1',str(mp3)],check=True)
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
        if name=='music':subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(file),'-codec:a','libmp3lame','-b:a','96k','-map_metadata','-1',str(OUT/f'music-{suffix}.mp3')],check=True)
(OUT/'manifest.json').write_text(json.dumps({'version':2,'origin':'Original procedural composition for ¿ESTO ES LEGAL?; no third-party samples.','sampleRate':RATE,'assets':metadata},ensure_ascii=False,indent=2)+'\n')
print('Audio original generado y medido: música MP3/WAV y cinco señales WAV.')
