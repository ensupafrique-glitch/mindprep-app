# Plan de rollback — bascule `app.mindprep.ai`

> Procédure à exécuter en cas d'incident pendant ou après la migration
> vers Vercel + `app.mindprep.ai`. **Objectif : retour à l'état stable
> en < 10 minutes.**

Voir aussi [`docs/15-securite-migration.md`](./15-securite-migration.md)
et [`MIGRATION_CHECKLIST.md`](../MIGRATION_CHECKLIST.md).

## Cas particulier — `CNAME` racine mergé prématurément

Si un fichier `CNAME` se retrouve à la racine de `main` alors que le
DNS n'est pas encore prêt (cas de la PR #23, mai 2026) :

1. **Côté GitHub** : retirer immédiatement le custom domain via
   *Settings → Pages → Custom domain* (vider le champ) ou via
   l'API `PUT /repos/:owner/:repo/pages` avec `cname: null`.
2. **Côté repo** : ouvrir une PR safety qui supprime le `CNAME` racine
   et la merger en priorité (cf. commit `9440f74`).
3. **Vérifier** que `https://ensupafrique-glitch.github.io/mindprep-app/`
   redevient accessible — c'est l'URL fallback à protéger.
4. **Ne pas re-merger** un `CNAME` racine avant d'avoir terminé les
   étapes DNS de [`docs/17-github-pages-deblocage.md`](./17-github-pages-deblocage.md).
5. Garder le modèle `docs/domain/CNAME.example` comme référence — il
   ne déclenche aucune bascule GitHub Pages parce qu'il n'est pas à la
   racine.

---

## Niveaux de rollback

| Niveau | Symptôme                                                   | Action                                       | Temps cible |
|--------|------------------------------------------------------------|----------------------------------------------|-------------|
| L1     | Bug applicatif après bascule, mais Vercel + DNS OK         | Repasser `domainStatus: 'pending'`           | 3 min       |
| L2     | Vercel répond mal, GitHub Pages OK                         | L1 + retirer le domaine côté Vercel          | 7 min       |
| L3     | Vercel down ou DNS cassé, fallback inaccessible aussi      | L2 + redéploy Netlify d'urgence              | 15 min      |
| L4     | Données corrompues côté Supabase                            | Restore Point-in-Time Supabase               | 30–60 min   |

---

## L1 — Rollback applicatif (le plus fréquent)

**Quand** : la bascule `domainStatus: 'live'` a révélé un bug
(redirection cassée, QR pointant mal, OAuth qui échoue, etc.).

**Effet** : les nouveaux QR repointent vers GitHub Pages. Les utilisateurs
qui sont sur `https://app.mindprep.ai` continuent d'y accéder (le DNS
ne change pas), mais l'app affichera le fallback comme URL active dans
les redirections internes.

```bash
# 1) Revenir à l'état "pending"
git checkout main
git pull
sed -i "s/domainStatus: 'live'/domainStatus: 'pending'/" core/site-config.js
node core/qr-system/generate-assets.mjs

# 2) Vérifier le diff
git diff core/site-config.js
git diff --stat assets/qr/

# 3) Commit + push
git add core/site-config.js assets/qr/
git commit -m "fix(deploy): rollback app.mindprep.ai → fallback"
git push origin main
```

**Vérification** :

- Vercel redéploie automatiquement (1–2 min).
- `node -e "import('./core/site-config.js').then(m => console.log(m.SITE_CONFIG.domainStatus))"` → `pending`.
- Les nouveaux scans QR pointent vers `ensupafrique-glitch.github.io`.

---

## L2 — Retirer Vercel du circuit DNS

**Quand** : Vercel répond des erreurs 5xx persistantes, ou le certificat
SSL est cassé.

**Choix** : retirer le record CNAME OU le domaine côté Vercel. Le second
est plus rapide.

### Option A — Côté Vercel (recommandé, 2 min)

1. Vercel → Project → Settings → **Domains**.
2. Cliquer ⋯ à droite de `app.mindprep.ai` → **Remove**.
3. Le domaine arrête d'être servi par Vercel.
4. Côté utilisateur : `https://app.mindprep.ai` répond NXDOMAIN ou
   erreur de certif (selon timing DNS). Le fallback
   `https://ensupafrique-glitch.github.io/mindprep-app/` reste
   atteignable directement.

