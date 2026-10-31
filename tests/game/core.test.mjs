import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import {
  questions,
  editorialScope,
} from "../../web/esto-es-legal/questions.js";
import {
  startRound,
  answerRound,
  nextQuestion,
  useHint,
  reward,
  publicChallengeUrl,
  SHARE_TEXT,
} from "../../web/esto-es-legal/game-core.js";
import { validateDraft } from "../../game-editor/validation.mjs";
test("five questions, escalating levels, original bank untouched", () => {
  const initial = JSON.stringify(questions);
  const s = startRound(questions);
  assert.equal(s.questions.length, 5);
  assert.equal(new Set(s.questions.map((q) => q.id)).size, 5);
  assert.deepEqual(
    s.questions.map((q) => q.level),
    [1, 1, 2, 2, 3],
  );
  assert.equal(JSON.stringify(questions), initial);
});
test("correct answers, combo, victory and duplicate prevention", () => {
  let s = startRound(questions);
  for (let i = 0; i < 5; i++) {
    const before = s;
    s = answerRound(s, s.questions[s.index].correct);
    assert.equal(answerRound(s, 0), s);
    assert.equal(nextQuestion(before), before);
    s = nextQuestion(s);
  }
  assert.equal(s.phase, "complete");
  assert.equal(s.score, 590);
  assert.equal(reward(s).correct, 5);
  assert.equal(s.answers.length, 5);
});
test("hint reduces base once; incorrect and timeout reset combo", () => {
  let s = startRound(questions);
  s = useHint(useHint(s));
  assert.equal(s.hints.length, 1);
  s = answerRound(s, s.questions[0].correct);
  assert.equal(s.score, 80);
  s = nextQuestion(s);
  s = answerRound(s, -1);
  assert.equal(s.streak, 0);
  assert.equal(s.score, 80);
  assert.throws(() => answerRound(startRound(questions), 99));
  assert.throws(() => answerRound(startRound(questions), 0.1));
});
test("sprint bonus has explicit threshold; relaxed never rewards speed", () => {
  for (const [mode, time, points] of [
    ["sprint", 15, 120],
    ["sprint", 16, 100],
    ["relaxed", 1, 100],
  ]) {
    const s = startRound(questions, mode);
    assert.equal(
      answerRound(s, s.questions[0].correct, { elapsed: time }).score,
      points,
    );
  }
});
test("legal demo uses everyday cases, real-reference proposals and explicit pending review", () => {
  assert.equal(questions.length, 15);
  assert.equal(editorialScope.publicationAllowed, false);
  assert.equal(editorialScope.jurisdictionConfirmed, false);
  const allowed = new Set(["www.boe.es", "eur-lex.europa.eu"]);
  for (const q of questions) {
    assert.equal(q.status, "demo");
    assert.equal(q.review.vincentVerified, false);
    assert.equal(q.review.reviewer, null);
    assert.equal(q.options.length, 3);
    assert.equal(new Set(q.options).size, 3);
    assert.ok(q.topic && q.title && q.exhibit);
    assert.ok(q.correct >= 0 && q.correct < 3);
    assert.ok(!/Villa Lex|Regla ficticia|hojas caídas|farol/.test(q.prompt));
    for (const source of q.sources) {
      assert.ok(allowed.has(new URL(source.url).hostname));
      assert.equal(source.verification, "pending");
      assert.ok(source.reference);
    }
  }
  assert.ok(new Set(questions.map((q) => q.topic)).size >= 7);
  assert.deepEqual(
    [1, 2, 3].map((level) => questions.filter((q) => q.level === level).length),
    [5, 5, 5],
  );
});
test("legal bank: repeated rounds cannot duplicate cases or mutate the bank", () => {
  const before = JSON.stringify(questions);
  const seen = new Set();
  let seed = 20261031;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  for (let i = 0; i < 250; i++) {
    const round = startRound(questions,"relaxed",random);
    assert.equal(new Set(round.questions.map((q) => q.id)).size, 5);
    assert.deepEqual(
      round.questions.map((q) => q.level),
      [1, 1, 2, 2, 3],
    );
    for (const q of round.questions) seen.add(q.id);
  }
  assert.equal(seen.size, 15);
  assert.equal(JSON.stringify(questions), before);
});
test("share URL strips query, hash and path; text has no answers or score", () => {
  assert.equal(
    publicChallengeUrl("https://example.test/private?name=secret#answer"),
    "https://example.test/esto-es-legal/",
  );
  assert.throws(() => publicChallengeUrl("javascript:alert(1)"));
  assert.ok(!SHARE_TEXT.includes("puntos"));
});
const draft = {
  title: "Prueba ficticia",
  prompt: "¿Qué dice esta regla ficticia del jardín?",
  options: ["Primera opción", "Segunda opción", "Tercera opción"],
  correct: 1,
  level: 1,
  scene: "jardin",
  explanation: "La regla inventada requiere leer todas las palabras.",
  hint: "Lee la regla completa.",
  jurisdiction: "Villa Lex ficticia",
  sources: [],
};
test("editor accepts drafts, validates answers and rejects unsafe sources", () => {
  assert.deepEqual(validateDraft(draft).errors, {});
  assert.ok(
    validateDraft({ ...draft, options: ["Uno", "Uno", "Otro"] }).errors.options,
  );
  assert.ok(
    validateDraft({
      ...draft,
      sources: [
        { kind: "legislation", title: "Fuente", url: "javascript:alert(1)" },
      ],
    }).errors.sources,
  );
  assert.ok(validateDraft({ ...draft, correct: 8 }).errors.correct);
});
test("declared Vincent review requires human identity, date, notes and legislation", () => {
  const bad = validateDraft({ ...draft, vincentReviewed: true });
  assert.ok(bad.errors.reviewNotes);
  assert.ok(bad.errors.reviewDate);
  assert.ok(bad.errors.sources);
  const good = validateDraft({
    ...draft,
    vincentReviewed: true,
    reviewer: "Revisor ficticio de prueba",
    reviewDate: new Date().toISOString().slice(0, 10),
    reviewNotes:
      "Ejemplo de declaración para probar el validador; no revisión real.",
    sources: [
      {
        kind: "legislation",
        title: "Referencia ficticia para el test",
        reference: "Prueba",
        url: "https://example.test/norma",
      },
    ],
  });
  assert.deepEqual(good.errors, {});
  assert.equal(good.value.status, "review-recorded");
});
test("all original 42 illustrations and animation implementation preserved byte for byte", () => {
  const files = execFileSync(
    "git",
    [
      "ls-tree",
      "-r",
      "--name-only",
      "ea2e59b",
      "--",
      "web/esto-es-legal/svg",
      "web/esto-es-legal/mascot.js",
      "web/esto-es-legal/mascot.css",
    ],
    { encoding: "utf8" },
  )
    .trim()
    .split("\n");
  assert.equal(files.length, 44);
  for (const f of files) {
    const original = execFileSync("git", ["show", `ea2e59b:${f}`]);
    assert.equal(
      createHash("sha256").update(fs.readFileSync(f)).digest("hex"),
      createHash("sha256").update(original).digest("hex"),
      f,
    );
  }
});
