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

## Lancer le frontend

Ouvrir `index.html` dans un navigateur.

Avant d'utiliser l'authentification, renseigner `supabase-config.js` avec l'URL
du projet Supabase et la cle anon. Voir `docs/07-supabase-setup.md`.

Pour Google OAuth, lancer plutot un serveur local:

```powershell
.\serve.ps1
```

Puis ouvrir `http://localhost:3000/`.

## Modules principaux

- Authentification email et Google.
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
