# Sécurité de migration — bascule vers Vercel + `app.mindprep.ai`

> Document opérationnel **avant toute action** sur Vercel ou le DNS.
> Objectif : zéro perte de données, zéro coupure de service utilisateur,
> rollback possible à tout moment en moins de 10 minutes.

Ce document complète [`docs/14-vercel-deployment.md`](./14-vercel-deployment.md)
(la procédure technique) et [`MIGRATION_CHECKLIST.md`](../MIGRATION_CHECKLIST.md)
(la checklist humaine à cocher).

---

## 1. Principes de sécurité

1. **Aucun changement DNS tant que l'app n'est pas vérifiée sur l'URL
   Vercel `*.vercel.app`.** On ne touche au registrar qu'après validation
   complète sur l'URL temporaire.
2. **GitHub Pages reste actif** pendant toute la migration. Il sert de
   filet de sécurité : tant que `core/site-config.js` → `domainStatus =
   'pending'`, les QR codes pointent dessus.
3. **Aucun secret ne quitte le poste de l'admin.** Les clés Supabase /
   PayDunya / Stripe / PayPal / Wave sont saisies uniquement dans
   l'interface Vercel (Project → Settings → Environment Variables).
4. **Rollback en un commit.** La bascule est gouvernée par une seule
   ligne (`domainStatus`). Le retour arrière est tout aussi simple.
5. **Pas de modification du comportement applicatif** tant que la
   migration n'est pas activée. Les fichiers ajoutés par cette PR sont
   de la documentation, des scripts non destructifs et des exemples ;
   ils ne sont chargés par aucune page de l'app.

---

## 2. Sauvegarde GitHub (pré-migration)

Avant tout, créer une **archive locale** de l'état courant du repo —
indépendamment de GitHub, qui peut être indisponible.

```bash
# Tag immuable de l'état pré-migration
git fetch --tags
git tag -a pre-vercel-migration -m "Etat stable avant bascule Vercel"
git push origin pre-vercel-migration

# Archive locale (conserver hors du repo)
git archive --format=tar.gz \
  --output ../mindprep-pre-vercel-$(date +%Y%m%d).tar.gz HEAD
```

> ⚠️ Conserver cette archive **hors du repo et hors de GitHub** (cloud
> personnel, disque externe). Elle n'a pas vocation à contenir de
> secrets — `.env` reste ignoré par `.gitignore`.

Vérifier que les **branches protégées** côté GitHub sont en place :

- Settings → Branches → `main` → *Require pull request before merging*.
- *Require status checks to pass* (si CI déjà branchée).
- *Restrict who can push to matching branches* (au moins toi).

---

## 3. Audit des variables d'environnement

Avant d'ajouter quoi que ce soit côté Vercel, lister **toutes** les
variables attendues. Voir [`.env.production.example`](../.env.production.example)
pour le canon.

### 3.1 Inventaire minimal (production)

| Domaine        | Variables                                                                 | Sensibilité | Côté            |
|----------------|---------------------------------------------------------------------------|-------------|-----------------|
| Supabase       | `SUPABASE_URL`, `SUPABASE_ANON_KEY`                                       | Publique    | Front + Vercel  |
| Supabase       | `SUPABASE_SERVICE_ROLE_KEY`                                               | **Secrète** | Serveur seul    |
| OpenAI         | `OPENAI_API_KEY`                                                          | **Secrète** | Serveur seul    |
| Anthropic      | `ANTHROPIC_API_KEY`                                                       | **Secrète** | Serveur seul    |
| PayDunya       | `PAYDUNYA_MASTER_KEY`, `PAYDUNYA_PRIVATE_KEY`, `PAYDUNYA_TOKEN`           | **Secrète** | Serveur seul    |
| PayDunya       | `PAYDUNYA_PUBLIC_KEY`                                                     | Publique    | Front autorisé  |
| Stripe         | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`                              | **Secrète** | Serveur seul    |
| Stripe         | `STRIPE_PUBLISHABLE_KEY`                                                  | Publique    | Front autorisé  |
| PayPal         | `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`                               | **Secrète** | Serveur seul    |
| PayPal         | `PAYPAL_CLIENT_ID`                                                        | Publique    | Front autorisé  |
| Wave Business  | `WAVE_BUSINESS_API_KEY`, `WAVE_BUSINESS_WEBHOOK_SECRET`                   | **Secrète** | Serveur seul    |
| URLs           | `MINDPREP_PUBLIC_URL`, `MINDPREP_BACKEND_URL`                             | Publique    | Front + Vercel  |

### 3.2 Règles d'or

- ❌ **Ne JAMAIS** mettre une clé `*_SECRET` ou `*_PRIVATE` dans un
  fichier servi côté front (`index.html`, `app.js`, `core/**/*.js`).
- ❌ **Ne JAMAIS** committer un `.env` rempli. `.gitignore` doit
  l'ignorer (vérifier avec `git check-ignore .env`).
- ✅ Sur Vercel, séparer les environnements *Production*, *Preview*,
  *Development*. Les clés de **production** ne doivent vivre que dans
  *Production*.
- ✅ Marquer chaque variable secrète avec le flag *Sensitive* dans
  l'UI Vercel (le dashboard masquera la valeur après save).
- ✅ Si une clé a fui (commit accidentel, screenshot, log) : **rotation
  immédiate** chez le fournisseur, avant même la migration.

### 3.3 Audit de cohérence

Pour chaque variable du tableau ci-dessus :

```bash
# Présente dans .env local ?
grep -E "^VAR_NAME=" .env

