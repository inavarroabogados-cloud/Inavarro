import "./mascot.js";
import { questions } from "./questions.js";
import {
  startRound,
  answerRound,
  useHint,
  nextQuestion,
  reward,
  publicChallengeUrl,
  SHARE_TEXT,
  isLocalReviewHost,
} from "./game-core.js";
import { GameAudio } from "./audio.js?v=4";
const main = document.querySelector("main"),
  live = document.querySelector("#announcement"),
  audio = new GameAudio();
const cast = [
  ["don-lex", "Don Lex", "Presenta"],
  ["trampin", "Trampín", "Te pone a prueba"],
  ["lexi", "Lexi", "Explica"],
  ["brinco", "Brinco", "Activa el bonus"],
  ["lumina", "Lúmina", "Celebra"],
  ["aura", "Aura", "Te da pistas"],
  ["elion", "Elion", "Busca el matiz"],
];
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let manualMotion = false,
  state = null,
  timer = null,
  started = 0,
  remaining = 20,
  pausedAt = null,
  shareUrl = null,
  musicPreferenceSet = false,
  effectsPreferenceSet = false;
const el = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};
const button = (text, fn, cls = "secondary") => {
  const b = el("button", text, cls);
  b.type = "button";
  b.addEventListener("click", fn);
  return b;
};
function mascot(id, expression = "alegria", size = 240, decorative = true) {
  const m = document.createElement("legal-mascot");
  m.setAttribute("character", id);
  m.setAttribute("expression", expression);
  m.setAttribute("size", size);
  if (decorative) m.setAttribute("decorative", "");
  return m;
}
function announce(text) {
  live.textContent = text;
}
function focusHeading() {
  requestAnimationFrame(() => {
    const h = main.querySelector("h1");
    if (h) {
      h.tabIndex = -1;
      h.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
}
function clearTimer() {
  clearInterval(timer);
  timer = null;
}
function motionDisabled() {
  return manualMotion || reduced.matches;
}
function react(m, expression) {
  m.setAttribute("expression", expression);
  if (!motionDisabled()) m.play(expression);
}
function syncMotion() {
  document.documentElement.classList.toggle("motion-reduced", motionDisabled());
  document
    .querySelector("#motion")
    .setAttribute("aria-pressed", String(motionDisabled()));
  if (motionDisabled())
    for (const m of document.querySelectorAll("legal-mascot"))
      m.shadowRoot?.querySelector(".sprite")?.classList.remove("moving");
}
reduced.addEventListener("change", syncMotion);
document.querySelector("#motion").addEventListener("click", () => {
  manualMotion = !manualMotion;
  syncMotion();
  announce(motionDisabled() ? "Movimiento reducido." : "Movimiento activado.");
});
syncMotion();
for (const [id, setter, name] of [
  ["music", (on) => audio.setMusic(on), "música"],
  ["effects", (on) => audio.setEffects(on), "efectos sonoros"],
]) {
  const b = document.getElementById(id);
  b.addEventListener("click", async () => {
    const on = id === "music" ? !audio.music : !audio.effects;
    if (id === "music") musicPreferenceSet = true;
    if (id === "effects") effectsPreferenceSet = true;
    b.disabled = true;
    try {
      const ok = await setter(on);
      if (!ok) {
        announce(
          "El navegador no ha permitido activar el audio. Puedes jugar sin sonido.",
        );
        return;
      }
      b.setAttribute("aria-pressed", String(on));
      b.setAttribute("aria-label", `${on ? "Desactivar" : "Activar"} ${name}`);
      announce(`${name}: ${on ? "activado" : "desactivado"}.`);
    } catch {
      announce("Audio no disponible. La partida puede continuar.");
    } finally {
      b.disabled = false;
    }
  });
}
function startMusicFromPlayGesture() {
  // One synchronous media activation, not competing asynchronous AudioContext.resume calls.
  audio.activateFromGesture({
    music: musicPreferenceSet ? audio.music : true,
    effects: effectsPreferenceSet ? audio.effects : true,
  });
}
function syncAudioUI() {
  for (const [id, on, label] of [
    ["music", audio.music, "música"],
    ["effects", audio.effects, "efectos sonoros"],
  ]) {
    const control = document.getElementById(id);
    control.setAttribute("aria-pressed", String(on));
    control.setAttribute(
      "aria-label",
      `${on ? "Desactivar" : "Activar"} ${label}`,
    );
  }
  const data = audio.diagnostics();
  document.getElementById("audio-details").textContent = JSON.stringify(
    data,
    null,
    2,
  );
  const errors = Object.values(data.errors);
  const status = document.getElementById("audio-status");
  if (data.userHeard === false)
    status.textContent =
      "No has oído la prueba. El problema sigue sin resolver en este dispositivo. Revisa la salida y reintenta.";
  else if (data.errors.test) status.textContent = data.errors.test.message;
  else if (data.testInProgress)
    status.textContent =
      "Preparando la señal de prueba. Espera a que termine y confirma si la oyes.";
  else if (data.userHeard === true)
    status.textContent =
      "Has confirmado que oyes la señal de prueba en este dispositivo.";
  else if (data.testProgressObserved)
    status.textContent =
      "El archivo de prueba avanzó y tiene datos reproducibles. Confirma si has oído las tres notas; no podemos verificar el altavoz.";
  else if (errors.length) status.textContent = errors.at(-1).message;
  else if (
    data.musicEnabled &&
    !data.music.paused &&
    data.music.readyState >= 2
  )
    status.textContent =
      "El navegador está reproduciendo el archivo de música. Si no lo oyes, pulsa Probar sonido.";
  else
    status.textContent =
      "Audio preparado. Pulsa Probar sonido o Jugar para iniciar la reproducción.";
}
audio.onChange = syncAudioUI;
document
  .getElementById("audio-diagnostics")
  .addEventListener("toggle", syncAudioUI);
for (const channel of ["music", "effects"])
  document
    .getElementById(`${channel}-volume`)
    .addEventListener("input", (event) =>
      audio.setVolume(channel, Number(event.target.value) / 100),
    );
document.getElementById("test-sound").addEventListener("click", async () => {
  const control = document.getElementById("test-sound");
  control.disabled = true;
  document.getElementById("hearing-confirmation").hidden = false;
  document.getElementById("heard-sound").disabled = true;
  try {
    const result = await audio.testSound();
    document.getElementById("heard-sound").disabled = !result.progress;
    syncAudioUI();
  } catch {
    document.getElementById("audio-status").textContent =
      "No se pudo completar la prueba. Puedes reintentarlo sin recargar.";
  } finally {
    control.disabled = false;
  }
});
document
  .getElementById("heard-sound")
  .addEventListener("click", () => audio.confirmHeard(true));
document.getElementById("silent-sound").addEventListener("click", () => {
  audio.confirmHeard(false);
  document.getElementById("audio-guidance").hidden = false;
});
document
  .getElementById("copy-audio-diagnostics")
  .addEventListener("click", async () => {
    const text = document.getElementById("audio-details").textContent;
    try {
      await navigator.clipboard.writeText(text);
      document.getElementById("diagnostic-copy-status").textContent =
        "Diagnóstico copiado. No incluye respuestas ni datos del caso.";
    } catch {
      const range = document.createRange();
      range.selectNodeContents(document.getElementById("audio-details"));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      document.getElementById("diagnostic-copy-status").textContent =
        "Selecciona y copia el diagnóstico del panel.";
    }
  });
syncAudioUI();
function home(focus = false) {
  clearTimer();
  state = null;
  main.replaceChildren();
  const section = el("section", undefined, "home");
  section.innerHTML =
    '<div class="home-intro"><div class="intro-copy"><p class="eyebrow">CINCO RETOS. SIETE CÓMPLICES. UN MATIZ.</p><h1>¿ESTO ES<br><em>LEGAL?</em></h1><p class="subtitle">¿Un contrato por WhatsApp vale? ¿La fianza paga el último mes?<br>Pon a prueba tu criterio con cinco casos de la vida cotidiana.</p><fieldset class="game-mode"><legend>Elige cómo jugar</legend><label><input type="radio" name="mode" value="relaxed" checked> A tu ritmo</label><label><input type="radio" name="mode" value="sprint"> Reto rápido · 20 s</label></fieldset><div id="start-slot"></div><p class="fine">Sin registro · Sin datos personales · Cinco preguntas</p><details class="scoring-guide"><summary>¿Cómo se puntúa?</summary><p>100 por acierto, o 80 con pista. La racha suma hasta 30 extra. En reto rápido, Brinco añade 20 si aciertas antes de 15 segundos. Un error no resta puntos.</p></details><span class="sound-notice">Música y efectos se habilitan al pulsar Jugar. Puedes controlarlos arriba y comprobar la salida con Probar sonido.</span></div><div class="hero-world" aria-label="Don Lex, Trampín y Lexi presentan cinco casos jurídicos"><div class="world-floor"></div><span class="sky-star one" aria-hidden="true">✦</span><span class="sky-star two" aria-hidden="true">✧</span><span class="sky-star three" aria-hidden="true">✦</span><span class="speech-bubble">La letra pequeña tiene su gracia.</span><span class="world-label">EL DESPACHO DE DON LEX</span></div></div><div class="cast-parade" aria-label="Los siete personajes"></div><div class="home-bottom"><span>Casos ficticios. Contenido jurídico provisional.</span><span>Contenido pendiente de revisión con vLex Vincent.</span></div>';
  const topics = el("div", undefined, "legal-topics");
  topics.setAttribute("aria-label", "Temas de las preguntas");
  for (const topic of [
    "Contratos",
    "Vivienda",
    "Trabajo",
    "Consumo",
    "Privacidad",
    "Prueba y garantías",
  ])
    topics.append(el("span", topic));
  section.querySelector(".subtitle").after(topics);
  const world = section.querySelector(".hero-world");
  for (const [id, cls] of [
    ["don-lex", "hero-owl"],
    ["trampin", "hero-fox"],
    ["lexi", "hero-robot"],
  ]) {
    const m = mascot(id, id === "trampin" ? "duda" : "alegria", 320);
    m.className = cls;
    world.append(m);
  }
  for (const [id, name, role] of cast) {
    const card = el("div", undefined, "cast-mini");
    card.append(mascot(id, "alegria", 130), el("b", name), el("span", role));
    section.querySelector(".cast-parade").append(card);
  }
  section.querySelector("#start-slot").append(
    button(
      "¡Vamos a jugar!  →",
      () => {
        startMusicFromPlayGesture();
        const mode = section.querySelector("input:checked").value;
        state = startRound(questions, mode);
        renderQuestion(true);
      },
      "primary",
    ),
  );
  main.append(section);
  if (focus) focusHeading();
}
function presenter(q) {
  return q.level === 3
    ? ["elion", "Elion", "Aquí el detalle importa."]
    : q.level === 2
      ? ["brinco", "Brinco", "Subimos un nivel. ¡Sin perder el criterio!"]
      : ["don-lex", "Don Lex", "Lee con calma. No todo es lo que parece."];
}
function renderQuestion(focus = true) {
  clearTimer();
  const q = state.questions[state.index],
    host = presenter(q);
  main.replaceChildren();
  const shell = el("section", undefined, "game-shell");
  const top = el("div", undefined, "game-top");
  top.append(
    button(
      "← Salir",
      () => {
        if (
          state?.mode === "sprint" &&
          state.phase === "question" &&
          pausedAt === null
        )
          toggleTimerPause();
        document.querySelector("#exit-dialog").showModal();
      },
      "",
    ),
  );
  const board = el("div", undefined, "scoreboard");
  board.append(
    el("span", `Reto ${state.index + 1} / 5`, "pill"),
    el("span", `${state.score} puntos`, "pill score"),
  );
  if (state.streak > 1)
    board.append(el("span", `Racha ×${state.streak}`, "pill"));
  top.append(board);
  const progress = el("div", undefined, "progress-track");
  progress.setAttribute("role", "progressbar");
  progress.setAttribute("aria-label", "Progreso de la partida");
  progress.setAttribute("aria-valuemin", "0");
  progress.setAttribute("aria-valuemax", "5");
  progress.setAttribute("aria-valuenow", state.index);
  for (let i = 0; i < 5; i++)
    progress.append(
      el(
        "span",
        undefined,
        i < state.index ? "done" : i === state.index ? "current" : "",
      ),
    );
  const layout = el("div", undefined, "play-layout");
  const scene = el("aside", undefined, `scene ${q.scene}`);
  scene.append(
    el(
      "span",
      q.scene === "plaza"
        ? "MESA DE CONTRATOS"
        : q.scene === "jardin"
          ? "SALA DE ACUERDOS"
          : "ARCHIVO DE PRUEBAS",
      "scene-tag",
    ),
  );
  const hostArt = mascot(host[0], "alegria", 255);
  hostArt.id = "host-character";
  scene.append(
    hostArt,
    el("p", host[1], "scene-name"),
    el("p", host[2], "scene-line"),
  );
  const right = el("div");
  const card = el("article", undefined, "question-card");
  const meta = el("div", undefined, "question-meta");
  meta.append(
    el(
      "span",
      `NIVEL ${q.level} · ${["", "PRIMERAS PISTAS", "DOBLE LECTURA", "EL MATIZ"][q.level]}`,
    ),
  );
  if (state.mode === "sprint") {
    const t = el("span", "20 s · pausa disponible", "timer");
    t.id = "timer";
    t.setAttribute("aria-hidden", "true");
    meta.append(t);
  }
  const dossier = el("section", undefined, "case-dossier");
  dossier.setAttribute("aria-label", "Documento simulado del caso");
  dossier.append(
    el(
      "p",
      `CASO ${String(state.index + 1).padStart(2, "0")} / ${q.topic.toUpperCase()}`,
      "case-label",
    ),
    el("h2", q.title),
    el("p", q.exhibit, "case-exhibit"),
  );
  card.append(meta, dossier, el("h1", q.prompt));
  const answers = el("div", undefined, "answers");
  answers.setAttribute("role", "group");
  answers.setAttribute("aria-label", "Elige una respuesta");
  q.options.forEach((option, i) => {
    const b = button("", () => submitAnswer(i), "answer");
    b.dataset.choice = i;
    b.append(
      el("span", String.fromCharCode(65 + i), "letter"),
      el("span", option),
    );
    answers.append(b);
  });
  card.append(answers);
  const help = el("div", undefined, "help-row");
  help.append(
    button("✧ Una pista de Aura", showHint, ""),
    el("small", "Pista: acierto base de 80 puntos en lugar de 100."),
  );
  if (state.mode === "sprint") {
    help.append(
      button("Pausar tiempo", toggleTimerPause, "timer-pause"),
      el("small", "Brinco: +20 si aciertas en los primeros 15 segundos."),
    );
  }
  card.append(help);
  const quip = el("div", undefined, "quip");
  quip.append(
    mascot("trampin", "duda", 65),
    el("span", `Trampín: «${q.myth}»`),
  );
  right.append(card, quip);
  layout.append(scene, right);
  shell.append(top, progress, layout);
  main.append(shell);
  if (focus) focusHeading();
  started = performance.now();
  pausedAt = null;
  remaining = 20;
  if (state.mode === "sprint") startTimer();
  announce(`Pregunta ${state.index + 1} de cinco. Nivel ${q.level}.`);
}
function showHint() {
  if (
    state.phase !== "question" ||
    state.hints.includes(state.questions[state.index].id)
  )
    return;
  state = useHint(state);
  const q = state.questions[state.index];
  const hint = el("div", undefined, "hint");
  hint.id = "hint-text";
  hint.setAttribute("role", "status");
  const art = mascot("aura", "alegria", 70);
  hint.append(art, el("span", `Aura: ${q.hint}`));
  document.querySelector(".help-row").after(hint);
  document.querySelector(".help-row button").disabled = true;
  audio.effect("hint");
  react(art, "alegria");
}
function startTimer() {
  clearTimer();
  timer = setInterval(() => {
    if (state?.phase !== "question" || pausedAt !== null || document.hidden)
      return;
    remaining = Math.max(0, 20 - (performance.now() - started) / 1000);
    const display = document.getElementById("timer");
    if (display)
      display.textContent = `${Math.ceil(remaining)} s · reto opcional`;
    if (remaining <= 0) submitAnswer(-1);
  }, 200);
}
function toggleTimerPause() {
  if (!state || state.phase !== "question") return;
  const b = document.querySelector(".timer-pause");
  if (pausedAt === null) {
    pausedAt = performance.now();
    b.textContent = "Reanudar tiempo";
    announce("Tiempo pausado. Puedes seguir leyendo o responder.");
  } else {
    started += performance.now() - pausedAt;
    pausedAt = null;
    b.textContent = "Pausar tiempo";
    announce("Tiempo reanudado.");
  }
}
document.addEventListener("visibilitychange", () => {
  if (
    state?.phase === "question" &&
    state.mode === "sprint" &&
    document.hidden &&
    pausedAt === null
  ) {
    pausedAt = performance.now();
    const b = document.querySelector(".timer-pause");
    if (b) b.textContent = "Reanudar tiempo";
  }
});
function submitAnswer(choice) {
  if (!state || state.phase !== "question") return;
  clearTimer();
  const elapsed = ((pausedAt ?? performance.now()) - started) / 1000;
  state = answerRound(state, choice, { elapsed });
  const q = state.questions[state.index],
    a = state.answers.at(-1);
  for (const b of document.querySelectorAll(".answer")) {
    const i = Number(b.dataset.choice);
    b.disabled = true;
    if (i === q.correct) {
      b.classList.add("correct");
      b.append(el("span", "Respuesta del ejercicio", "answer-result"));
    } else if (i === choice) {
      b.classList.add("incorrect");
      b.append(el("span", "Tu elección", "answer-result"));
    }
  }
  for (const b of document.querySelectorAll(".help-row button"))
    b.disabled = true;
  const score = document.querySelector(".score");
  score.textContent = `${state.score} puntos`;
  const art = document.querySelector("#host-character");
  art.setAttribute("character", "lexi");
  react(art, a.correct ? "celebracion" : "duda");
  document.querySelector(".scene-name").textContent = "Lexi";
  document.querySelector(".scene-line").textContent = a.correct
    ? "¡Ese detalle era la clave!"
    : "Una duda también abre camino.";
  const fox = document.querySelector(".quip legal-mascot");
  react(fox, a.correct ? "sorpresa" : "duda");
  document.querySelector(".quip span").textContent = a.correct
    ? "Trampín: «Vale. Esta vez has leído mejor que yo»."
    : "Trampín: «A mí también me engaña a veces una frase convincente». ";
  const feedback = el("section", undefined, "feedback");
  feedback.id = "feedback";
  feedback.setAttribute("aria-labelledby", "feedback-title");
  const title = el(
    "h2",
    choice === -1
      ? "Se acabó el tiempo. Vamos a leerlo."
      : a.correct
        ? `¡Buen criterio! +${a.points}`
        : "Aquí había un matiz.",
  );
  title.id = "feedback-title";
  title.tabIndex = -1;
  feedback.append(
    title,
    el("p", q.explanation),
    el(
      "p",
      "Referencias para contraste editorial. No verificadas en esta entrega; no se ha realizado revisión con vLex Vincent.",
      "source",
    ),
  );
  const sourceList = el("ul", undefined, "legal-sources");
  for (const source of q.sources) {
    const item = el("li");
    const link = el("a", `${source.title} · ${source.reference}`);
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    item.append(link);
    sourceList.append(item);
  }
  feedback.append(sourceList);
  feedback.append(
    button(
      state.index === 4 ? "Ver mi recompensa  ✦" : "Siguiente reto  →",
      () => {
        state = nextQuestion(state);
        state.phase === "complete" ? showResult() : renderQuestion();
      },
      "primary",
    ),
  );
  document.querySelector(".question-card").append(feedback);
  audio.effect(a.correct ? "correct" : "wrong");
  title.focus({ preventScroll: true });
  feedback.scrollIntoView({
    behavior: motionDisabled() ? "instant" : "smooth",
    block: "nearest",
  });
  announce(
    `${a.correct ? "Acierto" : "Respuesta revisada"}. ${state.score} puntos. ${q.explanation}`,
  );
}
function showResult() {
  clearTimer();
  const r = reward(state);
  main.replaceChildren();
  const section = el("section", undefined, "result");
  const world = el("div", undefined, "result-world");
  const lumina = mascot("lumina", "victoria", 245);
  world.append(lumina);
  for (const [id, cls] of [
    ["don-lex", "result-side"],
    ["aura", "result-side right"],
  ]) {
    const m = mascot(id, "celebracion", 145);
    m.className = cls;
    world.append(m);
  }
  const confetti = el("div", undefined, "confetti");
  confetti.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 24; i++) {
    const bit = el("i");
    bit.style.setProperty("--x", `${(i * 43) % 100}%`);
    bit.style.setProperty("--delay", `${i * 0.035}s`);
    confetti.append(bit);
  }
  world.append(confetti);
  section.append(
    world,
    el("p", "PARTIDA COMPLETADA", "eyebrow"),
    el("h1", "¡El matiz es tuyo!"),
  );
  const points = el("p", undefined, "big-score");
  points.append(
    document.createTextNode(String(state.score) + " "),
    el("span", "PUNTOS"),
  );
  section.append(
    points,
    el(
      "p",
      `${r.correct} de 5 respuestas acertadas · ${state.mode === "sprint" ? "Reto rápido" : "A tu ritmo"}`,
      "result-sub",
    ),
  );
  const badge = el("div", undefined, "reward");
  const words = el("div");
  words.append(el("b", r.title), el("small", r.caption));
  badge.append(el("span", r.badge), words);
  section.append(badge);
  const actions = el("div", undefined, "result-actions");
  actions.append(
    button(
      "Otra partida  ↻",
      () => {
        state = startRound(questions, state.mode);
        renderQuestion();
      },
      "primary",
    ),
    button("Volver al inicio", () => home(true)),
  );
  section.append(actions);
  const share = el("section", undefined, "share-panel");
  share.append(
    el("h2", "¿A quién retaría Trampín?"),
    el(
      "p",
      "Comparte el desafío, sin respuestas ni datos de la partida. La tarjeta es genérica. Instagram permite compartir la imagen, pero no publicar automáticamente desde esta web.",
    ),
  );
  const options = el("div", undefined, "share-actions");
  options.append(
    button("WhatsApp →", shareWhatsapp),
    button("Compartir desafío", shareNative),
    button("Tarjeta para Instagram ↓", downloadStory),
    button("Copiar enlace", copyLink),
  );
  share.append(options);
  const status = el("p", "", "share-status");
  status.id = "share-status";
  status.setAttribute("role", "status");
  share.append(status);
  section.append(share);
  const recap = el("details", undefined, "recap");
  recap.append(el("summary", "Repasar mis cinco preguntas"));
  const list = el("ol");
  state.questions.forEach((q, i) => {
    const a = state.answers[i],
      li = el("li", `${a.correct ? "✓" : "◇"} ${q.prompt}`);
    li.append(
      el(
        "small",
        `Respuesta del ejercicio: ${q.options[q.correct]}. ${q.explanation}`,
      ),
    );
    list.append(li);
  });
  recap.append(list);
  section.append(
    recap,
    el(
      "p",
      "Casos ficticios con contenido jurídico provisional. No valora casos reales. Pendiente de revisión con vLex Vincent.",
      "fine",
    ),
  );
  main.append(section);
  focusHeading();
  audio.effect("victory");
  react(lumina, "victoria");
  announce(
    `Partida completada. ${state.score} puntos. ${r.correct} aciertos. Recompensa: ${r.title}.`,
  );
}
function shareStatus(text) {
  document.querySelector("#share-status").textContent = text;
}
function challengeLink() {
  return publicChallengeUrl(location.origin);
}
function canSharePublic() {
  if (isLocalReviewHost(location.hostname)) {
    shareStatus(
      "Esta es una revisión local. El enlace no será accesible desde otro móvil hasta publicar. Puedes descargar la tarjeta de muestra.",
    );
    return false;
  }
  return true;
}
function shareWhatsapp() {
  if (!canSharePublic()) return;
  const text = SHARE_TEXT + " " + challengeLink();
  window.open(
    "https://wa.me/?text=" + encodeURIComponent(text),
    "_blank",
    "noopener,noreferrer",
  );
  shareStatus(
    "WhatsApp puede abrirse para que revises el mensaje. No se envía automáticamente.",
  );
}
async function shareNative() {
  if (!canSharePublic()) return;
  const data = {
    title: "¿ESTO ES LEGAL?",
    text: SHARE_TEXT,
    url: challengeLink(),
  };
  if (!navigator.share) {
    await copyLink();
    return;
  }
  try {
    await navigator.share(data);
    shareStatus("Acción de compartir completada.");
  } catch (e) {
    shareStatus(
      e.name === "AbortError"
        ? "Compartir cancelado."
        : "No se pudo compartir. Prueba copiar el enlace.",
    );
  }
}
async function copyLink() {
  if (!canSharePublic()) return;
  try {
    await navigator.clipboard.writeText(challengeLink());
    shareStatus("Enlace del desafío copiado.");
  } catch {
    const input = el("input");
    input.value = challengeLink();
    input.readOnly = true;
    input.setAttribute("aria-label", "Enlace del desafío para copiar");
    document
      .querySelector("#share-status")
      .replaceChildren(document.createTextNode("Copia este enlace: "), input);
    input.select();
  }
}
async function storyBlob() {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw Error("Canvas no disponible");
  ctx.fillStyle = "#fbf6ec";
  ctx.fillRect(0, 0, 1080, 1920);
  ctx.fillStyle = "#172f41";
  ctx.font = "bold 30px sans-serif";
  ctx.fillText("iNAVARRO ABOGADOS / PLAY LAB", 85, 150);
  ctx.font = "bold 112px Georgia";
  ctx.fillText("¿ESTO ES", 85, 390);
  ctx.fillStyle = "#98572e";
  ctx.fillText("LEGAL?", 85, 520);
  ctx.fillStyle = "#e0e9db";
  ctx.beginPath();
  ctx.arc(540, 1000, 390, 0, Math.PI * 2);
  ctx.fill();
  const source = await fetch(
    new URL("svg/don-lex/victoria.svg", import.meta.url),
  );
  if (!source.ok) throw Error("No se pudo cargar la ilustración");
  const blob = await source.blob();
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    ctx.drawImage(img, 180, 630, 720, 720);
  } finally {
    URL.revokeObjectURL(url);
  }
  ctx.fillStyle = "#172f41";
  ctx.font = "bold 48px sans-serif";
  ctx.fillText("Cinco retos. ¿Encuentras el matiz?", 85, 1480);
  ctx.font = "30px sans-serif";
  ctx.fillText("Casos ficticios · Contenido jurídico provisional", 85, 1560);
  ctx.fillText(
    isLocalReviewHost(location.hostname)
      ? "VISTA PREVIA · AÚN SIN PUBLICAR"
      : "Descubre el desafío en " + location.host,
    85,
    1730,
  );
  ctx.font = "25px sans-serif";
  ctx.fillText("Una experiencia de iNavarro Abogados", 85, 1810);
  return await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(Error("No se pudo crear la tarjeta"))),
      "image/png",
    ),
  );
}
async function downloadStory() {
  const b = document.querySelector(".share-actions button:nth-child(3)");
  b.disabled = true;
  try {
    const blob = await storyBlob(),
      file = new File([blob], "esto-es-legal-desafio.png", {
        type: "image/png",
      });
    if (navigator.canShare?.({ files: [file] }) && navigator.share) {
      try {
        await navigator.share({ files: [file], title: "¿ESTO ES LEGAL?" });
        shareStatus(
          "Tarjeta compartida. Elige Instagram si aparece entre tus aplicaciones.",
        );
        return;
      } catch (e) {
        if (e.name === "AbortError") {
          shareStatus("Compartir tarjeta cancelado.");
          return;
        }
      }
    }
    if (shareUrl) URL.revokeObjectURL(shareUrl);
    shareUrl = URL.createObjectURL(blob);
    const a = el("a");
    a.href = shareUrl;
    a.download = "esto-es-legal-desafio.png";
    a.click();
    shareStatus(
      "Tarjeta PNG preparada. Guárdala y súbela a tu historia de Instagram.",
    );
  } catch {
    shareStatus(
      "No se ha podido crear la tarjeta. Puedes descargar las tarjetas desde la galería del elenco.",
    );
  } finally {
    b.disabled = false;
  }
}
const dialog = document.querySelector("#exit-dialog");
document
  .querySelector("#keep-playing")
  .addEventListener("click", () => dialog.close());
document.querySelector("#confirm-exit").addEventListener("click", () => {
  dialog.close();
  home(true);
});
dialog.addEventListener("close", () => {
  if (
    state?.phase === "question" &&
    state.mode === "sprint" &&
    pausedAt !== null
  )
    announce("Tiempo pausado. Pulsa Reanudar tiempo cuando quieras.");
});
dialog.addEventListener("toggle", () => {
  if (
    dialog.open &&
    state?.mode === "sprint" &&
    state.phase === "question" &&
    pausedAt === null
  )
    toggleTimerPause();
});
window.addEventListener("pagehide", () => {
  if (
    state?.phase === "question" &&
    state.mode === "sprint" &&
    pausedAt === null
  )
    pausedAt = performance.now();
  audio.pause();
  clearTimer();
  if (shareUrl) URL.revokeObjectURL(shareUrl);
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    if (audio.music) audio.begin();
    if (state?.phase === "question" && state.mode === "sprint") {
      pausedAt ??= performance.now();
      startTimer();
      const b = document.querySelector(".timer-pause");
      if (b) b.textContent = "Reanudar tiempo";
    }
  }
});
home();
