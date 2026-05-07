#!/usr/bin/env node
// MindPrep — Smoke test non destructif pour la migration Vercel.
//
// Usage:
//   MINDPREP_BASE_URL=https://app.mindprep.ai node scripts/smoke-test-migration.mjs
//   MINDPREP_BASE_URL=https://ensupafrique-glitch.github.io/mindprep-app node scripts/smoke-test-migration.mjs
//   MINDPREP_BASE_URL=https://mindprep-app.vercel.app node scripts/smoke-test-migration.mjs
//
// Le provider hébergeur est détecté côté `core/site-config.js`. Le smoke test
// est volontairement agnostique — il teste uniquement le BASE_URL fourni.
//
// Variables d'environnement supportées:
//   MINDPREP_BASE_URL  (requis) — URL racine à tester, sans slash final
//   MINDPREP_TIMEOUT   (optionnel, défaut 15000) — timeout par requête en ms
//   MINDPREP_USER_AGENT (optionnel) — UA personnalisé
//
// Garanties:
//   - Lecture seule (HTTP GET / HEAD).
//   - Aucun secret n'est lu, écrit, transmis.
//   - Aucun paiement ni écriture en base n'est déclenché.
//   - Code de sortie: 0 si tous les checks "must" passent, 1 sinon.
//     Les checks "should" (warnings) ne font pas échouer le script.

const baseUrlRaw = process.env.MINDPREP_BASE_URL;
if (!baseUrlRaw) {
  console.error('ERREUR: la variable MINDPREP_BASE_URL est requise.');
  console.error('Exemple: MINDPREP_BASE_URL=https://app.mindprep.ai node scripts/smoke-test-migration.mjs');
  process.exit(2);
}
const BASE_URL = baseUrlRaw.replace(/\/+$/, '');
const TIMEOUT_MS = Number(process.env.MINDPREP_TIMEOUT || 15000);
const USER_AGENT = process.env.MINDPREP_USER_AGENT
  || 'MindPrepSmokeTest/1.0 (+migration-check; non-destructive)';

const COLOR = process.stdout.isTTY ? {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  gray: (s) => `\x1b[90m${s}\x1b[0m`,
} : {
  green: (s) => s, red: (s) => s, yellow: (s) => s, cyan: (s) => s, gray: (s) => s,
};

async function fetchWithTimeout(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...opts,
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT, ...(opts.headers || {}) },
    });
  } finally {
    clearTimeout(t);
  }
}

const results = [];
function record(level, name, ok, detail) {
  results.push({ level, name, ok, detail });
  const tag = ok
    ? COLOR.green('PASS')
    : (level === 'must' ? COLOR.red('FAIL') : COLOR.yellow('WARN'));
  console.log(`  ${tag}  ${name}${detail ? COLOR.gray(' — ' + detail) : ''}`);
}

async function checkStatus(level, name, path, expected = [200]) {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetchWithTimeout(url);
    const ok = expected.includes(res.status);
    record(level, name, ok, `${res.status} ${res.statusText} (${url})`);
    return ok ? res : null;
  } catch (err) {
    record(level, name, false, `${err.name}: ${err.message} (${url})`);
    return null;
  }
}

async function checkContains(level, name, path, needles, opts = {}) {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      record(level, name, false, `HTTP ${res.status} (${url})`);
      return;
    }
    const text = await res.text();
    const list = Array.isArray(needles) ? needles : [needles];
    const missing = list.filter((n) => {
      if (n instanceof RegExp) return !n.test(text);
      return !text.includes(n);
    });
    if (missing.length === 0) {
      record(level, name, true, `${list.length} marqueur(s) présent(s)`);
    } else {
      const shown = missing.map((n) => (n instanceof RegExp ? n.toString() : `"${n}"`)).join(', ');
      record(level, name, false, `manque: ${shown}`);
    }
  } catch (err) {
    record(level, name, false, `${err.name}: ${err.message}`);
  }
}

async function checkContentType(level, name, path, expectedSubstring) {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetchWithTimeout(url, { method: 'HEAD' });
    const ct = res.headers.get('content-type') || '';
    const ok = res.ok && ct.toLowerCase().includes(expectedSubstring.toLowerCase());
    record(level, name, ok, `Content-Type: ${ct || '(absent)'} — attendu: contient "${expectedSubstring}"`);
  } catch (err) {
    record(level, name, false, `${err.name}: ${err.message}`);
  }
}