### Option B — Côté registrar (plus lent, propagation DNS)

1. Aller chez le registrar de `mindprep.ai`.
2. Supprimer le record `CNAME app → cname.vercel-dns.com.`.
3. Propagation : 5 min à plusieurs heures selon TTL.

**Combiner avec L1** pour que les nouveaux QR n'orientent plus vers le
domaine cassé.

---

## L3 — Redéploiement d'urgence Netlify

**Quand** : panne globale Vercel ET nécessité de servir l'app sur un
domaine custom (pas seulement le fallback GitHub Pages).

`netlify.toml` est conservé dans le repo justement pour ce cas.

```bash
# Pré-requis : compte Netlify, CLI installée (npm i -g netlify-cli)
netlify login
netlify init    # ou netlify link si projet déjà créé
netlify deploy --prod --dir .
```

Puis chez le registrar : `CNAME app → <projet>.netlify.app` à la
place de `cname.vercel-dns.com.`.

**Note** : ce scénario suppose que la panne Vercel dure assez pour
justifier l'effort. Pour une panne courte (< 1h), L2 + fallback GitHub
Pages suffit en général.

---

## L4 — Restore Supabase

**Quand** : corruption de données détectée (suppression accidentelle,
migration ratée, attaque). **Ne pas** déclencher pour un simple bug
applicatif.

1. Supabase → Project → **Database** → **Backups**.
2. Identifier le snapshot **antérieur** à l'incident.
3. *Restore Point-in-Time* → choisir le timestamp cible.
4. Pendant la restauration (10–60 min) : afficher une page de
   maintenance côté Vercel (peut-être via un déploiement ad hoc qui
   sert un `index.html` "maintenance").
5. Après restauration : invalider toutes les sessions
   (`auth.admin.signOut()` côté serveur), demander aux utilisateurs de
   se reconnecter.

**Communication obligatoire** : email aux utilisateurs impactés, avec
fenêtre temporelle des données potentiellement perdues.

---

## Critères de déclenchement

| Indicateur                                            | Niveau de rollback |
|-------------------------------------------------------|--------------------|
| `curl https://app.mindprep.ai` → 5xx pendant > 5 min  | L2                 |
| Erreurs JS bloquantes en production (>10% sessions)   | L1                 |
| OAuth Supabase cassé sur le nouveau domaine           | L1 (le temps de fix Supabase config) |
| Webhooks paiement perdus (anciens + nouveaux down)    | L2 + restaurer ancien webhook côté provider |
| SSL invalide                                          | L2 + recréer le domaine côté Vercel |
| Données Supabase corrompues                           | L4                 |
| Vercel + GitHub Pages down simultanément              | L3                 |

---

## Communication d'incident

Modèle court (à adapter, à publier sur réseaux sociaux + page status si
existante) :

> **Incident MindPrep — [date / heure]**
>
> Nous avons identifié un problème d'accès à `https://app.mindprep.ai`.
> L'application reste accessible via
> `https://ensupafrique-glitch.github.io/mindprep-app/` le temps de
> rétablir le service. Vos données et vos comptes ne sont pas affectés.
> Mise à jour dans 30 minutes.

Après résolution :

> **Incident résolu — [date / heure]**
>
> `https://app.mindprep.ai` est de nouveau accessible. Cause : [brève
> description]. Aucune perte de données. Merci pour votre patience.

---

## Post-mortem

À rédiger dans les 48h après tout rollback. Modèle :

1. **Timeline** (en UTC) — ce qui s'est passé, minute par minute.
2. **Cause racine** — *pourquoi* ça a cassé, pas seulement *quoi*.
3. **Détection** — comment on s'en est aperçu, combien de temps après.
4. **Mitigation** — quelles actions ont fonctionné, lesquelles non.
5. **Impact** — utilisateurs touchés, données affectées, paiements
   perdus / dupliqués.
6. **Actions correctives** — bugs à fixer, monitoring à ajouter,
   process à modifier. Avec owner + deadline.

Stocker dans `docs/postmortems/YYYY-MM-DD-<slug>.md`.
