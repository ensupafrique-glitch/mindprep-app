// MindPrep — Système QR Code premium (point d'entrée)
//
// Ré-exporte les modules QR pour faciliter l'import depuis app.js et la page
// de génération.

export { QR_CONFIG, resolveScanUrl, getDisplayUrl, getVariant, listVariants } from './qr-config.js';
export { encodeQR } from './qr-encoder.js';
export { renderQrSvg, renderAllVariants } from './qr-renderer.js';
export {
  configureQRAnalytics,
  trackScan,
  trackCtaClick,
  trackConversion,
  getEvents,
  clearEvents,
  summarize,
  readVariantFromLocation,
} from './qr-analytics.js';
export { mountQrLanding, dismissQrLanding, autoInitQrLanding } from './qr-landing.js';
