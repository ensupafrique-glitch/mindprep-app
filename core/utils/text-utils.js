export const stopWords = new Set([
  "cours", "avec", "pour", "dans", "cette", "comme", "plus", "moins",
  "entre", "leurs", "notion", "chapitre", "exemple"
]);

export function cleanText(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4 && !stopWords.has(word));
}

export function getSubjectDefaults(subject) {
  const defaults = {
    "Comptabilité de gestion": ["coût complet", "charges directes", "charges indirectes", "marge", "seuil de rentabilité"],
    Finance: ["investissement", "rentabilité", "risque", "financement", "cash-flow"],
    Fiscalité: ["base imposable", "taux", "déduction", "déclaration", "contrôle"],
    Audit: ["risque", "preuve", "contrôle interne", "anomalie", "opinion"],
    Philosophie: ["notion", "problématique", "thèse", "objection", "exemple"],
  };

  return defaults[subject] || ["idée centrale", "concepts clés", "relations", "applications", "méthode"];
}

export function formatList(items) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}