/* ===================================================================
   Recommendation History — Persistence légère pour le mode invité
   ===================================================================
   Sauvegarde dans localStorage si disponible, sinon repli en mémoire.
   Aucun crash si le storage est désactivé (mode privé / quotas).
   =================================================================== */

const STORAGE_KEY = "mindprep_reco_history_v1";
const MAX_EVENTS = 50;

let memoryStore = null;

function safeRead() {
  try {
    if (typeof localStorage === "undefined") return memoryStore;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return memoryStore;
  }
}

function safeWrite(value) {
  memoryStore = value;
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (err) {
    // silence : on garde la copie mémoire
  }
}

export function loadHistory() {
  const data = safeRead();
  if (data && Array.isArray(data.events)) return data;
  return { profile: null, events: [], scoreOffset: 0 };
}

export function saveProfile(profile) {
  const h = loadHistory();
  h.profile = { ...profile, ts: Date.now() };
  safeWrite(h);
  return h;
}

export function recordEvent(event) {
  const h = loadHistory();
  const enriched = { ...event, ts: Date.now() };
  h.events.unshift(enriched);
  if (h.events.length > MAX_EVENTS) h.events.length = MAX_EVENTS;

  // Adaptation lightweight : ajuste un offset de score selon les bonnes réponses
  if (event.type === "quiz_answer") {
    const delta = event.correct ? 0.2 : -0.1;
    h.scoreOffset = Math.max(-2, Math.min(2, (h.scoreOffset || 0) + delta));
  }
  safeWrite(h);
  return h;
}

export function clearHistory() {
  memoryStore = null;
  try {
    if (typeof localStorage !== "undefined") localStorage.removeItem(STORAGE_KEY);
  } catch (err) { /* noop */ }
}

export function getRecentEventsBySubject(subjectId, limit = 5) {
  const h = loadHistory();
  return h.events.filter(e => e.subjectId === subjectId).slice(0, limit);
}

export function countAttempts(subjectId) {
  const h = loadHistory();
  return h.events.filter(e => e.type === "quiz_answer" && e.subjectId === subjectId).length;
}
