# Checklist opérationnelle — bascule `app.mindprep.ai`

> Liste à cocher par l'administrateur, **dans l'ordre**. Ne pas sauter
> d'étape. Tant qu'une étape n'est pas cochée, **ne pas** passer à la
> suivante.
>
> Voir [`docs/15-securite-migration.md`](./docs/15-securite-migration.md)
> pour le détail des contrôles, et [`docs/14-vercel-deployment.md`](./docs/14-vercel-deployment.md)
> pour la procédure technique.

---

## Phase A — Pré-migration (avant toute action externe)

### A1. Sauvegarde

- [ ] Tag git créé : `git tag pre-vercel-migration && git push origin pre-vercel-migration`
- [ ] Archive `tar.gz` du repo HEAD stockée hors GitHub (cloud perso / disque externe)
- [ ] Snapshot Supabase déclenché manuellement (Database → Backups)
- [ ] Branches protégées vérifiées sur GitHub (`main` non force-pushable)

### A2. Audit code & secrets

- [ ] `git check-ignore .env` retourne `.env` (le fichier rempli est ignoré)
- [ ] Aucune clé `sk-…`, `sk_live_…`, `whsec_…`, `paydunya_*` ne sort de `grep -rE "sk-|sk_live_|whsec_|paydunya_(master|private|token)" --include="*.js" --include="*.html" --include="*.mjs"`
- [ ] Aucune URL en dur hors `core/site-config.js` (cf. §6 du protocole sécurité)
- [ ] `node -e "import('./core/site-config.js').then(m => console.log(m.SITE_CONFIG))"` affiche `domainStatus: 'pending'`

### A3. Audit Supabase

- [ ] RLS activé sur toutes les tables exposées
- [ ] Policies relues (un user ne lit que ses propres lignes)
- [ ] `service_role_key` absente du front (`grep -rn "service_role" --include="*.js" --include="*.html"` → 0 résultat)
- [ ] `https://app.mindprep.ai` ajouté à *Site URL* + *Redirect URLs* Supabase
- [ ] OAuth Google : redirect URI `https://app.mindprep.ai/...` ajouté côté Google Cloud
- [ ] Ancien domaine GitHub Pages **toujours** présent dans la liste (transition)

### A4. Audit IA

- [ ] `OPENAI_API_KEY` et `ANTHROPIC_API_KEY` non présentes côté front
- [ ] Quotas / spend limits configurés chez les fournisseurs
- [ ] Deuxième clé IA active créée (pour rotation sans coupure)

### A5. Audit paiements

- [ ] PayDunya : webhooks pointent encore sur l'ancien endpoint
- [ ] Stripe : webhook signing secret connu, endpoint courant fonctionnel
- [ ] PayPal : mode `sandbox` confirmé tant que la migration n'est pas finie
- [ ] Wave Business : signature webhook validée serveur

### A6. Préparation Vercel (sans DNS)

- [ ] Compte Vercel créé (ou existant) avec MFA activée
- [ ] Repo importé dans Vercel — preset *Other*, sans build command
- [ ] Variables d'environnement *Production* saisies depuis `.env.production.example`
- [ ] Toutes les variables `*_SECRET`, `*_PRIVATE`, `*_KEY` (sauf `*_PUBLIC_KEY` et `*_PUBLISHABLE_KEY`) marquées **Sensitive**
- [ ] Premier déploiement Vercel réussi sur l'URL `*.vercel.app`

### A7. Smoke test sur URL temporaire Vercel

- [ ] `MINDPREP_BASE_URL=https://<projet>.vercel.app node scripts/smoke-test-migration.mjs` → tous les checks passent
- [ ] Test manuel : landing, dashboard, paywall, QR studio (`/qr.html`), assets QR (`/assets/qr/...svg`)
- [ ] Test manuel : connexion Supabase via le formulaire d'auth
- [ ] Test mobile (375 px) + desktop (1440 px)
- [ ] Aucun mixed content dans la console browser

> ✋ **Stop** si une seule case A1–A7 n'est pas cochée. Ne pas toucher au DNS.

---

## Phase B — Migration DNS

### B1. Vercel

- [ ] Domaine `app.mindprep.ai` ajouté dans Project → Settings → Domains
- [ ] Vercel affiche les instructions DNS (CNAME vers `cname.vercel-dns.com`)

