# Business Model

## Positionnement produit

MindPrep ne vend pas des résumés. MindPrep vend :

- la **réussite** aux examens et concours,
- la **progression** mesurable semaine après semaine,
- la **correction intelligente** des copies (fond + forme),
- l'**entraînement adaptatif** jusqu'au jour J.

C'est une plateforme EdTech / SaaS IA d'apprentissage adaptatif.

## Marché

- France : ~750K étudiants/an préparant le Bac.
- Europe : 3M+ d'étudiants.
- Afrique francophone : plusieurs millions d'étudiants Bac, université, et
  candidats à des concours administratifs (ENA, magistrature, douanes…).
- Monde : 50M+ d'étudiants avec examens critiques.

## Monétisation — vue d'ensemble

MindPrep combine **quatre modèles de revenus** complémentaires :

1. Abonnement SaaS (B2C — étudiants & professeurs)
2. Paiement à l'usage par crédits (adapté à l'Afrique et aux petits budgets)
3. Offre établissement / B2B (écoles, universités, centres de formation, prépas concours)
4. Marketplace de contenus (à venir — commission sur les ventes des professeurs)

### 1. Abonnement SaaS

| Offre | Prix | Pour qui | Inclus |
|---|---|---|---|
| **Gratuit** | 0 FCFA | Découverte | 3 cours/mois, mini-tests limités, correction sommaire, historique limité |
| **Premium Étudiant** | **3 000 – 7 000 FCFA / mois** | Étudiants & lycéens | Résumés illimités, sujets IA, corrections détaillées, PDF/Word, progression, historique complet |
| **Premium Professeur** | **10 000 – 30 000 FCFA / mois** | Enseignants | Correction massive, dashboard élèves, statistiques, génération de devoirs |

Bénéfices côté business : revenus récurrents (MRR), prédictibilité, churn faible
si la valeur perçue est haute (réussite, progression visible).

Bénéfices côté utilisateur : réussite, progression, gain de temps, préparation
stratégique au lieu de révision passive.

### 2. Paiement par crédits (Afrique-friendly)

Beaucoup d'utilisateurs francophones préfèrent payer ponctuellement plutôt que
de s'engager dans un abonnement mensuel. MindPrep propose donc des packs de
crédits.

**Coût par action :**

- Analyse d'un cours : **1 crédit**
- Sujet difficile (niveau 4-5) : **2 crédits**
- Correction d'une copie : **3 crédits**
- Coach IA personnalisé (15 min) : **2 crédits**

**Packs :**

| Pack | Prix | Crédits | Bonus |
|---|---|---|---|
| Découverte | 500 FCFA | 5 | — |
| Étudiant | 1 000 FCFA | 12 | +20% |
| Boost examen ⭐ | 2 500 FCFA | 35 | +40% |
| Concours | 5 000 FCFA | 80 | +60% |

Compatible **Wave**, **Orange Money**, **Free Money** (mobile money), plus
Stripe et PayPal pour l'international.

### 3. Freemium + IA Premium

L'expérience est libre à l'entrée mais les fonctions IA avancées sont marquées
Premium dans l'UI :

- Correction avancée fond + forme
- Analyse cognitive des faiblesses
- Génération niveau 5 (sujets très difficiles, niveau concours)
- Coaching IA personnalisé

### 4. Monétisation établissements / B2B

Cible : écoles secondaires, universités, IUT, centres de formation
professionnelle, prépas concours administratifs (ENA, magistrature, douanes,
police), réseaux d'enseignants indépendants.

Exemple de pricing : abonnement institutionnel pour 1 000 étudiants (sur devis).

Fonctionnalités incluses :

- Dashboard élèves multi-classes
- Statistiques de progression par cohorte
- Correction massive en lots
- Suivi pédagogique individualisé
- Génération de devoirs et bancs d'essai

### 5. Marketplace de contenus — phase 2

À venir. Les professeurs vendront leurs sujets, corrections, packs premium,
méthodologies et plans de révision sur la plateforme. **MindPrep prend une
commission** sur chaque vente. Effet réseau : plus la marketplace grossit, plus
elle attire de profs et d'étudiants.

### 6. Coach Réussite IA — premium haut de gamme

Module premium haut de gamme : programme personnalisé jusqu'au jour J, analyse
fine des faiblesses, objectifs hebdomadaires, révision adaptative, coaching
mental quotidien. Modèle prix premium ou consommation de crédits accélérée.

## Rétention / moteur économique

Plus l'utilisateur revient, plus il paie. La rétention est tirée par :

- Mini-tests quotidiens
- Sujets adaptés à son niveau qui se débloquent
- Progression visible (graphique hebdo, badges, streaks)
- Correction des copies = boucle de feedback addictive
- Streaks et jours de suite (déjà présents dans l'UI)

## Objectifs de conversion

- 5 à 8 % de conversion freemium → Premium en année 1.
- 15 à 25 % d'utilisateurs actifs achètent au moins un pack de crédits / mois.
- ARPU mixte : 6 à 8 USD (mix abonnement + crédits + B2B).

## Stratégie CAC

- TikTok, YouTube Shorts, contenus organiques.
- Reddit / Discord / WhatsApp éducation.
- Partenariats lycées et professeurs influents.
- Viral loop : partage de score, streak et progression.

## Paiements techniques

L'UI conserve la transparence : APIs prêtes à brancher, pas encore de paiements
réels tant qu'aucune clé n'est configurée. Flow standard :

1. Cliquer **Passer Premium** (ou choisir un pack de crédits).
2. Choisir une méthode (Wave, Orange Money, Free Money, Stripe, PayPal).
3. Payer (ex. 3 000 FCFA pour Premium Étudiant).
4. Abonnement / crédits activés automatiquement.

APIs cibles : **Wave**, **Orange Money**, **Free Money**, **Stripe**, **PayPal**.

## À éviter

- Tout rendre gratuit. Montrer de la valeur, oui, mais garder les fonctions
  puissantes (IA avancée, correction détaillée, coach personnalisé) en premium.
- Imposer l'abonnement. Le paiement par crédits est crucial pour le marché
  africain.
- Cacher la valeur premium. Les badges Premium dans l'UI doivent être
  visibles mais non bloquants tant que les droits ne sont pas implémentés
  côté backend.

## Vision long terme

MindPrep se positionne comme **plateforme EdTech, SaaS IA, système
d'apprentissage adaptatif, solution pour écoles, préparation concours,
plateforme cognitive**. Objectif : devenir le standard de la préparation
intelligente aux examens dans l'espace francophone et plus largement.

## Paywall

Le paywall doit apparaître après valeur perçue, pas avant. Le bon moment est
après que l'utilisateur a vu ses faiblesses et reçu au moins un feedback
utile — ou au moment d'accéder à une fonction premium identifiée (sujet
niveau 5, correction détaillée, coach IA).
