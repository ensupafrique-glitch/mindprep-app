// MindPrep — Presentation Engine
// Génère localement un squelette d'exposé structuré (plan, slides, mind map,
// graphiques recommandés, questions du jury) à partir d'un sujet et d'un
// contenu optionnel. Les hooks AI (OpenAI/Claude/Napkin) sont préparés
// mais non branchés tant qu'aucune clé n'est configurée.

const STOPWORDS = new Set([
  "le","la","les","un","une","des","de","du","et","ou","à","au","aux","en",
  "pour","par","sur","dans","avec","sans","ce","cet","cette","ces","que",
  "qui","quoi","dont","où","est","sont","être","avoir","plus","moins","ne",
  "pas","ni","si","comme","mais","donc","or","car","aussi","alors","leur",
  "leurs","son","sa","ses","mon","ma","mes","ton","ta","tes","nos","vos",
  "ils","elles","nous","vous","je","tu","il","elle","on","y"
]);

function extractKeywords(text, max = 8) {
  if (!text) return [];
  const seen = new Map();
  const tokens = String(text)
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  for (const t of tokens) {
    if (t.length < 4) continue;
    if (STOPWORDS.has(t)) continue;
    seen.set(t, (seen.get(t) || 0) + 1);
  }
  return [...seen.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));
}

function deriveAxes(topic, content) {
  const kws = extractKeywords(`${topic} ${content || ""}`, 12);
  // Toujours 3 axes — la structure attendue d'un exposé classique.
  // On combine des angles méthodologiques universels avec les mots-clés extraits.
  const angles = [
    { title: "Cadrage et enjeux", lens: "définir, contextualiser, poser le problème" },
    { title: "Mécanismes et dynamiques", lens: "expliquer, articuler les causes et effets" },
    { title: "Limites, débats et perspectives", lens: "nuancer, ouvrir, projeter" },
  ];
  return angles.map((a, i) => {
    const seed = kws[i] || kws[0] || topic;
    const seed2 = kws[i + 3] || kws[(i + 1) % Math.max(kws.length, 1)] || "exemples";
    return {
      title: `${i + 1}. ${a.title} — ${seed}`,
      lens: a.lens,
      sub: [
        `Définition et périmètre : ${seed.toLowerCase()}`,
        `Illustration concrète : cas, exemple, donnée chiffrée sur ${seed2.toLowerCase()}`,
        `Mini-conclusion partielle : ce qu'il faut retenir avant la transition`,
      ],
    };
  });
}

function buildOutline(topic, content) {
  const axes = deriveAxes(topic, content);
  return axes;
}

function buildIntro(topic, content) {
  const kws = extractKeywords(`${topic} ${content || ""}`, 3);
  const accroche = kws[0]
    ? `Lorsqu'on évoque ${kws[0].toLowerCase()}, on touche à un enjeu central de notre époque.`
    : `Le sujet « ${topic} » interroge directement notre rapport au monde contemporain.`;
  return `${accroche} Cet exposé propose de revenir sur les notions-clés, d'en analyser les ressorts puis d'en discuter les limites. Nous verrons en quoi ${topic.toLowerCase()} mérite une lecture nuancée.`;
}

function buildProblematic(topic) {
  return `En quoi ${topic.toLowerCase()} constitue-t-il un objet d'étude révélateur, et quelles tensions principales structurent les débats actuels ?`;
}

function buildConclusion(topic) {
  return `Au terme de cette analyse, ${topic.toLowerCase()} apparaît comme un sujet à entrées multiples : il combine une dimension descriptive, une dimension explicative et une dimension critique. La question reste ouverte : comment continuer à le penser à mesure que les contextes évoluent ?`;
}

function buildTransitions(axes) {
  const t = [];
  for (let i = 0; i < axes.length - 1; i++) {
    t.push(`Après avoir posé ${axes[i].title.toLowerCase()}, on peut désormais s'interroger sur ${axes[i + 1].title.toLowerCase()}.`);
  }
  t.push("Avant de conclure, récapitulons brièvement les fils conducteurs de la réflexion.");
  return t;
}

function buildSummary(topic, content, level) {
  const adv = level === "premium"
    ? "L'analyse intègre une critique des sources, une mise en perspective historique et une ouverture interdisciplinaire."
    : "L'exposé présente le sujet en trois temps clairs et cohérents, accessibles à un public non-spécialiste.";
  return `Présentation structurée sur « ${topic} ». ${adv}`;
}

