// MindPrep — Configuration centrale de l'URL publique de production.
//
// Source de vérité unique pour le domaine public de l'app. Tous les modules
// (QR, partage social, emails transactionnels, etc.) doivent passer par ce
// fichier plutôt que de coder en dur une URL.
//
// Stratégie d'hébergement (mise à jour 2026-05-07) :
//  - Provider ACTIF : GitHub Pages (déjà publié, zéro dépendance externe).
//  - Domaine cible  : https://app.mindprep.ai (via custom domain GitHub Pages).
//  - Fallback       : URL GitHub Pages brute (toujours en ligne).
//  - Vercel/Netlify : options secondaires, gardées pour plus tard. Aucun
//                     fichier (`vercel.json`, `netlify.toml`) n'est supprimé,
//                     ils sont simplement ignorés tant que `provider` n'est
//                     pas explicitement basculé.
//
// Pourquoi ce choix : la vérification téléphone Vercel est bloquée 12h chez
// l'utilisateur. GitHub Pages permet de connecter `app.mindprep.ai`
// immédiatement (Settings → Pages → Custom domain) sans dépendre d'un
// provider tiers. Voir `docs/17-github-pages-deblocage.md`.
//
// Champs :
//  - `provider`      : provider actif d'hébergement. 'github_pages' par
//                      défaut. Bascule vers 'vercel' / 'netlify' plus tard
//                      si besoin (ne modifie pas `productionUrl`).
//  - `productionUrl` : URL CIBLE finale (https://app.mindprep.ai). C'est
//                      celle qu'on utilisera dès que le DNS sera actif et
//                      le certificat HTTPS délivré (peu importe le provider).
//  - `fallbackUrl`   : URL DE REPLI tant que `app.mindprep.ai` ne répond
//                      pas en HTTPS. Pointe vers GitHub Pages — qui est
//                      AUSSI le provider actif, donc le fallback est
//                      strictement équivalent au provider en attendant le
//                      branchement DNS.
//  - `domainStatus`  : 'pending' tant que `app.mindprep.ai` ne répond pas
//                      en HTTPS, 'live' une fois la bascule validée.
//
// Pour basculer une fois le DNS configuré et la page accessible via HTTPS :
//   1) passer `domainStatus` à 'live',
//   2) régénérer les QR : `node core/qr-system/generate-assets.mjs`,
//   3) committer le changement.
//
// Voir aussi :
//   - `docs/17-github-pages-deblocage.md` (procédure ACTIVE, prioritaire)
//   - `docs/14-vercel-deployment.md` (option Vercel, mise en attente)
//   - `DOMAIN_STATUS.md` (checklist humaine)

export const SITE_CONFIG = {
  provider: 'github_pages', // 'github_pages' | 'vercel' | 'netlify'
  productionUrl: 'https://app.mindprep.ai',
  fallbackUrl: 'https://ensupafrique-glitch.github.io/mindprep-app/',
  domainStatus: 'pending', // 'pending' | 'live'
  brandDomain: 'app.mindprep.ai',
};

// URL effectivement vivante à l'instant T (utilisée pour les redirections,
// QR, partages). Tant que `domainStatus !== 'live'`, on renvoie le fallback.
export function getActivePublicUrl() {
  return SITE_CONFIG.domainStatus === 'live'
    ? SITE_CONFIG.productionUrl
    : SITE_CONFIG.fallbackUrl;
}

// URL canonique cible (toujours `app.mindprep.ai`), utile pour le branding,
// les balises `<link rel="canonical">` ou les emails — indépendamment de
// l'état réel du DNS.
export function getCanonicalUrl() {
  return SITE_CONFIG.productionUrl;
}

// Domaine de marque affiché à l'utilisateur (sans protocole), ex. sur les QR.
export function getBrandDomain() {
  return SITE_CONFIG.brandDomain;
}

// Provider d'hébergement actif. Utile pour la documentation et les outils
// d'observabilité ; ne change pas l'URL publique tant que `domainStatus`
// reste cohérent.
export function getActiveProvider() {
  return SITE_CONFIG.provider;
}
