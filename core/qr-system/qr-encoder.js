// MindPrep — Encodeur QR Code (wrapper autour de qrcode-generator)
//
// On s'appuie sur la lib MIT "qrcode-generator" de Kazuhiko Arase, vendue dans
// vendor-qrcode-generator.mjs (≈80 KB, sans dépendance, browser + Node, ESM).
// Cette implémentation est éprouvée et lue par tous les scanners modernes.

import qrcode from './vendor-qrcode-generator.mjs';

// Encode un texte UTF-8 en QR niveau M et retourne une matrice plate
// (compatibilité avec qr-renderer).
export function encodeQR(text) {
  if (typeof text !== 'string' || !text.length) {
    throw new Error('encodeQR: empty text');
  }
  // typeNumber=0 = auto, errorCorrectionLevel='M'
  const qr = qrcode(0, 'M');
  // UTF-8 multibyte support
  qr.addData(text, 'Byte');
  qr.make();
  const n = qr.getModuleCount();
  const modules = new Uint8Array(n * n);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      modules[r * n + c] = qr.isDark(r, c) ? 1 : 0;
    }
  }
  return { size: n, modules, version: qr.getTypeNumber ? qr.getTypeNumber() : null };
}