# Mentionnée quelque part dans le code ?
grep -rn "VAR_NAME" --include="*.js" --include="*.mjs" --include="*.html"

# Pas dans .env.example officiel ? -> à ajouter ou à supprimer.
```

Toute variable utilisée par le code mais absente de Vercel = panne en
production. Toute variable dans Vercel mais inutilisée = surface
d'attaque inutile.

---

## 4. Audit Supabase

### 4.1 Configuration actuelle

Le front lit Supabase via [`supabase-config.js`](../supabase-config.js)
qui expose **uniquement** la `url` et l'`anonKey` (publishable). C'est
le comportement attendu : la `anon key` peut vivre dans le front, à
condition que les **Row Level Security policies** soient correctement
posées côté Supabase.

### 4.2 Checklist Supabase avant bascule

- [ ] **RLS activé** sur toutes les tables exposées (`users`, `profiles`,
      `attempts`, `corrections`, `payments`, `subscriptions`, etc.).
- [ ] Policies vérifiées : un utilisateur ne lit/écrit **que** ses propres
      lignes (sauf `is_admin = true`).
- [ ] La `service_role_key` n'est **jamais** envoyée au navigateur.
- [ ] Auth → URL Configuration : ajouter `https://app.mindprep.ai` à
      *Site URL* + *Redirect URLs* **avant** la bascule, sans retirer
      l'URL GitHub Pages tant que `domainStatus = 'pending'`.
- [ ] OAuth Google : ajouter `https://app.mindprep.ai/auth/callback`
      (ou équivalent) dans la console Google Cloud + dans Supabase.
- [ ] CORS : ajouter le nouveau domaine, garder l'ancien le temps de la
      transition.
- [ ] Backup Supabase : déclencher un *Point-in-Time Recovery snapshot*
      manuel juste avant la bascule (Project → Database → Backups).

### 4.3 Test rapide

```bash
# La anon key publique répond bien (200 ou 401, jamais 500)
curl -sI "https://orhikkaqzkyyjagenayn.supabase.co/rest/v1/" \
  -H "apikey: <ANON_KEY>" | head -1
```

---

## 5. Audit IA (OpenAI / Anthropic / Claude)

Les clés IA sont **toutes** secrètes. Si une route serveur les utilise :

- [ ] Aucune clé `OPENAI_API_KEY` ou `ANTHROPIC_API_KEY` n'apparaît dans
      `grep -rn "sk-" --include="*.js" --include="*.html"`.
- [ ] Les appels IA passent par un proxy/edge function (pas d'appel
      direct depuis le navigateur).
- [ ] Quotas / budget plafonnés côté fournisseur (OpenAI → *Usage limits*,
      Anthropic → *Spend limits*).
- [ ] Rotation prête : créer une **deuxième clé** active en parallèle
      avant la bascule, pour pouvoir révoquer la première sans coupure.
- [ ] Logs côté serveur n'incluent pas les payloads complets contenant
      des données utilisateur sensibles (RGPD).

---

## 6. Audit URLs backend & front

Toutes les URLs publiques doivent passer par
[`core/site-config.js`](../core/site-config.js). Aucune URL en dur.

