/**
 * MindPrep — Training Engine
 *
 * Moteur LOCAL de génération et de correction de sujets d'entraînement.
 *
 * Aucune dépendance externe : pas d'appel réseau, pas d'API.
 * Le but est de fournir une interface stable et explicitement branchable
 * pour qu'une vraie IA / un vrai backend de recherche d'annales puisse
 * remplacer ces fonctions plus tard sans casser l'UI.
 *
 * Points d'extension explicites (à brancher ultérieurement) :
 *   - generateTopics()        : sujets locaux ; remplaçable par appel LLM
 *   - searchTopics()          : recherche locale ; remplaçable par recherche
 *                               externe d'annales / sujets universitaires
 *   - gradeAnswer()           : correction simulée fond/forme ; remplaçable
 *                               par un vrai correcteur IA
 *   - recommendNextLevel()    : adaptation locale du niveau ; remplaçable
 *                               par un moteur d'apprentissage adaptatif
 */

export const DIFFICULTY_LEVELS = [
  { id: 1, label: "Niveau 1 — Facile", short: "Facile", description: "Restitution simple, définition, compréhension directe" },
  { id: 2, label: "Niveau 2 — Intermédiaire", short: "Intermédiaire", description: "Application simple, petit cas pratique" },
  { id: 3, label: "Niveau 3 — Moyen", short: "Moyen", description: "Analyse, comparaison, raisonnement" },
  { id: 4, label: "Niveau 4 — Avancé", short: "Avancé", description: "Étude de cas, argumentation, résolution complexe" },
  { id: 5, label: "Niveau 5 — Difficile", short: "Difficile", description: "Synthèse, critique, stratégie, cas réels, réflexion multidisciplinaire" },
];

export const TOPIC_TYPES = {
  MINI_TEST: "mini-test",
  QCM: "qcm",
  EXERCICE: "exercice",
  REFLEXION: "reflexion",
  REDACTION: "redaction",
};

const TOPIC_TYPE_LABEL = {
  [TOPIC_TYPES.MINI_TEST]: "Mini-test",
  [TOPIC_TYPES.QCM]: "QCM",
  [TOPIC_TYPES.EXERCICE]: "Exercice",
  [TOPIC_TYPES.REFLEXION]: "Réflexion",
  [TOPIC_TYPES.REDACTION]: "Rédaction",
};

export function topicTypeLabel(t) {
  return TOPIC_TYPE_LABEL[t] || t;
}

export function levelById(id) {
  return DIFFICULTY_LEVELS.find((l) => l.id === id) || DIFFICULTY_LEVELS[0];
}

/**
 * Templates de génération par niveau, indépendants de la matière.
 * Une vraie IA produirait des sujets sur-mesure ; ici on combine
 * le titre du cours avec des verbes pédagogiques.
 */