function buildQuestions(topic, axes, level) {
  const base = [
    `Comment définiriez-vous précisément ${topic.toLowerCase()} ?`,
    `Quels contre-arguments pourriez-vous opposer à votre propre démonstration ?`,
    `Sur quelle source vous appuyez-vous principalement, et pourquoi ?`,
    `Quel exemple illustre le mieux votre deuxième partie ?`,
    `Comment ce sujet pourrait-il évoluer dans les 10 prochaines années ?`,
  ];
  if (level === "premium") {
    base.push(
      `Pouvez-vous reformuler votre problématique en une phrase ?`,
      `Quelle objection méthodologique acceptez-vous, et laquelle rejetez-vous ?`,
    );
  }
  return base;
}

function buildBibliography(topic) {
  return [
    `Manuel de référence du programme — chapitre traitant de ${topic.toLowerCase()}.`,
    `Article académique récent (Cairn, Persée, JSTOR) — à choisir selon ta discipline.`,
    `Source primaire ou rapport officiel (INSEE, OCDE, ONU, ministère…) à confronter.`,
    `Interview ou conférence vidéo (France Culture, Radio France, YouTube académique).`,
  ];
}

function buildSlides(topic, axes, level) {
  const slides = [
    { num: "01", title: topic, body: "Diapositive de titre — nom, classe, date.", tag: "Titre" },
    { num: "02", title: "Contexte", body: "Pourquoi ce sujet aujourd'hui ? Cadrage en 2-3 phrases.", tag: "Contexte" },
    { num: "03", title: "Problématique", body: buildProblematic(topic), tag: "Problème" },
  ];
  axes.forEach((a, i) => {
    slides.push({
      num: String(slides.length + 1).padStart(2, "0"),
      title: a.title.replace(/^\d+\.\s*/, ""),
      body: a.sub.slice(0, 2).join(" • "),
      tag: `Partie ${i + 1}`,
    });
  });
  slides.push({
    num: String(slides.length + 1).padStart(2, "0"),
    title: "Données clés",
    body: "1 graphique d'évolution + 1 chiffre choc. Garde une donnée par slide.",
    tag: "Visuel",
  });
  slides.push({
    num: String(slides.length + 1).padStart(2, "0"),
    title: "Conclusion",
    body: buildConclusion(topic),
    tag: "Synthèse",
  });
  slides.push({
    num: String(slides.length + 1).padStart(2, "0"),
    title: "Questions",
    body: "Merci pour votre attention. Place aux questions du jury.",
    tag: "Échange",
  });
  if (level === "premium") {
    slides.splice(slides.length - 1, 0, {
      num: String(slides.length).padStart(2, "0"),
      title: "Ouverture critique",
      body: "Une question prospective ou interdisciplinaire — montre que tu vas plus loin.",
      tag: "Premium",
    });
  }
  return slides;
}

function buildMindMap(topic, axes) {
  return {
    center: topic,
    branches: axes.map((a) => ({
      label: a.title.replace(/^\d+\.\s*/, ""),
      sub: a.sub.slice(0, 3).map((s) => s.replace(/^.+?:\s*/, "")),
    })),
  };
}

function buildChartRecommendations(topic, level) {
  // Données illustratives, clairement marquées comme exemples.
  const charts = [
    {
      title: "Évolution dans le temps",
      goal: "Montrer une trajectoire (croissance, déclin, cycles).",
      type: "Courbe (line chart)",
      kind: "line",
      sample: [12, 18, 22, 28, 32, 38, 45, 49],
    },
    {
      title: "Comparaison",
      goal: "Opposer plusieurs catégories ou pays sur une variable.",
      type: "Barres horizontales (bar chart)",
      kind: "bar",
      sample: [
        { label: "Cas A", value: 72 },
        { label: "Cas B", value: 56 },
        { label: "Cas C", value: 41 },
        { label: "Cas D", value: 28 },
      ],
    },
    {
      title: "Répartition",
      goal: "Illustrer un poids relatif (parts de marché, structure).",
      type: "Donut / camembert",
      kind: "donut",
      sample: [38, 27, 20, 15],
    },
  ];
  if (level === "premium") {
    charts.push({
      title: "Matrice de positionnement",
      goal: "Croiser deux variables stratégiques (impact × difficulté).",
      type: "Matrice 2×2 (Premium)",
      kind: "matrix",
      sample: null,
    });
  }
  return charts;
}

