export function shuffle(items, random = Math.random) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function makeRound(bank, random = Math.random) {
  if (!Array.isArray(bank) || bank.length < 5)
    throw Error("Se necesitan cinco preguntas");
  const pool = shuffle(bank, random).sort((a, b) => a.level - b.level);
  const low = pool.filter((q) => q.level === 1),
    mid = pool.filter((q) => q.level === 2),
    high = pool.filter((q) => q.level === 3);
  const chosen = [...low.slice(0, 2), ...mid.slice(0, 2), ...high.slice(0, 1)];
  if (chosen.length !== 5) throw Error("Banco incompleto por niveles");
  return chosen.map((q) => ({ ...q, options: [...q.options] }));
}
export function startRound(bank, mode = "relaxed", random = Math.random) {
  return {
    questions: makeRound(bank, random),
    index: 0,
    score: 0,
    streak: 0,
    answers: [],
    hints: [],
    mode: mode === "sprint" ? "sprint" : "relaxed",
    phase: "question",
  };
}
export function answerRound(state, choice, { elapsed = 0 } = {}) {
  if (state.phase !== "question") return state;
  const q = state.questions[state.index];
  if (!Number.isInteger(choice) || choice < -1 || choice >= q.options.length)
    throw Error("Respuesta inválida");
  const correct = choice === q.correct;
  const hinted = state.hints.includes(q.id);
  const base = correct ? (hinted ? 80 : 100) : 0;
  const combo = correct ? Math.min(state.streak, 3) * 10 : 0;
  const speed = correct && state.mode === "sprint" && elapsed <= 15 ? 20 : 0;
  const points = base + combo + speed;
  return {
    ...state,
    score: state.score + points,
    streak: correct ? state.streak + 1 : 0,
    phase: "feedback",
    answers: [...state.answers, { id: q.id, choice, correct, points, hinted }],
  };
}
export function useHint(state) {
  if (state.phase !== "question") return state;
  const id = state.questions[state.index].id;
  return state.hints.includes(id)
    ? state
    : { ...state, hints: [...state.hints, id] };
}
export function nextQuestion(state) {
  if (state.phase !== "feedback") return state;
  return {
    ...state,
    index: state.index + 1,
    phase: state.index === 4 ? "complete" : "question",
  };
}
export function reward(state) {
  const correct = state.answers.filter((a) => a.correct).length;
  return {
    correct,
    title:
      correct === 5
        ? "Ojo de Elion"
        : correct >= 3
          ? "Criterio en marcha"
          : "La curiosidad cuenta",
    caption:
      correct === 5
        ? "Has encontrado todos los matices."
        : correct >= 3
          ? "Cada detalle que lees suma."
          : "Preguntar y volver a intentarlo también es avanzar.",
    badge: correct === 5 ? "✦" : correct >= 3 ? "◆" : "✧",
  };
}
export const SHARE_TEXT =
  "¿Un zorro te haría caer en una pregunta trampa? Prueba ¿ESTO ES LEGAL? · Cinco casos ficticios sobre contratos, consumo y privacidad. Contenido jurídico provisional.";
export function publicChallengeUrl(origin) {
  const u = new URL(origin);
  if (!["http:", "https:"].includes(u.protocol)) throw Error("Origen inválido");
  return u.origin + "/esto-es-legal/";
}
