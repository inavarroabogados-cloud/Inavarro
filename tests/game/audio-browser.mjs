import assert from "node:assert/strict";
import fs from "node:fs";
const { chromium, webkit, devices } = await import(
  process.env.PLAYWRIGHT_MODULE || "@playwright/test"
);
const { questions } = await import("../../web/esto-es-legal/questions.js");
const origin = process.env.GAME_TEST_ORIGIN || "http://127.0.0.1:3203";
const report = {
  physicalIPhoneTested: false,
  physicalAudibilityVerified: false,
  engines: [],
  unavailable: [],
};
const results = new URL(
  "../../docs/game/audio-browser-results.json",
  import.meta.url,
);
for (const [name, type] of [
  ["chromium", chromium],
  ["webkit", webkit],
]) {
  const executable =
    name === "chromium" ? process.env.CHROMIUM_PATH : type.executablePath();
  if (name === "webkit" && !fs.existsSync(executable)) {
    report.unavailable.push({
      engine: name,
      reason:
        "WebKit binary not installed; browser-download destinations blocked by current network policy. No Safari/physical iPhone test claimed.",
    });
    continue;
  }
  const browser = await type.launch({
    ...(executable ? { executablePath: executable } : {}),
    ...(name === "chromium" ? { args: ["--no-sandbox"] } : {}),
  });
  const item = {
    engine: name,
    flows: [],
    errors: [],
    mediaResponses: [],
    diagnostic: null,
  };
  try {
    const { defaultBrowserType, ...phone } = devices["iPhone 13"];
    const context = await browser.newContext({
      ...phone,
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__mediaCalls = [];
      window.__blockMedia = false;
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        window.__mediaCalls.push({
          file: this.src.split("/").pop(),
          active: navigator.userActivation?.isActive ?? null,
        });
        if (window.__blockMedia)
          return Promise.reject(
            new DOMException("Blocked by test", "NotAllowedError"),
          );
        return play.call(this);
      };
    });
    page.on("pageerror", (e) => item.errors.push(e.message));
    page.on("response", (r) => {
      if (/\/audio\//.test(r.url()))
        item.mediaResponses.push({
          file: r.url().split("/").pop(),
          status: r.status(),
          type: r.headers()["content-type"],
        });
    });
    const go = () => page.goto(origin + "/esto-es-legal/");
    const diag = async () =>
      JSON.parse(await page.locator("#audio-details").textContent());
    await go();
    assert.equal((await page.evaluate(() => window.__mediaCalls)).length, 0);
    await page.locator("#test-sound").tap();
    await page.waitForFunction(
      () =>
        JSON.parse(document.getElementById("audio-details").textContent)
          .testProgressObserved,
    );
    let d = await diag();
    assert.equal(d.test.file, "test.wav");
    assert.ok(d.test.currentTime > 0.05);
    assert.equal(d.test.muted, false);
    assert.ok(d.test.volume > 0);
    assert.ok(d.test.readyState >= 2);
    assert.equal(
      d.audioContextState,
      "not-created (engine does not depend on Web Audio)",
    );
    const calls = await page.evaluate(() => window.__mediaCalls);
    assert.notEqual(calls[0].active, false);
    item.flows.push(
      "First tap test: actual same-origin WAV loaded, decoded and media clock advanced within gesture; physical output unverified",
    );
    await page.locator("#silent-sound").tap();
    assert.ok(
      (await page.locator("#audio-status").textContent()).includes(
        "sin resolver",
      ),
    );
    assert.ok(await page.locator("#audio-guidance").isVisible());
    await page.locator("#test-sound").tap();
    await page.waitForFunction(
      () =>
        JSON.parse(document.getElementById("audio-details").textContent)
          .testProgressObserved,
    );
    await page.locator("#heard-sound").tap();
    assert.equal((await diag()).userHeard, true);
    item.flows.push(
      "Not-heard guidance and repeat test without reload; confirmation is user action, not inference",
    );
    await go();
    await page.getByRole("button", { name: "¡Vamos a jugar!" }).tap();
    await page.waitForFunction(() => {
      const m = document.querySelector("audio[data-channel=music]");
      return m && !m.paused && m.currentTime > 0.1 && m.readyState >= 2;
    });
    d = await diag();
    assert.equal(d.musicEnabled, true);
    assert.equal(d.effectsEnabled, true);
    item.flows.push(
      "First Play tap: actual MP3 progresses, music and effects enabled together, no AudioContext",
    );
    await page
      .getByRole("button", { name: "Una pista de Aura", exact: false })
      .tap();
    await page.waitForFunction(() =>
      [...document.querySelectorAll("audio")].some(
        (m) => m.src.endsWith("hint.wav") && m.currentTime > 0.02,
      ),
    );
    for (let i = 0; i < 5; i++) {
      const prompt = await page.locator(".question-card h1").textContent();
      const q = questions.find((q) => q.prompt === prompt);
      await page
        .locator(".answer")
        .nth(i === 1 ? (q.correct + 1) % 3 : q.correct)
        .tap();
      const file = i === 1 ? "wrong.wav" : "correct.wav";
      await page.waitForFunction(
        (file) =>
          [...document.querySelectorAll("audio")].some(
            (m) => m.src.endsWith(file) && m.currentTime > 0.02,
          ),
        file,
      );
      await page
        .getByRole("button", {
          name: i === 4 ? "Ver mi recompensa" : "Siguiente reto",
          exact: false,
        })
        .tap();
    }
    await page.waitForFunction(() =>
      [...document.querySelectorAll("audio")].some(
        (m) => m.src.endsWith("victory.wav") && m.currentTime > 0.02,
      ),
    );
    item.flows.push(
      "Hint, correct, wrong and victory WAVs all decode and advance during a full round",
    );
    await page
      .getByRole("button", { name: "Desactivar música", exact: true })
      .tap();
    assert.equal(
      await page.locator("audio[data-channel=music]").evaluate((m) => m.paused),
      true,
    );
    assert.equal((await diag()).effectsEnabled, true);
    await page
      .getByRole("button", { name: "Desactivar efectos sonoros", exact: true })
      .tap();
    await page
      .getByRole("button", { name: "Otra partida", exact: false })
      .tap();
    const before = await page.evaluate(() => window.__mediaCalls.length);
    const prompt = await page.locator(".question-card h1").textContent();
    const q = questions.find((q) => q.prompt === prompt);
    await page.locator(".answer").nth(q.correct).tap();
    assert.equal(await page.evaluate(() => window.__mediaCalls.length), before);
    item.flows.push(
      "Music and effects mute independently; disabled effects make no media play call",
    );
    await go();
    await page.evaluate(() => (window.__blockMedia = true));
    await page.locator("#test-sound").tap();
    await page.waitForFunction(
      () =>
        JSON.parse(document.getElementById("audio-details").textContent).errors
          .test?.name === "NotAllowedError",
    );
    assert.equal((await diag()).testProgressObserved, false);
    await page.evaluate(() => (window.__blockMedia = false));
    await page.locator("#test-sound").tap();
    await page.waitForFunction(
      () =>
        JSON.parse(document.getElementById("audio-details").textContent)
          .testProgressObserved,
    );
    item.flows.push(
      "Simulated browser rejection is visible; retry succeeds without reload",
    );
    await page.addInitScript(() => {
      Object.defineProperty(window, "AudioContext", {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(window, "webkitAudioContext", {
        value: undefined,
        configurable: true,
      });
    });
    await go();
    await page.locator("#test-sound").tap();
    await page.waitForFunction(
      () =>
        JSON.parse(document.getElementById("audio-details").textContent)
          .testProgressObserved,
    );
    assert.equal((await diag()).webAudioAvailable, false);
    item.flows.push(
      "Actual WAV playback still works with both Web Audio constructors absent",
    );
    await page.getByRole("button", { name: "¡Vamos a jugar!" }).tap();
    await page.waitForFunction(
      () => !document.querySelector("audio[data-channel=music]").paused,
    );
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        value: true,
        configurable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    assert.equal(
      await page.locator("audio[data-channel=music]").evaluate((m) => m.paused),
      true,
    );
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        value: false,
        configurable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForFunction(
      () => !document.querySelector("audio[data-channel=music]").paused,
    );
    item.flows.push(
      "Simulated background/foreground pauses and recovers actual music media",
    );
    await page.locator("#music-volume").evaluate((n) => {
      n.value = "20";
      n.dispatchEvent(new Event("input", { bubbles: true }));
    });
    assert.equal(
      await page.locator("audio[data-channel=music]").evaluate((m) => m.volume),
      0.2,
    );
    item.flows.push(
      "Music volume updates actual media element; encoded-level fallback has independent unit coverage",
    );
    await page.locator("#audio-diagnostics").evaluate((n) => (n.open = true));
    await page.locator("#test-sound").tap();
    await page.waitForFunction(
      () =>
        JSON.parse(document.getElementById("audio-details").textContent)
          .testProgressObserved,
    );
    item.diagnostic = await diag();
    await page.screenshot({
      path: new URL(
        "../../docs/game/audio-diagnostic-mobile.png",
        import.meta.url,
      ).pathname,
      fullPage: true,
    });
    const gainContext = await browser.newContext({
      ...phone,
      deviceScaleFactor: 1,
    });
    const gainPage = await gainContext.newPage();
    await gainPage.addInitScript(() => {
      Object.defineProperty(HTMLMediaElement.prototype, "volume", {
        get() {
          return 1;
        },
        set() {},
        configurable: true,
      });
    });
    await gainPage.goto(origin + "/esto-es-legal/");
    await gainPage.getByRole("button", { name: "¡Vamos a jugar!" }).tap();
    await gainPage.waitForFunction(() => {
      const m = document.querySelector("audio[data-channel=music]");
      return m.src.endsWith("music-medium.mp3") && m.currentTime > 0.05;
    });
    await gainPage.locator("#music-volume").evaluate((n) => {
      n.value = "20";
      n.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await gainPage.waitForFunction(() => {
      const m = document.querySelector("audio[data-channel=music]");
      return m.src.endsWith("music-low.mp3") && m.currentTime > 0.05;
    });
    await gainContext.close();
    item.flows.push(
      "Simulated ignored native volume: actual medium/low MP3 variants decode and advance",
    );
    assert.deepEqual(item.errors, []);
    await context.close();
  } finally {
    await browser.close();
    report.engines.push(item);
  }
}
fs.writeFileSync(results, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