### B2. Registrar DNS

- [ ] Registrar identifié (OVH / Cloudflare / Namecheap / GoDaddy / autre) : ___________
- [ ] Record CNAME créé : `app` → `cname.vercel-dns.com.` (TTL 300s)
- [ ] Cloudflare : proxy désactivé (nuage gris) le temps de la première validation
- [ ] `dig +short app.mindprep.ai` retourne `cname.vercel-dns.com.` puis une IP Vercel

### B3. SSL

- [ ] Vercel affiche **Valid Configuration** + **SSL Issued** dans Domains
- [ ] `curl -sI https://app.mindprep.ai | head -1` → `HTTP/2 200`
- [ ] Certificat émis par Let's Encrypt, expiration ≥ 60j (vérifié dans le browser)
- [ ] Header `Strict-Transport-Security` présent

### B4. Smoke test sur domaine final

- [ ] `MINDPREP_BASE_URL=https://app.mindprep.ai node scripts/smoke-test-migration.mjs` → OK
- [ ] `MINDPREP_BASE_URL=https://ensupafrique-glitch.github.io/mindprep-app node scripts/smoke-test-migration.mjs` → OK (fallback toujours vivant)

> ✋ **Stop** si B4 échoue. Ne pas activer `domainStatus: 'live'`.

---

## Phase C — Bascule applicative

### C1. Code

- [ ] Édition `core/site-config.js` : `domainStatus: 'pending'` → `'live'`
- [ ] `node core/qr-system/generate-assets.mjs` exécuté sans erreur
- [ ] `git diff` montre uniquement la ligne `domainStatus` + les SVG QR
- [ ] Commit créé : `feat(deploy): bascule live app.mindprep.ai`
- [ ] Push sur `main`
- [ ] Vercel redéploie automatiquement et le déploiement passe vert

### C2. Webhooks paiements (après C1 validée)

- [ ] PayDunya : nouveau webhook `https://app.mindprep.ai/api/webhooks/paydunya` créé, ancien gardé actif
- [ ] Stripe : nouveau webhook créé en *Live mode*, signing secret mis à jour côté Vercel
- [ ] PayPal : webhook URL mise à jour (et passage `live` si pertinent)
- [ ] Wave Business : webhook URL mise à jour
- [ ] Test de paiement bout-en-bout en environnement test (un par provider actif)

### C3. Validation utilisateur

- [ ] Création de compte test sur `https://app.mindprep.ai`
- [ ] Connexion email + mot de passe OK
- [ ] Connexion Google OAuth OK
- [ ] Diagnostic / mini-test fonctionnel
- [ ] Flux paywall → page de paiement charge sans erreur (sans aller jusqu'au paiement réel)
- [ ] Export PDF / Word (si applicable) téléchargeable
- [ ] QR scanné depuis téléphone → ouvre `https://app.mindprep.ai/?qr=...`

---

## Phase D — Post-migration (J+1 à J+7)

- [ ] J+1 : monitoring webhook double (ancien + nouveau endpoint) — aucun appel perdu
- [ ] J+1 : Sentry / logs Vercel — aucun pic d'erreur
- [ ] J+3 : ancien webhook désactivé (provider par provider) après 24h sans appel
- [ ] J+7 : `assets/qr/*.svg` régénérés et committés si non fait
- [ ] J+7 : `DOMAIN_STATUS.md` toutes les cases cochées
- [ ] J+7 : ancien domaine GitHub Pages **non** désactivé (laissé en filet de sécurité)
- [ ] J+30 : décision *go / no-go* sur la suppression de GitHub Pages

---

## Phase E — En cas d'incident

Voir [`docs/16-rollback-plan.md`](./docs/16-rollback-plan.md). Procédure
résumée :

- [ ] `core/site-config.js` → `domainStatus: 'pending'`
- [ ] `node core/qr-system/generate-assets.mjs`
- [ ] Commit + push (`fix(deploy): rollback app.mindprep.ai`)
- [ ] Vérifier que le fallback GitHub Pages répond
- [ ] Si Vercel down : retirer le CNAME chez le registrar OU le domaine côté Vercel
- [ ] Communication aux utilisateurs (status page / réseaux sociaux)
- [ ] Post-mortem dans les 48h
