export function buildCompression(model) {
  return [
    `Fiche courte: ${model.mainIdea} = ${model.keywords.slice(0, 5).join(", ")}`,
    `Synthèse clé: ${model.relations[0]}`,
    `Règle compacte: ${model.rules[0]}`,
    `Application essentielle: ${model.applications[0]}`,
    `Question de révision: comment relier ${model.keywords[0]} à ${model.keywords[1] || "un concept voisin"} ?`,
  ];
}
