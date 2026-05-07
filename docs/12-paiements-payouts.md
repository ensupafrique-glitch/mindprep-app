# 12 — Paiements & encaissements MindPrep

Ce document explique **comment l'argent arrive sur ton compte** quand un
utilisateur paie un abonnement Premium ou un pack de crédits, et **quoi
configurer pour passer du mode démo au mode production**.

L'application elle-même ne stocke aucune clé : tout passe par les variables
d'environnement listées dans `.env.example`. Aucune clé n'est codée en dur.

## Architecture

```
Utilisateur ─► Paywall ─► BillingOrchestrator ─► Adapter (PayDunya / Stripe / PayPal / Wave Business)
                                       │
                                       ├─► Provider externe → encaissement
                                       │
                                       └◄── Webhook (HTTPS) ─► confirmPayment(reference, payload)
                                                              │
                                                              ├─► Entitlements (Premium / crédits)
                                                              └─► Ledger admin (revenus)
```

- **Frontend (ce repo)** : crée la session de paiement, affiche l'étape
  « paiement en cours », redirige vers le provider en mode live.
- **Provider** : encaisse l'argent et confirme via webhook HTTPS.
- **Webhook handler (côté serveur)** : appelle
  `BillingOrchestrator.confirmPayment(reference, payload)` qui débloque
  les entitlements et alimente le panneau admin.

Tant qu'aucune clé n'est configurée, tout reste en **simulation
déterministe** : le bouton « ✓ Confirmer paiement (démo) » remplace
le webhook pour valider la chaîne de bout en bout.

## 1. PayDunya (priorité — Sénégal & Afrique de l'Ouest)

PayDunya est notre passerelle principale parce qu'elle agrège
**Wave, Orange Money, Free Money et carte locale** en un seul SDK et un
seul reversement, avec une UX optimisée pour le Sénégal.

### Étapes pour recevoir l'argent
1. Créer un compte marchand sur https://paydunya.com (KYC entreprise).
2. Activer le mode `live` après validation des documents.
3. Dans le back-office PayDunya, copier les 4 clés :
   - `Master Key`
   - `Private Key`
   - `Public Key`
   - `Token`
4. Renseigner ces valeurs côté serveur (jamais dans le navigateur) :
   ```
   PAYDUNYA_MASTER_KEY=...
   PAYDUNYA_PRIVATE_KEY=...
   PAYDUNYA_PUBLIC_KEY=...
   PAYDUNYA_TOKEN=...
   PAYDUNYA_MODE=live
   PAYDUNYA_WEBHOOK_URL=https://app.mindprep.example/api/webhooks/paydunya
   ```
5. Configurer le **webhook IPN** dans le back-office PayDunya pour pointer
   vers ton endpoint `/api/webhooks/paydunya`.
6. Lier ton **compte bancaire** ou ton **wallet PayDunya** (Wave Business,
   Orange Money Business…) : c'est là que tomberont les payouts.

### Reversement
PayDunya regroupe les paiements des canaux mobile et carte, prélève sa
commission, puis effectue un payout vers ton compte selon la cadence
configurée (instantané, journalier ou hebdomadaire selon ton contrat).

### Canaux modélisés dans `paydunya.js`
- `card` — Carte bancaire (Visa / Mastercard) locale.
- `wave-senegal` — Wave Sénégal.
- `orange-money-senegal` — Orange Money Sénégal.
- `free-money-senegal` — Free Money Sénégal.

## 2. Stripe (international — EUR / USD)

Pour les utilisateurs européens et internationaux qui paient par carte.

### Étapes
1. Créer un compte sur https://stripe.com.
2. Activer le compte (KYC + IBAN entreprise pour le payout).
3. Dans le dashboard Stripe → Developers → API keys :
   ```
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...   # SERVEUR UNIQUEMENT
   STRIPE_WEBHOOK_SECRET=whsec_... # SERVEUR UNIQUEMENT
   ```
4. Créer un endpoint webhook qui pointe vers
   `https://app.mindprep.example/api/webhooks/stripe`. Y abonner au moins
   les événements `checkout.session.completed` et `payment_intent.succeeded`.
5. Stripe verse automatiquement les fonds sur ton **IBAN entreprise**
   (cadence J+2 à J+7 selon le pays / l'historique).

## 3. PayPal (international — EUR / USD)

Alternative carte / compte PayPal pour les utilisateurs qui préfèrent.

### Étapes
1. Créer un compte business sur https://paypal.com.
2. Dans https://developer.paypal.com → Apps & Credentials, créer une app
   « Live » et copier :
   ```
   PAYPAL_CLIENT_ID=...
   PAYPAL_CLIENT_SECRET=...
   PAYPAL_MODE=live
   PAYPAL_WEBHOOK_ID=...
   ```
3. Configurer un webhook vers `/api/webhooks/paypal` avec au moins les
   événements `PAYMENT.CAPTURE.COMPLETED`.
4. Le solde reste dans ton compte PayPal ; tu peux le retirer manuellement
   vers ton compte bancaire (gratuit en EUR vers IBAN européen).

## 4. Wave Business (intégration directe — à venir)

Pour réduire les frais sur Wave Sénégal, on prépare une intégration
directe via Wave Business. Tant qu'elle n'est pas branchée, **PayDunya
reste la route Wave par défaut**.

```
WAVE_BUSINESS_API_KEY=
WAVE_BUSINESS_MERCHANT_ID=
WAVE_BUSINESS_WEBHOOK_SECRET=
WAVE_BUSINESS_BASE_URL=https://api.wave.com
```

L'adapter `core/billing/providers/wave-business.js` existe déjà et expose
le canal `wave-direct`. Quand tes credentials Wave Business seront actifs,
il suffit de basculer le routage de `data-payment="wave"` vers
`wave-business` dans `BillingOrchestrator.PAYMENT_CHANNEL_ROUTING`.

## 5. Sécurité — règles dures

- **JAMAIS** de clé `secret` ou `private` dans le navigateur.
- **JAMAIS** committer un `.env` rempli — utilise `.env.example` pour
  documenter les noms de variables.
- Tous les webhooks doivent être **vérifiés** côté serveur :
  - PayDunya : signature avec `PAYDUNYA_MASTER_KEY`.
  - Stripe : `Stripe.webhooks.constructEvent(payload, sig, STRIPE_WEBHOOK_SECRET)`.
  - PayPal : vérification via l'API `/v1/notifications/verify-webhook-signature`.
  - Wave Business : signature HMAC `WAVE_BUSINESS_WEBHOOK_SECRET`.

## 6. Flux côté admin

Une fois en production, le panneau **Paramètres → Revenus & paiements
MindPrep** affichera :
- Revenu total en FCFA et en €.
- Nombre de transactions confirmées / en attente / échouées.
- Provider utilisé pour chaque paiement et statut live/simulation.
- Historique des transactions avec leurs références.

Pour persister ces données entre sessions, brancher un backend (Supabase,
Postgres…) qui consomme les webhooks et stocke les transactions.

## 7. Tester en local sans payer

1. Ouvre l'app en local (`python3 -m http.server 8000` ou Netlify dev).
2. Clique sur **Premium** → choisis un plan ou un pack de crédits.
3. Choisis n'importe quelle méthode de paiement.
4. Le modal « Paiement en cours » apparaît → clique sur
   **« ✓ Confirmer paiement (démo) »**.
5. Le modal de succès s'affiche, l'entitlement est appliqué, et la
   transaction apparaît dans **Paramètres → Revenus & paiements**.

Aucune clé API n'est requise pour cette boucle.
