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
- Paywall freemium, Premium et Pro.
