import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
test("isolated preview build excludes all administration, private data and portal tools", () => {
  execFileSync(process.execPath, ["scripts/build-game-preview.mjs"]);
  const root = "preview-dist";
  const files = [];
  function walk(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, item.name);
      item.isDirectory() ? walk(f) : files.push(f);
    }
  }
  walk(root);
  assert.ok(fs.existsSync(root + "/esto-es-legal/game.js"));
  assert.ok(fs.existsSync(root + "/esto-es-legal/svg/don-lex/victoria.svg"));
  assert.ok(
    !files.some((f) =>
      /game-editor|administracion|clientes|\.env|questions\.json|y-ahora-que/.test(
        f,
      ),
    ),
  );
  assert.ok(
    fs.readFileSync(root + "/robots.txt", "utf8").includes("Disallow: /"),
  );
  assert.equal(
    JSON.parse(fs.readFileSync(root + "/preview-version.json")).administration,
    false,
  );
  const home = fs.readFileSync(root + "/esto-es-legal/index.html", "utf8");
  assert.ok(!home.includes('href="/y-ahora-que/"'));
  assert.ok(home.includes("Casos ficticios"));
  assert.ok(home.includes("noindex"));
  assert.ok(!home.includes("https://inavarro-abogados.onrender.com"));
});

test("preview build rejects production service and main branch before writing output", () => {
  for (const overrides of [
    { RENDER_SERVICE_NAME: "inavarro-abogados" },
    { RENDER_EXTERNAL_URL: "https://inavarro-abogados.onrender.com" },
    { RENDER_GIT_BRANCH: "main" },
  ])
    assert.throws(() =>
      execFileSync(process.execPath, ["scripts/build-game-preview.mjs"], {
        env: { ...process.env, ...overrides },
        stdio: "ignore",
      }),
    );
});

test("preview refuses unexpected output files without deleting them", () => {
  const file = "preview-dist/private-test-sentinel.json";
  fs.writeFileSync(file, "fictional sentinel");
  try {
    assert.throws(() =>
      execFileSync(process.execPath, ["scripts/build-game-preview.mjs"], {
        stdio: "ignore",
      }),
    );
    assert.equal(fs.readFileSync(file, "utf8"), "fictional sentinel");
  } finally {
    fs.unlinkSync(file);
  }
});