```bash
# Sanity check : aucune URL GitHub Pages ou Vercel codée en dur
# (hors site-config.js, docs et DOMAIN_STATUS.md)
grep -rn "ensupafrique-glitch.github.io\|app.mindprep.ai" \
  --include="*.js" --include="*.mjs" --include="*.html" \
  --exclude-dir=docs \
  | grep -v "site-config.js\|DOMAIN_STATUS\|README"
```

Si la commande renvoie quelque chose hors `site-config.js`, refactorer
**avant** la bascule.

URLs à vérifier explicitement :

- Webhooks paiements (PayDunya, Stripe, PayPal, Wave) → mettront à jour
  leur `*_WEBHOOK_URL` vers `https://app.mindprep.ai/api/webhooks/...`
  uniquement **après** la bascule (cf. checklist).
- Liens dans les emails transactionnels (reset password, invoice).
- Liens dans les QR codes (`core/qr-system/qr-config.js`, **déjà**
  dérivés de `site-config.js`, OK).
- Open Graph / `<link rel="canonical">` dans `index.html` → vérifier
  qu'ils utilisent `getCanonicalUrl()` ou `app.mindprep.ai`.

---

## 7. Audit paiements (PayDunya / Stripe / PayPal / Wave)

| Provider     | Action avant bascule                                                         |
|--------------|------------------------------------------------------------------------------|
| PayDunya     | Mode `test` confirmé sur `.env.production.example`. Webhook URL à laisser pointer vers l'ancien domaine **tant que `domainStatus = 'pending'`**. |
| Stripe       | Endpoint webhook créé en *Test mode* d'abord. Garder l'ancien endpoint actif jusqu'à validation complète. |
| PayPal       | Mode `sandbox` dans `.env.production.example`. Webhook URL à mettre à jour **après** propagation DNS. |
| Wave         | Webhook signature vérifiée serveur ; pas de clé exposée front. |

Règle : **on ne migre jamais un webhook de paiement avant que l'URL
cible réponde HTTP 200.** Sinon les notifications de paiement sont
perdues = utilisateurs facturés sans accès débloqué.

Procédure recommandée pour chaque provider, **après** que
`https://app.mindprep.ai` réponde :

1. Créer le **nouveau** endpoint webhook (`https://app.mindprep.ai/...`).
2. Garder l'**ancien** endpoint actif en parallèle pendant 48h.
3. Surveiller les deux endpoints : tant que les deux reçoivent du
   trafic, la migration est en cours.
4. Désactiver l'ancien quand le nouveau a reçu 100% du trafic pendant
   24h continues.

---

## 8. Audit QR codes

Le système QR est déjà conçu pour la bascule (cf. PR #22 et la PR
courante).

- [ ] `core/qr-system/qr-config.js` ne contient **aucune** URL en dur.
- [ ] `node core/qr-system/generate-assets.mjs` produit des SVG
      **byte-identiques** à `main` tant que `domainStatus = 'pending'`.
- [ ] Les QR déjà imprimés/distribués pointent vers le **fallback**
      GitHub Pages, qui reste actif pendant toute la transition.
- [ ] Après bascule (`domainStatus: 'live'`) : régénérer **et committer**
      `assets/qr/*.svg`. Ne pas distribuer de nouveaux QR avant ce
      commit.

---

## 9. SSL / HTTPS

- [ ] Vercel émet automatiquement un certificat Let's Encrypt après
      validation DNS — **ne pas** essayer de provisionner un certif
      manuellement.
- [ ] Vérifier `https://app.mindprep.ai` répond avec un certificat
      *Issued by Let's Encrypt*, *Subject: app.mindprep.ai*, expiration
      ≥ 60 jours.
- [ ] HSTS : Vercel l'active par défaut sur les domaines custom. Vérifier
      le header `Strict-Transport-Security` côté browser dev tools.
- [ ] Mixed content : aucune ressource servie en `http://` (images,
      fonts, scripts). `grep -rn "http://" --include="*.html"
      --include="*.css"` doit ne renvoyer que des commentaires ou des
      namespaces XML (ex. `xmlns:xlink`).

---

## 10. Responsive & compatibilité navigateurs

À tester **sur l'URL Vercel temporaire** avant DNS, puis re-tester
**sur `app.mindprep.ai`** après bascule :

- [ ] Mobile (375 × 667, iPhone SE) : landing, dashboard, paywall, QR.
- [ ] Mobile (414 × 896) : idem.
- [ ] Tablette (768 × 1024).
- [ ] Desktop (1440 × 900).
- [ ] Chrome, Safari, Firefox, Edge — versions stables courantes.
- [ ] Mode invité (sans auth) : les pages publiques se chargent.
- [ ] Mode connecté : Supabase auth fonctionne, sessions persistent.

