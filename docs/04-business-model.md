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

| Offre | Prix FCFA | Équivalent EUR (indicatif) | Pour qui | Inclus |
|---|---|---|---|---|
| **Gratuit** | 0 FCFA | 0 € | Découverte | 3 cours/mois, mini-tests limités, correction sommaire, historique limité |
| **Premium Étudiant** | **3 000 – 7 000 FCFA / mois** | **≈ 5 – 11 € / mois** | Étudiants & lycéens | Résumés illimités, sujets IA, corrections détaillées, PDF/Word, progression, historique complet |
| **Premium Professeur** | **10 000 – 30 000 FCFA / mois** | **≈ 15 – 46 € / mois** | Enseignants | Correction massive, dashboard élèves, statistiques, génération de devoirs |

> Les prix en € sont des équivalents indicatifs (taux fixe XOF/EUR ≈ 655,957). Le
> prix exact en € est défini par Stripe / PayPal au moment du paiement carte.

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

| Pack | Prix FCFA | Équivalent EUR (indicatif) | Crédits | Bonus |
|---|---|---|---|---|
| Découverte | 500 FCFA | ≈ 0,80 € | 5 | — |
| Étudiant | 1 000 FCFA | ≈ 1,50 € | 12 | +20% |
| Boost examen ⭐ | 2 500 FCFA | ≈ 3,80 € | 35 | +40% |
| Concours | 5 000 FCFA | ≈ 7,60 € | 80 | +60% |

Modes de paiement disponibles :

- **💳 Carte bancaire en € (EUR)** — Visa, Mastercard, American Express via
  **Stripe** ou **PayPal**. Cible : étudiants en Europe, paiements
  internationaux, professeurs en France.
- **📱 Mobile money en FCFA** — **Wave**, **Orange Money**, **Free Money**.
  Cible : Sénégal, Côte d'Ivoire, Mali, Burkina Faso et plus largement la zone
  UEMOA / CEMAC.

Le paywall propose un **toggle de devise FCFA / EUR** pour que chaque
utilisateur voie un prix dans la monnaie qui lui parle, indépendamment de la
méthode de paiement effectivement utilisée.

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
réels tant qu'aucune clé n'est configurée. Tant qu'aucune API n'est branchée,
les boutons de paiement restent des **placeholders** et n'exécutent aucune
transaction réelle.

### Devises supportées

- **FCFA (XOF)** — devise principale pour l'Afrique de l'Ouest francophone.
- **EUR (€)** — devise principale pour l'Europe et les paiements
  internationaux par carte bancaire.

L'utilisateur peut basculer l'affichage des prix entre FCFA et EUR directement
dans le paywall (toggle de devise), et la méthode de paiement choisie détermine
la devise réellement débitée.

### Méthodes de paiement

| Méthode | Devise | Provider technique | Cible |
|---|---|---|---|
| 💳 Carte bancaire | EUR | **Stripe** | Europe, international |
| 🅿️ PayPal / Carte | EUR | **PayPal** | Europe, international |
| 🌊 Wave | FCFA | Wave Business API | Sénégal, Côte d'Ivoire |
| 🟠 Orange Money | FCFA | Orange Money API | Zone UEMOA |
| 💚 Free Money | FCFA | Free Money API | Sénégal |

### Flow standard

1. Cliquer **Passer Premium** (ou choisir un pack de crédits).
2. Choisir une devise d'affichage (FCFA ou EUR) et un plan/pack.
3. Choisir une méthode de paiement :
   - Carte bancaire en € (Stripe ou PayPal) pour les utilisateurs européens
     ou internationaux,
   - Mobile money en FCFA (Wave, Orange Money, Free Money) pour les
     utilisateurs en Afrique de l'Ouest.
4. Effectuer le paiement (ex. 3 000 FCFA / ≈ 5 € pour Premium Étudiant).
5. Abonnement / crédits activés automatiquement côté backend (à brancher).

APIs cibles : **Stripe**, **PayPal**, **Wave**, **Orange Money**, **Free Money**.

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
