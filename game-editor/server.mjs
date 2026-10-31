/** Private LOCAL editorial workbench. Never copied into public dist. Node >= 20. */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { validateDraft } from "./validation.mjs";
const here = path.dirname(fileURLToPath(import.meta.url));
const password = process.env.GAME_EDITOR_PASSWORD;
if (!password || password.length < 16) {
  console.error(
    "Configura GAME_EDITOR_PASSWORD con una contraseña de 16 caracteres o más en tu entorno local. No la guardes en Git ni en el chat.",
  );
  process.exit(1);
}
const salt = randomBytes(32),
  passwordHash = scryptSync(password, salt, 64);
const sessions = new Map(),
  attempts = new Map();
const dataDir = process.env.GAME_EDITOR_DATA_DIR || path.join(here, "data");
fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
const draftFile = path.join(dataDir, "questions.json");
const port = Number(process.env.GAME_EDITOR_PORT || 3210);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw Error("Puerto inválido");
const origin = `http://127.0.0.1:${port}`;
const headers = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store",
  "X-Frame-Options": "DENY",
};
function send(res, status, value, type = "application/json") {
  res.writeHead(status, {
    ...headers,
    "Content-Type": type + "; charset=utf-8",
  });
  res.end(type === "application/json" ? JSON.stringify(value) : value);
}
function read() {
  if (!fs.existsSync(draftFile)) return [];
  const value = JSON.parse(fs.readFileSync(draftFile, "utf8"));
  if (!Array.isArray(value)) throw Error("Almacén inválido");
  return value;
}
function save(items) {
  const tmp = draftFile + "." + randomBytes(6).toString("hex") + ".tmp";
  try {
    fs.writeFileSync(tmp, JSON.stringify(items, null, 2) + "\n", {
      mode: 0o600,
    });
    fs.renameSync(tmp, draftFile);
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}
async function body(req) {
  if (req.headers["content-type"] !== "application/json")
    throw Object.assign(Error("Se requiere JSON."), { status: 415 });
  let size = 0,
    chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 32768)
      throw Object.assign(Error("Solicitud demasiado grande."), {
        status: 413,
      });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    throw Object.assign(Error("JSON inválido."), { status: 400 });
  }
}
function getSession(req) {
  const match = (req.headers.cookie || "").match(
    /(?:^|;\s*)lex_editor=([a-f0-9]{64})(?:;|$)/,
  );
  const session = match && sessions.get(match[1]);
  if (!session || session.expires < Date.now()) {
    if (match) sessions.delete(match[1]);
    return null;
  }
  return { token: match[1], ...session };
}
const server = http.createServer(async (req, res) => {
  try {
    if (req.headers.host !== `127.0.0.1:${port}`) {
      send(res, 403, {
        error: "Host no autorizado. Usa la dirección local indicada.",
      });
      return;
    }
    const pathname = new URL(req.url, origin).pathname;
    const session = getSession(req);
    if (req.method === "POST") {
      if (req.headers.origin !== origin) {
        send(res, 403, { error: "Origen no autorizado." });
        return;
      }
      if (pathname === "/api/login") {
        const ip = req.socket.remoteAddress,
          now = Date.now();
        let attempt = attempts.get(ip);
        if (!attempt || attempt.until < now) {
          attempt = { count: 0, until: now + 15 * 60e3 };
          attempts.set(ip, attempt);
        }
        if (attempt.count >= 5) {
          send(res, 429, { error: "Demasiados intentos. Espera 15 minutos." });
          return;
        }
        const data = await body(req);
        const guess = typeof data?.password === "string" ? data.password : "";
        if (
          guess.length > 1024 ||
          !timingSafeEqual(scryptSync(guess, salt, 64), passwordHash)
        ) {
          attempt.count++;
          send(res, 401, { error: "Acceso no autorizado." });
          return;
        }
        attempts.delete(ip);
        const token = randomBytes(32).toString("hex"),
          csrf = randomBytes(32).toString("hex");
        const expires = Date.now() + 60 * 60e3;
        for (const [key, s] of sessions)
          if (s.expires < now) sessions.delete(key);
        sessions.set(token, { csrf, expires });
        res.setHeader(
          "Set-Cookie",
          `lex_editor=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600`,
        );
        send(res, 200, { csrf });
        return;
      }
      if (!session) {
        send(res, 401, { error: "Inicia sesión para continuar." });
        return;
      }
      if (req.headers["x-csrf-token"] !== session.csrf) {
        send(res, 403, {
          error: "La sesión de edición no es válida. Vuelve a entrar.",
        });
        return;
      }
      if (pathname === "/api/logout") {
        sessions.delete(session.token);
        res.setHeader(
          "Set-Cookie",
          "lex_editor=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
        );
        send(res, 200, { ok: true });
        return;
      }
      if (pathname === "/api/questions") {
        const input = await body(req),
          validation = validateDraft(input);
        if (Object.keys(validation.errors).length) {
          send(res, 422, {
            error: "Revisa los campos indicados.",
            fields: validation.errors,
          });
          return;
        }
        const list = read();
        const id = typeof input.id === "string" ? input.id : null;
        const index = id ? list.findIndex((q) => q.id === id) : -1;
        if (id && index < 0) {
          send(res, 404, { error: "Borrador no encontrado." });
          return;
        }
        if (index >= 0 && input.version !== list[index].version) {
          send(res, 409, {
            error:
              "Otra edición ha cambiado este borrador. Vuelve a cargarlo antes de guardar.",
          });
          return;
        }
        if (index < 0 && list.length >= 500) {
          send(res, 409, {
            error:
              "Límite local de 500 borradores. Exporta una copia y revisa el almacén.",
          });
          return;
        }
        const item = {
          ...validation.value,
          id: id || randomBytes(12).toString("hex"),
          version: index >= 0 ? list[index].version + 1 : 1,
          updatedAt: new Date().toISOString(),
        };
        if (index >= 0) list[index] = item;
        else list.push(item);
        save(list);
        send(res, 200, { item });
        return;
      }
    }
    if (pathname.startsWith("/api/")) {
      if (!session) {
        send(res, 401, { error: "Inicia sesión para continuar." });
        return;
      }
      if (req.method !== "GET") {
        send(res, 405, { error: "Método no permitido." });
        return;
      }
      if (pathname === "/api/session") {
        send(res, 200, { csrf: session.csrf });
        return;
      }
      if (pathname === "/api/questions") {
        send(res, 200, { items: read() });
        return;
      }
      if (pathname === "/api/export") {
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="preguntas-borrador.json"',
        );
        send(res, 200, {
          type: "editorial-draft",
          publicationAllowed: false,
          exportedAt: new Date().toISOString(),
          items: read(),
        });
        return;
      }
      send(res, 404, { error: "No encontrado." });
      return;
    }
    // Login shell is public on loopback. Editorial files and records always require a session.
    if (
      req.method === "GET" &&
      ["/", "/editor.js", "/editor.css"].includes(pathname)
    ) {
      const file = pathname === "/" ? "index.html" : pathname.slice(1);
      send(
        res,
        200,
        fs.readFileSync(path.join(here, file), "utf8"),
        file.endsWith("html")
          ? "text/html"
          : file.endsWith("css")
            ? "text/css"
            : "text/javascript",
      );
      return;
    }
    send(res, 404, { error: "No encontrado." });
  } catch (error) {
    send(res, error.status || 500, {
      error: error.status
        ? error.message
        : "No se pudo completar la operación. No se ha confirmado el guardado. Revisa el almacén local antes de reintentar.",
    });
  }
});
server.requestTimeout = 10000;
server.headersTimeout = 10000;
server.listen(port, "127.0.0.1", () =>
  console.log(
    `Panel editorial LOCAL: ${origin}. No publicar este servidor ni usar datos personales.`,
  ),
);
