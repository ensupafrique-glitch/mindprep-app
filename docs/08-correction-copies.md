# Correction de Copies

## Objectif

Permettre aux eleves de photographier une copie de devoir ou d'examen, puis de
recevoir:

- une lecture de la copie;
- une correction;
- une appreciation;
- une note estimee;
- un plan d'accompagnement personnalise.

## Experience utilisateur

1. L'eleve ajoute une photo ou un PDF.
2. Il choisit la matiere.
3. Il ajoute eventuellement la consigne ou le sujet.
4. MindPrep lit la copie.
5. MindPrep produit une correction et une note.
6. MindPrep propose un plan de progression.

## Matieres prises en charge

- Mathematiques.
- Philosophie.
- Histoire.
- Geographie.
- Litterature.
- Langues.
- Culture generale.
- Droit public.
- Note de synthese.

## Architecture cible

- Frontend: prise de photo, preview, choix matiere, sujet.
- Supabase Storage: stockage securise des copies.
- OCR: extraction du texte manuscrit ou imprime.
- Queue IA: correction, appreciation, notation, plan d'accompagnement.
- Base de donnees: historique des copies, notes, feedback et progression.

## Important

La version actuelle du frontend simule la correction localement. Elle est
structuree pour etre branchee ensuite a un backend OCR et IA.
