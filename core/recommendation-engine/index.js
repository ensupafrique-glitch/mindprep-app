/* ===================================================================
   RecommendationEngine — Moteur de recommandation pédagogique MindPrep
   ===================================================================
   Entrée : profil { level, serie, concours, objective }
   Sortie : recommandation cohérente (matière, exercice, mini-test,
            difficulté, durée, feedback, prochaine étape, progression).
   Utilise data.js (banque) et history.js (mémoire utilisateur invité).
   Aucun appel réseau, aucune dépendance auth.
   =================================================================== */

import {
  LEVELS, SERIES, CONCOURS, OBJECTIVES, DIFFICULTY, SUBJECTS,
  SUBJECTS_BY_SERIE, SUBJECTS_BY_CONCOURS, EXERCISE_BANK,
  DEFAULT_DIFFICULTY_BY_LEVEL, FEEDBACK_TEMPLATES,
  SCORE_BY_LEVEL, POLYLINE_BY_LEVEL, STATS_BY_LEVEL,
} from "./data.js";
import {
  loadHistory, saveProfile, recordEvent, countAttempts,
} from "./history.js";

const LEVEL_LABEL_PROGRESS = {
  college: "Niveau Découverte",
  seconde: "Niveau Initiation",
  premiere: "Niveau Intermédiaire",
  terminale: "Niveau Confirmé",
  universite: "Niveau Avancé",
  concours: "Niveau Concours",
  pro: "Niveau Pro",
};

function pickSubjects(profile) {
  const { serie, concours } = profile;
  const fromConcours = SUBJECTS_BY_CONCOURS[concours];
  if (fromConcours && fromConcours.length) return fromConcours;
  return SUBJECTS_BY_SERIE[serie] || SUBJECTS_BY_SERIE.S;
}

function pickPrimarySubject(profile) {
  const subjectIds = pickSubjects(profile);
  // Légère adaptation par historique : si l'utilisateur a échoué récemment,
  // on conserve la même matière ; sinon on pivote sur la principale.
  const recent = loadHistory().events.find(e => e.type === "quiz_answer");
  if (recent && recent.correct === false && subjectIds.includes(recent.subjectId)) {
    return recent.subjectId;
  }
  return subjectIds[0];
}

function pickDifficulty(profile) {
  const base = DEFAULT_DIFFICULTY_BY_LEVEL[profile.level] || 3;
  // Boost +1 si concours haute pression et niveau ≥ Terminale
  const concours = CONCOURS[profile.concours];
  if (concours && concours.pressure >= 5 && base >= 3) {
    return Math.min(5, base + 1);
  }
  return base;
}

function findClosestExercise(subjectId, difficulty) {
  const bank = EXERCISE_BANK[subjectId];
  if (!bank) return null;
  if (bank[difficulty]) return { ...bank[difficulty], difficulty };
  // Cherche le plus proche (haut puis bas)
  const levels = Object.keys(bank).map(Number).sort((a, b) => a - b);
  let best = levels[0];
  let bestDist = Math.abs(levels[0] - difficulty);
  for (const lvl of levels) {
    const d = Math.abs(lvl - difficulty);
    if (d < bestDist) { best = lvl; bestDist = d; }
  }
  return { ...bank[best], difficulty: best };
}

function buildContext(profile) {
  const lvl = LEVELS[profile.level] || LEVELS.terminale;
  const ser = SERIES[profile.serie] || SERIES.S;
  const con = CONCOURS[profile.concours] || CONCOURS.BAC;
  return `${lvl.label} ${ser.id} · ${con.label}`;
}

function buildBadge(profile) {
  const lvl = LEVELS[profile.level] || LEVELS.terminale;
  const ser = SERIES[profile.serie] || SERIES.S;
  const con = CONCOURS[profile.concours] || CONCOURS.BAC;
  // Ex: "Adapté à Terminale S · BAC"
  return `Adapté à ${lvl.label} ${ser.id} · ${con.label}`;
}

function buildFeedback(profile, subjectLabel) {
  const tpl = FEEDBACK_TEMPLATES[profile.objective] || FEEDBACK_TEMPLATES.examen;
  return tpl
    .replace("{subject}", subjectLabel.toLowerCase())
    .replace("{context}", buildContext(profile));
}

