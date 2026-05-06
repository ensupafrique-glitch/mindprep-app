/* ===================================================================
   Recommendation History — état mémoire pour le mode invité
   ===================================================================
   Stockage volontairement en mémoire uniquement (module state).
   Pas d'API navigateur de persistance : l'historique se réinitialise
   au rafraîchissement, ce qui est acceptable pour le mode invité et
   compatible avec les contraintes de déploiement (scan statique).
   =================================================================== */

const MAX_EVENTS = 50;

let store = createEmpty();

function createEmpty() {
  return { profile: null, events: [], scoreOffset: 0 };
}

export function loadHistory() {
  return store;
}

export function saveProfile(profile) {
  store.profile = { ...profile, ts: Date.now() };
  return store;
}

export function recordEvent(event) {
  const enriched = { ...event, ts: Date.now() };
  store.events.unshift(enriched);
  if (store.events.length > MAX_EVENTS) store.events.length = MAX_EVENTS;

  // Adaptation lightweight : ajuste un offset de score selon les bonnes réponses
  if (event.type === "quiz_answer") {
    const delta = event.correct ? 0.2 : -0.1;
    store.scoreOffset = Math.max(-2, Math.min(2, (store.scoreOffset || 0) + delta));
  }
  return store;
}

export function clearHistory() {
  store = createEmpty();
}

export function getRecentEventsBySubject(subjectId, limit = 5) {
  return store.events.filter(e => e.subjectId === subjectId).slice(0, limit);
}

export function countAttempts(subjectId) {
  return store.events.filter(e => e.type === "quiz_answer" && e.subjectId === subjectId).length;
}
