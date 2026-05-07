// MindPrep — Configuration centrale de l'URL publique de production.
//
// Source de vérité unique pour le domaine public de l'app. Tous les modules
// (QR, partage social, emails transactionnels, etc.) doivent passer par ce
// fichier plutôt que de coder en dur une URL.
//
// Stratégie de bascule :
//  - `productionUrl`  : URL CIBLE finale (https://app.mindprep.ai). C'est
//                       celle qu'on utilisera dès que le DNS sera actif et le
//                       certificat HTTPS délivré côté Vercel.
//  - `fallbackUrl`    : URL DE REPLI tant que le DNS n'est pas branché (on
//                       garde l'hébergement GitHub Pages courant pour ne pas
//                       casser les liens distribués).
//  - `domainStatus`   : 'pending' tant que `app.mindprep.ai` ne répond pas en
//                       HTTPS, 'live' une fois la bascule validée. On lit
//                       cette valeur pour décider quelle URL est "active".
//
// Pour basculer une fois le DNS configuré et la page accessible via HTTPS :
//   1) passer `domainStatus` à 'live',
//   2) régénérer les QR : `node core/qr-system/generate-assets.mjs`,
//   3) committer le changement.
//
// Voir aussi : `docs/14-vercel-deployment.md` et `DOMAIN_STATUS.md`.

export const SITE_CONFIG = {
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
