// MindPrep — Rendu SVG premium pour QR Code
//
// Construit une carte SVG (rounded card, gradient subtil, ombre, typographie
// Inter) intégrant le QR encodé par qr-encoder.js, le branding MindPrep, le
// CTA et le domaine d'affichage. Disponible en thème clair et sombre.

import { encodeQR } from './qr-encoder.js';
import { QR_CONFIG, resolveScanUrl, getDisplayUrl, getVariant } from './qr-config.js';

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function modulesToPath(modules, n, originX, originY, cell) {
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (modules[r * n + c]) {
        const x = originX + c * cell;
        const y = originY + r * cell;
        d += `M${x} ${y}h${cell}v${cell}h-${cell}z`;
      }
    }
  }
  return d;
}

// Génère un SVG complet pour la variante donnée et le thème (light/dark).
export function renderQrSvg({ variant = 'default', theme = 'light' } = {}) {
  const v = getVariant(variant);
  const t = QR_CONFIG.themes[theme] || QR_CONFIG.themes.light;
  const url = resolveScanUrl(variant);
  const display = getDisplayUrl(variant);
  const cta = QR_CONFIG.cta;

  const W = 720;
  const H = 980;
  const padding = 56;

  // QR
  const { size: n, modules } = encodeQR(url);
  const qrArea = 480;
  const cell = qrArea / n;
  const qrX = (W - qrArea) / 2;
  const qrY = 280;
  const path = modulesToPath(modules, n, qrX, qrY, cell);

  const gradientId = `mp-grad-${theme}`;
  const shadowId = `mp-shadow-${theme}`;
  const innerCardId = `mp-inner-${theme}`;

  const isDark = theme === 'dark';
  const gradStart = isDark ? '#1a1f48' : '#f5f3ff';
  const gradEnd = isDark ? '#0b1020' : '#eef2ff';
  const cardFill = isDark ? '#0f1530' : '#ffffff';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="QR MindPrep ${escapeXml(v.label)}">
  <defs>
    <linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${gradStart}"/>
      <stop offset="100%" stop-color="${gradEnd}"/>
    </linearGradient>
    <linearGradient id="${innerCardId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${t.accent}" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="${t.accent2}" stop-opacity="0.00"/>
    </linearGradient>
    <filter id="${shadowId}" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="14"/>
      <feOffset dx="0" dy="10" result="off"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.35"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background gradient -->
  <rect width="${W}" height="${H}" fill="url(#${gradientId})"/>

  <!-- Premium card -->
  <g filter="url(#${shadowId})">
    <rect x="${padding}" y="${padding}" width="${W - padding * 2}" height="${H - padding * 2}"
          rx="36" ry="36" fill="${cardFill}"/>
    <rect x="${padding}" y="${padding}" width="${W - padding * 2}" height="${H - padding * 2}"
          rx="36" ry="36" fill="url(#${innerCardId})"/>
  </g>

  <!-- Brand row -->
  <g font-family="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif">
    <g transform="translate(${padding + 36}, ${padding + 56})">
      <rect width="44" height="44" rx="12" fill="${t.accent}"/>
      <text x="22" y="29" text-anchor="middle" font-size="22" font-weight="800" fill="#ffffff">M</text>
      <text x="60" y="22" font-size="20" font-weight="800" fill="${t.ink}">${escapeXml(QR_CONFIG.brand)}</text>
      <text x="60" y="40" font-size="12" font-weight="500" fill="${t.muted}">${escapeXml(QR_CONFIG.brandTagline)}</text>
    </g>
    <g transform="translate(${W - padding - 36}, ${padding + 56})" text-anchor="end">
      <rect x="-148" y="-4" width="148" height="34" rx="17" fill="${t.accent}" fill-opacity="0.12"/>
      <text x="-74" y="18" text-anchor="middle" font-size="13" font-weight="700" fill="${t.accent}">${escapeXml(v.emoji)} ${escapeXml(v.label)}</text>
    </g>

    <!-- CTA -->
    <text x="${W / 2}" y="220" text-anchor="middle" font-size="22" font-weight="700" fill="${t.ink}">${escapeXml(cta)}</text>
    <text x="${W / 2}" y="250" text-anchor="middle" font-size="14" font-weight="500" fill="${t.muted}">${escapeXml(QR_CONFIG.tagline)}</text>

    <!-- QR background panel -->
    <rect x="${qrX - 24}" y="${qrY - 24}" width="${qrArea + 48}" height="${qrArea + 48}" rx="24" fill="${t.qrBg}"
          stroke="${t.accent}" stroke-opacity="0.18" stroke-width="2"/>

    <!-- QR modules -->
    <path d="${path}" fill="${t.qrFg}"/>

    <!-- Logo overlay (subtle) -->
    <g transform="translate(${W / 2 - 36}, ${qrY + qrArea / 2 - 36})">
      <rect width="72" height="72" rx="18" fill="${t.qrBg}"/>
      <rect x="6" y="6" width="60" height="60" rx="14" fill="${t.accent}"/>
      <text x="36" y="48" text-anchor="middle" font-size="36" font-weight="900" fill="#ffffff">M</text>
    </g>

    <!-- Display URL -->
    <text x="${W / 2}" y="${qrY + qrArea + 70}" text-anchor="middle" font-size="18" font-weight="700" fill="${t.ink}">${escapeXml(display)}</text>
    <text x="${W / 2}" y="${qrY + qrArea + 96}" text-anchor="middle" font-size="13" font-weight="500" fill="${t.muted}">Scannez avec l'appareil photo de votre téléphone</text>

    <!-- Footer accent -->
    <rect x="${padding + 36}" y="${H - padding - 56}" width="${W - padding * 2 - 72}" height="2" rx="1" fill="${t.accent}" fill-opacity="0.18"/>
    <text x="${padding + 36}" y="${H - padding - 28}" font-size="11" font-weight="600" fill="${t.muted}">SaaS / EdTech · IA pédagogique</text>
    <text x="${W - padding - 36}" y="${H - padding - 28}" text-anchor="end" font-size="11" font-weight="600" fill="${t.muted}">${escapeXml(v.label.toUpperCase())}</text>
  </g>
</svg>`;
}

// Variantes pratiques pour la page de téléchargement.
export function renderAllVariants() {
  const out = {};
  for (const variant of Object.keys(QR_CONFIG.variants)) {
    if (variant === 'default') continue;
    out[`${variant}_light`] = renderQrSvg({ variant, theme: 'light' });
    out[`${variant}_dark`] = renderQrSvg({ variant, theme: 'dark' });
  }
  out.default_light = renderQrSvg({ variant: 'default', theme: 'light' });
  out.default_dark = renderQrSvg({ variant: 'default', theme: 'dark' });
  return out;
}
