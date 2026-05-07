# Checklist finale — bascule `app.mindprep.ai`

> Document de validation produit avant bascule finale. Aucune action DNS,
> Vercel, Netlify, GitHub Pages, secret ni domaine réel n'a été modifiée
> par ce rapport.
>
> Branche auditée : `vercel-app-mindprep-ai` (PR #23).
> Date du rapport : 2026-05-07.
> Méthode : audit statique du code + serveur HTTP local
> (`python3 -m http.server`) + smoke test
> (`scripts/smoke-test-migration.mjs`).

## Légende des statuts

| Statut | Sens |
|--------|------|
| ✅ **Pass** | Vérifié localement, conforme |
| ⚠️ **Warning** | Conforme avec réserve documentée (à recontrôler en prod) |
| 🟡 **À vérifier en production avec secrets** | Non testable sans clés réelles |
| ⛔ **Blocked** | Anomalie identifiée, à corriger avant bascule |

## Synthèse — décision recommandée

> **Prêt avec réserves.** Toutes les conditions techniques côté code et
> assets statiques sont remplies. Les réserves concernent uniquement les
> étapes humaines (DNS / GitHub Pages Settings / secrets) qui sortent
> volontairement du périmètre de la PR.

| Bloc | Statut |
|---|---|
| 1. Landing page fonctionnelle | ✅ Pass |
| 2. Dashboard / cockpit fonctionnel | ✅ Pass |
| 3. Responsive mobile | ✅ Pass |
| 4. QR codes valides (assets + cible) | ✅ Pass |
| 5. HTTPS actif sur `app.mindprep.ai` | 🟡 À vérifier — DNS en attente, `domainStatus: 'pending'` (attendu) |
| 6. Aucune fonction supprimée | ✅ Pass |
| 7. Anciennes URLs restent accessibles | ✅ Pass (fallback GitHub Pages préservé) |
| 8. Aucun lien cassé | ✅ Pass (4/4 refs locales en 200) |
| 9. Exports PDF / Word fonctionnels | ⚠️ Warning — code réel (jsPDF + docx via CDN), à valider in-app |
| 10. APIs IA connectées / variables intactes | 🟡 À vérifier en production avec secrets |

## Détail par item

### 1. Landing page — ✅ Pass

- `GET /` → HTTP 200 sur serveur statique local.
- Marqueurs présents : `MindPrep`, mentions paiements
  (`PayDunya`, `Stripe`, `PayPal`, `Wave`), mode invité, exports
  `PDF` / `Word`.
- Aucune référence `http://` non sécurisée dans la page (smoke test bloc 6).
- Méta `viewport` présente (`index.html:5`).

### 2. Dashboard / cockpit — ✅ Pass

Vues principales détectées dans `index.html` :

```
dashboard, settings, diagnostic, practice, training, copies,
courses, review, presentation, progress
```

Le cockpit `<section class="view active" id="dashboard">` est défini
ligne 646. Aucune vue n'a été retirée par la PR (le `git diff main...HEAD`
ne touche pas la structure de `index.html`).

### 3. Responsive mobile — ✅ Pass

- `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`
  présent (`index.html:5`).