async function main() {
  console.log(COLOR.cyan(`\n=== MindPrep smoke test ===`));
  console.log(`Base URL : ${BASE_URL}`);
  console.log(`Timeout  : ${TIMEOUT_MS}ms`);
  console.log(`Mode     : lecture seule, aucun secret, aucune écriture\n`);

  console.log(COLOR.cyan('[1] Pages publiques'));
  await checkStatus('must', 'Landing (/)', '/');
  await checkStatus('must', 'QR studio (/qr.html)', '/qr.html');
  await checkStatus('should', 'Alias /qr (Vercel rewrite, ignoré sur GH Pages)', '/qr');
  // Sur GitHub Pages, le fichier CNAME à la racine est servi tel quel s'il
  // existe — mais tant que `domainStatus = 'pending'` dans core/site-config.js,
  // ce fichier ne doit PAS exister à la racine du repo (il déclencherait une
  // bascule de custom domain prématurée). Le check reste en "should" : il
  // signale l'état (présent + bon contenu vs absent), sans bloquer.
  await checkContains('should', 'CNAME servi (présent uniquement après bascule DNS)', '/CNAME', [
    'app.mindprep.ai',
  ]);

  console.log(COLOR.cyan('\n[2] Contenu de la landing'));
  await checkContains('must', 'Mention "MindPrep"', '/', ['MindPrep']);
  await checkContains('should', 'Mentions paiements (PayDunya/Stripe/PayPal/Wave)', '/', [
    'PayDunya', 'Stripe', 'PayPal', 'Wave',
  ]);
  await checkContains('should', 'Mode invité visible', '/', [/invit[ée]/i]);
  await checkContains('should', 'Exports PDF / Word mentionnés', '/', [/PDF/i, /Word/i]);

  console.log(COLOR.cyan('\n[3] Assets QR (SVG)'));
  const qrAssets = [
    '/assets/qr/mindprep-qr-student-light.svg',
    '/assets/qr/mindprep-qr-student-dark.svg',
    '/assets/qr/mindprep-qr-exam-light.svg',
    '/assets/qr/mindprep-qr-teacher-light.svg',
    '/assets/qr/mindprep-qr-marketing-light.svg',
    '/assets/qr/mindprep-qr-default-light.svg',
  ];
  for (const path of qrAssets) {
    await checkStatus('must', `QR asset ${path}`, path);
  }
  await checkContentType('should', 'Content-Type SVG correct', qrAssets[0], 'image/svg');
  // Sanity check léger : le SVG doit déclarer son namespace SVG. Le contenu
  // encodé du QR est un dessin vectoriel, pas du texte — on ne peut donc pas
  // y "grep" l'URL. La validation d'URL se fait au moment de la régénération,
  // pas via HTTP (cf. `node core/qr-system/generate-assets.mjs`).
  await checkContains('should', 'QR student-light est un SVG bien formé', qrAssets[0], [
    /<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/,
  ]);

  console.log(COLOR.cyan('\n[4] Modules ESM (Content-Type)'));
  await checkContentType('must', 'core/site-config.js servi en JS', '/core/site-config.js', 'javascript');
  await checkContentType('must', 'core/qr-system/qr-config.js servi en JS', '/core/qr-system/qr-config.js', 'javascript');

  console.log(COLOR.cyan('\n[5] Configuration Supabase'));
  await checkContains('should', 'supabase-config.js présent', '/supabase-config.js', [
    'MINDPREP_SUPABASE', 'supabase.co',
  ]);

  console.log(COLOR.cyan('\n[6] Sécurité — pas de mixed content'));
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/`);
    const text = await res.text();
    // On ignore les namespaces XML et les commentaires courants.
    const httpRefs = (text.match(/(?<!xmlns[:=]")http:\/\/[^\s"'<>)]+/gi) || [])
      .filter((u) => !u.startsWith('http://www.w3.org/'))
      .filter((u) => !u.startsWith('http://localhost'));
    if (httpRefs.length === 0) {
      record('should', 'Aucune référence http:// dans la landing', true);
    } else {
      record('should', 'Aucune référence http:// dans la landing', false,
        `${httpRefs.length} référence(s) trouvée(s) — ex: ${httpRefs[0]}`);
    }
  } catch (err) {
    record('should', 'Aucune référence http:// dans la landing', false, err.message);
  }

  // Résumé
  const must = results.filter((r) => r.level === 'must');
  const should = results.filter((r) => r.level === 'should');
  const mustFail = must.filter((r) => !r.ok).length;
  const shouldFail = should.filter((r) => !r.ok).length;

  console.log(COLOR.cyan('\n=== Résumé ==='));
  console.log(`  Must   : ${must.length - mustFail}/${must.length} OK`);
  console.log(`  Should : ${should.length - shouldFail}/${should.length} OK`);

  if (mustFail > 0) {
    console.log(COLOR.red(`\nÉCHEC : ${mustFail} check(s) "must" en erreur.`));
    process.exit(1);
  } else if (shouldFail > 0) {
    console.log(COLOR.yellow(`\nOK avec avertissements : ${shouldFail} check(s) "should" en erreur.`));
    process.exit(0);
  } else {
    console.log(COLOR.green(`\nTous les checks sont passés.`));
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(COLOR.red(`\nErreur inattendue: ${err.stack || err.message}`));
  process.exit(2);
});
