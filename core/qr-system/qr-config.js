// MindPrep — Configuration QR Code (système premium)
//
// Stratégie domaine :
//  - `displayDomain`   : URL affichée sur le visuel (branding). Doit être courte
//                        et professionnelle, ex. "app.mindprep.ai".
//  - `targetUrl`       : URL réellement encodée dans le QR (où le scan envoie
//                        l'utilisateur). Doit pointer vers un hébergement actif.
//  - `useDisplayAsTarget` : si `true`, on encode `displayDomain` au lieu de
//                        `targetUrl` (à activer UNE FOIS le DNS configuré et
//                        la redirection HTTPS validée — voir docs/13-qr-system.md).
//
// IMPORTANT : par défaut, on encode `targetUrl` qui pointe vers l'hébergement
// actuel (GitHub Pages) afin que le QR fonctionne tout de suite. Le visuel
// affiche cependant `displayDomain` ("app.mindprep.ai") pour ne pas exposer
// l'URL GitHub. C'est intentionnel et documenté.

export const QR_CONFIG = {
  // Domaine de marque, affiché sous le QR. Ne pas y mettre une URL GitHub.
  displayDomain: 'app.mindprep.ai',

  // Cible réelle du QR. Tant que `app.mindprep.ai` n'est pas relié par DNS,
  // on garde l'hébergement actuel (GitHub Pages) comme cible de scan pour
  // éviter une expérience cassée. Une fois le domaine configuré (CNAME +
  // HTTPS validé sur GitHub Pages ou autre host), basculer ce champ et
  // passer `useDisplayAsTarget` à `true`.
  targetUrl: 'https://ensupafrique-glitch.github.io/mindprep-app/',

  // Activer une fois le domaine prêt. Voir docs/13-qr-system.md.
  useDisplayAsTarget: false,

  // Slogan principal affiché sur les visuels QR.
  cta: 'Scanner pour commencer votre préparation intelligente',

  // Slogan court (deuxième ligne).
  tagline: 'Préparation IA aux examens & concours',

  // Marque.
  brand: 'MindPrep',
  brandTagline: 'Smarter prep. Better results.',

  // Couleurs (claires/sombres) — ces tokens sont utilisés par le générateur
  // SVG et la landing post-scan.
  themes: {
    light: {
      bg: '#ffffff',
      surface: '#f7f8fb',
      ink: '#0b1020',
      muted: '#5b6478',
      accent: '#5b5cff',
      accent2: '#8b5cf6',
      qrFg: '#0b1020',
      qrBg: '#ffffff',
      shadow: 'rgba(15, 23, 42, 0.12)',
    },
    dark: {
      bg: '#0b1020',
      surface: '#111733',
      ink: '#ffffff',
      muted: '#a4adc6',
      accent: '#7c7dff',
      accent2: '#a78bfa',
      // On garde un QR sombre-sur-clair même sur la carte sombre :
      // c'est ce qui maximise la compatibilité avec tous les scanners
      // (un QR clair-sur-sombre est techniquement valide mais beaucoup
      // de scanners en environnement réel l'acceptent moins bien).
      qrFg: '#0b1020',
      qrBg: '#ffffff',
      shadow: 'rgba(0, 0, 0, 0.45)',
    },
  },

  // Variantes QR : chacune cible un public et propose un copy adapté
  // côté landing post-scan.
  variants: {
    student: {
      key: 'student',
      label: 'Étudiant',
      emoji: '🎓',
      headline: 'Ta préparation intelligente commence ici',
      sub: 'Diagnostic, plan d’action et mini-tests adaptatifs. Sans compte.',
      ctaLabel: 'Commencer gratuitement',
      featureHighlights: [
        'Diagnostic de 5 minutes',
        'Plan d’action personnalisé',
        'Coach IA & feedback détaillé',
      ],
    },
    exam: {
      key: 'exam',
      label: 'Concours',
      emoji: '🏅',
      headline: 'Prépare ton concours avec un coach IA',
      sub: 'Note de synthèse, dissertation, oral, colles — tout dans un cockpit.',
      ctaLabel: 'Lancer ma prépa concours',
      featureHighlights: [
        'Culture générale & droit public',
        'Note de synthèse guidée',
        'Coaching oral en Premium',
      ],
    },
    teacher: {
      key: 'teacher',
      label: 'Professeur',
      emoji: '👩‍🏫',
      headline: 'Corrigez plus, mieux, plus vite',
      sub: 'Correction massive, dashboard élèves, statistiques de classe.',
      ctaLabel: 'Découvrir l’espace professeur',
      featureHighlights: [
        'Correction de copies (photo / PDF)',
        'Statistiques de progression',
        'Plans pédagogiques exportables',
      ],
    },
    marketing: {
      key: 'marketing',
      label: 'Marketing',
      emoji: '✨',
      headline: 'L’app qui transforme la préparation aux examens',
      sub: 'Diagnostic IA, mini-tests, Assistant Exposé, Premium Étudiant & Professeur.',
      ctaLabel: 'Essayer MindPrep',
      featureHighlights: [
        'Sans compte requis',
        'IA pédagogique calibrée',
        'Premium Étudiant & Professeur',
      ],
    },
    default: {
      key: 'default',
      label: 'MindPrep',
      emoji: '🧠',
      headline: 'Bienvenue sur MindPrep',
      sub: 'Préparation intelligente aux examens et concours.',
      ctaLabel: 'Découvrir MindPrep',
      featureHighlights: [
        'IA pédagogique',
        'Sans compte requis',
        'Premium accessible',
      ],
    },
  },
};

// Résout l'URL effectivement encodée par le QR pour une variante donnée.
// Ajoute systématiquement `?qr=<variant>&source=qr_<variant>` afin de pouvoir
// tracer la provenance et adapter la landing.
export function resolveScanUrl(variantKey = 'default') {
  const base = QR_CONFIG.useDisplayAsTarget
    ? `https://${QR_CONFIG.displayDomain}/`
    : QR_CONFIG.targetUrl;
  const safeKey = QR_CONFIG.variants[variantKey] ? variantKey : 'default';
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}qr=${encodeURIComponent(safeKey)}&source=qr_${encodeURIComponent(safeKey)}`;
}

// URL "vitrine" affichée sous le QR sur le visuel imprimé. Toujours brandée,
// jamais l'URL GitHub Pages.
export function getDisplayUrl(variantKey = 'default') {
  const safeKey = QR_CONFIG.variants[variantKey] ? variantKey : 'default';
  return safeKey === 'default'
    ? QR_CONFIG.displayDomain
    : `${QR_CONFIG.displayDomain}/${safeKey}`;
}

export function getVariant(key) {
  return QR_CONFIG.variants[key] || QR_CONFIG.variants.default;
}

export function listVariants() {
  return Object.values(QR_CONFIG.variants).filter((v) => v.key !== 'default');
}