const LEVEL_TEMPLATES = {
  1: [
    { type: TOPIC_TYPES.QCM, prompt: (t) => `Quelle est la définition exacte de « ${t} » ?`, duration: 5 },
    { type: TOPIC_TYPES.MINI_TEST, prompt: (t) => `Restituez les éléments essentiels de « ${t} ».`, duration: 7 },
    { type: TOPIC_TYPES.EXERCICE, prompt: (t) => `Expliquez en 3 phrases la notion de « ${t} ».`, duration: 6 },
  ],
  2: [
    { type: TOPIC_TYPES.EXERCICE, prompt: (t) => `Appliquez « ${t} » à un cas simple en chiffrant chaque étape.`, duration: 12 },
    { type: TOPIC_TYPES.MINI_TEST, prompt: (t) => `Résolvez un mini-cas pratique mobilisant « ${t} ».`, duration: 15 },
    { type: TOPIC_TYPES.QCM, prompt: (t) => `Identifiez parmi 4 propositions celle qui illustre correctement « ${t} ».`, duration: 5 },
  ],
  3: [
    { type: TOPIC_TYPES.REFLEXION, prompt: (t) => `Comparez deux approches différentes de « ${t} » et justifiez vos choix.`, duration: 25 },
    { type: TOPIC_TYPES.EXERCICE, prompt: (t) => `Analysez un cas portant sur « ${t} » : identifiez les variables, les hypothèses et les limites.`, duration: 30 },
    { type: TOPIC_TYPES.REDACTION, prompt: (t) => `Rédigez une note structurée d'1 page sur « ${t} » avec arguments et contre-arguments.`, duration: 40 },
  ],
  4: [
    { type: TOPIC_TYPES.REDACTION, prompt: (t) => `Étude de cas approfondie : « ${t} » dans un environnement contraint. Argumentez votre démarche.`, duration: 60 },
    { type: TOPIC_TYPES.REFLEXION, prompt: (t) => `Construisez un raisonnement complet en 3 parties autour de « ${t} », avec exemples chiffrés.`, duration: 75 },
    { type: TOPIC_TYPES.EXERCICE, prompt: (t) => `Résolvez un problème complexe mêlant « ${t} » et un autre concept du chapitre.`, duration: 50 },
  ],
  5: [
    { type: TOPIC_TYPES.REDACTION, prompt: (t) => `Analysez les limites de « ${t} » dans un contexte réel, à fort enjeu et en environnement instable.`, duration: 90 },
    { type: TOPIC_TYPES.REFLEXION, prompt: (t) => `Synthèse critique : confrontez « ${t} » à au moins deux disciplines connexes et proposez une stratégie.`, duration: 90 },
    { type: TOPIC_TYPES.REDACTION, prompt: (t) => `Dissertation : « En quoi « ${t} » reste-t-il pertinent face aux mutations contemporaines ? »`, duration: 120 },
  ],
};

/**
 * Génère un set de sujets intelligents à partir d'un titre de cours et d'une matière.
 * Couvre les 5 niveaux par défaut.
 *
 * @param {string} subject  Matière
 * @param {string} title    Titre du cours / chapitre
 * @param {object} [opts]   { topicsPerLevel?: number, levels?: number[], theme?: string }
 * @returns {Array<object>} Sujets générés
 */
export function generateTopics(subject, title, opts = {}) {
  const cleanTitle = (title || "ce chapitre").trim();
  const cleanSubject = (subject || "").trim();
  const levels = opts.levels || [1, 2, 3, 4, 5];
  const perLevel = Math.max(1, Math.min(3, opts.topicsPerLevel || 2));
  const out = [];
  let counter = 1;
  levels.forEach((lvl) => {
    const tpls = LEVEL_TEMPLATES[lvl] || [];
    for (let i = 0; i < perLevel && i < tpls.length; i += 1) {
      const tpl = tpls[i];
      out.push({
        id: `topic_${Date.now()}_${counter++}`,
        level: lvl,
        type: tpl.type,
        subject: cleanSubject,
        theme: opts.theme || cleanTitle,
        title: cleanTitle,
        prompt: tpl.prompt(cleanTitle),
        durationMin: tpl.duration,
        source: "local",
      });
    }
  });
  return out;
}

/**
 * Recherche locale dans une liste de sujets.
 * Filtres : niveau, type, durée max, mot-clé texte.
 *
 * Hook explicite : remplacer cette fonction par un appel à un moteur
 * de recherche d'annales / cas pratiques externe (ex: API universités).
 */
