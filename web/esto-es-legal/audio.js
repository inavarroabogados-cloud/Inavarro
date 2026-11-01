/** Original procedural melody + synthesized effects. No samples, trackers or autoplay. */
export class GameAudio {
  constructor() {
    this.music = false;
    this.effects = false;
    this.context = null;
    this.timer = null;
    this.step = 0;
    this.voices = new Set();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.pause();
      else if (this.music) this.begin();
    });
  }
  async unlock() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return false;
    try {
      this.context ??= new Audio();
      await this.context.resume();
      return this.context.state === "running";
    } catch {
      return false;
    }
  }
  tone(hz, at, duration = 0.15, volume = 0.035, type = "sine") {
    if (!this.context || document.hidden) return;
    const osc = this.context.createOscillator(),
      gain = this.context.createGain();
    osc.type = type;
    osc.frequency.value = hz;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(gain);
    gain.connect(this.context.destination);
    this.voices.add(osc);
    osc.onended = () => {
      this.voices.delete(osc);
      osc.disconnect();
      gain.disconnect();
    };
    osc.start(at);
    osc.stop(at + duration + 0.02);
  }
  async setMusic(on) {
    if (on && !(await this.unlock())) return false;
    this.music = on;
    on ? this.begin() : this.pause();
    return true;
  }
  async setEffects(on) {
    if (on && !(await this.unlock())) return false;
    this.effects = on;
    return true;
  }
  begin() {
    if (this.timer || !this.context || document.hidden) return;
    const melody = [
      72, 76, 79, 76, 74, 77, 81, 77, 71, 74, 79, 74, 72, 76, 79, 84,
    ];
    const tick = () => {
      if (!this.music || document.hidden) return;
      const t = this.context.currentTime;
      const midi = melody[this.step % melody.length];
      this.tone(440 * 2 ** ((midi - 69) / 12), t, 0.21, 0.065, "triangle");
      if (this.step % 4 === 0)
        this.tone(
          130.81 * [1, 4 / 3, 1.5, 1][Math.floor(this.step / 4) % 4],
          t,
          0.38,
          0.043,
        );
      this.step++;
    };
    tick();
    this.timer = setInterval(tick, 285);
  }
  pause() {
    clearInterval(this.timer);
    this.timer = null;
    for (const voice of this.voices) {
      try {
        voice.stop();
      } catch {}
    }
    this.voices.clear();
  }
  effect(name) {
    if (!this.effects || !this.context || document.hidden) return;
    const sequences = {
      correct: [523.25, 659.25, 783.99],
      wrong: [293.66, 246.94],
      victory: [523.25, 659.25, 783.99, 1046.5],
      hint: [659.25, 880],
    };
    const notes = sequences[name] || [];
    notes.forEach((hz, i) =>
      this.tone(hz, this.context.currentTime + i * 0.105, 0.19, 0.075, "sine"),
    );
  }
  destroy() {
    this.music = false;
    this.pause();
    this.context?.close();
  }
}
