# Roadmap d'intégrations et modules long terme

Ce document liste les **APIs externes recommandées** et les **modules pédagogiques
long terme** prévus pour MindPrep. Il ne s'agit pas d'éléments actifs : les hooks
existent dans le code (`core/training-engine`, `core/billing`, `core/pedagogy-engine`)
mais aucune clé API n'est branchée. La couche IA actuelle est **simulée localement**
et signalée comme telle dans l'UI (« moteur local simulé », bandeau Démo).

## 1. APIs recommandées

### Authentification

| Service | Usage | État |
|---|---|---|
| Supabase Auth | Email + mot de passe, Google OAuth | ✅ Branché (voir `supabase-config.js`) |
| Firebase Auth | Alternative multi-fournisseurs | 🔌 Hook prévu, non branché |

### Intelligence artificielle (correction & génération)

| Service | Usage | État |
|---|---|---|
| OpenAI (GPT-4 / GPT-4o) | Correction IA fond + forme, génération de sujets | 🔌 Hook prévu (`gradeAnswer`, `generateTopics`) |
| Anthropic Claude (Sonnet / Opus) | Correction IA fond + forme, génération de sujets | 🔌 Hook prévu (`gradeAnswer`, `generateTopics`) |

> Les fonctions `gradeAnswer`, `generateTopics`, `searchTopics`,
> `recommendNextLevel` du module `core/training-engine` sont conçues pour être
> remplacées par un appel HTTP vers une vraie API IA sans casser l'UI.

### Paiements — Afrique

| Service | Usage | État |
|---|---|---|
| Wave | Paiement mobile Sénégal / Côte d'Ivoire | 🔌 Bouton placeholder prêt |
| Orange Money | Paiement mobile multi-pays | 🔌 Bouton placeholder prêt |
| Free Money | Paiement mobile Sénégal | 🔌 Bouton placeholder prêt |

### Paiements — International (carte bancaire en € EUR)

| Service | Usage | Devise | État |
|---|---|---|---|
| **Stripe** | Carte bancaire (Visa, Mastercard, Amex) + abonnements récurrents | EUR | 🔌 Bouton placeholder prêt |
| **PayPal** | Paiement carte bancaire ou compte PayPal, international | EUR | 🔌 Bouton placeholder prêt |

> Le paiement par **carte bancaire** est l'option recommandée pour les
> utilisateurs en Europe et à l'international. Stripe et PayPal acceptent tous
> deux les cartes Visa / Mastercard / American Express et facturent en euros
> (€). Le paywall MindPrep propose un toggle de devise FCFA / EUR pour aligner
> l'affichage du prix sur la méthode de paiement choisie.

> ⚠️ Aucun paiement réel n'est prélevé. Les boutons sont des points
> d'intégration côté front. La connexion serveur (webhooks, secret keys)
> reste à effectuer.

## 2. Modules pédagogiques long terme

Présentés dans l'UI comme « modules à venir » — branchables sans refonte :

- **IA vocale — lecture des résumés**
  Synthèse vocale (TTS) des résumés intelligents pour révision en mobilité.
  Intégrations cibles : Web Speech API (gratuit), ElevenLabs ou OpenAI TTS pour
  une qualité supérieure.

- **Détection des faiblesses cognitives**
  Analyse longitudinale des erreurs pour cibler les biais récurrents
  (raisonnement, mémoire à long terme, transfert). Hook : `recommendNextLevel`
  + agrégat sur la matière.

- **Planification automatique**
  Génération d'un planning de révision personnalisé en fonction du calendrier
  d'examens, du temps disponible et des matières faibles. Hook : combiner
  `computeProgressStats` + un solveur de planning.

- **Révision adaptative**
  Espacée (spaced repetition) sur les concepts les moins bien maîtrisés.
  Cible une vraie addiction positive — dans la lignée Duolingo / Anki.

## 3. Style visuel

Référence : Notion (sobriété), Duolingo (gamification douce), Linear
(typographie nette), ChatGPT (lisibilité), Canva (modernité).

- Palette : blanc cassé (`--page: #f5f7fa`), vert émeraude (`--brand: #0f766e`),
  accent bleu IA léger (utilisé sur la grille « Compétence évaluée » et les
  axes pédagogiques en %).
- Typographie : Inter (par défaut), avec fallback SF Pro / Poppins via stack
  système.
