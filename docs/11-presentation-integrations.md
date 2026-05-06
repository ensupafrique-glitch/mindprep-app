# Module Exposé intelligent — intégrations API

Ce document décrit les intégrations à brancher pour passer du squelette local
(généré sans clé) au rendu enrichi (texte IA + visuels avancés). Aucune clé
n'est embarquée dans le code : tous les hooks sont des placeholders.

## Vue produit

L'utilisateur saisit un sujet (et éventuellement un cours / des consignes), choisit
un niveau (Standard / Avancé Premium) et un format (oral, slides, mind map,
rapport visuel). MindPrep produit :

- Résumé exécutif, problématique, introduction
- Plan en parties / sous-parties + transitions + conclusion
- Slides prêtes à projeter (titre, contexte, problématique, parties, données, conclusion, questions)
- Mind map visuelle (SVG local)
- 2-3 graphiques recommandés (évolution, comparaison, répartition, et matrice en Premium)
- Questions probables du jury / professeur
- Bibliographie indicative
- Coaching oral (Premium uniquement)

Les boutons "Copier le plan" et "Préparer l'export" produisent un fichier
texte structuré. Une intégration PowerPoint / Google Slides / Canva pourra
être ajoutée plus tard via les hooks décrits plus bas.

## APIs ciblées

| Provider              | Rôle                                                        | Hook côté code                          |
| --------------------- | ----------------------------------------------------------- | --------------------------------------- |
| OpenAI / ChatGPT      | Génération + structuration du plan, reformulation pédagogique| `generatePresentationWithAI`            |
| Anthropic Claude      | Raisonnement long, critique pédagogique, niveau concours    | `enhanceWithClaude`                     |
| Napkin                | Visualisation avancée des mind maps & schémas               | `generateMindMapWithNapkin`             |
| PowerPoint (PptxGenJS)| Export `.pptx` natif côté navigateur                        | à ajouter dans `core/presentation-engine`|
| Google Slides API     | Export Slides + lien partageable                            | à ajouter dans `core/presentation-engine`|
| Canva                 | Lien vers template Canva éditable                           | à ajouter dans `core/presentation-engine`|

## Comment brancher

Les fonctions sont déjà exposées dans `core/presentation-engine/index.js`. Pour
brancher un provider, fournis simplement un client à la fonction concernée :

```js
import { generatePresentationWithAI, generateMindMapWithNapkin, enhanceWithClaude } from "./core/presentation-engine/index.js";

const presentation = await generatePresentationWithAI(
  { topic, content, level, format },
  { aiClient: { name: "openai", generate: async (input) => callOpenAI(input) } },
);

const visuals = await generateMindMapWithNapkin(presentation, {
  napkinClient: { render: (mm) => fetch("https://api.napkin.ai/v1/visuals", { /* ... */ }) },
});

const enriched = await enhanceWithClaude(presentation, {
  claudeClient: { refine: (p) => callClaude(p) },
});
```

Tant qu'aucun client n'est passé, les fonctions retombent silencieusement
sur la génération locale — l'app reste fonctionnelle en démo.

## Niveau Premium

Le niveau "Avancé Premium" débloque :

- Design visuel avancé (matrice de positionnement, slides supplémentaires)
- Graphiques premium
- Mind map enrichie (en cible, via Napkin)
- Coaching oral (5 axes : débit, posture, silences, reformulation, voix)
- Analyse critique et niveau concours (en cible, via Claude)
- Questions du jury élargies

Le contrôle d'accès suit le paywall existant (`openPaywall("student")`). Sans
système de droits réel, le verrou reste UX (CTA "Passer Premium") pour ne
pas bloquer la démo.

## Sécurité & confidentialité

- Aucune clé API dans le repo. Les clés sont fournies par l'environnement
  (variables d'env, secrets Netlify, Supabase secrets) au moment du branchement.
- Les données saisies (sujet, contenu) restent en local tant qu'aucun provider
  n'est appelé. Un consentement explicite doit être affiché avant d'envoyer
  le contenu vers un service tiers.
- Les graphiques sont des illustrations. Aucune donnée chiffrée fictive ne
  doit être présentée comme réelle dans l'oral final de l'élève.

## Roadmap incrémentale

1. ✅ Squelette local complet (plan, slides, mind map, graphiques, Q&A).
2. ⏳ Brancher OpenAI pour reformulation et enrichissement du plan.
3. ⏳ Brancher Claude pour critique pédagogique et niveau concours.
4. ⏳ Brancher Napkin pour mind map premium.
5. ⏳ Export `.pptx` via PptxGenJS et Google Slides via API.
