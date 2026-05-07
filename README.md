# MindPrep

Preparation intelligente aux examens par IA.

MindPrep transforme la preparation aux examens en un processus personnalise,
adaptatif et base sur la science cognitive: moins de revision passive, plus de
pratique ciblee sur les vrais points faibles.

## Structure du dossier

- `index.html` : frontend statique de l'application MindPrep.
- `styles.css` : interface responsive mobile-first.
- `app.js` : interactions du diagnostic, mini-test, feedback et paywall.
- `supabase-config.js` : configuration Supabase pour l'authentification.
- Authentification Supabase incluse avec email, mot de passe et Google OAuth.
- `docs/` : cadrage produit, persona, parcours et monetisation.
- `app/` : structure fonctionnelle de l'application.
- `api/` : contrat REST initial.
- `data/` : modele de donnees et contenu pedagogique.
- `roadmap/` : MVP, backlog et priorites.
- `core/qr-system/` : système QR Code premium (visuels SVG clair/sombre, landing post-scan, analytics). Voir [`docs/13-qr-system.md`](docs/13-qr-system.md). Studio interne : [`qr.html`](qr.html).
- `core/site-config.js` : source de vérité unique pour l'URL publique (`app.mindprep.ai` cible, GitHub Pages en repli tant que le DNS n'est pas branché).
- `assets/qr/` : QR pré-générés (étudiant, concours, professeur, marketing × clair/sombre).
- `vercel.json` : config Vercel (headers MIME modules ESM, alias `/qr` → `qr.html`).
- `DOMAIN_STATUS.md` : checklist de bascule du domaine `app.mindprep.ai`.
- `MIGRATION_CHECKLIST.md` : checklist opérationnelle de bascule (à cocher).
- `.env.production.example` : variables d'env attendues côté Vercel (sans secret).
- `scripts/smoke-test-migration.mjs` : smoke test HTTP non destructif.

## Hébergement & domaine

Le domaine cible est **`https://app.mindprep.ai`**, hébergé sur **Vercel**.
Tant que le DNS n'est pas branché, l'app reste servie par
`https://ensupafrique-glitch.github.io/mindprep-app/` (fallback). Les QR
codes affichent toujours `app.mindprep.ai` mais encodent l'URL de repli
jusqu'à la bascule.

- Procédure technique : [`docs/14-vercel-deployment.md`](docs/14-vercel-deployment.md).
- **Sécurité de migration** : [`docs/15-securite-migration.md`](docs/15-securite-migration.md).
- **Plan de rollback** : [`docs/16-rollback-plan.md`](docs/16-rollback-plan.md).
- Checklist opérationnelle : [`MIGRATION_CHECKLIST.md`](MIGRATION_CHECKLIST.md).
- Statut courant : [`DOMAIN_STATUS.md`](DOMAIN_STATUS.md).

## Lancer le frontend

Ouvrir `index.html` dans un navigateur.

Avant d'utiliser l'authentification, renseigner `supabase-config.js` avec l'URL
du projet Supabase et la cle anon. Voir `docs/07-supabase-setup.md`.

Pour Google OAuth, lancer plutot un serveur local:

```powershell
.\serve.ps1
```

Puis ouvrir `http://localhost:3000/`.

## Parcours invite (« show value first »)

MindPrep suit le modele moderne « decouvre d'abord, cree un compte plus tard »
(comme ChatGPT, Canva, Notion ou Figma).

Sur l'ecran d'accueil, le bouton **« Essayer MindPrep gratuitement, sans
compte »** entre directement dans l'application sans appeler Supabase Auth.
L'utilisateur peut alors explorer le dashboard, le diagnostic, les mini-tests,
l'Expose intelligent et l'apercu Premium.

Les actions qui necessitent un compte (achat de credits, abonnement Premium,
synchronisation entre appareils) declenchent un prompt non bloquant invitant
l'utilisateur a creer un compte. L'inscription/connexion classique reste
disponible a tout moment via la banniere « Mode invite » ou en se deconnectant.

Le mode invite est persiste en `localStorage` (`mindprep_guest_mode_v1`) afin
que l'utilisateur ne reparte pas a zero au prochain chargement.

## Modules principaux

- Authentification email et Google (optionnelle, parcours invite disponible).
- Choix de classe et parcours: College, Seconde, Premiere, Terminale, serie L, ENA, Classes prepa et Etudiant libre.
- Matieres litteraires: philosophie, histoire, geographie, litterature, langues et methodologie.
- Parcours concours: culture generale, droit public, economie, note de synthese, dissertation, colles et oral.
- Correction de copies: photo ou PDF, lecture, note, appreciation et plan d'accompagnement.
- La comprehension facilitee du Cours: decomposition, schemas, relations, fiches courtes, reconstruction et alertes critiques.
- Quiz diagnostic de 5 minutes.
- Heat map des faiblesses par theme.
- Plan d'action personnalise.
- Mini-tests adaptatifs.
- Feedback IA et explications detaillees.
- Progression, streaks, points et achievements.
- Paywall freemium, Étudiant Premium et Professeur Premium.
- **Exposé intelligent / Présentation IA** : transforme un sujet ou un cours en présentation complète (plan, slides, mind map, graphiques recommandés, questions du jury, coaching oral en Premium). Hooks API prêts pour OpenAI, Claude et Napkin — voir [`docs/11-presentation-integrations.md`](docs/11-presentation-integrations.md).
- Paiement par crédits (packs FCFA) compatible Wave, Orange Money et Free Money.
- Offre établissement (écoles, universités, prépas concours) et roadmap marketplace + Coach Réussite IA.

## Modèle économique en bref

MindPrep vend la **réussite**, la **progression**, la **correction
intelligente** et l'**entraînement adaptatif** — pas seulement des résumés. Voir
[`docs/04-business-model.md`](docs/04-business-model.md) pour le détail.

- **Gratuit** : 3 cours/mois, mini-tests limités, correction sommaire.
- **Premium Étudiant** : 3 000 – 7 000 FCFA / mois — illimité, correction détaillée, coach IA.
- **Premium Professeur** : 10 000 – 30 000 FCFA / mois — correction massive, dashboard élèves, statistiques.
- **Crédits à l'usage** : packs 500 / 1 000 / 2 500 / 5 000 FCFA (Wave, Orange Money, Free Money).
- **Établissement / B2B** : sur devis pour écoles, centres de formation, prépas concours.

## Roadmap & APIs recommandées

Voir [`docs/10-roadmap-integrations.md`](docs/10-roadmap-integrations.md) pour
la liste des APIs (Supabase / Firebase Auth, OpenAI / Claude, Wave / Orange
Money / Free Money / Stripe / PayPal) et les modules long terme (IA vocale,
détection des faiblesses cognitives, planification automatique, révision
adaptative). Aucune clé API n'est branchée — les hooks sont prêts dans le code.
