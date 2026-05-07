// MindPrep — Analytics QR (client-side, sans backend obligatoire)
//
// Objectif : tracer scans, type d'appareil, conversions / clics CTA pour les
// campagnes QR. Aucune API obligatoire — tout est in-memory + localStorage,
// avec des hooks `endpoint` et `onEvent` pour brancher Supabase ou un endpoint
// analytics quand il sera disponible.
//
// Aucune nouvelle API navigateur "interdite" n'est utilisée : on s'appuie
// uniquement sur localStorage, navigator.userAgent, document.referrer.

const STORAGE_KEY = 'mindprep_qr_events_v1';
const SESSION_KEY = 'mindprep_qr_session_v1';
const MAX_EVENTS = 500;

// Permet de configurer un endpoint distant ou un callback. Quand un endpoint
// est défini, les événements sont POSTés en JSON (best-effort, fire-and-forget).
let runtimeConfig = {
  endpoint: null,
  onEvent: null,
  enabled: true,
};

export function configureQRAnalytics(opts = {}) {
  runtimeConfig = { ...runtimeConfig, ...opts };
}

function safeStorage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch (_) {
    return null;
  }
}

function detectDeviceCategory() {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = (navigator.userAgent || '').toLowerCase();
  if (/ipad|tablet|playbook|silk|kindle/.test(ua)) return 'tablet';
  if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry/.test(ua)) return 'mobile';
  if (/android/.test(ua)) return 'tablet';
  return 'desktop';
}

function getOrCreateSessionId() {
  const store = safeStorage();
  if (!store) return `s_${Date.now()}`;
  let id = store.getItem(SESSION_KEY);
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    try { store.setItem(SESSION_KEY, id); } catch (_) {}
  }
  return id;
}

function readEvents() {
  const store = safeStorage();
  if (!store) return [];
  try {
    const raw = store.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function writeEvents(events) {
  const store = safeStorage();
  if (!store) return;
  try {
    const trimmed = events.slice(-MAX_EVENTS);
    store.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (_) {}
}

// Pousse l'événement vers un endpoint distant (best-effort, ne bloque jamais).
function dispatchRemote(event) {
  if (!runtimeConfig.enabled) return;
  if (typeof runtimeConfig.onEvent === 'function') {
    try { runtimeConfig.onEvent(event); } catch (_) {}
  }
  if (runtimeConfig.endpoint && typeof fetch === 'function') {
    try {
      fetch(runtimeConfig.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        keepalive: true,
      }).catch(() => {});
    } catch (_) {}
  }
}

function buildBaseEvent({ variant, type, extras } = {}) {
  return {
    type: type || 'qr_event',
    variant: variant || 'default',
    timestamp: new Date().toISOString(),
    sessionId: getOrCreateSessionId(),
    device: detectDeviceCategory(),
    referrer: typeof document !== 'undefined' ? document.referrer || null : null,
    path: typeof location !== 'undefined' ? location.pathname + location.search : null,
    ...(extras || {}),
  };
}

export function trackScan(variant = 'default', extras = {}) {
  const event = buildBaseEvent({ variant, type: 'scan', extras });
  const events = readEvents();
  events.push(event);
  writeEvents(events);
  dispatchRemote(event);
  return event;
}

export function trackCtaClick(variant = 'default', cta = 'primary', extras = {}) {
  const event = buildBaseEvent({
    variant,
    type: 'cta_click',
    extras: { cta, ...extras },
  });
  const events = readEvents();
  events.push(event);
  writeEvents(events);
  dispatchRemote(event);
  return event;
}

export function trackConversion(variant = 'default', conversionType = 'guest_enter', extras = {}) {
  const event = buildBaseEvent({
    variant,
    type: 'conversion',
    extras: { conversionType, ...extras },
  });
  const events = readEvents();
  events.push(event);
  writeEvents(events);
  dispatchRemote(event);
  return event;
}

export function getEvents() {
  return readEvents();
}

export function clearEvents() {
  const store = safeStorage();
  if (store) {
    try { store.removeItem(STORAGE_KEY); } catch (_) {}
  }
}

// Petit résumé agrégé (utile pour un dashboard léger / debug).
export function summarize() {
  const events = readEvents();
  const summary = {
    total: events.length,
    byType: {},
    byVariant: {},
    byDevice: {},
  };
  for (const ev of events) {
    summary.byType[ev.type] = (summary.byType[ev.type] || 0) + 1;
    summary.byVariant[ev.variant] = (summary.byVariant[ev.variant] || 0) + 1;
    summary.byDevice[ev.device] = (summary.byDevice[ev.device] || 0) + 1;
  }
  return summary;
}

// Lit la variante (`qr=...` ou `source=qr_...`) depuis l'URL courante.
export function readVariantFromLocation() {
  if (typeof location === 'undefined') return null;
  try {
    const params = new URLSearchParams(location.search);
    const direct = params.get('qr');
    if (direct) return direct;
    const source = params.get('source') || '';
    const m = source.match(/^qr_(.+)$/);
    if (m) return m[1];
  } catch (_) {}
  return null;
}
