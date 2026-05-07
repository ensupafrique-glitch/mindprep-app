// MindPrep — Presentation Engine
// Génère localement un squelette d'exposé structuré (plan, slides, mind map,
// arbre logique, graphiques, synthèse visuelle, mode oral, questions du jury).
// Les hooks AI (OpenAI/Claude/Napkin) sont préparés mais non branchés tant
// qu'aucune clé n'est configurée.

const STOPWORDS = new Set([
  "le","la","les","un","une","des","de","du","et","ou","à","au","aux","en",
  "pour","par","sur","dans","avec","sans","ce","cet","cette","ces","que",
  "qui","quoi","dont","où","est","sont","être","avoir","plus","moins","ne",
  "pas","ni","si","comme","mais","donc","or","car","aussi","alors","leur",
  "leurs","son","sa","ses","mon","ma","mes","ton","ta","tes","nos","vos",
  "ils","elles","nous","vous","je","tu","il","elle","on","y","the","and",
  "for","with","that","this","from","into","they","have","were","been"
]);

// Catalogue centralisé — sert au formulaire et à la génération.
export const ACADEMIC_LEVELS = [
  { value: "college", label: "Collège", register: "vulgarisation accessible" },
  { value: "lycee", label: "Lycée", register: "structure académique standard" },
  { value: "universite", label: "Université", register: "rigueur conceptuelle, distance critique" },
  { value: "concours", label: "Concours", register: "exigence concours, problématisation forte" },
  { value: "professionnel", label: "Professionnel", register: "ton expert, posture stratégique" },
];

export const PRESENTATION_TYPES = [
  { value: "expose", label: "Exposé académique", structure: "intro · 3 parties · conclusion" },
  { value: "dissertation", label: "Dissertation", structure: "thèse · antithèse · synthèse" },
  { value: "presentation", label: "Présentation", structure: "accroche · idées · ouverture" },
  { value: "synthese", label: "Synthèse", structure: "panorama · axes croisés · enseignements" },
  { value: "analyse", label: "Analyse", structure: "objet · méthode · résultats · discussion" },
  { value: "plan", label: "Plan détaillé", structure: "arborescence I/II/III + sous-parties" },
  { value: "fiche", label: "Fiche orale", structure: "talking points + relances" },
  { value: "support", label: "Support visuel", structure: "slides + visuels narratifs" },
];

export const TONES = [
  { value: "academique", label: "Académique" },
  { value: "pedagogique", label: "Pédagogique" },
  { value: "vulgarise", label: "Vulgarisé" },
  { value: "engage", label: "Engagé" },
  { value: "professionnel", label: "Professionnel" },
];

export const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

function getLevelMeta(level) {
  return ACADEMIC_LEVELS.find((l) => l.value === level) || ACADEMIC_LEVELS[1];
}
function getTypeMeta(type) {
  return PRESENTATION_TYPES.find((t) => t.value === type) || PRESENTATION_TYPES[0];
}
function getToneMeta(tone) {
  return TONES.find((t) => t.value === tone) || TONES[0];
}

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

