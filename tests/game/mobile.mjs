import assert from "node:assert/strict";
import fs from "node:fs/promises";
const { chromium, devices } = await import(
  process.env.PLAYWRIGHT_MODULE || "@playwright/test"
);
const { questions } = await import("../../web/esto-es-legal/questions.js");
const origin = process.env.GAME_TEST_ORIGIN || "http://127.0.0.1:3202";
const root = new URL("../../docs/game/mobile/", import.meta.url).pathname;
await fs.mkdir(root, { recursive: true });
const profiles = [
  ["iPhone SE", devices["iPhone SE"]],
  ["iPhone 13", devices["iPhone 13"]],
  ["iPhone 13 landscape", devices["iPhone 13 landscape"]],
  ["Pixel 7", devices["Pixel 7"]],
  ["iPad Mini", devices["iPad Mini"]],
];
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
  args: ["--no-sandbox"],
});
const report = {
  engine:
    "Chromium with device emulation; not real Safari/iOS or physical hardware",
  profiles: [],
};
try {
  for (const [name, profile] of profiles) {
    const { defaultBrowserType, ...options } = profile;
    const context = await browser.newContext({
      ...options,
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(origin + "/esto-es-legal/");
    await page.getByRole("button", { name: "¡Vamos a jugar!" }).tap();
    await page.locator('#music[aria-pressed="true"]').waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Desactivar música", exact: true })
        .count(),
      1,
    );
    let overflow = false,
      minAnswerHeight = Infinity;
    for (let i = 0; i < 5; i++) {
      const prompt = await page.locator(".question-card h1").textContent();
      const q = questions.find((q) => q.prompt === prompt);
      assert.ok(q);
      overflow ||= await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      const bounds = await page.locator(".answer").first().boundingBox();
      minAnswerHeight = Math.min(minAnswerHeight, bounds.height);
      if (i === 0) {
        await page
          .getByRole("button", { name: "Una pista de Aura", exact: false })
          .tap();
        await page.screenshot({
          path: root + name.replaceAll(" ", "-").toLowerCase() + ".png",
          fullPage: true,
        });
      }
      await page.locator(".answer").nth(q.correct).tap();
      await page
        .getByRole("button", {
          name: i === 4 ? "Ver mi recompensa" : "Siguiente reto",
          exact: false,
        })
        .tap();
    }
    assert.ok((await page.locator(".big-score").textContent()).includes("570"));
    assert.equal(overflow, false);
    assert.ok(minAnswerHeight >= 44);
    assert.deepEqual(errors, []);
    await page
      .getByRole("button", { name: "Otra partida", exact: false })
      .tap();
    assert.ok((await page.locator(".score").textContent()).includes("0"));
    report.profiles.push({
      name,
      viewport: profile.viewport,
      hasTouch: profile.hasTouch,
      fullRound: "passed",
      musicFromPlayGesture: "passed",
      restart: "passed",
      overflow,
      minAnswerHeight,
      errors,
    });
    await context.close();
  }
  const phone = await browser.newContext({
    ...devices["iPhone 13"],
    deviceScaleFactor: 1,
  });
  const p = await phone.newPage();
  await p.goto(origin + "/esto-es-legal/");
  await p.getByRole("button", { name: "Activar música", exact: true }).tap();
  await p.getByRole("button", { name: "Desactivar música", exact: true }).tap();
  await p.getByRole("button", { name: "¡Vamos a jugar!" }).tap();
  assert.equal(await p.locator("#music").getAttribute("aria-pressed"), "false");
  report.explicitMuteRespected = true;
  await p.addInitScript(() => {
    Object.defineProperty(window, "AudioContext", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(window, "webkitAudioContext", {
      value: undefined,
      configurable: true,
    });
  });
  await p.goto(origin + "/esto-es-legal/");
  await p.getByRole("button", { name: "¡Vamos a jugar!" }).tap();
  assert.equal(await p.locator(".answer").count(), 3);
  assert.equal(await p.locator("#music").getAttribute("aria-pressed"), "false");
  report.unsupportedAudioGameContinues = true;
  await phone.close();
  await fs.writeFile(root + "results.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
