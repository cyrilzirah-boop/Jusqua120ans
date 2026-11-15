# jusqua120ans — version autonome

Site perso, sans Claude : hébergé gratuitement sur GitHub Pages, données dans un projet Supabase gratuit à votre nom.

## Fichiers
- `index.html` : le site complet
- `adapter.js` : branche le site sur Supabase (comptes, base partagée, jeux en direct)
- `ui.js` : connexion par lien e-mail, invitations par e-mail
- `config.js` : adresse et clé publique de votre projet Supabase
- `schema.sql` : tables et règles de sécurité à exécuter une fois dans Supabase
- `icon.png` : icône

## Mise en place
1. Supabase (compte perso) : organisation « jusqua120ans », plan Free, puis un projet.
2. SQL Editor : coller `schema.sql`, exécuter.
3. Project Settings › API : copier l'URL et la clé « publishable » dans `config.js`.
4. GitHub : dépôt `jusqua120ans`, déposer tous les fichiers, Settings › Pages › branche `main`, dossier `/`.
5. Supabase › Authentication › URL Configuration : Site URL et Redirect URLs = l'adresse GitHub Pages (ex. https://cyrilzi.github.io/jusqua120ans/).
6. Conseillé : Authentication › SMTP, brancher un envoi d'e-mails gratuit (Brevo, 300/jour), car l'envoi intégré de Supabase est limité à quelques e-mails par heure.

Pour publier une actu ou modérer le cercle, ajouter son identifiant dans la table `admins`.

Absent de cette version : le génie (fiches depuis photos, coach, estimations de trajet, lecture des captures de montre).
