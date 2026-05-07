// MindPrep — Landing post-scan (mobile-first)
//
// Injecte un écran d'accueil premium adapté à la variante QR scannée
// (étudiant / concours / professeur / marketing). Optimisé mobile, mais
// totalement responsive desktop. Bouton CTA principal :
//  - bascule en mode invité MindPrep si le hook global est présent
//  - sinon scrolle vers la landing principale.
// Trace l'événement `scan` à l'arrivée et `cta_click` / `conversion` au clic.

import { QR_CONFIG, getVariant } from './qr-config.js';
import {
  trackScan,
  trackCtaClick,
  trackConversion,
  readVariantFromLocation,
} from './qr-analytics.js';

const LANDING_ID = 'mindprepQrLanding';
const STYLE_ID = 'mindprepQrLandingStyles';

function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.qrl-overlay{
  position:fixed;inset:0;z-index:9999;display:flex;align-items:stretch;justify-content:center;
  background:radial-gradient(120% 80% at 0% 0%, rgba(91,92,255,0.18), transparent 60%),
             radial-gradient(120% 80% at 100% 100%, rgba(139,92,246,0.18), transparent 60%),
             linear-gradient(180deg,#f7f8fb 0%,#eef2ff 100%);
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
  color:#0b1020;overflow-y:auto;
}
.qrl-card{
  margin:auto;width:min(560px,100%);padding:28px 22px 36px;
  display:flex;flex-direction:column;gap:18px;
}
.qrl-brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:18px;}
.qrl-brand-mark{width:36px;height:36px;border-radius:10px;background:#5b5cff;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;}
.qrl-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:rgba(91,92,255,0.12);color:#5b5cff;font-weight:700;font-size:12px;letter-spacing:.02em;align-self:flex-start;}
.qrl-headline{font-size:30px;line-height:1.15;font-weight:800;margin:0;}
.qrl-sub{font-size:16px;line-height:1.5;color:#5b6478;margin:0;}
.qrl-features{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;}
.qrl-features li{display:flex;align-items:flex-start;gap:10px;background:#fff;border:1px solid rgba(15,23,42,.06);border-radius:14px;padding:12px 14px;box-shadow:0 4px 16px rgba(15,23,42,.04);}
.qrl-features li::before{content:"✓";width:24px;height:24px;border-radius:8px;background:rgba(91,92,255,.12);color:#5b5cff;display:flex;align-items:center;justify-content:center;font-weight:800;flex:none;}
.qrl-cta-row{display:flex;flex-direction:column;gap:10px;margin-top:8px;}
.qrl-cta-primary{
  appearance:none;border:0;cursor:pointer;width:100%;padding:16px 18px;border-radius:16px;
  background:linear-gradient(135deg,#5b5cff 0%,#8b5cf6 100%);color:#fff;font-weight:800;font-size:16px;
  box-shadow:0 12px 30px rgba(91,92,255,.35);transition:transform .15s ease, box-shadow .15s ease;
}
.qrl-cta-primary:hover{transform:translateY(-1px);box-shadow:0 16px 36px rgba(91,92,255,.4);}
.qrl-cta-secondary{
  appearance:none;cursor:pointer;width:100%;padding:14px 18px;border-radius:14px;
  background:#fff;color:#0b1020;font-weight:700;font-size:15px;border:1px solid rgba(15,23,42,.1);
}
.qrl-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#5b6478;font-size:12px;margin-top:6px;}
.qrl-trust{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.qrl-trust span{padding:4px 10px;border-radius:999px;background:#fff;border:1px solid rgba(15,23,42,.08);font-weight:600;font-size:12px;}
.qrl-close{
  position:absolute;top:14px;right:14px;width:36px;height:36px;border-radius:12px;border:1px solid rgba(15,23,42,.1);
  background:rgba(255,255,255,.85);backdrop-filter:blur(10px);font-size:20px;line-height:1;cursor:pointer;color:#0b1020;
}
@media (min-width: 720px){
  .qrl-card{padding:48px 32px;}
  .qrl-headline{font-size:38px;}
}
@media (prefers-color-scheme: dark){
  .qrl-overlay{background:radial-gradient(120% 80% at 0% 0%, rgba(124,125,255,0.22), transparent 60%),radial-gradient(120% 80% at 100% 100%, rgba(167,139,250,0.22), transparent 60%),linear-gradient(180deg,#0b1020 0%,#111733 100%);color:#fff;}
  .qrl-features li{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.08);box-shadow:none;color:#fff;}
  .qrl-features li::before{background:rgba(124,125,255,.18);color:#a78bfa;}
  .qrl-sub{color:#a4adc6;}
  .qrl-cta-secondary{background:rgba(255,255,255,.06);color:#fff;border-color:rgba(255,255,255,.12);}
  .qrl-trust span{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.10);color:#fff;}
  .qrl-foot{color:#a4adc6;}
  .qrl-close{background:rgba(255,255,255,.06);color:#fff;border-color:rgba(255,255,255,.12);}
}`;
  document.head.appendChild(style);
}

function buildLanding(variant) {
  const v = getVariant(variant);
  const overlay = document.createElement('div');
  overlay.className = 'qrl-overlay';
  overlay.id = LANDING_ID;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', `Bienvenue MindPrep — ${v.label}`);

  overlay.innerHTML = `
    <button type="button" class="qrl-close" aria-label="Fermer" data-qrl-close>×</button>
    <div class="qrl-card">
      <div class="qrl-brand">
        <span class="qrl-brand-mark" aria-hidden="true">M</span>
        <span>${escapeHtml(QR_CONFIG.brand)}</span>
      </div>
      <span class="qrl-pill">${escapeHtml(v.emoji)} ${escapeHtml(v.label)}</span>
      <h1 class="qrl-headline">${escapeHtml(v.headline)}</h1>
      <p class="qrl-sub">${escapeHtml(v.sub)}</p>
      <ul class="qrl-features">
        ${v.featureHighlights.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}
      </ul>
      <div class="qrl-cta-row">
        <button type="button" class="qrl-cta-primary" data-qrl-primary>${escapeHtml(v.ctaLabel)} →</button>
        <button type="button" class="qrl-cta-secondary" data-qrl-secondary>Voir la présentation</button>
      </div>
      <div class="qrl-trust" aria-hidden="false">
        <span>Sans compte</span>
        <span>IA pédagogique</span>
        <span>Mobile-first</span>
      </div>
      <div class="qrl-foot">
        <span>Scanné depuis votre mobile · MindPrep</span>
        <span>${escapeHtml(QR_CONFIG.brandTagline)}</span>
      </div>
    </div>
  `;
  return overlay;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function tryEnterGuestMode() {
  // 1) Si l'app expose un hook global, l'utiliser.
  if (typeof window !== 'undefined' && typeof window.MindPrepEnterGuest === 'function') {
    try { window.MindPrepEnterGuest(); return true; } catch (_) {}
  }
  // 2) Sinon, cliquer le premier bouton `[data-landing-enter]` (présent sur la
  //    landing principale et la nav). Mode "show value first".
  if (typeof document !== 'undefined') {
    const btn = document.querySelector('[data-landing-enter]');
    if (btn && typeof btn.click === 'function') { btn.click(); return true; }
  }
  return false;
}

function scrollToLanding() {
  if (typeof document === 'undefined') return;
  const target = document.getElementById('landing') || document.querySelector('main');
  if (target && target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function dismissQrLanding() {
  if (typeof document === 'undefined') return;
  const node = document.getElementById(LANDING_ID);
  if (node && node.parentNode) node.parentNode.removeChild(node);
}

// Monte la landing si la variante est détectée. Idempotent.
export function mountQrLanding(opts = {}) {
  if (typeof document === 'undefined') return null;
  if (document.getElementById(LANDING_ID)) return document.getElementById(LANDING_ID);
  const variant = opts.variant || readVariantFromLocation();
  if (!variant) return null;
  if (!QR_CONFIG.variants[variant]) return null;

  injectStyles();
  const node = buildLanding(variant);
  document.body.appendChild(node);

  // Tracking
  trackScan(variant, { entry: location.pathname });

  node.querySelector('[data-qrl-close]')?.addEventListener('click', () => {
    trackCtaClick(variant, 'close');
    dismissQrLanding();
  });

  node.querySelector('[data-qrl-primary]')?.addEventListener('click', () => {
    trackCtaClick(variant, 'primary');
    const ok = tryEnterGuestMode();
    if (ok) trackConversion(variant, 'guest_enter');
    dismissQrLanding();
  });

  node.querySelector('[data-qrl-secondary]')?.addEventListener('click', () => {
    trackCtaClick(variant, 'secondary');
    dismissQrLanding();
    scrollToLanding();
  });

  return node;
}

// Helper d'auto-init : à appeler depuis app.js (ou inline) au DOMContentLoaded.
export function autoInitQrLanding() {
  if (typeof document === 'undefined') return;
  const start = () => mountQrLanding();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}
