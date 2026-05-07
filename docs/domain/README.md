# Custom domain — `CNAME` (modèle / exemple)

> ⛔ **Ne pas committer de fichier `CNAME` à la racine du repo tant que
> le DNS de `app.mindprep.ai` n'est pas configuré et la bascule
> finale approuvée.**
>
> Cette mise en garde existe parce qu'un fichier `CNAME` à la racine
> active automatiquement le *Custom domain* de GitHub Pages dès qu'il
> est mergé sur `main`. Si le DNS n'est pas prêt, GitHub Pages peut
> alors considérer l'ancienne URL `*.github.io` comme remplacée et
> la rendre injoignable — coupure de service.

## Contexte (mai 2026)

- PR #23 a, à un moment, ajouté un fichier `CNAME` contenant
  `app.mindprep.ai` à la racine.
- Le custom domain a été poussé automatiquement par GitHub Pages.
- Le DNS de `app.mindprep.ai` **n'était pas encore configuré** chez
  le registrar.
- Risque identifié : l'URL fallback
  `https://ensupafrique-glitch.github.io/mindprep-app/` aurait pu
  devenir injoignable (les QR papier déjà imprimés en dépendent).
- Le custom domain a été retiré manuellement via l'API GitHub, et le
  fichier `CNAME` a été supprimé de `main` (commit `9440f74`).
- La PR de cette safety-fix ajoute le présent dossier pour empêcher
  toute réintroduction accidentelle.

## Quand (et seulement quand) écrire un fichier `CNAME` à la racine

Toutes les conditions suivantes doivent être remplies :

1. Le record DNS `CNAME app → ensupafrique-glitch.github.io` est
   créé chez le registrar de `mindprep.ai` et propagé
   (`dig +short app.mindprep.ai` retourne bien la cible GitHub Pages).
2. GitHub → Settings → Pages → *Custom domain* est saisi à la main
   par un humain qui valide la bascule.
3. *DNS check successful* est affiché (vert) côté GitHub Pages.
4. La bascule finale est explicitement approuvée
   (cf. [`../18-checklist-finale-bascule.md`](../18-checklist-finale-bascule.md)).

À ce moment-là :

- **Soit** GitHub Pages écrit lui-même le fichier `CNAME` à la racine
  (en cliquant *Save* dans Settings → Pages). C'est la voie
  recommandée : aucun PR ne touche le repo, on évite tout effet de
  bord pendant la propagation DNS.
- **Soit** on copie ce modèle :

  ```bash
  cp docs/domain/CNAME.example CNAME
  git add CNAME
  git commit -m "feat(domain): activate custom domain app.mindprep.ai (DNS ready)"
  ```

## Tant que le DNS n'est pas prêt

- Ne pas committer un fichier `CNAME` à la racine.
- Garder
  `https://ensupafrique-glitch.github.io/mindprep-app/` comme
  fallback actif (URL servie par GitHub Pages).
- Garder
  `core/site-config.js` → `domainStatus: 'pending'` et
  `fallbackUrl` pointant vers le sous-domaine `*.github.io`.
- Les QR papier déjà imprimés continuent de fonctionner via le
  fallback.

## Voir aussi

- [`../17-github-pages-deblocage.md`](../17-github-pages-deblocage.md) — procédure de bascule GitHub Pages.
- [`../15-securite-migration.md`](../15-securite-migration.md) — protocole de sécurité.
- [`../16-rollback-plan.md`](../16-rollback-plan.md) — plan de rollback.
- [`../18-checklist-finale-bascule.md`](../18-checklist-finale-bascule.md) — checklist de bascule finale.
- [`../../DOMAIN_STATUS.md`](../../DOMAIN_STATUS.md) — statut courant du domaine.
