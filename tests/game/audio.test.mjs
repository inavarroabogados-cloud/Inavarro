import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { GameAudio } from "../../web/esto-es-legal/audio.js";
class Media extends EventTarget {
  constructor() {
    super();
    this.dataset = {};
    this.paused = true;
    this.ended = false;
    this.muted = false;
    this.volume = 1;
    this.readyState = 0;
    this.networkState = 0;
    this.currentTime = 0;
    this.error = null;
    this.calls = 0;
    this.fail = null;
    this.hang = false;
    this.src = "";
  }
  setAttribute() {}
  removeAttribute() {}
  remove() {}
  load() {
    this.error = null;
  }
  play() {
    this.calls++;
    if (this.hang) return new Promise(() => {});
    if (this.fail)
      return Promise.reject(
        Object.assign(Error("denied"), { name: this.fail }),
      );
    this.paused = false;
    this.readyState = 4;
    this.networkState = 1;
    this.dispatchEvent(new Event("playing"));
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
  }
}
function setup() {
  const doc = new EventTarget();
  doc.hidden = false;
  doc.getElementById = () => null;
  globalThis.document = doc;
  globalThis.window = {};
  Object.defineProperty(globalThis, "navigator", {
    value: {},
    configurable: true,
  });
  const a = new GameAudio({ createMedia: () => new Media(), deadline: 35 });
  return a;
}
test("first gesture starts real music and enables effects with one media play, without Web Audio", async () => {
  const a = setup();
  try {
    assert.equal(a.musicAudio.calls, 0);
    assert.equal(a.music, false);
    const result = a.activateFromGesture();
    assert.equal(a.musicAudio.calls, 1);
    assert.equal(a.fx[0].calls, 0);
    assert.equal(await result, true);
    assert.equal(a.music, true);
    assert.equal(a.effects, true);
    assert.equal(
      a.diagnostics().audioContextState,
      "not-created (engine does not depend on Web Audio)",
    );
    assert.ok(new URL(a.musicAudio.src).pathname.endsWith("music.mp3"));
  } finally {
    a.destroy();
  }
});
test("independent controls: music mute leaves effects alive; effects mute leaves music alive", async () => {
  const a = setup();
  try {
    await a.activateFromGesture();
    await a.effect("correct");
    const effect = a.fx[0];
    await a.setMusic(false);
    assert.equal(effect.paused, false);
    assert.equal(await a.effect("wrong"), true);
    await a.setMusic(true);
    await a.setEffects(false);
    assert.equal(a.musicAudio.paused, false);
    const count = a.fx.reduce((n, m) => n + m.calls, 0);
    assert.equal(await a.effect("victory"), false);
    assert.equal(
      a.fx.reduce((n, m) => n + m.calls, 0),
      count,
    );
  } finally {
    a.destroy();
  }
});
test("background and foreground recover; rejected resume remains retryable from next tap", async () => {
  const a = setup();
  try {
    await a.activateFromGesture();
    const calls = a.musicAudio.calls;
    await a.begin();
    assert.ok(
      a.musicAudio.calls > calls,
      "foreground retries even when paused=false",
    );
    document.hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
    assert.equal(a.musicAudio.paused, true);
    a.musicAudio.fail = "NotAllowedError";
    document.hidden = false;
    document.dispatchEvent(new Event("visibilitychange"));
    await new Promise((r) => setTimeout(r, 1));
    assert.equal(a.errors.music.name, "NotAllowedError");
    a.musicAudio.fail = null;
    assert.equal(
      await a.activateFromGesture({ music: true, effects: true }),
      true,
    );
    assert.equal(a.errors.music, undefined);
  } finally {
    a.destroy();
  }
});
test("sound test calls play synchronously, observes progress and never asserts physical audibility", async () => {
  const a = setup();
  try {
    const attempt = a.testSound();
    assert.equal(a.testAudio.calls, 1);
    a.testAudio.currentTime = 0.6;
    const result = await attempt;
    assert.equal(result.progress, true);
    assert.equal(result.physicalOutputVerified, false);
    assert.equal(a.confirmHeard(true), true);
    assert.equal(a.diagnostics().userHeard, true);
    a.confirmHeard(false);
    assert.equal(a.diagnostics().userHeard, false);
  } finally {
    a.destroy();
  }
});
test("blocked first sound test is retryable without reload; no false success with paused/no data", async () => {
  const a = setup();
  try {
    a.testAudio.fail = "NotAllowedError";
    assert.equal((await a.testSound()).accepted, false);
    assert.equal(a.errors.test.name, "NotAllowedError");
    assert.equal(a.confirmHeard(true), false);
    a.testAudio.fail = null;
    const p = a.testSound();
    a.testAudio.currentTime = 0.6;
    a.testAudio.readyState = 0;
    assert.equal((await p).progress, false);
    assert.equal(a.confirmHeard(true), false);
  } finally {
    a.destroy();
  }
});
test("timeouts, unsupported media and zero volume produce visible diagnostic errors", async () => {
  const a = setup();
  try {
    a.testAudio.hang = true;
    assert.equal((await a.testSound()).accepted, false);
    assert.equal(a.errors.test.name, "TimeoutError");
    a.testAudio.hang = false;
    a.musicAudio.fail = "NotSupportedError";
    assert.equal(await a.setMusic(true), false);
    assert.ok(new URL(a.musicAudio.src).pathname.endsWith("music.wav"));
    a.musicAudio.fail = null;
    assert.equal(await a.setMusic(true), true);
    assert.equal(a.setVolume("effects", 0), true);
    assert.equal((await a.testSound()).progress, false);
    assert.equal(a.errors.test.name, "VolumeZero");
    assert.equal(a.setVolume("music", 2), false);
  } finally {
    a.destroy();
  }
});
test("late play promise cannot turn music back on after explicit mute", async () => {
  const a = setup();
  try {
    let resolve;
    a.musicAudio.play = () =>
      new Promise((r) => {
        resolve = r;
      });
    const playing = a.setMusic(true);
    await a.setMusic(false);
    resolve();
    await playing;
    assert.equal(a.music, false);
    assert.equal(a.musicAudio.paused, true);
  } finally {
    a.destroy();
  }
});
test("original PCM files contain measured nonzero signal and checked hashes; MP3 signature exists", () => {
  const root = "web/esto-es-legal/audio/";
  const m = JSON.parse(fs.readFileSync(root + "manifest.json"));
  for (const name of ["music", "test", "correct", "wrong", "hint", "victory"]) {
    const asset = m.assets[name],
      bytes = fs.readFileSync(root + asset.wav);
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
    assert.ok(asset.rms > 0.01, name);
    let sum = 0;
    for (let offset = 44; offset < bytes.length - 1; offset += 2) {
      const sample = bytes.readInt16LE(offset) / 32767;
      sum += sample * sample;
    }
    assert.ok(
      Math.sqrt(sum / ((bytes.length - 44) / 2)) > 0.01,
      name + " actual PCM signal",
    );
    assert.ok(asset.peak < 1);
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      asset.sha256,
    );
  }
  assert.ok(fs.statSync(root + "music.mp3").size > 10000);
});

test("encoded levels provide gain when iOS ignores the native volume setter", async () => {
  const a = setup();
  try {
    Object.defineProperty(a.musicAudio, "volume", {
      get: () => 1,
      set: () => {},
      configurable: true,
    });
    await a.setMusic(true);
    assert.ok(new URL(a.musicAudio.src).pathname.endsWith("music-medium.mp3"));
    a.setVolume("music", 0.2);
    assert.ok(new URL(a.musicAudio.src).pathname.endsWith("music-low.mp3"));
    a.setVolume("music", 0);
    assert.equal(a.musicAudio.muted, true);
    assert.equal(a.music, true);
  } finally {
    a.destroy();
  }
});
