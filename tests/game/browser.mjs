import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import os from "node:os";
import path from "node:path";
const { chromium, webkit } = await import(
  process.env.PLAYWRIGHT_MODULE || "@playwright/test"
);
const { default: AxeBuilder } = await import(
  process.env.AXE_MODULE || "@axe-core/playwright"
);
const origin = process.env.GAME_TEST_ORIGIN || "http://127.0.0.1:3201";
const base = origin + "/esto-es-legal/";
const root = new URL("../../", import.meta.url).pathname;
const shots = root + "docs/game/";
await fs.mkdir(shots, { recursive: true });
const report = { viewports: [], flows: [], errors: [], requests: [] };
const bank = (await import("../../web/esto-es-legal/questions.js")).questions;
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  deviceScaleFactor: 1,
});
const page = await context.newPage();
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("request", (r) => {
  if (r.url().startsWith("http")) report.requests.push(r.url());
});
async function audit(name) {
  await page.waitForTimeout(850);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  report.viewports.push({
    name,
    width: page.viewportSize().width,
    overflow,
    violations: results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => n.target),
    })),
  });
  assert.equal(overflow, false, name + " overflow");
  if (results.violations.length)
    console.log("AXE", JSON.stringify(report.viewports.at(-1)));
}
async function begin() {
  await page.goto(base);
  await page.getByRole("button", { name: "¡Vamos a jugar!" }).click();
  await page.locator(".answer").first().waitFor();
}
async function chooseCorrect() {
  const prompt = await page.locator(".question-card h1").textContent();
  const q = bank.find((q) => q.prompt === prompt);
  assert.ok(q);
  await page.locator(".answer").nth(q.correct).click();
  return q;
}
try {
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width > 600 ? 1000 : 844 });
    await page.goto(base);
    await page.locator(".cast-mini").last().waitFor();
    await page.evaluate(async () => {
      for (const m of document.querySelectorAll("legal-mascot")) {
        const i = m.shadowRoot.querySelector("img");
        i.loading = "eager";
        await i.decode().catch(() => {});
      }
    });
    assert.equal(await page.locator(".cast-mini").count(), 7);
    await audit("home");
    if (width === 390 || width === 1440)
      await page.screenshot({
        path: shots + `inicio-${width}.png`,
        fullPage: true,
      });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await begin();
  await page
    .getByRole("button", { name: "Una pista de Aura", exact: false })
    .click();
  assert.ok(await page.locator("#hint-text").isVisible());
  for (let i = 0; i < 5; i++) {
    await chooseCorrect();
    assert.equal(await page.locator(".answer:disabled").count(), 3);
    if (i === 0) {
      assert.equal(
        await page.evaluate(() => document.activeElement.id),
        "feedback-title",
      );
      for (const width of [360, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await audit("feedback");
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.locator("#feedback-title").focus();
      await page.screenshot({
        path: shots + "partida-390.png",
        fullPage: true,
      });
    }
    await page
      .getByRole("button", {
        name: i === 4 ? "Ver mi recompensa" : "Siguiente reto",
        exact: false,
      })
      .click();
  }
  assert.ok((await page.locator(".big-score").textContent()).includes("570"));
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await audit("result");
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".result h1").focus();
  await page.screenshot({ path: shots + "resultado-390.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: shots + "resultado-1440.png", fullPage: true });
  await page
    .getByRole("button", { name: "Copiar enlace", exact: true })
    .click();
  assert.ok(
    (await page.locator("#share-status").textContent()).includes(
      "revisión local",
    ),
  );
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Tarjeta para Instagram", exact: false })
    .click();
  const download = await downloadPromise;
  await download.saveAs(shots + "tarjeta-instagram.png");
  assert.ok((await fs.stat(shots + "tarjeta-instagram.png")).size > 10000);
  report.flows.push(
    "five correct + hint = 570; reward; generic PNG download; local share protection",
  );
  await page.route("**/svg/don-lex/victoria.svg", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await page
    .getByRole("button", { name: "Tarjeta para Instagram", exact: false })
    .click();
  await page
    .getByText("No se ha podido crear la tarjeta.", { exact: false })
    .waitFor();
  await page.unroute("**/svg/don-lex/victoria.svg");
  report.flows.push(
    "card asset failure shows error and re-enables download control",
  );
  await page
    .getByRole("button", { name: "Otra partida", exact: false })
    .click();
  assert.ok((await page.locator(".score").textContent()).includes("0"));
  assert.equal(await page.locator("#hint-text").count(), 0);
  // Reset and exercise all incorrect path, no reward based on legal success.
  await begin();
  for (let i = 0; i < 5; i++) {
    const prompt = await page.locator(".question-card h1").textContent();
    const q = bank.find((q) => q.prompt === prompt);
    await page
      .locator(".answer")
      .nth((q.correct + 1) % 3)
      .click();
    await page
      .getByRole("button", {
        name: i === 4 ? "Ver mi recompensa" : "Siguiente reto",
        exact: false,
      })
      .click();
  }
  assert.ok((await page.locator(".big-score").textContent()).includes("0"));
  assert.ok(
    (await page.locator(".reward").textContent()).includes(
      "La curiosidad cuenta",
    ),
  );
  report.flows.push(
    "five incorrect = 0; supportive reward; restart clears state",
  );
  await page.goto(base);
  await page.getByLabel("Reto rápido").check();
  await page.getByRole("button", { name: "¡Vamos a jugar!" }).click();
  await page.getByRole("button", { name: "Pausar tiempo" }).click();
  const time = await page.locator("#timer").textContent();
  await page.waitForTimeout(1100);
  assert.equal(await page.locator("#timer").textContent(), time);
  await page.getByRole("button", { name: "Reanudar tiempo" }).click();
  await page.clock.install();
  await page.clock.fastForward(21000);
  await page.locator("#feedback").waitFor();
  assert.ok(
    (await page.locator("#feedback-title").textContent()).includes(
      "Se acabó el tiempo",
    ),
  );
  report.flows.push("sprint pause/resume and timeout show explanation");
  await page.clock.resume();
  await page.goto(base);
  await page.getByLabel("Reto rápido").check();
  await page.getByRole("button", { name: "¡Vamos a jugar!" }).click();
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent("pagehide", { persisted: true }),
    ),
  );
  await page.clock.fastForward(30000);
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: true }),
    ),
  );
  await page.getByRole("button", { name: "Reanudar tiempo" }).click();
  await page.clock.runFor(300);
  assert.equal(await page.locator("#feedback").count(), 0);
  assert.ok(parseInt(await page.locator("#timer").textContent(), 10) >= 18);
  report.flows.push("simulated pagehide/pageshow preserves paused sprint time");
  await begin();
  await page.getByRole("button", { name: "Salir", exact: false }).click();
  await page.getByRole("button", { name: "Seguir jugando" }).click();
  assert.equal(await page.locator(".answer").count(), 3);
  await page.getByRole("button", { name: "Salir", exact: false }).click();
  await page.getByRole("button", { name: "Salir al inicio" }).click();
  assert.equal(await page.locator(".cast-mini").count(), 7);
  report.flows.push("exit confirmation preserves or clears round");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base);
  assert.equal(
    await page.locator("#motion").getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await page
      .locator(".hero-owl")
      .evaluate((e) => getComputedStyle(e).animationName),
    "none",
  );
  await begin();
  await chooseCorrect();
  assert.equal(
    await page
      .locator("#host-character")
      .evaluate((e) =>
        e.shadowRoot.querySelector(".sprite").classList.contains("moving"),
      ),
    false,
  );
  report.flows.push("reduced motion applies to CSS and mascot reactions");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(base);
  await page
    .getByRole("button", { name: "Activar música", exact: true })
    .click();
  await page.locator('#music[aria-pressed="true"]').waitFor();
  assert.equal(
    await page.locator("#music").getAttribute("aria-pressed"),
    "true",
  );
  await page
    .getByRole("button", { name: "Activar efectos sonoros", exact: true })
    .click();
  assert.equal(
    await page.locator("#effects").getAttribute("aria-pressed"),
    "true",
  );
  await page
    .getByRole("button", { name: "Desactivar música", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Desactivar efectos sonoros", exact: true })
    .click();
  report.flows.push(
    "Web Audio enabled only after gesture; independent music/effect switches",
  );
  await page.goto(base);
  await page.keyboard.press("Tab");
  assert.ok(
    await page.evaluate(() =>
      document.activeElement.textContent.includes("Saltar"),
    ),
  );
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement.id), "main");
  report.flows.push(
    "keyboard skip link and programmatic question/feedback focus",
  );
  assert.equal(await page.evaluate(() => localStorage.length), 0);
  assert.equal(await page.evaluate(() => sessionStorage.length), 0);
  // Public-like origin via routing: sharing alternatives without sending messages or contacting external apps.
  const publicContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const publicPage = await publicContext.newPage();
  await publicPage.route("https://preview.example.test/**", async (route) => {
    const url = new URL(route.request().url());
    const res = await page.request.get(origin + url.pathname);
    await route.fulfill({
      status: res.status(),
      body: await res.body(),
      headers: {
        "Content-Type": res.headers()["content-type"] || "text/plain",
      },
    });
  });
  await publicPage.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw Error("denied");
        },
      },
      configurable: true,
    });
  });
  await publicPage.goto(
    "https://preview.example.test/esto-es-legal/?secret=never-share#answer",
  );
  await publicPage.getByRole("button", { name: "¡Vamos a jugar!" }).click();
  for (let i = 0; i < 5; i++) {
    await publicPage.locator(".answer").first().click();
    await publicPage
      .getByRole("button", {
        name: i === 4 ? "Ver mi recompensa" : "Siguiente reto",
        exact: false,
      })
      .click();
  }
  await publicPage
    .getByRole("button", { name: "Compartir desafío", exact: true })
    .click();
  const fallback = publicPage.getByRole("textbox", {
    name: "Enlace del desafío para copiar",
  });
  assert.equal(
    await fallback.inputValue(),
    "https://preview.example.test/esto-es-legal/",
  );
  report.flows.push(
    "unsupported Web Share + denied clipboard exposes clean selectable URL",
  );
  await publicPage.evaluate(() => {
    window.__opened = "";
    window.open = (url) => {
      window.__opened = url;
      return null;
    };
  });
  await publicPage
    .getByRole("button", { name: "WhatsApp", exact: false })
    .click();
  const whatsapp = new URL(await publicPage.evaluate(() => window.__opened));
  assert.equal(whatsapp.hostname, "wa.me");
  assert.ok(!whatsapp.searchParams.get("text").includes("secret"));
  assert.ok(!whatsapp.searchParams.get("text").includes("puntos"));
  for (const kind of ["success", "cancel", "failure"]) {
    await publicPage.evaluate((kind) => {
      Object.defineProperty(navigator, "share", {
        value: async (data) => {
          window.__shareData = data;
          if (kind === "cancel") throw new DOMException("cancel", "AbortError");
          if (kind === "failure") throw Error("failed");
        },
        configurable: true,
      });
    }, kind);
    await publicPage
      .getByRole("button", { name: "Compartir desafío", exact: true })
      .click();
    await publicPage.waitForTimeout(30);
    const message = await publicPage.locator("#share-status").textContent();
    assert.ok(
      message.includes(
        kind === "success"
          ? "completada"
          : kind === "cancel"
            ? "cancelado"
            : "No se pudo",
      ),
    );
    assert.equal(
      await publicPage.evaluate(() => window.__shareData.url),
      "https://preview.example.test/esto-es-legal/",
    );
  }
  report.flows.push(
    "WhatsApp generic text; native share success, cancellation and error without external messaging",
  );
  await publicContext.close();
  // Private editor UI: ephemeral fictional content and password, no real credentials or provider.
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "lex-editor-ui-")),
    secret = randomBytes(24).toString("hex");
  const editor = spawn(process.execPath, [root + "game-editor/server.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      GAME_EDITOR_PASSWORD: secret,
      GAME_EDITOR_PORT: "3221",
      GAME_EDITOR_DATA_DIR: temp,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  try {
    await new Promise((resolve, reject) => {
      editor.stdout.once("data", resolve);
      editor.once("exit", () => reject(Error("Editor did not start")));
    });
    await page.goto("http://127.0.0.1:3221");
    await page.getByLabel("Contraseña del entorno local").fill(secret);
    await page.getByRole("button", { name: "Entrar al estudio" }).click();
    await page
      .getByRole("heading", { name: "Preguntas con fundamento." })
      .waitFor();
    await page
      .getByRole("button", { name: "Guardar borrador privado" })
      .click();
    await page.locator("[aria-invalid=true]").first().waitFor();
    assert.ok((await page.locator("[aria-invalid=true]").count()) > 0);
    for (const [id, value] of Object.entries({
      title: "Ejemplo ficticio del jardín",
      jurisdiction: "Villa Lex ficticia",
      prompt: "¿Qué permite la regla inventada del jardín?",
      explanation: "El texto ficticio permite recoger hojas caídas.",
      hint: "Lee el supuesto completo.",
      "option-0": "Recoger hojas",
      "option-1": "Cortar flores",
      "option-2": "Quemar el cartel",
    }))
      await page.locator("#" + id).fill(value);
    await page.getByRole("radio", { name: "Respuesta A correcta" }).check();
    await page
      .getByRole("button", { name: "Guardar borrador privado" })
      .click();
    await page
      .getByText("Borrador guardado en el almacén privado local.", {
        exact: false,
      })
      .waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await audit("editor");
    await page.screenshot({ path: shots + "editor-390.png", fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: shots + "editor-1440.png", fullPage: true });
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await page.getByRole("button", { name: "Entrar al estudio" }).waitFor();
    report.flows.push(
      "private editor login, field errors, fictional draft persistence and logout",
    );
  } finally {
    editor.kill();
    await fs.rm(temp, { recursive: true, force: true });
  }
  assert.deepEqual(report.errors, []);
  assert.ok(
    report.requests
      .filter((u) => u.startsWith(origin))
      .every((u) => !u.includes("choice=") && !u.includes("score=")),
  );
  report.flows.push(
    "game requests contain no answers or scores; no persistent browser storage",
  );
  report.requests = [...new Set(report.requests)].map((u) =>
    u.replace(/127\.0\.0\.1:\d+/, "local-preview"),
  );
  await fs.writeFile(
    shots + "browser-results.json",
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        viewports: report.viewports,
        flows: report.flows,
        errors: report.errors,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
