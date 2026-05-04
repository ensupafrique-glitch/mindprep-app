# Architecture Technique

## Vue d'ensemble

MindPrep peut etre construit comme une application mobile-first avec une API
REST, une base de donnees relationnelle et une queue dediee aux traitements IA.

## Frontend

Recommandation:
- Web app responsive ou mobile app.
- Dashboard personnel.
- Interface de quiz rapide.
- Heat map de progression.
- Paywall integre.

Modules frontend:
- Auth.
- Onboarding.
- Diagnostic.
- Dashboard.
- Practice.
- Feedback.
- Progression.
- Billing.

## Backend

Recommandation:
- API REST.
- Authentification JWT ou session securisee.
- Gestion des utilisateurs, tests, reponses, progression.
- Regles d'adaptation des mini-tests.

Services:
- `AuthService`
- `DiagnosticService`
- `AdaptiveTestService`
- `ProgressService`
- `FeedbackService`
- `BillingService`
- `NotificationService`

## IA

La queue IA sert a eviter de bloquer l'utilisateur pendant les generations.

Taches IA:
- Generer une explication detaillee.
- Reformuler une correction.
- Identifier une erreur probable.
- Proposer un exercice similaire.
- Generer un quiz personnalise pour les utilisateurs Premium.

## Base de donnees

Entites principales:
- Users.
- Subjects.
- Topics.
- Questions.
- Diagnostics.
- TestSessions.
- Answers.
- Progress.
- Achievements.
- Subscriptions.

## Paiement

Stripe gere:
- Checkout.
- Essai gratuit 7 jours.
- Plan Premium.
- Plan Pro.
- Webhooks de changement d'abonnement.

## Notifications

Les notifications doivent etre utiles et personnalisees.

Exemples:
- "Tu as progresse de 12% en probabilites cette semaine."
- "Ton streak est presque perdu."
- "15 minutes suffisent pour revoir les suites aujourd'hui."

## Principe produit

Chaque ecran doit repondre a une question simple:

- Ou suis-je faible ?
- Que dois-je faire maintenant ?
- Est-ce que je progresse ?