Le script `scripts/smoke-test-migration.mjs` automatise une partie de
ces vérifications côté HTTP/contenu (cf. §13).

---

## 11. Rollback

Voir le document dédié : [`docs/16-rollback-plan.md`](./16-rollback-plan.md).

Résumé express :

1. Repasser `core/site-config.js` → `domainStatus: 'pending'`.
2. Régénérer les QR (`node core/qr-system/generate-assets.mjs`).
3. Committer + pousser → GitHub Pages reprend la main automatiquement
   pour les nouveaux QR. Les anciens pointaient déjà sur le fallback.
4. Si le DNS pointe déjà sur Vercel et que Vercel est en panne :
   retirer le record `CNAME app` chez le registrar **OU** retirer le
   domaine côté Vercel (Project → Domains → ⋯ → Remove). La résolution
   tombe en NXDOMAIN, GitHub Pages fallback reste atteignable via son
   URL native.

Temps cible : **< 10 minutes** entre détection d'incident et rollback
complet.

---

## 12. Maintien de Netlify / GitHub Pages / version de secours

- **GitHub Pages** : ne pas désactiver tant que le nouveau domaine n'a
  pas tourné 7 jours en production sans incident.
- **Netlify** (`netlify.toml` présent dans le repo) : laissé tel quel.
  Il n'est pas en service actif, mais le fichier permet de redéployer
  sur Netlify en moins de 5 minutes en cas de panne globale Vercel.
- **Tag `pre-vercel-migration`** : permet de revenir précisément à
  l'état antérieur en cas de doute (`git checkout pre-vercel-migration`).
- **Branche `vercel-app-mindprep-ai`** : ne pas supprimer après merge,
  utile pour audit post-migration.

Combinaison = **trois plans de secours indépendants** : tag git,
GitHub Pages live, Netlify activable.

---

## 13. Smoke test automatisé

Un script non destructif est fourni :
[`scripts/smoke-test-migration.mjs`](../scripts/smoke-test-migration.mjs).

```bash
# Tester l'URL temporaire Vercel avant bascule DNS
MINDPREP_BASE_URL=https://mindprep-app.vercel.app \
  node scripts/smoke-test-migration.mjs

# Tester le fallback GitHub Pages (doit toujours répondre)
MINDPREP_BASE_URL=https://ensupafrique-glitch.github.io/mindprep-app \
  node scripts/smoke-test-migration.mjs

# Tester le domaine cible (après DNS + SSL)
MINDPREP_BASE_URL=https://app.mindprep.ai \
  node scripts/smoke-test-migration.mjs
```

Le script vérifie : présence + statut HTTP de la landing, du dashboard,
du studio QR, des assets QR, des mentions paiements / PayDunya, du mode
invité, et des exports PDF/Word détectables statiquement. Il **n'envoie
aucun secret**, **n'écrit aucune donnée**, **ne déclenche aucun
paiement**.

---

## 14. Garantie de non-régression du comportement applicatif

Tant que `core/site-config.js` reste à `domainStatus: 'pending'` :

- L'app continue à servir le fallback GitHub Pages.
- Les QR encodent l'URL fallback.
- Aucun fichier ajouté par cette PR n'est chargé par l'app
  (`docs/`, `MIGRATION_CHECKLIST.md`, `scripts/`,
  `.env.production.example` ne sont pas référencés depuis `index.html`,
  `app.js` ou `core/`).
- `vercel.json` et `netlify.toml` cohabitent : chacun n'est lu que par
  son hébergeur respectif.

La bascule reste **un seul commit** avec **une seule ligne changée**,
parfaitement annulable.

---

## 15. Références

- [`docs/14-vercel-deployment.md`](./14-vercel-deployment.md) — procédure technique.
- [`docs/16-rollback-plan.md`](./16-rollback-plan.md) — plan de retour arrière.
- [`MIGRATION_CHECKLIST.md`](../MIGRATION_CHECKLIST.md) — checklist humaine.
- [`DOMAIN_STATUS.md`](../DOMAIN_STATUS.md) — statut courant.
- [`.env.production.example`](../.env.production.example) — variables attendues.
- [`scripts/smoke-test-migration.mjs`](../scripts/smoke-test-migration.mjs) — tests HTTP non destructifs.