function buildCoaching(topic) {
  return [
    "Débit : 130-150 mots/minute — entraîne-toi avec un chronomètre.",
    "Posture : pieds ancrés, regard balayant le jury, mains au-dessus de la ceinture.",
    "Silences : 1-2 secondes après chaque transition pour marquer la structure.",
    "Reformulation : si une question te déstabilise, reformule-la avant de répondre.",
    "Voix : varie le volume sur les chiffres clés et les noms propres.",
  ];
}

export function generatePresentation({ topic, content = "", level = "standard", format = "oral" } = {}) {
  if (!topic || !String(topic).trim()) {
    throw new Error("Le sujet de l'exposé est requis.");
  }
  const cleanTopic = String(topic).trim();
  const axes = buildOutline(cleanTopic, content);
  return {
    meta: {
      topic: cleanTopic,
      level,
      format,
      generatedAt: new Date().toISOString(),
      provider: "local-skeleton",
    },
    summary: buildSummary(cleanTopic, content, level),
    problematic: buildProblematic(cleanTopic),
    introduction: buildIntro(cleanTopic, content),
    outline: axes,
    transitions: buildTransitions(axes),
    conclusion: buildConclusion(cleanTopic),
    questions: buildQuestions(cleanTopic, axes, level),
    bibliography: buildBibliography(cleanTopic),
    slides: buildSlides(cleanTopic, axes, level),
    mindmap: buildMindMap(cleanTopic, axes),
    charts: buildChartRecommendations(cleanTopic, level),
    coaching: level === "premium" ? buildCoaching(cleanTopic) : null,
  };
}

// ---------------------------------------------------------------------------
// Hooks AI — placeholders propres. Ils ne s'exécutent que si une clé/API est
// branchée par l'hôte. Voir docs/11-presentation-integrations.md pour les
// instructions de configuration côté Napkin / OpenAI / Claude.
// ---------------------------------------------------------------------------

export async function generatePresentationWithAI(input, options = {}) {
  // Si une intégration OpenAI/Claude est configurée, on devrait l'appeler ici.
  // Tant qu'aucune clé n'est présente, on retombe sur la génération locale.
  if (options.aiClient && typeof options.aiClient.generate === "function") {
    try {
      const aiResult = await options.aiClient.generate(input);
      if (aiResult) return { ...generatePresentation(input), ...aiResult, meta: { ...generatePresentation(input).meta, provider: options.aiClient.name || "ai" } };
    } catch (e) {
      // Fail-safe : on retombe sur la version locale, sans rien casser.
      console.warn("[MindPrep] AI presentation generation failed, fallback local:", e?.message || e);
    }
  }
  return generatePresentation(input);
}

export async function generateMindMapWithNapkin(presentation, options = {}) {
  // Placeholder Napkin. Renvoie la mindmap locale tant que l'API n'est pas
  // configurée. À brancher : POST https://api.napkin.ai/v1/visuals avec une
  // clé d'API et le payload `presentation.mindmap`.
  if (options.napkinClient && typeof options.napkinClient.render === "function") {
    try {
      return await options.napkinClient.render(presentation.mindmap);
    } catch (e) {
      console.warn("[MindPrep] Napkin render failed, fallback SVG local:", e?.message || e);
    }
  }
  return { provider: "local-svg", mindmap: presentation.mindmap };
}

export async function enhanceWithClaude(presentation, options = {}) {
  // Placeholder Claude — apporterait une critique pédagogique, des nuances et
  // une bibliographie élargie. Tant qu'aucun client n'est branché, on renvoie
  // l'objet tel quel pour ne rien casser.
  if (options.claudeClient && typeof options.claudeClient.refine === "function") {
    try {
      return await options.claudeClient.refine(presentation);
    } catch (e) {
      console.warn("[MindPrep] Claude refine failed, return as-is:", e?.message || e);
    }
  }
  return presentation;
}

export const PRESENTATION_INTEGRATIONS = {
  openai: { configured: false, role: "Génération et structuration du plan" },
  claude: { configured: false, role: "Raisonnement long, critique pédagogique, niveau concours" },
  napkin: { configured: false, role: "Visualisation avancée mind maps & schémas" },
  exports: {
    powerpoint: { configured: false, role: "Export .pptx (à brancher via PptxGenJS)" },
    googleSlides: { configured: false, role: "Export Google Slides via API" },
    canva: { configured: false, role: "Lien vers template Canva éditable" },
  },
};
