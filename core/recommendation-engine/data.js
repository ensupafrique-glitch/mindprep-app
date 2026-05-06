/* ===================================================================
   Recommendation Engine — Données pédagogiques structurées MindPrep
   ===================================================================
   Modèle : niveau / classe → séries possibles → matières ; concours
   indépendants ; objectifs et difficultés transverses ; banque
   d'exercices et de mini-tests reliée par (matière, niveau).
   Aucune dépendance externe — entièrement statique.
   =================================================================== */

export const LEVELS = {
  college:    { id: "college",    label: "Collège",        order: 1, cycleLabel: "Cycle secondaire" },
  seconde:    { id: "seconde",    label: "Seconde",        order: 2, cycleLabel: "Lycée" },
  premiere:   { id: "premiere",   label: "Première",       order: 3, cycleLabel: "Lycée" },
  terminale:  { id: "terminale",  label: "Terminale",      order: 4, cycleLabel: "Lycée" },
  universite: { id: "universite", label: "Université",     order: 5, cycleLabel: "Supérieur" },
  concours:   { id: "concours",   label: "Concours",       order: 6, cycleLabel: "Préparation" },
  pro:        { id: "pro",        label: "Professionnel",  order: 7, cycleLabel: "Vie active" },
};

export const SERIES = {
  S:        { id: "S",        label: "S — Scientifique",        family: "scientifique" },
  L:        { id: "L",        label: "L — Littéraire",          family: "litteraire" },
  ES:       { id: "ES",       label: "ES — Économique & Social",family: "economique" },
  STG:      { id: "STG",      label: "STG — Gestion",            family: "gestion" },
  Sciences: { id: "Sciences", label: "Sciences",                 family: "scientifique" },
  Droit:    { id: "Droit",    label: "Droit",                    family: "juridique" },
  Economie: { id: "Economie", label: "Économie",                 family: "economique" },
  General:  { id: "General",  label: "Général",                  family: "general" },
};

export const CONCOURS = {
  BAC:   { id: "BAC",   label: "BAC",                  cycle: "lycee",     pressure: 3 },
  ADMIN: { id: "ADMIN", label: "Concours administratifs", cycle: "superieur", pressure: 4 },
  ENA:   { id: "ENA",   label: "ENA",                  cycle: "superieur", pressure: 5 },
  MED:   { id: "MED",   label: "Médecine (PASS/LAS)",  cycle: "superieur", pressure: 5 },
  BTS:   { id: "BTS",   label: "BTS",                  cycle: "superieur", pressure: 3 },
  CFJ:   { id: "CFJ",   label: "CFJ",                  cycle: "superieur", pressure: 4 },
};

export const OBJECTIVES = {
  reviser:   { id: "reviser",   label: "Réviser rapidement",   tone: "synthèse",      durationMin: 15 },
  examen:    { id: "examen",    label: "Préparer un examen",   tone: "complet",       durationMin: 45 },
  entrainer: { id: "entrainer", label: "S'entraîner",           tone: "pratique",      durationMin: 30 },
  corriger:  { id: "corriger",  label: "Corriger des copies",   tone: "correction",    durationMin: 20 },
  ameliorer: { id: "ameliorer", label: "Améliorer mes notes",  tone: "remédiation",   durationMin: 35 },
};

// Difficulté 1–5
export const DIFFICULTY = {
  1: { id: 1, label: "Découverte",    color: "#10b981" },
  2: { id: 2, label: "Initiation",    color: "#22c55e" },
  3: { id: 3, label: "Intermédiaire", color: "#3b82f6" },
  4: { id: 4, label: "Confirmé",      color: "#6366f1" },
  5: { id: 5, label: "Expert",        color: "#a855f7" },
};

