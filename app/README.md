# Structure Fonctionnelle de l'Application

## Navigation principale

- `Onboarding` : creation du compte et choix de l'examen.
- `Diagnostic` : quiz initial court.
- `Dashboard` : progression, plan d'action, tests du jour.
- `Practice` : mini-tests adaptatifs.
- `Review` : erreurs, corrections et explications IA.
- `Exam Mode` : entrainement chronometre sans feedback immediat.
- `Profile` : streak, points, abonnement et preferences.

## Modules

- `auth/` : inscription, connexion, Google OAuth.
- `diagnostic/` : quiz initial et scoring.
- `dashboard/` : synthese utilisateur.
- `practice/` : generation et execution des mini-tests.
- `feedback/` : corrections, explications IA, recommandations.
- `progress/` : progression par theme, streaks, points.
- `payments/` : plans, essai gratuit, Stripe.
- `notifications/` : rappels intelligents.

## Priorite MVP

Le MVP doit prouver une chose: MindPrep sait dire a Sarah quoi reviser
maintenant et lui montrer qu'elle progresse.
