# Système QR Code premium MindPrep

> Module : `core/qr-system/`
> Page studio : [`qr.html`](../qr.html)
> Assets pré-générés : `assets/qr/*.svg`

## Objectif

Offrir une **expérience QR Code premium** (SaaS / EdTech) pour MindPrep :

- visuels QR brandés (clair + sombre) pour les supports imprimés et numériques,
- landing post-scan **adaptée au public** (étudiant, concours, professeur,
  marketing) qui amène directement en mode invité MindPrep,
- analytics légers côté client (scan, type d’appareil, clics CTA, conversions),
- stratégie de domaine prête à basculer sur **`app.mindprep.ai`** sans casser
  l’existant.

## CTA officiel

> **« Scanner pour commencer votre préparation intelligente »**

Ce libellé est centralisé dans `core/qr-system/qr-config.js` (`QR_CONFIG.cta`).
Toute modification se répercute sur les visuels SVG et la landing post-scan.

## Variantes QR

Chaque variante encode l’URL avec `?qr=<variant>&source=qr_<variant>` afin
d’être identifiable côté analytics et côté landing :

| Clé          | Public           | Headline post-scan                                        |
|--------------|------------------|-----------------------------------------------------------|
| `student`    | 🎓 Étudiant      | « Ta préparation intelligente commence ici »              |
| `exam`       | 🏅 Concours      | « Prépare ton concours avec un coach IA »                 |
| `teacher`    | 👩‍🏫 Professeur | « Corrigez plus, mieux, plus vite »                       |
| `marketing`  | ✨ Marketing     | « L’app qui transforme la préparation aux examens »       |
| `default`    | 🧠 Générique     | « Bienvenue sur MindPrep »                                |

Pour ajouter une variante, éditer `QR_CONFIG.variants` dans
`qr-config.js` puis relancer `node core/qr-system/generate-assets.mjs`.

## Stratégie domaine (display ≠ target)

Deux URLs cohabitent dans la config :

```js
// core/qr-system/qr-config.js
displayDomain: 'app.mindprep.ai',                                  // visuel
targetUrl:     'https://ensupafrique-glitch.github.io/mindprep-app/', // scan réel
useDisplayAsTarget: false,                                          // bascule
```

- Le **visuel imprimé** affiche toujours `app.mindprep.ai` — on n’expose
  jamais l’URL GitHub Pages sur le QR.
- Le **scan réel** envoie pour l’instant vers l’hébergement courant
  (`targetUrl`) : c’est ce qui garantit qu’un QR distribué dès aujourd’hui
  fonctionne, sans dépendre d’un DNS qui n’est pas encore configuré.
- Une fois `app.mindprep.ai` opérationnel (cf. § ci-dessous), passer
  `useDisplayAsTarget` à `true` puis régénérer les SVG.

### Activer le domaine `app.mindprep.ai`

> Le domaine n’est pas (encore) possédé / configuré. Ces étapes sont à
> dérouler quand il le sera.

1. **Acheter** `mindprep.ai` (ou le sous-domaine désiré) chez un registrar.
2. **DNS** : créer un enregistrement `CNAME` du sous-domaine
   `app.mindprep.ai` vers l’hébergement actif :
   - GitHub Pages : `ensupafrique-glitch.github.io`
   - Sinon : l’hôte choisi (Netlify, Vercel, etc.).
3. **GitHub Pages → Custom domain** : ajouter `app.mindprep.ai` dans les
   réglages du repo, cocher *Enforce HTTPS*. Attendre la délivrance du
   certificat (quelques minutes).
4. **Vérifier** dans un navigateur que `https://app.mindprep.ai/` répond
   (HTTPS valide + landing MindPrep visible).
5. **Mettre à jour la config** :
   ```js
   useDisplayAsTarget: true,
   ```
6. **Régénérer les QR** :
   ```bash
   node core/qr-system/generate-assets.mjs
   ```
7. Republier les supports imprimés (les anciens QR continuent de
   fonctionner tant que GitHub Pages reste joignable).

## Analytics

`core/qr-system/qr-analytics.js` expose des fonctions sans dépendance :

- `trackScan(variant, extras)`
- `trackCtaClick(variant, cta, extras)`
- `trackConversion(variant, conversionType, extras)`
- `summarize()` → `{ total, byType, byVariant, byDevice }`
- `getEvents()` / `clearEvents()`
- `configureQRAnalytics({ endpoint, onEvent })` pour brancher Supabase ou un
  endpoint analytics quand il sera prêt.

Les événements sont stockés en localStorage (`mindprep_qr_events_v1`) avec
plafond à 500 entrées. Tant qu’aucun endpoint n’est configuré, rien ne sort
du navigateur.

### Champs d’événement

```ts
{
  type: 'scan' | 'cta_click' | 'conversion' | 'qr_event',
  variant: 'student' | 'exam' | 'teacher' | 'marketing' | 'default',
  timestamp: ISO 8601,
  sessionId: string,
  device: 'mobile' | 'tablet' | 'desktop' | 'unknown',
  referrer: string | null,
  path: string | null,
  // selon le type :
  cta?: 'primary' | 'secondary' | 'close',
  conversionType?: 'guest_enter' | string,
}
```

## Studio QR (`qr.html`)

Page autonome (non publiée par défaut) qui :

- prévisualise toutes les variantes / thèmes,
- propose le téléchargement **SVG** ou **PNG** (canvas → blob),
- affiche l’URL réellement encodée pour vérification.

À ouvrir en local : `http://localhost:3000/qr.html`.

## Régénération des assets pré-générés

```bash
node core/qr-system/generate-assets.mjs
```

Sortie : `assets/qr/mindprep-qr-<variant>-<theme>.svg` (10 fichiers).

Ces SVG sont vérifiés scannables (test pyzbar via cairosvg) côté CI manuelle.

## Intégration dans l’app

`app.js` charge dynamiquement `core/qr-system/index.js` et appelle
`autoInitQrLanding()` au `DOMContentLoaded` :

- si l’URL contient `?qr=<variant>`, une overlay landing premium s’affiche,
- son CTA principal appelle `window.MindPrepEnterGuest()` (exposé par
  `app.js`), ce qui bascule MindPrep en mode invité,
- en cas d’absence de paramètre QR, **rien** n’est injecté — aucune
  régression sur le parcours classique.