// Matières par série / pathway
export const SUBJECTS = {
  // Scientifique
  mathematiques:   { id: "mathematiques",   label: "Mathématiques",       family: "scientifique" },
  physique:        { id: "physique",        label: "Physique-Chimie",     family: "scientifique" },
  svt:             { id: "svt",             label: "SVT",                 family: "scientifique" },
  biologie:        { id: "biologie",        label: "Biologie",            family: "scientifique" },
  // Littéraire
  francais:        { id: "francais",        label: "Français",            family: "litteraire" },
  philosophie:     { id: "philosophie",     label: "Philosophie",         family: "litteraire" },
  histoire:        { id: "histoire",        label: "Histoire",            family: "litteraire" },
  geographie:      { id: "geographie",      label: "Géographie",          family: "litteraire" },
  litterature:     { id: "litterature",     label: "Littérature",         family: "litteraire" },
  // Économique
  ses:             { id: "ses",             label: "Sciences économiques",family: "economique" },
  economie:        { id: "economie",        label: "Économie",            family: "economique" },
  // Gestion
  gestion:         { id: "gestion",         label: "Économie & gestion",  family: "gestion" },
  comptabilite:    { id: "comptabilite",    label: "Comptabilité",        family: "gestion" },
  management:      { id: "management",      label: "Management",          family: "gestion" },
  // Juridique
  droit_public:    { id: "droit_public",    label: "Droit public",        family: "juridique" },
  droit_constit:   { id: "droit_constit",   label: "Droit constitutionnel",family: "juridique" },
  // Concours / transverse
  culture_generale:{ id: "culture_generale",label: "Culture générale",    family: "general" },
  note_synthese:   { id: "note_synthese",   label: "Note de synthèse",    family: "general" },
  methodologie:    { id: "methodologie",    label: "Méthodologie",        family: "general" },
};

// Mapping série → matières principales (ordonnées par poids pédagogique)
export const SUBJECTS_BY_SERIE = {
  S:        ["mathematiques", "physique", "svt"],
  L:        ["philosophie", "francais", "histoire", "litterature"],
  ES:       ["ses", "mathematiques", "histoire"],
  STG:      ["gestion", "comptabilite", "management"],
  Sciences: ["physique", "mathematiques", "svt"],
  Droit:    ["droit_constit", "droit_public", "culture_generale"],
  Economie: ["economie", "ses", "mathematiques"],
  General:  ["culture_generale", "francais", "methodologie"],
};

// Mapping concours → matières prioritaires (override quand pertinent)
export const SUBJECTS_BY_CONCOURS = {
  BAC:   null, // pas d'override : on garde la série
  ADMIN: ["culture_generale", "note_synthese", "droit_public"],
  ENA:   ["culture_generale", "note_synthese", "droit_public", "economie"],
  MED:   ["biologie", "physique", "svt"],
  BTS:   ["gestion", "management", "comptabilite"],
  CFJ:   ["droit_constit", "droit_public", "note_synthese"],
};

