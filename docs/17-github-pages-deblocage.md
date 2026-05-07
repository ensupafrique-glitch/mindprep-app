# Déblocage sans Vercel — `app.mindprep.ai` via GitHub Pages

> **Contexte.** La vérification téléphone Vercel est bloquée 12 h. On ne
> peut pas s'appuyer dessus pour brancher `app.mindprep.ai` maintenant.
> L'app est déjà publiée sur
> <https://ensupafrique-glitch.github.io/mindprep-app/> — on connecte donc
> le domaine personnalisé directement à **GitHub Pages**, sans dépendre
> d'un tiers. Vercel et Netlify restent des options secondaires, on ne
> supprime aucun de leurs fichiers de configuration.

## ⛔ Garde-fou — fichier `CNAME` racine

> **Ne pas merger un fichier `CNAME` à la racine de `main` tant que le
> DNS n'est pas configuré et la bascule finale approuvée.** Une PR
> précédente l'a fait, ce qui a déclenché côté GitHub Pages la bascule
> automatique vers `app.mindprep.ai` alors que le DNS n'était pas prêt
> — risque immédiat de coupure du fallback `*.github.io`. Le custom
> domain a été retiré manuellement via l'API GitHub et le fichier
> supprimé de `main` (commit `9440f74`).
>
> Modèle conservé dans
> [`../domain/CNAME.example`](../domain/CNAME.example) — voir
> [`../domain/README.md`](../domain/README.md) pour les conditions
> d'activation.

## Ce qui est fait dans ce PR (côté code)

- **Pas de fichier `CNAME` à la racine** tant que `domainStatus` reste
  `pending`. Le fichier sera créé soit par GitHub Pages lui-même
  (au moment du *Save* dans Settings → Pages), soit en copiant
  [`../domain/CNAME.example`](../domain/CNAME.example) — uniquement
  après que toutes les étapes ci-dessous soient validées.
- **`core/site-config.js`** : `provider: 'github_pages'`,
  `productionUrl: 'https://app.mindprep.ai'`,
  `fallbackUrl: 'https://ensupafrique-glitch.github.io/mindprep-app/'`,
  `domainStatus: 'pending'`. Tant que le DNS n'est pas branché, les QR
  encodent le fallback GitHub Pages (toujours en ligne).
- **`scripts/smoke-test-migration.mjs`** : déjà paramétré par
  `MINDPREP_BASE_URL`, on peut donc tester n'importe quel host
  (`app.mindprep.ai`, le sous-domaine GitHub Pages, le `*.vercel.app`).

## Procédure humaine — étape par étape

> Aucun secret, aucune commande destructive. À effectuer dans l'ordre.

### 1. Vérifier que GitHub Pages publie bien le repo

GitHub → repo `mindprep-app` → **Settings → Pages**. La source doit être
soit *Deploy from a branch* (`main` / `/`), soit l'action GitHub Pages
existante. La page publique reste
<https://ensupafrique-glitch.github.io/mindprep-app/> tant que le custom
domain n'est pas activé.

### 2. Renseigner le custom domain côté GitHub

> ⚠️ **À faire seulement après l'étape 3** (record DNS créé chez le
> registrar). Saisir le custom domain avant que le DNS résolve déclenche
> chez GitHub un *DNS check failed* qui peut rendre le site
> momentanément inaccessible.

**Settings → Pages → Custom domain**. Saisir :

```
app.mindprep.ai
```

Cliquer **Save**. GitHub écrit alors automatiquement le fichier
`CNAME` à la racine du repo. C'est la méthode recommandée — on
n'ajoute pas ce fichier par PR. **Ne pas cocher *Enforce HTTPS*** tant
que le check DNS n'est pas vert (sinon GitHub bloque le site
temporairement).

> Si pour une raison quelconque GitHub Pages n'écrit pas le `CNAME`
> automatiquement, copier le modèle :
>
> ```bash
> cp docs/domain/CNAME.example CNAME
> git add CNAME
> git commit -m "feat(domain): activate custom domain app.mindprep.ai"
> git push
> ```
>
> Faire ce commit **uniquement après** que `dig +short app.mindprep.ai`
> retourne bien `ensupafrique-glitch.github.io`.

### 3. Créer le record DNS chez le registrar

Chez le registrar de `mindprep.ai` (Namecheap, OVH, Gandi, Cloudflare,
etc.), ajouter **un seul** record :

