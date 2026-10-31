import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const secret = randomBytes(24).toString("hex"),
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "lex-editor-test-"));
const port = 3219,
  origin = `http://127.0.0.1:${port}`;
let proc,
  cookie = "",
  csrf = "";
const post = (route, data, extra = {}) =>
  fetch(origin + route, {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      Cookie: cookie,
      "X-CSRF-Token": csrf,
      ...extra,
    },
    body: JSON.stringify(data),
  });
const draft = {
  title: "Borrador de prueba",
  prompt: "¿Qué dice esta norma imaginaria de prueba?",
  options: ["Respuesta uno", "Respuesta dos", "Respuesta tres"],
  correct: 0,
  level: 1,
  scene: "plaza",
  explanation: "Explicación ficticia de prueba para comprobar el guardado.",
  hint: "Una pista inventada.",
  jurisdiction: "Villa Lex ficticia",
  sources: [],
};
test(
  "private editor: authentication, CSRF, storage, conflict, errors and logout",
  { timeout: 20000 },
  async () => {
    try {
      proc = spawn(process.execPath, ["game-editor/server.mjs"], {
        env: {
          ...process.env,
          GAME_EDITOR_PASSWORD: secret,
          GAME_EDITOR_PORT: String(port),
          GAME_EDITOR_DATA_DIR: dir,
        },
        stdio: ["ignore", "pipe", "pipe"],
      });
      await new Promise((resolve, reject) => {
        proc.stdout.once("data", resolve);
        proc.once("exit", (c) => reject(Error("Editor no iniciado: " + c)));
      });
      assert.equal((await fetch(origin + "/api/questions")).status, 401);
      assert.equal((await fetch(origin + "/data/questions.json")).status, 404);
      assert.equal(
        (await post("/api/login", { password: "incorrecta" })).status,
        401,
      );
      assert.equal(
        (
          await post(
            "/api/login",
            { password: secret },
            { Origin: "https://evil.test" },
          )
        ).status,
        403,
      );
      const login = await post("/api/login", { password: secret });
      assert.equal(login.status, 200);
      const setCookie = login.headers.get("set-cookie");
      assert.ok(setCookie.includes("HttpOnly"));
      assert.ok(setCookie.includes("SameSite=Strict"));
      cookie = setCookie.split(";")[0];
      csrf = (await login.json()).csrf;
      assert.equal(
        (await post("/api/questions", draft, { "X-CSRF-Token": "bad" })).status,
        403,
      );
      assert.equal(
        (await post("/api/questions", { ...draft, prompt: "" })).status,
        422,
      );
      const saved = await post("/api/questions", draft);
      assert.equal(saved.status, 200);
      const item = (await saved.json()).item;
      assert.equal(item.version, 1);
      assert.equal(
        fs.statSync(path.join(dir, "questions.json")).mode & 0o777,
        0o600,
      );
      assert.equal(
        (await post("/api/questions", { ...item, version: 0 })).status,
        409,
      );
      assert.equal(
        (await post("/api/questions", { ...item, id: "not-existing" })).status,
        404,
      );
      const list = await fetch(origin + "/api/questions", {
        headers: { Cookie: cookie },
      });
      assert.equal((await list.json()).items.length, 1);
      assert.equal(
        (await post("/api/questions", { ...draft, title: "x".repeat(33000) }))
          .status,
        413,
      );
      // Simulated damaged storage must fail honestly and preserve it.
      const original = fs.readFileSync(
        path.join(dir, "questions.json"),
        "utf8",
      );
      fs.writeFileSync(path.join(dir, "questions.json"), "invalid");
      assert.equal((await post("/api/questions", draft)).status, 500);
      assert.equal(
        fs.readFileSync(path.join(dir, "questions.json"), "utf8"),
        "invalid",
      );
      fs.writeFileSync(path.join(dir, "questions.json"), original);
      const exported = await fetch(origin + "/api/export", {
        headers: { Cookie: cookie },
      });
      assert.equal((await exported.json()).publicationAllowed, false);
      assert.equal((await post("/api/logout", {})).status, 200);
      assert.equal(
        (
          await fetch(origin + "/api/questions", {
            headers: { Cookie: cookie },
          })
        ).status,
        401,
      );
      for (let i = 0; i < 5; i++)
        assert.equal(
          (await post("/api/login", { password: "incorrecta" })).status,
          401,
        );
      assert.equal(
        (await post("/api/login", { password: "incorrecta" })).status,
        429,
      );
    } finally {
      proc?.kill();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  },
);
