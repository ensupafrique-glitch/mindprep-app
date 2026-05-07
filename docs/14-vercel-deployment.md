# Déploiement Vercel & domaine `app.mindprep.ai`

> Objectif : héberger MindPrep sur **Vercel** et brancher le domaine
> personnalisé **`app.mindprep.ai`**, puis pointer les QR codes vers cette
> nouvelle URL — sans casser l'hébergement GitHub Pages existant pendant la
> bascule.

## Vue d'ensemble

```
GitHub repo (ensupafrique-glitch/mindprep-app)
      │
      ├──►  GitHub Pages          ── https://ensupafrique-glitch.github.io/mindprep-app/
      │     (fallback actif aujourd'hui — laissé en place pendant la bascule)
      │
      └──►  Vercel project         ── https://app.mindprep.ai      (cible finale)
                                     ├── *.vercel.app              (preview / vérification)
                                     └── DNS : CNAME app → cname.vercel-dns.com
```

Le projet est 100 % statique (HTML/CSS/JS modules ESM), pas de build
Node nécessaire. `vercel.json` à la racine déclare les bons headers
(MIME `application/javascript` pour les modules) et un alias `/qr` →
`qr.html` pour le studio QR.

## Étape 1 — Importer le repo dans Vercel

1. Aller sur <https://vercel.com/new> et choisir **Import Git Repository**.
2. Autoriser Vercel à lire l'organisation `ensupafrique-glitch` si nécessaire.
3. Sélectionner le repo **`mindprep-app`**.
4. Dans l'écran *Configure Project* :
   - **Framework Preset** : `Other` (ou *None*).
   - **Root Directory** : `.` (la racine).
   - **Build Command** : laisser **vide** (le projet est statique).
   - **Output Directory** : `.` (déjà déclaré dans `vercel.json`).
   - **Install Command** : laisser vide.
5. Cliquer **Deploy**. Vercel attribue une URL `https://<nom-projet>.vercel.app`.
6. Ouvrir cette URL et vérifier que :
   - `index.html` se charge,
   - `qr.html` est accessible (`/qr.html` ou `/qr`),
   - les modules `core/**/*.js` sont servis avec `Content-Type:
     application/javascript`,
   - les SVG QR (`/assets/qr/*.svg`) s'ouvrent correctement.

> ⚠️ Tant que cette étape n'est pas validée, **ne pas** modifier le DNS.

## Étape 2 — Ajouter le domaine `app.mindprep.ai` côté Vercel

1. Dans le dashboard Vercel : **Project → Settings → Domains**.
2. Cliquer **Add**, saisir `app.mindprep.ai`, valider.
3. Vercel affiche les instructions DNS — on attend un **CNAME** vers
   `cname.vercel-dns.com`. Garder cet onglet ouvert.

## Étape 3 — Configurer le DNS chez le registrar

Chez le registrar qui héberge `mindprep.ai` (OVH, Cloudflare, Namecheap, GoDaddy…) :

| Type   | Nom (host) | Valeur                  | TTL   |
|--------|------------|-------------------------|-------|
| CNAME  | `app`      | `cname.vercel-dns.com.` | 300 s |

> Ne **pas** mettre de protocole (`https://`) ni de slash dans la valeur.
> Le point final après `.com` est optionnel selon le registrar.

Si Cloudflare est utilisé en proxy : passer le record en **DNS only** (nuage
gris) le temps de la première validation, on peut réactiver le proxy plus
tard si besoin.

## Étape 4 — Attendre la propagation DNS et le SSL

1. La propagation DNS prend de 5 minutes à 1 heure (parfois plus).
2. Vérifier en ligne de commande :
   ```bash
   dig +short app.mindprep.ai
   # doit retourner cname.vercel-dns.com. puis une IP Vercel
   ```
3. Vercel détecte automatiquement la résolution et génère un certificat
   Let's Encrypt (1 à 5 minutes en général).
4. Quand le statut passe à **Valid Configuration** + **SSL Issued** dans
   l'onglet *Domains*, on est bon.

## Étape 5 — Vérifier `https://app.mindprep.ai`

Tester :

- [ ] `https://app.mindprep.ai` → page d'accueil MindPrep.
- [ ] `https://app.mindprep.ai/qr.html` → studio QR.
- [ ] `https://app.mindprep.ai/?qr=student` → landing post-scan « Étudiant ».
- [ ] `https://app.mindprep.ai/assets/qr/mindprep-qr-student-light.svg` →
      SVG QR servi avec `Content-Type: image/svg+xml`.
- [ ] Console navigateur : aucune erreur de chargement de module ESM.

## Étape 6 — Basculer la cible des QR

Une fois `https://app.mindprep.ai` validé en HTTPS :

1. Éditer `core/site-config.js` :
   ```diff
   -  domainStatus: 'pending',
   +  domainStatus: 'live',
   ```
2. Régénérer les visuels QR :
   ```bash
   node core/qr-system/generate-assets.mjs
   ```
   Cela réécrit `assets/qr/mindprep-qr-<variant>-<theme>.svg` (10 fichiers).
3. Vérifier qu'au moins un SVG encode bien la nouvelle URL :
   ```bash
   grep -o 'https://app.mindprep.ai[^"]*' assets/qr/mindprep-qr-student-light.svg
   ```
4. Mettre à jour `DOMAIN_STATUS.md` (cocher les cases franchies).
5. Committer et ouvrir une PR « QR : bascule sur app.mindprep.ai ».

## Compatibilité GitHub Pages (rollback)

GitHub Pages reste joignable pendant et après la bascule. Concrètement :

- les anciens QR distribués (qui pointent vers
  `ensupafrique-glitch.github.io/mindprep-app/`) continuent de fonctionner,
- en cas de panne Vercel, on peut repasser `domainStatus` à `'pending'`
  pour réémettre des QR vers GitHub Pages,
- `netlify.toml` (héritage) et `vercel.json` (nouveau) coexistent sans se
  marcher dessus — chaque hôte ne lit que son fichier.

## Variables d'environnement

L'app statique n'a pas besoin de variables côté Vercel pour fonctionner.
Si plus tard on ajoute des fonctions serverless (paiement, webhooks
PayDunya/Stripe/PayPal/Wave), porter les clés depuis `.env.example` dans
**Project → Settings → Environment Variables**, en respectant la séparation
*publishable* (Production + Preview + Development) vs *secret* (Production
seulement, jamais exposée côté client).

## Aide-mémoire « ça ne marche pas »

| Symptôme                                       | Cause probable                                  | Action                                                                 |
|-----------------------------------------------|------------------------------------------------|------------------------------------------------------------------------|
| `app.mindprep.ai` ne résout pas               | DNS non propagé                                | Attendre, re-tester `dig`                                              |
| `ERR_SSL_PROTOCOL_ERROR`                      | Certificat pas encore émis                     | Attendre, ou re-cliquer **Refresh** côté Vercel                        |
| Modules ESM bloqués (MIME)                    | `vercel.json` non pris en compte               | Redeployer, vérifier que le fichier est bien à la racine               |
| QR ne pointe pas encore sur `app.mindprep.ai` | Bascule non faite                              | `domainStatus: 'live'` dans `core/site-config.js` puis régénérer       |
| Cloudflare retourne 522                       | Proxy actif sur le CNAME                       | Passer le record en **DNS only**                                       |
