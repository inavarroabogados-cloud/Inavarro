/** Isolated static demo build. No API, credentials, database, editorial fetch or deployment. */
import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { questions, editorialScope } from "../web/esto-es-legal/questions.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "web/esto-es-legal");
const output = path.join(root, "preview-dist");
const renderUrl = process.env.RENDER_EXTERNAL_URL;
const previewOrigin = renderUrl ? new URL(renderUrl) : null;
if (
  process.env.RENDER_SERVICE_NAME === "inavarro-abogados" ||
  previewOrigin?.hostname === "inavarro-abogados.onrender.com"
)
  throw Error("Esta compilación no se permite en el servicio de producción.");
if (
  process.env.RENDER_GIT_BRANCH &&
  process.env.RENDER_GIT_BRANCH !== "feat/elenco-esto-es-legal"
)
  throw Error("La demo requiere la rama feat/elenco-esto-es-legal.");
if (previewOrigin && previewOrigin.protocol !== "https:")
  throw Error("La URL de revisión Render debe ser HTTPS.");

if (
  questions.length < 5 ||
  questions.some(
    (q) => q.status !== "demo" || q.review.vincentVerified !== false,
  ) ||
  editorialScope.publicationAllowed !== false
)
  throw Error(
    "La vista previa solo admite el banco de demostración identificado.",
  );
fs.mkdirSync(output, { recursive: true });
const generatedNames = new Set([
  "esto-es-legal",
  "index.html",
  "robots.txt",
  "preview-version.json",
]);
if (fs.readdirSync(output).some((name) => !generatedNames.has(name)))
  throw Error(
    "La salida contiene archivos ajenos a la demo; no se permite publicarla.",
  );
const mount = path.join(output, "esto-es-legal");
// Rebuild only our generated mount. Never remove repository or private editor directories.
if (fs.existsSync(mount)) fs.rmSync(mount, { recursive: true, force: true });
const copy = (file) => {
  const from = path.join(source, file),
    to = path.join(mount, file);
  const real = fs.realpathSync(from);
  if (
    !real.startsWith(source + path.sep) ||
    fs.lstatSync(from).isSymbolicLink()
  )
    throw Error("Recurso fuera del directorio público");
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
};
for (const file of [
  "index.html",
  "game.js",
  "game-core.js",
  "questions.js",
  "audio.js",
  "game.css",
  "mascot.js",
  "mascot.css",
  "manifest.json",
  "characters-sprite.svg",
  "gallery.js",
  "gallery.css",
  "personajes/index.html",
  "docs/guia-personajes.md",
  "docs/integracion.md",
])
  copy(file);
const manifest = JSON.parse(
  fs.readFileSync(path.join(source, "manifest.json"), "utf8"),
);
for (const character of manifest.characters) {
  for (const file of Object.values(character.assets)) copy(file);
  for (const format of ["cuadrado", "historia", "horizontal"])
    for (const ext of ["svg", "png"])
      copy(`exports/${character.id}-${format}.${ext}`);
}
for (const file of fs.readdirSync(path.join(source, "audio"))) {
  if (!/^[a-z-]+\.(mp3|wav|json)$/.test(file))
    throw Error("Archivo de audio inesperado");
  copy(`audio/${file}`);
}
const gameHtml = path.join(mount, "index.html");
let html = fs.readFileSync(gameHtml, "utf8");
html = html
  .replace('href="/" class="brand"', 'href="/esto-es-legal/" class="brand"')
  .replace('href="/y-ahora-que/"', 'href="/esto-es-legal/"')
  .replace("Preparar una consulta →", "Volver al juego →");
html = html.replace(
  /<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/,
  previewOrigin
    ? `<meta property="og:image" content="${previewOrigin.origin}/esto-es-legal/exports/don-lex-horizontal.png" />`
    : "",
);
fs.writeFileSync(gameHtml, html);
fs.writeFileSync(
  path.join(output, "index.html"),
  '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=/esto-es-legal/"><title>Demostración · ¿Esto es legal?</title></head><body><a href="/esto-es-legal/">Abrir el juego de demostración</a></body></html>',
);
fs.writeFileSync(
  path.join(output, "robots.txt"),
  "User-agent: *\nDisallow: /\n",
);
const commit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).trim();
fs.writeFileSync(
  path.join(output, "preview-version.json"),
  JSON.stringify({
    type: "game-demo-only",
    commit,
    administration: false,
    audioEngineVersion: "media-files-v4",
    files: Object.fromEntries(
      [
        "esto-es-legal/index.html",
        "esto-es-legal/game.js",
        "esto-es-legal/audio.js",
        ...fs
          .readdirSync(path.join(mount, "audio"))
          .map((file) => "esto-es-legal/audio/" + file),
      ].map((file) => [
        file,
        createHash("sha256")
          .update(fs.readFileSync(path.join(output, file)))
          .digest("hex"),
      ]),
    ),
    editorialBackend: false,
  }) + "\n",
);
console.log(
  "Demo aislada preparada en preview-dist: solo juego, personajes y recursos públicos. No se ha desplegado.",
);
