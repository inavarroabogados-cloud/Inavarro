import test from "node:test";
import assert from "node:assert/strict";
import { GameAudio } from "../../web/esto-es-legal/audio.js";
class FakeContext {
  constructor() {
    this.state = "suspended";
    this.currentTime = 10;
    this.oscillators = [];
    this.destination = {};
  }
  async resume() {
    this.state = "running";
  }
  createOscillator() {
    const voice = {
      frequency: { value: 0 },
      connect() {},
      disconnect() {},
      start(at) {
        this.startAt = at;
      },
      stop(at) {
        this.stopAt = at;
      },
      type: "sine",
    };
    this.oscillators.push(voice);
    return voice;
  }
  createGain() {
    return {
      gain: {
        setValueAtTime() {},
        linearRampToValueAtTime() {},
        exponentialRampToValueAtTime() {},
      },
      connect() {},
      disconnect() {},
    };
  }
  close() {
    this.state = "closed";
  }
}
test("audio is opt-in, original effects schedule finite notes, mute stops voices and hidden page is silent", async () => {
  const listeners = {};
  globalThis.document = {
    hidden: false,
    addEventListener: (name, fn) => (listeners[name] = fn),
  };
  globalThis.window = { AudioContext: FakeContext };
  const audio = new GameAudio();
  assert.equal(audio.music, false);
  assert.equal(audio.effects, false);
  assert.equal(audio.context, null);
  audio.effect("correct");
  assert.equal(audio.context, null);
  assert.equal(await audio.setEffects(true), true);
  audio.effect("correct");
  assert.equal(audio.context.oscillators.length, 3);
  assert.ok(audio.context.oscillators.every((v) => v.stopAt > v.startAt));
  assert.equal(await audio.setMusic(true), true);
  assert.ok(audio.timer);
  assert.ok(audio.context.oscillators.length >= 5);
  document.hidden = true;
  listeners.visibilitychange();
  assert.equal(audio.timer, null);
  const count = audio.context.oscillators.length;
  audio.effect("victory");
  assert.equal(audio.context.oscillators.length, count);
  document.hidden = false;
  listeners.visibilitychange();
  assert.ok(audio.timer);
  await audio.setMusic(false);
  assert.equal(audio.timer, null);
  await audio.setEffects(false);
  const muted = audio.context.oscillators.length;
  audio.effect("wrong");
  assert.equal(audio.context.oscillators.length, muted);
  audio.destroy();
  assert.equal(audio.context.state, "closed");
});
test("unsupported audio does not prevent game controls from continuing", async () => {
  globalThis.document = { hidden: false, addEventListener() {} };
  globalThis.window = {};
  const audio = new GameAudio();
  assert.equal(await audio.setMusic(true), false);
  assert.equal(await audio.setEffects(true), false);
  assert.equal(audio.music, false);
});
