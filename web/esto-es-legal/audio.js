/** File-based media playback. No AudioContext, oscillator scheduler, external audio or telemetry. */
export const AUDIO_ENGINE_VERSION = "media-files-v4";
const ROOT = new URL("./audio/", import.meta.url);
export class GameAudio {
  constructor({
    createMedia = () => document.createElement("audio"),
    deadline = 5000,
  } = {}) {
    this.music = false;
    this.effects = false;
    this.musicVolume = 0.6;
    this.effectsVolume = 0.8;
    this.deadline = deadline;
    this.createMedia = createMedia;
    this.onChange = () => {};
    this.destroyed = false;
    this.events = [];
    this.errors = {};
    this.sequence = new WeakMap();
    this.pending = new Map();
    this.probeProgress = false;
    this.heard = null;
    this.testBusy = false;
    this.mediaSession = "not available";
    this.musicAudio = this.make("music", "music.mp3", true);
    this.testAudio = this.make("test", "test.wav");
    this.fx = [
      this.make("effect-1", "correct.wav"),
      this.make("effect-2", "hint.wav"),
    ];
    this.fxIndex = 0;
    this.visibility = () => {
      if (document.hidden) {
        this.pause();
        this.record("page-hidden");
      } else this.begin();
    };
    document.addEventListener("visibilitychange", this.visibility);
    this.testAudio.addEventListener("ended", () => {
      this.testBusy = false;
      this.begin();
    });
    for (const media of this.fx)
      media.addEventListener("ended", () => {
        if (this.music && this.musicAudio.paused) this.begin();
      });
  }
  make(channel, file, loop = false) {
    const media = this.createMedia();
    media.preload = "none";
    media.loop = loop;
    media.muted = false;
    media.setAttribute("playsinline", "");
    media.setAttribute("webkit-playsinline", "");
    media.src = new URL(file, ROOT).href;
    media.dataset.channel = channel;
    media.dataset.file = file;
    document.getElementById?.("audio-host")?.append(media);
    for (const type of [
      "playing",
      "pause",
      "waiting",
      "stalled",
      "ended",
      "error",
    ])
      media.addEventListener(type, () => {
        if (type === "error")
          this.errors[channel] = this.errorInfo(
            media.error || {
              name: "MediaError",
              message: "No se ha podido cargar el archivo.",
            },
          );
        this.record(`${channel}:${type}`);
      });
    return media;
  }
  record(event) {
    if (this.destroyed) return;
    this.events.push(event);
    if (this.events.length > 16) this.events.shift();
    this.onChange(this.diagnostics());
  }
  playbackSession() {
    // iOS Web Audio may use an ambient route. Real media + playback session requests media routing.
    try {
      if (navigator.audioSession) {
        navigator.audioSession.type = "playback";
        this.mediaSession = navigator.audioSession.type;
      } else this.mediaSession = "unsupported";
    } catch (error) {
      this.mediaSession = `not applied: ${error.name || "Error"}`;
    }
  }
  errorInfo(error) {
    const code = error?.code;
    const name = error?.name || "MediaError";
    return {
      name,
      code: typeof code === "number" ? code : null,
      message:
        name === "NotAllowedError"
          ? "El navegador ha bloqueado la reproducción. Pulsa PROBAR SONIDO para reintentar."
          : name === "TimeoutError"
            ? "El archivo no empezó a reproducirse a tiempo. Revisa la conexión y reintenta."
            : code === 2
              ? "No se pudo descargar el audio. Revisa la conexión."
              : code === 3
                ? "El navegador no pudo decodificar el archivo de audio."
                : code === 4 || name === "NotSupportedError"
                  ? "El navegador no puede abrir este archivo (formato o recurso no disponible). Reintenta para probar la alternativa WAV."
                  : "No se ha podido reproducir el audio. Reintenta con PROBAR SONIDO.",
    };
  }
  play(media, channel) {
    if (this.destroyed || document.hidden) return Promise.resolve(false);
    // Call play() NOW, not after await/fetch. This preserves Safari's original tap activation.
    const request = (this.sequence.get(media) || 0) + 1;
    this.sequence.set(media, request);
    delete this.errors[channel];
    let playback;
    try {
      playback = media.play();
    } catch (error) {
      playback = Promise.reject(error);
    }
    let timeout;
    const limit = new Promise((_, reject) => {
      timeout = setTimeout(
        () =>
          reject(Object.assign(new Error("Timeout"), { name: "TimeoutError" })),
        this.deadline,
      );
    });
    const pending = Promise.race([Promise.resolve(playback), limit])
      .then(() => {
        if (this.destroyed || this.sequence.get(media) !== request)
          return false;
        if (
          (channel === "music" && !this.music) ||
          (channel.startsWith("effect") && !this.effects)
        ) {
          media.pause();
          return false;
        }
        if (media.error) throw media.error;
        this.record(`${channel}:play-accepted`);
        return !media.paused;
      })
      .catch((error) => {
        if (this.sequence.get(media) !== request || this.destroyed)
          return false;
        if (error?.name === "TimeoutError") media.pause();
        this.errors[channel] = this.errorInfo(error);
        if (
          channel === "music" &&
          (error?.name === "NotSupportedError" || media.error?.code === 4) &&
          media.dataset.file.endsWith(".mp3")
        ) {
          media.dataset.file = "music.wav";
          this.applyVolume(media, "music"); // Explicit next tap retries WAV; never hide a blocked fallback.
        }
        this.record(`${channel}:play-failed`);
        return false;
      })
      .finally(() => {
        clearTimeout(timeout);
        if (this.pending.get(media) === pending) this.pending.delete(media);
      });
    this.pending.set(media, pending);
    return pending;
  }
  cancel(media) {
    this.sequence.set(media, (this.sequence.get(media) || 0) + 1);
    media.pause();
  }
  activateFromGesture({ music = true, effects = true } = {}) {
    this.playbackSession();
    this.effects = Boolean(effects);
    this.music = Boolean(music);
    // A single activation path: enabling effects does not compete with music playback/resume.
    const result = this.music ? this.setMusic(true) : this.setMusic(false);
    this.record("gesture-activation");
    return result;
  }
  setMusic(on) {
    this.music = Boolean(on);
    this.applyVolume(this.musicAudio, "music");
    if (!this.music) {
      this.cancel(this.musicAudio);
      this.record("music-disabled");
      return Promise.resolve(true);
    }
    this.playbackSession();
    if (this.musicAudio.error) this.musicAudio.load();
    return this.play(this.musicAudio, "music");
  }
  setEffects(on) {
    this.effects = Boolean(on);
    if (!this.effects) for (const media of this.fx) this.cancel(media);
    this.record(this.effects ? "effects-enabled" : "effects-disabled");
    return Promise.resolve(true);
  }
  applyVolume(media, channel) {
    const volume = channel === "music" ? this.musicVolume : this.effectsVolume;
    try {
      media.volume = volume;
    } catch {}
    const native = Math.abs(media.volume - volume) < 0.01;
    media.muted = volume === 0;
    const base = media.dataset.file;
    const selected =
      !native && volume > 0 && volume <= 0.7
        ? base.replace(
            /\.(mp3|wav)$/,
            (ext) => `${volume <= 0.35 ? "-low" : "-medium"}${ext}`,
          )
        : base;
    media.dataset.volumeMode = native ? "native" : "encoded-levels";
    const next = new URL(selected, ROOT).href;
    const changed = media.src !== next;
    if (changed) media.src = next;
    return changed;
  }
  setVolume(channel, value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > 1) return false;
    if (channel === "music") {
      this.musicVolume = n;
      const changed = this.applyVolume(this.musicAudio, "music");
      if (changed && this.music) this.play(this.musicAudio, "music");
    } else if (channel === "effects") {
      this.effectsVolume = n;
      for (const media of [...this.fx, this.testAudio])
        this.applyVolume(media, "effects");
    } else return false;
    this.record(`${channel}:volume`);
    return true;
  }
  effect(name) {
    if (
      !this.effects ||
      document.hidden ||
      !["correct", "wrong", "hint", "victory"].includes(name)
    )
      return Promise.resolve(false);
    this.playbackSession();
    const media = this.fx[this.fxIndex++ % this.fx.length];
    this.cancel(media);
    media.dataset.file = `${name}.wav`;
    this.applyVolume(media, "effects");
    try {
      media.currentTime = 0;
    } catch {}
    // Effects are invoked directly by answer/hint/next-button taps; no async decode prerequisite.
    return this.play(media, media.dataset.channel);
  }
  begin() {
    if (this.destroyed || document.hidden || !this.music || this.testBusy)
      return Promise.resolve(false);
    if (this.pending.has(this.musicAudio))
      return this.pending.get(this.musicAudio);
    this.record("foreground-retry");
    // Some iOS interruptions leave paused=false while the clock is stopped.
    // Re-request media playback instead of accepting the flag as evidence of output.
    if (!this.musicAudio.paused) this.cancel(this.musicAudio);
    return this.setMusic(true);
  }
  pause() {
    for (const media of [this.musicAudio, this.testAudio, ...this.fx])
      this.cancel(media);
    this.testBusy = false;
  }
  async testSound() {
    this.playbackSession();
    this.heard = null;
    this.probeProgress = false;
    if (this.effectsVolume === 0) {
      this.errors.test = {
        name: "VolumeZero",
        code: null,
        message:
          "El volumen de efectos y prueba está a cero. Súbelo con el control y vuelve a probar.",
      };
      this.record("test:volume-zero");
      return {
        accepted: false,
        progress: false,
        physicalOutputVerified: false,
      };
    }
    this.testBusy = true;
    this.record("test:requested");
    this.cancel(this.musicAudio);
    this.cancel(this.testAudio);
    this.testAudio.dataset.file = "test.wav";
    this.testAudio.src = new URL("test.wav", ROOT).href;
    this.applyVolume(this.testAudio, "effects");
    try {
      this.testAudio.currentTime = 0;
    } catch {}
    const initial = 0;
    const attempt = this.play(this.testAudio, "test"); // before first await, within tap
    const accepted = await attempt;
    if (accepted) {
      await new Promise((resolve) => setTimeout(resolve, 850));
      this.probeProgress =
        this.testAudio.currentTime > initial + 0.05 &&
        this.testAudio.readyState >= 2 &&
        !this.testAudio.error &&
        !this.testAudio.muted &&
        this.testAudio.volume > 0;
    }
    this.testBusy = false;
    if (!accepted) this.begin();
    this.record(
      this.probeProgress ? "test:progress-observed" : "test:not-confirmed",
    );
    return {
      accepted,
      progress: this.probeProgress,
      physicalOutputVerified: false,
    };
  }
  confirmHeard(value) {
    if (value && !this.probeProgress) return false;
    this.heard = Boolean(value);
    this.record(value ? "test:user-heard" : "test:user-silent");
    return true;
  }
  mediaState(media) {
    return {
      file: media.src.split("/").pop()?.split("?")[0],
      paused: media.paused,
      ended: media.ended,
      muted: media.muted,
      volume: media.volume,
      volumeMode: media.dataset.volumeMode || "native",
      readyState: media.readyState,
      networkState: media.networkState,
      currentTime: Math.round((media.currentTime || 0) * 100) / 100,
      error: media.error?.code || null,
    };
  }
  diagnostics() {
    return {
      version: AUDIO_ENGINE_VERSION,
      engine: "HTMLMediaElement · same-origin MP3/WAV",
      audioContextState: "not-created (engine does not depend on Web Audio)",
      webAudioAvailable:
        typeof window.AudioContext === "function" ||
        typeof window.webkitAudioContext === "function",
      audioSession: this.mediaSession,
      browser: navigator.userAgent || "unavailable",
      secureContext: Boolean(window.isSecureContext),
      codecs: {
        mp3: this.musicAudio.canPlayType?.("audio/mpeg") || "unknown",
        wav: this.testAudio.canPlayType?.("audio/wav") || "unknown",
      },
      hidden: document.hidden,
      musicEnabled: this.music,
      effectsEnabled: this.effects,
      music: this.mediaState(this.musicAudio),
      test: this.mediaState(this.testAudio),
      effects: this.fx.map((m) => this.mediaState(m)),
      errors: { ...this.errors },
      testInProgress: this.testBusy,
      requestedVolumes: {
        music: this.musicVolume,
        effects: this.effectsVolume,
      },
      testProgressObserved: this.probeProgress,
      userHeard: this.heard,
      physicalOutput:
        "OS volume, silent switch and Bluetooth/AirPlay route are not exposed reliably by this browser",
      events: [...this.events],
    };
  }
  destroy() {
    this.pause();
    this.destroyed = true;
    document.removeEventListener("visibilitychange", this.visibility);
    for (const media of [this.musicAudio, this.testAudio, ...this.fx]) {
      media.removeAttribute("src");
      media.load?.();
      media.remove?.();
    }
  }
}
