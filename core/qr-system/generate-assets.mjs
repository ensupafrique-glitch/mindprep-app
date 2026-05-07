// MindPrep — Script de génération des assets SVG QR
//
// Utilisation : node core/qr-system/generate-assets.mjs
// Génère un fichier SVG par couple (variante × thème) dans assets/qr/.
// À relancer après chaque modification de QR_CONFIG (CTA, domaine cible).

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderQrSvg } from './qr-renderer.js';
import { QR_CONFIG } from './qr-config.js';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '../../assets/qr');
mkdirSync(outDir, { recursive: true });

const variants = Object.keys(QR_CONFIG.variants);
const themes = ['light', 'dark'];

let count = 0;
for (const variant of variants) {
  for (const theme of themes) {
    const svg = renderQrSvg({ variant, theme });
    const file = resolve(outDir, `mindprep-qr-${variant}-${theme}.svg`);
    writeFileSync(file, svg, 'utf8');
    count++;
    console.log(`✓ ${file}`);
  }
}
console.log(`\nGenerated ${count} QR asset(s) in ${outDir}`);