| Type   | Host  | Valeur                              | TTL          |
|--------|-------|-------------------------------------|--------------|
| CNAME  | `app` | `ensupafrique-glitch.github.io`     | auto / 3600  |

> ⚠️ Pas de slash final, pas de `https://`, pas de `/mindprep-app`.
> GitHub résout le bon repo grâce au fichier `CNAME` du repo.

Vérifier la propagation :

```bash
dig +short app.mindprep.ai
# attendu : ensupafrique-glitch.github.io. + une IP GitHub Pages
```

Délai typique : 5 à 30 minutes (parfois jusqu'à 24 h selon le registrar).

### 4. Activer Enforce HTTPS

Quand GitHub affiche **DNS check successful** dans Settings → Pages,
cocher **Enforce HTTPS**. GitHub Pages émet alors un certificat
Let's Encrypt automatiquement (quelques minutes).

### 5. Vérifier le site

```bash
# Doit renvoyer HTTP/2 200 (ou 301 → https)
curl -sI https://app.mindprep.ai/         | head -1
curl -sI https://app.mindprep.ai/qr.html  | head -1
```

Smoke test complet :

```bash
MINDPREP_BASE_URL=https://app.mindprep.ai \
  node scripts/smoke-test-migration.mjs
```

### 6. Basculer `domainStatus` puis régénérer les QR

```diff
 // core/site-config.js
-  domainStatus: 'pending',
+  domainStatus: 'live',
```

```bash
node core/qr-system/generate-assets.mjs
git add core/site-config.js assets/qr/*.svg
git commit -m "feat(domain): bascule app.mindprep.ai en live (GitHub Pages)"
```

À ce stade, les nouveaux QR encodent `https://app.mindprep.ai/?qr=…`.
Les QR papier déjà distribués (qui pointent vers le fallback GitHub
Pages) restent valides — c'est exactement le même hôte.

## Rollback

| Niveau | Quand                                        | Action                                                                                                       |
|--------|----------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| L1     | DNS lent / certificat pas encore émis        | Décocher *Enforce HTTPS* dans Settings → Pages, attendre.                                                    |
| L2     | Custom domain casse l'accès au site          | Settings → Pages → vider le champ *Custom domain* (GitHub Pages reprend immédiatement sur le sous-domaine).  |
| L3     | Besoin d'annuler côté repo                   | Supprimer le fichier `CNAME` à la racine et committer (même réflexe qu'au commit `9440f74`).                  |
| L4     | Besoin de revenir en `pending` côté QR       | Repasser `domainStatus: 'pending'` dans `core/site-config.js`, régénérer les QR.                             |

Le fallback `https://ensupafrique-glitch.github.io/mindprep-app/`
reste en ligne quoi qu'il arrive — pas de rupture de service possible.

## Pourquoi pas Vercel / Netlify maintenant

- **Vercel** : vérification téléphone bloquée 12 h chez l'utilisateur.
  Le code (`vercel.json`, `docs/14-vercel-deployment.md`) est conservé,
  on pourra basculer plus tard sans rien réécrire — il suffira de
  changer `provider: 'vercel'` dans `core/site-config.js` et de pointer
  le CNAME vers `cname.vercel-dns.com`.
- **Netlify** : `netlify.toml` est conservé en place, même logique.

GitHub Pages sert un site statique, sans build, et supporte les custom
domains nativement — c'est exactement ce dont MindPrep a besoin pour
débloquer la situation aujourd'hui.

## Aide-mémoire — vérifications rapides

```bash
# 1. Le fichier CNAME publié contient le bon domaine ?
#    À tester UNIQUEMENT après que GitHub Pages a écrit le fichier
#    CNAME suite au Save dans Settings → Pages. Tant que le DNS n'est
#    pas prêt, ce fichier ne doit pas exister à la racine.
curl -s https://ensupafrique-glitch.github.io/mindprep-app/CNAME
# attendu : app.mindprep.ai

# 2. DNS branché ?
dig +short app.mindprep.ai
# attendu : ensupafrique-glitch.github.io. + IP GitHub Pages

# 3. HTTPS actif ?
curl -sI https://app.mindprep.ai/ | head -1
# attendu : HTTP/2 200

# 4. QR encode le bon host (après bascule live) ?
grep -o 'https://app.mindprep.ai[^"]*' \
  assets/qr/mindprep-qr-student-light.svg | head -1
```
