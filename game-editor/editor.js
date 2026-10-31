let csrf = "",
  items = [],
  editing = null;
const $ = (id) => document.getElementById(id),
  fields = [
    "title",
    "jurisdiction",
    "prompt",
    "level",
    "scene",
    "explanation",
    "hint",
    "reviewer",
    "reviewDate",
    "reviewNotes",
  ];
const text = (tag, value) => {
  const el = document.createElement(tag);
  el.textContent = value;
  return el;
};
async function api(url, { method = "GET", data } = {}) {
  const res = await fetch(url, {
    method,
    headers:
      method === "POST"
        ? { "Content-Type": "application/json", "X-CSRF-Token": csrf }
        : {},
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  let body;
  try {
    body = await res.json();
  } catch {
    throw Error("Respuesta no válida. No se ha confirmado ninguna operación.");
  }
  if (res.status === 401 && url !== "/api/login") showLogin();
  if (!res.ok) {
    const e = Error(body.error || "No se pudo completar la operación.");
    e.fields = body.fields;
    throw e;
  }
  return body;
}
function status(message) {
  $("status").textContent = message;
}
function showLogin() {
  $("login").hidden = false;
  $("workspace").hidden = true;
  $("logout").hidden = true;
  csrf = "";
  items = [];
  editing = null;
  $("question-form").reset();
  $("draft-list").replaceChildren();
  $("password").value = "";
}
async function workspace() {
  $("login").hidden = true;
  $("workspace").hidden = false;
  $("logout").hidden = false;
  $("password").value = "";
  items = (await api("/api/questions")).items;
  list();
  $("form-title").tabIndex = -1;
  $("form-title").focus();
}
function list() {
  $("draft-list").replaceChildren();
  for (const item of items) {
    const li = text("li", ""),
      b = text(
        "button",
        `${item.title} · ${item.status === "review-recorded" ? "Contraste declarado" : "Borrador"} · v${item.version}`,
      );
    b.type = "button";
    b.addEventListener("click", () => load(item));
    li.append(b);
    $("draft-list").append(li);
  }
}
function clearErrors() {
  $("field-errors").replaceChildren();
  for (const f of document.querySelectorAll("[aria-invalid]")) {
    f.removeAttribute("aria-invalid");
    f.removeAttribute("aria-describedby");
  }
}
function load(item = null) {
  editing = item;
  $("question-form").reset();
  clearErrors();
  $("form-title").textContent = item ? "Editar pregunta" : "Nueva pregunta";
  for (const field of fields) if (item) $(field).value = item[field] ?? "";
  if (item) {
    item.options.forEach((v, i) => ($("option-" + i).value = v));
    document.querySelector(
      `input[name=correct][value="${item.correct}"]`,
    ).checked = true;
    $("vincentReviewed").checked = item.vincentReviewed;
    for (const [kind, prefix] of [
      ["legislation", "law"],
      ["jurisprudence", "case"],
    ]) {
      const source = item.sources.find((s) => s.kind === kind);
      if (source)
        for (const key of ["title", "url"])
          $(prefix + "-" + key).value = source[key];
      if (source) $(prefix + "-ref").value = source.reference;
    }
  }
  status(
    item
      ? "Borrador cargado. Guardar no publica en el juego."
      : "Nuevo borrador.",
  );
  $("title").focus();
}
$("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const b = event.submitter;
  b.disabled = true;
  try {
    const data = await api("/api/login", {
      method: "POST",
      data: { password: $("password").value },
    });
    csrf = data.csrf;
    await workspace();
    status("Sesión local iniciada.");
  } catch (e) {
    status(e.message);
  } finally {
    b.disabled = false;
  }
});
$("logout").addEventListener("click", async () => {
  try {
    await api("/api/logout", { method: "POST", data: {} });
    showLogin();
    status("Sesión cerrada.");
  } catch (e) {
    status(e.message);
  }
});
$("new-question").addEventListener("click", () => load());
$("question-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const b = $("save");
  b.disabled = true;
  clearErrors();
  const data = Object.fromEntries(fields.map((f) => [f, $(f).value]));
  data.level = Number(data.level);
  data.options = [0, 1, 2].map((i) => $("option-" + i).value);
  const checked = document.querySelector("input[name=correct]:checked");
  data.correct = checked ? Number(checked.value) : -1;
  data.vincentReviewed = $("vincentReviewed").checked;
  data.sources = [];
  for (const [kind, prefix] of [
    ["legislation", "law"],
    ["jurisprudence", "case"],
  ])
    if (
      $(prefix + "-url").value ||
      $(prefix + "-title").value ||
      $(prefix + "-ref").value
    )
      data.sources.push({
        kind,
        title: $(prefix + "-title").value,
        url: $(prefix + "-url").value,
        reference: $(prefix + "-ref").value,
      });
  if (editing) {
    data.id = editing.id;
    data.version = editing.version;
  }
  try {
    const { item } = await api("/api/questions", { method: "POST", data });
    editing = item;
    const i = items.findIndex((x) => x.id === item.id);
    if (i >= 0) items[i] = item;
    else items.push(item);
    list();
    $("form-title").textContent = "Editar pregunta";
    status(
      "Borrador guardado en el almacén privado local. No se ha publicado.",
    );
  } catch (e) {
    status(e.message);
    if (e.fields) {
      const map = {
        options: "option-0",
        correct: "option-0",
        sources: "law-url",
      };
      for (const [field, error] of Object.entries(e.fields)) {
        const p = text("p", error);
        p.id = "error-" + field;
        $("field-errors").append(p);
        const target = $(map[field] || field);
        if (target) {
          target.setAttribute("aria-invalid", "true");
          target.setAttribute("aria-describedby", p.id);
        }
      }
      document.querySelector("[aria-invalid]")?.focus();
    }
  } finally {
    b.disabled = false;
  }
});
try {
  csrf = (await api("/api/session")).csrf;
  await workspace();
} catch {
  showLogin();
}