- 35 règles `@media` dans `styles.css` (couvre breakpoints mobile / desktop).
- Test browser mobile non réalisé ici (pas d'environnement headless), mais
  les fondations CSS sont en place.

### 4. QR codes — ✅ Pass

- 10 SVG présents dans `assets/qr/` (light + dark × 5 thèmes).
- `qr.html` → HTTP 200, Content-Type SVG correct (`image/svg+xml`).
- Smoke test bloc [3] : 6/6 must + sanity check SVG bien formé.
- Configuration runtime vérifiée :
  - `displayDomain` = `app.mindprep.ai`
  - `targetUrl` = `https://ensupafrique-glitch.github.io/mindprep-app/`
    (fallback GitHub Pages — donc les QR papier déjà imprimés
    fonctionnent dès maintenant)
  - `useDisplayAsTarget` = `false` (sera `true` une fois
    `domainStatus = 'live'`).

### 5. HTTPS sur `app.mindprep.ai` — 🟡 À vérifier en production

État actuel (intentionnel et documenté dans `core/site-config.js`) :

```
provider:        github_pages
domainStatus:    pending
productionUrl:   https://app.mindprep.ai
fallbackUrl:     https://ensupafrique-glitch.github.io/mindprep-app/
getActivePublicUrl() → fallback GitHub Pages
```

Tant que `domainStatus` reste `pending`, l'app continue d'utiliser le
fallback GitHub Pages — **aucune rupture de service possible**.

**Étapes humaines restantes** (cf. `docs/17-github-pages-deblocage.md`) :

1. GitHub → Settings → Pages → Custom domain = `app.mindprep.ai`.
2. Registrar `mindprep.ai` → ajouter `CNAME app → ensupafrique-glitch.github.io`.
3. Attendre propagation DNS + *DNS check successful*.
4. Cocher *Enforce HTTPS*.
5. Vérifier `https://app.mindprep.ai/` (HTTP 200 attendu).
6. Lancer `MINDPREP_BASE_URL=https://app.mindprep.ai node scripts/smoke-test-migration.mjs`.
7. Passer `core/site-config.js` → `domainStatus: 'live'`.
8. Régénérer les QR : `node core/qr-system/generate-assets.mjs`.

### 6. Aucune fonction supprimée — ✅ Pass

`git diff main...HEAD --stat` (PR #23) : 1609 ajouts, 57 suppressions.

Les 57 suppressions concernent uniquement :

- `core/qr-system/qr-config.js` — refactor pour importer depuis
  `core/site-config.js` (les commentaires changent, le contrat public
  est conservé).
- `qr.html` — texte d'aide mis à jour pour pointer vers la nouvelle
  doc (pas de fonctionnalité retirée).
- `docs/13-qr-system.md` — doc mise à jour.

Aucune section UI, vue, route, fonction métier (cockpit, exam, exports,
billing, IA) n'a été supprimée.

### 7. Anciennes URLs restent accessibles — ✅ Pass

- `vercel.json` : conservé à l'identique (option de secours).
- `netlify.toml` : conservé à l'identique.
- Fallback GitHub Pages (`https://ensupafrique-glitch.github.io/mindprep-app/`)
  reste l'URL active tant que `domainStatus = 'pending'`.
- Les QR déjà imprimés encodent ce fallback → continuent de fonctionner.

### 8. Aucun lien cassé — ✅ Pass

Liens locaux extraits de `index.html` et testés contre le serveur local :

| Ressource | HTTP |
|---|---|
| `styles.css` | 200 |
| `app.js` | 200 |
| `core/presentation-engine/ui.js` | 200 |
| `supabase-config.js` | 200 |
| `qr.html` | 200 |
| `core/site-config.js` | 200 |
| `core/qr-system/qr-config.js` | 200 |
| `CNAME` | 200 (contient `app.mindprep.ai`) |
| `assets/qr/*.svg` (×6 testés) | 200 |

### 9. Exports PDF / Word — ⚠️ Warning

- Code réel présent : `core/reporting/pdf-exporter.js`
  (jsPDF via CDN cloudflare) et `core/reporting/docx-exporter.js`
  (lib `docx` via CDN cloudflare).
- Chargement dynamique côté client, fallback `import` côté serveur.
- **Non simulé / non front-only** : ce sont de vraies bibliothèques.
- **À valider en navigateur** : déclencher un export depuis l'UI
  (cours, copie corrigée, rapport) après bascule pour s'assurer que
  le CDN est joignable depuis `app.mindprep.ai` (CSP éventuelle, etc.).

### 10. APIs IA connectées — 🟡 À vérifier en production avec secrets

- `core/utils/ai-config.js` lit les clés via `process.env` (Node) ou
  `window.MINDPREP_CONFIG` (browser, après injection serveur).
- `.env.production.example` énumère les variables attendues :
  `OPENAI_API_KEY`, `OPENAI_ORG_ID`, `ANTHROPIC_API_KEY`, plus
  Supabase et providers de paiement.
- Aucune clé hard-codée détectée dans le code servi au navigateur
  (recherche `OPENAI|ANTHROPIC|API_KEY` dans les fichiers front : OK).
- **Non testable sans secrets** : la PR ne configure aucune clé.
  À recontrôler après injection des variables côté hébergeur cible
  (proxy serverless / edge function), conformément à
  `docs/15-securite-migration.md`.

## Smoke test — résultat brut

Commande :

```
python3 -m http.server 8765 --directory . &
MINDPREP_BASE_URL=http://127.0.0.1:8765 \
  node scripts/smoke-test-migration.mjs
```

Résultat :

```
=== Résumé ===
  Must   : 11/11 OK
  Should : 8/9 OK

OK avec avertissements : 1 check(s) "should" en erreur.
```

Le seul WARN — `Alias /qr (Vercel rewrite, ignoré sur GH Pages)` — est
**attendu et explicitement étiqueté** dans le smoke test : c'est un
rewrite Vercel-only, non applicable au provider actif (GitHub Pages).

## Conclusion

**Décision recommandée : prêt avec réserves.**

Le code, les assets et la configuration sont prêts pour la bascule.
Les réserves listées ne sont pas des bugs mais des **étapes humaines**
explicitement documentées (DNS, Settings GitHub Pages, secrets
hébergeur). Le fallback GitHub Pages reste vivant tant que ces étapes
ne sont pas faites — **aucun risque de rupture de service** pour les
utilisateurs ni pour les QR papier déjà distribués.

À refaire **après bascule DNS** :

1. Smoke test contre `https://app.mindprep.ai`.
2. Validation manuelle dans un navigateur mobile (responsive réel).
3. Test d'un export PDF + Word depuis l'UI.
4. Test d'un appel IA bout-en-bout (avec secrets configurés
   côté serveur, jamais côté front).