// Banque d'exercices : question + options + sujet recommandé.
// Indexée par (subjectId, niveau) pour permettre une vraie progression.
// Niveau : 1–5 (DIFFICULTY).
export const EXERCISE_BANK = {
  mathematiques: {
    1: {
      question: "« Combien font 7 × 8 ? »",
      options: ["A · 54", "B · 56", "C · 64"],
      correct: 1,
      topic: "Réviser les tables de multiplication jusqu'à 10.",
      skill: "Calcul mental",
      durationMin: 10,
    },
    2: {
      question: "« Résous : 2x + 5 = 11. »",
      options: ["A · x = 2", "B · x = 3", "C · x = 4"],
      correct: 1,
      topic: "Équations du premier degré : isoler l'inconnue.",
      skill: "Algèbre élémentaire",
      durationMin: 15,
    },
    3: {
      question: "« Quelle est la dérivée de f(x) = 3x² + 2x ? »",
      options: ["A · 6x + 2", "B · 3x + 2", "C · 6x"],
      correct: 0,
      topic: "Dérivation de polynômes : règles de base.",
      skill: "Calcul différentiel",
      durationMin: 20,
    },
    4: {
      question: "« Quelle est la dérivée de f(x) = x² ? »",
      options: ["A · 2", "B · 2x", "C · x"],
      correct: 1,
      topic: "Étudier la fonction f(x) = x³ - 3x + 2 et tracer sa courbe représentative.",
      skill: "Étude de fonction",
      durationMin: 30,
    },
    5: {
      question: "« lim(x→0) sin(x)/x = ? »",
      options: ["A · 0", "B · 1", "C · ∞"],
      correct: 1,
      topic: "Limites usuelles et théorèmes d'encadrement (épreuve concours).",
      skill: "Analyse avancée",
      durationMin: 45,
    },
  },
  physique: {
    2: {
      question: "« Quelle est l'unité de la force ? »",
      options: ["A · Joule", "B · Newton", "C · Pascal"],
      correct: 1,
      topic: "Identifier les unités SI des grandeurs mécaniques.",
      skill: "Grandeurs et unités",
      durationMin: 15,
    },
    4: {
      question: "« Énergie cinétique d'un objet de masse m à la vitesse v ? »",
      options: ["A · mv", "B · ½ m v²", "C · m g h"],
      correct: 1,
      topic: "Démontrer la conservation de l'énergie mécanique d'un pendule simple.",
      skill: "Énergétique",
      durationMin: 30,
    },
    5: {
      question: "« Équation de Schrödinger stationnaire ? »",
      options: ["A · Ĥψ = Eψ", "B · F = ma", "C · E = mc²"],
      correct: 0,
      topic: "Mécanique quantique : puits de potentiel infini (concours médecine/prépa).",
      skill: "Physique quantique",
      durationMin: 45,
    },
  },
  svt: {
    3: {
      question: "« Quelle molécule porte l'information génétique ? »",
      options: ["A · ARN", "B · ADN", "C · Protéine"],
      correct: 1,
      topic: "Structure de l'ADN et réplication semi-conservative.",
      skill: "Génétique moléculaire",
      durationMin: 20,
    },
    5: {
      question: "« Étape limitante du cycle de Krebs ? »",
      options: ["A · Citrate synthase", "B · Isocitrate déshydrogénase", "C · Fumarase"],
      correct: 1,
      topic: "Bioénergétique cellulaire et régulation enzymatique (PASS/LAS).",
      skill: "Biochimie",
      durationMin: 40,
    },
  },
  biologie: {
    4: {
      question: "« Combien d'ATP nets produit la glycolyse ? »",
      options: ["A · 2", "B · 4", "C · 36"],
      correct: 0,
      topic: "Glycolyse : étapes, bilan énergétique et régulation.",
      skill: "Métabolisme",
      durationMin: 25,
    },
    5: {
      question: "« Quel récepteur déclenche la transduction par AMPc ? »",
      options: ["A · RCPG / Gs", "B · Récepteur ionotrope", "C · Récepteur nucléaire"],
      correct: 0,
      topic: "Signalisation cellulaire et seconds messagers (PACES/PASS).",
      skill: "Physiologie cellulaire",
      durationMin: 40,
    },
  },
  philosophie: {
    3: {
      question: "« Qui a écrit « L'existence précède l'essence » ? »",
      options: ["A · Descartes", "B · Sartre", "C · Kant"],
      correct: 1,
      topic: "Dissertation : « Faut-il craindre la technique ? » — plan en 3 parties.",
      skill: "Dissertation philosophique",
      durationMin: 30,
    },
    4: {
      question: "« La liberté est-elle absence de contrainte ? »",
      options: ["A · Oui, totalement", "B · Non, elle suppose une règle", "C · Cela dépend du contexte"],
      correct: 1,
      topic: "Construire une dissertation : thèse, antithèse, synthèse.",
      skill: "Argumentation",
      durationMin: 45,
    },
  },
  francais: {
    2: {
      question: "« Quelle figure de style : « la nature pleure » ? »",
      options: ["A · Métaphore", "B · Personnification", "C · Comparaison"],
      correct: 1,
      topic: "Repérer les figures de style dans un texte poétique.",
      skill: "Analyse stylistique",
      durationMin: 20,
    },
    4: {
      question: "« Auteur des Fleurs du Mal ? »",
      options: ["A · Rimbaud", "B · Baudelaire", "C · Verlaine"],
      correct: 1,
      topic: "Commentaire composé : « Spleen LXXVIII » de Baudelaire.",
      skill: "Commentaire littéraire",
      durationMin: 40,
    },
  },
  histoire: {
    3: {
      question: "« Année de la chute du mur de Berlin ? »",
      options: ["A · 1985", "B · 1989", "C · 1991"],
      correct: 1,
      topic: "La fin de la guerre froide : ruptures et continuités (1985-1991).",
      skill: "Repères chronologiques",
      durationMin: 25,
    },
  },
  litterature: {
    4: {
      question: "« Mouvement littéraire de Zola ? »",
      options: ["A · Romantisme", "B · Naturalisme", "C · Symbolisme"],
      correct: 1,
      topic: "Le naturalisme : doctrine, méthode, postérité.",
      skill: "Histoire littéraire",
      durationMin: 30,
    },
  },
  geographie: {
    3: {
      question: "« Capitale économique du Sénégal ? »",
      options: ["A · Saint-Louis", "B · Dakar", "C · Thiès"],
      correct: 1,
      topic: "Métropolisation et inégalités territoriales en Afrique de l'Ouest.",
      skill: "Géographie urbaine",
      durationMin: 25,
    },
  },
  ses: {
    4: {
      question: "« Qu'est-ce que l'élasticité-prix de la demande ? »",
      options: ["A · Variation du PIB", "B · Sensibilité de la demande au prix", "C · Taux d'inflation"],
      correct: 1,
      topic: "Analyser les effets d'une hausse des taux directeurs sur la croissance.",
      skill: "Microéconomie appliquée",
      durationMin: 30,
    },
  },
  economie: {
    4: {
      question: "« Que désigne le PIB ? »",
      options: ["A · Produit intérieur brut", "B · Politique d'investissement", "C · Pouvoir d'achat"],
      correct: 0,
      topic: "Synthèse : politique monétaire vs politique budgétaire en zone euro.",
      skill: "Macroéconomie",
      durationMin: 35,
    },
    5: {
      question: "« L'effet Balassa-Samuelson explique : »",
      options: ["A · L'inflation des biens non-échangeables", "B · La parité de pouvoir d'achat parfaite", "C · La courbe de Phillips"],
      correct: 0,
      topic: "Économie internationale : modèles de change et productivité (concours).",
      skill: "Économie avancée",
      durationMin: 50,
    },
  },
  gestion: {
    3: {
      question: "« Que mesure la marge commerciale ? »",
      options: ["A · CA - achats consommés", "B · Le bénéfice net", "C · Les charges fixes"],
      correct: 0,
      topic: "Cas pratique : calcul du seuil de rentabilité d'une PME.",
      skill: "Gestion financière",
      durationMin: 25,
    },
  },
  comptabilite: {
    3: {
      question: "« Le bilan présente : »",
      options: ["A · Les flux d'une période", "B · La situation patrimoniale à une date", "C · Les budgets prévisionnels"],
      correct: 1,
      topic: "Lire un bilan : actif, passif, équilibre.",
      skill: "Comptabilité générale",
      durationMin: 25,
    },
  },
  management: {
    3: {
      question: "« Selon Mintzberg, combien de configurations organisationnelles ? »",
      options: ["A · 3", "B · 5", "C · 7"],
      correct: 1,
      topic: "Comparer deux configurations Mintzberg dans un cas d'entreprise.",
      skill: "Organisation",
      durationMin: 25,
    },
  },
  droit_public: {
    4: {
      question: "« Le Conseil d'État est : »",
      options: ["A · Juge constitutionnel", "B · Juge administratif suprême", "C · Cour des comptes"],
      correct: 1,
      topic: "Rôle et compétences du Conseil d'État dans l'ordre administratif.",
      skill: "Droit administratif",
      durationMin: 35,
    },
  },
  droit_constit: {
    3: {
      question: "« Quel principe garantit la séparation des pouvoirs ? »",
      options: ["A · Article 1er DDHC", "B · Théorie de Montesquieu", "C · Code Napoléon"],
      correct: 1,
      topic: "Commentaire : décision du Conseil constitutionnel n° 71-44 DC.",
      skill: "Commentaire d'arrêt",
      durationMin: 30,
    },
  },
  culture_generale: {
    3: {
      question: "« Auteur de « De la démocratie en Amérique » ? »",
      options: ["A · Rousseau", "B · Tocqueville", "C · Montesquieu"],
      correct: 1,
      topic: "Note de lecture : Tocqueville et la démocratie moderne.",
      skill: "Culture politique",
      durationMin: 25,
    },
    5: {
      question: "« Quelle institution publie le rapport « État de la France » ? »",
      options: ["A · Sénat", "B · CESE", "C · Cour des comptes"],
      correct: 1,
      topic: "Préparer une dissertation de culture G : structurer 3 parties argumentées.",
      skill: "Dissertation concours",
      durationMin: 50,
    },
  },
  note_synthese: {
    4: {
      question: "« Une note de synthèse doit être : »",
      options: ["A · Un commentaire personnel", "B · Une reformulation neutre et structurée du dossier", "C · Un résumé chronologique"],
      correct: 1,
      topic: "Construire un plan en 2 parties / 2 sous-parties à partir d'un dossier de 20 pages.",
      skill: "Synthèse de documents",
      durationMin: 60,
    },
  },
  methodologie: {
    1: {
      question: "« Première étape d'une bonne révision ? »",
      options: ["A · Tout relire", "B · Identifier ses points faibles", "C · Refaire tout le cours"],
      correct: 1,
      topic: "Diagnostic en 5 minutes : repérer ses 3 chapitres les plus fragiles.",
      skill: "Méthode de travail",
      durationMin: 10,
    },
  },
};