function buildNextStep(profile, subjectLabel, difficulty) {
  const obj = OBJECTIVES[profile.objective] || OBJECTIVES.examen;
  const next = Math.min(5, difficulty + 1);
  const map = {
    reviser:   `Continue avec une fiche de synthèse en ${subjectLabel}, puis enchaîne 3 mini-tests.`,
    examen:    `Passe à un sujet niveau ${DIFFICULTY[next].label} en ${subjectLabel} et chronomètre-toi.`,
    entrainer: `Refais 5 exercices ciblés en ${subjectLabel}, puis vise un sujet de niveau ${DIFFICULTY[next].label}.`,
    corriger:  `Soumets une copie ${subjectLabel} à l'Assistant Correction et compare la grille de notation.`,
    ameliorer: `Travaille les définitions clés en ${subjectLabel}, puis refais ce mini-test au niveau ${DIFFICULTY[next].label}.`,
  };
  return map[obj.id] || map.examen;
}

function buildProgress(profile) {
  const stats = STATS_BY_LEVEL[profile.level] || STATS_BY_LEVEL.terminale;
  const baseScore = SCORE_BY_LEVEL[profile.level] || 14.5;
  const offset = loadHistory().scoreOffset || 0;
  const score = Math.max(0, Math.min(20, baseScore + offset));
  return {
    label: LEVEL_LABEL_PROGRESS[profile.level] || "Niveau",
    score,
    scoreText: `${score.toFixed(1).replace(".", ",")} / 20`,
    progressPct: stats.progress,
    courses: stats.courses,
    copies: stats.copies,
    polyline: POLYLINE_BY_LEVEL[profile.level] || POLYLINE_BY_LEVEL.terminale,
  };
}

/**
 * Recommandation principale.
 * @param {{level:string, serie:string, concours:string, objective:string}} profile
 * @returns {object} recommendation
 */
export function recommend(profile) {
  const safe = {
    level:     profile?.level     || "terminale",
    serie:     profile?.serie     || "S",
    concours:  profile?.concours  || "BAC",
    objective: profile?.objective || "examen",
  };

  const subjectId = pickPrimarySubject(safe);
  const subject = SUBJECTS[subjectId] || SUBJECTS.mathematiques;
  const difficulty = pickDifficulty(safe);
  const exercise = findClosestExercise(subjectId, difficulty) || {
    question: "« Question indisponible. »",
    options: ["A", "B", "C"], correct: 0,
    topic: "Sujet à venir.", skill: subject.label, durationMin: 20, difficulty,
  };
  const obj = OBJECTIVES[safe.objective] || OBJECTIVES.examen;
  const progress = buildProgress(safe);
  const attempts = countAttempts(subjectId);

  return {
    profile: safe,
    badge: buildBadge(safe),
    context: buildContext(safe),
    subject: { id: subject.id, label: subject.label },
    skill: exercise.skill,
    difficulty: exercise.difficulty,
    difficultyLabel: DIFFICULTY[exercise.difficulty].label,
    difficultyColor: DIFFICULTY[exercise.difficulty].color,
    durationMin: exercise.durationMin || obj.durationMin,
    miniTest: {
      question: exercise.question,
      options: exercise.options,
      correct: exercise.correct,
    },
    topic: { text: exercise.topic, level: exercise.difficulty },
    feedback: buildFeedback(safe, subject.label),
    nextStep: buildNextStep(safe, subject.label, exercise.difficulty),
    progress,
    history: { attempts },
  };
}

export function rememberProfile(profile) {
  return saveProfile(profile);
}

export function rememberQuizAnswer({ subjectId, correct, difficulty }) {
  return recordEvent({ type: "quiz_answer", subjectId, correct, difficulty });
}

export function rememberSubjectView(subjectId) {
  return recordEvent({ type: "subject_view", subjectId });
}

export {
  LEVELS, SERIES, CONCOURS, OBJECTIVES, DIFFICULTY,
  SUBJECTS, SUBJECTS_BY_SERIE, SUBJECTS_BY_CONCOURS,
};
