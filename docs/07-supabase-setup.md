# Configuration Supabase

## 1. Creer le projet

Creer un projet sur Supabase, puis recuperer:

- Project URL.
- Anon public key.

Ces valeurs se trouvent dans:

`Project Settings > API`

## 2. Configurer le frontend

Modifier `supabase-config.js`:

```js
window.MINDPREP_SUPABASE = {
  url: "https://votre-projet.supabase.co",
  anonKey: "votre-cle-anon",
};
```

La cle anon Supabase est prevue pour etre exposee cote navigateur. Les regles
de securite doivent etre gerees avec les policies Supabase.

## 3. Activer Email Auth

Dans Supabase:

`Authentication > Providers > Email`

Activer:

- Email provider.
- Confirm email selon le comportement souhaite.

Si la confirmation email est activee, l'utilisateur devra valider son email
avant de pouvoir se connecter.

## 4. Activer Google Auth

Dans Supabase:

`Authentication > Providers > Google`

Ajouter les identifiants OAuth Google, puis configurer les redirect URLs.

Pour Google OAuth, il est preferable de servir l'app avec une URL HTTP locale
ou un domaine deploye. Exemple de redirect URL en developpement:

`http://localhost:3000/`

Pour la production, ajouter le domaine final de l'application dans Supabase.

## 5. Donnees utilisateur

MindPrep stocke dans `user_metadata`:

- `name`
- `level`

Ces donnees sont envoyees au moment de l'inscription.
