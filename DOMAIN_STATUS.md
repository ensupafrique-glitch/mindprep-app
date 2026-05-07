# Statut du domaine `app.mindprep.ai`

> Source de vérité « humaine » du chantier domaine. Le code lit
> [`core/site-config.js`](./core/site-config.js) (champ `domainStatus`).
> Mettre les deux à jour ensemble lors de chaque étape franchie.

## État actuel

| Élément                                          | Statut       |
|--------------------------------------------------|--------------|
| `mindprep.ai` résout (apex)                      | ✅ — `34.111.179.208` (vérifié) |
| `app.mindprep.ai` résout                         | ❌ — pas de record DNS pour le moment |
| Repo importé dans Vercel                         | ⬜ — à faire |
| Domaine `app.mindprep.ai` ajouté côté Vercel     | ⬜ — à faire |
| `CNAME app → cname.vercel-dns.com` créé          | ⬜ — à faire |
| Certificat HTTPS émis par Vercel                 | ⬜ — à faire |
| `https://app.mindprep.ai/` accessible            | ⬜ — à faire |
| `core/site-config.js` → `domainStatus: 'live'`   | ⬜ — à faire |
| QR régénérés (`assets/qr/*.svg`)                 | ⬜ — à faire |

Hébergement actif (fallback) :
**`https://ensupafrique-glitch.github.io/mindprep-app/`** — GitHub Pages.

## Avant toute action — sécurité

Lire **dans cet ordre** :

1. [`docs/15-securite-migration.md`](./docs/15-securite-migration.md) — protocole de sécurité (sauvegarde, audit env, Supabase, IA, paiements, SSL, responsive, rollback).
2. [`MIGRATION_CHECKLIST.md`](./MIGRATION_CHECKLIST.md) — checklist opérationnelle à cocher (phases A → E).
3. [`.env.production.example`](./.env.production.example) — variables à saisir côté Vercel (aucun secret).
4. [`docs/16-rollback-plan.md`](./docs/16-rollback-plan.md) — plan de retour arrière (L1 à L4).

Smoke test non destructif :
```bash
MINDPREP_BASE_URL=https://<projet>.vercel.app node scripts/smoke-test-migration.mjs
```

## Comment basculer

1. Suivre [`docs/14-vercel-deployment.md`](./docs/14-vercel-deployment.md)
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
# attendu (live) : cname.vercel-dns.com. + une IP Vercel

# HTTPS
curl -sI https://app.mindprep.ai | head -1
# attendu (live) : HTTP/2 200

# QR encodé après bascule
grep -o 'https://app.mindprep.ai[^"]*' assets/qr/mindprep-qr-student-light.svg | head -1
```

## En cas de retour arrière

Si Vercel pose problème, repasser `domainStatus` à `'pending'` puis
régénérer les QR : ils pointeront à nouveau vers GitHub Pages. Aucune
republication des QR papier déjà imprimés n'est nécessaire — ils restent
valides tant que GitHub Pages est en ligne.