// Niveau de difficulté par défaut selon le niveau scolaire
export const DEFAULT_DIFFICULTY_BY_LEVEL = {
  college:    2,
  seconde:    2,
  premiere:   3,
  terminale:  4,
  universite: 4,
  concours:   5,
  pro:        4,
};

// Feedback IA modulé par objectif × concours
export const FEEDBACK_TEMPLATES = {
  reviser:   "« Bonne synthèse sur {subject}. Retiens les notions clés et révise par fiches courtes adaptées à {context}. »",
  examen:    "« Démarche solide en {subject}. Justifie davantage l'étape 2 et conclus avec un schéma — {context}. »",
  entrainer: "« Bon rythme en {subject} : enchaîne 3 exercices supplémentaires pour ancrer la méthode {context}. »",
  corriger:  "« Copie {subject} corrigée : 13/20. Améliore la transition partie 2 → 3 ({context}). »",
  ameliorer: "« +1,5 pt potentiel en {subject} : revois les définitions et soigne la rédaction pour {context}. »",
};

// Score moyen attendu (sur 20) selon niveau × concours (légère pondération)
export const SCORE_BY_LEVEL = {
  college: 12.5, seconde: 13.2, premiere: 13.8, terminale: 14.5,
  universite: 15.1, concours: 15.8, pro: 16.4,
};

// Polylines de progression (visuel SVG)
export const POLYLINE_BY_LEVEL = {
  college:    "0,60 50,55 100,52 150,46 200,42 250,38 300,34",
  seconde:    "0,58 50,52 100,48 150,42 200,38 250,34 300,30",
  premiere:   "0,56 50,50 100,44 150,38 200,32 250,28 300,24",
  terminale:  "0,55 50,48 100,42 150,30 200,28 250,18 300,12",
  universite: "0,52 50,44 100,36 150,28 200,22 250,16 300,10",
  concours:   "0,50 50,42 100,32 150,24 200,18 250,12 300,6",
  pro:        "0,48 50,38 100,28 150,20 200,14 250,10 300,4",
};

export const STATS_BY_LEVEL = {
  college:    { courses: 6,  copies: 3,  progress: 52 },
  seconde:    { courses: 8,  copies: 5,  progress: 58 },
  premiere:   { courses: 10, copies: 7,  progress: 62 },
  terminale:  { courses: 12, copies: 9,  progress: 68 },
  universite: { courses: 18, copies: 12, progress: 74 },
  concours:   { courses: 24, copies: 18, progress: 80 },
  pro:        { courses: 30, copies: 22, progress: 85 },
};