function deriveAxes(topic, content, type) {
  const kws = extractKeywords(`${topic} ${content || ""}`, 12);
  // Selon le type de présentation, on choisit une trame différente.
  let angles;
  switch (type) {
    case "dissertation":
      angles = [
        { title: "Thèse", lens: "défendre la position première, arguments principaux" },
        { title: "Antithèse", lens: "objections, contre-exemples, limites" },
        { title: "Synthèse", lens: "dépassement, position nuancée, ouverture" },
      ];
      break;
    case "analyse":
      angles = [
        { title: "Objet et hypothèses", lens: "définir le champ et les questions" },
        { title: "Méthode et observations", lens: "outils mobilisés, données, résultats" },
        { title: "Discussion et portée", lens: "interpréter, mettre en perspective" },
      ];
      break;
    case "synthese":
      angles = [
        { title: "Panorama des positions", lens: "cartographier les approches existantes" },
        { title: "Axes de convergence", lens: "ce qui rapproche les analyses" },
        { title: "Tensions persistantes", lens: "ce qui oppose et restera à trancher" },
      ];
      break;
    case "presentation":
    case "support":
      angles = [
        { title: "Pourquoi maintenant ?", lens: "contexte, signal, opportunité" },
        { title: "Comment ça marche ?", lens: "mécanismes clés, exemples saillants" },
        { title: "Et après ?", lens: "implications, prochaines étapes, appel à action" },
      ];
      break;
    case "fiche":
      angles = [
        { title: "Idées-clés", lens: "messages indispensables à transmettre" },
        { title: "Exemples vivants", lens: "preuves, anecdotes, données" },
        { title: "Relances et pivots", lens: "phrases-pont si l'auditoire décroche" },
      ];
      break;
    case "plan":
    case "expose":
    default:
      angles = [
        { title: "Cadrage et enjeux", lens: "définir, contextualiser, poser le problème" },
        { title: "Mécanismes et dynamiques", lens: "expliquer, articuler les causes et effets" },
        { title: "Limites, débats et perspectives", lens: "nuancer, ouvrir, projeter" },
      ];
  }
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

function buildOptimizedTitle(topic, type, level) {
  const t = String(topic).trim();
  const lvl = getLevelMeta(level);
  const typ = getTypeMeta(type);
  // Quelques formes pédagogiques selon le type.
  if (type === "dissertation") return `${t} — Thèse, antithèse, synthèse · ${lvl.label}`;
  if (type === "analyse") return `${t} : analyse critique pour le niveau ${lvl.label}`;
  if (type === "synthese") return `Synthèse raisonnée — ${t}`;
  if (type === "fiche") return `Fiche orale — ${t}`;
  if (type === "support") return `${t} · ${typ.label}`;
  return `${t} — ${typ.label} (${lvl.label})`;
}

function buildIntro(topic, content, level, tone) {
  const kws = extractKeywords(`${topic} ${content || ""}`, 3);
  const lvl = getLevelMeta(level);
  const tn = getToneMeta(tone);
  const accroche = kws[0]
    ? `Lorsqu'on évoque ${kws[0].toLowerCase()}, on touche à un enjeu central de notre époque.`
    : `Le sujet « ${topic} » interroge directement notre rapport au monde contemporain.`;
  const cadre = `Cette présentation, conçue pour un registre ${tn.label.toLowerCase()} et un public ${lvl.label.toLowerCase()}, propose de revenir sur les notions-clés, d'en analyser les ressorts puis d'en discuter les limites.`;
  return `${accroche} ${cadre} Nous verrons en quoi ${String(topic).toLowerCase()} mérite une lecture nuancée.`;
}

function buildContext(topic, content) {
  const kws = extractKeywords(`${topic} ${content || ""}`, 4);
  const liste = kws.slice(0, 3).join(", ").toLowerCase() || "les notions essentielles";
  return `Contexte : le sujet s'inscrit dans un faisceau de débats et de pratiques actuels — notamment autour de ${liste}. Avant d'entrer dans la démonstration, il faut définir le périmètre et préciser les angles que cet exposé n'aborde pas.`;
}

function buildProblematic(topic, type) {
  const t = String(topic).toLowerCase();
  if (type === "dissertation") {
    return `Dans quelle mesure ${t} appelle-t-il une réponse univoque, et quelles tensions principales structurent les positions opposées ?`;
  }
  if (type === "analyse") {
    return `Quels mécanismes expliquent ${t}, et que révèle son étude sur les dynamiques en jeu ?`;
  }
  return `En quoi ${t} constitue-t-il un objet d'étude révélateur, et quelles tensions principales structurent les débats actuels ?`;
}

function buildConclusion(topic, type) {
  const t = String(topic).toLowerCase();
  if (type === "dissertation") {
    return `La synthèse appelle une position nuancée : ${t} ne se réduit ni à une lecture optimiste ni à une critique radicale. Reste à interroger les conditions sociales et politiques qui rendent ce dépassement possible.`;
  }
  return `Au terme de cette analyse, ${t} apparaît comme un sujet à entrées multiples : il combine une dimension descriptive, une dimension explicative et une dimension critique. La question reste ouverte : comment continuer à le penser à mesure que les contextes évoluent ?`;
}

function buildTransitions(axes) {
  const t = [];
  for (let i = 0; i < axes.length - 1; i++) {
    t.push(`Après avoir posé ${axes[i].title.toLowerCase()}, on peut désormais s'interroger sur ${axes[i + 1].title.toLowerCase()}.`);
  }
  t.push("Avant de conclure, récapitulons brièvement les fils conducteurs de la réflexion.");
  return t;
}

function buildSummary(topic, content, level, type, durationMin) {
  const lvl = getLevelMeta(level);
  const typ = getTypeMeta(type);
  const dur = durationMin ? `Format ~${durationMin} min.` : "";
  const adv = level === "concours" || level === "universite"
    ? "L'analyse intègre une critique des sources, une mise en perspective historique et une ouverture interdisciplinaire."
    : "La structure est claire, en trois temps cohérents, accessibles à un public non-spécialiste.";
  return `${typ.label} structuré sur « ${topic} » — registre ${lvl.register}. ${dur} ${adv}`.trim();
}

function buildQuestions(topic, axes, level) {
  const base = [
    `Comment définiriez-vous précisément ${String(topic).toLowerCase()} ?`,
    `Quels contre-arguments pourriez-vous opposer à votre propre démonstration ?`,
    `Sur quelle source vous appuyez-vous principalement, et pourquoi ?`,
    `Quel exemple illustre le mieux votre deuxième partie ?`,
    `Comment ce sujet pourrait-il évoluer dans les 10 prochaines années ?`,
  ];
  if (level === "concours" || level === "universite") {
    base.push(
      `Pouvez-vous reformuler votre problématique en une phrase ?`,
      `Quelle objection méthodologique acceptez-vous, et laquelle rejetez-vous ?`,
      `Quelle école de pensée vous semble la plus solide pour traiter ${String(topic).toLowerCase()} ?`,
    );
  }
  return base;
}

function buildBibliography(topic) {
  const t = String(topic).toLowerCase();
  return [
    `Manuel de référence du programme — chapitre traitant de ${t}.`,
    `Article académique récent (Cairn, Persée, JSTOR) — à choisir selon ta discipline.`,
    `Source primaire ou rapport officiel (INSEE, OCDE, ONU, ministère…) à confronter.`,
    `Interview ou conférence vidéo (France Culture, Radio France, YouTube académique).`,
  ];
}

function buildSlides(topic, axes, level, type, durationMin) {
  const slides = [
    { num: "01", title: topic, body: "Diapositive de titre — nom, classe, date.", tag: "Titre" },
    { num: "02", title: "Contexte", body: "Pourquoi ce sujet aujourd'hui ? Cadrage en 2-3 phrases.", tag: "Contexte" },
    { num: "03", title: "Problématique", body: buildProblematic(topic, type), tag: "Problème" },
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
    body: buildConclusion(topic, type),
    tag: "Synthèse",
  });
  slides.push({
    num: String(slides.length + 1).padStart(2, "0"),
    title: "Questions",
    body: "Merci pour votre attention. Place aux questions du jury.",
    tag: "Échange",
  });
  if (level === "concours" || level === "universite") {
    slides.splice(slides.length - 1, 0, {
      num: String(slides.length).padStart(2, "0"),
      title: "Ouverture critique",
      body: "Une question prospective ou interdisciplinaire — montre que tu vas plus loin.",
      tag: "Premium",
    });
  }
  // Si présentation longue, on dédouble les axes.
  if (durationMin && durationMin >= 20) {
    axes.forEach((a, i) => {
      slides.splice(4 + i * 2, 0, {
        num: "··",
        title: `${a.title.replace(/^\d+\.\s*/, "")} — détail`,
        body: a.sub[2] || "Approfondissement avec un cas d'étude long.",
        tag: `Partie ${i + 1} bis`,
      });
    });
  }
  // Re-numérote proprement.
  slides.forEach((s, i) => { s.num = String(i + 1).padStart(2, "0"); });
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

// Construit un arbre logique (structure I/II/III avec sous-feuilles).
// Retourne aussi un format Mermaid pour les hôtes qui souhaitent le rendre.
function buildLogicalTree(topic, axes) {
  const root = {
    id: "root",
    label: topic,
    children: axes.map((a, i) => ({
      id: `n${i + 1}`,
      label: a.title.replace(/^\d+\.\s*/, ""),
      children: a.sub.map((s, j) => ({
        id: `n${i + 1}-${j + 1}`,
        label: s.replace(/^.+?:\s*/, ""),
      })),
    })),
  };
  // Mermaid (graph TD) — utilisé si Mermaid est disponible côté hôte.
  const lines = ["graph TD"];
  lines.push(`  root["${escapeMermaid(topic)}"]`);
  root.children.forEach((c) => {
    lines.push(`  root --> ${c.id}["${escapeMermaid(c.label)}"]`);
    c.children.forEach((g) => {
      lines.push(`  ${c.id} --> ${g.id}["${escapeMermaid(g.label)}"]`);
    });
  });
  return { tree: root, mermaid: lines.join("\n") };
}

function escapeMermaid(s) {
  return String(s).replace(/"/g, "'").replace(/\n/g, " ");
}

// Synthèse visuelle : extrait des "key ideas" et leur attribue un poids.
// Renvoie un payload exploitable par un widget bullet/heat ou par Napkin.
function buildVisualSynthesis(topic, content, axes) {
  const kws = extractKeywords(`${topic} ${content || ""}`, 6);
  const baseline = kws.length ? kws : axes.map((a) => a.title.replace(/^\d+\.\s*/, ""));
  const ideas = baseline.slice(0, 5).map((label, i) => ({
    label,
    weight: 100 - i * 14,
    angle: i,
  }));
  return {
    title: `Synthèse visuelle — ${topic}`,
    ideas,
    pillars: axes.map((a) => a.title.replace(/^\d+\.\s*/, "")),
    suggestion: "Pour un rendu pro, branche Napkin API ou exporte ce JSON dans un outil de dataviz.",
  };
}

function buildChartRecommendations(topic, level) {
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
  if (level === "concours" || level === "universite" || level === "professionnel") {
    charts.push({
      title: "Matrice de positionnement",
      goal: "Croiser deux variables stratégiques (impact × difficulté).",
      type: "Matrice 2×2 (Premium)",
      kind: "matrix",
      sample: null,
      premium: true,
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

// Mode "Préparation orale IA" : résumé oral, talking points, questions probables, conseils.
function buildOralPreparation(topic, axes, level, durationMin) {
  const tps = (durationMin || 10);
  const perPart = Math.max(1, Math.round((tps - 2) / Math.max(axes.length, 1)));
  return {
    summary: `Tu as ${tps} minutes pour défendre « ${topic} ». 1 minute d'intro, ${perPart} minute(s) par partie, 1 minute de conclusion. Pose ta voix dès la première phrase et regarde l'auditoire.`,
    talkingPoints: axes.map((a, i) => ({
      part: `Partie ${i + 1}`,
      point: a.title.replace(/^\d+\.\s*/, ""),
      cue: a.sub[0]?.replace(/^.+?:\s*/, "") || "Définition rapide puis exemple",
    })),
    likelyQuestions: buildQuestions(topic, axes, level).slice(0, 5),
    advice: buildCoaching(topic),
    rhythm: {
      intro: "1 min",
      development: `${perPart} min × ${axes.length}`,
      conclusion: "1 min",
      qa: "5 min réservées au jury",
    },
  };
}

export function generatePresentation(input = {}) {
  const {
    topic,
    content = "",
    level = "lycee",
    type = "expose",
    duration = 10,
    language = "fr",
    tone = "academique",
    // Conserve la rétro-compat avec l'ancien champ `format`.
    format,
  } = input;

  if (!topic || !String(topic).trim()) {
    throw new Error("Le sujet de l'exposé est requis.");
  }
  // L'ancien `format` (oral|slides|mindmap|report) est traité comme un type.
  const effectiveType = format && PRESENTATION_TYPES.some((t) => t.value === format) ? format : type;
  // L'ancien niveau "premium" est mappé sur "concours" pour les compteurs internes.
  const effectiveLevel = level === "premium" ? "concours" : (level === "standard" ? "lycee" : level);

  const cleanTopic = String(topic).trim();
  const axes = deriveAxes(cleanTopic, content, effectiveType);
  const tree = buildLogicalTree(cleanTopic, axes);
  const dur = Number(duration) || 10;

  return {
    meta: {
      topic: cleanTopic,
      level: effectiveLevel,
      type: effectiveType,
      duration: dur,
      language,
      tone,
      generatedAt: new Date().toISOString(),
      provider: "local-skeleton",
    },
    title: buildOptimizedTitle(cleanTopic, effectiveType, effectiveLevel),
    summary: buildSummary(cleanTopic, content, effectiveLevel, effectiveType, dur),
    context: buildContext(cleanTopic, content),
    problematic: buildProblematic(cleanTopic, effectiveType),
    introduction: buildIntro(cleanTopic, content, effectiveLevel, tone),
    outline: axes,
    transitions: buildTransitions(axes),
    conclusion: buildConclusion(cleanTopic, effectiveType),
    questions: buildQuestions(cleanTopic, axes, effectiveLevel),
    bibliography: buildBibliography(cleanTopic),
    slides: buildSlides(cleanTopic, axes, effectiveLevel, effectiveType, dur),
    mindmap: buildMindMap(cleanTopic, axes),
    logicalTree: tree,
    visualSynthesis: buildVisualSynthesis(cleanTopic, content, axes),
    charts: buildChartRecommendations(cleanTopic, effectiveLevel),
    oral: buildOralPreparation(cleanTopic, axes, effectiveLevel, dur),
    coaching: (effectiveLevel === "concours" || effectiveLevel === "universite") ? buildCoaching(cleanTopic) : null,
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
      if (aiResult) {
        const local = generatePresentation(input);
        return { ...local, ...aiResult, meta: { ...local.meta, provider: options.aiClient.name || "ai" } };
      }
    } catch (e) {
      console.warn("[MindPrep] AI presentation generation failed, fallback local:", e?.message || e);
    }
  }
  return generatePresentation(input);
}

// Adapter OpenAI — à brancher avec une clé côté serveur (ne jamais exposer en
// clair côté client). Renvoie null si non configuré.
export async function generateWithOpenAI(input, { apiKey, model = "gpt-4o-mini", endpoint = "/api/openai/presentations" } = {}) {
  if (!apiKey && typeof endpoint !== "string") return null;
  // Implémentation type — à adapter à votre proxy serveur.
  // const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input, model }) });
  // if (!res.ok) return null;
  // return await res.json();
  return null;
}

// Adapter Claude (Anthropic) — pour les niveaux concours / dissertations.
export async function generateWithClaude(input, { apiKey, model = "claude-opus-4-7", endpoint = "/api/claude/presentations" } = {}) {
  if (!apiKey && typeof endpoint !== "string") return null;
  // const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input, model }) });
  // if (!res.ok) return null;
  // return await res.json();
  return null;
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
  mermaid: { configured: false, role: "Rendu local des arbres logiques" },
  exports: {
    pdf: { configured: true, role: "Export texte/PDF basique côté client" },
    word: { configured: true, role: "Export .doc HTML compatible Word" },
    powerpoint: { configured: false, role: "Export .pptx (à brancher via PptxGenJS, Premium)" },
    googleSlides: { configured: false, role: "Export Google Slides via API" },
    canva: { configured: false, role: "Lien vers template Canva éditable" },
  },
};
