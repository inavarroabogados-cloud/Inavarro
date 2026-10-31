export function validateDraft(input) {
  const errors = {};
  const clean = (key, min, max) => {
    const v = typeof input?.[key] === "string" ? input[key].trim() : "";
    if (v.length < min || v.length > max)
      errors[key] = `Debe contener entre ${min} y ${max} caracteres.`;
    return v;
  };
  const title = clean("title", 4, 140),
    prompt = clean("prompt", 10, 700),
    explanation = clean("explanation", 10, 1600),
    jurisdiction = clean("jurisdiction", 3, 150),
    reviewer = clean("reviewer", 0, 150),
    reviewDate = clean("reviewDate", 0, 10),
    reviewNotes = clean("reviewNotes", 0, 1600),
    hint = clean("hint", 5, 250);
  const options = Array.isArray(input?.options)
    ? input.options.map((v) => (typeof v === "string" ? v.trim() : ""))
    : [];
  if (
    options.length !== 3 ||
    options.some((v) => v.length < 1 || v.length > 250) ||
    new Set(options).size !== 3
  )
    errors.options =
      "Introduce tres respuestas diferentes, de hasta 250 caracteres.";
  const correct = input?.correct;
  if (!Number.isInteger(correct) || correct < 0 || correct > 2)
    errors.correct = "Elige la respuesta correcta.";
  const level = input?.level;
  if (![1, 2, 3].includes(level)) errors.level = "Nivel inválido.";
  const scene = input?.scene;
  if (!["plaza", "biblioteca", "jardin"].includes(scene))
    errors.scene = "Escenario inválido.";
  const sources = Array.isArray(input?.sources) ? input.sources : [];
  if (sources.length > 8) errors.sources = "Máximo ocho fuentes.";
  const cleanSources = sources.slice(0, 8).map((s, i) => {
    const kind = s?.kind,
      title = typeof s?.title === "string" ? s.title.trim() : "",
      reference = typeof s?.reference === "string" ? s.reference.trim() : "",
      url = typeof s?.url === "string" ? s.url.trim() : "";
    if (
      !["legislation", "jurisprudence", "other"].includes(kind) ||
      title.length < 3 ||
      title.length > 200 ||
      reference.length > 200 ||
      url.length > 600
    )
      errors.sources = `Revisa la fuente ${i + 1}.`;
    try {
      const u = new URL(url);
      if (u.protocol !== "https:" || u.username || u.password) throw Error();
    } catch {
      errors.sources =
        "Cada fuente debe incluir una URL HTTPS sin credenciales.";
    }
    return { kind, title, reference, url };
  });
  const vincentReviewed = input?.vincentReviewed === true;
  const status = vincentReviewed ? "review-recorded" : "draft";
  if (vincentReviewed) {
    if (!reviewer || !reviewNotes)
      errors.reviewNotes =
        "Identifica al revisor y documenta el contraste realizado.";
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(reviewDate) ||
      !Number.isFinite(Date.parse(reviewDate)) ||
      new Date(reviewDate).toISOString().slice(0, 10) !== reviewDate ||
      reviewDate > new Date().toISOString().slice(0, 10)
    )
      errors.reviewDate = "Introduce una fecha real que no sea futura.";
    if (
      !cleanSources.some((s) => s.kind === "legislation") ||
      cleanSources.some((s) => !s.reference)
    )
      errors.sources =
        "El contraste requiere al menos una referencia legislativa.";
  }
  return {
    errors,
    value: {
      title,
      prompt,
      options,
      correct,
      level,
      scene,
      explanation,
      hint,
      jurisdiction,
      sources: cleanSources,
      reviewer,
      reviewDate,
      reviewNotes,
      vincentReviewed,
      status,
    },
  };
}