export function searchTopics(topics, filters = {}) {
  const {
    level = null,
    type = null,
    maxDuration = null,
    query = "",
    subject = null,
  } = filters;

  const q = (query || "").toLowerCase().trim();

  return topics.filter((t) => {
    if (level && Number(t.level) !== Number(level)) return false;
    if (type && t.type !== type) return false;
    if (maxDuration && t.durationMin > Number(maxDuration)) return false;
    if (subject && t.subject && t.subject !== subject) return false;
    if (q) {
      const hay = `${t.title} ${t.prompt} ${t.theme} ${t.subject}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/**
 * Compte les mots d'une chaîne (utilisé pour la grille de notation).
 */
function countWords(s) {
  return (s || "").trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Heuristiques très simples pour simuler une correction IA "fond / forme".
 * Sortie compatible avec une vraie API de correction (interface stable).
 *
 * Hook explicite : remplacer par un appel à un correcteur IA réel.
 *
 * @param {object} topic     Le sujet auquel l'utilisateur a répondu
 * @param {object} answer    { text?: string, fileName?: string, fileType?: string }
 * @returns {object}         Rapport de correction structuré
 */
export function gradeAnswer(topic, answer) {
  const text = (answer.text || "").trim();
  const words = countWords(text);
  const hasFile = Boolean(answer.fileName);

  // FOND : compréhension, logique, pertinence, exactitude
  const fondCriteria = scoreFond(topic, text, hasFile);
  // FORME : structure, clarté, orthographe, argumentation
  const formeCriteria = scoreForme(topic, text, hasFile);

  const fondAvg = avgScore(fondCriteria);
  const formeAvg = avgScore(formeCriteria);
  // Note finale 60% fond, 40% forme — ramenée sur 20
  const note = Math.round(((fondAvg * 0.6 + formeAvg * 0.4) / 5) * 20 * 10) / 10;

  const strengths = [];
  const weaknesses = [];
  const advice = [];

  if (fondAvg >= 4) strengths.push("Bonne compréhension du sujet sur le fond.");
  if (formeAvg >= 4) strengths.push("Forme structurée et lisible.");
  if (words >= 200 && topic.type === "redaction") strengths.push("Volume suffisant pour traiter le sujet en profondeur.");
  if (hasFile) strengths.push("Pièce jointe correctement déposée.");

  if (fondAvg < 3) weaknesses.push("Le fond reste superficiel : approfondir les notions clés du chapitre.");
  if (formeAvg < 3) weaknesses.push("La forme manque de structure (introduction, développement, conclusion).");
  if (words < 50 && !hasFile) weaknesses.push("Réponse trop courte pour évaluer correctement le raisonnement.");
  if (topic.level >= 4 && words < 250 && !hasFile) weaknesses.push("Sujet de niveau avancé : un développement plus complet est attendu.");

  if (fondAvg < formeAvg) advice.push("Travaille la maîtrise du contenu avant la rédaction : revois la fiche du cours.");
  if (formeAvg < fondAvg) advice.push("Améliore le plan : annonce, transitions, conclusion. Relis pour l'orthographe.");
  if (topic.level <= 2 && note >= 14) advice.push("Tu es prêt(e) à passer à un niveau supérieur sur ce thème.");
  if (topic.level >= 4 && note < 10) advice.push("Reviens d'abord sur les niveaux 2-3 pour consolider les bases.");
  if (advice.length === 0) advice.push("Continue à varier les exercices : alterne mini-tests et rédactions pour ancrer la notion.");

  return {
    topicId: topic.id,
    note,
    noteOver: 20,
    fond: { criteria: fondCriteria, average: fondAvg },
    forme: { criteria: formeCriteria, average: formeAvg },
    strengths,
    weaknesses,
    advice,
    wordCount: words,
    hasFile,
    gradedAt: new Date().toISOString(),
    source: "local-simulated", // signal explicite que ce n'est pas une vraie IA
  };
}

function scoreFond(topic, text, hasFile) {
  const words = countWords(text);
  const minExpected = topic.level <= 2 ? 30 : topic.level === 3 ? 100 : 200;
  const lengthScore = Math.min(5, Math.max(1, Math.round((words / minExpected) * 4) + 1));
  const containsTitle = topic.title && text.toLowerCase().includes(topic.title.toLowerCase());
  const pertinence = containsTitle ? 4 : (hasFile ? 3 : 2);
  const logique = /donc|car|parce que|ainsi|en effet|cependant|toutefois|d'abord|ensuite|enfin/i.test(text) ? 4 : 3;
  const exactitude = hasFile ? 3 : Math.min(5, Math.max(2, lengthScore - 1));
  return [
    { name: "Compréhension du sujet", value: hasFile ? 3 : Math.min(5, lengthScore) },
    { name: "Pertinence des arguments", value: pertinence },
    { name: "Logique du raisonnement", value: logique },
    { name: "Exactitude des connaissances", value: exactitude },
  ];
}

function scoreForme(topic, text, hasFile) {
  const words = countWords(text);
  const sentences = (text.match(/[.!?]+/g) || []).length;
  const hasParagraphs = text.includes("\n\n") || text.split("\n").length >= 3;
  const structure = hasParagraphs ? 4 : (sentences >= 3 ? 3 : 2);
  const clarte = words > 0 && sentences > 0 ? Math.min(5, Math.max(2, Math.round((words / Math.max(sentences, 1)) > 8 ? 4 : 3))) : (hasFile ? 3 : 2);
  // Détection naïve de fautes : doublons d'espaces, absence de majuscules, etc.
  const noDoubleSpace = !/  +/.test(text);
  const startsCapital = /^[A-ZÀ-Ý]/.test(text);
  const orthographe = (noDoubleSpace ? 1 : 0) + (startsCapital ? 1 : 0) + (text ? 2 : 1) + (hasFile ? 1 : 0);
  const argumentation = /exemple|illustration|cas|en pratique|concrètement/i.test(text) ? 4 : 3;
  return [
    { name: "Structure du propos", value: structure },
    { name: "Clarté de l'expression", value: clarte },
    { name: "Orthographe et syntaxe", value: Math.min(5, Math.max(1, orthographe)) },
    { name: "Qualité de l'argumentation", value: argumentation },
  ];
}

function avgScore(criteria) {
  if (!criteria.length) return 0;
  const sum = criteria.reduce((a, c) => a + c.value, 0);
  return Math.round((sum / criteria.length) * 10) / 10;
}

/**
 * Recommandation de progression : si la moyenne des dernières copies est haute,
 * on monte d'un niveau ; si elle est basse, on redescend ; sinon on reste.
 *
 * Hook explicite : remplacer par un vrai moteur d'apprentissage adaptatif.
 *
 * @param {Array<object>} reports  Liste de rapports gradeAnswer()
 * @param {number} currentLevel    Niveau actuel (1-5)
 * @returns {object}               { nextLevel, reason, action }
 */
export function recommendNextLevel(reports, currentLevel = 1) {
  const recent = reports.slice(-5);
  if (recent.length === 0) {
    return {
      nextLevel: currentLevel,
      reason: "Pas encore de copies évaluées.",
      action: "Rends une première copie pour calibrer ton niveau.",
    };
  }
  const avg = recent.reduce((a, r) => a + (r.note || 0), 0) / recent.length;
  if (avg >= 14 && currentLevel < 5) {
    return {
      nextLevel: currentLevel + 1,
      reason: `Moyenne récente ${avg.toFixed(1)}/20 — tu maîtrises ce niveau.`,
      action: "Passe au niveau supérieur pour continuer à progresser.",
    };
  }
  if (avg < 8 && currentLevel > 1) {
    return {
      nextLevel: currentLevel - 1,
      reason: `Moyenne récente ${avg.toFixed(1)}/20 — consolide les bases avant d'avancer.`,
      action: "Repasse sur des sujets plus simples avec explications supplémentaires.",
    };
  }
  return {
    nextLevel: currentLevel,
    reason: `Moyenne récente ${avg.toFixed(1)}/20 — niveau cohérent.`,
    action: "Continue à varier les exercices à ce niveau.",
  };
}

/**
 * Statistiques de progression à partir des rapports.
 */
export function computeProgressStats(reports) {
  if (!reports.length) {
    return {
      copyCount: 0,
      averageNote: 0,
      averageDurationMin: 0,
      strongSubjects: [],
      weakSubjects: [],
    };
  }
  const total = reports.reduce((a, r) => a + (r.note || 0), 0);
  const avg = Math.round((total / reports.length) * 10) / 10;
  const bySubject = {};
  reports.forEach((r) => {
    const s = r.subject || "—";
    bySubject[s] = bySubject[s] || { sum: 0, count: 0 };
    bySubject[s].sum += r.note || 0;
    bySubject[s].count += 1;
  });
  const subjects = Object.entries(bySubject).map(([name, v]) => ({
    name,
    avg: Math.round((v.sum / v.count) * 10) / 10,
    count: v.count,
  }));
  subjects.sort((a, b) => b.avg - a.avg);
  return {
    copyCount: reports.length,
    averageNote: avg,
    averageDurationMin: 0,
    strongSubjects: subjects.slice(0, 3),
    weakSubjects: subjects.slice(-3).reverse(),
  };
}
