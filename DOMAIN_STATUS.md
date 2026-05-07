# Statut du domaine `app.mindprep.ai`

> Source de vérité « humaine » du chantier domaine. Le code lit
> [`core/site-config.js`](./core/site-config.js)
> (`provider`, `domainStatus`). Mettre les deux à jour ensemble lors de
> chaque étape franchie.

## Voie active : GitHub Pages (priorité)

L'utilisateur est bloqué 12 h sur la vérification téléphone Vercel. On
branche donc `app.mindprep.ai` sur **GitHub Pages**, qui publie déjà
l'app à <https://ensupafrique-glitch.github.io/mindprep-app/>.

**Procédure complète :** [`docs/17-github-pages-deblocage.md`](./docs/17-github-pages-deblocage.md).

| Élément                                          | Statut       |
|--------------------------------------------------|--------------|
| `mindprep.ai` résout (apex)                      | ✅ — `34.111.179.208` (vérifié) |
| `app.mindprep.ai` résout                         | ❌ — pas encore de record DNS |
| Fichier `CNAME` à la racine (= `app.mindprep.ai`)| ✅ — présent dans ce PR |
| Custom domain saisi dans Settings → Pages        | ⬜ — à faire (humain) |
| `CNAME app → ensupafrique-glitch.github.io` créé | ⬜ — à faire (registrar) |
| GitHub *DNS check successful*                    | ⬜ — à attendre |
| *Enforce HTTPS* coché                            | ⬜ — à faire après check vert |
| `https://app.mindprep.ai/` accessible            | ⬜ — à faire |
| `core/site-config.js` → `domainStatus: 'live'`   | ⬜ — à faire |
| QR régénérés (`assets/qr/*.svg`)                 | ⬜ — à faire |

Hébergement actif (fallback) :
**`https://ensupafrique-glitch.github.io/mindprep-app/`** — GitHub Pages.

## Voies secondaires (mises en attente)

Conservées pour plus tard, **rien n'est supprimé** :

- **Vercel** — voir [`docs/14-vercel-deployment.md`](./docs/14-vercel-deployment.md).
  Bloqué actuellement par la vérification téléphone (12 h). On bascule en
  passant `provider: 'vercel'` dans `core/site-config.js` + CNAME vers
  `cname.vercel-dns.com`.
- **Netlify** — `netlify.toml` toujours en place, même logique.

## Avant toute action — sécurité

Lire **dans cet ordre** :

1. [`docs/17-github-pages-deblocage.md`](./docs/17-github-pages-deblocage.md) — procédure ACTIVE (GitHub Pages).
2. [`docs/15-securite-migration.md`](./docs/15-securite-migration.md) — protocole de sécurité (sauvegarde, audit env, SSL, rollback).
3. [`MIGRATION_CHECKLIST.md`](./MIGRATION_CHECKLIST.md) — checklist opérationnelle.
4. [`docs/16-rollback-plan.md`](./docs/16-rollback-plan.md) — plan de retour arrière.

Smoke test non destructif :
```bash
MINDPREP_BASE_URL=https://app.mindprep.ai \
  node scripts/smoke-test-migration.mjs

# ou sur le fallback tant que le DNS n'est pas branché :
MINDPREP_BASE_URL=https://ensupafrique-glitch.github.io/mindprep-app \
  node scripts/smoke-test-migration.mjs
```

## Comment basculer

1. Suivre [`docs/17-github-pages-deblocage.md`](./docs/17-github-pages-deblocage.md)
   jusqu'à ce que `https://app.mindprep.ai/` réponde en HTTPS.
2. Éditer `core/site-config.js` :
   ```diff
   -  domainStatus: 'pending',
   +  domainStatus: 'live',
   ```
3. Régénérer les visuels :
   ```bash
   node core/qr-system/generate-assets.mjs
   ```
4. Cocher les cases ci-dessus, committer.

## Vérifier rapidement

```bash
# DNS
dig +short app.mindprep.ai
# attendu (live) : ensupafrique-glitch.github.io. + IP GitHub Pages

# HTTPS
curl -sI https://app.mindprep.ai | head -1
# attendu (live) : HTTP/2 200

# CNAME publié par GitHub Pages
curl -s https://ensupafrique-glitch.github.io/mindprep-app/CNAME
# attendu : app.mindprep.ai

# QR encodé après bascule
grep -o 'https://app.mindprep.ai[^"]*' assets/qr/mindprep-qr-student-light.svg | head -1
```

## En cas de retour arrière

| Niveau | Action                                                                                       |
|--------|----------------------------------------------------------------------------------------------|
| L1     | Décocher *Enforce HTTPS* dans Settings → Pages.                                              |
| L2     | Vider le champ *Custom domain* (GitHub Pages reprend sur le sous-domaine `*.github.io`).     |
| L3     | Supprimer le fichier `CNAME` à la racine et committer.                                       |
| L4     | Repasser `domainStatus: 'pending'` dans `core/site-config.js`, régénérer les QR.             |

Le fallback `https://ensupafrique-glitch.github.io/mindprep-app/`
reste en ligne quoi qu'il arrive — pas de rupture de service possible
pour les QR papier déjà imprimés.
